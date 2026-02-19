/**
 * TSX Structure contracts — config types, renderer props, and boundaries for all 8 structure types.
 */

export * from "./list";
export * from "./board";
export * from "./dashboard";
export * from "./editor";
export * from "./timeline";
export * from "./detail";
export * from "./wizard";
export * from "./gallery";

import type { StructureType } from "../types";
import type { ListStructureConfig, BoardStructureConfig, DashboardStructureConfig, EditorStructureConfig, TimelineStructureConfig, DetailStructureConfig, WizardStructureConfig, GalleryStructureConfig } from "../types";
import { LIST_RENDERER_BOUNDARY } from "./list";
import { BOARD_RENDERER_BOUNDARY } from "./board";
import { DASHBOARD_RENDERER_BOUNDARY } from "./dashboard";
import { EDITOR_RENDERER_BOUNDARY } from "./editor";
import { TIMELINE_RENDERER_BOUNDARY } from "./timeline";
import { DETAIL_RENDERER_BOUNDARY } from "./detail";
import { WIZARD_RENDERER_BOUNDARY } from "./wizard";
import { GALLERY_RENDERER_BOUNDARY } from "./gallery";

export type StructureConfigMap = {
  list: ListStructureConfig;
  board: BoardStructureConfig;
  dashboard: DashboardStructureConfig;
  editor: EditorStructureConfig;
  timeline: TimelineStructureConfig;
  detail: DetailStructureConfig;
  wizard: WizardStructureConfig;
  gallery: GalleryStructureConfig;
};

const BOUNDARIES: Record<StructureType, string> = {
  list: LIST_RENDERER_BOUNDARY,
  board: BOARD_RENDERER_BOUNDARY,
  dashboard: DASHBOARD_RENDERER_BOUNDARY,
  editor: EDITOR_RENDERER_BOUNDARY,
  timeline: TIMELINE_RENDERER_BOUNDARY,
  detail: DETAIL_RENDERER_BOUNDARY,
  wizard: WIZARD_RENDERER_BOUNDARY,
  gallery: GALLERY_RENDERER_BOUNDARY,
};

export function getContractBoundary(type: StructureType): string {
  return BOUNDARIES[type] ?? "";
}
