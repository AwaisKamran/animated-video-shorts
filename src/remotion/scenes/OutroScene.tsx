import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useVideoConfig } from "remotion";
import { T } from "../theme";
import { VideoScene } from "../../types";

interface Props {
  scene: VideoScene;
  frame: number;
  duration: number;
}

export const OutroScene: React.FC<Props> = ({ scene, frame, duration }) => {
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const logoIn  = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const lineIn  = interpolate(frame, [10, 36], [0, 1], { extrapolateRight: "clamp" });
  const ctaIn   = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 80, stiffness: 150 } });

  // logo 660×660 at top=160 → centre (540, 490)
  const logoScale = interpolate(logoIn, [0, 1], [0.80, 1]);
  const lineW     = interpolate(lineIn, [0, 1], [0, 560]);
  const ctaY      = interpolate(ctaIn, [0, 1], [40, 0]);
  const ctaOp     = interpolate(ctaIn, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
  const pulse     = 0.7 + 0.3 * Math.sin(frame * 0.055);

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: fadeIn }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          repeating-linear-gradient(0deg,  transparent, transparent 59px, rgba(255,255,255,0.022) 60px),
          repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.022) 60px)
        `,
        pointerEvents: "none",
      }} />

      {/* Spotlight — breathes with logo */}
      <div style={{
        position: "absolute",
        top: 40, left: 90,
        width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.cyan}28 0%, ${T.cyan}10 30%, transparent 65%)`,
        pointerEvents: "none",
        opacity: logoIn * pulse,
      }} />

      {/* ── LOGO ── */}
      <div style={{
        position: "absolute",
        top: 160, left: "50%",
        transform: `translateX(-50%) scale(${logoScale})`,
        opacity: Math.min(1, logoIn * 1.5),
        width: 660, height: 660,
      }}>
        <img
          src={staticFile("logo.png")}
          width={660}
          height={660}
          style={{ display: "block", mixBlendMode: "lighten" }}
        />
      </div>

      {/* ── SEPARATOR ── */}
      <div style={{
        position: "absolute",
        top: 870, left: "50%",
        transform: "translateX(-50%)",
        width: lineW, height: 1.5,
        background: `linear-gradient(to right, transparent, ${T.cyan} 20%, ${T.cyan} 80%, transparent)`,
        boxShadow: `0 0 18px 4px ${T.cyan}55`,
      }} />

      {/* ── CTA SECTION ── */}
      <div style={{
        position: "absolute",
        top: 1160, left: 60, right: 60,
        transform: `translateY(${ctaY}px)`,
        opacity: ctaOp,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 36,
      }}>
        <div style={{
          fontFamily: T.sans, fontSize: 32, fontWeight: 400,
          color: T.textSecondary, letterSpacing: -0.4,
          textAlign: "center", lineHeight: 1.4,
        }}>
          New concept every week.
        </div>

        {/* Primary CTA button */}
        <div style={{
          background: T.cyan,
          borderRadius: 100,
          padding: "28px 88px",
          fontFamily: T.sans,
          fontSize: 32, fontWeight: 800,
          color: "#141414",
          letterSpacing: 0.5,
          boxShadow: `0 0 72px ${T.cyan}66, 0 8px 32px rgba(0,0,0,0.35)`,
        }}>
          Follow for More
        </div>
      </div>

      {/* ── BOTTOM TAG ── */}
      <div style={{
        position: "absolute",
        bottom: 190, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, opacity: ctaOp,
      }}>
        <div style={{ width: 40, height: 1, background: `${T.cyan}70` }} />
        <div style={{
          fontFamily: T.sans, fontSize: 13, fontWeight: 600,
          color: `${T.cyan}B0`, letterSpacing: 4.5,
          textTransform: "uppercase" as const,
        }}>
          The Code Cruise
        </div>
        <div style={{ width: 40, height: 1, background: `${T.cyan}70` }} />
      </div>

      {/* Cinematic edge bars */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(to right, transparent, ${T.cyan}60, transparent)`,
        opacity: lineIn,
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(to right, transparent, ${T.cyan}60, transparent)`,
        opacity: lineIn,
      }} />
    </AbsoluteFill>
  );
};
