"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-filterbar";

/** Palette-only tokens for standalone placeholder (no fallback values). */
const STANDALONE_PLACEHOLDER_STYLE: React.CSSProperties = {
  color: "var(--color-text-secondary)",
  fontSize: "var(--font-size-sm)",
  padding: "var(--spacing-2) 0",
};

export function FilterBarOrgan({ organId, slots, onAction, className }: OrganProps<"filterBar">) {
  const s = slots ?? {};
  const controls = s["filterBar.controls"];
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {controls ?? <span style={STANDALONE_PLACEHOLDER_STYLE}>Filter bar (standalone — add content via organism)</span>}
    </Section>
  );
}
