import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const AX0 = 120, AY0 = 80, AX1 = 880, AY1 = 580;
const AW = AX1 - AX0, AH = AY1 - AY0;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// 12 points with a clear quadratic curve trend (low, dip, rise)
const POINTS = [
  { nx: 0.05, ny: 0.70 },
  { nx: 0.12, ny: 0.55 },
  { nx: 0.20, ny: 0.40 },
  { nx: 0.28, ny: 0.28 },
  { nx: 0.35, ny: 0.22 },
  { nx: 0.45, ny: 0.18 },
  { nx: 0.55, ny: 0.25 },
  { nx: 0.62, ny: 0.35 },
  { nx: 0.70, ny: 0.50 },
  { nx: 0.78, ny: 0.65 },
  { nx: 0.85, ny: 0.75 },
  { nx: 0.92, ny: 0.88 },
];

// Linear fit — clearly misses the curve
function linearY(nx: number) { return 0.15 * nx + 0.40; }

// Polynomial fit — degree 3, fits the data well
function polyY(nx: number) {
  const x = nx - 0.5;
  return 0.18 + 3.2 * x * x - 0.5 * x * x * x;
}

function svgX(nx: number) { return AX0 + nx * AW; }
function svgY(ny: number) { return AY1 - Math.max(0, Math.min(1, ny)) * AH; }

function buildPolyline(fn: (t: number) => number, progress: number, n = 80): string {
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    pts.push(`${svgX(t)},${svgY(fn(t))}`);
  }
  return pts.join(" ");
}

export const PolynomialRegrDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn   = p(frame, duration, 0.00, 0.20);
  const pointsIn = p(frame, duration, 0.20, 0.40);
  const linFitIn = p(frame, duration, 0.40, 0.55);
  const polyIn   = p(frame, duration, 0.55, 0.80);
  const labelsIn = p(frame, duration, 0.80, 1.00);

  const hiUnderfit = hi("UNDERFIT");
  const hiDegree   = hi("DEGREE");

  const nPoints = Math.floor(pointsIn * POINTS.length);
  const gridLines = [0.2, 0.4, 0.6, 0.8];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pr-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid + axes */}
      <g opacity={axesIn}>
        {gridLines.map((gl, i) => (
          <g key={i}>
            <line x1={AX0} y1={svgY(gl)} x2={AX1} y2={svgY(gl)}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
            <line x1={svgX(gl)} y1={AY0} x2={svgX(gl)} y2={AY1}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
          </g>
        ))}
        <line x1={AX0} y1={AY0 - 16} x2={AX0} y2={AY1 + 16} stroke={T.borderStrong} strokeWidth="2" />
        <line x1={AX0 - 16} y1={AY1} x2={AX1 + 16} y2={AY1} stroke={T.borderStrong} strokeWidth="2" />
        <text x={W / 2} y={AY1 + 48} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="18" fontWeight="600">X</text>
        <text x={AX0 - 20} y={H / 2} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="18" fontWeight="600"
          transform={`rotate(-90, ${AX0 - 20}, ${H / 2})`}>Y</text>
      </g>

      {/* Scatter points */}
      {POINTS.slice(0, nPoints).map((pt, i) => (
        <circle key={i}
          cx={svgX(pt.nx)} cy={svgY(pt.ny)} r={9}
          fill={T.cyan} fillOpacity={0.75}
          stroke={T.cyan} strokeWidth="1.5"
        />
      ))}

      {/* Linear fit — coral (underfit) */}
      {linFitIn > 0 && (
        <line
          x1={AX0} y1={svgY(linearY(0))}
          x2={AX0 + linFitIn * AW} y2={svgY(linearY(linFitIn))}
          stroke={hiUnderfit ? "#FF4060" : T.coral}
          strokeWidth={hiUnderfit ? 3.5 : 2.5}
          filter={hiUnderfit ? "url(#pr-glow)" : undefined}
        />
      )}

      {/* Polynomial fit — mint (good) */}
      {polyIn > 0 && (
        <polyline
          points={buildPolyline(polyY, polyIn)}
          fill="none"
          stroke={T.mint}
          strokeWidth="3"
        />
      )}

      {/* Label badges */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          {/* Linear Fit badge */}
          <rect x={130} y={90} width={160} height={40} rx="8"
            fill={T.bgDeep} stroke={T.coral} strokeWidth="1.5" />
          <text x={210} y={116} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="16" fontWeight="700">
            Linear Fit
          </text>
          <text x={210} y={148} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="13" opacity="0.75">
            (underfit)
          </text>

          {/* Polynomial Fit badge */}
          <rect x={680} y={90} width={220} height={40} rx="8"
            fill={T.bgDeep} stroke={T.mint} strokeWidth="1.5" />
          <text x={790} y={116} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="700">
            Polynomial Fit
          </text>
          {hiDegree && (
            <text x={790} y={148} textAnchor="middle"
              fill={T.mint} fontFamily={T.mono} fontSize="14">
              degree = 3
            </text>
          )}
        </g>
      )}
    </svg>
  );
};
