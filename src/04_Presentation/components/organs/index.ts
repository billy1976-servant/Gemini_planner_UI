/**
 * Organs layer: single public API for expansion and loading.
 * Import from @/components/organs only; do not import from organ-registry or resolve-organs directly.
 */
export {
  expandOrgans,
  expandOrgansInDocument,
  assignSectionInstanceKeys,
  type LoadOrganVariant,
} from "./resolve-organs";
export {
  loadOrganVariant,
  getOrganIds,
  getVariantIds,
  getOrganLabel,
} from "./organ-registry";
