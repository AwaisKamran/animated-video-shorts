import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const CLIENT_X = 180, SERVER_X = 900, NODE_Y = 320, R = 72;
const LINE_Y1 = 220, LINE_Y2 = 320, LINE_Y3 = 420;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

function Arrow({ x1, x2, y, color, progress, label, dir = "ltr" }: {
  x1: number; x2: number; y: number; color: string;
  progress: number; label: string; dir?: "ltr" | "rtl";
}) {
  if (progress <= 0) return null;

  // dot travels from origin toward destination
  const dotX = dir === "ltr"
    ? x1 + progress * (x2 - x1)
    : x2 - progress * (x2 - x1);

  // line is the trail behind the dot — starts at origin, ends at dot
  const lineX1 = dir === "ltr" ? x1   : dotX;
  const lineX2 = dir === "ltr" ? dotX : x2;

  // arrowhead sits on the leading edge, pointing in direction of travel
  const tipX  = dotX;
  const baseX = dir === "ltr" ? dotX - 14 : dotX + 14;

  const labelX = (x1 + x2) / 2;

  return (
    <g>
      <line x1={lineX1} y1={y} x2={lineX2} y2={y} stroke={color} strokeWidth="2" />
      <polygon points={`${tipX},${y} ${baseX},${y - 7} ${baseX},${y + 7}`} fill={color} />
      <circle cx={dotX} cy={y} r="6" fill={color} opacity="0.9" />
      <rect x={labelX - 70} y={y - 38} width="140" height="28" rx="14" fill={T.bgDeep} />
      <text x={labelX} y={y - 18} textAnchor="middle"
        fill={color} fontFamily={T.mono} fontSize="18" fontWeight="600">{label}</text>
    </g>
  );
}

export const HandshakeDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn   = p(frame, duration, 0.0, 0.15);
  const synP      = p(frame, duration, 0.17, 0.52);
  const synAckP   = p(frame, duration, 0.55, 0.76);
  const ackP      = p(frame, duration, 0.79, 0.94);
  const connAlpha = p(frame, duration, 0.96, 1.00);

  const synColor    = hi("SYN") ? "#00EFFF" : T.cyan;
  const synAckColor = hi("SYN-ACK") ? "#FF9F5C" : T.amber;
  const ackColor    = hi("ACK") ? "#5CFFA8" : T.mint;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="glow-c"><feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Vertical dashed timelines */}
      {nodesIn > 0 && (
        <g opacity={nodesIn}>
          <line x1={CLIENT_X} y1={NODE_Y - R - (480 - (NODE_Y + R))} x2={CLIENT_X} y2={NODE_Y - R}
            stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1={SERVER_X} y1={NODE_Y - R - (480 - (NODE_Y + R))} x2={SERVER_X} y2={NODE_Y - R}
            stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1={CLIENT_X} y1={NODE_Y + R} x2={CLIENT_X} y2={480}
            stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1={SERVER_X} y1={NODE_Y + R} x2={SERVER_X} y2={480}
            stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
        </g>
      )}

      {/* CLIENT node */}
      <g opacity={nodesIn}>
        <circle cx={CLIENT_X} cy={NODE_Y} r={R}
          fill={T.nodeFill} stroke={connAlpha > 0.5 ? T.mint : T.nodeBorder}
          strokeWidth={connAlpha > 0.5 ? "2.5" : "1.5"}
          filter={connAlpha > 0.5 ? "url(#glow-c)" : undefined} />
        <g transform={`translate(${CLIENT_X - 18}, ${NODE_Y - 16})`}>
          <NodeIcon type="browser" size={36} color={T.textSecondary} />
        </g>
        <text x={CLIENT_X} y={NODE_Y + R + 32} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="20" fontWeight="500" letterSpacing="2">CLIENT</text>
      </g>

      {/* SERVER node */}
      <g opacity={nodesIn}>
        <circle cx={SERVER_X} cy={NODE_Y} r={R}
          fill={T.nodeFill} stroke={connAlpha > 0.5 ? T.mint : T.nodeBorder}
          strokeWidth={connAlpha > 0.5 ? "2.5" : "1.5"}
          filter={connAlpha > 0.5 ? "url(#glow-c)" : undefined} />
        <g transform={`translate(${SERVER_X - 18}, ${NODE_Y - 18})`}>
          <NodeIcon type="server" size={36} color={T.textSecondary} />
        </g>
        <text x={SERVER_X} y={NODE_Y + R + 32} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="20" fontWeight="500" letterSpacing="2">SERVER</text>
      </g>

      {/* Arrows */}
      <Arrow x1={CLIENT_X + R} x2={SERVER_X - R} y={LINE_Y1}
        color={synColor} progress={synP} label="SYN" dir="ltr" />
      <Arrow x1={CLIENT_X + R} x2={SERVER_X - R} y={LINE_Y2}
        color={synAckColor} progress={synAckP} label="SYN-ACK" dir="rtl" />
      <Arrow x1={CLIENT_X + R} x2={SERVER_X - R} y={LINE_Y3}
        color={ackColor} progress={ackP} label="ACK" dir="ltr" />

      {/* Connected message */}
      {connAlpha > 0 && (
        <g opacity={connAlpha}>
          <rect x={W / 2 - 130} y={540} width="260" height="52" rx="26" fill={T.mint} opacity="0.15" />
          <text x={W / 2} y={572} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="24" fontWeight="600" letterSpacing="1">CONNECTED</text>
        </g>
      )}
    </svg>
  );
};
