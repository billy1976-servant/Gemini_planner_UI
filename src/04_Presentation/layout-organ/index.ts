/**
 * Organ layout: capabilities and internal layout IDs per organ type.
 * Internal organ layout only; does not control section placement.
 */

export {
  getOrganLayoutProfile,
  getInternalLayoutIds,
  getDefaultInternalLayoutId,
  isValidInternalLayoutId,
  resolveInternalLayoutId,
  getOrganLayoutOrganIds,
  getInternalLayoutOptionsForDev,
} from "./organ-layout-resolver";
