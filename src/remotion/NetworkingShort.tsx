import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { VideoScript } from "../types";
import { Background } from "./components/Background";
import { ConceptScene } from "./scenes/ConceptScene";
import { OutroScene } from "./scenes/OutroScene";

interface Props { script: VideoScript }

export const NetworkingShort: React.FC<Props> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let cumulativeFrames = 0;
  let currentScene = script.scenes[0];
  let sceneStartFrame = 0;
  let sceneIndex = 0;

  for (let i = 0; i < script.scenes.length; i++) {
    const sceneDuration = script.scenes[i].duration * fps;
    if (frame < cumulativeFrames + sceneDuration) {
      currentScene = script.scenes[i];
      sceneStartFrame = cumulativeFrames;
      sceneIndex = i;
      break;
    }
    cumulativeFrames += sceneDuration;
  }

  const frameInScene = frame - sceneStartFrame;
  const sceneDurationFrames = currentScene.duration * fps;

  return (
    <AbsoluteFill style={{ background: "#505050" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      <Background />

      {currentScene.type === "concept" && (
        <ConceptScene
          scene={currentScene}
          frame={frameInScene}
          duration={sceneDurationFrames}
          sceneIndex={sceneIndex}
          totalScenes={script.scenes.length}
        />
      )}
      {currentScene.type === "outro" && (
        <OutroScene
          scene={currentScene}
          frame={frameInScene}
          duration={sceneDurationFrames}
        />
      )}
    </AbsoluteFill>
  );
};
