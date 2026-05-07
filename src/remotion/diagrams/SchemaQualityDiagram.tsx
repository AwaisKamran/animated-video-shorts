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

const INDENT = 18;

// Vague schema lines
const VAGUE_LINES = [
  { text: "{",                     indent: 0 },
  { text: '"name": "search",',     indent: 1 },
  { text: '"description":',        indent: 1 },
  { text: '"search"',              indent: 2 },
  { text: "}",                     indent: 0 },
];

// Specific schema lines
const SPECIFIC_LINES = [
  { text: "{",                                indent: 0 },
  { text: '"name": "search_web",',            indent: 1 },
  { text: '"description":',                   indent: 1 },
  { text: '"Search the web for recent',       indent: 2 },
  { text: ' articles. Returns top 5',         indent: 2 },
  { text: ' results with title, url,',        indent: 2 },
  { text: ' snippet.",',                      indent: 2 },
  { text: '"parameters": {',                  indent: 1 },
  { text: '"query": "string (required)",',    indent: 2 },
  { text: '"limit": "number (default 5)"',    indent: 2 },
  { text: "}",                               indent: 1 },
  { text: "}",                               indent: 0 },
];

const VAGUE_X  = 60;
const SPEC_X   = 560;
const PANEL_Y  = 90;
const VAGUE_PW = 380;
const SPEC_PW  = 460;
const PANEL_H  = 320;

const METER_Y  = 440;
const METER_H  = 28;
const METER_W  = 300;

export const SchemaQualityDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const vagueIn    = p(frame, duration, 0.00, 0.18);
  const vagueMeter = p(frame, duration, 0.18, 0.34);
  const specIn     = p(frame, duration, 0.36, 0.58);
  const specMeter  = p(frame, duration, 0.58, 0.74);
  const compareIn  = p(frame, duration, 0.78, 1.00);

  const hiSchema   = hi("SCHEMA");
  const hiAccuracy = hi("ACCURACY");

  const vagueLines  = Math.floor(vagueIn  * VAGUE_LINES.length);
  const specLines   = Math.floor(specIn   * SPECIFIC_LINES.length);

  const vagueAccuracy = 60;
  const specAccuracy  = 95;

  // Pulsing for highlighted panels
  const vaguePulse = hiSchema ? 0.7 + 0.3 * Math.sin(frame * 0.4) : 1;
  const specPulse  = hiSchema ? 0.7 + 0.3 * Math.sin(frame * 0.4 + Math.PI) : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sq-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sq-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── VAGUE panel ── */}
      {vagueIn > 0 && (
        <g opacity={vagueIn * vaguePulse}>
          <rect x={VAGUE_X} y={PANEL_Y} width={VAGUE_PW} height={PANEL_H} rx="18"
            fill={T.bgDeep}
            stroke={hiSchema ? T.coral : T.borderStrong}
            strokeWidth={hiSchema ? 2.5 : 1.5}
            filter={hiSchema ? "url(#sq-glow-sm)" : undefined}
          />
          {/* "VAGUE" label */}
          <rect x={VAGUE_X + VAGUE_PW / 2 - 44} y={PANEL_Y - 18} width={88} height={30} rx="15"
            fill={`${T.coral}22`} stroke={T.coral} strokeWidth="1.5" />
          <text x={VAGUE_X + VAGUE_PW / 2} y={PANEL_Y - 18 + 20} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="12" fontWeight="800" letterSpacing="2">
            VAGUE
          </text>
          {/* Code lines */}
          {VAGUE_LINES.slice(0, vagueLines).map((line, i) => (
            <text key={i}
              x={VAGUE_X + 22 + line.indent * INDENT}
              y={PANEL_Y + 46 + i * 46}
              textAnchor="start"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="13">
              {line.text}
            </text>
          ))}
        </g>
      )}

      {/* ── Vague accuracy meter ── */}
      {vagueMeter > 0 && (
        <g opacity={vagueMeter}>
          <text x={VAGUE_X} y={METER_Y - 14} textAnchor="start"
            fill={hiAccuracy ? T.coral : T.textDim}
            fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
            filter={hiAccuracy ? "url(#sq-glow-sm)" : undefined}>
            ACCURACY
          </text>
          {/* Background */}
          <rect x={VAGUE_X} y={METER_Y} width={METER_W} height={METER_H} rx="14"
            fill={T.bgDeep} stroke={T.border} strokeWidth="1.5" />
          {/* Fill */}
          <rect x={VAGUE_X} y={METER_Y} width={METER_W * (vagueAccuracy / 100) * vagueMeter} height={METER_H} rx="14"
            fill={T.coral} fillOpacity={hiAccuracy ? 0.85 : 0.65}
            filter={hiAccuracy ? "url(#sq-glow-sm)" : undefined}
          />
          {/* Label */}
          <text x={VAGUE_X + METER_W + 12} y={METER_Y + METER_H / 2 + 6} textAnchor="start"
            fill={T.coral} fontFamily={T.mono} fontSize="16" fontWeight="700"
            filter={hiAccuracy ? "url(#sq-glow-sm)" : undefined}>
            {vagueAccuracy}%
          </text>
        </g>
      )}

      {/* ── SPECIFIC panel ── */}
      {specIn > 0 && (
        <g opacity={specIn * specPulse}>
          <rect x={SPEC_X} y={PANEL_Y} width={SPEC_PW} height={PANEL_H + 50} rx="18"
            fill={T.bgDeep}
            stroke={hiSchema ? T.mint : T.borderStrong}
            strokeWidth={hiSchema ? 2.5 : 1.5}
            filter={hiSchema ? "url(#sq-glow-sm)" : undefined}
          />
          {/* "SPECIFIC" label */}
          <rect x={SPEC_X + SPEC_PW / 2 - 52} y={PANEL_Y - 18} width={104} height={30} rx="15"
            fill={`${T.mint}22`} stroke={T.mint} strokeWidth="1.5" />
          <text x={SPEC_X + SPEC_PW / 2} y={PANEL_Y - 18 + 20} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="12" fontWeight="800" letterSpacing="2">
            SPECIFIC
          </text>
          {/* Code lines */}
          {SPECIFIC_LINES.slice(0, specLines).map((line, i) => (
            <text key={i}
              x={SPEC_X + 22 + line.indent * INDENT}
              y={PANEL_Y + 38 + i * 30}
              textAnchor="start"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="11.5">
              {line.text}
            </text>
          ))}
        </g>
      )}

      {/* ── Specific accuracy meter ── */}
      {specMeter > 0 && (
        <g opacity={specMeter}>
          <text x={SPEC_X} y={METER_Y - 14} textAnchor="start"
            fill={hiAccuracy ? T.mint : T.textDim}
            fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
            filter={hiAccuracy ? "url(#sq-glow-sm)" : undefined}>
            ACCURACY
          </text>
          {/* Background */}
          <rect x={SPEC_X} y={METER_Y} width={METER_W} height={METER_H} rx="14"
            fill={T.bgDeep} stroke={T.border} strokeWidth="1.5" />
          {/* Fill */}
          <rect x={SPEC_X} y={METER_Y} width={METER_W * (specAccuracy / 100) * specMeter} height={METER_H} rx="14"
            fill={T.mint} fillOpacity={hiAccuracy ? 0.9 : 0.70}
            filter={hiAccuracy ? "url(#sq-glow-sm)" : undefined}
          />
          {/* Label */}
          <text x={SPEC_X + METER_W + 12} y={METER_Y + METER_H / 2 + 6} textAnchor="start"
            fill={T.mint} fontFamily={T.mono} fontSize="16" fontWeight="700"
            filter={hiAccuracy ? "url(#sq-glow-sm)" : undefined}>
            {specAccuracy}%
          </text>
        </g>
      )}

      {/* ── Divider arrow between panels ── */}
      {specIn > 0.5 && (
        <g opacity={interpolate(specIn, [0.5, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <text x={W / 2 - 10} y={PANEL_Y + PANEL_H / 2 + 10} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="28" fontWeight="900">
            →
          </text>
        </g>
      )}

      {/* ── Bottom comparison message ── */}
      {compareIn > 0 && (
        <g opacity={compareIn}>
          <rect x={W / 2 - 300} y={520} width={600} height={54} rx="27"
            fill={`${T.amber}14`}
            stroke={T.amber} strokeWidth="2.5"
            filter="url(#sq-glow)"
          />
          <text x={W / 2} y={554} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2"
            filter="url(#sq-glow-sm)">
            BETTER SCHEMA = BETTER CALLS
          </text>
        </g>
      )}

      {/* ── Accuracy delta label ── */}
      {compareIn > 0.5 && (
        <text x={W / 2} y={600} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="12"
          opacity={interpolate(compareIn, [0.5, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          60% accuracy → 95% accuracy  (+35% improvement)
        </text>
      )}
    </svg>
  );
};
