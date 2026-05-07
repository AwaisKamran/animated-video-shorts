import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

const LAYERS = [
  { num: 7, name: "APPLICATION",  proto: "HTTP · FTP · DNS · SMTP",    accent: T.violet },
  { num: 6, name: "PRESENTATION", proto: "TLS · SSL · JPEG · MPEG",    accent: "#9B6EFB" },
  { num: 5, name: "SESSION",      proto: "TCP Sessions · RPC · PPTP",   accent: T.cyan },
  { num: 4, name: "TRANSPORT",    proto: "TCP · UDP · SCTP",            accent: "#00B8D4" },
  { num: 3, name: "NETWORK",      proto: "IP · ICMP · OSPF · BGP",      accent: T.mint },
  { num: 2, name: "DATA LINK",    proto: "Ethernet · WiFi · PPP",       accent: "#00BFA5" },
  { num: 1, name: "PHYSICAL",     proto: "Cables · Radio · Fiber",      accent: T.amber },
];

const LAYER_H = 72, LAYER_Y0 = 80, GAP = 8;
const LEFT = 80, RIGHT = W - 80;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const OSIDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (name: string, proto: string) =>
    keyTerms.some(k =>
      name.toUpperCase().includes(k.toUpperCase()) ||
      proto.toUpperCase().includes(k.toUpperCase())
    );

  const titleAlpha = p(frame, duration, 0.0, 0.12);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="glow-o"><feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <text x={W / 2} y={50} textAnchor="middle"
        fill={T.textSecondary} fontFamily={T.sans} fontSize="18" fontWeight="500" letterSpacing="5"
        opacity={titleAlpha}>
        OSI MODEL · 7 LAYERS
      </text>

      {LAYERS.map((layer, i) => {
        const layerAlpha = p(frame, duration, 0.08 + i * 0.10, 0.20 + i * 0.10);
        const y = LAYER_Y0 + i * (LAYER_H + GAP);
        const isHi = hi(layer.name, layer.proto);

        return (
          <g key={layer.num} opacity={layerAlpha}>
            {/* Number badge */}
            <rect x={LEFT} y={y} width={LAYER_H} height={LAYER_H} rx="8"
              fill={layer.accent} opacity="0.2" />
            <rect x={LEFT} y={y} width={LAYER_H} height={LAYER_H} rx="8"
              fill="none" stroke={layer.accent} strokeWidth="1.5" opacity="0.5" />
            <text x={LEFT + LAYER_H / 2} y={y + LAYER_H / 2 + 10} textAnchor="middle"
              fill={layer.accent} fontFamily={T.sans} fontSize="28" fontWeight="800">{layer.num}</text>

            {/* Layer row */}
            <rect x={LEFT + LAYER_H + 8} y={y} width={RIGHT - LEFT - LAYER_H - 8} height={LAYER_H} rx="8"
              fill={isHi ? layer.accent : T.bgDeep} opacity={isHi ? 0.18 : 0.6}
              filter={isHi ? "url(#glow-o)" : undefined} />

            {/* Layer name */}
            <text x={LEFT + LAYER_H + 32} y={y + 30} textAnchor="start"
              fill={isHi ? layer.accent : T.textPrimary}
              fontFamily={T.sans} fontSize="20" fontWeight="700" letterSpacing="1">
              {layer.name}
            </text>
            {/* Protocols */}
            <text x={LEFT + LAYER_H + 32} y={y + 56} textAnchor="start"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="14" letterSpacing="0">
              {layer.proto}
            </text>

            {/* Right accent */}
            <rect x={RIGHT - 6} y={y} width="6" height={LAYER_H} rx="0 8 8 0"
              fill={layer.accent} opacity="0.7" />
          </g>
        );
      })}

      {/* Data flow arrow */}
      {p(frame, duration, 0.82, 0.94) > 0 && (
        <g opacity={p(frame, duration, 0.82, 0.94)}>
          <line x1={LEFT - 32} y1={LAYER_Y0} x2={LEFT - 32} y2={LAYER_Y0 + 7 * (LAYER_H + GAP) - GAP}
            stroke={T.textDim} strokeWidth="1.5" strokeDasharray="5 4" />
          <polygon points={`${LEFT - 32},${LAYER_Y0 + 7 * (LAYER_H + GAP) - GAP} ${LEFT - 38},${LAYER_Y0 + 7 * (LAYER_H + GAP) - GAP - 16} ${LEFT - 26},${LAYER_Y0 + 7 * (LAYER_H + GAP) - GAP - 16}`}
            fill={T.textDim} />
          <text x={LEFT - 46} y={LAYER_Y0 + 3 * (LAYER_H + GAP) + 30}
            fill={T.textDim} fontFamily={T.sans} fontSize="14"
            transform={`rotate(-90, ${LEFT - 46}, ${LAYER_Y0 + 3 * (LAYER_H + GAP) + 30})`}>
            DATA FLOW
          </text>
        </g>
      )}
    </svg>
  );
};
