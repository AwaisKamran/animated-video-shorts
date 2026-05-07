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

function complexityColor(val: string): string {
  if (val === "O(n log n)" || val === "O(n+k)" || val === "O(1)" || val === "Yes") return T.mint;
  if (val === "O(n)" || val === "O(log n)" || val === "O(k)") return T.cyan;
  if (val === "O(n²)" || val === "No") return T.coral;
  return T.amber;
}

const HEADERS = ["Algorithm", "Best", "Average", "Worst", "Space", "Stable?"];
const COL_W = [170, 140, 155, 140, 120, 115];
const ROWS = [
  { algo: "Bubble Sort",    best: "O(n)",       avg: "O(n²)",      worst: "O(n²)",      space: "O(1)", stable: "Yes" },
  { algo: "Insertion Sort", best: "O(n)",       avg: "O(n²)",      worst: "O(n²)",      space: "O(1)", stable: "Yes" },
  { algo: "Selection Sort", best: "O(n²)",      avg: "O(n²)",      worst: "O(n²)",      space: "O(1)", stable: "No"  },
  { algo: "Merge Sort",     best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: "Yes" },
  { algo: "Quick Sort",     best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)",      space: "O(log n)", stable: "No"  },
  { algo: "Heap Sort",      best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)", stable: "No"  },
  { algo: "Counting Sort",  best: "O(n+k)",     avg: "O(n+k)",     worst: "O(n+k)",     space: "O(k)", stable: "Yes" },
];

const TABLE_X = 70;
const TABLE_Y = 120;
const ROW_H = 62;
const HDR_H = 52;

export const SortComparisonDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const headerIn = p(frame, duration, 0.00, 0.18);
  const rowsIn   = p(frame, duration, 0.18, 1.00);

  const hiComp   = hi("COMPARISON");
  const hiStable = hi("STABLE");

  const totalTableW = COL_W.reduce((a, b) => a + b, 0);
  const rowOpacities = ROWS.map((_, i) => Math.max(0, Math.min(1, rowsIn * ROWS.length - i)));

  function colX(colIdx: number): number {
    return TABLE_X + COL_W.slice(0, colIdx).reduce((a, b) => a + b, 0);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sc-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sc-glow-sm">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <text x={W / 2} y={52} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={headerIn}>
        SORTING ALGORITHMS · COMPLEXITY COMPARISON
      </text>

      {headerIn > 0 && (
        <g opacity={headerIn}>
          <rect x={TABLE_X} y={TABLE_Y} width={totalTableW} height={HDR_H} rx="12"
            fill={T.bgDeep} fillOpacity="0.8"
            stroke={T.borderStrong} strokeWidth="1.5"
            filter={hiComp ? "url(#sc-glow-sm)" : undefined}
          />
          {HEADERS.map((h, hi2) => {
            const cx = colX(hi2) + COL_W[hi2] / 2;
            const headerColor = hi2 === 0 ? T.textSecondary : hi2 === 4 ? T.cyan : hi2 === 5 ? (hiStable ? T.mint : T.amber) : T.textSecondary;
            return (
              <text key={hi2} x={cx} y={TABLE_Y + HDR_H / 2 + 6}
                textAnchor="middle"
                fill={headerColor}
                fontFamily={T.sans}
                fontSize="12"
                fontWeight="700"
                letterSpacing="1"
                filter={hi2 === 5 && hiStable ? "url(#sc-glow-sm)" : undefined}>
                {h.toUpperCase()}
              </text>
            );
          })}
          {COL_W.slice(0, -1).map((_, ci) => (
            <line key={ci}
              x1={colX(ci + 1)} y1={TABLE_Y}
              x2={colX(ci + 1)} y2={TABLE_Y + HDR_H + ROWS.length * ROW_H}
              stroke={T.border} strokeWidth="1" opacity={0.5}
            />
          ))}
        </g>
      )}

      {ROWS.map((row, ri) => {
        const rowOpacity = rowOpacities[ri];
        if (rowOpacity <= 0) return null;
        const rowY = TABLE_Y + HDR_H + ri * ROW_H;
        const vals = [row.algo, row.best, row.avg, row.worst, row.space, row.stable];
        const isStableHighlight = hiStable && row.stable === "Yes";

        return (
          <g key={ri} opacity={rowOpacity}>
            <rect x={TABLE_X} y={rowY} width={totalTableW} height={ROW_H}
              fill={isStableHighlight ? T.mint : (ri % 2 === 0 ? T.bgDeep : T.bgPanel)}
              fillOpacity={isStableHighlight ? 0.10 : 0.5}
              stroke={isStableHighlight ? T.mint : T.border}
              strokeWidth={isStableHighlight ? 1.5 : 0.5}
              filter={isStableHighlight ? "url(#sc-glow-sm)" : undefined}
            />
            {vals.map((val, vi) => {
              const cx = colX(vi) + COL_W[vi] / 2;
              const cellColor = vi === 0 ? T.textSecondary : complexityColor(val);
              const isGlowing = (vi === 5 && hiStable && val === "Yes");
              return (
                <text key={vi} x={cx} y={rowY + ROW_H / 2 + 6}
                  textAnchor="middle"
                  fill={cellColor}
                  fontFamily={vi === 0 ? T.sans : T.mono}
                  fontSize={vi === 0 ? 13 : 12}
                  fontWeight={vi === 0 ? "500" : "700"}
                  filter={isGlowing ? "url(#sc-glow-sm)" : undefined}>
                  {val}
                </text>
              );
            })}
            {ri < ROWS.length - 1 && (
              <line x1={TABLE_X} y1={rowY + ROW_H}
                x2={TABLE_X + totalTableW} y2={rowY + ROW_H}
                stroke={T.border} strokeWidth="0.8" opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {headerIn > 0 && (
        <g opacity={headerIn}>
          <rect x={TABLE_X} y={TABLE_Y + HDR_H + ROWS.length * ROW_H}
            width={totalTableW} height={1} fill={T.borderStrong}
          />
          <rect x={TABLE_X} y={TABLE_Y} width={totalTableW}
            height={HDR_H + ROWS.length * ROW_H} rx="12"
            fill="none" stroke={T.borderStrong} strokeWidth="1.5"
          />
        </g>
      )}

      {rowsIn > 0.95 && (
        <g opacity={interpolate(rowsIn, [0.95, 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <rect x={TABLE_X} y={TABLE_Y + HDR_H + 3 * ROW_H} width={totalTableW} height={ROW_H}
            fill={T.mint} fillOpacity="0.07" stroke="none"
          />
          <rect x={TABLE_X} y={TABLE_Y + HDR_H + 4 * ROW_H} width={totalTableW} height={ROW_H}
            fill={T.mint} fillOpacity="0.07" stroke="none"
          />
          <rect x={TABLE_X} y={TABLE_Y + HDR_H + 5 * ROW_H} width={totalTableW} height={ROW_H}
            fill={T.mint} fillOpacity="0.07" stroke="none"
          />
        </g>
      )}
    </svg>
  );
};
