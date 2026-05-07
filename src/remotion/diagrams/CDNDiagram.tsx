import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const ORIGIN_X = 540, ORIGIN_Y = 310, OR = 58;

// Pentagon — flat-top: top node at 270° (straight up), others 72° apart
const ER_DIST = 215;
const EDGE_NODES = [
  { id: "us-east", x: 540, y: 95,  label: "US-East" },  // 270°
  { id: "au",      x: 744, y: 244, label: "AU"       },  // 342°
  { id: "asia",    x: 666, y: 484, label: "Asia"     },  // 54°
  { id: "eu-west", x: 414, y: 484, label: "EU-West"  },  // 126°
  { id: "us-west", x: 336, y: 244, label: "US-West"  },  // 198°
];
const ER = 46;

const USERS = [
  { x: 180, y: 640, nearest: 3 },  // EU-West
  { x: 666, y: 655, nearest: 2 },  // Asia — directly below
  { x: 930, y: 640, nearest: 1 },  // AU
];

function edgePt(ax: number, ay: number, bx: number, by: number, r: number) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  return { x: ax + (dx / d) * r, y: ay + (dy / d) * r };
}

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const CDNDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn   = p(frame, duration, 0.00, 0.20);
  const distP     = p(frame, duration, 0.20, 0.62);
  const userReqP  = p(frame, duration, 0.62, 0.87);
  const cacheHitP = p(frame, duration, 0.87, 0.95);
  const latencyA  = p(frame, duration, 0.95, 1.00);

  const cdnColor   = hi("CDN")   ? T.cyan  : T.cyan;
  const cacheColor = hi("CACHE") ? T.mint  : T.mint;
  const edgeColor  = hi("EDGE")  ? T.amber : T.amber;

  const ACTIVE_USER = 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cdn-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cdn-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Origin → Edge lines (direction-aware) */}
      {EDGE_NODES.map((e) => {
        const from = edgePt(ORIGIN_X, ORIGIN_Y, e.x, e.y, OR);
        const to   = edgePt(e.x, e.y, ORIGIN_X, ORIGIN_Y, ER);
        return (
          <line key={e.id}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={cdnColor} strokeWidth="1.5" strokeDasharray="8 4"
            opacity={nodesIn * (distP > 0 ? 0.85 : 0.5)}
          />
        );
      })}

      {/* User → Edge lines */}
      {USERS.map((u, i) => {
        const edge = EDGE_NODES[u.nearest];
        const to   = edgePt(edge.x, edge.y, u.x, u.y, ER);
        const isActive = i === ACTIVE_USER;
        return (
          <line key={i}
            x1={u.x} y1={u.y - 18} x2={to.x} y2={to.y}
            stroke={isActive ? cacheColor : T.textSecondary}
            strokeWidth={isActive ? "2" : "1"}
            opacity={nodesIn * (isActive ? 0.9 : 0.5)}
          />
        );
      })}

      {/* Origin server */}
      <g opacity={nodesIn}>
        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={OR} fill={T.nodeFill}
          stroke={T.amber} strokeWidth="2.5"
          filter={distP > 0.2 ? "url(#cdn-glow)" : undefined}
        />
        <g transform={`translate(${ORIGIN_X - 18}, ${ORIGIN_Y - 20})`}>
          <NodeIcon type="server" size={36} color={T.amber} />
        </g>
        <text x={ORIGIN_X} y={ORIGIN_Y + OR + 24} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="17" fontWeight="700" letterSpacing="2">ORIGIN</text>
      </g>

      {/* Edge nodes */}
      {EDGE_NODES.map((e, i) => {
        const isNearest = USERS[ACTIVE_USER].nearest === i;
        return (
          <g key={e.id} opacity={nodesIn}>
            <circle cx={e.x} cy={e.y} r={ER} fill={T.nodeFill}
              stroke={isNearest && userReqP > 0.3 ? cacheColor : cdnColor}
              strokeWidth={isNearest && userReqP > 0.3 ? "2.5" : "1.5"}
              filter={isNearest && cacheHitP > 0.3 ? "url(#cdn-glow)" : undefined}
            />
            <g transform={`translate(${e.x - 15}, ${e.y - 16})`}>
              <NodeIcon type="globe" size={30} color={edgeColor} />
            </g>
            <text x={e.x} y={e.y + ER + 22} textAnchor="middle"
              fill={T.textSecondary} fontFamily={T.sans} fontSize="14" fontWeight="500">{e.label}</text>
            {distP > 0.5 && (
              <text x={e.x} y={e.y + ER + 38} textAnchor="middle"
                fill={cdnColor} fontFamily={T.mono} fontSize="11"
                opacity={Math.min((distP - 0.5) / 0.4, 1)}>CDN</text>
            )}
          </g>
        );
      })}

      {/* Users */}
      {USERS.map((u, i) => (
        <g key={i} opacity={nodesIn}>
          <circle cx={u.x} cy={u.y} r={24} fill={T.bgDeep}
            stroke={i === ACTIVE_USER ? cacheColor : T.nodeBorder} strokeWidth="1.5" />
          <g transform={`translate(${u.x - 12}, ${u.y - 13})`}>
            <NodeIcon type="laptop" size={24} color={T.textSecondary} />
          </g>
        </g>
      ))}

      {/* Distribution packets: origin → edges */}
      {distP > 0 && distP < 1 && EDGE_NODES.map((e, i) => {
        const offset = i * 0.08;
        const prog = Math.max(0, Math.min(1, (distP - offset) * 1.8));
        if (prog <= 0 || prog >= 1) return null;
        const from = edgePt(ORIGIN_X, ORIGIN_Y, e.x, e.y, OR);
        const to   = edgePt(e.x, e.y, ORIGIN_X, ORIGIN_Y, ER);
        const fx = from.x + (to.x - from.x) * prog;
        const fy = from.y + (to.y - from.y) * prog;
        return <circle key={e.id} cx={fx} cy={fy} r="7" fill={cdnColor} filter="url(#cdn-glow-sm)" />;
      })}

      {/* User request to nearest edge */}
      {userReqP > 0 && userReqP < 1 && (() => {
        const u = USERS[ACTIVE_USER];
        const edge = EDGE_NODES[u.nearest];
        const to = edgePt(edge.x, edge.y, u.x, u.y, ER);
        const fx = u.x + (to.x - u.x) * userReqP;
        const fy = (u.y - 18) + (to.y - (u.y - 18)) * userReqP;
        return <circle cx={fx} cy={fy} r="8" fill={cacheColor} filter="url(#cdn-glow-sm)" />;
      })()}

      {/* CACHE HIT badge */}
      {cacheHitP > 0 && (() => {
        const nearEdge = EDGE_NODES[USERS[ACTIVE_USER].nearest];
        return (
          <g opacity={cacheHitP}>
            <rect x={nearEdge.x - 44} y={nearEdge.y - ER - 52} width={88} height={34} rx="17"
              fill={cacheColor} opacity="0.18" />
            <text x={nearEdge.x} y={nearEdge.y - ER - 28} textAnchor="middle"
              fill={cacheColor} fontFamily={T.sans} fontSize="18" fontWeight="800">HIT</text>
          </g>
        );
      })()}

      {/* Latency labels */}
      {latencyA > 0 && (() => {
        const nearEdge = EDGE_NODES[USERS[ACTIVE_USER].nearest];
        const u = USERS[ACTIVE_USER];
        const midX = (u.x + nearEdge.x) / 2;
        const midY = (u.y + nearEdge.y) / 2;
        return (
          <g opacity={latencyA}>
            <rect x={midX - 36} y={midY - 18} width={72} height={28} rx="14"
              fill={T.bgDeep} stroke={cacheColor} strokeWidth="1" />
            <text x={midX} y={midY} textAnchor="middle"
              fill={cacheColor} fontFamily={T.mono} fontSize="14" fontWeight="700">8ms</text>
            <rect x={ORIGIN_X + OR + 12} y={ORIGIN_Y - 14} width={120} height={28} rx="14"
              fill={T.bgDeep} stroke={T.amber} strokeWidth="1" opacity="0.6" />
            <text x={ORIGIN_X + OR + 72} y={ORIGIN_Y + 6} textAnchor="middle"
              fill={T.amber} fontFamily={T.mono} fontSize="12" opacity="0.7">240ms direct</text>
          </g>
        );
      })()}
    </svg>
  );
};
