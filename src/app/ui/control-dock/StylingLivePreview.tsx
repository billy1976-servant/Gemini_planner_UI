"use client";

import React from "react";

const STYLING_LOOK: Record<
  string,
  { bg: string; border: string; shadow: string; radius: number; titleWeight: number }
> = {
  default: {
    bg: "#ffffff",
    border: "1px solid rgba(0,0,0,0.08)",
    shadow: "0 1px 3px rgba(0,0,0,0.06)",
    radius: 8,
    titleWeight: 600,
  },
  clean: {
    bg: "#fafafa",
    border: "1px solid rgba(0,0,0,0.06)",
    shadow: "none",
    radius: 4,
    titleWeight: 600,
  },
  minimal: {
    bg: "#ffffff",
    border: "1px solid #e5e7eb",
    shadow: "none",
    radius: 2,
    titleWeight: 500,
  },
  bold: {
    bg: "#1e293b",
    border: "none",
    shadow: "0 4px 12px rgba(0,0,0,0.25)",
    radius: 12,
    titleWeight: 700,
  },
  soft: {
    bg: "#f8fafc",
    border: "1px solid #e2e8f0",
    shadow: "0 2px 8px rgba(0,0,0,0.04)",
    radius: 16,
    titleWeight: 600,
  },
};

export type StylingLivePreviewProps = {
  presetName: string;
  size?: number;
};

/**
 * Renders a small live preview of a styling preset (default, clean, minimal, bold, soft).
 */
export default function StylingLivePreview({
  presetName,
  size = 80,
}: StylingLivePreviewProps) {
  const look = STYLING_LOOK[presetName] ?? STYLING_LOOK.default;
  const isDark = presetName === "bold";
  const textColor = isDark ? "#e2e8f0" : "#334155";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: look.radius,
        background: look.bg,
        border: look.border,
        boxShadow: look.shadow,
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 6,
          borderRadius: 2,
          background: textColor,
          fontWeight: look.titleWeight,
          opacity: 0.95,
        }}
      />
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: mutedColor,
          opacity: 0.7,
          width: "85%",
        }}
      />
    </div>
  );
}
