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

// Matrix layout
const CELL_SIZE = 190;
const MAT_X = (W - CELL_SIZE * 2) / 2;
const MAT_Y = 130;

const CELLS = [
  { id: "TP", label: "True Positive",  row: 0, col: 0, value: 45, color: "#00D4A0" },  // mint
  { id: "FP", label: "False Positive", row: 0, col: 1, value: 5,  color: "#F5506B" },  // coral
  { id: "FN", label: "False Negative", row: 1, col: 0, value: 8,  color: "#F5A623" },  // amber
  { id: "TN", label: "True Negative",  row: 1, col: 1, value: 42, color: "#00C8E6" },  // cyan
];

export const ConfusionMatrixDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const gridIn      = p(frame, duration, 0.00, 0.20);
  const cellsIn     = p(frame, duration, 0.20, 0.55);
  const abbrevIn    = p(frame, duration, 0.55, 0.75);
  const metricsIn   = p(frame, duration, 0.75, 0.90);
  const f1In        = p(frame, duration, 0.90, 1.00);

  const hiPrecision = hi("PRECISION");
  const hiRecall    = hi("RECALL");
  const hiF1        = hi("F1");
  const hiFP        = hi("FALSE POSITIVE");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cm-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Column headers */}
      <g opacity={gridIn}>
        <text x={MAT_X + CELL_SIZE * 0.5} y={MAT_Y - 18} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="15" fontWeight="600">
          Predicted Positive
        </text>
        <text x={MAT_X + CELL_SIZE * 1.5} y={MAT_Y - 18} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="15" fontWeight="600">
          Predicted Negative
        </text>
        {/* Row headers */}
        <text x={MAT_X - 18} y={MAT_Y + CELL_SIZE * 0.5} textAnchor="end"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="15" fontWeight="600"
          transform={`rotate(-90, ${MAT_X - 18}, ${MAT_Y + CELL_SIZE * 0.5})`}>
          Actual Positive
        </text>
        <text x={MAT_X - 18} y={MAT_Y + CELL_SIZE * 1.5} textAnchor="end"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="15" fontWeight="600"
          transform={`rotate(-90, ${MAT_X - 18}, ${MAT_Y + CELL_SIZE * 1.5})`}>
          Actual Negative
        </text>
        {/* Grid outline */}
        <rect x={MAT_X} y={MAT_Y} width={CELL_SIZE * 2} height={CELL_SIZE * 2}
          fill="none" stroke={T.borderStrong} strokeWidth="2" />
        <line x1={MAT_X + CELL_SIZE} y1={MAT_Y} x2={MAT_X + CELL_SIZE} y2={MAT_Y + CELL_SIZE * 2}
          stroke={T.borderStrong} strokeWidth="2" />
        <line x1={MAT_X} y1={MAT_Y + CELL_SIZE} x2={MAT_X + CELL_SIZE * 2} y2={MAT_Y + CELL_SIZE}
          stroke={T.borderStrong} strokeWidth="2" />
      </g>

      {/* Cell fills + count-up numbers */}
      {CELLS.map((cell, i) => {
        const cellProgress = Math.max(0, Math.min(1, cellsIn * 4 - i));
        if (cellProgress <= 0) return null;
        const cx = MAT_X + cell.col * CELL_SIZE;
        const cy = MAT_Y + cell.row * CELL_SIZE;
        const displayVal = Math.round(cell.value * cellProgress);
        const isFP = cell.id === "FP" && hiFP;
        const isPrecisionHighlight = hiPrecision && cell.row === 0;
        const isRecallHighlight = hiRecall && cell.col === 0;
        const glowing = isFP || isPrecisionHighlight || isRecallHighlight;
        return (
          <g key={cell.id}>
            <rect x={cx} y={cy} width={CELL_SIZE} height={CELL_SIZE}
              fill={cell.color} fillOpacity={glowing ? 0.22 : 0.12 * cellProgress}
              filter={glowing ? "url(#cm-glow)" : undefined}
            />
            <text x={cx + CELL_SIZE / 2} y={cy + CELL_SIZE / 2 + 18} textAnchor="middle"
              fill={cell.color} fontFamily={T.mono} fontSize="52" fontWeight="800"
              opacity={cellProgress}
              filter={glowing ? "url(#cm-glow)" : undefined}>
              {displayVal}
            </text>
          </g>
        );
      })}

      {/* Abbreviation labels */}
      {abbrevIn > 0 && CELLS.map((cell) => {
        const cx = MAT_X + cell.col * CELL_SIZE;
        const cy = MAT_Y + cell.row * CELL_SIZE;
        return (
          <g key={`label-${cell.id}`} opacity={abbrevIn}>
            <text x={cx + CELL_SIZE / 2} y={cy + 24} textAnchor="middle"
              fill={cell.color} fontFamily={T.sans} fontSize="18" fontWeight="800"
              letterSpacing="1">
              {cell.id}
            </text>
            <text x={cx + CELL_SIZE / 2} y={cy + 44} textAnchor="middle"
              fill={T.textDim} fontFamily={T.sans} fontSize="11">
              {cell.label}
            </text>
          </g>
        );
      })}

      {/* Derived metrics */}
      {metricsIn > 0 && (
        <g opacity={metricsIn}>
          {/* Precision */}
          <rect x={MAT_X - 60} y={MAT_Y + CELL_SIZE * 2 + 24} width={240} height={56} rx="10"
            fill={hiPrecision ? T.mint : T.bgDeep}
            fillOpacity={hiPrecision ? 0.18 : 1}
            stroke={T.mint} strokeWidth="1.5"
            filter={hiPrecision ? "url(#cm-glow)" : undefined}
          />
          <text x={MAT_X + 60} y={MAT_Y + CELL_SIZE * 2 + 50} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="700">
            Precision: 90%
          </text>
          <text x={MAT_X + 60} y={MAT_Y + CELL_SIZE * 2 + 68} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">TP / (TP + FP)</text>

          {/* Recall */}
          <rect x={MAT_X + 190} y={MAT_Y + CELL_SIZE * 2 + 24} width={240} height={56} rx="10"
            fill={hiRecall ? T.cyan : T.bgDeep}
            fillOpacity={hiRecall ? 0.18 : 1}
            stroke={T.cyan} strokeWidth="1.5"
            filter={hiRecall ? "url(#cm-glow)" : undefined}
          />
          <text x={MAT_X + 310} y={MAT_Y + CELL_SIZE * 2 + 50} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="15" fontWeight="700">
            Recall: 85%
          </text>
          <text x={MAT_X + 310} y={MAT_Y + CELL_SIZE * 2 + 68} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">TP / (TP + FN)</text>
        </g>
      )}

      {/* F1 badge */}
      {f1In > 0 && (
        <g opacity={f1In}>
          <rect x={W / 2 + 60} y={MAT_Y + CELL_SIZE * 2 + 24} width={200} height={56} rx="10"
            fill={hiF1 ? T.violet : T.bgDeep}
            fillOpacity={hiF1 ? 0.25 : 1}
            stroke={T.violet} strokeWidth="2"
            filter={hiF1 ? "url(#cm-glow)" : undefined}
          />
          <text x={W / 2 + 160} y={MAT_Y + CELL_SIZE * 2 + 50} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800"
            filter={hiF1 ? "url(#cm-glow)" : undefined}>
            F1 = 0.87
          </text>
          <text x={W / 2 + 160} y={MAT_Y + CELL_SIZE * 2 + 68} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">2·P·R / (P+R)</text>
        </g>
      )}
    </svg>
  );
};
