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

// Pie chart helper
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const start = toRad(startAngle), end = toRad(endAngle);
  const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2} Z`;
}

export const NaiveBayesDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  const formulaIn    = p(frame, duration, 0.00, 0.20);
  const priorIn      = p(frame, duration, 0.20, 0.45);
  const featuresIn   = p(frame, duration, 0.45, 0.65);
  const posteriorIn  = p(frame, duration, 0.65, 0.85);
  const verdictIn    = p(frame, duration, 0.85, 1.00);

  const hiPrior      = hi("PRIOR");
  const hiPosterior  = hi("POSTERIOR");
  const hiLikelihood = hi("LIKELIHOOD");
  const hiBayes      = hi("BAYES");

  // Prior pie: 30% spam (coral), 70% not spam (mint)
  const PRIOR_CX = 190, PRIOR_CY = 380, PRIOR_R = 110;
  const spamAngle = 360 * 0.30;

  // Posterior pie: 89% spam, 11% not spam
  const POST_CX = 870, POST_CY = 380, POST_R = 110;
  const postSpamAngle = 360 * 0.89 * posteriorIn;

  // Feature nodes (center)
  const FEAT_CX = 540;
  const FEATURES = [
    { y: 300, word: '"free"',  pct: "P = 0.82" },
    { y: 400, word: '"click"', pct: "P = 0.74" },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="nb-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Bayes formula */}
      {formulaIn > 0 && (
        <g opacity={formulaIn}>
          <rect x={W / 2 - 260} y={30} width={520} height={60} rx="12"
            fill={T.bgDeep} stroke={hiBayes ? T.amber : T.borderStrong} strokeWidth="1.5"
            filter={hiBayes ? "url(#nb-glow)" : undefined}
          />
          <text x={W / 2} y={67} textAnchor="middle"
            fill={hiBayes ? T.amber : T.textPrimary} fontFamily={T.mono} fontSize="22" fontWeight="700"
            filter={hiBayes ? "url(#nb-glow)" : undefined}>
            P(A|B) = P(B|A)·P(A) / P(B)
          </text>
        </g>
      )}

      {/* Prior pie chart */}
      {priorIn > 0 && (
        <g opacity={priorIn}>
          <text x={PRIOR_CX} y={220} textAnchor="middle"
            fill={hiPrior ? T.amber : T.textSecondary}
            fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
            PRIOR
          </text>
          {/* Coral: spam 30% */}
          <path d={arcPath(PRIOR_CX, PRIOR_CY, PRIOR_R, 0, spamAngle)}
            fill={T.coral} fillOpacity={hiPrior ? 0.85 : 0.7}
            filter={hiPrior ? "url(#nb-glow)" : undefined}
          />
          {/* Mint: not spam 70% */}
          <path d={arcPath(PRIOR_CX, PRIOR_CY, PRIOR_R, spamAngle, 360)}
            fill={T.mint} fillOpacity={hiPrior ? 0.85 : 0.7}
            filter={hiPrior ? "url(#nb-glow)" : undefined}
          />
          {/* Labels */}
          <text x={PRIOR_CX - 30} y={PRIOR_CY - 30} textAnchor="middle"
            fill={T.textPrimary} fontFamily={T.sans} fontSize="13" fontWeight="700">30%</text>
          <text x={PRIOR_CX - 30} y={PRIOR_CY - 14} textAnchor="middle"
            fill={T.textPrimary} fontFamily={T.sans} fontSize="11">Spam</text>
          <text x={PRIOR_CX + 30} y={PRIOR_CY + 40} textAnchor="middle"
            fill={T.textPrimary} fontFamily={T.sans} fontSize="13" fontWeight="700">70%</text>
          <text x={PRIOR_CX + 30} y={PRIOR_CY + 56} textAnchor="middle"
            fill={T.textPrimary} fontFamily={T.sans} fontSize="11">Not Spam</text>
        </g>
      )}

      {/* Feature nodes */}
      {featuresIn > 0 && FEATURES.map((feat, i) => {
        const alpha = Math.min((featuresIn * 2 - i) * 1, 1);
        if (alpha <= 0) return null;
        return (
          <g key={i} opacity={alpha}>
            <rect x={FEAT_CX - 70} y={feat.y - 26} width={140} height={52} rx="10"
              fill={T.bgDeep}
              stroke={hiLikelihood ? T.amber : T.borderStrong} strokeWidth="1.5"
              filter={hiLikelihood ? "url(#nb-glow)" : undefined}
            />
            <text x={FEAT_CX} y={feat.y - 4} textAnchor="middle"
              fill={T.textPrimary} fontFamily={T.mono} fontSize="16" fontWeight="700">
              {feat.word}
            </text>
            <text x={FEAT_CX} y={feat.y + 14} textAnchor="middle"
              fill={hiLikelihood ? T.amber : T.textDim} fontFamily={T.mono} fontSize="12">
              {feat.pct}
            </text>
          </g>
        );
      })}

      {/* Arrows from prior + features to posterior */}
      {posteriorIn > 0 && (
        <g opacity={Math.min(posteriorIn * 2, 1)}>
          <line x1={PRIOR_CX + PRIOR_R} y1={PRIOR_CY}
            x2={FEAT_CX - 80} y2={350}
            stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="6 4" />
          {FEATURES.map((feat, i) => (
            <line key={i}
              x1={FEAT_CX + 70} y1={feat.y}
              x2={POST_CX - POST_R} y2={POST_CY}
              stroke={T.borderStrong} strokeWidth="1.5" strokeDasharray="6 4" />
          ))}
        </g>
      )}

      {/* Posterior pie */}
      {posteriorIn > 0 && (
        <g opacity={posteriorIn}>
          <text x={POST_CX} y={220} textAnchor="middle"
            fill={hiPosterior ? T.amber : T.textSecondary}
            fontFamily={T.sans} fontSize="14" fontWeight="700" letterSpacing="1">
            POSTERIOR
          </text>
          {/* Coral: spam 89% grows */}
          <path d={arcPath(POST_CX, POST_CY, POST_R, 0, postSpamAngle)}
            fill={T.coral} fillOpacity={hiPosterior ? 0.9 : 0.75}
            filter={hiPosterior ? "url(#nb-glow)" : undefined}
          />
          {/* Mint: not spam remainder */}
          {postSpamAngle < 360 && (
            <path d={arcPath(POST_CX, POST_CY, POST_R, postSpamAngle, 360)}
              fill={T.mint} fillOpacity={hiPosterior ? 0.9 : 0.75}
            />
          )}
          {posteriorIn > 0.5 && (
            <g opacity={(posteriorIn - 0.5) / 0.5}>
              <text x={POST_CX} y={POST_CY - 20} textAnchor="middle"
                fill={T.textPrimary} fontFamily={T.sans} fontSize="16" fontWeight="700">89%</text>
              <text x={POST_CX} y={POST_CY} textAnchor="middle"
                fill={T.textPrimary} fontFamily={T.sans} fontSize="12">Spam</text>
            </g>
          )}
        </g>
      )}

      {/* Verdict badge */}
      {verdictIn > 0 && (
        <g opacity={verdictIn}>
          <rect x={POST_CX - 140} y={530} width={280} height={68} rx="14"
            fill={T.coral} fillOpacity={0.18}
            stroke={T.coral} strokeWidth="2.5"
            filter="url(#nb-glow)"
          />
          <text x={POST_CX} y={555} textAnchor="middle"
            fill={T.coral} fontFamily={T.sans} fontSize="22" fontWeight="800" letterSpacing="1">
            SPAM
          </text>
          <text x={POST_CX} y={580} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="13">
            P(Spam|features) = 89%
          </text>
        </g>
      )}
    </svg>
  );
};
