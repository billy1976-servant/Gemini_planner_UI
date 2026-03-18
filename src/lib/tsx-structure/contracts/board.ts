/**
 * Board structure contract: config type, renderer props, and renderer boundary.
 */

import type { BoardStructureConfig } from "../types";

export type { BoardStructureConfig };

export interface BoardRendererProps {
  structureConfig: BoardStructureConfig;
  structureType: "board";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onCardMove?: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  onColumnResize?: (columnId: string, width: number) => void;
}

/** JSON controls: columns source/minWidth, cards minHeight/showPreview, drag enabled/betweenColumnsOnly, swimlanes, density. TSX controls: column/card components, drag implementation, data fetching. */
export const BOARD_RENDERER_BOUNDARY =
  "JSON controls: columns source/minWidth, cards minHeight/showPreview, drag enabled/betweenColumnsOnly, swimlanes, density. TSX controls: column/card components, drag implementation, data fetching.";
