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

const MSG_COUNT = 10;
const MSG_TOKEN = 500;
const TOTAL_TOKENS = MSG_COUNT * MSG_TOKEN;
const SUMMARY_TOKENS = 800;
const SAVINGS_PCT = Math.round((1 - SUMMARY_TOKENS / TOTAL_TOKENS) * 100);

const LEFT_X = 60, MSG_W = 220, MSG_H = 40, MSG_GAP = 8;
const MSGS_START_Y = 100;
const ARROW_X = LEFT_X + MSG_W + 40;
const ARROW_TARGET_X = ARROW_X + 120;
const SUMMARY_X = ARROW_TARGET_X + 20;
const SUMMARY_W = 260, SUMMARY_H = 260;
const COUNTER_Y = 590;

export const SummarizeDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const msgsIn      = p(frame, duration, 0.00, 0.22);
  const countP      = p(frame, duration, 0.22, 0.42);
  const arrowP      = p(frame, duration, 0.42, 0.60);
  const summaryIn   = p(frame, duration, 0.60, 0.78);
  const savingsIn   = p(frame, duration, 0.78, 1.00);

  const hiSummarize = hi("SUMMARIZE");
  const hiTokens    = hi("TOKENS");

  const visibleCount = Math.round(interpolate(countP, [0, 1], [0, TOTAL_TOKENS], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sum-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sum-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="sum-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={50} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={msgsIn}>
        CONVERSATION SUMMARIZATION
      </text>

      {/* ── Message stack ── */}
      {Array.from({ length: MSG_COUNT }).map((_, i) => {
        const msgY = MSGS_START_Y + i * (MSG_H + MSG_GAP);
        const msgP = p(frame, duration, i * 0.022, i * 0.022 + 0.12);
        if (msgP <= 0) return null;
        const isFading = arrowP > 0.2;
        return (
          <g key={i} opacity={msgP * (isFading ? interpolate(arrowP, [0.2, 0.7], [1, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1)}>
            <rect x={LEFT_X} y={msgY} width={MSG_W} height={MSG_H} rx="8"
              fill={T.cyan} fillOpacity={0.1}
              stroke={T.cyan} strokeWidth="1.2"
            />
            <text x={LEFT_X + 12} y={msgY + MSG_H / 2 + 5}
              fill={T.cyan} fontFamily={T.mono} fontSize="11">
              msg_{i + 1}
            </text>
            <text x={LEFT_X + MSG_W - 12} y={msgY + MSG_H / 2 + 5}
              textAnchor="end"
              fill={hiTokens ? T.amber : T.textDim}
              fontFamily={T.mono} fontSize="10"
              filter={hiTokens ? "url(#sum-glow-sm)" : undefined}>
              ~{MSG_TOKEN}t
            </text>
          </g>
        );
      })}

      {/* ── Token counter ── */}
      {countP > 0 && (
        <text x={LEFT_X + MSG_W / 2} y={COUNTER_Y} textAnchor="middle"
          fill={hiTokens ? T.amber : T.textSecondary}
          fontFamily={T.mono} fontSize="20" fontWeight="800"
          filter={hiTokens ? "url(#sum-glow-sm)" : undefined}
          opacity={countP}>
          {visibleCount.toLocaleString()} tokens
        </text>
      )}

      {/* ── Summarize arrow ── */}
      {arrowP > 0 && (
        <g opacity={arrowP}>
          {/* Animated arrow shaft */}
          <line
            x1={ARROW_X}
            y1={MSGS_START_Y + (MSG_COUNT * (MSG_H + MSG_GAP)) / 2}
            x2={ARROW_X + 100 * arrowP}
            y2={MSGS_START_Y + (MSG_COUNT * (MSG_H + MSG_GAP)) / 2}
            stroke={T.amber} strokeWidth="3"
            markerEnd="url(#sum-arr)"
          />
          {/* Label */}
          <rect
            x={ARROW_X - 4}
            y={MSGS_START_Y + (MSG_COUNT * (MSG_H + MSG_GAP)) / 2 - 36}
            width={110} height={28} rx="14"
            fill={T.amber} fillOpacity={hiSummarize ? 0.3 : 0.18}
            stroke={T.amber} strokeWidth={hiSummarize ? 2.5 : 1.5}
            filter={hiSummarize ? "url(#sum-glow)" : undefined}
          />
          <text
            x={ARROW_X + 51}
            y={MSGS_START_Y + (MSG_COUNT * (MSG_H + MSG_GAP)) / 2 - 16}
            textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="12" fontWeight="800" letterSpacing="1">
            SUMMARIZE
          </text>
          {/* Animated dots */}
          {[0, 1, 2].map(d => (
            <circle key={d}
              cx={ARROW_X + 20 + d * 20}
              cy={MSGS_START_Y + (MSG_COUNT * (MSG_H + MSG_GAP)) / 2 + 22}
              r="4"
              fill={T.amber}
              opacity={Math.max(0, Math.sin(arrowP * Math.PI * 3 + d * 1.2) * 0.5 + 0.5)}
            />
          ))}
        </g>
      )}

      {/* ── Summary block ── */}
      {summaryIn > 0 && (
        <g opacity={summaryIn}>
          <rect x={SUMMARY_X} y={MSGS_START_Y + 20}
            width={SUMMARY_W} height={SUMMARY_H} rx="16"
            fill={T.mint} fillOpacity={0.12}
            stroke={T.mint} strokeWidth="2.5"
            filter="url(#sum-glow-sm)"
          />
          <text x={SUMMARY_X + SUMMARY_W / 2} y={MSGS_START_Y + 20 + 30} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2">
            SUMMARY
          </text>
          <line x1={SUMMARY_X + 16} y1={MSGS_START_Y + 20 + 44}
            x2={SUMMARY_X + SUMMARY_W - 16} y2={MSGS_START_Y + 20 + 44}
            stroke={T.mint} strokeWidth="1" strokeOpacity="0.4"
          />
          {/* Summary contents */}
          {[
            "Key topics: memory, context",
            "User wants: Python examples",
            "Decided: use LRU strategy",
            "Next: implement caching",
          ].map((line, i) => (
            <text key={i}
              x={SUMMARY_X + 18} y={MSGS_START_Y + 20 + 70 + i * 26}
              fill={T.mint} fontFamily={T.mono} fontSize="11"
              opacity={Math.min(1, (summaryIn - 0.1 * i) * 4)}>
              • {line}
            </text>
          ))}
          {/* Token badge */}
          <rect x={SUMMARY_X + SUMMARY_W / 2 - 55} y={MSGS_START_Y + 20 + SUMMARY_H - 44}
            width={110} height={28} rx="14"
            fill={hiTokens ? T.amber : T.mint} fillOpacity={0.22}
            stroke={hiTokens ? T.amber : T.mint} strokeWidth="1.5"
            filter={hiTokens ? "url(#sum-glow-sm)" : undefined}
          />
          <text x={SUMMARY_X + SUMMARY_W / 2} y={MSGS_START_Y + 20 + SUMMARY_H - 24}
            textAnchor="middle"
            fill={hiTokens ? T.amber : T.mint} fontFamily={T.mono} fontSize="11" fontWeight="700">
            {SUMMARY_TOKENS} tokens
          </text>
        </g>
      )}

      {/* ── Savings reveal ── */}
      {savingsIn > 0 && (
        <g opacity={savingsIn}>
          {/* Arrow from old count to new */}
          <text x={W / 2 + 40} y={COUNTER_Y - 8} textAnchor="middle"
            fill={hiTokens ? T.amber : T.textSecondary}
            fontFamily={T.mono} fontSize="18" fontWeight="800"
            filter={hiTokens ? "url(#sum-glow-sm)" : undefined}>
            {TOTAL_TOKENS.toLocaleString()} → {SUMMARY_TOKENS} tokens
          </text>
          {/* Savings badge */}
          <rect x={W / 2 - 90} y={COUNTER_Y + 14} width={220} height={46} rx="23"
            fill={T.mint} fillOpacity={0.18}
            stroke={T.mint} strokeWidth="2.5"
            filter="url(#sum-glow)"
          />
          <text x={W / 2 + 20} y={COUNTER_Y + 44} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="1">
            {SAVINGS_PCT}% SAVED
          </text>
        </g>
      )}
    </svg>
  );
};
