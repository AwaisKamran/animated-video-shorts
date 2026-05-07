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

const CX = 540, CY = 330;
const CONTOURS = [
  { rx: 60, ry: 30 },
  { rx: 120, ry: 60 },
  { rx: 180, ry: 90 },
  { rx: 250, ry: 125 },
  { rx: 320, ry: 160 },
];

// SGD: zigzag path (oscillates)
const SGD_PATH = [
  { x: -240, y: 110 },
  { x: -120, y: -70 }, { x: -180, y: 60 }, { x: -60, y: -40 },
  { x: -130, y: 40 }, { x: -20, y: -20 }, { x: -70, y: 20 },
  { x: -5, y: -5 },
];

// Momentum: smoother but overshoots
const MOM_PATH = [
  { x: -240, y: 110 },
  { x: -160, y: 50 }, { x: -80, y: 10 }, { x: 30, y: -18 },
  { x: -20, y: 8 }, { x: 10, y: -5 }, { x: -2, y: 2 },
];

// Adam: smooth direct
const ADAM_PATH = [
  { x: -240, y: 110 },
  { x: -150, y: 55 }, { x: -70, y: 18 }, { x: -20, y: 4 }, { x: -3, y: 1 },
];

const OPTIMIZERS = [
  { key: "SGD",      path: SGD_PATH,  color: T.coral,  label: "SGD",      desc: "High oscillation" },
  { key: "MOMENTUM", path: MOM_PATH,  color: T.violet, label: "Momentum", desc: "Smooth, may overshoot" },
  { key: "ADAM",     path: ADAM_PATH, color: T.mint,   label: "Adam",     desc: "Adaptive, fast" },
];

function absPath(pts: { x: number; y: number }[], progress: number): string {
  const n = Math.max(2, Math.floor(progress * pts.length));
  const slice = pts.slice(0, n);
  return slice.map((pt, i) => `${i === 0 ? "M" : "L"} ${CX + pt.x} ${CY + pt.y}`).join(" ");
}

export const OptimizersDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const contoursIn = p(frame, duration, 0.00, 0.20);
  const pathsIn    = p(frame, duration, 0.20, 0.55);
  const glowIn     = p(frame, duration, 0.55, 0.75);
  const legendIn   = p(frame, duration, 0.75, 1.00);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="opt-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Loss contours */}
      <g opacity={contoursIn}>
        {CONTOURS.map((c, ci) => (
          <ellipse key={ci} cx={CX} cy={CY} rx={c.rx} ry={c.ry}
            fill={ci === 0 ? T.mint : "none"} fillOpacity={0.08}
            stroke={T.amber} strokeWidth="1.5"
            strokeOpacity={0.15 + ci * 0.08}
          />
        ))}
        {/* Minimum marker */}
        <circle cx={CX} cy={CY} r="8" fill={T.mint} fillOpacity={0.9} filter="url(#opt-glow)" />
        <text x={CX + 14} y={CY + 4}
          fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700">min</text>
        {/* Start point */}
        <circle cx={CX - 240} cy={CY + 110} r="8"
          fill={T.textSecondary} fillOpacity={0.8} />
        <text x={CX - 240} y={CY + 130}
          fill={T.textDim} fontFamily={T.sans} fontSize="11" textAnchor="middle">start</text>
      </g>

      {/* Optimizer paths */}
      {OPTIMIZERS.map((opt) => {
        const isHi = hi(opt.key);
        return (
          <g key={opt.key}>
            {pathsIn > 0 && (
              <path d={absPath(opt.path, pathsIn)}
                fill="none"
                stroke={opt.color}
                strokeWidth={isHi ? 3.5 : 2}
                strokeOpacity={isHi ? 1 : 0.7}
                strokeLinejoin="round"
                filter={isHi ? "url(#opt-glow)" : undefined}
              />
            )}
            {/* Endpoint glow */}
            {glowIn > 0 && (
              <circle
                cx={CX + opt.path[opt.path.length - 1].x}
                cy={CY + opt.path[opt.path.length - 1].y}
                r={isHi ? 10 : 7}
                fill={opt.color}
                fillOpacity={glowIn}
                filter={isHi ? "url(#opt-glow)" : undefined}
              />
            )}
          </g>
        );
      })}

      {/* Legend */}
      {legendIn > 0 && (
        <g opacity={legendIn}>
          <rect x={760} y={100} width={280} height={130} rx="14"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
          {OPTIMIZERS.map((opt, i) => {
            const isHi = hi(opt.key);
            return (
              <g key={opt.key}>
                <line x1={776} y1={128 + i * 36} x2={810} y2={128 + i * 36}
                  stroke={opt.color} strokeWidth={isHi ? 3 : 2}
                  filter={isHi ? "url(#opt-glow)" : undefined} />
                <text x={820} y={133 + i * 36}
                  fill={isHi ? opt.color : T.textSecondary}
                  fontFamily={T.sans} fontSize="13" fontWeight={isHi ? "700" : "500"}
                  filter={isHi ? "url(#opt-glow)" : undefined}>
                  {opt.label}
                </text>
                <text x={920} y={133 + i * 36}
                  fill={T.textDim} fontFamily={T.sans} fontSize="11">
                  {opt.desc}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};
