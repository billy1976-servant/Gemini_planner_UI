/**
 * TSX Structure engines — normalizers and typed hooks for all 8 structure types.
 */

export { normalizeTemplate } from "./shared";
export { toTimelineConfig, useTimelineConfig } from "./timeline";
export { toListConfig, useListConfig } from "./list";
export { toBoardConfig, useBoardConfig } from "./board";
export { toDashboardConfig, useDashboardConfig } from "./dashboard";
export { toEditorConfig, useEditorConfig } from "./editor";
export { toDetailConfig, useDetailConfig } from "./detail";
export { toWizardConfig, useWizardConfig } from "./wizard";
export { toGalleryConfig, useGalleryConfig } from "./gallery";

import type { StructureType } from "../types";
import { toTimelineConfig, useTimelineConfig } from "./timeline";
import { toListConfig, useListConfig } from "./list";
import { toBoardConfig, useBoardConfig } from "./board";
import { toDashboardConfig, useDashboardConfig } from "./dashboard";
import { toEditorConfig, useEditorConfig } from "./editor";
import { toDetailConfig, useDetailConfig } from "./detail";
import { toWizardConfig, useWizardConfig } from "./wizard";
import { toGalleryConfig, useGalleryConfig } from "./gallery";

type ToConfigFn = (template: Record<string, unknown>) => unknown;
type UseConfigFn = () => unknown;

export interface EngineDef {
  toConfig: ToConfigFn;
  useConfig: UseConfigFn;
}

const ENGINE_MAP: Record<StructureType, EngineDef> = {
  timeline: { toConfig: toTimelineConfig as ToConfigFn, useConfig: useTimelineConfig as UseConfigFn },
  list: { toConfig: toListConfig as ToConfigFn, useConfig: useListConfig as UseConfigFn },
  board: { toConfig: toBoardConfig as ToConfigFn, useConfig: useBoardConfig as UseConfigFn },
  dashboard: { toConfig: toDashboardConfig as ToConfigFn, useConfig: useDashboardConfig as UseConfigFn },
  editor: { toConfig: toEditorConfig as ToConfigFn, useConfig: useEditorConfig as UseConfigFn },
  detail: { toConfig: toDetailConfig as ToConfigFn, useConfig: useDetailConfig as UseConfigFn },
  wizard: { toConfig: toWizardConfig as ToConfigFn, useConfig: useWizardConfig as UseConfigFn },
  gallery: { toConfig: toGalleryConfig as ToConfigFn, useConfig: useGalleryConfig as UseConfigFn },
};

export function getEngine(type: StructureType): EngineDef {
  return ENGINE_MAP[type] ?? ENGINE_MAP.list;
}
