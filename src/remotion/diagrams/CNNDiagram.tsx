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

// Stage positions
const STAGES = [
  { x: 80,  label: "INPUT",    labelY: 590 },
  { x: 280, label: "CONV",     labelY: 590 },
  { x: 510, label: "MAX POOL", labelY: 590 },
  { x: 700, label: "FLATTEN",  labelY: 590 },
  { x: 860, label: "OUTPUT",   labelY: 590 },
];

// Pixel colors for 6x6 input grid (simplified)
const PIXEL_COLORS = [
  [T.amber, T.cyan, T.amber, T.violet, T.amber, T.cyan],
  [T.cyan, T.mint, T.amber, T.cyan, T.violet, T.amber],
  [T.amber, T.amber, T.cyan, T.mint, T.amber, T.violet],
  [T.violet, T.cyan, T.amber, T.amber, T.cyan, T.mint],
  [T.mint, T.amber, T.violet, T.cyan, T.amber, T.amber],
  [T.cyan, T.violet, T.mint, T.amber, T.violet, T.cyan],
];

const GRID_CELL = 30;
const INPUT_GRID_TOP = 250;

export const CNNDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const inputIn  = p(frame, duration, 0.00, 0.15);
  const convIn   = p(frame, duration, 0.15, 0.30);
  const filterSl = p(frame, duration, 0.30, 0.55);  // filter slides
  const poolIn   = p(frame, duration, 0.55, 0.68);
  const flatIn   = p(frame, duration, 0.68, 0.78);
  const outIn    = p(frame, duration, 0.78, 0.90);
  const arrowsIn = p(frame, duration, 0.85, 1.00);

  const hiConv  = hi("CONV") || hi("FILTER");
  const hiPool  = hi("POOLING");

  // Filter slides: 0→3 in x, 0→3 in y (3x3 filter on 6x6 input gives 4x4 output)
  const filterMax = 3;
  const filterPos = Math.floor(filterSl * filterMax * filterMax);
  const filterRow = Math.floor(filterPos / filterMax);
  const filterCol = filterPos % filterMax;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cnn-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cnn-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cnn-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
      </defs>

      {/* ── Stage labels ── */}
      {STAGES.map((st, i) => {
        const stageFade = [inputIn, convIn, poolIn, flatIn, outIn][i];
        if (!stageFade) return null;
        return (
          <text key={i} x={st.x + 60} y={st.labelY} textAnchor="middle"
            fill={i === 1 ? T.cyan : i === 2 ? T.violet : i === 4 ? T.mint : T.textDim}
            fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="1.5"
            opacity={stageFade}>
            {st.label}
          </text>
        );
      })}

      {/* ── INPUT: 6×6 pixel grid ── */}
      <g opacity={inputIn}>
        {PIXEL_COLORS.map((row, ri) =>
          row.map((col, ci) => (
            <rect key={`${ri}-${ci}`}
              x={STAGES[0].x + ci * GRID_CELL}
              y={INPUT_GRID_TOP + ri * GRID_CELL}
              width={GRID_CELL - 2} height={GRID_CELL - 2}
              rx="3"
              fill={col} opacity={0.55}
            />
          ))
        )}
        <text x={STAGES[0].x + 90} y={INPUT_GRID_TOP - 16} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="12">6×6</text>
      </g>

      {/* ── CONV: 4×4 output grid ── */}
      {convIn > 0 && (
        <g opacity={convIn}>
          {Array.from({ length: 4 }).map((_, ri) =>
            Array.from({ length: 4 }).map((_, ci) => (
              <rect key={`conv-${ri}-${ci}`}
                x={STAGES[1].x + ci * 34}
                y={INPUT_GRID_TOP + ri * 34}
                width={30} height={30}
                rx="4"
                fill={T.cyan} opacity={0.25}
                stroke={T.cyan} strokeWidth="1" strokeOpacity="0.4"
              />
            ))
          )}
          <text x={STAGES[1].x + 68} y={INPUT_GRID_TOP - 16} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="12">4×4</text>
        </g>
      )}

      {/* ── CONV FILTER overlay (sliding) ── */}
      {filterSl > 0 && filterSl < 1 && (
        <g>
          {/* Filter on input */}
          <rect
            x={STAGES[0].x + filterCol * GRID_CELL - 2}
            y={INPUT_GRID_TOP + filterRow * GRID_CELL - 2}
            width={GRID_CELL * 3 + 2}
            height={GRID_CELL * 3 + 2}
            rx="4"
            fill="none"
            stroke={hiConv ? "#00EFFF" : T.cyan}
            strokeWidth={hiConv ? 3 : 2}
            filter={hiConv ? "url(#cnn-glow)" : "url(#cnn-glow-sm)"}
          />
          <text x={STAGES[0].x + filterCol * GRID_CELL + 40} y={INPUT_GRID_TOP + filterRow * GRID_CELL - 10}
            textAnchor="middle" fill={T.cyan} fontFamily={T.mono} fontSize="11">3×3 filter</text>

          {/* Corresponding activated output cell */}
          {convIn > 0 && (
            <rect
              x={STAGES[1].x + filterCol * 34 - 2}
              y={INPUT_GRID_TOP + filterRow * 34 - 2}
              width={34} height={34}
              rx="5"
              fill={T.cyan} fillOpacity="0.5"
              stroke={T.cyan} strokeWidth="2"
              filter="url(#cnn-glow-sm)"
            />
          )}
        </g>
      )}

      {/* ── POOLING: 2×2 grid ── */}
      {poolIn > 0 && (
        <g opacity={poolIn}>
          {Array.from({ length: 2 }).map((_, ri) =>
            Array.from({ length: 2 }).map((_, ci) => (
              <rect key={`pool-${ri}-${ci}`}
                x={STAGES[2].x + ci * 56}
                y={INPUT_GRID_TOP + ri * 56}
                width={50} height={50}
                rx="8"
                fill={hiPool ? `${T.violet}40` : `${T.violet}22`}
                stroke={hiPool ? T.violet : T.violet}
                strokeWidth={hiPool ? 2.5 : 1.5}
                filter={hiPool ? "url(#cnn-glow-sm)" : undefined}
              />
            ))
          )}
          <text x={STAGES[2].x + 56} y={INPUT_GRID_TOP - 16} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="12">2×2</text>
        </g>
      )}

      {/* ── FLATTEN: vertical column of dots ── */}
      {flatIn > 0 && (
        <g opacity={flatIn}>
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i}
              cx={STAGES[3].x + 16}
              cy={INPUT_GRID_TOP + 12 + i * 22}
              r={6}
              fill={T.amber} opacity={0.45}
            />
          ))}
          <text x={STAGES[3].x + 16} y={INPUT_GRID_TOP - 16} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="12">flat</text>
        </g>
      )}

      {/* ── OUTPUT: 2 circles ── */}
      {outIn > 0 && (
        <g opacity={outIn}>
          {["Cat", "Dog"].map((label, i) => {
            const cy = INPUT_GRID_TOP + 70 + i * 120;
            return (
              <g key={i}>
                <circle cx={STAGES[4].x + 36} cy={cy} r={28}
                  fill={i === 0 ? `${T.mint}33` : T.nodeFill}
                  stroke={i === 0 ? T.mint : T.nodeBorder}
                  strokeWidth={i === 0 ? 2.5 : 1.5}
                  filter={i === 0 ? "url(#cnn-glow-sm)" : undefined}
                />
                <text x={STAGES[4].x + 36} y={cy + 5} textAnchor="middle"
                  fill={i === 0 ? T.mint : T.textSecondary}
                  fontFamily={T.mono} fontSize="13" fontWeight="600">
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* ── Stage-to-stage arrows ── */}
      {arrowsIn > 0 && (
        <g opacity={arrowsIn}>
          {[
            { x1: STAGES[0].x + GRID_CELL * 6 + 6, x2: STAGES[1].x - 6, y: INPUT_GRID_TOP + GRID_CELL * 3 },
            { x1: STAGES[1].x + 4 * 34 + 6,         x2: STAGES[2].x - 6, y: INPUT_GRID_TOP + 68 },
            { x1: STAGES[2].x + 2 * 56 + 6,         x2: STAGES[3].x - 6, y: INPUT_GRID_TOP + 56 },
            { x1: STAGES[3].x + 38,                  x2: STAGES[4].x - 6, y: INPUT_GRID_TOP + 140 },
          ].map((seg, i) => (
            <line key={i} x1={seg.x1} y1={seg.y} x2={seg.x2} y2={seg.y}
              stroke={T.textDim} strokeWidth="2"
              markerEnd="url(#cnn-arrow)"
            />
          ))}
        </g>
      )}
    </svg>
  );
};
