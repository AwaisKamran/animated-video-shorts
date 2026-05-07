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

const STEPS = [
  { text: "What's 17 × 23?", color: T.cyan,   type: "question" },
  { text: "Break it down...", color: T.violet, type: "step" },
  { text: "17 × 20 = 340",   color: T.violet, type: "step" },
  { text: "17 × 3 = 51",     color: T.violet, type: "step" },
  { text: "340 + 51 = 391",  color: T.violet, type: "step" },
  { text: "Answer: 391",     color: T.mint,   type: "answer" },
];

const BOX_W = 140, BOX_H = 66;
const STEP_GAP = 170;
const START_X = 40;
const BOX_Y = 290;

export const CoTDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const qIn      = p(frame, duration, 0.00, 0.15);
  const stepsP   = p(frame, duration, 0.15, 0.85);
  const finalIn  = p(frame, duration, 0.85, 1.00);

  const hiReason  = hi("REASONING") || hi("STEP BY STEP");

  const stepsVisible = 1 + Math.floor(stepsP * (STEPS.length - 2));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cot-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cot-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cot-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="cot-arr-m" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={55} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={qIn}>
        CHAIN OF THOUGHT · STEP BY STEP REASONING
      </text>

      {/* Steps */}
      {STEPS.slice(0, stepsVisible + 1).map((step, i) => {
        if (i === 0 && qIn <= 0) return null;
        const sx = START_X + i * STEP_GAP;
        const isAnswer = step.type === "answer";
        const isActive = i === stepsVisible;
        const glowing = isAnswer && finalIn > 0.5;
        const hiThis  = hiReason && step.type === "step";

        return (
          <g key={i}>
            {/* Connector arrow to previous */}
            {i > 0 && (
              <line
                x1={sx - STEP_GAP + BOX_W}
                y1={BOX_Y + BOX_H / 2}
                x2={sx}
                y2={BOX_Y + BOX_H / 2}
                stroke={isAnswer ? T.mint : T.violet}
                strokeWidth="2"
                markerEnd={isAnswer ? "url(#cot-arr-m)" : "url(#cot-arr)"}
                filter={hiReason ? "url(#cot-glow-sm)" : undefined}
              />
            )}

            {/* Box */}
            <rect x={sx} y={BOX_Y} width={BOX_W} height={BOX_H} rx="14"
              fill={step.color} fillOpacity={glowing ? 0.30 : hiThis ? 0.22 : 0.12}
              stroke={step.color} strokeWidth={glowing || hiThis ? 2.5 : 1.5}
              filter={glowing ? "url(#cot-glow)" : hiThis ? "url(#cot-glow-sm)" : undefined}
            />

            {/* Step number */}
            {step.type === "step" && (
              <text x={sx + 12} y={BOX_Y + 20} textAnchor="start"
                fill={step.color} fontFamily={T.sans} fontSize="10" opacity={0.6} letterSpacing="1">
                STEP {i}
              </text>
            )}

            {/* Main text */}
            <text x={sx + BOX_W / 2} y={BOX_Y + (step.type === "step" ? BOX_H / 2 + 12 : BOX_H / 2 + 6)} textAnchor="middle"
              fill={step.color} fontFamily={T.mono} fontSize="13" fontWeight="700">
              {step.text}
            </text>
          </g>
        );
      })}

      {/* Final celebration glow */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={START_X + 5 * STEP_GAP - 8} y={BOX_Y - 8} width={BOX_W + 16} height={BOX_H + 16} rx="18"
            fill="none"
            stroke={T.mint} strokeWidth="2"
            filter="url(#cot-glow)"
          />
          <text x={START_X + 5 * STEP_GAP + BOX_W / 2} y={BOX_Y + BOX_H + 50} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            CORRECT
          </text>
        </g>
      )}
    </svg>
  );
};
