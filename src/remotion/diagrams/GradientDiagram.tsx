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

// Loss curve: parabola sampled at multiple x positions in SVG space
const CHART_X0 = 120, CHART_X1 = 920, CHART_Y0 = 100, CHART_Y1 = 580;
const CHART_W = CHART_X1 - CHART_X0;
const CHART_H = CHART_Y1 - CHART_Y0;

// Parabola: loss(t) = a*(t - min_t)^2 + min_loss, t in [0,1]
const MIN_T = 0.62;  // minimum is at 62% of x range
const A = 3.2;
const MIN_LOSS = 0.08;

function lossAt(t: number): number {
  return A * (t - MIN_T) ** 2 + MIN_LOSS;
}

function toSvgX(t: number) { return CHART_X0 + t * CHART_W; }
function toSvgY(loss: number) {
  const maxLoss = lossAt(0);
  return CHART_Y1 - ((loss - 0) / (maxLoss - 0)) * CHART_H;
}

// Generate the curve path
function curvePoints(nPts = 120): string {
  const pts: string[] = [];
  for (let i = 0; i <= nPts; i++) {
    const t = i / nPts;
    pts.push(`${toSvgX(t)},${toSvgY(lossAt(t))}`);
  }
  return pts.join(" ");
}

// Ball step positions along the descent
const BALL_STEPS = [0.08, 0.20, 0.32, 0.44, 0.54, MIN_T];

export const GradientDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.0, 0.2);
  const ballMove  = p(frame, duration, 0.2, 0.85);
  const converge  = p(frame, duration, 0.85, 1.0);

  const highlightGrad = hi("GRADIENT");
  const highlightLR   = hi("LEARNING RATE");
  const highlightMin  = hi("MINIMUM");

  // How many steps are visible based on ballMove progress
  const visibleSteps = Math.floor(ballMove * (BALL_STEPS.length - 1));
  const stepFrac = (ballMove * (BALL_STEPS.length - 1)) % 1;

  // Ball position: interpolate between current step and next
  const currentT = BALL_STEPS[visibleSteps] ?? BALL_STEPS[BALL_STEPS.length - 1];
  const nextT = BALL_STEPS[Math.min(visibleSteps + 1, BALL_STEPS.length - 1)];
  const ballT = currentT + (nextT - currentT) * stepFrac;
  const ballSvgX = toSvgX(ballT);
  const ballSvgY = toSvgY(lossAt(ballT));

  // Gradient arrow direction (tangent of parabola)
  const slope = 2 * A * (ballT - MIN_T);  // d/dt of loss
  const arrowLen = 60;
  const norm = Math.sqrt(1 + slope * slope);
  const arrowDx = -(1 / norm) * arrowLen;   // move in negative t direction (downhill)
  const arrowDy = -(slope / norm) * arrowLen;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="gd-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="gd-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="arrow-grad" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
        <marker id="arrow-converge" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* Axes */}
      <g opacity={axesIn}>
        {/* Y axis */}
        <line x1={CHART_X0} y1={CHART_Y0 - 20} x2={CHART_X0} y2={CHART_Y1 + 20}
          stroke={T.border} strokeWidth="2" />
        {/* X axis */}
        <line x1={CHART_X0 - 20} y1={CHART_Y1} x2={CHART_X1 + 20} y2={CHART_Y1}
          stroke={T.border} strokeWidth="2" />

        {/* Axis labels */}
        <text x={CHART_X0 - 24} y={CHART_Y0} textAnchor="end"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="600">Loss</text>
        <text x={CHART_X1 + 24} y={CHART_Y1 + 6} textAnchor="start"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="600">θ</text>
        <text x={CHART_X0 - 16} y={CHART_Y1 + 6} textAnchor="end"
          fill={T.textDim} fontFamily={T.sans} fontSize="12">Parameter</text>
      </g>

      {/* Loss curve — draw in with clip trick */}
      {axesIn > 0 && (
        <g opacity={axesIn}>
          <polyline points={curvePoints(120)}
            fill="none"
            stroke={T.violet}
            strokeWidth="3.5"
            filter="url(#gd-glow-sm)"
          />
          {/* Subtle fill under curve */}
          <polyline
            points={`${CHART_X0},${CHART_Y1} ${curvePoints(120)} ${CHART_X1},${CHART_Y1}`}
            fill={T.violet} fillOpacity="0.06"
            stroke="none"
          />
        </g>
      )}

      {/* Previous ball step positions (ghost trail) */}
      {ballMove > 0 && BALL_STEPS.slice(0, visibleSteps).map((t, si) => {
        const sx = toSvgX(t);
        const sy = toSvgY(lossAt(t));
        return (
          <circle key={si} cx={sx} cy={sy} r={8}
            fill={T.amber} opacity={0.25 + si * 0.1} />
        );
      })}

      {/* Step arrows between positions */}
      {ballMove > 0 && BALL_STEPS.slice(0, visibleSteps).map((t, si) => {
        if (si === 0) return null;
        const prevX = toSvgX(BALL_STEPS[si - 1]);
        const prevY = toSvgY(lossAt(BALL_STEPS[si - 1]));
        const curX = toSvgX(t);
        const curY = toSvgY(lossAt(t));
        const mx = (prevX + curX) / 2;
        const my = (prevY + curY) / 2;

        // LR step size label
        const stepSize = BALL_STEPS[si] - BALL_STEPS[si - 1];
        const stepLabel = (Math.abs(stepSize) * 10).toFixed(2);

        return (
          <g key={si}>
            <line x1={prevX} y1={prevY} x2={curX} y2={curY}
              stroke={T.amber} strokeWidth="1.5" strokeDasharray="5 3" opacity={0.5}
              markerEnd="url(#arrow-grad)"
            />
            {highlightLR && (
              <text x={mx + 12} y={my} textAnchor="start"
                fill={T.amber} fontFamily={T.mono} fontSize="11" opacity={0.7}>
                α={stepLabel}
              </text>
            )}
          </g>
        );
      })}

      {/* Gradient arrow at current ball position */}
      {ballMove > 0 && ballMove < 0.9 && (
        <g opacity={Math.min(ballMove * 3, 1)}>
          <line x1={ballSvgX} y1={ballSvgY}
            x2={ballSvgX + arrowDx} y2={ballSvgY + arrowDy}
            stroke={highlightGrad ? "#FFB830" : T.amber}
            strokeWidth="2.5"
            markerEnd="url(#arrow-grad)"
          />
          <text x={ballSvgX + arrowDx - 4} y={ballSvgY + arrowDy - 10} textAnchor="middle"
            fill={highlightGrad ? "#FFB830" : T.amber} fontFamily={T.sans}
            fontSize="20" fontWeight="800">
            ∇
          </text>
        </g>
      )}

      {/* Active ball */}
      {ballMove > 0 && (
        <circle cx={ballSvgX} cy={ballSvgY} r={13}
          fill={converge > 0 ? T.mint : T.amber}
          filter={converge > 0 ? "url(#gd-glow)" : "url(#gd-glow-sm)"}
        />
      )}

      {/* Minimum vertical dashed line */}
      {converge > 0 && (
        <g opacity={converge}>
          <line x1={toSvgX(MIN_T)} y1={CHART_Y0} x2={toSvgX(MIN_T)} y2={CHART_Y1}
            stroke={highlightMin ? T.mint : T.textDim}
            strokeWidth="1.5" strokeDasharray="8 5"
          />
          <rect x={toSvgX(MIN_T) - 60} y={CHART_Y0 - 44} width={120} height={36} rx="18"
            fill={T.mint} opacity={0.15} />
          <text x={toSvgX(MIN_T)} y={CHART_Y0 - 20} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="700" letterSpacing="1">
            CONVERGED
          </text>
        </g>
      )}
    </svg>
  );
};
