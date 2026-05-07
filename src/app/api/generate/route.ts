import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { VideoScript } from "../../../types";

const SYSTEM_PROMPT = `You are a script writer for "Code Cruise" — a minimalist, professional Instagram short series that explains networking concepts through clean animated diagrams and concise text.

VISUAL STYLE: Dark charcoal background (#505050), geometric shapes, thin lines, electric cyan and violet accents. No characters. Text-driven with animated SVG diagrams.

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown, no explanation:
{
  "title": "2-4 word title in CAPS",
  "subtitle": "One-line hook or question (under 44 chars)",
  "concept": "kebab-case-slug",
  "scenes": [
    {
      "type": "concept",
      "headline": "Short, punchy insight (max 60 chars)",
      "subtext": "One sentence detail or context (max 100 chars)",
      "voiceover": "Natural spoken script for this scene — what the creator records as audio. Conversational, engaging. Timed to match the scene duration (~2.5 words/sec).",
      "diagramType": "handshake|dns|packet|routing|osi|http|firewall|switch|nat|dhcp|arp|vpn|pubkey|tls|proxy|revproxy|cdn|subnet|bgp|none",
      "keyTerms": ["TERM"],
      "duration": 7
    }
  ]
}

RULES:
- All scenes: type "concept" — start directly with content, no intro or outro
- 6-8 concept scenes (enough to fill 60 seconds)
- Total duration: 55–65 seconds
- Tone: Clear, authoritative, educational. No fluff. No metaphors needed.
- Headlines are SHORT and PUNCHY — like a slide title
- Subtext adds one sentence of depth or context
- Choose the best diagramType per scene:
  * TCP/connection/handshake → "handshake"
  * DNS/domain resolution → "dns"
  * Packets/headers/anatomy → "packet"
  * Routing/hops/TTL → "routing"
  * OSI/layers/protocols → "osi"
  * HTTP/HTTPS comparison → "http"
  * Firewall/security rules → "firewall"
  * Layer 2 switching/MAC → "switch"
  * NAT/address translation → "nat"
  * DHCP/IP assignment → "dhcp"
  * ARP/address resolution → "arp"
  * VPN/tunnel → "vpn"
  * Public/private key/asymmetric → "pubkey"
  * TLS handshake/certificates → "tls"
  * Forward proxy/anonymity → "proxy"
  * Reverse proxy/load balancing → "revproxy"
  * CDN/edge caching → "cdn"
  * Subnetting/CIDR/masks → "subnet"
  * BGP/autonomous systems → "bgp"
  * Pure text/concept → "none"
- keyTerms: 1-2 exact technical terms to highlight visually (empty array if none)
- voiceover: Natural spoken audio script for each scene. Conversational, not robotic.
  * ~20 words per 8 seconds of duration
  * Write as if you're speaking directly to camera — no bullet points, no headers
- Think: what would look great on a clean diagram?`;

export async function POST(request: Request) {
  const { topic } = await request.json();

  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_GEMINI_API_KEY not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(
      `Generate a Code Cruise short for this networking topic: "${topic.trim()}"`
    );

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON in response");

    const script = JSON.parse(jsonMatch[0]) as VideoScript;
    if (!script.title || !script.scenes || !Array.isArray(script.scenes)) {
      throw new Error("Invalid script structure from AI");
    }

    script.scenes = script.scenes.map((scene) => ({
      ...scene,
      duration: Math.max(4, Math.min(15, scene.duration ?? 8)),
      diagramType: scene.diagramType ?? "none",
      keyTerms: scene.keyTerms ?? [],
    }));

    return NextResponse.json({ script });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate script" },
      { status: 500 }
    );
  }
}
