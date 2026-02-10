"use client";

import React, { useState } from "react";
import LayoutThumbnail from "./LayoutThumbnail";

/**
 * Visual QA page showing all layout thumbnails side-by-side.
 * Use this to verify consistency across the icon system.
 */

const ALL_LAYOUT_IDS = [
  "default",
  "hero-centered",
  "hero-split",
  "hero-split-image-right",
  "hero-split-image-left",
  "hero-full-bleed-image",
  "content-narrow",
  "content-stack",
  "image-left-text-right",
  "features-grid-3",
  "feature-grid-3",
  "testimonial-band",
  "cta-centered",
  "test-extensible",
];

const CONTAINER_STYLE: React.CSSProperties = {
  padding: "var(--spacing-6)",
  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  minHeight: "100vh",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  marginBottom: "var(--spacing-2)",
  color: "rgba(0,0,0,0.9)",
};

const SUBTITLE_STYLE: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(0,0,0,0.6)",
  marginBottom: "var(--spacing-6)",
  maxWidth: "800px",
};

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "var(--spacing-4)",
  marginBottom: "var(--spacing-8)",
};

const TILE_STYLE: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "12px",
  padding: "var(--spacing-4)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid rgba(0,0,0,0.06)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "pointer",
};

const TILE_HOVER_STYLE: React.CSSProperties = {
  transform: "translateY(-2px)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
};

const LABEL_STYLE: React.CSSProperties = {
  marginTop: "var(--spacing-2)",
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(0,0,0,0.75)",
  textAlign: "center",
  wordBreak: "break-word",
};

const THUMBNAIL_BOX_STYLE: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4/3",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
  borderRadius: "8px",
  overflow: "hidden",
};

const SIZE_CONTROLS_STYLE: React.CSSProperties = {
  display: "flex",
  gap: "var(--spacing-2)",
  marginBottom: "var(--spacing-4)",
  alignItems: "center",
};

const BUTTON_STYLE: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  background: "rgba(255,255,255,0.9)",
  color: "rgba(0,0,0,0.8)",
  fontSize: "12px",
  cursor: "pointer",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  transition: "background 0.2s ease, box-shadow 0.2s ease",
};

const BUTTON_ACTIVE_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
  color: "#fff",
  boxShadow: "0 2px 6px rgba(59, 130, 246, 0.35)",
};

export function LayoutThumbnailShowcase() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [size, setSize] = useState<64 | 96 | 128>(64);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={CONTAINER_STYLE}>
      <h1 style={TITLE_STYLE}>Layout Thumbnail System</h1>
      <p style={SUBTITLE_STYLE}>
        Semantic SVG thumbnails with consistent visual grammar. Each layout has a distinct
        silhouette using primitives: bands, columns, cards, CTAs, images, icons, and quotes.
      </p>

      <div style={SIZE_CONTROLS_STYLE}>
        <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.6)" }}>Size:</span>
        {[64, 96, 128].map((s) => (
          <button
            key={s}
            onClick={() => setSize(s as 64 | 96 | 128)}
            style={{
              ...BUTTON_STYLE,
              ...(size === s ? BUTTON_ACTIVE_STYLE : {}),
            }}
          >
            {s}px
          </button>
        ))}
      </div>

      <div style={GRID_STYLE}>
        {ALL_LAYOUT_IDS.map((layoutId) => {
          const isHovered = hoveredId === layoutId;
          const isSelected = selectedId === layoutId;
          
          return (
            <div
              key={layoutId}
              style={{
                ...TILE_STYLE,
                ...(isHovered || isSelected ? TILE_HOVER_STYLE : {}),
                ...(isSelected ? { border: "2px solid #3b82f6" } : {}),
              }}
              onClick={() => setSelectedId(isSelected ? null : layoutId)}
              onMouseEnter={() => setHoveredId(layoutId)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={THUMBNAIL_BOX_STYLE}>
                <LayoutThumbnail
                  layoutId={layoutId}
                  selected={isSelected}
                  size={size}
                />
              </div>
              <div style={LABEL_STYLE}>{layoutId}</div>
            </div>
          );
        })}
      </div>

      {selectedId && (
        <div
          style={{
            marginTop: "var(--spacing-6)",
            padding: "var(--spacing-4)",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
            Selected: {selectedId}
          </h3>
          <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.6)", margin: 0 }}>
            Click the thumbnail again to deselect.
          </p>
        </div>
      )}

      <div
        style={{
          marginTop: "var(--spacing-8)",
          padding: "var(--spacing-4)",
          background: "rgba(255,255,255,0.6)",
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
          Visual Grammar
        </h3>
        <ul style={{ fontSize: "12px", color: "rgba(0,0,0,0.7)", lineHeight: 1.6, margin: 0, paddingLeft: "20px" }}>
          <li><strong>Band:</strong> Full-width horizontal strip (content sections)</li>
          <li><strong>Column:</strong> Vertical region with rounded corners (sidebars, content areas)</li>
          <li><strong>Card:</strong> Rounded rectangle block (feature cards, testimonials)</li>
          <li><strong>CTA:</strong> Pill-shaped button (accent color)</li>
          <li><strong>Image:</strong> Light blue block with icon (media content)</li>
          <li><strong>Icon:</strong> Small circle dot (feature icons, avatars)</li>
          <li><strong>Quote:</strong> Quotation mark (testimonials)</li>
          <li><strong>Text:</strong> Thin gray lines (body text)</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: "var(--spacing-4)",
          padding: "var(--spacing-4)",
          background: "rgba(255,255,255,0.6)",
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
          Color Semantics
        </h3>
        <ul style={{ fontSize: "12px", color: "rgba(0,0,0,0.7)", lineHeight: 1.6, margin: 0, paddingLeft: "20px" }}>
          <li><strong>Canvas:</strong> #f8fafc (light neutral background)</li>
          <li><strong>Content:</strong> #e2e8f0 (light blocks)</li>
          <li><strong>Header:</strong> #334155 (dark bands)</li>
          <li><strong>Accent:</strong> #3b82f6 (CTA buttons, icons)</li>
          <li><strong>Image:</strong> #e0f2fe + #0ea5e9 border (media areas)</li>
          <li><strong>Text:</strong> #94a3b8 (body text lines)</li>
        </ul>
      </div>
    </div>
  );
}

export default LayoutThumbnailShowcase;
