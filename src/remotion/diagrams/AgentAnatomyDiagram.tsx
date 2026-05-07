import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const CX = 540, CY = 330, R_BRAIN = 90;
const BOX_W = 160, BOX_H = 80;

const COMPONENTS = [
  { id: "PLANNING",    x: CX - BOX_W / 2,       y: CY - R_BRAIN - BOX_H - 50, color: T.cyan,   iconType: "router" as const },
  { id: "TOOLS",       x: CX + R_BRAIN + 50,    y: CY - BOX_H / 2,             color: T.amber,  iconType: "switch" as const },
  { id: "MEMORY",      x: CX - BOX_W / 2,       y: CY + R_BRAIN + 50,          color: T.mint,   iconType: "server" as const },
  { id: "INPUT/OUTPUT",x: CX - R_BRAIN - BOX_W - 50, y: CY - BOX_H / 2,        color: T.violet, iconType: "browser" as const },
];

export const AgentAnatomyDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const brainIn      = p(frame, duration, 0.00, 0.20);
  const planIn       = p(frame, duration, 0.20, 0.33);
  const toolsIn      = p(frame, duration, 0.30, 0.43);
  const memIn        = p(frame, duration, 0.40, 0.53);
  const ioIn         = p(frame, duration, 0.50, 0.63);
  const flowP        = p(frame, duration, 0.55, 0.80);
  const labelIn      = p(frame, duration, 0.80, 1.00);

  const hiLLM      = hi("LLM");
  const hiPlanning = hi("PLANNING");
  const hiTools    = hi("TOOLS");
  const hiMemory   = hi("MEMORY");

  const compProgress = [planIn, toolsIn, memIn, ioIn];

  // Pulsing flow dot positions
  const flowDot = (fromX: number, fromY: number, toX: number, toY: number, progress: number) => ({
    x: fromX + (toX - fromX) * progress,
    y: fromY + (toY - fromY) * progress,
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ag-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ag-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── LLM Brain ── */}
      <g opacity={brainIn}>
        <circle cx={CX} cy={CY} r={R_BRAIN}
          fill={T.nodeFill}
          stroke={hiLLM ? T.violet : T.nodeBorder}
          strokeWidth={hiLLM ? 3 : 2}
          filter={hiLLM ? "url(#ag-glow)" : undefined}
        />
        <circle cx={CX} cy={CY} r={R_BRAIN - 8}
          fill="none"
          stroke={T.violet} strokeWidth="1.5" opacity={0.4}
          strokeDasharray="6 4"
        />
        <text x={CX} y={CY + 6} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="26" fontWeight="800" letterSpacing="1">
          LLM
        </text>
        <text x={CX} y={CY + 26} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="2">
          BRAIN
        </text>
      </g>

      {/* ── Four boxes ── */}
      {COMPONENTS.map((comp, i) => {
        const prog = compProgress[i];
        if (prog <= 0) return null;
        const hiComp = hi(comp.id);
        // Connection line from box center to LLM edge
        const bx = comp.x + BOX_W / 2;
        const by = comp.y + BOX_H / 2;
        const dx = bx - CX, dy = by - CY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const lx1 = CX + dx / dist * R_BRAIN;
        const ly1 = CY + dy / dist * R_BRAIN;
        const lx2 = bx - dx / dist * (BOX_W / 4);
        const ly2 = by - dy / dist * (BOX_H / 4);
        return (
          <g key={comp.id} opacity={prog}>
            {/* Connection line */}
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={comp.color} strokeWidth="2" opacity={0.5} strokeDasharray="5 3"
            />
            {/* Box */}
            <rect x={comp.x} y={comp.y} width={BOX_W} height={BOX_H} rx="14"
              fill={comp.color} fillOpacity={hiComp ? 0.22 : 0.12}
              stroke={comp.color} strokeWidth={hiComp ? 2.5 : 1.5}
              filter={hiComp ? "url(#ag-glow-sm)" : undefined}
            />
            <text x={comp.x + BOX_W / 2} y={comp.y + BOX_H / 2 - 6} textAnchor="middle"
              fill={comp.color} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1.5">
              {comp.id}
            </text>
            <g transform={`translate(${comp.x + BOX_W / 2 - 10}, ${comp.y + BOX_H / 2 + 2})`}>
              <NodeIcon type={comp.iconType} size={20} color={comp.color} />
            </g>
          </g>
        );
      })}

      {/* ── Animated flow pulse ── */}
      {flowP > 0 && (
        <g>
          {/* Input → LLM */}
          {(() => {
            const io = COMPONENTS[3];
            const startX = io.x + BOX_W;
            const startY = io.y + BOX_H / 2;
            const phase = Math.min(flowP * 3, 1);
            const dot = flowDot(startX, startY, CX - R_BRAIN, CY, phase);
            return (
              <circle cx={dot.x} cy={dot.y} r={8} fill={T.violet}
                opacity={phase < 1 ? 0.9 : 0}
                filter="url(#ag-glow-sm)"
              />
            );
          })()}
          {/* LLM → Tools */}
          {flowP > 0.4 && (() => {
            const tools = COMPONENTS[1];
            const endX = tools.x;
            const endY = tools.y + BOX_H / 2;
            const phase = Math.min((flowP - 0.4) * 2.5, 1);
            const dot = flowDot(CX + R_BRAIN, CY, endX, endY, phase);
            return (
              <circle cx={dot.x} cy={dot.y} r={8} fill={T.amber}
                opacity={phase < 1 ? 0.9 : 0}
                filter="url(#ag-glow-sm)"
              />
            );
          })()}
          {/* Result → Memory */}
          {flowP > 0.65 && (() => {
            const mem = COMPONENTS[2];
            const endX = mem.x + BOX_W / 2;
            const endY = mem.y;
            const phase = Math.min((flowP - 0.65) * 3, 1);
            const dot = flowDot(CX, CY + R_BRAIN, endX, endY, phase);
            return (
              <circle cx={dot.x} cy={dot.y} r={8} fill={T.mint}
                opacity={phase < 1 ? 0.9 : 0}
                filter="url(#ag-glow-sm)"
              />
            );
          })()}
        </g>
      )}

      {/* ── Bottom label ── */}
      {labelIn > 0 && (
        <g opacity={labelIn}>
          <rect x={W / 2 - 360} y={636} width={720} height={44} rx="22"
            fill={T.violet} fillOpacity={0.10}
            stroke={T.violet} strokeWidth="1.5"
          />
          <text x={W / 2} y={664} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            AGENT = LLM + TOOLS + MEMORY + PLANNING
          </text>
        </g>
      )}
    </svg>
  );
};
