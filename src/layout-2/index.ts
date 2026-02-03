/**
 * layout-2: JSON-driven layout system (parallel to existing layout engine).
 * Use resolveLayout(), LayoutMoleculeRenderer, and LayoutDefinition when integrating with SectionCompound.
 */
export { resolveLayout, getLayout2Ids, getDefaultSectionLayoutId, type LayoutDefinition } from "./layout-resolver";
export { default as LayoutMoleculeRenderer } from "./LayoutMoleculeRenderer";
export { collectSectionKeysAndNodes, collectSectionLabels } from "./section-helpers";
export {
  getAllowedCardPresetsForSectionPreset,
  getDefaultCardPresetForSectionPreset,
} from "./capabilities";
