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

const CHART_X0 = 120, CHART_X1 = 940, CHART_Y0 = 80, CHART_Y1 = 560;
const CHART_W = CHART_X1 - CHART_X0;
const CHART_H = CHART_Y1 - CHART_Y0;

function svgX(t: number) { return CHART_X0 + t * CHART_W; }
function svgY(loss: number) { return CHART_Y1 - loss * CHART_H; }

// Training loss: starts high, drops steadily (exponential decay)
function trainLoss(t: number): number {
  return 0.10 + 0.80 * Math.exp(-t * 4.5);
}

// Validation loss: drops, then rises (generalization gap)
function valLoss(t: number): number {
  if (t < 0.55) {
    return 0.14 + 0.76 * Math.exp(-t * 4.0);
  }
  return 0.16 + 0.4 * (t - 0.55) * (t - 0.55) * 8;
}

// Best model x position (where val loss is minimum)
const BEST_X = 0.52;

function buildPath(fn: (t: number) => number, progress: number, nPts = 120): string {
  const count = Math.max(2, Math.floor(progress * nPts));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (nPts - 1);
    pts.push(`${svgX(t)},${svgY(fn(t))}`);
  }
  return pts.join(" ");
}

export const OverfitDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.00, 0.20);
  const curvesIn  = p(frame, duration, 0.20, 0.85);
  const markerIn  = p(frame, duration, 0.85, 1.00);

  const hiOverfit = hi("OVERFIT");
  const hiVal     = hi("VALIDATION");
  const hiGen     = hi("GENERALIZATION");

  const gridLines = [0.2, 0.4, 0.6, 0.8];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="of-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Grid lines ── */}
      <g opacity={axesIn}>
        {gridLines.map((gl, i) => (
          <line key={i} x1={CHART_X0} y1={svgY(gl)} x2={CHART_X1} y2={svgY(gl)}
            stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
        ))}
      </g>

      {/* ── Axes ── */}
      <g opacity={axesIn}>
        <line x1={CHART_X0} y1={CHART_Y0 - 20} x2={CHART_X0} y2={CHART_Y1 + 20}
          stroke={T.border} strokeWidth="2" />
        <line x1={CHART_X0 - 20} y1={CHART_Y1} x2={CHART_X1 + 20} y2={CHART_Y1}
          stroke={T.border} strokeWidth="2" />

        <text x={CHART_X0 - 16} y={CHART_Y0 - 4} textAnchor="end"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="600">Loss</text>
        <text x={CHART_X1 + 20} y={CHART_Y1 + 6} textAnchor="start"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="600">Epochs</text>
      </g>

      {/* ── Legend ── */}
      <g opacity={axesIn}>
        <line x1={CHART_X1 - 220} y1={CHART_Y0 + 10} x2={CHART_X1 - 180} y2={CHART_Y0 + 10}
          stroke={T.cyan} strokeWidth="2.5" />
        <text x={CHART_X1 - 170} y={CHART_Y0 + 14} fill={T.cyan}
          fontFamily={T.sans} fontSize="14" fontWeight="600">Train Loss</text>

        <line x1={CHART_X1 - 220} y1={CHART_Y0 + 36} x2={CHART_X1 - 180} y2={CHART_Y0 + 36}
          stroke={hiVal ? "#FF6688" : T.coral} strokeWidth="2.5" />
        <text x={CHART_X1 - 170} y={CHART_Y0 + 40} fill={hiVal ? "#FF6688" : T.coral}
          fontFamily={T.sans} fontSize="14" fontWeight="600">Val Loss</text>
      </g>

      {/* ── Training loss curve ── */}
      {curvesIn > 0 && (
        <polyline points={buildPath(trainLoss, curvesIn)}
          fill="none" stroke={T.cyan} strokeWidth="3" />
      )}

      {/* ── Validation loss curve ── */}
      {curvesIn > 0 && (
        <polyline
          points={buildPath(valLoss, curvesIn)}
          fill="none"
          stroke={hiVal ? "#FF6688" : T.coral}
          strokeWidth={hiVal ? 3.5 : 3}
          filter={hiVal ? "url(#of-glow)" : undefined}
        />
      )}

      {/* ── Best model marker ── */}
      {markerIn > 0 && (
        <g opacity={markerIn}>
          {/* Vertical dashed line */}
          <line x1={svgX(BEST_X)} y1={CHART_Y0} x2={svgX(BEST_X)} y2={CHART_Y1}
            stroke={T.mint} strokeWidth="2" strokeDasharray="8 5" />
          <rect x={svgX(BEST_X) - 62} y={CHART_Y0 - 40} width={124} height={32} rx="16"
            fill={T.mint} opacity={0.15} />
          <text x={svgX(BEST_X)} y={CHART_Y0 - 18} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="0.5">
            BEST MODEL
          </text>

          {/* Overfit zone shading */}
          <rect x={svgX(BEST_X)} y={CHART_Y0} width={CHART_X1 - svgX(BEST_X)} height={CHART_H}
            fill={hiOverfit ? T.coral : T.coral} fillOpacity={hiOverfit ? 0.12 : 0.07} />
          <text x={svgX(BEST_X) + (CHART_X1 - svgX(BEST_X)) / 2} y={CHART_Y0 + 36}
            textAnchor="middle"
            fill={hiOverfit ? "#FF6688" : T.coral}
            fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1"
            opacity={hiOverfit ? 0.9 : 0.5}>
            OVERFIT ZONE
          </text>
        </g>
      )}

      {/* ── Generalization label ── */}
      {markerIn > 0 && hiGen && (
        <g opacity={markerIn}>
          <text x={svgX(0.25)} y={CHART_Y1 + 50} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="600" letterSpacing="1">
            ← GOOD GENERALIZATION
          </text>
        </g>
      )}
    </svg>
  );
};
