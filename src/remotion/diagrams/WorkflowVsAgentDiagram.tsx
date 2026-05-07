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

const LEFT_X = 80, RIGHT_X = 580;
const PANEL_W = 440, PANEL_H = 560;
const PANEL_Y = 80;

const WF_STEPS = ["Receive Query", "Fetch Data", "Process", "Validate", "Return Result"];

const TOOLS = [
  { label: "search_web", color: T.amber, angle: -60 },
  { label: "calculator",  color: T.mint,  angle:   0 },
  { label: "read_file",   color: T.cyan,  angle:  60 },
];

const AGENT_CX = RIGHT_X + PANEL_W / 2;
const AGENT_CY = PANEL_Y + PANEL_H / 2 - 10;
const AGENT_R  = 42;
const TOOL_DIST = 130;

export const WorkflowVsAgentDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  // Spread workflow across 50% of animation (was 30%) so each step has ~10%
  const panelsIn  = p(frame, duration, 0.00, 0.12);
  const wfFlowP   = p(frame, duration, 0.12, 0.62);
  // Agent side: LLM appears, then each tool selection is unhurried
  const agentInP  = p(frame, duration, 0.62, 0.72);
  const agent1P   = p(frame, duration, 0.72, 0.84); // chooses tool 0
  const agent2P   = p(frame, duration, 0.84, 0.95); // chooses tool 2
  const labelsIn  = p(frame, duration, 0.92, 1.00);

  const hiWf    = hi("WORKFLOW");
  const hiAgent = hi("AGENT");

  // Tool selection state
  // 0.0–0.3 of agentNP: LLM deciding; 0.3–0.7: dot travels; 0.7+: tool active
  const tool0Active = agent1P > 0.7;
  const tool2Active = agent2P > 0.7;
  const tool0Dot    = agent1P > 0.3 ? Math.min(1, (agent1P - 0.3) / 0.4) : 0;
  const tool2Dot    = agent2P > 0.3 ? Math.min(1, (agent2P - 0.3) / 0.4) : 0;
  const llmDeciding = agentInP < 1 || (agent1P > 0 && agent1P < 0.3) || (agent2P > 0 && agent2P < 0.3);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="wva-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="wva-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Panel backgrounds */}
      <g opacity={panelsIn}>
        <rect x={LEFT_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
          fill={T.cyan} fillOpacity={hiWf ? 0.12 : 0.06}
          stroke={T.cyan} strokeWidth={hiWf ? 2.5 : 1.5}
          filter={hiWf ? "url(#wva-glow)" : undefined}
        />
        <text x={LEFT_X + PANEL_W / 2} y={PANEL_Y + 36} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="2">
          WORKFLOW
        </text>
        <text x={LEFT_X + PANEL_W / 2} y={PANEL_Y + 56} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="11" opacity="0.55" letterSpacing="0.5">
          fixed steps · always the same order
        </text>

        <rect x={RIGHT_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
          fill={T.violet} fillOpacity={hiAgent ? 0.12 : 0.06}
          stroke={T.violet} strokeWidth={hiAgent ? 2.5 : 1.5}
          filter={hiAgent ? "url(#wva-glow)" : undefined}
        />
        <text x={RIGHT_X + PANEL_W / 2} y={PANEL_Y + 36} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="2">
          AGENT
        </text>
        <text x={RIGHT_X + PANEL_W / 2} y={PANEL_Y + 56} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="11" opacity="0.55" letterSpacing="0.5">
          LLM decides which tool to call
        </text>

        <line x1={W / 2} y1={PANEL_Y + 20} x2={W / 2} y2={PANEL_Y + PANEL_H - 20}
          stroke={T.border} strokeWidth="2" strokeDasharray="6 4"
        />
      </g>

      {/* Workflow steps — each step gets ~10% of total animation time */}
      {WF_STEPS.map((label, i) => {
        const stepIn  = Math.max(0, wfFlowP * 5 - i);
        const isDone  = wfFlowP > (i + 1) / 5;
        const isActive = stepIn > 0 && !isDone;
        const stepY   = PANEL_Y + 80 + i * 84;

        return (
          <g key={label} opacity={Math.min(panelsIn, stepIn > 0 ? 1 : 0.18)}>
            <rect x={LEFT_X + 20} y={stepY} width={PANEL_W - 40} height={52} rx="10"
              fill={T.cyan}
              fillOpacity={isActive ? 0.28 : isDone ? 0.13 : 0.05}
              stroke={T.cyan}
              strokeWidth={isActive ? 2.5 : 1.2}
              filter={isActive ? "url(#wva-glow-sm)" : undefined}
            />
            {/* Status icon */}
            <text x={LEFT_X + 38} y={stepY + 33} textAnchor="middle"
              fill={T.cyan} fontFamily={T.mono} fontSize="13">
              {isDone ? "✓" : isActive ? "▶" : "·"}
            </text>
            <text x={LEFT_X + 56} y={stepY + 33} textAnchor="start"
              fill={T.cyan} fontFamily={T.mono} fontSize="12"
              fontWeight={isActive ? "700" : "400"}>
              {label}
            </text>
            {isActive && (
              <text x={LEFT_X + PANEL_W - 28} y={stepY + 33} textAnchor="end"
                fill={T.cyan} fontFamily={T.sans} fontSize="10" opacity="0.75">
                RUNNING
              </text>
            )}
            {/* Connector line to next step */}
            {i < WF_STEPS.length - 1 && (
              <line x1={LEFT_X + PANEL_W / 2} y1={stepY + 52}
                x2={LEFT_X + PANEL_W / 2} y2={stepY + 84}
                stroke={T.cyan} strokeWidth="2" opacity={isDone ? 0.65 : 0.25}
              />
            )}
          </g>
        );
      })}

      {/* Agent: LLM center node */}
      {agentInP > 0 && (
        <g opacity={agentInP}>
          <circle cx={AGENT_CX} cy={AGENT_CY} r={AGENT_R}
            fill={T.nodeFill} stroke={T.violet} strokeWidth="2.5"
            filter={llmDeciding ? "url(#wva-glow-sm)" : undefined}
          />
          <text x={AGENT_CX} y={AGENT_CY + 6} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800">
            LLM
          </text>
          {llmDeciding && (
            <text x={AGENT_CX} y={AGENT_CY + AGENT_R + 20} textAnchor="middle"
              fill={T.violet} fontFamily={T.sans} fontSize="10" opacity="0.65">
              deciding...
            </text>
          )}
        </g>
      )}

      {/* Agent: tool nodes + animated dot */}
      {agentInP > 0 && TOOLS.map((tool, i) => {
        const rad  = (tool.angle * Math.PI) / 180;
        const tx   = AGENT_CX + Math.cos(rad) * TOOL_DIST;
        const ty   = AGENT_CY + Math.sin(rad) * TOOL_DIST;
        const lx1  = AGENT_CX + Math.cos(rad) * AGENT_R;
        const ly1  = AGENT_CY + Math.sin(rad) * AGENT_R;
        const lx2  = tx - Math.cos(rad) * 66;
        const ly2  = ty - Math.sin(rad) * 22;

        const isChosen = (i === 0 && tool0Active) || (i === 2 && tool2Active);
        const dotProg  = i === 0 ? tool0Dot : i === 2 ? tool2Dot : 0;
        const showDot  = (i === 0 && agent1P > 0.3 && agent1P < 0.85) ||
                         (i === 2 && agent2P > 0.3 && agent2P < 0.85);

        return (
          <g key={tool.label} opacity={agentInP}>
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={isChosen ? tool.color : T.border}
              strokeWidth={isChosen ? 2.5 : 1}
              strokeDasharray={isChosen ? undefined : "5 4"}
              opacity={isChosen ? 1 : 0.45}
            />
            <rect x={tx - 66} y={ty - 22} width={132} height={42} rx="10"
              fill={tool.color}
              fillOpacity={isChosen ? 0.26 : 0.07}
              stroke={tool.color}
              strokeWidth={isChosen ? 2.5 : 1}
              filter={isChosen ? "url(#wva-glow-sm)" : undefined}
            />
            <text x={tx} y={ty + 7} textAnchor="middle"
              fill={tool.color} fontFamily={T.mono} fontSize="11"
              fontWeight={isChosen ? "700" : "400"}>
              {tool.label}
            </text>
            {showDot && dotProg < 1 && (
              <circle
                cx={lx1 + (lx2 - lx1) * dotProg}
                cy={ly1 + (ly2 - ly1) * dotProg}
                r={9} fill={tool.color} opacity={0.9}
                filter="url(#wva-glow-sm)"
              />
            )}
          </g>
        );
      })}

      {/* Bottom labels */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          <text x={LEFT_X + PANEL_W / 2} y={670} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            DETERMINISTIC
          </text>
          <text x={RIGHT_X + PANEL_W / 2} y={670} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            ADAPTIVE
          </text>
        </g>
      )}
    </svg>
  );
};
