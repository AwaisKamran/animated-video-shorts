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

const NODE_W = 160, NODE_H = 52, NODE_RX = 10;

// Tree node positions
const ROOT    = { x: W / 2, y: 90 };
const L_CHILD = { x: 310, y: 250 };
const R_CHILD = { x: 770, y: 250 };
const LL_LEAF = { x: 160, y: 430 };
const LR_LEAF = { x: 420, y: 430 };
const RL_LEAF = { x: 650, y: 430 };
const RR_LEAF = { x: 880, y: 430 };

interface TreeNode {
  pos: { x: number; y: number };
  label: string;
  sublabel?: string;
  isLeaf?: boolean;
  leafType?: "approve" | "reject";
}

const NODES: TreeNode[] = [
  { pos: ROOT,    label: "Age > 30?" },
  { pos: L_CHILD, label: "Income > 50k?" },
  { pos: R_CHILD, label: "Credit > 700?" },
  { pos: LL_LEAF, label: "REJECT", isLeaf: true, leafType: "reject" },
  { pos: LR_LEAF, label: "APPROVE", isLeaf: true, leafType: "approve" },
  { pos: RL_LEAF, label: "APPROVE", isLeaf: true, leafType: "approve" },
  { pos: RR_LEAF, label: "APPROVE", isLeaf: true, leafType: "approve" },
];

// The traversal path: root → right (Yes) → right leaf
// Data point: Age=35, Credit=750 → Root: Yes → R_CHILD: Yes → RR_LEAF: APPROVE
const TRAVEL_PATH = [ROOT, R_CHILD, RR_LEAF];

function nodeRect(pos: { x: number; y: number }): { x: number; y: number; w: number; h: number } {
  return { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2, w: NODE_W, h: NODE_H };
}

export const DecisionTreeDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const rootIn    = p(frame, duration, 0.00, 0.14);
  const l1In      = p(frame, duration, 0.14, 0.30);
  const edgesIn   = p(frame, duration, 0.30, 0.48);
  const leavesIn  = p(frame, duration, 0.48, 0.64);
  const travelP   = p(frame, duration, 0.64, 0.92);
  const finalIn   = p(frame, duration, 0.92, 1.00);

  const hiSplit   = hi("SPLIT");
  const hiLeaf    = hi("LEAF");
  const hiFeature = hi("FEATURE");

  const nodeOpacity = [rootIn, l1In, l1In, leavesIn, leavesIn, leavesIn, leavesIn];

  // Travel ball position
  const travelSteps = TRAVEL_PATH.length - 1;
  const travelStep = Math.floor(travelP * travelSteps);
  const stepFrac = (travelP * travelSteps) % 1;
  const fromNode = TRAVEL_PATH[Math.min(travelStep, TRAVEL_PATH.length - 1)];
  const toNode = TRAVEL_PATH[Math.min(travelStep + 1, TRAVEL_PATH.length - 1)];
  const ballX = fromNode.x + (toNode.x - fromNode.x) * Math.min(stepFrac, 1);
  const ballY = fromNode.y + (toNode.y - fromNode.y) * Math.min(stepFrac, 1);

  // Which edges are highlighted by travel
  const edge0Active = travelP > 0.33; // root → R_CHILD
  const edge1Active = travelP > 0.67; // R_CHILD → RR_LEAF

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="dt-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="dt-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Edges ── */}
      {edgesIn > 0 && (
        <g opacity={edgesIn}>
          {/* Root → L_CHILD */}
          <line x1={ROOT.x} y1={ROOT.y + NODE_H / 2} x2={L_CHILD.x} y2={L_CHILD.y - NODE_H / 2}
            stroke={hiSplit ? T.violet : T.border} strokeWidth={hiSplit ? 2 : 1.5} />
          <text x={(ROOT.x + L_CHILD.x) / 2 - 12} y={(ROOT.y + L_CHILD.y) / 2}
            textAnchor="middle" fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">NO</text>

          {/* Root → R_CHILD */}
          <line x1={ROOT.x} y1={ROOT.y + NODE_H / 2} x2={R_CHILD.x} y2={R_CHILD.y - NODE_H / 2}
            stroke={edge0Active ? T.amber : (hiSplit ? T.violet : T.border)}
            strokeWidth={edge0Active ? 2.5 : (hiSplit ? 2 : 1.5)}
            filter={edge0Active ? "url(#dt-glow-sm)" : undefined}
          />
          <text x={(ROOT.x + R_CHILD.x) / 2 + 12} y={(ROOT.y + R_CHILD.y) / 2}
            textAnchor="middle" fill={T.coral} fontFamily={T.mono} fontSize="13" fontWeight="700">YES</text>

          {/* L_CHILD → LL_LEAF */}
          <line x1={L_CHILD.x} y1={L_CHILD.y + NODE_H / 2} x2={LL_LEAF.x} y2={LL_LEAF.y - NODE_H / 2}
            stroke={hiSplit ? T.violet : T.border} strokeWidth={hiSplit ? 2 : 1.5} />
          <text x={(L_CHILD.x + LL_LEAF.x) / 2 - 12} y={(L_CHILD.y + LL_LEAF.y) / 2}
            textAnchor="middle" fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">NO</text>

          {/* L_CHILD → LR_LEAF */}
          <line x1={L_CHILD.x} y1={L_CHILD.y + NODE_H / 2} x2={LR_LEAF.x} y2={LR_LEAF.y - NODE_H / 2}
            stroke={hiSplit ? T.violet : T.border} strokeWidth={hiSplit ? 2 : 1.5} />
          <text x={(L_CHILD.x + LR_LEAF.x) / 2 + 12} y={(L_CHILD.y + LR_LEAF.y) / 2}
            textAnchor="middle" fill={T.coral} fontFamily={T.mono} fontSize="13" fontWeight="700">YES</text>

          {/* R_CHILD → RL_LEAF */}
          <line x1={R_CHILD.x} y1={R_CHILD.y + NODE_H / 2} x2={RL_LEAF.x} y2={RL_LEAF.y - NODE_H / 2}
            stroke={hiSplit ? T.violet : T.border} strokeWidth={hiSplit ? 2 : 1.5} />
          <text x={(R_CHILD.x + RL_LEAF.x) / 2 - 12} y={(R_CHILD.y + RL_LEAF.y) / 2}
            textAnchor="middle" fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">NO</text>

          {/* R_CHILD → RR_LEAF */}
          <line x1={R_CHILD.x} y1={R_CHILD.y + NODE_H / 2} x2={RR_LEAF.x} y2={RR_LEAF.y - NODE_H / 2}
            stroke={edge1Active ? T.amber : (hiSplit ? T.violet : T.border)}
            strokeWidth={edge1Active ? 2.5 : (hiSplit ? 2 : 1.5)}
            filter={edge1Active ? "url(#dt-glow-sm)" : undefined}
          />
          <text x={(R_CHILD.x + RR_LEAF.x) / 2 + 12} y={(R_CHILD.y + RR_LEAF.y) / 2}
            textAnchor="middle" fill={T.coral} fontFamily={T.mono} fontSize="13" fontWeight="700">YES</text>
        </g>
      )}

      {/* ── Nodes ── */}
      {NODES.map((node, i) => {
        const r = nodeRect(node.pos);
        const isLeaf = node.isLeaf;
        const isApprove = node.leafType === "approve";
        const isReject = node.leafType === "reject";
        const isOnPath = TRAVEL_PATH.some(p => p.x === node.pos.x && p.y === node.pos.y);
        const isFinalNode = node.pos === RR_LEAF;

        let fillColor: string = T.nodeFill;
        let strokeColor: string = T.nodeBorder;
        let strokeWidth = 1.5;

        if (isLeaf && isApprove) {
          fillColor = hiLeaf ? `${T.mint}44` : `${T.mint}22`;
          strokeColor = hiLeaf ? T.mint : `${T.mint}88`;
          if (hiLeaf) strokeWidth = 2.5;
        } else if (isLeaf && isReject) {
          fillColor = hiLeaf ? `${T.coral}44` : `${T.coral}22`;
          strokeColor = hiLeaf ? T.coral : `${T.coral}88`;
          if (hiLeaf) strokeWidth = 2.5;
        } else {
          fillColor = hiFeature ? `${T.violet}22` : T.nodeFill;
          strokeColor = hiFeature ? T.violet : T.nodeBorder;
          if (hiFeature) strokeWidth = 2;
        }

        if (isOnPath && travelP > 0) {
          strokeColor = T.amber;
          strokeWidth = 2.5;
        }

        return (
          <g key={i} opacity={nodeOpacity[i]}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={NODE_RX}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              filter={isFinalNode && finalIn > 0.5 ? "url(#dt-glow-sm)" : undefined}
            />
            <text x={node.pos.x} y={node.pos.y + 6} textAnchor="middle"
              fill={isLeaf && isApprove ? T.mint : isLeaf && isReject ? T.coral : T.textPrimary}
              fontFamily={T.mono} fontSize={isLeaf ? 15 : 14} fontWeight="700">
              {node.label}
            </text>
          </g>
        );
      })}

      {/* ── Traveling data point ── */}
      {travelP > 0 && (
        <circle cx={ballX} cy={ballY} r={10}
          fill={T.amber}
          filter="url(#dt-glow-sm)"
        />
      )}

      {/* ── Data point label ── */}
      {travelP > 0.1 && (
        <g opacity={Math.min(travelP * 3, 1)}>
          <text x={130} y={560} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="12">
            Age=35
          </text>
          <text x={130} y={578} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="12">
            Credit=750
          </text>
        </g>
      )}

      {/* ── Feature importances ── */}
      {hiFeature && l1In > 0.5 && (
        <g opacity={(l1In - 0.5) * 2}>
          <text x={60} y={620} fill={T.violet} fontFamily={T.mono} fontSize="12">
            Feature 1: Age (most important)
          </text>
          <text x={60} y={640} fill={T.violet} fontFamily={T.mono} fontSize="12">
            Feature 2: Income / Credit
          </text>
        </g>
      )}
    </svg>
  );
};
