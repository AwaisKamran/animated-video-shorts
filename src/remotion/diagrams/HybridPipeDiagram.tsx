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

const NODE_Y = 310;
const NODE_H = 100;
const ARROW_Y = NODE_Y + NODE_H / 2;

const NODES = [
  { id: "validate", label: "Validate", sublabel: "fixed step", x: 60,  w: 170, type: "workflow" },
  { id: "fetch",    label: "Fetch",    sublabel: "fixed step", x: 290, w: 170, type: "workflow" },
  { id: "agent",    label: "AGENT",    sublabel: "LLM decides", x: 490, w: 220, type: "agent"    },
  { id: "format",   label: "Format",   sublabel: "fixed step", x: 770, w: 170, type: "workflow" },
  { id: "output",   label: "Output",   sublabel: "result",     x: 990, w: 30,  type: "output"   },
];

const ARROW_GAPS = [
  { x1: 60 + 170, x2: 290 },
  { x1: 290 + 170, x2: 490 },
  { x1: 490 + 220, x2: 770 },
  { x1: 770 + 170, x2: 990 },
];

export const HybridPipeDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const titleIn   = p(frame, duration, 0.00, 0.10);
  const node0In   = p(frame, duration, 0.10, 0.24);
  const node1In   = p(frame, duration, 0.24, 0.38);
  const node2In   = p(frame, duration, 0.38, 0.58);
  const node3In   = p(frame, duration, 0.58, 0.72);
  const node4In   = p(frame, duration, 0.72, 0.84);
  const labelIn   = p(frame, duration, 0.84, 1.00);

  const nodeProgress = [node0In, node1In, node2In, node3In, node4In];

  const hiHybrid   = hi("HYBRID");
  const hiWorkflow = hi("WORKFLOW");
  const hiAgent    = hi("AGENT");

  // Agent pulse animation
  const agentPulse = node2In > 0 ? 0.5 + 0.5 * Math.sin(frame / 5) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="hpd-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="hpd-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="hpd-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="hpd-arr-agent" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={60} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={titleIn}>
        HYBRID PIPELINE: WORKFLOW + AGENT
      </text>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const np = nodeProgress[i];
        if (np <= 0) return null;
        const isAgent    = node.type === "agent";
        const isWorkflow = node.type === "workflow";
        const isOutput   = node.type === "output";
        const hiNode     = (isAgent && hiAgent) || (isWorkflow && hiWorkflow) || hiHybrid;

        if (isOutput) {
          return (
            <g key={node.id} opacity={np}>
              <circle cx={node.x + 14} cy={ARROW_Y} r={20}
                fill={T.mint} fillOpacity={0.25}
                stroke={T.mint} strokeWidth="2"
                filter="url(#hpd-glow-sm)"
              />
              <text x={node.x + 14} y={ARROW_Y + 5} textAnchor="middle"
                fill={T.mint} fontFamily={T.mono} fontSize="12">
                ✓
              </text>
              <text x={node.x + 14} y={ARROW_Y + 36} textAnchor="middle"
                fill={T.mint} fontFamily={T.sans} fontSize="10" letterSpacing="1">
                OUTPUT
              </text>
            </g>
          );
        }

        const color = isAgent ? T.violet : T.cyan;
        const h = isAgent ? NODE_H + 30 : NODE_H;
        const y = isAgent ? NODE_Y - 15 : NODE_Y;
        const rx = isAgent ? 20 : 14;

        return (
          <g key={node.id} opacity={np}>
            {/* Agent outer pulse ring */}
            {isAgent && (
              <rect x={node.x - 6} y={y - 6} width={node.w + 12} height={h + 12} rx={rx + 4}
                fill="none" stroke={T.violet} strokeWidth="2"
                opacity={agentPulse * 0.4 * np}
                filter="url(#hpd-glow)"
              />
            )}
            <rect x={node.x} y={y} width={node.w} height={h} rx={rx}
              fill={color} fillOpacity={isAgent ? 0.22 : hiNode ? 0.16 : 0.1}
              stroke={color} strokeWidth={isAgent || hiNode ? 2.5 : 1.5}
              filter={isAgent ? "url(#hpd-glow-sm)" : hiNode ? "url(#hpd-glow-sm)" : undefined}
            />
            {/* Step label */}
            <text x={node.x + node.w / 2} y={y + (isAgent ? 44 : 38)} textAnchor="middle"
              fill={color} fontFamily={T.sans} fontSize={isAgent ? 18 : 14} fontWeight="800"
              letterSpacing={isAgent ? "2" : "1"}>
              {node.label}
            </text>
            {/* Sublabel */}
            <text x={node.x + node.w / 2} y={y + (isAgent ? 65 : 57)} textAnchor="middle"
              fill={color} fontFamily={T.mono} fontSize="10" opacity="0.65">
              {node.sublabel}
            </text>
            {/* Workflow badge */}
            {isWorkflow && (
              <rect x={node.x + node.w / 2 - 32} y={y + 66} width={64} height={20} rx="10"
                fill={T.cyan} fillOpacity={0.18} stroke={T.cyan} strokeWidth="1"
              />
            )}
            {isWorkflow && (
              <text x={node.x + node.w / 2} y={y + 79} textAnchor="middle"
                fill={T.cyan} fontFamily={T.sans} fontSize="8" fontWeight="700" letterSpacing="1.5">
                WORKFLOW
              </text>
            )}
          </g>
        );
      })}

      {/* Arrows between nodes */}
      {ARROW_GAPS.map((gap, i) => {
        const prevP = nodeProgress[i];
        const nextP = nodeProgress[i + 1];
        if (prevP <= 0 || nextP <= 0) return null;
        const isToAgent   = i === 1;
        const isFromAgent = i === 2;
        const color = isToAgent || isFromAgent ? T.violet : T.textDim;
        return (
          <line key={i} x1={gap.x1 + 4} y1={ARROW_Y} x2={gap.x2 - 4} y2={ARROW_Y}
            stroke={color} strokeWidth="2.5"
            markerEnd={isToAgent || isFromAgent ? "url(#hpd-arr-agent)" : "url(#hpd-arr)"}
            opacity={isToAgent || isFromAgent ? 0.8 : 0.5}
          />
        );
      })}

      {/* Legend / labels */}
      {labelIn > 0 && (
        <g opacity={labelIn}>
          {/* Workflow bracket */}
          <path d={`M 60 ${NODE_Y + NODE_H + 56} L 60 ${NODE_Y + NODE_H + 78} L 460 ${NODE_Y + NODE_H + 78} L 460 ${NODE_Y + NODE_H + 56}`}
            fill="none" stroke={T.cyan} strokeWidth="1.5" opacity="0.5"
          />
          <text x={260} y={NODE_Y + NODE_H + 98} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2" opacity="0.7">
            FIXED STEPS
          </text>

          {/* Agent bracket */}
          <path d={`M 490 ${NODE_Y + NODE_H + 56} L 490 ${NODE_Y + NODE_H + 78} L 710 ${NODE_Y + NODE_H + 78} L 710 ${NODE_Y + NODE_H + 56}`}
            fill="none" stroke={T.violet} strokeWidth="1.5" opacity="0.5"
          />
          <text x={600} y={NODE_Y + NODE_H + 98} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2" opacity="0.7">
            FLEXIBLE
          </text>

          {/* Workflow end bracket */}
          <path d={`M 770 ${NODE_Y + NODE_H + 56} L 770 ${NODE_Y + NODE_H + 78} L 960 ${NODE_Y + NODE_H + 78} L 960 ${NODE_Y + NODE_H + 56}`}
            fill="none" stroke={T.cyan} strokeWidth="1.5" opacity="0.5"
          />
          <text x={865} y={NODE_Y + NODE_H + 98} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2" opacity="0.7">
            FIXED STEPS
          </text>

          {/* Bottom note */}
          <text x={W / 2} y={660} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12" letterSpacing="2" opacity="0.6">
            HYBRID: use the right tool for each stage
          </text>
        </g>
      )}
    </svg>
  );
};
