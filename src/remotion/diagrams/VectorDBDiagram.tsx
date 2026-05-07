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

const CHUNKS = [
  { label: "Doc A: Neural nets...",   color: T.cyan   },
  { label: "Doc B: Attention is...",  color: T.violet },
  { label: "Doc C: RAG enables...",   color: T.amber  },
  { label: "Doc D: Embeddings map...",color: T.mint   },
  { label: "Doc E: Transformers...",  color: T.coral  },
  { label: "Doc F: Fine-tuning...",   color: T.cyan   },
];

const VS_X0 = 430, VS_Y0 = 90, VS_W = 580, VS_H = 500;

// Well-spread dot positions; A(0), B(1), D(3) are near QUERY_DOT, others are far
const DOT_POSITIONS = [
  { x: VS_X0 + VS_W * 0.14, y: VS_Y0 + VS_H * 0.24 },  // A — near query, top-left
  { x: VS_X0 + VS_W * 0.38, y: VS_Y0 + VS_H * 0.22 },  // B — near query, top-right
  { x: VS_X0 + VS_W * 0.80, y: VS_Y0 + VS_H * 0.15 },  // C — far, top-right corner
  { x: VS_X0 + VS_W * 0.18, y: VS_Y0 + VS_H * 0.58 },  // D — near query, below
  { x: VS_X0 + VS_W * 0.62, y: VS_Y0 + VS_H * 0.82 },  // E — far, bottom-center
  { x: VS_X0 + VS_W * 0.90, y: VS_Y0 + VS_H * 0.55 },  // F — far, right
];

// Query sits among A, B, D
const QUERY_DOT = { x: VS_X0 + VS_W * 0.26, y: VS_Y0 + VS_H * 0.40 };

// Indices of the 3 nearest to QUERY_DOT
const TOP_K = [0, 1, 3];

export const VectorDBDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const chunksIn  = p(frame, duration, 0.00, 0.20);
  const dotsInP   = p(frame, duration, 0.20, 0.45);
  const queryIn   = p(frame, duration, 0.45, 0.65);
  const simP      = p(frame, duration, 0.65, 0.85);
  const badgeIn   = p(frame, duration, 0.85, 1.00);

  const hiEmbed   = hi("EMBEDDING");
  const hiSim     = hi("COSINE SIMILARITY");
  const hiKNN     = hi("K-NN");

  const dotsVisible  = Math.round(dotsInP * CHUNKS.length);
  const simRadius    = simP * 160;
  const topHighlight = simP > 0.4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="vdb-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="vdb-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Left: Chunks ── */}
      <text x={180} y={62} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
        opacity={chunksIn}>
        DOCUMENT CHUNKS
      </text>
      {CHUNKS.map((chunk, i) => {
        const dotProgress = p(frame, duration, 0.20 + i * 0.04, 0.32 + i * 0.04);
        return (
          <g key={i} opacity={chunksIn}>
            <rect x={20} y={90 + i * 80} width={300} height={54} rx="10"
              fill={chunk.color} fillOpacity={hiEmbed ? 0.18 : 0.10}
              stroke={chunk.color} strokeWidth={hiEmbed ? 2 : 1}
            />
            <text x={40} y={123 + i * 80} textAnchor="start"
              fill={chunk.color} fontFamily={T.mono} fontSize="11">
              {chunk.label}
            </text>
            {dotProgress > 0 && i < dotsVisible && (
              <line
                x1={320} y1={117 + i * 80}
                x2={320 + (DOT_POSITIONS[i].x - 320) * dotProgress}
                y2={117 + i * 80 + (DOT_POSITIONS[i].y - (117 + i * 80)) * dotProgress}
                stroke={chunk.color} strokeWidth="1" opacity={0.3}
              />
            )}
          </g>
        );
      })}

      {/* Divider */}
      <line x1={400} y1={60} x2={400} y2={640}
        stroke={T.border} strokeWidth="1.5" opacity={chunksIn} />

      {/* ── Vector space axes ── */}
      <g opacity={chunksIn * 0.4}>
        <line x1={VS_X0} y1={VS_Y0 + VS_H} x2={VS_X0 + VS_W} y2={VS_Y0 + VS_H}
          stroke={T.border} strokeWidth="1.5" />
        <line x1={VS_X0} y1={VS_Y0} x2={VS_X0} y2={VS_Y0 + VS_H}
          stroke={T.border} strokeWidth="1.5" />
        <text x={VS_X0 + VS_W / 2} y={VS_Y0 - 16} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="2">
          VECTOR SPACE
        </text>
      </g>

      {/* Dots in vector space */}
      {CHUNKS.slice(0, dotsVisible).map((chunk, i) => {
        const pos = DOT_POSITIONS[i];
        const isTop  = TOP_K.includes(i);
        const glowing = topHighlight && isTop;
        return (
          <g key={`dot-${i}`}>
            <circle cx={pos.x} cy={pos.y} r={glowing ? 13 : 9}
              fill={chunk.color} opacity={0.75}
              filter={glowing || hiEmbed ? "url(#vdb-glow-sm)" : undefined}
            />
            <text x={pos.x + 16} y={pos.y + 5}
              fill={chunk.color} fontFamily={T.mono} fontSize="11">
              {String.fromCharCode(65 + i)}
            </text>
            {topHighlight && isTop && queryIn > 0 && (
              <line x1={pos.x} y1={pos.y} x2={QUERY_DOT.x} y2={QUERY_DOT.y}
                stroke={T.mint} strokeWidth="1.5" strokeDasharray="4 3" opacity={0.6}
              />
            )}
          </g>
        );
      })}

      {/* Query dot */}
      {queryIn > 0 && (
        <g opacity={queryIn}>
          {simP > 0 && (
            <circle cx={QUERY_DOT.x} cy={QUERY_DOT.y} r={simRadius}
              fill="none" stroke={hiSim || hiKNN ? T.amber : T.borderStrong}
              strokeWidth="1.5" strokeDasharray="6 4" opacity={0.45}
            />
          )}
          <circle cx={QUERY_DOT.x} cy={QUERY_DOT.y} r={14}
            fill={T.amber} opacity={0.9} filter="url(#vdb-glow)" />
          <text x={QUERY_DOT.x} y={QUERY_DOT.y - 22} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1">
            QUERY
          </text>
        </g>
      )}

      {/* Badge */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={VS_X0 + 20} y={VS_Y0 + VS_H + 18} width={VS_W - 40} height={48} rx="24"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#vdb-glow-sm)"
          />
          <text x={VS_X0 + VS_W / 2} y={VS_Y0 + VS_H + 49} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            TOP 3 RESULTS: A, B, D
          </text>
        </g>
      )}
    </svg>
  );
};
