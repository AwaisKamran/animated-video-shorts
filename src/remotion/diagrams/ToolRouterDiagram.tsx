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

const CX = 400, CY = 320, LLM_R = 72;
const TOOL_W = 148, TOOL_H = 56;

const TOOLS = [
  { label: "search_web",  color: T.cyan,   angle: -100 },
  { label: "calculator",  color: T.amber,  angle: -55  },
  { label: "read_file",   color: T.mint,   angle: -10  },
  { label: "send_email",  color: T.violet, angle:  35  },
  { label: "run_code",    color: T.coral,  angle:  80  },
  { label: "db_query",    color: T.cyan,   angle: 125  },
];
const TOOL_DIST = 270;
const CHOSEN = 1; // calculator

function toolPos(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * TOOL_DIST, y: CY + Math.sin(rad) * TOOL_DIST };
}

export const ToolRouterDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const toolsIn    = p(frame, duration, 0.00, 0.20);
  const llmIn      = p(frame, duration, 0.10, 0.25);
  const thinkP     = p(frame, duration, 0.25, 0.50);
  const beamP      = p(frame, duration, 0.50, 0.68);
  const selectP    = p(frame, duration, 0.68, 0.82);
  const labelP     = p(frame, duration, 0.82, 1.00);

  const hiSelection = hi("SELECTION");
  const hiRouting   = hi("ROUTING");

  // Thinking dots orbiting LLM
  const thinkDots = [0, 1, 2].map(i => {
    const angle = (frame * 4 + i * 120) * (Math.PI / 180);
    return { x: CX + Math.cos(angle) * (LLM_R + 18), y: CY + Math.sin(angle) * (LLM_R + 18) };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="router-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="router-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="router-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
      </defs>

      {/* ── Tool nodes ── */}
      {TOOLS.map((tool, i) => {
        const pos = toolPos(tool.angle);
        const isChosen = i === CHOSEN;
        const faded = selectP > 0 && !isChosen;
        const glowing = isChosen && selectP > 0;

        const rad = (tool.angle * Math.PI) / 180;
        const lx1 = CX + Math.cos(rad) * LLM_R;
        const ly1 = CY + Math.sin(rad) * LLM_R;
        const lx2 = pos.x - Math.cos(rad) * (TOOL_W / 2 + 4);
        const ly2 = pos.y - Math.sin(rad) * (TOOL_H / 2 + 4);

        // Beam dot traveling toward chosen tool
        const dotX = lx1 + (lx2 - lx1) * beamP;
        const dotY = ly1 + (ly2 - ly1) * beamP;

        return (
          <g key={tool.label} opacity={faded ? 0.28 : toolsIn}>
            {/* Connection line */}
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={glowing ? tool.color : T.border}
              strokeWidth={glowing ? 2.5 : 1}
              strokeDasharray={beamP > 0 && !isChosen ? "5 4" : "none"}
              filter={glowing ? "url(#router-glow-sm)" : undefined}
            />
            {/* Beam dot on chosen arm */}
            {isChosen && beamP > 0 && beamP < 1 && (
              <circle cx={dotX} cy={dotY} r={9} fill={T.amber}
                filter="url(#router-glow-sm)" />
            )}
            {/* Tool box */}
            <rect x={pos.x - TOOL_W / 2} y={pos.y - TOOL_H / 2} width={TOOL_W} height={TOOL_H} rx="14"
              fill={glowing ? `${tool.color}2A` : `${tool.color}14`}
              stroke={tool.color}
              strokeWidth={glowing ? 3 : 1.5}
              filter={glowing ? "url(#router-glow)" : undefined}
            />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle"
              fill={glowing ? tool.color : T.textSecondary}
              fontFamily={T.mono} fontSize="12" fontWeight={glowing ? "700" : "500"}>
              {tool.label}
            </text>
          </g>
        );
      })}

      {/* ── LLM center ── */}
      <g opacity={llmIn}>
        <circle cx={CX} cy={CY} r={LLM_R}
          fill={T.nodeFill}
          stroke={hiRouting ? T.violet : T.violet}
          strokeWidth={hiRouting ? 3 : 2.5}
          filter={hiRouting ? "url(#router-glow)" : undefined}
        />
        <text x={CX} y={CY + 8} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="20" fontWeight="800">LLM</text>
      </g>

      {/* ── Thinking particles ── */}
      {thinkP > 0 && thinkP < 0.95 && thinkDots.map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r={5}
          fill={T.violet} opacity={thinkP * 0.8}
          filter="url(#router-glow-sm)" />
      ))}

      {/* ── "THINKING..." label ── */}
      {thinkP > 0 && thinkP < 0.9 && (
        <text x={CX} y={CY + LLM_R + 30} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
          opacity={thinkP}>
          THINKING...
        </text>
      )}

      {/* ── Selection label ── */}
      {selectP > 0 && (
        <g opacity={selectP}>
          <rect x={CX - 100} y={CY + LLM_R + 16} width={200} height={28} rx="14"
            fill={hiSelection ? `${T.amber}28` : `${T.amber}14`}
            stroke={T.amber} strokeWidth={hiSelection ? 2 : 1.5}
            filter={hiSelection ? "url(#router-glow-sm)" : undefined}
          />
          <text x={CX} y={CY + LLM_R + 35} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
            filter={hiSelection ? "url(#router-glow-sm)" : undefined}>
            SELECTED
          </text>
        </g>
      )}

      {/* ── Right panel: selection confirmed ── */}
      {labelP > 0 && (
        <g opacity={labelP}>
          <rect x={730} y={240} width={310} height={160} rx="18"
            fill={T.bgDeep}
            stroke={hiSelection ? T.amber : T.borderStrong}
            strokeWidth={hiSelection ? 2.5 : 1.5}
            filter={hiSelection ? "url(#router-glow-sm)" : undefined}
          />
          <text x={885} y={278} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            ROUTING DECISION
          </text>
          <text x={760} y={314} textAnchor="start"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="12">
            selected:
          </text>
          <text x={860} y={314} textAnchor="start"
            fill={T.amber} fontFamily={T.mono} fontSize="12" fontWeight="700">
            calculator
          </text>
          <text x={760} y={342} textAnchor="start"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="12">
            reason:
          </text>
          <text x={760} y={362} textAnchor="start"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">
            "needs arithmetic"
          </text>
          <text x={760} y={384} textAnchor="start"
            fill={T.mint} fontFamily={T.mono} fontSize="11">
            confidence: 0.97
          </text>
        </g>
      )}

    </svg>
  );
};
