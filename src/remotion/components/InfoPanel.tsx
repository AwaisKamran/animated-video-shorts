import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props {
  headline: string;
  subtext?: string;
  keyTerms?: string[];
  frame: number;
  accentColor?: string;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (test.length <= maxChars) { cur = test; }
    else { if (cur) lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

export const InfoPanel: React.FC<Props> = ({
  headline,
  subtext,
  keyTerms = [],
  frame,
  accentColor = T.cyan,
}) => {
  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const slideY = interpolate(frame, [0, 18], [24, 0], { extrapolateRight: "clamp" });

  const headlineLines = wrapText(headline, 32);
  const subtextLines = subtext ? wrapText(subtext, 42) : [];

  const LINE_H = 80;
  const SUBLINE_H = 52;
  const headlineH = headlineLines.length * LINE_H;
  const subtextH = subtextLines.length * SUBLINE_H;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        opacity: fadeIn,
        transform: `translateY(${slideY}px)`,
        padding: "48px 72px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 0,
      }}
    >
      {/* Key term pills */}
      {keyTerms.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          {keyTerms.map((term, i) => (
            <div
              key={i}
              style={{
                background: accentColor,
                padding: "8px 24px",
                borderRadius: 100,
                fontFamily: T.mono,
                fontSize: 22,
                fontWeight: 600,
                color: "#1A1A1A",
                letterSpacing: 0.5,
              }}
            >
              {term}
            </div>
          ))}
        </div>
      )}

      {/* Thin accent bar */}
      <div
        style={{
          width: 48,
          height: 3,
          background: accentColor,
          borderRadius: 2,
          marginBottom: 28,
        }}
      />

      {/* Headline */}
      <div
        style={{
          fontFamily: T.sans,
          fontSize: 58,
          fontWeight: 700,
          color: T.textPrimary,
          lineHeight: 1.25,
          letterSpacing: -1,
          marginBottom: subtext ? 28 : 0,
        }}
      >
        {headline}
      </div>

      {/* Subtext */}
      {subtext && (
        <div
          style={{
            fontFamily: T.sans,
            fontSize: 34,
            fontWeight: 400,
            color: T.textSecondary,
            lineHeight: 1.6,
            letterSpacing: -0.3,
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
};
