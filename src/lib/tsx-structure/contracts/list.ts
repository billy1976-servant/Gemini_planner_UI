/**
 * List structure contract: config type, renderer props, and renderer boundary.
 */

import type { ListStructureConfig } from "../types";

export type { ListStructureConfig };

export interface ListRendererProps {
  structureConfig: ListStructureConfig;
  structureType: "list";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onSortChange?: (key: string, order: "asc" | "desc") => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

/** JSON controls: density, sort, filter, pagination, selection, orientation. TSX controls: item components, animations, data fetching, actual sort/filter implementation. */
export const LIST_RENDERER_BOUNDARY =
  "JSON controls: density, sort, filter, pagination, selection, orientation. TSX controls: item components, animations, data fetching, actual sort/filter implementation.";
