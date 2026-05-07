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

// Triangle positions
const THOUGHT_X = 540, THOUGHT_Y = 90;
const ACTION_X = 820,  ACTION_Y  = 390;
const OBS_X    = 260,  OBS_Y    = 390;
const BOX_W = 220, BOX_H = 100;

const ITERS = [
  {
    thought:     "I should search the weather",
    action:      `search("Tokyo weather")`,
    observation: "Tokyo: 72°F, clear",
  },
  {
    thought:     "I have the data, format it",
    action:      `format("72°F, clear")`,
    observation: "Formatted: 72°F, clear sky",
  },
];

function boxCX(x: number) { return x; }
function boxCY(y: number) { return y; }

export const ReActDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const boxesIn   = p(frame, duration, 0.00, 0.25);
  const iter1P    = p(frame, duration, 0.25, 0.50);
  const iter2P    = p(frame, duration, 0.50, 0.75);
  const finalIn   = p(frame, duration, 0.75, 1.00);

  const hiThought = hi("THOUGHT");
  const hiAction  = hi("ACTION");
  const hiObs     = hi("OBSERVATION");

  const curIter = iter2P > 0 ? ITERS[1] : ITERS[0];
  const curProg = iter2P > 0 ? iter2P : iter1P;

  const boxes = [
    { label: "THOUGHT",     x: THOUGHT_X - BOX_W / 2, y: THOUGHT_Y, color: T.violet, hi: hiThought },
    { label: "ACTION",      x: ACTION_X - BOX_W / 2,  y: ACTION_Y,  color: T.amber,  hi: hiAction },
    { label: "OBSERVATION", x: OBS_X - BOX_W / 2,     y: OBS_Y,     color: T.mint,   hi: hiObs },
  ];

  // Arrow helper: curved arc path
  function arcPath(x1: number, y1: number, x2: number, y2: number, sweep: number) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const cx = mx + (y2 - y1) * 0.2 * sweep;
    const cy = my - (x2 - x1) * 0.2 * sweep;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  const thoughtTextLines = curIter.thought.split(" ").reduce((acc: string[], word, i) => {
    if (i === 0 || (acc[acc.length - 1] + " " + word).length > 18) acc.push(word);
    else acc[acc.length - 1] += " " + word;
    return acc;
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="react-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="react-arr-v" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="react-arr-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
        <marker id="react-arr-m" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={45} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={boxesIn}>
        REASON + ACT · ITERATE UNTIL TASK COMPLETE
      </text>

      {/* Three boxes */}
      {boxes.map((box) => (
        <g key={box.label} opacity={boxesIn}>
          <rect x={box.x} y={box.y} width={BOX_W} height={BOX_H} rx="16"
            fill={box.color} fillOpacity={box.hi ? 0.22 : 0.12}
            stroke={box.color} strokeWidth={box.hi ? 3 : 1.5}
            filter={box.hi ? "url(#react-glow)" : undefined}
          />
          <text x={box.x + BOX_W / 2} y={box.y + 28} textAnchor="middle"
            fill={box.color} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1.5">
            {box.label}
          </text>
        </g>
      ))}

      {/* Curved arrows between boxes */}
      {boxesIn > 0.5 && (
        <>
          {/* THOUGHT → ACTION */}
          <path d={arcPath(THOUGHT_X + BOX_W / 2, THOUGHT_Y + BOX_H, ACTION_X - BOX_W / 2, ACTION_Y, 1)}
            fill="none" stroke={T.violet} strokeWidth="2"
            markerEnd="url(#react-arr-v)" opacity={0.6}
          />
          {/* ACTION → OBSERVATION */}
          <path d={arcPath(ACTION_X - BOX_W / 2, ACTION_Y + BOX_H / 2, OBS_X + BOX_W / 2, OBS_Y + BOX_H / 2, -1)}
            fill="none" stroke={T.amber} strokeWidth="2"
            markerEnd="url(#react-arr-a)" opacity={0.6}
          />
          {/* OBSERVATION → THOUGHT (loop back) */}
          <path d={arcPath(OBS_X, OBS_Y, THOUGHT_X - BOX_W / 2, THOUGHT_Y + BOX_H, 1)}
            fill="none" stroke={T.mint} strokeWidth="2"
            markerEnd="url(#react-arr-m)" opacity={0.6}
          />
        </>
      )}

      {/* Iteration text inside boxes */}
      {curProg > 0.2 && (
        <>
          {/* Thought text */}
          {thoughtTextLines.map((line, i) => (
            <text key={i} x={THOUGHT_X} y={THOUGHT_Y + 52 + i * 16} textAnchor="middle"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="11"
              opacity={Math.min(1, (curProg - 0.2) * 5)}>
              {line}
            </text>
          ))}
          {/* Action text */}
          {curProg > 0.4 && (
            <text x={ACTION_X} y={ACTION_Y + 60} textAnchor="middle"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="11"
              opacity={Math.min(1, (curProg - 0.4) * 5)}>
              {curIter.action}
            </text>
          )}
          {/* Observation text */}
          {curProg > 0.6 && (
            <text x={OBS_X} y={OBS_Y + 60} textAnchor="middle"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="11"
              opacity={Math.min(1, (curProg - 0.6) * 5)}>
              {curIter.observation}
            </text>
          )}
        </>
      )}

      {/* Final answer */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={W / 2 - 200} y={555} width={400} height={56} rx="28"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#react-glow)"
          />
          <text x={W / 2} y={580} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
            ANSWER: Tokyo is 72°F
          </text>
          <text x={W / 2} y={598} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="2">
            TASK COMPLETE
          </text>
        </g>
      )}
    </svg>
  );
};
