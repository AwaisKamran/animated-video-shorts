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

const ORIGINAL = [64, 34, 25, 12, 22, 11, 90, 45];
const N = ORIGINAL.length;

const BAR_W = 86;
const BAR_GAP = 20;
const BARS_TOTAL = N * BAR_W + (N - 1) * BAR_GAP;
const BARS_X0 = (W - BARS_TOTAL) / 2;
const BASE_Y = 480;
const MAX_H = 340;

function barH(val: number) { return (val / 100) * MAX_H; }

const PARTITION_STEPS = [
  { arr: [64, 34, 25, 12, 22, 11, 90, 45], pivot: 7, i: -1, j: 0, pivotFinal: -1 },
  { arr: [64, 34, 25, 12, 22, 11, 90, 45], pivot: 7, i: -1, j: 1, pivotFinal: -1 },
  { arr: [11, 34, 25, 12, 22, 64, 90, 45], pivot: 7, i: 0, j: 2, pivotFinal: -1 },
  { arr: [11, 12, 25, 34, 22, 64, 90, 45], pivot: 7, i: 1, j: 4, pivotFinal: -1 },
  { arr: [11, 12, 22, 34, 25, 64, 90, 45], pivot: 7, i: 2, j: 5, pivotFinal: -1 },
  { arr: [11, 12, 22, 34, 25, 64, 90, 45], pivot: 7, i: 3, j: 6, pivotFinal: -1 },
  { arr: [11, 12, 22, 34, 25, 45, 64, 90], pivot: 5, i: -1, j: -1, pivotFinal: 5 },
  { arr: [11, 12, 22, 25, 34, 45, 64, 90], pivot: 3, i: -1, j: -1, pivotFinal: 3 },
];

export const QuickSortDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const overallIn   = p(frame, duration, 0.00, 0.88);
  const doneIn      = p(frame, duration, 0.88, 1.00);

  const hiQS      = hi("QUICKSORT");
  const hiPivot   = hi("PIVOT");
  const hiPart    = hi("PARTITION");

  const stepIdx = Math.min(PARTITION_STEPS.length - 1, Math.floor(overallIn * PARTITION_STEPS.length));
  const step = PARTITION_STEPS[stepIdx];
  const arr = step.arr;
  const pivotBar = step.pivot;
  const iPointer = step.i;
  const jPointer = step.j;
  const pivotFinal = step.pivotFinal;

  const phaseSplit = stepIdx >= 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="qs-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="qs-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="qs-arr-i" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
        <marker id="qs-arr-j" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
      </defs>

      <text x={W / 2} y={38} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3">
        QUICKSORT · PIVOT PARTITIONING
      </text>

      <rect x={W - 300} y={50} width={270} height={46} rx="10"
        fill={T.bgDeep} fillOpacity="0.7" stroke={T.border} strokeWidth="1.5"
      />
      <text x={W - 165} y={70} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
        COMPLEXITY
      </text>
      <text x={W - 165} y={87} textAnchor="middle"
        fill={T.amber} fontFamily={T.mono} fontSize="12">
        O(n log n) avg · O(n²) worst
      </text>

      {arr.map((val, i) => {
        const bx = BARS_X0 + i * (BAR_W + BAR_GAP);
        const bh = barH(val);
        const by = BASE_Y - bh;
        const isPivot = i === pivotBar && pivotFinal < 0 && doneIn < 0.1;
        const isPivotFinal = i === pivotFinal && doneIn < 0.5;
        const isDone = doneIn > 0.5;
        const isSmall = i < pivotFinal && pivotFinal >= 0;
        const isI = i === iPointer && pivotFinal < 0;
        const isJ = i === jPointer && pivotFinal < 0;

        let barColor: string = T.textDim;
        if (isDone) barColor = T.mint;
        else if (isPivot) barColor = T.amber;
        else if (isPivotFinal) barColor = T.mint;
        else if (isSmall) barColor = T.cyan;
        else if (isI) barColor = T.mint;
        else if (isJ) barColor = T.cyan;
        else if (phaseSplit && i < (arr.length / 2)) barColor = T.violet;

        const glowing = (isPivot && hiPivot) || (isDone && hiQS) || (hiPart && pivotFinal >= 0);

        return (
          <g key={i}>
            <rect x={bx} y={by} width={BAR_W} height={bh} rx="6"
              fill={barColor}
              fillOpacity={isPivot ? 0.60 : isPivotFinal ? 0.50 : isSmall ? 0.35 : isDone ? 0.45 : 0.30}
              stroke={barColor}
              strokeWidth={isPivot || isPivotFinal ? 2.5 : 1.5}
              filter={glowing ? "url(#qs-glow-sm)" : undefined}
            />
            <text x={bx + BAR_W / 2} y={by - 10} textAnchor="middle"
              fill={barColor} fontFamily={T.mono} fontSize="14" fontWeight="700">
              {val}
            </text>
            {isPivot && (
              <text x={bx + BAR_W / 2} y={BASE_Y + 28} textAnchor="middle"
                fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700"
                filter={hiPivot ? "url(#qs-glow-sm)" : undefined}>
                PIVOT
              </text>
            )}
          </g>
        );
      })}

      {iPointer >= 0 && pivotFinal < 0 && doneIn < 0.1 && (
        <g>
          <text x={BARS_X0 + iPointer * (BAR_W + BAR_GAP) + BAR_W / 2} y={BASE_Y + 52}
            textAnchor="middle" fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700">
            i
          </text>
        </g>
      )}

      {jPointer >= 0 && pivotFinal < 0 && doneIn < 0.1 && (
        <g>
          <text x={BARS_X0 + jPointer * (BAR_W + BAR_GAP) + BAR_W / 2} y={BASE_Y + 66}
            textAnchor="middle" fill={T.cyan} fontFamily={T.mono} fontSize="12" fontWeight="700">
            j
          </text>
        </g>
      )}

      {pivotFinal >= 0 && doneIn < 0.1 && (
        <g>
          <line x1={BARS_X0 + pivotFinal * (BAR_W + BAR_GAP) + BAR_W / 2} y1={80}
            x2={BARS_X0 + pivotFinal * (BAR_W + BAR_GAP) + BAR_W / 2} y2={BASE_Y}
            stroke={T.mint} strokeWidth="1.5" strokeDasharray="8 4" opacity="0.5"
          />
          <text x={BARS_X0 + pivotFinal * (BAR_W + BAR_GAP) + BAR_W / 2} y={74}
            textAnchor="middle" fill={T.mint} fontFamily={T.sans} fontSize="11" fontWeight="700">
            PARTITIONED
          </text>
        </g>
      )}

      <rect x={W / 2 - 100} y={BASE_Y + 90} width={200} height={38} rx="19"
        fill={doneIn > 0.5 ? T.mint : T.bgDeep}
        fillOpacity={doneIn > 0.5 ? 0.22 : 0.6}
        stroke={doneIn > 0.5 ? T.mint : T.amber}
        strokeWidth="2"
        filter={doneIn > 0.5 ? "url(#qs-glow-sm)" : undefined}
      />
      <text x={W / 2} y={BASE_Y + 114} textAnchor="middle"
        fill={doneIn > 0.5 ? T.mint : T.amber}
        fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="1.5">
        {doneIn > 0.5 ? "SORTED" : (pivotFinal >= 0 ? "PARTITIONED" : "PARTITIONING...")}
      </text>
    </svg>
  );
};
