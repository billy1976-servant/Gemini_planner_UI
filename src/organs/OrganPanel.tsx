"use client";

import React from "react";
import {
  getOrganIds,
  getVariantIds,
  getOrganLabel,
} from "@/organs/organ-registry";
import { getAllSectionPresetIds } from "@/layout/section-layout-presets";

export type OrganPanelProps = {
  /** Organ IDs present on the current screen (from collectOrganIds). */
  organIds: string[];
  /** Current variant per organ from JSON (from collectOrganVariantsFromTree). */
  initialVariants: Record<string, string>;
  /** Runtime overrides: organId -> variantId (from panel dropdowns). */
  overrides: Record<string, string>;
  /** Called when user changes a variant in the panel. Variant dropdown uses ONLY this. */
  onOverrideVariant: (organId: string, variantId: string) => void;
  /** Optional: show all organs (not just those on screen) for discovery. */
  showAllOrgans?: boolean;
  /** Section keys to show layout preset for (e.g. organIds or Section roles from tree). Defaults to same as row ids. */
  sectionKeysForPreset?: string[];
  /** Human-readable label per section key (e.g. "Gallery 1", "Hero"). */
  sectionLabels?: Record<string, string>;
  /** Role per section key for variant lookup (e.g. "gallery", "hero"). */
  sectionRoleByKey?: Record<string, string>;
  /** Per-section layout preset overrides (sectionKey -> presetId). */
  sectionLayoutPresetOverrides?: Record<string, string>;
  /** Called when user changes layout preset for a section. */
  onSectionLayoutPresetOverride?: (sectionKey: string, presetId: string) => void;
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
  organIds,
  initialVariants,
  overrides,
  onOverrideVariant,
  showAllOrgans = false,
  sectionKeysForPreset,
  sectionLabels,
  sectionRoleByKey,
  sectionLayoutPresetOverrides = {},
  onSectionLayoutPresetOverride,
  sectionPresetOptions,
  sectionHeights = {},
}: OrganPanelProps) {
  const ids = showAllOrgans ? getOrganIds() : organIds;
  const rowIds = (sectionKeysForPreset?.length ? sectionKeysForPreset : ids) as string[];
  const allPresetIds = getAllSectionPresetIds();

  if (rowIds.length === 0) {
    return (
      <aside style={PANEL_STYLE} data-organ-panel>
        <div style={TITLE_STYLE}>Organs</div>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          No organ components on this screen. Load a website-style app (e.g. demo-blueprint-site) to test variants.
        </p>
      </aside>
    );
  }

  return (
    <aside style={PANEL_STYLE} data-organ-panel>
      <div style={TITLE_STYLE}>Organ variants</div>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--spacing-3)", marginTop: 0, fontSize: "var(--font-size-xs)" }}>
        Change header and nav layout here. Applies to this screen only.
      </p>
      {rowIds.map((sectionKey) => {
        const roleForVariant = sectionRoleByKey?.[sectionKey] ?? sectionKey;
        const variantIds = getVariantIds(roleForVariant);
        const hasVariant = variantIds.length > 0;
        const currentVariant = overrides[sectionKey] ?? initialVariants[sectionKey] ?? "default";
        const label = sectionLabels?.[sectionKey] ?? getOrganLabel(sectionKey);
        const presetOptions = sectionPresetOptions?.[sectionKey] ?? allPresetIds;
        const currentPreset = sectionLayoutPresetOverrides[sectionKey] ?? "";
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
            <label style={LABEL_STYLE} htmlFor={`organ-${sectionKey}`}>
              {label}
            </label>
            {hasVariant && (
              <select
                id={`organ-${sectionKey}`}
                value={currentVariant}
                onChange={(e) => onOverrideVariant(sectionKey, e.target.value)}
                style={SELECT_STYLE}
              >
                {variantIds.map((vid) => (
                  <option key={vid} value={vid}>
                    {vid}
                  </option>
                ))}
              </select>
            )}
            {onSectionLayoutPresetOverride && (
              <>
                <label style={{ ...LABEL_STYLE, marginTop: hasVariant ? "var(--spacing-2)" : 0 }} htmlFor={`layout-preset-${sectionKey}`}>
                  Layout Preset
                </label>
                <select
                  id={`layout-preset-${sectionKey}`}
                  value={currentPreset}
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
          </div>
        );
      })}
    </aside>
  );
}
