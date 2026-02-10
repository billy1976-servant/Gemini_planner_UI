/**
 * Single source of truth for layout thumbnails.
 * All thumbnails live in /public/layout-thumbnails/ — no gray blocks, no two-letter fallbacks.
 */

const BASE = "/layout-thumbnails";

/** Section layout id → thumbnail path */
export const SECTION_LAYOUT_THUMBNAILS: Record<string, string> = {
  "hero-centered": `${BASE}/hero-centered.svg`,
  "hero-split": `${BASE}/hero-split.svg`,
  "hero-split-image-right": `${BASE}/hero-split.svg`,
  "hero-split-image-left": `${BASE}/content-left.svg`,
  "hero-full-bleed-image": `${BASE}/hero-full-bleed.svg`,
  "content-narrow": `${BASE}/content-narrow.svg`,
  "content-stack": `${BASE}/content-stack.svg`,
  "image-left-text-right": `${BASE}/content-left.svg`,
  "features-grid-3": `${BASE}/features-grid.svg`,
  "feature-grid-3": `${BASE}/features-grid.svg`,
  "testimonial-band": `${BASE}/testimonials.svg`,
  "cta-centered": `${BASE}/cta-centered.svg`,
  "test-extensible": `${BASE}/default.svg`,
};

/** Card layout id → thumbnail path (reuse section thumbnails where applicable) */
export const CARD_LAYOUT_THUMBNAILS: Record<string, string> = {
  "image-top": `${BASE}/cards-3.svg`,
  "image-left": `${BASE}/content-left.svg`,
  "image-right": `${BASE}/content-right.svg`,
  "centered": `${BASE}/cta-centered.svg`,
  "image-bottom": `${BASE}/cards-3.svg`,
};

/** Organ internal layout id → thumbnail path */
export const ORGAN_LAYOUT_THUMBNAILS: Record<string, string> = {
  default: `${BASE}/default.svg`,
};

const _warnedThumb = new Set<string>();

export function getSectionThumbnailPath(id: string): string | undefined {
  const key = (id || "").trim().toLowerCase();
  return SECTION_LAYOUT_THUMBNAILS[key] ?? SECTION_LAYOUT_THUMBNAILS[id];
}

export function getCardThumbnailPath(id: string): string | undefined {
  const key = (id || "").trim().toLowerCase();
  return CARD_LAYOUT_THUMBNAILS[key] ?? CARD_LAYOUT_THUMBNAILS[id];
}

export function getOrganThumbnailPath(id: string): string | undefined {
  const key = (id || "").trim().toLowerCase();
  return ORGAN_LAYOUT_THUMBNAILS[key] ?? ORGAN_LAYOUT_THUMBNAILS[id] ?? (id ? undefined : ORGAN_LAYOUT_THUMBNAILS.default);
}

export function getSectionThumbnailPathOrWarn(id: string): string | undefined {
  const path = getSectionThumbnailPath(id);
  if (!path && id && typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    const k = `section:${id}`;
    if (!_warnedThumb.has(k)) {
      _warnedThumb.add(k);
      console.warn("[layoutThumbnailRegistry] No thumbnail for section layout id:", id);
    }
  }
  return path;
}

export function getCardThumbnailPathOrWarn(id: string): string | undefined {
  const path = getCardThumbnailPath(id);
  if (!path && id && typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    const k = `card:${id}`;
    if (!_warnedThumb.has(k)) {
      _warnedThumb.add(k);
      console.warn("[layoutThumbnailRegistry] No thumbnail for card layout id:", id);
    }
  }
  return path;
}

export function getOrganThumbnailPathOrWarn(id: string): string | undefined {
  const path = getOrganThumbnailPath(id);
  if (!path && id && typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    const k = `organ:${id}`;
    if (!_warnedThumb.has(k)) {
      _warnedThumb.add(k);
      console.warn("[layoutThumbnailRegistry] No thumbnail for organ layout id:", id);
    }
  }
  return path ?? getOrganThumbnailPath("");
}
