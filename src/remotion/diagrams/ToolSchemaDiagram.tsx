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

const INDENT = 20;

const SCHEMA_LINES: { text: string; indent: number; key: string | null }[] = [
  { text: "{",                          indent: 0, key: null },
  { text: '"name": "search_web",',      indent: 1, key: null },
  { text: '"description":',             indent: 1, key: null },
  { text: '"Search the internet",',     indent: 2, key: null },
  { text: '"parameters": {',            indent: 1, key: "PARAMETERS" },
  { text: '"query": "string",',         indent: 2, key: "PARAMETERS" },
  { text: '"limit": "number"',          indent: 2, key: "PARAMETERS" },
  { text: "}",                          indent: 1, key: null },
  { text: "}",                          indent: 0, key: null },
];

const CALL_LINES: { text: string; indent: number; key: string | null }[] = [
  { text: "// LLM decides:",            indent: 0, key: null },
  { text: "{",                          indent: 0, key: null },
  { text: '"name": "search_web",',      indent: 1, key: "SCHEMA" },
  { text: '"query":',                   indent: 1, key: "PARAMETERS" },
  { text: '"best AI tools"',            indent: 2, key: "PARAMETERS" },
  { text: "}",                          indent: 0, key: null },
];

function LLMNode({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={T.nodeFill} stroke={T.violet} strokeWidth="2" />
      <text x={x} y={y + 6} textAnchor="middle"
        fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="800">LLM</text>
    </g>
  );
}

export const ToolSchemaDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const schemaTypeP = p(frame, duration, 0.00, 0.30);
  const arrowP      = p(frame, duration, 0.30, 0.55);
  const callTypeP   = p(frame, duration, 0.55, 0.80);
  const checksIn    = p(frame, duration, 0.80, 1.00);

  const hiSchema = hi("SCHEMA");
  const hiParams = hi("PARAMETERS");

  const schemaLinesVisible = Math.floor(schemaTypeP * SCHEMA_LINES.length);
  const callLinesVisible   = Math.floor(callTypeP   * CALL_LINES.length);

  const LLM_X = 800, LLM_Y = 200, LLM_R = 52;
  // Schema panel right edge → LLM left edge
  const SCHEMA_RIGHT = 510;
  const ARROW_Y = 230;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="ts-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Schema panel (left) ── */}
      <rect x={50} y={70} width={460} height={380} rx="18"
        fill={hiSchema ? `${T.violet}1A` : T.bgDeep}
        stroke={hiSchema ? T.violet : T.borderStrong}
        strokeWidth={hiSchema ? 2.5 : 1.5}
        filter={hiSchema ? "url(#ts-glow)" : undefined}
        opacity={schemaTypeP > 0 ? 1 : 0}
      />
      <text x={280} y={104} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
        opacity={schemaTypeP}>
        SCHEMA DEFINITION
      </text>

      {SCHEMA_LINES.slice(0, schemaLinesVisible).map((line, i) => {
        const isParam  = line.key === "PARAMETERS" && hiParams;
        const isSch    = line.key === "SCHEMA"     && hiSchema;
        const color = isParam ? T.amber : isSch ? T.violet : T.textSecondary;
        return (
          <text key={i}
            x={80 + line.indent * INDENT}
            y={134 + i * 32}
            textAnchor="start"
            fill={color} fontFamily={T.mono} fontSize="13"
            filter={isParam || isSch ? "url(#ts-glow)" : undefined}>
            {line.text}
          </text>
        );
      })}

      {/* ── Arrow schema → LLM ── */}
      {arrowP > 0 && (
        <g>
          <line
            x1={SCHEMA_RIGHT} y1={ARROW_Y}
            x2={SCHEMA_RIGHT + (LLM_X - LLM_R - SCHEMA_RIGHT) * arrowP} y2={ARROW_Y}
            stroke={T.violet} strokeWidth="2" strokeDasharray="6 3"
          />
          <text x={(SCHEMA_RIGHT + LLM_X - LLM_R) / 2} y={ARROW_Y - 10} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="1"
            opacity={arrowP}>
            reads schema
          </text>
        </g>
      )}

      {/* ── LLM node ── */}
      {arrowP > 0.3 && <LLMNode x={LLM_X} y={LLM_Y} r={LLM_R} />}

      {/* ── Arrow LLM → call panel ── */}
      {callTypeP > 0 && arrowP > 0.3 && (
        <line
          x1={LLM_X} y1={LLM_Y + LLM_R}
          x2={LLM_X} y2={340}
          stroke={T.cyan} strokeWidth="2" strokeDasharray="5 3"
          opacity={callTypeP}
        />
      )}

      {/* ── Tool call panel (right, below LLM) ── */}
      {callTypeP > 0 && (
        <>
          <rect x={570} y={350} width={460} height={320} rx="18"
            fill={T.bgDeep}
            stroke={T.cyan} strokeWidth="1.5"
            opacity={callTypeP}
          />
          <text x={800} y={383} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2"
            opacity={callTypeP}>
            GENERATED TOOL CALL
          </text>

          {CALL_LINES.slice(0, callLinesVisible).map((line, i) => {
            const isParam = line.key === "PARAMETERS" && hiParams;
            const isSch   = line.key === "SCHEMA"     && hiSchema;
            const color = isParam ? T.amber : isSch ? T.cyan : T.textSecondary;
            return (
              <text key={i}
                x={600 + line.indent * INDENT}
                y={410 + i * 30}
                textAnchor="start"
                fill={color} fontFamily={T.mono} fontSize="13"
                filter={isParam || isSch ? "url(#ts-glow)" : undefined}>
                {line.text}
              </text>
            );
          })}
        </>
      )}

      {/* ── Validation (below call panel, separated) ── */}
      {checksIn > 0 && (
        <g opacity={checksIn}>
          <text x={590} y={554} textAnchor="start"
            fill={T.mint} fontFamily={T.mono} fontSize="13">
            ✓ query: string
          </text>
          <text x={590} y={574} textAnchor="start"
            fill={T.mint} fontFamily={T.mono} fontSize="13">
            ✓ limit: number
          </text>
          <rect x={680} y={594} width={240} height={40} rx="20"
            fill={T.mint} fillOpacity={0.12}
            stroke={T.mint} strokeWidth="1.5"
          />
          <text x={800} y={620} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="2">
            SCHEMA VALID
          </text>
        </g>
      )}
    </svg>
  );
};
