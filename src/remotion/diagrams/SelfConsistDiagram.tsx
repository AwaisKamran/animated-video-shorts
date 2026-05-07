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

const RUNS = [
  { id: 1, answer: "391", correct: true,  x: 100  },
  { id: 2, answer: "391", correct: true,  x: 290  },
  { id: 3, answer: "380", correct: false, x: 480  },
  { id: 4, answer: "391", correct: true,  x: 670  },
  { id: 5, answer: "391", correct: true,  x: 860  },
];

const TALLY = [
  { answer: "391", votes: 4, winner: true  },
  { answer: "380", votes: 1, winner: false },
];

const Q_Y = 58;
const RUN_Y = 190;
const ANS_Y = 420;
const TALLY_Y = 510;
const RUN_W = 140, RUN_H = 170;
const ANS_W = 90,  ANS_H = 52;

export const SelfConsistDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const questionIn = p(frame, duration, 0.00, 0.14);
  const runsIn     = p(frame, duration, 0.14, 0.44);
  const answersIn  = p(frame, duration, 0.44, 0.62);
  const tallyIn    = p(frame, duration, 0.62, 0.80);
  const winnerIn   = p(frame, duration, 0.80, 1.00);

  const hiConsist = hi("CONSISTENCY");
  const hiVote    = hi("VOTE");

  const runsVisible = Math.ceil(runsIn * RUNS.length);

  const TALLY_BAR_W = 600;
  const TALLY_X = (W - TALLY_BAR_W) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="scd-glow">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="scd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="scd-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="scd-arr-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* Question bar */}
      <g opacity={questionIn}>
        <rect x={160} y={Q_Y} width={W - 320} height={54} rx="14"
          fill={T.cyan} fillOpacity={0.10} stroke={T.cyan} strokeWidth="1.5"
        />
        <text x={W / 2} y={Q_Y + 20} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
          QUESTION
        </text>
        <text x={W / 2} y={Q_Y + 40} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="16" fontWeight="700">
          What is 17 × 23?
        </text>
      </g>

      {/* Diverge lines from question to runs */}
      {runsIn > 0 && RUNS.slice(0, runsVisible).map(run => (
        <line key={`dl-${run.id}`}
          x1={W / 2} y1={Q_Y + 54}
          x2={run.x + RUN_W / 2} y2={RUN_Y}
          stroke={T.violet} strokeWidth="1.5" strokeDasharray="5 4"
          opacity={Math.min(1, (runsIn * RUNS.length - run.id + 1) * 1.5) * 0.5}
          markerEnd="url(#scd-arr)"
        />
      ))}

      {/* Run panels */}
      {RUNS.slice(0, runsVisible).map(run => {
        const op = Math.min(1, (runsIn * RUNS.length - run.id + 1) * 1.5);
        return (
          <g key={run.id} opacity={op}>
            <rect x={run.x} y={RUN_Y} width={RUN_W} height={RUN_H} rx="12"
              fill={T.nodeFill} fillOpacity={0.55}
              stroke={hiConsist ? T.violet : T.border}
              strokeWidth={hiConsist ? 2 : 1.5}
            />
            <text x={run.x + RUN_W / 2} y={RUN_Y + 22} textAnchor="middle"
              fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
              RUN {run.id}
            </text>
            <line x1={run.x + 16} y1={RUN_Y + 32} x2={run.x + RUN_W - 16} y2={RUN_Y + 32}
              stroke={T.border} strokeWidth="1"
            />
            {/* Reasoning dots */}
            {[0, 1, 2].map(d => (
              <rect key={d} x={run.x + 16} y={RUN_Y + 44 + d * 26} width={RUN_W - 32} height={16} rx="5"
                fill={T.violet} fillOpacity={0.10}
              />
            ))}
            <text x={run.x + RUN_W / 2} y={RUN_Y + 56} textAnchor="middle"
              fill={T.violet} fontFamily={T.mono} fontSize="9" opacity={0.7}>
              step {run.id}a
            </text>
            <text x={run.x + RUN_W / 2} y={RUN_Y + 82} textAnchor="middle"
              fill={T.violet} fontFamily={T.mono} fontSize="9" opacity={0.6}>
              step {run.id}b
            </text>
            <text x={run.x + RUN_W / 2} y={RUN_Y + 108} textAnchor="middle"
              fill={T.violet} fontFamily={T.mono} fontSize="9" opacity={0.5}>
              step {run.id}c
            </text>
          </g>
        );
      })}

      {/* Answer lines from runs down */}
      {answersIn > 0 && RUNS.slice(0, runsVisible).map(run => (
        <line key={`al-${run.id}`}
          x1={run.x + RUN_W / 2} y1={RUN_Y + RUN_H}
          x2={run.x + RUN_W / 2} y2={ANS_Y}
          stroke={run.correct ? T.mint : T.coral} strokeWidth="1.5"
          markerEnd="url(#scd-arr)"
          opacity={Math.min(1, answersIn * 3) * 0.7}
        />
      ))}

      {/* Answer badges */}
      {answersIn > 0 && RUNS.slice(0, runsVisible).map(run => {
        const op = Math.min(1, answersIn * 2);
        const c = run.correct ? T.mint : T.coral;
        return (
          <g key={`ans-${run.id}`} opacity={op}>
            <rect x={run.x + RUN_W / 2 - ANS_W / 2} y={ANS_Y} width={ANS_W} height={ANS_H} rx="10"
              fill={c} fillOpacity={0.15}
              stroke={c} strokeWidth="2"
              filter={run.correct ? "url(#scd-glow-sm)" : undefined}
            />
            <text x={run.x + RUN_W / 2} y={ANS_Y + ANS_H / 2 + 7} textAnchor="middle"
              fill={c} fontFamily={T.mono} fontSize="18" fontWeight="800">
              {run.answer}
            </text>
          </g>
        );
      })}

      {/* Tally bar */}
      {tallyIn > 0 && (
        <g opacity={tallyIn}>
          <text x={W / 2} y={TALLY_Y + 20} textAnchor="middle"
            fill={hiVote ? T.amber : T.textDim}
            fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="3">
            MAJORITY VOTE
          </text>
          {/* Bar background */}
          <rect x={TALLY_X} y={TALLY_Y + 30} width={TALLY_BAR_W} height={34} rx="17"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
          />
          {/* 391 segment */}
          <rect x={TALLY_X} y={TALLY_Y + 30}
            width={interpolate(tallyIn, [0, 1], [0, TALLY_BAR_W * 4 / 5], { extrapolateRight: "clamp" })}
            height={34} rx="17"
            fill={T.mint} fillOpacity={0.45}
          />
          {/* 380 segment */}
          <rect x={TALLY_X + interpolate(tallyIn, [0, 1], [0, TALLY_BAR_W * 4 / 5], { extrapolateRight: "clamp" })}
            y={TALLY_Y + 30}
            width={interpolate(tallyIn, [0, 1], [0, TALLY_BAR_W * 1 / 5], { extrapolateRight: "clamp" })}
            height={34} rx="17"
            fill={T.coral} fillOpacity={0.35}
          />
          {/* Labels */}
          <text x={TALLY_X + 20} y={TALLY_Y + 52} fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700">
            391 · 4 votes
          </text>
          <text x={TALLY_X + TALLY_BAR_W - 16} y={TALLY_Y + 52} textAnchor="end"
            fill={T.coral} fontFamily={T.mono} fontSize="12" fontWeight="700">
            380 · 1 vote
          </text>
        </g>
      )}

      {/* Winner */}
      {winnerIn > 0 && (
        <g opacity={winnerIn}>
          <rect x={W / 2 - 150} y={615} width={300} height={60} rx="30"
            fill={T.mint} fillOpacity={0.16}
            stroke={T.mint} strokeWidth="2.5"
            filter="url(#scd-glow)"
          />
          <text x={W / 2} y={638} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            FINAL ANSWER
          </text>
          <text x={W / 2} y={660} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="22" fontWeight="900">
            391
          </text>
          {/* Crown */}
          <text x={W / 2 + 116} y={638} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="22">
            ★
          </text>
        </g>
      )}
    </svg>
  );
};
