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

const EXAMPLES = [
  { src: "cat", tgt: "gato" },
  { src: "dog", tgt: "perro" },
  { src: "house", tgt: "casa" },
];

export const FewVsZeroDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelsIn    = p(frame, duration, 0.00, 0.18);
  const examplesP   = p(frame, duration, 0.18, 0.52);
  const taskIn      = p(frame, duration, 0.52, 0.68);
  const resultsIn   = p(frame, duration, 0.68, 0.88);
  const badgeIn     = p(frame, duration, 0.88, 1.00);

  const hiZero = hi("ZERO-SHOT");
  const hiFew  = hi("FEW-SHOT");

  const examplesVisible = Math.ceil(examplesP * EXAMPLES.length);

  const PX = 55, PW = 450, PH = 500, PY = 108;
  const LEFT_X  = PX;
  const RIGHT_X = W - PX - PW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="fvz-glow">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="fvz-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* LEFT panel — Zero-shot */}
      <g opacity={panelsIn}>
        <rect x={LEFT_X} y={PY} width={PW} height={PH} rx="18"
          fill={T.nodeFill} fillOpacity={0.55}
          stroke={hiZero ? T.amber : T.border}
          strokeWidth={hiZero ? 2.5 : 1.5}
          filter={hiZero ? "url(#fvz-glow-sm)" : undefined}
        />
        <rect x={LEFT_X} y={PY} width={PW} height={52} rx="18"
          fill={hiZero ? T.amber : T.cyan} fillOpacity={0.15}
        />
        <rect x={LEFT_X} y={PY + 26} width={PW} height={26}
          fill={hiZero ? T.amber : T.cyan} fillOpacity={0.08}
        />
        <text x={LEFT_X + PW / 2} y={PY + 32} textAnchor="middle"
          fill={hiZero ? T.amber : T.cyan}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3">
          ZERO-SHOT
        </text>
      </g>

      {/* Zero-shot content: just the task */}
      <g opacity={taskIn}>
        <rect x={LEFT_X + 24} y={PY + 68} width={PW - 48} height={44} rx="10"
          fill={T.cyan} fillOpacity={0.10} stroke={T.cyan} strokeWidth="1"
        />
        <text x={LEFT_X + PW / 2} y={PY + 89} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11" fontWeight="600">
          System: "You are a translator."
        </text>
        <text x={LEFT_X + PW / 2} y={PY + 104} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11">
          User: Translate: hello → ?
        </text>
      </g>

      {/* Zero-shot result */}
      {resultsIn > 0 && (
        <g opacity={Math.min(1, resultsIn * 2)}>
          <rect x={LEFT_X + 80} y={PY + 148} width={PW - 160} height={68} rx="12"
            fill={T.amber} fillOpacity={0.12} stroke={T.amber} strokeWidth="1.5"
          />
          <text x={LEFT_X + PW / 2} y={PY + 177} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="11" letterSpacing="1">
            OUTPUT
          </text>
          <text x={LEFT_X + PW / 2} y={PY + 202} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="20" fontWeight="800">
            hola
          </text>
          <text x={LEFT_X + PW / 2} y={PY + 252} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="2">
            LOW CONFIDENCE ON HARDER EXAMPLES
          </text>
        </g>
      )}

      {/* RIGHT panel — Few-shot */}
      <g opacity={panelsIn}>
        <rect x={RIGHT_X} y={PY} width={PW} height={PH} rx="18"
          fill={T.nodeFill} fillOpacity={0.55}
          stroke={hiFew ? T.mint : T.border}
          strokeWidth={hiFew ? 2.5 : 1.5}
          filter={hiFew ? "url(#fvz-glow-sm)" : undefined}
        />
        <rect x={RIGHT_X} y={PY} width={PW} height={52} rx="18"
          fill={hiFew ? T.mint : T.violet} fillOpacity={0.15}
        />
        <rect x={RIGHT_X} y={PY + 26} width={PW} height={26}
          fill={hiFew ? T.mint : T.violet} fillOpacity={0.08}
        />
        <text x={RIGHT_X + PW / 2} y={PY + 32} textAnchor="middle"
          fill={hiFew ? T.mint : T.violet}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3">
          FEW-SHOT
        </text>
      </g>

      {/* Few-shot examples */}
      {EXAMPLES.slice(0, examplesVisible).map((ex, i) => (
        <g key={i} opacity={Math.min(1, (examplesP * EXAMPLES.length - i) * 1.5)}>
          <rect x={RIGHT_X + 24} y={PY + 68 + i * 58} width={PW - 48} height={44} rx="9"
            fill={T.violet} fillOpacity={0.10} stroke={T.violet} strokeWidth="1"
          />
          <text x={RIGHT_X + 44} y={PY + 86 + i * 58}
            fill={T.textDim} fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="2">
            EXAMPLE {i + 1}
          </text>
          <text x={RIGHT_X + PW / 2} y={PY + 104 + i * 58} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="13" fontWeight="700">
            {ex.src} → {ex.tgt}
          </text>
        </g>
      ))}

      {/* Task line (right) */}
      {taskIn > 0 && (
        <g opacity={taskIn}>
          <rect x={RIGHT_X + 24} y={PY + 68 + 3 * 58} width={PW - 48} height={44} rx="10"
            fill={T.mint} fillOpacity={0.10} stroke={T.mint} strokeWidth="1.5"
          />
          <text x={RIGHT_X + 44} y={PY + 86 + 3 * 58}
            fill={T.mint} fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="2">
            TASK
          </text>
          <text x={RIGHT_X + PW / 2} y={PY + 104 + 3 * 58} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">
            hello → ?
          </text>
        </g>
      )}

      {/* Few-shot result */}
      {resultsIn > 0 && (
        <g opacity={Math.min(1, resultsIn * 2)}>
          <rect x={RIGHT_X + 80} y={PY + 310} width={PW - 160} height={68} rx="12"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2"
            filter="url(#fvz-glow-sm)"
          />
          <text x={RIGHT_X + PW / 2} y={PY + 338} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="11" letterSpacing="1">
            OUTPUT
          </text>
          <text x={RIGHT_X + PW / 2} y={PY + 363} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="20" fontWeight="800">
            hola
          </text>
          <text x={RIGHT_X + PW / 2} y={PY + 414} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="10" letterSpacing="2">
            HIGH CONFIDENCE — PATTERN CONDITIONED
          </text>
        </g>
      )}

      {/* VS divider */}
      <g opacity={panelsIn}>
        <line x1={W / 2} y1={PY + 20} x2={W / 2} y2={PY + PH - 20}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4"
        />
        <text x={W / 2} y={PY + PH / 2 + 6} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="14" fontWeight="900" letterSpacing="2">
          VS
        </text>
      </g>

      {/* Bottom badge */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 250} y={628} width={500} height={48} rx="24"
            fill={T.violet} fillOpacity={0.12} stroke={T.violet} strokeWidth="2"
            filter="url(#fvz-glow-sm)"
          />
          <text x={W / 2} y={658} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            EXAMPLES CONDITION THE MODEL
          </text>
        </g>
      )}
    </svg>
  );
};
