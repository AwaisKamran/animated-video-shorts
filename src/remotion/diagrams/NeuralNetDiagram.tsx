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

// Layer definitions: [x, neurons]
const LAYERS = [
  { x: 160,  neurons: 4, label: "INPUT" },
  { x: 390,  neurons: 5, label: "HIDDEN 1" },
  { x: 620,  neurons: 4, label: "HIDDEN 2" },
  { x: 850,  neurons: 2, label: "OUTPUT" },
];
const R = 24;
const CY = 340;

function getNeuronY(layerNeurons: number, i: number): number {
  const spacing = 110;
  const totalH = (layerNeurons - 1) * spacing;
  return CY - totalH / 2 + i * spacing;
}

export const NeuralNetDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const fadeIn      = p(frame, duration, 0.0, 0.2);
  const waveP       = p(frame, duration, 0.2, 0.7);
  const outputGlow  = p(frame, duration, 0.7, 0.9);
  const labelFade   = p(frame, duration, 0.9, 1.0);

  const highlightNeuron = hi("NEURON");
  const highlightLayer  = hi("LAYER");
  const highlightAct    = hi("ACTIVATION");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="nn-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="nn-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Layer column backgrounds (highlight for LAYER keyterm) */}
      {highlightLayer && LAYERS.map((layer, li) => {
        const n = layer.neurons;
        const top = getNeuronY(n, 0) - R - 16;
        const bot = getNeuronY(n, n - 1) + R + 16;
        return (
          <rect key={li} x={layer.x - 50} y={top} width={100} height={bot - top} rx="12"
            fill={T.violet} opacity={0.08 * fadeIn} />
        );
      })}

      {/* Connection lines */}
      <g opacity={fadeIn}>
        {LAYERS.slice(0, -1).map((layer, li) => {
          const nextLayer = LAYERS[li + 1];
          return layer.neurons > 0 && Array.from({ length: layer.neurons }).map((_, ai) => {
            return Array.from({ length: nextLayer.neurons }).map((_, bi) => {
              const x1 = layer.x + R;
              const y1 = getNeuronY(layer.neurons, ai);
              const x2 = nextLayer.x - R;
              const y2 = getNeuronY(nextLayer.neurons, bi);

              // Wave activation: each connection lights up as the wave passes
              const layerFrac = li / (LAYERS.length - 1);
              const connActivation = p(frame, duration,
                0.2 + layerFrac * 0.4,
                0.2 + layerFrac * 0.4 + 0.12
              );
              const isActive = connActivation > 0.3;
              const connColor = isActive ? T.cyan : T.border;
              const connWidth = isActive ? (highlightAct ? 2.5 : 1.8) : 1;

              return (
                <line key={`${li}-${ai}-${bi}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={connColor}
                  strokeWidth={connWidth}
                  opacity={isActive ? 0.7 : 0.25}
                />
              );
            });
          });
        })}
      </g>

      {/* Neurons */}
      {LAYERS.map((layer, li) => {
        const layerFrac = li / (LAYERS.length - 1);
        const activationP = p(frame, duration,
          0.2 + layerFrac * 0.4,
          0.2 + layerFrac * 0.4 + 0.15
        );
        const isOutput = li === LAYERS.length - 1;

        return (
          <g key={li}>
            {/* Layer label */}
            <text x={layer.x} y={getNeuronY(layer.neurons, layer.neurons - 1) + R + 36}
              textAnchor="middle" fill={T.textDim} fontFamily={T.sans}
              fontSize="13" fontWeight="600" letterSpacing="1.5"
              opacity={fadeIn}>
              {layer.label}
            </text>

            {Array.from({ length: layer.neurons }).map((_, ni) => {
              const cx = layer.x;
              const cy = getNeuronY(layer.neurons, ni);
              const isActivated = activationP > 0.4;
              const isOutputWinner = isOutput && ni === 0 && outputGlow > 0;

              let strokeColor: string = T.nodeBorder;
              let fillColor: string = T.nodeFill;
              let glowFilter: string | undefined = undefined;

              if (isOutputWinner) {
                strokeColor = T.mint;
                fillColor = `${T.mint}33`;
                glowFilter = "url(#nn-glow)";
              } else if (isActivated) {
                strokeColor = highlightNeuron ? "#00EFFF" : T.cyan;
                fillColor = `${T.cyan}25`;
                glowFilter = highlightAct ? "url(#nn-glow)" : "url(#nn-glow-sm)";
              } else if (highlightNeuron && fadeIn > 0.5) {
                strokeColor = T.cyan;
              }

              return (
                <g key={ni} opacity={fadeIn}>
                  <circle cx={cx} cy={cy} r={R}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isActivated || isOutputWinner ? 2.2 : 1.5}
                    filter={glowFilter}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Output prediction label */}
      {outputGlow > 0 && (
        <g opacity={outputGlow}>
          <rect x={870} y={getNeuronY(2, 0) - 20} width={180} height={36} rx="18"
            fill={T.mint} opacity={0.15} />
          <text x={960} y={getNeuronY(2, 0) + 4} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="13" fontWeight="700">
            Cat 94%
          </text>
          <text x={960} y={getNeuronY(2, 1) + 4} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="13">
            Dog 6%
          </text>
          <text x={960} y={getNeuronY(2, 0) - 30} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="1">
            PREDICTION
          </text>
        </g>
      )}

      {/* Bottom label */}
      {labelFade > 0 && (
        <g opacity={labelFade}>
          <text x={W / 2} y={650} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="16" fontWeight="700" letterSpacing="3">
            FORWARD PASS
          </text>
        </g>
      )}
    </svg>
  );
};
