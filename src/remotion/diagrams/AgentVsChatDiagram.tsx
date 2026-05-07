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

const PANEL_W = 300, PANEL_H = 480, PANEL_Y = 110;
const LLM_X = 60, CHAT_X = 390, AGENT_X = 720;

const COLS = [
  { id: "LLM",     label: "LLM",     color: T.cyan,   x: LLM_X,   subtitle: "text-in → text-out" },
  { id: "CHATBOT", label: "CHATBOT", color: T.amber,  x: CHAT_X,  subtitle: "memory of conversation" },
  { id: "AGENT",   label: "AGENT",   color: T.violet, x: AGENT_X, subtitle: "tools + memory + planning" },
];

const LLM_TRAITS  = ["Stateless", "Single response", "No tools"];
const CHAT_TRAITS = ["Remembers history", "Multi-turn", "Fixed behavior"];
const AGENT_TRAITS = ["Uses tools", "Plans & loops", "Autonomous"];

const TOOLS = ["search_web", "read_file", "run_code"];

export const AgentVsChatDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelsIn   = p(frame, duration, 0.00, 0.18);
  const llmIn      = p(frame, duration, 0.18, 0.36);
  const chatIn     = p(frame, duration, 0.36, 0.56);
  const agentIn    = p(frame, duration, 0.56, 0.76);
  const traitsIn   = p(frame, duration, 0.76, 1.00);

  const hiLLM    = hi("LLM");
  const hiChat   = hi("CHATBOT");
  const hiAgent  = hi("AGENT");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="avc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="avc-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y={72} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={panelsIn}>
        LLM vs CHATBOT vs AGENT
      </text>

      {/* Panel backgrounds */}
      {COLS.map((col) => {
        const isHi = (col.id === "LLM" && hiLLM) || (col.id === "CHATBOT" && hiChat) || (col.id === "AGENT" && hiAgent);
        return (
          <g key={col.id} opacity={panelsIn}>
            <rect x={col.x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="18"
              fill={col.color} fillOpacity={isHi ? 0.16 : 0.07}
              stroke={col.color} strokeWidth={isHi ? 2.5 : 1.5}
              filter={isHi ? "url(#avc-glow)" : undefined}
            />
            <text x={col.x + PANEL_W / 2} y={PANEL_Y + 38} textAnchor="middle"
              fill={col.color} fontFamily={T.sans} fontSize="19" fontWeight="800" letterSpacing="2">
              {col.label}
            </text>
            <text x={col.x + PANEL_W / 2} y={PANEL_Y + 58} textAnchor="middle"
              fill={col.color} fontFamily={T.sans} fontSize="10" opacity="0.55" letterSpacing="0.5">
              {col.subtitle}
            </text>
          </g>
        );
      })}

      {/* LLM visualization — single bubble */}
      {llmIn > 0 && (
        <g opacity={llmIn}>
          {/* input bubble */}
          <rect x={LLM_X + 20} y={PANEL_Y + 90} width={260} height={36} rx="18"
            fill={T.cyan} fillOpacity={0.15} stroke={T.cyan} strokeWidth="1.5"
          />
          <text x={LLM_X + 150} y={PANEL_Y + 113} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="11">
            "What is 2+2?"
          </text>
          {/* arrow down */}
          <line x1={LLM_X + 150} y1={PANEL_Y + 130} x2={LLM_X + 150} y2={PANEL_Y + 165}
            stroke={T.textDim} strokeWidth="1.5" opacity="0.5"
          />
          <polygon points={`${LLM_X + 150},${PANEL_Y + 168} ${LLM_X + 144},${PANEL_Y + 158} ${LLM_X + 156},${PANEL_Y + 158}`}
            fill={T.textDim} opacity="0.5"
          />
          {/* LLM box */}
          <rect x={LLM_X + 60} y={PANEL_Y + 172} width={180} height={52} rx="14"
            fill={T.cyan} fillOpacity={0.22} stroke={T.cyan} strokeWidth="2"
            filter="url(#avc-glow-sm)"
          />
          <text x={LLM_X + 150} y={PANEL_Y + 203} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="15" fontWeight="800">
            LLM
          </text>
          {/* arrow down */}
          <line x1={LLM_X + 150} y1={PANEL_Y + 228} x2={LLM_X + 150} y2={PANEL_Y + 263}
            stroke={T.textDim} strokeWidth="1.5" opacity="0.5"
          />
          <polygon points={`${LLM_X + 150},${PANEL_Y + 266} ${LLM_X + 144},${PANEL_Y + 256} ${LLM_X + 156},${PANEL_Y + 256}`}
            fill={T.textDim} opacity="0.5"
          />
          {/* output bubble */}
          <rect x={LLM_X + 20} y={PANEL_Y + 270} width={260} height={36} rx="18"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="1.5"
          />
          <text x={LLM_X + 150} y={PANEL_Y + 293} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="11">
            "The answer is 4."
          </text>
        </g>
      )}

      {/* Chatbot visualization — stack of messages */}
      {chatIn > 0 && (
        <g opacity={chatIn}>
          {[
            { text: "Hi there!", y: 80, dim: true },
            { text: "How can I help?", y: 118, dim: true },
            { text: "Explain X...", y: 156, dim: true },
            { text: "Sure! X is...", y: 194, dim: true },
          ].map((msg, i) => (
            <g key={i}>
              <rect x={CHAT_X + 18} y={PANEL_Y + msg.y} width={264} height={30} rx="15"
                fill={T.amber} fillOpacity={msg.dim ? 0.08 : 0.18}
                stroke={T.amber} strokeWidth="1" opacity={msg.dim ? 0.6 : 1}
              />
              <text x={CHAT_X + 150} y={PANEL_Y + msg.y + 20} textAnchor="middle"
                fill={T.amber} fontFamily={T.mono} fontSize="10" opacity={msg.dim ? 0.55 : 1}>
                {msg.text}
              </text>
            </g>
          ))}
          {/* Memory label */}
          <rect x={CHAT_X + 60} y={PANEL_Y + 240} width={180} height={32} rx="8"
            fill={T.amber} fillOpacity={0.18} stroke={T.amber} strokeWidth="1.5"
          />
          <text x={CHAT_X + 150} y={PANEL_Y + 261} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="1.5">
            MEMORY
          </text>
          <text x={CHAT_X + 150} y={PANEL_Y + 300} textAnchor="middle"
            fill={T.amber} fontFamily={T.mono} fontSize="10" opacity="0.6">
            history stored
          </text>
        </g>
      )}

      {/* Agent visualization — brain + tools + loop */}
      {agentIn > 0 && (
        <g opacity={agentIn}>
          {/* LLM brain */}
          <circle cx={AGENT_X + 150} cy={PANEL_Y + 150} r={44}
            fill={T.nodeFill} stroke={T.violet} strokeWidth="2.5"
            filter="url(#avc-glow-sm)"
          />
          <text x={AGENT_X + 150} y={PANEL_Y + 148} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="13" fontWeight="800">
            LLM
          </text>
          <text x={AGENT_X + 150} y={PANEL_Y + 165} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="9" opacity="0.7">
            BRAIN
          </text>
          {/* Tools */}
          {TOOLS.map((tool, i) => {
            const angle = -60 + i * 60;
            const rad = (angle * Math.PI) / 180;
            const tx = AGENT_X + 150 + Math.cos(rad) * 110;
            const ty = PANEL_Y + 150 + Math.sin(rad) * 110;
            const toolColors = [T.cyan, T.mint, T.amber];
            return (
              <g key={tool} opacity={Math.min(1, (agentIn - 0.3) * 3)}>
                <line x1={AGENT_X + 150 + Math.cos(rad) * 44} y1={PANEL_Y + 150 + Math.sin(rad) * 44}
                  x2={tx - Math.cos(rad) * 38} y2={ty - Math.sin(rad) * 20}
                  stroke={toolColors[i]} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
                />
                <rect x={tx - 46} y={ty - 16} width={92} height={30} rx="8"
                  fill={toolColors[i]} fillOpacity={0.14}
                  stroke={toolColors[i]} strokeWidth="1.5"
                />
                <text x={tx} y={ty + 6} textAnchor="middle"
                  fill={toolColors[i]} fontFamily={T.mono} fontSize="9" fontWeight="700">
                  {tool}
                </text>
              </g>
            );
          })}
          {/* Planning loop arrow */}
          <path d={`M ${AGENT_X + 194} ${PANEL_Y + 268} Q ${AGENT_X + 250} ${PANEL_Y + 312} ${AGENT_X + 150} ${PANEL_Y + 312} Q ${AGENT_X + 50} ${PANEL_Y + 312} ${AGENT_X + 106} ${PANEL_Y + 268}`}
            fill="none" stroke={T.violet} strokeWidth="2" strokeDasharray="6 4"
            opacity={Math.min(1, (agentIn - 0.5) * 3)}
          />
          <text x={AGENT_X + 150} y={PANEL_Y + 332} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="10" opacity={Math.min(1, (agentIn - 0.5) * 3) * 0.7}
            letterSpacing="1">
            PLANNING LOOP
          </text>
        </g>
      )}

      {/* Trait bullets */}
      {traitsIn > 0 && (
        <g opacity={traitsIn}>
          {LLM_TRAITS.map((t, i) => (
            <text key={t} x={LLM_X + 150} y={PANEL_Y + PANEL_H - 90 + i * 22} textAnchor="middle"
              fill={T.cyan} fontFamily={T.sans} fontSize="11" opacity="0.8">
              · {t}
            </text>
          ))}
          {CHAT_TRAITS.map((t, i) => (
            <text key={t} x={CHAT_X + 150} y={PANEL_Y + PANEL_H - 90 + i * 22} textAnchor="middle"
              fill={T.amber} fontFamily={T.sans} fontSize="11" opacity="0.8">
              · {t}
            </text>
          ))}
          {AGENT_TRAITS.map((t, i) => (
            <text key={t} x={AGENT_X + 150} y={PANEL_Y + PANEL_H - 90 + i * 22} textAnchor="middle"
              fill={T.violet} fontFamily={T.sans} fontSize="11" opacity="0.8">
              · {t}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
};
