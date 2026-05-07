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

const TRIAGE_X = 540, TRIAGE_Y = 80, TRIAGE_W = 200, TRIAGE_H = 80;
const TRIAGE_CX = TRIAGE_X;

const SPECIALISTS = [
  { id: "sales",   label: "SALES",   color: T.cyan,   x: 160, y: 350 },
  { id: "support", label: "SUPPORT", color: T.mint,   x: 540, y: 350 },
  { id: "tech",    label: "TECH",    color: T.amber,  x: 920, y: 350 },
];

const SPEC_W = 160, SPEC_H = 80;
const CHOSEN = 0; // Sales is chosen

export const HandoffDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const structIn   = p(frame, duration, 0.00, 0.20);
  const msgP       = p(frame, duration, 0.20, 0.45);
  const classifyP  = p(frame, duration, 0.45, 0.70);
  const convP      = p(frame, duration, 0.70, 0.85);
  const badgeIn    = p(frame, duration, 0.85, 1.00);

  const hiRouting  = hi("ROUTING") || hi("TRIAGE");
  const hiHandoff  = hi("HANDOFF");

  const chosen = SPECIALISTS[CHOSEN];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ho-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ho-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Triage agent ── */}
      <g opacity={structIn}>
        <rect x={TRIAGE_X - TRIAGE_W / 2} y={TRIAGE_Y} width={TRIAGE_W} height={TRIAGE_H} rx="18"
          fill={T.violet} fillOpacity={hiRouting ? 0.28 : 0.15}
          stroke={T.violet} strokeWidth={hiRouting ? 3 : 2}
          filter={hiRouting ? "url(#ho-glow)" : undefined}
        />
        <text x={TRIAGE_CX} y={TRIAGE_Y + 34} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="2">
          TRIAGE
        </text>
        <text x={TRIAGE_CX} y={TRIAGE_Y + 56} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11">
          classifies intent
        </text>
      </g>

      {/* ── User message arriving ── */}
      {msgP > 0 && (
        <g>
          {/* Message bubble coming from left */}
          <rect x={80 + msgP * (TRIAGE_X - TRIAGE_W / 2 - 80 - 200)}
            y={100} width={200} height={54} rx="14"
            fill={T.cyan} fillOpacity={0.15} stroke={T.cyan} strokeWidth="1.5"
          />
          <text x={80 + msgP * (TRIAGE_X - TRIAGE_W / 2 - 80 - 200) + 100}
            y={124} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="11">
            "I need help with
          </text>
          <text x={80 + msgP * (TRIAGE_X - TRIAGE_W / 2 - 80 - 200) + 100}
            y={142} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="11">
            my bill"
          </text>
        </g>
      )}

      {/* ── Specialists ── */}
      {SPECIALISTS.map((spec, i) => {
        const isChosen = i === CHOSEN;
        const dim = classifyP > 0 && !isChosen;
        const specCX = spec.x;
        const specCY = spec.y + SPEC_H / 2;

        // Arrow from triage to specialist
        const arrowColor = isChosen && hiHandoff ? spec.color : dim ? T.border : spec.color;
        const arrowWidth = isChosen ? 2.5 : 1;

        return (
          <g key={spec.id} opacity={structIn}>
            {/* Arrow — only renders during the classification phase, growing from triage to specialist */}
            {classifyP > 0 && (() => {
              const drawProg = Math.min(1, classifyP * 1.5);
              return (
                <line
                  x1={TRIAGE_CX}
                  y1={TRIAGE_Y + TRIAGE_H}
                  x2={TRIAGE_CX + (specCX - TRIAGE_CX) * drawProg}
                  y2={TRIAGE_Y + TRIAGE_H + (spec.y - TRIAGE_Y - TRIAGE_H) * drawProg}
                  stroke={arrowColor}
                  strokeWidth={arrowWidth}
                  strokeDasharray={dim ? "5 4" : "none"}
                  opacity={dim ? 0.3 : 1}
                  filter={isChosen && classifyP > 0.5 ? "url(#ho-glow-sm)" : undefined}
                />
              );
            })()}

            {/* Specialist box */}
            <rect x={spec.x - SPEC_W / 2} y={spec.y} width={SPEC_W} height={SPEC_H} rx="14"
              fill={spec.color}
              fillOpacity={isChosen && classifyP > 0 ? 0.28 : dim ? 0.05 : 0.12}
              stroke={spec.color}
              strokeWidth={isChosen && classifyP > 0 ? 2.5 : dim ? 0.5 : 1.5}
              filter={isChosen && classifyP > 0 ? "url(#ho-glow)" : undefined}
              opacity={dim ? 0.4 : 1}
            />
            <text x={specCX} y={spec.y + SPEC_H / 2 + 6} textAnchor="middle"
              fill={spec.color} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2"
              opacity={dim ? 0.4 : 1}>
              {spec.label}
            </text>

            {/* Conversation bubbles with chosen agent */}
            {isChosen && convP > 0 && (
              <g opacity={convP}>
                <rect x={specCX - 90} y={spec.y + SPEC_H + 20} width={180} height={34} rx="10"
                  fill={T.cyan} fillOpacity={0.15} stroke={T.cyan} strokeWidth="1"
                />
                <text x={specCX} y={spec.y + SPEC_H + 42} textAnchor="middle"
                  fill={T.cyan} fontFamily={T.mono} fontSize="10">
                  User: About my bill...
                </text>
                <rect x={specCX - 90} y={spec.y + SPEC_H + 62} width={180} height={34} rx="10"
                  fill={spec.color} fillOpacity={0.15} stroke={spec.color} strokeWidth="1"
                />
                <text x={specCX} y={spec.y + SPEC_H + 84} textAnchor="middle"
                  fill={spec.color} fontFamily={T.mono} fontSize="10">
                  Sales: I can help!
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── Badge ── */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 200} y={600} width={400} height={52} rx="26"
            fill={T.cyan} fillOpacity={0.15}
            stroke={T.cyan} strokeWidth="2"
            filter="url(#ho-glow)"
          />
          <text x={W / 2} y={633} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
            HANDED OFF TO SALES ✓
          </text>
        </g>
      )}
    </svg>
  );
};
