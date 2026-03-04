"use client";

import React from "react";

type Props = { screenId: string | undefined };

/**
 * Dev-only: small badge showing current screen ID. Only render when screenId is defined.
 */
export default function ScreenIdBadge({ screenId }: Props) {
  if (!screenId) return null;
  return (
    <div
      data-screen-id-badge
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 9997,
        padding: "4px 8px",
        fontSize: 11,
        fontFamily: "monospace",
        background: "rgba(0,0,0,0.75)",
        color: "#e5e7eb",
        borderRadius: 4,
      }}
    >
      Screen ID: {screenId}
    </div>
  );
}
