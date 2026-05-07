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

const TOKENS = ["I", "love", "deep", "learn", "ing"];
const N_CELLS = 5;
const CELL_W = 120, CELL_H = 90, CELL_RX = 12;
const CELL_Y = 300;
const CELL_GAP = 170;
const CELL_X_START = 80;

function cellX(i: number) { return CELL_X_START + i * CELL_GAP; }
function cellCX(i: number) { return cellX(i) + CELL_W / 2; }

// Hidden state bar: a small rect representing the h-vector
const HS_W = 70, HS_H = 14;

// Pseudo-random hidden state fill widths per cell (representing vector magnitude)
const HS_FILLS = [0.3, 0.55, 0.7, 0.85, 0.95];

export const RNNDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const cellsIn    = p(frame, duration, 0.00, 0.20);
  const waveP      = p(frame, duration, 0.20, 0.72);
  const outputIn   = p(frame, duration, 0.72, 0.88);
  const finalIn    = p(frame, duration, 0.88, 1.00);

  const hiHidden  = hi("HIDDEN STATE");
  const hiSeq     = hi("SEQUENCE");
  const hiRecur   = hi("RECURRENT");

  // Wave activation per cell
  function cellActive(i: number): number {
    return p(frame, duration, 0.20 + i * 0.09, 0.34 + i * 0.09);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rnn-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rnn-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="rnn-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="rnn-arrow-dim" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
      </defs>

      {/* ── RNN Cells ── */}
      {Array.from({ length: N_CELLS }).map((_, i) => {
        const cx = cellCX(i);
        const actP = cellActive(i);
        const isActive = actP > 0.3;
        const isLast = i === N_CELLS - 1;

        return (
          <g key={i} opacity={cellsIn}>
            {/* Cell box */}
            <rect x={cellX(i)} y={CELL_Y} width={CELL_W} height={CELL_H} rx={CELL_RX}
              fill={isActive ? `${T.violet}22` : T.nodeFill}
              stroke={isActive ? T.violet : T.nodeBorder}
              strokeWidth={isActive ? 2.5 : 1.5}
              filter={isActive ? (hiRecur ? "url(#rnn-glow)" : "url(#rnn-glow-sm)") : undefined}
            />
            {/* RNN label inside */}
            <text x={cx} y={CELL_Y + CELL_H / 2 + 6} textAnchor="middle"
              fill={isActive ? T.violet : T.textDim}
              fontFamily={T.mono} fontSize="15" fontWeight="700">
              RNN
            </text>

            {/* Recurrent arrow above cell */}
            {(hiRecur || isActive) && (
              <path d={`M${cx - 16} ${CELL_Y - 4} Q${cx} ${CELL_Y - 44} ${cx + 16} ${CELL_Y - 4}`}
                fill="none"
                stroke={hiRecur ? T.violet : T.violet}
                strokeWidth="2"
                strokeOpacity={isActive ? 0.8 : 0.25}
                markerEnd="url(#rnn-arrow)"
              />
            )}

            {/* Token below */}
            <text x={cx} y={CELL_Y + CELL_H + 36} textAnchor="middle"
              fill={isActive ? (hiSeq ? T.cyan : T.textPrimary) : T.textSecondary}
              fontFamily={T.mono} fontSize={TOKENS[i].length > 4 ? 16 : 20} fontWeight="600">
              "{TOKENS[i]}"
            </text>

            {/* Hidden state bar */}
            {actP > 0.2 && (
              <g opacity={Math.min((actP - 0.2) / 0.5, 1)}>
                <rect x={cx - HS_W / 2} y={CELL_Y - 76} width={HS_W} height={HS_H} rx="4"
                  fill={T.bgDeep} stroke={hiHidden ? T.mint : T.border} strokeWidth={hiHidden ? 1.5 : 1}
                />
                <rect x={cx - HS_W / 2 + 2} y={CELL_Y - 74} width={(HS_W - 4) * HS_FILLS[i]} height={HS_H - 4} rx="2"
                  fill={hiHidden ? T.mint : T.violet}
                  opacity={0.8}
                />
                {isLast || hiHidden ? (
                  <text x={cx} y={CELL_Y - 88} textAnchor="middle"
                    fill={hiHidden ? T.mint : T.textDim} fontFamily={T.mono} fontSize="10">h</text>
                ) : null}
              </g>
            )}

            {/* Hidden state arrow to next cell */}
            {i < N_CELLS - 1 && actP > 0.5 && (
              <line
                x1={cellX(i) + CELL_W} y1={CELL_Y + CELL_H / 2}
                x2={cellX(i + 1) - 4} y2={CELL_Y + CELL_H / 2}
                stroke={hiHidden ? T.mint : T.violet}
                strokeWidth={hiHidden ? 2.5 : 2}
                markerEnd="url(#rnn-arrow)"
                opacity={Math.min((actP - 0.5) / 0.5, 1)}
                filter={hiHidden ? "url(#rnn-glow-sm)" : undefined}
              />
            )}
          </g>
        );
      })}

      {/* ── Input token arrows (down into cell) ── */}
      {Array.from({ length: N_CELLS }).map((_, i) => (
        <line key={`input-${i}`}
          x1={cellCX(i)} y1={CELL_Y + CELL_H + 4}
          x2={cellCX(i)} y2={CELL_Y + CELL_H}
          stroke={T.textDim} strokeWidth="1.5"
          opacity={cellsIn * 0.5}
        />
      ))}

      {/* ── Output above last cell ── */}
      {outputIn > 0 && (
        <g opacity={outputIn}>
          <line x1={cellCX(N_CELLS - 1)} y1={CELL_Y - 4}
            x2={cellCX(N_CELLS - 1)} y2={CELL_Y - 70}
            stroke={T.mint} strokeWidth="2"
            markerEnd="url(#rnn-arrow-dim)"
          />
          <rect x={cellCX(N_CELLS - 1) - 100} y={CELL_Y - 140} width={200} height={60} rx="12"
            fill={`${T.mint}22`} stroke={T.mint} strokeWidth="1.5"
          />
          <text x={cellCX(N_CELLS - 1)} y={CELL_Y - 115} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">
            Sentiment: Positive
          </text>
          <text x={cellCX(N_CELLS - 1)} y={CELL_Y - 96} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="400">
            confidence: 0.91
          </text>
        </g>
      )}

      {/* ── SEQUENCE label at bottom ── */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <text x={W / 2} y={650} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="15" fontWeight="700" letterSpacing="3">
            SEQUENTIAL PROCESSING
          </text>
        </g>
      )}
    </svg>
  );
};
