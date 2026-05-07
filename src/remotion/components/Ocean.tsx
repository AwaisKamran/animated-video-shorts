import { useCurrentFrame } from "remotion";

export const Ocean: React.FC = () => {
  const frame = useCurrentFrame();
  const waveOffset = (frame * 2) % 200;

  return (
    <svg
      width="1080"
      height="1920"
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0533" />
          <stop offset="40%" stopColor="#0a1f5c" />
          <stop offset="100%" stopColor="#003580" />
        </linearGradient>
        <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#005f8a" />
          <stop offset="100%" stopColor="#001f3a" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="1080" height="1920" fill="url(#skyGrad)" />

      {/* Stars */}
      {[...Array(40)].map((_, i) => {
        const x = ((i * 137 + 50) % 1000) + 40;
        const y = ((i * 97 + 30) % 600) + 20;
        const twinkle = Math.sin(frame * 0.05 + i) > 0.3 ? 1 : 0.4;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={4}
            height={4}
            fill="white"
            opacity={twinkle}
          />
        );
      })}

      {/* Moon */}
      <circle cx="900" cy="120" r="48" fill="#FFF5CC" />
      <circle cx="920" cy="105" r="40" fill="#1a0533" />

      {/* Ocean */}
      <rect x="0" y="900" width="1080" height="1020" fill="url(#oceanGrad)" />

      {/* Wave rows */}
      {[0, 1, 2, 3, 4].map((row) => {
        const y = 900 + row * 60;
        const offset = (waveOffset + row * 40) % 200;
        const opacity = 0.6 - row * 0.1;
        return (
          <g key={row} opacity={opacity}>
            {[...Array(8)].map((_, i) => (
              <ellipse
                key={i}
                cx={i * 160 - offset + 80}
                cy={y}
                rx={70}
                ry={14}
                fill="#0099CC"
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <ellipse
                key={i + 8}
                cx={i * 160 - offset + 160}
                cy={y + 20}
                rx={70}
                ry={14}
                fill="#006994"
              />
            ))}
          </g>
        );
      })}

      {/* Ocean sheen */}
      <rect x="0" y="896" width="1080" height="8" fill="#4FC3F7" opacity="0.4" />
    </svg>
  );
};
