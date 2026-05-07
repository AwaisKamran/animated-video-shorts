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

const INITIAL = [50, 20, 80, 30, 100, 40, 70];
const N = INITIAL.length;

const BAR_W = 90;
const BAR_GAP = 22;
const BARS_TOTAL = N * BAR_W + (N - 1) * BAR_GAP;
const BARS_X0 = (W - BARS_TOTAL) / 2;
const BLOCK_H = 100;
const BLOCK_Y = 250;

const STEPS = [
  { arr: [20, 50, 80, 30, 100, 40, 70], sortedEnd: 1, current: 2 },
  { arr: [20, 50, 80, 30, 100, 40, 70], sortedEnd: 2, current: 3 },
  { arr: [20, 30, 50, 80, 100, 40, 70], sortedEnd: 3, current: 4 },
  { arr: [20, 30, 50, 80, 100, 40, 70], sortedEnd: 4, current: 5 },
  { arr: [20, 30, 40, 50, 80, 100, 70], sortedEnd: 5, current: 6 },
  { arr: [20, 30, 40, 50, 70, 80, 100], sortedEnd: 6, current: -1 },
];

export const InsertionSortDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const overallIn = p(frame, duration, 0.00, 0.95);
  const doneIn    = p(frame, duration, 0.95, 1.00);

  const hiInsert = hi("INSERTION");
  const hiSorted = hi("SORTED PREFIX");

  const stepIdx = Math.min(STEPS.length - 1, Math.floor(overallIn * STEPS.length));
  const step = STEPS[stepIdx];
  const arr = step.arr;
  const sortedEnd = step.sortedEnd;
  const current = step.current;

  const liftProgress = interpolate(
    overallIn * STEPS.length - stepIdx,
    [0, 0.4],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const insertNum = stepIdx + 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="is-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="is-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <text x={W / 2} y={38} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3">
        INSERTION SORT · SORTED PREFIX GROWS
      </text>

      <rect x={W - 280} y={50} width={250} height={46} rx="10"
        fill={T.bgDeep} fillOpacity="0.7" stroke={T.border} strokeWidth="1.5"
      />
      <text x={W - 155} y={70} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
        COMPLEXITY
      </text>
      <text x={W - 155} y={87} textAnchor="middle"
        fill={T.amber} fontFamily={T.mono} fontSize="12">
        O(n²) avg · O(n) best
      </text>

      {arr.map((val, i) => {
        const bx = BARS_X0 + i * (BAR_W + BAR_GAP);
        const isSorted = doneIn > 0.1 ? true : i < sortedEnd;
        const isCurrent = i === current && doneIn < 0.1;
        const liftY = isCurrent ? liftProgress * 60 : 0;
        const blockTop = BLOCK_Y - liftY;
        const barColor = doneIn > 0.5 ? T.mint : isSorted ? T.mint : isCurrent ? T.amber : T.textDim;

        return (
          <g key={i}>
            <rect x={bx} y={blockTop} width={BAR_W} height={BLOCK_H} rx="6"
              fill={barColor}
              fillOpacity={isCurrent ? (hiInsert ? 0.75 : 0.55) : isSorted ? 0.45 : 0.25}
              stroke={barColor}
              strokeWidth={isCurrent ? 2.5 : 1.5}
              filter={isCurrent && hiInsert ? "url(#is-glow-sm)" : isSorted && hiSorted ? "url(#is-glow-sm)" : undefined}
            />
            <text x={bx + BAR_W / 2} y={blockTop + BLOCK_H / 2 + 6} textAnchor="middle"
              fill={barColor} fontFamily={T.mono} fontSize="14" fontWeight="700">
              {val}
            </text>
            {isCurrent && (
              <text x={bx + BAR_W / 2} y={BLOCK_Y + BLOCK_H + 24} textAnchor="middle"
                fill={T.amber} fontFamily={T.sans} fontSize="10" fontWeight="700">
                INSERT
              </text>
            )}
          </g>
        );
      })}

      {sortedEnd > 0 && doneIn < 0.1 && (
        <rect x={BARS_X0 - 6} y={BLOCK_Y - 8} width={(sortedEnd) * (BAR_W + BAR_GAP) - BAR_GAP + 12} height={BLOCK_H + 16} rx="10"
          fill="none" stroke={T.mint} strokeWidth="1.5" strokeDasharray="8 4"
          opacity={hiSorted ? 0.8 : 0.4}
          filter={hiSorted ? "url(#is-glow-sm)" : undefined}
        />
      )}

      <rect x={W / 2 - 120} y={BLOCK_Y + BLOCK_H + 60} width={240} height={38} rx="19"
        fill={doneIn > 0.5 ? T.mint : T.bgDeep}
        fillOpacity={doneIn > 0.5 ? 0.22 : 0.6}
        stroke={doneIn > 0.5 ? T.mint : T.violet}
        strokeWidth="2"
        filter={doneIn > 0.5 ? "url(#is-glow-sm)" : undefined}
      />
      <text x={W / 2} y={BLOCK_Y + BLOCK_H + 84} textAnchor="middle"
        fill={doneIn > 0.5 ? T.mint : T.violet}
        fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="1.5">
        {doneIn > 0.5 ? "SORTED" : `INSERTING ${insertNum} / ${N}`}
      </text>
    </svg>
  );
};
