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

const USER_X = 200, LLM_X = 520, TOOL_X = 880;
const NODE_Y = 300, R = 70;
const BOX_W = 120, BOX_H = 70;

function AnimArrow({ x1, x2, y, color, progress, label, dir = "ltr" }: {
  x1: number; x2: number; y: number; color: string;
  progress: number; label: string; dir?: "ltr" | "rtl";
}) {
  if (progress <= 0) return null;
  const dotX = dir === "ltr"
    ? x1 + progress * (x2 - x1)
    : x2 - progress * (x2 - x1);
  const lineX1 = dir === "ltr" ? x1 : dotX;
  const lineX2 = dir === "ltr" ? dotX : x2;
  const tipX  = dotX;
  const baseX = dir === "ltr" ? dotX - 12 : dotX + 12;
  const labelX = (x1 + x2) / 2;
  return (
    <g>
      <line x1={lineX1} y1={y} x2={lineX2} y2={y} stroke={color} strokeWidth="2.5" />
      <polygon points={`${tipX},${y} ${baseX},${y - 7} ${baseX},${y + 7}`} fill={color} />
      <circle cx={dotX} cy={y} r={6} fill={color} opacity={0.9} />
      <rect x={labelX - 80} y={y - 36} width={160} height={26} rx="13" fill={T.bgDeep} />
      <text x={labelX} y={y - 17} textAnchor="middle"
        fill={color} fontFamily={T.mono} fontSize="13" fontWeight="600">{label}</text>
    </g>
  );
}

export const ToolCallDiagram: React.FC<Props> = ({ frame, duration }) => {
  const nodesIn   = p(frame, duration, 0.00, 0.15);
  const p1Query   = p(frame, duration, 0.15, 0.30);  // User → LLM
  const p2JSON    = p(frame, duration, 0.30, 0.50);  // JSON bubble LLM → Tool
  const p3Exec    = p(frame, duration, 0.50, 0.60);  // Tool executes
  const p4Result  = p(frame, duration, 0.60, 0.78);  // Result Tool → LLM
  const p5Answer  = p(frame, duration, 0.78, 1.00);  // LLM → User

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Nodes ── */}
      <g opacity={nodesIn}>
        {/* USER */}
        <circle cx={USER_X} cy={NODE_Y} r={R}
          fill={T.nodeFill} stroke={T.cyan} strokeWidth="2" />
        <text x={USER_X} y={NODE_Y + 6} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="800">USER</text>
        <text x={USER_X} y={NODE_Y + R + 24} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="2">HUMAN</text>

        {/* LLM */}
        <circle cx={LLM_X} cy={NODE_Y} r={R}
          fill={T.nodeFill} stroke={T.violet} strokeWidth="2" />
        <text x={LLM_X} y={NODE_Y + 6} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800">LLM</text>
        <text x={LLM_X} y={NODE_Y + R + 24} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="2">AGENT</text>

        {/* TOOL */}
        <rect x={TOOL_X - BOX_W / 2} y={NODE_Y - BOX_H / 2 - 10}
          width={BOX_W + 20} height={BOX_H + 20} rx="16"
          fill={T.nodeFill}
          stroke={p3Exec > 0 ? T.amber : T.nodeBorder}
          strokeWidth={p3Exec > 0 ? 2.5 : 1.5}
          filter={p3Exec > 0 ? "url(#tc-glow)" : undefined}
        />
        <text x={TOOL_X + 10} y={NODE_Y - 18} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="13" fontWeight="800">TOOL</text>
        <g transform={`translate(${TOOL_X - 2}, ${NODE_Y - 12})`}>
          <NodeIcon type="router" size={20} color={T.amber} />
        </g>
        <text x={TOOL_X + 10} y={NODE_Y + 22} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11">search_web</text>
      </g>

      {/* ── Arrows ── */}
      {/* User → LLM: query */}
      <AnimArrow x1={USER_X + R} x2={LLM_X - R} y={NODE_Y - 60}
        color={T.cyan} progress={p1Query}
        label="What's the weather?" dir="ltr"
      />

      {/* LLM → Tool arrow */}
      <AnimArrow
        x1={LLM_X + R} x2={TOOL_X + 10 - BOX_W / 2 - 10}
        y={NODE_Y + 80}
        color={T.amber} progress={p2JSON}
        label="call: search_web" dir="ltr"
      />

      {/* Result Tool → LLM */}
      <AnimArrow x1={LLM_X + R} x2={TOOL_X + 10 + BOX_W / 2 + 10} y={NODE_Y - 60}
        color={T.mint} progress={p4Result}
        label={`{"temp":72}`} dir="rtl"
      />

      {/* LLM → User: final answer */}
      <AnimArrow x1={USER_X + R} x2={LLM_X - R} y={NODE_Y + 60}
        color={T.mint} progress={p5Answer}
        label="It's 72°F today!" dir="rtl"
      />
    </svg>
  );
};
