import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DiagramType } from "../types";
import { Background } from "./components/Background";
import { NetworkDiagram } from "./components/NetworkDiagram";

interface Props {
  diagramType: DiagramType;
  keyTerms?: string[];
}

export const DiagramPreview: React.FC<Props> = ({ diagramType, keyTerms = [] }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#505050" }}>
      <Background />
      <AbsoluteFill>
        <NetworkDiagram
          type={diagramType}
          frame={frame}
          duration={durationInFrames}
          keyTerms={keyTerms}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
