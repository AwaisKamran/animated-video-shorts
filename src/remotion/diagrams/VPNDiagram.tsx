import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const CLIENT_X = 140, VPN_X = 500, SERVER_X = 900;
const NODE_Y = 320, NR = 66;
const TUNNEL_Y1 = NODE_Y - 36, TUNNEL_Y2 = NODE_Y + 36;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const VPNDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn    = p(frame, duration, 0.00, 0.18);
  const tunnelDraw = p(frame, duration, 0.18, 0.45);
  const encPktP    = p(frame, duration, 0.46, 0.73);
  const plainPktP  = p(frame, duration, 0.75, 0.99);
  const labelAlpha = p(frame, duration, 0.50, 0.73);

  const tunnelColor = hi("TUNNEL") || hi("VPN") ? T.cyan : T.cyan;
  const tunnelWidth = (VPN_X - NR) - (CLIENT_X + NR);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="vpn-glow">
          <feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="vpn-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="tunnel-clip">
          <rect x={CLIENT_X + NR} y={TUNNEL_Y1 - 2}
            width={tunnelWidth * tunnelDraw} height={TUNNEL_Y2 - TUNNEL_Y1 + 4} />
        </clipPath>
      </defs>

      {/* Internet zone label */}
      <g opacity={nodesIn}>
        <text x={(VPN_X + SERVER_X) / 2} y={140} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="15" letterSpacing="2">INTERNET</text>
        <line x1={VPN_X + NR + 10} y1={150} x2={SERVER_X - NR - 10} y2={150}
          stroke={T.textDim} strokeWidth="1" strokeDasharray="4 3" />
      </g>

      {/* Tunnel tube — outer glow */}
      <g clipPath="url(#tunnel-clip)">
        <rect x={CLIENT_X + NR} y={TUNNEL_Y1 - 6} width={tunnelWidth} height={(TUNNEL_Y2 - TUNNEL_Y1) + 12}
          rx="20" fill="none" stroke={tunnelColor} strokeWidth="20" strokeOpacity="0.10"
          filter="url(#vpn-glow)" />
        {/* Tunnel inner */}
        <rect x={CLIENT_X + NR} y={TUNNEL_Y1} width={tunnelWidth} height={TUNNEL_Y2 - TUNNEL_Y1}
          rx="16" fill={T.bgDeep} stroke={tunnelColor} strokeWidth="2.5" />
        {/* Inner double border */}
        <rect x={CLIENT_X + NR + 6} y={TUNNEL_Y1 + 6} width={tunnelWidth - 12} height={TUNNEL_Y2 - TUNNEL_Y1 - 12}
          rx="10" fill="none" stroke={tunnelColor} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="12 6" />
      </g>

      {/* Right side — plain connection */}
      {nodesIn > 0 && (
        <line x1={VPN_X + NR} y1={NODE_Y} x2={SERVER_X - NR} y2={NODE_Y}
          stroke={T.border} strokeWidth="1.5" opacity={nodesIn} />
      )}

      {/* Nodes */}
      {/* Client */}
      <g opacity={nodesIn}>
        <circle cx={CLIENT_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={tunnelDraw > 0.5 ? tunnelColor : T.nodeBorder}
          strokeWidth={tunnelDraw > 0.5 ? "2.5" : "1.5"}
          filter={tunnelDraw > 0.5 ? "url(#vpn-glow)" : undefined} />
        <g transform={`translate(${CLIENT_X - 18}, ${NODE_Y - 22})`}>
          <NodeIcon type="laptop" size={36} color={T.textSecondary} />
        </g>
        <text x={CLIENT_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">CLIENT</text>
      </g>

      {/* VPN Server */}
      <g opacity={nodesIn}>
        <circle cx={VPN_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={tunnelDraw > 0.5 ? tunnelColor : T.nodeBorder}
          strokeWidth={tunnelDraw > 0.5 ? "2.5" : "1.5"}
          filter={tunnelDraw > 0.5 ? "url(#vpn-glow)" : undefined} />
        <g transform={`translate(${VPN_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="shield" size={36} color={tunnelDraw > 0.3 ? tunnelColor : T.textSecondary} />
        </g>
        <text x={VPN_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={tunnelDraw > 0.3 ? tunnelColor : T.textSecondary}
          fontFamily={T.sans} fontSize="17" fontWeight="700" letterSpacing="2">VPN SERVER</text>
      </g>

      {/* Target server */}
      <g opacity={nodesIn}>
        <circle cx={SERVER_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={plainPktP > 0.5 ? T.mint : T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${SERVER_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="server" size={36} color={T.textSecondary} />
        </g>
        <text x={SERVER_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">SERVER</text>
      </g>

      {/* Encrypted packet inside tunnel */}
      {encPktP > 0 && encPktP < 1 && (() => {
        const fx = (CLIENT_X + NR) + (VPN_X - NR - CLIENT_X - NR) * encPktP;
        return (
          <g transform={`translate(${fx - 30}, ${NODE_Y - 14})`}>
            <rect x="0" y="0" width="60" height="28" rx="8"
              fill={T.bgDeep} stroke={tunnelColor} strokeWidth="1.5" />
            <text x="30" y="19" textAnchor="middle"
              fill={tunnelColor} fontFamily={T.mono} fontSize="13" fontWeight="700">████</text>
          </g>
        );
      })()}

      {/* Plaintext packet outside tunnel */}
      {plainPktP > 0 && plainPktP < 1 && (() => {
        const fx = (VPN_X + NR) + (SERVER_X - NR - VPN_X - NR) * plainPktP;
        return (
          <g transform={`translate(${fx - 26}, ${NODE_Y - 14})`}>
            <rect x="0" y="0" width="52" height="28" rx="8"
              fill={T.bgDeep} stroke={T.mint} strokeWidth="1.5" />
            <text x="26" y="19" textAnchor="middle"
              fill={T.mint} fontFamily={T.mono} fontSize="12" fontWeight="700">DATA</text>
          </g>
        );
      })()}

      {/* ENCRYPTED label inside tunnel */}
      {labelAlpha > 0 && (
        <g opacity={labelAlpha}>
          <text x={(CLIENT_X + NR + VPN_X - NR) / 2} y={NODE_Y + 3} textAnchor="middle"
            fill={tunnelColor} fontFamily={T.sans} fontSize="15" fontWeight="700" letterSpacing="2">
            ENCRYPTED
          </text>
        </g>
      )}

      {/* PLAINTEXT label */}
      {plainPktP > 0 && (
        <text x={(VPN_X + SERVER_X) / 2} y={NODE_Y - NR - 18} textAnchor="middle"
          fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="2"
          opacity={plainPktP}>
          PLAINTEXT
        </text>
      )}

      {/* VPN / TUNNEL labels */}
      {tunnelDraw > 0.2 && (
        <text x={(CLIENT_X + VPN_X) / 2} y={TUNNEL_Y2 + 28} textAnchor="middle"
          fill={tunnelColor} fontFamily={T.sans} fontSize="14" letterSpacing="2"
          opacity={Math.min((tunnelDraw - 0.2) / 0.5, 1)}>
          {hi("TUNNEL") ? "TUNNEL" : "VPN TUNNEL"}
        </text>
      )}
    </svg>
  );
};
