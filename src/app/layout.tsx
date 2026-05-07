import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "⚓ The Code Cruise — Networking Shorts Generator",
  description: "Generate pixel-art Instagram shorts that explain networking concepts with Captain Mario and his crew!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
