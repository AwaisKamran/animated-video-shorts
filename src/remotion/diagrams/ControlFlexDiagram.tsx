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

// Axis layout
const ORIGIN_X = 160, ORIGIN_Y = 580;
const AXIS_LEN_X = 800, AXIS_LEN_Y = 480;

// Dot positions on the chart [controlPct 0=low..1=high, flexPct 0=low..1=high]
// x coord = ORIGIN_X + controlPct * AXIS_LEN_X
// y coord = ORIGIN_Y - flexPct * AXIS_LEN_Y
const DOTS = [
  {
    id: "script",
    label: "Hardcoded Script",
    sublabel: "predictable",
    controlPct: 0.88,
    flexPct: 0.12,
    color: T.mint,
    term: "CONTROL",
  },
  {
    id: "workflow",
    label: "Workflow",
    sublabel: "structured",
    controlPct: 0.62,
    flexPct: 0.45,
    color: T.cyan,
    term: "CONTROL",
  },
  {
    id: "agent",
    label: "Agent",
    sublabel: "adaptive",
    controlPct: 0.22,
    flexPct: 0.78,
    color: T.violet,
    term: "FLEXIBILITY",
  },
  {
    id: "chaos",
    label: "Chaos",
    sublabel: "unpredictable",
    controlPct: 0.05,
    flexPct: 0.96,
    color: T.coral,
    term: "FLEXIBILITY",
  },
];

export const ControlFlexDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn   = p(frame, duration, 0.00, 0.20);
  const dot0In   = p(frame, duration, 0.20, 0.38);
  const dot1In   = p(frame, duration, 0.38, 0.55);
  const dot2In   = p(frame, duration, 0.55, 0.72);
  const dot3In   = p(frame, duration, 0.72, 0.85);
  const trendIn  = p(frame, duration, 0.85, 1.00);

  const dotProgress = [dot0In, dot1In, dot2In, dot3In];

  const hiControl = hi("CONTROL");
  const hiFlex    = hi("FLEXIBILITY");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cfd-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cfd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cfd-arr-x" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M0,0 L0,8 L10,4 z" fill={hiControl ? T.cyan : T.textDim} />
        </marker>
        <marker id="cfd-arr-y" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M0,0 L0,8 L10,4 z" fill={hiFlex ? T.violet : T.textDim} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={46} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={axesIn}>
        CONTROL vs FLEXIBILITY TRADEOFF
      </text>

      {/* Axes */}
      {axesIn > 0 && (
        <g opacity={axesIn}>
          {/* X-axis — Control */}
          <line x1={ORIGIN_X} y1={ORIGIN_Y}
            x2={ORIGIN_X + AXIS_LEN_X * axesIn} y2={ORIGIN_Y}
            stroke={hiControl ? T.cyan : T.textDim} strokeWidth="2.5"
            markerEnd={axesIn > 0.9 ? "url(#cfd-arr-x)" : undefined}
          />
          <text x={ORIGIN_X + AXIS_LEN_X / 2} y={ORIGIN_Y + 38} textAnchor="middle"
            fill={hiControl ? T.cyan : T.textDim}
            fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3"
            filter={hiControl ? "url(#cfd-glow-sm)" : undefined}>
            CONTROL →
          </text>
          <text x={ORIGIN_X + 8} y={ORIGIN_Y + 22} textAnchor="start"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" opacity="0.55">
            low
          </text>
          <text x={ORIGIN_X + AXIS_LEN_X - 8} y={ORIGIN_Y + 22} textAnchor="end"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" opacity="0.55">
            high
          </text>

          {/* Y-axis — Flexibility */}
          <line x1={ORIGIN_X} y1={ORIGIN_Y}
            x2={ORIGIN_X} y2={ORIGIN_Y - AXIS_LEN_Y * axesIn}
            stroke={hiFlex ? T.violet : T.textDim} strokeWidth="2.5"
            markerEnd={axesIn > 0.9 ? "url(#cfd-arr-y)" : undefined}
          />
          <text x={ORIGIN_X - 24} y={ORIGIN_Y - AXIS_LEN_Y / 2} textAnchor="middle"
            fill={hiFlex ? T.violet : T.textDim}
            fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3"
            transform={`rotate(-90, ${ORIGIN_X - 24}, ${ORIGIN_Y - AXIS_LEN_Y / 2})`}
            filter={hiFlex ? "url(#cfd-glow-sm)" : undefined}>
            FLEXIBILITY →
          </text>
          <text x={ORIGIN_X - 16} y={ORIGIN_Y - 6} textAnchor="end"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" opacity="0.55">
            low
          </text>
          <text x={ORIGIN_X - 16} y={ORIGIN_Y - AXIS_LEN_Y + 12} textAnchor="end"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" opacity="0.55">
            high
          </text>

          {/* Grid lines faint */}
          {[0.25, 0.5, 0.75].map(t => (
            <g key={t} opacity="0.12">
              <line x1={ORIGIN_X} y1={ORIGIN_Y - t * AXIS_LEN_Y}
                x2={ORIGIN_X + AXIS_LEN_X} y2={ORIGIN_Y - t * AXIS_LEN_Y}
                stroke={T.border} strokeWidth="1" strokeDasharray="6 5"
              />
              <line x1={ORIGIN_X + t * AXIS_LEN_X} y1={ORIGIN_Y}
                x2={ORIGIN_X + t * AXIS_LEN_X} y2={ORIGIN_Y - AXIS_LEN_Y}
                stroke={T.border} strokeWidth="1" strokeDasharray="6 5"
              />
            </g>
          ))}
        </g>
      )}

      {/* Dots plotted one by one */}
      {DOTS.map((dot, i) => {
        const dp = dotProgress[i];
        if (dp <= 0) return null;
        const dx = ORIGIN_X + dot.controlPct * AXIS_LEN_X;
        const dy = ORIGIN_Y - dot.flexPct * AXIS_LEN_Y;
        const isHi = hi(dot.term);
        const r = isHi ? 16 : 12;
        return (
          <g key={dot.id} opacity={dp}>
            {isHi && (
              <circle cx={dx} cy={dy} r={r + 8}
                fill={dot.color} fillOpacity={0.15}
                filter="url(#cfd-glow)"
              />
            )}
            <circle cx={dx} cy={dy} r={r}
              fill={dot.color} fillOpacity={0.85}
              stroke={dot.color} strokeWidth="2"
              filter={isHi ? "url(#cfd-glow)" : "url(#cfd-glow-sm)"}
            />
            {/* Chaos marker */}
            {dot.id === "chaos" && (
              <text x={dx} y={dy + 5} textAnchor="middle"
                fill="#fff" fontFamily={T.sans} fontSize="11" fontWeight="900">
                ?
              </text>
            )}
            {/* Label */}
            <text x={dot.id === "script" ? dx - 14 : dx + 22}
              y={dot.id === "chaos" ? dy - 22 : dy - 18}
              textAnchor={dot.id === "script" ? "end" : "start"}
              fill={dot.color} fontFamily={T.sans} fontSize="13" fontWeight="800">
              {dot.label}
            </text>
            <text x={dot.id === "script" ? dx - 14 : dx + 22}
              y={dot.id === "chaos" ? dy - 8 : dy - 4}
              textAnchor={dot.id === "script" ? "end" : "start"}
              fill={dot.color} fontFamily={T.sans} fontSize="10" opacity="0.6">
              {dot.sublabel}
            </text>
          </g>
        );
      })}

      {/* Trend line — diagonal tradeoff */}
      {trendIn > 0 && (() => {
        const x1 = ORIGIN_X + DOTS[0].controlPct * AXIS_LEN_X;
        const y1 = ORIGIN_Y - DOTS[0].flexPct * AXIS_LEN_Y;
        const x2 = ORIGIN_X + DOTS[3].controlPct * AXIS_LEN_X;
        const y2 = ORIGIN_Y - DOTS[3].flexPct * AXIS_LEN_Y;
        const midX = x1 + (x2 - x1) * trendIn;
        const midY = y1 + (y2 - y1) * trendIn;
        return (
          <g opacity={trendIn * 0.55}>
            <line x1={x1} y1={y1} x2={midX} y2={midY}
              stroke={T.amber} strokeWidth="2" strokeDasharray="8 5"
            />
            {trendIn > 0.8 && (
              <text x={(x1 + x2) / 2 + 30} y={(y1 + y2) / 2 - 12} textAnchor="start"
                fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1.5"
                opacity={trendIn}>
                TRADEOFF
              </text>
            )}
          </g>
        );
      })()}
    </svg>
  );
};
