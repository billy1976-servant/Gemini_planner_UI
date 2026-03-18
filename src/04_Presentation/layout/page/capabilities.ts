/**
 * Page layout capabilities: section layout id → allowed card layout ids (component layout).
 * Single source of truth for Card Layout options per Section Layout (page layout id).
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
 * Safe default card preset when section layout is unknown (renderer only).
 * Do not use for dropdown options; unknown section returns [].
 */
export const SAFE_DEFAULT_CARD_PRESET_ID = "centered-card";

/**
 * Page layout id | "" (default/unset) → allowed card layout (component) ids.
 * Empty array = no card layout applicable (e.g. full-bleed hero with no cards).
 */
export const SECTION_TO_CARD_CAPABILITIES: Record<string, string[]> = {
  "": [...ALL_CARD_PRESETS],
  "hero-centered": ["centered-card"],
  "hero-split": ["image-left", "image-right", "centered-image-left", "centered-image-right"],
  "hero-split-image-right": ["image-right", "centered-image-right"],
  "hero-split-image-left": ["image-left", "centered-image-left"],
  "hero-full-bleed-image": [],
  "content-narrow": [...ALL_CARD_PRESETS],
  "content-stack": [...ALL_CARD_PRESETS],
  "image-left-text-right": [
    "image-left",
    "image-right",
    "centered-image-left",
    "centered-image-right",
  ],
  "features-grid-3": [...ALL_CARD_PRESETS],
  "testimonial-band": [...ALL_CARD_PRESETS],
  "cta-centered": ["centered-card"],
  "test-extensible": [...ALL_CARD_PRESETS],
};

/**
 * Allowed card preset IDs for a section layout. Unknown section returns []
 * (no chaos fallback). Dropdown uses this; renderer uses override → first allowed → SAFE_DEFAULT.
 */
export function getAllowedCardPresetsForSectionPreset(
  sectionLayoutId: string | null
): string[] {
  const id = (sectionLayoutId ?? "").toString().trim() || "";
  const allowed = SECTION_TO_CARD_CAPABILITIES[id];
  return allowed ?? [];
}

export function getDefaultCardPresetForSectionPreset(
  sectionLayoutId: string | null
): string | null {
  const allowed = getAllowedCardPresetsForSectionPreset(sectionLayoutId);
  return allowed.length > 0 ? allowed[0] : null;
}
