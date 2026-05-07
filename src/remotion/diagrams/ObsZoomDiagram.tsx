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

// Mini ReAct loop top (compact)
const MINI_Y = 22;
const MINI_ROW2 = 70;
const MINI_CX = W / 2;
const MINI_BOX_W = 100, MINI_BOX_H = 30;

const MINI_BOXES = [
  { label: "THOUGHT", color: T.violet, x: MINI_CX - 50,  y: MINI_Y,    active: false },
  { label: "ACTION",  color: T.amber,  x: MINI_CX + 170, y: MINI_ROW2, active: false },
  { label: "OBS",     color: T.mint,   x: MINI_CX - 270, y: MINI_ROW2, active: true  },
];

// Result panel
const PANEL_X = 120, PANEL_Y = 180, PANEL_W = 840, PANEL_H = 400;

const RESULT_LINES = [
  { text: "{",                       indent: 0, color: T.textSecondary },
  { text: '"temp": "18°C",',         indent: 1, color: T.cyan },
  { text: '"condition": "cloudy",',  indent: 1, color: T.mint },
  { text: '"humidity": "65%"',       indent: 1, color: T.cyan },
  { text: "}",                       indent: 0, color: T.textSecondary },
];

const INDENT_PX = 28;

export const ObsZoomDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const miniIn   = p(frame, duration, 0.00, 0.16);
  const panelIn  = p(frame, duration, 0.16, 0.32);
  const line0In  = p(frame, duration, 0.32, 0.48);
  const line1In  = p(frame, duration, 0.48, 0.60);
  const line2In  = p(frame, duration, 0.60, 0.72);
  const line3In  = p(frame, duration, 0.72, 0.84);
  const line4In  = p(frame, duration, 0.84, 0.92);
  const arrowIn  = p(frame, duration, 0.92, 1.00);

  const linePhases = [line0In, line1In, line2In, line3In, line4In];

  const hiObs    = hi("OBSERVATION");
  const hiResult = hi("RESULT");

  const panelHi = hiObs || hiResult;
  const panelColor = T.mint;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ozd-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ozd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="ozd-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
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
                filter={box.active ? "url(#ozd-glow-sm)" : undefined}
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

      {/* "INSIDE OBSERVATION" label */}
      {panelIn > 0 && (
        <text x={PANEL_X} y={PANEL_Y - 18} textAnchor="start"
          fill={panelColor} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
          opacity={panelIn}>
          INSIDE OBSERVATION
        </text>
      )}

      {/* Result panel */}
      {panelIn > 0 && (
        <g opacity={panelIn}>
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
            fill={T.bgDeep} fillOpacity={0.9}
            stroke={panelColor} strokeWidth={panelHi ? 2.5 : 1.5}
            filter={panelHi ? "url(#ozd-glow)" : undefined}
          />
          {/* Top bar */}
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
            tool_response.json
          </text>
          {/* "API RESPONSE" badge */}
          <rect x={PANEL_X + PANEL_W - 140} y={PANEL_Y + 6} width={126} height={24} rx="12"
            fill={panelColor} fillOpacity={0.22} stroke={panelColor} strokeWidth="1"
          />
          <text x={PANEL_X + PANEL_W - 77} y={PANEL_Y + 22} textAnchor="middle"
            fill={panelColor} fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="2">
            API RESPONSE
          </text>
        </g>
      )}

      {/* Result JSON lines (indent-aware) */}
      {RESULT_LINES.map((line, i) => {
        const lp = linePhases[i];
        if (lp <= 0) return null;
        const lineY = PANEL_Y + 66 + i * 54;
        const lineX = PANEL_X + 56 + line.indent * INDENT_PX;
        return (
          <g key={i} opacity={Math.min(1, lp * 2.5)}>
            <text x={PANEL_X + 20} y={lineY + 16} textAnchor="start"
              fill={T.textDim} fontFamily={T.mono} fontSize="13" opacity="0.35">
              {i + 1}
            </text>
            <text x={lineX} y={lineY + 16} textAnchor="start"
              fill={line.color} fontFamily={T.mono} fontSize="19" fontWeight="700">
              {line.text}
            </text>
          </g>
        );
      })}

      {/* "fed back into context" arrow at the end */}
      {arrowIn > 0 && (
        <g opacity={arrowIn}>
          <line x1={PANEL_X + PANEL_W / 2} y1={PANEL_Y + PANEL_H + 10}
            x2={PANEL_X + PANEL_W / 2} y2={PANEL_Y + PANEL_H + 52}
            stroke={panelColor} strokeWidth="2.5"
            markerEnd="url(#ozd-arr)"
          />
          <rect x={W / 2 - 220} y={PANEL_Y + PANEL_H + 56} width={440} height={40} rx="20"
            fill={panelColor} fillOpacity={0.14} stroke={panelColor} strokeWidth="1.5"
            filter="url(#ozd-glow-sm)"
          />
          <text x={W / 2} y={PANEL_Y + PANEL_H + 80} textAnchor="middle"
            fill={panelColor} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2.5">
            FED BACK INTO CONTEXT
          </text>
        </g>
      )}
    </svg>
  );
};
