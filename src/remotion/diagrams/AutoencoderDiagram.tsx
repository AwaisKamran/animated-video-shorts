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

// Layer definitions: [neuron count, x position]
const LAYERS = [
  { count: 6, x: 150,  label: "Input",    width: 36 },
  { count: 4, x: 290,  label: "Enc 4",    width: 32 },
  { count: 2, x: 410,  label: "Enc 2",    width: 32 },
  { count: 2, x: 540,  label: "LATENT",   width: 32, isBottleneck: true },
  { count: 4, x: 660,  label: "Dec 4",    width: 32 },
  { count: 6, x: 800,  label: "Output",   width: 36 },
];

const CY = 350; // center Y
const V_GAP = 68; // vertical gap between neurons

function getNeuronY(layerCount: number, idx: number): number {
  return CY - ((layerCount - 1) / 2) * V_GAP + idx * V_GAP;
}

export const AutoencoderDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn     = p(frame, duration, 0.00, 0.15);
  const encodeIn    = p(frame, duration, 0.15, 0.45);
  const latentIn    = p(frame, duration, 0.45, 0.65);
  const decodeIn    = p(frame, duration, 0.65, 0.85);
  const compareIn   = p(frame, duration, 0.85, 1.00);

  const hiLatent   = hi("LATENT");
  const hiEncoder  = hi("ENCODER");
  const hiDecoder  = hi("DECODER");
  const hiCompress = hi("COMPRESS");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ae-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ae-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Original image box */}
      <g opacity={nodesIn}>
        <rect x={40} y={CY - 60} width={80} height={80} rx="8"
          fill={T.amber} fillOpacity={0.25}
          stroke={T.amber} strokeWidth="2"
        />
        {/* Simple grid to represent image */}
        {[0,1,2,3].map(row => [0,1,2,3].map(col => (
          <rect key={`${row}-${col}`}
            x={44 + col * 18} y={CY - 56 + row * 18} width={14} height={14} rx="2"
            fill={T.amber}
            fillOpacity={((row + col) % 2 === 0) ? 0.6 : 0.2}
          />
        )))}
        <text x={80} y={CY + 36} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="12" fontWeight="600">original</text>
      </g>

      {/* Connections between layers (draw lightly) */}
      {nodesIn > 0 && LAYERS.slice(0, -1).map((layer, li) => {
        const nextLayer = LAYERS[li + 1];
        const isEncoding = li < 2;
        const isDecoding = li >= 3;
        const waveProgress = isEncoding ? encodeIn : (isDecoding ? decodeIn : latentIn);
        if (waveProgress <= 0) return null;
        const color = isEncoding ? T.cyan : (isDecoding ? T.mint : T.violet);
        return (
          <g key={`conn-${li}`} opacity={Math.min(waveProgress, 0.35)}>
            {Array.from({ length: layer.count }).map((_, i) =>
              Array.from({ length: nextLayer.count }).map((_, j) => (
                <line key={`${i}-${j}`}
                  x1={layer.x} y1={getNeuronY(layer.count, i)}
                  x2={nextLayer.x} y2={getNeuronY(nextLayer.count, j)}
                  stroke={color} strokeWidth="0.8"
                />
              ))
            )}
          </g>
        );
      })}

      {/* Neuron circles */}
      {LAYERS.map((layer, li) => {
        const isEncoder = li <= 2;
        const isDecoder = li >= 3;
        const isBottleneck = (layer as { isBottleneck?: boolean }).isBottleneck;
        const waveProgress = isEncoder ? encodeIn : (isDecoder ? decodeIn : 0);
        const showNode = li === 0 ? nodesIn : waveProgress;
        if (showNode <= 0) return null;

        let color: string = T.textSecondary;
        if (isEncoder && encodeIn > 0) color = T.cyan;
        if (isDecoder && decodeIn > 0) color = T.mint;
        if (isBottleneck && latentIn > 0) color = T.violet;

        return (
          <g key={`layer-${li}`} opacity={Math.min(showNode * 2, 1)}>
            {Array.from({ length: layer.count }).map((_, i) => (
              <circle key={i}
                cx={layer.x} cy={getNeuronY(layer.count, i)}
                r={layer.width / 2}
                fill={color} fillOpacity={0.75}
                stroke={color} strokeWidth="1.5"
                filter={isBottleneck && latentIn > 0 ? "url(#ae-glow)" : undefined}
              />
            ))}
            <text x={layer.x} y={CY + 240} textAnchor="middle"
              fill={isBottleneck ? T.violet : T.textDim}
              fontFamily={T.sans} fontSize={isBottleneck ? "14" : "12"}
              fontWeight={isBottleneck ? "800" : "600"} letterSpacing="0.5">
              {layer.label}
            </text>
          </g>
        );
      })}

      {/* Encoder label bracket */}
      {encodeIn > 0.3 && (
        <g opacity={Math.min((encodeIn - 0.3) / 0.4, 1)}>
          <rect x={120} y={80} width={290} height={36} rx="8"
            fill={hiEncoder ? T.cyan : T.bgDeep} fillOpacity={hiEncoder ? 0.2 : 1}
            stroke={T.cyan} strokeWidth="1.5"
            filter={hiEncoder ? "url(#ae-glow-sm)" : undefined}
          />
          <text x={265} y={104} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
            ENCODER
          </text>
        </g>
      )}

      {/* Decoder label bracket */}
      {decodeIn > 0.3 && (
        <g opacity={Math.min((decodeIn - 0.3) / 0.4, 1)}>
          <rect x={530} y={80} width={290} height={36} rx="8"
            fill={hiDecoder ? T.mint : T.bgDeep} fillOpacity={hiDecoder ? 0.2 : 1}
            stroke={T.mint} strokeWidth="1.5"
            filter={hiDecoder ? "url(#ae-glow-sm)" : undefined}
          />
          <text x={675} y={104} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
            DECODER
          </text>
        </g>
      )}

      {/* Latent vector label */}
      {latentIn > 0 && (
        <g opacity={latentIn}
          filter={hiLatent ? "url(#ae-glow)" : undefined}>
          <rect x={490} y={130} width={200} height={50} rx="10"
            fill={hiLatent ? T.violet : T.bgDeep} fillOpacity={hiLatent ? 0.25 : 1}
            stroke={T.violet} strokeWidth="2" />
          <text x={590} y={150} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="1">
            LATENT SPACE
          </text>
          <text x={590} y={170} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="13">z = [0.3, –1.2]</text>
        </g>
      )}

      {/* Reconstructed image box */}
      {decodeIn > 0.5 && (
        <g opacity={Math.min((decodeIn - 0.5) / 0.5, 1)}>
          <rect x={870} y={CY - 60} width={80} height={80} rx="8"
            fill={T.mint} fillOpacity={0.22}
            stroke={T.mint} strokeWidth="2"
          />
          {[0,1,2,3].map(row => [0,1,2,3].map(col => (
            <rect key={`${row}-${col}`}
              x={874 + col * 18} y={CY - 56 + row * 18} width={14} height={14} rx="2"
              fill={T.mint}
              fillOpacity={((row + col) % 2 === 0) ? 0.55 : 0.18}
            />
          )))}
          <text x={910} y={CY + 36} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="12" fontWeight="600">recon.</text>
        </g>
      )}

      {/* Comparison + loss badge */}
      {compareIn > 0 && (
        <g opacity={compareIn}>
          <rect x={W / 2 - 140} y={600} width={280} height={54} rx="12"
            fill={T.bgDeep} stroke={hiCompress ? T.amber : T.coral} strokeWidth="2" />
          <text x={W / 2} y={624} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1.5">
            TRAINING OBJECTIVE
          </text>
          <text x={W / 2} y={645} textAnchor="middle"
            fill={hiCompress ? T.amber : T.coral} fontFamily={T.sans} fontSize="15" fontWeight="700">
            Reconstruction Loss
          </text>
        </g>
      )}
    </svg>
  );
};
