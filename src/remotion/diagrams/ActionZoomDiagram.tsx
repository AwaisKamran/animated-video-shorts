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

// Mini ReAct loop — top (compact)
const MINI_Y = 22;
const MINI_ROW2 = 70;
const MINI_CX = W / 2;
const MINI_BOX_W = 100, MINI_BOX_H = 30;

const MINI_BOXES = [
  { label: "THOUGHT", color: T.violet, x: MINI_CX - 50,  y: MINI_Y,    active: false },
  { label: "ACTION",  color: T.amber,  x: MINI_CX + 170, y: MINI_ROW2, active: true  },
  { label: "OBS",     color: T.mint,   x: MINI_CX - 270, y: MINI_ROW2, active: false },
];

// JSON code block
const PANEL_X = 120, PANEL_Y = 180, PANEL_W = 840, PANEL_H = 410;

const JSON_LINES = [
  { text: "{",                          indent: 0, color: T.textSecondary },
  { text: '"tool": "search_weather",',  indent: 1, color: T.amber },
  { text: '"args": {',                  indent: 1, color: T.textSecondary },
  { text: '"location": "Paris",',       indent: 2, color: T.cyan },
  { text: '"units": "celsius"',         indent: 2, color: T.cyan },
  { text: "}",                          indent: 1, color: T.textSecondary },
  { text: "}",                          indent: 0, color: T.textSecondary },
];

const INDENT_PX = 28;

export const ActionZoomDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const miniIn   = p(frame, duration, 0.00, 0.16);
  const panelIn  = p(frame, duration, 0.16, 0.32);
  const lines012 = p(frame, duration, 0.32, 0.50);
  const lines345 = p(frame, duration, 0.50, 0.68);
  const line6In  = p(frame, duration, 0.68, 0.82);
  const finalIn  = p(frame, duration, 0.82, 1.00);

  const linePhases = [lines012, lines012, lines012, lines345, lines345, lines345, line6In];

  const hiAction   = hi("ACTION");
  const hiJson     = hi("JSON");
  const hiToolCall = hi("TOOL CALL");

  const panelColor = hiAction || hiJson || hiToolCall ? T.amber : T.amber;
  const panelHi    = hiAction || hiJson || hiToolCall;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="azd-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="azd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Mini ReAct loop — compact */}
      {miniIn > 0 && (
        <g opacity={miniIn * 0.75}>
          {MINI_BOXES.map((box) => (
            <g key={box.label}>
              <rect x={box.x} y={box.y} width={MINI_BOX_W} height={MINI_BOX_H} rx="7"
                fill={box.color}
                fillOpacity={box.active ? 0.35 : 0.08}
                stroke={box.color}
                strokeWidth={box.active ? 2.5 : 1}
                filter={box.active ? "url(#azd-glow-sm)" : undefined}
              />
              <text x={box.x + MINI_BOX_W / 2} y={box.y + 20} textAnchor="middle"
                fill={box.color} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1">
                {box.label}
              </text>
            </g>
          ))}
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

      {/* "INSIDE ACTION" label */}
      {panelIn > 0 && (
        <text x={PANEL_X} y={PANEL_Y - 18} textAnchor="start"
          fill={T.amber} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
          opacity={panelIn}>
          INSIDE ACTION
        </text>
      )}

      {/* Code block panel */}
      {panelIn > 0 && (
        <g opacity={panelIn}>
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
            fill={T.bgDeep} fillOpacity={0.9}
            stroke={panelColor} strokeWidth={panelHi ? 2.5 : 1.5}
            filter={panelHi ? "url(#azd-glow)" : undefined}
          />
          {/* Code panel top bar */}
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={38} rx="20"
            fill={panelColor} fillOpacity={0.15}
          />
          <rect x={PANEL_X} y={PANEL_Y + 18} width={PANEL_W} height={20}
            fill={panelColor} fillOpacity={0.15}
          />
          <circle cx={PANEL_X + 24} cy={PANEL_Y + 19} r="6" fill={T.coral} opacity="0.7" />
          <circle cx={PANEL_X + 42} cy={PANEL_Y + 19} r="6" fill={T.amber} opacity="0.7" />
          <circle cx={PANEL_X + 60} cy={PANEL_Y + 19} r="6" fill={T.mint} opacity="0.7" />
          <text x={PANEL_X + PANEL_W / 2} y={PANEL_Y + 23} textAnchor="middle"
            fill={panelColor} fontFamily={T.mono} fontSize="11" opacity="0.7" letterSpacing="1">
            tool_call.json
          </text>
        </g>
      )}

      {/* JSON lines typed one by one (indent-aware) */}
      {JSON_LINES.map((line, i) => {
        const lp = linePhases[i];
        if (lp <= 0) return null;
        const lineY = PANEL_Y + 70 + i * 48;
        const lineX = PANEL_X + 56 + line.indent * INDENT_PX;
        const isActive = lp < 0.95;
        return (
          <g key={i} opacity={Math.min(1, lp * 2.5)}>
            {/* Line number */}
            <text x={PANEL_X + 20} y={lineY + 14} textAnchor="start"
              fill={T.textDim} fontFamily={T.mono} fontSize="13" opacity="0.35">
              {i + 1}
            </text>
            {/* Line content */}
            <text x={lineX} y={lineY + 14} textAnchor="start"
              fill={line.color} fontFamily={T.mono} fontSize="18" fontWeight="700">
              {line.text}
            </text>
            {/* Cursor */}
            {isActive && i === JSON_LINES.findIndex((_, idx) => linePhases[idx] > 0 && linePhases[idx] < 0.95) && (
              <rect x={lineX + line.text.length * 10.5}
                y={lineY} width="2" height="20"
                fill={T.amber} opacity={0.6 + 0.4 * Math.sin(frame / 4)}
              />
            )}
          </g>
        );
      })}

      {/* Final: tool dispatch badge */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={W / 2 - 220} y={640} width={440} height={44} rx="22"
            fill={T.amber} fillOpacity={0.15} stroke={T.amber} strokeWidth="1.5"
            filter="url(#azd-glow-sm)"
          />
          <text x={W / 2} y={667} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            TOOL CALL DISPATCHED TO ENVIRONMENT
          </text>
        </g>
      )}
    </svg>
  );
};
