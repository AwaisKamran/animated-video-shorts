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

// Left panel (Ridge L2): center 270, Right panel (Lasso L1): center 810
const PANELS = [
  { cx: 270, label: "RIDGE  L2", sublabel: "Ridge → small weights", key: "L2", constraint: "circle", color: T.cyan },
  { cx: 810, label: "LASSO  L1", sublabel: "Lasso → sparse weights", key: "L1", constraint: "diamond", color: T.violet },
];

const CY = 330;
const AXIS_R = 200;

// Ellipse loss contour radii (multiple contours)
const CONTOURS = [
  { rx: 80, ry: 50 },
  { rx: 130, ry: 80 },
  { rx: 180, ry: 110 },
];

// Optimal points
const RIDGE_OPT = { x: -30, y: -55 };   // smooth intersection on circle
const LASSO_OPT = { x: -120, y: 0 };    // corner of diamond (w2=0)

export const RidgeLassoDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn       = p(frame, duration, 0.00, 0.25);
  const contoursIn   = p(frame, duration, 0.25, 0.50);
  const constraintIn = p(frame, duration, 0.50, 0.75);
  const optIn        = p(frame, duration, 0.75, 0.90);
  const labelsIn     = p(frame, duration, 0.90, 1.00);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rl-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Divider */}
      <line x1={W / 2} y1={40} x2={W / 2} y2={660}
        stroke={T.borderStrong} strokeWidth="1" strokeDasharray="6 4"
        opacity={axesIn} />

      {PANELS.map((panel) => {
        const hiL   = hi(panel.key);
        const hiKey = (panel.key === "L2" && hi("RIDGE")) || (panel.key === "L1" && hi("LASSO")) || (panel.key === "L1" && hi("SPARSE"));
        const isHi = hiL || hiKey;
        const opt = panel.constraint === "circle" ? RIDGE_OPT : LASSO_OPT;

        return (
          <g key={panel.key}>
            {/* Panel title */}
            <text x={panel.cx} y={60} textAnchor="middle"
              fill={isHi ? panel.color : T.textSecondary}
              fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="1.5"
              opacity={axesIn}
              filter={isHi ? "url(#rl-glow)" : undefined}>
              {panel.label}
            </text>

            {/* Axes */}
            <g opacity={axesIn}>
              <line x1={panel.cx - AXIS_R} y1={CY} x2={panel.cx + AXIS_R} y2={CY}
                stroke={T.border} strokeWidth="1.5" />
              <line x1={panel.cx} y1={CY - AXIS_R} x2={panel.cx} y2={CY + AXIS_R}
                stroke={T.border} strokeWidth="1.5" />
              <text x={panel.cx + AXIS_R + 10} y={CY + 4}
                fill={T.textDim} fontFamily={T.mono} fontSize="12">w₁</text>
              <text x={panel.cx + 4} y={CY - AXIS_R - 8}
                fill={T.textDim} fontFamily={T.mono} fontSize="12">w₂</text>
            </g>

            {/* Loss contours (ellipses, centered slightly off from origin to look realistic) */}
            {contoursIn > 0 && CONTOURS.map((c, ci) => {
              const alpha = Math.max(0, Math.min(1, contoursIn * 3 - ci));
              return (
                <ellipse key={ci}
                  cx={panel.cx + 60} cy={CY - 40}
                  rx={c.rx * alpha} ry={c.ry * alpha}
                  fill="none"
                  stroke={T.amber} strokeWidth="1.5"
                  strokeOpacity={0.35 + ci * 0.1}
                  strokeDasharray="5 3"
                />
              );
            })}

            {/* Constraint region */}
            {constraintIn > 0 && (
              <g opacity={constraintIn}>
                {panel.constraint === "circle" ? (
                  <circle cx={panel.cx} cy={CY} r={120 * constraintIn}
                    fill={T.cyan} fillOpacity={0.12}
                    stroke={T.cyan} strokeWidth={isHi ? 2.5 : 1.5}
                    filter={isHi ? "url(#rl-glow)" : undefined}
                  />
                ) : (
                  <polygon
                    points={`${panel.cx},${CY - 120 * constraintIn} ${panel.cx + 120 * constraintIn},${CY} ${panel.cx},${CY + 120 * constraintIn} ${panel.cx - 120 * constraintIn},${CY}`}
                    fill={T.violet} fillOpacity={0.12}
                    stroke={T.violet} strokeWidth={isHi ? 2.5 : 1.5}
                    filter={isHi ? "url(#rl-glow)" : undefined}
                  />
                )}
              </g>
            )}

            {/* Optimal point star */}
            {optIn > 0 && (
              <g opacity={optIn}>
                <circle cx={panel.cx + opt.x} cy={CY + opt.y} r="10"
                  fill={panel.color} fillOpacity={0.9}
                  stroke={panel.color} strokeWidth="2"
                  filter="url(#rl-glow)" />
                <text x={panel.cx + opt.x + 14} y={CY + opt.y - 14}
                  fill={panel.color} fontFamily={T.mono} fontSize="11" fontWeight="700">
                  {panel.constraint === "circle" ? "β*" : "β* (sparse)"}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Bottom labels */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          <text x={270} y={590} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700">
            Ridge → shrinks weights to near zero
          </text>
          <text x={810} y={590} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700">
            Lasso → sparse weights, feature selection
          </text>
        </g>
      )}
    </svg>
  );
};
