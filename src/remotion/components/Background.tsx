import React from "react";

export const Background: React.FC = () => (
  <svg
    width="1080"
    height="1920"
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", top: 0, left: 0 }}
  >
    <defs>
      <pattern id="dots" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.045)" />
      </pattern>
    </defs>
    <rect width="1080" height="1920" fill="#505050" />
    <rect width="1080" height="1920" fill="url(#dots)" />
  </svg>
);
