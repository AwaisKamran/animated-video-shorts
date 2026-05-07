import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const CX = 540, CY = 330, SR = 68;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const CLIENTS = [
  { id: "A", x: 220, y: 160, label: "DEVICE A", port: 1, mac: "AA:BB" },
  { id: "B", x: 860, y: 160, label: "DEVICE B", port: 2, mac: "CC:DD" },
  { id: "C", x: 220, y: 500, label: "DEVICE C", port: 3, mac: "EE:FF" },
  { id: "D", x: 860, y: 500, label: "DEVICE D", port: 4, mac: "11:22" },
];

const CR = 52;

function clientEdge(client: typeof CLIENTS[0]): { ex: number; ey: number } {
  const dx = CX - client.x, dy = CY - client.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return { ex: client.x + (dx / dist) * CR, ey: client.y + (dy / dist) * CR };
}

function switchEdge(client: typeof CLIENTS[0]): { sx: number; sy: number } {
  const dx = client.x - CX, dy = client.y - CY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return { sx: CX + (dx / dist) * SR, sy: CY + (dy / dist) * SR };
}

export const SwitchDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn    = p(frame, duration, 0.00, 0.18);
  const switchGlow = p(frame, duration, 0.18, 0.32);
  const frameToSw  = p(frame, duration, 0.33, 0.60);
  const tableIn    = p(frame, duration, 0.60, 0.73);
  const frameToB   = p(frame, duration, 0.74, 0.98);
  const doneAlpha  = p(frame, duration, 0.98, 1.00);

  const switchColor = hi("SWITCH") ? T.cyan : T.cyan;
  const macColor    = hi("MAC")    ? T.amber : T.amber;

  const srcClient = CLIENTS[0];
  const dstClient = CLIENTS[1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sw-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sw-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Connection lines */}
      {CLIENTS.map((c) => {
        const { ex, ey } = clientEdge(c);
        const { sx, sy } = switchEdge(c);
        const isActive = (frameToB > 0 && c.id === "B") || (frameToSw > 0 && c.id === "A" && frameToSw < 1);
        return (
          <line key={c.id}
            x1={ex} y1={ey} x2={sx} y2={sy}
            stroke={isActive ? switchColor : T.border}
            strokeWidth={isActive ? "2.5" : "1.5"}
            opacity={nodesIn}
          />
        );
      })}

      {/* Switch box */}
      <g opacity={nodesIn}>
        <rect
          x={CX - SR} y={CY - SR * 0.7} width={SR * 2} height={SR * 1.4} rx="12"
          fill={T.bgDeep}
          stroke={switchGlow > 0 ? switchColor : T.nodeBorder}
          strokeWidth={switchGlow > 0.5 ? "2.5" : "1.5"}
          filter={switchGlow > 0.3 ? "url(#sw-glow)" : undefined}
        />
        <g transform={`translate(${CX - 18}, ${CY - 20})`}>
          <NodeIcon type="switch" size={36} color={switchGlow > 0.3 ? switchColor : T.textSecondary} />
        </g>
        <text x={CX} y={CY + SR * 0.7 + 26} textAnchor="middle"
          fill={switchGlow > 0.5 ? switchColor : T.textSecondary}
          fontFamily={T.sans} fontSize="18" fontWeight="700" letterSpacing="2">SWITCH</text>
      </g>

      {/* Client nodes */}
      {CLIENTS.map((c) => (
        <g key={c.id} opacity={nodesIn}>
          <circle cx={c.x} cy={c.y} r={CR}
            fill={T.nodeFill}
            stroke={c.id === "B" && frameToB > 0.5 ? T.mint : T.nodeBorder}
            strokeWidth="1.5" />
          <g transform={`translate(${c.x - 18}, ${c.y - 18})`}>
            <NodeIcon type="laptop" size={36} color={T.textSecondary} />
          </g>
          <text x={c.x} y={c.y + CR + 26} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="500" letterSpacing="1.5">
            {c.label}
          </text>
        </g>
      ))}

      {/* Frame traveling A → Switch */}
      {frameToSw > 0 && frameToSw < 1 && (() => {
        const { ex, ey } = clientEdge(srcClient);
        const { sx, sy } = switchEdge(srcClient);
        const fx = ex + (sx - ex) * frameToSw;
        const fy = ey + (sy - ey) * frameToSw;
        return <circle cx={fx} cy={fy} r={9} fill={T.cyan} filter="url(#sw-glow-sm)" />;
      })()}

      {/* MAC table */}
      {tableIn > 0 && (
        <g opacity={tableIn}>
          <rect x={CX + SR + 12} y={CY - 70} width={220} height={140} rx="10"
            fill={T.bgDeep} stroke={macColor} strokeWidth="1.5" strokeOpacity="0.6" />
          <text x={CX + SR + 22} y={CY - 48} fill={macColor}
            fontFamily={T.mono} fontSize="13" fontWeight="700" letterSpacing="1">MAC TABLE</text>
          <line x1={CX + SR + 12} y1={CY - 38} x2={CX + SR + 232} y2={CY - 38}
            stroke={macColor} strokeWidth="1" strokeOpacity="0.4" />
          {CLIENTS.map((c, i) => (
            <text key={c.id} x={CX + SR + 22} y={CY - 16 + i * 26}
              fill={c.id === "A" ? macColor : T.textDim}
              fontFamily={T.mono} fontSize="13">
              PORT {c.port} → {c.mac}
            </text>
          ))}
        </g>
      )}

      {/* Frame traveling Switch → B */}
      {frameToB > 0 && frameToB < 1 && (() => {
        const { sx, sy } = switchEdge(dstClient);
        const { ex, ey } = clientEdge(dstClient);
        const fx = sx + (ex - sx) * frameToB;
        const fy = sy + (ey - sy) * frameToB;
        return <circle cx={fx} cy={fy} r={9} fill={T.mint} filter="url(#sw-glow-sm)" />;
      })()}

      {/* Done label */}
      {doneAlpha > 0 && (
        <g opacity={doneAlpha}>
          <rect x={CX - 200} y={600} width={400} height={44} rx="22"
            fill={T.mint} opacity="0.12" />
          <text x={CX} y={628} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="20" fontWeight="700" letterSpacing="1">
            UNICAST · NOT BROADCAST
          </text>
        </g>
      )}
    </svg>
  );
};
