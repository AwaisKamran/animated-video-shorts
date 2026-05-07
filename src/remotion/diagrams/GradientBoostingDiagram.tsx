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

// Tree boxes
const TREES = [
  { cx: 180, label: "Tree 1", residualH: 180, color: T.cyan },
  { cx: 540, label: "Tree 2", residualH: 100, color: T.violet },
  { cx: 900, label: "Tree 3", residualH: 44,  color: T.mint },
];

const TREE_W = 140, TREE_H = 120, TREE_Y = 140;
const ERR_X_OFF = 70, ERR_W = 38;
const ERR_BASE_Y = 380;

// Mini stump shape
function stumpPath(cx: number, y: number): string {
  return `M ${cx} ${y} L ${cx - 50} ${y + 50} L ${cx - 20} ${y + 50} L ${cx - 20} ${y + TREE_H} L ${cx + 20} ${y + TREE_H} L ${cx + 20} ${y + 50} L ${cx + 50} ${y + 50} Z`;
}

// Cumulative fit curve
function fitY(t: number, stage: number): number {
  const base = 0.08 + 0.82 * Math.exp(-t * 4.0);
  if (stage === 1) return base;
  if (stage === 2) return base * 0.55;
  return base * 0.25;
}

const CURVE_X0 = 80, CURVE_X1 = 1000, CURVE_Y_TOP = 520, CURVE_Y_BOT = 670;
const CW = CURVE_X1 - CURVE_X0, CH = CURVE_Y_BOT - CURVE_Y_TOP;

function buildCurve(stage: number, prog: number, n = 60): string {
  const count = Math.max(2, Math.floor(prog * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const x = CURVE_X0 + t * CW;
    const y = CURVE_Y_BOT - fitY(t, stage) * CH;
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

export const GradientBoostingDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const tree1In    = p(frame, duration, 0.00, 0.15);
  const tree2In    = p(frame, duration, 0.15, 0.40);
  const tree3In    = p(frame, duration, 0.40, 0.65);
  const connIn     = p(frame, duration, 0.65, 0.85);
  const curveIn    = p(frame, duration, 0.85, 1.00);

  const hiBoosting  = hi("BOOSTING");
  const hiResidual  = hi("RESIDUAL");
  const hiWeak      = hi("WEAK LEARNER");

  const treeOpacities = [tree1In, tree2In, tree3In];
  const visibleTrees = tree1In > 0 ? (tree2In > 0 ? (tree3In > 0 ? 3 : 2) : 1) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="gb-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {TREES.map((tree, ti) => {
        if (ti >= visibleTrees && treeOpacities[ti] <= 0) return null;
        const alpha = treeOpacities[ti];
        const isWeak = hiWeak;

        return (
          <g key={ti} opacity={alpha}>
            {/* Tree box */}
            <rect x={tree.cx - TREE_W / 2} y={TREE_Y} width={TREE_W} height={TREE_H} rx="12"
              fill={tree.color} fillOpacity={isWeak ? 0.2 : 0.12}
              stroke={tree.color} strokeWidth={isWeak ? 2.5 : 1.5}
              filter={isWeak ? "url(#gb-glow)" : undefined}
            />
            <text x={tree.cx} y={TREE_Y + 38} textAnchor="middle"
              fill={tree.color} fontFamily={T.sans} fontSize="14" fontWeight="800">
              {tree.label}
            </text>
            <text x={tree.cx} y={TREE_Y + 62} textAnchor="middle"
              fill={T.textDim} fontFamily={T.sans} fontSize="11">
              {ti === 0 ? "Initial fit" : `Fit residuals`}
            </text>
            <text x={tree.cx} y={TREE_Y + 80} textAnchor="middle"
              fill={T.textDim} fontFamily={T.mono} fontSize="11">
              {ti === 0 ? "from data" : `of Tree ${ti}`}
            </text>

            {/* Error bar */}
            <rect x={tree.cx + ERR_X_OFF} y={ERR_BASE_Y - tree.residualH} width={ERR_W} height={tree.residualH} rx="4"
              fill={T.coral} fillOpacity={hiResidual ? 0.7 : 0.45}
              stroke={T.coral} strokeWidth={hiResidual ? 2 : 1}
              filter={hiResidual ? "url(#gb-glow)" : undefined}
            />
            <text x={tree.cx + ERR_X_OFF + ERR_W / 2} y={ERR_BASE_Y - tree.residualH - 10} textAnchor="middle"
              fill={hiResidual ? T.coral : T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700"
              filter={hiResidual ? "url(#gb-glow)" : undefined}>
              ERR
            </text>
            <text x={tree.cx + ERR_X_OFF + ERR_W / 2} y={ERR_BASE_Y + 16} textAnchor="middle"
              fill={T.textDim} fontFamily={T.mono} fontSize="10">
              {ti === 0 ? "high" : ti === 1 ? "less" : "low"}
            </text>
          </g>
        );
      })}

      {/* Connecting arrows + "+" symbols */}
      {connIn > 0 && (
        <g opacity={connIn}>
          {[0, 1].map((i) => {
            const from = TREES[i];
            const to = TREES[i + 1];
            return (
              <g key={i}>
                <line x1={from.cx + TREE_W / 2 + 4} y1={TREE_Y + TREE_H / 2}
                      x2={to.cx - TREE_W / 2 - 4} y2={TREE_Y + TREE_H / 2}
                  stroke={hiBoosting ? T.cyan : T.borderStrong} strokeWidth={hiBoosting ? 2.5 : 1.5}
                  filter={hiBoosting ? "url(#gb-glow)" : undefined}
                />
                <polygon
                  points={`${to.cx - TREE_W / 2 - 4},${TREE_Y + TREE_H / 2 - 7} ${to.cx - TREE_W / 2 + 8},${TREE_Y + TREE_H / 2} ${to.cx - TREE_W / 2 - 4},${TREE_Y + TREE_H / 2 + 7}`}
                  fill={hiBoosting ? T.cyan : T.borderStrong}
                  filter={hiBoosting ? "url(#gb-glow)" : undefined}
                />
                <text x={(from.cx + to.cx) / 2} y={TREE_Y + TREE_H / 2 - 14} textAnchor="middle"
                  fill={T.textSecondary} fontFamily={T.mono} fontSize="24" fontWeight="900">
                  +
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Cumulative curve */}
      {curveIn > 0 && (
        <g opacity={curveIn}>
          <line x1={CURVE_X0} y1={CURVE_Y_TOP - 10} x2={CURVE_X0} y2={CURVE_Y_BOT + 5}
            stroke={T.border} strokeWidth="1.5" />
          <line x1={CURVE_X0 - 10} y1={CURVE_Y_BOT} x2={CURVE_X1 + 10} y2={CURVE_Y_BOT}
            stroke={T.border} strokeWidth="1.5" />
          <text x={CURVE_X0 - 12} y={CURVE_Y_TOP + 4} textAnchor="end"
            fill={T.textDim} fontFamily={T.sans} fontSize="11">Error</text>
          <text x={CURVE_X1 + 12} y={CURVE_Y_BOT + 5} textAnchor="start"
            fill={T.textDim} fontFamily={T.sans} fontSize="11">Complexity →</text>
          <polyline points={buildCurve(3, curveIn)}
            fill="none" stroke={T.mint} strokeWidth="2.5" />
          <rect x={W / 2 - 90} y={CURVE_Y_TOP - 36} width={180} height={28} rx="14"
            fill={T.mint} fillOpacity={0.12} />
          <text x={W / 2} y={CURVE_Y_TOP - 16} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="0.5">
            ERROR REDUCED
          </text>
        </g>
      )}
    </svg>
  );
};
