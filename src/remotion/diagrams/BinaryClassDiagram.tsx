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

// Class A: cyan — top-right cluster
const CLASS_A = [
  { x: 680, y: 140 }, { x: 740, y: 190 }, { x: 760, y: 120 },
  { x: 820, y: 165 }, { x: 700, y: 230 }, { x: 860, y: 200 },
  { x: 790, y: 270 }, { x: 650, y: 195 }, { x: 720, y: 155 },
  { x: 810, y: 250 }, { x: 875, y: 140 }, { x: 670, y: 300 },
];

// Class B: coral — bottom-left cluster, with 3-4 in overlap zone
const CLASS_B = [
  { x: 220, y: 440 }, { x: 280, y: 490 }, { x: 240, y: 530 },
  { x: 310, y: 560 }, { x: 360, y: 440 }, { x: 180, y: 510 },
  { x: 320, y: 400 }, { x: 400, y: 480 }, { x: 260, y: 570 },
  { x: 340, y: 350 }, { x: 450, y: 420 }, { x: 410, y: 350 },
];

// Misclassified points (overlap zone)
const MISCLASSIFIED_A = [11]; // index in CLASS_A
const MISCLASSIFIED_B = [9, 10, 11]; // indices in CLASS_B

// Decision boundary: curved S-shape (cubic bezier via path)
// From (100, 600) curving to (980, 160)
const BOUNDARY_PATH = "M 80,620 C 300,520 500,380 700,280 S 900,160 1000,80";

export const BinaryClassDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const clustersIn   = p(frame, duration, 0.00, 0.25);
  const boundaryIn   = p(frame, duration, 0.25, 0.55);
  const marksIn      = p(frame, duration, 0.55, 0.75);
  const accuracyIn   = p(frame, duration, 0.75, 0.90);
  const labelsIn     = p(frame, duration, 0.90, 1.00);

  const hiBoundary  = hi("BOUNDARY");
  const hiMisclass  = hi("MISCLASSIFIED");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="bc-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Class A points (cyan) */}
      <g opacity={clustersIn}>
        {CLASS_A.map((pt, i) => {
          const isMis = MISCLASSIFIED_A.includes(i);
          return (
            <circle key={`a-${i}`} cx={pt.x} cy={pt.y} r={11}
              fill={T.cyan} fillOpacity={isMis ? 0.5 : 0.8}
              stroke={T.cyan} strokeWidth="1.5"
            />
          );
        })}
      </g>

      {/* Class B points (coral) */}
      <g opacity={clustersIn}>
        {CLASS_B.map((pt, i) => {
          const isMis = MISCLASSIFIED_B.includes(i);
          return (
            <circle key={`b-${i}`} cx={pt.x} cy={pt.y} r={11}
              fill={T.coral} fillOpacity={isMis ? 0.5 : 0.8}
              stroke={T.coral} strokeWidth="1.5"
            />
          );
        })}
      </g>

      {/* Decision boundary */}
      {boundaryIn > 0 && (
        <path
          d={BOUNDARY_PATH}
          fill="none"
          stroke={hiBoundary ? T.amber : T.textPrimary}
          strokeWidth={hiBoundary ? 4 : 3}
          strokeDasharray={`${boundaryIn * 2000} 2000`}
          filter={hiBoundary ? "url(#bc-glow)" : undefined}
        />
      )}

      {/* Check marks on correct, X on misclassified */}
      {marksIn > 0 && (
        <g opacity={marksIn}>
          {/* Checkmarks on correct Class A */}
          {CLASS_A.map((pt, i) => {
            if (MISCLASSIFIED_A.includes(i)) return null;
            return (
              <text key={`ck-a-${i}`} x={pt.x + 12} y={pt.y - 8}
                fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700">✓</text>
            );
          })}
          {/* Checkmarks on correct Class B */}
          {CLASS_B.map((pt, i) => {
            if (MISCLASSIFIED_B.includes(i)) return null;
            return (
              <text key={`ck-b-${i}`} x={pt.x + 12} y={pt.y - 8}
                fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700">✓</text>
            );
          })}
          {/* X marks on misclassified */}
          {MISCLASSIFIED_A.map(i => (
            <text key={`x-a-${i}`} x={CLASS_A[i].x + 12} y={CLASS_A[i].y - 8}
              fill={hiMisclass ? "#FF2244" : T.coral}
              fontFamily={T.sans} fontSize="16" fontWeight="900"
              filter={hiMisclass ? "url(#bc-glow)" : undefined}>✗</text>
          ))}
          {MISCLASSIFIED_B.map(i => (
            <text key={`x-b-${i}`} x={CLASS_B[i].x + 12} y={CLASS_B[i].y - 8}
              fill={hiMisclass ? "#FF2244" : T.coral}
              fontFamily={T.sans} fontSize="16" fontWeight="900"
              filter={hiMisclass ? "url(#bc-glow)" : undefined}>✗</text>
          ))}
        </g>
      )}

      {/* Accuracy badge */}
      {accuracyIn > 0 && (
        <g opacity={accuracyIn}>
          <rect x={W / 2 - 110} y={622} width={220} height={48} rx="24"
            fill={T.bgDeep} stroke={T.mint} strokeWidth="2" />
          <text x={W / 2} y={652} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="22" fontWeight="700" letterSpacing="0.5">
            Accuracy: 88%
          </text>
        </g>
      )}

      {/* Class labels */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          <rect x={720} y={76} width={180} height={40} rx="8"
            fill={T.cyan} fillOpacity={0.15} stroke={T.cyan} strokeWidth="1.5" />
          <text x={810} y={102} textAnchor="middle"
            fill={T.cyan} fontFamily={T.sans} fontSize="17" fontWeight="700">
            Class A (12)
          </text>
          <rect x={130} y={540} width={180} height={40} rx="8"
            fill={T.coral} fillOpacity={0.15} stroke={T.coral} strokeWidth="1.5" />
          <text x={220} y={566} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="17" fontWeight="700">
            Class B (12)
          </text>
        </g>
      )}
    </svg>
  );
};
