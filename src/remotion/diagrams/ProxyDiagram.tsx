import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const CL_X = 150, PRX_X = 540, SRV_X = 930;
const NODE_Y = 320, NR = 70;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

export const ProxyDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn  = p(frame, duration, 0.00, 0.18);
  const req1P    = p(frame, duration, 0.18, 0.43);   // client → proxy
  const stripP   = p(frame, duration, 0.43, 0.58);   // IP strip at proxy
  const req2P    = p(frame, duration, 0.60, 0.83);   // proxy → server
  const resp1P   = p(frame, duration, 0.84, 0.93);   // server → proxy
  const resp2P   = p(frame, duration, 0.94, 1.00);   // proxy → client
  const blockA   = p(frame, duration, 0.48, 0.65);   // blocked request demo

  const proxyColor  = hi("PROXY")     ? T.violet : T.violet;
  const anonColor   = hi("ANONYMOUS") ? T.amber  : T.amber;
  const filterColor = hi("FILTER")    ? T.coral  : T.coral;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="prx-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="prx-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Connections */}
      <g opacity={nodesIn}>
        <line x1={CL_X + NR} y1={NODE_Y} x2={PRX_X - NR} y2={NODE_Y}
          stroke={T.border} strokeWidth="1.5" />
        <line x1={PRX_X + NR} y1={NODE_Y} x2={SRV_X - NR} y2={NODE_Y}
          stroke={T.border} strokeWidth="1.5" />
      </g>

      {/* Client */}
      <g opacity={nodesIn}>
        <circle cx={CL_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={resp2P > 0.5 ? T.mint : T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${CL_X - 18}, ${NODE_Y - 22})`}>
          <NodeIcon type="browser" size={36} color={T.textSecondary} />
        </g>
        <text x={CL_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">CLIENT</text>
        {/* Client IP badge */}
        <rect x={CL_X - 62} y={NODE_Y - NR - 54} width={124} height={36} rx="18"
          fill={T.bgDeep} stroke={T.nodeBorder} strokeWidth="1" />
        <text x={CL_X} y={NODE_Y - NR - 30} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="13">IP: 10.0.0.5</text>
      </g>

      {/* Proxy */}
      <g opacity={nodesIn}>
        <circle cx={PRX_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={proxyColor}
          strokeWidth="2.5"
          filter={hi("PROXY") ? "url(#prx-glow)" : undefined}
        />
        <g transform={`translate(${PRX_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="shield" size={36} color={proxyColor} />
        </g>
        <text x={PRX_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={proxyColor} fontFamily={T.sans} fontSize="19" fontWeight="700" letterSpacing="2">PROXY</text>
      </g>

      {/* Server */}
      <g opacity={nodesIn}>
        <circle cx={SRV_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={req2P > 0.5 ? T.mint : T.nodeBorder} strokeWidth="1.5" />
        <g transform={`translate(${SRV_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="server" size={36} color={T.textSecondary} />
        </g>
        <text x={SRV_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">SERVER</text>
        {/* Server sees proxy IP */}
        {req2P > 0.7 && (
          <g opacity={(req2P - 0.7) / 0.3}>
            <rect x={SRV_X - 76} y={NODE_Y - NR - 54} width={152} height={36} rx="18"
              fill={T.bgDeep} stroke={anonColor} strokeWidth="1" />
            <text x={SRV_X} y={NODE_Y - NR - 30} textAnchor="middle"
              fill={anonColor} fontFamily={T.mono} fontSize="12">IP: 203.x.x.x</text>
          </g>
        )}
      </g>

      {/* IP strip animation */}
      {stripP > 0 && stripP < 1 && (
        <g opacity={stripP}>
          <rect x={PRX_X - 100} y={NODE_Y - 170} width={200} height={58} rx="12"
            fill={T.bgDeep} stroke={anonColor} strokeWidth="1.5" />
          <text x={PRX_X} y={NODE_Y - 148} textAnchor="middle"
            fill={anonColor} fontFamily={T.mono} fontSize="13" fontWeight="700">STRIPPING IP</text>
          <text x={PRX_X} y={NODE_Y - 128} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="12">10.0.0.5 → hidden</text>
        </g>
      )}

      {/* Anonymous label */}
      {stripP >= 0.5 && (
        <g opacity={Math.min((stripP - 0.5) * 2, 1)}>
          <rect x={PRX_X - 140} y={560} width={280} height={44} rx="22"
            fill={anonColor} opacity="0.12" />
          <text x={PRX_X} y={588} textAnchor="middle"
            fill={anonColor} fontFamily={T.sans} fontSize="20" fontWeight="700" letterSpacing="1">
            CLIENT IDENTITY HIDDEN
          </text>
        </g>
      )}

      {/* Blocked request demonstration */}
      {blockA > 0 && (
        <g opacity={blockA}>
          {/* Dashed blocked path */}
          <line x1={PRX_X + NR} y1={NODE_Y + 100} x2={SRV_X - NR} y2={NODE_Y + 100}
            stroke={filterColor} strokeWidth="1.5" strokeDasharray="8 4" />
          {/* X mark */}
          <circle cx={(PRX_X + SRV_X) / 2} cy={NODE_Y + 100} r="22"
            fill={T.bgDeep} stroke={filterColor} strokeWidth="2" />
          <line x1={(PRX_X + SRV_X) / 2 - 10} y1={NODE_Y + 90}
            x2={(PRX_X + SRV_X) / 2 + 10} y2={NODE_Y + 110}
            stroke={filterColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1={(PRX_X + SRV_X) / 2 + 10} y1={NODE_Y + 90}
            x2={(PRX_X + SRV_X) / 2 - 10} y2={NODE_Y + 110}
            stroke={filterColor} strokeWidth="2.5" strokeLinecap="round" />
          <text x={(PRX_X + SRV_X) / 2} y={NODE_Y + 140} textAnchor="middle"
            fill={filterColor} fontFamily={T.sans} fontSize="13" fontWeight="700">BLOCKED URL</text>
        </g>
      )}

      {/* Packets */}
      {req1P > 0 && req1P < 1 && (() => {
        const fx = (CL_X + NR) + (PRX_X - NR - CL_X - NR) * req1P;
        return <circle cx={fx} cy={NODE_Y} r="8" fill={T.cyan} filter="url(#prx-glow-sm)" />;
      })()}
      {req2P > 0 && req2P < 1 && (() => {
        const fx = (PRX_X + NR) + (SRV_X - NR - PRX_X - NR) * req2P;
        return <circle cx={fx} cy={NODE_Y} r="8" fill={proxyColor} filter="url(#prx-glow-sm)" />;
      })()}
      {resp1P > 0 && resp1P < 1 && (() => {
        const fx = (SRV_X - NR) + (PRX_X + NR - SRV_X + NR) * resp1P;
        return <circle cx={fx} cy={NODE_Y} r="8" fill={T.mint} filter="url(#prx-glow-sm)" />;
      })()}
      {resp2P > 0 && resp2P < 1 && (() => {
        const fx = (PRX_X - NR) + (CL_X + NR - PRX_X + NR) * resp2P;
        return <circle cx={fx} cy={NODE_Y} r="8" fill={T.mint} filter="url(#prx-glow-sm)" />;
      })()}
    </svg>
  );
};
