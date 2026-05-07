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

const INITIAL = [64, 25, 12, 22, 11, 90, 35];
const N = INITIAL.length;

const BAR_W = 90;
const BAR_GAP = 22;
const BARS_TOTAL = N * BAR_W + (N - 1) * BAR_GAP;
const BARS_X0 = (W - BARS_TOTAL) / 2;
const BASE_Y = 540;
const MAX_H = 380;

function barH(val: number) { return (val / 100) * MAX_H; }

function runSelectionSort(arr: number[]): { arr: number[]; sortedEnd: number; minIdx: number; scanIdx: number }[] {
  const steps: { arr: number[]; sortedEnd: number; minIdx: number; scanIdx: number }[] = [];
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      steps.push({ arr: [...a], sortedEnd: i, minIdx, scanIdx: j });
      if (a[j] < a[minIdx]) minIdx = j;
    }
    const tmp = a[i]; a[i] = a[minIdx]; a[minIdx] = tmp;
    steps.push({ arr: [...a], sortedEnd: i + 1, minIdx: -1, scanIdx: -1 });
  }
  steps.push({ arr: [...a], sortedEnd: N, minIdx: -1, scanIdx: -1 });
  return steps;
}

const ALL_STEPS = runSelectionSort(INITIAL);

export const SelectionSortDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const overallIn = p(frame, duration, 0.00, 0.90);
  const doneIn    = p(frame, duration, 0.90, 1.00);

  const hiSel  = hi("SELECTION");
  const hiMin  = hi("MINIMUM");

  const stepIdx = Math.min(ALL_STEPS.length - 1, Math.floor(overallIn * ALL_STEPS.length));
  const step = ALL_STEPS[stepIdx];
  const arr = step.arr;
  const sortedEnd = step.sortedEnd;
  const minIdx = step.minIdx;
  const scanIdx = step.scanIdx;

  const iteration = Math.min(sortedEnd + 1, N);
  const minVal = minIdx >= 0 ? arr[minIdx] : arr[sortedEnd];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ss-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ss-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="ss-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.coral} />
        </marker>
      </defs>

      <text x={W / 2} y={38} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3">
        SELECTION SORT · MIN-FINDING SWEEP
      </text>

      <rect x={W - 260} y={50} width={230} height={46} rx="10"
        fill={T.bgDeep} fillOpacity="0.7" stroke={T.border} strokeWidth="1.5"
      />
      <text x={W - 145} y={70} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
        COMPLEXITY
      </text>
      <text x={W - 145} y={87} textAnchor="middle"
        fill={T.coral} fontFamily={T.mono} fontSize="12">
        O(n²) always
      </text>

      {arr.map((val, i) => {
        const bx = BARS_X0 + i * (BAR_W + BAR_GAP);
        const bh = barH(val);
        const by = BASE_Y - bh;
        const isSorted = doneIn > 0.1 ? true : i < sortedEnd;
        const isMin = i === minIdx && doneIn < 0.1;
        const isScan = i === scanIdx && doneIn < 0.1;
        const barColor = doneIn > 0.5 ? T.mint : isSorted ? T.mint : isMin ? T.coral : isScan ? T.amber : T.textDim;

        return (
          <g key={i}>
            <rect x={bx} y={by} width={BAR_W} height={bh} rx="6"
              fill={barColor}
              fillOpacity={isMin ? (hiMin ? 0.75 : 0.55) : isSorted ? 0.45 : isScan ? 0.45 : 0.25}
              stroke={barColor}
              strokeWidth={isMin || isScan ? 2.5 : 1.5}
              filter={isMin && hiMin ? "url(#ss-glow-sm)" : isScan ? "url(#ss-glow-sm)" : undefined}
            />
            <text x={bx + BAR_W / 2} y={by - 10} textAnchor="middle"
              fill={barColor} fontFamily={T.mono} fontSize="14" fontWeight="700">
              {val}
            </text>
            {isMin && (
              <text x={bx + BAR_W / 2} y={BASE_Y + 26} textAnchor="middle"
                fill={T.coral} fontFamily={T.sans} fontSize="10" fontWeight="700"
                filter={hiMin ? "url(#ss-glow-sm)" : undefined}>
                MIN
              </text>
            )}
            {isScan && !isMin && (
              <text x={bx + BAR_W / 2} y={BASE_Y + 26} textAnchor="middle"
                fill={T.amber} fontFamily={T.sans} fontSize="10">
                scan
              </text>
            )}
          </g>
        );
      })}

      {scanIdx > 0 && doneIn < 0.1 && (
        <line
          x1={BARS_X0 + scanIdx * (BAR_W + BAR_GAP) + BAR_W / 2}
          y1={BASE_Y - barH(arr[scanIdx]) - 14}
          x2={BARS_X0 + (scanIdx - 1) * (BAR_W + BAR_GAP) + BAR_W / 2}
          y2={BASE_Y - barH(arr[scanIdx - 1]) - 14}
          stroke={T.coral}
          strokeWidth="2"
          strokeDasharray="6 3"
          markerEnd="url(#ss-arr)"
          opacity={hiSel ? 0.9 : 0.5}
        />
      )}

      <rect x={W / 2 - 150} y={BASE_Y + 50} width={300} height={38} rx="19"
        fill={doneIn > 0.5 ? T.mint : T.bgDeep}
        fillOpacity={doneIn > 0.5 ? 0.22 : 0.6}
        stroke={doneIn > 0.5 ? T.mint : T.coral}
        strokeWidth="2"
        filter={doneIn > 0.5 || hiSel ? "url(#ss-glow-sm)" : undefined}
      />
      <text x={W / 2} y={BASE_Y + 74} textAnchor="middle"
        fill={doneIn > 0.5 ? T.mint : T.coral}
        fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="1.5">
        {doneIn > 0.5 ? "SORTED" : `ITERATION ${iteration} / ${N}  ·  MIN = ${minVal}`}
      </text>
    </svg>
  );
};
