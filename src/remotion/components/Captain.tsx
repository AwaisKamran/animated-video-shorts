import React from "react";

interface CaptainProps {
  frame: number;
  talking?: boolean;
  scale?: number;
}

export const Captain: React.FC<CaptainProps> = ({
  frame,
  talking = false,
  scale = 1,
}) => {
  const bob = Math.sin(frame * 0.08) * 4;
  const mouthOpen = talking && Math.sin(frame * 0.25) > 0;

  return (
    <svg
      width={200 * scale}
      height={280 * scale}
      viewBox="0 0 200 280"
      style={{ transform: `translateY(${bob}px)`, overflow: "visible" }}
    >
      {/* Captain's hat brim */}
      <rect x="28" y="58" width="144" height="12" fill="#F4C430" rx="2" />
      {/* Hat body */}
      <rect x="42" y="14" width="116" height="50" fill="#1B2A6B" />
      {/* Hat highlight */}
      <rect x="50" y="18" width="100" height="6" fill="#2A3D8F" />
      {/* Anchor on hat */}
      <text x="100" y="52" textAnchor="middle" fontSize="22" fill="#F4C430">
        ⚓
      </text>

      {/* Head */}
      <rect x="34" y="68" width="132" height="100" fill="#FFCBA4" rx="12" />

      {/* Eyes */}
      <rect x="54" y="86" width="22" height="22" fill="white" rx="2" />
      <rect x="124" y="86" width="22" height="22" fill="white" rx="2" />
      <rect x="62" y="93" width="12" height="12" fill="#1A1A1A" rx="2" />
      <rect x="132" y="93" width="12" height="12" fill="#1A1A1A" rx="2" />
      {/* Eye shine */}
      <rect x="64" y="94" width="4" height="4" fill="white" />
      <rect x="134" y="94" width="4" height="4" fill="white" />

      {/* Eyebrows */}
      <rect x="52" y="82" width="26" height="5" fill="#5C3317" rx="2" />
      <rect x="122" y="82" width="26" height="5" fill="#5C3317" rx="2" />

      {/* Cheeks */}
      <rect x="38" y="108" width="28" height="18" fill="#FF9999" rx="8" opacity="0.7" />
      <rect x="134" y="108" width="28" height="18" fill="#FF9999" rx="8" opacity="0.7" />

      {/* Nose */}
      <rect x="94" y="102" width="12" height="10" fill="#E8A882" rx="4" />

      {/* Mustache */}
      <rect x="60" y="122" width="36" height="10" fill="#5C3317" rx="6" />
      <rect x="104" y="122" width="36" height="10" fill="#5C3317" rx="6" />

      {/* Mouth */}
      {mouthOpen ? (
        <rect x="74" y="136" width="52" height="16" fill="#8B0000" rx="4" />
      ) : (
        <rect x="78" y="138" width="44" height="8" fill="#CC3333" rx="4" />
      )}
      {mouthOpen && (
        <rect x="80" y="140" width="40" height="8" fill="#CC0000" rx="2" />
      )}

      {/* Coat body */}
      <rect x="18" y="168" width="164" height="112" fill="#1B2A6B" />
      {/* Coat center line */}
      <rect x="97" y="168" width="6" height="112" fill="#142050" />

      {/* Epaulettes */}
      <rect x="6" y="162" width="38" height="22" fill="#F4C430" rx="4" />
      <rect x="156" y="162" width="38" height="22" fill="#F4C430" rx="4" />
      <rect x="10" y="166" width="30" height="6" fill="#D4A800" />
      <rect x="160" y="166" width="30" height="6" fill="#D4A800" />

      {/* Gold buttons */}
      <rect x="88" y="182" width="14" height="14" fill="#F4C430" rx="7" />
      <rect x="88" y="206" width="14" height="14" fill="#F4C430" rx="7" />
      <rect x="88" y="230" width="14" height="14" fill="#F4C430" rx="7" />
      <rect x="88" y="254" width="14" height="14" fill="#F4C430" rx="7" />

      {/* Arms */}
      <rect x="0" y="178" width="28" height="80" fill="#1B2A6B" rx="4" />
      <rect x="172" y="178" width="28" height="80" fill="#1B2A6B" rx="4" />

      {/* Hands */}
      <rect x="0" y="252" width="28" height="28" fill="#FFCBA4" rx="8" />
      <rect x="172" y="252" width="28" height="28" fill="#FFCBA4" rx="8" />

      {/* Coat trim */}
      <rect x="18" y="274" width="164" height="6" fill="#F4C430" />
    </svg>
  );
};
