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

// Word list on the left
const WORDS = ["King", "Queen", "Man", "Woman", "Paris", "France"];

const LEFT_X = 100;
const LEFT_Y_START = 120;
const LEFT_Y_GAP = 82;

function wordY(i: number) { return LEFT_Y_START + i * LEFT_Y_GAP; }

// Vector space coordinates on the right (SVG space)
// Origin of the vector space
const VS_X0 = 480, VS_Y0 = 80, VS_W = 540, VS_H = 560;

const VECTOR_POSITIONS: Record<string, { x: number; y: number }> = {
  King:   { x: VS_X0 + VS_W * 0.82, y: VS_Y0 + VS_H * 0.14 },
  Queen:  { x: VS_X0 + VS_W * 0.62, y: VS_Y0 + VS_H * 0.26 },
  Man:    { x: VS_X0 + VS_W * 0.80, y: VS_Y0 + VS_H * 0.48 },
  Woman:  { x: VS_X0 + VS_W * 0.60, y: VS_Y0 + VS_H * 0.58 },
  Paris:  { x: VS_X0 + VS_W * 0.20, y: VS_Y0 + VS_H * 0.72 },
  France: { x: VS_X0 + VS_W * 0.15, y: VS_Y0 + VS_H * 0.88 },
};

const WORD_COLORS: Record<string, string> = {
  King: T.amber, Queen: T.amber, Man: T.cyan, Woman: T.cyan,
  Paris: T.violet, France: T.violet,
};

export const EmbeddingDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const wordsIn   = p(frame, duration, 0.00, 0.20);
  const linesIn   = p(frame, duration, 0.20, 0.55);  // lines draw word→dot one by one
  const analogyP  = p(frame, duration, 0.55, 0.82);
  const labelIn   = p(frame, duration, 0.82, 1.00);

  const hiEmbed  = hi("EMBEDDING");
  const hiVec    = hi("VECTOR");
  const hiAnalog = hi("ANALOGY");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="emb-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="emb-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="emb-arrow-cyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="emb-arrow-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── Left panel: word list ── */}
      <text x={LEFT_X + 50} y={LEFT_Y_START - 32} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="2"
        opacity={wordsIn}>
        WORDS
      </text>

      {WORDS.map((word, i) => {
        const color = WORD_COLORS[word];
        return (
          <g key={word} opacity={wordsIn}>
            <rect x={LEFT_X - 10} y={wordY(i) - 20} width={120} height={36} rx="8"
              fill={hiEmbed ? `${color}22` : T.nodeFill}
              stroke={color} strokeWidth={hiEmbed ? 2 : 1.5}
              filter={hiEmbed ? "url(#emb-glow-sm)" : undefined}
            />
            <text x={LEFT_X + 50} y={wordY(i) + 4} textAnchor="middle"
              fill={color} fontFamily={T.mono} fontSize="18" fontWeight="700">
              {word}
            </text>
          </g>
        );
      })}

      {/* ── Divider ── */}
      <line x1={460} y1={60} x2={460} y2={640}
        stroke={T.border} strokeWidth="1.5"
        opacity={wordsIn}
      />

      {/* ── Vector space axes ── */}
      {wordsIn > 0 && (
        <g opacity={wordsIn * 0.4}>
          <line x1={VS_X0} y1={VS_Y0 + VS_H} x2={VS_X0 + VS_W} y2={VS_Y0 + VS_H}
            stroke={T.border} strokeWidth="1.5" />
          <line x1={VS_X0} y1={VS_Y0} x2={VS_X0} y2={VS_Y0 + VS_H}
            stroke={T.border} strokeWidth="1.5" />
          <text x={VS_X0 + VS_W / 2} y={VS_Y0 - 14} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="2">
            VECTOR SPACE
          </text>
        </g>
      )}

      {/* ── Lines from words to dots ── */}
      {WORDS.map((word, i) => {
        const lineProgress = p(frame, duration, 0.20 + i * 0.055, 0.30 + i * 0.055);
        if (lineProgress <= 0) return null;
        const wY = wordY(i);
        const vp = VECTOR_POSITIONS[word];
        const endX = LEFT_X + 110 + (vp.x - LEFT_X - 110) * lineProgress;
        const endY = wY + (vp.y - wY) * lineProgress;
        return (
          <line key={`line-${word}`}
            x1={LEFT_X + 110} y1={wY}
            x2={endX} y2={endY}
            stroke={WORD_COLORS[word]} strokeWidth="1" opacity={0.3}
          />
        );
      })}

      {/* ── Vector space dots ── */}
      {WORDS.map((word, i) => {
        const dotAppear = p(frame, duration, 0.28 + i * 0.055, 0.38 + i * 0.055);
        if (dotAppear <= 0) return null;
        const vp = VECTOR_POSITIONS[word];
        const color = WORD_COLORS[word];
        return (
          <g key={`dot-${word}`} opacity={dotAppear}>
            <circle cx={vp.x} cy={vp.y} r={hiEmbed ? 12 : 9}
              fill={color} opacity={0.7}
              filter={hiEmbed || hiVec ? "url(#emb-glow-sm)" : undefined}
            />
            <text x={vp.x + (word === "King" ? 14 : -14)} y={vp.y + 5}
              textAnchor={word === "King" ? "start" : "end"}
              fill={color} fontFamily={T.mono} fontSize="13" fontWeight="600">
              {word}
            </text>
          </g>
        );
      })}

      {/* ── Analogy arrows: King - Man + Woman ≈ Queen ── */}
      {analogyP > 0 && (
        <g>
          {/* King → Man (minus, dim) */}
          {analogyP > 0.1 && (
            <line
              x1={VECTOR_POSITIONS.King.x} y1={VECTOR_POSITIONS.King.y}
              x2={VECTOR_POSITIONS.Man.x} y2={VECTOR_POSITIONS.Man.y}
              stroke={T.cyan} strokeWidth="2"
              strokeDasharray="5 3"
              markerEnd="url(#emb-arrow-cyan)"
              opacity={Math.min((analogyP - 0.1) / 0.3, 1)}
            />
          )}
          {/* + Woman arrow toward Queen */}
          {analogyP > 0.4 && (
            <line
              x1={VECTOR_POSITIONS.Man.x} y1={VECTOR_POSITIONS.Man.y}
              x2={VECTOR_POSITIONS.Queen.x} y2={VECTOR_POSITIONS.Queen.y}
              stroke={T.mint} strokeWidth="2.5"
              markerEnd="url(#emb-arrow-mint)"
              filter={hiAnalog ? "url(#emb-glow-sm)" : undefined}
              opacity={Math.min((analogyP - 0.4) / 0.4, 1)}
            />
          )}
          {/* Glow on Queen */}
          {analogyP > 0.75 && (
            <circle cx={VECTOR_POSITIONS.Queen.x} cy={VECTOR_POSITIONS.Queen.y} r={18}
              fill={T.mint} opacity={0.2 * Math.min((analogyP - 0.75) / 0.25, 1)}
              filter="url(#emb-glow)"
            />
          )}
        </g>
      )}

      {/* ── Label + equation ── */}
      {labelIn > 0 && (
        <g opacity={labelIn}>
          <text x={W / 2 + 40} y={650} textAnchor="middle"
            fill={hiAnalog ? T.mint : T.textDim}
            fontFamily={T.mono} fontSize="14" fontWeight="600">
            King − Man + Woman ≈ Queen
          </text>
          <text x={W / 2 + 40} y={672} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="1">
            VECTOR ANALOGY
          </text>
        </g>
      )}
    </svg>
  );
};
