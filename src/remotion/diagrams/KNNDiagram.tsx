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

// Cyan class (top region)
const CYAN_PTS = [
  { x: 200, y: 160 }, { x: 280, y: 130 }, { x: 350, y: 190 }, { x: 230, y: 220 },
  { x: 310, y: 240 }, { x: 170, y: 195 }, { x: 400, y: 155 }, { x: 260, y: 280 },
  { x: 340, y: 300 }, { x: 180, y: 300 },
];

// Coral class (right/lower region)
const CORAL_PTS = [
  { x: 700, y: 250 }, { x: 760, y: 200 }, { x: 820, y: 290 }, { x: 680, y: 310 },
  { x: 750, y: 350 }, { x: 840, y: 230 }, { x: 640, y: 380 }, { x: 790, y: 400 },
  { x: 720, y: 430 }, { x: 870, y: 370 },
];

// Query point sits in the middle
const QX = 490, QY = 310;

// The 5 nearest neighbors (3 cyan, 2 coral) — indices into combined array
const NEAREST = [
  { pt: { x: 400, y: 155 }, cls: "cyan",  dist: 180 },
  { pt: { x: 340, y: 300 }, cls: "cyan",  dist: 155 },
  { pt: { x: 260, y: 280 }, cls: "cyan",  dist: 235 },
  { pt: { x: 640, y: 380 }, cls: "coral", dist: 180 },
  { pt: { x: 680, y: 310 }, cls: "coral", dist: 195 },
];

const K_CIRCLE_R = 230;

export const KNNDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const classesIn = p(frame, duration, 0.00, 0.20);
  const queryIn   = p(frame, duration, 0.20, 0.40);
  const circleIn  = p(frame, duration, 0.40, 0.65);
  const voteIn    = p(frame, duration, 0.65, 0.85);
  const resultIn  = p(frame, duration, 0.85, 1.00);

  const hiDist = hi("DISTANCE");
  const hiK    = hi("K=5");
  const hiN    = hi("NEIGHBORS");

  const assigned = resultIn > 0.3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="knn-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Existing classes */}
      <g opacity={classesIn}>
        {CYAN_PTS.map((pt, i) => (
          <circle key={`c${i}`} cx={pt.x} cy={pt.y} r="10"
            fill={T.cyan} fillOpacity={0.5} stroke={T.cyan} strokeWidth="1.5" />
        ))}
        {CORAL_PTS.map((pt, i) => (
          <circle key={`r${i}`} cx={pt.x} cy={pt.y} r="10"
            fill={T.coral} fillOpacity={0.5} stroke={T.coral} strokeWidth="1.5" />
        ))}
        <text x={240} y={90} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
          CLASS A
        </text>
        <text x={760} y={165} textAnchor="middle"
          fill={T.coral} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
          CLASS B
        </text>
      </g>

      {/* K circle expanding */}
      {circleIn > 0 && (
        <circle cx={QX} cy={QY} r={K_CIRCLE_R * circleIn}
          fill="none" stroke={T.amber} strokeWidth="2" strokeDasharray="10 6"
          strokeOpacity={0.6}
          filter={hiK ? "url(#knn-glow)" : undefined}
        />
      )}

      {/* Lines to neighbors */}
      {circleIn > 0.5 && NEAREST.map((n, i) => {
        const lineAlpha = Math.max(0, Math.min(1, (circleIn - 0.5) * 2 * 5 - i));
        return (
          <line key={i}
            x1={QX} y1={QY} x2={n.pt.x} y2={n.pt.y}
            stroke={n.cls === "cyan" ? T.cyan : T.coral}
            strokeWidth={hiDist ? 2 : 1.5}
            strokeOpacity={lineAlpha * 0.7}
            strokeDasharray="6 4"
            filter={hiDist ? "url(#knn-glow)" : undefined}
          />
        );
      })}

      {/* Query point */}
      {queryIn > 0 && (
        <g opacity={queryIn}>
          <circle cx={QX} cy={QY} r="18"
            fill={assigned ? T.cyan : T.amber}
            fillOpacity={0.8}
            stroke={assigned ? T.cyan : T.amber}
            strokeWidth="2.5"
            filter="url(#knn-glow)"
          />
          {!assigned && (
            <text x={QX} y={QY + 6} textAnchor="middle"
              fill={T.bgDeep} fontFamily={T.mono} fontSize="16" fontWeight="900">?</text>
          )}
          <text x={QX} y={QY + 42} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="13" fontWeight="700">
            Query Point
          </text>
        </g>
      )}

      {/* Vote tally */}
      {voteIn > 0 && (
        <g opacity={voteIn}>
          <rect x={850} y={80} width={200} height={100} rx="12"
            fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5" />
          <text x={950} y={106} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="1.5">
            VOTES
          </text>
          <text x={950} y={134} textAnchor="middle"
            fill={T.cyan} fontFamily={T.mono} fontSize="16" fontWeight="700">
            Class A: 3
          </text>
          <text x={950} y={160} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="16" fontWeight="700">
            Class B: 2
          </text>
        </g>
      )}

      {/* K=5 badge */}
      {resultIn > 0 && (
        <g opacity={resultIn}>
          <rect x={W / 2 - 130} y={590} width={260} height={52} rx="26"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2"
            filter={hiK || hiN ? "url(#knn-glow)" : undefined} />
          <text x={W / 2} y={620} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="1">
            K=5 NEIGHBORS → CLASS A
          </text>
        </g>
      )}
    </svg>
  );
};
