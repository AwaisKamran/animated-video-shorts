import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const SRC_X = 200, SRC_Y = 330, SR = 65;
const DST_X = 780;
const DST_YS = [140, 260, 380, 500];
const DR = 50;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const DEVICES = [
  { ip: "192.168.1.1", mac: "11:22:33:44:55:66" },
  { ip: "192.168.1.2", mac: "AA:BB:CC:DD:EE:FF" },
  { ip: "192.168.1.3", mac: "AA:BB:CC:DD:11:22" },
  { ip: "192.168.1.4", mac: "FF:EE:DD:CC:BB:AA" },
];

export const ARPDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn    = p(frame, duration, 0.00, 0.18);
  const bcastP     = p(frame, duration, 0.18, 0.56);
  const fadeOthers = p(frame, duration, 0.57, 0.68);
  const replyP     = p(frame, duration, 0.69, 0.94);
  const cacheIn    = p(frame, duration, 0.95, 1.00);

  const bcastColor = hi("BROADCAST") ? T.amber : T.amber;
  const uniColor   = hi("UNICAST")   ? T.cyan  : T.cyan;
  const arpColor   = hi("ARP")       ? T.mint  : T.mint;

  const TARGET_IDX = 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="arp-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="arp-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Lines from src to each dst */}
      {DST_YS.map((dy, i) => {
        const isTarget = i === TARGET_IDX;
        const dimAlpha = fadeOthers > 0 && !isTarget ? 1 - fadeOthers * 0.85 : 1;
        return (
          <line key={i}
            x1={SRC_X + SR} y1={SRC_Y} x2={DST_X - DR} y2={dy}
            stroke={isTarget && replyP > 0 ? uniColor : bcastColor}
            strokeWidth={isTarget ? "2" : "1.5"}
            strokeDasharray={bcastP < 1 ? "8 4" : "none"}
            opacity={nodesIn * dimAlpha}
          />
        );
      })}

      {/* Source node */}
      <g opacity={nodesIn}>
        <circle cx={SRC_X} cy={SRC_Y} r={SR}
          fill={T.nodeFill}
          stroke={hi("ARP") ? arpColor : T.nodeBorder}
          strokeWidth={hi("ARP") ? "2.5" : "1.5"}
          filter={hi("ARP") ? "url(#arp-glow)" : undefined}
        />
        <g transform={`translate(${SRC_X - 18}, ${SRC_Y - 18})`}>
          <NodeIcon type="laptop" size={36} color={T.textSecondary} />
        </g>
        <text x={SRC_X} y={SRC_Y + SR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="18" fontWeight="500" letterSpacing="2">SOURCE</text>
        <text x={SRC_X} y={SRC_Y + SR + 50} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="13">192.168.1.0</text>
      </g>

      {/* Broadcast question bubble */}
      {bcastP > 0 && (
        <g opacity={Math.min(bcastP * 2, 1)}>
          <rect x={SRC_X - 10} y={SRC_Y - SR - 80} width={260} height={42} rx="21"
            fill={T.bgDeep} stroke={bcastColor} strokeWidth="1.5" />
          <text x={SRC_X + 120} y={SRC_Y - SR - 52} textAnchor="middle"
            fill={bcastColor} fontFamily={T.mono} fontSize="14" fontWeight="700">
            Who has 192.168.1.3?
          </text>
        </g>
      )}

      {/* Broadcast label */}
      {bcastP > 0.3 && (
        <text x={490} y={H / 2 - 50} textAnchor="middle"
          fill={bcastColor} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="2"
          opacity={Math.min((bcastP - 0.3) / 0.4, 1)}>
          BROADCAST
        </text>
      )}

      {/* Destination nodes */}
      {DST_YS.map((dy, i) => {
        const isTarget = i === TARGET_IDX;
        const dimAlpha = fadeOthers > 0 && !isTarget ? 1 - fadeOthers * 0.8 : 1;
        return (
          <g key={i} opacity={nodesIn * dimAlpha}>
            <circle cx={DST_X} cy={dy} r={DR}
              fill={T.nodeFill}
              stroke={isTarget && replyP > 0.5 ? uniColor : T.nodeBorder}
              strokeWidth={isTarget && replyP > 0.5 ? "2.5" : "1.5"}
              filter={isTarget && replyP > 0.5 ? "url(#arp-glow)" : undefined}
            />
            <g transform={`translate(${DST_X - 15}, ${dy - 15})`}>
              <NodeIcon type="laptop" size={30} color={T.textSecondary} />
            </g>
            <text x={DST_X} y={dy - DR - 12} textAnchor="middle"
              fill={isTarget ? T.textPrimary : T.textSecondary}
              fontFamily={T.mono} fontSize="13">{DEVICES[i].ip}</text>
          </g>
        );
      })}

      {/* Broadcast packets */}
      {bcastP > 0 && bcastP < 1 && DST_YS.map((dy, i) => {
        const fx = (SRC_X + SR) + (DST_X - DR - SRC_X - SR) * bcastP;
        const fy = SRC_Y + (dy - SRC_Y) * bcastP;
        return <circle key={i} cx={fx} cy={fy} r="7" fill={bcastColor} filter="url(#arp-glow-sm)" />;
      })}

      {/* Reply packet from target */}
      {replyP > 0 && replyP < 1 && (() => {
        const dy = DST_YS[TARGET_IDX];
        const fx = (DST_X - DR) + (SRC_X + SR - DST_X + DR) * replyP;
        const fy = dy + (SRC_Y - dy) * replyP;
        return <circle cx={fx} cy={fy} r="8" fill={uniColor} filter="url(#arp-glow-sm)" />;
      })()}

      {/* Reply MAC bubble */}
      {replyP > 0.5 && (
        <g opacity={(replyP - 0.5) / 0.5}>
          <rect x={DST_X - 10} y={DST_YS[TARGET_IDX] - DR - 68} width={220} height={42} rx="21"
            fill={T.bgDeep} stroke={uniColor} strokeWidth="1.5" />
          <text x={DST_X + 100} y={DST_YS[TARGET_IDX] - DR - 40} textAnchor="middle"
            fill={uniColor} fontFamily={T.mono} fontSize="13" fontWeight="700">
            I&apos;m here! AA:BB:CC...
          </text>
        </g>
      )}

      {/* ARP Cache */}
      {cacheIn > 0 && (
        <g opacity={cacheIn}>
          <rect x={SRC_X - 135} y={SRC_Y + SR + 70} width={270} height={68} rx="10"
            fill={T.bgDeep} stroke={arpColor} strokeWidth="1.5" strokeOpacity="0.7" />
          <text x={SRC_X} y={SRC_Y + SR + 94} textAnchor="middle"
            fill={arpColor} fontFamily={T.mono} fontSize="12" fontWeight="700" letterSpacing="1">ARP CACHE</text>
          <text x={SRC_X} y={SRC_Y + SR + 116} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="11">
            192.168.1.3 → AA:BB:CC:DD:11:22
          </text>
        </g>
      )}

      {/* Legend */}
      <g opacity={nodesIn * 0.7} transform={`translate(40, 630)`}>
        <circle cx="10" cy="10" r="6" fill={bcastColor} />
        <text x="24" y="15" fill={T.textSecondary} fontFamily={T.sans} fontSize="14">Broadcast</text>
        <circle cx="140" cy="10" r="6" fill={uniColor} />
        <text x="154" y="15" fill={T.textSecondary} fontFamily={T.sans} fontSize="14">Unicast Reply</text>
      </g>
    </svg>
  );
};
