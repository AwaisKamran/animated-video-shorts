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

const STORE_X = 340, STORE_Y = 200, STORE_W = 400, STORE_H = 300;
const SLOT_H = 36, SLOT_GAP = 10;
const SLOT_X = STORE_X + 20;
const SLOT_W_INNER = STORE_W - 40;

const WRITES = [
  { key: "user_pref", value: "dark_mode" },
  { key: "session_id", value: "abc123" },
  { key: "last_query", value: "memory types" },
];

const READS = [
  { query: "get user_pref",  result: "dark_mode" },
  { query: "get session_id", result: "abc123" },
];

export const MemoryRWDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const storeIn = p(frame, duration, 0.00, 0.18);
  const write1P = p(frame, duration, 0.18, 0.34);
  const write2P = p(frame, duration, 0.34, 0.50);
  const read1P  = p(frame, duration, 0.50, 0.64);
  const write3P = p(frame, duration, 0.64, 0.78);
  const read2P  = p(frame, duration, 0.78, 1.00);

  const hiWrite  = hi("WRITE");
  const hiRead   = hi("READ");
  const hiRecall = hi("RECALL");

  const writeProgs = [write1P, write2P, write3P];
  const filledSlots = writeProgs.filter(pr => pr > 0.5).length;

  const activeWrite = write3P > 0 ? 2 : write2P > 0 ? 1 : write1P > 0 ? 0 : -1;
  const activeRead  = read2P > 0 ? 1 : read1P > 0 ? 0 : -1;

  const arrowWriteX = STORE_X - 160;
  const arrowReadX  = STORE_X + STORE_W + 20;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="rw-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rw-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="rw-arr-cyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="rw-arr-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={50} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={storeIn}>
        MEMORY READ / WRITE
      </text>

      {/* ── Memory Store panel ── */}
      <g opacity={storeIn}>
        <rect x={STORE_X} y={STORE_Y} width={STORE_W} height={STORE_H} rx="20"
          fill={T.nodeFill} fillOpacity={0.6}
          stroke={T.borderStrong} strokeWidth="2"
        />
        <text x={STORE_X + STORE_W / 2} y={STORE_Y + 30} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
          MEMORY STORE
        </text>
        <line x1={STORE_X + 16} y1={STORE_Y + 44} x2={STORE_X + STORE_W - 16} y2={STORE_Y + 44}
          stroke={T.border} strokeWidth="1"
        />
      </g>

      {/* ── Filled slots ── */}
      {WRITES.map((w, i) => {
        const prog = writeProgs[i];
        if (prog < 0.3) return null;
        const slotY = STORE_Y + 58 + i * (SLOT_H + SLOT_GAP);
        return (
          <g key={i} opacity={Math.min(1, (prog - 0.3) * 3.3)}>
            <rect x={SLOT_X} y={slotY} width={SLOT_W_INNER} height={SLOT_H} rx="8"
              fill={T.cyan} fillOpacity={0.12}
              stroke={T.cyan} strokeWidth="1.2"
            />
            <text x={SLOT_X + 14} y={slotY + SLOT_H / 2 + 5}
              fill={T.cyan} fontFamily={T.mono} fontSize="12">
              <tspan fontWeight="700">{w.key}</tspan>
              <tspan fill={T.textDim}> : </tspan>
              <tspan fill={T.mint}>{w.value}</tspan>
            </text>
          </g>
        );
      })}

      {/* ── WRITE arrow (left side) ── */}
      {activeWrite >= 0 && (
        <g opacity={Math.max(write1P, write2P, write3P)}
          filter={hiWrite ? "url(#rw-glow-sm)" : undefined}>
          {/* Arrow line */}
          <line
            x1={arrowWriteX}
            y1={STORE_Y + STORE_H / 2}
            x2={STORE_X - 4}
            y2={STORE_Y + STORE_H / 2}
            stroke={T.cyan} strokeWidth="3"
            markerEnd="url(#rw-arr-cyan)"
          />
          {/* WRITE label box */}
          <rect x={arrowWriteX - 70} y={STORE_Y + STORE_H / 2 - 22} width={80} height={36} rx="18"
            fill={T.cyan} fillOpacity={hiWrite ? 0.3 : 0.15}
            stroke={T.cyan} strokeWidth={hiWrite ? 2.5 : 1.5}
            filter={hiWrite ? "url(#rw-glow)" : undefined}
          />
          <text x={arrowWriteX - 30} y={STORE_Y + STORE_H / 2 + 5} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
            WRITE
          </text>
          {/* Current write payload */}
          {activeWrite >= 0 && (
            <text x={arrowWriteX + 80} y={STORE_Y + STORE_H / 2 - 16} textAnchor="middle"
              fill={T.cyan} fontFamily={T.mono} fontSize="11"
              opacity={0.85}>
              {WRITES[activeWrite].key}: {WRITES[activeWrite].value}
            </text>
          )}
        </g>
      )}

      {/* ── READ arrow (right side) ── */}
      {activeRead >= 0 && (
        <g opacity={Math.max(read1P, read2P)}
          filter={(hiRead || hiRecall) ? "url(#rw-glow-sm)" : undefined}>
          {/* Arrow line */}
          <line
            x1={STORE_X + STORE_W + 4}
            y1={STORE_Y + STORE_H / 2}
            x2={arrowReadX + 160}
            y2={STORE_Y + STORE_H / 2}
            stroke={T.mint} strokeWidth="3"
            markerEnd="url(#rw-arr-mint)"
          />
          {/* READ label box */}
          <rect x={arrowReadX + 168} y={STORE_Y + STORE_H / 2 - 22} width={80} height={36} rx="18"
            fill={T.mint} fillOpacity={(hiRead || hiRecall) ? 0.3 : 0.15}
            stroke={T.mint} strokeWidth={(hiRead || hiRecall) ? 2.5 : 1.5}
            filter={(hiRead || hiRecall) ? "url(#rw-glow)" : undefined}
          />
          <text x={arrowReadX + 208} y={STORE_Y + STORE_H / 2 + 5} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
            READ
          </text>
          {/* Query label above */}
          <text x={arrowReadX + 80} y={STORE_Y + STORE_H / 2 - 16} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11" opacity={0.85}>
            {READS[activeRead].query}
          </text>
          {/* Result label below */}
          <text x={arrowReadX + 80} y={STORE_Y + STORE_H / 2 + 24} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700">
            → {READS[activeRead].result}
          </text>
        </g>
      )}

      {/* ── Cycle counter ── */}
      {write1P > 0 && (
        <text x={W / 2} y={H - 50} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="12" letterSpacing="1"
          opacity={storeIn}>
          {filledSlots} / {WRITES.length} slots written
        </text>
      )}

      {/* ── Idle placeholder arrows when none active ── */}
      {activeWrite < 0 && storeIn > 0.5 && (
        <g opacity={storeIn * 0.3}>
          <line x1={arrowWriteX} y1={STORE_Y + STORE_H / 2}
            x2={STORE_X - 4} y2={STORE_Y + STORE_H / 2}
            stroke={T.cyan} strokeWidth="2" strokeDasharray="6 4"
            markerEnd="url(#rw-arr-cyan)"
          />
        </g>
      )}
    </svg>
  );
};
