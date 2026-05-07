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

const SLOT_W = 90, SLOT_H = 70, SLOT_GAP = 10;
const ROW_LRU_Y = 140, ROW_LFU_Y = 380;
const ROW_START_X = 60;

const SLOTS = [
  { id: "M1", lruAge: 8, lfuCount: 1 },
  { id: "M2", lruAge: 6, lfuCount: 4 },
  { id: "M3", lruAge: 3, lfuCount: 7 },
  { id: "M4", lruAge: 5, lfuCount: 2 },
  { id: "M5", lruAge: 2, lfuCount: 9 },
  { id: "M6", lruAge: 7, lfuCount: 3 },
  { id: "M7", lruAge: 1, lfuCount: 6 },
  { id: "M8", lruAge: 4, lfuCount: 8 },
];

// LRU evicts M1 (lruAge = 8, oldest used)
// LFU evicts M4 (lfuCount = 1, wait M1 is also 1... let's use M1=1, M4=2, so LFU evicts M1 in row 2)
// Actually let's define unique counts: M1=1, M4=2, M6=3 — LFU evicts M1
const LRU_EVICT_IDX = 0; // M1 has highest lruAge
const LFU_EVICT_IDX = 0; // M1 has lowest lfuCount

export const MemEvictionDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const slotsIn    = p(frame, duration, 0.00, 0.20);
  const m9Arrive   = p(frame, duration, 0.20, 0.38);
  const lruEvict   = p(frame, duration, 0.38, 0.62);
  const lfuEvict   = p(frame, duration, 0.62, 0.88);
  const doneP      = p(frame, duration, 0.88, 1.00);

  const hiLRU      = hi("LRU");
  const hiLFU      = hi("LFU");
  const hiEviction = hi("EVICTION");

  const slotX = (i: number) => ROW_START_X + i * (SLOT_W + SLOT_GAP);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="evict-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="evict-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="evict-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="evict-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.coral} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={44} textAnchor="middle"
        fill={hiEviction ? T.amber : T.textDim}
        fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        filter={hiEviction ? "url(#evict-glow-sm)" : undefined}
        opacity={slotsIn}>
        MEMORY EVICTION POLICIES
      </text>

      {/* ── LRU Row ── */}
      <text x={ROW_START_X} y={ROW_LRU_Y - 18} textAnchor="start"
        fill={hiLRU ? T.cyan : T.textDim}
        fontFamily={T.sans} fontSize="12" fontWeight="800" letterSpacing="2"
        filter={hiLRU ? "url(#evict-glow-sm)" : undefined}
        opacity={slotsIn}>
        LRU — Least Recently Used
      </text>

      {SLOTS.map((slot, i) => {
        const isEvictLRU = i === LRU_EVICT_IDX;
        const evictedOpacity = isEvictLRU ? 1 - lruEvict : 1;
        const replaced = isEvictLRU && lruEvict > 0.6;
        return (
          <g key={`lru-${i}`} opacity={slotsIn * evictedOpacity}>
            <rect
              x={slotX(i)} y={ROW_LRU_Y}
              width={SLOT_W} height={SLOT_H} rx="10"
              fill={isEvictLRU && lruEvict > 0.1 ? T.coral : T.nodeFill}
              fillOpacity={isEvictLRU && lruEvict > 0.1 ? 0.25 : 0.4}
              stroke={isEvictLRU && lruEvict > 0.1 ? T.coral : T.border}
              strokeWidth={isEvictLRU && lruEvict > 0.1 ? 2.5 : 1.5}
              filter={isEvictLRU && lruEvict > 0.1 ? "url(#evict-glow)" : undefined}
            />
            <text x={slotX(i) + SLOT_W / 2} y={ROW_LRU_Y + SLOT_H / 2 + 5}
              textAnchor="middle"
              fill={isEvictLRU && lruEvict > 0.1 ? T.coral : T.textSecondary}
              fontFamily={T.mono} fontSize="13" fontWeight="700">
              {slot.id}
            </text>
            {/* Age badge */}
            <rect x={slotX(i) + SLOT_W - 26} y={ROW_LRU_Y + 4} width={22} height={18} rx="9"
              fill={T.amber} fillOpacity={0.25} stroke={T.amber} strokeWidth="1"
            />
            <text x={slotX(i) + SLOT_W - 15} y={ROW_LRU_Y + 17} textAnchor="middle"
              fill={T.amber} fontFamily={T.mono} fontSize="9" fontWeight="700">
              {slot.lruAge}
            </text>
          </g>
        );
      })}

      {/* LRU age legend */}
      <text x={slotX(8) - 30} y={ROW_LRU_Y + SLOT_H / 2 - 6} textAnchor="start"
        fill={T.amber} fontFamily={T.sans} fontSize="9" opacity={slotsIn * 0.7}>
        age
      </text>
      <text x={slotX(8) - 30} y={ROW_LRU_Y + SLOT_H / 2 + 8} textAnchor="start"
        fill={T.amber} fontFamily={T.sans} fontSize="9" opacity={slotsIn * 0.7}>
        badge
      </text>

      {/* LRU replacement slot — M9 fills in */}
      {lruEvict > 0.6 && (
        <g opacity={(lruEvict - 0.6) / 0.4}>
          <rect x={slotX(LRU_EVICT_IDX)} y={ROW_LRU_Y}
            width={SLOT_W} height={SLOT_H} rx="10"
            fill={T.cyan} fillOpacity={0.2}
            stroke={T.cyan} strokeWidth="2.5"
            filter="url(#evict-glow-sm)"
          />
          <text x={slotX(LRU_EVICT_IDX) + SLOT_W / 2} y={ROW_LRU_Y + SLOT_H / 2 + 5}
            textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="13" fontWeight="700">
            M9
          </text>
        </g>
      )}

      {/* ── LFU Row ── */}
      <text x={ROW_START_X} y={ROW_LFU_Y - 18} textAnchor="start"
        fill={hiLFU ? T.violet : T.textDim}
        fontFamily={T.sans} fontSize="12" fontWeight="800" letterSpacing="2"
        filter={hiLFU ? "url(#evict-glow-sm)" : undefined}
        opacity={slotsIn}>
        LFU — Least Frequently Used
      </text>

      {SLOTS.map((slot, i) => {
        const isEvictLFU = i === LFU_EVICT_IDX;
        const evictedOpacity = isEvictLFU ? 1 - lfuEvict : 1;
        return (
          <g key={`lfu-${i}`} opacity={slotsIn * evictedOpacity}>
            <rect
              x={slotX(i)} y={ROW_LFU_Y}
              width={SLOT_W} height={SLOT_H} rx="10"
              fill={isEvictLFU && lfuEvict > 0.1 ? T.coral : T.nodeFill}
              fillOpacity={isEvictLFU && lfuEvict > 0.1 ? 0.25 : 0.4}
              stroke={isEvictLFU && lfuEvict > 0.1 ? T.coral : T.border}
              strokeWidth={isEvictLFU && lfuEvict > 0.1 ? 2.5 : 1.5}
              filter={isEvictLFU && lfuEvict > 0.1 ? "url(#evict-glow)" : undefined}
            />
            <text x={slotX(i) + SLOT_W / 2} y={ROW_LFU_Y + SLOT_H / 2 + 5}
              textAnchor="middle"
              fill={isEvictLFU && lfuEvict > 0.1 ? T.coral : T.textSecondary}
              fontFamily={T.mono} fontSize="13" fontWeight="700">
              {slot.id}
            </text>
            {/* Frequency badge */}
            <rect x={slotX(i) + SLOT_W - 26} y={ROW_LFU_Y + 4} width={22} height={18} rx="9"
              fill={T.violet} fillOpacity={0.25} stroke={T.violet} strokeWidth="1"
            />
            <text x={slotX(i) + SLOT_W - 15} y={ROW_LFU_Y + 17} textAnchor="middle"
              fill={T.violet} fontFamily={T.mono} fontSize="9" fontWeight="700">
              {slot.lfuCount}
            </text>
          </g>
        );
      })}

      {/* LFU freq badge legend */}
      <text x={slotX(8) - 30} y={ROW_LFU_Y + SLOT_H / 2 - 6} textAnchor="start"
        fill={T.violet} fontFamily={T.sans} fontSize="9" opacity={slotsIn * 0.7}>
        freq
      </text>
      <text x={slotX(8) - 30} y={ROW_LFU_Y + SLOT_H / 2 + 8} textAnchor="start"
        fill={T.violet} fontFamily={T.sans} fontSize="9" opacity={slotsIn * 0.7}>
        badge
      </text>

      {/* LFU replacement slot */}
      {lfuEvict > 0.6 && (
        <g opacity={(lfuEvict - 0.6) / 0.4}>
          <rect x={slotX(LFU_EVICT_IDX)} y={ROW_LFU_Y}
            width={SLOT_W} height={SLOT_H} rx="10"
            fill={T.violet} fillOpacity={0.2}
            stroke={T.violet} strokeWidth="2.5"
            filter="url(#evict-glow-sm)"
          />
          <text x={slotX(LFU_EVICT_IDX) + SLOT_W / 2} y={ROW_LFU_Y + SLOT_H / 2 + 5}
            textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="13" fontWeight="700">
            M9
          </text>
        </g>
      )}

      {/* ── M9 incoming arrow (LRU row) ── */}
      {m9Arrive > 0 && lruEvict < 0.5 && (
        <g opacity={Math.min(1, m9Arrive * 2)}>
          <rect
            x={slotX(-1) + (SLOT_W + SLOT_GAP) * m9Arrive * 0.8}
            y={ROW_LRU_Y}
            width={SLOT_W} height={SLOT_H} rx="10"
            fill={T.cyan} fillOpacity={0.2}
            stroke={T.cyan} strokeWidth="2"
            filter="url(#evict-glow-sm)"
          />
          <text
            x={slotX(-1) + (SLOT_W + SLOT_GAP) * m9Arrive * 0.8 + SLOT_W / 2}
            y={ROW_LRU_Y + SLOT_H / 2 + 5}
            textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="13" fontWeight="700">
            M9
          </text>
          <text
            x={slotX(-1) + (SLOT_W + SLOT_GAP) * m9Arrive * 0.8 + SLOT_W / 2}
            y={ROW_LRU_Y - 10}
            textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="10" letterSpacing="1">
            NEW
          </text>
        </g>
      )}

      {/* ── M9 incoming arrow (LFU row) ── */}
      {lruEvict > 0.8 && lfuEvict < 0.5 && (
        <g opacity={Math.min(1, (lruEvict - 0.8) * 5)}>
          <rect x={slotX(0) - 10} y={ROW_LFU_Y - 60}
            width={SLOT_W} height={SLOT_H} rx="10"
            fill={T.violet} fillOpacity={0.2}
            stroke={T.violet} strokeWidth="2"
            filter="url(#evict-glow-sm)"
          />
          <text x={slotX(0) - 10 + SLOT_W / 2} y={ROW_LFU_Y - 60 + SLOT_H / 2 + 5}
            textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="13" fontWeight="700">
            M9
          </text>
        </g>
      )}

      {/* ── Done badge ── */}
      {doneP > 0 && (
        <g opacity={doneP}>
          <rect x={W / 2 - 130} y={620} width={260} height={48} rx="24"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#evict-glow-sm)"
          />
          <text x={W / 2} y={650} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="2">
            SLOT RECYCLED
          </text>
        </g>
      )}
    </svg>
  );
};
