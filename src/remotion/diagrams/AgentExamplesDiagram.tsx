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

const CARD_W = 380, CARD_H = 230;
const COL1_X = 80, COL2_X = 600;
const ROW1_Y = 90, ROW2_Y = 380;

const CARDS = [
  {
    id: "claude-code", name: "Claude Code", tagline: "writes & edits code",
    color: T.violet, x: COL1_X, y: ROW1_Y, category: "CODING",
    icon: ["▉▉▉", "▉  ▉", "▉▉▉"],
  },
  {
    id: "cursor", name: "Cursor", tagline: "AI pair programmer",
    color: T.cyan, x: COL2_X, y: ROW1_Y, category: "CODING",
    icon: ["┌──┐", "│ > │", "└──┘"],
  },
  {
    id: "autogpt", name: "AutoGPT", tagline: "browses & automates web",
    color: T.amber, x: COL1_X, y: ROW2_Y, category: "BROWSING",
    icon: ["⬡⬡⬡", "⬡ ⬡", "⬡⬡⬡"],
  },
  {
    id: "devin", name: "Devin", tagline: "ships PRs end-to-end",
    color: T.mint, x: COL2_X, y: ROW2_Y, category: "RESEARCH",
    icon: ["⚙ ⚙", " ⚙ ", "⚙ ⚙"],
  },
];

export const AgentExamplesDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const card0In   = p(frame, duration, 0.00, 0.20);
  const card1In   = p(frame, duration, 0.18, 0.38);
  const card2In   = p(frame, duration, 0.36, 0.56);
  const card3In   = p(frame, duration, 0.54, 0.74);
  const labelsIn  = p(frame, duration, 0.74, 1.00);

  const cardProgress = [card0In, card1In, card2In, card3In];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="aex-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="aex-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {CARDS.map((card, i) => {
        const cp = cardProgress[i];
        if (cp <= 0) return null;
        const isHi = hi(card.category);
        return (
          <g key={card.id} opacity={cp}>
            {/* Card background */}
            <rect x={card.x} y={card.y} width={CARD_W} height={CARD_H} rx="20"
              fill={card.color} fillOpacity={isHi ? 0.18 : 0.09}
              stroke={card.color} strokeWidth={isHi ? 2.5 : 1.5}
              filter={isHi ? "url(#aex-glow)" : undefined}
            />

            {/* App name */}
            <text x={card.x + CARD_W / 2} y={card.y + 44} textAnchor="middle"
              fill={card.color} fontFamily={T.sans} fontSize="22" fontWeight="800" letterSpacing="1">
              {card.name}
            </text>

            {/* Icon visualization — big letter/glyph */}
            <text x={card.x + CARD_W / 2} y={card.y + 130} textAnchor="middle"
              fill={card.color} fontFamily={T.mono} fontSize="48" fontWeight="700"
              opacity="0.4">
              {card.id === "claude-code" ? "</>" :
               card.id === "cursor" ? "⌨" :
               card.id === "autogpt" ? "⊕" : "⚙"}
            </text>

            {/* Tagline */}
            <text x={card.x + CARD_W / 2} y={card.y + 175} textAnchor="middle"
              fill={card.color} fontFamily={T.mono} fontSize="12"
              opacity={Math.min(1, cp * 2)}>
              {card.tagline}
            </text>

            {/* Category badge */}
            <rect x={card.x + CARD_W - 110} y={card.y + 14} width={96} height={24} rx="12"
              fill={card.color} fillOpacity={0.2} stroke={card.color} strokeWidth="1"
            />
            <text x={card.x + CARD_W - 62} y={card.y + 30} textAnchor="middle"
              fill={card.color} fontFamily={T.sans} fontSize="9" fontWeight="700" letterSpacing="1.5">
              {card.category}
            </text>
          </g>
        );
      })}

      {/* Animated pulse on highlighted cards */}
      {CARDS.map((card, i) => {
        const cp = cardProgress[i];
        if (cp <= 0 || !hi(card.category)) return null;
        const pulse = 0.5 + 0.5 * Math.sin((frame / 8));
        return (
          <rect key={`pulse-${card.id}`}
            x={card.x - 3} y={card.y - 3} width={CARD_W + 6} height={CARD_H + 6} rx="22"
            fill="none" stroke={card.color} strokeWidth="2"
            opacity={pulse * 0.5 * cp}
            filter="url(#aex-glow)"
          />
        );
      })}

      {/* Trait labels */}
      {labelsIn > 0 && (
        <g opacity={labelsIn}>
          {CARDS.map((card) => (
            <text key={`label-${card.id}`}
              x={card.x + CARD_W / 2} y={card.y + CARD_H + 28} textAnchor="middle"
              fill={card.color} fontFamily={T.sans} fontSize="10" letterSpacing="2" fontWeight="700"
              opacity="0.7">
              {card.id === "claude-code" ? "ANTHROPIC" :
               card.id === "cursor" ? "CURSOR AI" :
               card.id === "autogpt" ? "OPEN SOURCE" : "COGNITION AI"}
            </text>
          ))}
        </g>
      )}

    </svg>
  );
};
