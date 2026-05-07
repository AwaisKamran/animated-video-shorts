import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

// Left panel: chart area
const LX0 = 80, LY0 = 80, LX1 = 660, LY1 = 560;
const LW = LX1 - LX0, LH = LY1 - LY0;

// Right panel
const RX = 700, RY0 = 100;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

function svgX(nx: number) { return LX0 + nx * LW; }
function svgY(ny: number) { return LY1 - ny * LH; }
function lineY(nx: number) { return 0.80 * nx + 0.10; }

const POINTS = [
  { nx: 0.05, ny: 0.15 }, { nx: 0.14, ny: 0.22 }, { nx: 0.22, ny: 0.28 },
  { nx: 0.31, ny: 0.36 }, { nx: 0.40, ny: 0.42 }, { nx: 0.48, ny: 0.52 },
  { nx: 0.57, ny: 0.56 }, { nx: 0.65, ny: 0.62 }, { nx: 0.75, ny: 0.70 },
  { nx: 0.85, ny: 0.78 },
];

export const MSELossDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.00, 0.20);
  const lineIn    = p(frame, duration, 0.20, 0.45);
  const boxesIn   = p(frame, duration, 0.45, 0.70);
  const formulaIn = p(frame, duration, 0.70, 0.85);
  const mseIn     = p(frame, duration, 0.85, 1.00);

  const hiMSE          = hi("MSE");
  const hiSquaredError = hi("SQUARED ERROR");
  const hiLoss         = hi("LOSS");

  const nBoxes = Math.floor(boxesIn * POINTS.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="mse-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Left panel axes */}
      <g opacity={axesIn}>
        {[0.2,0.4,0.6,0.8].map((gl, i) => (
          <g key={i}>
            <line x1={LX0} y1={svgY(gl)} x2={LX1} y2={svgY(gl)}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
          </g>
        ))}
        <line x1={LX0} y1={LY0 - 16} x2={LX0} y2={LY1 + 16} stroke={T.borderStrong} strokeWidth="2" />
        <line x1={LX0 - 16} y1={LY1} x2={LX1 + 16} y2={LY1} stroke={T.borderStrong} strokeWidth="2" />
        <text x={(LX0 + LX1) / 2} y={LY1 + 44} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="500">x</text>
        <text x={LX0 - 16} y={LY0 - 4} textAnchor="end"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="500">y</text>

        {/* Scatter points */}
        {POINTS.map((pt, i) => (
          <circle key={i} cx={svgX(pt.nx)} cy={svgY(pt.ny)} r={8}
            fill={T.cyan} fillOpacity={0.75} stroke={T.cyan} strokeWidth="1.5" />
        ))}
      </g>

      {/* Regression line */}
      {lineIn > 0 && (
        <line
          x1={LX0} y1={svgY(lineY(0))}
          x2={LX0 + lineIn * LW} y2={svgY(lineY(lineIn))}
          stroke={T.textPrimary} strokeWidth="2.5"
        />
      )}

      {/* Squared error boxes */}
      {POINTS.slice(0, nBoxes).map((pt, i) => {
        const px = svgX(pt.nx);
        const py = svgY(pt.ny);
        const ry = svgY(lineY(pt.nx));
        const residual = Math.abs(py - ry);
        const side = Math.min(residual, 50); // cap box size
        const top = Math.min(py, ry);
        return (
          <rect key={i}
            x={px - side / 2} y={top}
            width={side} height={side}
            fill={hiSquaredError ? "#FF4060" : T.coral}
            fillOpacity={hiSquaredError ? 0.35 : 0.22}
            stroke={hiSquaredError ? "#FF4060" : T.coral}
            strokeWidth="1"
            filter={hiSquaredError ? "url(#mse-glow)" : undefined}
          />
        );
      })}

      {/* Right panel: formula */}
      {formulaIn > 0 && (
        <g opacity={formulaIn}>
          <rect x={RX} y={RY0} width={340} height={200} rx="14"
            fill={T.bgDeep} stroke={hiMSE ? T.amber : T.borderStrong} strokeWidth="1.5"
            filter={hiMSE ? "url(#mse-glow)" : undefined}
          />
          <text x={RX + 170} y={RY0 + 32} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1.5">
            MEAN SQUARED ERROR
          </text>
          <text x={RX + 170} y={RY0 + 70} textAnchor="middle"
            fill={hiMSE ? T.amber : T.textPrimary} fontFamily={T.mono} fontSize="20" fontWeight="700"
            filter={hiMSE ? "url(#mse-glow)" : undefined}>
            MSE = (1/n)Σ
          </text>
          <text x={RX + 170} y={RY0 + 98} textAnchor="middle"
            fill={hiMSE ? T.amber : T.textPrimary} fontFamily={T.mono} fontSize="18">
            (yᵢ – ŷᵢ)²
          </text>
          <line x1={RX + 40} y1={RY0 + 116} x2={RX + 300} y2={RY0 + 116}
            stroke={T.border} strokeWidth="1" />
          <text x={RX + 170} y={RY0 + 143} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="13">
            sum of squared differences
          </text>
          <text x={RX + 170} y={RY0 + 163} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="13">
            divided by n observations
          </text>
        </g>
      )}

      {/* MSE value badge */}
      {mseIn > 0 && (
        <g opacity={mseIn}>
          <rect x={RX} y={RY0 + 230} width={340} height={60} rx="14"
            fill={hiLoss ? T.coral : T.bgDeep}
            fillOpacity={hiLoss ? 0.2 : 1}
            stroke={T.coral} strokeWidth="2"
          />
          <text x={RX + 170} y={RY0 + 257} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1">
            RESULT
          </text>
          <text x={RX + 170} y={RY0 + 276} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="22" fontWeight="700">
            MSE = 4.32
          </text>
        </g>
      )}
    </svg>
  );
};
