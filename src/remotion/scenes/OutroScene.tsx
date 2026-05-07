import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { T } from "../theme";
import { VideoScene } from "../../types";

interface Props {
  scene: VideoScene;
  frame: number;
  duration: number;
}

export const OutroScene: React.FC<Props> = ({ scene, frame, duration }) => {
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const ringIn  = spring({ frame, fps, config: { damping: 100, stiffness: 70 } });
  const textIn  = spring({ frame: Math.max(0, frame - 14), fps, config: { damping: 80, stiffness: 90 } });
  const ctaIn   = spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 90, stiffness: 80 } });

  const textY = interpolate(textIn, [0, 1], [30, 0]);
  const ctaY  = interpolate(ctaIn,  [0, 1], [30, 0]);
  const ringScale = interpolate(ringIn, [0, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {/* Ring decoration */}
      <div style={{
        position: "absolute",
        top: "18%", left: "50%",
        width: 520, height: 520,
        transform: `translate(-50%, 0) scale(${ringScale})`,
        borderRadius: "50%",
        border: `1px solid rgba(255,255,255,0.08)`,
        pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", inset: 40,
          borderRadius: "50%",
          border: `1px solid rgba(255,255,255,0.06)`,
        }} />
      </div>

      {/* Brand */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 80,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: T.sans, fontSize: 18, fontWeight: 600,
        color: T.textDim, letterSpacing: 6,
      }}>
        CODE CRUISE
      </div>

      {/* Final takeaway */}
      <div style={{
        position: "absolute",
        top: "28%", left: 72, right: 72,
        transform: `translateY(${textY}px)`,
        opacity: textIn,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: T.sans,
          fontSize: 52,
          fontWeight: 700,
          color: T.textPrimary,
          lineHeight: 1.2,
          letterSpacing: -1,
        }}>
          {scene.headline}
        </div>
        {scene.subtext && (
          <div style={{
            marginTop: 24,
            fontFamily: T.sans,
            fontSize: 28,
            fontWeight: 400,
            color: T.textSecondary,
            lineHeight: 1.5,
          }}>
            {scene.subtext}
          </div>
        )}
      </div>

      {/* Thin separator */}
      <div style={{
        position: "absolute",
        top: "65%", left: 100, right: 100,
        height: 1,
        background: T.border,
        opacity: ctaIn,
      }} />

      {/* CTA block */}
      <div style={{
        position: "absolute",
        top: "67%", left: 72, right: 72,
        transform: `translateY(${ctaY}px)`,
        opacity: ctaIn,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}>
        <div style={{
          fontFamily: T.sans,
          fontSize: 22,
          fontWeight: 400,
          color: T.textDim,
          letterSpacing: 4,
          marginTop: 40,
        }}>
          WANT MORE?
        </div>

        <div style={{
          background: T.cyan,
          borderRadius: 100,
          padding: "22px 64px",
          fontFamily: T.sans,
          fontSize: 26,
          fontWeight: 700,
          color: "#1A1A1A",
          letterSpacing: 1,
          boxShadow: `0 0 40px rgba(0,200,230,0.3)`,
        }}>
          FOLLOW NOW
        </div>

        <div style={{
          fontFamily: T.sans,
          fontSize: 22,
          fontWeight: 400,
          color: T.textSecondary,
          lineHeight: 1.8,
        }}>
          New concepts every week
        </div>
      </div>

      {/* Bottom wordmark */}
      <div style={{
        position: "absolute",
        bottom: 80, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 20, opacity: ctaIn,
      }}>
        <div style={{ width: 48, height: 1, background: T.border }} />
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: T.cyan, boxShadow: `0 0 12px ${T.cyan}`,
        }} />
        <div style={{ width: 48, height: 1, background: T.border }} />
      </div>
    </AbsoluteFill>
  );
};
