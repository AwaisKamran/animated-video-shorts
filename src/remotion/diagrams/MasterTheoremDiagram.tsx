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

const CASES = [
  {
    condition: "f(n) = O(n^(log_b a - ε))",
    result:    "T(n) = Θ(n^log_b a)",
    label:     "CASE 1",
    color:     T.mint,
    note:      "Work dominated by subproblems",
  },
  {
    condition: "f(n) = Θ(n^log_b a)",
    result:    "T(n) = Θ(n^log_b a · log n)",
    label:     "CASE 2",
    color:     T.amber,
    note:      "Work evenly split",
  },
  {
    condition: "f(n) = Ω(n^(log_b a + ε))",
    result:    "T(n) = Θ(f(n))",
    label:     "CASE 3",
    color:     T.coral,
    note:      "Work dominated by top level",
  },
];

const TREE_LEVELS = [
  { nodes: 1, y: 130 },
  { nodes: 2, y: 230 },
  { nodes: 4, y: 330 },
  { nodes: 8, y: 430 },
];

const TREE_X0 = 90;
const TREE_X1 = 560;
const TREE_CX = (TREE_X0 + TREE_X1) / 2;

function nodeX(levelIdx: number, nodeIdx: number): number {
  const n = TREE_LEVELS[levelIdx].nodes;
  const span = TREE_X1 - TREE_X0;
  if (n === 1) return TREE_CX;
  return TREE_X0 + (nodeIdx / (n - 1)) * span;
}

const NODE_R = 22;

export const MasterTheoremDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const formulaIn  = p(frame, duration, 0.00, 0.18);
  const level0In   = p(frame, duration, 0.18, 0.32);
  const level1In   = p(frame, duration, 0.32, 0.48);
  const level2In   = p(frame, duration, 0.48, 0.62);
  const level3In   = p(frame, duration, 0.62, 0.74);
  const casesIn    = p(frame, duration, 0.74, 1.00);

  const levelProgress = [level0In, level1In, level2In, level3In];

  const hiMT = hi("MASTER THEOREM");
  const hiRec = hi("RECURRENCE");

  const caseOpacities = CASES.map((_, i) => Math.max(0, Math.min(1, casesIn * 3 - i)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="mt-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="mt-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="mt-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.border} />
        </marker>
      </defs>

      {formulaIn > 0 && (
        <g opacity={formulaIn}>
          <rect x={W / 2 - 260} y={28} width={520} height={52} rx="26"
            fill={T.violet} fillOpacity={hiMT || hiRec ? 0.28 : 0.16}
            stroke={T.violet} strokeWidth="2"
            filter={(hiMT || hiRec) ? "url(#mt-glow)" : undefined}
          />
          <text x={W / 2} y={52} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="16" fontWeight="700"
            filter={(hiMT || hiRec) ? "url(#mt-glow)" : undefined}>
            T(n) = a·T(n/b) + f(n)
          </text>
          <text x={W / 2} y={70} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="1.5">
            a SUBPROBLEMS · SIZE n/b · OVERHEAD f(n)
          </text>
        </g>
      )}

      {TREE_LEVELS.map((level, li) => {
        const lp = levelProgress[li];
        if (lp <= 0) return null;
        return (
          <g key={li} opacity={lp}>
            {Array.from({ length: level.nodes }).map((_, ni) => {
              const cx = nodeX(li, ni);
              const cy = level.y;
              const sizeLabel = li === 0 ? "n" : li === 1 ? "n/b" : li === 2 ? "n/b²" : "n/b³";

              const parentLevel = li - 1;
              const parentNode = Math.floor(ni / 2);

              return (
                <g key={ni}>
                  {li > 0 && (
                    <line
                      x1={nodeX(parentLevel, parentNode)}
                      y1={TREE_LEVELS[parentLevel].y + NODE_R}
                      x2={cx}
                      y2={cy - NODE_R}
                      stroke={T.border}
                      strokeWidth="1.5"
                      opacity={0.6}
                    />
                  )}
                  <circle cx={cx} cy={cy} r={NODE_R}
                    fill={T.nodeFill}
                    stroke={li === 0 ? T.violet : li === 3 ? T.mint : T.borderStrong}
                    strokeWidth={li === 0 ? 2.5 : 1.5}
                    filter={li === 0 ? "url(#mt-glow-sm)" : undefined}
                  />
                  <text x={cx} y={cy + 5} textAnchor="middle"
                    fill={li === 3 ? T.mint : T.textSecondary}
                    fontFamily={T.mono} fontSize={li === 3 ? 9 : 11}>
                    {sizeLabel}
                  </text>
                </g>
              );
            })}
            <text x={TREE_X0 - 10} y={level.y + 5} textAnchor="end"
              fill={T.textDim} fontFamily={T.mono} fontSize="10">
              {li === 0 ? "a⁰=1" : li === 1 ? "a¹" : li === 2 ? "a²" : "a³"}
            </text>
          </g>
        );
      })}

      {level0In > 0.8 && (
        <text x={TREE_CX + 20} y={130}
          fill={T.textDim} fontFamily={T.sans} fontSize="10" opacity={level0In}>
          root
        </text>
      )}

      {level3In > 0.8 && (
        <text x={TREE_X0} y={470}
          fill={T.mint} fontFamily={T.sans} fontSize="11" opacity={level3In}>
          leaves — base cases
        </text>
      )}

      {casesIn > 0 && (
        <g>
          <line x1={600} y1={110} x2={600} y2={460}
            stroke={T.border} strokeWidth="1" strokeDasharray="6 4" opacity={casesIn} />

          {CASES.map((c, ci) => {
            const opa = caseOpacities[ci];
            if (opa <= 0) return null;
            const boxY = 110 + ci * 120;
            return (
              <g key={ci} opacity={opa}>
                <rect x={610} y={boxY} width={440} height={100} rx="12"
                  fill={c.color} fillOpacity="0.10"
                  stroke={c.color} strokeWidth="1.5"
                />
                <rect x={610} y={boxY} width={70} height={24} rx="12"
                  fill={c.color} fillOpacity="0.22"
                />
                <text x={645} y={boxY + 16} textAnchor="middle"
                  fill={c.color} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="0.5">
                  {c.label}
                </text>
                <text x={690} y={boxY + 30}
                  fill={T.textDim} fontFamily={T.mono} fontSize="11">
                  IF {c.condition}
                </text>
                <text x={690} y={boxY + 58}
                  fill={c.color} fontFamily={T.mono} fontSize="13" fontWeight="700">
                  THEN {c.result}
                </text>
                <text x={690} y={boxY + 82}
                  fill={T.textDim} fontFamily={T.sans} fontSize="10">
                  {c.note}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};
