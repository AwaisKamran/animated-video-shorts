import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const NODE_R = 64;
const LEFT_X = 160, RIGHT_X = 920;
const HTTP_Y = 200, HTTPS_Y = 480;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

function DataBead({ x, color }: { x: number; color: string }) {
  return <circle cx={x} cy={0} r="7" fill={color} />;
}

export const HTTPDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hiHttps = keyTerms.some(k => ["HTTPS","TLS","SSL","ENCRYPT"].includes(k.toUpperCase()));

  const rowsIn    = p(frame, duration, 0.0, 0.20);
  const httpArrow = p(frame, duration, 0.22, 0.58);
  const httpsArrow = p(frame, duration, 0.61, 0.93);
  const conclude  = p(frame, duration, 0.95, 1.00);

  // HTTP arrow bead position (clamped so 180px-wide label stays inside canvas)
  const httpBeadX = Math.max(90, Math.min(W - 90, LEFT_X + NODE_R + httpArrow * (RIGHT_X - LEFT_X - NODE_R * 2)));
  // HTTPS arrow bead position
  const httpsBeadX = LEFT_X + NODE_R + httpsArrow * (RIGHT_X - LEFT_X - NODE_R * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="glow-h"><feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-green"><feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* ─── HTTP ROW ─── */}
      <g opacity={rowsIn}>
        {/* Label */}
        <rect x={W / 2 - 80} y={HTTP_Y - 60} width="160" height="34" rx="17"
          fill={T.coral} opacity="0.15" />
        <text x={W / 2} y={HTTP_Y - 38} textAnchor="middle"
          fill={T.coral} fontFamily={T.sans} fontSize="18" fontWeight="700" letterSpacing="2">HTTP</text>

        {/* Nodes */}
        <circle cx={LEFT_X} cy={HTTP_Y} r={NODE_R} fill={T.nodeFill} stroke={T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${LEFT_X - 17}, ${HTTP_Y - 14})`}>
          <NodeIcon type="browser" size={34} color={T.textSecondary} />
        </g>
        <text x={LEFT_X} y={HTTP_Y + NODE_R + 26} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" letterSpacing="1">CLIENT</text>

        <circle cx={RIGHT_X} cy={HTTP_Y} r={NODE_R} fill={T.nodeFill} stroke={T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${RIGHT_X - 18}, ${HTTP_Y - 18})`}>
          <NodeIcon type="server" size={36} color={T.textSecondary} />
        </g>
        <text x={RIGHT_X} y={HTTP_Y + NODE_R + 26} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" letterSpacing="1">SERVER</text>

        {/* Connection line - dashed red */}
        <line x1={LEFT_X + NODE_R} y1={HTTP_Y} x2={RIGHT_X - NODE_R} y2={HTTP_Y}
          stroke={T.coral} strokeWidth="1.5" strokeDasharray="10 6" opacity="0.4" />
      </g>

      {/* HTTP data packet - EXPOSED */}
      {httpArrow > 0 && (
        <g transform={`translate(0, ${HTTP_Y})`}>
          <DataBead x={httpBeadX} color={T.coral} />
          {/* Exposed data label (visible) */}
          {httpArrow > 0.3 && httpArrow < 0.9 && (
            <g transform={`translate(${httpBeadX}, -30)`}>
              <rect x="-90" y="-16" width="180" height="28" rx="14" fill={T.coral} opacity="0.15" />
              <text x="0" y="0" textAnchor="middle"
                fill={T.coral} fontFamily={T.mono} fontSize="13">user=john&amp;pw=1234</text>
            </g>
          )}
        </g>
      )}

      {/* Unlock icon for HTTP */}
      {rowsIn > 0.5 && (
        <g transform={`translate(${W / 2 - 16}, ${HTTP_Y - 18})`} opacity={rowsIn}>
          <NodeIcon type="globe" size={32} color={T.coral} />
        </g>
      )}

      {/* ─── HTTPS ROW ─── */}
      <g opacity={rowsIn}>
        <rect x={W / 2 - 90} y={HTTPS_Y - 60} width="180" height="34" rx="17"
          fill={T.mint} opacity={hiHttps ? 0.3 : 0.15}
          filter={hiHttps ? "url(#glow-green)" : undefined} />
        <text x={W / 2} y={HTTPS_Y - 38} textAnchor="middle"
          fill={T.mint} fontFamily={T.sans} fontSize="18" fontWeight="700" letterSpacing="2">HTTPS</text>

        <circle cx={LEFT_X} cy={HTTPS_Y} r={NODE_R} fill={T.nodeFill}
          stroke={httpsArrow > 0.5 ? T.mint : T.nodeBorder} strokeWidth="1.5"
          filter={httpsArrow > 0.5 ? "url(#glow-green)" : undefined} />
        <g transform={`translate(${LEFT_X - 17}, ${HTTPS_Y - 14})`}>
          <NodeIcon type="browser" size={34} color={httpsArrow > 0.5 ? T.mint : T.textSecondary} />
        </g>
        <text x={LEFT_X} y={HTTPS_Y + NODE_R + 26} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" letterSpacing="1">CLIENT</text>

        <circle cx={RIGHT_X} cy={HTTPS_Y} r={NODE_R} fill={T.nodeFill}
          stroke={httpsArrow > 0.5 ? T.mint : T.nodeBorder} strokeWidth="1.5"
          filter={httpsArrow > 0.5 ? "url(#glow-green)" : undefined} />
        <g transform={`translate(${RIGHT_X - 18}, ${HTTPS_Y - 18})`}>
          <NodeIcon type="server" size={36} color={httpsArrow > 0.5 ? T.mint : T.textSecondary} />
        </g>
        <text x={RIGHT_X} y={HTTPS_Y + NODE_R + 26} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="16" letterSpacing="1">SERVER</text>

        {/* Connection - solid mint */}
        <line x1={LEFT_X + NODE_R} y1={HTTPS_Y} x2={RIGHT_X - NODE_R} y2={HTTPS_Y}
          stroke={T.mint} strokeWidth="1.5" opacity="0.4" />
      </g>

      {/* HTTPS data packet - encrypted */}
      {httpsArrow > 0 && (
        <g transform={`translate(0, ${HTTPS_Y})`}>
          <DataBead x={httpsBeadX} color={T.mint} />
          {httpsArrow > 0.2 && httpsArrow < 0.95 && (
            <g transform={`translate(${httpsBeadX}, -30)`}>
              <rect x="-48" y="-16" width="96" height="28" rx="14" fill={T.mint} opacity="0.15" />
              <text x="0" y="0" textAnchor="middle"
                fill={T.mint} fontFamily={T.mono} fontSize="16">🔒 ██████</text>
            </g>
          )}
        </g>
      )}

      {/* Lock icon for HTTPS */}
      {rowsIn > 0.5 && (
        <g transform={`translate(${W / 2 - 12}, ${HTTPS_Y - 18})`} opacity={rowsIn}>
          <NodeIcon type="lock" size={28} color={T.mint} />
        </g>
      )}

    </svg>
  );
};
