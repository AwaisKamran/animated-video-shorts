import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

const SECTIONS = [
  { key: "ip",   label: "IP HEADER",      sub: "Src: 192.168.1.1 → Dst: 8.8.8.8", color: T.violet, w: 280 },
  { key: "tcp",  label: "TCP HEADER",     sub: "Port: 443 · Seq: 1001 · Flags: SYN", color: T.cyan,   w: 300 },
  { key: "data", label: "DATA PAYLOAD",   sub: "GET /index.html HTTP/1.1",          color: T.mint,   w: 400 },
];

const TOTAL_W = SECTIONS.reduce((a, s) => a + s.w, 0); // 980
const START_X = (W - TOTAL_W) / 2;
const BAR_Y = 200, BAR_H = 160;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const PacketDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (k: string) => keyTerms.some(t => t.toUpperCase().includes(k.toUpperCase()));

  const outlineIn = p(frame, duration, 0.05, 0.22);
  const ipIn      = p(frame, duration, 0.22, 0.42);
  const tcpIn     = p(frame, duration, 0.42, 0.60);
  const dataIn    = p(frame, duration, 0.60, 0.76);
  const travelIn  = p(frame, duration, 0.65, 1.00);

  const sectionAlphas = [ipIn, tcpIn, dataIn];

  // Travel animation: packet moves right across bottom
  const travelX = interpolate(travelIn, [0, 1], [-60, W + 60]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="glow-p">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={140} textAnchor="middle"
        fill={T.textSecondary} fontFamily={T.sans} fontSize="20" fontWeight="500" letterSpacing="4"
        opacity={outlineIn}>
        NETWORK PACKET ANATOMY
      </text>

      {/* Outer border */}
      <rect x={START_X - 2} y={BAR_Y - 2} width={TOTAL_W + 4} height={BAR_H + 4}
        rx="10" fill="none" stroke={T.borderStrong} strokeWidth="1.5"
        strokeDasharray="10 5" opacity={outlineIn} />

      {/* Sections */}
      {SECTIONS.map((sec, i) => {
        let x = START_X;
        for (let j = 0; j < i; j++) x += SECTIONS[j].w;
        const isHi = hi(sec.key);
        const alpha = sectionAlphas[i];
        if (alpha <= 0) return null;

        return (
          <g key={sec.key} opacity={alpha}>
            <rect x={x} y={BAR_Y} width={sec.w} height={BAR_H}
              rx={i === 0 ? "8 0 0 8" : i === 2 ? "0 8 8 0" : "0"}
              fill={sec.color} opacity={isHi ? 0.25 : 0.12} />
            <rect x={x} y={BAR_Y} width={sec.w} height={BAR_H}
              rx={i === 0 ? "8 0 0 8" : i === 2 ? "0 8 8 0" : "0"}
              fill="none"
              stroke={isHi ? sec.color : T.borderStrong}
              strokeWidth={isHi ? "2.5" : "1"}
              filter={isHi ? "url(#glow-p)" : undefined} />

            {/* Section label */}
            <text x={x + sec.w / 2} y={BAR_Y + 52} textAnchor="middle"
              fill={isHi ? sec.color : T.textPrimary}
              fontFamily={T.sans} fontSize="18" fontWeight="700" letterSpacing="1">
              {sec.label}
            </text>
            {/* Sub label */}
            <text x={x + sec.w / 2} y={BAR_Y + 82} textAnchor="middle"
              fill={T.textSecondary} fontFamily={T.mono} fontSize="13" letterSpacing="0">
              {sec.sub.length > 22 ? sec.sub.slice(0, 22) + "…" : sec.sub}
            </text>
            {/* Byte count */}
            <text x={x + sec.w / 2} y={BAR_Y + 130} textAnchor="middle"
              fill={T.textDim} fontFamily={T.mono} fontSize="13">
              {i === 0 ? "20 bytes" : i === 1 ? "20 bytes" : "variable"}
            </text>

            {/* Divider between sections */}
            {i < 2 && (
              <line x1={x + sec.w} y1={BAR_Y + 10} x2={x + sec.w} y2={BAR_Y + BAR_H - 10}
                stroke={T.borderStrong} strokeWidth="1" />
            )}
          </g>
        );
      })}

      {/* Section labels below */}
      {SECTIONS.map((sec, i) => {
        let x = START_X;
        for (let j = 0; j < i; j++) x += SECTIONS[j].w;
        if (sectionAlphas[i] <= 0) return null;
        return (
          <g key={"label" + i} opacity={sectionAlphas[i]}>
            <line x1={x + sec.w / 2} y1={BAR_Y + BAR_H} x2={x + sec.w / 2} y2={BAR_Y + BAR_H + 28}
              stroke={T.borderStrong} strokeWidth="1" />
          </g>
        );
      })}

      {/* Travel path */}
      {travelIn > 0 && (
        <g opacity={interpolate(travelIn, [0, 0.1], [0, 1], { extrapolateRight: "clamp" })}>
          {/* Path line */}
          <line x1="40" y1="520" x2={W - 40} y2="520"
            stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="8 4" />
          <polygon points={`${W - 30},520 ${W - 52},513 ${W - 52},527`} fill={T.textDim} />

          {/* Travelling packet */}
          <g transform={`translate(${travelX}, 520)`}>
            <rect x="-40" y="-16" width="80" height="32" rx="16"
              fill={T.bgDeep} stroke={T.cyan} strokeWidth="1.5" />
            <text x="0" y="5" textAnchor="middle"
              fill={T.cyan} fontFamily={T.mono} fontSize="14" fontWeight="600">PKT</text>
          </g>

          <text x={W / 2} y="580" textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="20">
            Travelling across the network
          </text>
        </g>
      )}
    </svg>
  );
};
