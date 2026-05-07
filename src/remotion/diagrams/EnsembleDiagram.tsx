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

// 4 trees across the top
const TREES = [
  { cx: 170, vote: "Cat",  color: "#00D4A0" },
  { cx: 390, vote: "Dog",  color: "#F5506B" },
  { cx: 610, vote: "Cat",  color: "#00D4A0" },
  { cx: 830, vote: "Cat",  color: "#00D4A0" },
];

const TREE_TY = 100; // top of tree box
const TREE_W = 160, TREE_H = 220;
const VOTE_CX = W / 2;
const VOTE_CY = 500;

// Simple 2-level decision tree rendered as rectangles/lines
function SmallTree({ cx, cy }: { cx: number; cy: number }) {
  const rootW = 110, rootH = 32, nodeW = 82, nodeH = 28;
  const rx = cx - rootW / 2, ry = cy;
  const L1_Y = cy + 80;
  const R1_Y = cy + 80;
  const L1_X = cx - 55, R1_X = cx + 55;

  return (
    <g>
      {/* Root */}
      <rect x={rx} y={ry} width={rootW} height={rootH} rx="6"
        fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
      <text x={cx} y={ry + 20} textAnchor="middle"
        fill={T.textDim} fontFamily={T.mono} fontSize="11">x &lt; 0.5?</text>
      {/* Lines to children */}
      <line x1={cx} y1={ry + rootH} x2={L1_X} y2={L1_Y}
        stroke={T.borderStrong} strokeWidth="1.5" />
      <line x1={cx} y1={ry + rootH} x2={R1_X} y2={R1_Y}
        stroke={T.borderStrong} strokeWidth="1.5" />
      {/* Left leaf */}
      <rect x={L1_X - nodeW / 2} y={L1_Y} width={nodeW} height={nodeH} rx="6"
        fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
      <text x={L1_X} y={L1_Y + 18} textAnchor="middle"
        fill={T.textDim} fontFamily={T.mono} fontSize="10">leaf</text>
      {/* Right leaf */}
      <rect x={R1_X - nodeW / 2} y={R1_Y} width={nodeW} height={nodeH} rx="6"
        fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
      <text x={R1_X} y={R1_Y + 18} textAnchor="middle"
        fill={T.textDim} fontFamily={T.mono} fontSize="10">leaf</text>
    </g>
  );
}

export const EnsembleDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const treesIn    = p(frame, duration, 0.00, 0.20);
  const votesIn    = p(frame, duration, 0.20, 0.55);
  const arrowsIn   = p(frame, duration, 0.55, 0.75);
  const tallyIn    = p(frame, duration, 0.75, 0.90);
  const finalIn    = p(frame, duration, 0.90, 1.00);

  const hiEnsemble = hi("ENSEMBLE");
  const hiVote     = hi("VOTE");
  const hiRF       = hi("RANDOM FOREST");
  const hiBagging  = hi("BAGGING");

  const nVotes = Math.floor(votesIn * TREES.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="en-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Tree boxes */}
      {treesIn > 0 && TREES.map((tree, i) => (
        <g key={i} opacity={treesIn}
          filter={hiEnsemble ? "url(#en-glow)" : undefined}>
          <rect x={tree.cx - TREE_W / 2} y={TREE_TY} width={TREE_W} height={TREE_H} rx="12"
            fill={T.bgDeep}
            stroke={hiEnsemble ? T.amber : T.borderStrong}
            strokeWidth={hiEnsemble ? 2 : 1.5}
          />
          <SmallTree cx={tree.cx} cy={TREE_TY + 30} />
          <text x={tree.cx} y={TREE_TY + 248} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="600">
            Tree {i + 1}
          </text>
        </g>
      ))}

      {/* Vote badges */}
      {TREES.map((tree, i) => {
        if (i >= nVotes) return null;
        return (
          <g key={`vote-${i}`} opacity={Math.min((votesIn * 4 - i), 1)}>
            <rect x={tree.cx - 40} y={TREE_TY + TREE_H + 36} width={80} height={32} rx="8"
              fill={tree.color} fillOpacity={0.2}
              stroke={tree.color} strokeWidth="2"
            />
            <text x={tree.cx} y={TREE_TY + TREE_H + 57} textAnchor="middle"
              fill={tree.color} fontFamily={T.sans} fontSize="15" fontWeight="700">
              {tree.vote}
            </text>
          </g>
        );
      })}

      {/* Arrows to vote aggregator */}
      {arrowsIn > 0 && TREES.map((tree, i) => {
        const alpha = Math.min((arrowsIn * 2 - i * 0.5), 1);
        if (alpha <= 0) return null;
        const sy = TREE_TY + TREE_H + 68;
        const ey = VOTE_CY - 40;
        return (
          <line key={`arr-${i}`}
            x1={tree.cx} y1={sy}
            x2={VOTE_CX} y2={ey}
            stroke={hiVote ? T.amber : T.borderStrong}
            strokeWidth="1.5"
            opacity={alpha * 0.8}
            strokeDasharray="6 4"
          />
        );
      })}

      {/* Vote aggregator box */}
      {arrowsIn > 0 && (
        <g opacity={arrowsIn}>
          <rect x={VOTE_CX - 150} y={VOTE_CY - 40} width={300} height={80} rx="14"
            fill={T.bgDeep}
            stroke={hiVote ? T.amber : T.borderStrong}
            strokeWidth={hiVote ? 2.5 : 1.5}
            filter={hiVote ? "url(#en-glow)" : undefined}
          />
          <text x={VOTE_CX} y={VOTE_CY - 12} textAnchor="middle"
            fill={hiVote ? T.amber : T.textSecondary}
            fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="2">
            MAJORITY VOTE
          </text>

          {/* Tally */}
          {tallyIn > 0 && (
            <g opacity={tallyIn}>
              <text x={VOTE_CX} y={VOTE_CY + 22} textAnchor="middle"
                fill={T.textPrimary} fontFamily={T.mono} fontSize="17" fontWeight="700">
                Cat: 3 &nbsp;|&nbsp; Dog: 1
              </text>
            </g>
          )}
        </g>
      )}

      {/* Final prediction badge */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={VOTE_CX - 140} y={618} width={280} height={64} rx="14"
            fill={T.mint} fillOpacity={0.18}
            stroke={T.mint} strokeWidth="2.5"
            filter="url(#en-glow)"
          />
          <text x={VOTE_CX} y={644} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="1">
            CAT
          </text>
          <text x={VOTE_CX} y={666} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="600" letterSpacing="1">
            {hiRF ? "RANDOM FOREST" : hiBagging ? "BAGGING" : "MAJORITY VOTE"}
          </text>
        </g>
      )}
    </svg>
  );
};
