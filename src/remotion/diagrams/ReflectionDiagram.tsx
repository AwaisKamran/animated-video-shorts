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

const PHASES = [
  { id: "gen",      label: "GENERATE",  color: T.cyan },
  { id: "critique", label: "CRITIQUE",  color: T.amber },
  { id: "revise",   label: "REVISE",    color: T.mint },
];

const BOX_W = 200, BOX_H = 80;
const BOX_Y = 120;
const GEN_X = 100, CRIT_X = 440, REV_X = 780;
const positions = [GEN_X, CRIT_X, REV_X];

const ITERATIONS = [
  { v: "v1", gen: "Initial Answer v1",  crit: "Issues: vague, step 2 err", rev: "Improved v2", quality: 40 },
  { v: "v2", gen: "Improved Answer v2", crit: "Minor: add examples",        rev: "Polished v3", quality: 70 },
  { v: "v3", gen: "Polished Answer v3", crit: "Looks great!",               rev: "Final v3",    quality: 95 },
];

// Quality meter
const METER_X = 80, METER_Y = 580, METER_W = 600, METER_H = 30;

export const ReflectionDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const pipeIn    = p(frame, duration, 0.00, 0.18);
  const iter1P    = p(frame, duration, 0.18, 0.42);
  const iter2P    = p(frame, duration, 0.42, 0.64);
  const iter3P    = p(frame, duration, 0.64, 0.84);
  const qualityIn = p(frame, duration, 0.84, 1.00);

  const hiCritique  = hi("CRITIQUE");
  const hiRevise    = hi("REVISE");
  const hiIteration = hi("ITERATION");

  const curIter = iter3P > 0 ? ITERATIONS[2] : iter2P > 0 ? ITERATIONS[1] : ITERATIONS[0];
  const curProg = iter3P > 0 ? iter3P : iter2P > 0 ? iter2P : iter1P;
  const iterNum = iter3P > 0 ? 3 : iter2P > 0 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ref-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ref-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="ref-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="ref-arr-fb" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── Three pipeline boxes ── */}
      {PHASES.map((phase, i) => {
        const hiPhase = (phase.id === "critique" && hiCritique) || (phase.id === "revise" && hiRevise);
        return (
          <g key={phase.id} opacity={pipeIn}>
            <rect x={positions[i]} y={BOX_Y} width={BOX_W} height={BOX_H} rx="16"
              fill={phase.color} fillOpacity={hiPhase ? 0.25 : 0.12}
              stroke={phase.color} strokeWidth={hiPhase ? 2.5 : 1.5}
              filter={hiPhase ? "url(#ref-glow)" : undefined}
            />
            <text x={positions[i] + BOX_W / 2} y={BOX_Y + BOX_H / 2 + 7} textAnchor="middle"
              fill={phase.color} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="1.5">
              {phase.label}
            </text>
            {/* Forward arrow */}
            {i < PHASES.length - 1 && (
              <line x1={positions[i] + BOX_W} y1={BOX_Y + BOX_H / 2}
                x2={positions[i + 1]} y2={BOX_Y + BOX_H / 2}
                stroke={T.textDim} strokeWidth="2" markerEnd="url(#ref-arr)"
                opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {/* ── Feedback loop arrow: Revise → Generate ── */}
      {pipeIn > 0.7 && (
        <g opacity={pipeIn}>
          <path d={`M ${REV_X + BOX_W / 2} ${BOX_Y + BOX_H} Q ${REV_X + BOX_W / 2} ${BOX_Y + BOX_H + 60} ${GEN_X + BOX_W / 2} ${BOX_Y + BOX_H + 60}`}
            fill="none" stroke={T.mint} strokeWidth="2" strokeDasharray="6 4"
          />
          <line x1={GEN_X + BOX_W / 2} y1={BOX_Y + BOX_H + 60}
            x2={GEN_X + BOX_W / 2} y2={BOX_Y + BOX_H}
            stroke={T.mint} strokeWidth="2" markerEnd="url(#ref-arr-fb)"
          />
          <text x={(GEN_X + REV_X + BOX_W) / 2} y={BOX_Y + BOX_H + 82} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="11" letterSpacing="2" opacity={0.8}>
            FEEDBACK LOOP
          </text>
        </g>
      )}

      {/* ── Iteration content ── */}
      {curProg > 0 && (
        <>
          {/* Gen content */}
          <text x={GEN_X + BOX_W / 2} y={BOX_Y + BOX_H + 36} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="11"
            opacity={Math.min(1, curProg * 2.5)}>
            {curIter.gen}
          </text>
          {/* Critique content */}
          {curProg > 0.35 && (
            <text x={CRIT_X + BOX_W / 2} y={BOX_Y + BOX_H + 36} textAnchor="middle"
              fill={T.amber} fontFamily={T.mono} fontSize="11"
              opacity={Math.min(1, (curProg - 0.35) * 2.5)}>
              {curIter.crit}
            </text>
          )}
          {/* Revise content */}
          {curProg > 0.68 && (
            <text x={REV_X + BOX_W / 2} y={BOX_Y + BOX_H + 36} textAnchor="middle"
              fill={T.mint} fontFamily={T.mono} fontSize="11"
              opacity={Math.min(1, (curProg - 0.68) * 2.5)}>
              {curIter.rev}
            </text>
          )}
        </>
      )}

      {/* ── Iteration labels ── */}
      {pipeIn > 0 && (
        <text x={W / 2} y={BOX_Y - 24} textAnchor="middle"
          fill={hiIteration ? T.violet : T.textDim}
          fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="2"
          filter={hiIteration ? "url(#ref-glow-sm)" : undefined}
          opacity={pipeIn}>
          ITERATION {iterNum} / 3
        </text>
      )}

      {/* ── Quality meter ── */}
      {qualityIn > 0 && (
        <g opacity={qualityIn}>
          <text x={METER_X} y={METER_Y - 16} textAnchor="start"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            QUALITY
          </text>
          {/* Bar background */}
          <rect x={METER_X} y={METER_Y} width={METER_W} height={METER_H} rx="15"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
          />
          {/* Segments */}
          {ITERATIONS.map((iter, i) => {
            const segW = (METER_W * iter.quality) / 100;
            const color = i === 0 ? T.coral : i === 1 ? T.amber : T.mint;
            return (
              <g key={i}>
                <rect x={METER_X} y={METER_Y} width={segW} height={METER_H} rx="15"
                  fill={color} fillOpacity={0.5}
                />
                <text x={METER_X + segW + 8} y={METER_Y + METER_H / 2 + 5}
                  fill={color} fontFamily={T.mono} fontSize="13" fontWeight="700">
                  {iter.v}: {iter.quality}%
                </text>
              </g>
            );
          })}
          {/* Converged badge */}
          <rect x={METER_X + METER_W + 60} y={METER_Y - 8} width={220} height={METER_H + 16} rx="23"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#ref-glow-sm)"
          />
          <text x={METER_X + METER_W + 170} y={METER_Y + METER_H / 2 + 5} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            CONVERGED
          </text>
        </g>
      )}
    </svg>
  );
};
