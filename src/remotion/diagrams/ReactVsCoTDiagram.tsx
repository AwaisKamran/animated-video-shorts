import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// Panel layout
const LEFT_X = 55, RIGHT_X = 570;
const PANEL_W = 460, PANEL_H = 520, PANEL_Y = 80;

// CoT chain — 5 thought nodes stacked vertically
const COT_NODE_W = 300, COT_NODE_H = 56;
const COT_X = LEFT_X + (PANEL_W - COT_NODE_W) / 2;
const COT_NODES = [
  { label: "THOUGHT 1", sub: "understand the question" },
  { label: "THOUGHT 2", sub: "consider options" },
  { label: "THOUGHT 3", sub: "reason step-by-step" },
  { label: "THOUGHT 4", sub: "check the logic" },
  { label: "ANSWER",    sub: "final response" },
];
const COT_START_Y = PANEL_Y + 68;
const COT_GAP = 74;

// ReAct sequence — alternating T/A/O
const REACT_ITEMS = [
  { label: "THOUGHT",     color: T.violet, sub: "plan tool call" },
  { label: "ACTION",      color: T.amber,  sub: "call search_web" },
  { label: "OBSERVATION", color: T.mint,   sub: "got result" },
  { label: "THOUGHT",     color: T.violet, sub: "analyze result" },
  { label: "ACTION",      color: T.amber,  sub: "call format" },
];
const REACT_NODE_W = 260, REACT_NODE_H = 48;
const REACT_X = RIGHT_X + (PANEL_W - REACT_NODE_W) / 2;
const REACT_START_Y = PANEL_Y + 68;
const REACT_GAP = 70;

export const ReactVsCoTDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelsIn = p(frame, duration, 0.00, 0.14);

  // CoT nodes stagger
  const cotNodes = COT_NODES.map((_, i) =>
    p(frame, duration, 0.14 + i * 0.08, 0.22 + i * 0.08)
  );

  // ReAct nodes stagger (running in parallel with CoT)
  const reactNodes = REACT_ITEMS.map((_, i) =>
    p(frame, duration, 0.16 + i * 0.08, 0.24 + i * 0.08)
  );

  const envIn    = p(frame, duration, 0.72, 0.86);
  const labelsIn = p(frame, duration, 0.86, 1.00);

  const hiCoT    = hi("COT");
  const hiReAct  = hi("REACT");
  const hiAction = hi("ACTION");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rvc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rvc-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="rvc-arr-cot" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="rvc-arr-react" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
      </defs>

      {/* Panel backgrounds */}
      <g opacity={panelsIn}>
        {/* CoT panel */}
        <rect x={LEFT_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
          fill={T.cyan} fillOpacity={hiCoT ? 0.12 : 0.06}
          stroke={T.cyan} strokeWidth={hiCoT ? 2.5 : 1.5}
          filter={hiCoT ? "url(#rvc-glow)" : undefined}
        />
        <text x={LEFT_X + PANEL_W / 2} y={PANEL_Y + 38} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="17" fontWeight="800" letterSpacing="2">
          Chain of Thought
        </text>
        <text x={LEFT_X + PANEL_W / 2} y={PANEL_Y + 56} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="10" opacity="0.5">
          linear reasoning — no environment
        </text>

        {/* ReAct panel */}
        <rect x={RIGHT_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
          fill={T.violet} fillOpacity={hiReAct ? 0.12 : 0.06}
          stroke={T.violet} strokeWidth={hiReAct ? 2.5 : 1.5}
          filter={hiReAct ? "url(#rvc-glow)" : undefined}
        />
        <text x={RIGHT_X + PANEL_W / 2} y={PANEL_Y + 38} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="17" fontWeight="800" letterSpacing="2">
          ReAct
        </text>
        <text x={RIGHT_X + PANEL_W / 2} y={PANEL_Y + 56} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="10" opacity="0.5">
          reason + act — interacts with environment
        </text>

        {/* Divider */}
        <line x1={W / 2} y1={PANEL_Y + 16} x2={W / 2} y2={PANEL_Y + PANEL_H - 16}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4"
        />
      </g>

      {/* CoT nodes */}
      {COT_NODES.map((node, i) => {
        const np = cotNodes[i];
        if (np <= 0) return null;
        const ny = COT_START_Y + i * COT_GAP;
        const isAnswer = node.label === "ANSWER";
        const nodeColor = isAnswer ? T.mint : T.cyan;
        return (
          <g key={`cot-${i}`} opacity={np}>
            {/* Connector line above */}
            {i > 0 && (
              <line x1={COT_X + COT_NODE_W / 2} y1={ny - COT_GAP + COT_NODE_H}
                x2={COT_X + COT_NODE_W / 2} y2={ny}
                stroke={T.cyan} strokeWidth="2" opacity="0.45"
                markerEnd="url(#rvc-arr-cot)"
              />
            )}
            <rect x={COT_X} y={ny} width={COT_NODE_W} height={COT_NODE_H} rx="10"
              fill={nodeColor} fillOpacity={isAnswer ? 0.25 : 0.13}
              stroke={nodeColor} strokeWidth={isAnswer ? 2.5 : 1.5}
              filter={isAnswer ? "url(#rvc-glow-sm)" : undefined}
            />
            <text x={COT_X + COT_NODE_W / 2} y={ny + 24} textAnchor="middle"
              fill={nodeColor} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
              {node.label}
            </text>
            <text x={COT_X + COT_NODE_W / 2} y={ny + 42} textAnchor="middle"
              fill={nodeColor} fontFamily={T.mono} fontSize="9" opacity="0.6">
              {node.sub}
            </text>
          </g>
        );
      })}

      {/* ReAct nodes */}
      {REACT_ITEMS.map((item, i) => {
        const np = reactNodes[i];
        if (np <= 0) return null;
        const ny = REACT_START_Y + i * REACT_GAP;
        const isHiAction = hiAction && item.label === "ACTION";
        return (
          <g key={`react-${i}`} opacity={np}>
            {/* Connector */}
            {i > 0 && (
              <line x1={REACT_X + REACT_NODE_W / 2} y1={ny - REACT_GAP + REACT_NODE_H}
                x2={REACT_X + REACT_NODE_W / 2} y2={ny}
                stroke={item.color} strokeWidth="1.5" opacity="0.4"
                markerEnd="url(#rvc-arr-react)"
              />
            )}
            <rect x={REACT_X} y={ny} width={REACT_NODE_W} height={REACT_NODE_H} rx="10"
              fill={item.color} fillOpacity={isHiAction ? 0.28 : 0.14}
              stroke={item.color} strokeWidth={isHiAction ? 2.5 : 1.5}
              filter={isHiAction ? "url(#rvc-glow-sm)" : undefined}
            />
            <text x={REACT_X + REACT_NODE_W / 2} y={ny + 22} textAnchor="middle"
              fill={item.color} fontFamily={T.sans} fontSize="12" fontWeight="800" letterSpacing="1">
              {item.label}
            </text>
            <text x={REACT_X + REACT_NODE_W / 2} y={ny + 38} textAnchor="middle"
              fill={item.color} fontFamily={T.mono} fontSize="9" opacity="0.6">
              {item.sub}
            </text>
          </g>
        );
      })}

      {/* Environment loop on ReAct side */}
      {envIn > 0 && (
        <g opacity={envIn}>
          {/* Environment box on right */}
          <rect x={RIGHT_X + PANEL_W + 14} y={PANEL_Y + 120} width={100} height={280} rx="12"
            fill={T.mint} fillOpacity={0.1} stroke={T.mint} strokeWidth="1.5" strokeDasharray="6 4"
          />
          <text x={RIGHT_X + PANEL_W + 64} y={PANEL_Y + 270} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1.5"
            transform={`rotate(-90, ${RIGHT_X + PANEL_W + 64}, ${PANEL_Y + 270})`}
            opacity="0.75">
            ENVIRONMENT
          </text>
          {/* Action arrows going out */}
          {[1, 3].map(idx => {
            const ny = REACT_START_Y + idx * REACT_GAP + REACT_NODE_H / 2;
            return (
              <g key={`env-${idx}`}>
                <line x1={REACT_X + REACT_NODE_W} y1={ny}
                  x2={RIGHT_X + PANEL_W + 14} y2={ny}
                  stroke={T.amber} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.55"
                />
              </g>
            );
          })}
          {/* Observation arrows returning */}
          {[2, 4].map(idx => {
            const ny = REACT_START_Y + idx * REACT_GAP + REACT_NODE_H / 2;
            return (
              <g key={`obs-${idx}`}>
                <line x1={RIGHT_X + PANEL_W + 14} y1={ny}
                  x2={REACT_X + REACT_NODE_W} y2={ny}
                  stroke={T.mint} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.55"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Bottom labels */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          <text x={LEFT_X + PANEL_W / 2} y={PANEL_Y + PANEL_H + 36} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2.5">
            COT: REASONING ONLY
          </text>
          <text x={RIGHT_X + PANEL_W / 2} y={PANEL_Y + PANEL_H + 36} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2.5">
            ReAct: REASONING + ACTING
          </text>
          {/* Key difference callout */}
          <rect x={W / 2 - 280} y={PANEL_Y + PANEL_H + 50} width={560} height={34} rx="17"
            fill={T.amber} fillOpacity={0.12} stroke={T.amber} strokeWidth="1.5"
          />
          <text x={W / 2} y={PANEL_Y + PANEL_H + 72} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            KEY: ReAct can interact with external environment
          </text>
        </g>
      )}
    </svg>
  );
};
