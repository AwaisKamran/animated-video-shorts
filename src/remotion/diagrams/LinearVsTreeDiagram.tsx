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

// ── LEFT (CoT linear chain) ──────────────────────────────
const CHAIN_NODES = [
  { label: "Question" },
  { label: "Step 1" },
  { label: "Step 2" },
  { label: "Step 3" },
  { label: "Answer" },
];
const CN_X = 230, CN_START_Y = 118, CN_GAP = 100, CN_W = 140, CN_H = 48;

// ── RIGHT (ToT tree) ────────────────────────────────────
// Root (depth 0), 3 branches (depth 1), 6 leaves (depth 2)
const TR_X = 700; // centre X of the tree column
const TREE_NODES = [
  { id: "r",  x: TR_X,       y: 118, label: "Question", d: 0, parent: null,  best: false },
  { id: "t1", x: TR_X - 180, y: 260, label: "Path A",   d: 1, parent: "r",   best: true  },
  { id: "t2", x: TR_X,       y: 260, label: "Path B",   d: 1, parent: "r",   best: false },
  { id: "t3", x: TR_X + 180, y: 260, label: "Path C",   d: 1, parent: "r",   best: false },
  { id: "l1", x: TR_X - 240, y: 400, label: "A1",       d: 2, parent: "t1",  best: true  },
  { id: "l2", x: TR_X - 120, y: 400, label: "A2",       d: 2, parent: "t1",  best: false },
  { id: "l3", x: TR_X - 60,  y: 400, label: "B1",       d: 2, parent: "t2",  best: false },
  { id: "l4", x: TR_X + 60,  y: 400, label: "B2",       d: 2, parent: "t2",  best: false },
  { id: "l5", x: TR_X + 120, y: 400, label: "C1",       d: 2, parent: "t3",  best: false },
  { id: "l6", x: TR_X + 240, y: 400, label: "C2",       d: 2, parent: "t3",  best: false },
  { id: "best", x: TR_X - 240, y: 520, label: "BEST",   d: 3, parent: "l1",  best: true  },
];

const TN_W = 100, TN_H = 40;

export const LinearVsTreeDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelsIn   = p(frame, duration, 0.00, 0.18);
  const chainP     = p(frame, duration, 0.18, 0.46);
  const treeD1P    = p(frame, duration, 0.30, 0.50);
  const treeD2P    = p(frame, duration, 0.48, 0.68);
  const bestPathIn = p(frame, duration, 0.68, 0.85);
  const badgeIn    = p(frame, duration, 0.85, 1.00);

  const hiLinear = hi("LINEAR");
  const hiTree   = hi("TREE");

  const chainVisible = Math.ceil(chainP * CHAIN_NODES.length);

  const nodeMap: Record<string, typeof TREE_NODES[number]> = {};
  TREE_NODES.forEach(n => { nodeMap[n.id] = n; });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="lvt-glow">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lvt-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="lvt-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="lvt-arr-m" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* Divider + labels */}
      <g opacity={panelsIn}>
        <line x1={W / 2} y1={60} x2={W / 2} y2={H - 80}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4"
        />
        <text x={W / 4} y={72} textAnchor="middle"
          fill={hiLinear ? T.cyan : T.textDim}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
          filter={hiLinear ? "url(#lvt-glow-sm)" : undefined}>
          CoT: ONE PATH
        </text>
        <text x={W * 3 / 4} y={72} textAnchor="middle"
          fill={hiTree ? T.mint : T.textDim}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
          filter={hiTree ? "url(#lvt-glow-sm)" : undefined}>
          ToT: MANY PATHS
        </text>
      </g>

      {/* LEFT chain arrows */}
      {CHAIN_NODES.slice(0, chainVisible).map((node, i) => {
        if (i === 0) return null;
        const cy = CN_START_Y + i * CN_GAP;
        const isLast = i === CHAIN_NODES.length - 1;
        return (
          <line key={`ca-${i}`}
            x1={CN_X} y1={cy - CN_GAP + CN_H}
            x2={CN_X} y2={cy}
            stroke={isLast ? T.mint : T.violet} strokeWidth="2"
            markerEnd={isLast ? "url(#lvt-arr-m)" : "url(#lvt-arr)"}
            opacity={Math.min(1, (chainP * CHAIN_NODES.length - i + 1) * 2)}
          />
        );
      })}

      {/* LEFT chain nodes */}
      {CHAIN_NODES.slice(0, chainVisible).map((node, i) => {
        const cy = CN_START_Y + i * CN_GAP;
        const isLast = i === CHAIN_NODES.length - 1;
        const op = Math.min(1, (chainP * CHAIN_NODES.length - i) * 2);
        return (
          <g key={i} opacity={op}>
            <rect x={CN_X - CN_W / 2} y={cy} width={CN_W} height={CN_H} rx="10"
              fill={isLast ? T.mint : T.violet}
              fillOpacity={isLast ? 0.22 : 0.12}
              stroke={isLast ? T.mint : T.violet}
              strokeWidth={isLast ? 2 : 1.5}
              filter={isLast && chainP > 0.9 ? "url(#lvt-glow)" : undefined}
            />
            <text x={CN_X} y={cy + CN_H / 2 + 6} textAnchor="middle"
              fill={isLast ? T.mint : T.violet}
              fontFamily={T.sans} fontSize="12" fontWeight={isLast ? "800" : "600"}>
              {node.label}
            </text>
          </g>
        );
      })}

      {/* RIGHT tree edges depth 0→1 and 1→2 */}
      {[{ depth: 1, prog: treeD1P }, { depth: 2, prog: treeD2P }].map(({ depth, prog }) =>
        prog > 0 && TREE_NODES.filter(n => n.d === depth).map(n => {
          const par = nodeMap[n.parent!];
          const isBest = n.best && bestPathIn > 0;
          return (
            <line key={`te-${n.id}`}
              x1={par.x} y1={par.y + TN_H} x2={n.x} y2={n.y}
              stroke={isBest ? T.mint : T.border}
              strokeWidth={isBest ? 2.5 : 1.5}
              strokeDasharray={isBest ? "none" : "4 3"}
              opacity={Math.min(1, prog * 2.5)}
            />
          );
        })
      )}

      {/* RIGHT tree edge — depth 2→3 (best) */}
      {bestPathIn > 0 && (() => {
        const n = TREE_NODES.find(n => n.id === "best")!;
        const par = nodeMap[n.parent!];
        return (
          <line
            x1={par.x} y1={par.y + TN_H}
            x2={n.x} y2={n.y}
            stroke={T.mint} strokeWidth="2.5"
            opacity={bestPathIn}
          />
        );
      })()}

      {/* RIGHT tree nodes — depth 0 & 1 */}
      {TREE_NODES.filter(n => n.d <= 1).map(n => {
        const prog = n.d === 0 ? panelsIn : treeD1P;
        if (prog <= 0) return null;
        const isBest = n.best && bestPathIn > 0;
        const color = isBest ? T.mint : T.violet;
        return (
          <g key={n.id} opacity={Math.min(1, prog * 2)}>
            <rect x={n.x - TN_W / 2} y={n.y} width={TN_W} height={TN_H} rx="9"
              fill={color} fillOpacity={isBest ? 0.22 : 0.12}
              stroke={color} strokeWidth={isBest ? 2 : 1.5}
              filter={isBest ? "url(#lvt-glow-sm)" : undefined}
            />
            <text x={n.x} y={n.y + TN_H / 2 + 5} textAnchor="middle"
              fill={color} fontFamily={T.sans} fontSize="11" fontWeight={isBest ? "800" : "600"}>
              {n.label}
            </text>
          </g>
        );
      })}

      {/* RIGHT tree nodes — depth 2 */}
      {TREE_NODES.filter(n => n.d === 2).map(n => {
        if (treeD2P <= 0) return null;
        const isBest = n.best && bestPathIn > 0;
        const color = isBest ? T.mint : T.textDim;
        return (
          <g key={n.id} opacity={Math.min(1, treeD2P * 2)}>
            <rect x={n.x - TN_W / 2} y={n.y} width={TN_W} height={TN_H} rx="9"
              fill={color} fillOpacity={isBest ? 0.20 : 0.08}
              stroke={color} strokeWidth={isBest ? 2 : 1}
              filter={isBest ? "url(#lvt-glow-sm)" : undefined}
            />
            <text x={n.x} y={n.y + TN_H / 2 + 5} textAnchor="middle"
              fill={color} fontFamily={T.sans} fontSize="11" fontWeight={isBest ? "800" : "500"}>
              {n.label}
            </text>
          </g>
        );
      })}

      {/* RIGHT — BEST leaf node */}
      {bestPathIn > 0 && (() => {
        const n = TREE_NODES.find(n => n.id === "best")!;
        return (
          <g opacity={bestPathIn}>
            <rect x={n.x - TN_W / 2} y={n.y} width={TN_W} height={TN_H} rx="9"
              fill={T.mint} fillOpacity={0.25}
              stroke={T.mint} strokeWidth="2.5"
              filter="url(#lvt-glow)"
            />
            <text x={n.x} y={n.y + TN_H / 2 + 5} textAnchor="middle"
              fill={T.mint} fontFamily={T.sans} fontSize="12" fontWeight="800">
              BEST
            </text>
          </g>
        );
      })()}

      {/* Bottom badge */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 230} y={626} width={460} height={48} rx="24"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2"
            filter="url(#lvt-glow-sm)"
          />
          <text x={W / 2} y={656} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            TREE EXPLORES — CHAIN COMMITS
          </text>
        </g>
      )}
    </svg>
  );
};
