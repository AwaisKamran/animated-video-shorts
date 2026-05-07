import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const ALICE_X = 180, BOB_X = 900, NODE_Y = 320, NR = 70;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const GOLD   = T.amber;
const PRIV   = T.violet;

export const PubKeyDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const nodesIn   = p(frame, duration, 0.00, 0.18);
  const pubKeyP   = p(frame, duration, 0.18, 0.40);   // pub key travels to Alice
  const encryptP  = p(frame, duration, 0.40, 0.56);   // Alice encrypts
  const msgTravP  = p(frame, duration, 0.56, 0.74);   // enc msg to Bob
  const decryptP  = p(frame, duration, 0.74, 0.88);   // Bob decrypts
  const doneAlpha = p(frame, duration, 0.88, 1.00);

  // Public key icon floats from Bob to Alice
  const pubKeyX = BOB_X - 50 + (ALICE_X + 60 - BOB_X + 50) * pubKeyP;
  const pubKeyY = NODE_Y - 90;

  // Message block between them
  const midX = (ALICE_X + BOB_X) / 2;
  const encColor = encryptP > 0.5 ? GOLD : T.cyan;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="pk-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pk-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Connection line */}
      <line x1={ALICE_X + NR} y1={NODE_Y} x2={BOB_X - NR} y2={NODE_Y}
        stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4" opacity={nodesIn} />

      {/* Alice */}
      <g opacity={nodesIn}>
        <circle cx={ALICE_X} cy={NODE_Y} r={NR}
          fill={T.nodeFill}
          stroke={encryptP > 0.3 ? GOLD : T.nodeBorder}
          strokeWidth={encryptP > 0.3 ? "2.5" : "1.5"}
          filter={encryptP > 0.5 ? "url(#pk-glow)" : undefined}
        />
        <g transform={`translate(${ALICE_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="laptop" size={36} color={T.textSecondary} />
        </g>
        <text x={ALICE_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="20" fontWeight="600" letterSpacing="2">ALICE</text>
      </g>

      {/* Bob */}
      <g opacity={nodesIn}>
        <circle cx={BOB_X} cy={NODE_Y} r={NR}
          fill={T.nodeFill}
          stroke={decryptP > 0.3 ? PRIV : T.nodeBorder}
          strokeWidth={decryptP > 0.3 ? "2.5" : "1.5"}
          filter={decryptP > 0.5 ? "url(#pk-glow)" : undefined}
        />
        <g transform={`translate(${BOB_X - 18}, ${NODE_Y - 20})`}>
          <NodeIcon type="laptop" size={36} color={T.textSecondary} />
        </g>
        <text x={BOB_X} y={NODE_Y + NR + 28} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.sans} fontSize="20" fontWeight="600" letterSpacing="2">BOB</text>
      </g>

      {/* Bob's PUBLIC key badge */}
      <g opacity={nodesIn}>
        <rect x={BOB_X - 82} y={NODE_Y - NR - 78} width={164} height={52} rx="10"
          fill={T.bgDeep} stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.8" />
        <g transform={`translate(${BOB_X - 70}, ${NODE_Y - NR - 68})`}>
          <NodeIcon type="key" size={24} color={GOLD} />
        </g>
        <text x={BOB_X + 8} y={NODE_Y - NR - 50} textAnchor="middle"
          fill={GOLD} fontFamily={T.mono} fontSize="13" fontWeight="700">PUBLIC KEY</text>
        <text x={BOB_X + 8} y={NODE_Y - NR - 34} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11">shared with all</text>
      </g>

      {/* Bob's PRIVATE key badge */}
      <g opacity={nodesIn}>
        <rect x={BOB_X - 82} y={NODE_Y + NR + 62} width={164} height={52} rx="10"
          fill={T.bgDeep} stroke={PRIV} strokeWidth="1.5" strokeOpacity="0.5"
          filter={hi("PRIVATE KEY") ? "url(#pk-glow)" : undefined}
        />
        <g transform={`translate(${BOB_X - 70}, ${NODE_Y + NR + 72})`}>
          <NodeIcon type="key" size={24} color={PRIV} />
        </g>
        <text x={BOB_X + 8} y={NODE_Y + NR + 90} textAnchor="middle"
          fill={PRIV} fontFamily={T.mono} fontSize="13" fontWeight="700">PRIVATE KEY</text>
        <text x={BOB_X + 8} y={NODE_Y + NR + 106} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11">kept secret</text>
      </g>

      {/* Floating public key traveling to Alice */}
      {pubKeyP > 0 && pubKeyP < 1 && (
        <g transform={`translate(${pubKeyX - 14}, ${pubKeyY - 14})`} filter="url(#pk-glow-sm)">
          <NodeIcon type="key" size={28} color={GOLD} />
        </g>
      )}

      {/* Alice received public key label */}
      {pubKeyP >= 1 && (
        <g opacity={Math.min((pubKeyP - 1) * 10 + 1, 1)}>
          <rect x={ALICE_X - 82} y={NODE_Y - NR - 78} width={164} height={52} rx="10"
            fill={T.bgDeep} stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.8" />
          <g transform={`translate(${ALICE_X - 70}, ${NODE_Y - NR - 68})`}>
            <NodeIcon type="key" size={24} color={GOLD} />
          </g>
          <text x={ALICE_X + 8} y={NODE_Y - NR - 50} textAnchor="middle"
            fill={GOLD} fontFamily={T.mono} fontSize="13" fontWeight="700">BOB&apos;S PUB KEY</text>
          <text x={ALICE_X + 8} y={NODE_Y - NR - 34} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">received</text>
        </g>
      )}

      {/* Encrypted message traveling */}
      {msgTravP > 0 && msgTravP < 1 && (() => {
        const fx = (ALICE_X + NR) + (BOB_X - NR - ALICE_X - NR) * msgTravP;
        return (
          <g transform={`translate(${fx - 36}, ${NODE_Y - 18})`} filter="url(#pk-glow-sm)">
            <rect x="0" y="0" width="72" height="36" rx="10"
              fill={T.bgDeep} stroke={GOLD} strokeWidth="2" />
            <text x="36" y="23" textAnchor="middle"
              fill={GOLD} fontFamily={T.mono} fontSize="18" fontWeight="700">████</text>
          </g>
        );
      })()}

      {/* Encrypt label */}
      {encryptP > 0 && encryptP < 1 && (
        <g opacity={encryptP}>
          <rect x={ALICE_X + NR + 10} y={NODE_Y - 22} width={130} height={44} rx="22"
            fill={T.bgDeep} stroke={GOLD} strokeWidth="1.5" />
          <text x={ALICE_X + NR + 75} y={NODE_Y + 5} textAnchor="middle"
            fill={GOLD} fontFamily={T.sans} fontSize="16" fontWeight="700">ENCRYPTING</text>
        </g>
      )}

      {/* Decrypt label */}
      {decryptP > 0 && decryptP < 1 && (
        <g opacity={decryptP}>
          <rect x={BOB_X - NR - 140} y={NODE_Y - 22} width={130} height={44} rx="22"
            fill={T.bgDeep} stroke={PRIV} strokeWidth="1.5" />
          <text x={BOB_X - NR - 75} y={NODE_Y + 5} textAnchor="middle"
            fill={PRIV} fontFamily={T.sans} fontSize="16" fontWeight="700">DECRYPTING</text>
        </g>
      )}

      {/* Done */}
      {doneAlpha > 0 && (
        <g opacity={doneAlpha}>
          <rect x={midX - 200} y={520} width={400} height={48} rx="24"
            fill={T.mint} opacity="0.12" />
          <text x={midX} y={552} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="22" fontWeight="700" letterSpacing="1">
            ONLY BOB CAN READ THIS
          </text>
        </g>
      )}
    </svg>
  );
};
