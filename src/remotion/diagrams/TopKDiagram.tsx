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

// Vector space bounds
const VS_X = 60, VS_Y = 80, VS_W = 580, VS_H = 540;

// Query vector position (center-ish)
const QX = VS_X + VS_W * 0.42, QY = VS_Y + VS_H * 0.48;

// K=5 nearest neighbors
const K = 5;

// All 20 points: first 5 are the K nearest
const POINTS = [
  { x: VS_X + VS_W * 0.52, y: VS_Y + VS_H * 0.36 }, // 0 — near
  { x: VS_X + VS_W * 0.30, y: VS_Y + VS_H * 0.38 }, // 1 — near
  { x: VS_X + VS_W * 0.54, y: VS_Y + VS_H * 0.60 }, // 2 — near
  { x: VS_X + VS_W * 0.28, y: VS_Y + VS_H * 0.60 }, // 3 — near
  { x: VS_X + VS_W * 0.42, y: VS_Y + VS_H * 0.28 }, // 4 — near
  { x: VS_X + VS_W * 0.78, y: VS_Y + VS_H * 0.20 }, // 5 — far
  { x: VS_X + VS_W * 0.14, y: VS_Y + VS_H * 0.16 }, // 6 — far
  { x: VS_X + VS_W * 0.86, y: VS_Y + VS_H * 0.50 }, // 7 — far
  { x: VS_X + VS_W * 0.10, y: VS_Y + VS_H * 0.52 }, // 8 — far
  { x: VS_X + VS_W * 0.68, y: VS_Y + VS_H * 0.80 }, // 9 — far
  { x: VS_X + VS_W * 0.20, y: VS_Y + VS_H * 0.82 }, // 10 — far
  { x: VS_X + VS_W * 0.90, y: VS_Y + VS_H * 0.28 }, // 11 — far
  { x: VS_X + VS_W * 0.60, y: VS_Y + VS_H * 0.14 }, // 12 — far
  { x: VS_X + VS_W * 0.06, y: VS_Y + VS_H * 0.34 }, // 13 — far
  { x: VS_X + VS_W * 0.76, y: VS_Y + VS_H * 0.66 }, // 14 — far
  { x: VS_X + VS_W * 0.36, y: VS_Y + VS_H * 0.88 }, // 15 — far
  { x: VS_X + VS_W * 0.84, y: VS_Y + VS_H * 0.86 }, // 16 — far
  { x: VS_X + VS_W * 0.46, y: VS_Y + VS_H * 0.08 }, // 17 — far
  { x: VS_X + VS_W * 0.08, y: VS_Y + VS_H * 0.70 }, // 18 — far
  { x: VS_X + VS_W * 0.62, y: VS_Y + VS_H * 0.96 }, // 19 — far
];

// Max radius needed to capture all K nearest
const CAPTURE_RADIUS = 140;

function dist(px: number, py: number) {
  return Math.sqrt((px - QX) ** 2 + (py - QY) ** 2);
}

const POINT_LABELS = ["V1", "V2", "V3", "V4", "V5", "P6", "P7", "P8", "P9", "P10",
  "P11", "P12", "P13", "P14", "P15", "P16", "P17", "P18", "P19", "P20"];

export const TopKDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const pointsIn   = p(frame, duration, 0.00, 0.24);
  const queryIn    = p(frame, duration, 0.24, 0.40);
  const circleP    = p(frame, duration, 0.40, 0.64);
  const captureIn  = p(frame, duration, 0.64, 0.80);
  const listIn     = p(frame, duration, 0.80, 1.00);

  const hiTopK    = hi("TOP-K");
  const hiNearest = hi("NEAREST");
  const hiK5      = hi("K=5");

  const currentRadius = circleP * CAPTURE_RADIUS;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="topk-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="topk-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Title ── */}
      <text x={VS_X + VS_W / 2} y={46} textAnchor="middle"
        fill={hiTopK ? T.violet : T.textDim}
        fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
        opacity={pointsIn}
        filter={hiTopK ? "url(#topk-glow-sm)" : undefined}>
        K-NEAREST NEIGHBORS RETRIEVAL
      </text>

      {/* ── Vector space border ── */}
      {pointsIn > 0 && (
        <g opacity={pointsIn * 0.5}>
          <rect x={VS_X} y={VS_Y} width={VS_W} height={VS_H} rx="16"
            fill="none" stroke={T.border} strokeWidth="1.5"
          />
          <text x={VS_X + VS_W / 2} y={VS_Y - 10} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            VECTOR SPACE
          </text>
        </g>
      )}

      {/* ── Points ── */}
      {POINTS.map((pt, i) => {
        const ptProg = Math.min(1, (pointsIn - i * 0.04) * 4);
        if (ptProg <= 0) return null;
        const isNearest = i < K;
        const d = dist(pt.x, pt.y);
        const captured = captureIn > 0 && d <= CAPTURE_RADIUS;
        const fadeOpacity = captureIn > 0.5 && !captured
          ? Math.max(0.15, 1 - (captureIn - 0.5) * 2)
          : 1;

        return (
          <g key={i} opacity={ptProg * fadeOpacity}>
            <circle cx={pt.x} cy={pt.y}
              r={captured ? 10 : 7}
              fill={captured ? T.mint : T.textDim}
              opacity={captured ? 0.9 : 0.55}
              filter={captured ? "url(#topk-glow-sm)" : undefined}
            />
            <text x={pt.x + 12} y={pt.y + 5}
              fill={captured ? T.mint : T.textDim}
              fontFamily={T.mono} fontSize="9"
              opacity={captured ? 0.85 : 0.4}>
              {POINT_LABELS[i]}
            </text>
            {/* Dashed line from nearest to query */}
            {captured && captureIn > 0 && (
              <line x1={pt.x} y1={pt.y} x2={QX} y2={QY}
                stroke={T.mint} strokeWidth="1.5" strokeDasharray="5 3"
                opacity={0.5 * Math.min(1, captureIn * 2)}
              />
            )}
          </g>
        );
      })}

      {/* ── Expanding circle ── */}
      {circleP > 0 && (
        <circle cx={QX} cy={QY} r={currentRadius}
          fill="none"
          stroke={hiNearest ? T.violet : T.borderStrong}
          strokeWidth={hiNearest ? 2.2 : 1.8}
          strokeDasharray="8 4"
          opacity={circleP * 0.65}
          filter={hiNearest ? "url(#topk-glow-sm)" : undefined}
        />
      )}

      {/* ── Query star ── */}
      {queryIn > 0 && (
        <g opacity={queryIn}>
          {/* Star shape using polygon */}
          {[0, 1, 2, 3, 4].map(i => {
            const outerR = 18, innerR = 9;
            const angle = (i * 72 - 90) * Math.PI / 180;
            const innerAngle = ((i * 72 + 36) - 90) * Math.PI / 180;
            const x1 = QX + Math.cos(angle) * outerR;
            const y1 = QY + Math.sin(angle) * outerR;
            const x2 = QX + Math.cos(innerAngle) * innerR;
            const y2 = QY + Math.sin(innerAngle) * innerR;
            return (
              <React.Fragment key={i}>
                {i === 0 && (
                  <polygon
                    points={[0, 1, 2, 3, 4].flatMap(j => {
                      const oA = (j * 72 - 90) * Math.PI / 180;
                      const iA = ((j * 72 + 36) - 90) * Math.PI / 180;
                      return [
                        `${QX + Math.cos(oA) * outerR},${QY + Math.sin(oA) * outerR}`,
                        `${QX + Math.cos(iA) * innerR},${QY + Math.sin(iA) * innerR}`,
                      ];
                    }).join(" ")}
                    fill={T.violet}
                    filter="url(#topk-glow)"
                    opacity={0.95}
                  />
                )}
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="none" />
              </React.Fragment>
            );
          })}
          <text x={QX} y={QY - 28} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1">
            QUERY
          </text>
        </g>
      )}

      {/* ── K=5 label ── */}
      {captureIn > 0 && (
        <g opacity={Math.min(1, captureIn * 2)}>
          <rect x={VS_X + VS_W - 90} y={VS_Y + 16} width={72} height={36} rx="10"
            fill={T.violet} fillOpacity={0.18}
            stroke={T.violet} strokeWidth={hiK5 ? 2.2 : 1.5}
            filter={hiK5 ? "url(#topk-glow-sm)" : undefined}
          />
          <text x={VS_X + VS_W - 54} y={VS_Y + 40} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800"
            filter={hiK5 ? "url(#topk-glow-sm)" : undefined}>
            K = 5
          </text>
        </g>
      )}

      {/* ── Results list ── */}
      {listIn > 0 && (
        <g opacity={listIn}>
          <text x={W - 240} y={80} textAnchor="middle"
            fill={hiTopK ? T.mint : T.textDim}
            fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2"
            filter={hiTopK ? "url(#topk-glow-sm)" : undefined}>
            TOP-K RESULTS
          </text>
          <rect x={W - 350} y={92} width={300} height={320} rx="14"
            fill={T.bgDeep} stroke={T.mint} strokeWidth="1.5"
          />
          {POINTS.slice(0, K).map((_, i) => {
            const d = dist(POINTS[i].x, POINTS[i].y);
            const simScore = (1 - d / 400).toFixed(2);
            const itemProg = Math.min(1, (listIn - i * 0.15) * 4);
            if (itemProg <= 0) return null;
            return (
              <g key={i} opacity={itemProg}>
                <text x={W - 330} y={130 + i * 54}
                  fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700">
                  #{i + 1} — {POINT_LABELS[i]}
                </text>
                <text x={W - 330} y={150 + i * 54}
                  fill={T.textDim} fontFamily={T.mono} fontSize="10" opacity={0.7}>
                  sim: {simScore}  dist: {Math.round(d)}px
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};
