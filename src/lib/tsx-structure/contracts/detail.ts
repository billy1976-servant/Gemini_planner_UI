/**
 * Detail (master-detail) structure contract: config type, renderer props, and renderer boundary.
 */

import type { DetailStructureConfig } from "../types";

export type { DetailStructureConfig };

export interface DetailRendererProps {
  structureConfig: DetailStructureConfig;
  structureType: "detail";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onSelectionChange?: (itemId: string | null) => void;
}

/** JSON controls: split orientation/masterRatio/resizable, master position/listDensity, detail emptyState/persistSelection. TSX controls: master list and detail panel components, selection sync, data fetching. */
export const DETAIL_RENDERER_BOUNDARY =
  "JSON controls: split orientation/masterRatio/resizable, master position/listDensity, detail emptyState/persistSelection. TSX controls: master list and detail panel components, selection sync, data fetching.";
