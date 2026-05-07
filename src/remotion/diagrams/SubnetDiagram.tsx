import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// 192.168.1.100 in binary
const BINARY_OCTETS = [
  { oct: "11000000", dec: "192" },
  { oct: "10101000", dec: "168" },
  { oct: "00000001", dec: "1"   },
  { oct: "01100100", dec: "100" },
];

const BIT_CHARS = BINARY_OCTETS.map(o => o.oct).join(".");
const TOTAL_BITS = 35; // 32 bits + 3 dots

function getBitX(idx: number): number {
  // Map bit index (0-34, counting dots) to X position
  const startX = 80;
  const charW = 26;
  return startX + idx * charW;
}

export const SubnetDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const ipIn      = p(frame, duration, 0.00, 0.14);
  const bitsP     = p(frame, duration, 0.14, 0.50);   // bits appear left to right
  const maskIn    = p(frame, duration, 0.50, 0.62);
  const dividerP  = p(frame, duration, 0.60, 0.72);
  const splitP    = p(frame, duration, 0.72, 0.90);
  const labelA    = p(frame, duration, 0.88, 1.00);

  const netColor  = hi("SUBNET") || hi("CIDR") ? T.cyan  : T.cyan;
  const hostColor = hi("HOST")   || hi("MASK")  ? T.amber : T.amber;

  // Map each character in BIT_CHARS to its display index
  // Bit 0-23 (first 24 data bits) → cyan, 24-31 → amber
  // dots are neutral
  function getCharColor(charIdx: number): string {
    // chars: 0-7 octet1, 8=dot, 9-16 octet2, 17=dot, 18-25 octet3, 26=dot, 27-34 octet4
    if (charIdx < 8) return netColor;        // 192
    if (charIdx === 8) return T.textDim;     // .
    if (charIdx < 17) return netColor;       // 168
    if (charIdx === 17) return T.textDim;    // .
    if (charIdx < 26) return netColor;       // 1
    if (charIdx === 26) return T.textDim;    // .
    return hostColor;                        // 100
  }

  const bitsToShow = Math.floor(bitsP * TOTAL_BITS);
  const CHAR_W = 26;
  const BIT_Y = 300;
  const START_X = 80;

  // Divider drops at position of char index 27 (after the last dot)
  const dividerCharIdx = 27;
  const dividerX = START_X + dividerCharIdx * CHAR_W - CHAR_W / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sub-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* IP Address display */}
      <g opacity={ipIn}>
        <text x={W / 2} y={120} textAnchor="middle"
          fill={T.textPrimary} fontFamily={T.mono} fontSize="52" fontWeight="800" letterSpacing="2">
          192.168.1.100
        </text>
        <text x={W / 2} y={155} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="16" letterSpacing="3">
          IPv4 ADDRESS · 32 BITS
        </text>
      </g>

      {/* Subnet label above binary */}
      {bitsP > 0.1 && (
        <text x={START_X + 12 * CHAR_W} y={BIT_Y - 56} textAnchor="middle"
          fill={netColor} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="2"
          opacity={Math.min((bitsP - 0.1) / 0.4, 1)}>
          NETWORK PREFIX /24
        </text>
      )}
      {bitsP > 0.6 && (
        <text x={START_X + 31 * CHAR_W} y={BIT_Y - 56} textAnchor="middle"
          fill={hostColor} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="2"
          opacity={Math.min((bitsP - 0.6) / 0.3, 1)}>
          HOST PART /8
        </text>
      )}

      {/* Binary bits appear one by one */}
      {BIT_CHARS.split("").map((char, i) => {
        if (i >= bitsToShow) return null;
        const x = START_X + i * CHAR_W;
        const col = getCharColor(i);
        return (
          <text key={i} x={x} y={BIT_Y} textAnchor="middle"
            fill={col} fontFamily={T.mono} fontSize="26" fontWeight="700">
            {char}
          </text>
        );
      })}

      {/* Decimal notation under binary */}
      {bitsP > 0.4 && BINARY_OCTETS.map((o, i) => {
        const centerCharIdx = i === 0 ? 4 : i === 1 ? 13 : i === 2 ? 22 : 31;
        const x = START_X + centerCharIdx * CHAR_W;
        return (
          <text key={i} x={x} y={BIT_Y + 36} textAnchor="middle"
            fill={i < 3 ? netColor : hostColor}
            fontFamily={T.mono} fontSize="18"
            opacity={Math.min((bitsP - 0.4) / 0.4, 1)}>
            {o.dec}
          </text>
        );
      })}

      {/* Subnet mask */}
      {maskIn > 0 && (
        <g opacity={maskIn}>
          <text x={START_X + 14 * CHAR_W} y={BIT_Y + 78} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="14" letterSpacing="2">SUBNET MASK</text>
          <text x={START_X + 14 * CHAR_W} y={BIT_Y + 104} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="22" fontWeight="700">
            <tspan fill={netColor}>255.255.255</tspan>
            <tspan fill={T.textDim}>.</tspan>
            <tspan fill={hostColor}>0</tspan>
          </text>
          {hi("CIDR") && (
            <text x={START_X + 14 * CHAR_W} y={BIT_Y + 130} textAnchor="middle"
              fill={T.violet} fontFamily={T.mono} fontSize="18" fontWeight="700">
              CIDR: /24
            </text>
          )}
        </g>
      )}

      {/* Vertical divider dropping */}
      {dividerP > 0 && (
        <g opacity={dividerP}>
          <line x1={dividerX} y1={BIT_Y - 72} x2={dividerX} y2={BIT_Y + 48}
            stroke={T.textPrimary} strokeWidth="2.5" strokeDasharray="none" />
          <rect x={dividerX - 26} y={BIT_Y - 96} width={52} height={24} rx="12"
            fill={T.bgDeep} stroke={T.textPrimary} strokeWidth="1.5" />
          <text x={dividerX} y={BIT_Y - 78} textAnchor="middle"
            fill={T.textPrimary} fontFamily={T.mono} fontSize="14" fontWeight="700">/ 24</text>
        </g>
      )}

      {/* Subnet split brackets */}
      {splitP > 0 && (
        <g opacity={splitP}>
          {/* Subnet A */}
          <rect x={START_X - 10} y={BIT_Y + 150} width={500 * splitP} height={60} rx="10"
            fill="none" stroke={netColor} strokeWidth="2" />
          {splitP > 0.5 && (
            <text x={START_X + 240} y={BIT_Y + 188} textAnchor="middle"
              fill={netColor} fontFamily={T.mono} fontSize="17" fontWeight="700"
              opacity={(splitP - 0.5) / 0.5}>
              192.168.1.0 – .127 &nbsp;(/25)
            </text>
          )}
          {/* Subnet B */}
          <rect x={START_X + 510} y={BIT_Y + 150} width={460 * splitP} height={60} rx="10"
            fill="none" stroke={hostColor} strokeWidth="2" />
          {splitP > 0.5 && (
            <text x={START_X + 730} y={BIT_Y + 188} textAnchor="middle"
              fill={hostColor} fontFamily={T.mono} fontSize="17" fontWeight="700"
              opacity={(splitP - 0.5) / 0.5}>
              .128 – .255 &nbsp;(/25)
            </text>
          )}
        </g>
      )}

      {/* Final label */}
      {labelA > 0 && (
        <g opacity={labelA}>
          <text x={W / 2} y={BIT_Y + 280} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="15" letterSpacing="2">
            ONE /24 SPLIT INTO TWO /25 SUBNETS
          </text>
        </g>
      )}
    </svg>
  );
};
