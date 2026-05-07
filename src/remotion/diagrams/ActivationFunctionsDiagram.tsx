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

const PANEL_W = 460, PANEL_H = 270;
const PANEL_X = [60, 560];
const PANEL_Y = [40, 360];
const PL = 44, PR = 16, PT = 52, PB = 32;

interface PanelDef {
  label: string;
  formula: string;
  color: string;
  key: string;
  col: number;
  row: number;
  fn?: (x: number) => number;
  xMin: number; xMax: number; yMin: number; yMax: number;
  softmaxBars?: number[];
}

const PANELS: PanelDef[] = [
  { label: "ReLU",    formula: "max(0,x)",           color: T.cyan,   key: "RELU",    col: 0, row: 0, fn: (x) => Math.max(0, x),                      xMin: -3, xMax: 3, yMin: -0.2, yMax: 3.2 },
  { label: "Sigmoid", formula: "1/(1+e⁻ˣ)",          color: T.violet, key: "SIGMOID", col: 1, row: 0, fn: (x) => 1 / (1 + Math.exp(-x)),               xMin: -5, xMax: 5, yMin: -0.1, yMax: 1.1 },
  { label: "Tanh",    formula: "tanh(x)",             color: T.amber,  key: "TANH",    col: 0, row: 1, fn: (x) => Math.tanh(x),                         xMin: -3, xMax: 3, yMin: -1.2, yMax: 1.2 },
  { label: "Softmax", formula: "eˣⁱ/Σeˣʲ",           color: T.mint,   key: "SOFTMAX", col: 1, row: 1, xMin: 0,  xMax: 4, yMin: 0,  yMax: 1, softmaxBars: [0.12, 0.60, 0.22, 0.06] },
];

function buildPath(fn: (x: number) => number, xMin: number, xMax: number, yMin: number, yMax: number, prog: number): string {
  const cw = PANEL_W - PL - PR;
  const ch = PANEL_H - PT - PB;
  const n = 80;
  const count = Math.max(2, Math.floor(prog * n));
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (n - 1);
    const x = xMin + t * (xMax - xMin);
    const y = fn(x);
    const px = PL + t * cw;
    const py = PT + ch - ((y - yMin) / (yMax - yMin)) * ch;
    pts.push(`${px},${py}`);
  }
  return pts.join(" ");
}

export const ActivationFunctionsDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelsIn    = p(frame, duration, 0.00, 0.20);
  const curvesIn    = p(frame, duration, 0.20, 0.70);
  const labelsIn    = p(frame, duration, 0.70, 0.90);
  const highlightIn = p(frame, duration, 0.90, 1.00);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="af-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {PANELS.map((panel) => {
        const ox = PANEL_X[panel.col];
        const oy = PANEL_Y[panel.row];
        const isHi = hi(panel.key);
        const showCommon = highlightIn > 0 && panel.key === "RELU";
        const cw = PANEL_W - PL - PR;
        const ch = PANEL_H - PT - PB;

        return (
          <g key={panel.key} opacity={panelsIn}>
            {/* Panel bg */}
            <rect x={ox} y={oy} width={PANEL_W} height={PANEL_H} rx="14"
              fill={panel.color} fillOpacity={isHi ? 0.15 : 0.06}
              stroke={isHi || showCommon ? panel.color : T.borderStrong}
              strokeWidth={isHi || showCommon ? 2.5 : 1.5}
              filter={isHi || showCommon ? "url(#af-glow)" : undefined}
            />

            {/* Labels */}
            {labelsIn > 0 && (
              <g opacity={labelsIn}>
                <text x={ox + 14} y={oy + 24}
                  fill={panel.color} fontFamily={T.sans} fontSize="15" fontWeight="800">
                  {panel.label}
                </text>
                <text x={ox + PANEL_W - 14} y={oy + 24} textAnchor="end"
                  fill={T.textDim} fontFamily={T.mono} fontSize="12">
                  {panel.formula}
                </text>
              </g>
            )}

            {/* Axes */}
            <line x1={ox + PL} y1={oy + PT} x2={ox + PL} y2={oy + PANEL_H - PB}
              stroke={T.border} strokeWidth="1.2" />
            <line x1={ox + PL} y1={oy + PANEL_H - PB} x2={ox + PANEL_W - PR} y2={oy + PANEL_H - PB}
              stroke={T.border} strokeWidth="1.2" />

            {/* Zero line for reference */}
            {panel.yMin < 0 && (
              <line
                x1={ox + PL} y1={oy + PT + ch - ((0 - panel.yMin) / (panel.yMax - panel.yMin)) * ch}
                x2={ox + PANEL_W - PR} y2={oy + PT + ch - ((0 - panel.yMin) / (panel.yMax - panel.yMin)) * ch}
                stroke={T.border} strokeWidth="0.8" strokeDasharray="3 3" strokeOpacity="0.5"
              />
            )}

            {/* Curve */}
            {curvesIn > 0 && panel.fn && (
              <polyline
                points={buildPath(panel.fn, panel.xMin, panel.xMax, panel.yMin, panel.yMax, curvesIn)
                  .split(" ").map(pt => {
                    const [x, y] = pt.split(",");
                    return `${ox + parseFloat(x)},${oy + parseFloat(y)}`;
                  }).join(" ")}
                fill="none"
                stroke={panel.color}
                strokeWidth={isHi ? 3 : 2.5}
                strokeLinejoin="round"
                filter={isHi ? "url(#af-glow)" : undefined}
              />
            )}

            {/* Softmax bars */}
            {curvesIn > 0 && panel.softmaxBars && (
              panel.softmaxBars.map((val, bi) => {
                const bw = 54;
                const bx = ox + PL + bi * (bw + 14);
                const bh = val * ch * curvesIn;
                const by = oy + PT + ch - bh;
                return (
                  <rect key={bi} x={bx} y={by} width={bw} height={bh} rx="4"
                    fill={panel.color} fillOpacity={isHi ? 0.8 : 0.55}
                    filter={isHi ? "url(#af-glow)" : undefined}
                  />
                );
              })
            )}

            {/* "Most common" tag */}
            {showCommon && (
              <g opacity={highlightIn}>
                <rect x={ox + PANEL_W - 130} y={oy + PANEL_H - 38} width={118} height={26} rx="13"
                  fill={panel.color} fillOpacity={0.2} stroke={panel.color} strokeWidth="1" />
                <text x={ox + PANEL_W - 71} y={oy + PANEL_H - 20} textAnchor="middle"
                  fill={panel.color} fontFamily={T.sans} fontSize="10" fontWeight="800" letterSpacing="0.5">
                  Most common
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
