/**
 * Card preset resolver — template-driven card personality.
 * Returns card surface (and title/body) overrides by preset id.
 */
import defaultPreset from "./card-presets/default.json";
import softPreset from "./card-presets/soft.json";
import borderlessPreset from "./card-presets/borderless.json";
import elevatedPreset from "./card-presets/elevated.json";
import luxuryPreset from "./card-presets/luxury.json";
import dividersPreset from "./card-presets/dividers.json";

const PRESETS: Record<string, Record<string, any>> = {
  default: defaultPreset as Record<string, any>,
  soft: softPreset as Record<string, any>,
  borderless: borderlessPreset as Record<string, any>,
  elevated: elevatedPreset as Record<string, any>,
  luxury: luxuryPreset as Record<string, any>,
  dividers: dividersPreset as Record<string, any>,
};

export type CardPresetId = keyof typeof PRESETS;

/**
 * Returns param overlay for Card molecule given a card preset id.
 * Merge on top of visual preset in renderNode for type === "card".
 */
export function getCardPreset(presetId: string | undefined | null): Record<string, any> {
  if (!presetId) return {};
  const preset = PRESETS[presetId] ?? PRESETS.default;
  return preset.card ?? {};
}
