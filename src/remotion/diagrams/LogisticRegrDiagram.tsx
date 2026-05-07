import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const AX0 = 120, AY0 = 80, AX1 = 920, AY1 = 580;
const AW = AX1 - AX0, AH = AY1 - AY0;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// x range: -6 to +6, y: 0 to 1
function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

function svgX(x: number) { return AX0 + ((x + 6) / 12) * AW; }
function svgY(y: number) { return AY1 - y * AH; }

function buildSigmoid(progress: number, n = 100): string {
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const x = -6 + t * 12;
    pts.push(`${svgX(x)},${svgY(sigmoid(x))}`);
  }
  return pts.join(" ");
}

// 10 sample points — 5 below boundary (class 0), 5 above (class 1)
const SAMPLE_POINTS = [
  { x: -4.5, cls: 0 }, { x: -3.0, cls: 0 }, { x: -2.0, cls: 0 },
  { x: -1.0, cls: 0 }, { x: -0.2, cls: 0 },
  { x:  0.5, cls: 1 }, { x:  1.5, cls: 1 }, { x:  2.5, cls: 1 },
  { x:  3.5, cls: 1 }, { x:  4.8, cls: 1 },
];

export const LogisticRegrDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.00, 0.20);
  const curveIn   = p(frame, duration, 0.20, 0.55);
  const ptsIn     = p(frame, duration, 0.55, 0.70);
  const boundIn   = p(frame, duration, 0.70, 0.85);
  const labelsIn  = p(frame, duration, 0.85, 1.00);

  const hiSigmoid   = hi("SIGMOID");
  const hiThreshold = hi("THRESHOLD");

  const nPts = Math.floor(ptsIn * SAMPLE_POINTS.length);
  const boundY = svgY(0.5);

  // X-axis tick labels
  const xTicks = [-6, -4, -2, 0, 2, 4, 6];
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="lg-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid + axes */}
      <g opacity={axesIn}>
        {yTicks.map((yt, i) => (
          <line key={i} x1={AX0} y1={svgY(yt)} x2={AX1} y2={svgY(yt)}
            stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {xTicks.map((xt, i) => (
          <g key={i}>
            <line x1={svgX(xt)} y1={AY0} x2={svgX(xt)} y2={AY1}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
            <text x={svgX(xt)} y={AY1 + 28} textAnchor="middle"
              fill={T.textDim} fontFamily={T.mono} fontSize="14">{xt}</text>
          </g>
        ))}
        {yTicks.map((yt, i) => (
          <text key={i} x={AX0 - 14} y={svgY(yt) + 5} textAnchor="end"
            fill={T.textDim} fontFamily={T.mono} fontSize="13">{yt.toFixed(2)}</text>
        ))}

        <line x1={AX0} y1={AY0 - 16} x2={AX0} y2={AY1 + 16} stroke={T.borderStrong} strokeWidth="2" />
        <line x1={AX0 - 16} y1={AY1} x2={AX1 + 16} y2={AY1} stroke={T.borderStrong} strokeWidth="2" />

        <text x={W / 2} y={AY1 + 60} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="18" fontWeight="600">Score</text>
        <text x={AX0 - 50} y={H / 2} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="600"
          transform={`rotate(-90, ${AX0 - 50}, ${H / 2})`}>P(Class=1)</text>
      </g>

      {/* Sigmoid curve */}
      {curveIn > 0 && (
        <polyline
          points={buildSigmoid(curveIn)}
          fill="none"
          stroke={T.violet}
          strokeWidth={hiSigmoid ? 4 : 3}
          filter={hiSigmoid ? "url(#lg-glow)" : undefined}
        />
      )}

      {/* Sample points */}
      {SAMPLE_POINTS.slice(0, nPts).map((pt, i) => (
        <circle key={i}
          cx={svgX(pt.x)} cy={svgY(sigmoid(pt.x))} r={10}
          fill={pt.cls === 0 ? T.coral : T.mint}
          fillOpacity={0.85}
          stroke={pt.cls === 0 ? T.coral : T.mint}
          strokeWidth="2"
        />
      ))}

      {/* Decision boundary */}
      {boundIn > 0 && (
        <g opacity={Math.min(boundIn * 2, 1)}>
          <line
            x1={AX0} y1={boundY}
            x2={AX0 + boundIn * AW} y2={boundY}
            stroke={hiThreshold ? T.amber : T.textSecondary}
            strokeWidth={hiThreshold ? 3 : 2}
            strokeDasharray="10 6"
            filter={hiThreshold ? "url(#lg-glow)" : undefined}
          />
          <text x={AX1 - 10} y={boundY - 12} textAnchor="end"
            fill={hiThreshold ? T.amber : T.textSecondary}
            fontFamily={T.sans} fontSize="15" fontWeight="600">
            Decision Boundary (p=0.5)
          </text>
        </g>
      )}

      {/* Class labels + formula */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          {/* Class 0 region label */}
          <rect x={130} y={AY1 - 110} width={120} height={36} rx="8"
            fill={T.coral} fillOpacity={0.18} stroke={T.coral} strokeWidth="1.5" />
          <text x={190} y={AY1 - 85} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="17" fontWeight="700">Class 0</text>

          {/* Class 1 region label */}
          <rect x={130} y={AY0 + 20} width={120} height={36} rx="8"
            fill={T.mint} fillOpacity={0.18} stroke={T.mint} strokeWidth="1.5" />
          <text x={190} y={AY0 + 45} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="17" fontWeight="700">Class 1</text>

          {/* Formula */}
          <rect x={680} y={90} width={290} height={48} rx="10"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
          <text x={825} y={121} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="19" fontWeight="700">
            σ(z) = 1/(1+e⁻ᶻ)
          </text>
        </g>
      )}
    </svg>
  );
};
