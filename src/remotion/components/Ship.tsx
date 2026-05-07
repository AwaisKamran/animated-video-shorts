import React from "react";
import { useCurrentFrame } from "remotion";

export const Ship: React.FC = () => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.04) * 3;

  return (
    <svg
      width="1080"
      height="600"
      viewBox="0 0 1080 600"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        transform: `rotate(${sway * 0.3}deg)`,
        transformOrigin: "540px 400px",
      }}
    >
      {/* Hull shadow */}
      <ellipse cx="540" cy="490" rx="420" ry="28" fill="#001520" opacity="0.5" />

      {/* Hull body */}
      <path
        d="M 100 380 L 980 380 L 920 500 L 160 500 Z"
        fill="#8B4513"
      />
      {/* Hull planks */}
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M ${110 + i * 4} ${380 + i * 30} L ${970 - i * 4} ${380 + i * 30} L ${910 - i * 6} ${500} L ${170 + i * 6} ${500} Z`}
          fill="none"
          stroke="#5D2E0C"
          strokeWidth="2"
          opacity="0.5"
        />
      ))}

      {/* Railing */}
      <rect x="90" y="356" width="900" height="30" fill="#6B3410" rx="4" />
      <rect x="90" y="350" width="900" height="12" fill="#8B4513" rx="4" />

      {/* Railing posts */}
      {[...Array(18)].map((_, i) => (
        <rect
          key={i}
          x={100 + i * 50}
          y="300"
          width="8"
          height="64"
          fill="#5D2E0C"
          rx="2"
        />
      ))}

      {/* Railing top rope */}
      <path
        d={`M 100 300 ${[...Array(18)]
          .map((_, i) => `L ${104 + i * 50} 290`)
          .join(" ")} L 972 300`}
        fill="none"
        stroke="#C8A96E"
        strokeWidth="4"
      />

      {/* Deck */}
      <rect x="90" y="300" width="900" height="56" fill="#A0522D" />
      {/* Deck planks */}
      {[...Array(7)].map((_, i) => (
        <rect
          key={i}
          x="90"
          y={308 + i * 8}
          width="900"
          height="3"
          fill="#8B4513"
          opacity="0.5"
        />
      ))}

      {/* Main mast */}
      <rect x="514" y="0" width="16" height="310" fill="#5D2E0C" rx="2" />

      {/* Crow's nest */}
      <rect x="486" y="80" width="72" height="36" fill="#6B3410" rx="4" />
      <rect x="480" y="76" width="84" height="10" fill="#8B4513" rx="2" />

      {/* Sail */}
      <path d="M 522 10 L 522 260 L 260 240 Z" fill="#F5F0DC" />
      <path d="M 522 10 L 522 260 L 780 240 Z" fill="#EDE8D0" />
      {/* Sail stripes */}
      <line x1="522" y1="80" x2="340" y2="78" stroke="#D4C8A0" strokeWidth="3" />
      <line x1="522" y1="140" x2="330" y2="136" stroke="#D4C8A0" strokeWidth="3" />
      <line x1="522" y1="200" x2="285" y2="194" stroke="#D4C8A0" strokeWidth="3" />
      <line x1="522" y1="80" x2="710" y2="78" stroke="#D4C8A0" strokeWidth="3" />
      <line x1="522" y1="140" x2="718" y2="136" stroke="#D4C8A0" strokeWidth="3" />
      <line x1="522" y1="200" x="705" y2="194" stroke="#D4C8A0" strokeWidth="3" />

      {/* Anchor symbol on sail */}
      <text x="522" y="170" textAnchor="middle" fontSize="60" fill="#8B4513" opacity="0.3">
        ⚓
      </text>

      {/* Flag */}
      <rect x="522" y="0" width="2" height="60" fill="#5D2E0C" />
      <path d="M 524 2 L 580 16 L 524 30 Z" fill="#E52222" />

      {/* Anchor on hull */}
      <text x="540" y="454" textAnchor="middle" fontSize="40" fill="#F4C430" opacity="0.6">
        ⚓
      </text>

      {/* Cannons */}
      <rect x="140" y="336" width="50" height="22" fill="#2A2A2A" rx="6" />
      <rect x="890" y="336" width="50" height="22" fill="#2A2A2A" rx="6" />
      <rect x="130" y="340" width="14" height="14" fill="#333" rx="7" />
      <rect x="944" y="340" width="14" height="14" fill="#333" rx="7" />

      {/* Lanterns */}
      <rect x="182" y="290" width="14" height="20" fill="#F4C430" rx="2" />
      <rect x="884" y="290" width="14" height="20" fill="#F4C430" rx="2" />
      <rect x="178" y="286" width="22" height="6" fill="#8B4513" rx="2" />
      <rect x="880" y="286" width="22" height="6" fill="#8B4513" rx="2" />
    </svg>
  );
};
