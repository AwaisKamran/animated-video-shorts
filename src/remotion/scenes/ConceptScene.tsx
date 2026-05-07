import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { T } from "../theme";
import { VideoScene } from "../../types";
import { NetworkDiagram } from "../components/NetworkDiagram";
import { InfoPanel } from "../components/InfoPanel";

interface Props {
  scene: VideoScene;
  frame: number;
  duration: number;
  sceneIndex: number;
  totalScenes: number;
}

const ACCENT_CYCLE = [T.cyan, T.violet, T.mint, T.amber, T.cyan];

export const ConceptScene: React.FC<Props> = ({
  scene, frame, duration, sceneIndex, totalScenes,
}) => {
  const hasDiagram = !!scene.diagramType && scene.diagramType !== "none";
  const accent = ACCENT_CYCLE[sceneIndex % ACCENT_CYCLE.length];

  const brandFade = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const sepFade   = interpolate(frame, [8, 24], [0, 1], { extrapolateRight: "clamp" });
  const progFade  = interpolate(frame, [12, 28], [0, 1], { extrapolateRight: "clamp" });

  // Info panel starts at frame 10
  const infoPanelFrame = Math.max(0, frame - 10);

  return (
    <AbsoluteFill>
      {/* Brand bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 80,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 60px",
        opacity: brandFade,
      }}>
        <div style={{
          fontFamily: T.sans, fontSize: 16, fontWeight: 600,
          color: T.textDim, letterSpacing: 5,
        }}>
          CODE CRUISE
        </div>
        {/* Accent dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: accent,
          boxShadow: `0 0 12px ${accent}`,
        }} />
      </div>

      {/* Diagram area */}
      {hasDiagram && (
        <div style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          height: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <NetworkDiagram
            type={scene.diagramType!}
            frame={frame}
            duration={duration}
            keyTerms={scene.keyTerms}
          />
        </div>
      )}

      {/* No-diagram: large concept visual placeholder */}
      {!hasDiagram && (
        <div style={{
          position: "absolute",
          top: 80, left: 0, right: 0, height: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: sepFade,
        }}>
          <div style={{
            width: 200, height: 200, borderRadius: "50%",
            border: `1.5px solid rgba(255,255,255,0.10)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: accent, boxShadow: `0 0 24px ${accent}`,
            }} />
          </div>
        </div>
      )}

      {/* Separator line */}
      <div style={{
        position: "absolute",
        top: 800,
        left: 60, right: 60,
        height: 1,
        background: T.border,
        opacity: sepFade,
      }} />

      {/* Info panel */}
      <div style={{
        position: "absolute",
        top: 820,
        left: 0, right: 0,
        bottom: 200,
      }}>
        <InfoPanel
          headline={scene.headline}
          subtext={scene.subtext}
          keyTerms={scene.keyTerms}
          frame={infoPanelFrame}
          accentColor={accent}
        />
      </div>

      {/* Scene progress dots */}
      <div style={{
        position: "absolute",
        bottom: 80,
        left: 0, right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 10,
        opacity: progFade,
      }}>
        {Array.from({ length: totalScenes - 2 }).map((_, i) => {
          // -2 to exclude intro and outro
          const conceptIdx = sceneIndex - 1; // sceneIndex 0 = intro
          const isActive = i === conceptIdx - 1 + 1; // adjust
          const isPast   = i < conceptIdx;
          return (
            <div key={i} style={{
              width: isActive ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: isActive ? accent : isPast ? T.textDim : T.border,
              transition: "width 0.3s",
            }} />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
