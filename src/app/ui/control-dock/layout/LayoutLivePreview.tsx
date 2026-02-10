"use client";

import React from "react";
import { resolveLayout, LayoutMoleculeRenderer } from "@/layout";

const SAMPLE_IMAGE = "https://placehold.co/400x300/f1f5f9/64748b?text=Image";
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 180;
const SCALE = 0.35;

/** Wrapper so partitionChildren sees content.media and treats this as the media slot */
function PreviewMedia({ content }: { content?: { media?: string } }) {
  const url = content?.media;
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

export type LayoutLivePreviewProps = {
  layoutId: string;
  /** Optional: fixed size for the thumbnail container (default 160x120) */
  width?: number;
  height?: number;
};

/**
 * Renders the actual section layout with sample content in a small viewport.
 * Uses resolveLayout + LayoutMoleculeRenderer so the preview matches real output.
 */
export default function LayoutLivePreview({
  layoutId,
  width = 160,
  height = 120,
}: LayoutLivePreviewProps) {
  if (!layoutId) {
    return (
      <div
        style={{
          width,
          height,
          background: "#f1f5f9",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#64748b",
        }}
      >
        Default
      </div>
    );
  }

  const layoutDef = resolveLayout(layoutId);
  if (!layoutDef) {
    return (
      <div
        style={{
          width,
          height,
          background: "#f1f5f9",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#64748b",
        }}
      >
        —
      </div>
    );
  }

  const innerW = width / SCALE;
  const innerH = height / SCALE;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        overflow: "hidden",
        background: "#f8fafc",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          width: innerW,
          height: innerH,
          overflow: "hidden",
        }}
      >
        <LayoutMoleculeRenderer
          layout={layoutDef}
          layoutPresetId={layoutId}
          content={{ title: "Sample heading" }}
          params={{
            surface: {},
            title: { tag: "h3", style: { fontSize: 14, fontWeight: 600, margin: 0 } },
          }}
        >
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>
            Sample body text for preview.
          </div>
          <PreviewMedia content={{ media: SAMPLE_IMAGE }} />
        </LayoutMoleculeRenderer>
      </div>
    </div>
  );
}
