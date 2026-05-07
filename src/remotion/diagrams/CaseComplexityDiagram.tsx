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

const CASES = [
  {
    label: "BEST CASE",
    key: "BEST CASE",
    color: T.mint,
    bars: [20, 30, 40, 50, 60, 70, 80],
    description: "Already sorted",
  },
  {
    label: "AVERAGE CASE",
    key: "AVERAGE CASE",
    color: T.amber,
    bars: [60, 20, 80, 30, 50, 70, 40],
    description: "Random order",
  },
  {
    label: "WORST CASE",
    key: "WORST CASE",
    color: T.coral,
    bars: [80, 70, 60, 50, 40, 30, 20],
    description: "Reverse sorted",
  },
];

const TABLE_ROWS = [
  { algo: "Linear Search", best: "O(1)", avg: "O(n)", worst: "O(n)" },
  { algo: "Binary Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)" },
  { algo: "Quicksort",     best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)" },
];

const SECTION_W = 300;
const SECTION_GAP = 40;
const SECTION_START = (W - (SECTION_W * 3 + SECTION_GAP * 2)) / 2;

export const CaseComplexityDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const arraysIn  = p(frame, duration, 0.00, 0.30);
  const curvesIn  = p(frame, duration, 0.30, 0.60);
  const tableIn   = p(frame, duration, 0.60, 1.00);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cc-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cc-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
      </defs>

      <text x={W / 2} y={40} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={arraysIn}>
        BEST · AVERAGE · WORST CASE COMPLEXITY
      </text>

      {CASES.map((c, ci) => {
        const sectionX = SECTION_START + ci * (SECTION_W + SECTION_GAP);
        const isHi = hi(c.key);
        const barW = 30;
        const barGap = 8;
        const totalBarW = 7 * barW + 6 * barGap;
        const barStartX = sectionX + (SECTION_W - totalBarW) / 2;

        return (
          <g key={ci} opacity={arraysIn}>
            <rect x={sectionX} y={55} width={SECTION_W} height={26} rx="13"
              fill={c.color} fillOpacity={isHi ? 0.22 : 0.12}
              stroke={c.color} strokeWidth={isHi ? 2 : 1.5}
              filter={isHi ? "url(#cc-glow)" : undefined}
            />
            <text x={sectionX + SECTION_W / 2} y={73} textAnchor="middle"
              fill={c.color} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1.5"
              filter={isHi ? "url(#cc-glow)" : undefined}>
              {c.label}
            </text>
            <text x={sectionX + SECTION_W / 2} y={100} textAnchor="middle"
              fill={T.textDim} fontFamily={T.sans} fontSize="11">
              {c.description}
            </text>

            {c.bars.map((h, bi) => {
              const bx = barStartX + bi * (barW + barGap);
              const maxH = 90;
              const bh = (h / 100) * maxH;
              const by = 110 + maxH - bh;
              return (
                <rect key={bi}
                  x={bx} y={by} width={barW} height={bh}
                  rx="3"
                  fill={c.color}
                  fillOpacity={isHi ? 0.75 : 0.5}
                  filter={isHi ? "url(#cc-glow)" : undefined}
                />
              );
            })}

            {curvesIn > 0 && (() => {
              const chartX0 = sectionX + 10;
              const chartX1 = sectionX + SECTION_W - 10;
              const chartY0 = 228;
              const chartY1 = 320;
              const chartW = chartX1 - chartX0;
              const chartH = chartY1 - chartY0;

              const curves = [
                { fn: (t: number) => (ci === 0 ? 0.1 : ci === 1 ? t : t * t), color: T.textDim, opacity: 0.5 },
                { fn: (t: number) => (ci === 0 ? t * 0.3 : ci === 1 ? t : t * t) * 0.7, color: c.color, opacity: 0.9 },
              ];

              return (
                <g>
                  <line x1={chartX0} y1={chartY0} x2={chartX0} y2={chartY1}
                    stroke={T.border} strokeWidth="1.5" markerEnd="url(#cc-arr)" />
                  <line x1={chartX0} y1={chartY1} x2={chartX1} y2={chartY1}
                    stroke={T.border} strokeWidth="1.5" markerEnd="url(#cc-arr)" />

                  {curves.map((cv, cvi) => {
                    const steps = 40;
                    const count = Math.max(2, Math.floor(curvesIn * steps));
                    const pts = Array.from({ length: count }, (_, i) => {
                      const t = i / (steps - 1);
                      const y = cv.fn(t);
                      return `${chartX0 + t * chartW},${chartY1 - y * chartH * 0.9}`;
                    }).join(" ");
                    return (
                      <polyline key={cvi}
                        points={pts}
                        fill="none"
                        stroke={cv.color}
                        strokeWidth="2"
                        opacity={cv.opacity * curvesIn}
                      />
                    );
                  })}
                  <text x={chartX0 + chartW / 2} y={chartY1 + 14} textAnchor="middle"
                    fill={T.textDim} fontFamily={T.sans} fontSize="9">
                    n
                  </text>
                </g>
              );
            })()}
          </g>
        );
      })}

      {tableIn > 0 && (() => {
        const tableX = 80;
        const tableY = 370;
        const colW = [200, 180, 180, 180];
        const rowH = 46;
        const headers = ["Algorithm", "Best", "Average", "Worst"];
        const colColors = [T.textSecondary, T.mint, T.amber, T.coral];

        return (
          <g opacity={tableIn}>
            <rect x={tableX} y={tableY} width={W - 2 * tableX} height={(TABLE_ROWS.length + 1) * rowH + 4} rx="12"
              fill={T.bgDeep} fillOpacity="0.6" stroke={T.border} strokeWidth="1.5"
            />

            {headers.map((h, hi2) => {
              const colX = tableX + colW.slice(0, hi2).reduce((a, b) => a + b, 0);
              return (
                <text key={hi2} x={colX + colW[hi2] / 2} y={tableY + 28}
                  textAnchor="middle"
                  fill={colColors[hi2]} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="1">
                  {h.toUpperCase()}
                </text>
              );
            })}

            <line x1={tableX} y1={tableY + rowH} x2={tableX + W - 2 * tableX} y2={tableY + rowH}
              stroke={T.border} strokeWidth="1" />

            {TABLE_ROWS.map((row, ri) => {
              const rowY = tableY + (ri + 1) * rowH;
              const rowAlpha = Math.max(0, Math.min(1, tableIn * 3 - ri));
              const vals = [row.algo, row.best, row.avg, row.worst];
              const isLastWorst = row.worst === "O(n²)";
              return (
                <g key={ri} opacity={rowAlpha}>
                  {vals.map((v, vi) => {
                    const colX = tableX + colW.slice(0, vi).reduce((a, b) => a + b, 0);
                    const isWorst = vi === 3 && isLastWorst;
                    const cellColor = vi === 0 ? T.textSecondary : vi === 1 ? T.mint : vi === 2 ? T.amber : (isWorst ? T.coral : T.amber);
                    return (
                      <text key={vi} x={colX + colW[vi] / 2} y={rowY + 28}
                        textAnchor="middle"
                        fill={cellColor}
                        fontFamily={vi === 0 ? T.sans : T.mono}
                        fontSize={vi === 0 ? 13 : 12}
                        fontWeight={vi === 0 ? "500" : "600"}>
                        {v}
                      </text>
                    );
                  })}
                  {ri < TABLE_ROWS.length - 1 && (
                    <line x1={tableX} y1={rowY + rowH} x2={tableX + W - 2 * tableX} y2={rowY + rowH}
                      stroke={T.border} strokeWidth="0.5" />
                  )}
                </g>
              );
            })}
          </g>
        );
      })()}
    </svg>
  );
};
