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

// Workflow steps (left panel)
const WF_STEPS = ["Step 1: Receive Query", "Step 2: Fetch Data", "Step 3: Process", "Step 4: Validate", "Step 5: Return Result"];

export const WorkflowVsAgentDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelsIn    = p(frame, duration, 0.00, 0.25);
  const wfFlowP     = p(frame, duration, 0.25, 0.55);
  const agentFlowP  = p(frame, duration, 0.55, 0.85);
  const labelsIn    = p(frame, duration, 0.85, 1.00);

  const hiWf    = hi("WORKFLOW");
  const hiAgent = hi("AGENT");

  // Agent branches (right panel)
  const AGENT_CX = RIGHT_X + PANEL_W / 2;
  const AGENT_CY = PANEL_Y + PANEL_H / 2;
  const AGENT_R  = 40;

  const TOOLS = [
    { label: "search_web", angle: -60, color: T.amber },
    { label: "calculator", angle: 0,   color: T.mint },
    { label: "read_file",  angle: 60,  color: T.cyan },
  ];

  // Cycle through highlighted agent branch
  const chosenIdx = Math.floor(agentFlowP * 3) % 3;
  const settled   = agentFlowP >= 0.85;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="wva-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Panel backgrounds ── */}
      <g opacity={panelsIn}>
        {/* Left: Workflow */}
        <rect x={LEFT_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
          fill={T.cyan} fillOpacity={hiWf ? 0.12 : 0.06}
          stroke={T.cyan} strokeWidth={hiWf ? 2.5 : 1.5}
          filter={hiWf ? "url(#wva-glow)" : undefined}
        />
        <text x={LEFT_X + PANEL_W / 2} y={PANEL_Y + 36} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="2">
          WORKFLOW
        </text>

        {/* Right: Agent */}
        <rect x={RIGHT_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="20"
          fill={T.violet} fillOpacity={hiAgent ? 0.12 : 0.06}
          stroke={T.violet} strokeWidth={hiAgent ? 2.5 : 1.5}
          filter={hiAgent ? "url(#wva-glow)" : undefined}
        />
        <text x={RIGHT_X + PANEL_W / 2} y={PANEL_Y + 36} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="18" fontWeight="800" letterSpacing="2">
          AGENT
        </text>

        {/* Divider */}
        <line x1={W / 2} y1={PANEL_Y + 20} x2={W / 2} y2={PANEL_Y + PANEL_H - 20}
          stroke={T.border} strokeWidth="2" strokeDasharray="6 4"
        />
      </g>

      {/* ── Left: Workflow steps ── */}
      {WF_STEPS.map((step, i) => {
        const stepY = PANEL_Y + 80 + i * 84;
        const stepIn = Math.max(0, Math.min(1, wfFlowP * 5 - i));
        const isActive = wfFlowP > 0 && Math.floor(wfFlowP * 5) === i;
        return (
          <g key={step} opacity={Math.min(panelsIn, stepIn > 0 ? 1 : 0.3)}>
            <rect x={LEFT_X + 20} y={stepY} width={PANEL_W - 40} height={50} rx="10"
              fill={T.cyan} fillOpacity={isActive ? 0.22 : 0.08}
              stroke={T.cyan} strokeWidth={isActive ? 2 : 1}
              filter={isActive ? "url(#wva-glow)" : undefined}
            />
            <text x={LEFT_X + 30} y={stepY + 22} textAnchor="start"
              fill={T.cyan} fontFamily={T.mono} fontSize="11" fontWeight="600">
              {step}
            </text>
            {/* Arrow to next step */}
            {i < WF_STEPS.length - 1 && (
              <line x1={LEFT_X + PANEL_W / 2} y1={stepY + 50}
                x2={LEFT_X + PANEL_W / 2} y2={stepY + 84}
                stroke={T.cyan} strokeWidth="2" opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {/* ── Right: Agent LLM node + branching ── */}
      <g opacity={panelsIn}>
        {/* LLM center */}
        <circle cx={AGENT_CX} cy={AGENT_CY} r={AGENT_R}
          fill={T.nodeFill} stroke={T.violet} strokeWidth="2"
        />
        <text x={AGENT_CX} y={AGENT_CY + 6} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800">LLM</text>

        {/* Branches */}
        {TOOLS.map((tool, i) => {
          const rad = (tool.angle * Math.PI) / 180;
          const dist = 120;
          const tx = AGENT_CX + Math.cos(rad) * dist;
          const ty = AGENT_CY + Math.sin(rad) * dist;
          const isChosen = agentFlowP > 0 && (settled ? i === 1 : i === chosenIdx);
          const flowProg = agentFlowP > 0 ? Math.min(1, agentFlowP * 2) : 0;

          return (
            <g key={tool.label}>
              <line x1={AGENT_CX + Math.cos(rad) * AGENT_R} y1={AGENT_CY + Math.sin(rad) * AGENT_R}
                x2={tx - Math.cos(rad) * 40} y2={ty - Math.sin(rad) * 16}
                stroke={isChosen ? tool.color : T.border}
                strokeWidth={isChosen ? 2.5 : 1}
                strokeDasharray={isChosen ? "none" : "5 4"}
                opacity={agentFlowP > 0 ? 1 : 0.3}
              />
              <rect x={tx - 60} y={ty - 22} width={120} height={38} rx="10"
                fill={tool.color}
                fillOpacity={isChosen ? 0.22 : 0.06}
                stroke={tool.color}
                strokeWidth={isChosen ? 2.5 : 1}
                filter={isChosen ? "url(#wva-glow)" : undefined}
              />
              <text x={tx} y={ty + 6} textAnchor="middle"
                fill={tool.color} fontFamily={T.mono} fontSize="11" fontWeight="600">
                {tool.label}
              </text>
              {/* Flow dot */}
              {isChosen && flowProg < 1 && (
                <circle
                  cx={AGENT_CX + Math.cos(rad) * AGENT_R + (tx - AGENT_CX - Math.cos(rad) * AGENT_R) * flowProg}
                  cy={AGENT_CY + Math.sin(rad) * AGENT_R + (ty - AGENT_CY - Math.sin(rad) * AGENT_R) * flowProg}
                  r={8} fill={tool.color} opacity={0.9}
                  filter="url(#wva-glow)"
                />
              )}
            </g>
          );
        })}
      </g>

      {/* ── Bottom labels ── */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          <text x={LEFT_X + PANEL_W / 2} y={680} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            DETERMINISTIC
          </text>
          <text x={RIGHT_X + PANEL_W / 2} y={680} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="3">
            ADAPTIVE
          </text>
        </g>
      )}
    </svg>
  );
};
