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

const ATTEMPT_Y = 260;
const BOX_W = 140, BOX_H = 70;
const ATT1_X = 90, ATT2_X = 380, ATT3_X = 720;
const ARROW_Y = ATTEMPT_Y + BOX_H / 2;
const GAP1_MID = (ATT1_X + BOX_W + ATT2_X) / 2;
const GAP2_MID = (ATT2_X + BOX_W + ATT3_X) / 2;

export const ToolRetryDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const att1In    = p(frame, duration, 0.00, 0.14);
  const att1Fail  = p(frame, duration, 0.14, 0.24);
  const backoff1  = p(frame, duration, 0.24, 0.38);
  const att2In    = p(frame, duration, 0.38, 0.50);
  const att2Fail  = p(frame, duration, 0.50, 0.58);
  const backoff2  = p(frame, duration, 0.58, 0.72);
  const att3In    = p(frame, duration, 0.72, 0.84);
  const att3Win   = p(frame, duration, 0.84, 1.00);

  const hiRetry   = hi("RETRY");
  const hiBackoff = hi("BACKOFF");
  const hiError   = hi("ERROR");

  // Pulsing retry badge — flickers when att1/att2 fail
  const pulse1 = att1Fail > 0 && att1Fail < 0.95 ? 0.7 + 0.3 * Math.sin(frame * 0.5) : 0;
  const pulse2 = att2Fail > 0 && att2Fail < 0.95 ? 0.7 + 0.3 * Math.sin(frame * 0.5) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="retry-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="retry-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="retry-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.textDim} />
        </marker>
        <marker id="retry-arr-err" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.coral} />
        </marker>
      </defs>

      {/* ── Title ── */}
      <text x={W / 2} y={50} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3">
        EXPONENTIAL BACKOFF RETRY
      </text>

      {/* ── ATTEMPT 1 ── */}
      {att1In > 0 && (
        <g opacity={att1In}>
          <rect x={ATT1_X} y={ATTEMPT_Y} width={BOX_W} height={BOX_H} rx="14"
            fill={att1Fail > 0 ? `${T.coral}22` : `${T.cyan}18`}
            stroke={att1Fail > 0 ? T.coral : T.cyan}
            strokeWidth={hiError && att1Fail > 0 ? 2.5 : 1.5}
            filter={hiError && att1Fail > 0 ? "url(#retry-glow-sm)" : undefined}
          />
          <text x={ATT1_X + BOX_W / 2} y={ATTEMPT_Y + 26} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            ATTEMPT 1
          </text>
          <text x={ATT1_X + BOX_W / 2} y={ATTEMPT_Y + 50} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">
            tool_call()
          </text>
        </g>
      )}

      {/* Attempt 1 fail mark */}
      {att1Fail > 0 && (
        <g opacity={att1Fail}>
          <text x={ATT1_X + BOX_W / 2} y={ATTEMPT_Y - 16} textAnchor="middle"
            fill={hiError ? T.coral : T.coral} fontFamily={T.sans} fontSize="22" fontWeight="900"
            filter={hiError ? "url(#retry-glow-sm)" : undefined}>
            ✗
          </text>
          <text x={ATT1_X + BOX_W / 2} y={ATTEMPT_Y + BOX_H + 24} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="12">
            Timeout
          </text>
        </g>
      )}

      {/* Retry badge attempt 1 */}
      {pulse1 > 0 && (
        <g opacity={pulse1}>
          <rect x={ATT1_X - 10} y={ATTEMPT_Y + BOX_H + 46} width={BOX_W + 20} height={32} rx="16"
            fill={hiRetry ? `${T.amber}33` : `${T.amber}1A`}
            stroke={T.amber} strokeWidth={hiRetry ? 2.5 : 1.5}
            filter={hiRetry ? "url(#retry-glow-sm)" : undefined}
          />
          <text x={ATT1_X + BOX_W / 2} y={ATTEMPT_Y + BOX_H + 67} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="2">
            RETRY
          </text>
        </g>
      )}

      {/* ── Backoff 1 gap (1s) ── */}
      {backoff1 > 0 && (
        <g opacity={backoff1}>
          <line x1={ATT1_X + BOX_W + 8} y1={ARROW_Y} x2={ATT2_X - 8} y2={ARROW_Y}
            stroke={hiBackoff ? T.amber : T.textDim} strokeWidth="2"
            strokeDasharray="6 4"
            filter={hiBackoff ? "url(#retry-glow-sm)" : undefined}
            markerEnd="url(#retry-arr)"
          />
          <text x={GAP1_MID} y={ARROW_Y - 14} textAnchor="middle"
            fill={hiBackoff ? T.amber : T.textDim} fontFamily={T.mono} fontSize="11"
            filter={hiBackoff ? "url(#retry-glow-sm)" : undefined}>
            wait 1s
          </text>
          <rect x={GAP1_MID - 28} y={ARROW_Y + 8} width={56} height={22} rx="11"
            fill={hiBackoff ? `${T.amber}28` : `${T.bgDeep}`}
            stroke={hiBackoff ? T.amber : T.border} strokeWidth="1"
          />
          <text x={GAP1_MID} y={ARROW_Y + 23} textAnchor="middle"
            fill={hiBackoff ? T.amber : T.textDim} fontFamily={T.mono} fontSize="10">
            1× delay
          </text>
        </g>
      )}

      {/* ── ATTEMPT 2 ── */}
      {att2In > 0 && (
        <g opacity={att2In}>
          <rect x={ATT2_X} y={ATTEMPT_Y} width={BOX_W} height={BOX_H} rx="14"
            fill={att2Fail > 0 ? `${T.coral}22` : `${T.cyan}18`}
            stroke={att2Fail > 0 ? T.coral : T.cyan}
            strokeWidth={hiError && att2Fail > 0 ? 2.5 : 1.5}
            filter={hiError && att2Fail > 0 ? "url(#retry-glow-sm)" : undefined}
          />
          <text x={ATT2_X + BOX_W / 2} y={ATTEMPT_Y + 26} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            ATTEMPT 2
          </text>
          <text x={ATT2_X + BOX_W / 2} y={ATTEMPT_Y + 50} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">
            tool_call()
          </text>
        </g>
      )}

      {att2Fail > 0 && (
        <g opacity={att2Fail}>
          <text x={ATT2_X + BOX_W / 2} y={ATTEMPT_Y - 16} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="22" fontWeight="900"
            filter={hiError ? "url(#retry-glow-sm)" : undefined}>
            ✗
          </text>
          <text x={ATT2_X + BOX_W / 2} y={ATTEMPT_Y + BOX_H + 24} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="12">
            500 Error
          </text>
        </g>
      )}

      {/* Retry badge attempt 2 */}
      {pulse2 > 0 && (
        <g opacity={pulse2}>
          <rect x={ATT2_X - 10} y={ATTEMPT_Y + BOX_H + 46} width={BOX_W + 20} height={32} rx="16"
            fill={hiRetry ? `${T.amber}33` : `${T.amber}1A`}
            stroke={T.amber} strokeWidth={hiRetry ? 2.5 : 1.5}
            filter={hiRetry ? "url(#retry-glow-sm)" : undefined}
          />
          <text x={ATT2_X + BOX_W / 2} y={ATTEMPT_Y + BOX_H + 67} textAnchor="middle"
            fill={T.amber} fontFamily={T.sans} fontSize="11" fontWeight="800" letterSpacing="2">
            RETRY
          </text>
        </g>
      )}

      {/* ── Backoff 2 gap (2s) ── */}
      {backoff2 > 0 && (
        <g opacity={backoff2}>
          <line x1={ATT2_X + BOX_W + 8} y1={ARROW_Y} x2={ATT3_X - 8} y2={ARROW_Y}
            stroke={hiBackoff ? T.amber : T.textDim} strokeWidth="2"
            strokeDasharray="6 4"
            filter={hiBackoff ? "url(#retry-glow-sm)" : undefined}
            markerEnd="url(#retry-arr)"
          />
          <text x={GAP2_MID} y={ARROW_Y - 14} textAnchor="middle"
            fill={hiBackoff ? T.amber : T.textDim} fontFamily={T.mono} fontSize="11"
            filter={hiBackoff ? "url(#retry-glow-sm)" : undefined}>
            wait 2s
          </text>
          <rect x={GAP2_MID - 28} y={ARROW_Y + 8} width={56} height={22} rx="11"
            fill={hiBackoff ? `${T.amber}28` : T.bgDeep}
            stroke={hiBackoff ? T.amber : T.border} strokeWidth="1"
          />
          <text x={GAP2_MID} y={ARROW_Y + 23} textAnchor="middle"
            fill={hiBackoff ? T.amber : T.textDim} fontFamily={T.mono} fontSize="10">
            2× delay
          </text>
        </g>
      )}

      {/* ── ATTEMPT 3 ── */}
      {att3In > 0 && (
        <g opacity={att3In}>
          <rect x={ATT3_X} y={ATTEMPT_Y} width={BOX_W} height={BOX_H} rx="14"
            fill={att3Win > 0 ? `${T.mint}22` : `${T.cyan}18`}
            stroke={att3Win > 0 ? T.mint : T.cyan}
            strokeWidth={att3Win > 0 ? 2.5 : 1.5}
            filter={att3Win > 0 ? "url(#retry-glow-sm)" : undefined}
          />
          <text x={ATT3_X + BOX_W / 2} y={ATTEMPT_Y + 26} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            ATTEMPT 3
          </text>
          <text x={ATT3_X + BOX_W / 2} y={ATTEMPT_Y + 50} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="11">
            tool_call()
          </text>
        </g>
      )}

      {att3Win > 0 && (
        <g opacity={att3Win}>
          <text x={ATT3_X + BOX_W / 2} y={ATTEMPT_Y - 16} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="22" fontWeight="900"
            filter="url(#retry-glow-sm)">
            ✓
          </text>
          <text x={ATT3_X + BOX_W / 2} y={ATTEMPT_Y + BOX_H + 24} textAnchor="middle"
            fill={T.mint} fontFamily={T.mono} fontSize="12">
            200 OK
          </text>
        </g>
      )}

      {/* ── Timeline axis ── */}
      {backoff1 > 0 && (
        <g opacity={Math.min(backoff1, 1)}>
          <line x1={ATT1_X} y1={460} x2={ATT3_X + BOX_W + 20} y2={460}
            stroke={T.border} strokeWidth="1.5" />
          {[0, 1, 2, 3, 4].map((s, i) => {
            const tx = ATT1_X + (i / 4) * (ATT3_X + BOX_W - ATT1_X);
            return (
              <g key={s}>
                <line x1={tx} y1={456} x2={tx} y2={464} stroke={T.border} strokeWidth="1.5" />
                <text x={tx} y={478} textAnchor="middle"
                  fill={T.textDim} fontFamily={T.mono} fontSize="10">{s}s</text>
              </g>
            );
          })}
        </g>
      )}

      {/* ── Backoff exponent label ── */}
      {backoff2 > 0.5 && (
        <text x={W / 2} y={520} textAnchor="middle"
          fill={hiBackoff ? T.amber : T.textDim} fontFamily={T.mono} fontSize="12"
          filter={hiBackoff ? "url(#retry-glow-sm)" : undefined}
          opacity={backoff2}>
          delay = 2^attempt  →  1s, 2s, 4s…
        </text>
      )}

      {/* ── SUCCESS badge ── */}
      {att3Win > 0.5 && (
        <g opacity={att3Win}>
          <rect x={W / 2 - 160} y={560} width={320} height={52} rx="26"
            fill={`${T.mint}1A`} stroke={T.mint} strokeWidth="2.5"
            filter="url(#retry-glow)"
          />
          <text x={W / 2} y={592} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="16" fontWeight="800" letterSpacing="3">
            SUCCESS
          </text>
        </g>
      )}
    </svg>
  );
};
