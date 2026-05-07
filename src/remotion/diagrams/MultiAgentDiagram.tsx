import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// Central bus
const BUS_X = 340, BUS_Y = 290, BUS_W = 400, BUS_H = 60;
const BUS_CX = BUS_X + BUS_W / 2;
const BUS_CY = BUS_Y + BUS_H / 2;

const AGENTS = [
  { id: "researcher", label: "RESEARCHER", iconType: "globe"   as const, color: T.cyan,   x: 100, y: 220 },
  { id: "writer",     label: "WRITER",     iconType: "browser" as const, color: T.violet, x: 100, y: 420 },
  { id: "reviewer",   label: "REVIEWER",   iconType: "shield"  as const, color: T.amber,  x: 900, y: 220 },
  { id: "editor",     label: "EDITOR",     iconType: "server"  as const, color: T.mint,   x: 900, y: 420 },
];

const BOX_W = 160, BOX_H = 70;

export const MultiAgentDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const structIn  = p(frame, duration, 0.00, 0.25);
  const phase1P   = p(frame, duration, 0.25, 0.50);  // Researcher
  const phase2P   = p(frame, duration, 0.50, 0.65);  // Writer
  const phase3P   = p(frame, duration, 0.65, 0.80);  // Reviewer
  const phase4P   = p(frame, duration, 0.80, 1.00);  // Editor + done

  const hiCollab   = hi("COLLABORATION");

  const phaseProgress = [phase1P, phase2P, phase3P, phase4P];

  function connectionLine(agent: typeof AGENTS[number]) {
    // Connection from agent box edge to bus edge
    const agentCX = agent.x + BOX_W / 2;
    const agentCY = agent.y + BOX_H / 2;
    const busEdgeX = agent.x < BUS_X ? BUS_X : BUS_X + BUS_W;
    const busEdgeY = BUS_CY;
    return { x1: agent.x < BUS_X ? agent.x + BOX_W : agent.x, y1: agentCY, x2: busEdgeX, y2: busEdgeY };
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ma-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ma-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Central message bus ── */}
      <g opacity={structIn}>
        <rect x={BUS_X} y={BUS_Y} width={BUS_W} height={BUS_H} rx="14"
          fill={T.bgDeep}
          stroke={hiCollab ? T.mint : T.borderStrong}
          strokeWidth={hiCollab ? 2.5 : 2}
          filter={hiCollab ? "url(#ma-glow)" : undefined}
        />
        <text x={BUS_CX} y={BUS_CY + 6} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="2">
          SHARED CONTEXT BUS
        </text>
      </g>

      {/* ── Agents ── */}
      {AGENTS.map((agent, i) => {
        const conn = connectionLine(agent);
        const isActive = phaseProgress[i] > 0;
        const isDone   = phaseProgress[i] > 0.8;
        const hiAgent  = hi(agent.label) || (hiCollab && isActive);

        return (
          <g key={agent.id} opacity={structIn}>
            {/* Connection line */}
            <line x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
              stroke={isActive ? agent.color : T.border}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeDasharray={isActive ? "none" : "5 4"}
              filter={isActive ? "url(#ma-glow-sm)" : undefined}
            />

            {/* Flow dot */}
            {isActive && phaseProgress[i] < 0.8 && (() => {
              const prog = phaseProgress[i] * (1 / 0.8);
              const fromX = conn.x1 + (conn.x2 - conn.x1) * Math.min(1, prog * 2);
              const fromY = conn.y1 + (conn.y2 - conn.y1) * Math.min(1, prog * 2);
              return (
                <circle cx={fromX} cy={fromY} r={8} fill={agent.color}
                  opacity={0.9} filter="url(#ma-glow-sm)"
                />
              );
            })()}

            {/* Agent box */}
            <rect x={agent.x} y={agent.y} width={BOX_W} height={BOX_H} rx="14"
              fill={agent.color} fillOpacity={isActive ? 0.25 : 0.10}
              stroke={agent.color} strokeWidth={hiAgent ? 2.5 : 1.5}
              filter={hiAgent ? "url(#ma-glow)" : undefined}
            />
            <g transform={`translate(${agent.x + 14}, ${agent.y + BOX_H / 2 - 11})`}>
              <NodeIcon type={agent.iconType} size={22} color={agent.color} />
            </g>
            <text x={agent.x + 46} y={agent.y + BOX_H / 2 + 6} textAnchor="start"
              fill={agent.color} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
              {agent.label}
            </text>

            {/* Done checkmark */}
            {isDone && (
              <text x={agent.x + BOX_W / 2} y={agent.y - 10} textAnchor="middle"
                fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800">
                ✓
              </text>
            )}
          </g>
        );
      })}

      {/* ── DONE badge ── */}
      {phase4P > 0.8 && (
        <g opacity={(phase4P - 0.8) * 5}>
          <rect x={W / 2 - 120} y={610} width={240} height={52} rx="26"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#ma-glow)"
          />
          <text x={W / 2} y={643} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="3">
            DONE
          </text>
        </g>
      )}
    </svg>
  );
};
