import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number }

const W = 1080, H = 700;
const WALL_X = 480, WALL_W = 120, WALL_Y = 80, WALL_H = 480;
const LEFT_CX = 220, RIGHT_CX = 860, NODE_Y = 320, R = 60;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const FirewallDiagram: React.FC<Props> = ({ frame, duration }) => {
  const wallIn   = p(frame, duration, 0.0, 0.22);
  const nodesIn  = p(frame, duration, 0.12, 0.30);
  const goodPkt  = p(frame, duration, 0.32, 0.65);
  const badPkt   = p(frame, duration, 0.67, 0.98);
  const conclude = p(frame, duration, 0.98, 1.00);

  // Good packet travels left → right (passes firewall)
  const goodX = LEFT_CX + R + goodPkt * (RIGHT_CX - LEFT_CX - R * 2);
  const goodPassed = goodPkt > 0.5;

  // Bad packet travels left → firewall, then bounces back
  const badProgress = badPkt * 2; // 0→1: toward wall, 1→2: bouncing back
  const badX = badProgress < 1
    ? LEFT_CX + R + badProgress * (WALL_X - LEFT_CX - R)
    : WALL_X - (badProgress - 1) * (WALL_X - LEFT_CX - R * 1.5);
  const badBlocked = badPkt > 0.5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="glow-fw"><feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-red"><feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Zone labels */}
      <g opacity={wallIn}>
        <text x={LEFT_CX} y={50} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="16" letterSpacing="3">INTERNET</text>
        <text x={RIGHT_CX} y={50} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="16" letterSpacing="3">YOUR NETWORK</text>
      </g>

      {/* Firewall wall */}
      <g opacity={wallIn}>
        <rect x={WALL_X} y={WALL_Y} width={WALL_W} height={WALL_H} rx="8"
          fill={T.bgDeep} stroke={T.amber} strokeWidth="2" />
        {/* Bricks */}
        {[0,1,2,3,4,5,6].map(row => (
          <g key={row}>
            {[0,1].map(col => (
              <rect key={col}
                x={WALL_X + col * (WALL_W / 2) + (row % 2 === 0 ? 0 : -WALL_W / 4) + 4}
                y={WALL_Y + row * 68 + 8}
                width={WALL_W / 2 - 8} height={56} rx="3"
                fill={T.amber} opacity="0.12" />
            ))}
          </g>
        ))}
        {/* Shield icon */}
        <g transform={`translate(${WALL_X + WALL_W / 2 - 18}, ${WALL_Y + 192})`}>
          <NodeIcon type="shield" size={36} color={T.amber} />
        </g>
        <text x={WALL_X + WALL_W / 2} y={WALL_Y + 270} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">FIREWALL</text>
      </g>

      {/* Client node */}
      <g opacity={nodesIn}>
        <circle cx={LEFT_CX} cy={NODE_Y} r={R}
          fill={T.nodeFill} stroke={T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${LEFT_CX - 17}, ${NODE_Y - 14})`}>
          <NodeIcon type="browser" size={34} color={T.textSecondary} />
        </g>
        <text x={LEFT_CX} y={NODE_Y + R + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" letterSpacing="1">CLIENT</text>
      </g>

      {/* Protected server */}
      <g opacity={nodesIn}>
        <circle cx={RIGHT_CX} cy={NODE_Y} r={R}
          fill={T.nodeFill} stroke={goodPassed ? T.mint : T.nodeBorder} strokeWidth="1.5"
          filter={goodPassed ? "url(#glow-fw)" : undefined} />
        <g transform={`translate(${RIGHT_CX - 18}, ${NODE_Y - 18})`}>
          <NodeIcon type="server" size={36} color={goodPassed ? T.mint : T.textSecondary} />
        </g>
        <text x={RIGHT_CX} y={NODE_Y + R + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" letterSpacing="1">PROTECTED</text>
      </g>

      {/* GOOD packet (passes) */}
      {goodPkt > 0 && (
        <g>
          {!goodPassed && (
            <>
              <circle cx={goodX} cy={NODE_Y} r="10" fill={T.mint} />
              <rect x={goodX - 28} y={NODE_Y - 42} width="56" height="24" rx="12" fill={T.bgDeep} />
              <text x={goodX} y={NODE_Y - 25} textAnchor="middle"
                fill={T.mint} fontFamily={T.mono} fontSize="13">ALLOW</text>
            </>
          )}
          {goodPassed && (
            <text x={WALL_X + WALL_W / 2} y={NODE_Y - 90} textAnchor="middle"
              fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="700">✓ PASS</text>
          )}
        </g>
      )}

      {/* BAD packet (blocked) */}
      {badPkt > 0 && (
        <g>
          <circle cx={badX} cy={NODE_Y + 100} r="10" fill={T.coral}
            filter={badBlocked ? "url(#glow-red)" : undefined} />
          {!badBlocked && (
            <g>
              <rect x={badX - 32} y={NODE_Y + 60} width="64" height="24" rx="12" fill={T.bgDeep} />
              <text x={badX} y={NODE_Y + 77} textAnchor="middle"
                fill={T.coral} fontFamily={T.mono} fontSize="13">MALWARE</text>
            </g>
          )}
          {badBlocked && (
            <text x={WALL_X + WALL_W / 2} y={NODE_Y + 150} textAnchor="middle"
              fill={T.coral} fontFamily={T.sans} fontSize="18" fontWeight="700">✗ BLOCKED</text>
          )}
        </g>
      )}

      {/* Rules panel */}
      <g opacity={Math.min(wallIn, 0.8)} transform={`translate(${WALL_X + WALL_W + 16}, ${WALL_Y + 360})`}>
        <rect x="0" y="0" width="190" height="96" rx="8" fill={T.bgDeep} stroke={T.border} strokeWidth="1" />
        <text x="12" y="24" fill={T.textDim} fontFamily={T.mono} fontSize="13">RULES:</text>
        <text x="12" y="46" fill={T.mint} fontFamily={T.mono} fontSize="13">✓ Port 443</text>
        <text x="12" y="64" fill={T.mint} fontFamily={T.mono} fontSize="13">✓ Port 80</text>
        <text x="12" y="82" fill={T.coral} fontFamily={T.mono} fontSize="13">✗ Suspicious</text>
      </g>

      {conclude > 0 && (
        <g opacity={conclude}>
          <text x={W / 2} y={620} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="22">
            Firewall = <tspan fill={T.amber} fontWeight="700">network security gate</tspan>
          </text>
        </g>
      )}
    </svg>
  );
};
