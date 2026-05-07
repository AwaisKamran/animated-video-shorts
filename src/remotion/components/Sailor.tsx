import React from "react";

interface SailorProps {
  frame: number;
  index?: number;
  scale?: number;
  talking?: boolean;
}

export const Sailor: React.FC<SailorProps> = ({
  frame,
  index = 0,
  scale = 1,
  talking = false,
}) => {
  const bob = Math.sin(frame * 0.08 + index * 1.2) * 3;
  const mouthOpen = talking && Math.sin(frame * 0.3 + index) > 0;

  return (
    <svg
      width={140 * scale}
      height={200 * scale}
      viewBox="0 0 140 200"
      style={{ transform: `translateY(${bob}px)`, overflow: "visible" }}
    >
      {/* Sailor hat */}
      <rect x="22" y="6" width="96" height="30" fill="white" rx="4" />
      <rect x="14" y="32" width="112" height="10" fill="#1B2A6B" />
      {/* Hat band bow */}
      <rect x="56" y="14" width="28" height="10" fill="#1B2A6B" rx="2" />

      {/* Head */}
      <rect x="26" y="40" width="88" height="76" fill="#FFCBA4" rx="10" />

      {/* Eyes */}
      <rect x="40" y="58" width="16" height="16" fill="white" rx="2" />
      <rect x="84" y="58" width="16" height="16" fill="white" rx="2" />
      <rect x="46" y="64" width="8" height="8" fill="#1A1A1A" rx="2" />
      <rect x="90" y="64" width="8" height="8" fill="#1A1A1A" rx="2" />
      <rect x="47" y="65" width="3" height="3" fill="white" />
      <rect x="91" y="65" width="3" height="3" fill="white" />

      {/* Cheeks */}
      <rect x="28" y="78" width="22" height="14" fill="#FF9999" rx="6" opacity="0.7" />
      <rect x="90" y="78" width="22" height="14" fill="#FF9999" rx="6" opacity="0.7" />

      {/* Mouth */}
      {mouthOpen ? (
        <rect x="52" y="94" width="36" height="12" fill="#8B0000" rx="4" />
      ) : (
        <rect x="54" y="96" width="32" height="8" fill="#CC3333" rx="4" />
      )}

      {/* Neckerchief */}
      <polygon points="26,116 114,116 70,148" fill="#1B2A6B" />
      <polygon points="26,116 60,116 70,138" fill="#E52222" />

      {/* Striped shirt */}
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x="18"
          y={118 + i * 14}
          width="104"
          height="7"
          fill={i % 2 === 0 ? "#1B2A6B" : "white"}
        />
      ))}
      <rect x="18" y="174" width="104" height="4" fill="#1B2A6B" />

      {/* Pants */}
      <rect x="22" y="178" width="42" height="22" fill="#1B2A6B" />
      <rect x="76" y="178" width="42" height="22" fill="#1B2A6B" />
      <rect x="62" y="178" width="16" height="22" fill="#142050" />

      {/* Arms */}
      <rect x="4" y="128" width="20" height="52" fill={index % 2 === 0 ? "#1B2A6B" : "white"} rx="4" />
      <rect x="116" y="128" width="20" height="52" fill={index % 2 === 0 ? "white" : "#1B2A6B"} rx="4" />

      {/* Hands */}
      <rect x="4" y="174" width="20" height="18" fill="#FFCBA4" rx="6" />
      <rect x="116" y="174" width="20" height="18" fill="#FFCBA4" rx="6" />
    </svg>
  );
};
