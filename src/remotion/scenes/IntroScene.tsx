import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
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

  const fadeIn  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const ringIn  = spring({ frame, fps, config: { damping: 100, stiffness: 80 } });
  const titleIn = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 80, stiffness: 100 } });
  const subIn   = spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 80, stiffness: 80 } });
  const dotsIn  = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  const RING_SIZE = 480;
  const titleY  = interpolate(titleIn, [0, 1], [40, 0]);
  const subY    = interpolate(subIn,   [0, 1], [30, 0]);
  const ringScale = interpolate(ringIn, [0, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Brand bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 80,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: T.sans, fontSize: 18, fontWeight: 600,
        color: T.textDim, letterSpacing: 6,
      }}>
        CODE CRUISE
      </div>

      {/* Central ring */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: RING_SIZE, height: RING_SIZE,
        transform: `translate(-50%, -60%) scale(${ringScale})`,
        borderRadius: "50%",
        border: `1.5px solid rgba(255,255,255,0.14)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Inner ring */}
        <div style={{
          width: RING_SIZE * 0.75, height: RING_SIZE * 0.75,
          borderRadius: "50%",
          border: `1px solid rgba(255,255,255,0.08)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Accent dot */}
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            background: T.cyan,
            boxShadow: `0 0 24px ${T.cyan}`,
          }} />
        </div>
      </div>

      {/* Title */}
      <div style={{
        position: "absolute",
        top: "42%", left: 80, right: 80,
        transform: `translateY(${titleY}px)`,
        opacity: titleIn,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: T.sans,
          fontSize: 76,
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: -2,
          lineHeight: 1.1,
          textShadow: "none",
        }}>
          {script.title}
        </div>
      </div>

      {/* Subtitle */}
      <div style={{
        position: "absolute",
        top: "62%", left: 100, right: 100,
        transform: `translateY(${subY}px)`,
        opacity: subIn,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: T.sans,
          fontSize: 32,
          fontWeight: 400,
          color: T.textSecondary,
          letterSpacing: -0.5,
          lineHeight: 1.5,
        }}>
          {script.subtitle}
        </div>
      </div>

      {/* Category badge */}
      <div style={{
        position: "absolute",
        top: "75%", left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: dotsIn,
      }}>
        <div style={{
          background: `rgba(0,200,230,0.12)`,
          border: `1px solid ${T.cyan}`,
          borderRadius: 100,
          padding: "10px 28px",
          fontFamily: T.sans,
          fontSize: 18,
          fontWeight: 600,
          color: T.cyan,
          letterSpacing: 4,
        }}>
          NETWORKING
        </div>
      </div>

      {/* Bottom brand */}
      <div style={{
        position: "absolute",
        bottom: 80, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, opacity: dotsIn,
      }}>
        <div style={{ width: 40, height: 1, background: T.border }} />
        <div style={{ fontFamily: T.sans, fontSize: 14, color: T.textDim, letterSpacing: 3 }}>
          CODE CRUISE
        </div>
        <div style={{ width: 40, height: 1, background: T.border }} />
      </div>
    </AbsoluteFill>
  );
};
