"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";

/**
 * JSX screen that inherits all sidebar JSON choices:
 * - Palette (colors, spacing, fonts, radius, gap) via CSS variables from layout root
 * - Experience, Layout mode, Template, Styling preset, Behavior profile via state
 * Change any option in the right sidebar to see this screen update.
 */
export default function JSX_Palette_Test() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const values = state?.values ?? {};
  const experience = (values.experience ?? "website") as string;
  const layoutMode = (values.layoutMode ?? "template") as string;
  const templateId = (values.templateId ?? "") as string;
  const paletteName = (values.paletteName ?? "default") as string;
  const stylingPreset = (values.stylingPreset ?? "default") as string;
  const behaviorProfile = (values.behaviorProfile ?? "default") as string;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-family-base, var(--font-family-sans), system-ui, sans-serif)",
        padding: "var(--spacing-xl, 1.5rem)",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontSize: "var(--font-size-headline, var(--font-size-xl, 1.5rem))",
          fontWeight: "var(--font-weight-bold, 700)",
          marginBottom: "var(--spacing-lg, 1rem)",
          color: "var(--color-text-primary)",
        }}
      >
        JSX Palette Test
      </h1>
      <p
        style={{
          fontSize: "var(--font-size-base, 1rem)",
          color: "var(--color-text-secondary)",
          marginBottom: "var(--spacing-2xl, 2rem)",
        }}
      >
        This screen uses only palette CSS variables and state. Change the sidebar options to see it update.
      </p>

      {/* Sidebar choices — inherited from state */}
      <section
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md, 0.5rem)",
          padding: "var(--spacing-lg)",
          marginBottom: "var(--spacing-xl)",
          boxShadow: "var(--shadow-sm, none)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: "var(--font-weight-semibold)",
            marginBottom: "var(--spacing-md)",
            color: "var(--color-text-primary)",
          }}
        >
          Sidebar state (inherited)
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: "var(--gap-sm)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          <li><strong>Experience:</strong> {experience}</li>
          <li><strong>Layout mode:</strong> {layoutMode}</li>
          <li><strong>Template:</strong> {templateId || "(none)"}</li>
          <li><strong>Palette:</strong> {paletteName}</li>
          <li><strong>Styling preset:</strong> {stylingPreset}</li>
          <li><strong>Behavior profile:</strong> {behaviorProfile}</li>
        </ul>
      </section>

      {/* Palette-driven UI blocks */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--gap-lg)",
        }}
      >
        <div
          style={{
            background: "var(--color-primary)",
            color: "var(--color-on-primary)",
            padding: "var(--spacing-md)",
            borderRadius: "var(--radius-lg)",
            minWidth: 140,
          }}
        >
          Primary
        </div>
        <div
          style={{
            background: "var(--color-surface-1)",
            color: "var(--color-text-primary)",
            padding: "var(--spacing-md)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            minWidth: 140,
          }}
        >
          Surface
        </div>
        <div
          style={{
            background: "var(--color-bg-muted)",
            color: "var(--color-text-muted)",
            padding: "var(--spacing-md)",
            borderRadius: "var(--radius-sm)",
            minWidth: 140,
          }}
        >
          Muted
        </div>
      </div>

      <section
        style={{
          marginTop: "var(--spacing-2xl)",
          padding: "var(--spacing-xl)",
          background: "var(--color-bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--font-size-title, var(--font-size-lg))",
            fontWeight: "var(--font-weight-semibold)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          Typography & spacing from palette
        </h2>
        <p style={{ fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-relaxed)", marginBottom: "var(--spacing-md)" }}>
          Body text uses <code>--font-size-body</code>, <code>--line-height-relaxed</code>. Gaps and padding use <code>--spacing-*</code> and <code>--gap-*</code>.
        </p>
        <p style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>
          Caption size and muted color.
        </p>
      </section>
    </div>
  );
}
