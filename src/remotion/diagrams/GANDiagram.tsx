import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";
import { NodeIcon } from "../components/NodeIcon";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;
const BOX_W = 190, BOX_H = 130, BOX_RX = 14;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const GEN_X = 120, GEN_Y = 300;  // Generator box top-left
const DISC_X = 770, DISC_Y = 300; // Discriminator box top-left
const GEN_CX = GEN_X + BOX_W / 2;
const DISC_CX = DISC_X + BOX_W / 2;
const CENTER_X = W / 2;
const CENTER_Y = 300 + BOX_H / 2;

// Sample rectangles from Generator
const FAKE_SAMPLES = [
  { x: CENTER_X - 56, y: 230, w: 48, h: 36 },
  { x: CENTER_X - 24, y: 270, w: 48, h: 36 },
  { x: CENTER_X + 8,  y: 230, w: 48, h: 36 },
];

// Real samples from above
const REAL_SAMPLES = [
  { x: CENTER_X - 40, y: 110, w: 48, h: 36 },
  { x: CENTER_X + 10, y: 100, w: 48, h: 36 },
];

export const GANDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const boxesIn     = p(frame, duration, 0.00, 0.18);
  const fakeProdP   = p(frame, duration, 0.18, 0.38);
  const realDropP   = p(frame, duration, 0.38, 0.52);
  const flowDiscP   = p(frame, duration, 0.52, 0.66);
  const discOutP    = p(frame, duration, 0.66, 0.78);
  const lossBackP   = p(frame, duration, 0.78, 0.90);
  const improveP    = p(frame, duration, 0.90, 1.00);

  const hiGen   = hi("GENERATOR");
  const hiDisc  = hi("DISCRIMINATOR");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="gan-glow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="gan-glow-sm">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="gan-arrow-coral" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.coral} />
        </marker>
        <marker id="gan-arrow-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
        <marker id="gan-arrow-dim" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
      </defs>

      {/* ── Generator box ── */}
      <g opacity={boxesIn}>
        <rect x={GEN_X} y={GEN_Y} width={BOX_W} height={BOX_H} rx={BOX_RX}
          fill={T.bgDeep}
          stroke={hiGen ? T.violet : T.violet}
          strokeWidth={hiGen ? 3 : 2}
          filter={hiGen ? "url(#gan-glow)" : undefined}
        />
        <g transform={`translate(${GEN_CX - 14}, ${GEN_Y + 22})`}>
          <NodeIcon type="router" size={28} color={T.violet} />
        </g>
        <text x={GEN_CX} y={GEN_Y + 80} textAnchor="middle"
          fill={T.violet} fontFamily={T.mono} fontSize="14" fontWeight="800" letterSpacing="1">
          GENERATOR G
        </text>
        {/* Noise input label */}
        <text x={GEN_CX} y={GEN_Y - 18} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11">z ~ N(0,1)</text>
        <line x1={GEN_CX} y1={GEN_Y - 12} x2={GEN_CX} y2={GEN_Y}
          stroke={T.textDim} strokeWidth="1.5"
          markerEnd="url(#gan-arrow-dim)"
        />
      </g>

      {/* ── Discriminator box ── */}
      <g opacity={boxesIn}>
        <rect x={DISC_X} y={DISC_Y} width={BOX_W} height={BOX_H} rx={BOX_RX}
          fill={T.bgDeep}
          stroke={hiDisc ? T.cyan : T.cyan}
          strokeWidth={hiDisc ? 3 : 2}
          filter={hiDisc ? "url(#gan-glow)" : undefined}
        />
        <g transform={`translate(${DISC_CX - 14}, ${DISC_Y + 22})`}>
          <NodeIcon type="shield" size={28} color={T.cyan} />
        </g>
        <text x={DISC_CX} y={DISC_Y + 80} textAnchor="middle"
          fill={T.cyan} fontFamily={T.mono} fontSize="13" fontWeight="800" letterSpacing="1">
          DISCRIMINATOR D
        </text>
      </g>

      {/* ── Fake samples generated ── */}
      {fakeProdP > 0 && FAKE_SAMPLES.map((s, i) => {
        // Samples fly from generator to center
        const startX = GEN_X + BOX_W;
        const startY = GEN_Y + BOX_H / 2;
        const sx = startX + (s.x - startX) * fakeProdP;
        const sy = startY + (s.y - startY) * fakeProdP;
        const sampleColors = [T.violet, T.amber, T.cyan];
        return (
          <rect key={`fake-${i}`} x={sx} y={sy} width={s.w} height={s.h} rx="5"
            fill={sampleColors[i]} opacity={fakeProdP * 0.55}
          />
        );
      })}
      {fakeProdP > 0.6 && (
        <text x={CENTER_X - 10} y={330} textAnchor="middle"
          fill={T.textDim} fontFamily={T.mono} fontSize="11"
          opacity={(fakeProdP - 0.6) / 0.4}>FAKE</text>
      )}

      {/* ── Real samples drop from top ── */}
      {realDropP > 0 && REAL_SAMPLES.map((s, i) => {
        const startY = -40;
        const sy = startY + (s.y - startY) * realDropP;
        return (
          <rect key={`real-${i}`} x={s.x} y={sy} width={s.w} height={s.h} rx="5"
            fill={T.mint} opacity={realDropP * 0.55}
          />
        );
      })}
      {realDropP > 0.6 && (
        <text x={CENTER_X + 10} y={94} textAnchor="middle"
          fill={T.mint} fontFamily={T.mono} fontSize="11"
          opacity={(realDropP - 0.6) / 0.4}>REAL DATA</text>
      )}

      {/* ── Flow into Discriminator ── */}
      {flowDiscP > 0 && (
        <g opacity={Math.min(flowDiscP * 2, 1)}>
          {/* Fake → Disc */}
          <line x1={CENTER_X + 52} y1={CENTER_Y} x2={DISC_X - 4} y2={DISC_Y + BOX_H / 2}
            stroke={T.coral} strokeWidth="2" strokeDasharray="6 3"
            markerEnd="url(#gan-arrow-coral)"
          />
          {/* Real → Disc */}
          <line x1={CENTER_X + 52} y1={150} x2={DISC_X - 4} y2={DISC_Y + BOX_H / 2}
            stroke={T.mint} strokeWidth="2" strokeDasharray="6 3"
            markerEnd="url(#gan-arrow-mint)"
          />
        </g>
      )}

      {/* ── Discriminator output ── */}
      {discOutP > 0 && (
        <g opacity={discOutP}>
          {/* FAKE verdict */}
          <rect x={DISC_X + BOX_W + 20} y={DISC_Y + 10} width={90} height={32} rx="16"
            fill={T.coral} opacity={0.2} />
          <text x={DISC_X + BOX_W + 65} y={DISC_Y + 31} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="14" fontWeight="800">FAKE</text>

          {/* REAL verdict */}
          <rect x={DISC_X + BOX_W + 20} y={DISC_Y + 54} width={90} height={32} rx="16"
            fill={T.mint} opacity={0.2} />
          <text x={DISC_X + BOX_W + 65} y={DISC_Y + 75} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="14" fontWeight="800">REAL</text>
        </g>
      )}

      {/* ── Loss signal back to Generator ── */}
      {lossBackP > 0 && (
        <g opacity={lossBackP}>
          <path d={`M${DISC_CX} ${DISC_Y + BOX_H} Q${DISC_CX} 570 ${GEN_CX} 570 L${GEN_CX} ${GEN_Y + BOX_H}`}
            fill="none" stroke={T.coral} strokeWidth="2.5" strokeDasharray="6 4"
            markerEnd="url(#gan-arrow-coral)"
          />
          <text x={W / 2} y={600} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="13">
            ← loss gradient
          </text>
        </g>
      )}

      {/* ── G improves ── */}
      {improveP > 0 && (
        <g opacity={improveP}>
          <rect x={GEN_X - 10} y={GEN_Y - 62} width={BOX_W + 20} height={36} rx="18"
            fill={T.mint} opacity={0.15}
            filter="url(#gan-glow-sm)"
          />
          <text x={GEN_CX} y={GEN_Y - 38} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
            G improves ↑
          </text>
        </g>
      )}
    </svg>
  );
};
