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

const MSG_W = 74, MSG_H = 52, MSG_GAP = 8;
const MSG_ROW_Y = 200;
const WINDOW_SIZE = 5;
const TOTAL_MSGS = 12;

const MSG_COLORS = [T.cyan, T.violet, T.mint, T.amber, T.coral, T.cyan, T.violet, T.mint, T.amber, T.coral, T.cyan, T.violet];

// Timeline bar
const TL_X = 80, TL_Y = 560, TL_W = W - 160, TL_H = 24;

export const SlidingWinDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const msgsIn     = p(frame, duration, 0.00, 0.22);
  const windowIn   = p(frame, duration, 0.22, 0.38);
  const slide1P    = p(frame, duration, 0.38, 0.54);
  const slide2P    = p(frame, duration, 0.54, 0.70);
  const slide3P    = p(frame, duration, 0.70, 0.86);
  const doneP      = p(frame, duration, 0.86, 1.00);

  const hiWindow   = hi("SLIDING WINDOW") || hi("WINDOW");
  const hiOldest   = hi("OLDEST");
  const hiNewest   = hi("NEWEST");

  // Window offset: starts at 0, slides right by 1 each phase
  const windowOffset =
    slide3P > 0 ? 2 + slide3P :
    slide2P > 0 ? 1 + slide2P :
    slide1P > 0 ? 0 + slide1P :
    0;

  // How many messages are "available" — starts at WINDOW_SIZE, grows as new ones arrive
  const visibleCount = Math.min(TOTAL_MSGS, Math.round(WINDOW_SIZE + windowOffset + 0.5));

  // Total rendered messages = visible so far
  const msgStartX = 40;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sw-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sw-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={50} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={msgsIn}>
        SLIDING WINDOW CONTEXT
      </text>

      {/* ── Message bubbles ── */}
      {Array.from({ length: TOTAL_MSGS }).map((_, i) => {
        const msgX = msgStartX + i * (MSG_W + MSG_GAP);
        const color = MSG_COLORS[i % MSG_COLORS.length];
        const label = `m${i + 1}`;

        // Only show if message has arrived
        const arriveP = p(frame, duration, i < WINDOW_SIZE ? 0.00 : 0.22 + (i - WINDOW_SIZE) * 0.1, i < WINDOW_SIZE ? 0.22 : 0.32 + (i - WINDOW_SIZE) * 0.1);

        // Is this message inside the current window?
        const winStart = windowOffset;
        const winEnd   = windowOffset + WINDOW_SIZE;
        const inWindow = i >= winStart && i < winEnd;

        // Is this message evicted (left of window)?
        const isEvicted = windowOffset > 0 && i < Math.floor(windowOffset);
        const evictProg = isEvicted ? Math.min(1, windowOffset - i) : 0;

        if (arriveP <= 0) return null;

        return (
          <g key={i}
            opacity={arriveP * (1 - evictProg * 0.85)}
            transform={`translate(0, ${evictProg * 30})`}>
            <rect
              x={msgX} y={MSG_ROW_Y}
              width={MSG_W} height={MSG_H} rx="10"
              fill={inWindow ? color : T.nodeFill}
              fillOpacity={inWindow ? 0.22 : 0.3}
              stroke={isEvicted ? T.coral : inWindow ? color : T.border}
              strokeWidth={inWindow ? 2 : 1}
              filter={inWindow && hiWindow ? "url(#sw-glow-sm)" : undefined}
            />
            <text x={msgX + MSG_W / 2} y={MSG_ROW_Y + MSG_H / 2 + 5}
              textAnchor="middle"
              fill={inWindow ? color : isEvicted ? T.coral : T.textDim}
              fontFamily={T.mono} fontSize="12" fontWeight="700">
              {label}
            </text>
            {/* Strikethrough for evicted */}
            {isEvicted && (
              <line
                x1={msgX + 8} y1={MSG_ROW_Y + MSG_H / 2}
                x2={msgX + MSG_W - 8} y2={MSG_ROW_Y + MSG_H / 2}
                stroke={T.coral} strokeWidth="2.5" opacity={evictProg}
              />
            )}
            {/* OLDEST / NEWEST labels */}
            {inWindow && i === Math.ceil(winStart) && (
              <text x={msgX + MSG_W / 2} y={MSG_ROW_Y - 10} textAnchor="middle"
                fill={hiOldest ? T.coral : T.textDim}
                fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="0.5"
                filter={hiOldest ? "url(#sw-glow-sm)" : undefined}
                opacity={windowIn}>
                OLDEST
              </text>
            )}
            {inWindow && i === Math.floor(winEnd) - 1 && (
              <text x={msgX + MSG_W / 2} y={MSG_ROW_Y - 10} textAnchor="middle"
                fill={hiNewest ? T.mint : T.textDim}
                fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="0.5"
                filter={hiNewest ? "url(#sw-glow-sm)" : undefined}
                opacity={windowIn}>
                NEWEST
              </text>
            )}
          </g>
        );
      })}

      {/* ── Window frame ── */}
      {windowIn > 0 && (
        <g opacity={windowIn}>
          <rect
            x={msgStartX + windowOffset * (MSG_W + MSG_GAP) - 6}
            y={MSG_ROW_Y - 14}
            width={WINDOW_SIZE * (MSG_W + MSG_GAP) - MSG_GAP + 12}
            height={MSG_H + 28}
            rx="14"
            fill="none"
            stroke={hiWindow ? T.cyan : T.borderStrong}
            strokeWidth={hiWindow ? 3 : 2}
            strokeDasharray={hiWindow ? undefined : "8 4"}
            filter={hiWindow ? "url(#sw-glow)" : undefined}
          />
          <text
            x={msgStartX + windowOffset * (MSG_W + MSG_GAP) + (WINDOW_SIZE * (MSG_W + MSG_GAP)) / 2 - MSG_GAP / 2}
            y={MSG_ROW_Y + MSG_H + 36}
            textAnchor="middle"
            fill={hiWindow ? T.cyan : T.textDim}
            fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="2"
            filter={hiWindow ? "url(#sw-glow-sm)" : undefined}>
            WINDOW
          </text>
        </g>
      )}

      {/* ── Timeline bar ── */}
      <g opacity={windowIn}>
        <rect x={TL_X} y={TL_Y} width={TL_W} height={TL_H} rx="12"
          fill={T.bgDeep} stroke={T.border} strokeWidth="1.5"
        />
        {/* Window position indicator */}
        {windowIn > 0 && (
          <rect
            x={TL_X + (windowOffset / TOTAL_MSGS) * TL_W}
            y={TL_Y}
            width={(WINDOW_SIZE / TOTAL_MSGS) * TL_W}
            height={TL_H}
            rx="12"
            fill={T.cyan} fillOpacity={0.35}
            stroke={T.cyan} strokeWidth="2"
            filter={hiWindow ? "url(#sw-glow-sm)" : undefined}
          />
        )}
        <text x={TL_X} y={TL_Y + TL_H + 20} textAnchor="start"
          fill={T.textDim} fontFamily={T.mono} fontSize="10">
          m1
        </text>
        <text x={TL_X + TL_W} y={TL_Y + TL_H + 20} textAnchor="end"
          fill={T.textDim} fontFamily={T.mono} fontSize="10">
          m{TOTAL_MSGS}
        </text>
        <text x={TL_X + TL_W / 2} y={TL_Y - 10} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="1.5">
          POSITION OVER TIME
        </text>
      </g>

      {/* ── Window size badge ── */}
      {windowIn > 0 && (
        <g opacity={windowIn}>
          <rect x={W - 200} y={MSG_ROW_Y + 10} width={160} height={40} rx="20"
            fill={T.violet} fillOpacity={0.18}
            stroke={T.violet} strokeWidth="2"
          />
          <text x={W - 120} y={MSG_ROW_Y + 36} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="13" fontWeight="700">
            SIZE = {WINDOW_SIZE}
          </text>
        </g>
      )}

      {/* ── Done badge ── */}
      {doneP > 0 && (
        <g opacity={doneP}>
          <rect x={W / 2 - 130} y={460} width={260} height={48} rx="24"
            fill={T.cyan} fillOpacity={0.12}
            stroke={T.cyan} strokeWidth="2"
            filter="url(#sw-glow-sm)"
          />
          <text x={W / 2} y={490} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            WINDOW SLIDES FORWARD
          </text>
        </g>
      )}
    </svg>
  );
};
