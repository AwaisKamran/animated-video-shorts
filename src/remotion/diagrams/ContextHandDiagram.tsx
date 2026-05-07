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

const TRIAGE_X = 80,  TRIAGE_Y = 280, TRIAGE_W = 200, TRIAGE_H = 80;
const SPEC_X   = 800, SPEC_Y   = 280, SPEC_W   = 200, SPEC_H   = 80;
const BAG_X    = 420, BAG_Y    = 255, BAG_W    = 240, BAG_H    = 130;
const BAG_CX   = BAG_X + BAG_W / 2;
const BAG_CY   = BAG_Y + BAG_H / 2;

const BAG_ITEMS = ["user_id", "conversation_history", "preferences", "prior_intent"];

export const ContextHandDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const structIn  = p(frame, duration, 0.00, 0.20);
  const triageP   = p(frame, duration, 0.20, 0.40);
  const packP     = p(frame, duration, 0.40, 0.62);
  const handoffP  = p(frame, duration, 0.62, 0.82);
  const receiveP  = p(frame, duration, 0.82, 1.00);

  const hiCtx      = hi("CONTEXT");
  const hiHandoff  = hi("HANDOFF");
  const hiPreserve = hi("PRESERVE");

  // Bag travels from BAG_CX → SPEC center
  const bagTravelX = BAG_X + (SPEC_X + SPEC_W / 2 - BAG_X - BAG_W / 2) * handoffP;

  // Dot traveling along the path
  const dotX = BAG_CX + (SPEC_X + SPEC_W / 2 - BAG_CX) * handoffP;
  const dotY = BAG_CY;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ch-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ch-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="ch-arr-v" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="ch-arr-c" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
      </defs>

      {/* ── Triage agent ── */}
      <g opacity={structIn}>
        <rect x={TRIAGE_X} y={TRIAGE_Y} width={TRIAGE_W} height={TRIAGE_H} rx="16"
          fill={T.violet} fillOpacity={triageP > 0 ? 0.26 : 0.15}
          stroke={T.violet} strokeWidth="2"
          filter={triageP > 0 ? "url(#ch-glow-sm)" : undefined}
        />
        <text x={TRIAGE_X + TRIAGE_W / 2} y={TRIAGE_Y + 32} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
          TRIAGE
        </text>
        <text x={TRIAGE_X + TRIAGE_W / 2} y={TRIAGE_Y + 56} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11">
          gathers context
        </text>
      </g>

      {/* ── Specialist agent ── */}
      <g opacity={structIn}>
        <rect x={SPEC_X} y={SPEC_Y} width={SPEC_W} height={SPEC_H} rx="16"
          fill={T.cyan} fillOpacity={receiveP > 0 ? 0.26 : 0.12}
          stroke={T.cyan} strokeWidth={receiveP > 0 ? 2.5 : 1.5}
          filter={receiveP > 0 ? "url(#ch-glow)" : undefined}
        />
        <text x={SPEC_X + SPEC_W / 2} y={SPEC_Y + 32} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
          SPECIALIST
        </text>
        <text x={SPEC_X + SPEC_W / 2} y={SPEC_Y + 56} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11">
          continues seamlessly
        </text>
      </g>

      {/* ── Triage processing dots ── */}
      {triageP > 0 && triageP < 0.9 && (
        <g opacity={triageP}>
          <text x={TRIAGE_X + TRIAGE_W / 2} y={TRIAGE_Y - 18} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            PROCESSING
          </text>
        </g>
      )}

      {/* ── Context bag ── */}
      {packP > 0 && handoffP < 0.95 && (
        <g opacity={Math.min(1, packP * 3)}
          transform={handoffP > 0 ? `translate(${bagTravelX - BAG_X}, 0)` : undefined}>
          <rect x={BAG_X} y={BAG_Y} width={BAG_W} height={BAG_H} rx="14"
            fill={T.bgDeep}
            stroke={hiCtx || hiPreserve ? T.amber : T.borderStrong}
            strokeWidth={hiCtx || hiPreserve ? 3 : 2}
            filter={hiCtx || hiPreserve ? "url(#ch-glow)" : undefined}
          />
          <text x={BAG_CX} y={BAG_Y + 24} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="2">
            CONTEXT BAG
          </text>
          {/* Bag items appearing one by one */}
          {BAG_ITEMS.map((item, i) => {
            const itemProg = Math.min(1, Math.max(0, (packP - 0.15 * i) * 4));
            return itemProg > 0 ? (
              <text key={item} x={BAG_CX} y={BAG_Y + 44 + i * 20} textAnchor="middle"
                fill={T.textSecondary} fontFamily={T.mono} fontSize="10"
                opacity={itemProg}>
                {item}
              </text>
            ) : null;
          })}
        </g>
      )}

      {/* ── Handoff arrow ── */}
      {handoffP > 0 && (
        <g opacity={Math.min(1, handoffP * 3)}>
          <line x1={TRIAGE_X + TRIAGE_W} y1={TRIAGE_Y + TRIAGE_H / 2}
            x2={SPEC_X} y2={SPEC_Y + SPEC_H / 2}
            stroke={hiHandoff ? T.amber : T.borderStrong}
            strokeWidth={hiHandoff ? 3 : 2}
            markerEnd="url(#ch-arr-c)"
            filter={hiHandoff ? "url(#ch-glow-sm)" : undefined}
          />
          {/* Traveling dot */}
          {handoffP < 0.9 && (
            <circle cx={dotX} cy={dotY} r={10}
              fill={T.amber} opacity={0.95}
              filter="url(#ch-glow)"
            />
          )}
        </g>
      )}

      {/* ── Received badge + items at specialist ── */}
      {receiveP > 0 && (
        <g opacity={receiveP}>
          <text x={SPEC_X + SPEC_W / 2} y={SPEC_Y - 18} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            CONTEXT RECEIVED
          </text>
          {BAG_ITEMS.map((item, i) => (
            <text key={item} x={SPEC_X + SPEC_W / 2} y={SPEC_Y + SPEC_H + 24 + i * 18} textAnchor="middle"
              fill={T.mint} fontFamily={T.mono} fontSize="10"
              opacity={Math.min(1, (receiveP - i * 0.1) * 4)}>
              {item}
            </text>
          ))}
        </g>
      )}

      {/* ── Without context note ── */}
      {structIn > 0.7 && packP < 0.2 && (
        <g opacity={structIn}>
          <rect x={BAG_X} y={BAG_Y} width={BAG_W} height={64} rx="10"
            fill={T.coral} fillOpacity={0.08} stroke={T.coral} strokeWidth="1"
            strokeDasharray="5 3"
          />
          <text x={BAG_CX} y={BAG_Y + 28} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="11" opacity={0.7}>
            without context:
          </text>
          <text x={BAG_CX} y={BAG_Y + 48} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="10" opacity={0.6}>
            "who are you again?"
          </text>
        </g>
      )}

      {/* ── Final done badge ── */}
      {receiveP > 0.8 && (
        <g opacity={Math.min(1, (receiveP - 0.8) * 5)}>
          <rect x={W / 2 - 210} y={616} width={420} height={50} rx="25"
            fill={T.cyan} fillOpacity={0.14}
            stroke={T.cyan} strokeWidth="2"
            filter="url(#ch-glow-sm)"
          />
          <text x={W / 2} y={647} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            CONTEXT PRESERVED  ✓
          </text>
        </g>
      )}
    </svg>
  );
};
