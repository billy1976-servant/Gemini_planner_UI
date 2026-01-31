/**
 * Visual Preset Resolver
 * Returns molecule-level param overrides for the Visual Preset Layer.
 * Merge order: visual preset (base) < variant < size < node.params
 */
import defaultPreset from "./visual-presets/default.json";
import compactPreset from "./visual-presets/compact.json";
import spaciousPreset from "./visual-presets/spacious.json";
import prominentPreset from "./visual-presets/prominent.json";
import editorialPreset from "./visual-presets/editorial.json";

const PRESETS: Record<string, Record<string, any>> = {
  default: defaultPreset as Record<string, any>,
  compact: compactPreset as Record<string, any>,
  spacious: spaciousPreset as Record<string, any>,
  prominent: prominentPreset as Record<string, any>,
  editorial: editorialPreset as Record<string, any>,
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
