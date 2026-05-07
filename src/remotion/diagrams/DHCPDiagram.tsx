import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const CLIENT_X = 200, SERVER_X = 880, NODE_Y = 310, NR = 70;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const STEPS = [
  { label: "DISCOVER", dir: "ltr" as const, color: T.coral,   yOff: -90, desc: "Broadcast to all" },
  { label: "OFFER",    dir: "rtl" as const, color: T.violet,  yOff: -20, desc: '"192.168.1.10"' },
  { label: "REQUEST",  dir: "ltr" as const, color: T.amber,   yOff: 50,  desc: "Client accepts" },
  { label: "ACK",      dir: "rtl" as const, color: T.mint,    yOff: 120, desc: "Confirmed!" },
];

function ArrowStep({
  progress, x1, x2, y, color, label, dir, desc,
}: {
  progress: number; x1: number; x2: number; y: number;
  color: string; label: string; dir: "ltr" | "rtl"; desc: string;
}) {
  if (progress <= 0) return null;
  const fromX = dir === "ltr" ? x1 + NR : x2 - NR;
  const toX   = dir === "ltr" ? x2 - NR : x1 + NR;
  const dotX  = fromX + (toX - fromX) * Math.min(progress, 1);
  const lineX1 = dir === "ltr" ? fromX : dotX;
  const lineX2 = dir === "ltr" ? dotX  : fromX;
  const tipX  = dotX;
  const baseX = dir === "ltr" ? dotX - 14 : dotX + 14;
  const midX  = (fromX + toX) / 2;

  return (
    <g>
      {dir === "ltr" && label === "DISCOVER" && (
        <line x1={fromX} y1={y} x2={fromX + (toX - fromX) * progress}
          y2={y} stroke={color} strokeWidth="2" strokeDasharray="8 4" />
      )}
      <line x1={lineX1} y1={y} x2={lineX2} y2={y} stroke={color} strokeWidth="2" opacity={dir === "ltr" && label === "DISCOVER" ? 0 : 1} />
      <polygon points={`${tipX},${y} ${baseX},${y - 7} ${baseX},${y + 7}`} fill={color} />
      <circle cx={dotX} cy={y} r="7" fill={color} opacity="0.9" />
      {/* Badge */}
      <rect x={midX - 68} y={y - 40} width={136} height={28} rx="14" fill={T.bgDeep} stroke={color} strokeWidth="1" />
      <text x={midX} y={y - 20} textAnchor="middle"
        fill={color} fontFamily={T.mono} fontSize="17" fontWeight="700">{label}</text>
      {progress > 0.7 && (
        <text x={midX} y={y + 22} textAnchor="middle"
          fill={color} fontFamily={T.sans} fontSize="13" opacity={Math.min((progress - 0.7) / 0.3, 1)}>
          {desc}
        </text>
      )}
    </g>
  );
}

export const DHCPDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn  = p(frame, duration, 0.00, 0.16);
  const discP    = p(frame, duration, 0.16, 0.44);
  const offerP   = p(frame, duration, 0.46, 0.68);
  const reqP     = p(frame, duration, 0.70, 0.88);
  const ackP     = p(frame, duration, 0.89, 1.00);
  const resolveP = p(frame, duration, 0.97, 1.00);

  const ipDisplay = resolveP > 0 ? "192.168.1.10" : "???";
  const ipColor   = resolveP > 0 ? T.mint : T.coral;

  const STEP_PROGS = [discP, offerP, reqP, ackP];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="dhcp-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Timelines */}
      <g opacity={nodesIn}>
        <line x1={CLIENT_X} y1={NODE_Y + NR} x2={CLIENT_X} y2={560}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
        <line x1={SERVER_X} y1={NODE_Y + NR} x2={SERVER_X} y2={560}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
      </g>

      {/* Client */}
      <g opacity={nodesIn}>
        <circle cx={CLIENT_X} cy={NODE_Y} r={NR}
          fill={T.nodeFill}
          stroke={resolveP > 0.5 ? T.mint : T.nodeBorder}
          strokeWidth={resolveP > 0.5 ? "2.5" : "1.5"}
          filter={resolveP > 0.5 ? "url(#dhcp-glow)" : undefined}
        />
        <g transform={`translate(${CLIENT_X - 18}, ${NODE_Y - 22})`}>
          <NodeIcon type="laptop" size={36} color={T.textSecondary} />
        </g>
        <text x={CLIENT_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">CLIENT</text>
        {/* IP display badge */}
        <rect x={CLIENT_X - 100} y={NODE_Y - NR - 52} width={200} height={36} rx="18"
          fill={T.bgDeep} stroke={ipColor} strokeWidth="1.5" />
        <text x={CLIENT_X} y={NODE_Y - NR - 26} textAnchor="middle"
          fill={ipColor} fontFamily={T.mono} fontSize="15" fontWeight="700">
          IP: {ipDisplay}
        </text>
        {resolveP > 0 && (
          <text x={CLIENT_X} y={NODE_Y - NR - 68} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" opacity={resolveP} fontWeight="600">
            ASSIGNED
          </text>
        )}
      </g>

      {/* DHCP Server */}
      <g opacity={nodesIn}>
        <circle cx={SERVER_X} cy={NODE_Y} r={NR}
          fill={T.nodeFill}
          stroke={hi("ACK") ? T.mint : T.nodeBorder}
          strokeWidth="1.5"
        />
        <g transform={`translate(${SERVER_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="server" size={36} color={T.textSecondary} />
        </g>
        <text x={SERVER_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">DHCP SERVER</text>
      </g>

      {/* Arrows */}
      {STEPS.map((step, i) => (
        <ArrowStep
          key={step.label}
          progress={STEP_PROGS[i]}
          x1={CLIENT_X} x2={SERVER_X}
          y={NODE_Y + step.yOff + 20}
          color={hi(step.label) ? step.color : step.color}
          label={step.label}
          dir={step.dir}
          desc={step.desc}
        />
      ))}
    </svg>
  );
};
