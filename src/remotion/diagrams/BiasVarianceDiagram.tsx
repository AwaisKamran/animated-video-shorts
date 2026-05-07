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

// Dartboard centers
const TARGETS = [
  { cx: 190,  cy: 200, label: "HIGH BIAS\nLOW VARIANCE",  darts: [{dx: -30, dy: -25}, {dx: -20, dy: -30}, {dx: -28, dy: -18}, {dx: -35, dy: -28}], key: "BIAS" },
  { cx: 540,  cy: 200, label: "LOW BIAS\nLOW VARIANCE",   darts: [{dx:  -8, dy:  6}, {dx:   5, dy:  -6}, {dx:  -4, dy:  10}, {dx:  7, dy:   2}], key: "IDEAL" },
  { cx: 890,  cy: 200, label: "LOW BIAS\nHIGH VARIANCE",  darts: [{dx: -55, dy: -40}, {dx:  45, dy:  30}, {dx: -30, dy:  55}, {dx:  50, dy: -45}], key: "VARIANCE" },
];

const CHART_X0 = 120, CHART_X1 = 960, CHART_Y0 = 440, CHART_Y1 = 640;
const CW = CHART_X1 - CHART_X0, CH = CHART_Y1 - CHART_Y0;

function biasSq(t: number) { return 0.08 + 0.85 * Math.pow(1 - t, 2.5); }
function variance(t: number) { return 0.04 + 0.90 * Math.pow(t, 2.2); }
function totalErr(t: number) { return Math.min(1, biasSq(t) + variance(t)); }

function buildPath(fn: (t: number) => number, progress: number, n = 80): string {
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const x = CHART_X0 + t * CW;
    const y = CHART_Y1 - fn(t) * CH;
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

const OPTIMAL_T = 0.38;

export const BiasVarianceDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const targetsIn = p(frame, duration, 0.00, 0.25);
  const dartsIn   = p(frame, duration, 0.25, 0.55);
  const curvesIn  = p(frame, duration, 0.55, 0.80);
  const sweetIn   = p(frame, duration, 0.80, 1.00);

  const hiBias = hi("BIAS");
  const hiVar  = hi("VARIANCE");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="bv-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Dartboards */}
      {TARGETS.map((t, ti) => {
        const isHi = (t.key === "BIAS" && hiBias) || (t.key === "VARIANCE" && hiVar);
        return (
          <g key={ti} opacity={targetsIn}>
            {/* Rings */}
            {[70, 52, 34, 16].map((r, ri) => (
              <circle key={ri} cx={t.cx} cy={t.cy} r={r}
                fill="none" stroke={isHi ? t.key === "BIAS" ? T.coral : T.violet : T.borderStrong}
                strokeWidth={ri === 3 ? 2 : 1} strokeOpacity={0.6 - ri * 0.08} />
            ))}
            <circle cx={t.cx} cy={t.cy} r="6" fill={T.mint} opacity={0.8} />

            {/* Labels */}
            {t.label.split("\n").map((line, li) => (
              <text key={li} x={t.cx} y={t.cy + 92 + li * 20} textAnchor="middle"
                fill={isHi ? (t.key === "BIAS" ? T.coral : T.violet) : T.textSecondary}
                fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="0.5"
                filter={isHi ? "url(#bv-glow)" : undefined}>
                {line}
              </text>
            ))}

            {/* Darts */}
            {dartsIn > 0 && t.darts.map((d, di) => {
              const dartAlpha = Math.max(0, Math.min(1, dartsIn * 4 - di));
              return (
                <circle key={di} cx={t.cx + d.dx} cy={t.cy + d.dy} r="5"
                  fill={T.coral} fillOpacity={0.85 * dartAlpha}
                  stroke={T.coral} strokeWidth="1.5" strokeOpacity={dartAlpha} />
              );
            })}
          </g>
        );
      })}

      {/* Chart axes */}
      {curvesIn > 0 && (
        <g opacity={curvesIn}>
          <line x1={CHART_X0} y1={CHART_Y0 - 10} x2={CHART_X0} y2={CHART_Y1 + 10}
            stroke={T.border} strokeWidth="1.5" />
          <line x1={CHART_X0 - 10} y1={CHART_Y1} x2={CHART_X1 + 10} y2={CHART_Y1}
            stroke={T.border} strokeWidth="1.5" />
          <text x={CHART_X0 - 14} y={CHART_Y0 + 4} textAnchor="end"
            fill={T.textDim} fontFamily={T.sans} fontSize="12">Error</text>
          <text x={CHART_X1 + 14} y={CHART_Y1 + 5} textAnchor="start"
            fill={T.textDim} fontFamily={T.sans} fontSize="12">Complexity</text>

          {/* Curves */}
          <polyline points={buildPath(biasSq, curvesIn)}
            fill="none" stroke={hiBias ? T.coral : T.coral} strokeWidth={hiBias ? 3 : 2}
            strokeOpacity={hiBias ? 1 : 0.7}
            filter={hiBias ? "url(#bv-glow)" : undefined} />
          <polyline points={buildPath(variance, curvesIn)}
            fill="none" stroke={hiVar ? T.violet : T.violet} strokeWidth={hiVar ? 3 : 2}
            strokeOpacity={hiVar ? 1 : 0.7}
            filter={hiVar ? "url(#bv-glow)" : undefined} />
          <polyline points={buildPath(totalErr, curvesIn)}
            fill="none" stroke={T.mint} strokeWidth="2.5" strokeOpacity={0.8} />

          {/* Legend */}
          <line x1={CHART_X1 - 200} y1={CHART_Y0 + 16} x2={CHART_X1 - 170} y2={CHART_Y0 + 16}
            stroke={T.coral} strokeWidth="2" />
          <text x={CHART_X1 - 162} y={CHART_Y0 + 20} fill={T.coral} fontFamily={T.sans} fontSize="12">Bias²</text>
          <line x1={CHART_X1 - 200} y1={CHART_Y0 + 36} x2={CHART_X1 - 170} y2={CHART_Y0 + 36}
            stroke={T.violet} strokeWidth="2" />
          <text x={CHART_X1 - 162} y={CHART_Y0 + 40} fill={T.violet} fontFamily={T.sans} fontSize="12">Variance</text>
          <line x1={CHART_X1 - 200} y1={CHART_Y0 + 56} x2={CHART_X1 - 170} y2={CHART_Y0 + 56}
            stroke={T.mint} strokeWidth="2" />
          <text x={CHART_X1 - 162} y={CHART_Y0 + 60} fill={T.mint} fontFamily={T.sans} fontSize="12">Total Error</text>
        </g>
      )}

      {/* Sweet spot */}
      {sweetIn > 0 && (
        <g opacity={sweetIn}>
          <line x1={CHART_X0 + OPTIMAL_T * CW} y1={CHART_Y0 - 10}
                x2={CHART_X0 + OPTIMAL_T * CW} y2={CHART_Y1}
            stroke={T.mint} strokeWidth="2" strokeDasharray="8 5" />
          <rect x={CHART_X0 + OPTIMAL_T * CW - 90} y={CHART_Y0 - 42} width={180} height={28} rx="14"
            fill={T.mint} fillOpacity={0.12} />
          <text x={CHART_X0 + OPTIMAL_T * CW} y={CHART_Y0 - 22} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="0.5">
            OPTIMAL COMPLEXITY
          </text>
        </g>
      )}
    </svg>
  );
};
