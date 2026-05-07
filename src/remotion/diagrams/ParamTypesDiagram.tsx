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

const PANEL_X = 80;
const PANEL_W = 920;
const PANEL_Y = 100;
const ROW_H = 72;
const HEADER_H = 50;
const ROWS_Y = PANEL_Y + HEADER_H + 8;

const PARAMS = [
  {
    type:     "string",
    icon:     '"abc"',
    example:  '"hello"',
    valid:    true,
    required: true,
    color:    T.cyan,
    key:      "STRING",
  },
  {
    type:     "number",
    icon:     "123",
    example:  "42",
    valid:    true,
    required: true,
    color:    T.amber,
    key:      "NUMBER",
  },
  {
    type:     "boolean",
    icon:     "T/F",
    example:  "true",
    valid:    true,
    required: false,
    color:    T.violet,
    key:      "BOOLEAN",
  },
  {
    type:     "enum",
    icon:     "[ ]",
    example:  '"red" | "blue"',
    valid:    true,
    required: true,
    color:    T.mint,
    key:      "ENUM",
  },
  {
    type:     "array",
    icon:     "[…]",
    example:  "[1, 2, 3]",
    valid:    true,
    required: false,
    color:    T.coral,
    key:      "ARRAY",
  },
];

// Column X positions
const COL_ICON   = PANEL_X + 28;
const COL_TYPE   = PANEL_X + 96;
const COL_EX     = PANEL_X + 300;
const COL_VALID  = PANEL_X + 580;
const COL_REQ    = PANEL_X + 700;

export const ParamTypesDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelIn  = p(frame, duration, 0.00, 0.14);
  const checksIn = p(frame, duration, 0.60, 0.88);
  const badgeIn  = p(frame, duration, 0.90, 1.00);

  const hiRequired = hi("REQUIRED");

  // Per-row staggered arrival
  const rowPs = PARAMS.map((_, i) => {
    const start = 0.14 + i * 0.085;
    const end = start + 0.14;
    return p(frame, duration, start, end);
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pt2-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pt2-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Panel background ── */}
      <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={HEADER_H + PARAMS.length * ROW_H + 16} rx="20"
        fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
        opacity={panelIn}
      />

      {/* ── Header ── */}
      <g opacity={panelIn}>
        <text x={COL_ICON + 10} y={PANEL_Y + 32} textAnchor="start"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
          ICON
        </text>
        <text x={COL_TYPE} y={PANEL_Y + 32} textAnchor="start"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
          TYPE
        </text>
        <text x={COL_EX} y={PANEL_Y + 32} textAnchor="start"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
          EXAMPLE VALUE
        </text>
        <text x={COL_VALID} y={PANEL_Y + 32} textAnchor="start"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
          VALID
        </text>
        <text x={COL_REQ} y={PANEL_Y + 32} textAnchor="start"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
          STATUS
        </text>
        {/* Header divider */}
        <line x1={PANEL_X + 12} y1={PANEL_Y + HEADER_H} x2={PANEL_X + PANEL_W - 12} y2={PANEL_Y + HEADER_H}
          stroke={T.border} strokeWidth="1" />
      </g>

      {/* ── Rows ── */}
      {PARAMS.map((param, i) => {
        const rp = rowPs[i];
        const ry = ROWS_Y + i * ROW_H;
        const hiRow = hi(param.key);
        const checkP = interpolate(checksIn, [i * 0.12, i * 0.12 + 0.22], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const isRequired = param.required;
        const reqHighlight = hiRequired && isRequired;

        return (
          <g key={param.type} opacity={rp}>
            {/* Row background highlight */}
            {hiRow && (
              <rect x={PANEL_X + 6} y={ry + 2} width={PANEL_W - 12} height={ROW_H - 4} rx="12"
                fill={`${param.color}18`}
                stroke={param.color} strokeWidth="1.5"
                filter="url(#pt2-glow-sm)"
              />
            )}

            {/* Icon badge */}
            <rect x={COL_ICON} y={ry + 16} width={52} height={32} rx="8"
              fill={`${param.color}28`} stroke={param.color} strokeWidth="1.2" />
            <text x={COL_ICON + 26} y={ry + 37} textAnchor="middle"
              fill={param.color} fontFamily={T.mono} fontSize="11" fontWeight="700">
              {param.icon}
            </text>

            {/* Type name */}
            <text x={COL_TYPE} y={ry + 37} textAnchor="start"
              fill={hiRow ? param.color : T.textSecondary}
              fontFamily={T.mono} fontSize="16" fontWeight={hiRow ? "700" : "500"}
              filter={hiRow ? "url(#pt2-glow-sm)" : undefined}>
              {param.type}
            </text>

            {/* Example value */}
            <rect x={COL_EX - 6} y={ry + 18} width={240} height={30} rx="8"
              fill={T.bgDeep} stroke={T.border} strokeWidth="1" />
            <text x={COL_EX + 6} y={ry + 38} textAnchor="start"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="13">
              {param.example}
            </text>

            {/* Validation check */}
            {checkP > 0 && (
              <text x={COL_VALID + 12} y={ry + 38} textAnchor="middle"
                fill={param.valid ? T.mint : T.coral}
                fontFamily={T.sans} fontSize="20" fontWeight="900"
                opacity={checkP}
                filter={checkP > 0.8 ? "url(#pt2-glow-sm)" : undefined}>
                {param.valid ? "✓" : "✗"}
              </text>
            )}

            {/* Required / Optional badge */}
            <rect x={COL_REQ} y={ry + 18} width={isRequired ? 88 : 88} height={28} rx="14"
              fill={isRequired
                ? (reqHighlight ? `${T.coral}33` : `${T.coral}18`)
                : `${T.textDim}14`}
              stroke={isRequired ? T.coral : T.border}
              strokeWidth={reqHighlight ? 2 : 1}
              filter={reqHighlight ? "url(#pt2-glow-sm)" : undefined}
            />
            <text x={COL_REQ + 44} y={ry + 37} textAnchor="middle"
              fill={isRequired ? (reqHighlight ? T.coral : T.coral) : T.textDim}
              fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1"
              filter={reqHighlight ? "url(#pt2-glow-sm)" : undefined}>
              {isRequired ? "REQUIRED" : "OPTIONAL"}
            </text>

            {/* Row separator */}
            {i < PARAMS.length - 1 && (
              <line x1={PANEL_X + 12} y1={ry + ROW_H} x2={PANEL_X + PANEL_W - 12} y2={ry + ROW_H}
                stroke={T.border} strokeWidth="0.8" opacity={0.5} />
            )}
          </g>
        );
      })}

      {/* ── Bottom badge ── */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 240} y={620} width={480} height={50} rx="25"
            fill={`${T.mint}14`} stroke={T.mint} strokeWidth="2"
            filter="url(#pt2-glow)"
          />
          <text x={W / 2} y={651} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            SCHEMA VALIDATES ALL PARAM TYPES
          </text>
        </g>
      )}
    </svg>
  );
};
