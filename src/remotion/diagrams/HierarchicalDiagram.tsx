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

const SUP_X = 540, SUP_Y = 80, SUP_W = 200, SUP_H = 90;
const SUP_CX = SUP_X, SUP_CY = SUP_Y + SUP_H / 2;

const WORKERS = [
  { id: "a", label: "Worker A", sublabel: "research", color: T.cyan,   x: 180 },
  { id: "b", label: "Worker B", sublabel: "code",     color: T.amber,  x: 540 },
  { id: "c", label: "Worker C", sublabel: "test",     color: T.mint,   x: 900 },
];

const WORK_Y = 390, WORK_W = 160, WORK_H = 80;

export const HierarchicalDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const supIn      = p(frame, duration, 0.00, 0.20);
  const workIn     = p(frame, duration, 0.20, 0.40);
  const delegateP  = p(frame, duration, 0.40, 0.65);
  const processP   = p(frame, duration, 0.65, 0.85);
  const reportP    = p(frame, duration, 0.85, 1.00);

  const hiSupervisor = hi("SUPERVISOR");
  const hiDelegate   = hi("DELEGATE");
  const hiAggregate  = hi("AGGREGATE");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="hier-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="hier-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="hier-down" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="hier-up" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── SUPERVISOR ── */}
      <g opacity={supIn}>
        <rect x={SUP_X - SUP_W / 2} y={SUP_Y} width={SUP_W} height={SUP_H} rx="20"
          fill={T.violet} fillOpacity={hiSupervisor ? 0.28 : 0.15}
          stroke={T.violet} strokeWidth={hiSupervisor ? 3 : 2}
          filter={hiSupervisor ? "url(#hier-glow)" : undefined}
        />
        <text x={SUP_CX} y={SUP_Y + 36} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="1.5">
          SUPERVISOR
        </text>
        <text x={SUP_CX} y={SUP_Y + 60} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10">
          plan · decompose · aggregate
        </text>
      </g>

      {/* ── Workers ── */}
      {WORKERS.map((w) => {
        const wCX = w.x;
        const wCY = WORK_Y + WORK_H / 2;
        const isWorking = processP > 0;
        const hiWorker = hi(w.label.toUpperCase());

        const midLX = (SUP_CX + wCX) / 2;
        const midLY = (SUP_Y + SUP_H + WORK_Y) / 2;

        return (
          <g key={w.id}>
            {/* Worker box */}
            <g opacity={workIn}>
              <rect x={w.x - WORK_W / 2} y={WORK_Y} width={WORK_W} height={WORK_H} rx="14"
                fill={w.color} fillOpacity={isWorking ? 0.25 : 0.12}
                stroke={w.color} strokeWidth={hiWorker || isWorking ? 2.5 : 1.5}
                filter={isWorking ? "url(#hier-glow-sm)" : undefined}
              />
              <text x={wCX} y={WORK_Y + 30} textAnchor="middle"
                fill={w.color} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1">
                {w.label}
              </text>
              <text x={wCX} y={WORK_Y + 52} textAnchor="middle"
                fill={w.color} fontFamily={T.mono} fontSize="11" opacity={0.8}>
                {w.sublabel}
              </text>
            </g>

            {/* Delegate arrow (supervisor → worker) */}
            {delegateP > 0 && (
              <g>
                <line x1={SUP_CX - 6} y1={SUP_Y + SUP_H}
                  x2={wCX - 6} y2={WORK_Y}
                  stroke={hiDelegate ? T.violet : T.border}
                  strokeWidth={hiDelegate ? 2.5 : 1.5}
                  strokeDasharray={delegateP < 1 ? `${delegateP * 100} 100` : "none"}
                  markerEnd="url(#hier-down)"
                  filter={hiDelegate ? "url(#hier-glow-sm)" : undefined}
                />
                <rect x={midLX - 40} y={midLY - 12} width={80} height={24} rx="12" fill={T.bgDeep} />
                <text x={midLX} y={midLY + 4} textAnchor="middle"
                  fill={T.violet} fontFamily={T.mono} fontSize="10" opacity={delegateP}>
                  {w.sublabel}
                </text>
              </g>
            )}

            {/* Report arrow (worker → supervisor) */}
            {reportP > 0 && (
              <line x1={wCX + 6} y1={WORK_Y}
                x2={SUP_CX + 6} y2={SUP_Y + SUP_H}
                stroke={hiAggregate ? T.mint : T.mint}
                strokeWidth={hiAggregate ? 2.5 : 1.5}
                strokeDasharray="none"
                markerEnd="url(#hier-up)"
                filter={hiAggregate ? "url(#hier-glow)" : undefined}
                opacity={reportP}
              />
            )}
          </g>
        );
      })}

      {/* ── Final output badge ── */}
      {reportP > 0.7 && (
        <g opacity={(reportP - 0.7) * (10 / 3)}>
          <rect x={W / 2 - 160} y={570} width={320} height={52} rx="26"
            fill={T.violet} fillOpacity={0.15}
            stroke={T.violet} strokeWidth="2"
            filter="url(#hier-glow)"
          />
          <text x={W / 2} y={603} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            FINAL OUTPUT
          </text>
        </g>
      )}
    </svg>
  );
};
