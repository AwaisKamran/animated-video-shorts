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

const MSG_X = 290, MSG_Y = 60, MSG_W = 500, MSG_H = 64;
const CLF_X = 390, CLF_Y = 195, CLF_W = 300, CLF_H = 72;
const CLF_CX = CLF_X + CLF_W / 2;

const INTENTS = [
  { label: "Sales",    pct: 5,  color: T.violet },
  { label: "Support",  pct: 88, color: T.mint,   winner: true },
  { label: "Tech",     pct: 6,  color: T.cyan   },
  { label: "Billing",  pct: 1,  color: T.amber  },
];
const BAR_X = 260, BAR_Y_START = 320, BAR_H = 42, BAR_GAP = 58, BAR_MAX_W = 520;

export const IntentClfDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const msgIn      = p(frame, duration, 0.00, 0.18);
  const clfIn      = p(frame, duration, 0.18, 0.36);
  const pulseP     = p(frame, duration, 0.36, 0.52);
  const barsP      = p(frame, duration, 0.52, 0.75);
  const routeP     = p(frame, duration, 0.75, 1.00);

  const hiIntent   = hi("INTENT");
  const hiClassify = hi("CLASSIFY");
  const hiConf     = hi("CONFIDENCE");

  const pulseSz = pulseP > 0 ? 6 + Math.sin(pulseP * Math.PI * 3) * 4 : 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ic-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ic-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="ic-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── User message ── */}
      <g opacity={msgIn}>
        <rect x={MSG_X} y={MSG_Y} width={MSG_W} height={MSG_H} rx="14"
          fill={T.cyan} fillOpacity={0.12}
          stroke={T.cyan} strokeWidth="2"
        />
        <text x={MSG_X + MSG_W / 2} y={MSG_Y + 27} textAnchor="middle"
          fill={T.cyan} fontFamily={T.mono} fontSize="13">
          USER: "I can't login to my account"
        </text>
        <text x={MSG_X + MSG_W / 2} y={MSG_Y + 48} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="2" opacity={0.6}>
          INPUT MESSAGE
        </text>
      </g>

      {/* Arrow msg → clf */}
      {clfIn > 0 && (
        <line x1={MSG_X + MSG_W / 2} y1={MSG_Y + MSG_H}
          x2={CLF_CX} y2={CLF_Y}
          stroke={T.textDim} strokeWidth="1.5" strokeDasharray="5 3"
          markerEnd="url(#ic-arr)" opacity={clfIn}
        />
      )}

      {/* ── Classifier box ── */}
      <g opacity={clfIn}>
        <rect x={CLF_X} y={CLF_Y} width={CLF_W} height={CLF_H} rx="16"
          fill={T.violet} fillOpacity={hiClassify ? 0.28 : 0.16}
          stroke={T.violet} strokeWidth={hiClassify ? 3 : 2}
          filter={hiClassify ? "url(#ic-glow)" : undefined}
        />
        <text x={CLF_CX} y={CLF_Y + 30} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
          CLASSIFIER
        </text>
        <text x={CLF_CX} y={CLF_Y + 54} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11">
          intent model
        </text>

        {/* Pulse circles */}
        {pulseP > 0 && (
          <>
            <circle cx={CLF_CX} cy={CLF_Y + CLF_H / 2} r={CLF_H / 2 + pulseSz}
              fill="none" stroke={T.violet} strokeWidth="1.5" opacity={0.3} />
            <circle cx={CLF_CX} cy={CLF_Y + CLF_H / 2} r={CLF_H / 2 + pulseSz * 2}
              fill="none" stroke={T.violet} strokeWidth="1" opacity={0.15} />
          </>
        )}
      </g>

      {/* ── Confidence bars ── */}
      {barsP > 0 && INTENTS.map((intent, i) => {
        const barY = BAR_Y_START + i * BAR_GAP;
        const barW = (BAR_MAX_W * intent.pct / 100) * Math.min(1, barsP * 2);
        const isWinner = intent.winner;
        const hiThis = isWinner && hiConf;

        return (
          <g key={intent.label} opacity={Math.min(1, (barsP - i * 0.08) * 4)}>
            {/* Label */}
            <text x={BAR_X - 12} y={barY + BAR_H / 2 + 5} textAnchor="end"
              fill={isWinner ? intent.color : T.textDim}
              fontFamily={T.sans} fontSize="13" fontWeight={isWinner ? "800" : "400"}>
              {intent.label}
            </text>
            {/* Bar track */}
            <rect x={BAR_X} y={barY} width={BAR_MAX_W} height={BAR_H} rx="8"
              fill={T.bgDeep} stroke={T.border} strokeWidth="1" />
            {/* Bar fill */}
            <rect x={BAR_X} y={barY} width={Math.max(0, barW)} height={BAR_H} rx="8"
              fill={intent.color}
              fillOpacity={isWinner ? 0.45 : 0.25}
              stroke={isWinner ? intent.color : "none"}
              strokeWidth={isWinner ? 2 : 0}
              filter={hiThis ? "url(#ic-glow)" : undefined}
            />
            {/* Pct label */}
            <text x={BAR_X + Math.max(barW, 40) + 10} y={barY + BAR_H / 2 + 5} textAnchor="start"
              fill={intent.color} fontFamily={T.mono} fontSize="13" fontWeight="700">
              {intent.pct}%
            </text>
            {/* Winner badge */}
            {isWinner && barsP > 0.6 && (
              <g opacity={Math.min(1, (barsP - 0.6) * 4)}>
                <rect x={BAR_X + BAR_MAX_W + 56} y={barY + 6} width={120} height={BAR_H - 12} rx="14"
                  fill={T.mint} fillOpacity={0.18} stroke={T.mint} strokeWidth="1.5"
                  filter="url(#ic-glow-sm)"
                />
                <text x={BAR_X + BAR_MAX_W + 116} y={barY + BAR_H / 2 + 5} textAnchor="middle"
                  fill={T.mint} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1">
                  WINNER
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── Route result ── */}
      {routeP > 0 && (
        <g opacity={routeP}>
          <rect x={W / 2 - 210} y={598} width={420} height={60} rx="30"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth={hiIntent ? 3 : 2}
            filter={hiIntent ? "url(#ic-glow)" : undefined}
          />
          <text x={W / 2} y={626} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2">
            ROUTE TO: Support
          </text>
          <text x={W / 2} y={648} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="11" opacity={0.8}>
            confidence: 88%  ✓
          </text>
        </g>
      )}
    </svg>
  );
};
