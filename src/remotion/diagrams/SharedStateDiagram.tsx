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

// Central store
const STORE_X = 390, STORE_Y = 240, STORE_W = 300, STORE_H = 190;
const STORE_CX = STORE_X + STORE_W / 2;
const STORE_CY = STORE_Y + STORE_H / 2;

// Agents
const AGENTS = [
  { id: "agentA", label: "AGENT A", op: "WRITE", color: T.amber, x: 100, y: 290 },
  { id: "agentB", label: "AGENT B", op: "READ",  color: T.cyan,  x: 790, y: 290 },
  { id: "agentC", label: "AGENT C", op: "WRITE", color: T.mint,  x: 440, y: 80  },
];
const BOX_W = 150, BOX_H = 64;

const KV_ROWS = [
  { key: "status",      val: "idle",    wVal: "working" },
  { key: "count",       val: "0",       wVal: "1"       },
  { key: "active_user", val: "null",    wVal: "null"    },
];

export const SharedStateDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const storeIn   = p(frame, duration, 0.00, 0.20);
  const agentsIn  = p(frame, duration, 0.20, 0.38);
  const writeAP   = p(frame, duration, 0.38, 0.56);
  const readBP    = p(frame, duration, 0.56, 0.72);
  const writeCfP  = p(frame, duration, 0.72, 1.00);

  const hiState = hi("SHARED STATE");
  const hiRead  = hi("READ");
  const hiWrite = hi("WRITE");

  // which KV values to show as updated
  const statusUpdated = writeAP > 0.8;
  const countUpdated  = writeCfP > 0.75;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ss-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ss-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="ss-write" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
        <marker id="ss-read" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="ss-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── Central State Store ── */}
      <g opacity={storeIn}>
        <rect x={STORE_X} y={STORE_Y} width={STORE_W} height={STORE_H} rx="16"
          fill={T.bgDeep}
          stroke={hiState ? T.violet : T.borderStrong}
          strokeWidth={hiState ? 3 : 2}
          filter={hiState ? "url(#ss-glow)" : undefined}
        />
        <text x={STORE_CX} y={STORE_Y + 30} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
          STATE STORE
        </text>
        {/* KV rows */}
        {KV_ROWS.map((row, i) => {
          const rowY = STORE_Y + 52 + i * 42;
          const isStatus = row.key === "status";
          const isCount  = row.key === "count";
          const dispVal  = isStatus && statusUpdated ? row.wVal
                         : isCount  && countUpdated  ? row.wVal
                         : row.val;
          const changed  = (isStatus && statusUpdated) || (isCount && countUpdated);
          return (
            <g key={row.key}>
              <rect x={STORE_X + 16} y={rowY - 14} width={STORE_W - 32} height={30} rx="6"
                fill={changed ? T.amber : T.bgDeep} fillOpacity={changed ? 0.18 : 0.5}
                stroke={changed ? T.amber : T.border} strokeWidth="1"
              />
              <text x={STORE_X + 32} y={rowY + 6} textAnchor="start"
                fill={T.textDim} fontFamily={T.mono} fontSize="12">
                {row.key}:
              </text>
              <text x={STORE_X + STORE_W - 32} y={rowY + 6} textAnchor="end"
                fill={changed ? T.amber : T.textSecondary}
                fontFamily={T.mono} fontSize="12" fontWeight={changed ? "700" : "400"}>
                "{dispVal}"
              </text>
            </g>
          );
        })}
      </g>

      {/* ── Agents + arrows ── */}
      {AGENTS.map((agent, i) => {
        const cx = agent.x + BOX_W / 2;
        const cy = agent.y + BOX_H / 2;
        const isAgentA = i === 0, isAgentB = i === 1, isAgentC = i === 2;
        const isActive = (isAgentA && writeAP > 0) || (isAgentB && readBP > 0) || (isAgentC && writeCfP > 0);
        const prog = isAgentA ? writeAP : isAgentB ? readBP : writeCfP;
        const arrowColor = isAgentB ? T.cyan : isAgentC ? T.mint : T.amber;
        const markerId = isAgentB ? "ss-read" : isAgentC ? "ss-mint" : "ss-write";
        const hiAgent = (isAgentA && hiWrite) || (isAgentB && hiRead) || (isAgentC && hiWrite);

        // Arrow endpoints: agent edge → store edge
        let x1 = cx, y1 = cy, x2 = STORE_CX, y2 = STORE_CY;
        if (isAgentA) { x1 = agent.x + BOX_W; x2 = STORE_X; y2 = STORE_CY; y1 = cy; }
        if (isAgentB) { x1 = agent.x;          x2 = STORE_X + STORE_W; y2 = STORE_CY; y1 = cy; }
        if (isAgentC) { x1 = cx; y1 = agent.y + BOX_H; x2 = STORE_CX; y2 = STORE_Y; }

        return (
          <g key={agent.id} opacity={agentsIn}>
            {/* Bidirectional arrow lines */}
            {isActive && (
              <g opacity={Math.min(1, prog * 3)}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={arrowColor} strokeWidth="2.5"
                  markerEnd={isAgentB ? undefined : `url(#${markerId})`}
                  filter="url(#ss-glow-sm)"
                />
                {isAgentB && (
                  <line x1={x2} y1={y2} x2={x1} y2={y1}
                    stroke={arrowColor} strokeWidth="2.5"
                    markerEnd={`url(#${markerId})`}
                    strokeDasharray="6 4"
                    filter="url(#ss-glow-sm)"
                  />
                )}
                {/* Traveling dot */}
                {prog < 0.85 && (
                  <circle
                    cx={x1 + (x2 - x1) * Math.min(1, prog * 1.4)}
                    cy={y1 + (y2 - y1) * Math.min(1, prog * 1.4)}
                    r={8} fill={arrowColor} opacity={0.9}
                    filter="url(#ss-glow-sm)"
                  />
                )}
                {/* Op label */}
                <text x={(x1 + x2) / 2 + (isAgentC ? 40 : 0)} y={(y1 + y2) / 2 - 12} textAnchor="middle"
                  fill={arrowColor} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
                  {agent.op}
                </text>
              </g>
            )}
            {/* Agent box */}
            <rect x={agent.x} y={agent.y} width={BOX_W} height={BOX_H} rx="14"
              fill={agent.color} fillOpacity={isActive ? 0.26 : 0.12}
              stroke={agent.color} strokeWidth={hiAgent || isActive ? 2.5 : 1.5}
              filter={hiAgent ? "url(#ss-glow)" : undefined}
            />
            <text x={cx} y={agent.y + 26} textAnchor="middle"
              fill={agent.color} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
              {agent.label}
            </text>
            <text x={cx} y={agent.y + 46} textAnchor="middle"
              fill={agent.color} fontFamily={T.mono} fontSize="10" opacity={0.75}>
              {agent.op}
            </text>
          </g>
        );
      })}

      {/* ── Conflict note (below store) ── */}
      {writeCfP > 0.35 && (
        <g opacity={Math.min(1, (writeCfP - 0.35) * 3)}>
          <rect x={STORE_CX - 130} y={STORE_Y + STORE_H + 22} width={260} height={56} rx="14"
            fill={T.coral} fillOpacity={0.14} stroke={T.coral} strokeWidth="1.5"
          />
          <text x={STORE_CX} y={STORE_Y + STORE_H + 44} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="2">
            CONFLICT AVOIDED
          </text>
          <text x={STORE_CX} y={STORE_Y + STORE_H + 64} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="10" opacity={0.8}>
            last-write-wins
          </text>
        </g>
      )}

      {/* ── Timeline label ── */}
      {writeCfP > 0.75 && (
        <g opacity={Math.min(1, (writeCfP - 0.75) * 4)}>
          <text x={W / 2} y={628} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11" letterSpacing="1">
            WRITE status="working" · READ count · WRITE count++
          </text>
        </g>
      )}
    </svg>
  );
};
