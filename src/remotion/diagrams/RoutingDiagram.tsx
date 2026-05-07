import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number }

const W = 1080, H = 700;
const R = 52;

const NODES = [
  { id: "src",  x: 90,  y: 350, label: "SOURCE",  icon: "laptop"  as const },
  { id: "r1",   x: 310, y: 200, label: "HOP 1",   icon: "router"  as const },
  { id: "r2",   x: 540, y: 400, label: "HOP 2",   icon: "router"  as const },
  { id: "r3",   x: 770, y: 200, label: "HOP 3",   icon: "router"  as const },
  { id: "dst",  x: 990, y: 350, label: "DEST",    icon: "server"  as const },
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
];

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const RoutingDiagram: React.FC<Props> = ({ frame, duration }) => {
  const nodesIn  = p(frame, duration, 0.0, 0.22);
  const packetPr = p(frame, duration, 0.28, 0.90);
  const doneAlpha = p(frame, duration, 0.92, 1.0);

  const totalEdges = EDGES.length;
  const edgeProgress = packetPr * totalEdges;
  const curEdge = Math.min(Math.floor(edgeProgress), totalEdges - 1);
  const frac = edgeProgress - curEdge;

  const fromN = NODES[EDGES[curEdge][0]];
  const toN   = NODES[EDGES[curEdge][1]];
  const px = fromN.x + (toN.x - fromN.x) * Math.min(frac, 1);
  const py = fromN.y + (toN.y - fromN.y) * Math.min(frac, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="glow-r"><feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Edges */}
      {EDGES.map(([a, b], i) => {
        const n1 = NODES[a], n2 = NODES[b];
        const isTraversed = i < curEdge || (i === curEdge && frac > 0.5);
        return (
          <g key={i} opacity={nodesIn}>
            <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              stroke={isTraversed ? T.cyan : T.border}
              strokeWidth={isTraversed ? "2" : "1.5"}
              strokeDasharray={isTraversed ? "none" : "8 5"} />
            {/* Hop label */}
            <rect x={(n1.x + n2.x) / 2 - 32} y={Math.min(n1.y, n2.y) - 52} width="64" height="26" rx="13"
              fill={T.bgDeep} opacity="0.9" />
            <text x={(n1.x + n2.x) / 2} y={Math.min(n1.y, n2.y) - 34}
              textAnchor="middle" fill={T.textDim} fontFamily={T.sans} fontSize="14" fontWeight="500">
              HOP {i + 1}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {NODES.map((n, i) => {
        const visited = packetPr > 0 && i <= curEdge + 1;
        const isActive = i === curEdge || i === curEdge + 1;
        return (
          <g key={n.id} opacity={nodesIn}>
            <circle cx={n.x} cy={n.y} r={R}
              fill={T.nodeFill}
              stroke={visited ? (isActive ? T.cyan : T.mint) : T.nodeBorder}
              strokeWidth={isActive ? "2.5" : "1.5"}
              filter={isActive ? "url(#glow-r)" : undefined} />
            <g transform={`translate(${n.x - 18}, ${n.y - 18})`}>
              <NodeIcon type={n.icon} size={36}
                color={isActive ? T.cyan : visited ? T.mint : T.textSecondary} />
            </g>
            <text x={n.x} y={n.y + R + 28} textAnchor="middle"
              fill={isActive ? T.textPrimary : T.textSecondary}
              fontFamily={T.sans} fontSize="17" fontWeight="500" letterSpacing="1.5">{n.label}</text>
          </g>
        );
      })}

      {/* Moving packet */}
      {packetPr > 0 && packetPr < 1 && (
        <g>
          <circle cx={px} cy={py} r="14" fill={T.cyan} opacity="0.15" />
          <circle cx={px} cy={py} r="8" fill={T.cyan} filter="url(#glow-r)" />
        </g>
      )}

      {/* Delivered */}
      {doneAlpha > 0 && (
        <g opacity={doneAlpha}>
          <rect x={W / 2 - 140} y={560} width="280" height="52" rx="26" fill={T.mint} opacity="0.15" />
          <text x={W / 2} y={592} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="24" fontWeight="600" letterSpacing="1">
            DELIVERED ✓
          </text>
        </g>
      )}
    </svg>
  );
};
