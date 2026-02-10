"use client";

import React, { useState } from "react";

export type LayoutTileOption = {
  id: string;
  label: string;
  thumbnail?: React.ReactNode | string;
  description?: string;
};

export type LayoutTilePickerProps = {
  title: string;
  value: string;
  options: LayoutTileOption[];
  onChange: (id: string) => void;
  mode?: "grid" | "row";
};

/* Premium palette for layout cards */
const CARD_PALETTE = {
  softBlue: "#3b82f6",
  softBlueGlow: "rgba(59, 130, 246, 0.35)",
  softPurpleGlow: "rgba(139, 92, 246, 0.25)",
  neutralBg: "#f8fafc",
  neutralBorder: "rgba(0,0,0,0.06)",
  shadowSoft: "0 2px 8px rgba(0,0,0,0.06)",
  shadowMedium: "0 4px 12px rgba(0,0,0,0.08)",
  selectedFill: "rgba(59, 130, 246, 0.08)",
};

const TILE_CONTAINER_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
  borderRadius: "12px",
  boxShadow: CARD_PALETTE.shadowSoft,
  border: "1px solid " + CARD_PALETTE.neutralBorder,
  padding: "10px",
  cursor: "pointer",
  transition: "box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease",
};

const TILE_ACTIVE_STYLE: React.CSSProperties = {
  border: "2px solid " + CARD_PALETTE.softBlue,
  boxShadow: "0 0 0 3px " + CARD_PALETTE.softBlueGlow + ", 0 4px 16px " + CARD_PALETTE.softPurpleGlow,
  background: "linear-gradient(180deg, " + CARD_PALETTE.selectedFill + " 0%, rgba(255,255,255,0.95) 100%)",
};

const THUMB_BOX_STYLE: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4/3",
  borderRadius: "8px",
  background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  marginBottom: "8px",
  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.06)",
};

export default function LayoutTilePicker({
  title,
  value,
  options,
  onChange,
  mode = "grid",
}: LayoutTilePickerProps) {
  const gridStyle: React.CSSProperties =
    mode === "row"
      ? { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "8px" }
      : {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
          gap: "8px",
        };

  return (
    <div
      style={{
        marginBottom: "var(--spacing-3)",
        padding: "var(--spacing-3)",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        borderRadius: "12px",
        border: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-sm)",
          fontWeight: 600,
          color: "rgba(0,0,0,0.82)",
          marginBottom: "var(--spacing-2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <div style={{ ...gridStyle, minWidth: 0 }}>
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <LayoutTile key={opt.id} isActive={isActive} mode={mode} opt={opt} onChange={onChange} />
          );
        })}
      </div>
    </div>
  );
}

function LayoutTile({
  isActive,
  mode,
  opt,
  onChange,
}: {
  isActive: boolean;
  mode: "grid" | "row";
  opt: LayoutTileOption;
  onChange: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                ...TILE_CONTAINER_STYLE,
                ...(isActive ? TILE_ACTIVE_STYLE : {}),
                minWidth: mode === "row" ? 72 : undefined,
                flex: mode === "row" ? "0 0 auto" : undefined,
                ...(hover && !isActive ? { boxShadow: CARD_PALETTE.shadowMedium, background: "rgba(255,255,255,0.98)" } : {}),
              }}
              title={opt.description ?? opt.label}
              aria-pressed={isActive}
              aria-label={opt.label}
            >
              <div style={THUMB_BOX_STYLE}>
                {opt.thumbnail != null ? (
                  typeof opt.thumbnail === "string" ? (
                    <img
                      src={opt.thumbnail}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    opt.thumbnail
                  )
                ) : (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "rgba(0,0,0,0.45)",
                      padding: "4px",
                    }}
                  >
                    {opt.label.slice(0, 2)}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.75)",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {opt.label}
              </div>
            </button>
          );
}
