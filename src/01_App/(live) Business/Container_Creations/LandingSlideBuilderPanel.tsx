"use client";

import React from "react";

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
  canDelete: boolean;
  mergeNote?: string | null;
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

export default function LandingSlideBuilderPanel({
  slides,
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
  canDelete,
  mergeNote,
}: LandingSlideBuilderPanelProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        borderRight: "1px solid #e2e8f0",
        background: "#fff",
        width: 280,
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Slide deck
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>Outline</div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <label style={labelStyle} htmlFor="slide-builder-deck-palette">
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
            Colors, type scale, and spacing from HiSense palettes. Saved in JSON as <code style={{ fontSize: 9 }}>deckPalette</code>.
          </p>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, lineHeight: 1.35 }}>
          Per-slide options and slide type are in the <strong style={{ color: "#334155" }}>Inspector</strong> (right).
          Widen the window or scroll horizontally if you do not see it.
        </div>
        {mergeNote ? (
          <div style={{ fontSize: 11, color: "#b45309", marginTop: 8, lineHeight: 1.35 }}>{mergeNote}</div>
        ) : null}
      </div>

      <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 6, borderBottom: "1px solid #e2e8f0" }}>
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
        <button type="button" style={{ ...btnPrimary, marginLeft: "auto" }} onClick={onExport} title="Download JSON (order merged)">
          Export JSON
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{i + 1}. {s.stepLabel}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
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
                    <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>{s.id}</code>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
