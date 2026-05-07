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

const TOKENS = ["The", "cat", "sat", "mat"];
const TOKEN_W = 100, TOKEN_H = 42;
const TOKEN_Y_TOP = 90;   // Query row (top)
const TOKEN_Y_BOT = 230;  // Key/Value row (bottom)
const TOKEN_X_START = 140;
const TOKEN_GAP = 160;

// Attention scores (row = query token, col = key token)
// Higher = more attention
const ATTN_SCORES = [
  [0.7, 0.2, 0.05, 0.05],  // "The" attends mostly to itself
  [0.1, 0.5, 0.3,  0.1 ],  // "cat" attends to "sat" and "mat"
  [0.05, 0.35, 0.45, 0.15], // "sat" attends to "cat" and itself
  [0.05, 0.25, 0.25, 0.45], // "mat" attends to itself
];

function tokenX(i: number) { return TOKEN_X_START + i * TOKEN_GAP; }

// Heat-map in bottom-right corner
const HM_X = 720, HM_Y = 420, HM_CELL = 42;

export const AttentionDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const tokensIn  = p(frame, duration, 0.00, 0.20);
  const queryOut  = p(frame, duration, 0.20, 0.38);
  const scoresIn  = p(frame, duration, 0.38, 0.62);
  const outputIn  = p(frame, duration, 0.62, 0.80);
  const heatmapIn = p(frame, duration, 0.80, 1.00);

  const hiAttn  = hi("ATTENTION");
  const hiQuery = hi("QUERY");
  const hiKey   = hi("KEY");
  const hiValue = hi("VALUE");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="att-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="att-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Section labels ── */}
      <g opacity={tokensIn}>
        <text x={TOKEN_X_START - 24} y={TOKEN_Y_TOP + TOKEN_H / 2 + 6} textAnchor="end"
          fill={hiQuery ? T.violet : T.textDim}
          fontFamily={T.mono} fontSize="13" fontWeight="700">Q</text>
        <text x={TOKEN_X_START - 24} y={TOKEN_Y_BOT + TOKEN_H / 2 + 6} textAnchor="end"
          fill={hiKey ? T.violet : T.textDim}
          fontFamily={T.mono} fontSize="13" fontWeight="700">K/V</text>
      </g>

      {/* ── Token boxes (top row = Q) ── */}
      {TOKENS.map((tok, i) => {
        const cx = tokenX(i);
        const isCat = tok === "cat";
        return (
          <g key={`q-${i}`} opacity={tokensIn}>
            <rect x={cx - TOKEN_W / 2} y={TOKEN_Y_TOP} width={TOKEN_W} height={TOKEN_H} rx="10"
              fill={hiQuery ? `${T.violet}33` : T.nodeFill}
              stroke={hiQuery ? T.violet : T.nodeBorder}
              strokeWidth={hiQuery ? 2 : 1.5}
              filter={isCat && hiAttn ? "url(#att-glow-sm)" : undefined}
            />
            <text x={cx} y={TOKEN_Y_TOP + TOKEN_H / 2 + 6} textAnchor="middle"
              fill={hiQuery ? T.violet : T.textPrimary}
              fontFamily={T.mono} fontSize="17" fontWeight="600">
              {tok}
            </text>
          </g>
        );
      })}

      {/* ── Token boxes (bottom row = K/V) ── */}
      {TOKENS.map((tok, i) => {
        const cx = tokenX(i);
        return (
          <g key={`kv-${i}`} opacity={tokensIn}>
            <rect x={cx - TOKEN_W / 2} y={TOKEN_Y_BOT} width={TOKEN_W} height={TOKEN_H} rx="10"
              fill={hiKey || hiValue ? `${T.amber}22` : T.nodeFill}
              stroke={hiKey || hiValue ? T.amber : T.nodeBorder}
              strokeWidth={hiKey || hiValue ? 2 : 1.5}
            />
            <text x={cx} y={TOKEN_Y_BOT + TOKEN_H / 2 + 6} textAnchor="middle"
              fill={hiValue ? T.amber : T.textPrimary}
              fontFamily={T.mono} fontSize="17" fontWeight="600">
              {tok}
            </text>
          </g>
        );
      })}

      {/* ── Query arrows (upward from top row) ── */}
      {queryOut > 0 && TOKENS.map((_, i) => {
        const cx = tokenX(i);
        const arrowY = TOKEN_Y_TOP - 10;
        const tipY = Math.max(TOKEN_Y_TOP - 10 - 40 * queryOut, TOKEN_Y_TOP - 50);
        return (
          <line key={`qa-${i}`} x1={cx} y1={TOKEN_Y_TOP} x2={cx} y2={tipY}
            stroke={T.violet} strokeWidth="1.5" opacity={queryOut * 0.7}
            strokeDasharray="4 3"
          />
        );
      })}

      {/* ── Attention score connections (all token pairs from top Q → bottom K) ── */}
      {scoresIn > 0 && TOKENS.map((_, qi) =>
        TOKENS.map((_, ki) => {
          const score = ATTN_SCORES[qi][ki];
          if (score < 0.1) return null;
          const qx = tokenX(qi);
          const kx = tokenX(ki);
          const strokeW = 0.5 + score * 6;
          const isHighAttn = score > 0.3;
          return (
            <line key={`attn-${qi}-${ki}`}
              x1={qx} y1={TOKEN_Y_TOP + TOKEN_H}
              x2={kx} y2={TOKEN_Y_BOT}
              stroke={hiAttn && isHighAttn ? "#00EFFF" : T.cyan}
              strokeWidth={strokeW}
              opacity={scoresIn * (0.2 + score * 0.8)}
              filter={isHighAttn && hiAttn ? "url(#att-glow-sm)" : undefined}
            />
          );
        })
      )}

      {/* ── Output boxes above Q row ── */}
      {outputIn > 0 && TOKENS.map((tok, i) => {
        const cx = tokenX(i);
        const isBright = tok === "cat" || tok === "sat";
        return (
          <g key={`out-${i}`} opacity={outputIn}>
            <rect x={cx - TOKEN_W / 2 + 8} y={22} width={TOKEN_W - 16} height={TOKEN_H - 4} rx="8"
              fill={isBright ? `${T.mint}33` : T.nodeFill}
              stroke={isBright ? T.mint : T.nodeBorder}
              strokeWidth={isBright ? 2 : 1.2}
              filter={isBright && i === 1 ? "url(#att-glow-sm)" : undefined}
            />
            <text x={cx} y={22 + (TOKEN_H - 4) / 2 + 5} textAnchor="middle"
              fill={isBright ? T.mint : T.textDim}
              fontFamily={T.mono} fontSize="12" fontWeight="600">
              {tok}′
            </text>
          </g>
        );
      })}
      {outputIn > 0 && (
        <text x={TOKEN_X_START + TOKEN_GAP * 1.5} y={16} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="1"
          opacity={outputIn}>
          OUTPUT
        </text>
      )}

      {/* ── Attention heat-map ── */}
      {heatmapIn > 0 && (
        <g opacity={heatmapIn}>
          <text x={HM_X + HM_CELL * 2} y={HM_Y - 16} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="600" letterSpacing="1">
            ATTENTION MATRIX
          </text>
          {ATTN_SCORES.map((row, ri) =>
            row.map((score, ci) => (
              <rect key={`hm-${ri}-${ci}`}
                x={HM_X + ci * HM_CELL} y={HM_Y + ri * HM_CELL}
                width={HM_CELL - 2} height={HM_CELL - 2}
                rx="3"
                fill={T.violet}
                opacity={score * 0.9}
              />
            ))
          )}
          {/* Axis labels */}
          {TOKENS.map((tok, i) => (
            <React.Fragment key={`hml-${i}`}>
              <text x={HM_X + i * HM_CELL + HM_CELL / 2} y={HM_Y - 4} textAnchor="middle"
                fill={T.textDim} fontFamily={T.mono} fontSize="10">{tok}</text>
              <text x={HM_X - 6} y={HM_Y + i * HM_CELL + HM_CELL / 2 + 4} textAnchor="end"
                fill={T.textDim} fontFamily={T.mono} fontSize="10">{tok}</text>
            </React.Fragment>
          ))}
        </g>
      )}
    </svg>
  );
};
