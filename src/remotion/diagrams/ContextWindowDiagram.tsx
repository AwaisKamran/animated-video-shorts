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

const BAR_X = 80, BAR_Y = 280, BAR_W = W - 160, BAR_H = 80;
const MAX_TOKENS = 200000;

const SEGMENTS = [
  { label: "System Prompt",  tokens: 8000,  color: T.violet },
  { label: "History",        tokens: 90000, color: T.cyan   },
  { label: "RAG Context",    tokens: 70000, color: T.mint   },
  { label: "Current Msg",    tokens: 12000, color: T.amber  },
];

export const ContextWindowDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const barIn       = p(frame, duration, 0.00, 0.20);
  const fillP       = p(frame, duration, 0.20, 0.50);
  const warningP    = p(frame, duration, 0.50, 0.75);
  const truncateP   = p(frame, duration, 0.75, 0.90);
  const managedIn   = p(frame, duration, 0.90, 1.00);

  const hiContext   = hi("CONTEXT");
  const hiToken     = hi("TOKEN");
  const hiTruncate  = hi("TRUNCATE");
  const hiSummarize = hi("SUMMARIZE");

  const totalVisible = SEGMENTS.reduce((acc, seg, i) => {
    const segProg = Math.max(0, Math.min(1, fillP * 4 - i));
    return acc + seg.tokens * segProg;
  }, 0);

  const atWarning = warningP > 0.5;
  const usedAfterTruncate = SEGMENTS[0].tokens + SEGMENTS[2].tokens + SEGMENTS[3].tokens + 20000;
  const currentUsed = truncateP > 0
    ? totalVisible - (totalVisible - usedAfterTruncate) * truncateP
    : totalVisible;

  const pct = currentUsed / MAX_TOKENS;

  let runningX = BAR_X;
  const segBars: { x: number; w: number; color: string; label: string; idx: number }[] = [];
  SEGMENTS.forEach((seg, i) => {
    const segProg = Math.max(0, Math.min(1, fillP * 4 - i));
    const trunc = truncateP > 0 && i === 1 ? (1 - truncateP * 0.8) : 1;
    const rawW = (seg.tokens / MAX_TOKENS) * BAR_W * segProg * trunc;
    segBars.push({ x: runningX, w: rawW, color: seg.color, label: seg.label, idx: i });
    runningX += rawW;
  });

  const usedW = pct * BAR_W;
  const isNearLimit = pct > 0.88;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cw-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cw-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={55} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={barIn}>
        CONTEXT WINDOW MANAGEMENT
      </text>

      {/* Token counter */}
      {fillP > 0 && (
        <text x={W / 2} y={100} textAnchor="middle"
          fill={hiToken ? T.amber : T.textSecondary}
          fontFamily={T.mono} fontSize="28" fontWeight="800"
          filter={hiToken ? "url(#cw-glow-sm)" : undefined}>
          {Math.round(currentUsed / 1000)}K / 200K tokens
        </text>
      )}

      {/* Bar background */}
      <g opacity={barIn}>
        <rect x={BAR_X} y={BAR_Y} width={BAR_W} height={BAR_H} rx="12"
          fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="2"
          filter={isNearLimit && atWarning ? "url(#cw-glow)" : undefined}
        />
        {/* Max marker */}
        <line x1={BAR_X + BAR_W} y1={BAR_Y - 16} x2={BAR_X + BAR_W} y2={BAR_Y + BAR_H + 16}
          stroke={T.coral} strokeWidth="2" strokeDasharray="4 3"
        />
        <text x={BAR_X + BAR_W} y={BAR_Y - 24} textAnchor="middle"
          fill={T.coral} fontFamily={T.mono} fontSize="11">MAX</text>
      </g>

      {/* Segment bars */}
      {segBars.map((seg) => {
        if (seg.w <= 0) return null;
        const isHighlight = (hiContext && seg.idx === 2) || (hiToken && seg.idx === 1);
        return (
          <g key={seg.idx}>
            <rect x={seg.x} y={BAR_Y} width={seg.w} height={BAR_H}
              rx={seg.idx === 0 ? "12 0 0 12" : seg.idx === SEGMENTS.length - 1 ? "0 12 12 0" : "0"}
              fill={seg.color}
              fillOpacity={isHighlight ? 0.55 : 0.4}
              filter={isHighlight ? "url(#cw-glow-sm)" : undefined}
            />
            {seg.w > 80 && (
              <text x={seg.x + seg.w / 2} y={BAR_Y + BAR_H / 2 + 5} textAnchor="middle"
                fill={seg.color} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="0.5">
                {seg.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Warning glow at 90% */}
      {isNearLimit && atWarning && (
        <rect x={BAR_X} y={BAR_Y} width={usedW} height={BAR_H} rx="12"
          fill="none"
          stroke={T.coral} strokeWidth="3"
          filter="url(#cw-glow)"
          opacity={0.6 * warningP}
        />
      )}

      {/* Legend */}
      {fillP > 0.8 && (
        <g>
          {SEGMENTS.map((seg, i) => (
            <g key={i} opacity={fillP}>
              <rect x={BAR_X + i * 220} y={BAR_Y + BAR_H + 28} width={14} height={14} rx="3"
                fill={seg.color} fillOpacity={0.7}
              />
              <text x={BAR_X + i * 220 + 22} y={BAR_Y + BAR_H + 40}
                fill={T.textDim} fontFamily={T.sans} fontSize="11">
                {seg.label}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Truncate / Summarize labels */}
      {truncateP > 0 && (
        <g opacity={truncateP}>
          <rect x={BAR_X + 100} y={BAR_Y - 80} width={180} height={44} rx="10"
            fill={hiTruncate ? `${T.coral}33` : T.bgDeep}
            stroke={T.coral} strokeWidth={hiTruncate ? 2.5 : 1.5}
            filter={hiTruncate ? "url(#cw-glow)" : undefined}
          />
          <text x={BAR_X + 190} y={BAR_Y - 52} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="1">
            TRUNCATE
          </text>
          <line x1={BAR_X + 190} y1={BAR_Y - 36} x2={BAR_X + 190} y2={BAR_Y}
            stroke={T.coral} strokeWidth="1.5" strokeDasharray="4 3"
          />

          <rect x={BAR_X + 340} y={BAR_Y - 80} width={180} height={44} rx="10"
            fill={hiSummarize ? `${T.amber}33` : T.bgDeep}
            stroke={T.amber} strokeWidth={hiSummarize ? 2.5 : 1.5}
            filter={hiSummarize ? "url(#cw-glow)" : undefined}
          />
          <text x={BAR_X + 430} y={BAR_Y - 52} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="1">
            SUMMARIZE
          </text>
          <line x1={BAR_X + 430} y1={BAR_Y - 36} x2={BAR_X + 430} y2={BAR_Y}
            stroke={T.amber} strokeWidth="1.5" strokeDasharray="4 3"
          />
        </g>
      )}

      {/* Managed badge */}
      {managedIn > 0 && (
        <g opacity={managedIn}>
          <rect x={W / 2 - 120} y={BAR_Y + BAR_H + 100} width={240} height={52} rx="26"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#cw-glow-sm)"
          />
          <text x={W / 2} y={BAR_Y + BAR_H + 133} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            MANAGED
          </text>
        </g>
      )}
    </svg>
  );
};
