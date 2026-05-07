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

const AXIS_X = 300;
const AXIS_W = 560;
const BAR_H = 54;
const ROW_GAP = 110;
const ROW1_Y = 170;
const ROW2_Y = ROW1_Y + ROW_GAP;
const ROW3_Y = ROW2_Y + ROW_GAP;
const MAX_MS = 4000;

const STRATEGIES = [
  {
    label:  "Sequential",
    sub:    "one at a time",
    ms:     4000,
    color:  T.coral,
    phase:  [0.05, 0.32] as [number, number],
  },
  {
    label:  "Parallel All",
    sub:    "all at once",
    ms:     1200,
    color:  T.amber,
    phase:  [0.36, 0.58] as [number, number],
  },
  {
    label:  "Parallel + Cache",
    sub:    "cached results",
    ms:     400,
    color:  T.mint,
    phase:  [0.62, 0.78] as [number, number],
  },
];

const ROW_YS = [ROW1_Y, ROW2_Y, ROW3_Y];

export const LatencyBarsDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axisIn  = p(frame, duration, 0.00, 0.12);
  const badgeIn = p(frame, duration, 0.82, 1.00);

  const hiLatency  = hi("LATENCY");
  const hiSpeedup  = hi("SPEEDUP");

  // X-axis ticks
  const ticks = [0, 1000, 2000, 3000, 4000];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="lb-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lb-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Title ── */}
      <text x={W / 2} y={48} textAnchor="middle"
        fill={hiLatency ? T.amber : T.textDim}
        fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        filter={hiLatency ? "url(#lb-glow-sm)" : undefined}>
        LATENCY COMPARISON
      </text>

      {/* ── X-axis ── */}
      <g opacity={axisIn}>
        <line x1={AXIS_X} y1={ROW3_Y + BAR_H + 28} x2={AXIS_X + AXIS_W + 20} y2={ROW3_Y + BAR_H + 28}
          stroke={T.border} strokeWidth="1.5" />
        {ticks.map(ms => {
          const tx = AXIS_X + (ms / MAX_MS) * AXIS_W;
          return (
            <g key={ms}>
              <line x1={tx} y1={ROW3_Y + BAR_H + 24} x2={tx} y2={ROW3_Y + BAR_H + 32}
                stroke={T.border} strokeWidth="1.5" />
              <text x={tx} y={ROW3_Y + BAR_H + 48} textAnchor="middle"
                fill={T.textDim} fontFamily={T.mono} fontSize="11">
                {ms === 0 ? "0" : `${ms / 1000}s`}
              </text>
            </g>
          );
        })}
      </g>

      {/* ── Bars ── */}
      {STRATEGIES.map((strat, i) => {
        const rowY = ROW_YS[i];
        const barP = p(frame, duration, strat.phase[0], strat.phase[1]);
        const fullW = (strat.ms / MAX_MS) * AXIS_W;
        const curW = fullW * barP;
        const labelOpacity = interpolate(barP, [0.7, 1], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const isLast = i === 2;

        return (
          <g key={strat.label}>
            {/* Strategy label */}
            <text x={AXIS_X - 14} y={rowY + BAR_H / 2 - 6} textAnchor="end"
              fill={strat.color} fontFamily={T.sans} fontSize="14" fontWeight="800"
              opacity={axisIn}>
              {strat.label}
            </text>
            <text x={AXIS_X - 14} y={rowY + BAR_H / 2 + 14} textAnchor="end"
              fill={T.textDim} fontFamily={T.mono} fontSize="10"
              opacity={axisIn}>
              {strat.sub}
            </text>

            {/* Bar background track */}
            <rect x={AXIS_X} y={rowY} width={AXIS_W} height={BAR_H} rx="10"
              fill={T.bgDeep} stroke={T.border} strokeWidth="1"
              opacity={axisIn}
            />

            {/* Growing bar */}
            {barP > 0 && (
              <rect x={AXIS_X} y={rowY} width={curW} height={BAR_H} rx="10"
                fill={strat.color} fillOpacity={isLast ? 0.85 : 0.70}
                filter={isLast ? "url(#lb-glow-sm)" : undefined}
              />
            )}

            {/* ms label at end of bar */}
            {labelOpacity > 0 && (
              <text x={AXIS_X + curW + 10} y={rowY + BAR_H / 2 + 6} textAnchor="start"
                fill={strat.color} fontFamily={T.mono} fontSize="14" fontWeight="700"
                opacity={labelOpacity}>
                {strat.ms}ms
              </text>
            )}

            {/* Critical path dashed overlay for parallel bars */}
            {i > 0 && barP > 0.8 && (
              <g opacity={interpolate(barP, [0.8, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
                <line x1={AXIS_X} y1={rowY - 8} x2={AXIS_X + fullW} y2={rowY - 8}
                  stroke={strat.color} strokeWidth="2" strokeDasharray="6 3" opacity={0.6} />
                <text x={AXIS_X + fullW / 2} y={rowY - 14} textAnchor="middle"
                  fill={strat.color} fontFamily={T.mono} fontSize="9" opacity={0.7}>
                  critical path
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── Speedup callout ── */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          {/* Connector from seq bar to badge */}
          <line x1={AXIS_X + AXIS_W} y1={ROW1_Y + BAR_H / 2}
            x2={AXIS_X + AXIS_W + 80} y2={ROW1_Y + BAR_H / 2}
            stroke={T.coral} strokeWidth="1.5" strokeDasharray="4 3" opacity={0.5} />
          <line x1={AXIS_X + AXIS_W} y1={ROW3_Y + BAR_H / 2}
            x2={AXIS_X + AXIS_W + 80} y2={ROW3_Y + BAR_H / 2}
            stroke={T.mint} strokeWidth="1.5" strokeDasharray="4 3" opacity={0.5} />
          <line x1={AXIS_X + AXIS_W + 80} y1={ROW1_Y + BAR_H / 2}
            x2={AXIS_X + AXIS_W + 80} y2={ROW3_Y + BAR_H / 2}
            stroke={T.border} strokeWidth="1.5" opacity={0.5} />

          {/* Badge box */}
          <rect x={850} y={ROW1_Y + 30} width={200} height={110} rx="18"
            fill={hiSpeedup ? `${T.mint}22` : `${T.mint}14`}
            stroke={T.mint} strokeWidth={hiSpeedup ? 2.5 : 1.5}
            filter={hiSpeedup ? "url(#lb-glow)" : undefined}
          />
          <text x={950} y={ROW1_Y + 82} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="36" fontWeight="900"
            filter={hiSpeedup ? "url(#lb-glow)" : undefined}>
            10×
          </text>
          <text x={950} y={ROW1_Y + 110} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
            filter={hiSpeedup ? "url(#lb-glow-sm)" : undefined}>
            SPEEDUP
          </text>
        </g>
      )}

      {/* ── Bottom summary ── */}
      {badgeIn > 0.6 && (
        <text x={W / 2} y={620} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="12"
          opacity={interpolate(badgeIn, [0.6, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          cache + parallelism reduces 4000ms → 400ms
        </text>
      )}
    </svg>
  );
};
