/**
 * Single preset resolution facade.
 * Re-exports card, spacing-scale, and visual preset resolution.
 */
export { getCardPreset, type CardPresetId } from "./card-preset-resolver";
export { getSpacingForScale, type SpacingScaleId } from "./spacing-scale-resolver";
export { getVisualPresetForMolecule } from "./visual-preset-resolver";
