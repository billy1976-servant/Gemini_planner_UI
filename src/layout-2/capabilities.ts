/**
 * Layout-2 capabilities: section layout id → allowed card preset ids.
 * Single source of truth for Card Layout options per Section Layout (layout-2 ids).
 */

const ALL_CARD_PRESETS = [
  "image-top",
  "image-left",
  "image-right",
  "image-bottom",
  "centered-card",
  "centered-image-left",
  "centered-image-right",
] as const;

/**
 * layout-2 section layout id | "" (default/unset) → allowed card preset ids.
 * Empty array = no card layout applicable (e.g. full-bleed hero with no cards).
 */
export const SECTION_TO_CARD_CAPABILITIES: Record<string, string[]> = {
  "": [...ALL_CARD_PRESETS],
  "hero-centered": ["centered-card"],
  "hero-split-image-right": ["image-right", "centered-image-right"],
  "hero-split-image-left": ["image-left", "centered-image-left"],
  "hero-full-bleed-image": [],
  "content-narrow": [...ALL_CARD_PRESETS],
  "image-left-text-right": [
    "image-left",
    "image-right",
    "centered-image-left",
    "centered-image-right",
  ],
  "feature-grid-3": [...ALL_CARD_PRESETS],
  "features-grid-3": [...ALL_CARD_PRESETS],
  "testimonial-band": [...ALL_CARD_PRESETS],
  "cta-centered": ["centered-card"],
};

/**
 * Returns allowed card preset ids for the given section layout id (layout-2 id).
 * Use "" for default/unset.
 */
export function getAllowedCardPresetsForSectionPreset(
  sectionLayoutId: string | null
): string[] {
  const id = (sectionLayoutId ?? "").toString().trim() || "";
  const allowed = SECTION_TO_CARD_CAPABILITIES[id];
  return allowed ?? [...ALL_CARD_PRESETS];
}

/**
 * Returns the default card preset for the section (first allowed, or null).
 * Used when current card preset becomes invalid after section layout change.
 */
export function getDefaultCardPresetForSectionPreset(
  sectionLayoutId: string | null
): string | null {
  const allowed = getAllowedCardPresetsForSectionPreset(sectionLayoutId);
  return allowed.length > 0 ? allowed[0] : null;
}
