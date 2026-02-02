"use client";

import React from "react";
import { getOrganLabel } from "@/organs/organ-registry";
import { getAllSectionPresetIds } from "@/layout/section-layout-presets";
import { getAllowedCardPresetsForSectionPreset } from "@/layout/layout-capabilities";

export type OrganPanelProps = {
  /** Section keys to show layout preset for (from collectSectionKeysAndNodes). */
  sectionKeysForPreset: string[];
  /** Human-readable label per section key (e.g. "Gallery 1", "Hero"). */
  sectionLabels?: Record<string, string>;
  /** Per-section section layout preset overrides (sectionKey -> presetId). */
  sectionLayoutPresetOverrides?: Record<string, string>;
  /** Called when user changes section layout preset for a section. */
  onSectionLayoutPresetOverride?: (sectionKey: string, presetId: string) => void;
  /** Per-section card layout preset overrides (sectionKey -> presetId). */
  cardLayoutPresetOverrides?: Record<string, string>;
  /** Called when user changes card layout preset for a section. */
  onCardLayoutPresetOverride?: (sectionKey: string, presetId: string) => void;
  /** Preset options per section key (sectionKey -> preset ids). If missing, all presets shown. */
  sectionPresetOptions?: Record<string, string[]>;
  /** Measured height per section key so each row aligns with its section in the main content. */
  sectionHeights?: Record<string, number>;
};

const PANEL_STYLE: React.CSSProperties = {
  width: "var(--organ-panel-width)",
  minWidth: "var(--organ-panel-width)",
  flexShrink: 0,
  background: "var(--color-bg-secondary)",
  borderLeft: "1px solid var(--color-border)",
  padding: "var(--spacing-4)",
  overflowY: "auto",
  fontSize: "var(--font-size-sm)",
};

const TITLE_STYLE: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: "var(--spacing-3)",
  color: "var(--color-text-primary)",
};

const ROW_STYLE: React.CSSProperties = {
  marginBottom: "var(--spacing-3)",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  marginBottom: "var(--spacing-1)",
  color: "var(--color-text-secondary)",
};

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "var(--spacing-2)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-primary)",
  fontSize: "inherit",
};

const MIN_ROW_HEIGHT = 80;

export default function OrganPanel({
  sectionKeysForPreset,
  sectionLabels,
  sectionLayoutPresetOverrides = {},
  onSectionLayoutPresetOverride,
  cardLayoutPresetOverrides = {},
  onCardLayoutPresetOverride,
  sectionPresetOptions,
  sectionHeights = {},
}: OrganPanelProps) {
  const rowIds = sectionKeysForPreset ?? [];
  const allSectionPresetIds = getAllSectionPresetIds();

  if (rowIds.length === 0) {
    return (
      <aside style={PANEL_STYLE} data-organ-panel>
        <div style={TITLE_STYLE}>Layout</div>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          No sections on this screen. Load a website-style app (e.g. demo-blueprint-site).
        </p>
      </aside>
    );
  }

  return (
    <aside style={PANEL_STYLE} data-organ-panel>
      <div style={TITLE_STYLE}>Layout controls</div>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--spacing-3)", marginTop: 0, fontSize: "var(--font-size-xs)" }}>
        Section layout and card layout. Applies to this screen only.
      </p>
      {rowIds.map((sectionKey) => {
        const label = sectionLabels?.[sectionKey] ?? getOrganLabel(sectionKey);
        const presetOptions = sectionPresetOptions?.[sectionKey] ?? allSectionPresetIds;
        const currentSectionPreset = sectionLayoutPresetOverrides[sectionKey] ?? "";
        const rawCardPreset = cardLayoutPresetOverrides[sectionKey] ?? "";
        const allowedCardPresets = getAllowedCardPresetsForSectionPreset(currentSectionPreset || null);
        const currentCardPreset =
          rawCardPreset && allowedCardPresets.includes(rawCardPreset) ? rawCardPreset : "";
        if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("[OrganPanel] Layout preset state", {
            sectionKey,
            currentSectionPreset,
            currentCardPreset,
            allowedCardPresets,
          });
        }
        const rowHeight = sectionHeights[sectionKey];
        const rowBlockStyle: React.CSSProperties = {
          ...ROW_STYLE,
          minHeight: rowHeight != null && rowHeight > 0 ? rowHeight : MIN_ROW_HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          paddingTop: "var(--spacing-2)",
          paddingBottom: "var(--spacing-2)",
          borderBottom: "1px solid var(--color-border)",
        };

        return (
          <div key={sectionKey} style={rowBlockStyle}>
            <div style={{ ...LABEL_STYLE, fontWeight: 600 }}>{label}</div>
            {onSectionLayoutPresetOverride && (
              <>
                <label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-1)" }} htmlFor={`section-layout-preset-${sectionKey}`}>
                  Section Layout
                </label>
                <select
                  id={`section-layout-preset-${sectionKey}`}
                  value={currentSectionPreset}
                  onChange={(e) => onSectionLayoutPresetOverride(sectionKey, e.target.value)}
                  style={SELECT_STYLE}
                >
                  <option value="">(default)</option>
                  {presetOptions.map((pid) => (
                    <option key={pid} value={pid}>
                      {pid}
                    </option>
                  ))}
                </select>
              </>
            )}
            {onCardLayoutPresetOverride && (
              <>
                <label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-2)" }} htmlFor={`card-layout-preset-${sectionKey}`}>
                  Card Layout
                </label>
                <select
                  id={`card-layout-preset-${sectionKey}`}
                  value={currentCardPreset}
                  onChange={(e) => onCardLayoutPresetOverride(sectionKey, e.target.value)}
                  style={SELECT_STYLE}
                >
                  <option value="">(default)</option>
                  {allowedCardPresets.map((pid) => (
                    <option key={pid} value={pid}>
                      {pid}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        );
      })}
    </aside>
  );
}
