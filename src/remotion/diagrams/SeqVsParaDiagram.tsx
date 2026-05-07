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

const TRACK_H = 50;
const SEQ_Y = 200;
const PAR_Y = 400;
const AXIS_X0 = 130;
const AXIS_W = 780;
const BAR_H = 38;

const TOOLS = [
  { label: "Tool A", color: T.cyan   },
  { label: "Tool B", color: T.amber  },
  { label: "Tool C", color: T.mint   },
  { label: "Tool D", color: T.violet },
];

// Sequential: each 1/4 of the axis
const SEQ_UNIT = AXIS_W / 4;
// Parallel: all compressed to ~30% of axis (1.2x faster proportional)
const PAR_UNIT = AXIS_W * 0.30;

export const SeqVsParaDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axisIn     = p(frame, duration, 0.00, 0.14);
  const seqP       = p(frame, duration, 0.14, 0.48);
  const paraP      = p(frame, duration, 0.48, 0.78);
  const badgeIn    = p(frame, duration, 0.82, 1.00);

  const hiSeq  = hi("SEQUENTIAL");
  const hiPara = hi("PARALLEL");

  // Time-axis ticks
  const ticks = [0, 1, 2, 3, 4];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="svp-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="svp-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Time axis ── */}
      <g opacity={axisIn}>
        <line x1={AXIS_X0} y1={560} x2={AXIS_X0 + AXIS_W + 20} y2={560}
          stroke={T.border} strokeWidth="1.5" />
        {ticks.map(t => {
          const tx = AXIS_X0 + (t / 4) * AXIS_W;
          return (
            <g key={t}>
              <line x1={tx} y1={556} x2={tx} y2={564} stroke={T.border} strokeWidth="1.5" />
              <text x={tx} y={580} textAnchor="middle"
                fill={T.textDim} fontFamily={T.mono} fontSize="12">{t}s</text>
            </g>
          );
        })}
        <text x={AXIS_X0 + AXIS_W + 30} y={565} textAnchor="start"
          fill={T.textDim} fontFamily={T.mono} fontSize="11">time</text>
      </g>

      {/* ── SEQUENTIAL track ── */}
      <g opacity={axisIn}>
        <text x={AXIS_X0 - 8} y={SEQ_Y + TRACK_H / 2 + 6} textAnchor="end"
          fill={hiSeq ? T.coral : T.textDim}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1.5"
          filter={hiSeq ? "url(#svp-glow-sm)" : undefined}>
          SEQUENTIAL
        </text>
        {/* Track background */}
        <rect x={AXIS_X0} y={SEQ_Y} width={AXIS_W} height={TRACK_H} rx="8"
          fill={T.bgDeep} stroke={hiSeq ? T.coral : T.border}
          strokeWidth={hiSeq ? 2 : 1}
          filter={hiSeq ? "url(#svp-glow-sm)" : undefined}
        />
      </g>

      {/* Sequential bars — one at a time */}
      {TOOLS.map((tool, i) => {
        const barStart = i / 4;
        const barEnd = (i + 1) / 4;
        // Each bar fills in as seqP covers its range
        const barP = interpolate(seqP, [barStart, barEnd], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const bx = AXIS_X0 + i * SEQ_UNIT;
        const bw = SEQ_UNIT * barP;
        return (
          <g key={tool.label} opacity={seqP > barStart ? 1 : 0}>
            <rect x={bx} y={SEQ_Y + 6} width={bw} height={BAR_H} rx="6"
              fill={tool.color} fillOpacity={0.75} />
            {bw > 50 && (
              <text x={bx + bw / 2} y={SEQ_Y + 6 + BAR_H / 2 + 5} textAnchor="middle"
                fill={T.bgDeep} fontFamily={T.sans} fontSize="11" fontWeight="700">
                {tool.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Sequential total label */}
      {seqP > 0.9 && (
        <text x={AXIS_X0 + AXIS_W} y={SEQ_Y - 8} textAnchor="end"
          fill={T.coral} fontFamily={T.mono} fontSize="12" fontWeight="700"
          opacity={interpolate(seqP, [0.9, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          total: 4.0s
        </text>
      )}

      {/* ── PARALLEL track ── */}
      <g opacity={axisIn}>
        <text x={AXIS_X0 - 8} y={PAR_Y + TRACK_H / 2 + 6} textAnchor="end"
          fill={hiPara ? T.mint : T.textDim}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1.5"
          filter={hiPara ? "url(#svp-glow-sm)" : undefined}>
          PARALLEL
        </text>
        <rect x={AXIS_X0} y={PAR_Y} width={AXIS_W} height={TRACK_H} rx="8"
          fill={T.bgDeep} stroke={hiPara ? T.mint : T.border}
          strokeWidth={hiPara ? 2 : 1}
          filter={hiPara ? "url(#svp-glow-sm)" : undefined}
        />
      </g>

      {/* Parallel bars — all start at same time, grow to PAR_UNIT */}
      {TOOLS.map((tool, i) => {
        const rowY = PAR_Y + 4 + i * 10;
        const bw = PAR_UNIT * paraP;
        return (
          <g key={tool.label} opacity={paraP}>
            <rect x={AXIS_X0} y={PAR_Y + 6} width={bw} height={BAR_H} rx="6"
              fill={tool.color}
              fillOpacity={hiPara ? 0.85 : 0.60}
              filter={hiPara ? "url(#svp-glow-sm)" : undefined}
            />
          </g>
        );
      })}

      {/* Parallel: stacked color strips to show 4 tools overlapping */}
      {paraP > 0 && TOOLS.map((tool, i) => {
        const bw = PAR_UNIT * paraP;
        const stripH = Math.floor(BAR_H / TOOLS.length);
        return (
          <rect key={`s-${tool.label}`}
            x={AXIS_X0} y={PAR_Y + 6 + i * stripH}
            width={bw} height={stripH} rx={i === 0 ? 6 : i === 3 ? 6 : 0}
            fill={tool.color} fillOpacity={hiPara ? 0.85 : 0.65}
            filter={hiPara ? "url(#svp-glow-sm)" : undefined}
          />
        );
      })}

      {/* Parallel tool labels on right of bar */}
      {paraP > 0.6 && TOOLS.map((tool, i) => {
        const stripH = Math.floor(BAR_H / TOOLS.length);
        return (
          <text key={`lbl-${tool.label}`}
            x={AXIS_X0 + PAR_UNIT * paraP + 8}
            y={PAR_Y + 6 + i * stripH + stripH / 2 + 4}
            textAnchor="start"
            fill={tool.color} fontFamily={T.mono} fontSize="10" fontWeight="600"
            opacity={interpolate(paraP, [0.6, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
            {tool.label}
          </text>
        );
      })}

      {/* Critical path line */}
      {paraP > 0.7 && (
        <g opacity={interpolate(paraP, [0.7, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <line x1={AXIS_X0} y1={PAR_Y + TRACK_H + 12} x2={AXIS_X0 + PAR_UNIT} y2={PAR_Y + TRACK_H + 12}
            stroke={T.mint} strokeWidth="2" strokeDasharray="6 3" />
          <text x={AXIS_X0 + PAR_UNIT / 2} y={PAR_Y + TRACK_H + 28} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="10" letterSpacing="1">
            critical path: 1.2s
          </text>
        </g>
      )}

      {/* Parallel total label */}
      {paraP > 0.85 && (
        <text x={AXIS_X0 + PAR_UNIT + 6} y={PAR_Y - 8} textAnchor="start"
          fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700"
          opacity={interpolate(paraP, [0.85, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          total: 1.2s
        </text>
      )}

      {/* ── 4× FASTER badge ── */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 + 100} y={280} width={340} height={200} rx="20"
            fill={`${T.mint}14`}
            stroke={T.mint} strokeWidth="2.5"
            filter="url(#svp-glow)"
          />
          <text x={W / 2 + 270} y={356} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="48" fontWeight="900"
            filter="url(#svp-glow)">
            4×
          </text>
          <text x={W / 2 + 270} y={398} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="3">
            FASTER
          </text>
          <text x={W / 2 + 270} y={428} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">
            4.0s → 1.2s
          </text>
          <text x={W / 2 + 270} y={452} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">
            parallel execution
          </text>
        </g>
      )}
    </svg>
  );
};
