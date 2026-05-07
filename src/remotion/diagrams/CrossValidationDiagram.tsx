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

const N_FOLDS = 5;
const SEG_W = 110;
const SEG_H = 44;
const ROW_GAP = 62;
const LEFT_X = 150;
const TOP_Y = 90;
const SCORES = [0.84, 0.88, 0.85, 0.91, 0.87];

export const CrossValidationDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const hiKFold = hi("K-FOLD");
  const hiVal   = hi("VALIDATION");

  const row0In   = p(frame, duration, 0.00, 0.20);
  const rowsIn   = p(frame, duration, 0.20, 0.70);
  const scoresIn = p(frame, duration, 0.70, 0.85);
  const avgIn    = p(frame, duration, 0.85, 1.00);

  // How many additional rows (1–4) are visible
  const visibleRows = 1 + Math.floor(rowsIn * 4.0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cv-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Column header */}
      <text x={LEFT_X - 60} y={TOP_Y - 18} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1.5"
        opacity={row0In}>
        FOLD
      </text>
      {Array.from({ length: N_FOLDS }).map((_, si) => (
        <text key={si} x={LEFT_X + si * SEG_W + SEG_W / 2} y={TOP_Y - 18} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11"
          opacity={row0In}>
          {si + 1}
        </text>
      ))}

      {/* Score bar header */}
      <text x={LEFT_X + N_FOLDS * SEG_W + 100} y={TOP_Y - 18} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1.5"
        opacity={row0In}>
        SCORE
      </text>

      {Array.from({ length: N_FOLDS }).map((_, fi) => {
        const rowY = TOP_Y + fi * ROW_GAP;
        const rowOpacity = fi === 0 ? row0In : fi < visibleRows ? Math.min(1, (rowsIn * 4 - fi + 1)) : 0;
        if (rowOpacity <= 0) return null;

        return (
          <g key={fi} opacity={rowOpacity}>
            {/* Fold label */}
            <text x={LEFT_X - 60} y={rowY + SEG_H / 2 + 5} textAnchor="middle"
              fill={hiKFold ? T.cyan : T.textSecondary}
              fontFamily={T.sans} fontSize="13" fontWeight="700"
              filter={hiKFold ? "url(#cv-glow)" : undefined}>
              Fold {fi + 1}
            </text>

            {/* Segments */}
            {Array.from({ length: N_FOLDS }).map((_, si) => {
              const isVal = si === fi;
              const isHiVal = isVal && hiVal;
              return (
                <rect key={si}
                  x={LEFT_X + si * SEG_W + 2}
                  y={rowY}
                  width={SEG_W - 4}
                  height={SEG_H}
                  rx="6"
                  fill={isVal ? T.amber : T.cyan}
                  fillOpacity={isHiVal ? 0.55 : isVal ? 0.35 : 0.18}
                  stroke={isVal ? T.amber : T.cyan}
                  strokeWidth={isHiVal ? 2.5 : 1}
                  strokeOpacity={isVal ? 0.9 : 0.4}
                  filter={isHiVal ? "url(#cv-glow)" : undefined}
                />
              );
            })}

            {/* Val label inside amber segment */}
            <text x={LEFT_X + fi * SEG_W + SEG_W / 2} y={rowY + SEG_H / 2 + 5} textAnchor="middle"
              fill={hiVal ? T.amber : T.textPrimary} fontFamily={T.sans} fontSize="11" fontWeight="700">
              VAL
            </text>

            {/* Score bar */}
            {scoresIn > 0 && fi < visibleRows && (
              <g opacity={scoresIn}>
                <rect x={LEFT_X + N_FOLDS * SEG_W + 24} y={rowY + 8}
                  width={Math.round(SCORES[fi] * 120 * scoresIn)} height={SEG_H - 16}
                  rx="4" fill={T.mint} fillOpacity={0.6} />
                <text x={LEFT_X + N_FOLDS * SEG_W + 24 + Math.round(SCORES[fi] * 120) + 8}
                  y={rowY + SEG_H / 2 + 5}
                  fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">
                  {SCORES[fi].toFixed(2)}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Average score badge */}
      {avgIn > 0 && (
        <g opacity={avgIn}>
          <rect x={W / 2 - 140} y={TOP_Y + N_FOLDS * ROW_GAP + 20} width={280} height={56} rx="28"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2" />
          <text x={W / 2} y={TOP_Y + N_FOLDS * ROW_GAP + 48} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1">
            Average Score: 0.87 ± 0.02
          </text>
          <text x={W / 2} y={TOP_Y + N_FOLDS * ROW_GAP + 66} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="12">
            5-Fold Cross-Validation
          </text>
        </g>
      )}
    </svg>
  );
};
