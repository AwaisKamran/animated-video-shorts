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

const LAYERS = [
  {
    id: "short",   label: "SHORT-TERM",   sublabel: "Context Window",
    color: T.cyan,   capacity: "8K tokens",   y: 80,  h: 130,
    bubbles: ["User: How do I...?", "AI: You should...", "User: Thanks!", "AI: Of course!"],
  },
  {
    id: "working", label: "WORKING MEMORY", sublabel: "Session",
    color: T.violet, capacity: "Persistent", y: 250, h: 130,
    bubbles: ["Summary: User asked X", "Key: Prefers Python"],
  },
  {
    id: "long",    label: "LONG-TERM",    sublabel: "Vector DB",
    color: T.mint,   capacity: "Unlimited", y: 420, h: 130,
    bubbles: ["Doc: API Guide", "Doc: FAQ 2023", "Doc: Changelog"],
  },
];

export const MemoryHierarchyDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const layersIn    = p(frame, duration, 0.00, 0.25);
  const msgsIn      = p(frame, duration, 0.25, 0.55);
  const distillP    = p(frame, duration, 0.55, 0.75);
  const recallP     = p(frame, duration, 0.75, 1.00);

  const hiShort  = hi("SHORT-TERM");
  const hiLong   = hi("LONG-TERM");
  const hiRecall = hi("RECALL");

  const LAYER_X = 100, LAYER_W = W - 200;
  const LABEL_X = 60;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="mh-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="mh-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="mh-arr-down" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="mh-arr-up" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* ── Layers ── */}
      {LAYERS.map((layer) => {
        const isShort  = layer.id === "short"   && hiShort;
        const isLong   = layer.id === "long"    && hiLong;
        const glowing  = isShort || isLong;
        return (
          <g key={layer.id} opacity={layersIn}>
            {/* Layer rect */}
            <rect x={LAYER_X} y={layer.y} width={LAYER_W} height={layer.h} rx="16"
              fill={layer.color} fillOpacity={glowing ? 0.18 : 0.10}
              stroke={layer.color} strokeWidth={glowing ? 2.5 : 1.5}
              filter={glowing ? "url(#mh-glow)" : undefined}
            />
            {/* Main label */}
            <text x={LAYER_X + 24} y={layer.y + 32} textAnchor="start"
              fill={layer.color} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1.5">
              {layer.label}
            </text>
            {/* Sublabel */}
            <text x={LAYER_X + 24} y={layer.y + 52} textAnchor="start"
              fill={layer.color} fontFamily={T.sans} fontSize="11" opacity={0.7}>
              ({layer.sublabel})
            </text>
            {/* Capacity badge */}
            <rect x={LAYER_X + LAYER_W - 150} y={layer.y + 18} width={130} height={30} rx="15"
              fill={layer.color} fillOpacity={0.2}
              stroke={layer.color} strokeWidth="1"
            />
            <text x={LAYER_X + LAYER_W - 85} y={layer.y + 38} textAnchor="middle"
              fill={layer.color} fontFamily={T.mono} fontSize="11" fontWeight="600">
              {layer.capacity}
            </text>
          </g>
        );
      })}

      {/* ── Messages in each layer ── */}
      {msgsIn > 0 && LAYERS.map((layer, li) => {
        const startX = LAYER_X + 28;
        return layer.bubbles.map((bubble, bi) => {
          const startT = 0.25 + (li * 0.06 + bi * 0.04);
          const endT   = Math.max(startT + 0.06, 0.45 + li * 0.04);
          const bubbleProgress = p(frame, duration, startT, endT);
          if (bubbleProgress <= 0) return null;
          return (
            <g key={`${li}-${bi}`} opacity={bubbleProgress}>
              <rect
                x={startX + bi * 170}
                y={layer.y + 68}
                width={160} height={38} rx="8"
                fill={layer.color} fillOpacity={0.12}
                stroke={layer.color} strokeWidth="1"
              />
              <text
                x={startX + bi * 170 + 12}
                y={layer.y + 92}
                fill={layer.color} fontFamily={T.mono} fontSize="10">
                {bubble}
              </text>
            </g>
          );
        });
      })}

      {/* ── Distillation arrows (down) ── */}
      {distillP > 0 && (
        <>
          {/* Short → Working */}
          <line x1={W / 2 - 60} y1={LAYERS[0].y + LAYERS[0].h}
            x2={W / 2 - 60} y2={LAYERS[1].y}
            stroke={T.textDim} strokeWidth="2"
            strokeDasharray="5 3"
            markerEnd="url(#mh-arr-down)"
            opacity={distillP}
          />
          <text x={W / 2 - 30} y={(LAYERS[0].y + LAYERS[0].h + LAYERS[1].y) / 2 + 5}
            fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="1"
            opacity={distillP}>
            compress
          </text>
          {/* Working → Long */}
          <line x1={W / 2 + 40} y1={LAYERS[1].y + LAYERS[1].h}
            x2={W / 2 + 40} y2={LAYERS[2].y}
            stroke={T.textDim} strokeWidth="2"
            strokeDasharray="5 3"
            markerEnd="url(#mh-arr-down)"
            opacity={distillP}
          />
          <text x={W / 2 + 70} y={(LAYERS[1].y + LAYERS[1].h + LAYERS[2].y) / 2 + 5}
            fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="1"
            opacity={distillP}>
            persist
          </text>
        </>
      )}

      {/* ── Recall arrow (up) ── */}
      {recallP > 0 && (
        <g opacity={recallP} filter={hiRecall ? "url(#mh-glow-sm)" : undefined}>
          <line x1={W / 2 + 120} y1={LAYERS[2].y}
            x2={W / 2 + 120} y2={LAYERS[0].y + LAYERS[0].h}
            stroke={T.mint} strokeWidth="2.5"
            markerEnd="url(#mh-arr-up)"
          />
          <rect x={W / 2 + 130} y={216} width={90} height={28} rx="14"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="1.5"
          />
          <text x={W / 2 + 175} y={235}
            textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="1">
            RECALL
          </text>
        </g>
      )}
    </svg>
  );
};
