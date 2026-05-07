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

const CANDIDATES = [
  { id: 0, label: "Doc 3: Transformers overview",  score: 0.92 },
  { id: 1, label: "Doc 7: Attention mechanism",    score: 0.91 },
  { id: 2, label: "Doc 1: Neural networks intro",  score: 0.88 },
  { id: 3, label: "Doc 9: BERT architecture",      score: 0.86 },
  { id: 4, label: "Doc 5: Self-attention deep",    score: 0.85 },
  { id: 5, label: "Doc 2: NLP fundamentals",       score: 0.82 },
  { id: 6, label: "Doc 12: GPT training",          score: 0.80 },
  { id: 7, label: "Doc 4: Embeddings intro",       score: 0.78 },
  { id: 8, label: "Doc 8: Fine-tuning LLMs",       score: 0.75 },
  { id: 9, label: "Doc 6: RAG pipelines",          score: 0.72 },
];

// Reranked top-3: note Doc 7 is now #1 (was #2), Doc 5 becomes #2 (was #5)
const TOP3 = [
  { origIdx: 1, label: "Doc 7: Attention mechanism",   crossScore: 0.97 },
  { origIdx: 4, label: "Doc 5: Self-attention deep",   crossScore: 0.85 },
  { origIdx: 0, label: "Doc 3: Transformers overview", crossScore: 0.72 },
];

const LEFT_X = 50, CAND_Y0 = 100, CAND_H = 44, CAND_W = 300;
const MID_X = 530, RERANK_Y = 300, RERANK_W = 160, RERANK_H = 80;
const RIGHT_X = 780, RES_Y0 = 200, RES_H = 60, RES_W = 250;

export const RerankingDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const candidatesIn  = p(frame, duration, 0.00, 0.28);
  const rerankerIn    = p(frame, duration, 0.28, 0.46);
  const computeP      = p(frame, duration, 0.46, 0.66);
  const top3In        = p(frame, duration, 0.66, 0.84);
  const fadeOut       = p(frame, duration, 0.84, 1.00);

  const hiRerank = hi("RERANK");
  const hiTopK   = hi("TOP-K");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rerank-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rerank-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="rerank-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="rerank-arr-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── Title ── */}
      <text x={W / 2} y={46} textAnchor="middle"
        fill={hiRerank ? T.violet : T.textDim}
        fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
        opacity={candidatesIn}
        filter={hiRerank ? "url(#rerank-glow-sm)" : undefined}>
        RERANKING PIPELINE
      </text>

      {/* ── Left: Candidates list ── */}
      {candidatesIn > 0 && (
        <>
          <text x={LEFT_X + CAND_W / 2} y={82} textAnchor="middle"
            fill={hiTopK ? T.amber : T.textDim}
            fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2"
            opacity={candidatesIn}
            filter={hiTopK ? "url(#rerank-glow-sm)" : undefined}>
            VECTOR SEARCH — TOP-10
          </text>
          {CANDIDATES.map((cand, i) => {
            const itemProg = Math.min(1, (candidatesIn - i * 0.08) * 4);
            if (itemProg <= 0) return null;
            // Fade non-top3 when results are shown
            const isTop3 = TOP3.some(t => t.origIdx === cand.id);
            const fadeOpacity = fadeOut > 0.4 && !isTop3
              ? 1 - (fadeOut - 0.4) * 2
              : 1;
            return (
              <g key={cand.id} opacity={Math.min(itemProg, fadeOpacity)}>
                <rect x={LEFT_X} y={CAND_Y0 + i * CAND_H} width={CAND_W} height={CAND_H - 4} rx="8"
                  fill={T.bgDeep}
                  stroke={isTop3 && top3In > 0 ? T.mint : T.border}
                  strokeWidth={isTop3 && top3In > 0 ? 1.8 : 1}
                />
                <text x={LEFT_X + 12} y={CAND_Y0 + i * CAND_H + 26}
                  fill={T.textSecondary} fontFamily={T.mono} fontSize="10">
                  {i + 1}. {cand.label}
                </text>
                <text x={LEFT_X + CAND_W - 12} y={CAND_Y0 + i * CAND_H + 26}
                  textAnchor="end"
                  fill={T.amber} fontFamily={T.mono} fontSize="10" fontWeight="700">
                  {cand.score.toFixed(2)}
                </text>
                {/* Arrow toward reranker during compute phase */}
                {computeP > 0 && computeP < 1 && (
                  <line
                    x1={LEFT_X + CAND_W}
                    y1={CAND_Y0 + i * CAND_H + (CAND_H - 4) / 2}
                    x2={LEFT_X + CAND_W + (MID_X - RERANK_W / 2 - LEFT_X - CAND_W) * Math.min(1, computeP * 2)}
                    y2={CAND_Y0 + i * CAND_H + (CAND_H - 4) / 2 + (RERANK_Y + RERANK_H / 2 - (CAND_Y0 + i * CAND_H + (CAND_H - 4) / 2)) * Math.min(1, computeP * 2)}
                    stroke={T.violet} strokeWidth="1" opacity={0.25}
                  />
                )}
              </g>
            );
          })}
        </>
      )}

      {/* ── Middle: Reranker box ── */}
      {rerankerIn > 0 && (
        <g opacity={rerankerIn}>
          <rect x={MID_X - RERANK_W / 2} y={RERANK_Y} width={RERANK_W} height={RERANK_H} rx="16"
            fill={T.violet} fillOpacity={hiRerank ? 0.22 : 0.14}
            stroke={T.violet} strokeWidth={hiRerank ? 2.5 : 1.8}
            filter={hiRerank ? "url(#rerank-glow)" : undefined}
          />
          <text x={MID_X} y={RERANK_Y + RERANK_H / 2 - 8} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1.5">
            RERANKER
          </text>
          <text x={MID_X} y={RERANK_Y + RERANK_H / 2 + 14} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="9" opacity={0.7}>
            cross-encoder model
          </text>
          {/* Computing pulse */}
          {computeP > 0 && computeP < 0.9 && (
            <circle cx={MID_X} cy={RERANK_Y + RERANK_H / 2} r={42 + computeP * 12}
              fill="none" stroke={T.violet} strokeWidth="1.5"
              opacity={(1 - computeP) * 0.4}
            />
          )}
        </g>
      )}

      {/* ── Right: Top-3 results ── */}
      {top3In > 0 && (
        <>
          <text x={RIGHT_X + RES_W / 2} y={RES_Y0 - 18} textAnchor="middle"
            fill={hiTopK ? T.mint : T.textDim}
            fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2"
            opacity={top3In}
            filter={hiTopK ? "url(#rerank-glow-sm)" : undefined}>
            RERANKED TOP-3
          </text>
          {TOP3.map((res, i) => {
            const itemProg = Math.min(1, (top3In - i * 0.2) * 3);
            if (itemProg <= 0) return null;
            return (
              <g key={i} opacity={itemProg}>
                <rect x={RIGHT_X} y={RES_Y0 + i * (RES_H + 12)} width={RES_W} height={RES_H} rx="12"
                  fill={T.mint} fillOpacity={0.12}
                  stroke={T.mint} strokeWidth="2"
                  filter="url(#rerank-glow-sm)"
                />
                <text x={RIGHT_X + 14} y={RES_Y0 + i * (RES_H + 12) + 22}
                  fill={T.mint} fontFamily={T.sans} fontSize="11" fontWeight="800">
                  #{i + 1}
                </text>
                <text x={RIGHT_X + 44} y={RES_Y0 + i * (RES_H + 12) + 22}
                  fill={T.textSecondary} fontFamily={T.mono} fontSize="10">
                  {res.label}
                </text>
                <text x={RIGHT_X + 14} y={RES_Y0 + i * (RES_H + 12) + 44}
                  fill={T.textDim} fontFamily={T.mono} fontSize="9" opacity={0.7}>
                  cross-score:
                </text>
                <text x={RIGHT_X + 96} y={RES_Y0 + i * (RES_H + 12) + 44}
                  fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700">
                  {res.crossScore.toFixed(2)}
                </text>
                {/* Arrow from reranker to result */}
                <line
                  x1={MID_X + RERANK_W / 2}
                  y1={RERANK_Y + RERANK_H / 2}
                  x2={RIGHT_X}
                  y2={RES_Y0 + i * (RES_H + 12) + RES_H / 2}
                  stroke={T.mint} strokeWidth="1.5"
                  markerEnd="url(#rerank-arr-mint)"
                  opacity={0.55}
                />
                {/* "NEW #1" badge for the reordered entry */}
                {i === 0 && res.origIdx !== 0 && (
                  <g>
                    <rect x={RIGHT_X + RES_W - 72} y={RES_Y0 + i * (RES_H + 12) + 6} width={64} height={22} rx="6"
                      fill={T.amber} fillOpacity={0.2} stroke={T.amber} strokeWidth="1.5"
                    />
                    <text x={RIGHT_X + RES_W - 40} y={RES_Y0 + i * (RES_H + 12) + 22} textAnchor="middle"
                      fill={T.amber} fontFamily={T.sans} fontSize="9" fontWeight="800">
                      REORDERED
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
};
