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

const INITIAL = [40, 80, 30, 100, 60, 20, 90];
const N = INITIAL.length;

const BAR_W = 90;
const BAR_GAP = 20;
const BARS_TOTAL = N * BAR_W + (N - 1) * BAR_GAP;
const BARS_X0 = (W - BARS_TOTAL) / 2;
const BLOCK_H = 100;
const BLOCK_Y = 250;

const PASSES = [
  [
    { arr: [40, 80, 30, 100, 60, 20, 90], hi: [0, 1] },
    { arr: [40, 30, 80, 100, 60, 20, 90], hi: [1, 2] },
    { arr: [40, 30, 80, 100, 60, 20, 90], hi: [2, 3] },
    { arr: [40, 30, 80, 60, 100, 20, 90], hi: [3, 4] },
    { arr: [40, 30, 80, 60, 20, 100, 90], hi: [4, 5] },
    { arr: [40, 30, 80, 60, 20, 90, 100], hi: [5, 6] },
  ],
  [
    { arr: [30, 40, 80, 60, 20, 90, 100], hi: [0, 1] },
    { arr: [30, 40, 60, 80, 20, 90, 100], hi: [2, 3] },
    { arr: [30, 40, 60, 20, 80, 90, 100], hi: [3, 4] },
  ],
  [
    { arr: [30, 40, 20, 60, 80, 90, 100], hi: [1, 2] },
    { arr: [20, 30, 40, 60, 80, 90, 100], hi: [0, 1] },
  ],
];

const SORTED_FINAL = [20, 30, 40, 60, 80, 90, 100];

export const BubbleSortDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const pass1In   = p(frame, duration, 0.00, 0.33);
  const pass2In   = p(frame, duration, 0.33, 0.62);
  const pass3In   = p(frame, duration, 0.62, 0.82);
  const sortedIn  = p(frame, duration, 0.82, 1.00);

  const hiBubble = hi("BUBBLE");
  const hiSwap   = hi("SWAP");
  const hiPass   = hi("PASS");

  let currentArr = INITIAL;
  let highlightPair: number[] = [];
  let currentPass = 0;
  let passLabel = "PASS 1";

  const overallProgress = pass1In > 0.01 ? (pass2In > 0.01 ? (pass3In > 0.01 ? (sortedIn > 0.01 ? 4 : 3) : 2) : 1) : 0;

  if (overallProgress === 1) {
    const passSteps = PASSES[0];
    const stepIdx = Math.floor(pass1In * passSteps.length);
    const step = passSteps[Math.min(stepIdx, passSteps.length - 1)];
    currentArr = step.arr;
    highlightPair = step.hi;
    currentPass = 0;
    passLabel = "PASS 1";
  } else if (overallProgress === 2) {
    const passSteps = PASSES[1];
    const stepIdx = Math.floor(pass2In * passSteps.length);
    const step = passSteps[Math.min(stepIdx, passSteps.length - 1)];
    currentArr = step.arr;
    highlightPair = step.hi;
    currentPass = 1;
    passLabel = "PASS 2";
  } else if (overallProgress === 3) {
    const passSteps = PASSES[2];
    const stepIdx = Math.floor(pass3In * passSteps.length);
    const step = passSteps[Math.min(stepIdx, passSteps.length - 1)];
    currentArr = step.arr;
    highlightPair = step.hi;
    currentPass = 2;
    passLabel = "PASS 3";
  } else if (overallProgress === 4) {
    currentArr = SORTED_FINAL;
    highlightPair = [];
    currentPass = 3;
    passLabel = "SORTED";
  }

  const sortedFrom = [N - 1 - currentPass, N - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="bs-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bs-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <text x={W / 2} y={38} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3">
        BUBBLE SORT · ADJACENT SWAPS
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
        O(n²) worst · O(n) best
      </text>

      {currentArr.map((val, i) => {
        const bx = BARS_X0 + i * (BAR_W + BAR_GAP);
        const isHighlighted = highlightPair.includes(i);
        const isSortedFinal = overallProgress === 4;
        const isSortedPos = i >= sortedFrom[0] && overallProgress < 4;
        const barColor = isSortedFinal ? T.mint : isSortedPos ? T.mint : isHighlighted ? T.amber : T.cyan;
        const isSwap = hiSwap && isHighlighted;

        return (
          <g key={i}>
            <rect x={bx} y={BLOCK_Y} width={BAR_W} height={BLOCK_H} rx="6"
              fill={barColor}
              fillOpacity={isHighlighted ? (hiBubble || hiSwap ? 0.75 : 0.55) : 0.35}
              stroke={barColor}
              strokeWidth={isHighlighted ? 2.5 : 1.5}
              filter={(isHighlighted && (hiBubble || hiSwap)) || isSwap ? "url(#bs-glow-sm)" : undefined}
            />
            <text x={bx + BAR_W / 2} y={BLOCK_Y + BLOCK_H / 2 + 6} textAnchor="middle"
              fill={barColor} fontFamily={T.mono} fontSize="14" fontWeight="700">
              {val}
            </text>
          </g>
        );
      })}

      {highlightPair.length === 2 && hiSwap && (
        <g>
          <text x={BARS_X0 + highlightPair[0] * (BAR_W + BAR_GAP) + BAR_W / 2} y={BLOCK_Y + BLOCK_H + 24}
            textAnchor="middle" fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700">
            SWAP
          </text>
        </g>
      )}

      <rect x={W / 2 - 90} y={BLOCK_Y + BLOCK_H + 60} width={180} height={38} rx="19"
        fill={overallProgress === 4 ? T.mint : (hiPass ? T.cyan : T.bgDeep)}
        fillOpacity={overallProgress === 4 ? 0.22 : (hiPass ? 0.18 : 0.6)}
        stroke={overallProgress === 4 ? T.mint : T.cyan}
        strokeWidth="2"
        filter={(overallProgress === 4 || hiPass) ? "url(#bs-glow-sm)" : undefined}
      />
      <text x={W / 2} y={BLOCK_Y + BLOCK_H + 84} textAnchor="middle"
        fill={overallProgress === 4 ? T.mint : T.cyan}
        fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="2">
        {passLabel}
      </text>
    </svg>
  );
};
