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

const HEAP_INITIAL = [16, 14, 10, 8, 7, 9, 3, 2, 4, 1];
const HEAP_N = 7;

const TREE_CX = 310;
const TREE_TOP_Y = 100;
const LEVEL_H = 120;

function nodePos(idx: number): { x: number; y: number } {
  if (idx === 0) return { x: TREE_CX, y: TREE_TOP_Y };
  if (idx === 1) return { x: TREE_CX - 130, y: TREE_TOP_Y + LEVEL_H };
  if (idx === 2) return { x: TREE_CX + 130, y: TREE_TOP_Y + LEVEL_H };
  if (idx === 3) return { x: TREE_CX - 190, y: TREE_TOP_Y + LEVEL_H * 2 };
  if (idx === 4) return { x: TREE_CX - 65, y: TREE_TOP_Y + LEVEL_H * 2 };
  if (idx === 5) return { x: TREE_CX + 65, y: TREE_TOP_Y + LEVEL_H * 2 };
  return { x: TREE_CX + 190, y: TREE_TOP_Y + LEVEL_H * 2 };
}

const NODE_R = 28;

const HEAP_STATES = [
  { heap: [16, 14, 10, 8, 7, 9, 3], highlight: [0], sorted: [] as number[] },
  { heap: [16, 14, 10, 8, 7, 9, 3], highlight: [0, 1], sorted: [] as number[] },
  { heap: [16, 14, 10, 8, 7, 9, 3], highlight: [0, 2], sorted: [] as number[] },
  { heap: [14, 8, 10, 3, 7, 9, 16], highlight: [0], sorted: [6] },
  { heap: [10, 8, 9, 3, 7, 14, 16], highlight: [0, 2], sorted: [5, 6] },
  { heap: [9, 8, 3, 10, 7, 14, 16], highlight: [0], sorted: [4, 5, 6] },
  { heap: [1, 2, 3, 4, 7, 8, 9, 10, 14, 16], highlight: [], sorted: [0, 1, 2, 3, 4, 5, 6] },
];

const ARRAY_X0 = 600;
const ARRAY_Y = 140;
const CELL_W = 58;
const CELL_H = 44;
const CELL_GAP = 6;

export const HeapSortDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const treeIn     = p(frame, duration, 0.00, 0.15);
  const buildIn    = p(frame, duration, 0.15, 0.55);
  const extractIn  = p(frame, duration, 0.55, 0.90);
  const doneIn     = p(frame, duration, 0.90, 1.00);

  const hiHeap    = hi("HEAP");
  const hiHeapify = hi("HEAPIFY");
  const hiExtract = hi("EXTRACT");

  const buildStepIdx = Math.min(4, Math.floor(buildIn * 5));
  const extractStepIdx = Math.min(2, Math.floor(extractIn * 3));
  const finalState = extractStepIdx === 2 ? HEAP_STATES[6] : HEAP_STATES[buildStepIdx];
  const { heap, highlight, sorted } = finalState;

  const showExtractPhase = extractIn > 0.1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="hs-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="hs-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="hs-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
      </defs>

      <text x={W / 2} y={36} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3">
        HEAP SORT · HEAPIFY + EXTRACT
      </text>

      <text x={TREE_CX} y={72} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2"
        opacity={treeIn}>
        {showExtractPhase ? "EXTRACT MAX" : "BUILD MAX-HEAP"}
      </text>

      {treeIn > 0 && (
        <g opacity={treeIn}>
          {Array.from({ length: Math.min(heap.length, HEAP_N) }).map((_, i) => {
            const { x, y } = nodePos(i);
            const parentIdx = Math.floor((i - 1) / 2);
            const isHighlight = highlight.includes(i);
            const isSortedNode = sorted.includes(i);
            const strokeColor = doneIn > 0.5 ? T.mint : isSortedNode ? T.mint : isHighlight ? (showExtractPhase ? T.coral : T.violet) : T.borderStrong;
            const glowing = (isHighlight && (hiHeapify || hiExtract || hiHeap)) || (doneIn > 0.5);

            return (
              <g key={i}>
                {i > 0 && (
                  <line
                    x1={nodePos(parentIdx).x}
                    y1={nodePos(parentIdx).y + NODE_R}
                    x2={x}
                    y2={y - NODE_R}
                    stroke={T.border} strokeWidth="1.5" opacity={0.6}
                  />
                )}
                <circle cx={x} cy={y} r={NODE_R}
                  fill={doneIn > 0.5 ? `${T.mint}33` : isSortedNode ? `${T.mint}33` : isHighlight ? (showExtractPhase ? `${T.coral}33` : `${T.violet}33`) : T.nodeFill}
                  stroke={strokeColor}
                  strokeWidth={isHighlight ? 2.5 : 1.5}
                  filter={glowing ? "url(#hs-glow-sm)" : undefined}
                />
                <text x={x} y={y + 6} textAnchor="middle"
                  fill={strokeColor} fontFamily={T.mono} fontSize="14" fontWeight="700">
                  {heap[i] !== undefined ? heap[i] : ""}
                </text>
                <text x={x} y={y + NODE_R + 14} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.mono} fontSize="9">
                  [{i}]
                </text>
              </g>
            );
          })}
        </g>
      )}

      {treeIn > 0 && (
        <g opacity={treeIn}>
          <text x={ARRAY_X0 + 20} y={ARRAY_Y - 18}
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1">
            ARRAY REPRESENTATION
          </text>
          {heap.slice(0, HEAP_N).map((val, i) => {
            const cellX = ARRAY_X0 + i * (CELL_W + CELL_GAP);
            const isHighlight = highlight.includes(i);
            const isSorted = sorted.includes(i);
            const cellColor = doneIn > 0.5 ? T.mint : isSorted ? T.mint : isHighlight ? (showExtractPhase ? T.coral : T.violet) : T.textSecondary;
            return (
              <g key={i}>
                <rect x={cellX} y={ARRAY_Y} width={CELL_W} height={CELL_H} rx="8"
                  fill={cellColor} fillOpacity={isHighlight || isSorted ? 0.25 : 0.10}
                  stroke={cellColor} strokeWidth={isHighlight ? 2.5 : 1.5}
                  filter={isHighlight && (hiHeap || hiHeapify) ? "url(#hs-glow-sm)" : undefined}
                />
                <text x={cellX + CELL_W / 2} y={ARRAY_Y + CELL_H / 2 + 6}
                  textAnchor="middle"
                  fill={cellColor} fontFamily={T.mono} fontSize="14" fontWeight="700">
                  {val}
                </text>
                <text x={cellX + CELL_W / 2} y={ARRAY_Y + CELL_H + 16}
                  textAnchor="middle"
                  fill={T.textDim} fontFamily={T.mono} fontSize="9">
                  [{i}]
                </text>
                <text x={cellX + CELL_W / 2} y={ARRAY_Y - 8}
                  textAnchor="middle"
                  fill={T.textDim} fontFamily={T.mono} fontSize="9">
                  {i === 0 ? "root" : i % 2 === 1 ? `L(${Math.floor((i - 1) / 2)})` : `R(${Math.floor((i - 1) / 2)})`}
                </text>
              </g>
            );
          })}

          {showExtractPhase && sorted.length > 0 && (
            <g>
              <text x={ARRAY_X0 + 20} y={ARRAY_Y + 100}
                fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1">
                SORTED SUFFIX
              </text>
              {sorted.map((si, idx) => {
                const cellX = ARRAY_X0 + idx * (CELL_W + CELL_GAP);
                const val = HEAP_STATES[6].heap[HEAP_N - sorted.length + idx];
                return (
                  <g key={idx}>
                    <rect x={cellX} y={ARRAY_Y + 120} width={CELL_W} height={CELL_H} rx="8"
                      fill={T.mint} fillOpacity="0.25"
                      stroke={T.mint} strokeWidth="1.5"
                    />
                    <text x={cellX + CELL_W / 2} y={ARRAY_Y + 120 + CELL_H / 2 + 6}
                      textAnchor="middle"
                      fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">
                      {val !== undefined ? val : ""}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      )}

      <line x1={TREE_CX + 210} y1={TREE_TOP_Y} x2={ARRAY_X0 - 20} y2={TREE_TOP_Y}
        stroke={T.border} strokeWidth="1" strokeDasharray="6 4" opacity={treeIn * 0.4}
      />

      <rect x={ARRAY_X0 + 20} y={520} width={380} height={38} rx="10"
        fill={T.bgDeep} fillOpacity="0.7" stroke={T.border} strokeWidth="1.5"
        opacity={treeIn}
      />
      <text x={ARRAY_X0 + 210} y={544} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1"
        opacity={treeIn}>
        COMPLEXITY
      </text>
      <text x={ARRAY_X0 + 210} y={549} textAnchor="middle"
        fill={T.mint} fontFamily={T.mono} fontSize="12"
        dy={12}
        opacity={treeIn}>
        O(n log n)
      </text>

      {showExtractPhase && (
        <text x={TREE_CX} y={TREE_TOP_Y + LEVEL_H * 3 + 40} textAnchor="middle"
          fill={T.coral} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1"
          opacity={extractIn}
          filter={hiExtract ? "url(#hs-glow-sm)" : undefined}>
          EXTRACT-MAX → HEAPIFY
        </text>
      )}

      {!showExtractPhase && buildIn > 0.1 && (
        <text x={TREE_CX} y={TREE_TOP_Y + LEVEL_H * 3 + 40} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1"
          opacity={buildIn}
          filter={hiHeapify ? "url(#hs-glow-sm)" : undefined}>
          SIFT DOWN TO RESTORE HEAP PROPERTY
        </text>
      )}
    </svg>
  );
};
