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

const CX = 540, CY = 340;
const BOX_W = 240, BOX_H = 100;
const DIST = 220;

const FAILURES = [
  {
    id: "INFINITE LOOP",
    label: "Infinite Loop",
    desc: "agent stuck repeating",
    angle: -135,
    term: "INFINITE LOOP",
  },
  {
    id: "HALLUCINATION",
    label: "Hallucinated Tool",
    desc: "calling tool that doesn't exist",
    angle: -45,
    term: "HALLUCINATION",
  },
  {
    id: "LOST_CONTEXT",
    label: "Lost Context",
    desc: "forgot the goal",
    angle: 135,
    term: "HALLUCINATION",
  },
  {
    id: "DRIFT",
    label: "Off-Task Drift",
    desc: "wandered from task",
    angle: 45,
    term: "DRIFT",
  },
];

export const AgentFailDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const agentIn  = p(frame, duration, 0.00, 0.18);
  const fail0In  = p(frame, duration, 0.18, 0.38);
  const fail1In  = p(frame, duration, 0.38, 0.56);
  const fail2In  = p(frame, duration, 0.56, 0.74);
  const fail3In  = p(frame, duration, 0.74, 0.92);
  const finalIn  = p(frame, duration, 0.92, 1.00);

  const failProgress = [fail0In, fail1In, fail2In, fail3In];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="afd-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="afd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="afd-coral-glow">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={58} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={agentIn}>
        COMMON AGENT FAILURE MODES
      </text>

      {/* Agent center node */}
      {agentIn > 0 && (
        <g opacity={agentIn}>
          <circle cx={CX} cy={CY} r={60}
            fill={T.nodeFill} stroke={T.violet} strokeWidth="2.5"
            filter="url(#afd-glow-sm)"
          />
          <text x={CX} y={CY - 8} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800">
            AGENT
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="10" opacity="0.65">
            LLM-based
          </text>
        </g>
      )}

      {/* Failure boxes */}
      {FAILURES.map((fail, i) => {
        const fp = failProgress[i];
        if (fp <= 0) return null;
        const isHi = hi(fail.term);
        const rad = (fail.angle * Math.PI) / 180;
        const bx = CX + Math.cos(rad) * DIST - BOX_W / 2;
        const by = CY + Math.sin(rad) * DIST - BOX_H / 2;
        const linex1 = CX + Math.cos(rad) * 62;
        const liney1 = CY + Math.sin(rad) * 62;
        const linex2 = CX + Math.cos(rad) * (DIST - BOX_W / 2 - 6);
        const liney2 = CY + Math.sin(rad) * (DIST - BOX_H / 2 - 6);

        return (
          <g key={fail.id} opacity={fp}>
            {/* Connector line */}
            <line x1={linex1} y1={liney1} x2={linex2} y2={liney2}
              stroke={T.coral} strokeWidth="2" strokeDasharray="5 4"
              opacity={isHi ? 0.9 : 0.55}
            />
            {/* Box */}
            <rect x={bx} y={by} width={BOX_W} height={BOX_H} rx="14"
              fill={T.coral} fillOpacity={isHi ? 0.22 : 0.1}
              stroke={T.coral} strokeWidth={isHi ? 2.5 : 1.5}
              filter={isHi ? "url(#afd-coral-glow)" : undefined}
            />
            {/* Red X icon */}
            <text x={bx + 28} y={by + 40} textAnchor="middle"
              fill={T.coral} fontFamily={T.mono} fontSize="22" fontWeight="900"
              filter="url(#afd-glow-sm)">
              ✕
            </text>
            {/* Label */}
            <text x={bx + BOX_W / 2 + 8} y={by + 36} textAnchor="middle"
              fill={T.coral} fontFamily={T.sans} fontSize="13" fontWeight="800">
              {fail.label}
            </text>
            {/* Description */}
            <text x={bx + BOX_W / 2 + 8} y={by + 56} textAnchor="middle"
              fill={T.coral} fontFamily={T.mono} fontSize="10"
              opacity={Math.min(1, fp * 2.5) * 0.75}>
              {fail.desc}
            </text>

            {/* Warning indicator shimmer on highlight */}
            {isHi && (
              <rect x={bx - 2} y={by - 2} width={BOX_W + 4} height={BOX_H + 4} rx="16"
                fill="none" stroke={T.coral} strokeWidth="2"
                opacity={0.4 + 0.4 * Math.sin(frame / 6)}
                filter="url(#afd-coral-glow)"
              />
            )}
          </g>
        );
      })}

      {/* Final badge */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={W / 2 - 230} y={640} width={460} height={44} rx="22"
            fill={T.coral} fillOpacity={0.12} stroke={T.coral} strokeWidth="1.5"
          />
          <text x={W / 2} y={667} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            AGENTS FAIL MORE THAN YOU'D EXPECT
          </text>
        </g>
      )}
    </svg>
  );
};
