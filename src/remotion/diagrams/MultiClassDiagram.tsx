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

// Three clusters of ~8 points each
const CLUSTER_A = [ // cyan: top-left
  { x: 200, y: 130 }, { x: 250, y: 180 }, { x: 175, y: 210 },
  { x: 295, y: 150 }, { x: 230, y: 250 }, { x: 165, y: 155 },
  { x: 270, y: 210 }, { x: 195, y: 280 },
];
const CLUSTER_B = [ // violet: top-right
  { x: 820, y: 130 }, { x: 870, y: 175 }, { x: 790, y: 200 },
  { x: 910, y: 150 }, { x: 845, y: 225 }, { x: 760, y: 155 },
  { x: 890, y: 210 }, { x: 820, y: 270 },
];
const CLUSTER_C = [ // mint: bottom-center
  { x: 490, y: 530 }, { x: 540, y: 570 }, { x: 455, y: 560 },
  { x: 580, y: 540 }, { x: 510, y: 600 }, { x: 565, y: 500 },
  { x: 430, y: 510 }, { x: 600, y: 570 },
];

// Center of canvas
const CX = 540, CY = 370;

// Test point (amber, larger)
const TEST_PT = { x: 420, y: 280 };

export const MultiClassDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const clustersIn   = p(frame, duration, 0.00, 0.20);
  const boundaryIn   = p(frame, duration, 0.20, 0.50);
  const tintIn       = p(frame, duration, 0.50, 0.70);
  const testPtIn     = p(frame, duration, 0.70, 0.85);
  const softmaxIn    = p(frame, duration, 0.85, 1.00);

  const hiSoftmax    = hi("SOFTMAX");
  const hiBoundary   = hi("BOUNDARY");
  const hiClass      = hi("CLASS");

  // Boundary lines from center fanning out to edges
  const boundaries = [
    { x1: CX, y1: CY, x2: 0, y2: 0 },       // top-left
    { x1: CX, y1: CY, x2: W, y2: 0 },       // top-right
    { x1: CX, y1: CY, x2: W / 2, y2: H },   // bottom
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="mc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Region tints */}
      {tintIn > 0 && (
        <g opacity={tintIn * 0.12}>
          <polygon points={`${CX},${CY} 0,0 ${W},0`} fill={T.violet} />
          <polygon points={`${CX},${CY} 0,0 0,${H} ${W / 2},${H}`} fill={T.cyan} />
          <polygon points={`${CX},${CY} ${W},0 ${W},${H} ${W / 2},${H}`} fill={T.mint} />
        </g>
      )}

      {/* Boundary lines */}
      {boundaryIn > 0 && boundaries.map((b, i) => (
        <line key={i}
          x1={b.x1} y1={b.y1}
          x2={b.x1 + boundaryIn * (b.x2 - b.x1)}
          y2={b.y1 + boundaryIn * (b.y2 - b.y1)}
          stroke={hiBoundary ? T.amber : T.borderStrong}
          strokeWidth={hiBoundary ? 2.5 : 1.5}
          strokeDasharray="8 5"
          filter={hiBoundary ? "url(#mc-glow)" : undefined}
        />
      ))}

      {/* Clusters */}
      <g opacity={clustersIn}>
        {CLUSTER_A.map((pt, i) => (
          <circle key={`a-${i}`} cx={pt.x} cy={pt.y} r={10}
            fill={T.cyan} fillOpacity={hiClass ? 0.9 : 0.7}
            stroke={T.cyan} strokeWidth="1.5"
            filter={hiClass ? "url(#mc-glow)" : undefined}
          />
        ))}
        {CLUSTER_B.map((pt, i) => (
          <circle key={`b-${i}`} cx={pt.x} cy={pt.y} r={10}
            fill={T.violet} fillOpacity={hiClass ? 0.9 : 0.7}
            stroke={T.violet} strokeWidth="1.5"
            filter={hiClass ? "url(#mc-glow)" : undefined}
          />
        ))}
        {CLUSTER_C.map((pt, i) => (
          <circle key={`c-${i}`} cx={pt.x} cy={pt.y} r={10}
            fill={T.mint} fillOpacity={hiClass ? 0.9 : 0.7}
            stroke={T.mint} strokeWidth="1.5"
            filter={hiClass ? "url(#mc-glow)" : undefined}
          />
        ))}
        {/* Cluster labels */}
        <text x={200} y={90} textAnchor="middle" fill={T.cyan} fontFamily={T.sans} fontSize="16" fontWeight="700">Class A</text>
        <text x={840} y={90} textAnchor="middle" fill={T.violet} fontFamily={T.sans} fontSize="16" fontWeight="700">Class B</text>
        <text x={515} y={650} textAnchor="middle" fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="700">Class C</text>
      </g>

      {/* Test point + classification line */}
      {testPtIn > 0 && (
        <g opacity={testPtIn}>
          <circle cx={TEST_PT.x} cy={TEST_PT.y} r={16}
            fill={T.amber} fillOpacity={0.85}
            stroke={T.amber} strokeWidth="2.5"
            filter="url(#mc-glow)"
          />
          <text x={TEST_PT.x} y={TEST_PT.y - 22} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="13" fontWeight="700">Test Point</text>
          {/* Line toward nearest boundary */}
          <line x1={TEST_PT.x} y1={TEST_PT.y}
            x2={TEST_PT.x + testPtIn * (CX - TEST_PT.x) * 0.4}
            y2={TEST_PT.y + testPtIn * (CY - TEST_PT.y) * 0.4}
            stroke={T.amber} strokeWidth="1.5" strokeDasharray="5 3" opacity={0.6}
          />
        </g>
      )}

      {/* Softmax probabilities */}
      {softmaxIn > 0 && (
        <g opacity={softmaxIn}>
          <rect x={TEST_PT.x - 110} y={TEST_PT.y + 24} width={220} height={90} rx="10"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
          <text x={TEST_PT.x} y={TEST_PT.y + 44} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="10" fontWeight="700" letterSpacing="1">
            SOFTMAX OUTPUT
          </text>
          <text x={TEST_PT.x} y={TEST_PT.y + 62} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="13">Class A: 72%</text>
          <text x={TEST_PT.x} y={TEST_PT.y + 78} textAnchor="middle"
            fill={T.violet} fontFamily={T.mono} fontSize="13">Class B: 21%</text>
          <text x={TEST_PT.x} y={TEST_PT.y + 94} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="13">Class C:  7%</text>
          {hiSoftmax && (
            <rect x={TEST_PT.x - 110} y={TEST_PT.y + 24} width={220} height={90} rx="10"
              fill="none" stroke={T.amber} strokeWidth="2"
              filter="url(#mc-glow)" />
          )}
        </g>
      )}
    </svg>
  );
};
