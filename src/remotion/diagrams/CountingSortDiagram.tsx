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

const INPUT = [3, 1, 4, 1, 5, 0, 2, 6, 3];
const K = 7;
const COUNTS = [1, 2, 1, 2, 1, 1, 1];
const CUMULATIVE = [1, 3, 4, 6, 7, 8, 9];
const SORTED = [0, 1, 1, 2, 3, 3, 4, 5, 6];

const CELL_W = 58;
const CELL_H = 46;
const CELL_GAP = 6;

function rowX(n: number) { return (W - (n * CELL_W + (n - 1) * CELL_GAP)) / 2; }

const INPUT_Y = 80;
const COUNT_Y = 220;
const CUMUL_Y = 360;
const OUTPUT_Y = 510;

export const CountingSortDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const inputIn   = p(frame, duration, 0.00, 0.18);
  const countIn   = p(frame, duration, 0.18, 0.42);
  const cumulIn   = p(frame, duration, 0.42, 0.65);
  const outputIn  = p(frame, duration, 0.65, 0.90);
  const doneIn    = p(frame, duration, 0.90, 1.00);

  const hiCount   = hi("COUNTING");
  const hiBucket  = hi("BUCKET");
  const hiStable  = hi("STABLE");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cs-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cs-glow-sm">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cs-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
      </defs>

      <text x={W / 2} y={38} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3">
        COUNTING SORT · BUCKET-BASED STABLE SORT
      </text>

      {inputIn > 0 && (
        <g opacity={inputIn}>
          <text x={60} y={INPUT_Y + CELL_H / 2 + 6}
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
            INPUT
          </text>
          {INPUT.map((val, i) => {
            const cellX = rowX(INPUT.length) + i * (CELL_W + CELL_GAP);
            const cellAlpha = Math.max(0, Math.min(1, inputIn * INPUT.length - i));
            return (
              <g key={i} opacity={cellAlpha}>
                <rect x={cellX} y={INPUT_Y} width={CELL_W} height={CELL_H} rx="8"
                  fill={T.cyan} fillOpacity="0.15" stroke={T.cyan} strokeWidth="1.5"
                />
                <text x={cellX + CELL_W / 2} y={INPUT_Y + CELL_H / 2 + 6}
                  textAnchor="middle"
                  fill={T.cyan} fontFamily={T.mono} fontSize="16" fontWeight="700">
                  {val}
                </text>
                <text x={cellX + CELL_W / 2} y={INPUT_Y + CELL_H + 16}
                  textAnchor="middle"
                  fill={T.textDim} fontFamily={T.mono} fontSize="9">
                  [{i}]
                </text>
              </g>
            );
          })}
        </g>
      )}

      {inputIn > 0.5 && (
        <line x1={W / 2} y1={INPUT_Y + CELL_H + 28}
          x2={W / 2} y2={COUNT_Y - 14}
          stroke={T.border} strokeWidth="1.5" markerEnd="url(#cs-arr)"
          opacity={inputIn * 0.7}
        />
      )}

      {countIn > 0 && (
        <g opacity={countIn}>
          <text x={60} y={COUNT_Y + CELL_H / 2 + 6}
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
            COUNT
          </text>
          {COUNTS.map((val, i) => {
            const cellX = rowX(K) + i * (CELL_W + CELL_GAP);
            const cellAlpha = Math.max(0, Math.min(1, countIn * K - i));
            const isHi = hiBucket || hiCount;
            return (
              <g key={i} opacity={cellAlpha}>
                <rect x={cellX} y={COUNT_Y} width={CELL_W} height={CELL_H} rx="8"
                  fill={T.violet} fillOpacity={isHi ? 0.25 : 0.15}
                  stroke={T.violet} strokeWidth="1.5"
                  filter={isHi ? "url(#cs-glow-sm)" : undefined}
                />
                <text x={cellX + CELL_W / 2} y={COUNT_Y + CELL_H / 2 + 6}
                  textAnchor="middle"
                  fill={T.violet} fontFamily={T.mono} fontSize="16" fontWeight="700">
                  {val}
                </text>
                <text x={cellX + CELL_W / 2} y={COUNT_Y + CELL_H + 16}
                  textAnchor="middle"
                  fill={T.textDim} fontFamily={T.mono} fontSize="9">
                  [{i}]
                </text>
                <text x={cellX + CELL_W / 2} y={COUNT_Y - 8}
                  textAnchor="middle"
                  fill={T.textDim} fontFamily={T.mono} fontSize="9">
                  k={i}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {countIn > 0.7 && (
        <line x1={W / 2} y1={COUNT_Y + CELL_H + 28}
          x2={W / 2} y2={CUMUL_Y - 14}
          stroke={T.border} strokeWidth="1.5" markerEnd="url(#cs-arr)"
          opacity={countIn * 0.7}
        />
      )}

      {cumulIn > 0 && (
        <g opacity={cumulIn}>
          <text x={60} y={CUMUL_Y + CELL_H / 2 + 6}
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
            CUMUL.
          </text>
          {CUMULATIVE.map((val, i) => {
            const cellX = rowX(K) + i * (CELL_W + CELL_GAP);
            const cellAlpha = Math.max(0, Math.min(1, cumulIn * K - i));
            return (
              <g key={i} opacity={cellAlpha}>
                <rect x={cellX} y={CUMUL_Y} width={CELL_W} height={CELL_H} rx="8"
                  fill={T.amber} fillOpacity="0.18" stroke={T.amber} strokeWidth="1.5"
                />
                <text x={cellX + CELL_W / 2} y={CUMUL_Y + CELL_H / 2 + 6}
                  textAnchor="middle"
                  fill={T.amber} fontFamily={T.mono} fontSize="16" fontWeight="700">
                  {val}
                </text>
              </g>
            );
          })}
          <text x={rowX(K) + K * (CELL_W + CELL_GAP) + 10} y={CUMUL_Y + CELL_H / 2 + 6}
            fill={T.textDim} fontFamily={T.sans} fontSize="10">
            prefix sum
          </text>
        </g>
      )}

      {cumulIn > 0.7 && (
        <line x1={W / 2} y1={CUMUL_Y + CELL_H + 28}
          x2={W / 2} y2={OUTPUT_Y - 14}
          stroke={T.border} strokeWidth="1.5" markerEnd="url(#cs-arr)"
          opacity={cumulIn * 0.7}
        />
      )}

      {outputIn > 0 && (
        <g opacity={outputIn}>
          <text x={60} y={OUTPUT_Y + CELL_H / 2 + 6}
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
            OUTPUT
          </text>
          {SORTED.map((val, i) => {
            const cellX = rowX(SORTED.length) + i * (CELL_W + CELL_GAP);
            const cellAlpha = Math.max(0, Math.min(1, outputIn * SORTED.length - i));
            return (
              <g key={i} opacity={cellAlpha}>
                <rect x={cellX} y={OUTPUT_Y} width={CELL_W} height={CELL_H} rx="8"
                  fill={T.mint} fillOpacity={doneIn > 0.5 ? 0.35 : 0.20}
                  stroke={T.mint} strokeWidth={doneIn > 0.5 ? 2.5 : 1.5}
                  filter={doneIn > 0.5 && hiStable ? "url(#cs-glow-sm)" : undefined}
                />
                <text x={cellX + CELL_W / 2} y={OUTPUT_Y + CELL_H / 2 + 6}
                  textAnchor="middle"
                  fill={T.mint} fontFamily={T.mono} fontSize="16" fontWeight="700">
                  {val}
                </text>
              </g>
            );
          })}
        </g>
      )}

      <rect x={W - 200} y={44} width={170} height={32} rx="10"
        fill={T.bgDeep} fillOpacity="0.7" stroke={T.border} strokeWidth="1.5"
      />
      <text x={W - 115} y={65} textAnchor="middle"
        fill={T.mint} fontFamily={T.mono} fontSize="12">
        O(n + k)
      </text>
    </svg>
  );
};
