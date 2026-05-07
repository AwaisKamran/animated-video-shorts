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

// Each chunk is a percentage of the row width
type Strategy = {
  id: string;
  label: string;
  color: string;
  sublabel: string;
  // chunks as ratios (must sum to ~1.0)
  chunks: number[];
  // chunk content tags shown inside (one per chunk)
  tags: string[];
};

const STRATEGIES: Strategy[] = [
  {
    id: "fixed",
    label: "FIXED-SIZE",
    color: T.cyan,
    sublabel: "200-char blocks · uniform",
    chunks: [0.2, 0.2, 0.2, 0.2, 0.2],
    tags: ["200ch", "200ch", "200ch", "200ch", "200ch"],
  },
  {
    id: "sentence",
    label: "SENTENCE",
    color: T.amber,
    sublabel: 'split at "." · varied length',
    chunks: [0.18, 0.32, 0.14, 0.22, 0.14],
    tags: ["s1", "s2", "s3", "s4", "s5"],
  },
  {
    id: "semantic",
    label: "SEMANTIC",
    color: T.mint,
    sublabel: "by topic cluster · meaning-aware",
    chunks: [0.38, 0.34, 0.28],
    tags: ["topic A", "topic B", "topic C"],
  },
];

const ROW_LABEL_X = 60;
const ROW_X = 240;
const ROW_W = 780;
const ROW_H = 70;
const ROW_GAP = 50;
const FIRST_ROW_Y = 200;

export const ChunkingDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const titleIn  = p(frame, duration, 0.00, 0.12);
  const docIn    = p(frame, duration, 0.10, 0.26);
  const fixedIn  = p(frame, duration, 0.26, 0.48);
  const sentIn   = p(frame, duration, 0.48, 0.70);
  const semIn    = p(frame, duration, 0.70, 0.92);
  const captionIn = p(frame, duration, 0.92, 1.00);

  const hiChunk = hi("CHUNK");
  const hiSem   = hi("SEMANTIC");
  const hiFixed = hi("FIXED-SIZE");

  const rowProgresses = [fixedIn, sentIn, semIn];
  const rowHighlights = [hiFixed, false, hiSem];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="chunk-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="chunk-glow-sm">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={50} textAnchor="middle"
        fill={hiChunk ? T.cyan : T.textDim}
        fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3"
        opacity={titleIn}
        filter={hiChunk ? "url(#chunk-glow-sm)" : undefined}>
        DOCUMENT CHUNKING STRATEGIES
      </text>
      <text x={W / 2} y={74} textAnchor="middle"
        fill={T.textDim}
        fontFamily={T.sans} fontSize="11" letterSpacing="1"
        opacity={titleIn * 0.55}>
        same document · three different ways to split
      </text>

      {/* Source document — single horizontal bar at top */}
      {docIn > 0 && (
        <g opacity={docIn}>
          <text x={ROW_LABEL_X} y={134} textAnchor="start"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            DOCUMENT
          </text>
          <rect x={ROW_X} y={114} width={ROW_W} height={36} rx="8"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
          />
          {/* Faint text inside doc bar */}
          <text x={ROW_X + 20} y={138} textAnchor="start"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="11" opacity={0.55}>
            transformer · attention · encoder · decoder · positional · self-attention · parallel · sequence
          </text>
          {/* Total length tick */}
          <text x={ROW_X + ROW_W + 12} y={138} textAnchor="start"
            fill={T.textDim} fontFamily={T.mono} fontSize="10" opacity={0.5}>
            ~1000ch
          </text>
        </g>
      )}

      {/* Three strategy rows */}
      {STRATEGIES.map((strat, si) => {
        const rowY = FIRST_ROW_Y + si * (ROW_H + ROW_GAP);
        const rowProg = rowProgresses[si];
        const isHi = rowHighlights[si] || hiChunk;
        if (rowProg <= 0) return null;

        // Compute chunk x-offsets
        let cumulative = 0;
        const gap = 6; // px gap between chunks

        return (
          <g key={strat.id} opacity={rowProg}>
            {/* Row label */}
            <text x={ROW_LABEL_X} y={rowY + 26} textAnchor="start"
              fill={strat.color} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2"
              filter={isHi ? "url(#chunk-glow-sm)" : undefined}>
              {strat.label}
            </text>
            <text x={ROW_LABEL_X} y={rowY + 46} textAnchor="start"
              fill={strat.color} fontFamily={T.sans} fontSize="9" opacity="0.65" letterSpacing="0.5">
              {strat.sublabel}
            </text>

            {/* Chunks */}
            {strat.chunks.map((ratio, ci) => {
              const chunkW = ratio * (ROW_W - gap * (strat.chunks.length - 1));
              const chunkX = ROW_X + cumulative + ci * gap;
              cumulative += chunkW;
              const chunkProg = Math.min(1, Math.max(0, (rowProg - ci * 0.10) * 3));
              if (chunkProg <= 0) return null;
              return (
                <g key={ci} opacity={chunkProg}>
                  <rect x={chunkX} y={rowY} width={chunkW} height={ROW_H} rx="10"
                    fill={strat.color} fillOpacity={isHi ? 0.22 : 0.13}
                    stroke={strat.color} strokeWidth={isHi ? 2.2 : 1.5}
                    filter={isHi ? "url(#chunk-glow-sm)" : undefined}
                  />
                  {/* Chunk index badge */}
                  <text x={chunkX + 12} y={rowY + 22} textAnchor="start"
                    fill={strat.color} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1.5"
                    opacity="0.85">
                    {ci + 1}
                  </text>
                  {/* Tag inside chunk */}
                  {chunkW > 80 && (
                    <text x={chunkX + chunkW / 2} y={rowY + ROW_H / 2 + 5} textAnchor="middle"
                      fill={strat.color} fontFamily={T.mono} fontSize="11" fontWeight="600">
                      {strat.tags[ci]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Chunk count summary on right */}
            <text x={ROW_X + ROW_W + 12} y={rowY + ROW_H / 2 + 5} textAnchor="start"
              fill={strat.color} fontFamily={T.mono} fontSize="11" opacity={0.7}>
              {strat.chunks.length}×
            </text>
          </g>
        );
      })}

      {/* Bottom caption */}
      {captionIn > 0 && (
        <g opacity={captionIn}>
          <rect x={W / 2 - 280} y={628} width={560} height={42} rx="21"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"
          />
          <text x={W / 2} y={655} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="2">
            CHUNKING SHAPES WHAT THE LLM CAN RECALL
          </text>
        </g>
      )}
    </svg>
  );
};
