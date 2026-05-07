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

const AXIS_X0 = 90, AXIS_X1 = 940;
const AXIS_Y0 = 70, AXIS_Y1 = 610;
const AW = AXIS_X1 - AXIS_X0;
const AH = AXIS_Y1 - AXIS_Y0;

const MAX_N = 40;
const MAX_Y = 600;

function nToX(n: number) { return AXIS_X0 + (n / MAX_N) * AW; }
function yToSVG(y: number) { return AXIS_Y1 - Math.min(y, MAX_Y) / MAX_Y * AH; }

const CURVES = [
  { label: "O(1)",       color: T.mint,      fn: (_n: number) => 30,                            key: "CONSTANT" },
  { label: "O(log n)",   color: T.cyan,      fn: (n: number) => n <= 0 ? 0 : Math.log2(n) * 30, key: "LOGARITHMIC" },
  { label: "O(n)",       color: T.amber,     fn: (n: number) => n * 12,                          key: "LINEAR" },
  { label: "O(n log n)", color: T.violet,    fn: (n: number) => n <= 0 ? 0 : n * Math.log2(n) * 5, key: "LINEARITHMIC" },
  { label: "O(n²)",      color: T.coral,     fn: (n: number) => n * n * 0.35,                   key: "QUADRATIC" },
  { label: "O(2ⁿ)",      color: "#FF6B9D",   fn: (n: number) => Math.pow(2, n) * 0.003,         key: "EXPONENTIAL" },
  { label: "O(n!)",      color: "#FF9F40",   fn: (n: number) => {
    let f = 1; for (let i = 2; i <= n; i++) f *= i; return f * 0.00005;
  }, key: "FACTORIAL" },
];

function buildPolyline(fn: (n: number) => number, progress: number): string {
  const steps = 80;
  const count = Math.max(2, Math.floor(progress * steps));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const n = 1 + (i / (steps - 1)) * (MAX_N - 1);
    pts.push(`${nToX(n)},${yToSVG(fn(n))}`);
  }
  return pts.join(" ");
}

export const GrowthRatesDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn = p(frame, duration, 0.00, 0.12);

  const curveProgress = CURVES.map((_, i) => {
    const s = 0.12 + i * 0.11;
    const e = s + 0.13;
    return p(frame, duration, Math.min(s, 0.88), Math.min(e, 1.00));
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="gr-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="gr-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
        <clipPath id="gr-clip">
          <rect x={AXIS_X0} y={AXIS_Y0} width={AW} height={AH} />
        </clipPath>
      </defs>

      <text x={W / 2} y={40} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={axesIn}>
        COMPLEXITY GROWTH RATES · COMPARATIVE ANALYSIS
      </text>

      {axesIn > 0 && (
        <g opacity={axesIn}>
          <line x1={AXIS_X0} y1={AXIS_Y1} x2={AXIS_X1 + 20} y2={AXIS_Y1}
            stroke={T.border} strokeWidth="2" markerEnd="url(#gr-arr)" />
          <line x1={AXIS_X0} y1={AXIS_Y1} x2={AXIS_X0} y2={AXIS_Y0 - 20}
            stroke={T.border} strokeWidth="2" markerEnd="url(#gr-arr)" />
          <text x={AXIS_X1 + 28} y={AXIS_Y1 + 5} fill={T.textDim} fontFamily={T.sans} fontSize="14" fontStyle="italic">n</text>
          <text x={AXIS_X0 - 10} y={AXIS_Y0 - 28} fill={T.textDim} fontFamily={T.sans} fontSize="13">ops</text>

          {[0, 10, 20, 30, 40].map(n => (
            <g key={n}>
              <line x1={nToX(n)} y1={AXIS_Y1} x2={nToX(n)} y2={AXIS_Y1 + 6} stroke={T.border} strokeWidth="1.5" />
              <text x={nToX(n)} y={AXIS_Y1 + 20} textAnchor="middle"
                fill={T.textDim} fontFamily={T.mono} fontSize="11">{n}</text>
            </g>
          ))}
        </g>
      )}

      {CURVES.map((curve, i) => {
        const cp = curveProgress[i];
        if (cp <= 0) return null;
        const isHi = hi(curve.key);
        return (
          <g key={curve.label} clipPath="url(#gr-clip)">
            <polyline
              points={buildPolyline(curve.fn, cp)}
              fill="none"
              stroke={curve.color}
              strokeWidth={isHi ? 3.5 : 2.2}
              opacity={isHi ? 1 : 0.8}
              filter={isHi ? "url(#gr-glow)" : undefined}
            />
          </g>
        );
      })}

      {CURVES.map((curve, i) => {
        const cp = curveProgress[i];
        if (cp < 0.85) return null;
        const isHi = hi(curve.key);
        const lastN = 1 + ((Math.floor(0.85 * 80) / 79)) * (MAX_N - 1);
        const rawY = curve.fn(lastN);
        const svgY = yToSVG(rawY);
        const clampedY = Math.max(AXIS_Y0 + 14, Math.min(AXIS_Y1 - 10, svgY));
        const labelX = AXIS_X1 + 12;

        return (
          <text key={`lbl-${i}`}
            x={labelX}
            y={clampedY + 5}
            fill={curve.color}
            fontFamily={T.mono}
            fontSize={isHi ? 13 : 11}
            fontWeight={isHi ? "700" : "500"}
            filter={isHi ? "url(#gr-glow)" : undefined}
          >
            {curve.label}
          </text>
        );
      })}
    </svg>
  );
};
