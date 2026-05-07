import React from "react";

type IconType = "laptop" | "server" | "router" | "browser" | "dns" | "cloud" | "shield" | "lock" | "globe" | "switch" | "key" | "phone" | "database" | "loadbalancer";

interface Props {
  type: IconType;
  size?: number;
  color?: string;
}

export const NodeIcon: React.FC<Props> = ({ type, size = 36, color = "#FFFFFF" }) => {
  const s = size;
  const h = s * 0.85;

  switch (type) {
    case "laptop":
      return (
        <svg width={s} height={h} viewBox="0 0 36 30">
          <rect x="4" y="2" width="28" height="18" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
          <rect x="7" y="5" width="22" height="12" rx="1" fill={color} opacity="0.2" />
          <path d="M0 22 Q18 24 36 22 L33 28 Q18 30 3 28 Z" fill={color} opacity="0.4" />
          <rect x="14" y="20" width="8" height="2" rx="1" fill={color} opacity="0.6" />
        </svg>
      );
    case "server":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <rect x="4" y="4" width="28" height="8" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
          <rect x="4" y="14" width="28" height="8" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
          <rect x="4" y="24" width="28" height="8" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
          <circle cx="27" cy="8" r="2" fill={color} opacity="0.8" />
          <circle cx="27" cy="18" r="2" fill={color} opacity="0.8" />
          <circle cx="27" cy="28" r="2" fill={color} opacity="0.5" />
          <rect x="8" y="6.5" width="12" height="3" rx="1" fill={color} opacity="0.3" />
          <rect x="8" y="16.5" width="12" height="3" rx="1" fill={color} opacity="0.3" />
        </svg>
      );
    case "router":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="8" fill="none" stroke={color} strokeWidth="1.8" />
          <circle cx="18" cy="18" r="2.5" fill={color} opacity="0.9" />
          <line x1="18" y1="4" x2="18" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="18" y1="26" x2="18" y2="32" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="4" y1="18" x2="10" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="26" y1="18" x2="32" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "browser":
      return (
        <svg width={s} height={h} viewBox="0 0 36 30">
          <rect x="2" y="2" width="32" height="26" rx="3" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="2" y1="10" x2="34" y2="10" stroke={color} strokeWidth="1.5" opacity="0.6" />
          <circle cx="8" cy="6" r="2" fill={color} opacity="0.5" />
          <circle cx="14" cy="6" r="2" fill={color} opacity="0.5" />
          <rect x="18" y="4" width="12" height="4" rx="2" fill={color} opacity="0.2" />
          <rect x="5" y="14" width="26" height="2" rx="1" fill={color} opacity="0.2" />
          <rect x="5" y="19" width="20" height="2" rx="1" fill={color} opacity="0.2" />
          <rect x="5" y="24" width="14" height="2" rx="1" fill={color} opacity="0.2" />
        </svg>
      );
    case "dns":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <rect x="4" y="4" width="28" height="28" rx="3" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="4" y1="14" x2="32" y2="14" stroke={color} strokeWidth="1.2" opacity="0.5" />
          <line x1="4" y1="22" x2="32" y2="22" stroke={color} strokeWidth="1.2" opacity="0.5" />
          <rect x="8" y="8" width="6" height="4" rx="1" fill={color} opacity="0.5" />
          <rect x="16" y="8" width="12" height="4" rx="1" fill={color} opacity="0.2" />
          <rect x="8" y="16" width="6" height="4" rx="1" fill={color} opacity="0.5" />
          <rect x="16" y="16" width="12" height="4" rx="1" fill={color} opacity="0.2" />
          <rect x="8" y="24" width="6" height="4" rx="1" fill={color} opacity="0.5" />
          <rect x="16" y="24" width="8" height="4" rx="1" fill={color} opacity="0.2" />
        </svg>
      );
    case "cloud":
      return (
        <svg width={s} height={h} viewBox="0 0 36 28">
          <path
            d="M10 22 Q4 22 4 16 Q4 10 10 10 Q10 4 18 4 Q26 4 26 10 Q32 10 32 16 Q32 22 26 22 Z"
            fill="none" stroke={color} strokeWidth="1.8"
          />
        </svg>
      );
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <path d="M18 4 L30 9 L30 18 Q30 27 18 32 Q6 27 6 18 L6 9 Z" fill="none" stroke={color} strokeWidth="1.8" />
          <path d="M13 18 L16 21 L23 14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "lock":
      return (
        <svg width={s * 0.75} height={s} viewBox="0 0 28 36">
          <rect x="4" y="16" width="20" height="16" rx="3" fill="none" stroke={color} strokeWidth="1.8" />
          <path d="M8 16 L8 11 Q8 4 14 4 Q20 4 20 11 L20 16" fill="none" stroke={color} strokeWidth="1.8" />
          <circle cx="14" cy="24" r="2.5" fill={color} opacity="0.8" />
          <line x1="14" y1="26" x2="14" y2="29" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "globe":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="1.8" />
          <ellipse cx="18" cy="18" rx="7" ry="14" fill="none" stroke={color} strokeWidth="1.2" opacity="0.6" />
          <line x1="4" y1="18" x2="32" y2="18" stroke={color} strokeWidth="1.2" opacity="0.6" />
          <line x1="6" y1="11" x2="30" y2="11" stroke={color} strokeWidth="1" opacity="0.4" />
          <line x1="6" y1="25" x2="30" y2="25" stroke={color} strokeWidth="1" opacity="0.4" />
        </svg>
      );
    case "switch":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <rect x="4" y="12" width="28" height="12" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="9" y1="12" x2="9" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="15" y1="12" x2="15" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="21" y1="12" x2="21" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="27" y1="12" x2="27" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="9" y1="24" x2="9" y2="28" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="15" y1="24" x2="15" y2="28" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="21" y1="24" x2="21" y2="28" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="27" y1="24" x2="27" y2="28" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="9" cy="18" r="2" fill={color} opacity="0.7" />
          <circle cx="15" cy="18" r="2" fill={color} opacity="0.7" />
          <circle cx="21" cy="18" r="2" fill={color} opacity="0.7" />
          <circle cx="27" cy="18" r="2" fill={color} opacity="0.4" />
        </svg>
      );
    case "key":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <circle cx="12" cy="16" r="8" fill="none" stroke={color} strokeWidth="1.8" />
          <circle cx="12" cy="16" r="3.5" fill={color} opacity="0.3" />
          <line x1="19" y1="19" x2="32" y2="26" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="27" y1="23" x2="27" y2="27" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="30" y1="24.5" x2="30" y2="28.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "phone":
      return (
        <svg width={s * 0.65} height={s} viewBox="0 0 24 36">
          <rect x="3" y="2" width="18" height="32" rx="3" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="3" y1="8" x2="21" y2="8" stroke={color} strokeWidth="1.2" opacity="0.5" />
          <line x1="3" y1="28" x2="21" y2="28" stroke={color} strokeWidth="1.2" opacity="0.5" />
          <circle cx="12" cy="32" r="1.5" fill={color} opacity="0.6" />
          <rect x="7" y="12" width="10" height="6" rx="1" fill={color} opacity="0.2" />
          <rect x="7" y="20" width="6" height="2" rx="1" fill={color} opacity="0.2" />
        </svg>
      );
    case "database":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <ellipse cx="18" cy="9" rx="12" ry="5" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="6" y1="9" x2="6" y2="27" stroke={color} strokeWidth="1.8" />
          <line x1="30" y1="9" x2="30" y2="27" stroke={color} strokeWidth="1.8" />
          <ellipse cx="18" cy="27" rx="12" ry="5" fill="none" stroke={color} strokeWidth="1.8" />
          <ellipse cx="18" cy="18" rx="12" ry="5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    case "loadbalancer":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36">
          <polygon points="18,4 32,18 18,32 4,18" fill="none" stroke={color} strokeWidth="1.8" />
          <circle cx="18" cy="18" r="4" fill={color} opacity="0.4" />
          <line x1="18" y1="14" x2="18" y2="4" stroke={color} strokeWidth="1.2" opacity="0.5" />
          <line x1="22" y1="18" x2="32" y2="18" stroke={color} strokeWidth="1.2" opacity="0.5" />
          <line x1="18" y1="22" x2="18" y2="32" stroke={color} strokeWidth="1.2" opacity="0.5" />
          <line x1="14" y1="18" x2="4" y2="18" stroke={color} strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
};
