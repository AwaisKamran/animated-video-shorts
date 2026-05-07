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

const COL_W = 280;
const COL_H = 400;
const COL_Y = 150;
const COLS = [
  { x: 100, color: T.cyan,   label: "SUPERVISED",     desc: "Learns from labeled\nexamples",     example: "Spam detection",  key: "SUPERVISED" },
  { x: 400, color: T.violet, label: "UNSUPERVISED",   desc: "Finds patterns in\nunlabeled data", example: "Clustering",      key: "UNSUPERVISED" },
  { x: 700, color: "#00D4A0", label: "REINFORCEMENT",  desc: "Learns via rewards\nand penalties",  example: "Game AI",         key: "REINFORCEMENT" },
];

export const MLTypesDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const colsIn   = p(frame, duration, 0.00, 0.25);
  const illusIn  = p(frame, duration, 0.25, 0.50);
  const exampIn  = p(frame, duration, 0.50, 0.75);
  const titleIn  = p(frame, duration, 0.75, 1.00);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="mlt-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Overall title */}
      {titleIn > 0 && (
        <g opacity={titleIn}>
          <text x={W / 2} y={55} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3">
            THREE PARADIGMS OF MACHINE LEARNING
          </text>
        </g>
      )}

      {COLS.map((col) => {
        const isHi = hi(col.key);
        const cx = col.x + COL_W / 2;
        return (
          <g key={col.key} opacity={colsIn}>
            {/* Column box */}
            <rect x={col.x} y={COL_Y} width={COL_W} height={COL_H} rx="16"
              fill={col.color} fillOpacity={isHi ? 0.18 : 0.08}
              stroke={col.color} strokeWidth={isHi ? 2.5 : 1.5}
              strokeOpacity={isHi ? 1 : 0.5}
              filter={isHi ? "url(#mlt-glow)" : undefined}
            />

            {/* Column header */}
            <text x={cx} y={COL_Y + 38} textAnchor="middle"
              fill={col.color} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="1.5">
              {col.label}
            </text>

            {/* Description */}
            {col.desc.split("\n").map((line, li) => (
              <text key={li} x={cx} y={COL_Y + 68 + li * 22} textAnchor="middle"
                fill={T.textSecondary} fontFamily={T.sans} fontSize="13">
                {line}
              </text>
            ))}

            {/* Mini-illustration */}
            {illusIn > 0 && (
              <g opacity={illusIn}>
                {col.key === "SUPERVISED" && (
                  // Labeled boxes X→Y
                  <>
                    {[0, 1, 2].map((i) => (
                      <g key={i}>
                        <rect x={col.x + 30 + i * 70} y={COL_Y + 130} width={50} height={40} rx="6"
                          fill={col.color} fillOpacity={0.2} stroke={col.color} strokeWidth="1.5" strokeOpacity="0.6" />
                        <text x={col.x + 55 + i * 70} y={COL_Y + 145} textAnchor="middle"
                          fill={col.color} fontFamily={T.mono} fontSize="11" fontWeight="700">X{i + 1}</text>
                        <text x={col.x + 55 + i * 70} y={COL_Y + 160} textAnchor="middle"
                          fill={T.textDim} fontFamily={T.mono} fontSize="10">{i % 2 === 0 ? "A" : "B"}</text>
                      </g>
                    ))}
                    <text x={cx} y={COL_Y + 200} textAnchor="middle"
                      fill={T.textDim} fontFamily={T.sans} fontSize="11">labeled pairs (X, Y)</text>
                  </>
                )}
                {col.key === "UNSUPERVISED" && (
                  // Scattered unlabeled points
                  <>
                    {[
                      [cx - 60, COL_Y + 145], [cx - 20, COL_Y + 130], [cx + 50, COL_Y + 150],
                      [cx - 40, COL_Y + 175], [cx + 20, COL_Y + 165], [cx + 70, COL_Y + 140],
                      [cx - 70, COL_Y + 200], [cx + 40, COL_Y + 190],
                    ].map(([px, py], i) => (
                      <circle key={i} cx={px} cy={py} r="7"
                        fill={col.color} fillOpacity={0.4} stroke={col.color} strokeWidth="1" />
                    ))}
                    <text x={cx} y={COL_Y + 220} textAnchor="middle"
                      fill={T.textDim} fontFamily={T.sans} fontSize="11">no labels</text>
                  </>
                )}
                {col.key === "REINFORCEMENT" && (
                  // Agent + arrow loop + environment box
                  <>
                    <circle cx={cx} cy={COL_Y + 155} r="22"
                      fill={col.color} fillOpacity={0.2} stroke={col.color} strokeWidth="1.5" />
                    <text x={cx} y={COL_Y + 151} textAnchor="middle"
                      fill={col.color} fontFamily={T.sans} fontSize="10" fontWeight="700">AGENT</text>
                    <text x={cx} y={COL_Y + 164} textAnchor="middle"
                      fill={T.textDim} fontFamily={T.mono} fontSize="9">π</text>
                    <path d={`M ${cx + 22} ${COL_Y + 155} Q ${cx + 65} ${COL_Y + 115} ${cx + 22} ${COL_Y + 185}`}
                      fill="none" stroke={col.color} strokeWidth="1.5" strokeOpacity="0.6"
                      markerEnd="url(#arr)" />
                    <rect x={col.x + 170} y={COL_Y + 130} width={70} height={40} rx="6"
                      fill={col.color} fillOpacity={0.1} stroke={col.color} strokeWidth="1" strokeOpacity="0.5" />
                    <text x={col.x + 205} y={COL_Y + 150} textAnchor="middle"
                      fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="600">ENV</text>
                    <text x={col.x + 205} y={COL_Y + 163} textAnchor="middle"
                      fill={T.textDim} fontFamily={T.mono} fontSize="9">reward</text>
                  </>
                )}
              </g>
            )}

            {/* Example */}
            {exampIn > 0 && (
              <g opacity={exampIn}>
                <rect x={col.x + 20} y={COL_Y + COL_H - 80} width={COL_W - 40} height={36} rx="18"
                  fill={col.color} fillOpacity={0.12} stroke={col.color} strokeWidth="1" strokeOpacity="0.5" />
                <text x={cx} y={COL_Y + COL_H - 57} textAnchor="middle"
                  fill={col.color} fontFamily={T.sans} fontSize="13" fontWeight="600">
                  e.g. {col.example}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
