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

// Tree structure: root → 3 L2 → each L2 spawns 2 L3
// Nodes: id, x, y, label, parent, bestPath, dead
const ROOT = { id: "root", x: 540, y: 60,  label: "Problem", parent: null };

const L2 = [
  { id: "a", x: 220, y: 210, label: "Approach A", parent: "root", best: true,  dead: false },
  { id: "b", x: 540, y: 210, label: "Approach B", parent: "root", best: false, dead: true  },
  { id: "c", x: 860, y: 210, label: "Approach C", parent: "root", best: false, dead: false },
];

const L3 = [
  { id: "a1", x: 150, y: 390, label: "Refine A1", parent: "a", best: true,  dead: false },
  { id: "a2", x: 290, y: 390, label: "Dead End",  parent: "a", best: false, dead: true  },
  { id: "b1", x: 470, y: 390, label: "Dead End",  parent: "b", best: false, dead: true  },
  { id: "b2", x: 610, y: 390, label: "Dead End",  parent: "b", best: false, dead: true  },
  { id: "c1", x: 790, y: 390, label: "Maybe",     parent: "c", best: false, dead: false },
  { id: "c2", x: 930, y: 390, label: "Dead End",  parent: "c", best: false, dead: true  },
];

const L4 = [
  { id: "a1a", x: 150, y: 540, label: "BEST", parent: "a1", best: true, dead: false },
];

const BOX_W = 130, BOX_H = 50;

function NodeBox({ node, prog, isBest, isDead, hi }: {
  node: { id: string; x: number; y: number; label: string };
  prog: number;
  isBest: boolean;
  isDead: boolean;
  hi: boolean;
}) {
  if (prog <= 0) return null;
  const color = isDead ? T.coral : isBest ? T.mint : T.violet;
  return (
    <g opacity={Math.min(1, prog * 2)}>
      <rect x={node.x - BOX_W / 2} y={node.y} width={BOX_W} height={BOX_H} rx="10"
        fill={color} fillOpacity={isBest ? 0.25 : isDead ? 0.15 : 0.12}
        stroke={color} strokeWidth={isBest ? 2.5 : 1.5}
      />
      <text x={node.x} y={node.y + BOX_H / 2 + 5} textAnchor="middle"
        fill={color} fontFamily={T.sans} fontSize="11" fontWeight={isBest ? "800" : "600"}>
        {node.label}
      </text>
      {isDead && (
        <text x={node.x + BOX_W / 2 - 10} y={node.y + 14} textAnchor="middle"
          fill={T.coral} fontFamily={T.sans} fontSize="16" fontWeight="800">✗</text>
      )}
      {isBest && !isDead && (
        <text x={node.x + BOX_W / 2 - 10} y={node.y + 14} textAnchor="middle"
          fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800">✓</text>
      )}
    </g>
  );
}

export const ToTDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const rootIn    = p(frame, duration, 0.00, 0.20);
  const l2In      = p(frame, duration, 0.10, 0.35);
  const l3In      = p(frame, duration, 0.30, 0.55);
  const pathIn    = p(frame, duration, 0.55, 0.75);
  const badgeIn   = p(frame, duration, 0.75, 1.00);

  const hiTree      = hi("TREE");
  const hiBacktrack = hi("BACKTRACK");
  const hiEvaluate  = hi("EVALUATE");

  // Edge from parent to child
  function Edge({ px, py, cx, cy, isBest }: { px: number; py: number; cx: number; cy: number; isBest: boolean }) {
    const color = isBest && pathIn > 0 ? T.mint : T.border;
    const width = isBest && pathIn > 0 ? 2.5 : 1.5;
    return (
      <line x1={px} y1={py + BOX_H} x2={cx} y2={cy}
        stroke={color} strokeWidth={width}
        strokeDasharray={isBest ? "none" : "4 3"}
        opacity={isBest && pathIn > 0 ? 1 : 0.5}
      />
    );
  }

  const allNodes = [ROOT, ...L2, ...L3, ...L4];
  const nodeMap: Record<string, typeof allNodes[number]> = {};
  allNodes.forEach(n => { nodeMap[n.id] = n; });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tot-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={30} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={rootIn}>
        TREE OF THOUGHTS · EXPLORE &amp; PRUNE
      </text>

      {/* Root → L2 edges */}
      {l2In > 0 && L2.map(n2 => (
        <Edge key={`e-${n2.id}`} px={ROOT.x} py={ROOT.y} cx={n2.x} cy={n2.y} isBest={n2.best} />
      ))}

      {/* L2 → L3 edges */}
      {l3In > 0 && L3.map(n3 => {
        const par = nodeMap[n3.parent];
        return <Edge key={`e-${n3.id}`} px={par.x} py={par.y} cx={n3.x} cy={n3.y} isBest={n3.best} />;
      })}

      {/* L3 → L4 edges */}
      {pathIn > 0 && L4.map(n4 => {
        const par = nodeMap[n4.parent];
        return <Edge key={`e-${n4.id}`} px={par.x} py={par.y} cx={n4.x} cy={n4.y} isBest={n4.best} />;
      })}

      {/* Root node */}
      <NodeBox node={ROOT} prog={rootIn} isBest={false} isDead={false} hi={false} />

      {/* L2 nodes */}
      {L2.map(n => (
        <NodeBox key={n.id} node={n} prog={l2In} isBest={n.best} isDead={n.dead} hi={hiEvaluate} />
      ))}

      {/* L3 nodes */}
      {L3.map(n => (
        <NodeBox key={n.id} node={n} prog={l3In} isBest={n.best} isDead={n.dead} hi={hiBacktrack} />
      ))}

      {/* L4 best node */}
      {L4.map(n => (
        <NodeBox key={n.id} node={n} prog={pathIn} isBest={n.best} isDead={n.dead} hi={hiTree} />
      ))}

      {/* Best path glow overlay */}
      {pathIn > 0.5 && (
        <rect x={L4[0].x - BOX_W / 2 - 6} y={L4[0].y - 6} width={BOX_W + 12} height={BOX_H + 12} rx="14"
          fill="none" stroke={T.mint} strokeWidth="3"
          filter="url(#tot-glow)"
          opacity={(pathIn - 0.5) * 2}
        />
      )}

      {/* Badge */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 180} y={610} width={360} height={52} rx="26"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#tot-glow)"
          />
          <text x={W / 2} y={643} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
            BEST PATH FOUND
          </text>
        </g>
      )}
    </svg>
  );
};
