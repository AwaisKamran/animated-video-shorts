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

// "Before" bars: skewed distribution (asymmetric, spread)
const BEFORE_BARS = [
  { x: 0.05, h: 0.12 }, { x: 0.15, h: 0.18 }, { x: 0.25, h: 0.35 }, { x: 0.35, h: 0.70 },
  { x: 0.45, h: 0.55 }, { x: 0.55, h: 0.28 }, { x: 0.65, h: 0.15 }, { x: 0.75, h: 0.08 },
  { x: 0.85, h: 0.04 }, { x: 0.95, h: 0.02 },
];

// "After" bars: normal distribution centered at 0
const AFTER_BARS = [
  { x: 0.05, h: 0.04 }, { x: 0.15, h: 0.12 }, { x: 0.25, h: 0.28 }, { x: 0.35, h: 0.55 },
  { x: 0.45, h: 0.80 }, { x: 0.55, h: 0.55 }, { x: 0.65, h: 0.28 }, { x: 0.75, h: 0.12 },
  { x: 0.85, h: 0.04 }, { x: 0.95, h: 0.02 },
];

const HIST_W = 320, HIST_H = 240;
const LEFT_X = 60, RIGHT_X = 700, HIST_Y = 180;
const BAR_W = 26;

export const BatchNormDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const leftIn    = p(frame, duration, 0.00, 0.25);
  const boxIn     = p(frame, duration, 0.25, 0.45);
  const animateIn = p(frame, duration, 0.45, 0.70);
  const statsIn   = p(frame, duration, 0.70, 0.90);
  const badgeIn   = p(frame, duration, 0.90, 1.00);

  const hiNorm = hi("NORMALIZATION");
  const hiMean = hi("MEAN");
  const hiVar  = hi("VARIANCE");

  // Interpolate bars: before → after (during animateIn)
  const interpBars = BEFORE_BARS.map((b, i) => {
    const afterH = AFTER_BARS[i].h;
    return { x: b.x, h: b.h + (afterH - b.h) * animateIn, afterX: AFTER_BARS[i].x };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="bn-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* LEFT histogram (before) */}
      <g opacity={leftIn}>
        <text x={LEFT_X + HIST_W / 2} y={HIST_Y - 20} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
          BEFORE
        </text>
        <text x={LEFT_X + HIST_W / 2} y={HIST_Y - 4} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11">
          skewed, high variance
        </text>
        {/* Axis */}
        <line x1={LEFT_X} y1={HIST_Y + HIST_H} x2={LEFT_X + HIST_W} y2={HIST_Y + HIST_H}
          stroke={T.border} strokeWidth="1.5" />

        {BEFORE_BARS.map((bar, i) => {
          const bx = LEFT_X + bar.x * HIST_W;
          const bh = bar.h * HIST_H;
          return (
            <rect key={i} x={bx - BAR_W / 2} y={HIST_Y + HIST_H - bh} width={BAR_W} height={bh}
              rx="3" fill={T.coral} fillOpacity={0.5} stroke={T.coral} strokeWidth="1" strokeOpacity="0.7" />
          );
        })}
      </g>

      {/* BatchNorm box (center) */}
      {boxIn > 0 && (
        <g opacity={boxIn}>
          <rect x={430} y={260} width={200} height={100} rx="14"
            fill={hiNorm ? T.cyan : T.bgDeep} fillOpacity={hiNorm ? 0.15 : 1}
            stroke={hiNorm ? T.cyan : T.borderStrong} strokeWidth={hiNorm ? 2.5 : 1.5}
            filter={hiNorm ? "url(#bn-glow)" : undefined}
          />
          <text x={530} y={302} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="1">
            BATCH NORM
          </text>
          <text x={530} y={326} textAnchor="middle"
            fill={hiNorm ? T.cyan : T.textDim} fontFamily={T.mono} fontSize="15"
            filter={hiNorm ? "url(#bn-glow)" : undefined}>
            (x − μ) / σ
          </text>
          <text x={530} y={348} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">
            then scale + shift
          </text>
          {/* Arrow in */}
          <line x1={LEFT_X + HIST_W + 10} y1={310} x2={428} y2={310}
            stroke={T.borderStrong} strokeWidth="1.5" />
          <polygon points={`428,310 416,303 416,317`} fill={T.borderStrong} />
          {/* Arrow out */}
          <line x1={632} y1={310} x2={RIGHT_X - 10} y2={310}
            stroke={T.mint} strokeWidth="1.5" />
          <polygon points={`${RIGHT_X - 10},310 ${RIGHT_X - 22},303 ${RIGHT_X - 22},317`} fill={T.mint} />
        </g>
      )}

      {/* RIGHT histogram (after) — animates from before to after */}
      {animateIn > 0 && (
        <g opacity={animateIn}>
          <text x={RIGHT_X + HIST_W / 2} y={HIST_Y - 20} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
            AFTER
          </text>
          <text x={RIGHT_X + HIST_W / 2} y={HIST_Y - 4} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11">
            normalized, unit variance
          </text>
          <line x1={RIGHT_X} y1={HIST_Y + HIST_H} x2={RIGHT_X + HIST_W} y2={HIST_Y + HIST_H}
            stroke={T.border} strokeWidth="1.5" />
          {/* Center line */}
          <line x1={RIGHT_X + HIST_W / 2} y1={HIST_Y} x2={RIGHT_X + HIST_W / 2} y2={HIST_Y + HIST_H}
            stroke={T.mint} strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.5" />

          {interpBars.map((bar, i) => {
            const bx = RIGHT_X + AFTER_BARS[i].x * HIST_W;
            const bh = bar.h * HIST_H;
            return (
              <rect key={i} x={bx - BAR_W / 2} y={HIST_Y + HIST_H - bh} width={BAR_W} height={bh}
                rx="3" fill={T.mint} fillOpacity={0.55} stroke={T.mint} strokeWidth="1" strokeOpacity="0.8" />
            );
          })}
        </g>
      )}

      {/* Stats */}
      {statsIn > 0 && (
        <g opacity={statsIn}>
          <text x={RIGHT_X + HIST_W / 2 - 40} y={HIST_Y + HIST_H + 36} textAnchor="middle"
            fill={hiMean ? T.cyan : T.mint} fontFamily={T.mono} fontSize="16" fontWeight="700"
            filter={hiMean ? "url(#bn-glow)" : undefined}>
            μ = 0
          </text>
          <text x={RIGHT_X + HIST_W / 2 + 50} y={HIST_Y + HIST_H + 36} textAnchor="middle"
            fill={hiVar ? T.violet : T.mint} fontFamily={T.mono} fontSize="16" fontWeight="700"
            filter={hiVar ? "url(#bn-glow)" : undefined}>
            σ = 1
          </text>
        </g>
      )}

      {/* Badge */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 160} y={540} width={320} height={52} rx="26"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2" />
          <text x={W / 2} y={570} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="0.5">
            Faster Training, Stable Gradients
          </text>
        </g>
      )}
    </svg>
  );
};
