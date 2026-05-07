import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useVideoConfig } from "remotion";
import { T } from "../theme";
import { VideoScene, VideoScript } from "../../types";

interface Props {
  scene: VideoScene;
  script: VideoScript;
  frame: number;
  duration: number;
}

export const IntroScene: React.FC<Props> = ({ scene, script, frame, duration }) => {
  const { fps } = useVideoConfig();

  // ── Animations ──────────────────────────────────────────────────────────
  const fadeIn  = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // underdamped spring → satisfying pop with tiny overshoot
  const logoIn  = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const lineIn  = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  // overdamped → fast cinematic settle, no jitter
  const titleIn = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 80, stiffness: 200 } });
  const subIn   = spring({ frame: Math.max(0, frame - 36), fps, config: { damping: 60, stiffness: 150 } });
  const tagIn   = interpolate(frame, [52, 72], [0, 1], { extrapolateRight: "clamp" });

  const logoScale  = interpolate(logoIn, [0, 1], [0.80, 1]);
  const titleScale = interpolate(titleIn, [0, 1], [0.93, 1]);
  const titleOp    = interpolate(titleIn, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
  const subY       = interpolate(subIn, [0, 1], [36, 0]);
  const subOp      = interpolate(subIn, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
  const lineW      = interpolate(lineIn, [0, 1], [0, 600]);
  // subtle breathing on the spotlight glow
  const pulse      = 0.7 + 0.3 * Math.sin(frame * 0.055);

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: fadeIn }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Subtle grid texture */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          repeating-linear-gradient(0deg,  transparent, transparent 59px, rgba(255,255,255,0.022) 60px),
          repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.022) 60px)
        `,
        pointerEvents: "none",
      }} />

      {/* SPOTLIGHT — cyan radial glow at logo centre, breathes with the logo */}
      <div style={{
        position: "absolute",
        top: 30, left: 90,           // centre: x=540, y=480 → (540-450, 480-450)
        width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.cyan}28 0%, ${T.cyan}10 30%, transparent 65%)`,
        pointerEvents: "none",
        opacity: logoIn * pulse,
      }} />

      {/* Violet counter-glow — bottom half */}
      <div style={{
        position: "absolute", bottom: -300, left: "50%",
        transform: "translateX(-50%)",
        width: 800, height: 800, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.violet}14 0%, transparent 55%)`,
        pointerEvents: "none",
      }} />

      {/* ── LOGO ── 720×720, bg matches T.bg → only white artwork visible */}
      <div style={{
        position: "absolute",
        top: 120, left: "50%",
        transform: `translateX(-50%) scale(${logoScale})`,
        opacity: Math.min(1, logoIn * 1.5),
        width: 720, height: 720,
      }}>
        <img
          src={staticFile("logo.png")}
          width={720}
          height={720}
          style={{ display: "block", mixBlendMode: "lighten" }}
        />
      </div>

      {/* ── SEPARATOR ── glowing cyan rule, grows from centre */}
      <div style={{
        position: "absolute",
        top: 882, left: "50%",
        transform: "translateX(-50%)",
        width: lineW, height: 1.5,
        background: `linear-gradient(to right, transparent, ${T.cyan} 20%, ${T.cyan} 80%, transparent)`,
        boxShadow: `0 0 18px 4px ${T.cyan}55`,
      }} />

      {/* ── TITLE ── cinematic scale-in */}
      <div style={{
        position: "absolute",
        top: 932, left: 48, right: 48,
        transform: `scale(${titleScale})`,
        transformOrigin: "center top",
        opacity: titleOp,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: T.sans,
          fontSize: 90,
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: -3,
          lineHeight: 1.04,
          textShadow: "none",
        }}>
          {script.title}
        </div>
      </div>

      {/* ── SUBTITLE ── slides up */}
      <div style={{
        position: "absolute",
        top: 1190, left: 80, right: 80,
        transform: `translateY(${subY}px)`,
        opacity: subOp,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: T.sans,
          fontSize: 30,
          fontWeight: 400,
          color: T.textSecondary,
          letterSpacing: -0.3,
          lineHeight: 1.55,
        }}>
          {script.subtitle}
        </div>
      </div>

      {/* ── BOTTOM TAG ── minimal branded accent */}
      <div style={{
        position: "absolute",
        bottom: 190, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, opacity: tagIn,
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

      {/* Top + bottom edge bars — cinematic framing */}
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
