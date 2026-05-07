import React from "react";
import { Composition } from "remotion";
import { NetworkingShort } from "./NetworkingShort";
import { DiagramPreview } from "./DiagramPreview";
import { VideoScript, DiagramType } from "../types";

interface Props { script: VideoScript }

const DEFAULT_SCRIPT: VideoScript = {
  title: "TCP HANDSHAKE",
  subtitle: "How two computers connect",
  concept: "tcp-handshake",
  scenes: [
    {
      type: "concept",
      headline: "What is TCP?",
      subtext: "Transmission Control Protocol — the internet's guaranteed delivery system. Every web request uses it.",
      voiceover: "TCP stands for Transmission Control Protocol. It's the layer of the internet that makes sure data actually arrives — in the right order, with nothing missing. Every HTTP request, every email, every file download runs on top of it.",
      diagramType: "none",
      keyTerms: ["TCP"],
      duration: 8,
    },
    {
      type: "concept",
      headline: "Why a handshake?",
      subtext: "Before data flows, both sides must agree they're ready. The 3-way handshake sets that up.",
      voiceover: "Before any data can flow, the client and server need to agree they're both online and ready to communicate. That agreement is the handshake — and it happens in exactly three steps.",
      diagramType: "handshake",
      duration: 8,
    },
    {
      type: "concept",
      headline: "Step 1: SYN",
      subtext: "Your browser sends a SYN packet — 'I want to connect. Are you there?'",
      voiceover: "Step one: your browser sends a SYN packet — short for synchronize. It's essentially saying: hey server, I want to open a connection. Are you there? Can we talk?",
      diagramType: "handshake",
      keyTerms: ["SYN"],
      duration: 8,
    },
    {
      type: "concept",
      headline: "Step 2: SYN-ACK",
      subtext: "Server replies SYN-ACK — 'I hear you. I'm ready. Let's talk.'",
      voiceover: "Step two: the server responds with SYN-ACK — synchronize-acknowledge. It's saying: I got your message, I'm online, and I'm ready to receive. Now your turn to confirm.",
      diagramType: "handshake",
      keyTerms: ["SYN-ACK"],
      duration: 8,
    },
    {
      type: "concept",
      headline: "Step 3: ACK",
      subtext: "Browser confirms with ACK. Connection is established. Data can now flow.",
      voiceover: "Step three: your browser sends back an ACK — acknowledge. Connection confirmed. Both sides are in sync. From this point on, actual data starts moving across the wire.",
      diagramType: "handshake",
      keyTerms: ["ACK"],
      duration: 8,
    },
    {
      type: "concept",
      headline: "TCP vs UDP",
      subtext: "TCP guarantees delivery and order. UDP skips the handshake — faster, but no guarantees.",
      voiceover: "So why doesn't everything use TCP? Speed. UDP skips the handshake entirely — great for video calls or gaming where a dropped packet is better than a delayed one. TCP trades speed for reliability.",
      diagramType: "none",
      keyTerms: ["UDP"],
      duration: 8,
    },
  ],
};

function getTotalFrames(script: VideoScript, fps: number) {
  return script.scenes.reduce((acc, s) => acc + s.duration * fps, 0);
}

export const RemotionRoot: React.FC = () => {
  const fps = 30;
  const totalFrames = getTotalFrames(DEFAULT_SCRIPT, fps);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = NetworkingShort as any;

  return (
    <>
      <Composition
        id="NetworkingShort"
        component={Comp}
        durationInFrames={totalFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{ script: DEFAULT_SCRIPT }}
        calculateMetadata={async ({ props }: { props: Record<string, unknown> }) => {
          const s = props.script as VideoScript;
          return { durationInFrames: getTotalFrames(s, fps) };
        }}
      />
      <Composition
        id="DiagramPreview"
        component={DiagramPreview as any}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={700}
        defaultProps={{ diagramType: "handshake" as DiagramType, keyTerms: [] as string[] }}
      />
    </>
  );
};
