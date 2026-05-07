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

const RESOLVER_X = 390, RESOLVER_Y = 290, RESOLVER_W = 300, RESOLVER_H = 80;
const RESOLVER_CX = RESOLVER_X + RESOLVER_W / 2;
const RESOLVER_CY = RESOLVER_Y + RESOLVER_H / 2;

const AGENT_A_X = 80,  AGENT_Y = 290, AGENT_W = 220, AGENT_H = 80;
const AGENT_B_X = 780;

export const ConflictResDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const agentsIn    = p(frame, duration, 0.00, 0.22);
  const proposalP   = p(frame, duration, 0.22, 0.45);
  const resolverIn  = p(frame, duration, 0.45, 0.62);
  const weighP      = p(frame, duration, 0.62, 0.82);
  const decisionP   = p(frame, duration, 0.82, 1.00);

  const hiConflict = hi("CONFLICT");
  const hiResolve  = hi("RESOLVE");

  const agentACX = AGENT_A_X + AGENT_W / 2;
  const agentBCX = AGENT_B_X + AGENT_W / 2;
  const agentCY  = AGENT_Y + AGENT_H / 2;

  // Proposal dots travel to resolver
  const propADotX = agentACX + (RESOLVER_X - agentACX - AGENT_W / 2) * Math.min(1, proposalP * 1.8);
  const propBDotX = agentBCX + (RESOLVER_X + RESOLVER_W - agentBCX + AGENT_W / 2) * Math.min(1, proposalP * 1.8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cr-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cr-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="cr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
        <marker id="cr-cyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="cr-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── Agent A ── */}
      <g opacity={agentsIn}>
        <rect x={AGENT_A_X} y={AGENT_Y} width={AGENT_W} height={AGENT_H} rx="14"
          fill={T.amber} fillOpacity={proposalP > 0 ? 0.25 : 0.12}
          stroke={T.amber} strokeWidth="2"
          filter={hiConflict ? "url(#cr-glow)" : undefined}
        />
        <text x={agentACX} y={AGENT_Y + 30} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1">
          AGENT A
        </text>
        <text x={agentACX} y={AGENT_Y + 54} textAnchor="middle"
          fill={T.amber} fontFamily={T.mono} fontSize="12">
          answer: 42
        </text>
      </g>

      {/* ── Agent B ── */}
      <g opacity={agentsIn}>
        <rect x={AGENT_B_X} y={AGENT_Y} width={AGENT_W} height={AGENT_H} rx="14"
          fill={T.cyan} fillOpacity={proposalP > 0 ? 0.25 : 0.12}
          stroke={T.cyan} strokeWidth="2"
          filter={hiConflict ? "url(#cr-glow)" : undefined}
        />
        <text x={agentBCX} y={AGENT_Y + 30} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="1">
          AGENT B
        </text>
        <text x={agentBCX} y={AGENT_Y + 54} textAnchor="middle"
          fill={T.cyan} fontFamily={T.mono} fontSize="12">
          answer: 7
        </text>
      </g>

      {/* ── Conflict sparks between agents ── */}
      {proposalP > 0.3 && proposalP < 0.85 && (
        <g opacity={Math.min(1, (proposalP - 0.3) * 3)}>
          <text x={W / 2} y={AGENT_Y + AGENT_H / 2 + 8} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="26" fontWeight="800"
            filter="url(#cr-glow)">
            ≠
          </text>
          <text x={W / 2} y={AGENT_Y - 18} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            CONFLICT
          </text>
        </g>
      )}

      {/* ── Proposal arrows ── */}
      {proposalP > 0 && (
        <g opacity={Math.min(1, proposalP * 3)}>
          <line x1={AGENT_A_X + AGENT_W} y1={agentCY} x2={RESOLVER_X} y2={RESOLVER_CY}
            stroke={T.amber} strokeWidth="2" markerEnd="url(#cr-amber)" />
          <line x1={AGENT_B_X} y1={agentCY} x2={RESOLVER_X + RESOLVER_W} y2={RESOLVER_CY}
            stroke={T.cyan} strokeWidth="2" markerEnd="url(#cr-cyan)" />
          {/* traveling dots */}
          {proposalP < 0.9 && (
            <>
              <circle cx={propADotX} cy={agentCY} r={8} fill={T.amber} opacity={0.9}
                filter="url(#cr-glow-sm)" />
              <circle cx={propBDotX} cy={agentCY} r={8} fill={T.cyan} opacity={0.9}
                filter="url(#cr-glow-sm)" />
            </>
          )}
        </g>
      )}

      {/* ── RESOLVER ── */}
      {resolverIn > 0 && (
        <g opacity={resolverIn}>
          <rect x={RESOLVER_X} y={RESOLVER_Y} width={RESOLVER_W} height={RESOLVER_H} rx="16"
            fill={T.violet} fillOpacity={hiResolve ? 0.28 : 0.16}
            stroke={T.violet} strokeWidth={hiResolve ? 3 : 2}
            filter={hiResolve ? "url(#cr-glow)" : undefined}
          />
          <text x={RESOLVER_CX} y={RESOLVER_Y + 32} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2">
            RESOLVER
          </text>
          <text x={RESOLVER_CX} y={RESOLVER_Y + 56} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11">
            ARBITER
          </text>
        </g>
      )}

      {/* ── Evaluation criteria notes ── */}
      {weighP > 0 && (
        <g opacity={Math.min(1, weighP * 2.5)}>
          {/* confidence note A */}
          <rect x={140} y={430} width={160} height={38} rx="8"
            fill={T.bgDeep} stroke={T.amber} strokeWidth="1" />
          <text x={220} y={445} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="10">confidence:</text>
          <text x={220} y={461} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="11" fontWeight="700">0.85</text>

          {/* confidence note B */}
          <rect x={780} y={430} width={160} height={38} rx="8"
            fill={T.bgDeep} stroke={T.cyan} strokeWidth="1" />
          <text x={860} y={445} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="10">confidence:</text>
          <text x={860} y={461} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="11" fontWeight="700">0.42</text>

          {/* source quality */}
          <rect x={RESOLVER_CX - 90} y={RESOLVER_Y + RESOLVER_H + 20} width={180} height={34} rx="8"
            fill={T.bgDeep} stroke={T.violet} strokeWidth="1" />
          <text x={RESOLVER_CX} y={RESOLVER_Y + RESOLVER_H + 36} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="10">source quality</text>
          <text x={RESOLVER_CX} y={RESOLVER_Y + RESOLVER_H + 50} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="9" opacity={0.75}>evaluating...</text>

          {/* Weighing pulse */}
          {weighP > 0.4 && (
            <circle cx={RESOLVER_CX} cy={RESOLVER_CY} r={40 + weighP * 20}
              fill="none" stroke={T.violet} strokeWidth="1.5" opacity={0.3 * (1 - weighP)} />
          )}
        </g>
      )}

      {/* ── Decision ── */}
      {decisionP > 0 && (
        <g opacity={decisionP}>
          <rect x={RESOLVER_CX - 200} y={580} width={400} height={60} rx="30"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2.5"
            filter="url(#cr-glow)"
          />
          <text x={RESOLVER_CX} y={608} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2">
            RESOLVED: answer = 42
          </text>
          <text x={RESOLVER_CX} y={630} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="11" opacity={0.8}>
            confidence 0.85  ✓
          </text>
          {/* Winner check */}
          <text x={agentACX} y={AGENT_Y - 18} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="22" fontWeight="800"
            filter="url(#cr-glow-sm)">
            ✓
          </text>
        </g>
      )}
    </svg>
  );
};
