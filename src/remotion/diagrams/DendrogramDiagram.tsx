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

// 8 leaf nodes A-H, evenly spaced
const LEAF_Y = 560;
const LEAF_R = 20;
const LEAVES = ["A", "B", "C", "D", "E", "F", "G", "H"].map((label, i) => ({
  label,
  x: 120 + i * 120,
  y: LEAF_Y,
}));

// Merges: define each U-shape: [leftIdx, rightIdx, mergeHeight]
const MERGES = [
  { l: 0, r: 1, h: 450, color: T.cyan },   // A+B
  { l: 2, r: 3, h: 440, color: T.cyan },   // C+D
  { l: 4, r: 5, h: 455, color: T.violet }, // E+F
  { l: 6, r: 7, h: 445, color: T.violet }, // G+H
  { l: 0, r: 3, h: 310, color: T.amber },  // (AB)+(CD)
  { l: 4, r: 7, h: 300, color: T.amber },  // (EF)+(GH)
  { l: 0, r: 7, h: 160, color: T.mint },   // everything
];

// Map leaf index to merged cx: returns x of the midpoint of a range
function midX(li: number, ri: number): number {
  return (LEAVES[li].x + LEAVES[ri].x) / 2;
}

const CUT_Y = 350;

export const DendrogramDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const leavesIn = p(frame, duration, 0.00, 0.20);
  const mergesIn = p(frame, duration, 0.20, 0.85);
  const cutIn    = p(frame, duration, 0.85, 0.95);
  const clusterIn = p(frame, duration, 0.95, 1.00);

  const hiMerge = hi("MERGE");
  const hiCut   = hi("CUT");

  // How many merges are drawn
  const visibleMerges = Math.floor(mergesIn * (MERGES.length + 0.99));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="dg-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Leaf nodes */}
      {LEAVES.map((leaf, i) => (
        <g key={leaf.label} opacity={leavesIn}>
          <circle cx={leaf.x} cy={leaf.y} r={LEAF_R}
            fill={T.nodeFill} stroke={T.nodeBorder} strokeWidth="1.5" />
          <text x={leaf.x} y={leaf.y + 6} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="14" fontWeight="700">
            {leaf.label}
          </text>
          {/* Stem up from leaf to first merge */}
          <line x1={leaf.x} y1={leaf.y - LEAF_R}
                x2={leaf.x} y2={MERGES[Math.floor(i / 2)].h}
            stroke={T.border} strokeWidth="1.5" strokeOpacity="0.5" />
        </g>
      ))}

      {/* Merge U-shapes */}
      {MERGES.slice(0, visibleMerges).map((m, mi) => {
        const lx = LEAVES[m.l].x;
        const rx = LEAVES[m.r].x;
        const mx = midX(m.l, m.r);
        const isHi = hiMerge;
        const alpha = Math.max(0, Math.min(1, mergesIn * (MERGES.length + 1) - mi));

        return (
          <g key={mi} opacity={alpha}>
            {/* Left vertical */}
            <line x1={lx} y1={m.h + 20} x2={lx} y2={m.h}
              stroke={m.color} strokeWidth={isHi ? 2.5 : 1.5}
              filter={isHi ? "url(#dg-glow)" : undefined}
            />
            {/* Horizontal bar */}
            <line x1={lx} y1={m.h} x2={rx} y2={m.h}
              stroke={m.color} strokeWidth={isHi ? 2.5 : 1.5}
              filter={isHi ? "url(#dg-glow)" : undefined}
            />
            {/* Right vertical */}
            <line x1={rx} y1={m.h} x2={rx} y2={m.h + 20}
              stroke={m.color} strokeWidth={isHi ? 2.5 : 1.5}
              filter={isHi ? "url(#dg-glow)" : undefined}
            />
            {/* Stem upward for intermediate nodes */}
            {mi < MERGES.length - 1 && (
              <line x1={mx} y1={m.h} x2={mx} y2={MERGES[Math.min(mi + (mi < 4 ? 4 - mi : 1), MERGES.length - 1)].h}
                stroke={m.color} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
            )}
          </g>
        );
      })}

      {/* Cut line */}
      {cutIn > 0 && (
        <g opacity={cutIn}>
          <line x1={60} y1={CUT_Y} x2={W - 60} y2={CUT_Y}
            stroke={hiCut ? T.amber : T.amber} strokeWidth={hiCut ? 3 : 2}
            strokeDasharray="14 6"
            filter={hiCut ? "url(#dg-glow)" : undefined}
          />
          <rect x={W - 160} y={CUT_Y - 18} width={100} height={26} rx="13"
            fill={T.amber} fillOpacity={0.15} stroke={T.amber} strokeWidth="1" />
          <text x={W - 110} y={CUT_Y - 1} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="0.5">
            CUT HERE
          </text>
        </g>
      )}

      {/* Cluster labels */}
      {clusterIn > 0 && (
        <g opacity={clusterIn}>
          <text x={W / 2} y={620} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1">
            3 CLUSTERS
          </text>
          {/* Color-coded groups below leaf row */}
          {[
            { label: "Group 1", xs: [0, 1, 2, 3], color: T.cyan },
            { label: "Group 2", xs: [4, 5], color: T.violet },
            { label: "Group 3", xs: [6, 7], color: T.amber },
          ].map((grp) => (
            grp.xs.map((li) => (
              <circle key={`g-${li}`} cx={LEAVES[li].x} cy={LEAF_Y + 44} r="6"
                fill={grp.color} fillOpacity={0.8} />
            ))
          ))}
        </g>
      )}
    </svg>
  );
};
