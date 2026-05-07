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

const OPS = [
  { cost: 1, resize: false },
  { cost: 1, resize: false },
  { cost: 1, resize: false },
  { cost: 4, resize: true },
  { cost: 1, resize: false },
  { cost: 1, resize: false },
  { cost: 1, resize: false },
  { cost: 8, resize: true },
];

const OP_BOX_W = 80;
const OP_GAP = 20;
const OPS_TOTAL_W = OPS.length * OP_BOX_W + (OPS.length - 1) * OP_GAP;
const OPS_START_X = (W - OPS_TOTAL_W) / 2;
const OPS_Y = 60;
const MAX_COST = 8;
const CHEAP_H = 40;
const EXPENSIVE_H = 120;

const METHODS = [
  { label: "AGGREGATE METHOD", key: "AGGREGATE", color: T.cyan,    x: 80,  y: 310 },
  { label: "ACCOUNTING METHOD", key: "ACCOUNTING", color: T.violet, x: 395, y: 310 },
  { label: "POTENTIAL METHOD",  key: "POTENTIAL",  color: T.amber,  x: 710, y: 310 },
];

export const AmortizedDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const opsIn      = p(frame, duration, 0.00, 0.30);
  const spikesIn   = p(frame, duration, 0.30, 0.50);
  const method1In  = p(frame, duration, 0.50, 0.65);
  const method2In  = p(frame, duration, 0.65, 0.80);
  const method3In  = p(frame, duration, 0.80, 1.00);

  const methodProgress = [method1In, method2In, method3In];

  const hiAmort = hi("AMORTIZED");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="am-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="am-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <text x={W / 2} y={36} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="3"
        opacity={opsIn}>
        AMORTIZED ANALYSIS · THREE METHODS
      </text>

      {OPS.map((op, i) => {
        const boxX = OPS_START_X + i * (OP_BOX_W + OP_GAP);
        const opAlpha = Math.max(0, Math.min(1, opsIn * OPS.length - i));
        const h = op.resize
          ? (spikesIn > 0 ? CHEAP_H + (EXPENSIVE_H - CHEAP_H) * spikesIn : CHEAP_H)
          : CHEAP_H;
        const color = op.resize ? T.coral : T.mint;
        const boxY = OPS_Y + EXPENSIVE_H - h;

        return (
          <g key={i} opacity={opAlpha}>
            <rect x={boxX} y={boxY} width={OP_BOX_W} height={h} rx="6"
              fill={color} fillOpacity={op.resize ? 0.35 : 0.25}
              stroke={color} strokeWidth="1.5"
              filter={op.resize && spikesIn > 0.5 ? "url(#am-glow-sm)" : undefined}
            />
            <text x={boxX + OP_BOX_W / 2} y={OPS_Y + EXPENSIVE_H + 18}
              textAnchor="middle"
              fill={op.resize ? T.coral : T.textDim}
              fontFamily={T.mono} fontSize="11" fontWeight={op.resize ? "700" : "400"}>
              op {i + 1}
            </text>
            {op.resize && spikesIn > 0.5 && (
              <text x={boxX + OP_BOX_W / 2} y={boxY - 6}
                textAnchor="middle"
                fill={T.coral} fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="0.5">
                RESIZE
              </text>
            )}
          </g>
        );
      })}

      <line x1={OPS_START_X - 10} y1={OPS_Y + EXPENSIVE_H + 30}
        x2={OPS_START_X + OPS_TOTAL_W + 10} y2={OPS_Y + EXPENSIVE_H + 30}
        stroke={T.border} strokeWidth="1" opacity={opsIn} />

      {METHODS.map((m, mi) => {
        const mp = methodProgress[mi];
        if (mp <= 0) return null;
        const isHi = hi(m.key) || hiAmort;
        const mw = 270;

        return (
          <g key={mi} opacity={mp}>
            <rect x={m.x} y={m.y} width={mw} height={330} rx="14"
              fill={m.color} fillOpacity={isHi ? 0.12 : 0.07}
              stroke={m.color} strokeWidth={isHi ? 2 : 1.5}
              filter={isHi ? "url(#am-glow-sm)" : undefined}
            />
            <rect x={m.x + 10} y={m.y + 10} width={mw - 20} height={28} rx="14"
              fill={m.color} fillOpacity={isHi ? 0.30 : 0.18}
            />
            <text x={m.x + mw / 2} y={m.y + 29} textAnchor="middle"
              fill={m.color} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1.5"
              filter={isHi ? "url(#am-glow-sm)" : undefined}>
              {m.label}
            </text>

            {mi === 0 && (
              <g>
                <text x={m.x + mw / 2} y={m.y + 70} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.sans} fontSize="11">
                  Sum all costs, divide by n
                </text>
                <text x={m.x + mw / 2} y={m.y + 110} textAnchor="middle"
                  fill={m.color} fontFamily={T.mono} fontSize="15" fontWeight="700">
                  T(n) / n
                </text>
                <text x={m.x + mw / 2} y={m.y + 140} textAnchor="middle"
                  fill={m.color} fontFamily={T.mono} fontSize="13">
                  = 3n / n = O(3)
                </text>
                <text x={m.x + mw / 2} y={m.y + 175} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.sans} fontSize="11">
                  = O(1) amortized
                </text>
                <rect x={m.x + 20} y={m.y + 195} width={mw - 40} height={30} rx="8"
                  fill={m.color} fillOpacity="0.15" stroke={m.color} strokeWidth="1" />
                <text x={m.x + mw / 2} y={m.y + 215} textAnchor="middle"
                  fill={m.color} fontFamily={T.mono} fontSize="11">
                  cost(1..n) = 2n-1
                </text>
              </g>
            )}

            {mi === 1 && (
              <g>
                <text x={m.x + mw / 2} y={m.y + 70} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.sans} fontSize="11">
                  Each op pre-pays 3 credits
                </text>
                {[0, 1, 2, 3, 4, 5].map(ci2 => {
                  const coinX = m.x + 30 + ci2 * 34;
                  const coinY = m.y + 100;
                  const isDrained = ci2 > 2;
                  return (
                    <g key={ci2}>
                      <circle cx={coinX + 12} cy={coinY + 12} r={12}
                        fill={isDrained ? T.textDim : m.color}
                        fillOpacity={isDrained ? 0.25 : 0.60}
                        stroke={isDrained ? T.border : m.color}
                        strokeWidth="1.5"
                      />
                      <text x={coinX + 12} y={coinY + 17} textAnchor="middle"
                        fill={isDrained ? T.textDim : T.textPrimary}
                        fontFamily={T.mono} fontSize="11" fontWeight="700">
                        {isDrained ? "x" : "$"}
                      </text>
                    </g>
                  );
                })}
                <text x={m.x + mw / 2} y={m.y + 155} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.sans} fontSize="10">
                  cheap: pay 1, bank 2
                </text>
                <text x={m.x + mw / 2} y={m.y + 172} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.sans} fontSize="10">
                  resize: use banked credits
                </text>
                <rect x={m.x + 20} y={m.y + 190} width={mw - 40} height={26} rx="8"
                  fill={m.color} fillOpacity="0.15" stroke={m.color} strokeWidth="1" />
                <text x={m.x + mw / 2} y={m.y + 208} textAnchor="middle"
                  fill={m.color} fontFamily={T.mono} fontSize="11">
                  amortized cost = O(1)
                </text>
              </g>
            )}

            {mi === 2 && (
              <g>
                <text x={m.x + mw / 2} y={m.y + 70} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.sans} fontSize="11">
                  {"Φ(state) = potential function"}
                </text>
                {[0, 1, 2, 3, 4].map(bi => {
                  const barH = bi === 4 ? 10 : (bi + 1) * 20;
                  const barX = m.x + 30 + bi * 42;
                  const barY = m.y + 195 - barH;
                  const isCrash = bi === 3;
                  return (
                    <g key={bi}>
                      <rect x={barX} y={barY} width={30} height={barH} rx="4"
                        fill={isCrash ? T.coral : m.color}
                        fillOpacity={isCrash ? 0.5 : 0.55}
                      />
                    </g>
                  );
                })}
                <text x={m.x + mw / 2} y={m.y + 218} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.sans} fontSize="10">
                  {"Φ grows → drops on resize"}
                </text>
                <rect x={m.x + 20} y={m.y + 235} width={mw - 40} height={26} rx="8"
                  fill={m.color} fillOpacity="0.15" stroke={m.color} strokeWidth="1" />
                <text x={m.x + mw / 2} y={m.y + 253} textAnchor="middle"
                  fill={m.color} fontFamily={T.mono} fontSize="11">
                  {"amortized = actual + ΔΦ"}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
