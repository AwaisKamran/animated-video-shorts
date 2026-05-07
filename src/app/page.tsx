"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { VideoScript } from "../types";

const Player = dynamic(
  () => import("@remotion/player").then((m) => m.Player),
  { ssr: false }
);

const NetworkingShortLazy = dynamic(
  () => import("../remotion/NetworkingShort").then((m) => m.NetworkingShort),
  { ssr: false }
);

const SUGGESTIONS = [
  "TCP Handshake", "How DNS Works", "HTTP vs HTTPS",
  "IP Addresses", "Packet Routing", "OSI Model",
  "What is a Firewall?", "UDP vs TCP", "What is a VPN?",
  "TLS / SSL", "NAT Explained", "Subnetting",
];

const DIAGRAM_COLORS: Record<string, string> = {
  handshake: "#00C8E6",
  dns:       "#7B5EF8",
  packet:    "#00D4A0",
  routing:   "#F5A623",
  osi:       "#7B5EF8",
  http:      "#00D4A0",
  firewall:  "#F5A623",
  none:      "#5E5E5E",
};

function SceneRow({ scene, index }: { scene: VideoScript["scenes"][0]; index: number }) {
  const accent = DIAGRAM_COLORS[scene.diagramType ?? "none"] ?? "#5E5E5E";
  const typeColors: Record<string, string> = {
    concept: accent,
  };

  return (
    <div style={{
      display: "flex", gap: 14, padding: "14px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Accent bar */}
      <div style={{
        width: 3, borderRadius: 2, flexShrink: 0,
        background: typeColors[scene.type],
        opacity: 0.8,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Meta */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
            color: "var(--text-3)", textTransform: "uppercase",
          }}>{scene.type}</span>
          {scene.diagramType && scene.diagramType !== "none" && (
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              color: accent, opacity: 0.8,
            }}>{scene.diagramType.toUpperCase()}</span>
          )}
          <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: "auto" }}>
            {scene.duration}s
          </span>
        </div>
        {/* Headline */}
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, marginBottom: 4 }}>
          {scene.headline}
        </div>
        {/* Subtext */}
        {scene.subtext && (
          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
            {scene.subtext}
          </div>
        )}
        {/* Voiceover */}
        {scene.voiceover && (
          <div style={{
            marginTop: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 6,
            padding: "8px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="13" rx="3" stroke="var(--text-3)" strokeWidth="2"/>
                <path d="M5 10v2a7 7 0 0014 0v-2" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="19" x2="12" y2="22" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", letterSpacing: 1.5 }}>
                VOICEOVER
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.65, fontStyle: "italic" }}>
              "{scene.voiceover}"
            </div>
          </div>
        )}
        {/* Key terms */}
        {scene.keyTerms && scene.keyTerms.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {scene.keyTerms.map((t, i) => (
              <span key={i} className="tag" style={{
                background: `${accent}18`,
                color: accent,
                border: `1px solid ${accent}30`,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const playerRef = useRef(null);

  const generate = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setScript(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      const d = await res.json();
      setScript(d.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [topic]);

  const totalFrames = script
    ? script.scenes.reduce((a, s) => a + s.duration * 30, 0)
    : 990;
  const totalSecs = script
    ? script.scenes.reduce((a, s) => a + s.duration, 0)
    : 0;

  const downloadVideo = useCallback(async () => {
    if (!script) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositionId: "NetworkingShort",
          inputProps: { script },
          durationInFrames: totalFrames,
          fps: 30,
          width: 1080,
          height: 1920,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Render failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${script.concept || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [script, totalFrames]);

  const copyCmd = useCallback(() => {
    if (!script) return;
    const propsJson = JSON.stringify({ script }).replace(/'/g, "'\\''");
    navigator.clipboard.writeText(
      `npx remotion render NetworkingShort output.mp4 --props='${propsJson}'`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [script]);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top nav */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 40px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "1.5px solid var(--border-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#00C8E6",
              boxShadow: "0 0 8px #00C8E6",
            }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0.3 }}>Code Cruise</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: 1 }}>/ shorts generator</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: "var(--cyan)",
            letterSpacing: 2, opacity: 0.7,
          }}>NETWORKING</div>
          <Link
            href="/test"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-2)",
              textDecoration: "none",
              letterSpacing: 0.3,
              opacity: 0.75,
            }}
          >
            Test Lab ↗
          </Link>
        </div>
      </nav>

      {/* Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 420px",
        gap: 0,
        maxWidth: 1320,
        margin: "0 auto",
        padding: "40px",
        minHeight: "calc(100vh - 60px)",
      }}>
        {/* LEFT */}
        <div style={{ paddingRight: 40, display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Topic input */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: 2, marginBottom: 12 }}>
              TOPIC
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && generate()}
                placeholder="e.g. TCP Handshake"
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={generate}
                disabled={loading || !topic.trim()}
                style={{ whiteSpace: "nowrap", minWidth: 120 }}
              >
                {loading
                  ? <><div className="spinner" /> Generating</>
                  : "Generate →"}
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: 2, marginBottom: 12 }}>
              SUGGESTIONS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={() => setTopic(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(245,80,107,0.08)",
              border: "1px solid rgba(245,80,107,0.3)",
              borderRadius: 8, padding: "14px 18px",
              fontSize: 13, color: "var(--coral)", lineHeight: 1.6,
            }}>
              {error}
            </div>
          )}

          {/* Script */}
          {script && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: 2 }}>
                  SCRIPT — {script.scenes.filter(s => s.type === "concept").length} SCENES · {totalSecs}s
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" onClick={copyCmd}
                    style={{ fontSize: 11, padding: "6px 14px" }}>
                    {copied ? "✓ Copied" : "Copy CLI"}
                  </button>
                  <button className="btn btn-ghost"
                    onClick={() => window.open("http://localhost:3001", "_blank")}
                    style={{ fontSize: 11, padding: "6px 14px" }}>
                    Open Studio ↗
                  </button>
                </div>
              </div>
              <div className="card" style={{ padding: "8px 20px" }}>
                {script.scenes.filter(s => s.type === "concept").map((scene, i) => (
                  <SceneRow key={i} scene={scene} index={i} />
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)", lineHeight: 2 }}>
                To render: <code style={{ color: "var(--cyan)", fontFamily: "var(--mono)" }}>npm run studio</code> → scrub → export, or run the CLI command.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Preview */}
        <div style={{
          position: "sticky",
          top: 40,
          alignSelf: "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: 2 }}>
            PREVIEW — 1080 × 1920
          </div>

          <div style={{
            border: "1px solid var(--border-md)",
            borderRadius: 12,
            overflow: "hidden",
            background: "#505050",
            aspectRatio: "9/16",
            width: "100%",
          }}>
            {script ? (
              <Player
                ref={playerRef}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                component={NetworkingShortLazy as any}
                inputProps={{ script }}
                durationInFrames={totalFrames}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={30}
                style={{ width: "100%", height: "100%" }}
                controls
                loop
                autoPlay
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                minHeight: 680,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                background: "#505050",
              }}>
                {/* Dot grid preview */}
                <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.4 }}>
                  <defs>
                    <pattern id="prev-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.12)" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#prev-dots)" />
                </svg>
                <div style={{ position: "relative", textAlign: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#00C8E6", boxShadow: "0 0 12px #00C8E6",
                    }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#A0A0A0", letterSpacing: 0.5 }}>
                    Enter a topic to preview
                  </div>
                </div>
              </div>
            )}
          </div>

          {script && (
            <button
              onClick={downloadVideo}
              disabled={downloading}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: downloading ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
                color: downloading ? "var(--text-3)" : "var(--text)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--sans)",
                cursor: downloading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                letterSpacing: 0.3,
                transition: "all 0.15s",
              }}
            >
              {downloading ? (
                <>
                  <div className="spinner" />
                  Rendering…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v13M12 16l-4-4m4 4l4-4M3 19h18"
                      stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download MP4
                </>
              )}
            </button>
          )}

          {script && (
            <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", lineHeight: 1.8 }}>
              {totalFrames} frames · {totalSecs}s · 30fps
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
