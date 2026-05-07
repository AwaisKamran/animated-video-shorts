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

// Class +1 (cyan): upper-right cluster
const POS_POINTS = [
  { x: 680, y: 160 }, { x: 740, y: 200 }, { x: 760, y: 130 },
  { x: 820, y: 180 }, { x: 700, y: 260 }, { x: 860, y: 220 },
  { x: 790, y: 290 }, { x: 650, y: 200 },
];
// Class -1 (coral): lower-left cluster
const NEG_POINTS = [
  { x: 220, y: 440 }, { x: 280, y: 480 }, { x: 240, y: 520 },
  { x: 310, y: 550 }, { x: 360, y: 430 }, { x: 180, y: 500 },
  { x: 320, y: 400 }, { x: 400, y: 470 },
];

// Diagonal decision hyperplane: the line y = -x + 1000 (approx x+y=900 in svg coords)
// We use a line from (200, 660) to (850, 110) — divides the canvas diagonally
const HP_X1 = 150, HP_Y1 = 680, HP_X2 = 900, HP_Y2 = 90;

// Margin offset perpendicular to the line
const MARGIN_OFFSET = 80;

// Support vectors — closest points to margin
const SUPPORT_VECTORS = [
  { x: 680, y: 160, cls: 1 }, // +1 class, closest
  { x: 400, y: 470, cls: -1 },
  { x: 360, y: 430, cls: -1 },
];

// Compute offset direction (perpendicular to line)
const dx = HP_X2 - HP_X1, dy = HP_Y2 - HP_Y1;
const len = Math.sqrt(dx * dx + dy * dy);
const nx = -dy / len, ny = dx / len; // normal to the line

export const SVMDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const ptsIn      = p(frame, duration, 0.00, 0.20);
  const hpIn       = p(frame, duration, 0.20, 0.40);
  const marginsIn  = p(frame, duration, 0.40, 0.60);
  const svIn       = p(frame, duration, 0.60, 0.80);
  const labelIn    = p(frame, duration, 0.80, 1.00);

  const hiMargin   = hi("MARGIN");
  const hiSV       = hi("SUPPORT VECTOR");
  const hiHP       = hi("HYPERPLANE");

  // Margin lines
  const m1x1 = HP_X1 + nx * MARGIN_OFFSET;
  const m1y1 = HP_Y1 + ny * MARGIN_OFFSET;
  const m1x2 = HP_X2 + nx * MARGIN_OFFSET;
  const m1y2 = HP_Y2 + ny * MARGIN_OFFSET;

  const m2x1 = HP_X1 - nx * MARGIN_OFFSET;
  const m2y1 = HP_Y1 - ny * MARGIN_OFFSET;
  const m2x2 = HP_X2 - nx * MARGIN_OFFSET;
  const m2y2 = HP_Y2 - ny * MARGIN_OFFSET;

  // Draw line from start to progress along line
  function progressLine(x1: number, y1: number, x2: number, y2: number, prog: number) {
    return {
      x1, y1,
      x2: x1 + prog * (x2 - x1),
      y2: y1 + prog * (y2 - y1),
    };
  }

  const hp = progressLine(HP_X1, HP_Y1, HP_X2, HP_Y2, hpIn);
  const m1 = progressLine(m1x1, m1y1, m1x2, m1y2, marginsIn);
  const m2 = progressLine(m2x1, m2y1, m2x2, m2y2, marginsIn);

  // Margin zone midpoint for label
  const midX = (HP_X1 + HP_X2) / 2;
  const midY = (HP_Y1 + HP_Y2) / 2;

  // Double arrow between margins (perpendicular to line, at midpoint)
  const arrowMidX = midX;
  const arrowMidY = midY;
  const arr1x = arrowMidX + nx * MARGIN_OFFSET;
  const arr1y = arrowMidY + ny * MARGIN_OFFSET;
  const arr2x = arrowMidX - nx * MARGIN_OFFSET;
  const arr2y = arrowMidY - ny * MARGIN_OFFSET;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="svm-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="svm-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Margin zone fill */}
      {marginsIn > 0 && hiMargin && (
        <polygon
          points={`${m1x1},${m1y1} ${m1x2},${m1y2} ${m2x2},${m2y2} ${m2x1},${m2y1}`}
          fill={T.amber} fillOpacity={0.08}
        />
      )}

      {/* Data points */}
      <g opacity={ptsIn}>
        {POS_POINTS.map((pt, i) => (
          <circle key={`p-${i}`} cx={pt.x} cy={pt.y} r={11}
            fill={T.cyan} fillOpacity={0.75} stroke={T.cyan} strokeWidth="1.5" />
        ))}
        {NEG_POINTS.map((pt, i) => (
          <circle key={`n-${i}`} cx={pt.x} cy={pt.y} r={11}
            fill={T.coral} fillOpacity={0.75} stroke={T.coral} strokeWidth="1.5" />
        ))}
        <text x={780} y={340} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="16" fontWeight="700" opacity={0.7}>+1</text>
        <text x={300} y={380} textAnchor="middle"
          fill={T.coral} fontFamily={T.sans} fontSize="16" fontWeight="700" opacity={0.7}>–1</text>
      </g>

      {/* Decision hyperplane */}
      {hpIn > 0 && (
        <line {...hp}
          stroke={hiHP ? "#FFDD44" : T.textPrimary}
          strokeWidth={hiHP ? 3.5 : 2.5}
          filter={hiHP ? "url(#svm-glow)" : undefined}
        />
      )}

      {/* Margin lines */}
      {marginsIn > 0 && (
        <>
          <line {...m1}
            stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="8 5"
            opacity={hiMargin ? 0.8 : 0.4}
            filter={hiMargin ? "url(#svm-glow-sm)" : undefined}
          />
          <line {...m2}
            stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="8 5"
            opacity={hiMargin ? 0.8 : 0.4}
            filter={hiMargin ? "url(#svm-glow-sm)" : undefined}
          />
        </>
      )}

      {/* Support vectors: glowing rings */}
      {svIn > 0 && SUPPORT_VECTORS.map((sv, i) => (
        <circle key={i}
          cx={sv.x} cy={sv.y} r={22 + 4 * (1 - svIn)}
          fill="none"
          stroke={hiSV ? T.amber : T.amber}
          strokeWidth={hiSV ? 3 : 2}
          opacity={svIn * (hiSV ? 1.0 : 0.75)}
          filter="url(#svm-glow-sm)"
        />
      ))}

      {/* Margin double-arrow and label */}
      {labelIn > 0 && (
        <g opacity={labelIn}>
          {/* Double arrow */}
          <line x1={arr1x} y1={arr1y} x2={arr2x} y2={arr2y}
            stroke={hiMargin ? T.amber : T.textSecondary} strokeWidth="2" />
          <polygon
            points={`${arr1x},${arr1y} ${arr1x - ny * 8 + nx * 10},${arr1y + nx * 8 + ny * 10} ${arr1x + ny * 8 + nx * 10},${arr1y - nx * 8 + ny * 10}`}
            fill={hiMargin ? T.amber : T.textSecondary}
          />
          <polygon
            points={`${arr2x},${arr2y} ${arr2x - ny * 8 - nx * 10},${arr2y + nx * 8 - ny * 10} ${arr2x + ny * 8 - nx * 10},${arr2y - nx * 8 - ny * 10}`}
            fill={hiMargin ? T.amber : T.textSecondary}
          />

          {/* MARGIN label */}
          <rect x={arrowMidX + 20} y={arrowMidY - 18} width={100} height={36} rx="8"
            fill={T.bgDeep} stroke={hiMargin ? T.amber : T.borderStrong} strokeWidth="1.5" />
          <text x={arrowMidX + 70} y={arrowMidY + 6} textAnchor="middle"
            fill={hiMargin ? T.amber : T.textSecondary} fontFamily={T.sans} fontSize="16" fontWeight="700">
            MARGIN
          </text>

          {/* MAX MARGIN badge */}
          <rect x={W / 2 - 100} y={628} width={200} height={40} rx="10"
            fill={T.bgDeep} stroke={T.amber} strokeWidth="1.5" />
          <text x={W / 2} y={654} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="17" fontWeight="700" letterSpacing="1">
            MAX MARGIN
          </text>
        </g>
      )}
    </svg>
  );
};
