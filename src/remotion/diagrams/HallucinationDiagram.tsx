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

export const HallucinationDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const questionIn  = p(frame, duration, 0.00, 0.18);
  const llmIn       = p(frame, duration, 0.18, 0.36);
  const wrongAnsIn  = p(frame, duration, 0.36, 0.52);
  const flagIn      = p(frame, duration, 0.52, 0.66);
  const ragBoxIn    = p(frame, duration, 0.66, 0.82);
  const correctIn   = p(frame, duration, 0.82, 1.00);

  const hiHall  = hi("HALLUCINATION");
  const hiGround = hi("GROUNDING");

  // Layout constants
  const LLM_X = 200, LLM_Y = 280, LLM_W = 220, LLM_H = 80;
  const KB_X = 510, KB_Y = 240, KB_W = 200, KB_H = 160;
  const RAG_X = 520, RAG_Y = 460, RAG_W = 480, RAG_H = 180;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="hall-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="hall-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="hall-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="hall-arr-coral" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.coral} />
        </marker>
        <marker id="hall-arr-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── Title ── */}
      <text x={W / 2} y={44} textAnchor="middle"
        fill={hiHall ? T.coral : T.textDim}
        fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
        filter={hiHall ? "url(#hall-glow-sm)" : undefined}
        opacity={questionIn}>
        LLM HALLUCINATION
      </text>

      {/* ── User question ── */}
      {questionIn > 0 && (
        <g opacity={questionIn}>
          <rect x={60} y={80} width={380} height={64} rx="14"
            fill={T.cyan} fillOpacity={0.12} stroke={T.cyan} strokeWidth="1.8"
          />
          <text x={80} y={104} fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            USER QUERY
          </text>
          <text x={80} y={128} fill={T.cyan} fontFamily={T.mono} fontSize="13" fontWeight="600">
            "What was Apple's revenue in Q3 2024?"
          </text>
        </g>
      )}

      {/* Arrow: query → LLM */}
      {llmIn > 0 && (
        <line x1={250} y1={144} x2={LLM_X + LLM_W / 2} y2={LLM_Y}
          stroke={T.textDim} strokeWidth="1.8" strokeDasharray="5 3"
          markerEnd="url(#hall-arr)" opacity={llmIn * 0.7}
        />
      )}

      {/* ── LLM box ── */}
      {llmIn > 0 && (
        <g opacity={llmIn}>
          <rect x={LLM_X} y={LLM_Y} width={LLM_W} height={LLM_H} rx="16"
            fill={T.violet} fillOpacity={0.14} stroke={T.violet} strokeWidth="1.8"
          />
          <text x={LLM_X + LLM_W / 2} y={LLM_Y + LLM_H / 2 - 6} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="1.5">
            LLM
          </text>
          <text x={LLM_X + LLM_W / 2} y={LLM_Y + LLM_H / 2 + 16} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="10" opacity={0.7}>
            (no grounding)
          </text>
        </g>
      )}

      {/* ── Empty knowledge base panel ── */}
      {llmIn > 0 && (
        <g opacity={llmIn}>
          <rect x={KB_X} y={KB_Y} width={KB_W} height={KB_H} rx="12"
            fill={T.bgDeep} stroke={T.border} strokeWidth="1.5"
          />
          <text x={KB_X + KB_W / 2} y={KB_Y + 26} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            KNOWLEDGE BASE
          </text>
          <text x={KB_X + KB_W / 2} y={KB_Y + 72} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11" opacity={0.45}>
            [ empty ]
          </text>
          <text x={KB_X + KB_W / 2} y={KB_Y + 96} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="10" fontWeight="700"
            opacity={hiGround ? 1 : 0.6} filter={hiGround ? "url(#hall-glow-sm)" : undefined}>
            NO GROUNDING
          </text>
          {/* Dashed line LLM → KB showing disconnect */}
          <line x1={LLM_X + LLM_W} y1={LLM_Y + LLM_H / 2}
            x2={KB_X} y2={KB_Y + KB_H / 2}
            stroke={T.coral} strokeWidth="1.5" strokeDasharray="4 4" opacity={0.35}
          />
        </g>
      )}

      {/* ── Wrong answer bubble ── */}
      {wrongAnsIn > 0 && (
        <g opacity={wrongAnsIn}>
          <rect x={LLM_X - 40} y={LLM_Y + LLM_H + 30} width={310} height={90} rx="14"
            fill={T.coral} fillOpacity={0.12}
            stroke={T.coral} strokeWidth={hiHall ? 2.5 : 1.8}
            filter={hiHall ? "url(#hall-glow)" : undefined}
          />
          <text x={LLM_X - 40 + 155} y={LLM_Y + LLM_H + 58} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="2">
            LLM RESPONSE (WRONG)
          </text>
          <text x={LLM_X - 40 + 155} y={LLM_Y + LLM_H + 84} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="16" fontWeight="700">
            "$94.2 billion"
          </text>
          <text x={LLM_X - 40 + 155} y={LLM_Y + LLM_H + 106} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="10" opacity={0.75}>
            (fabricated with high confidence)
          </text>
          {/* Arrow from LLM to answer */}
          <line x1={LLM_X + LLM_W / 2} y1={LLM_Y + LLM_H}
            x2={LLM_X + LLM_W / 2} y2={LLM_Y + LLM_H + 30}
            stroke={T.coral} strokeWidth="1.8" markerEnd="url(#hall-arr-coral)" opacity={0.8}
          />
        </g>
      )}

      {/* ── HALLUCINATED label (positioned to the right of the wrong-answer box) ── */}
      {flagIn > 0 && (
        <g opacity={flagIn}>
          <rect x={LLM_X + LLM_W + 60} y={LLM_Y + LLM_H + 64} width={200} height={38} rx="10"
            fill={T.coral} fillOpacity={0.18}
            stroke={T.coral} strokeWidth={hiHall ? 2.2 : 1.5}
            filter={hiHall ? "url(#hall-glow-sm)" : undefined}
          />
          <text x={LLM_X + LLM_W + 86} y={LLM_Y + LLM_H + 88} textAnchor="start"
            fill={T.coral} fontFamily={T.sans} fontSize="14" fontWeight="900">
            ⚠
          </text>
          <text x={LLM_X + LLM_W + 160} y={LLM_Y + LLM_H + 88} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1.5">
            HALLUCINATED
          </text>
        </g>
      )}

      {/* ── RAG comparison box ── */}
      {ragBoxIn > 0 && (
        <g opacity={ragBoxIn}>
          <rect x={RAG_X} y={RAG_Y} width={RAG_W} height={RAG_H} rx="16"
            fill={T.mint} fillOpacity={0.07} stroke={T.mint} strokeWidth="1.8"
          />
          <text x={RAG_X + RAG_W / 2} y={RAG_Y + 26} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="2">
            WITH RAG (GROUNDED)
          </text>
          {/* Divider */}
          <line x1={RAG_X + 20} y1={RAG_Y + 36} x2={RAG_X + RAG_W - 20} y2={RAG_Y + 36}
            stroke={T.mint} strokeWidth="1" opacity={0.3}
          />
          <text x={RAG_X + 20} y={RAG_Y + 62} fill={T.textDim} fontFamily={T.mono} fontSize="11">
            Query → Retrieve docs → Ground LLM
          </text>
          {correctIn > 0 && (
            <>
              <text x={RAG_X + 20} y={RAG_Y + 98} fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="2">
                ACTUAL ANSWER:
              </text>
              <text x={RAG_X + 20} y={RAG_Y + 126} fill={T.mint} fontFamily={T.mono} fontSize="18" fontWeight="700"
                filter="url(#hall-glow-sm)" opacity={correctIn}>
                "$85.8 billion"
              </text>
              <text x={RAG_X + 220} y={RAG_Y + 126} fill={T.mint} fontFamily={T.mono} fontSize="11" opacity={correctIn * 0.8}>
                (grounded, correct)
              </text>
              {/* Arrow from query to RAG box */}
              <line x1={440} y1={460} x2={RAG_X} y2={RAG_Y + RAG_H / 2}
                stroke={T.mint} strokeWidth="1.5" strokeDasharray="5 3"
                markerEnd="url(#hall-arr-mint)" opacity={ragBoxIn * 0.6}
              />
            </>
          )}
        </g>
      )}
    </svg>
  );
};
