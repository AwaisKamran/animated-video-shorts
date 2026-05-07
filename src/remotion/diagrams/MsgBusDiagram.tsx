import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const BUS_Y = 340;
const BUS_X1 = 80, BUS_X2 = 1000;
const BUS_CY = BUS_Y;

const AGENTS = [
  { id: "agentA", label: "AGENT A", role: "PUBLISHER", color: T.amber,  x: 160, y: 160, above: true },
  { id: "agentB", label: "AGENT B", role: "SUBSCRIBER", color: T.cyan,  x: 380, y: 500, above: false },
  { id: "agentC", label: "AGENT C", role: "SUBSCRIBER", color: T.mint,  x: 620, y: 500, above: false },
  { id: "agentD", label: "AGENT D", role: "SUBSCRIBER", color: T.violet, x: 860, y: 160, above: true },
];
const BOX_W = 148, BOX_H = 64;

export const MsgBusDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const busIn      = p(frame, duration, 0.00, 0.18);
  const agentsIn   = p(frame, duration, 0.18, 0.36);
  const publishP   = p(frame, duration, 0.36, 0.58);
  const travelP    = p(frame, duration, 0.58, 0.78);
  const receiveP   = p(frame, duration, 0.78, 1.00);

  const hiBus    = hi("MESSAGE BUS");
  const hiPubSub = hi("PUB/SUB");

  const agentA = AGENTS[0];
  // Publisher dot: travels from agent A down to bus, then along bus
  const pubDotConnY = agentA.y + BOX_H;
  const pubDotBusX  = agentA.x + BOX_W / 2;

  // Phase: dot travels from A to bus
  const pubToBusProg = Math.min(1, publishP * 2.5);
  const pubDotX = pubDotBusX;
  const pubDotY = pubDotConnY + (BUS_CY - pubDotConnY) * pubToBusProg;

  // After reaching bus, packet travels along bus from left to right
  const travelDotX = BUS_X1 + (BUS_X2 - BUS_X1) * travelP;

  // Packets received by subscribers
  const subB = AGENTS[1], subC = AGENTS[2];
  const subBTopY = subB.y;
  const subCTopY = subC.y;
  const subBBusX = subB.x + BOX_W / 2;
  const subCBusX = subC.x + BOX_W / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="bus-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bus-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="bus-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
      </defs>

      {/* ── THE BUS ── */}
      <g opacity={busIn}>
        <rect x={BUS_X1 - 10} y={BUS_CY - 22} width={BUS_X2 - BUS_X1 + 20} height={44} rx="22"
          fill={T.bgDeep}
          stroke={hiBus || hiPubSub ? T.violet : T.borderStrong}
          strokeWidth={hiBus || hiPubSub ? 3 : 2}
          filter={hiBus || hiPubSub ? "url(#bus-glow)" : undefined}
        />
        <text x={(BUS_X1 + BUS_X2) / 2} y={BUS_CY + 7} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="3">
          THE BUS
        </text>
        <text x={88} y={BUS_CY - 32} textAnchor="start"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="2" opacity={0.6}>
          BUS
        </text>
      </g>

      {/* ── Agents ── */}
      {AGENTS.map((agent, i) => {
        const cx = agent.x + BOX_W / 2;
        const connY1 = agent.above ? agent.y + BOX_H : agent.y;
        const connY2 = BUS_CY;
        const isActive = i === 0 ? publishP > 0 : receiveP > 0 && !agent.above;
        const hiAgent = hi(agent.label);

        return (
          <g key={agent.id} opacity={agentsIn}>
            {/* Connector line */}
            <line x1={cx} y1={connY1} x2={cx} y2={connY2}
              stroke={isActive ? agent.color : T.border}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeDasharray={isActive ? "none" : "5 4"}
              filter={isActive ? "url(#bus-glow-sm)" : undefined}
            />
            {/* Agent box */}
            <rect x={agent.x} y={agent.y} width={BOX_W} height={BOX_H} rx="14"
              fill={agent.color} fillOpacity={isActive ? 0.26 : 0.12}
              stroke={agent.color} strokeWidth={hiAgent || isActive ? 2.5 : 1.5}
              filter={hiAgent ? "url(#bus-glow)" : undefined}
            />
            <text x={cx} y={agent.y + 26} textAnchor="middle"
              fill={agent.color} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
              {agent.label}
            </text>
            <text x={cx} y={agent.y + 46} textAnchor="middle"
              fill={agent.color} fontFamily={T.mono} fontSize="10" opacity={0.75}>
              {agent.role}
            </text>
          </g>
        );
      })}

      {/* ── Publisher label ── */}
      {agentsIn > 0.5 && (
        <text x={agentA.x + BOX_W / 2} y={agentA.y - 14} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
          opacity={agentsIn}>
          PUBLISHER
        </text>
      )}

      {/* ── Packet: A → bus ── */}
      {publishP > 0 && publishP < 0.85 && (
        <circle cx={pubDotX} cy={pubDotY} r={9}
          fill={T.amber} opacity={0.95}
          filter="url(#bus-glow-sm)"
        />
      )}

      {/* ── Packet traveling along bus ── */}
      {travelP > 0 && travelP < 0.95 && (
        <g>
          <circle cx={travelDotX} cy={BUS_CY} r={9}
            fill={T.amber} opacity={0.95}
            filter="url(#bus-glow)"
          />
          <text x={travelDotX} y={BUS_CY - 18} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="9" opacity={0.8}>
            MSG
          </text>
        </g>
      )}

      {/* ── Subscriber receive dots ── */}
      {receiveP > 0 && (
        <>
          {/* Packet to sub B */}
          <circle cx={subBBusX}
            cy={BUS_CY + (subBTopY - BUS_CY) * Math.min(1, receiveP * 2)}
            r={8} fill={T.cyan} opacity={0.9}
            filter="url(#bus-glow-sm)"
          />
          {/* Packet to sub C */}
          {receiveP > 0.3 && (
            <circle cx={subCBusX}
              cy={BUS_CY + (subCTopY - BUS_CY) * Math.min(1, (receiveP - 0.3) * 2.5)}
              r={8} fill={T.mint} opacity={0.9}
              filter="url(#bus-glow-sm)"
            />
          )}
        </>
      )}

      {/* ── SUBSCRIBERS label ── */}
      {receiveP > 0.5 && (
        <text x={W / 2} y={592} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="2"
          opacity={Math.min(1, (receiveP - 0.5) * 2)}>
          SUBSCRIBERS
        </text>
      )}

      {/* ── Done badge ── */}
      {receiveP > 0.85 && (
        <g opacity={Math.min(1, (receiveP - 0.85) * 6.6)}>
          <rect x={W / 2 - 190} y={618} width={380} height={50} rx="25"
            fill={T.violet} fillOpacity={0.14}
            stroke={T.violet} strokeWidth="2"
            filter="url(#bus-glow-sm)"
          />
          <text x={W / 2} y={649} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            PUB/SUB DELIVERED
          </text>
        </g>
      )}
    </svg>
  );
};
