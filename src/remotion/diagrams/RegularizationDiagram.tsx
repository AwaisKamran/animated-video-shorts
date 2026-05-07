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

// Two panels side by side
const L_X0 = 60, L_X1 = 480;
const R_X0 = 560, R_X1 = 980;
const CHART_Y0 = 130, CHART_Y1 = 520;
const L_W = L_X1 - L_X0;
const CHART_H = CHART_Y1 - CHART_Y0;

function lSvgX(t: number) { return L_X0 + t * L_W; }
function rSvgX(t: number) { return R_X0 + t * (R_X1 - R_X0); }
function svgY(v: number) { return CHART_Y1 - v * CHART_H; }

// Scatter data: 10 points that loosely follow a linear trend
const SCATTER = [
  { t: 0.08, v: 0.22 }, { t: 0.16, v: 0.28 }, { t: 0.24, v: 0.32 },
  { t: 0.32, v: 0.45 }, { t: 0.40, v: 0.48 }, { t: 0.50, v: 0.55 },
  { t: 0.60, v: 0.62 }, { t: 0.68, v: 0.70 }, { t: 0.77, v: 0.75 },
  { t: 0.88, v: 0.82 },
];

// Overfit curve: wiggly polynomial that passes through all points
function overfitCurve(t: number): number {
  return (
    0.04 +
    0.85 * t +
    0.25 * Math.sin(t * Math.PI * 4) +
    0.12 * Math.sin(t * Math.PI * 8) -
    0.06 * Math.cos(t * Math.PI * 6)
  );
}

// Smooth/regularized curve: gentle linear-ish fit
function regularizedCurve(t: number): number {
  return 0.12 + 0.76 * t;
}

function buildCurvePath(fn: (t: number) => number, progress: number, nPts = 80): string {
  const count = Math.max(2, Math.floor(progress * nPts));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (nPts - 1);
    pts.push(`${lSvgX(t)},${svgY(Math.max(0.02, Math.min(0.98, fn(t))))}`);
  }
  return pts.join(" ");
}

function buildRightCurvePath(fn: (t: number) => number, progress: number, nPts = 80): string {
  const count = Math.max(2, Math.floor(progress * nPts));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (nPts - 1);
    pts.push(`${rSvgX(t)},${svgY(Math.max(0.02, Math.min(0.98, fn(t))))}`);
  }
  return pts.join(" ");
}

export const RegularizationDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const pointsIn   = p(frame, duration, 0.00, 0.20);
  const overfitIn  = p(frame, duration, 0.20, 0.50);
  const smoothIn   = p(frame, duration, 0.50, 0.72);
  const lambdaIn   = p(frame, duration, 0.72, 0.86);
  const conclusionIn = p(frame, duration, 0.86, 1.00);

  const hiReg    = hi("REGULARIZATION");
  const hiOver   = hi("OVERFIT");
  const hiLambda = hi("LAMBDA");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="reg-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="reg-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Panel headers ── */}
      <g opacity={pointsIn}>
        <text x={(L_X0 + L_X1) / 2} y={90} textAnchor="middle"
          fill={hiOver ? "#FF6688" : T.coral}
          fontFamily={T.sans} fontSize="15" fontWeight="700" letterSpacing="1">
          NO REGULARIZATION
        </text>
        <text x={(R_X0 + R_X1) / 2} y={90} textAnchor="middle"
          fill={hiReg ? T.mint : T.mint}
          fontFamily={T.sans} fontSize="15" fontWeight="700" letterSpacing="1"
          filter={hiReg ? "url(#reg-glow-sm)" : undefined}>
          WITH L2 REG
        </text>
      </g>

      {/* ── Panel axes ── */}
      <g opacity={pointsIn * 0.4}>
        <line x1={L_X0} y1={CHART_Y0} x2={L_X0} y2={CHART_Y1} stroke={T.border} strokeWidth="1.5" />
        <line x1={L_X0} y1={CHART_Y1} x2={L_X1} y2={CHART_Y1} stroke={T.border} strokeWidth="1.5" />
        <line x1={R_X0} y1={CHART_Y0} x2={R_X0} y2={CHART_Y1} stroke={T.border} strokeWidth="1.5" />
        <line x1={R_X0} y1={CHART_Y1} x2={R_X1} y2={CHART_Y1} stroke={T.border} strokeWidth="1.5" />
      </g>

      {/* ── Center divider ── */}
      <line x1={520} y1={60} x2={520} y2={660}
        stroke={T.border} strokeWidth="1" strokeDasharray="8 6"
        opacity={pointsIn}
      />

      {/* ── Scatter points (both panels) ── */}
      {SCATTER.map((pt, i) => (
        <React.Fragment key={i}>
          <circle cx={lSvgX(pt.t)} cy={svgY(pt.v)} r={6}
            fill={T.textSecondary} opacity={pointsIn * 0.75} />
          <circle cx={rSvgX(pt.t)} cy={svgY(pt.v)} r={6}
            fill={T.textSecondary} opacity={pointsIn * 0.75} />
        </React.Fragment>
      ))}

      {/* ── Left: Overfit curve ── */}
      {overfitIn > 0 && (
        <polyline points={buildCurvePath(overfitCurve, overfitIn)}
          fill="none"
          stroke={hiOver ? "#FF6688" : T.coral}
          strokeWidth={hiOver ? 3.5 : 3}
          filter={hiOver ? "url(#reg-glow-sm)" : undefined}
        />
      )}

      {/* ── Right: Smooth regularized curve ── */}
      {smoothIn > 0 && (
        <polyline points={buildRightCurvePath(regularizedCurve, smoothIn)}
          fill="none"
          stroke={hiReg ? T.mint : T.mint}
          strokeWidth={hiReg ? 3.5 : 3}
          filter={hiReg ? "url(#reg-glow-sm)" : undefined}
        />
      )}

      {/* ── Lambda symbol ── */}
      {lambdaIn > 0 && (
        <g opacity={lambdaIn}>
          <rect x={(R_X0 + R_X1) / 2 - 70} y={CHART_Y0 + 20} width={140} height={54} rx="10"
            fill={hiLambda ? `${T.mint}22` : T.bgPanel}
            stroke={hiLambda ? T.mint : T.borderStrong} strokeWidth={hiLambda ? 2 : 1.5}
            filter={hiLambda ? "url(#reg-glow-sm)" : undefined}
          />
          <text x={(R_X0 + R_X1) / 2} y={CHART_Y0 + 44} textAnchor="middle"
            fill={hiLambda ? T.mint : T.textSecondary}
            fontFamily={T.mono} fontSize="18" fontWeight="700">
            λ = 0.01
          </text>
          <text x={(R_X0 + R_X1) / 2} y={CHART_Y0 + 64} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="1">
            PENALTY
          </text>
        </g>
      )}

      {/* ── Conclusion ── */}
      {conclusionIn > 0 && (
        <g opacity={conclusionIn}>
          <text x={W / 2} y={610} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="17" fontWeight="600" letterSpacing="0.5">
            Simpler model generalizes better
          </text>
        </g>
      )}
    </svg>
  );
};
