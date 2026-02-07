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
