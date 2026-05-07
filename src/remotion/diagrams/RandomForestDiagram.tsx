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

const TREES = [
  { cx: 145, feature: "Feature A", vote: "A", color: T.cyan },
  { cx: 385, feature: "Feature B", vote: "A", color: T.violet },
  { cx: 625, feature: "Feature C", vote: "B", color: T.cyan },
  { cx: 865, feature: "Feature A+C", vote: "A", color: T.violet },
];

// Mini tree shape paths (relative to tree center)
function treePath(cx: number, baseY: number): string {
  const top = baseY - 120;
  const mid = baseY - 60;
  const bot = baseY;
  return [
    `M ${cx} ${top}`,
    `L ${cx - 60} ${mid} L ${cx} ${mid - 20} L ${cx + 60} ${mid}`,
    `L ${cx} ${top}`,
    `M ${cx - 30} ${mid + 20} L ${cx - 90} ${bot} L ${cx + 30} ${bot}`,
    `M ${cx + 30} ${mid + 10} L ${cx + 10} ${bot} L ${cx + 90} ${bot}`,
  ].join(" ");
}

// Random data squares for subset visualization
const DATA_SUBSETS = [
  [[T.cyan, T.coral, T.cyan, T.amber], [T.coral, T.cyan, T.amber, T.cyan]],
  [[T.coral, T.violet, T.cyan, T.coral], [T.cyan, T.amber, T.violet, T.coral]],
  [[T.amber, T.cyan, T.cyan, T.violet], [T.coral, T.cyan, T.amber, T.cyan]],
  [[T.cyan, T.amber, T.coral, T.cyan], [T.violet, T.cyan, T.amber, T.coral]],
];

export const RandomForestDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const treesIn    = p(frame, duration, 0.00, 0.20);
  const featuresIn = p(frame, duration, 0.20, 0.50);
  const sampleIn   = p(frame, duration, 0.50, 0.70);
  const votesIn    = p(frame, duration, 0.70, 0.85);
  const finalIn    = p(frame, duration, 0.85, 1.00);

  const hiBagging = hi("BAGGING");
  const hiForest  = hi("RANDOM FOREST");
  const hiTrees   = hi("TREES");

  const TREE_BASE_Y = 390;
  const SUBSET_Y = 80;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rf-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {TREES.map((tree, ti) => {
        const treeAlpha = Math.max(0, Math.min(1, treesIn * 4 - ti));

        return (
          <g key={ti}>
            {/* Data subset squares */}
            <g opacity={treeAlpha * (hiBagging ? 1.0 : 0.7)}>
              {DATA_SUBSETS[ti].map((row, ri) =>
                row.map((color, ci) => (
                  <rect key={`${ri}-${ci}`}
                    x={tree.cx - 42 + ci * 22} y={SUBSET_Y + ri * 22}
                    width={18} height={18} rx="3"
                    fill={color} fillOpacity={hiBagging ? 0.55 : 0.3}
                    stroke={color} strokeWidth="1"
                    filter={hiBagging ? "url(#rf-glow)" : undefined}
                  />
                ))
              )}
              <text x={tree.cx} y={SUBSET_Y + 58} textAnchor="middle"
                fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="1">
                SUBSET
              </text>
            </g>

            {/* Tree silhouette */}
            <g opacity={treeAlpha}>
              <path d={treePath(tree.cx, TREE_BASE_Y)}
                fill={hiTrees ? tree.color : T.bgSurface}
                fillOpacity={hiTrees ? 0.2 : 0.4}
                stroke={tree.color}
                strokeWidth={hiForest || hiTrees ? 2.5 : 1.5}
                strokeOpacity={0.8}
                filter={hiTrees ? "url(#rf-glow)" : undefined}
              />
              <text x={tree.cx} y={TREE_BASE_Y + 28} textAnchor="middle"
                fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700">
                Tree {ti + 1}
              </text>
            </g>

            {/* Feature label */}
            {featuresIn > 0 && (
              <g opacity={Math.max(0, Math.min(1, featuresIn * 4 - ti))}>
                <rect x={tree.cx - 55} y={TREE_BASE_Y - 170} width={110} height={28} rx="14"
                  fill={tree.color} fillOpacity={0.15} stroke={tree.color} strokeWidth="1" strokeOpacity="0.5" />
                <text x={tree.cx} y={TREE_BASE_Y - 151} textAnchor="middle"
                  fill={tree.color} fontFamily={T.sans} fontSize="11" fontWeight="700">
                  {tree.feature}
                </text>
              </g>
            )}

            {/* Test sample flow */}
            {sampleIn > 0 && (
              <g opacity={sampleIn}>
                <circle cx={tree.cx} cy={TREE_BASE_Y - 200 + sampleIn * 80} r="8"
                  fill={T.amber} fillOpacity={0.9} stroke={T.amber} strokeWidth="1.5" />
              </g>
            )}

            {/* Vote output */}
            {votesIn > 0 && (
              <g opacity={Math.max(0, Math.min(1, votesIn * 4 - ti))}>
                <text x={tree.cx} y={TREE_BASE_Y + 68} textAnchor="middle"
                  fill={tree.vote === "A" ? T.cyan : T.coral}
                  fontFamily={T.mono} fontSize="18" fontWeight="900">
                  Class {tree.vote}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Aggregation line */}
      {votesIn > 0 && (
        <g opacity={votesIn}>
          <line x1={140} y1={TREE_BASE_Y + 85} x2={870} y2={TREE_BASE_Y + 85}
            stroke={T.borderStrong} strokeWidth="1.5" />
          {TREES.map((tree, ti) => (
            <line key={ti} x1={tree.cx} y1={TREE_BASE_Y + 75}
              x2={W / 2} y2={TREE_BASE_Y + 130}
              stroke={T.textDim} strokeWidth="1" strokeOpacity="0.4" />
          ))}
        </g>
      )}

      {/* Vote count */}
      {votesIn > 0.5 && (
        <g opacity={(votesIn - 0.5) * 2}>
          <text x={W / 2} y={TREE_BASE_Y + 155} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="15">
            Class A: 3 votes,  Class B: 1 vote
          </text>
        </g>
      )}

      {/* Final badge */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={W / 2 - 150} y={TREE_BASE_Y + 170} width={300} height={56} rx="28"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2" />
          <text x={W / 2} y={TREE_BASE_Y + 199} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1.5">
            MAJORITY VOTE
          </text>
          <text x={W / 2} y={TREE_BASE_Y + 218} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="700">
            Final: Class A
          </text>
        </g>
      )}
    </svg>
  );
};
