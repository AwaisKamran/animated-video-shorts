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

// Left panel: 2D scatter
const LX0 = 60, LX1 = 520, LY0 = 80, LY1 = 600;
const LCX = (LX0 + LX1) / 2, LCY = (LY0 + LY1) / 2;

// 15 points in an elongated diagonal cluster (top-left to bottom-right axis)
const POINTS_2D = [
  { x: 180, y: 180 }, { x: 220, y: 210 }, { x: 250, y: 240 },
  { x: 270, y: 200 }, { x: 290, y: 270 }, { x: 310, y: 290 },
  { x: 330, y: 260 }, { x: 355, y: 310 }, { x: 370, y: 330 },
  { x: 390, y: 280 }, { x: 410, y: 360 }, { x: 430, y: 380 },
  { x: 460, y: 340 }, { x: 480, y: 410 }, { x: 500, y: 430 },
];

// Cluster center
const CC = { x: 345, y: 310 };

// PC1 direction (along diagonal ~45deg angle), PC2 perpendicular
const PC1_DX = 0.707, PC1_DY = 0.707;
const PC2_DX = -0.707, PC2_DY = 0.707;
const PC1_LEN = 160, PC2_LEN = 70;

// Right panel: 1D projection
const RX0 = 600, RX1 = 1020, RY_LINE = 340;
const RCX = (RX0 + RX1) / 2;

// Project each point onto PC1 axis (scalar)
function projectPC1(pt: { x: number; y: number }) {
  const dx = pt.x - CC.x, dy = pt.y - CC.y;
  return dx * PC1_DX + dy * PC1_DY;
}

const projections = POINTS_2D.map(pt => projectPC1(pt));
const minProj = Math.min(...projections);
const maxProj = Math.max(...projections);

function projToX(proj: number) {
  return RX0 + 30 + ((proj - minProj) / (maxProj - minProj)) * (RX1 - RX0 - 60);
}

export const PCADiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const ptsIn      = p(frame, duration, 0.00, 0.20);
  const pc1In      = p(frame, duration, 0.20, 0.45);
  const pc2In      = p(frame, duration, 0.45, 0.60);
  const projIn     = p(frame, duration, 0.60, 0.80);
  const labelIn    = p(frame, duration, 0.80, 1.00);

  const hiPCA      = hi("PCA");
  const hiVariance = hi("VARIANCE");
  const hiProj     = hi("PROJECTION");
  const hiDim      = hi("DIMENSION");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pca-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Left panel border */}
      <rect x={LX0 - 10} y={LY0 - 10} width={LX1 - LX0 + 20} height={LY1 - LY0 + 20}
        fill="none" stroke={T.border} strokeWidth="1" rx="8" opacity={ptsIn} />
      <text x={(LX0 + LX1) / 2} y={LY0 - 22} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="600" letterSpacing="1"
        opacity={ptsIn}>2D INPUT</text>

      {/* Scatter points */}
      <g opacity={ptsIn}>
        {POINTS_2D.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={8}
            fill={T.textSecondary} fillOpacity={0.6}
            stroke={T.textSecondary} strokeWidth="1.5"
          />
        ))}
      </g>

      {/* PC1 arrow */}
      {pc1In > 0 && (
        <g filter={hiPCA || hiVariance ? "url(#pca-glow)" : undefined}>
          <line
            x1={CC.x - PC1_DX * PC1_LEN * pc1In * 0.7}
            y1={CC.y - PC1_DY * PC1_LEN * pc1In * 0.7}
            x2={CC.x + PC1_DX * PC1_LEN * pc1In}
            y2={CC.y + PC1_DY * PC1_LEN * pc1In}
            stroke={T.cyan} strokeWidth={hiPCA ? 4 : 3}
          />
          {/* Arrowhead */}
          {pc1In > 0.5 && (
            <polygon
              points={`
                ${CC.x + PC1_DX * PC1_LEN},${CC.y + PC1_DY * PC1_LEN}
                ${CC.x + PC1_DX * PC1_LEN - 12 * PC1_DX + 8 * PC2_DX},${CC.y + PC1_DY * PC1_LEN - 12 * PC1_DY + 8 * PC2_DY}
                ${CC.x + PC1_DX * PC1_LEN - 12 * PC1_DX - 8 * PC2_DX},${CC.y + PC1_DY * PC1_LEN - 12 * PC1_DY - 8 * PC2_DY}
              `}
              fill={T.cyan}
            />
          )}
          {pc1In > 0.7 && (
            <g opacity={(pc1In - 0.7) / 0.3}>
              <rect x={CC.x + PC1_DX * (PC1_LEN + 16)} y={CC.y + PC1_DY * (PC1_LEN + 10) - 14}
                width={180} height={32} rx="8" fill={T.bgDeep} stroke={T.cyan} strokeWidth="1" />
              <text x={CC.x + PC1_DX * (PC1_LEN + 16) + 90}
                y={CC.y + PC1_DY * (PC1_LEN + 10) + 6} textAnchor="middle"
                fill={T.cyan} fontFamily={T.sans} fontSize="13" fontWeight="700">
                PC1 · 84% variance
              </text>
            </g>
          )}
        </g>
      )}

      {/* PC2 arrow */}
      {pc2In > 0 && (
        <g filter={hiPCA ? "url(#pca-glow)" : undefined}>
          <line
            x1={CC.x}
            y1={CC.y}
            x2={CC.x + PC2_DX * PC2_LEN * pc2In}
            y2={CC.y + PC2_DY * PC2_LEN * pc2In}
            stroke={T.violet} strokeWidth={hiPCA ? 3.5 : 2.5}
          />
          {pc2In > 0.7 && (
            <g opacity={(pc2In - 0.7) / 0.3}>
              <rect x={CC.x + PC2_DX * (PC2_LEN + 12) - 70}
                y={CC.y + PC2_DY * (PC2_LEN + 12) - 14}
                width={140} height={30} rx="8" fill={T.bgDeep} stroke={T.violet} strokeWidth="1" />
              <text x={CC.x + PC2_DX * (PC2_LEN + 12)}
                y={CC.y + PC2_DY * (PC2_LEN + 12) + 6} textAnchor="middle"
                fill={T.violet} fontFamily={T.sans} fontSize="12" fontWeight="700">PC2 · 12%</text>
            </g>
          )}
        </g>
      )}

      {/* Projection lines + projected points on right */}
      {projIn > 0 && (
        <g opacity={projIn}>
          {/* Right panel */}
          <rect x={RX0 - 10} y={LY0 - 10} width={RX1 - RX0 + 20} height={LY1 - LY0 + 20}
            fill="none" stroke={T.border} strokeWidth="1" rx="8" />
          <text x={RCX} y={LY0 - 22} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="600" letterSpacing="1">
            1D PROJECTION
          </text>
          {/* 1D axis line */}
          <line x1={RX0 + 20} y1={RY_LINE} x2={RX1 - 20} y2={RY_LINE}
            stroke={T.cyan} strokeWidth="2" />

          {/* Projection lines from 2D points */}
          {POINTS_2D.map((pt, i) => {
            const proj = projections[i];
            const px = projToX(proj);
            return (
              <g key={i}>
                <line x1={pt.x} y1={pt.y} x2={px} y2={RY_LINE}
                  stroke={hiProj ? T.cyan : T.textDim} strokeWidth="1"
                  opacity={hiProj ? 0.4 : 0.2} strokeDasharray="4 3" />
                <circle cx={px} cy={RY_LINE} r={6}
                  fill={T.cyan} fillOpacity={0.8}
                  stroke={T.cyan} strokeWidth="1.5" />
              </g>
            );
          })}
        </g>
      )}

      {/* Labels */}
      {labelIn > 0 && (
        <g opacity={labelIn}>
          {/* Arrow between panels */}
          <text x={(LX1 + RX0) / 2} y={LCY} textAnchor="middle"
            fill={hiDim ? T.amber : T.textSecondary} fontFamily={T.sans} fontSize="24" fontWeight="700">
            →
          </text>
          <text x={(LX1 + RX0) / 2} y={LCY + 28} textAnchor="middle"
            fill={hiDim ? T.amber : T.textSecondary} fontFamily={T.sans} fontSize="12" fontWeight="600">
            2D → 1D
          </text>

          {/* Variance retained badge */}
          <rect x={RCX - 120} y={LY1 + 14} width={240} height={44} rx="10"
            fill={hiVariance ? T.mint : T.bgDeep}
            fillOpacity={hiVariance ? 0.18 : 1}
            stroke={T.mint} strokeWidth="1.5"
            filter={hiVariance ? "url(#pca-glow)" : undefined}
          />
          <text x={RCX} y={LY1 + 42} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="700"
            filter={hiVariance ? "url(#pca-glow)" : undefined}>
            84% Variance Retained
          </text>
        </g>
      )}
    </svg>
  );
};
