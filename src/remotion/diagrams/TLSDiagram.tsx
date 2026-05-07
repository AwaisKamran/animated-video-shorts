import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const CL_X = 160, SV_X = 920, NR = 68;
const NODE_Y = 340;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 90);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

interface StepArrowProps {
  progress: number; x1: number; x2: number; y: number;
  color: string; label: string; sublabel: string; dir: "ltr" | "rtl";
}

function StepArrow({ progress, x1, x2, y, color, label, sublabel, dir }: StepArrowProps) {
  if (progress <= 0) return null;
  const fromX = dir === "ltr" ? x1 + NR : x2 - NR;
  const toX   = dir === "ltr" ? x2 - NR : x1 + NR;
  const dot   = fromX + (toX - fromX) * Math.min(progress, 1);
  const l1    = dir === "ltr" ? fromX : dot;
  const l2    = dir === "ltr" ? dot    : fromX;
  const tipX  = dot;
  const bX    = dir === "ltr" ? dot - 12 : dot + 12;
  const mid   = (fromX + toX) / 2;
  return (
    <g>
      <line x1={l1} y1={y} x2={l2} y2={y} stroke={color} strokeWidth="2" />
      <polygon points={`${tipX},${y} ${bX},${y - 7} ${bX},${y + 7}`} fill={color} />
      <circle cx={dot} cy={y} r="6" fill={color} />
      <rect x={mid - 120} y={y - 38} width="240" height="27" rx="13.5" fill={T.bgDeep} />
      <text x={mid} y={y - 18} textAnchor="middle"
        fill={color} fontFamily={T.mono} fontSize="16" fontWeight="700">{label}</text>
      {progress > 0.6 && (
        <text x={mid} y={y + 22} textAnchor="middle"
          fill={color} fontFamily={T.sans} fontSize="12" opacity={(progress - 0.6) / 0.4}>{sublabel}</text>
      )}
    </g>
  );
}

export const TLSDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn  = p(frame, duration, 0.00, 0.14);
  const step1P   = p(frame, duration, 0.14, 0.42);
  const step2P   = p(frame, duration, 0.44, 0.65);
  const step3P   = p(frame, duration, 0.67, 0.85);
  const keysP    = p(frame, duration, 0.86, 0.94);
  const dataP    = p(frame, duration, 0.95, 1.00);
  const secureA  = p(frame, duration, 0.95, 1.00);

  const sharedColor = T.mint;
  const tlsColor    = hi("TLS") ? T.cyan : T.cyan;
  const certColor   = hi("CERTIFICATE") ? T.amber : T.amber;
  const cipherColor = hi("CIPHER")      ? T.violet : T.violet;

  const STEP_YS = [NODE_Y - 150, NODE_Y - 55, NODE_Y + 40, NODE_Y + 135];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="tls-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tls-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Timelines */}
      <g opacity={nodesIn}>
        <line x1={CL_X} y1={NODE_Y + NR} x2={CL_X} y2={590}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
        <line x1={SV_X} y1={NODE_Y + NR} x2={SV_X} y2={590}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" />
      </g>

      {/* Client */}
      <g opacity={nodesIn}>
        <circle cx={CL_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={keysP > 0.5 ? sharedColor : (tlsColor && step1P > 0.5 ? tlsColor : T.nodeBorder)}
          strokeWidth={keysP > 0.5 ? "3" : "1.5"}
          filter={keysP > 0.5 ? "url(#tls-glow)" : undefined}
        />
        <g transform={`translate(${CL_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="browser" size={36} color={keysP > 0.5 ? sharedColor : T.textSecondary} />
        </g>
        <text x={CL_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">CLIENT</text>
        {keysP > 0 && (
          <text x={CL_X} y={NODE_Y - NR - 14} textAnchor="middle"
            fill={sharedColor} fontFamily={T.mono} fontSize="13" fontWeight="700" opacity={keysP}>
            SESSION KEY
          </text>
        )}
      </g>

      {/* Server */}
      <g opacity={nodesIn}>
        <circle cx={SV_X} cy={NODE_Y} r={NR} fill={T.nodeFill}
          stroke={keysP > 0.5 ? sharedColor : T.nodeBorder}
          strokeWidth={keysP > 0.5 ? "3" : "1.5"}
          filter={keysP > 0.5 ? "url(#tls-glow)" : undefined}
        />
        <g transform={`translate(${SV_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="server" size={36} color={keysP > 0.5 ? sharedColor : T.textSecondary} />
        </g>
        <text x={SV_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="19" fontWeight="500" letterSpacing="2">SERVER</text>
        {keysP > 0 && (
          <text x={SV_X} y={NODE_Y - NR - 14} textAnchor="middle"
            fill={sharedColor} fontFamily={T.mono} fontSize="13" fontWeight="700" opacity={keysP}>
            SESSION KEY
          </text>
        )}
      </g>

      {/* Step 1: ClientHello */}
      <StepArrow progress={step1P}
        x1={CL_X} x2={SV_X} y={STEP_YS[0]}
        color={tlsColor} label="ClientHello →" sublabel="Supported ciphers" dir="ltr" />

      {/* Step 2: ServerHello + Cert */}
      <StepArrow progress={step2P}
        x1={CL_X} x2={SV_X} y={STEP_YS[1]}
        color={certColor} label="← ServerHello + Cert" sublabel="Here's my certificate" dir="rtl" />

      {/* Step 3: Key Exchange */}
      <StepArrow progress={step3P}
        x1={CL_X} x2={SV_X} y={STEP_YS[2]}
        color={cipherColor} label="Key Exchange →" sublabel="Pre-master secret (encrypted)" dir="ltr" />

      {/* Step 4: Finished */}
      {keysP > 0 && (
        <g opacity={keysP}>
          <rect x={(CL_X + SV_X) / 2 - 160} y={STEP_YS[3] - 20} width={320} height={40} rx="20"
            fill={sharedColor} opacity="0.12" />
          <text x={(CL_X + SV_X) / 2} y={STEP_YS[3] + 5} textAnchor="middle"
            fill={sharedColor} fontFamily={T.sans} fontSize="16" fontWeight="700" letterSpacing="1">
            SESSION KEYS ESTABLISHED
          </text>
        </g>
      )}

      {/* Step 5: Secure data flow packets */}
      {dataP > 0 && [0, 0.33, 0.66].map((offset, i) => {
        const prog = Math.max(0, Math.min(1, (dataP - offset) * 2));
        if (prog <= 0 || prog >= 1) return null;
        const fx = (CL_X + NR) + (SV_X - NR - CL_X - NR) * prog;
        return (
          <g key={i} transform={`translate(${fx - 18}, ${NODE_Y + NR + 50 - i * 8})`}
            filter="url(#tls-glow-sm)">
            <rect x="0" y="0" width="36" height="22" rx="6"
              fill={T.bgDeep} stroke={sharedColor} strokeWidth="1.5" />
            <g transform="translate(12, 3)">
              <NodeIcon type="lock" size={14} color={sharedColor} />
            </g>
          </g>
        );
      })}

      {/* TLS label */}
      {secureA > 0 && (
        <g opacity={secureA}>
          <rect x={(CL_X + SV_X) / 2 - 100} y={590} width={200} height={48} rx="24"
            fill={sharedColor} opacity="0.12" />
          <text x={(CL_X + SV_X) / 2} y={622} textAnchor="middle"
            fill={sharedColor} fontFamily={T.sans} fontSize="22" fontWeight="700" letterSpacing="1">
            TLS SECURED
          </text>
        </g>
      )}
    </svg>
  );
};
