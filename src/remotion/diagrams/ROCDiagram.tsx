import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const AX0 = 130, AY0 = 60, AX1 = 780, AY1 = 590;
const AW = AX1 - AX0, AH = AY1 - AY0;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

function svgX(fpr: number) { return AX0 + fpr * AW; }
function svgY(tpr: number) { return AY1 - tpr * AH; }

// ROC curve: bows toward top-left, going through ~(0.1, 0.85)
function rocTPR(fpr: number) {
  // Parameterized: TPR = 1 - (1-fpr)^0.2 approximately, shaped to bow nicely
  return 1 - Math.pow(1 - fpr, 0.15) + fpr * 0.05;
}

function buildROC(progress: number, n = 100): string {
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const fpr = t;
    const tpr = Math.min(1, rocTPR(fpr));
    pts.push(`${svgX(fpr)},${svgY(tpr)}`);
  }
  return pts.join(" ");
}

function buildAUCPath(n = 100): string {
  const pts: string[] = [];
  pts.push(`${svgX(0)},${svgY(0)}`);
  for (let i = 0; i <= n; i++) {
    const fpr = i / n;
    const tpr = Math.min(1, rocTPR(fpr));
    pts.push(`${svgX(fpr)},${svgY(tpr)}`);
  }
  pts.push(`${svgX(1)},${svgY(0)}`);
  return pts.join(" ");
}

// Threshold point position on the ROC curve
const THRESHOLD_FPR = 0.18;
const THRESHOLD_TPR = rocTPR(THRESHOLD_FPR);

const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

export const ROCDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn      = p(frame, duration, 0.00, 0.20);
  const rocIn       = p(frame, duration, 0.20, 0.65);
  const aucIn       = p(frame, duration, 0.65, 0.80);
  const threshIn    = p(frame, duration, 0.80, 0.90);
  const compareIn   = p(frame, duration, 0.90, 1.00);

  const hiAUC       = hi("AUC") || hi("ROC");
  const hiThreshold = hi("THRESHOLD");
  const hiTPR       = hi("TPR");
  const hiFPR       = hi("FPR");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="roc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="roc-clip">
          <rect x={AX0} y={AY0 - 5} width={AW} height={AH + 10} />
        </clipPath>
      </defs>

      {/* Axes + grid */}
      <g opacity={axesIn}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={AX0} y1={svgY(t)} x2={AX1} y2={svgY(t)}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
            <line x1={svgX(t)} y1={AY0} x2={svgX(t)} y2={AY1}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
            <text x={AX0 - 12} y={svgY(t) + 5} textAnchor="end"
              fill={hiTPR ? T.mint : T.textDim} fontFamily={T.mono} fontSize="13"
              fontWeight={hiTPR ? "700" : "400"}>{t.toFixed(1)}</text>
            <text x={svgX(t)} y={AY1 + 26} textAnchor="middle"
              fill={hiFPR ? T.coral : T.textDim} fontFamily={T.mono} fontSize="13"
              fontWeight={hiFPR ? "700" : "400"}>{t.toFixed(1)}</text>
          </g>
        ))}
        <line x1={AX0} y1={AY0 - 20} x2={AX0} y2={AY1 + 20} stroke={T.borderStrong} strokeWidth="2" />
        <line x1={AX0 - 20} y1={AY1} x2={AX1 + 20} y2={AY1} stroke={T.borderStrong} strokeWidth="2" />
        <text x={(AX0 + AX1) / 2} y={AY1 + 55} textAnchor="middle"
          fill={hiFPR ? T.coral : T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="600">
          False Positive Rate (FPR)
        </text>
        <text x={AX0 - 60} y={(AY0 + AY1) / 2} textAnchor="middle"
          fill={hiTPR ? T.mint : T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="600"
          transform={`rotate(-90, ${AX0 - 60}, ${(AY0 + AY1) / 2})`}>
          True Positive Rate (TPR)
        </text>

        {/* Diagonal baseline */}
        <line x1={svgX(0)} y1={svgY(0)} x2={svgX(1)} y2={svgY(1)}
          stroke={T.textDim} strokeWidth="1.5" strokeDasharray="8 5" opacity="0.5" />
      </g>

      {/* AUC fill */}
      {aucIn > 0 && (
        <polygon
          points={buildAUCPath()}
          fill={T.mint}
          fillOpacity={hiAUC ? 0.20 * aucIn : 0.12 * aucIn}
          filter={hiAUC ? "url(#roc-glow)" : undefined}
          clipPath="url(#roc-clip)"
        />
      )}

      {/* ROC curve */}
      {rocIn > 0 && (
        <polyline
          points={buildROC(rocIn)}
          fill="none"
          stroke={T.violet}
          strokeWidth={hiAUC ? 4 : 3}
          filter={hiAUC ? "url(#roc-glow)" : undefined}
          clipPath="url(#roc-clip)"
        />
      )}

      {/* AUC label */}
      {aucIn > 0 && (
        <g opacity={aucIn}>
          <rect x={svgX(0.3)} y={svgY(0.65)} width={160} height={38} rx="8"
            fill={T.bgDeep} stroke={hiAUC ? T.mint : T.borderStrong} strokeWidth="1.5"
            filter={hiAUC ? "url(#roc-glow)" : undefined}
          />
          <text x={svgX(0.3) + 80} y={svgY(0.65) + 24} textAnchor="middle"
            fill={hiAUC ? T.mint : T.textPrimary} fontFamily={T.sans} fontSize="17" fontWeight="700">
            AUC = 0.91
          </text>
        </g>
      )}

      {/* Threshold point */}
      {threshIn > 0 && (
        <g opacity={threshIn}>
          <circle cx={svgX(THRESHOLD_FPR)} cy={svgY(THRESHOLD_TPR)} r={10}
            fill={hiThreshold ? T.amber : T.amber}
            stroke={hiThreshold ? T.amber : T.amber} strokeWidth="2"
            filter={hiThreshold ? "url(#roc-glow)" : undefined}
          />
          <rect x={svgX(THRESHOLD_FPR) + 14} y={svgY(THRESHOLD_TPR) - 18} width={120} height={28} rx="8"
            fill={T.bgDeep} stroke={T.amber} strokeWidth="1.5"
            filter={hiThreshold ? "url(#roc-glow)" : undefined}
          />
          <text x={svgX(THRESHOLD_FPR) + 74} y={svgY(THRESHOLD_TPR) + 0} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="13" fontWeight="700">Threshold</text>
        </g>
      )}

      {/* Comparison panel */}
      {compareIn > 0 && (
        <g opacity={compareIn}>
          <rect x={820} y={160} width={240} height={110} rx="12"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
          <text x={940} y={188} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            COMPARISON
          </text>
          <line x1={840} y1={212} x2={880} y2={212}
            stroke={T.textDim} strokeWidth="1.5" strokeDasharray="6 4" />
          <text x={890} y={217} fill={T.textDim} fontFamily={T.sans} fontSize="14">Random: AUC = 0.50</text>
          <line x1={840} y1={242} x2={880} y2={242}
            stroke={T.violet} strokeWidth="2.5" />
          <text x={890} y={247} fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="700">Model: AUC = 0.91</text>
        </g>
      )}
    </svg>
  );
};
