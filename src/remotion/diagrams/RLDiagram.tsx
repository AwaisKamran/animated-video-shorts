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

// Three boxes in triangle: Agent (top), Environment (right), Reward (bottom-left)
const AGENT_X = 540, AGENT_Y = 140;
const ENV_X = 850, ENV_Y = 390;
const REW_X = 230, REW_Y = 390;
const BOX_W = 180, BOX_H = 80;

function boxCX(x: number) { return x + BOX_W / 2; }
function boxCY(y: number) { return y + BOX_H / 2; }

export const RLDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const boxesIn  = p(frame, duration, 0.00, 0.25);
  const actionIn = p(frame, duration, 0.25, 0.55);
  const stateIn  = p(frame, duration, 0.55, 0.70);
  const rewardIn = p(frame, duration, 0.70, 0.85);
  const pulseIn  = p(frame, duration, 0.85, 1.00);

  const hiAgent = hi("AGENT");
  const hiEnv   = hi("ENVIRONMENT");
  const hiRew   = hi("REWARD");

  // Arrow from A to B: progress 0→1 draws the line
  function Arrow({
    x1, y1, x2, y2, label, color, progress, curved = false, cpx = 0, cpy = 0,
  }: {
    x1: number; y1: number; x2: number; y2: number; label: string;
    color: string; progress: number; curved?: boolean; cpx?: number; cpy?: number;
  }) {
    if (progress <= 0) return null;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    // Dot along the path
    const dx = x1 + progress * (x2 - x1);
    const dy = y1 + progress * (y2 - y1);
    return (
      <g>
        <line x1={x1} y1={y1} x2={dx} y2={dy}
          stroke={color} strokeWidth="2.5"
        />
        <polygon
          points={`${dx},${dy} ${dx - 8},${dy - 5} ${dx - 8},${dy + 5}`}
          fill={color}
          transform={`rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}, ${dx}, ${dy})`}
        />
        <rect x={mx - 48} y={my - 16} width={96} height={24} rx="12"
          fill={T.bgDeep} opacity={progress} />
        <text x={mx} y={my + 4} textAnchor="middle"
          fill={color} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="0.5"
          opacity={progress}>
          {label}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rl-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Three boxes */}
      {([
        { x: AGENT_X, y: AGENT_Y, label: "AGENT",       color: T.cyan,   hi: hiAgent },
        { x: ENV_X,   y: ENV_Y,   label: "ENVIRONMENT", color: T.violet, hi: hiEnv },
        { x: REW_X,   y: REW_Y,   label: "REWARD",      color: T.amber,  hi: hiRew },
      ] as const).map((box) => (
        <g key={box.label} opacity={boxesIn}>
          <rect x={box.x} y={box.y} width={BOX_W} height={BOX_H} rx="16"
            fill={box.color} fillOpacity={box.hi ? 0.25 : 0.12}
            stroke={box.color} strokeWidth={box.hi ? 2.5 : 1.5}
            filter={box.hi ? "url(#rl-glow)" : undefined}
          />
          <text x={box.x + BOX_W / 2} y={box.y + BOX_H / 2 + 6} textAnchor="middle"
            fill={box.color} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1"
            filter={box.hi ? "url(#rl-glow)" : undefined}>
            {box.label}
          </text>
        </g>
      ))}

      {/* ACTION: Agent → Environment */}
      {actionIn > 0 && (
        <Arrow
          x1={AGENT_X + BOX_W} y1={AGENT_Y + BOX_H / 2}
          x2={ENV_X + BOX_W / 2} y2={ENV_Y}
          label="ACTION" color={T.cyan} progress={actionIn}
        />
      )}

      {/* STATE: Environment → Agent */}
      {stateIn > 0 && (
        <Arrow
          x1={ENV_X} y1={ENV_Y + BOX_H / 2}
          x2={AGENT_X + BOX_W / 2} y2={AGENT_Y + BOX_H}
          label="STATE" color={T.violet} progress={stateIn}
        />
      )}

      {/* REWARD: Environment → Reward */}
      {rewardIn > 0 && (
        <Arrow
          x1={ENV_X} y1={ENV_Y + BOX_H / 2}
          x2={REW_X + BOX_W} y2={REW_Y + BOX_H / 2}
          label="REWARD SIGNAL" color={T.amber} progress={rewardIn}
        />
      )}

      {/* FEEDBACK: Reward → Agent */}
      {rewardIn > 0.5 && (
        <Arrow
          x1={REW_X + BOX_W / 2} y1={REW_Y}
          x2={AGENT_X} y2={AGENT_Y + BOX_H / 2}
          label="FEEDBACK" color={T.amber} progress={(rewardIn - 0.5) * 2}
        />
      )}

      {/* Pulse / Learn label */}
      {pulseIn > 0 && (
        <g opacity={pulseIn}>
          <rect x={W / 2 - 150} y={540} width={300} height={56} rx="28"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2" />
          <text x={W / 2} y={570} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1">
            Learn from Reward
          </text>
          <text x={W / 2} y={587} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12">
            Maximize cumulative reward over time
          </text>
        </g>
      )}
    </svg>
  );
};
