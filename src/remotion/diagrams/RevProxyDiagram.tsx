import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const CLOUD_X = 120, LB_X = 480, LB_Y = 330, NR = 66;
const SERVERS = [
  { id: "A", y: 180, label: "Server A" },
  { id: "B", y: 330, label: "Server B" },
  { id: "C", y: 480, label: "Server C" },
];
const SRV_X = 860, SR = 55;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const RevProxyDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn = p(frame, duration, 0.00, 0.20);
  const req1P   = p(frame, duration, 0.20, 0.40);
  const dist1P  = p(frame, duration, 0.40, 0.60);
  const req2P   = p(frame, duration, 0.60, 0.77);
  const dist2P  = p(frame, duration, 0.77, 0.90);
  const req3P   = p(frame, duration, 0.90, 0.96);
  const dist3P  = p(frame, duration, 0.96, 1.00);

  const lbColor   = hi("LOAD BALANCER") ? T.cyan : T.cyan;
  const revColor  = hi("REVERSE PROXY") ? T.violet : T.violet;

  // Which server gets the request (round-robin: A, B, C)
  const activeServer = dist1P > 0 ? 0 : dist2P > 0 ? 1 : dist3P > 0 ? 2 : -1;
  // Request counts
  const countA = dist1P > 0.8 ? 1 : 0;
  const countB = dist2P > 0.8 ? 1 : 0;
  const countC = dist3P > 0.8 ? 1 : 0;
  const counts = [countA, countB, countC];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="lb-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lb-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Cloud → LB line */}
      <line x1={CLOUD_X + 70} y1={LB_Y} x2={LB_X - NR} y2={LB_Y}
        stroke={req1P > 0 || req2P > 0 || req3P > 0 ? lbColor : T.border}
        strokeWidth="2" opacity={nodesIn} />

      {/* LB → servers lines */}
      {SERVERS.map((s, i) => (
        <line key={s.id}
          x1={LB_X + NR} y1={LB_Y} x2={SRV_X - SR} y2={s.y}
          stroke={activeServer === i ? lbColor : T.border}
          strokeWidth={activeServer === i ? "2.5" : "1.5"}
          opacity={nodesIn}
        />
      ))}

      {/* Dashed "SAME ORIGIN" line between servers */}
      <g opacity={nodesIn * 0.6}>
        <line x1={SRV_X + SR + 10} y1={SERVERS[0].y} x2={SRV_X + SR + 10} y2={SERVERS[2].y}
          stroke={T.textSecondary} strokeWidth="1" strokeDasharray="5 3" />
        <text x={SRV_X + SR + 22} y={(SERVERS[0].y + SERVERS[2].y) / 2 + 5} textAnchor="start"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="12" letterSpacing="1">SAME ORIGIN</text>
      </g>

      {/* Internet cloud */}
      <g opacity={nodesIn}>
        <ellipse cx={CLOUD_X} cy={LB_Y} rx={72} ry={52}
          fill={T.bgDeep} stroke={T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${CLOUD_X - 18}, ${LB_Y - 18})`}>
          <NodeIcon type="cloud" size={36} color={T.textSecondary} />
        </g>
        <text x={CLOUD_X} y={LB_Y + 52 + 22} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="15" letterSpacing="1.5">INTERNET</text>
      </g>

      {/* Load Balancer / Reverse Proxy */}
      <g opacity={nodesIn}>
        <circle cx={LB_X} cy={LB_Y} r={NR} fill={T.nodeFill}
          stroke={lbColor} strokeWidth="2.5"
          filter="url(#lb-glow)"
        />
        <g transform={`translate(${LB_X - 18}, ${LB_Y - 20})`}>
          <NodeIcon type="loadbalancer" size={36} color={lbColor} />
        </g>
        <text x={LB_X} y={LB_Y + NR + 24} textAnchor="middle"
          fill={lbColor} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">REVERSE PROXY</text>
        <text x={LB_X} y={LB_Y + NR + 42} textAnchor="middle"
          fill={revColor} fontFamily={T.sans} fontSize="13" letterSpacing="1">LOAD BALANCER</text>
      </g>

      {/* Backend servers */}
      {SERVERS.map((s, i) => (
        <g key={s.id} opacity={nodesIn}>
          <circle cx={SRV_X} cy={s.y} r={SR} fill={T.nodeFill}
            stroke={activeServer === i ? lbColor : T.nodeBorder}
            strokeWidth={activeServer === i ? "2.5" : "1.5"}
            filter={activeServer === i ? "url(#lb-glow)" : undefined}
          />
          <g transform={`translate(${SRV_X - 15}, ${s.y - 16})`}>
            <NodeIcon type="server" size={30} color={T.textSecondary} />
          </g>
          <text x={SRV_X} y={s.y + SR + 22} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="15" fontWeight="500">{s.label}</text>
          {/* Health dot */}
          <circle cx={SRV_X + SR - 8} cy={s.y - SR + 8} r="6"
            fill={T.mint} />
          {/* Request count badge */}
          {counts[i] > 0 && (
            <g>
              <circle cx={SRV_X - SR + 8} cy={s.y - SR + 8} r="13"
                fill={lbColor} />
              <text x={SRV_X - SR + 8} y={s.y - SR + 13} textAnchor="middle"
                fill={T.bgDeep} fontFamily={T.mono} fontSize="12" fontWeight="700">
                {counts[i]}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Packets: internet → LB */}
      {req1P > 0 && req1P < 1 && (
        <circle cx={(CLOUD_X + 70) + (LB_X - NR - CLOUD_X - 70) * req1P} cy={LB_Y}
          r="8" fill={lbColor} filter="url(#lb-glow-sm)" />
      )}
      {req2P > 0 && req2P < 1 && (
        <circle cx={(CLOUD_X + 70) + (LB_X - NR - CLOUD_X - 70) * req2P} cy={LB_Y}
          r="8" fill={lbColor} filter="url(#lb-glow-sm)" />
      )}
      {req3P > 0 && req3P < 1 && (
        <circle cx={(CLOUD_X + 70) + (LB_X - NR - CLOUD_X - 70) * req3P} cy={LB_Y}
          r="8" fill={lbColor} filter="url(#lb-glow-sm)" />
      )}

      {/* Packets: LB → servers (round-robin) */}
      {dist1P > 0 && dist1P < 1 && (() => {
        const s = SERVERS[0];
        const fx = (LB_X + NR) + (SRV_X - SR - LB_X - NR) * dist1P;
        const fy = LB_Y + (s.y - LB_Y) * dist1P;
        return <circle cx={fx} cy={fy} r="8" fill={T.mint} filter="url(#lb-glow-sm)" />;
      })()}
      {dist2P > 0 && dist2P < 1 && (() => {
        const s = SERVERS[1];
        const fx = (LB_X + NR) + (SRV_X - SR - LB_X - NR) * dist2P;
        const fy = LB_Y + (s.y - LB_Y) * dist2P;
        return <circle cx={fx} cy={fy} r="8" fill={T.mint} filter="url(#lb-glow-sm)" />;
      })()}
      {dist3P > 0 && dist3P < 1 && (() => {
        const s = SERVERS[2];
        const fx = (LB_X + NR) + (SRV_X - SR - LB_X - NR) * dist3P;
        const fy = LB_Y + (s.y - LB_Y) * dist3P;
        return <circle cx={fx} cy={fy} r="8" fill={T.mint} filter="url(#lb-glow-sm)" />;
      })()}

      {/* Single-address label */}
      <g opacity={nodesIn * 0.9}>
        <text x={CLOUD_X} y={LB_Y - 52 - 18} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="13">
          api.example.com
        </text>
        <text x={CLOUD_X} y={LB_Y - 52 - 36} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="12" letterSpacing="1">
          ONE ADDRESS
        </text>
      </g>
    </svg>
  );
};
