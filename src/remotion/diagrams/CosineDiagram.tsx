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

// Coordinate space centered
const OX = 380, OY = 360;
const AXIS_LEN = 260;
const VEC_LEN = 210;

// Vector A direction (fixed, pointing upper-right)
const A_ANGLE_DEG = 38;
// Vector B initial direction (a bit apart)
const B_ANGLE_START_DEG = 80;
// Vector B final direction (nearly identical to A)
const B_ANGLE_END_DEG = 42;

function deg2rad(d: number) { return (d * Math.PI) / 180; }

function vecEnd(angle: number, len: number) {
  return {
    x: OX + Math.cos(deg2rad(angle)) * len,
    y: OY - Math.sin(deg2rad(angle)) * len,
  };
}

// Arc path for angle between two vectors
function arcPath(a1: number, a2: number, r: number) {
  const minA = Math.min(a1, a2);
  const maxA = Math.max(a1, a2);
  const sx = OX + Math.cos(deg2rad(minA)) * r;
  const sy = OY - Math.sin(deg2rad(minA)) * r;
  const ex = OX + Math.cos(deg2rad(maxA)) * r;
  const ey = OY - Math.sin(deg2rad(maxA)) * r;
  return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
}

// Similarity score gauge
const GAUGE_X = 660, GAUGE_Y = 500, GAUGE_W = 350, GAUGE_H = 28;

export const CosineDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const axesIn    = p(frame, duration, 0.00, 0.16);
  const vecAIn    = p(frame, duration, 0.16, 0.32);
  const vecBIn    = p(frame, duration, 0.32, 0.46);
  const arcIn     = p(frame, duration, 0.46, 0.60);
  const formulaIn = p(frame, duration, 0.60, 0.72);
  const gaugeIn   = p(frame, duration, 0.72, 0.86);
  const rotateP   = p(frame, duration, 0.86, 1.00);

  const hiCosine  = hi("COSINE");
  const hiSim     = hi("SIMILARITY");
  const hiAngle   = hi("ANGLE");

  // Animated vector B angle
  const bAngle = B_ANGLE_START_DEG + (B_ANGLE_END_DEG - B_ANGLE_START_DEG) * rotateP;
  const aAngle = A_ANGLE_DEG;

  // Animated similarity score
  const baseScore = 0.87;
  const finalScore = 0.99;
  const gaugeScore = gaugeIn > 0 && rotateP === 0
    ? baseScore * Math.min(1, gaugeIn * 1.5)
    : baseScore + (finalScore - baseScore) * rotateP;

  const aEnd = vecEnd(aAngle, VEC_LEN * vecAIn);
  const bEnd = vecEnd(bAngle, VEC_LEN * vecBIn);
  const aEndFull = vecEnd(aAngle, VEC_LEN);
  const bEndFull = vecEnd(bAngle, VEC_LEN);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cos-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cos-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cos-arr-cyan" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M0,0 L0,8 L10,4 z" fill={T.cyan} />
        </marker>
        <marker id="cos-arr-amber" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M0,0 L0,8 L10,4 z" fill={T.amber} />
        </marker>
      </defs>

      {/* ── Title ── */}
      <text x={W / 2} y={46} textAnchor="middle"
        fill={hiCosine ? T.cyan : T.textDim}
        fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
        opacity={axesIn}
        filter={hiCosine ? "url(#cos-glow-sm)" : undefined}>
        COSINE SIMILARITY
      </text>

      {/* ── Axes ── */}
      {axesIn > 0 && (
        <g opacity={axesIn}>
          {/* X axis */}
          <line x1={OX - AXIS_LEN} y1={OY} x2={OX + AXIS_LEN} y2={OY}
            stroke={T.border} strokeWidth="1.5" />
          {/* Y axis */}
          <line x1={OX} y1={OY + AXIS_LEN} x2={OX} y2={OY - AXIS_LEN}
            stroke={T.border} strokeWidth="1.5" />
          {/* Axis tips */}
          <polygon points={`${OX + AXIS_LEN},${OY} ${OX + AXIS_LEN - 10},${OY - 5} ${OX + AXIS_LEN - 10},${OY + 5}`}
            fill={T.border} />
          <polygon points={`${OX},${OY - AXIS_LEN} ${OX - 5},${OY - AXIS_LEN + 10} ${OX + 5},${OY - AXIS_LEN + 10}`}
            fill={T.border} />
          {/* Grid lines */}
          {[-120, -60, 60, 120].map(offset => (
            <React.Fragment key={offset}>
              <line x1={OX + offset} y1={OY - 6} x2={OX + offset} y2={OY + 6}
                stroke={T.border} strokeWidth="1" opacity={0.4} />
              <line x1={OX - 6} y1={OY + offset} x2={OX + 6} y2={OY + offset}
                stroke={T.border} strokeWidth="1" opacity={0.4} />
            </React.Fragment>
          ))}
          {/* Origin dot */}
          <circle cx={OX} cy={OY} r={5} fill={T.textDim} opacity={0.6} />
          <text x={OX + 8} y={OY + 18} fill={T.textDim} fontFamily={T.mono} fontSize="11">O</text>
        </g>
      )}

      {/* ── Vector A ── */}
      {vecAIn > 0 && (
        <g>
          <line x1={OX} y1={OY} x2={aEnd.x} y2={aEnd.y}
            stroke={T.cyan} strokeWidth="3"
            markerEnd={vecAIn > 0.9 ? "url(#cos-arr-cyan)" : undefined}
            filter={hiCosine ? "url(#cos-glow-sm)" : undefined}
          />
          {vecAIn > 0.8 && (
            <text x={aEndFull.x + 10} y={aEndFull.y - 8}
              fill={T.cyan} fontFamily={T.mono} fontSize="16" fontWeight="700"
              filter="url(#cos-glow-sm)">
              a
            </text>
          )}
        </g>
      )}

      {/* ── Vector B ── */}
      {vecBIn > 0 && (
        <g>
          <line x1={OX} y1={OY} x2={bEnd.x} y2={bEnd.y}
            stroke={T.amber} strokeWidth="3"
            markerEnd={vecBIn > 0.9 ? "url(#cos-arr-amber)" : undefined}
            filter={hiAngle ? "url(#cos-glow-sm)" : undefined}
          />
          {vecBIn > 0.8 && (
            <text x={bEndFull.x - 24} y={bEndFull.y - 10}
              fill={T.amber} fontFamily={T.mono} fontSize="16" fontWeight="700"
              filter="url(#cos-glow-sm)">
              b
            </text>
          )}
        </g>
      )}

      {/* ── Angle arc ── */}
      {arcIn > 0 && vecAIn > 0.8 && vecBIn > 0.8 && (
        <g opacity={arcIn}>
          <path d={arcPath(aAngle, bAngle, 70)}
            fill="none"
            stroke={hiAngle ? T.mint : T.textDim}
            strokeWidth={hiAngle ? 2.5 : 1.8}
            strokeDasharray="5 3"
            filter={hiAngle ? "url(#cos-glow-sm)" : undefined}
          />
          <text
            x={OX + Math.cos(deg2rad((aAngle + bAngle) / 2)) * 90}
            y={OY - Math.sin(deg2rad((aAngle + bAngle) / 2)) * 90}
            textAnchor="middle"
            fill={hiAngle ? T.mint : T.textDim}
            fontFamily={T.mono} fontSize="16" fontWeight="700"
            filter={hiAngle ? "url(#cos-glow-sm)" : undefined}>
            θ
          </text>
        </g>
      )}

      {/* ── Formula ── */}
      {formulaIn > 0 && (
        <g opacity={formulaIn}>
          <rect x={640} y={120} width={390} height={100} rx="14"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
          />
          <text x={835} y={158} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            COSINE SIMILARITY FORMULA
          </text>
          <text x={835} y={196} textAnchor="middle"
            fill={hiCosine ? T.cyan : T.textSecondary}
            fontFamily={T.mono} fontSize="18" fontWeight="700"
            filter={hiCosine ? "url(#cos-glow-sm)" : undefined}>
            cos(θ) = a·b / (|a||b|)
          </text>
        </g>
      )}

      {/* ── Similarity score gauge ── */}
      {gaugeIn > 0 && (
        <g opacity={gaugeIn}>
          <text x={GAUGE_X} y={GAUGE_Y - 18} fill={T.textDim}
            fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            SIMILARITY SCORE
          </text>
          {/* Background track */}
          <rect x={GAUGE_X} y={GAUGE_Y} width={GAUGE_W} height={GAUGE_H} rx="14"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
          />
          {/* Fill */}
          <rect x={GAUGE_X} y={GAUGE_Y} width={GAUGE_W * gaugeScore} height={GAUGE_H} rx="14"
            fill={hiSim ? T.mint : T.cyan} fillOpacity={0.7}
            filter={hiSim ? "url(#cos-glow-sm)" : undefined}
          />
          {/* Score text */}
          <text x={GAUGE_X + GAUGE_W + 16} y={GAUGE_Y + GAUGE_H / 2 + 5}
            fill={hiSim ? T.mint : T.cyan}
            fontFamily={T.mono} fontSize="18" fontWeight="800"
            filter={hiSim ? "url(#cos-glow-sm)" : undefined}>
            {gaugeScore.toFixed(2)}
          </text>
        </g>
      )}

      {/* ── Rotation label ── */}
      {rotateP > 0 && (
        <g opacity={rotateP}>
          <text x={GAUGE_X} y={GAUGE_Y + GAUGE_H + 28}
            fill={T.mint} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1.5">
            b rotating toward a → angle shrinks → similarity climbs
          </text>
          {rotateP > 0.8 && (
            <text x={GAUGE_X + GAUGE_W + 16} y={GAUGE_Y + GAUGE_H + 28}
              fill={T.mint} fontFamily={T.mono} fontSize="10" opacity={(rotateP - 0.8) * 5}
              filter="url(#cos-glow-sm)">
              identical direction!
            </text>
          )}
        </g>
      )}

      {/* ── Vector labels side panel ── */}
      {vecBIn > 0.5 && (
        <g opacity={Math.min(1, (vecBIn - 0.5) * 2)}>
          <text x={640} y={290} fill={T.cyan} fontFamily={T.mono} fontSize="12">
            a = [0.82, 0.57]  (cyan vector)
          </text>
          <text x={640} y={318} fill={T.amber} fontFamily={T.mono} fontSize="12">
            b = [0.37, 0.93]  (amber vector)
          </text>
        </g>
      )}
    </svg>
  );
};
