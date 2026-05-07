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

const TEXT_X = 80, TEXT_Y = 120, TEXT_W = 920, TEXT_H = 140;

// PII segments with x-offset estimates for highlight
const PII_ITEMS = [
  { label: "EMAIL", value: "john@example.com", color: T.coral,  tagX: 240, underY: 200 },
  { label: "PHONE", value: "555-1234",          color: T.amber,  tagX: 510, underY: 200 },
  { label: "SSN",   value: "123-45-6789",        color: T.violet, tagX: 730, underY: 238 },
];

const TAG_Y = 320;
const REDACT_Y = 440;
const SCAN_W = 920;

export const PIIDetectDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const textIn    = p(frame, duration, 0.00, 0.20);
  const scanP     = p(frame, duration, 0.20, 0.45);
  const detectP   = p(frame, duration, 0.45, 0.65);
  const redactP   = p(frame, duration, 0.65, 1.00);

  const hiPII    = hi("PII");
  const hiRedact = hi("REDACT");

  const scannerX = TEXT_X + SCAN_W * scanP;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pd-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Output text panel ── */}
      <g opacity={textIn}>
        <rect x={TEXT_X} y={TEXT_Y} width={TEXT_W} height={TEXT_H} rx="14"
          fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="2" />
        <text x={TEXT_X + 24} y={TEXT_Y + 30} textAnchor="start"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="2" opacity={0.6}>
          OUTPUT TEXT
        </text>
        {/* Line 1 */}
        <text x={TEXT_X + 24} y={TEXT_Y + 64} textAnchor="start"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="15">
          Hi, contact me at
        </text>
        <text x={TEXT_X + 244} y={TEXT_Y + 64} textAnchor="start"
          fill={detectP > 0 ? T.coral : T.textSecondary}
          fontFamily={T.mono} fontSize="15"
          filter={detectP > 0 ? "url(#pd-glow-sm)" : undefined}>
          john@example.com
        </text>
        <text x={TEXT_X + 460} y={TEXT_Y + 64} textAnchor="start"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="15">
          or call
        </text>
        <text x={TEXT_X + 544} y={TEXT_Y + 64} textAnchor="start"
          fill={detectP > 0 ? T.amber : T.textSecondary}
          fontFamily={T.mono} fontSize="15"
          filter={detectP > 0 ? "url(#pd-glow-sm)" : undefined}>
          555-1234.
        </text>
        {/* Line 2 */}
        <text x={TEXT_X + 24} y={TEXT_Y + 100} textAnchor="start"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="15">
          My SSN is
        </text>
        <text x={TEXT_X + 152} y={TEXT_Y + 100} textAnchor="start"
          fill={detectP > 0 ? T.violet : T.textSecondary}
          fontFamily={T.mono} fontSize="15"
          filter={detectP > 0 ? "url(#pd-glow-sm)" : undefined}>
          123-45-6789.
        </text>
      </g>

      {/* ── Scanner sweep ── */}
      {scanP > 0 && scanP < 0.98 && (
        <rect x={scannerX - 3} y={TEXT_Y} width={4} height={TEXT_H}
          fill={T.cyan} opacity={0.7}
          filter="url(#pd-glow-sm)"
        />
      )}
      {scanP > 0.05 && (
        <rect x={TEXT_X} y={TEXT_Y} width={SCAN_W * Math.min(1, scanP)} height={TEXT_H} rx="0"
          fill={T.cyan} fillOpacity={0.06}
        />
      )}

      {/* ── PII underlines and tags ── */}
      {detectP > 0 && PII_ITEMS.map((item, i) => {
        const staggerOp = Math.min(1, (detectP - i * 0.12) * 4);
        if (staggerOp <= 0) return null;

        return (
          <g key={item.label} opacity={staggerOp}>
            {/* Underline at text position */}
            <line
              x1={TEXT_X + 24 + (i === 0 ? 220 : i === 1 ? 520 : 128)}
              y1={TEXT_Y + (i < 2 ? 70 : 106)}
              x2={TEXT_X + 24 + (i === 0 ? 220 : i === 1 ? 520 : 128) + (i === 0 ? 210 : i === 1 ? 100 : 150)}
              y2={TEXT_Y + (i < 2 ? 70 : 106)}
              stroke={item.color} strokeWidth="3"
              filter="url(#pd-glow-sm)"
            />
            {/* PII tag */}
            <rect x={item.tagX - 34} y={TAG_Y - 16} width={68} height={30} rx="15"
              fill={item.color} fillOpacity={0.2}
              stroke={item.color} strokeWidth="1.5"
              filter={hiPII ? "url(#pd-glow)" : undefined}
            />
            <text x={item.tagX} y={TAG_Y + 4} textAnchor="middle"
              fill={item.color} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="1">
              {item.label}
            </text>
            {/* Connector */}
            <line
              x1={item.tagX}
              y1={TEXT_Y + (i < 2 ? 72 : 108)}
              x2={item.tagX}
              y2={TAG_Y - 16}
              stroke={item.color} strokeWidth="1" strokeDasharray="3 3" opacity={0.5}
            />
          </g>
        );
      })}

      {/* ── Redacted output ── */}
      {redactP > 0 && (
        <g opacity={Math.min(1, redactP * 2)}>
          <rect x={TEXT_X} y={REDACT_Y} width={TEXT_W} height={TEXT_H} rx="14"
            fill={T.bgDeep} stroke={hiRedact ? T.mint : T.borderStrong} strokeWidth={hiRedact ? 2.5 : 2}
            filter={hiRedact ? "url(#pd-glow-sm)" : undefined}
          />
          <text x={TEXT_X + 24} y={REDACT_Y + 28} textAnchor="start"
            fill={T.mint} fontFamily={T.sans} fontSize="10" letterSpacing="2" opacity={0.7}>
            REDACTED OUTPUT
          </text>
          {/* Line 1 */}
          <text x={TEXT_X + 24} y={REDACT_Y + 62} textAnchor="start"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="14">
            Hi, contact me at
          </text>
          <text x={TEXT_X + 244} y={REDACT_Y + 62} textAnchor="start"
            fill={T.mint} fontFamily={T.mono} fontSize="14" fontWeight="700"
            filter="url(#pd-glow-sm)">
            [REDACTED]
          </text>
          <text x={TEXT_X + 394} y={REDACT_Y + 62} textAnchor="start"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="14">
            or call
          </text>
          <text x={TEXT_X + 476} y={REDACT_Y + 62} textAnchor="start"
            fill={T.mint} fontFamily={T.mono} fontSize="14" fontWeight="700"
            filter="url(#pd-glow-sm)">
            [REDACTED].
          </text>
          {/* Line 2 */}
          <text x={TEXT_X + 24} y={REDACT_Y + 98} textAnchor="start"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="14">
            My SSN is
          </text>
          <text x={TEXT_X + 152} y={REDACT_Y + 98} textAnchor="start"
            fill={T.mint} fontFamily={T.mono} fontSize="14" fontWeight="700"
            filter="url(#pd-glow-sm)">
            [REDACTED].
          </text>
        </g>
      )}

      {/* ── Done badge ── */}
      {redactP > 0.7 && (
        <g opacity={Math.min(1, (redactP - 0.7) * 3.3)}>
          <rect x={W / 2 - 180} y={618} width={360} height={50} rx="25"
            fill={T.mint} fillOpacity={0.14} stroke={T.mint} strokeWidth="2"
            filter="url(#pd-glow-sm)"
          />
          <text x={W / 2} y={649} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            3 PII FIELDS REDACTED  ✓
          </text>
        </g>
      )}
    </svg>
  );
};
