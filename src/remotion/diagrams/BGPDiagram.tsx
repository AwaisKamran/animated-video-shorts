import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

const AS_NODES = [
  { id: "AS1", x: 220,  y: 230, color: T.cyan,   label: "AS1",   sub: "ISP-A",    rx: 130, ry: 90 },
  { id: "AS2", x: 210,  y: 460, color: T.violet,  label: "AS2",   sub: "ISP-B",    rx: 120, ry: 85 },
  { id: "AS3", x: 600,  y: 310, color: T.amber,   label: "AS3",   sub: "Backbone", rx: 150, ry: 100 },
  { id: "AS4", x: 920,  y: 340, color: T.mint,    label: "AS4",   sub: "CDN",      rx: 110, ry: 85 },
];

const PEERS = [
  { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 2 }, { a: 2, b: 3 },
];

// Routers inside each AS
const ROUTERS: { asIdx: number; dx: number; dy: number }[] = [
  { asIdx: 0, dx: -40, dy: -20 }, { asIdx: 0, dx: 30, dy: 20 }, { asIdx: 0, dx: -10, dy: 30 },
  { asIdx: 1, dx: -30, dy: -20 }, { asIdx: 1, dx: 25, dy: 15 }, { asIdx: 1, dx: -5, dy: 30 },
  { asIdx: 2, dx: -50, dy: -20 }, { asIdx: 2, dx: 40, dy: 20 }, { asIdx: 2, dx: 0, dy: 40 },
  { asIdx: 3, dx: -30, dy: -15 }, { asIdx: 3, dx: 25, dy: 20 },
];

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const BGPDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const asIn      = p(frame, duration, 0.00, 0.22);
  const peersIn   = p(frame, duration, 0.22, 0.44);
  const pulseP    = p(frame, duration, 0.44, 0.80);   // route announcement pulse
  const tableIn   = p(frame, duration, 0.80, 0.93);
  const doneA     = p(frame, duration, 0.93, 1.00);

  const bgpColor   = hi("BGP")    ? T.cyan  : T.cyan;
  const asColor    = hi("AS")     ? T.amber : T.amber;
  const routeColor = hi("ROUTE")  ? T.mint  : T.mint;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="bgp-glow">
          <feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bgp-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {AS_NODES.map((as) => (
          <radialGradient key={as.id} id={`grad-${as.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={as.color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={as.color} stopOpacity="0.03" />
          </radialGradient>
        ))}
      </defs>

      {/* BGP peering connections */}
      {PEERS.map(({ a, b }, i) => {
        const n1 = AS_NODES[a], n2 = AS_NODES[b];
        const peerProg = Math.min(Math.max((peersIn - i * 0.12) / 0.3, 0), 1);
        const dx = n2.x - n1.x, dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ex1 = n1.x + (dx / dist) * n1.rx;
        const ey1 = n1.y + (dy / dist) * n1.ry;
        const ex2 = n2.x - (dx / dist) * n2.rx;
        const ey2 = n2.y - (dy / dist) * n2.ry;
        const midX = (ex1 + ex2) / 2;
        const midY = (ey1 + ey2) / 2;
        // Pulse animation along this peer line
        const pulseDot = pulseP > 0 && pulseP < 1;
        const dotX = ex1 + (ex2 - ex1) * pulseP;
        const dotY = ey1 + (ey2 - ey1) * pulseP;
        return (
          <g key={i}>
            <line x1={ex1} y1={ey1}
              x2={ex1 + (ex2 - ex1) * peerProg}
              y2={ey1 + (ey2 - ey1) * peerProg}
              stroke={bgpColor} strokeWidth="2.5" strokeDasharray="10 5"
              opacity={0.6} />
            {peerProg >= 1 && (
              <text x={midX} y={midY - 10} textAnchor="middle"
                fill={bgpColor} fontFamily={T.mono} fontSize="11" opacity="0.6">BGP</text>
            )}
            {pulseDot && pulseP > 0.1 && pulseP < 0.95 && (
              <circle cx={dotX} cy={dotY} r="8" fill={routeColor} filter="url(#bgp-glow-sm)" />
            )}
          </g>
        );
      })}

      {/* AS blobs */}
      {AS_NODES.map((as, i) => {
        const asAlpha = Math.min(Math.max((asIn - i * 0.08) / 0.2, 0), 1);
        const isPulse = pulseP > 0.2;
        return (
          <g key={as.id} opacity={asAlpha}>
            {/* Blob background */}
            <ellipse cx={as.x} cy={as.y} rx={as.rx} ry={as.ry}
              fill={`url(#grad-${as.id})`}
              stroke={isPulse ? as.color : as.color}
              strokeWidth={isPulse ? "2.5" : "1.5"}
              strokeDasharray={isPulse ? "none" : "none"}
              filter={isPulse ? "url(#bgp-glow)" : undefined}
            />
            {/* AS label */}
            <text x={as.x} y={as.y - as.ry + 28} textAnchor="middle"
              fill={as.color} fontFamily={T.sans} fontSize="17" fontWeight="800" letterSpacing="2">
              {hi("AS") ? as.label : as.label}
            </text>
            <text x={as.x} y={as.y - as.ry + 46} textAnchor="middle"
              fill={as.color} fontFamily={T.sans} fontSize="13" opacity="0.7">{as.sub}</text>
          </g>
        );
      })}

      {/* Routers inside ASes */}
      {ROUTERS.map((r, i) => {
        const as = AS_NODES[r.asIdx];
        const asAlpha = Math.min(Math.max((asIn - r.asIdx * 0.08) / 0.2, 0), 1);
        return (
          <g key={i} opacity={asAlpha * 0.9}>
            <circle cx={as.x + r.dx} cy={as.y + r.dy} r="10"
              fill={T.bgDeep} stroke={as.color} strokeWidth="1.5" />
            <g transform={`translate(${as.x + r.dx - 7}, ${as.y + r.dy - 7})`}>
              <NodeIcon type="router" size={14} color={as.color} />
            </g>
          </g>
        );
      })}

      {/* Route announcement: AS1 label */}
      {pulseP > 0 && (
        <g opacity={Math.min(pulseP * 2, 1)}>
          <rect x={AS_NODES[0].x - 84} y={AS_NODES[0].y + AS_NODES[0].ry + 8} width={168} height={36} rx="18"
            fill={T.bgDeep} stroke={routeColor} strokeWidth="1.5" />
          <text x={AS_NODES[0].x} y={AS_NODES[0].y + AS_NODES[0].ry + 31} textAnchor="middle"
            fill={routeColor} fontFamily={T.mono} fontSize="13" fontWeight="700">
            10.0.0.0/8 →
          </text>
        </g>
      )}

      {/* Routing table near AS3 */}
      {tableIn > 0 && (
        <g opacity={tableIn}>
          <rect x={AS_NODES[2].x - 10} y={AS_NODES[2].y + AS_NODES[2].ry + 8}
            width={230} height={64} rx="10"
            fill={T.bgDeep} stroke={asColor} strokeWidth="1.5" strokeOpacity="0.8" />
          <text x={AS_NODES[2].x + 105} y={AS_NODES[2].y + AS_NODES[2].ry + 30} textAnchor="middle"
            fill={asColor} fontFamily={T.mono} fontSize="12" fontWeight="700" letterSpacing="1">
            ROUTING TABLE
          </text>
          <text x={AS_NODES[2].x + 105} y={AS_NODES[2].y + AS_NODES[2].ry + 52} textAnchor="middle"
            fill={routeColor} fontFamily={T.mono} fontSize="12">
            10.0.0.0/8 via AS1
          </text>
        </g>
      )}

      {/* Done label */}
      {doneA > 0 && (
        <g opacity={doneA}>
          <rect x={W / 2 - 230} y={640} width={460} height={44} rx="22"
            fill={bgpColor} opacity="0.12" />
          <text x={W / 2} y={668} textAnchor="middle"
            fill={bgpColor} fontFamily={T.sans} fontSize="17" fontWeight="700" letterSpacing="0.5">
            INTERNET IS A NETWORK OF NETWORKS
          </text>
        </g>
      )}
    </svg>
  );
};
