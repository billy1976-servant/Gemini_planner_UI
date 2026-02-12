/**
 * Visual Preset Resolver
 * Returns molecule-level param overrides for the Visual Preset Layer.
 * Merge order: visual preset (base) < variant < size < node.params
 * Single source: lib/layout/visual-presets.json
 */
import presetsBundle from "./visual-presets.json";

const PRESETS: Record<string, Record<string, any>> = {
  default: presetsBundle.default as Record<string, any>,
  compact: presetsBundle.compact as Record<string, any>,
  spacious: presetsBundle.spacious as Record<string, any>,
  prominent: presetsBundle.prominent as Record<string, any>,
  editorial: presetsBundle.editorial as Record<string, any>,
  elevated: presetsBundle.elevated as Record<string, any>,
  floating: presetsBundle.floating as Record<string, any>,
  "depth-base": (presetsBundle as any)["depth-base"] as Record<string, any>,
  "depth-raised": (presetsBundle as any)["depth-raised"] as Record<string, any>,
  "depth-overlay": (presetsBundle as any)["depth-overlay"] as Record<string, any>,
  "depth-floating": (presetsBundle as any)["depth-floating"] as Record<string, any>,
};

const EXPERIENCE_TO_PRESET: Record<string, string> = {
  app: "compact",
  website: "default",
  learning: "editorial",
};

export function getVisualPresetForMolecule(
  moleculeType: string,
  presetName?: string | null,
  experience?: string
): Record<string, any> {
  const resolvedName =
    presetName ??
    (experience ? EXPERIENCE_TO_PRESET[experience] : null) ??
    "default";
  const preset = PRESETS[resolvedName] ?? PRESETS.default;
  const typeKey = moleculeType?.toLowerCase?.() ?? "";
  return preset[typeKey] ?? preset[moleculeType] ?? {};
}
