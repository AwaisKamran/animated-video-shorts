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

const BAR_X = 80, BAR_Y = 280, BAR_W = W - 160, BAR_H = 88;
const LIMIT_TOKENS = 8000;

const SEGMENTS = [
  { label: "System",  tokens: 500,  color: T.violet, shortLabel: "SYS" },
  { label: "History", tokens: 6000, color: T.cyan,   shortLabel: "HIST" },
  { label: "RAG",     tokens: 1500, color: T.mint,   shortLabel: "RAG" },
  { label: "User",    tokens: 200,  color: T.amber,  shortLabel: "USER" },
];

const TOTAL_TOKENS = SEGMENTS.reduce((s, seg) => s + seg.tokens, 0); // 8200
const OVERFLOW = TOTAL_TOKENS - LIMIT_TOKENS; // 200
// How much to cut from history (oldest portion)
const HISTORY_CUT = OVERFLOW + 200; // 400 tokens cut to have a visible animation

export const TruncationDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const barFillP    = p(frame, duration, 0.00, 0.30);
  const limitHitP   = p(frame, duration, 0.30, 0.46);
  const cutAnimP    = p(frame, duration, 0.46, 0.65);
  const fadeCutP    = p(frame, duration, 0.65, 0.80);
  const successP    = p(frame, duration, 0.80, 1.00);

  const hiTruncate  = hi("TRUNCATE");
  const hiLimit     = hi("LIMIT");

  // Compute segment widths at current fill progress
  const totalFilled = SEGMENTS.reduce((acc, seg, i) => {
    const segProg = Math.max(0, Math.min(1, barFillP * 4 - i));
    return acc + seg.tokens * segProg;
  }, 0);

  // After cut animation, history shrinks
  const historyCutAmount = cutAnimP * HISTORY_CUT;
  const historyAfterCut = SEGMENTS[1].tokens - historyCutAmount;

  let runX = BAR_X;
  type SegBar = { x: number; w: number; color: string; label: string; shortLabel: string; tokens: number; idx: number };
  const segBars: SegBar[] = [];

  SEGMENTS.forEach((seg, i) => {
    const segProg = Math.max(0, Math.min(1, barFillP * 4 - i));
    let effectiveTokens = seg.tokens * segProg;
    if (i === 1) {
      // Apply cut to history
      const historyFilled = SEGMENTS[1].tokens * segProg;
      effectiveTokens = Math.max(0, historyFilled - historyCutAmount);
    }
    const rawW = (effectiveTokens / LIMIT_TOKENS) * BAR_W;
    segBars.push({ x: runX, w: rawW, color: seg.color, label: seg.label, shortLabel: seg.shortLabel, tokens: Math.round(effectiveTokens), idx: i });
    runX += rawW;
  });

  const usedTokens = segBars.reduce((acc, s) => acc + s.tokens, 0);
  const usedWidth  = (Math.min(usedTokens, LIMIT_TOKENS * 1.08) / LIMIT_TOKENS) * BAR_W;
  const limitX     = BAR_X + BAR_W;

  // Cut zone: the oldest part of history that gets removed
  const historyBar   = segBars[1];
  const cutW         = (historyCutAmount / LIMIT_TOKENS) * BAR_W;
  const cutX         = historyBar.x; // cut from the left (oldest) of history

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="trunc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="trunc-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="trunc-bar-clip">
          <rect x={BAR_X} y={BAR_Y - 4} width={BAR_W} height={BAR_H + 8} rx="14" />
        </clipPath>
      </defs>

      {/* Title */}
      <text x={W / 2} y={52} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={barFillP}>
        CONTEXT WINDOW TRUNCATION
      </text>

      {/* Token counter */}
      {barFillP > 0.2 && (
        <text x={W / 2} y={110} textAnchor="middle"
          fill={hiLimit ? T.coral : T.textSecondary}
          fontFamily={T.mono} fontSize="26" fontWeight="800"
          filter={hiLimit && limitHitP > 0 ? "url(#trunc-glow-sm)" : undefined}
          opacity={barFillP}>
          {usedTokens.toLocaleString()} / {LIMIT_TOKENS.toLocaleString()} tokens
        </text>
      )}

      {/* LIMIT indicator above bar */}
      <g opacity={barFillP}>
        <line x1={limitX} y1={BAR_Y - 30} x2={limitX} y2={BAR_Y + BAR_H + 30}
          stroke={T.coral} strokeWidth="2.5" strokeDasharray="6 4"
        />
        <rect x={limitX - 60} y={BAR_Y - 60} width={120} height={28} rx="14"
          fill={T.coral} fillOpacity={hiLimit ? 0.3 : 0.15}
          stroke={T.coral} strokeWidth={hiLimit ? 2.5 : 1.5}
          filter={hiLimit ? "url(#trunc-glow)" : undefined}
        />
        <text x={limitX} y={BAR_Y - 40} textAnchor="middle"
          fill={T.coral} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="2">
          LIMIT: {LIMIT_TOKENS.toLocaleString()}
        </text>
      </g>

      {/* Bar background */}
      <rect x={BAR_X} y={BAR_Y} width={BAR_W} height={BAR_H} rx="14"
        fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="2"
        opacity={barFillP}
      />

      {/* Segment bars */}
      <g clipPath="url(#trunc-bar-clip)">
        {segBars.map((seg) => {
          if (seg.w <= 0) return null;
          const isHighlight = hiTruncate && seg.idx === 1;
          return (
            <g key={seg.idx}>
              <rect x={seg.x} y={BAR_Y} width={seg.w} height={BAR_H}
                fill={seg.color}
                fillOpacity={isHighlight ? 0.5 : 0.35}
                filter={isHighlight ? "url(#trunc-glow-sm)" : undefined}
              />
              {seg.w > 50 && (
                <>
                  <text x={seg.x + seg.w / 2} y={BAR_Y + BAR_H / 2 - 6} textAnchor="middle"
                    fill={seg.color} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="0.5">
                    {seg.shortLabel}
                  </text>
                  <text x={seg.x + seg.w / 2} y={BAR_Y + BAR_H / 2 + 12} textAnchor="middle"
                    fill={seg.color} fontFamily={T.mono} fontSize="10" opacity={0.8}>
                    {seg.tokens.toLocaleString()}t
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>

      {/* Overflow indicator — the portion past the limit line */}
      {limitHitP > 0 && usedTokens > LIMIT_TOKENS && cutAnimP < 0.8 && (
        <g opacity={limitHitP * (1 - fadeCutP)}>
          <rect
            x={limitX}
            y={BAR_Y}
            width={Math.max(0, usedWidth - BAR_W)}
            height={BAR_H}
            rx="0"
            fill={T.coral} fillOpacity={0.35}
            stroke={T.coral} strokeWidth="2"
            filter="url(#trunc-glow)"
          />
          <text x={limitX + 24} y={BAR_Y + BAR_H / 2 + 5} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="12" fontWeight="700">
            +{OVERFLOW}
          </text>
        </g>
      )}

      {/* Cut zone highlight on history bar */}
      {cutAnimP > 0 && cutW > 0 && (
        <g opacity={Math.min(1, cutAnimP * 2) * (1 - fadeCutP)}>
          <rect x={cutX} y={BAR_Y - 4} width={cutW} height={BAR_H + 8}
            fill={T.coral} fillOpacity={0.5}
            stroke={T.coral} strokeWidth="2.5"
            filter="url(#trunc-glow)"
            rx="6"
          />
          {/* Scissors symbol */}
          <text x={cutX + cutW / 2} y={BAR_Y - 18} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="18"
            opacity={cutAnimP}>
            ✂
          </text>
        </g>
      )}

      {/* OLDEST HISTORY DROPPED label */}
      {fadeCutP > 0 && (
        <g opacity={fadeCutP}>
          <rect x={BAR_X - 8} y={BAR_Y + BAR_H + 20} width={220} height={32} rx="8"
            fill={T.coral} fillOpacity={0.15}
            stroke={T.coral} strokeWidth="1.5"
          />
          <text x={BAR_X + 102} y={BAR_Y + BAR_H + 42} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1">
            OLDEST HISTORY DROPPED
          </text>
        </g>
      )}

      {/* KEPT / CUT legend */}
      {fadeCutP > 0.3 && (
        <g opacity={(fadeCutP - 0.3) / 0.7}>
          <rect x={BAR_X} y={BAR_Y + BAR_H + 68} width={16} height={16} rx="4"
            fill={T.mint} fillOpacity={0.7}
          />
          <text x={BAR_X + 24} y={BAR_Y + BAR_H + 81}
            fill={T.mint} fontFamily={T.sans} fontSize="12">
            KEPT
          </text>
          <rect x={BAR_X + 90} y={BAR_Y + BAR_H + 68} width={16} height={16} rx="4"
            fill={T.coral} fillOpacity={0.7}
          />
          <text x={BAR_X + 114} y={BAR_Y + BAR_H + 81}
            fill={T.coral} fontFamily={T.sans} fontSize="12">
            CUT ({HISTORY_CUT} tokens)
          </text>
        </g>
      )}

      {/* Success badge */}
      {successP > 0 && (
        <g opacity={successP}>
          <rect x={W / 2 - 130} y={BAR_Y + BAR_H + 120} width={260} height={52} rx="26"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2.5"
            filter="url(#trunc-glow-sm)"
          />
          <text x={W / 2} y={BAR_Y + BAR_H + 153} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            FITS WITHIN LIMIT
          </text>
        </g>
      )}

      {/* Legend row */}
      {barFillP > 0.8 && (
        <g opacity={barFillP}>
          {SEGMENTS.map((seg, i) => (
            <g key={i}>
              <rect x={BAR_X + i * 230} y={BAR_Y - 100} width={14} height={14} rx="3"
                fill={seg.color} fillOpacity={0.7}
              />
              <text x={BAR_X + i * 230 + 22} y={BAR_Y - 89}
                fill={T.textDim} fontFamily={T.sans} fontSize="11">
                {seg.label} ({seg.tokens.toLocaleString()}t)
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};
