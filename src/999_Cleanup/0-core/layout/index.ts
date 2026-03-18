/**
 * Unified layout: page (section placement), component (internal arrangement), resolver, renderer.
 */

export * from "./page";
export * from "./component";
export {
  resolveLayout,
  getSectionLayoutIds,
  getLayout2Ids,
  getDefaultSectionLayoutId,
  getSectionLayoutId,
  type LayoutDefinition,
} from "./resolver";
export type { GetSectionLayoutIdArgs, GetSectionLayoutIdResult } from "./section-layout-id";
export { default as LayoutMoleculeRenderer } from "./renderer/LayoutMoleculeRenderer";
export {
  evaluateCompatibility,
  getAvailableSlots,
  getRequiredSlots,
  getRequiredSlotsForOrgan,
} from "./compatibility";
export type {
  CompatibilityResult,
  EvaluateCompatibilityArgs,
  SectionNode,
  GetAvailableSlotsOptions,
  LayoutType,
} from "./compatibility";

/** Layout authority: preset and molecule resolution via layout/ only. lib/layout is internal. */
export { getVisualPresetForMolecule, getSpacingForScale, getCardPreset } from "../lib/layout/preset-resolver";
export { resolveMoleculeLayout } from "../lib/layout/molecule-layout-resolver";
export { getCardLayoutPreset } from "../lib/layout/card-layout-presets";
