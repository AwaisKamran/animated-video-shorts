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

// Panel layout
const PANEL_W = 290, PANEL_H = 480, PANEL_Y = 110;
const PANELS = [
  { id: "flat",  label: "FLAT",  color: T.cyan,   x: 50,  complexity: "O(N)",      desc: "Linear scan" },
  { id: "ivf",   label: "IVF",   color: T.amber,  x: 390, complexity: "O(√N)",     desc: "Inverted File Index" },
  { id: "hnsw",  label: "HNSW",  color: T.violet, x: 730, complexity: "O(log N)",  desc: "Hierarchical Graph" },
];

// FLAT: uniform list of vector dots
const FLAT_DOTS_Y = [148, 180, 212, 244, 276, 308, 340, 372, 404, 436, 468, 500];
const FLAT_DOT_X = 50 + PANEL_W / 2;

// IVF: 3 clusters with centroids
const IVF_CLUSTERS = [
  { cx: 435 + 60, cy: 200, members: [{ x: 435 + 40, y: 230 }, { x: 435 + 80, y: 225 }, { x: 435 + 55, y: 255 }] },
  { cx: 435 + 140, cy: 300, members: [{ x: 435 + 120, y: 330 }, { x: 435 + 160, y: 325 }, { x: 435 + 140, y: 355 }] },
  { cx: 435 + 80, cy: 420, members: [{ x: 435 + 60, y: 450 }, { x: 435 + 100, y: 445 }, { x: 435 + 75, y: 475 }] },
];

// HNSW: graph with hub nodes across 3 layers
const HNSW_X0 = 730;
const HNSW_NODES = [
  // Layer 2 (top, few hubs)
  { x: HNSW_X0 + 60, y: 160, layer: 2 },
  { x: HNSW_X0 + 200, y: 150, layer: 2 },
  // Layer 1 (mid)
  { x: HNSW_X0 + 40, y: 280, layer: 1 },
  { x: HNSW_X0 + 120, y: 260, layer: 1 },
  { x: HNSW_X0 + 230, y: 290, layer: 1 },
  // Layer 0 (bottom, many nodes)
  { x: HNSW_X0 + 30, y: 400, layer: 0 },
  { x: HNSW_X0 + 90, y: 390, layer: 0 },
  { x: HNSW_X0 + 155, y: 410, layer: 0 },
  { x: HNSW_X0 + 215, y: 395, layer: 0 },
  { x: HNSW_X0 + 265, y: 415, layer: 0 },
];

// HNSW edges
const HNSW_EDGES = [
  [0, 1], [0, 2], [1, 4], [2, 3], [3, 4],
  [2, 5], [3, 6], [3, 7], [4, 8], [4, 9],
];

// Query node positions for each index
const QUERY_FLAT = { x: FLAT_DOT_X, y: PANEL_Y + 16 };
const QUERY_IVF  = { x: 435 + 130, y: PANEL_Y + 16 };
const QUERY_HNSW = { x: HNSW_X0 + 145, y: PANEL_Y + 16 };

export const VectorIndexDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const panelsIn   = p(frame, duration, 0.00, 0.20);
  const flatP      = p(frame, duration, 0.20, 0.44);
  const ivfP       = p(frame, duration, 0.44, 0.66);
  const hnswP      = p(frame, duration, 0.66, 0.86);
  const labelsIn   = p(frame, duration, 0.86, 1.00);

  const hiHNSW = hi("HNSW");
  const hiIVF  = hi("IVF");
  const hiFLAT = hi("FLAT");

  // FLAT: animated search index — which dot is being checked
  const flatChecked = Math.floor(flatP * FLAT_DOTS_Y.length);
  const flatCurrentDot = Math.min(flatChecked, FLAT_DOTS_Y.length - 1);

  // IVF: which cluster is being checked
  const ivfPhase = ivfP < 0.4 ? 0 : ivfP < 0.7 ? 1 : 2;

  // HNSW: animated hop count
  const hnswHops = Math.floor(hnswP * 5);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="vidx-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="vidx-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="vidx-arr-cyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.cyan} />
        </marker>
        <marker id="vidx-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
        <marker id="vidx-arr-violet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
      </defs>

      {/* ── Title ── */}
      <text x={W / 2} y={46} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
        opacity={panelsIn}>
        VECTOR INDEX TYPES
      </text>

      {/* ── 3 Panels ── */}
      {PANELS.map((panel, pi) => {
        const isHi = (pi === 0 && hiFLAT) || (pi === 1 && hiIVF) || (pi === 2 && hiHNSW);
        return (
          <g key={panel.id} opacity={panelsIn}>
            <rect x={panel.x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="16"
              fill={panel.color} fillOpacity={isHi ? 0.08 : 0.05}
              stroke={panel.color} strokeWidth={isHi ? 2.2 : 1.5}
              filter={isHi ? "url(#vidx-glow-sm)" : undefined}
            />
            <text x={panel.x + PANEL_W / 2} y={PANEL_Y + 30} textAnchor="middle"
              fill={panel.color} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="2"
              filter={isHi ? "url(#vidx-glow-sm)" : undefined}>
              {panel.label}
            </text>
            <text x={panel.x + PANEL_W / 2} y={PANEL_Y + 52} textAnchor="middle"
              fill={panel.color} fontFamily={T.mono} fontSize="10" opacity={0.7}>
              {panel.desc}
            </text>
          </g>
        );
      })}

      {/* ══ FLAT: linear scan animation ══ */}
      {flatP > 0 && (
        <g opacity={panelsIn}>
          {/* Query dot */}
          <circle cx={QUERY_FLAT.x} cy={QUERY_FLAT.y + 30} r={9}
            fill={T.mint} filter="url(#vidx-glow-sm)" opacity={flatP}
          />
          <text x={QUERY_FLAT.x + 14} y={QUERY_FLAT.y + 35}
            fill={T.mint} fontFamily={T.mono} fontSize="10" opacity={flatP}>
            query
          </text>
          {FLAT_DOTS_Y.map((dy, i) => {
            const isChecked = i < flatChecked;
            const isCurrent = i === flatCurrentDot && flatP < 0.98;
            return (
              <g key={i}>
                <rect x={PANELS[0].x + 20} y={dy - 12} width={PANEL_W - 40} height={24} rx="6"
                  fill={isCurrent ? T.cyan : T.bgDeep}
                  fillOpacity={isCurrent ? 0.3 : 0.6}
                  stroke={isCurrent ? T.cyan : T.border}
                  strokeWidth={isCurrent ? 1.8 : 1}
                  filter={isCurrent ? "url(#vidx-glow-sm)" : undefined}
                />
                <text x={PANELS[0].x + 36} y={dy + 5}
                  fill={isChecked ? T.cyan : T.textDim}
                  fontFamily={T.mono} fontSize="9"
                  opacity={isChecked ? 0.8 : 0.35}>
                  vec_{String(i + 1).padStart(2, "0")}
                </text>
                {/* Scan arrow */}
                {isCurrent && (
                  <line x1={PANELS[0].x + 14} y1={dy} x2={PANELS[0].x + 20} y2={dy}
                    stroke={T.cyan} strokeWidth="2" markerEnd="url(#vidx-arr-cyan)"
                  />
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* ══ IVF: cluster-based search ══ */}
      {ivfP > 0 && (
        <g opacity={panelsIn}>
          {/* Query dot */}
          <circle cx={QUERY_IVF.x} cy={PANEL_Y + 80} r={9}
            fill={T.mint} filter="url(#vidx-glow-sm)" opacity={ivfP}
          />
          {IVF_CLUSTERS.map((cluster, ci) => {
            const isActive = ci === ivfPhase;
            const wasActive = ci < ivfPhase;
            return (
              <g key={ci}>
                {/* Centroid */}
                <circle cx={cluster.cx} cy={cluster.cy} r={isActive ? 14 : 10}
                  fill={T.amber} fillOpacity={isActive ? 0.5 : 0.25}
                  stroke={T.amber} strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? "url(#vidx-glow-sm)" : undefined}
                />
                <text x={cluster.cx + 18} y={cluster.cy + 5}
                  fill={T.amber} fontFamily={T.mono} fontSize="9" opacity={0.8}>
                  C{ci + 1}
                </text>
                {/* Members */}
                {cluster.members.map((m, mi) => (
                  <g key={mi}>
                    <circle cx={m.x} cy={m.y} r={6}
                      fill={T.amber} fillOpacity={wasActive || isActive ? 0.6 : 0.2}
                      stroke={T.amber} strokeWidth="1" opacity={wasActive || isActive ? 1 : 0.4}
                    />
                    {/* Connection to centroid */}
                    <line x1={cluster.cx} y1={cluster.cy} x2={m.x} y2={m.y}
                      stroke={T.amber} strokeWidth="1" opacity={0.25}
                    />
                  </g>
                ))}
                {/* Arrow from query to centroid when active */}
                {ci === 0 && ivfP > 0.1 && (
                  <line x1={QUERY_IVF.x} y1={PANEL_Y + 89}
                    x2={cluster.cx} y2={cluster.cy - 14}
                    stroke={T.amber} strokeWidth="1.5" strokeDasharray="4 3"
                    markerEnd="url(#vidx-arr-amber)"
                    opacity={Math.min(1, (ivfP - 0.1) * 5) * 0.7}
                  />
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* ══ HNSW: graph hop animation ══ */}
      {hnswP > 0 && (
        <g opacity={panelsIn}>
          {/* Layer labels */}
          {[2, 1, 0].map(layer => (
            <text key={layer}
              x={HNSW_X0 - 15} y={layer === 2 ? 175 : layer === 1 ? 295 : 415}
              textAnchor="end"
              fill={T.violet} fontFamily={T.mono} fontSize="9" opacity={0.5}>
              L{layer}
            </text>
          ))}
          {/* Edges */}
          {HNSW_EDGES.map(([a, b], ei) => (
            <line key={ei}
              x1={HNSW_NODES[a].x} y1={HNSW_NODES[a].y}
              x2={HNSW_NODES[b].x} y2={HNSW_NODES[b].y}
              stroke={T.violet} strokeWidth="1" opacity={0.2}
            />
          ))}
          {/* Nodes */}
          {HNSW_NODES.map((node, ni) => {
            const isHop = ni < hnswHops;
            const r = node.layer === 2 ? 12 : node.layer === 1 ? 9 : 7;
            return (
              <g key={ni}>
                <circle cx={node.x} cy={node.y} r={isHop ? r + 4 : r}
                  fill={T.violet} fillOpacity={isHop ? 0.65 : 0.25}
                  stroke={T.violet} strokeWidth={isHop ? 2 : 1}
                  filter={isHop ? "url(#vidx-glow-sm)" : undefined}
                />
              </g>
            );
          })}
          {/* Query dot */}
          <circle cx={QUERY_HNSW.x} cy={PANEL_Y + 80} r={9}
            fill={T.mint} filter="url(#vidx-glow-sm)" opacity={hnswP}
          />
          {/* Hop trail */}
          {hnswHops > 1 && HNSW_NODES.slice(0, hnswHops).map((node, ni) => {
            if (ni === 0) return null;
            const prev = HNSW_NODES[ni - 1];
            return (
              <line key={ni}
                x1={prev.x} y1={prev.y} x2={node.x} y2={node.y}
                stroke={T.mint} strokeWidth="2" strokeDasharray="4 3"
                markerEnd="url(#vidx-arr-violet)"
                opacity={0.7}
              />
            );
          })}
        </g>
      )}

      {/* ── Complexity labels ── */}
      {labelsIn > 0 && (
        <>
          {PANELS.map((panel) => (
            <g key={panel.id} opacity={labelsIn}>
              <rect x={panel.x + 30} y={PANEL_Y + PANEL_H + 14} width={PANEL_W - 60} height={44} rx="12"
                fill={panel.color} fillOpacity={0.12}
                stroke={panel.color} strokeWidth="1.8"
              />
              <text x={panel.x + PANEL_W / 2} y={PANEL_Y + PANEL_H + 40} textAnchor="middle"
                fill={panel.color} fontFamily={T.mono} fontSize="16" fontWeight="800">
                {panel.complexity}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
};
