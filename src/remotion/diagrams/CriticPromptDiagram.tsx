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

const PW = 370, PH = 220;
const WRITER_X = 60,  WRITER_Y = 140;
const CRITIC_X = 650, CRITIC_Y = 140;
const OUT_W = 340, OUT_H = 90;
const WOUT_X = 80,   WOUT_Y = 420;
const COUT_X = 660,  COUT_Y = 420;

export const CriticPromptDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const writerIn   = p(frame, duration, 0.00, 0.18);
  const woutIn     = p(frame, duration, 0.18, 0.36);
  const criticIn   = p(frame, duration, 0.36, 0.54);
  const flowIn     = p(frame, duration, 0.54, 0.70);
  const coutIn     = p(frame, duration, 0.70, 0.84);
  const loopIn     = p(frame, duration, 0.84, 1.00);

  const hiCritic = hi("CRITIC");
  const hiPrompt = hi("PROMPT");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cpd-glow">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cpd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cpd-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="cpd-arr-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
        <marker id="cpd-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
      </defs>

      {/* WRITER prompt panel */}
      <g opacity={writerIn}>
        <rect x={WRITER_X} y={WRITER_Y} width={PW} height={PH} rx="18"
          fill={T.nodeFill} fillOpacity={0.55}
          stroke={hiPrompt ? T.cyan : T.cyan} strokeWidth={hiPrompt ? 2.5 : 1.5}
          filter={hiPrompt ? "url(#cpd-glow-sm)" : undefined}
        />
        {/* Header */}
        <rect x={WRITER_X} y={WRITER_Y} width={PW} height={50} rx="18"
          fill={T.cyan} fillOpacity={0.15}
        />
        <rect x={WRITER_X} y={WRITER_Y + 25} width={PW} height={25}
          fill={T.cyan} fillOpacity={0.08}
        />
        <text x={WRITER_X + PW / 2} y={WRITER_Y + 30} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3">
          WRITER PROMPT
        </text>
        {/* Content lines */}
        <text x={WRITER_X + 20} y={WRITER_Y + 78} fill={T.textDim} fontFamily={T.mono} fontSize="11">
          System: "You are a creative writer."
        </text>
        <text x={WRITER_X + 20} y={WRITER_Y + 100} fill={T.textDim} fontFamily={T.mono} fontSize="11">
          Task: "Write a poem about the ocean."
        </text>
        <line x1={WRITER_X + 20} y1={WRITER_Y + 115} x2={WRITER_X + PW - 20} y2={WRITER_Y + 115}
          stroke={T.border} strokeWidth="1"
        />
        <text x={WRITER_X + 20} y={WRITER_Y + 134} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          The sea calls with a silver tongue,
        </text>
        <text x={WRITER_X + 20} y={WRITER_Y + 152} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          Where waves break bold and deep...
        </text>
        <text x={WRITER_X + 20} y={WRITER_Y + 170} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          [poem continues...]
        </text>
      </g>

      {/* Writer output box */}
      <g opacity={woutIn}>
        <rect x={WOUT_X} y={WOUT_Y} width={OUT_W} height={OUT_H} rx="12"
          fill={T.cyan} fillOpacity={0.10} stroke={T.cyan} strokeWidth="1.5"
        />
        <text x={WOUT_X + 12} y={WOUT_Y + 20} fill={T.cyan}
          fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="2">
          OUTPUT: POEM v1
        </text>
        <text x={WOUT_X + 12} y={WOUT_Y + 42} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          "The sea calls with a silver tongue..."
        </text>
        <text x={WOUT_X + 12} y={WOUT_Y + 58} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          "Where waves break bold and deep..."
        </text>
        {/* Arrow from writer panel down to output */}
        <line x1={WRITER_X + PW / 2} y1={WRITER_Y + PH}
          x2={WOUT_X + OUT_W / 2} y2={WOUT_Y}
          stroke={T.cyan} strokeWidth="1.5"
          markerEnd="url(#cpd-arr)" opacity={0.7}
        />
      </g>

      {/* Flow arrow: writer output → critic prompt */}
      {flowIn > 0 && (
        <g opacity={flowIn}>
          <path
            d={`M ${WOUT_X + OUT_W} ${WOUT_Y + OUT_H / 2} Q ${W / 2} ${WOUT_Y + OUT_H / 2} ${CRITIC_X} ${CRITIC_Y + PH / 2}`}
            fill="none" stroke={T.amber} strokeWidth="2" strokeDasharray="7 4"
            markerEnd="url(#cpd-arr-amber)"
          />
          <text x={W / 2} y={WOUT_Y + OUT_H / 2 - 12} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="2">
            POEM PIPED INTO CRITIC
          </text>
        </g>
      )}

      {/* CRITIC prompt panel */}
      <g opacity={criticIn}>
        <rect x={CRITIC_X} y={CRITIC_Y} width={PW} height={PH} rx="18"
          fill={T.nodeFill} fillOpacity={0.55}
          stroke={hiCritic ? T.amber : T.amber} strokeWidth={hiCritic ? 2.5 : 1.5}
          filter={hiCritic ? "url(#cpd-glow-sm)" : undefined}
        />
        <rect x={CRITIC_X} y={CRITIC_Y} width={PW} height={50} rx="18"
          fill={T.amber} fillOpacity={0.15}
        />
        <rect x={CRITIC_X} y={CRITIC_Y + 25} width={PW} height={25}
          fill={T.amber} fillOpacity={0.08}
        />
        <text x={CRITIC_X + PW / 2} y={CRITIC_Y + 30} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3">
          CRITIC PROMPT
        </text>
        <text x={CRITIC_X + 20} y={CRITIC_Y + 78} fill={T.textDim} fontFamily={T.mono} fontSize="11">
          System: "You are a poetry critic."
        </text>
        <text x={CRITIC_X + 20} y={CRITIC_Y + 100} fill={T.textDim} fontFamily={T.mono} fontSize="11">
          Review the poem for issues:
        </text>
        <line x1={CRITIC_X + 20} y1={CRITIC_Y + 115} x2={CRITIC_X + PW - 20} y2={CRITIC_Y + 115}
          stroke={T.border} strokeWidth="1"
        />
        <text x={CRITIC_X + 20} y={CRITIC_Y + 134} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          [poem injected here]
        </text>
        <text x={CRITIC_X + 20} y={CRITIC_Y + 152} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          Rate clarity, imagery, rhythm.
        </text>
        <text x={CRITIC_X + 20} y={CRITIC_Y + 170} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          Suggest specific improvements.
        </text>
      </g>

      {/* Critic output */}
      <g opacity={coutIn}>
        <rect x={COUT_X} y={COUT_Y} width={OUT_W} height={OUT_H} rx="12"
          fill={T.amber} fillOpacity={0.10} stroke={T.amber} strokeWidth="1.5"
        />
        <text x={COUT_X + 12} y={COUT_Y + 20} fill={T.amber}
          fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="2">
          CRITIQUE
        </text>
        <text x={COUT_X + 12} y={COUT_Y + 42} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          + Good imagery in stanza 1
        </text>
        <text x={COUT_X + 12} y={COUT_Y + 58} fill={T.textDim} fontFamily={T.mono} fontSize="10">
          - Rhythm breaks in line 3 — revise
        </text>
        <line x1={CRITIC_X + PW / 2} y1={CRITIC_Y + PH}
          x2={COUT_X + OUT_W / 2} y2={COUT_Y}
          stroke={T.amber} strokeWidth="1.5"
          markerEnd="url(#cpd-arr)" opacity={0.7}
        />
      </g>

      {/* Feedback loop arrow: critique → back to writer */}
      {loopIn > 0 && (
        <g opacity={loopIn}>
          <path
            d={`M ${COUT_X + OUT_W / 2} ${COUT_Y + OUT_H} Q ${COUT_X + OUT_W / 2} ${H - 40} ${WOUT_X + OUT_W / 2} ${H - 40}`}
            fill="none" stroke={T.mint} strokeWidth="2" strokeDasharray="7 4"
          />
          <line
            x1={WOUT_X + OUT_W / 2} y1={H - 40}
            x2={WOUT_X + OUT_W / 2} y2={WOUT_Y + OUT_H}
            stroke={T.mint} strokeWidth="2"
            markerEnd="url(#cpd-arr-mint)"
          />
          <text x={(WOUT_X + COUT_X + OUT_W) / 2 + 40} y={H - 24} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            REVISION LOOP
          </text>
        </g>
      )}
    </svg>
  );
};
