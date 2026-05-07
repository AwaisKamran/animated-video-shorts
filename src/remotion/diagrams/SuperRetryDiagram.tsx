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

const SUP_CX = 540, SUP_Y = 80, SUP_W = 240, SUP_H = 72;
const SUP_BOT = SUP_Y + SUP_H;

const WORKERS_INIT = [
  { id: "w1", label: "W1", task: "fetch",   color: T.cyan,   cx: 200 },
  { id: "w2", label: "W2", task: "process", color: T.coral,  cx: 540 },
  { id: "w3", label: "W3", task: "write",   color: T.mint,   cx: 880 },
];
const W4 = { id: "w4", label: "W4", task: "process", color: T.amber, cx: 540 };
const WORK_Y = 330, WORK_W = 160, WORK_H = 72;
const W4_Y = 524;

export const SuperRetryDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const supIn      = p(frame, duration, 0.00, 0.18);
  const wkIn       = p(frame, duration, 0.18, 0.35);
  const delegateP  = p(frame, duration, 0.35, 0.52);
  const failP      = p(frame, duration, 0.52, 0.65);
  const retryP     = p(frame, duration, 0.65, 0.80);
  const successP   = p(frame, duration, 0.80, 1.00);

  const hiSup     = hi("SUPERVISOR");
  const hiRetry   = hi("RETRY");
  const hiFailure = hi("FAILURE");

  // Delegate dot for each worker
  const delDots = WORKERS_INIT.map((w, i) => {
    const startPhase = 0.10 * i;
    const prog = Math.min(1, Math.max(0, delegateP - startPhase) / 0.7);
    return { ...w, dotProg: prog };
  });

  // W2 failure state
  const w2Failed = failP > 0.5;
  // W4 backup appears
  const w4Appears = retryP > 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sr-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sr-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="sr-violet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="sr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
      </defs>

      {/* ── SUPERVISOR ── */}
      <g opacity={supIn}>
        <rect x={SUP_CX - SUP_W / 2} y={SUP_Y} width={SUP_W} height={SUP_H} rx="18"
          fill={T.violet} fillOpacity={hiSup ? 0.28 : 0.16}
          stroke={T.violet} strokeWidth={hiSup ? 3 : 2}
          filter={hiSup ? "url(#sr-glow)" : undefined}
        />
        <text x={SUP_CX} y={SUP_Y + 30} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="17" fontWeight="800" letterSpacing="2">
          SUPERVISOR
        </text>
        <text x={SUP_CX} y={SUP_Y + 54} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" opacity="0.65">
          delegates · monitors · retries
        </text>
      </g>

      {/* ── REVISING label ── */}
      {failP > 0.5 && retryP < 0.8 && (
        <text x={SUP_CX} y={SUP_Y - 18} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
          opacity={Math.min(1, (failP - 0.5) * 4)}>
          REASSIGNING...
        </text>
      )}

      {/* ── Workers ── */}
      {WORKERS_INIT.map((w, i) => {
        const isW2   = i === 1;
        const isDone = successP > 0 && (!isW2 || false);
        const isW1Done = successP > 0.4 && i === 0;
        const isW3Done = successP > 0.5 && i === 2;
        const showDone = isW1Done || isW3Done;

        // Delegate arrow
        const ax0 = SUP_CX, ay0 = SUP_BOT;
        const ax1 = w.cx,   ay1 = WORK_Y;
        const dot = delDots[i];

        return (
          <g key={w.id}>
            {/* Worker box */}
            <g opacity={wkIn}>
              <rect x={w.cx - WORK_W / 2} y={WORK_Y} width={WORK_W} height={WORK_H} rx="14"
                fill={isW2 && w2Failed ? T.coral : w.color}
                fillOpacity={w2Failed && isW2 ? 0.20 : delegateP > 0 ? 0.24 : 0.12}
                stroke={isW2 && (hiFailure || w2Failed) ? T.coral : w.color}
                strokeWidth={isW2 && w2Failed ? 2.5 : 1.5}
                filter={isW2 && w2Failed ? "url(#sr-glow)" : undefined}
              />
              <text x={w.cx} y={WORK_Y + 30} textAnchor="middle"
                fill={isW2 && w2Failed ? T.coral : w.color}
                fontFamily={T.sans} fontSize="15" fontWeight="800">
                {w.label}
              </text>
              <text x={w.cx} y={WORK_Y + 52} textAnchor="middle"
                fill={isW2 && w2Failed ? T.coral : w.color}
                fontFamily={T.mono} fontSize="11" opacity={0.75}>
                {w.task}
              </text>
            </g>

            {/* W2 failure indicator */}
            {isW2 && w2Failed && (
              <g opacity={Math.min(1, (failP - 0.5) * 5)}>
                <text x={w.cx} y={WORK_Y + WORK_H + 28} textAnchor="middle"
                  fill={T.coral} fontFamily={T.sans} fontSize="26" fontWeight="800"
                  filter="url(#sr-glow)">
                  ✗
                </text>
                <rect x={w.cx - 72} y={WORK_Y + WORK_H + 44} width={144} height={32} rx="8"
                  fill={T.coral} fillOpacity={0.14} stroke={T.coral} strokeWidth="1.5"
                />
                <text x={w.cx} y={WORK_Y + WORK_H + 65} textAnchor="middle"
                  fill={T.coral} fontFamily={T.mono} fontSize="10">
                  timed out
                </text>
              </g>
            )}

            {/* Done check */}
            {showDone && (
              <text x={w.cx} y={WORK_Y - 14} textAnchor="middle"
                fill={T.mint} fontFamily={T.sans} fontSize="20" fontWeight="800"
                opacity={Math.min(1, (successP - (i === 0 ? 0.4 : 0.5)) * 6)}>
                ✓
              </text>
            )}

            {/* Delegate arrow */}
            {delegateP > 0 && !(isW2 && w2Failed) && (
              <g opacity={Math.min(1, dot.dotProg * 3)}>
                <line x1={ax0} y1={ay0} x2={ax1} y2={ay1}
                  stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="6 4"
                  markerEnd="url(#sr-violet)"
                />
                {dot.dotProg < 0.85 && (
                  <circle cx={ax0 + (ax1 - ax0) * dot.dotProg} cy={ay0 + (ay1 - ay0) * dot.dotProg}
                    r={7} fill={T.violet} opacity={0.9} filter="url(#sr-glow-sm)" />
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* ── W4 backup worker ── */}
      {w4Appears && (
        <g opacity={Math.min(1, retryP * 3)}>
          {/* Dashed retry arrow from supervisor to W4 */}
          <line x1={SUP_CX} y1={SUP_BOT} x2={W4.cx} y2={W4_Y}
            stroke={T.amber} strokeWidth="2.5" strokeDasharray="7 4"
            markerEnd="url(#sr-amber)"
            filter="url(#sr-glow-sm)"
          />
          {retryP > 0.1 && retryP < 0.7 && (
            <circle cx={SUP_CX + (W4.cx - SUP_CX) * Math.min(1, (retryP - 0.1) / 0.6)}
              cy={SUP_BOT + (W4_Y - SUP_BOT) * Math.min(1, (retryP - 0.1) / 0.6)}
              r={8} fill={T.amber} opacity={0.95} filter="url(#sr-glow-sm)" />
          )}
          {/* W4 box */}
          <rect x={W4.cx - WORK_W / 2} y={W4_Y} width={WORK_W} height={WORK_H} rx="14"
            fill={T.amber} fillOpacity={0.25}
            stroke={hiRetry ? T.amber : T.amber} strokeWidth={hiRetry ? 3 : 2}
            filter={hiRetry ? "url(#sr-glow)" : undefined}
          />
          <text x={W4.cx} y={W4_Y + 30} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="15" fontWeight="800">
            W4
          </text>
          <text x={W4.cx} y={W4_Y + 52} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="11" opacity={0.75}>
            {W4.task}
          </text>
          {/* RETRY badge */}
          <rect x={W4.cx - 44} y={W4_Y - 36} width={88} height={26} rx="13"
            fill={T.amber} fillOpacity={0.2} stroke={T.amber} strokeWidth="1.5"
          />
          <text x={W4.cx} y={W4_Y - 18} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            RETRY
          </text>
        </g>
      )}

      {/* ── W4 success (positioned to the right of W4 box, not overlapping the W2 failure indicator above) ── */}
      {successP > 0.25 && w4Appears && (
        <g opacity={Math.min(1, (successP - 0.25) * 4)}>
          <circle cx={W4.cx + WORK_W / 2 + 22} cy={W4_Y + WORK_H / 2}
            r={16} fill={T.mint} fillOpacity={0.18} stroke={T.mint} strokeWidth="2"
            filter="url(#sr-glow-sm)"
          />
          <text x={W4.cx + WORK_W / 2 + 22} y={W4_Y + WORK_H / 2 + 6} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="800">
            ✓
          </text>
        </g>
      )}

      {/* ── All complete badge ── */}
      {successP > 0.75 && (
        <g opacity={Math.min(1, (successP - 0.75) * 4)}>
          <rect x={W / 2 - 180} y={628} width={360} height={48} rx="24"
            fill={T.mint} fillOpacity={0.14}
            stroke={T.mint} strokeWidth="2"
            filter="url(#sr-glow-sm)"
          />
          <text x={W / 2} y={658} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
            ALL TASKS COMPLETE
          </text>
        </g>
      )}
    </svg>
  );
};
