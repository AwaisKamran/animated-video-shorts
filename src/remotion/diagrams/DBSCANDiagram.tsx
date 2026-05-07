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

// Cluster 1: cyan (left area)
const CLUSTER1 = [
  { x: 200, y: 250 }, { x: 245, y: 220 }, { x: 260, y: 280 },
  { x: 220, y: 310 }, { x: 280, y: 245 }, { x: 300, y: 290 },
  { x: 235, y: 355 }, { x: 290, y: 340 }, { x: 175, y: 295 },
];

// Cluster 2: violet (right area)
const CLUSTER2 = [
  { x: 720, y: 280 }, { x: 765, y: 250 }, { x: 780, y: 310 },
  { x: 740, y: 340 }, { x: 800, y: 275 }, { x: 820, y: 320 },
  { x: 755, y: 380 }, { x: 815, y: 360 }, { x: 695, y: 330 },
  { x: 840, y: 240 }, { x: 710, y: 210 },
];

// Noise points (isolated)
const NOISE = [
  { x: 450, y: 160 }, { x: 900, y: 500 }, { x: 140, y: 560 }, { x: 600, y: 580 },
];

// Core points for epsilon circles
const CORE_POINTS = [
  { x: 245, y: 280, cluster: 1 },
  { x: 755, y: 300, cluster: 2 },
  { x: 785, y: 315, cluster: 2 },
];
const EPSILON = 90;

export const DBSCANDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const ptsIn     = p(frame, duration, 0.00, 0.15);
  const epsilonIn = p(frame, duration, 0.15, 0.40);
  const clusterIn = p(frame, duration, 0.40, 0.65);
  const noiseIn   = p(frame, duration, 0.65, 0.80);
  const legendIn  = p(frame, duration, 0.80, 1.00);

  const hiEpsilon = hi("EPSILON");
  const hiNoise   = hi("NOISE");
  const hiDensity = hi("DENSITY");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="db-glow">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Epsilon circles around core points */}
      {epsilonIn > 0 && CORE_POINTS.map((cp, i) => (
        <circle key={i}
          cx={cp.x} cy={cp.y} r={EPSILON * epsilonIn}
          fill={T.textDim} fillOpacity={hiEpsilon ? 0.10 : 0.04}
          stroke={hiEpsilon ? T.amber : T.borderStrong}
          strokeWidth={hiEpsilon ? 2 : 1.5}
          strokeDasharray="7 5"
          filter={hiEpsilon ? "url(#db-glow)" : undefined}
        />
      ))}

      {/* Data points: dim until clustered */}
      <g opacity={ptsIn}>
        {CLUSTER1.map((pt, i) => (
          <circle key={`c1-${i}`} cx={pt.x} cy={pt.y} r={9}
            fill={clusterIn > 0 ? T.cyan : T.textDim}
            fillOpacity={clusterIn > 0 ? 0.8 : 0.3}
            stroke={clusterIn > 0 ? T.cyan : T.borderStrong}
            strokeWidth="1.5"
            filter={hiDensity && clusterIn > 0 ? "url(#db-glow)" : undefined}
          />
        ))}
        {CLUSTER2.map((pt, i) => (
          <circle key={`c2-${i}`} cx={pt.x} cy={pt.y} r={9}
            fill={clusterIn > 0 ? T.violet : T.textDim}
            fillOpacity={clusterIn > 0 ? 0.8 : 0.3}
            stroke={clusterIn > 0 ? T.violet : T.borderStrong}
            strokeWidth="1.5"
            filter={hiDensity && clusterIn > 0 ? "url(#db-glow)" : undefined}
          />
        ))}
      </g>

      {/* Noise points with X marks */}
      {ptsIn > 0 && NOISE.map((pt, i) => (
        <g key={`noise-${i}`} opacity={ptsIn}>
          <circle cx={pt.x} cy={pt.y} r={9}
            fill={noiseIn > 0 ? T.coral : T.textDim}
            fillOpacity={noiseIn > 0 ? 0.7 : 0.3}
            stroke={noiseIn > 0 ? T.coral : T.borderStrong}
            strokeWidth="1.5"
            filter={noiseIn > 0 && hiNoise ? "url(#db-glow)" : undefined}
          />
          {noiseIn > 0 && (
            <g opacity={noiseIn}>
              <text x={pt.x} y={pt.y + 4} textAnchor="middle"
                fill={T.coral} fontFamily={T.sans} fontSize="14" fontWeight="900">✗</text>
            </g>
          )}
        </g>
      ))}

      {/* Noise label */}
      {noiseIn > 0 && (
        <g opacity={noiseIn}>
          <text x={450} y={135} textAnchor="middle"
            fill={hiNoise ? "#FF2244" : T.coral}
            fontFamily={T.sans} fontSize="14" fontWeight="700"
            filter={hiNoise ? "url(#db-glow)" : undefined}>NOISE</text>
        </g>
      )}

      {/* Legend */}
      {legendIn > 0 && (
        <g opacity={legendIn}>
          <rect x={340} y={600} width={400} height={72} rx="10"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />

          <circle cx={370} cy={620} r={8} fill={T.cyan} />
          <text x={385} y={625} fill={T.cyan} fontFamily={T.sans} fontSize="13">Cluster 1</text>

          <circle cx={490} cy={620} r={8} fill={T.violet} />
          <text x={505} y={625} fill={T.violet} fontFamily={T.sans} fontSize="13">Cluster 2</text>

          <circle cx={600} cy={620} r={8} fill={T.coral} />
          <text x={615} y={625} fill={T.coral} fontFamily={T.sans} fontSize="13">Noise</text>

          <text x={540} y={656} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700">
            No K needed!
          </text>
        </g>
      )}
    </svg>
  );
};
