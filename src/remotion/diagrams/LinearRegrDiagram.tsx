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

// 14 scatter points with upward trend (x,y normalized 0-1)
const POINTS = [
  { nx: 0.05, ny: 0.12 },
  { nx: 0.10, ny: 0.20 },
  { nx: 0.15, ny: 0.18 },
  { nx: 0.22, ny: 0.30 },
  { nx: 0.28, ny: 0.38 },
  { nx: 0.35, ny: 0.35 },
  { nx: 0.42, ny: 0.48 },
  { nx: 0.50, ny: 0.55 },
  { nx: 0.55, ny: 0.50 },
  { nx: 0.62, ny: 0.65 },
  { nx: 0.70, ny: 0.72 },
  { nx: 0.78, ny: 0.68 },
  { nx: 0.85, ny: 0.80 },
  { nx: 0.92, ny: 0.88 },
];

// Best-fit line: ŷ = 0.82x + 0.10 (in normalized coords)
function lineY(nx: number) { return 0.82 * nx + 0.10; }

function svgX(nx: number) { return AX0 + nx * AW; }
function svgY(ny: number) { return AY1 - ny * AH; }

export const LinearRegrDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn   = p(frame, duration, 0.00, 0.20);
  const pointsIn = p(frame, duration, 0.20, 0.45);
  const lineIn   = p(frame, duration, 0.45, 0.70);
  const residIn  = p(frame, duration, 0.70, 0.85);
  const eqIn     = p(frame, duration, 0.85, 1.00);

  const hiResidual  = hi("RESIDUAL");
  const hiSlope     = hi("SLOPE");

  const nPointsVisible = Math.floor(pointsIn * POINTS.length);

  // Line draws from left to right
  const lineX1 = AX0;
  const lineX2 = AX0 + lineIn * AW;

  const gridLines = [0.2, 0.4, 0.6, 0.8];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="lr-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid */}
      <g opacity={axesIn}>
        {gridLines.map((gl, i) => (
          <g key={i}>
            <line x1={AX0} y1={svgY(gl)} x2={AX1} y2={svgY(gl)}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
            <line x1={svgX(gl)} y1={AY0} x2={svgX(gl)} y2={AY1}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
          </g>
        ))}

        {/* Axes */}
        <line x1={AX0} y1={AY0 - 16} x2={AX0} y2={AY1 + 16} stroke={T.borderStrong} strokeWidth="2" />
        <line x1={AX0 - 16} y1={AY1} x2={AX1 + 16} y2={AY1} stroke={T.borderStrong} strokeWidth="2" />

        {/* Axis labels */}
        <text x={W / 2} y={AY1 + 48} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="18" fontWeight="600">
          Hours Studied
        </text>
        <text x={AX0 - 20} y={H / 2} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="18" fontWeight="600"
          transform={`rotate(-90, ${AX0 - 20}, ${H / 2})`}>
          Score
        </text>
      </g>

      {/* Scatter points */}
      {POINTS.slice(0, nPointsVisible).map((pt, i) => (
        <circle key={i}
          cx={svgX(pt.nx)} cy={svgY(pt.ny)} r={9}
          fill={T.cyan} fillOpacity={0.7}
          stroke={T.cyan} strokeWidth="1.5"
        />
      ))}

      {/* Best-fit line */}
      {lineIn > 0 && (
        <line
          x1={lineX1} y1={svgY(lineY(0))}
          x2={lineX2} y2={svgY(lineY(lineIn))}
          stroke={hiSlope ? T.amber : T.textPrimary}
          strokeWidth={hiSlope ? 3.5 : 2.5}
          filter={hiSlope ? "url(#lr-glow)" : undefined}
        />
      )}

      {/* Residual lines */}
      {residIn > 0 && POINTS.map((pt, i) => {
        const frac = Math.min(1, (residIn * POINTS.length - i) / 1);
        if (frac <= 0) return null;
        const px = svgX(pt.nx);
        const py = svgY(pt.ny);
        const ry = svgY(lineY(pt.nx));
        const lineLength = (ry - py) * frac;
        return (
          <line key={i}
            x1={px} y1={py}
            x2={px} y2={py + lineLength}
            stroke={hiResidual ? "#FF6688" : T.coral}
            strokeWidth={hiResidual ? 2.5 : 1.5}
            strokeDasharray="5 3"
            opacity={0.85}
          />
        );
      })}

      {/* Equation badge */}
      {eqIn > 0 && (
        <g opacity={eqIn}>
          <rect x={680} y={95} width={260} height={52} rx="10"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
          <text x={810} y={127} textAnchor="middle"
            fill={T.textPrimary} fontFamily={T.mono} fontSize="20" fontWeight="700">
            ŷ = 0.82x + 12.4
          </text>
        </g>
      )}
    </svg>
  );
};
