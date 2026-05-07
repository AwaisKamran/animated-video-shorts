import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const BOX_W = 155, BOX_H = 72;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// Row 1 (y-center = 200)
const ROW1_Y = 200;
const R1 = [
  { id: "query",  label: "USER QUERY",  color: T.cyan,   x: 160 },
  { id: "embed",  label: "EMBEDDER",    color: T.violet, x: 430 },
  { id: "vdb",    label: "VECTOR DB",   color: T.amber,  x: 730 },
];

// Row 2 (y-center = 470)
const ROW2_Y = 470;
const R2 = [
  { id: "topk",   label: "TOP-K CHUNKS", color: T.mint,   x: 350 },
  { id: "llm",    label: "LLM",          color: T.violet, x: 640 },
  { id: "answer", label: "ANSWER",       color: T.cyan,   x: 920 },
];

function Box({ stage, cy, opacity }: {
  stage: { id: string; label: string; color: string; x: number };
  cy: number; opacity: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={stage.x - BOX_W / 2} y={cy - BOX_H / 2} width={BOX_W} height={BOX_H} rx="14"
        fill={stage.color} fillOpacity={0.14}
        stroke={stage.color} strokeWidth="1.8"
      />
      <text x={stage.x} y={cy + 6} textAnchor="middle"
        fill={stage.color} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1.2">
        {stage.label}
      </text>
    </g>
  );
}

function HArrow({ x1, x2, y, progress, color }: {
  x1: number; x2: number; y: number; progress: number; color: string;
}) {
  if (progress <= 0) return null;
  const tipX = x1 + (x2 - x1) * progress;
  return (
    <g>
      <line x1={x1} y1={y} x2={tipX} y2={y} stroke={color} strokeWidth="2" />
      <polygon
        points={`${tipX},${y} ${tipX - 10},${y - 5} ${tipX - 10},${y + 5}`}
        fill={color}
      />
    </g>
  );
}

export const RAGDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  void keyTerms;

  const boxesIn  = p(frame, duration, 0.00, 0.22);
  const embedP   = p(frame, duration, 0.22, 0.40);
  const vdbP     = p(frame, duration, 0.40, 0.56);
  const connP    = p(frame, duration, 0.56, 0.70);  // VDB → TopK curved arrow
  const topkP    = p(frame, duration, 0.70, 0.82);
  const llmP     = p(frame, duration, 0.82, 0.92);
  const answerP  = p(frame, duration, 0.92, 1.00);

  // Curved VDB→TopK path progress
  // Start: VDB bottom-center (730, ROW1_Y + BOX_H/2)
  // End: TopK top-center (350, ROW2_Y - BOX_H/2)
  const vdbBotX = 730, vdbBotY = ROW1_Y + BOX_H / 2;
  const topkTopX = 350, topkTopY = ROW2_Y - BOX_H / 2;
  // Cubic bezier control points for S-curve
  const cp1x = 730, cp1y = vdbBotY + 100;
  const cp2x = 350, cp2y = topkTopY - 100;

  // Sample point on cubic bezier at t
  function bezier(t: number) {
    const mt = 1 - t;
    return {
      x: mt*mt*mt*vdbBotX + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*topkTopX,
      y: mt*mt*mt*vdbBotY + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*topkTopY,
    };
  }

  const connDot = connP > 0 && connP < 1 ? bezier(connP) : null;

  // VDB dots scattered around the VDB box
  const vdbDots = [
    { cx: 680, cy: 282 }, { cx: 720, cy: 295 }, { cx: 760, cy: 276 },
    { cx: 695, cy: 308 }, { cx: 745, cy: 312 }, { cx: 775, cy: 300 },
  ];

  // Snippets below TopK
  const snippets = ["Doc 1: AI is...", "Doc 3: LLMs...", "Doc 7: Agents..."];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rag-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Row labels */}
      <text x={W / 2} y={48} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="3"
        opacity={boxesIn}>
        RETRIEVAL-AUGMENTED GENERATION
      </text>

      {/* Row 1 boxes */}
      {R1.map(s => <Box key={s.id} stage={s} cy={ROW1_Y} opacity={boxesIn} />)}

      {/* Row 1 horizontal arrows */}
      <HArrow x1={R1[0].x + BOX_W / 2} x2={R1[1].x - BOX_W / 2} y={ROW1_Y}
        progress={embedP} color={T.violet} />
      <HArrow x1={R1[1].x + BOX_W / 2} x2={R1[2].x - BOX_W / 2} y={ROW1_Y}
        progress={vdbP} color={T.amber} />

      {/* Vector label below Embedder */}
      {embedP > 0.5 && (
        <text x={R1[1].x} y={ROW1_Y + BOX_H / 2 + 26} textAnchor="middle"
          fill={T.violet} fontFamily={T.mono} fontSize="11"
          opacity={Math.min(1, (embedP - 0.5) * 2)}>
          [0.3, -0.2, 0.8, ...]
        </text>
      )}

      {/* VDB scatter dots */}
      {vdbP > 0 && vdbDots.map((dot, i) => (
        <circle key={i} cx={dot.cx} cy={dot.cy} r={5}
          fill={T.amber} opacity={vdbP * 0.65}
        />
      ))}

      {/* Curved VDB → TopK connector */}
      {connP > 0 && (
        <>
          <path
            d={`M ${vdbBotX} ${vdbBotY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${topkTopX} ${topkTopY}`}
            fill="none" stroke={T.mint} strokeWidth="2" strokeDasharray="8 4"
            opacity={0.7}
          />
          {connDot && (
            <circle cx={connDot.x} cy={connDot.y} r="8"
              fill={T.mint} opacity={0.9} filter="url(#rag-glow)" />
          )}
          <text x={(vdbBotX + topkTopX) / 2 + 50} y={(vdbBotY + topkTopY) / 2}
            textAnchor="middle" fill={T.mint} fontFamily={T.sans} fontSize="10"
            letterSpacing="1" opacity={connP}>
            RETRIEVE
          </text>
        </>
      )}

      {/* Row 2 boxes */}
      {R2.map(s => <Box key={s.id} stage={s} cy={ROW2_Y} opacity={boxesIn} />)}

      {/* Row 2 horizontal arrows */}
      <HArrow x1={R2[0].x + BOX_W / 2} x2={R2[1].x - BOX_W / 2} y={ROW2_Y}
        progress={llmP} color={T.violet} />
      <HArrow x1={R2[1].x + BOX_W / 2} x2={R2[2].x - BOX_W / 2} y={ROW2_Y}
        progress={answerP} color={T.cyan} />

      {/* Snippets below TopK */}
      {topkP > 0 && snippets.map((s, i) => (
        <text key={i} x={R2[0].x} y={ROW2_Y + BOX_H / 2 + 24 + i * 18} textAnchor="middle"
          fill={T.mint} fontFamily={T.mono} fontSize="10"
          opacity={Math.min(1, (topkP - i * 0.15) * 4)}>
          {s}
        </text>
      ))}

      {/* Answer glow */}
      {answerP > 0.5 && (
        <circle cx={R2[2].x} cy={ROW2_Y} r={BOX_H / 2 + 10}
          fill="none" stroke={T.cyan} strokeWidth="1.5"
          opacity={(answerP - 0.5) * 2 * 0.4}
          filter="url(#rag-glow)"
        />
      )}
    </svg>
  );
};
