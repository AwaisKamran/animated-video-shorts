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

const BAR_X = 100, BAR_Y = 220, BAR_W = 880, BAR_H = 90;

const SEGMENTS = [
  { label: "TRAIN",   pct: 0.70, color: T.cyan,   samples: "7,000",  use: "fit model",           key: "TRAIN" },
  { label: "VAL",     pct: 0.15, color: T.violet,  samples: "1,500",  use: "tune hyperparameters", key: "VAL" },
  { label: "TEST",    pct: 0.15, color: T.amber,   samples: "1,500",  use: "final eval",           key: "TEST" },
];

export const TrainTestSplitDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const barIn    = p(frame, duration, 0.00, 0.25);
  const splitIn  = p(frame, duration, 0.25, 0.55);
  const labelsIn = p(frame, duration, 0.55, 0.80);
  const badgeIn  = p(frame, duration, 0.80, 1.00);

  // Compute segment positions after split (with small gaps)
  const GAP = 8;
  let cursor = BAR_X;
  const segs = SEGMENTS.map((s) => {
    const w = s.pct * BAR_W;
    const result = { ...s, sx: cursor, sw: w };
    cursor += w;
    return result;
  });

  // Split offset: segments slide apart from center
  const splitOffset = splitIn * 12;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tts-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Dataset label */}
      <text x={W / 2} y={BAR_Y - 36} textAnchor="middle"
        fill={T.textSecondary} fontFamily={T.sans} fontSize="15" fontWeight="600" letterSpacing="1"
        opacity={barIn}>
        DATASET (10,000 samples)
      </text>

      {/* Full bar (fades as segments appear) */}
      <rect x={BAR_X} y={BAR_Y} width={BAR_W * barIn} height={BAR_H} rx="10"
        fill={T.bgSurface} stroke={T.borderStrong} strokeWidth="1.5"
        opacity={Math.max(0, 1 - splitIn * 2)}
      />

      {/* Split segments */}
      {splitIn > 0 && segs.map((seg, i) => {
        const isHi = hi(seg.key);
        const dx = (i === 0 ? -splitOffset : i === 2 ? splitOffset : 0);
        return (
          <g key={seg.key} opacity={splitIn}>
            <rect
              x={seg.sx + dx + (i > 0 ? GAP * i : 0)}
              y={BAR_Y}
              width={seg.sw - (i > 0 ? GAP : 0)}
              height={BAR_H}
              rx="8"
              fill={seg.color}
              fillOpacity={isHi ? 0.35 : 0.2}
              stroke={seg.color}
              strokeWidth={isHi ? 2.5 : 1.5}
              filter={isHi ? "url(#tts-glow)" : undefined}
            />
            <text
              x={seg.sx + dx + (i > 0 ? GAP * i : 0) + (seg.sw - (i > 0 ? GAP : 0)) / 2}
              y={BAR_Y + BAR_H / 2 + 6}
              textAnchor="middle"
              fill={seg.color}
              fontFamily={T.sans}
              fontSize="20"
              fontWeight="800"
              letterSpacing="1"
            >
              {seg.label} {Math.round(seg.pct * 100)}%
            </text>
          </g>
        );
      })}

      {/* Labels under segments */}
      {labelsIn > 0 && segs.map((seg, i) => {
        const isHi = hi(seg.key);
        const dx = (i === 0 ? -splitOffset : i === 2 ? splitOffset : 0);
        const cx = seg.sx + dx + (i > 0 ? GAP * i : 0) + (seg.sw - (i > 0 ? GAP : 0)) / 2;
        return (
          <g key={`label-${seg.key}`} opacity={labelsIn}>
            <text x={cx} y={BAR_Y + BAR_H + 36}
              textAnchor="middle"
              fill={isHi ? seg.color : T.textSecondary}
              fontFamily={T.mono} fontSize="14" fontWeight="600"
            >
              {seg.samples} samples
            </text>
            <text x={cx} y={BAR_Y + BAR_H + 58}
              textAnchor="middle"
              fill={T.textDim}
              fontFamily={T.sans} fontSize="12"
            >
              {seg.use}
            </text>
          </g>
        );
      })}

      {/* One-way flow arrows */}
      {labelsIn > 0 && (
        <g opacity={labelsIn * 0.6}>
          <line x1={BAR_X + BAR_W * 0.70 + 16} y1={BAR_Y + BAR_H / 2}
                x2={BAR_X + BAR_W * 0.70 + 50} y2={BAR_Y + BAR_H / 2}
            stroke={T.violet} strokeWidth="1.5" markerEnd="url(#arrowViolet)" />
          <line x1={BAR_X + BAR_W * 0.85 + 16} y1={BAR_Y + BAR_H / 2}
                x2={BAR_X + BAR_W * 0.85 + 50} y2={BAR_Y + BAR_H / 2}
            stroke={T.amber} strokeWidth="1.5" />
        </g>
      )}

      {/* NO LEAKAGE badge */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 120} y={490} width={240} height={52} rx="26"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2" />
          <text x={W / 2} y={519} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            NO DATA LEAKAGE
          </text>
          <text x={W / 2} y={535} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12">
            Test set never touches training
          </text>
        </g>
      )}
    </svg>
  );
};
