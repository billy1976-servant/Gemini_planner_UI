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
  type LayoutDefinition,
} from "./resolver";
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
