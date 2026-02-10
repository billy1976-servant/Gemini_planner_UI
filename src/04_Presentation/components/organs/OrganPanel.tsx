"use client";

import React, { useState, useRef, useEffect } from "react";
import { getOrganLabel } from "@/components/organs";
import { getSectionLayoutIds, getAllowedCardPresetsForSectionPreset, evaluateCompatibility, getAvailableSlots } from "@/layout";
import { getInternalLayoutIds } from "@/layout-organ";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import LayoutTilePicker from "@/app/ui/control-dock/layout/LayoutTilePicker";
import type { LayoutTileOption } from "@/app/ui/control-dock/layout/LayoutTilePicker";
import LayoutLivePreview from "@/app/ui/control-dock/layout/LayoutLivePreview";
import PreviewRender from "@/app/ui/control-dock/layout/PreviewRender";
import {
  getSectionLayoutThumbnail,
  getCardLayoutThumbnail,
  getOrganLayoutThumbnail,
} from "@/app/ui/control-dock/layout/layoutThumbnails";

type LayoutViewMode = "text" | "visual" | "live";
type LayoutMode = "section" | "internal";

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
  /**
   * Currently loaded screen root (same object passed to main JsonRenderer).
   * When set, live mode uses PreviewRender with this model for section/card thumbnails.
   */
  screenModel?: any;
  /** Default state for the loaded screen (e.g. json?.state). */
  defaultState?: any;
  /** Experience/template profile for the loaded screen. */
  profileOverride?: any;
  /** Screen key for the loaded screen (e.g. from URL ?screen=). */
  screenKey?: string;
};

const PANEL_STYLE: React.CSSProperties = {
  width: "var(--organ-panel-width)",
  minWidth: "var(--organ-panel-width)",
  maxWidth: "100%",
  flexShrink: 0,
  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  borderLeft: "none",
  padding: "var(--spacing-5)",
  overflowY: "auto",
  overflowX: "hidden",
  fontSize: "var(--font-size-sm)",
  boxShadow: "-4px 0 16px rgba(0,0,0,0.04)",
  boxSizing: "border-box",
};

const TITLE_STYLE: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: "var(--spacing-4)",
  color: "rgba(0,0,0,0.82)",
};

const ROW_STYLE: React.CSSProperties = {
  marginBottom: "var(--spacing-4)",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  marginBottom: "var(--spacing-2)",
  color: "rgba(0,0,0,0.6)",
};

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "var(--spacing-2) var(--spacing-3)",
  borderRadius: "10px",
  border: "1px solid rgba(0,0,0,0.08)",
  background: "#ffffff",
  fontSize: "inherit",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
  screenModel,
  defaultState,
  profileOverride,
  screenKey: screenKeyProp,
}: OrganPanelProps) {
  const [layoutViewMode, setLayoutViewMode] = useState<LayoutViewMode>("visual");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("section");
  const panelScrollRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (panelScrollRef.current) panelScrollRef.current.scrollTop = 0;
  }, [layoutMode]);
  const rowIds = sectionKeysForPreset ?? [];
  const allSectionLayoutIds = getSectionLayoutIds();

  /** Section layout display order (UI only). Default first, then spec order, then any remaining. */
  const SECTION_LAYOUT_ORDER = [
    "",
    "content-narrow",
    "content-stack",
    "feature-grid-3",
    "features-grid-3",
    "hero-full-bleed-image",
    "hero-split",
    "hero-split-image-right",
    "hero-split-image-left",
    "hero-centered",
    "cta-centered",
    "image-left-text-right",
    "testimonial-band",
    "test-extensible",
  ];
  /** Internal layout display order (UI only). */
  const INTERNAL_LAYOUT_ORDER = ["", "banner", "strip", "split", "full-width"];

  function orderSectionOptions(ids: string[]): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const id of SECTION_LAYOUT_ORDER) {
      if (ids.includes(id) && !seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
    return ordered;
  }

  function orderInternalOptions(ids: string[]): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const id of INTERNAL_LAYOUT_ORDER) {
      if (ids.includes(id) && !seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
    return ordered;
  }

  /** Deduplicate options by id (keep first). */
  function dedupeOptions<T extends { id: string }>(options: T[]): T[] {
    const seen = new Set<string>();
    return options.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  }

  if (rowIds.length === 0) {
    return (
      <aside style={PANEL_STYLE} data-organ-panel>
        <div style={TITLE_STYLE}>Layout</div>
        <p style={{ color: "rgba(0,0,0,0.5)", margin: 0 }}>
          No sections on this screen. Load a website-style app (e.g. demo-blueprint-site).
        </p>
      </aside>
    );
  }

  const fireSectionChange = (sectionKey: string, value: string) => {
    const target = `section-layout-preset-${sectionKey}`;
    PipelineDebugStore.setLastEvent({ time: Date.now(), type: "change", target });
    window.dispatchEvent(
      new CustomEvent("action", {
        detail: { type: "Action", params: { name: "state:update", key: `sectionLayoutPreset.${sectionKey}`, value } },
      })
    );
    onSectionLayoutPresetOverride?.(sectionKey, value);
  };
  const fireCardChange = (sectionKey: string, value: string) => {
    const target = `card-layout-preset-${sectionKey}`;
    PipelineDebugStore.setLastEvent({ time: Date.now(), type: "change", target });
    window.dispatchEvent(
      new CustomEvent("action", {
        detail: { type: "Action", params: { name: "state:update", key: `cardLayoutPreset.${sectionKey}`, value } },
      })
    );
    onCardLayoutPresetOverride?.(sectionKey, value);
  };
  const fireOrganChange = (sectionKey: string, value: string) => {
    const target = `organ-internal-layout-${sectionKey}`;
    PipelineDebugStore.setLastEvent({ time: Date.now(), type: "change", target });
    window.dispatchEvent(
      new CustomEvent("action", {
        detail: { type: "Action", params: { name: "state:update", key: `organInternalLayout.${sectionKey}`, value } },
      })
    );
    onOrganInternalLayoutOverride?.(sectionKey, value);
  };

  return (
    <aside ref={panelScrollRef} style={PANEL_STYLE} data-organ-panel>
      <div style={TITLE_STYLE}>Layout controls</div>
      <p style={{ color: "rgba(0,0,0,0.5)", marginBottom: "var(--spacing-4)", marginTop: 0, fontSize: "var(--font-size-xs)" }}>
        Section layout, card layout, and organ internal layout (dev). Applies to this screen only.
      </p>
      <div style={{ marginBottom: "var(--spacing-4)", display: "flex", gap: "var(--spacing-2)", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--font-size-xs)", color: "rgba(0,0,0,0.55)" }}>Mode:</span>
        {(["visual", "live", "text"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setLayoutViewMode(mode)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: layoutViewMode === mode ? "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)" : "rgba(255,255,255,0.9)",
              color: layoutViewMode === mode ? "#fff" : "rgba(0,0,0,0.8)",
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
              boxShadow: layoutViewMode === mode ? "0 2px 6px rgba(59, 130, 246, 0.35)" : "0 1px 3px rgba(0,0,0,0.06)",
              transition: "background 0.2s ease, box-shadow 0.2s ease",
              textTransform: "capitalize",
            }}
          >
            {mode === "live" ? "Live" : mode === "visual" ? "Visual" : "Text"}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: "var(--spacing-4)", display: "flex", gap: 0, alignItems: "stretch", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px", overflow: "hidden", background: "rgba(255,255,255,0.6)" }}>
        {(["section", "internal"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setLayoutMode(mode)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              background: layoutMode === mode ? "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)" : "transparent",
              color: layoutMode === mode ? "#fff" : "rgba(0,0,0,0.7)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease, color 0.2s ease",
              textTransform: "capitalize",
            }}
          >
            {mode === "section" ? "Sections" : "Internal"}
          </button>
        ))}
      </div>
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

        const availableSlots = sectionNode != null ? getAvailableSlots(sectionNode) : [];
        const hasCardSlot = availableSlots.includes("card_list");

        // Dev-only: card pipeline diagnostics (plan step 2)
        if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
          const cardTileOptionsLength = 1 + cardOptionsFiltered.length;
          const cardUIOnlyDefault = onCardLayoutPresetOverride != null && cardTileOptionsLength === 1;
          console.log("[OrganPanel] card pipeline", {
            sectionKey,
            currentSectionPreset: currentSectionPreset || "(empty)",
            allowedCardPresets,
            cardOptionsFiltered,
            organId: organId ?? "(none)",
            hasCardSlot,
            availableSlots,
            cardUIOnlyDefault,
            onCardLayoutPresetOverridePresent: !!onCardLayoutPresetOverride,
          });
        }

        const rowHeight = sectionHeights[sectionKey];
        const rowBlockStyle: React.CSSProperties = {
          ...ROW_STYLE,
          minHeight: rowHeight != null && rowHeight > 0 ? rowHeight : MIN_ROW_HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          paddingTop: "var(--spacing-3)",
          paddingBottom: "var(--spacing-3)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        };

        const useLivePreview = layoutViewMode === "live" && screenModel != null;
        const pickerMode = useLivePreview ? "stack" : "grid";
        const sectionOptionsOrdered = orderSectionOptions(sectionOptionsFiltered);
        const sectionTileOptions: LayoutTileOption[] = dedupeOptions([
          {
            id: "",
            label: "(default)",
            thumbnail:
              layoutViewMode === "live" ? (
                useLivePreview ? (
                  <PreviewRender
                    screenModel={screenModel}
                    previewType="sectionLayout"
                    previewValue=""
                    sectionKey={sectionKey}
                    currentSectionPreset={currentSectionPreset}
                    defaultState={defaultState}
                    profileOverride={profileOverride}
                    screenKey={screenKeyProp}
                  />
                ) : (
                  <LayoutLivePreview layoutId="" width={160} height={120} />
                )
              ) : (
                getSectionLayoutThumbnail("")
              ),
          },
          ...sectionOptionsOrdered.map((id) => ({
            id,
            label: id,
            thumbnail:
              layoutViewMode === "live" ? (
                useLivePreview ? (
                  <PreviewRender
                    key={id}
                    screenModel={screenModel}
                    previewType="sectionLayout"
                    previewValue={id}
                    sectionKey={sectionKey}
                    currentSectionPreset={currentSectionPreset}
                    defaultState={defaultState}
                    profileOverride={profileOverride}
                    screenKey={screenKeyProp}
                  />
                ) : (
                  <LayoutLivePreview key={id} layoutId={id} width={160} height={120} />
                )
              ) : (
                getSectionLayoutThumbnail(id)
              ),
          })),
        ]);
        const cardTileOptions: LayoutTileOption[] = [
          {
            id: "",
            label: "(default)",
            thumbnail:
              useLivePreview ? (
                <PreviewRender
                  screenModel={screenModel}
                  previewType="cardLayout"
                  previewValue=""
                  sectionKey={sectionKey}
                  currentSectionPreset={currentSectionPreset}
                  defaultState={defaultState}
                  profileOverride={profileOverride}
                  screenKey={screenKeyProp}
                />
              ) : (
                getCardLayoutThumbnail("")
              ),
          },
          ...cardOptionsFiltered.map((id) => ({
            id,
            label: id,
            thumbnail: useLivePreview ? (
              <PreviewRender
                key={id}
                screenModel={screenModel}
                previewType="cardLayout"
                previewValue={id}
                sectionKey={sectionKey}
                currentSectionPreset={currentSectionPreset}
                defaultState={defaultState}
                profileOverride={profileOverride}
                screenKey={screenKeyProp}
              />
            ) : (
              getCardLayoutThumbnail(id)
            ),
          })),
        ];
        const organOptionsOrdered = orderInternalOptions(organOptionsFiltered);
        const organTileOptions: LayoutTileOption[] = dedupeOptions([
          { id: "", label: "(default)" },
          ...organOptionsOrdered.map((id) => ({
            id,
            label: id,
            thumbnail: getOrganLayoutThumbnail(id),
          })),
        ]);

        return (
          <div key={sectionKey} style={rowBlockStyle}>
            <div style={{ ...LABEL_STYLE, fontWeight: 600 }}>{label}</div>
            {layoutViewMode !== "text" ? (
              <>
                {layoutMode === "section" && (
                  <>
                    {onSectionLayoutPresetOverride && (
                      <LayoutTilePicker
                        title="Section Layout"
                        value={currentSectionPreset}
                        options={sectionTileOptions}
                        onChange={(id) => fireSectionChange(sectionKey, id)}
                        mode={pickerMode}
                        variant="section"
                      />
                    )}
                    {onCardLayoutPresetOverride && hasCardSlot && (
                      <LayoutTilePicker
                        title="Card Layout"
                        value={currentCardPreset}
                        options={cardTileOptions}
                        onChange={(id) => fireCardChange(sectionKey, id)}
                        mode={pickerMode}
                      />
                    )}
                  </>
                )}
                {layoutMode === "internal" && onOrganInternalLayoutOverride && organId && organTileOptions.length > 1 && (
                  <LayoutTilePicker
                    title="Internal layout (organ)"
                    value={currentInternalLayout}
                    options={organTileOptions}
                    onChange={(id) => fireOrganChange(sectionKey, id)}
                    mode="grid"
                    variant="internal"
                  />
                )}
              </>
            ) : layoutViewMode === "text" ? (
              <>
                {layoutMode === "section" && onSectionLayoutPresetOverride && (
                  <>
                    <label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-1)" }} htmlFor={`section-layout-preset-${sectionKey}`}>
                      Section Layout
                    </label>
                    <select
                      id={`section-layout-preset-${sectionKey}`}
                      value={currentSectionPreset}
                      onChange={(e) => {
                        const value = e.target.value;
                        fireSectionChange(sectionKey, value);
                      }}
                      style={SELECT_STYLE}
                    >
                      <option value="">(default)</option>
                      {orderSectionOptions(sectionOptionsFiltered).map((pid) => (
                        <option key={pid} value={pid}>
                          {pid}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {layoutMode === "section" && onCardLayoutPresetOverride && hasCardSlot && (
                  <>
                    <label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-2)" }} htmlFor={`card-layout-preset-${sectionKey}`}>
                      Card Layout
                    </label>
                    <select
                      id={`card-layout-preset-${sectionKey}`}
                      value={currentCardPreset}
                      onChange={(e) => fireCardChange(sectionKey, e.target.value)}
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
                {layoutMode === "internal" && onOrganInternalLayoutOverride && organId && organOptionsOrdered.length > 0 && (
                  <>
                    <label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-2)" }} htmlFor={`organ-internal-layout-${sectionKey}`}>
                      Internal layout (organ)
                    </label>
                    <select
                      id={`organ-internal-layout-${sectionKey}`}
                      value={currentInternalLayout}
                      onChange={(e) => fireOrganChange(sectionKey, e.target.value)}
                      style={SELECT_STYLE}
                    >
                      <option value="">(default)</option>
                      {organOptionsOrdered.map((lid) => (
                        <option key={lid} value={lid}>
                          {lid}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}
