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

const ORC_X = 350, ORC_Y = 270, ORC_R = 80;

const WORKERS = [
  { id: "w1", label: "Fetch Data",   color: T.cyan,   angle: -120, task: "1. fetch(api)" },
  { id: "w2", label: "Analyze",      color: T.amber,  angle: -60,  task: "2. analyze(data)" },
  { id: "w3", label: "Generate",     color: T.mint,   angle: 60,   task: "3. generate(report)" },
  { id: "w4", label: "Validate",     color: T.violet, angle: 120,  task: "4. validate(output)" },
];

const PLAN_STEPS = [
  "1. Fetch raw data from API",
  "2. Analyze patterns",
  "3. Generate summary report",
  "4. Validate & return",
];

const DIST = 210;
const BOX_W = 130, BOX_H = 55;

export const OrchestratorDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const structIn   = p(frame, duration, 0.00, 0.25);
  const planP      = p(frame, duration, 0.25, 0.45);
  const dispatchP  = p(frame, duration, 0.45, 0.70);
  const parallelP  = p(frame, duration, 0.70, 0.90);
  const synthP     = p(frame, duration, 0.90, 1.00);

  const hiOrch     = hi("ORCHESTRATOR");
  const hiDecomp   = hi("DECOMPOSE");
  const hiDynamic  = hi("DYNAMIC");

  const planLinesVisible = Math.floor(planP * PLAN_STEPS.length);
  const workersActive    = Math.floor(dispatchP * WORKERS.length);

  function workerPos(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: ORC_X + Math.cos(rad) * DIST, y: ORC_Y + Math.sin(rad) * DIST };
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="orc-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="orc-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="orc-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
      </defs>

      {/* ── Orchestrator ── */}
      <g opacity={structIn}>
        <circle cx={ORC_X} cy={ORC_Y} r={ORC_R}
          fill={T.nodeFill}
          stroke={hiOrch ? T.violet : T.violet}
          strokeWidth={hiOrch ? 3 : 2}
          filter={hiOrch ? "url(#orc-glow)" : undefined}
        />
        <text x={ORC_X} y={ORC_Y - 10} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1">
          ORCH.
        </text>
        <text x={ORC_X} y={ORC_Y + 14} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="22">
          🧠
        </text>
        {/* Thinking dots during plan phase */}
        {planP > 0 && planP < 1 && (
          <>
            {[0, 1, 2].map(i => (
              <circle key={i} cx={ORC_X - 12 + i * 12} cy={ORC_Y + ORC_R + 20} r={5}
                fill={T.violet} opacity={Math.sin((planP * 4 + i * 0.8) * Math.PI) * 0.5 + 0.5}
              />
            ))}
          </>
        )}
      </g>

      {/* ── Workers ── */}
      {WORKERS.map((w, i) => {
        const pos = workerPos(w.angle);
        const rad = (w.angle * Math.PI) / 180;
        const lx1 = ORC_X + Math.cos(rad) * ORC_R;
        const ly1 = ORC_Y + Math.sin(rad) * ORC_R;
        const lx2 = pos.x - Math.cos(rad) * BOX_W / 2;
        const ly2 = pos.y - Math.sin(rad) * BOX_H / 2;
        const isActive = i < workersActive;
        const isParallel = parallelP > 0;

        return (
          <g key={w.id} opacity={structIn}>
            {/* Connection line */}
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={isActive ? w.color : T.border}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isActive ? "none" : "4 4"}
            />

            {/* Dispatch dot */}
            {isActive && dispatchP - i * 0.25 < 0.25 && dispatchP - i * 0.25 > 0 && (
              <circle
                cx={lx1 + (lx2 - lx1) * Math.min(1, (dispatchP - i * 0.25) * 4)}
                cy={ly1 + (ly2 - ly1) * Math.min(1, (dispatchP - i * 0.25) * 4)}
                r={8} fill={w.color} opacity={0.9} filter="url(#orc-glow-sm)"
              />
            )}

            {/* Worker box */}
            <rect x={pos.x - BOX_W / 2} y={pos.y - BOX_H / 2} width={BOX_W} height={BOX_H} rx="12"
              fill={w.color} fillOpacity={isActive ? 0.22 : 0.08}
              stroke={w.color} strokeWidth={isActive ? 2 : 1}
              filter={isParallel && isActive ? "url(#orc-glow-sm)" : undefined}
            />
            <text x={pos.x} y={pos.y - 4} textAnchor="middle"
              fill={w.color} fontFamily={T.sans} fontSize="11" fontWeight="700">
              {w.label}
            </text>
            {isActive && (
              <text x={pos.x} y={pos.y + 14} textAnchor="middle"
                fill={w.color} fontFamily={T.mono} fontSize="9" opacity={0.8}>
                {w.task}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Plan panel (right side) ── */}
      {planP > 0 && (
        <g>
          <rect x={700} y={80} width={340} height={280} rx="16"
            fill={T.bgDeep}
            stroke={hiDecomp || hiDynamic ? T.amber : T.borderStrong}
            strokeWidth={hiDecomp || hiDynamic ? 2.5 : 1.5}
            filter={hiDynamic ? "url(#orc-glow-sm)" : undefined}
          />
          <text x={870} y={116} textAnchor="middle"
            fill={hiDecomp ? T.amber : T.textDim}
            fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="2">
            DYNAMIC PLAN
          </text>
          {PLAN_STEPS.slice(0, planLinesVisible).map((step, i) => (
            <text key={i} x={720} y={148 + i * 42}
              fill={i < workersActive ? T.mint : T.textSecondary}
              fontFamily={T.mono} fontSize="12">
              {i < workersActive ? "✓ " : "  "}{step}
            </text>
          ))}
        </g>
      )}

      {/* ── Synthesis badge ── */}
      {synthP > 0 && (
        <g opacity={synthP}>
          <rect x={160} y={560} width={380} height={52} rx="26"
            fill={T.violet} fillOpacity={0.15}
            stroke={T.violet} strokeWidth="2"
            filter="url(#orc-glow)"
          />
          <text x={350} y={593} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
            SYNTHESIZED RESULT
          </text>
        </g>
      )}
    </svg>
  );
};
