/**
 * Card preset resolver — template-driven card personality.
 * Returns card surface (and title/body) overrides by preset id.
 * Single JSON authority: card-presets.json.
 */
import cardPresets from "./card-presets.json";

const PRESETS: Record<string, Record<string, any>> = cardPresets as Record<string, Record<string, any>>;

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
