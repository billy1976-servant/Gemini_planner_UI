/**
 * Card layout preset registry.
 * Maps preset IDs to card-internal layout params (mediaPosition, contentAlign).
 * Used per-section; applied to Card children of that section only.
 */

export type CardLayoutPresetDef = {
  mediaPosition?: "top" | "left" | "right" | "bottom";
  contentAlign?: "start" | "center" | "end";
};

const CARD_LAYOUT_PRESETS: Record<string, CardLayoutPresetDef> = {
  "image-top": {
    mediaPosition: "top",
    contentAlign: "start",
  },
  "image-left": {
    mediaPosition: "left",
    contentAlign: "start",
  },
  "image-right": {
    mediaPosition: "right",
    contentAlign: "start",
  },
  "image-bottom": {
    mediaPosition: "bottom",
    contentAlign: "start",
  },
  "centered-card": {
    mediaPosition: "top",
    contentAlign: "center",
  },
  "centered-image-left": {
    mediaPosition: "left",
    contentAlign: "center",
  },
  "centered-image-right": {
    mediaPosition: "right",
    contentAlign: "center",
  },
};

/**
 * Returns the preset definition for a given preset ID, or null.
 */
export function getCardLayoutPreset(presetId: string): CardLayoutPresetDef | null {
  if (!presetId || typeof presetId !== "string") return null;
  const id = presetId.trim().toLowerCase();
  return CARD_LAYOUT_PRESETS[id] ?? null;
}

/**
 * All card layout preset IDs (for dropdowns).
 */
export function getAllCardLayoutPresetIds(): string[] {
  return Object.keys(CARD_LAYOUT_PRESETS);
}

export { CARD_LAYOUT_PRESETS };
