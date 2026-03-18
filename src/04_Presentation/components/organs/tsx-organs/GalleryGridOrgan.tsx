"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-gallerygrid";

/** Palette-only tokens for standalone placeholder (no fallback values). Minimal span per contract. */
const STANDALONE_PLACEHOLDER_STYLE: React.CSSProperties = {
  color: "var(--color-text-secondary)",
  fontSize: "var(--font-size-sm)",
  padding: "var(--spacing-3)",
};

export function GalleryGridOrgan({ organId, slots, className }: OrganProps<"galleryGrid">) {
  const s = slots ?? {};
  const hasItems = s["galleryGrid.items"];
  const main = hasItems ?? s["galleryGrid.emptyState"];
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["galleryGrid.header"]}
      {main ?? (
        <span style={STANDALONE_PLACEHOLDER_STYLE}>Gallery grid (standalone — add items via organism)</span>
      )}
    </Section>
  );
}
