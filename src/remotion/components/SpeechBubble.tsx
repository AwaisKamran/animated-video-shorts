import React from "react";
import { interpolate } from "remotion";

interface SpeechBubbleProps {
  text: string;
  frame: number;
  speaker?: "captain" | "sailor";
  color?: string;
  maxCharsPerLine?: number;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  frame,
  speaker = "captain",
  color = "#F4C430",
  maxCharsPerLine = 26,
}) => {
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const lines = wrapText(text, maxCharsPerLine);
  const lineHeight = 48;
  const padding = 32;
  const boxHeight = lines.length * lineHeight + padding * 2;
  const boxWidth = 960;

  const tailPoints =
    speaker === "captain"
      ? `80,${boxHeight} 40,${boxHeight + 48} 140,${boxHeight}`
      : `${boxWidth - 80},${boxHeight} ${boxWidth - 40},${boxHeight + 48} ${boxWidth - 140},${boxHeight}`;

  return (
    <g opacity={opacity}>
      {/* Bubble shadow */}
      <rect x="68" y="8" width={boxWidth} height={boxHeight} rx="20" fill="#000" opacity="0.4" />

      {/* Main bubble */}
      <rect
        x="60"
        y="0"
        width={boxWidth}
        height={boxHeight}
        rx="20"
        fill="#0A0E27"
        stroke={color}
        strokeWidth="5"
      />

      {/* Tail */}
      <polygon points={tailPoints} fill="#0A0E27" />
      <polygon points={tailPoints} fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
      {/* Cover tail's inner join with bubble color */}
      <rect x="65" y={boxHeight - 6} width={boxWidth - 10} height="12" fill="#0A0E27" />

      {/* Speaker label */}
      <rect x="60" y="0" width="200" height="36" rx="18" fill={color} />
      <text
        x="160"
        y="24"
        textAnchor="middle"
        fill="#0A0E27"
        fontFamily="'Press Start 2P', monospace"
        fontSize="13"
        fontWeight="bold"
      >
        {speaker === "captain" ? "CAPTAIN" : "SAILOR"}
      </text>

      {/* Dialogue text */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={boxWidth / 2 + 60}
          y={padding + 32 + i * lineHeight}
          textAnchor="middle"
          fill="white"
          fontFamily="'Press Start 2P', monospace"
          fontSize="26"
        >
          {line}
        </text>
      ))}
    </g>
  );
};
