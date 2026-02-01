"use client";

import React from "react";
import {
  getOrganIds,
  getVariantIds,
  getOrganLabel,
} from "@/organs/organ-registry";

export type OrganPanelProps = {
  /** Organ IDs present on the current screen (from collectOrganIds). */
  organIds: string[];
  /** Current variant per organ from JSON (from collectOrganVariantsFromTree). */
  initialVariants: Record<string, string>;
  /** Runtime overrides: organId -> variantId (from panel dropdowns). */
  overrides: Record<string, string>;
  /** Called when user changes a variant in the panel. */
  onOverride: (organId: string, variantId: string) => void;
  /** Optional: show all organs (not just those on screen) for discovery. */
  showAllOrgans?: boolean;
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

export default function OrganPanel({
  organIds,
  initialVariants,
  overrides,
  onOverride,
  showAllOrgans = false,
}: OrganPanelProps) {
  const ids = showAllOrgans ? getOrganIds() : organIds;
  if (ids.length === 0) {
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
      {ids.map((organId) => {
        const variantIds = getVariantIds(organId);
        const currentVariant = overrides[organId] ?? initialVariants[organId] ?? "default";
        const label = getOrganLabel(organId);
        return (
          <div key={organId} style={ROW_STYLE}>
            <label style={LABEL_STYLE} htmlFor={`organ-${organId}`}>
              {label}
            </label>
            <select
              id={`organ-${organId}`}
              value={currentVariant}
              onChange={(e) => onOverride(organId, e.target.value)}
              style={SELECT_STYLE}
            >
              {variantIds.map((vid) => (
                <option key={vid} value={vid}>
                  {vid}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </aside>
  );
}
