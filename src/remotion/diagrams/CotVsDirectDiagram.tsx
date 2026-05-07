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

const QUESTION = "If a train leaves at 3pm going 60mph and another leaves at 4pm going 80mph from the same point...";

const COT_STEPS = [
  "1. Train A departs at 3pm @ 60mph",
  "2. By 4pm, Train A covers 60mi",
  "3. Train B starts; closing speed = 80−60 = 20mph",
  "4. Time to close 60mi gap = 60÷20 = 3hrs",
  "5. They meet at 4pm + 3hrs = 7pm",
];

export const CotVsDirectDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const questionIn  = p(frame, duration, 0.00, 0.15);
  const panelsIn    = p(frame, duration, 0.15, 0.30);
  const directIn    = p(frame, duration, 0.30, 0.45);
  const cotStepsP   = p(frame, duration, 0.45, 0.80);
  const revealsIn   = p(frame, duration, 0.80, 1.00);

  const hiDirect = hi("DIRECT");
  const hiCot    = hi("COT");

  const stepsVisible = Math.ceil(cotStepsP * COT_STEPS.length);

  const PX = 60, PW = 440, PH = 360, PY = 195;
  const LEFT_X  = PX;
  const RIGHT_X = W - PX - PW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="cvd-glow">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cvd-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Question bar */}
      <g opacity={questionIn}>
        <rect x={80} y={28} width={W - 160} height={60} rx="14"
          fill={T.cyan} fillOpacity={0.10} stroke={T.cyan} strokeWidth="1.5"
        />
        <text x={W / 2} y={52} textAnchor="middle"
          fill={T.cyan} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
          QUESTION
        </text>
        <text x={W / 2} y={72} textAnchor="middle"
          fill={T.textSecondary} fontFamily={T.mono} fontSize="12">
          {QUESTION}
        </text>
      </g>

      {/* LEFT panel — Direct */}
      <g opacity={panelsIn}>
        <rect x={LEFT_X} y={PY} width={PW} height={PH} rx="18"
          fill={hiDirect ? T.coral : T.nodeFill} fillOpacity={hiDirect ? 0.18 : 0.5}
          stroke={hiDirect ? T.coral : T.border}
          strokeWidth={hiDirect ? 2.5 : 1.5}
          filter={hiDirect ? "url(#cvd-glow-sm)" : undefined}
        />
        <text x={LEFT_X + PW / 2} y={PY + 34} textAnchor="middle"
          fill={hiDirect ? T.coral : T.textDim}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3">
          DIRECT
        </text>
        <text x={LEFT_X + PW / 2} y={PY + 58} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="1.5">
          NO INTERMEDIATE REASONING
        </text>
        <line x1={LEFT_X + 24} y1={PY + 70} x2={LEFT_X + PW - 24} y2={PY + 70}
          stroke={T.border} strokeWidth="1"
        />
      </g>

      {/* Direct wrong answer */}
      {directIn > 0 && (
        <g opacity={Math.min(1, directIn * 2.5)}>
          <text x={LEFT_X + PW / 2} y={PY + 130} textAnchor="middle"
            fill={T.textDim} fontFamily={T.mono} fontSize="12">
            Prompt: "When do they meet?"
          </text>
          <rect x={LEFT_X + 90} y={PY + 150} width={PW - 180} height={56} rx="10"
            fill={T.coral} fillOpacity={0.12} stroke={T.coral} strokeWidth="1.5"
          />
          <text x={LEFT_X + PW / 2} y={PY + 182} textAnchor="middle"
            fill={T.coral} fontFamily={T.mono} fontSize="18" fontWeight="800">
            Answer: 12pm
          </text>
        </g>
      )}

      {/* Direct wrong X badge */}
      {revealsIn > 0 && (
        <g opacity={revealsIn}>
          <circle cx={LEFT_X + PW / 2} cy={PY + 265} r={32}
            fill={T.coral} fillOpacity={0.18} stroke={T.coral} strokeWidth="2.5"
            filter="url(#cvd-glow)"
          />
          <text x={LEFT_X + PW / 2} y={PY + 273} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="28" fontWeight="900">
            ✗
          </text>
          <text x={LEFT_X + PW / 2} y={PY + 325} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            WRONG
          </text>
        </g>
      )}

      {/* RIGHT panel — CoT */}
      <g opacity={panelsIn}>
        <rect x={RIGHT_X} y={PY} width={PW} height={PH} rx="18"
          fill={hiCot ? T.mint : T.nodeFill} fillOpacity={hiCot ? 0.15 : 0.5}
          stroke={hiCot ? T.mint : T.border}
          strokeWidth={hiCot ? 2.5 : 1.5}
          filter={hiCot ? "url(#cvd-glow-sm)" : undefined}
        />
        <text x={RIGHT_X + PW / 2} y={PY + 34} textAnchor="middle"
          fill={hiCot ? T.mint : T.textDim}
          fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="3">
          CHAIN OF THOUGHT
        </text>
        <text x={RIGHT_X + PW / 2} y={PY + 58} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="10" letterSpacing="1.5">
          STEP BY STEP REASONING
        </text>
        <line x1={RIGHT_X + 24} y1={PY + 70} x2={RIGHT_X + PW - 24} y2={PY + 70}
          stroke={T.border} strokeWidth="1"
        />
      </g>

      {/* CoT steps */}
      {COT_STEPS.slice(0, stepsVisible).map((step, i) => (
        <g key={i} opacity={Math.min(1, (cotStepsP * COT_STEPS.length - i) * 1.5)}>
          <rect x={RIGHT_X + 20} y={PY + 82 + i * 48} width={PW - 40} height={38} rx="8"
            fill={T.violet} fillOpacity={0.10} stroke={T.violet} strokeWidth="1"
          />
          <text x={RIGHT_X + 36} y={PY + 106 + i * 48}
            fill={T.violet} fontFamily={T.mono} fontSize="11" fontWeight="600">
            {step}
          </text>
        </g>
      ))}

      {/* CoT correct badge */}
      {revealsIn > 0 && (
        <g opacity={revealsIn}>
          <circle cx={RIGHT_X + PW / 2} cy={PY + 265} r={32}
            fill={T.mint} fillOpacity={0.18} stroke={T.mint} strokeWidth="2.5"
            filter="url(#cvd-glow)"
          />
          <text x={RIGHT_X + PW / 2} y={PY + 273} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="28" fontWeight="900">
            ✓
          </text>
          <text x={RIGHT_X + PW / 2} y={PY + 325} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="11" fontWeight="700" letterSpacing="2">
            CORRECT: 7PM
          </text>
        </g>
      )}

      {/* VS divider */}
      <g opacity={panelsIn}>
        <line x1={W / 2} y1={PY + 20} x2={W / 2} y2={PY + PH - 20}
          stroke={T.border} strokeWidth="1.5" strokeDasharray="6 4"
        />
        <text x={W / 2} y={PY + PH / 2 + 6} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="14" fontWeight="900" letterSpacing="2">
          VS
        </text>
      </g>

      {/* Bottom tagline */}
      {revealsIn > 0 && (
        <g opacity={revealsIn}>
          <rect x={W / 2 - 240} y={610} width={480} height={52} rx="26"
            fill={T.mint} fillOpacity={0.12} stroke={T.mint} strokeWidth="2"
            filter="url(#cvd-glow-sm)"
          />
          <text x={W / 2} y={643} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="3">
            REASONING UNLOCKS ACCURACY
          </text>
        </g>
      )}
    </svg>
  );
};
