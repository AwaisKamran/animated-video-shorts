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

const LAYERS = [
  { x: 200, neurons: 3, label: "INPUT" },
  { x: 480, neurons: 4, label: "HIDDEN" },
  { x: 760, neurons: 2, label: "OUTPUT" },
];
const R = 26;
const CY = 330;

function getNeuronY(n: number, i: number): number {
  const spacing = 110;
  const totalH = (n - 1) * spacing;
  return CY - totalH / 2 + i * spacing;
}

// Pseudo-random gradient magnitudes for visual variety
const GRAD_MAGNITUDES = [
  [0.9, 0.3, 0.7, 0.5],
  [0.4, 0.8, 0.6, 0.2],
  [0.7, 0.5, 0.9, 0.3],
];

export const BackpropDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const fadeIn      = p(frame, duration, 0.00, 0.15);
  const lossAppear  = p(frame, duration, 0.15, 0.35);
  const gradWave    = p(frame, duration, 0.35, 0.80);
  const weightsUpd  = p(frame, duration, 0.80, 1.00);

  const highlightGrad = hi("GRADIENT");
  const highlightLoss = hi("LOSS");

  // Gradient wave goes right to left: layer 2 (output) → layer 1 (hidden) → layer 0 (input)
  // gradWave=0 means at output, gradWave=1 means all done
  const gradLayer2 = p(frame, duration, 0.35, 0.50); // output layer glows
  const gradLayer1 = p(frame, duration, 0.50, 0.68); // hidden layer glows
  const gradLayer0 = p(frame, duration, 0.68, 0.80); // input layer glows

  const layerGrads = [gradLayer0, gradLayer1, gradLayer2];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="bp-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bp-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Connection lines */}
      <g opacity={fadeIn}>
        {LAYERS.slice(0, -1).map((layer, li) => {
          const nextLayer = LAYERS[li + 1];
          return Array.from({ length: layer.neurons }).map((_, ai) =>
            Array.from({ length: nextLayer.neurons }).map((_, bi) => {
              const mag = GRAD_MAGNITUDES[li]?.[ai] ?? 0.5;
              const gradP = layerGrads[li + 1];
              const isGradActive = gradP > 0.2;
              const strokeW = isGradActive ? 1 + mag * 3 : 1.2;
              const strokeColor = isGradActive ? T.coral : T.border;
              return (
                <line key={`${li}-${ai}-${bi}`}
                  x1={layer.x + R} y1={getNeuronY(layer.neurons, ai)}
                  x2={nextLayer.x - R} y2={getNeuronY(nextLayer.neurons, bi)}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  opacity={isGradActive ? (highlightGrad ? 0.85 : 0.55) : 0.2}
                />
              );
            })
          );
        })}
      </g>

      {/* Neurons */}
      {LAYERS.map((layer, li) => {
        const gradP = layerGrads[li];
        const isGlowing = gradP > 0.3;

        return (
          <g key={li}>
            <text x={layer.x} y={getNeuronY(layer.neurons, layer.neurons - 1) + R + 36}
              textAnchor="middle" fill={T.textDim} fontFamily={T.sans}
              fontSize="13" fontWeight="600" letterSpacing="1.5" opacity={fadeIn}>
              {layer.label}
            </text>

            {Array.from({ length: layer.neurons }).map((_, ni) => {
              const cx = layer.x;
              const cy = getNeuronY(layer.neurons, ni);
              const strokeColor = isGlowing ? T.coral : T.nodeBorder;
              const fillColor = isGlowing ? `${T.coral}22` : T.nodeFill;

              return (
                <g key={ni} opacity={fadeIn}>
                  <circle cx={cx} cy={cy} r={R}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isGlowing ? 2.2 : 1.5}
                    filter={isGlowing && (highlightGrad || gradP > 0.5) ? "url(#bp-glow-sm)" : undefined}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* LOSS circle at output */}
      {lossAppear > 0 && (
        <g opacity={lossAppear}>
          <circle cx={LAYERS[2].x + 120} cy={CY} r={38}
            fill={`${T.coral}22`}
            stroke={highlightLoss ? "#FF6688" : T.coral}
            strokeWidth="2.5"
            filter={highlightLoss ? "url(#bp-glow)" : "url(#bp-glow-sm)"}
          />
          <text x={LAYERS[2].x + 120} y={CY - 2} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1">
            LOSS
          </text>
          <text x={LAYERS[2].x + 120} y={CY + 16} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="11">
            2.47
          </text>
          {/* Line from output to loss node */}
          <line x1={LAYERS[2].x + R} y1={CY} x2={LAYERS[2].x + 82} y2={CY}
            stroke={T.coral} strokeWidth="1.5" opacity="0.6" />
        </g>
      )}

      {/* Gradient flow arrows (right to left) */}
      {gradWave > 0 && (
        <g>
          {[{ fromX: LAYERS[2].x, toX: LAYERS[1].x, p: gradLayer1 },
            { fromX: LAYERS[1].x, toX: LAYERS[0].x, p: gradLayer0 }].map((seg, i) => {
            if (seg.p <= 0) return null;
            const arrowX = seg.fromX - R - (seg.fromX - seg.toX - R * 2) * Math.min(seg.p, 1);
            return (
              <g key={i} opacity={Math.min(seg.p * 2, 1)}>
                <circle cx={arrowX} cy={CY} r={8}
                  fill={T.coral} filter="url(#bp-glow-sm)" />
              </g>
            );
          })}
        </g>
      )}

      {/* Weight update indicators */}
      {weightsUpd > 0 && (
        <g opacity={weightsUpd}>
          {LAYERS.slice(0, -1).map((layer, li) => {
            const midX = (layer.x + LAYERS[li + 1].x) / 2;
            const signs = ["↑", "↓", "↑", "↓"];
            return Array.from({ length: Math.min(layer.neurons, 4) }).map((_, ni) => {
              const midY = getNeuronY(layer.neurons, ni);
              return (
                <text key={`${li}-${ni}`} x={midX} y={midY - 8} textAnchor="middle"
                  fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="800">
                  {signs[ni % 4]}
                </text>
              );
            });
          })}

          <rect x={W / 2 - 120} y={620} width={240} height={40} rx="20" fill={T.mint} opacity={0.12} />
          <text x={W / 2} y={645} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="700" letterSpacing="2">
            WEIGHTS UPDATED
          </text>
        </g>
      )}
    </svg>
  );
};
