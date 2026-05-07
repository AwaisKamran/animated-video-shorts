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

// Mini ReAct loop positions (compact, top area)
const MINI_Y = 22;
const MINI_ROW2 = 70;
const MINI_CX = W / 2;
const MINI_BOX_W = 100, MINI_BOX_H = 30;
const MINI_BOXES = [
  { label: "THOUGHT", color: T.violet, x: MINI_CX - 50,  y: MINI_Y,     active: true },
  { label: "ACTION",  color: T.amber,  x: MINI_CX + 170, y: MINI_ROW2,  active: false },
  { label: "OBS",     color: T.mint,   x: MINI_CX - 270, y: MINI_ROW2,  active: false },
];

// Big thought bubble (positioned cleanly below mini loop)
const BUBBLE_X = 120, BUBBLE_Y = 180, BUBBLE_W = 840, BUBBLE_H = 400;

const REASONING_LINES = [
  { text: "User wants weather in Paris",      color: T.textSecondary },
  { text: "I need a weather tool for this",   color: T.textSecondary },
  { text: "search_weather(location='Paris')", color: T.cyan },
  { text: "Result will go back to user",      color: T.mint },
];

export const ThoughtZoomDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const miniIn    = p(frame, duration, 0.00, 0.18);
  const bubbleIn  = p(frame, duration, 0.18, 0.35);
  const line0In   = p(frame, duration, 0.35, 0.52);
  const line1In   = p(frame, duration, 0.52, 0.67);
  const line2In   = p(frame, duration, 0.67, 0.81);
  const line3In   = p(frame, duration, 0.81, 1.00);

  const lineProgress = [line0In, line1In, line2In, line3In];

  const hiThought   = hi("THOUGHT");
  const hiReasoning = hi("REASONING");

  const bubbleColor  = hiThought || hiReasoning ? T.violet : T.violet;
  const bubbleOpacity = hiThought || hiReasoning ? 0.22 : 0.14;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tzd-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tzd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="tzd-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
      </defs>

      {/* Mini ReAct loop — compact triangle at top */}
      {miniIn > 0 && (
        <g opacity={miniIn * 0.75}>
          {MINI_BOXES.map((box) => (
            <g key={box.label}>
              <rect x={box.x} y={box.y} width={MINI_BOX_W} height={MINI_BOX_H} rx="7"
                fill={box.color}
                fillOpacity={box.active ? 0.35 : 0.08}
                stroke={box.color}
                strokeWidth={box.active ? 2.5 : 1}
                filter={box.active ? "url(#tzd-glow-sm)" : undefined}
              />
              <text x={box.x + MINI_BOX_W / 2} y={box.y + 20} textAnchor="middle"
                fill={box.color} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1">
                {box.label}
              </text>
            </g>
          ))}
          {/* Mini arrows: THOUGHT→ACTION, ACTION→OBS (under), OBS→THOUGHT */}
          <path d={`M ${MINI_CX + 50} ${MINI_Y + 15} Q ${MINI_CX + 140} ${MINI_Y + 8} ${MINI_CX + 170} ${MINI_ROW2 + 4}`}
            fill="none" stroke={T.violet} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"
          />
          <path d={`M ${MINI_CX + 170} ${MINI_ROW2 + MINI_BOX_H} Q ${MINI_CX} ${MINI_ROW2 + 56} ${MINI_CX - 170} ${MINI_ROW2 + MINI_BOX_H}`}
            fill="none" stroke={T.amber} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"
          />
          <path d={`M ${MINI_CX - 170} ${MINI_ROW2 + 4} Q ${MINI_CX - 140} ${MINI_Y + 8} ${MINI_CX - 50} ${MINI_Y + 15}`}
            fill="none" stroke={T.mint} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"
          />
        </g>
      )}

      {/* "INSIDE THOUGHT" label */}
      {bubbleIn > 0 && (
        <text x={BUBBLE_X} y={BUBBLE_Y - 18} textAnchor="start"
          fill={T.violet} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
          opacity={bubbleIn}>
          INSIDE THOUGHT
        </text>
      )}

      {/* Big thought bubble outline */}
      {bubbleIn > 0 && (
        <g opacity={bubbleIn}>
          <rect x={BUBBLE_X} y={BUBBLE_Y} width={BUBBLE_W * bubbleIn} height={BUBBLE_H} rx="28"
            fill={bubbleColor} fillOpacity={bubbleOpacity}
            stroke={bubbleColor} strokeWidth={hiThought || hiReasoning ? 2.5 : 2}
            filter={hiThought || hiReasoning ? "url(#tzd-glow)" : undefined}
          />
          {/* Thought bubble tail circles */}
          <circle cx={BUBBLE_X + 80} cy={BUBBLE_Y + BUBBLE_H + 22} r="14"
            fill={bubbleColor} fillOpacity={bubbleOpacity * 0.6}
            stroke={bubbleColor} strokeWidth="1.5"
          />
          <circle cx={BUBBLE_X + 50} cy={BUBBLE_Y + BUBBLE_H + 44} r="9"
            fill={bubbleColor} fillOpacity={bubbleOpacity * 0.4}
            stroke={bubbleColor} strokeWidth="1.5"
          />
          <circle cx={BUBBLE_X + 28} cy={BUBBLE_Y + BUBBLE_H + 60} r="5"
            fill={bubbleColor} fillOpacity={bubbleOpacity * 0.3}
            stroke={bubbleColor} strokeWidth="1.5"
          />
        </g>
      )}

      {/* Reasoning lines appearing one by one */}
      {REASONING_LINES.map((line, i) => {
        const lp = lineProgress[i];
        if (lp <= 0) return null;
        const isCode = i === 2;
        const lineY = BUBBLE_Y + 80 + i * 74;
        return (
          <g key={i} opacity={lp}>
            {/* Line number gutter */}
            <text x={BUBBLE_X + 28} y={lineY + 14} textAnchor="start"
              fill={T.textDim} fontFamily={T.mono} fontSize="12" opacity="0.35">
              {i + 1}
            </text>
            {/* Cursor blink on active line */}
            {lp < 0.9 && (
              <rect x={BUBBLE_X + 50 + (isCode ? line.text.length * 7.5 : line.text.length * 7.8)}
                y={lineY} width="2" height="18"
                fill={line.color} opacity={0.5 + 0.5 * Math.sin(frame / 4)}
              />
            )}
            {/* Line text */}
            {isCode ? (
              <text x={BUBBLE_X + 60} y={lineY + 14} textAnchor="start"
                fill={line.color} fontFamily={T.mono} fontSize="18" fontWeight="700">
                {line.text}
              </text>
            ) : (
              <text x={BUBBLE_X + 60} y={lineY + 14} textAnchor="start"
                fill={line.color} fontFamily={T.sans} fontSize="18">
                {line.text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
