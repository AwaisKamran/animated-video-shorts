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

// Sandbox boundary
const SB_X = 340, SB_Y = 160, SB_W = 400, SB_H = 340;
const SB_CX = SB_X + SB_W / 2, SB_CY = SB_Y + SB_H / 2;

// Agent inside
const AG_CX = SB_CX, AG_CY = SB_CY;

// Allowed resources (right side / top)
const ALLOWED = [
  { label: "Filesystem (limited)", sub: "/tmp, /app only",  color: T.mint,  x: 830, y: 200 },
  { label: "Temp Write",           sub: "/tmp only",        color: T.mint,  x: 830, y: 310 },
  { label: "Whitelist URLs",       sub: "api.example.com",  color: T.mint,  x: 830, y: 420 },
];

// Blocked resources (left side)
const BLOCKED = [
  { label: "FS Root Access",  sub: "/etc, /root",      color: T.coral, x: 80, y: 200 },
  { label: "Arbitrary Net",   sub: "*.* unrestricted",  color: T.coral, x: 80, y: 310 },
  { label: "Process Exec",    sub: "exec(), spawn()",   color: T.coral, x: 80, y: 420 },
  { label: "Shell Access",    sub: "bash, sh, cmd",     color: T.coral, x: 80, y: 530 },
];

const RES_W = 210, RES_H = 58;

export const SandboxDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const boundaryIn  = p(frame, duration, 0.00, 0.22);
  const allowedIn   = p(frame, duration, 0.22, 0.44);
  const blockedIn   = p(frame, duration, 0.44, 0.64);
  const bounceP     = p(frame, duration, 0.64, 1.00);

  const hiSandbox   = hi("SANDBOX");
  const hiIsolation = hi("ISOLATION");

  // Bounce animation: agent dot tries to exit left, hits boundary, bounces back
  const bounceProg = bounceP;
  // Dot goes from center toward left boundary, then bounces back
  const bounceRaw  = Math.sin(bounceProg * Math.PI);
  const dotX       = SB_CX - bounceRaw * (SB_W / 2 - 30);
  const dotY       = SB_CY;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="sb-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sb-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="sb-mint" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
        <marker id="sb-coral" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.coral} />
        </marker>
      </defs>

      {/* ── Sandbox boundary ── */}
      <g opacity={boundaryIn}>
        <rect x={SB_X} y={SB_Y} width={SB_W} height={SB_H} rx="20"
          fill={T.bgDeep} fillOpacity={0.6}
          stroke={hiSandbox || hiIsolation ? T.violet : T.borderStrong}
          strokeWidth={hiSandbox || hiIsolation ? 4 : 3}
          strokeDasharray="10 5"
          filter={hiSandbox || hiIsolation ? "url(#sb-glow)" : undefined}
        />
        <text x={SB_CX} y={SB_Y - 16} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3"
          filter={hiIsolation ? "url(#sb-glow-sm)" : undefined}>
          SANDBOX
        </text>
        <text x={SB_X + SB_W - 16} y={SB_Y + 20} textAnchor="end"
          fill={T.textDim} fontFamily={T.sans} fontSize="9" letterSpacing="2" opacity={0.6}>
          ISOLATION
        </text>

        {/* Agent inside */}
        <circle cx={AG_CX} cy={AG_CY} r={40}
          fill={T.nodeFill} stroke={T.violet} strokeWidth="2.5"
        />
        <text x={AG_CX} y={AG_CY + 7} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="13" fontWeight="800">
          AGENT
        </text>
      </g>

      {/* ── Allowed resources ── */}
      {ALLOWED.map((res, i) => {
        const cx = res.x + RES_W / 2;
        const cy = res.y + RES_H / 2;
        const staggerOp = Math.min(1, (allowedIn - i * 0.12) * 4);

        // Arrow from sandbox right edge to resource
        const sbEdgeX = SB_X + SB_W;
        const sbEdgeY = res.y + RES_H / 2;

        return staggerOp > 0 ? (
          <g key={res.label} opacity={staggerOp}>
            {/* Check arrow */}
            <line x1={sbEdgeX} y1={sbEdgeY} x2={res.x - 10} y2={cy}
              stroke={T.mint} strokeWidth="2" markerEnd="url(#sb-mint)"
              filter="url(#sb-glow-sm)"
            />
            <text x={(sbEdgeX + res.x - 10) / 2} y={sbEdgeY - 8} textAnchor="middle"
              fill={T.mint} fontFamily={T.sans} fontSize="12" fontWeight="800">
              ✓
            </text>
            {/* Resource box */}
            <rect x={res.x} y={res.y} width={RES_W} height={RES_H} rx="10"
              fill={T.mint} fillOpacity={0.14} stroke={T.mint} strokeWidth="1.5"
            />
            <text x={cx} y={res.y + 24} textAnchor="middle"
              fill={T.mint} fontFamily={T.sans} fontSize="12" fontWeight="700">
              {res.label}
            </text>
            <text x={cx} y={res.y + 44} textAnchor="middle"
              fill={T.mint} fontFamily={T.mono} fontSize="10" opacity={0.75}>
              {res.sub}
            </text>
          </g>
        ) : null;
      })}

      {/* ── Blocked resources ── */}
      {BLOCKED.map((res, i) => {
        const cx = res.x + RES_W / 2;
        const cy = res.y + RES_H / 2;
        const staggerOp = Math.min(1, (blockedIn - i * 0.10) * 4);

        const sbEdgeX = SB_X;
        const sbEdgeY = res.y + RES_H / 2;

        return staggerOp > 0 ? (
          <g key={res.label} opacity={staggerOp}>
            {/* Blocked arrow */}
            <line x1={sbEdgeX} y1={sbEdgeY} x2={res.x + RES_W + 10} y2={cy}
              stroke={T.coral} strokeWidth="2" strokeDasharray="5 3"
              markerEnd="url(#sb-coral)"
              opacity={0.6}
            />
            <text x={(sbEdgeX + res.x + RES_W + 10) / 2} y={sbEdgeY - 8} textAnchor="middle"
              fill={T.coral} fontFamily={T.sans} fontSize="14" fontWeight="800">
              ✗
            </text>
            {/* Resource box */}
            <rect x={res.x} y={res.y} width={RES_W} height={RES_H} rx="10"
              fill={T.coral} fillOpacity={0.10} stroke={T.coral} strokeWidth="1.5"
            />
            <text x={cx} y={res.y + 24} textAnchor="middle"
              fill={T.coral} fontFamily={T.sans} fontSize="12" fontWeight="700">
              {res.label}
            </text>
            <text x={cx} y={res.y + 44} textAnchor="middle"
              fill={T.coral} fontFamily={T.mono} fontSize="10" opacity={0.75}>
              {res.sub}
            </text>
          </g>
        ) : null;
      })}

      {/* ── Bounce animation: agent tries to reach blocked resource ── */}
      {bounceP > 0 && (
        <g>
          <circle cx={dotX} cy={dotY} r={14}
            fill={T.violet} opacity={0.9}
            filter="url(#sb-glow)"
          />
          <text x={dotX} y={dotY + 5} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.sans} fontSize="10" fontWeight="800">
            AG
          </text>
          {/* Flash at boundary when near */}
          {bounceProg > 0.35 && bounceProg < 0.65 && (
            <rect x={SB_X - 4} y={SB_Y} width={8} height={SB_H} rx="4"
              fill={T.coral} opacity={0.4 * (1 - Math.abs(bounceProg - 0.5) * 5)}
              filter="url(#sb-glow)"
            />
          )}
        </g>
      )}

      {/* ── BLOCKED badge on bounce ── */}
      {bounceP > 0.4 && bounceP < 0.75 && (
        <g opacity={Math.min(1, (bounceP - 0.4) * 5) * Math.min(1, (0.75 - bounceP) * 8)}>
          <rect x={SB_CX - 100} y={SB_Y + SB_H + 20} width={200} height={40} rx="20"
            fill={T.coral} fillOpacity={0.16} stroke={T.coral} strokeWidth="2"
            filter="url(#sb-glow-sm)"
          />
          <text x={SB_CX} y={SB_Y + SB_H + 46} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="12" fontWeight="800" letterSpacing="2">
            ACCESS DENIED
          </text>
        </g>
      )}

      {/* ── Final badge ── */}
      {bounceP > 0.85 && (
        <g opacity={Math.min(1, (bounceP - 0.85) * 6.6)}>
          <rect x={W / 2 - 190} y={620} width={380} height={50} rx="25"
            fill={T.violet} fillOpacity={0.14} stroke={T.violet} strokeWidth="2"
            filter="url(#sb-glow-sm)"
          />
          <text x={W / 2} y={651} textAnchor="middle"
            fill={T.violet} fontFamily={T.sans} fontSize="14" fontWeight="800" letterSpacing="2">
            SANDBOX ISOLATION ACTIVE
          </text>
        </g>
      )}
    </svg>
  );
};
