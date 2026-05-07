import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const PRIVATE_DEVS = [
  { id: "d1", y: 180, ip: "192.168.1.2", port: "PORT 4021" },
  { id: "d2", y: 330, ip: "192.168.1.3", port: "PORT 4022" },
  { id: "d3", y: 480, ip: "192.168.1.4", port: "PORT 4023" },
];
const DEV_X = 150, DEV_R = 48;
const NAT_X = 520, NAT_W = 100, NAT_H = 340, NAT_CY = 330;
const CLOUD_X = 880, CLOUD_Y = 330;

export const NATDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn    = p(frame, duration, 0.00, 0.20);
  const pkt1In     = p(frame, duration, 0.20, 0.45);
  const tableIn    = p(frame, duration, 0.45, 0.58);
  const pktOut     = p(frame, duration, 0.58, 0.80);
  const replyIn    = p(frame, duration, 0.82, 0.96);
  const replyRoute = p(frame, duration, 0.96, 1.00);

  const natColor   = hi("NAT") ? T.violet : T.violet;
  const portColor  = hi("PORT") ? T.amber  : T.amber;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="nat-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="nat-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Lines from devices to NAT */}
      {PRIVATE_DEVS.map((d) => (
        <line key={d.id}
          x1={DEV_X + DEV_R} y1={d.y} x2={NAT_X} y2={NAT_CY}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" opacity={nodesIn}
        />
      ))}

      {/* Line NAT to cloud */}
      <line x1={NAT_X + NAT_W} y1={NAT_CY} x2={CLOUD_X - 60} y2={CLOUD_Y}
        stroke={pktOut > 0 ? natColor : T.border} strokeWidth={pktOut > 0 ? "2.5" : "1.5"}
        opacity={nodesIn} />

      {/* Private devices */}
      {PRIVATE_DEVS.map((d, i) => (
        <g key={d.id} opacity={nodesIn}>
          <circle cx={DEV_X} cy={d.y} r={DEV_R}
            fill={T.nodeFill} stroke={replyRoute > 0 && i === 1 ? T.mint : T.nodeBorder} strokeWidth="1.5" />
          <g transform={`translate(${DEV_X - 18}, ${d.y - 18})`}>
            <NodeIcon type="laptop" size={36} color={T.textSecondary} />
          </g>
          <text x={DEV_X} y={d.y + DEV_R + 22} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="13">{d.ip}</text>
        </g>
      ))}

      {/* NAT box */}
      <g opacity={nodesIn}>
        <rect x={NAT_X} y={NAT_CY - NAT_H / 2} width={NAT_W} height={NAT_H} rx="10"
          fill={T.bgDeep}
          stroke={natColor}
          strokeWidth="2"
          filter={tableIn > 0.2 ? "url(#nat-glow)" : undefined}
        />
        <g transform={`translate(${NAT_X + NAT_W / 2 - 18}, ${NAT_CY - 20})`}>
          <NodeIcon type="router" size={36} color={natColor} />
        </g>
        <text x={NAT_X + NAT_W / 2} y={NAT_CY + 38} textAnchor="middle"
          fill={natColor} fontFamily={T.sans} fontSize="20" fontWeight="800" letterSpacing="2">NAT</text>
      </g>

      {/* Cloud */}
      <g opacity={nodesIn}>
        <ellipse cx={CLOUD_X} cy={CLOUD_Y} rx={80} ry={55}
          fill={T.bgDeep} stroke={T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${CLOUD_X - 18}, ${CLOUD_Y - 20})`}>
          <NodeIcon type="cloud" size={36} color={T.textSecondary} />
        </g>
        <text x={CLOUD_X} y={CLOUD_Y + 38} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="13">203.0.113.1</text>
        <text x={CLOUD_X} y={CLOUD_Y - 66} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="15" letterSpacing="1">INTERNET</text>
      </g>

      {/* Packets from devs → NAT */}
      {PRIVATE_DEVS.map((d, i) => {
        const phaseStart = 0.20 + i * 0.07;
        const phaseEnd   = phaseStart + 0.20;
        const prog = p(frame, duration, phaseStart, phaseEnd);
        if (prog <= 0 || prog >= 1) return null;
        const fx = (DEV_X + DEV_R) + (NAT_X - DEV_X - DEV_R) * prog;
        const fy = d.y + (NAT_CY - d.y) * prog;
        return <circle key={d.id} cx={fx} cy={fy} r="7" fill={T.cyan} filter="url(#nat-glow-sm)" />;
      })}

      {/* NAT mapping table */}
      {tableIn > 0 && (
        <g opacity={tableIn}>
          <rect x={NAT_X - 230} y={NAT_CY - 100} width={220} height={200} rx="10"
            fill={T.bgPanel} stroke={portColor} strokeWidth="1.5" strokeOpacity="0.7" />
          <text x={NAT_X - 120} y={NAT_CY - 76} textAnchor="middle"
            fill={portColor} fontFamily={T.mono} fontSize="12" fontWeight="700" letterSpacing="1">NAT TABLE</text>
          <line x1={NAT_X - 230} y1={NAT_CY - 66} x2={NAT_X - 10} y2={NAT_CY - 66}
            stroke={portColor} strokeWidth="1" strokeOpacity="0.4" />
          {PRIVATE_DEVS.map((d, i) => (
            <text key={d.id} x={NAT_X - 218} y={NAT_CY - 44 + i * 44}
              fill={i < 2 ? portColor : T.textDim}
              fontFamily={T.mono} fontSize="11">
              {d.ip} →{"\n"}203.0.113.1:{d.port.replace("PORT ", "")}
            </text>
          ))}
          {PRIVATE_DEVS.map((d, i) => (
            <text key={`lbl-${d.id}`} x={NAT_X - 218} y={NAT_CY - 28 + i * 44}
              fill={i < 2 ? T.textSecondary : T.textDim}
              fontFamily={T.mono} fontSize="10">
              203.0.113.1:{d.port.replace("PORT ", "")}
            </text>
          ))}
        </g>
      )}

      {/* Packet NAT → Internet */}
      {pktOut > 0 && pktOut < 1 && (() => {
        const fx = (NAT_X + NAT_W) + (CLOUD_X - 60 - NAT_X - NAT_W) * pktOut;
        const fy = NAT_CY;
        return <circle cx={fx} cy={fy} r="8" fill={natColor} filter="url(#nat-glow-sm)" />;
      })()}

      {/* Reply from internet → NAT */}
      {replyIn > 0 && replyIn < 1 && (() => {
        const fx = (CLOUD_X - 60) + (NAT_X + NAT_W - CLOUD_X + 60) * replyIn;
        const fy = NAT_CY;
        return <circle cx={fx} cy={fy} r="8" fill={T.mint} filter="url(#nat-glow-sm)" />;
      })()}

      {/* Reply routed to device 2 */}
      {replyRoute > 0 && replyRoute < 1 && (() => {
        const d = PRIVATE_DEVS[1];
        const fx = NAT_X + (DEV_X + DEV_R - NAT_X) * replyRoute;
        const fy = NAT_CY + (d.y - NAT_CY) * replyRoute;
        return <circle cx={fx} cy={fy} r="8" fill={T.mint} filter="url(#nat-glow-sm)" />;
      })()}

      {/* Public IP label */}
      <text x={700} y={270} textAnchor="middle"
        fill={T.textDim} fontFamily={T.mono} fontSize="13" opacity={nodesIn}>
        PUBLIC IP
      </text>
      <text x={700} y={288} textAnchor="middle"
        fill={T.cyan} fontFamily={T.mono} fontSize="13" opacity={nodesIn}>
        203.0.113.1
      </text>

      {/* Private label */}
      <text x={DEV_X} y={620} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="14" letterSpacing="1" opacity={nodesIn}>
        PRIVATE NETWORK
      </text>
    </svg>
  );
};
