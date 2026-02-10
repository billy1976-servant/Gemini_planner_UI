"use client";

import React from "react";
import { palettes } from "@/palettes";

export type PaletteLivePreviewProps = {
  paletteName: string;
  /** Size of the preview (default 80) */
  size?: number;
};

/**
 * Renders a small live preview of a palette: surface, text, and primary button.
 * Uses actual palette colors from the registry.
 */
export default function PaletteLivePreview({
  paletteName,
  size = 80,
}: PaletteLivePreviewProps) {
  const palette = (palettes as Record<string, { color?: Record<string, string> }>)[paletteName];
  const c = palette?.color ?? {};
  const surface = c.surface ?? "#ffffff";
  const primary = c.primary ?? "#1565c0";
  const onPrimary = c.onPrimary ?? "#ffffff";
  const onSurface = c.onSurface ?? "#1a1d21";
  const outline = c.outline ?? "#bdc1c6";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: surface,
        border: `1px solid ${outline}`,
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        boxSizing: "border-box",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          height: 6,
          borderRadius: 2,
          background: onSurface,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: onSurface,
          opacity: 0.5,
          width: "80%",
        }}
      />
      <div
        style={{
          marginTop: "auto",
          height: 8,
          borderRadius: 4,
          background: primary,
          width: "70%",
        }}
      />
    </div>
  );
}
