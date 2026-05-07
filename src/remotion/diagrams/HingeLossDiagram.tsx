import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const AX0 = 140, AY0 = 70, AX1 = 900, AY1 = 570;
const AW = AX1 - AX0, AH = AY1 - AY0;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// x axis: y·f(x) margin from -2 to 3
// loss: max(0, 1-x)
const X_MIN = -2, X_MAX = 3;
const Y_MAX = 3.5;

function svgX(x: number) { return AX0 + ((x - X_MIN) / (X_MAX - X_MIN)) * AW; }
function svgY(y: number) { return AY1 - (y / Y_MAX) * AH; }

function hingeLoss(x: number) { return Math.max(0, 1 - x); }
function logLoss(x: number) { return Math.log(1 + Math.exp(-x)); }

function buildHingeFlat(progress: number, n = 40): string {
  // flat segment: x from 1 to 3 (right side)
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const x = 1 + t * (X_MAX - 1);
    pts.push(`${svgX(x)},${svgY(0)}`);
  }
  return pts.join(" ");
}

function buildHingeAngled(progress: number, n = 40): string {
  // angled segment: x from -2 to 1 (left side)
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = 1 - i / (n - 1); // right to left
    const x = X_MIN + t * (1 - X_MIN);
    pts.push(`${svgX(x)},${svgY(hingeLoss(x))}`);
  }
  return pts.join(" ");
}

function buildLogCurve(progress: number, n = 80): string {
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const x = X_MIN + t * (X_MAX - X_MIN);
    const y = Math.min(logLoss(x), Y_MAX);
    pts.push(`${svgX(x)},${svgY(y)}`);
  }
  return pts.join(" ");
}

const xTicks = [-2, -1, 0, 1, 2, 3];
const yTicks = [0, 1, 2, 3];

export const HingeLossDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.00, 0.20);
  const flatIn    = p(frame, duration, 0.20, 0.40);
  const angledIn  = p(frame, duration, 0.40, 0.55);
  const logIn     = p(frame, duration, 0.55, 0.75);
  const annotIn   = p(frame, duration, 0.75, 0.90);
  const formulaIn = p(frame, duration, 0.90, 1.00);

  const hiHinge  = hi("HINGE");
  const hiMargin = hi("MARGIN");

  const kinkX = svgX(1), kinkY = svgY(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="hl-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="hl-clip">
          <rect x={AX0} y={AY0 - 10} width={AW} height={AH + 20} />
        </clipPath>
      </defs>

      {/* Grid + axes */}
      <g opacity={axesIn}>
        {yTicks.map((yt, i) => (
          <g key={i}>
            <line x1={AX0} y1={svgY(yt)} x2={AX1} y2={svgY(yt)}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
            <text x={AX0 - 12} y={svgY(yt) + 5} textAnchor="end"
              fill={T.textDim} fontFamily={T.mono} fontSize="14">{yt}</text>
          </g>
        ))}
        {xTicks.map((xt, i) => (
          <g key={i}>
            <line x1={svgX(xt)} y1={AY0} x2={svgX(xt)} y2={AY1}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 4" />
            <text x={svgX(xt)} y={AY1 + 28} textAnchor="middle"
              fill={T.textDim} fontFamily={T.mono} fontSize="14">{xt}</text>
          </g>
        ))}
        <line x1={AX0} y1={AY0 - 20} x2={AX0} y2={AY1 + 20} stroke={T.borderStrong} strokeWidth="2" />
        <line x1={AX0 - 20} y1={AY1} x2={AX1 + 20} y2={AY1} stroke={T.borderStrong} strokeWidth="2" />
        <text x={(AX0 + AX1) / 2} y={AY1 + 58} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="17">y · f(x)  (margin)</text>
        <text x={AX0 - 60} y={(AY0 + AY1) / 2} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16"
          transform={`rotate(-90, ${AX0 - 60}, ${(AY0 + AY1) / 2})`}>Loss</text>
      </g>

      {/* Hinge flat segment (right, mint) */}
      {flatIn > 0 && (
        <polyline points={buildHingeFlat(flatIn)} fill="none"
          stroke={T.mint} strokeWidth={hiHinge ? 4 : 3}
          clipPath="url(#hl-clip)"
          filter={hiHinge ? "url(#hl-glow)" : undefined}
        />
      )}

      {/* Hinge angled segment (left, coral) */}
      {angledIn > 0 && (
        <polyline points={buildHingeAngled(angledIn)} fill="none"
          stroke={T.coral} strokeWidth={hiHinge ? 4 : 3}
          clipPath="url(#hl-clip)"
          filter={hiHinge ? "url(#hl-glow)" : undefined}
        />
      )}

      {/* Log-loss comparison (violet, dashed) */}
      {logIn > 0 && (
        <polyline points={buildLogCurve(logIn)} fill="none"
          stroke={T.violet} strokeWidth="2.5" strokeDasharray="8 5"
          clipPath="url(#hl-clip)"
        />
      )}

      {/* Annotations */}
      {annotIn > 0 && (
        <g opacity={annotIn}>
          {/* Kink point */}
          <circle cx={kinkX} cy={kinkY} r={8}
            fill={hiHinge ? T.amber : T.textPrimary}
            stroke={hiHinge ? T.amber : T.borderStrong} strokeWidth="2"
            filter={hiHinge ? "url(#hl-glow)" : undefined}
          />
          <rect x={kinkX + 12} y={kinkY - 28} width={170} height={30} rx="8"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1" />
          <text x={kinkX + 97} y={kinkY - 8} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="13" fontWeight="600">
            Correct Boundary
          </text>

          {/* Penalized zone label */}
          <rect x={AX0 + 20} y={AY0 + 20} width={160} height={32} rx="8"
            fill={T.coral} fillOpacity={0.15} stroke={T.coral} strokeWidth="1.5" />
          <text x={AX0 + 100} y={AY0 + 42} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="14" fontWeight="700">Penalized Zone</text>

          {/* Legend */}
          <line x1={AX1 - 200} y1={AY0 + 14} x2={AX1 - 160} y2={AY0 + 14}
            stroke={T.violet} strokeWidth="2.5" strokeDasharray="8 5" />
          <text x={AX1 - 150} y={AY0 + 19} fill={T.violet}
            fontFamily={T.sans} fontSize="13">Log-loss (ref)</text>
        </g>
      )}

      {/* Formula */}
      {formulaIn > 0 && (
        <g opacity={formulaIn}>
          <rect x={280} y={628} width={520} height={52} rx="12"
            fill={T.bgDeep} stroke={hiMargin ? T.amber : T.borderStrong} strokeWidth="1.5"
            filter={hiHinge ? "url(#hl-glow)" : undefined}
          />
          <text x={540} y={662} textAnchor="middle"
            fill={hiHinge ? T.amber : T.textPrimary} fontFamily={T.mono} fontSize="20" fontWeight="700">
            L = max(0, 1 – y·f(x))
          </text>
        </g>
      )}
    </svg>
  );
};
