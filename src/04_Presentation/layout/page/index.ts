/**
 * Page layout: section placement only (container width, surface, split).
 */

export {
  resolvePageLayout,
  getPageLayoutById,
  getPageLayoutId,
  getPageLayoutIds,
  getDefaultSectionLayoutId,
  type PageLayoutDefinition,
} from "./page-layout-resolver";
export { collectSectionKeysAndNodes, collectSectionLabels } from "./section-helpers";
export {
  getAllowedCardPresetsForSectionPreset,
  getDefaultCardPresetForSectionPreset,
  SECTION_TO_CARD_CAPABILITIES,
} from "./capabilities";
