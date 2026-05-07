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

// Hardcoded data points in 3 natural clusters
// cluster 0 (cyan): top-left region
// cluster 1 (violet): top-right region
// cluster 2 (amber): bottom-center region
const DATA_POINTS = [
  { id: 0, x: 180, y: 160, cluster: 0 },
  { id: 1, x: 230, y: 200, cluster: 0 },
  { id: 2, x: 160, y: 240, cluster: 0 },
  { id: 3, x: 260, y: 155, cluster: 0 },
  { id: 4, x: 200, y: 290, cluster: 0 },
  { id: 5, x: 700, y: 150, cluster: 1 },
  { id: 6, x: 760, y: 200, cluster: 1 },
  { id: 7, x: 720, y: 240, cluster: 1 },
  { id: 8, x: 800, y: 160, cluster: 1 },
  { id: 9, x: 750, y: 290, cluster: 1 },
  { id: 10, x: 430, y: 470, cluster: 2 },
  { id: 11, x: 480, y: 520, cluster: 2 },
  { id: 12, x: 520, y: 460, cluster: 2 },
  { id: 13, x: 450, y: 560, cluster: 2 },
  { id: 14, x: 550, y: 510, cluster: 2 },
];

// True centroids (mean of each cluster)
const TRUE_CENTROIDS = [
  { x: 206, y: 209 }, // cluster 0
  { x: 746, y: 208 }, // cluster 1
  { x: 486, y: 503 }, // cluster 2
];

// Initial centroid positions (random-ish, not at true centers)
const INIT_CENTROIDS = [
  { x: 320, y: 190 },
  { x: 620, y: 330 },
  { x: 550, y: 430 },
];

const CLUSTER_COLORS = [T.cyan, T.violet, T.amber];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export const KMeansDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const pointsIn   = p(frame, duration, 0.00, 0.15);
  const centroidsIn = p(frame, duration, 0.15, 0.35);
  const assignP    = p(frame, duration, 0.35, 0.65);
  const moveP      = p(frame, duration, 0.65, 0.85);
  const boundaryIn = p(frame, duration, 0.85, 1.00);

  const hiCentroid = hi("CENTROID");
  const hiCluster  = hi("CLUSTER");

  // Interpolate centroid positions
  const centroids = INIT_CENTROIDS.map((init, i) => ({
    x: lerp(init.x, TRUE_CENTROIDS[i].x, moveP),
    y: lerp(init.y, TRUE_CENTROIDS[i].y, moveP),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="km-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="km-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Cluster boundary circles */}
      {boundaryIn > 0 && TRUE_CENTROIDS.map((c, i) => (
        <circle key={`boundary-${i}`}
          cx={c.x} cy={c.y} r={120 * boundaryIn}
          fill={CLUSTER_COLORS[i]} fillOpacity={0.06 * boundaryIn}
          stroke={CLUSTER_COLORS[i]} strokeWidth="1.5"
          strokeOpacity={0.3 * boundaryIn}
          strokeDasharray="8 5"
          filter={hiCluster ? "url(#km-glow-sm)" : undefined}
        />
      ))}

      {/* Lines from points to nearest centroid */}
      {assignP > 0 && DATA_POINTS.map((pt) => {
        const c = centroids[pt.cluster];
        const color = CLUSTER_COLORS[pt.cluster];
        return (
          <line key={`line-${pt.id}`}
            x1={pt.x} y1={pt.y} x2={c.x} y2={c.y}
            stroke={color} strokeWidth="1"
            opacity={assignP * 0.3}
          />
        );
      })}

      {/* Data points */}
      {DATA_POINTS.map((pt) => {
        const color = assignP > 0.3 ? CLUSTER_COLORS[pt.cluster] : T.textDim;
        return (
          <circle key={pt.id}
            cx={pt.x} cy={pt.y} r={10}
            fill={color}
            fillOpacity={assignP > 0.3 ? 0.55 : 0.3}
            stroke={color}
            strokeWidth={assignP > 0.3 ? 1.5 : 1}
            opacity={pointsIn}
          />
        );
      })}

      {/* Centroid stars */}
      {centroidsIn > 0 && centroids.map((c, i) => {
        const color = CLUSTER_COLORS[i];
        // Draw a star shape
        const r1 = hiCentroid ? 20 : 16;
        const r2 = r1 * 0.45;
        const pts = Array.from({ length: 5 }).map((_, si) => {
          const outer = Math.PI / 2 + si * (2 * Math.PI / 5);
          const inner = outer + Math.PI / 5;
          const ox = c.x + r1 * Math.cos(outer);
          const oy = c.y - r1 * Math.sin(outer);
          const ix = c.x + r2 * Math.cos(inner);
          const iy = c.y - r2 * Math.sin(inner);
          return `${ox},${oy} ${ix},${iy}`;
        });
        return (
          <g key={`centroid-${i}`} opacity={centroidsIn}>
            <polygon
              points={pts.join(" ")}
              fill={color}
              fillOpacity={0.9}
              stroke={color}
              strokeWidth={hiCentroid ? 2.5 : 1.5}
              filter={hiCentroid ? "url(#km-glow)" : "url(#km-glow-sm)"}
            />
          </g>
        );
      })}

      {/* CONVERGED label */}
      {boundaryIn > 0.5 && (
        <g opacity={(boundaryIn - 0.5) * 2}>
          <rect x={W / 2 - 100} y={620} width={200} height={38} rx="19" fill={T.mint} opacity={0.12} />
          <text x={W / 2} y={644} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="700" letterSpacing="2">
            CONVERGED
          </text>
        </g>
      )}

      {/* K label */}
      <text x={60} y={50} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="1"
        opacity={centroidsIn}>
        K=3
      </text>
    </svg>
  );
};
