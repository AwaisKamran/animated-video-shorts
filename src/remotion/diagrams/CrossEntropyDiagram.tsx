import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const AX0 = 120, AY0 = 70, AX1 = 900, AY1 = 560;
const AW = AX1 - AX0, AH = AY1 - AY0;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// p in (0,1), loss range 0-4
function lossLabel1(prob: number) { return Math.min(-Math.log(Math.max(prob, 0.001)), 4.0); }
function lossLabel0(prob: number) { return Math.min(-Math.log(Math.max(1 - prob, 0.001)), 4.0); }

function svgX(prob: number) { return AX0 + prob * AW; }
function svgY(loss: number) { return AY1 - (loss / 4.0) * AH; }

function buildCurve(fn: (p: number) => number, progress: number, n = 80): string {
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const prob = 0.01 + t * 0.98;
    const loss = fn(prob);
    pts.push(`${svgX(prob)},${svgY(loss)}`);
  }
  return pts.join(" ");
}

// Build coral curve right to left
function buildCurveRTL(fn: (p: number) => number, progress: number, n = 80): string {
  const count = Math.max(2, Math.floor(progress * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = 1 - i / (n - 1);
    const prob = 0.01 + t * 0.98;
    const loss = fn(prob);
    pts.push(`${svgX(prob)},${svgY(loss)}`);
  }
  return pts.join(" ");
}

const xTicks = [0, 0.25, 0.5, 0.75, 1.0];
const yTicks = [0, 1, 2, 3, 4];

export const CrossEntropyDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.00, 0.20);
  const curve1In  = p(frame, duration, 0.20, 0.50);
  const curve0In  = p(frame, duration, 0.50, 0.75);
  const markersIn = p(frame, duration, 0.75, 0.85);
  const formulaIn = p(frame, duration, 0.85, 1.00);

  const hiEntropy    = hi("ENTROPY");
  const hiConfidence = hi("CONFIDENCE");
  const hiPenalty    = hi("PENALTY");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ce-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="ce-clip">
          <rect x={AX0} y={AY0 - 10} width={AW} height={AH + 10} />
        </clipPath>
      </defs>

      {/* Axes + grid */}
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
          fill={T.textSecondary} fontFamily={T.sans} fontSize="17" fontWeight="500">Predicted Probability p</text>
        <text x={AX0 - 55} y={(AY0 + AY1) / 2} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16"
          transform={`rotate(-90, ${AX0 - 55}, ${(AY0 + AY1) / 2})`}>Loss</text>
      </g>

      {/* Curve 1: True label=1, -log(p), mint */}
      {curve1In > 0 && (
        <polyline
          points={buildCurve(lossLabel1, curve1In)}
          fill="none"
          stroke={T.mint}
          strokeWidth={hiEntropy ? 4 : 3}
          filter={hiEntropy ? "url(#ce-glow)" : undefined}
          clipPath="url(#ce-clip)"
        />
      )}

      {/* Curve 0: True label=0, -log(1-p), coral */}
      {curve0In > 0 && (
        <polyline
          points={buildCurveRTL(lossLabel0, curve0In)}
          fill="none"
          stroke={T.coral}
          strokeWidth={hiEntropy ? 4 : 3}
          filter={hiEntropy ? "url(#ce-glow)" : undefined}
          clipPath="url(#ce-clip)"
        />
      )}

      {/* Markers */}
      {markersIn > 0 && (
        <g opacity={markersIn}>
          {/* Low confidence marker for label=1 at p=0.1 */}
          <line x1={svgX(0.1)} y1={AY0} x2={svgX(0.1)} y2={svgY(lossLabel1(0.1))}
            stroke={hiPenalty ? "#FF2244" : T.coral} strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx={svgX(0.1)} cy={svgY(lossLabel1(0.1))} r={6}
            fill={T.mint} stroke={T.mint} strokeWidth="1.5" />
          <rect x={svgX(0.1) + 8} y={svgY(lossLabel1(0.1)) - 18} width={100} height={24} rx="6"
            fill={T.bgDeep} stroke={T.coral} strokeWidth="1" />
          <text x={svgX(0.1) + 58} y={svgY(lossLabel1(0.1)) - 1} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="12" fontWeight="700">HUGE LOSS</text>

          {/* High confidence, low loss for label=1 at p=0.9 */}
          <circle cx={svgX(0.9)} cy={svgY(lossLabel1(0.9))} r={6}
            fill={T.mint} stroke={T.mint} strokeWidth="1.5" />
          <text x={svgX(0.9) - 12} y={svgY(lossLabel1(0.9)) - 12} textAnchor="end"
            fill={T.mint} fontFamily={T.sans} fontSize="12" fontWeight="700">low loss</text>
        </g>
      )}

      {/* Legend + formula */}
      {formulaIn > 0 && (
        <g opacity={formulaIn}>
          {/* Legend */}
          <line x1={AX1 - 230} y1={AY0 + 14} x2={AX1 - 190} y2={AY0 + 14}
            stroke={T.mint} strokeWidth="3" />
          <text x={AX1 - 180} y={AY0 + 19} fill={T.mint}
            fontFamily={T.sans} fontSize="13" fontWeight="600">True Label = 1  (–log p)</text>
          <line x1={AX1 - 230} y1={AY0 + 36} x2={AX1 - 190} y2={AY0 + 36}
            stroke={T.coral} strokeWidth="3" />
          <text x={AX1 - 180} y={AY0 + 41} fill={T.coral}
            fontFamily={T.sans} fontSize="13" fontWeight="600">True Label = 0  (–log(1–p))</text>

          {/* Formula */}
          <rect x={280} y={620} width={520} height={56} rx="12"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
            filter={hiEntropy ? "url(#ce-glow)" : undefined}
          />
          <text x={540} y={656} textAnchor="middle"
            fill={hiEntropy ? T.mint : T.textPrimary} fontFamily={T.mono} fontSize="19" fontWeight="700"
            filter={hiEntropy ? "url(#ce-glow)" : undefined}>
            L = –[y·log(p) + (1–y)·log(1–p)]
          </text>
        </g>
      )}
    </svg>
  );
};
