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
  /** grid = small tiles; row = horizontal wrap; stack = full-width vertical list (for live previews). */
  mode?: "grid" | "row" | "stack";
  /** section = full-width list, edge-to-edge; internal = 2-col square grid. Omit = legacy card grid. */
  variant?: "section" | "internal";
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

/** Section variant: full-width, no card, subtle border, selection glow. */
const SECTION_TILE_BASE: React.CSSProperties = {
  width: "100%",
  padding: 0,
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#fff",
  cursor: "pointer",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};
const SECTION_TILE_ACTIVE: React.CSSProperties = {
  border: "2px solid " + CARD_PALETTE.softBlue,
  boxShadow: "0 0 0 3px " + CARD_PALETTE.softBlueGlow,
};

/** Internal variant: square tile for 2-col grid. */
const INTERNAL_TILE_BASE: React.CSSProperties = {
  aspectRatio: "1",
  padding: "6px",
  border: "1px solid " + CARD_PALETTE.neutralBorder,
  borderRadius: "10px",
  background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
  cursor: "pointer",
  transition: "box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease",
};

const _warnedMissingThumb = new Set<string>();

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

/** Full-width, auto height (no aspect ratio) for stack mode. */
const THUMB_BOX_STACK_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: "8px",
  background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  marginBottom: "8px",
  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.06)",
};

/** Section variant: full width, aspect ratio, edge-to-edge (label overlays). */
const THUMB_BOX_SECTION_STYLE: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4/3",
  background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  position: "relative",
};

/** Internal variant: square thumb area. */
const THUMB_BOX_INTERNAL_STYLE: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  borderRadius: "6px",
  background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

export default function LayoutTilePicker({
  title,
  value,
  options,
  onChange,
  mode = "grid",
  variant,
}: LayoutTilePickerProps) {
  const isSection = variant === "section";
  const isInternal = variant === "internal";

  const gridStyle: React.CSSProperties = isSection
    ? { display: "flex", flexDirection: "column", gap: "10px", width: "100%" }
    : isInternal
      ? {
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          width: "100%",
        }
      : mode === "stack"
        ? { display: "flex", flexDirection: "column", gap: "12px", width: "100%" }
        : mode === "row"
          ? { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "8px" }
          : {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
              gap: "8px",
            };

  const wrapperStyle: React.CSSProperties = isSection
    ? { marginBottom: "var(--spacing-3)", minWidth: 0, maxWidth: "100%", overflow: "hidden" }
    : {
        marginBottom: "var(--spacing-3)",
        padding: "var(--spacing-3)",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        borderRadius: "12px",
        border: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
      };

  return (
    <div style={wrapperStyle}>
      {!isSection && (
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
      )}
      {isSection && (
        <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "rgba(0,0,0,0.6)", marginBottom: "var(--spacing-2)" }}>
          {title}
        </div>
      )}
      <div style={{ ...gridStyle, minWidth: 0 }}>
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <LayoutTile
              key={opt.id}
              isActive={isActive}
              mode={mode}
              variant={variant}
              opt={opt}
              onChange={onChange}
            />
          );
        })}
      </div>
    </div>
  );
}

function LayoutTile({
  isActive,
  mode,
  variant,
  opt,
  onChange,
}: {
  isActive: boolean;
  mode: "grid" | "row" | "stack";
  variant?: "section" | "internal";
  opt: LayoutTileOption;
  onChange: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const isSection = variant === "section";
  const isInternal = variant === "internal";

  const thumbBoxStyle = isSection
    ? THUMB_BOX_SECTION_STYLE
    : isInternal
      ? THUMB_BOX_INTERNAL_STYLE
      : mode === "stack"
        ? THUMB_BOX_STACK_STYLE
        : THUMB_BOX_STYLE;

  const tileStyle: React.CSSProperties = isSection
    ? {
        ...SECTION_TILE_BASE,
        ...(isActive ? SECTION_TILE_ACTIVE : {}),
        ...(hover && !isActive ? { borderColor: "rgba(59, 130, 246, 0.4)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" } : {}),
      }
    : isInternal
      ? {
          ...INTERNAL_TILE_BASE,
          ...(isActive ? TILE_ACTIVE_STYLE : {}),
          ...(hover && !isActive ? { boxShadow: CARD_PALETTE.shadowMedium, background: "rgba(255,255,255,0.98)" } : {}),
        }
      : {
          ...TILE_CONTAINER_STYLE,
          ...(isActive ? TILE_ACTIVE_STYLE : {}),
          minWidth: mode === "row" ? 72 : undefined,
          flex: mode === "row" ? "0 0 auto" : mode === "stack" ? "0 0 auto" : undefined,
          width: mode === "stack" ? "100%" : undefined,
          ...(hover && !isActive ? { boxShadow: CARD_PALETTE.shadowMedium, background: "rgba(255,255,255,0.98)" } : {}),
        };

  const thumbContent =
    opt.thumbnail != null ? (
      typeof opt.thumbnail === "string" ? (
        <img src={opt.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        opt.thumbnail
      )
    ) : (
      <>
        {typeof process !== "undefined" &&
          process.env?.NODE_ENV === "development" &&
          !_warnedMissingThumb.has(opt.id) &&
          (() => {
            _warnedMissingThumb.add(opt.id);
            console.warn("[LayoutTilePicker] Missing thumbnail for option id:", opt.id);
            return null;
          })()}
        <img
          src="/layout-thumbnails/default.svg"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </>
    );

  return (
    <button
      key={opt.id}
      type="button"
      onClick={() => onChange(opt.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={tileStyle}
      title={opt.description ?? opt.label}
      aria-pressed={isActive}
      aria-label={opt.label}
    >
      <div style={thumbBoxStyle}>
        {thumbContent}
        {isSection && (
          <div
            style={{
              position: "absolute",
              left: 6,
              bottom: 6,
              right: "auto",
              fontSize: "10px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "70%",
            }}
          >
            {opt.label || "(default)"}
          </div>
        )}
      </div>
      {!isSection && (
        <div
          style={{
            fontSize: isInternal ? "10px" : "10px",
            fontWeight: 500,
            color: "rgba(0,0,0,0.75)",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: isInternal ? "4px" : undefined,
          }}
        >
          {opt.label}
        </div>
      )}
    </button>
  );
}
