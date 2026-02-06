"use client";

import React from "react";
import { getOrganLabel } from "@/organs";
import { getSectionLayoutIds, getAllowedCardPresetsForSectionPreset, evaluateCompatibility } from "@/layout";
import { getInternalLayoutIds } from "@/layout-organ";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";

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
  /** Section key -> organ id (role) for sections that are organs; used for internal layout dropdown only. */
  organIdBySectionKey?: Record<string, string>;
  /** Per-section organ internal layout overrides (sectionKey -> internalLayoutId). Dev/testing only. */
  organInternalLayoutOverrides?: Record<string, string>;
  /** Called when user changes organ internal layout for a section. Do not mix with section layout. */
  onOrganInternalLayoutOverride?: (sectionKey: string, internalLayoutId: string) => void;
  /** Section key -> section node; used for compatibility evaluation only (read-only). */
  sectionNodesByKey?: Record<string, any>;
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
  organIdBySectionKey = {},
  organInternalLayoutOverrides = {},
  onOrganInternalLayoutOverride,
  sectionNodesByKey,
}: OrganPanelProps) {
  const rowIds = sectionKeysForPreset ?? [];
  const allSectionLayoutIds = getSectionLayoutIds();

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
        Section layout, card layout, and organ internal layout (dev). Applies to this screen only.
      </p>
      {rowIds.map((sectionKey) => {
        const label = sectionLabels?.[sectionKey] ?? getOrganLabel(sectionKey);
        const sectionNode = sectionNodesByKey?.[sectionKey] ?? null;
        const presetOptions = sectionPresetOptions?.[sectionKey] ?? allSectionLayoutIds;
        const currentSectionPreset = sectionLayoutPresetOverrides[sectionKey] ?? "";
        const rawCardPreset = cardLayoutPresetOverrides[sectionKey] ?? "";
        const allowedCardPresets = getAllowedCardPresetsForSectionPreset(currentSectionPreset || null);
        const currentCardPreset =
          rawCardPreset && allowedCardPresets.includes(rawCardPreset) ? rawCardPreset : "";
        const organId = organIdBySectionKey[sectionKey];
        const internalLayoutIds = organId ? getInternalLayoutIds(organId) : [];
        const currentInternalLayout = organInternalLayoutOverrides[sectionKey] ?? "";

        const sectionOptionsFiltered =
          sectionNode != null
            ? presetOptions.filter((candidateId) =>
                evaluateCompatibility({
                  sectionNode,
                  sectionLayoutId: candidateId,
                  cardLayoutId: currentCardPreset || null,
                  organId: organId ?? null,
                  organInternalLayoutId: currentInternalLayout || null,
                }).sectionValid
              )
            : presetOptions;
        const cardOptionsFiltered =
          sectionNode != null
            ? allowedCardPresets.filter((candidateId) =>
                evaluateCompatibility({
                  sectionNode,
                  sectionLayoutId: currentSectionPreset || null,
                  cardLayoutId: candidateId,
                  organId: organId ?? null,
                  organInternalLayoutId: currentInternalLayout || null,
                }).cardValid
              )
            : allowedCardPresets;
        const organOptionsFiltered =
          sectionNode != null && organId
            ? internalLayoutIds.filter(
                (candidateId) =>
                  evaluateCompatibility({
                    sectionNode,
                    sectionLayoutId: currentSectionPreset || null,
                    cardLayoutId: currentCardPreset || null,
                    organId,
                    organInternalLayoutId: candidateId,
                  }).organValid !== false
              )
            : internalLayoutIds;

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
                  onChange={(e) => {
                    const value = e.target.value;
                    const presetId = value;
                    console.log("FLOW 1 — UI VALUE", {
                      sectionId: sectionKey,
                      selected: presetId,
                    });
                    const target = `section-layout-preset-${sectionKey}`;
                    PipelineDebugStore.setLastEvent({ time: Date.now(), type: "change", target });
                    window.dispatchEvent(
                      new CustomEvent("action", {
                        detail: {
                          type: "Action",
                          params: {
                            name: "state:update",
                            key: `sectionLayoutPreset.${sectionKey}`,
                            value,
                          },
                        },
                      })
                    );
                    onSectionLayoutPresetOverride?.(sectionKey, value);
                  }}
                  style={SELECT_STYLE}
                >
                  <option value="">(default)</option>
                  {sectionOptionsFiltered.map((pid) => (
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
                  onChange={(e) => {
                    const value = e.target.value;
                    const target = `card-layout-preset-${sectionKey}`;
                    PipelineDebugStore.setLastEvent({ time: Date.now(), type: "change", target });
                    window.dispatchEvent(
                      new CustomEvent("action", {
                        detail: {
                          type: "Action",
                          params: {
                            name: "state:update",
                            key: `cardLayoutPreset.${sectionKey}`,
                            value,
                          },
                        },
                      })
                    );
                    onCardLayoutPresetOverride?.(sectionKey, value);
                  }}
                  style={SELECT_STYLE}
                >
                  <option value="">(default)</option>
                  {cardOptionsFiltered.map((pid) => (
                    <option key={pid} value={pid}>
                      {pid}
                    </option>
                  ))}
                </select>
              </>
            )}
            {onOrganInternalLayoutOverride && organId && internalLayoutIds.length > 0 && (
              <>
                <label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-2)" }} htmlFor={`organ-internal-layout-${sectionKey}`}>
                  Internal layout (organ)
                </label>
                <select
                  id={`organ-internal-layout-${sectionKey}`}
                  value={currentInternalLayout}
                  onChange={(e) => {
                    const value = e.target.value;
                    const target = `organ-internal-layout-${sectionKey}`;
                    PipelineDebugStore.setLastEvent({ time: Date.now(), type: "change", target });
                    window.dispatchEvent(
                      new CustomEvent("action", {
                        detail: {
                          type: "Action",
                          params: {
                            name: "state:update",
                            key: `organInternalLayout.${sectionKey}`,
                            value,
                          },
                        },
                      })
                    );
                    onOrganInternalLayoutOverride?.(sectionKey, value);
                  }}
                  style={SELECT_STYLE}
                >
                  <option value="">(default)</option>
                  {organOptionsFiltered.map((lid) => (
                    <option key={lid} value={lid}>
                      {lid}
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
