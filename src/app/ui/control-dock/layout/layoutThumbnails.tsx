"use client";

import React from "react";
import {
  getSectionThumbnailPathOrWarn,
  getCardThumbnailPathOrWarn,
  getOrganThumbnailPathOrWarn,
} from "@/ui/layoutThumbnailRegistry";

/**
 * Layout thumbnails: registry first (/public/layout-thumbnails), then diagram SVG.
 * No gray blocks. No two-letter fallbacks.
 */

export type LayoutThumbnailResult = string | React.ReactNode;

/** Section layout: image path if in registry, else diagram SVG */
export function getSectionLayoutThumbnail(id: string): LayoutThumbnailResult {
  const path = getSectionThumbnailPathOrWarn(id);
  if (path) return path;
  return <DiagramSvgSection id={id} />;
}

/** Card layout: image path if in registry, else diagram SVG */
export function getCardLayoutThumbnail(id: string): LayoutThumbnailResult {
  const path = getCardThumbnailPathOrWarn(id);
  if (path) return path;
  return <DiagramSvgCard id={id} />;
}

/** Organ internal layout: image path if in registry, else diagram SVG */
export function getOrganLayoutThumbnail(id: string): LayoutThumbnailResult {
  const path = getOrganThumbnailPathOrWarn(id);
  if (path) return path;
  return <DiagramSvgOrgan />;
}

/* Inline diagram SVGs — soft colors, wireframe style (not gray) */
function DiagramSvgSection({ id }: { id: string }) {
  const lower = (id || "").toLowerCase();
  if (lower.includes("hero") && (lower.includes("centered") || lower.includes("cta"))) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f1f5f9" rx="6" />
        <rect x="24" y="20" width="72" height="50" rx="4" fill="url(#ds1)" />
        <defs><linearGradient id="ds1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93c5fd"/><stop offset="1" stop-color="#60a5fa"/></linearGradient></defs>
      </svg>
    );
  }
  if (lower.includes("split") || lower.includes("image-left") || lower.includes("image-right")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f1f5f9" rx="6" />
        <rect x="8" y="12" width="50" height="66" rx="4" fill="#60a5fa" opacity="0.85" />
        <rect x="62" y="12" width="50" height="66" rx="4" fill="#a78bfa" opacity="0.85" />
      </svg>
    );
  }
  if (lower.includes("grid") || lower.includes("feature")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f1f5f9" rx="6" />
        <rect x="12" y="12" width="30" height="30" rx="3" fill="#4ade80" opacity="0.9" />
        <rect x="45" y="12" width="30" height="30" rx="3" fill="#4ade80" opacity="0.8" />
        <rect x="78" y="12" width="30" height="30" rx="3" fill="#4ade80" opacity="0.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
      <rect width="120" height="90" fill="#f1f5f9" rx="6" />
      <rect x="12" y="12" width="48" height="66" rx="4" fill="#64748b" opacity="0.4" />
      <rect x="60" y="12" width="48" height="66" rx="4" fill="#64748b" opacity="0.3" />
    </svg>
  );
}

function DiagramSvgCard({ id }: { id: string }) {
  const lower = (id || "").toLowerCase();
  if (lower.includes("top") || lower.includes("bottom")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f1f5f9" rx="6" />
        <rect x="12" y="8" width="96" height="40" rx="4" fill="#f59e0b" opacity="0.8" />
        <rect x="12" y="54" width="96" height="28" rx="3" fill="#c7d2fe" opacity="0.8" />
      </svg>
    );
  }
  if (lower.includes("left") || lower.includes("right")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f1f5f9" rx="6" />
        <rect x="8" y="12" width="48" height="66" rx="4" fill="#2dd4bf" opacity="0.8" />
        <rect x="64" y="12" width="48" height="66" rx="4" fill="#e0e7ff" opacity="0.9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
      <rect width="120" height="90" fill="#f1f5f9" rx="6" />
      <rect x="24" y="28" width="72" height="34" rx="4" fill="#34d399" opacity="0.85" />
    </svg>
  );
}

function DiagramSvgOrgan() {
  return (
    <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
      <rect width="120" height="90" fill="#f1f5f9" rx="6" />
      <rect x="12" y="12" width="56" height="66" rx="4" fill="#94a3b8" opacity="0.5" />
      <rect x="52" y="12" width="56" height="66" rx="4" fill="#94a3b8" opacity="0.35" />
    </svg>
  );
}
