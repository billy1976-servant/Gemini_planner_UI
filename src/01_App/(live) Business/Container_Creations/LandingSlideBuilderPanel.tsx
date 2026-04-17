"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  getDevicePreviewMode,
  setDevicePreviewMode,
  subscribeDevicePreviewMode,
  type DeviceMode,
} from "@/07_Dev_Tools/dev/device-preview-store";
import { learnDeckVersionDisplayLabel } from "@/lib/deck-platform/learn-launcher-utils";

export type SlideBuilderSlideRow = {
  id: string;
  stepLabel: string;
  title: string;
  layout: string;
  /** Friendly recipe label (slide builder layer); layout string stays for advanced users. */
  slideTypeLabel: string;
};

type LandingSlideBuilderPanelProps = {
  slides: SlideBuilderSlideRow[];
  /** Phase 2.5: catalog-driven deck flow picker (`appKey/flowKey` values). */
  catalogFlowOptions?: { value: string; label: string }[] | null;
  catalogFlowValue?: string;
  showCatalogFlowSelect?: boolean;
  onCatalogFlowChange?: (value: string) => void;
  deckVersion: string;
  deckVariant: string;
  variantOptions: { value: string; label: string }[];
  /**
   * When set, replaces legacy landing-1/2/3 options with learn version stems; labels show `{stem}.json`.
   */
  versionOptions?: { value: string; label: string }[] | null;
  /** When false, hides schema/variant row (generic flows without schema overrides). */
  showVariantSelect?: boolean;
  /** Label for the second select (legacy "variant" or generic "Schema"). */
  variantSelectLabel?: string;
  onDeckVersionChange: (version: string) => void;
  onDeckVariantChange: (variant: string) => void;
  /** Current deck palette id (from `@/palettes`); empty = inherit app CSS variables. */
  deckPalette: string;
  paletteIds: string[];
  onDeckPaletteChange: (paletteId: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onExport: () => void;
  /** Generic learn platform: POST `/api/learn/save-draft` (dev / `DECK_AUTHORING=1` in prod). */
  onSaveDraft?: (() => void | Promise<void>) | null;
  /** Generic learn flow: copy current version file + manifest entry via `/api/learn/create-version`. */
  onCreateVersion?: (() => void | Promise<void>) | null;
  diskPersistBusy?: boolean;
  canDelete: boolean;
  mergeNote?: string | null;
  /** Uncap canvas width (uses full center column). */
  canvasFullWidth: boolean;
  onCanvasFullWidthChange: (full: boolean) => void;
};

const btn: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  cursor: "pointer",
  fontWeight: 600,
  color: "#0f172a",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#1d4ed8",
  color: "#fff",
  borderColor: "#1d4ed8",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
  display: "block",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 13,
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#fff",
  color: "#0f172a",
  boxSizing: "border-box",
};

const VIEWPORT_MODES: Array<{ id: DeviceMode; label: string }> = [
  { id: "phone", label: "Phone" },
  { id: "tablet", label: "Tablet" },
  { id: "desktop", label: "Desktop" },
  { id: "phoneGrid", label: "Grid" },
];

function PanelDisclosure({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = `${id}-panel`;
  return (
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          fontSize: 12,
          fontWeight: 700,
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          border: "none",
          background: open ? "#f1f5f9" : "#fff",
          cursor: "pointer",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <span aria-hidden style={{ fontSize: 10, width: 14, color: "#64748b" }}>
          {open ? "▼" : "▶"}
        </span>
        {title}
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={`${id}-btn`} style={{ padding: "0 12px 12px" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function LandingSlideBuilderPanel({
  slides,
  catalogFlowOptions = null,
  catalogFlowValue = "",
  showCatalogFlowSelect = false,
  onCatalogFlowChange,
  deckVersion,
  deckVariant,
  variantOptions,
  versionOptions = null,
  showVariantSelect = true,
  variantSelectLabel = "Deck variant",
  onDeckVersionChange,
  onDeckVariantChange,
  deckPalette,
  paletteIds,
  onDeckPaletteChange,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onExport,
  onSaveDraft = null,
  onCreateVersion = null,
  diskPersistBusy = false,
  canDelete,
  mergeNote,
  canvasFullWidth,
  onCanvasFullWidthChange,
}: LandingSlideBuilderPanelProps) {
  const shellDevice = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );

  const [deckSettingsOpen, setDeckSettingsOpen] = useState(false);
  const [viewportOpen, setViewportOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        borderRight: "1px solid #e2e8f0",
        background: "#fff",
        width: 280,
        flexShrink: 0,
      }}
    >
      <div style={{ flexShrink: 0, padding: "10px 14px 8px", borderBottom: "1px solid #e2e8f0" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Slide deck
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>Outline</div>
        <p style={{ fontSize: 11, color: "#64748b", margin: "6px 0 0", lineHeight: 1.35 }}>
          Per-slide fields live in the <strong style={{ color: "#334155" }}>Inspector</strong>. Use the sections below for
          deck-wide settings; the slide list scrolls on its own.
        </p>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "10px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <button type="button" style={btnPrimary} onClick={onAdd} title="Add slide at end">
          Add
        </button>
        <button type="button" style={btn} onClick={onDuplicate} disabled={!selectedId} title="Duplicate selected">
          Duplicate
        </button>
        <button type="button" style={btn} onClick={onDelete} disabled={!selectedId || !canDelete} title="Delete selected">
          Delete
        </button>
        <button type="button" style={btn} onClick={onMoveUp} disabled={!selectedId} title="Move up">
          Up
        </button>
        <button type="button" style={btn} onClick={onMoveDown} disabled={!selectedId} title="Move down">
          Down
        </button>
        <button
          type="button"
          style={{ ...btnPrimary, marginLeft: "auto" }}
          onClick={onExport}
          title="Download JSON (order merged)"
        >
          Export JSON
        </button>
      </div>

      {onSaveDraft || onCreateVersion ? (
        <div
          style={{
            flexShrink: 0,
            padding: "8px 12px",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          {onSaveDraft ? (
            <button
              type="button"
              style={btn}
              disabled={diskPersistBusy}
              onClick={() => void onSaveDraft()}
              title="Overwrite the current version JSON on disk (requires dev server or DECK_AUTHORING=1 in production)"
            >
              Save to disk
            </button>
          ) : null}
          {onCreateVersion ? (
            <button
              type="button"
              style={btn}
              disabled={diskPersistBusy}
              onClick={() => void onCreateVersion()}
              title="Copy current version to a new key and append it to manifest availableVersions"
            >
              New version
            </button>
          ) : null}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: "0 1 auto",
            maxHeight: "min(38vh, 320px)",
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            background: "#fafafa",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <PanelDisclosure
            id="slide-builder-deck-settings"
            title="Deck settings"
            open={deckSettingsOpen}
            onToggle={() => setDeckSettingsOpen((v) => !v)}
          >
            {showCatalogFlowSelect && catalogFlowOptions != null && catalogFlowOptions.length > 0 && onCatalogFlowChange ? (
              <>
                <label style={labelStyle} htmlFor="slide-builder-catalog-flow">
                  Deck file
                </label>
                <select
                  id="slide-builder-catalog-flow"
                  value={catalogFlowValue}
                  onChange={(e) => onCatalogFlowChange(e.target.value)}
                  style={selectStyle}
                  aria-label="Deck flow (app and manifest)"
                >
                  {catalogFlowOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <label
              style={{
                ...labelStyle,
                ...(showCatalogFlowSelect && catalogFlowOptions != null && catalogFlowOptions.length > 0
                  ? { marginTop: 8 }
                  : {}),
              }}
              htmlFor="slide-builder-deck-version"
            >
              Deck version
            </label>
            <select
              id="slide-builder-deck-version"
              value={deckVersion}
              onChange={(e) => onDeckVersionChange(e.target.value)}
              style={selectStyle}
              aria-label="Deck version"
            >
              {versionOptions != null && versionOptions.length > 0
                ? versionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                : onSaveDraft || onCreateVersion
                  ? [
                      <option key={deckVersion || "__current__"} value={deckVersion}>
                        {deckVersion ? learnDeckVersionDisplayLabel(deckVersion) : "…"}
                      </option>,
                    ]
                  : [
                      <option key="1" value="1">
                        landing-1.json
                      </option>,
                      <option key="2" value="2">
                        landing-2.json
                      </option>,
                      <option key="3" value="3">
                        landing-3.json
                      </option>,
                    ]}
            </select>
            {showVariantSelect ? (
              <>
                <label style={{ ...labelStyle, marginTop: 8 }} htmlFor="slide-builder-deck-variant">
                  {variantSelectLabel}
                </label>
                <select
                  id="slide-builder-deck-variant"
                  value={deckVariant}
                  onChange={(e) => onDeckVariantChange(e.target.value)}
                  style={selectStyle}
                  aria-label={variantSelectLabel}
                >
                  {variantOptions.map((opt) => (
                    <option key={opt.value === "" ? "__empty__" : opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <label style={{ ...labelStyle, marginTop: 8 }} htmlFor="slide-builder-deck-palette">
              Deck theme
            </label>
            <select
              id="slide-builder-deck-palette"
              value={deckPalette}
              onChange={(e) => onDeckPaletteChange(e.target.value)}
              style={selectStyle}
              aria-label="Deck theme palette"
            >
              <option value="">Inherit app default</option>
              {paletteIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: "6px 0 0", lineHeight: 1.35 }}>
              Saved in JSON as <code style={{ fontSize: 9 }}>deckPalette</code>.
            </p>
            {mergeNote ? (
              <div style={{ fontSize: 11, color: "#b45309", marginTop: 8, lineHeight: 1.35 }}>{mergeNote}</div>
            ) : null}
          </PanelDisclosure>

          <PanelDisclosure
            id="slide-builder-viewport"
            title="Viewport / layout"
            open={viewportOpen}
            onToggle={() => setViewportOpen((v) => !v)}
          >
            <span style={labelStyle}>Canvas viewport</span>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.35 }}>
              Device modes match the dev toolbar and cap slide width for accurate layout preview.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="Slide canvas device width">
              {VIEWPORT_MODES.map(({ id, label }) => {
                const active = shellDevice === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDevicePreviewMode(id)}
                    style={{
                      ...btn,
                      borderColor: active ? "#2563eb" : "#e2e8f0",
                      background: active ? "#eff6ff" : "#f8fafc",
                      color: active ? "#1d4ed8" : "#475569",
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={canvasFullWidth}
                onChange={(e) => onCanvasFullWidthChange(e.target.checked)}
                aria-label="Use full width for slide canvas"
              />
              Full width (no cap)
            </label>
          </PanelDisclosure>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              flexShrink: 0,
              padding: "8px 12px 4px",
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Slides ({slides.length})
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "4px 8px 10px" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {slides.map((s, i) => {
                const sel = selectedId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: sel ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: sel ? "#eff6ff" : "#f8fafc",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                        {i + 1}. {s.stepLabel}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{s.title}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 6,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            color: "#1d4ed8",
                            background: "#eff6ff",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {s.slideTypeLabel}
                        </span>
                        <span style={{ color: "#94a3b8" }}>{s.layout}</span>
                        <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>
                          {s.id}
                        </code>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
