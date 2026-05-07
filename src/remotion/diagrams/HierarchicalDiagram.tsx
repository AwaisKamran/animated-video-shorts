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

const SUP_CX = 540, SUP_Y = 95, SUP_W = 248, SUP_H = 76;
const SUP_BOT = SUP_Y + SUP_H; // 171

const WORKERS = [
  { label: "Worker A", task: "research", color: T.cyan,  cx: 195 },
  { label: "Worker B", task: "code",     color: T.amber, cx: 540 },
  { label: "Worker C", task: "test",     color: T.mint,  cx: 885 },
];
const WORK_Y = 338, WORK_W = 178, WORK_H = 76;

export const HierarchicalDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const supIn   = p(frame, duration, 0.00, 0.18);
  const wkIn    = p(frame, duration, 0.18, 0.36);
  // Delegations staggered: each gets ~16% of total time
  const del0In  = p(frame, duration, 0.36, 0.52);
  const del1In  = p(frame, duration, 0.48, 0.62);
  const del2In  = p(frame, duration, 0.58, 0.70);
  // Reports staggered in reverse order (C first, A last)
  const rep2In  = p(frame, duration, 0.72, 0.82);
  const rep1In  = p(frame, duration, 0.78, 0.88);
  const rep0In  = p(frame, duration, 0.84, 0.94);
  const finalIn = p(frame, duration, 0.90, 1.00);

  const hiSupervisor = hi("SUPERVISOR");
  const hiDelegate   = hi("DELEGATE");
  const hiAggregate  = hi("AGGREGATE");

  const delIns = [del0In, del1In, del2In];
  const repIns = [rep0In, rep1In, rep2In];

  const markerIds = ["hier-up-c", "hier-up-a", "hier-up-m"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="hier-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="hier-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="hier-down" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="hier-up-c" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="hier-up-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
        <marker id="hier-up-m" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* SUPERVISOR */}
      <g opacity={supIn}>
        <rect x={SUP_CX - SUP_W / 2} y={SUP_Y} width={SUP_W} height={SUP_H} rx="18"
          fill={T.violet} fillOpacity={hiSupervisor ? 0.28 : 0.16}
          stroke={T.violet} strokeWidth={hiSupervisor ? 3 : 2}
          filter={hiSupervisor ? "url(#hier-glow)" : undefined}
        />
        <text x={SUP_CX} y={SUP_Y + 32} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="1.5">
          SUPERVISOR
        </text>
        <text x={SUP_CX} y={SUP_Y + 56} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" opacity="0.65">
          coordinates · delegates · aggregates
        </text>
      </g>

      {/* WORKERS + arrows */}
      {WORKERS.map((w, i) => {
        const delIn = delIns[i];
        const repIn = repIns[i];
        const isActive = delIn > 0.65;
        const isReporting = repIn > 0;

        // Delegate arrow: SUP bottom → worker top (left offset to separate from return)
        const ax0 = SUP_CX - 5, ay0 = SUP_BOT;
        const ax1 = w.cx - 5,   ay1 = WORK_Y;
        // Report arrow: worker top → SUP bottom (right offset)
        const rx0 = w.cx + 5,   ry0 = WORK_Y;
        const rx1 = SUP_CX + 5, ry1 = SUP_BOT;

        // Traveling dot along delegate arrow
        const dotDelProg = delIn < 0.6 ? delIn / 0.6 : 1;
        const showDelDot = delIn > 0.02 && delIn < 0.82;

        // Traveling dot along report arrow
        const dotRepProg = repIn < 0.6 ? repIn / 0.6 : 1;
        const showRepDot = repIn > 0.02 && repIn < 0.82;

        // Task label pill: midpoint of delegate arrow
        const midX = (ax0 + ax1) / 2;
        const midY = (ay0 + ay1) / 2;

        return (
          <g key={w.label}>
            {/* Worker box */}
            <g opacity={wkIn}>
              <rect x={w.cx - WORK_W / 2} y={WORK_Y} width={WORK_W} height={WORK_H} rx="14"
                fill={w.color}
                fillOpacity={isActive ? 0.26 : 0.10}
                stroke={w.color}
                strokeWidth={isActive ? 2.5 : 1.5}
                filter={isActive ? "url(#hier-glow-sm)" : undefined}
              />
              <text x={w.cx} y={WORK_Y + 30} textAnchor="middle"
                fill={w.color} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1">
                {w.label}
              </text>
              <text x={w.cx} y={WORK_Y + 52} textAnchor="middle"
                fill={w.color} fontFamily={T.mono} fontSize="11" opacity="0.75">
                {w.task}
              </text>
            </g>

            {/* Delegate arrow (dashed, with traveling dot and task label) */}
            {delIn > 0 && (
              <g>
                <line x1={ax0} y1={ay0} x2={ax1} y2={ay1}
                  stroke={hiDelegate ? T.violet : T.borderStrong}
                  strokeWidth={hiDelegate ? 2 : 1.5}
                  strokeDasharray="6 4"
                  markerEnd="url(#hier-down)"
                  opacity={Math.min(1, delIn * 3)}
                />
                {delIn > 0.28 && (
                  <g opacity={Math.min(1, (delIn - 0.28) * 5)}>
                    <rect x={midX - 36} y={midY - 13} width={72} height={26} rx="13"
                      fill={T.bgDeep} stroke={T.violet} strokeWidth="1"
                    />
                    <text x={midX} y={midY + 5} textAnchor="middle"
                      fill={T.violet} fontFamily={T.mono} fontSize="10">
                      {w.task}
                    </text>
                  </g>
                )}
                {showDelDot && (
                  <circle
                    cx={ax0 + (ax1 - ax0) * dotDelProg}
                    cy={ay0 + (ay1 - ay0) * dotDelProg}
                    r={7} fill={T.violet} opacity="0.9"
                    filter="url(#hier-glow-sm)"
                  />
                )}
              </g>
            )}

            {/* Report arrow (solid, colored, with traveling dot) */}
            {isReporting && (
              <g opacity={Math.min(1, repIn * 4)}>
                <line x1={rx0} y1={ry0} x2={rx1} y2={ry1}
                  stroke={w.color}
                  strokeWidth="2"
                  markerEnd={`url(#${markerIds[i]})`}
                  filter={hiAggregate ? "url(#hier-glow-sm)" : undefined}
                />
                {showRepDot && (
                  <circle
                    cx={rx0 + (rx1 - rx0) * dotRepProg}
                    cy={ry0 + (ry1 - ry0) * dotRepProg}
                    r={7} fill={w.color} opacity="0.9"
                    filter="url(#hier-glow-sm)"
                  />
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* Final aggregated output */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={W / 2 - 175} y={490} width={350} height={54} rx="27"
            fill={T.violet} fillOpacity={0.16}
            stroke={T.violet} strokeWidth="2"
            filter="url(#hier-glow)"
          />
          <text x={W / 2} y={523} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            AGGREGATED OUTPUT
          </text>
        </g>
      )}
    </svg>
  );
};
