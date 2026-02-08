/**
 * Layout Compatibility Engine: read-only validation of section/card/organ
 * layouts against section content slots. No state changes; output is a
 * compatibility result for UI guidance.
 */

export { evaluateCompatibility } from "./compatibility-evaluator";
export type {
  CompatibilityResult,
  EvaluateCompatibilityArgs,
} from "./compatibility-evaluator";
export { getAvailableSlots } from "./content-capability-extractor";
export type { SectionNode, GetAvailableSlotsOptions } from "./content-capability-extractor";
export {
  getRequiredSlots,
  getRequiredSlotsForOrgan,
} from "./requirement-registry";
export type { LayoutType } from "./requirement-registry";
