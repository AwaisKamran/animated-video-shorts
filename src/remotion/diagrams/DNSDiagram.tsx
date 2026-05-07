import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number }

const W = 1080, H = 700;

const NODES = [
  { id: "browser",  x: 120,  y: 420, label: "BROWSER",      icon: "browser" as const },
  { id: "resolver", x: 380,  y: 420, label: "RESOLVER",     icon: "dns"     as const },
  { id: "root",     x: 640,  y: 180, label: "ROOT NS",      icon: "globe"   as const },
  { id: "tld",      x: 900,  y: 180, label: "TLD NS",       icon: "dns"     as const },
  { id: "auth",     x: 900,  y: 420, label: "AUTH NS",      icon: "server"  as const },
];

const R = 60;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

function Conn({ n1, n2, alpha }: { n1: typeof NODES[0]; n2: typeof NODES[0]; alpha: number }) {
  return (
    <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
      stroke={T.border} strokeWidth="1.5" strokeDasharray="8 5" opacity={alpha} />
  );
}

function Packet({ x1, y1, x2, y2, prog, color }: {
  x1: number; y1: number; x2: number; y2: number; prog: number; color: string;
}) {
  if (prog <= 0 || prog >= 1) return null;
  const cx = x1 + (x2 - x1) * prog;
  const cy = y1 + (y2 - y1) * prog;
  return <circle cx={cx} cy={cy} r="8" fill={color} />;
}

export const DNSDiagram: React.FC<Props> = ({ frame, duration }) => {
  const nodesIn = p(frame, duration, 0.0, 0.17);

  // Query steps (cyan)
  const q1 = p(frame, duration, 0.19, 0.37); // browser → resolver
  const q2 = p(frame, duration, 0.39, 0.56); // resolver → root
  const q3 = p(frame, duration, 0.58, 0.74); // root → tld
  const q4 = p(frame, duration, 0.76, 0.90); // tld → auth

  // Response steps (mint)
  const r4 = p(frame, duration, 0.91, 0.96); // auth → resolver
  const r1 = p(frame, duration, 0.97, 1.00); // resolver → browser

  const done = p(frame, duration, 0.97, 1.0);

  const B = NODES[0], RES = NODES[1], ROOT = NODES[2], TLD = NODES[3], AUTH = NODES[4];

  // Which nodes are "active"
  const activeIds: string[] = [];
  if (q1 > 0) activeIds.push("browser", "resolver");
  if (q2 > 0) activeIds.push("root");
  if (q3 > 0) activeIds.push("tld");
  if (q4 > 0) activeIds.push("auth");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="glow-d"><feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Connection lines */}
      <g opacity={nodesIn}>
        <Conn n1={B} n2={RES} alpha={1} />
        <Conn n1={RES} n2={ROOT} alpha={1} />
        <Conn n1={ROOT} n2={TLD} alpha={1} />
        <Conn n1={TLD} n2={AUTH} alpha={1} />
      </g>

      {/* Nodes */}
      {NODES.map((n) => {
        const isActive = activeIds.includes(n.id) && nodesIn > 0.5;
        return (
          <g key={n.id} opacity={nodesIn}>
            <circle cx={n.x} cy={n.y} r={R}
              fill={T.nodeFill}
              stroke={isActive ? T.cyan : T.nodeBorder}
              strokeWidth={isActive ? "2" : "1.5"}
              filter={isActive ? "url(#glow-d)" : undefined} />
            <g transform={`translate(${n.x - 18}, ${n.y - 18})`}>
              <NodeIcon type={n.icon} size={36} color={isActive ? T.cyan : T.textSecondary} />
            </g>
            <text x={n.x} y={n.y + R + 28} textAnchor="middle"
              fill={isActive ? T.textPrimary : T.textSecondary}
              fontFamily={T.sans} fontSize="17" fontWeight="500" letterSpacing="1.5">{n.label}</text>
          </g>
        );
      })}

      {/* Query packets (cyan) */}
      <Packet x1={B.x + R} y1={B.y} x2={RES.x - R} y2={RES.y} prog={q1} color={T.cyan} />
      <Packet x1={RES.x} y1={RES.y - R} x2={ROOT.x} y2={ROOT.y + R} prog={q2} color={T.cyan} />
      <Packet x1={ROOT.x + R} y1={ROOT.y} x2={TLD.x - R} y2={TLD.y} prog={q3} color={T.cyan} />
      <Packet x1={TLD.x} y1={TLD.y + R} x2={AUTH.x} y2={AUTH.y - R} prog={q4} color={T.cyan} />

      {/* Response packets (mint) */}
      <Packet x1={AUTH.x - R} y1={AUTH.y} x2={RES.x + R} y2={RES.y} prog={r4} color={T.mint} />
      <Packet x1={RES.x - R} y1={RES.y} x2={B.x + R} y2={B.y} prog={r1} color={T.mint} />

      {/* Legend */}
      <g opacity={nodesIn * 0.7} transform="translate(40, 620)">
        <circle cx="10" cy="10" r="6" fill={T.cyan} />
        <text x="24" y="15" fill={T.textSecondary} fontFamily={T.sans} fontSize="16">Query</text>
        <circle cx="100" cy="10" r="6" fill={T.mint} />
        <text x="114" y="15" fill={T.textSecondary} fontFamily={T.sans} fontSize="16">Response</text>
      </g>

      {/* Done */}
      {done > 0 && (
        <g opacity={done}>
          <rect x={B.x - 80} y={B.y - R - 60} width="200" height="42" rx="21" fill={T.mint} opacity="0.15" />
          <text x={B.x + 20} y={B.y - R - 30} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="20" fontWeight="600">IP FOUND ✓</text>
        </g>
      )}
    </svg>
  );
};
