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

const ROOT = { id: "r", x: 540, y: 52, label: "Problem" };

// 6 branches, 2 leaves each
const BRANCHES = [
  { id: "b1", x: 100,  y: 200, label: "Branch A", score: 0.82, keep: true  },
  { id: "b2", x: 270,  y: 200, label: "Branch B", score: 0.38, keep: false },
  { id: "b3", x: 440,  y: 200, label: "Branch C", score: 0.71, keep: true  },
  { id: "b4", x: 610,  y: 200, label: "Branch D", score: 0.29, keep: false },
  { id: "b5", x: 780,  y: 200, label: "Branch E", score: 0.55, keep: false },
  { id: "b6", x: 950,  y: 200, label: "Branch F", score: 0.90, keep: true  },
];

const LEAVES: { id: string; x: number; y: number; label: string; parent: string; keep: boolean }[] = [];
BRANCHES.forEach(b => {
  const off = 46;
  LEAVES.push({ id: `${b.id}l`, x: b.x - off, y: 370, label: "L1", parent: b.id, keep: b.keep });
  LEAVES.push({ id: `${b.id}r`, x: b.x + off, y: 370, label: "L2", parent: b.id, keep: b.keep });
});

const NW = 108, NH = 40;
const LEAF_W = 56, LEAF_H = 32;

export const ToTPruningDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const rootIn    = p(frame, duration, 0.00, 0.16);
  const treeIn    = p(frame, duration, 0.16, 0.38);
  const scoresIn  = p(frame, duration, 0.38, 0.56);
  const pruneIn   = p(frame, duration, 0.56, 0.76);
  const survivIn  = p(frame, duration, 0.76, 1.00);

  const hiPrune   = hi("PRUNE");
  const hiDeadEnd = hi("DEAD END");

  const nodeMap: Record<string, { x: number; y: number }> = {};
  [ROOT, ...BRANCHES, ...LEAVES].forEach(n => { nodeMap[n.id] = n; });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tpr-glow">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tpr-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={30} textAnchor="middle"
        fill={hiPrune ? T.coral : T.textDim}
        fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={rootIn}>
        TREE OF THOUGHTS · PRUNING DEAD ENDS
      </text>

      {/* Root → Branch edges */}
      {treeIn > 0 && BRANCHES.map(b => {
        const pruned = !b.keep && pruneIn > 0;
        const survived = b.keep && survivIn > 0;
        return (
          <line key={`er-${b.id}`}
            x1={ROOT.x} y1={ROOT.y + NH}
            x2={b.x} y2={b.y}
            stroke={survived ? T.mint : pruned ? T.coral : T.border}
            strokeWidth={survived ? 2.5 : 1.5}
            strokeDasharray={pruned ? "5 4" : "none"}
            opacity={pruned ? Math.max(0, 1 - pruneIn * 1.6) : Math.min(1, treeIn * 3) * (survived ? 1 : 0.5)}
          />
        );
      })}

      {/* Branch → Leaf edges */}
      {treeIn > 0 && LEAVES.map(l => {
        const par = nodeMap[l.parent] as typeof BRANCHES[number] & { x: number; y: number };
        const branchDef = BRANCHES.find(b => b.id === l.parent)!;
        const pruned = !l.keep && pruneIn > 0;
        const survived = l.keep && survivIn > 0;
        return (
          <line key={`el-${l.id}`}
            x1={par.x} y1={par.y + NH}
            x2={l.x} y2={l.y}
            stroke={survived ? T.mint : pruned ? T.coral : T.border}
            strokeWidth={survived ? 2 : 1}
            strokeDasharray={pruned ? "5 4" : "none"}
            opacity={pruned ? Math.max(0, 1 - pruneIn * 1.6) : Math.min(1, treeIn * 3) * 0.4}
          />
        );
      })}

      {/* Root node */}
      <g opacity={rootIn}>
        <rect x={ROOT.x - NW / 2} y={ROOT.y} width={NW} height={NH} rx="9"
          fill={T.cyan} fillOpacity={0.14} stroke={T.cyan} strokeWidth="2"
        />
        <text x={ROOT.x} y={ROOT.y + NH / 2 + 5} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="12" fontWeight="700">
          {ROOT.label}
        </text>
      </g>

      {/* Branch nodes */}
      {BRANCHES.map(b => {
        if (treeIn <= 0) return null;
        const pruned = !b.keep && pruneIn > 0;
        const survived = b.keep && survivIn > 0;
        const fadeOp = pruned ? Math.max(0, 1 - pruneIn * 1.6) : 1;
        const c = survived ? T.mint : pruned ? T.coral : T.violet;
        const hiThis = (hiPrune && !b.keep) || (hiDeadEnd && !b.keep);
        return (
          <g key={b.id} opacity={Math.min(1, treeIn * 3) * fadeOp}>
            <rect x={b.x - NW / 2} y={b.y} width={NW} height={NH} rx="9"
              fill={c} fillOpacity={survived ? 0.22 : pruned ? 0.15 : 0.12}
              stroke={c} strokeWidth={survived ? 2.5 : hiThis ? 2 : 1.5}
              filter={survived ? "url(#tpr-glow-sm)" : undefined}
            />
            <text x={b.x} y={b.y + NH / 2 + 5} textAnchor="middle"
              fill={c} fontFamily={T.sans} fontSize="10" fontWeight={survived ? "800" : "600"}>
              {b.label}
            </text>
            {/* Score badge */}
            {scoresIn > 0 && (
              <g opacity={Math.min(1, scoresIn * 2)}>
                <rect x={b.x - 20} y={b.y - 22} width={40} height={18} rx="9"
                  fill={c} fillOpacity={0.20} stroke={c} strokeWidth="1"
                />
                <text x={b.x} y={b.y - 9} textAnchor="middle"
                  fill={c} fontFamily={T.mono} fontSize="10" fontWeight="800">
                  {b.score.toFixed(2)}
                </text>
              </g>
            )}
            {/* Pruned X */}
            {pruned && (
              <text x={b.x + NW / 2 - 6} y={b.y + 14} textAnchor="middle"
                fill={T.coral} fontFamily={T.sans} fontSize="18" fontWeight="900"
                filter={hiPrune ? "url(#tpr-glow-sm)" : undefined}>
                ✗
              </text>
            )}
          </g>
        );
      })}

      {/* Leaf nodes */}
      {LEAVES.map(l => {
        if (treeIn <= 0) return null;
        const pruned = !l.keep && pruneIn > 0;
        const survived = l.keep && survivIn > 0;
        const fadeOp = pruned ? Math.max(0, 1 - pruneIn * 1.6) : 1;
        const c = survived ? T.mint : pruned ? T.coral : T.textDim;
        return (
          <g key={l.id} opacity={Math.min(1, treeIn * 3) * fadeOp}>
            <rect x={l.x - LEAF_W / 2} y={l.y} width={LEAF_W} height={LEAF_H} rx="7"
              fill={c} fillOpacity={survived ? 0.20 : 0.08}
              stroke={c} strokeWidth={survived ? 2 : 1}
              filter={survived ? "url(#tpr-glow-sm)" : undefined}
            />
            <text x={l.x} y={l.y + 21} textAnchor="middle"
              fill={c} fontFamily={T.sans} fontSize="10" fontWeight={survived ? "700" : "500"}>
              {l.label}
            </text>
          </g>
        );
      })}

      {/* PRUNE label */}
      {pruneIn > 0.3 && (
        <g opacity={Math.min(1, (pruneIn - 0.3) * 3)}>
          <text x={W / 2} y={510} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="18" fontWeight="900" letterSpacing="4"
            filter={hiPrune ? "url(#tpr-glow)" : undefined}>
            PRUNING LOW-SCORE BRANCHES
          </text>
        </g>
      )}

      {/* Survivor badge */}
      {survivIn > 0 && (
        <g opacity={survivIn}>
          <rect x={W / 2 - 220} y={560} width={440} height={52} rx="26"
            fill={T.mint} fillOpacity={0.13} stroke={T.mint} strokeWidth="2"
            filter="url(#tpr-glow-sm)"
          />
          <text x={W / 2} y={592} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            3 VIABLE BRANCHES REMAIN
          </text>
        </g>
      )}
    </svg>
  );
};
