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

const AXIS_X0 = 100, AXIS_X1 = 980;
const AXIS_Y0 = 80, AXIS_Y1 = 600;
const AW = AXIS_X1 - AXIS_X0;
const AH = AXIS_Y1 - AXIS_Y0;

function nToX(n: number) { return AXIS_X0 + (n / 800) * AW; }
function yToSVG(y: number) { return AXIS_Y1 - (y / 500) * AH; }

function buildPolyline(fn: (n: number) => number, progress: number, steps = 120): string {
  const count = Math.max(2, Math.floor(progress * steps));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const n = (i / (steps - 1)) * 800;
    const yv = Math.min(fn(n), 520);
    pts.push(`${nToX(n)},${yToSVG(yv)}`);
  }
  return pts.join(" ");
}

const fn = (n: number) => 0.4 * (n / 80) * (n / 80) * 100;
const upper = (n: number) => 0.7 * (n / 80) * (n / 80) * 100 + 30;
const lower = (n: number) => 0.2 * (n / 80) * (n / 80) * 100;

export const AsymptoticDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.00, 0.15);
  const fIn       = p(frame, duration, 0.15, 0.40);
  const upperIn   = p(frame, duration, 0.40, 0.60);
  const lowerIn   = p(frame, duration, 0.60, 0.78);
  const thetaIn   = p(frame, duration, 0.78, 1.00);

  const hiBigO  = hi("BIG O");
  const hiOmega = hi("OMEGA");
  const hiTheta = hi("THETA");

  const thetaPts: string[] = [];
  if (thetaIn > 0) {
    const steps = 120;
    const count = Math.max(2, Math.floor(thetaIn * steps));
    for (let i = 0; i < count; i++) {
      const n = (i / (steps - 1)) * 800;
      thetaPts.push(`${nToX(n)},${yToSVG(Math.min(upper(n), 520))}`);
    }
    for (let i = count - 1; i >= 0; i--) {
      const n = (i / (steps - 1)) * 800;
      thetaPts.push(`${nToX(n)},${yToSVG(Math.min(lower(n), 520))}`);
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="asy-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="asy-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="asy-arr-x" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
        <marker id="asy-arr-y" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
        <clipPath id="asy-clip">
          <rect x={AXIS_X0} y={AXIS_Y0} width={AW} height={AH} />
        </clipPath>
      </defs>

      <text x={W / 2} y={46} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={axesIn}>
        ASYMPTOTIC NOTATION · UPPER, LOWER, AND TIGHT BOUNDS
      </text>

      {axesIn > 0 && (
        <g opacity={axesIn}>
          <line x1={AXIS_X0} y1={AXIS_Y1} x2={AXIS_X1 + 20} y2={AXIS_Y1}
            stroke={T.border} strokeWidth="2" markerEnd="url(#asy-arr-x)" />
          <line x1={AXIS_X0} y1={AXIS_Y1} x2={AXIS_X0} y2={AXIS_Y0 - 20}
            stroke={T.border} strokeWidth="2" markerEnd="url(#asy-arr-y)" />
          <text x={AXIS_X1 + 28} y={AXIS_Y1 + 5} fill={T.textDim} fontFamily={T.sans} fontSize="14" fontStyle="italic">n</text>
          <text x={AXIS_X0 - 8} y={AXIS_Y0 - 28} fill={T.textDim} fontFamily={T.sans} fontSize="13" fontStyle="italic">T(n)</text>

          {[0, 200, 400, 600, 800].map(n => (
            <g key={n}>
              <line x1={nToX(n)} y1={AXIS_Y1} x2={nToX(n)} y2={AXIS_Y1 + 6}
                stroke={T.border} strokeWidth="1.5" />
              <text x={nToX(n)} y={AXIS_Y1 + 20} textAnchor="middle"
                fill={T.textDim} fontFamily={T.mono} fontSize="11">{n}</text>
            </g>
          ))}
        </g>
      )}

      {fIn > 0 && (
        <g clipPath="url(#asy-clip)">
          <polyline
            points={buildPolyline(fn, fIn)}
            fill="none"
            stroke={T.violet}
            strokeWidth="3.5"
            filter={hiTheta ? "url(#asy-glow)" : undefined}
          />
        </g>
      )}

      {fIn > 0.9 && (
        <text x={nToX(640)} y={yToSVG(fn(640)) - 14}
          fill={T.violet} fontFamily={T.mono} fontSize="13" fontWeight="700">
          f(n) = 0.4n²
        </text>
      )}

      {upperIn > 0 && (
        <g clipPath="url(#asy-clip)">
          <polyline
            points={buildPolyline(upper, upperIn)}
            fill="none"
            stroke={T.coral}
            strokeWidth="2.5"
            strokeDasharray="10 5"
            filter={hiBigO ? "url(#asy-glow)" : undefined}
          />
        </g>
      )}

      {upperIn > 0.9 && (
        <g opacity={upperIn}>
          <rect x={820} y={42} width={140} height={28} rx="14"
            fill={T.coral} fillOpacity={hiBigO ? 0.25 : 0.12}
            stroke={T.coral} strokeWidth="1.5"
            filter={hiBigO ? "url(#asy-glow-sm)" : undefined}
          />
          <text x={890} y={61} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="13" fontWeight="700">
            O(g(n))
          </text>
        </g>
      )}

      {lowerIn > 0 && (
        <g clipPath="url(#asy-clip)">
          <polyline
            points={buildPolyline(lower, lowerIn)}
            fill="none"
            stroke={T.mint}
            strokeWidth="2.5"
            strokeDasharray="10 5"
            filter={hiOmega ? "url(#asy-glow)" : undefined}
          />
        </g>
      )}

      {lowerIn > 0.9 && (
        <g opacity={lowerIn}>
          <rect x={820} y={78} width={140} height={28} rx="14"
            fill={T.mint} fillOpacity={hiOmega ? 0.25 : 0.12}
            stroke={T.mint} strokeWidth="1.5"
            filter={hiOmega ? "url(#asy-glow-sm)" : undefined}
          />
          <text x={890} y={97} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">
            {"Ω"}(g(n))
          </text>
        </g>
      )}

      {thetaIn > 0 && thetaPts.length > 0 && (
        <g clipPath="url(#asy-clip)">
          <polygon
            points={thetaPts.join(" ")}
            fill={T.amber}
            fillOpacity={0.18 * thetaIn}
            stroke="none"
            filter={hiTheta ? "url(#asy-glow-sm)" : undefined}
          />
        </g>
      )}

      {thetaIn > 0.9 && (
        <g opacity={thetaIn}>
          <rect x={820} y={114} width={140} height={28} rx="14"
            fill={T.amber} fillOpacity={hiTheta ? 0.30 : 0.18}
            stroke={T.amber} strokeWidth="1.5"
            filter={hiTheta ? "url(#asy-glow-sm)" : undefined}
          />
          <text x={890} y={133} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="13" fontWeight="700">
            {"Θ"}(g(n))
          </text>
        </g>
      )}

      {axesIn > 0 && (
        <text x={AXIS_X0 + 14} y={AXIS_Y1 - 14}
          fill={T.textDim} fontFamily={T.sans} fontSize="11">n₀</text>
      )}
    </svg>
  );
};
