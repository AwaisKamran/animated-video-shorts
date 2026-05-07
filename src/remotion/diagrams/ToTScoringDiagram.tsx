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

// Tree: 1 root → 3 branches → 2 leaves each (6 leaves)
const ROOT = { id: "r",  x: 540, y: 68,  label: "Problem",  score: null, best: false };

const BRANCHES = [
  { id: "b1", x: 220, y: 210, label: "Approach A", score: 0.4, best: false },
  { id: "b2", x: 540, y: 210, label: "Approach B", score: 0.7, best: false },
  { id: "b3", x: 860, y: 210, label: "Approach C", score: 0.9, best: true  },
];

const LEAVES = [
  { id: "l1", x: 120, y: 390, label: "A-1", score: 0.3, parent: "b1", best: false },
  { id: "l2", x: 320, y: 390, label: "A-2", score: 0.5, parent: "b1", best: false },
  { id: "l3", x: 440, y: 390, label: "B-1", score: 0.6, parent: "b2", best: false },
  { id: "l4", x: 640, y: 390, label: "B-2", score: 0.8, parent: "b2", best: false },
  { id: "l5", x: 760, y: 390, label: "C-1", score: 0.95, parent: "b3", best: true  },
  { id: "l6", x: 960, y: 390, label: "C-2", score: 0.6, parent: "b3", best: false },
];

const NW = 110, NH = 44;

function scoreColor(s: number) {
  if (s >= 0.85) return T.mint;
  if (s >= 0.6)  return T.amber;
  return T.coral;
}

export const ToTScoringDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const rootIn    = p(frame, duration, 0.00, 0.16);
  const branchIn  = p(frame, duration, 0.16, 0.38);
  const leafIn    = p(frame, duration, 0.38, 0.60);
  const scoresIn  = p(frame, duration, 0.60, 0.80);
  const bestIn    = p(frame, duration, 0.80, 1.00);

  const hiScore    = hi("SCORE");
  const hiEvaluate = hi("EVALUATE");

  const nodeMap: Record<string, { x: number; y: number }> = {};
  [ROOT, ...BRANCHES, ...LEAVES].forEach(n => { nodeMap[n.id] = n; });

  function ScoreBadge({ x, y, score, show }: { x: number; y: number; score: number; show: number }) {
    if (show <= 0) return null;
    const c = scoreColor(score);
    return (
      <g opacity={Math.min(1, show * 2.5)}>
        <rect x={x - 24} y={y - 13} width={48} height={22} rx="11"
          fill={c} fillOpacity={0.20} stroke={c} strokeWidth="1.5"
        />
        <text x={x} y={y + 5} textAnchor="middle"
          fill={c} fontFamily={T.mono} fontSize="11" fontWeight="800">
          {score.toFixed(2)}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tsc-glow">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tsc-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={36} textAnchor="middle"
        fill={hiEvaluate ? T.amber : T.textDim}
        fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={rootIn}>
        TREE OF THOUGHTS · SCORING EACH NODE
      </text>

      {/* Evaluator formula */}
      <g opacity={scoresIn}>
        <rect x={W - 260} y={50} width={230} height={40} rx="10"
          fill={hiScore ? T.amber : T.nodeFill} fillOpacity={0.55}
          stroke={hiScore ? T.amber : T.border} strokeWidth={hiScore ? 2 : 1}
          filter={hiScore ? "url(#tsc-glow-sm)" : undefined}
        />
        <text x={W - 145} y={75} textAnchor="middle"
          fill={hiScore ? T.amber : T.textDim}
          fontFamily={T.mono} fontSize="12" fontWeight="700">
          f(state) → score
        </text>
      </g>

      {/* Root → Branch edges */}
      {branchIn > 0 && BRANCHES.map(b => (
        <line key={`e-${b.id}`}
          x1={ROOT.x} y1={ROOT.y + NH}
          x2={b.x} y2={b.y}
          stroke={b.best && bestIn > 0 ? T.mint : T.border}
          strokeWidth={b.best && bestIn > 0 ? 2.5 : 1.5}
          strokeDasharray={b.best && bestIn > 0 ? "none" : "4 3"}
          opacity={Math.min(1, branchIn * 2.5) * (b.best && bestIn > 0 ? 1 : 0.5)}
        />
      ))}

      {/* Branch → Leaf edges */}
      {leafIn > 0 && LEAVES.map(l => {
        const par = nodeMap[l.parent];
        return (
          <line key={`e-${l.id}`}
            x1={par.x} y1={par.y + NH}
            x2={l.x} y2={l.y}
            stroke={l.best && bestIn > 0 ? T.mint : T.border}
            strokeWidth={l.best && bestIn > 0 ? 2.5 : 1.5}
            strokeDasharray={l.best && bestIn > 0 ? "none" : "4 3"}
            opacity={Math.min(1, leafIn * 2.5) * (l.best && bestIn > 0 ? 1 : 0.4)}
          />
        );
      })}

      {/* Root node */}
      <g opacity={rootIn}>
        <rect x={ROOT.x - NW / 2} y={ROOT.y} width={NW} height={NH} rx="10"
          fill={T.cyan} fillOpacity={0.14}
          stroke={T.cyan} strokeWidth="2"
        />
        <text x={ROOT.x} y={ROOT.y + NH / 2 + 6} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="12" fontWeight="700">
          {ROOT.label}
        </text>
      </g>

      {/* Branch nodes */}
      {BRANCHES.map(b => {
        if (branchIn <= 0) return null;
        const isBest = b.best && bestIn > 0;
        const c = isBest ? T.mint : scoreColor(b.score);
        return (
          <g key={b.id} opacity={Math.min(1, branchIn * 2)}>
            <rect x={b.x - NW / 2} y={b.y} width={NW} height={NH} rx="10"
              fill={c} fillOpacity={isBest ? 0.22 : 0.12}
              stroke={c} strokeWidth={isBest ? 2.5 : 1.5}
              filter={isBest ? "url(#tsc-glow-sm)" : undefined}
            />
            <text x={b.x} y={b.y + NH / 2 + 6} textAnchor="middle"
              fill={c} fontFamily={T.sans} fontSize="11" fontWeight={isBest ? "800" : "600"}>
              {b.label}
            </text>
            <ScoreBadge x={b.x} y={b.y - 18} score={b.score} show={scoresIn} />
          </g>
        );
      })}

      {/* Leaf nodes */}
      {LEAVES.map(l => {
        if (leafIn <= 0) return null;
        const isBest = l.best && bestIn > 0;
        const c = isBest ? T.mint : scoreColor(l.score);
        return (
          <g key={l.id} opacity={Math.min(1, leafIn * 2)}>
            <rect x={l.x - NW / 2} y={l.y} width={NW} height={NH} rx="10"
              fill={c} fillOpacity={isBest ? 0.22 : 0.10}
              stroke={c} strokeWidth={isBest ? 2.5 : 1.5}
              filter={isBest ? "url(#tsc-glow)" : undefined}
            />
            <text x={l.x} y={l.y + NH / 2 + 6} textAnchor="middle"
              fill={c} fontFamily={T.sans} fontSize="11" fontWeight={isBest ? "800" : "600"}>
              {l.label}
            </text>
            <ScoreBadge x={l.x} y={l.y - 18} score={l.score} show={scoresIn} />
          </g>
        );
      })}

      {/* Best path badge */}
      {bestIn > 0 && (
        <g opacity={bestIn}>
          <rect x={W / 2 - 220} y={530} width={440} height={52} rx="26"
            fill={T.mint} fillOpacity={0.14} stroke={T.mint} strokeWidth="2"
            filter="url(#tsc-glow-sm)"
          />
          <text x={W / 2} y={562} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            BEST PATH: 0.90 → 0.95
          </text>
        </g>
      )}
    </svg>
  );
};
