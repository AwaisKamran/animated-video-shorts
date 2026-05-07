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

const BLOCK_W = 420;
const BLOCK_X = (W - BLOCK_W) / 2;

// Stack layers bottom to top
const LAYERS = [
  { id: "embed",   label: "Input Embeddings",      color: T.cyan,   h: 56,  y: 580 },
  { id: "pos",     label: "+ Positional Encoding",  color: T.amber,  h: 50,  y: 514 },
  { id: "attn",    label: "Multi-Head Attention",   color: T.violet, h: 90,  y: 404 },
  { id: "norm1",   label: "Add & Norm",             color: T.mint,   h: 38,  y: 358 },
  { id: "ff",      label: "Feed Forward",           color: T.cyan,   h: 80,  y: 260 },
  { id: "norm2",   label: "Add & Norm",             color: T.mint,   h: 38,  y: 214 },
  { id: "output",  label: "Output",                 color: T.amber,  h: 56,  y: 140 },
];

export const TransformerDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const embedIn  = p(frame, duration, 0.00, 0.20);
  const posIn    = p(frame, duration, 0.20, 0.40);
  const attnIn   = p(frame, duration, 0.40, 0.65);
  const ffIn     = p(frame, duration, 0.65, 0.85);
  const outputIn = p(frame, duration, 0.85, 1.00);

  const hiAttn  = hi("ATTENTION");
  const hiFF    = hi("FEEDFORWARD");
  const hiRes   = hi("RESIDUAL");

  const phaseMap: Record<string, number> = {
    embed: embedIn,
    pos:   posIn,
    attn:  attnIn,
    norm1: attnIn,
    ff:    ffIn,
    norm2: ffIn,
    output: outputIn,
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tf-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tf-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Residual connections (curved arrows on the right side) */}
      {ffIn > 0 && (
        <g opacity={ffIn}>
          {/* Residual around attention block */}
          <path d={`M ${BLOCK_X + BLOCK_W + 20} ${LAYERS[1].y + 25} Q ${BLOCK_X + BLOCK_W + 80} ${280} ${BLOCK_X + BLOCK_W + 20} ${LAYERS[3].y + 19}`}
            fill="none" stroke={hiRes ? T.mint : T.mint} strokeWidth={hiRes ? 2.5 : 1.5}
            strokeDasharray="6 4"
            filter={hiRes ? "url(#tf-glow)" : undefined}
          />
          <polygon
            points={`${BLOCK_X + BLOCK_W + 20},${LAYERS[3].y + 19} ${BLOCK_X + BLOCK_W + 12},${LAYERS[3].y + 30} ${BLOCK_X + BLOCK_W + 28},${LAYERS[3].y + 30}`}
            fill={T.mint} opacity={hiRes ? 1 : 0.7}
          />
          {/* Residual around feedforward block */}
          <path d={`M ${BLOCK_X + BLOCK_W + 20} ${LAYERS[3].y + 19} Q ${BLOCK_X + BLOCK_W + 80} ${190} ${BLOCK_X + BLOCK_W + 20} ${LAYERS[5].y + 19}`}
            fill="none" stroke={hiRes ? T.mint : T.mint} strokeWidth={hiRes ? 2.5 : 1.5}
            strokeDasharray="6 4"
            filter={hiRes ? "url(#tf-glow)" : undefined}
          />
          <polygon
            points={`${BLOCK_X + BLOCK_W + 20},${LAYERS[5].y + 19} ${BLOCK_X + BLOCK_W + 12},${LAYERS[5].y + 30} ${BLOCK_X + BLOCK_W + 28},${LAYERS[5].y + 30}`}
            fill={T.mint} opacity={hiRes ? 1 : 0.7}
          />
          <text x={BLOCK_X + BLOCK_W + 70} y={240} textAnchor="middle"
            fill={hiRes ? T.mint : T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700"
            transform={`rotate(90, ${BLOCK_X + BLOCK_W + 70}, 240)`}>
            RESIDUAL
          </text>
        </g>
      )}

      {/* Q/K/V labels inside attention */}
      {attnIn > 0.3 && (
        <g opacity={Math.min(1, (attnIn - 0.3) * 3)}>
          {["Q", "K", "V"].map((label, i) => {
            const qx = BLOCK_X + 40 + i * 115;
            const qy = LAYERS[2].y + 22;
            return (
              <g key={label}>
                <rect x={qx} y={qy} width={80} height={46} rx="8"
                  fill={T.violet} fillOpacity={0.2} stroke={T.violet} strokeWidth="1" strokeOpacity="0.5" />
                <text x={qx + 40} y={qy + 28} textAnchor="middle"
                  fill={T.violet} fontFamily={T.mono} fontSize="16" fontWeight="800">
                  {label}
                </text>
              </g>
            );
          })}
          <text x={BLOCK_X + BLOCK_W / 2} y={LAYERS[2].y + 78} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11">
            heads: 8
          </text>
        </g>
      )}

      {/* Layer blocks */}
      {LAYERS.map((layer) => {
        const alpha = phaseMap[layer.id] ?? 0;
        if (alpha <= 0) return null;

        const isAttn = layer.id === "attn";
        const isFF   = layer.id === "ff";
        const isNorm = layer.id === "norm1" || layer.id === "norm2";
        const isOut  = layer.id === "output";

        const isHi = (isAttn && hiAttn) || (isFF && hiFF) || (isNorm && hiRes);

        return (
          <g key={layer.id} opacity={alpha}>
            <rect x={BLOCK_X} y={layer.y} width={BLOCK_W} height={layer.h} rx="12"
              fill={layer.color}
              fillOpacity={isHi ? 0.3 : isOut && outputIn > 0.5 ? 0.25 : 0.12}
              stroke={layer.color}
              strokeWidth={isHi || (isOut && outputIn > 0.5) ? 2.5 : 1.5}
              filter={isHi || (isOut && outputIn > 0.5) ? "url(#tf-glow)" : undefined}
            />
            <text x={BLOCK_X + BLOCK_W / 2} y={layer.y + layer.h / 2 + 5} textAnchor="middle"
              fill={layer.color} fontFamily={T.sans} fontSize="14" fontWeight="800"
              filter={isHi ? "url(#tf-glow-sm)" : undefined}>
              {layer.label}
            </text>

            {/* Connector line to next block */}
            <line x1={BLOCK_X + BLOCK_W / 2} y1={layer.y}
                  x2={BLOCK_X + BLOCK_W / 2} y2={layer.y - 8}
              stroke={T.border} strokeWidth="1.5" />
          </g>
        );
      })}

      {/* + symbol for positional encoding */}
      {posIn > 0.5 && (
        <g opacity={(posIn - 0.5) * 2}>
          <circle cx={BLOCK_X + 28} cy={LAYERS[1].y + LAYERS[1].h / 2} r="14"
            fill={T.amber} fillOpacity={0.2} stroke={T.amber} strokeWidth="1.5" />
          <text x={BLOCK_X + 28} y={LAYERS[1].y + LAYERS[1].h / 2 + 5} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="18" fontWeight="900">+</text>
        </g>
      )}

      {/* Full pipeline highlight at output */}
      {outputIn > 0.5 && (
        <g opacity={(outputIn - 0.5) * 2}>
          <text x={BLOCK_X - 80} y={400} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1"
            transform={`rotate(-90, ${BLOCK_X - 80}, 400)`}>
            ENCODER BLOCK
          </text>
          <rect x={BLOCK_X - 16} y={130} width={BLOCK_W + 32} height={466} rx="18"
            fill="none" stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="8 4" />
        </g>
      )}
    </svg>
  );
};
