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

const ORIGINAL = [38, 27, 43, 3, 9, 82, 10, 1];

const LEVELS = [
  { groups: [[38, 27, 43, 3, 9, 82, 10, 1]], y: 60, sorted: false },
  { groups: [[38, 27, 43, 3], [9, 82, 10, 1]], y: 180, sorted: false },
  { groups: [[38, 27], [43, 3], [9, 82], [10, 1]], y: 300, sorted: false },
  { groups: [[38], [27], [43], [3], [9], [82], [10], [1]], y: 420, sorted: false },
  { groups: [[27, 38], [3, 43], [9, 82], [1, 10]], y: 300, sorted: true },
  { groups: [[3, 27, 38, 43], [1, 9, 10, 82]], y: 180, sorted: true },
  { groups: [[1, 3, 9, 10, 27, 38, 43, 82]], y: 60, sorted: true },
];

const CELL_W = 54;
const CELL_H = 38;
const CELL_GAP = 4;

const LEVEL_COLORS_SORTED: Record<number, string> = { 4: T.cyan, 5: T.violet, 6: T.mint };

function groupWidth(count: number) { return count * CELL_W + (count - 1) * CELL_GAP; }
function groupsRowWidth(groups: number[][]): number {
  return groups.reduce((sum, g) => sum + groupWidth(g.length), 0) + (groups.length - 1) * 24;
}

function groupXStart(groups: number[][], groupIdx: number): number {
  let x = (W - groupsRowWidth(groups)) / 2;
  for (let i = 0; i < groupIdx; i++) {
    x += groupWidth(groups[i].length) + 24;
  }
  return x;
}

export const MergeSortDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const level0In = p(frame, duration, 0.00, 0.08);
  const level1In = p(frame, duration, 0.08, 0.18);
  const level2In = p(frame, duration, 0.18, 0.30);
  const level3In = p(frame, duration, 0.30, 0.42);
  const merge1In = p(frame, duration, 0.42, 0.57);
  const merge2In = p(frame, duration, 0.57, 0.74);
  const merge3In = p(frame, duration, 0.74, 1.00);

  const levelProgress = [level0In, level1In, level2In, level3In, merge1In, merge2In, merge3In];

  const hiMerge   = hi("MERGE SORT");
  const hiDivide  = hi("DIVIDE");
  const hiConquer = hi("CONQUER");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ms-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ms-glow-sm">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="ms-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
      </defs>

      <text x={W / 2} y={36} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3">
        MERGE SORT · DIVIDE AND CONQUER
      </text>

      <rect x={W - 240} y={44} width={210} height={32} rx="10"
        fill={T.bgDeep} fillOpacity="0.7" stroke={T.border} strokeWidth="1.5"
      />
      <text x={W - 135} y={65} textAnchor="middle"
        fill={T.mint} fontFamily={T.mono} fontSize="12">
        O(n log n)
      </text>

      {LEVELS.map((level, li) => {
        const lp = levelProgress[li];
        if (lp <= 0) return null;
        const isSorted = level.sorted;
        const isFirst = !isSorted && li < 4;
        const accentColor = isSorted
          ? (LEVEL_COLORS_SORTED[li] ?? T.mint)
          : T.textDim;
        const showDivide = isFirst && hiDivide;
        const showConquer = isSorted && hiConquer;
        const glowing = (hiMerge || showDivide || showConquer);

        return (
          <g key={`level-${li}`} opacity={lp}>
            {li > 0 && li < 4 && (
              <text x={42} y={level.y + CELL_H / 2 + 5}
                fill={T.textDim} fontFamily={T.sans} fontSize="9" letterSpacing="0.5">
                SPLIT
              </text>
            )}
            {li >= 4 && (
              <text x={30} y={level.y + CELL_H / 2 + 5}
                fill={accentColor} fontFamily={T.sans} fontSize="9" letterSpacing="0.5">
                MERGE
              </text>
            )}

            {level.groups.map((group, gi) => {
              const gx = groupXStart(level.groups, gi);
              return (
                <g key={gi}>
                  <rect x={gx - 4} y={level.y - 4} width={groupWidth(group.length) + 8} height={CELL_H + 8} rx="10"
                    fill={accentColor} fillOpacity={isSorted ? 0.10 : 0.05}
                    stroke={accentColor} strokeWidth={glowing ? 2 : 1.2}
                    filter={glowing ? "url(#ms-glow-sm)" : undefined}
                  />
                  {group.map((val, ci) => {
                    const cx = gx + ci * (CELL_W + CELL_GAP);
                    return (
                      <g key={ci}>
                        <rect x={cx} y={level.y} width={CELL_W} height={CELL_H} rx="6"
                          fill={isSorted ? accentColor : T.bgDeep}
                          fillOpacity={isSorted ? 0.25 : 0.6}
                          stroke={isSorted ? accentColor : T.border}
                          strokeWidth="1.5"
                        />
                        <text x={cx + CELL_W / 2} y={level.y + CELL_H / 2 + 6}
                          textAnchor="middle"
                          fill={isSorted ? accentColor : T.textSecondary}
                          fontFamily={T.mono} fontSize="13" fontWeight={isSorted ? "700" : "400"}>
                          {val}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}

      {level3In > 0.5 && (
        <text x={W / 2} y={480}
          textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11"
          opacity={level3In}>
          BASE CASES
        </text>
      )}

      {merge3In > 0.8 && (
        <g opacity={merge3In}>
          <rect x={W / 2 - 90} y={630} width={180} height={32} rx="16"
            fill={T.mint} fillOpacity="0.18" stroke={T.mint} strokeWidth="2"
            filter="url(#ms-glow-sm)"
          />
          <text x={W / 2} y={651} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="2">
            SORTED
          </text>
        </g>
      )}
    </svg>
  );
};
