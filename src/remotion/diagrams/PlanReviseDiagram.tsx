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

// Plan steps layout
const STEP_Y = 310, STEP_H = 72, STEP_W = 180;
const ORIG_STEPS = [
  { id: "s1", label: "1. Fetch data",  color: T.cyan },
  { id: "s2", label: "2. Process",     color: T.coral, fails: true },
  { id: "s3", label: "3. Validate",    color: T.amber },
  { id: "s4", label: "4. Output",      color: T.mint },
];
// X positions spaced evenly
const ORIG_XS = [80, 310, 540, 770];
const ARR_GAP = 20;

// Revised plan (after insert 2a)
const REV_STEPS = [
  { id: "r1", label: "1. Fetch data",    color: T.cyan   },
  { id: "r2a",label: "2a. Cleanse",      color: T.mint,  isNew: true },
  { id: "r2", label: "2. Process",       color: T.violet },
  { id: "r3", label: "3. Validate",      color: T.amber  },
  { id: "r4", label: "4. Output",        color: T.mint   },
];
const REV_STEP_W = 140;
const REV_Y = 490, REV_H = 60;
const REV_TOTAL_W = REV_STEPS.length * (REV_STEP_W + 24) - 24;
const REV_START_X = (W - REV_TOTAL_W) / 2;

const ORCH_CX = 540, ORCH_Y = 120, ORCH_W = 240, ORCH_H = 72;

export const PlanReviseDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const planIn     = p(frame, duration, 0.00, 0.22);
  const failP      = p(frame, duration, 0.22, 0.40);
  const orchIn     = p(frame, duration, 0.40, 0.58);
  const reviseP    = p(frame, duration, 0.58, 1.00);

  const hiPlan    = hi("PLAN");
  const hiRevise  = hi("REVISE");
  const hiAdapt   = hi("ADAPT");

  const step2Failed = failP > 0.55;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pr-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pr-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="pr-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="pr-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
        <marker id="pr-violet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
      </defs>

      {/* ── PLAN A label ── */}
      {planIn > 0 && (
        <text x={80} y={STEP_Y - 22} textAnchor="start"
          fill={hiPlan ? T.violet : T.textDim}
          fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
          opacity={planIn}
          filter={hiPlan ? "url(#pr-glow-sm)" : undefined}>
          PLAN A
        </text>
      )}

      {/* ── Original plan steps ── */}
      {ORIG_STEPS.map((step, i) => {
        const sx = ORIG_XS[i];
        const cx = sx + STEP_W / 2;
        const isFailStep = step.fails;
        const isFailed   = isFailStep && step2Failed;

        return (
          <g key={step.id} opacity={planIn}>
            {/* Arrow to next */}
            {i < ORIG_STEPS.length - 1 && (
              <line
                x1={sx + STEP_W + ARR_GAP} y1={STEP_Y + STEP_H / 2}
                x2={ORIG_XS[i + 1] - ARR_GAP} y2={STEP_Y + STEP_H / 2}
                stroke={T.textDim} strokeWidth="2" markerEnd="url(#pr-arr)"
                opacity={isFailed ? 0.25 : 0.6}
              />
            )}
            {/* Step box */}
            <rect x={sx} y={STEP_Y} width={STEP_W} height={STEP_H} rx="14"
              fill={isFailed ? T.coral : step.color}
              fillOpacity={isFailed ? 0.22 : 0.14}
              stroke={isFailed ? T.coral : step.color}
              strokeWidth={isFailed ? 2.5 : 1.5}
              filter={isFailed ? "url(#pr-glow)" : undefined}
            />
            <text x={cx} y={STEP_Y + STEP_H / 2 + 6} textAnchor="middle"
              fill={isFailed ? T.coral : step.color}
              fontFamily={isFailed ? T.mono : T.sans}
              fontSize="12" fontWeight="700">
              {step.label}
            </text>
            {/* Failure X */}
            {isFailed && (
              <g opacity={Math.min(1, (failP - 0.55) * 5)}>
                <text x={cx} y={STEP_Y - 16} textAnchor="middle"
                  fill={T.coral} fontFamily={T.sans} fontSize="26" fontWeight="800"
                  filter="url(#pr-glow)">
                  ✗
                </text>
                <rect x={cx - 56} y={STEP_Y + STEP_H + 14} width={112} height={28} rx="8"
                  fill={T.coral} fillOpacity={0.14} stroke={T.coral} strokeWidth="1.5"
                />
                <text x={cx} y={STEP_Y + STEP_H + 33} textAnchor="middle"
                  fill={T.coral} fontFamily={T.mono} fontSize="10">
                  error: failed
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── ORCHESTRATOR ── */}
      {orchIn > 0 && (
        <g opacity={orchIn}>
          <rect x={ORCH_CX - ORCH_W / 2} y={ORCH_Y} width={ORCH_W} height={ORCH_H} rx="16"
            fill={T.violet} fillOpacity={hiRevise || hiAdapt ? 0.28 : 0.16}
            stroke={T.violet} strokeWidth={hiRevise || hiAdapt ? 3 : 2}
            filter={hiRevise || hiAdapt ? "url(#pr-glow)" : undefined}
          />
          <text x={ORCH_CX} y={ORCH_Y + 30} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
            ORCHESTRATOR
          </text>
          {/* Revising pulse */}
          {orchIn > 0.5 && (
            <text x={ORCH_CX} y={ORCH_Y + 54} textAnchor="middle"
              fill={T.amber} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2"
              opacity={0.5 + 0.5 * Math.sin(orchIn * Math.PI * 4)}>
              REVISING PLAN...
            </text>
          )}
        </g>
      )}

      {/* ── PLAN A' label ── */}
      {reviseP > 0 && (
        <text x={REV_START_X} y={REV_Y - 20} textAnchor="start"
          fill={hiRevise ? T.mint : T.textDim}
          fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
          opacity={Math.min(1, reviseP * 3)}
          filter={hiRevise ? "url(#pr-glow-sm)" : undefined}>
          PLAN A'
        </text>
      )}

      {/* ── Revised plan ── */}
      {reviseP > 0 && REV_STEPS.map((step, i) => {
        const sx = REV_START_X + i * (REV_STEP_W + 24);
        const cx = sx + REV_STEP_W / 2;
        const staggerOp = Math.min(1, (reviseP - i * 0.08) * 4);

        return (
          <g key={step.id} opacity={staggerOp > 0 ? staggerOp : 0}>
            {/* Arrow to next */}
            {i < REV_STEPS.length - 1 && (
              <line x1={sx + REV_STEP_W + 6} y1={REV_Y + REV_H / 2}
                x2={sx + REV_STEP_W + 18} y2={REV_Y + REV_H / 2}
                stroke={T.textDim} strokeWidth="1.5" markerEnd="url(#pr-mint)"
                opacity={0.5}
              />
            )}
            <rect x={sx} y={REV_Y} width={REV_STEP_W} height={REV_H} rx="12"
              fill={step.isNew ? T.mint : step.color}
              fillOpacity={step.isNew ? 0.28 : 0.14}
              stroke={step.isNew ? T.mint : step.color}
              strokeWidth={step.isNew ? 2.5 : 1.5}
              filter={step.isNew ? "url(#pr-glow)" : undefined}
            />
            <text x={cx} y={REV_Y + REV_H / 2 + 6} textAnchor="middle"
              fill={step.isNew ? T.mint : step.color}
              fontFamily={T.mono} fontSize="11" fontWeight={step.isNew ? "700" : "400"}>
              {step.label}
            </text>
            {step.isNew && (
              <rect x={cx - 20} y={REV_Y - 28} width={40} height={20} rx="10"
                fill={T.mint} fillOpacity={0.2} stroke={T.mint} strokeWidth="1"
              />
            )}
            {step.isNew && (
              <text x={cx} y={REV_Y - 14} textAnchor="middle"
                fill={T.mint} fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="1">
                NEW
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
