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

// Network: 3 layers — input (3), hidden (5), output (2)
const LAYERS = [3, 5, 2];
const R = 20;
const CY = 330;
const LAYER_X = [120, 340, 560];

// Dropped neurons in hidden layer (indices 1, 3 = drop; others active)
const DROPPED_HIDDEN = [1, 3];
const DROPPED_HIDDEN_2 = [0, 4]; // second pattern for cycle

function getNY(n: number, i: number) {
  const spacing = 90;
  const total = (n - 1) * spacing;
  return CY - total / 2 + i * spacing;
}

function getDropped(cycle: number) {
  return cycle < 1 ? DROPPED_HIDDEN : DROPPED_HIDDEN_2;
}

// Offset for the two side-by-side networks
const NET_OFFSETS = [0, 490];
const NET_LABELS = ["WITHOUT DROPOUT", "WITH DROPOUT (50%)"];

export const DropoutDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const netsIn    = p(frame, duration, 0.00, 0.25);
  const dropIn    = p(frame, duration, 0.25, 0.55);
  const passIn    = p(frame, duration, 0.55, 0.75);
  const cycleIn   = p(frame, duration, 0.75, 0.90);
  const badgeIn   = p(frame, duration, 0.90, 1.00);

  const hiDropout = hi("DROPOUT");
  const hiReg     = hi("REGULARIZATION");

  const dropCycle = Math.floor(cycleIn * 2);
  const droppedSet = getDropped(dropCycle);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="do-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {NET_OFFSETS.map((ox, netIdx) => {
        const isDropNet = netIdx === 1;
        const dropped = isDropNet ? droppedSet : [];

        return (
          <g key={netIdx} opacity={netsIn}>
            {/* Network label */}
            <text x={ox + LAYER_X[1]} y={60} textAnchor="middle"
              fill={isDropNet ? (hiDropout ? T.amber : T.textSecondary) : T.textSecondary}
              fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="1.2"
              filter={isDropNet && hiDropout ? "url(#do-glow)" : undefined}>
              {NET_LABELS[netIdx]}
            </text>

            {/* Connections */}
            {LAYERS.slice(0, -1).map((nA, li) => {
              const nB = LAYERS[li + 1];
              return Array.from({ length: nA }).map((_, ai) => {
                const isADropped = li === 1 && isDropNet && dropped.includes(ai);
                return Array.from({ length: nB }).map((_, bi) => {
                  const isBDropped = li === 0 && isDropNet && dropped.includes(bi);
                  const isDimmed = isADropped || isBDropped;
                  return (
                    <line key={`${li}-${ai}-${bi}`}
                      x1={ox + LAYER_X[li] + R} y1={getNY(nA, ai)}
                      x2={ox + LAYER_X[li + 1] - R} y2={getNY(nB, bi)}
                      stroke={T.border}
                      strokeWidth={isDimmed ? 0.5 : 1}
                      strokeOpacity={isDimmed ? 0.12 : 0.3}
                    />
                  );
                });
              });
            })}

            {/* Neurons */}
            {LAYERS.map((n, li) => (
              Array.from({ length: n }).map((_, ni) => {
                const isHidden = li === 1;
                const isDropped = isHidden && isDropNet && dropped.includes(ni);
                const cy = getNY(n, ni);

                // Forward pass wave
                const layerFrac = li / (LAYERS.length - 1);
                const waveA = p(frame, duration, 0.55 + layerFrac * 0.12, 0.55 + layerFrac * 0.12 + 0.10);
                const isActive = waveA > 0.4 && !isDropped;

                return (
                  <g key={`${li}-${ni}`}>
                    <circle cx={ox + LAYER_X[li]} cy={cy} r={R}
                      fill={isDropped ? T.bgDeep : isActive && passIn > 0 ? T.cyan : T.nodeFill}
                      fillOpacity={isDropped ? 0.5 : isActive && passIn > 0 ? 0.25 : 1}
                      stroke={isDropped ? T.coral : isActive && passIn > 0 ? T.cyan : T.nodeBorder}
                      strokeWidth={isDropped || (isActive && passIn > 0) ? 2 : 1.5}
                      strokeOpacity={isDropped ? 0.5 : 1}
                      filter={isActive && passIn > 0 ? "url(#do-glow)" : undefined}
                    />
                    {/* X mark for dropped */}
                    {isDropped && dropIn > 0.5 && (
                      <g opacity={Math.min(1, (dropIn - 0.5) * 2)}
                        filter={hiDropout ? "url(#do-glow)" : undefined}>
                        <line x1={ox + LAYER_X[li] - 10} y1={cy - 10}
                              x2={ox + LAYER_X[li] + 10} y2={cy + 10}
                          stroke={hiDropout ? T.coral : T.coral} strokeWidth={hiDropout ? 2.5 : 2} />
                        <line x1={ox + LAYER_X[li] + 10} y1={cy - 10}
                              x2={ox + LAYER_X[li] - 10} y2={cy + 10}
                          stroke={hiDropout ? T.coral : T.coral} strokeWidth={hiDropout ? 2.5 : 2} />
                      </g>
                    )}
                  </g>
                );
              })
            ))}
          </g>
        );
      })}

      {/* Badge */}
      {badgeIn > 0 && (
        <g opacity={badgeIn}>
          <rect x={W / 2 - 150} y={580} width={300} height={52} rx="26"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2"
            filter={hiReg ? "url(#do-glow)" : undefined}
          />
          <text x={W / 2} y={611} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1">
            Prevents Overfitting
          </text>
        </g>
      )}
    </svg>
  );
};
