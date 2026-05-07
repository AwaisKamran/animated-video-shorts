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

const NEURON_X = 540, NEURON_Y = 310, NEURON_R = 70;
const INPUT_X = 180;
const INPUTS = [
  { label: "x₁", y: 200, w: "w₁" },
  { label: "x₂", y: 310, w: "w₂" },
  { label: "x₃", y: 420, w: "w₃" },
];
const BIAS_X = 400, BIAS_Y = 520;
const OUTPUT_X = 900;

export const PerceptronDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const inputsIn  = p(frame, duration, 0.00, 0.25);
  const weightsIn = p(frame, duration, 0.25, 0.50);
  const sumIn     = p(frame, duration, 0.50, 0.70);
  const actIn     = p(frame, duration, 0.70, 0.85);
  const formulaIn = p(frame, duration, 0.85, 1.00);

  const hiWeight = hi("WEIGHT");
  const hiBias   = hi("BIAS");
  const hiAct    = hi("ACTIVATION");
  const hiPerc   = hi("PERCEPTRON");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pc-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Neuron circle */}
      <g opacity={inputsIn}>
        <circle cx={NEURON_X} cy={NEURON_Y} r={NEURON_R}
          fill={T.nodeFill}
          stroke={hiAct ? T.cyan : hiPerc ? T.violet : T.nodeBorder}
          strokeWidth={hiAct || hiPerc ? 2.5 : 1.5}
          filter={hiAct || hiPerc ? "url(#pc-glow)" : undefined}
        />
        {/* Sum symbol */}
        <text x={NEURON_X - 18} y={NEURON_Y + 10} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="28" fontWeight="700">
          Σ
        </text>
        {/* Activation symbol */}
        <text x={NEURON_X + 22} y={NEURON_Y + 10} textAnchor="middle"
          fill={hiAct ? T.cyan : T.textDim} fontFamily={T.mono} fontSize="22" fontWeight="700"
          filter={hiAct ? "url(#pc-glow-sm)" : undefined}>
          f
        </text>
        <line x1={NEURON_X} y1={NEURON_Y - NEURON_R + 10} x2={NEURON_X} y2={NEURON_Y + NEURON_R - 10}
          stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="4 3" />
      </g>

      {/* Input nodes + lines */}
      {INPUTS.map((inp, i) => {
        const lineAlpha = Math.max(0, Math.min(1, weightsIn * 3 - i));
        return (
          <g key={i} opacity={inputsIn}>
            {/* Input circle */}
            <circle cx={INPUT_X} cy={inp.y} r="28"
              fill={T.nodeFill} stroke={T.nodeBorder} strokeWidth="1.5" />
            <text x={INPUT_X} y={inp.y + 7} textAnchor="middle"
              fill={T.cyan} fontFamily={T.mono} fontSize="20" fontWeight="700">
              {inp.label}
            </text>

            {/* Connection line */}
            <line x1={INPUT_X + 28} y1={inp.y}
                  x2={NEURON_X - NEURON_R} y2={NEURON_Y}
              stroke={weightsIn > 0 ? T.cyan : T.border}
              strokeWidth={hiWeight && lineAlpha > 0 ? 2.5 : 1.5}
              strokeOpacity={lineAlpha > 0.3 ? 0.8 : 0.3}
              filter={hiWeight && lineAlpha > 0.5 ? "url(#pc-glow-sm)" : undefined}
            />

            {/* Weight label */}
            {weightsIn > 0 && (
              <g opacity={lineAlpha}>
                <rect
                  x={(INPUT_X + 28 + NEURON_X - NEURON_R) / 2 - 22}
                  y={(inp.y + NEURON_Y) / 2 - 16}
                  width={44} height={26} rx="13"
                  fill={hiWeight ? T.cyan : T.bgDeep}
                  fillOpacity={hiWeight ? 0.2 : 1}
                  stroke={hiWeight ? T.cyan : T.borderStrong} strokeWidth="1"
                />
                <text
                  x={(INPUT_X + 28 + NEURON_X - NEURON_R) / 2}
                  y={(inp.y + NEURON_Y) / 2 + 4}
                  textAnchor="middle"
                  fill={hiWeight ? T.cyan : T.textSecondary}
                  fontFamily={T.mono} fontSize="14" fontWeight="700"
                  filter={hiWeight ? "url(#pc-glow-sm)" : undefined}
                >
                  {inp.w}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Bias node */}
      <g opacity={inputsIn}>
        <circle cx={BIAS_X} cy={BIAS_Y} r="24"
          fill={hiBias ? T.amber : T.nodeFill} fillOpacity={hiBias ? 0.25 : 1}
          stroke={hiBias ? T.amber : T.nodeBorder} strokeWidth={hiBias ? 2.5 : 1.5}
          filter={hiBias ? "url(#pc-glow)" : undefined}
        />
        <text x={BIAS_X} y={BIAS_Y + 6} textAnchor="middle"
          fill={hiBias ? T.amber : T.textSecondary} fontFamily={T.mono} fontSize="16" fontWeight="700"
          filter={hiBias ? "url(#pc-glow)" : undefined}>
          b
        </text>
        <line x1={BIAS_X + 24} y1={BIAS_Y - 8}
              x2={NEURON_X - 30} y2={NEURON_Y + NEURON_R - 20}
          stroke={hiBias ? T.amber : T.border} strokeWidth={hiBias ? 2 : 1}
          strokeOpacity={hiBias ? 0.8 : 0.4}
        />
      </g>

      {/* Sum formula */}
      {sumIn > 0 && (
        <g opacity={sumIn}>
          <text x={NEURON_X} y={NEURON_Y + NEURON_R + 48} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="13">
            x₁w₁ + x₂w₂ + x₃w₃ + b
          </text>
        </g>
      )}

      {/* Output line */}
      <g opacity={inputsIn}>
        <line x1={NEURON_X + NEURON_R} y1={NEURON_Y}
              x2={OUTPUT_X} y2={NEURON_Y}
          stroke={actIn > 0.5 ? T.mint : T.border}
          strokeWidth={actIn > 0.5 ? 2.5 : 1.5}
          filter={actIn > 0.5 ? "url(#pc-glow)" : undefined}
        />
        {actIn > 0.5 && (
          <g opacity={(actIn - 0.5) * 2}>
            <circle cx={OUTPUT_X + 24} cy={NEURON_Y} r="22"
              fill={T.mint} fillOpacity={0.2} stroke={T.mint} strokeWidth="2" filter="url(#pc-glow)" />
            <text x={OUTPUT_X + 24} y={NEURON_Y - 4} textAnchor="middle"
              fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="800">ŷ</text>
            <text x={OUTPUT_X + 24} y={NEURON_Y + 12} textAnchor="middle"
              fill={T.mint} fontFamily={T.mono} fontSize="10">out</text>
          </g>
        )}
      </g>

      {/* Bottom formula */}
      {formulaIn > 0 && (
        <g opacity={formulaIn}>
          <rect x={W / 2 - 160} y={600} width={320} height={52} rx="26"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
          <text x={W / 2} y={630} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="18" fontWeight="700">
            y = f(Σwᵢxᵢ + b)
          </text>
        </g>
      )}
    </svg>
  );
};
