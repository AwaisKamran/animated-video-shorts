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

const CX = 540, CY = 320, LLM_R = 70;
const TOOL_W = 130, TOOL_H = 60;

const TOOLS = [
  { label: "search",     angle: -135, color: T.cyan },
  { label: "calculator", angle: -45,  color: T.amber },
  { label: "weather",    angle:  45,  color: T.mint },
  { label: "calendar",   angle:  135, color: T.violet },
];
const TOOL_DIST = 250;

function toolPos(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * TOOL_DIST, y: CY + Math.sin(rad) * TOOL_DIST };
}

export const ParallelToolsDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn    = p(frame, duration, 0.00, 0.20);
  const firedP     = p(frame, duration, 0.20, 0.45);
  const execP      = p(frame, duration, 0.45, 0.70);
  const returnP    = p(frame, duration, 0.70, 0.90);
  const badgeIn    = p(frame, duration, 0.90, 1.00);

  const hiParallel = hi("PARALLEL");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pt-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pt-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── LLM center ── */}
      <g opacity={nodesIn}>
        <circle cx={CX} cy={CY} r={LLM_R}
          fill={T.nodeFill} stroke={T.violet} strokeWidth="2.5" />
        <text x={CX} y={CY + 7} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="20" fontWeight="800">LLM</text>
      </g>

      {/* ── Tool nodes ── */}
      {TOOLS.map((tool, i) => {
        const pos = toolPos(tool.angle);
        const rad = (tool.angle * Math.PI) / 180;
        // Arrow from LLM to tool
        const lx1 = CX + Math.cos(rad) * LLM_R;
        const ly1 = CY + Math.sin(rad) * LLM_R;
        const lx2 = pos.x - Math.cos(rad) * TOOL_W / 2;
        const ly2 = pos.y - Math.sin(rad) * TOOL_H / 2;
        // Outgoing flow dot
        const dotX = lx1 + (lx2 - lx1) * firedP;
        const dotY = ly1 + (ly2 - ly1) * firedP;
        // Return dot
        const retX = lx2 + (lx1 - lx2) * returnP;
        const retY = ly2 + (ly1 - ly2) * returnP;
        // Staggered return start per tool
        const retP = p(frame, duration, 0.70 + i * 0.04, 0.88 + i * 0.02);
        const retDotX = lx2 + (lx1 - lx2) * retP;
        const retDotY = ly2 + (ly1 - ly2) * retP;

        return (
          <g key={tool.label} opacity={nodesIn}>
            {/* Connection line */}
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={hiParallel ? tool.color : T.border}
              strokeWidth={hiParallel ? 2 : 1.5}
              strokeDasharray={firedP > 0 ? "none" : "5 4"}
              filter={hiParallel ? "url(#pt-glow-sm)" : undefined}
            />

            {/* Outgoing dot */}
            {firedP > 0 && firedP < 1 && (
              <circle cx={dotX} cy={dotY} r={8} fill={tool.color}
                opacity={0.9} filter="url(#pt-glow-sm)" />
            )}
            {/* Return dot */}
            {retP > 0 && retP < 1 && (
              <circle cx={retDotX} cy={retDotY} r={8} fill={T.mint}
                opacity={0.9} filter="url(#pt-glow-sm)" />
            )}

            {/* Tool box */}
            <rect x={pos.x - TOOL_W / 2} y={pos.y - TOOL_H / 2} width={TOOL_W} height={TOOL_H} rx="12"
              fill={tool.color}
              fillOpacity={execP > 0 ? 0.22 : 0.12}
              stroke={tool.color}
              strokeWidth={execP > 0 ? 2.5 : 1.5}
              filter={execP > 0 ? "url(#pt-glow-sm)" : undefined}
            />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle"
              fill={tool.color} fontFamily={T.mono} fontSize="13" fontWeight="600">
              {execP > 0 ? tool.label : tool.label}
            </text>
          </g>
        );
      })}

      {/* ── Badge ── */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 210} y={630} width={420} height={52} rx="26"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#pt-glow)"
          />
          <text x={W / 2} y={662} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            PARALLEL EXECUTION · 4x FASTER
          </text>
        </g>
      )}
    </svg>
  );
};
