"use client";

/**
 * Dashboard engine: normalizer and useDashboardConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { DashboardStructureConfig } from "../types";

export function toDashboardConfig(template: Record<string, unknown>): DashboardStructureConfig {
  const grid = (template.grid as Record<string, unknown>) ?? {};
  const widgets = (template.widgets as Record<string, unknown>) ?? {};
  return {
    grid: {
      columns: typeof grid.columns === "number" ? Math.max(1, Math.min(24, grid.columns)) : 12,
      gap: typeof grid.gap === "number" ? Math.max(0, grid.gap) : 16,
      rowHeight: typeof grid.rowHeight === "number" ? Math.max(20, grid.rowHeight) : 80,
    },
    breakpoints: template.breakpoints as DashboardStructureConfig["breakpoints"],
    widgets: {
      resizable: widgets.resizable !== false,
      draggable: widgets.draggable !== false,
      minW: typeof widgets.minW === "number" ? widgets.minW : 1,
      minH: typeof widgets.minH === "number" ? widgets.minH : 1,
    },
    preset: typeof template.preset === "string" ? template.preset : undefined,
  };
}

export function useDashboardConfig(): DashboardStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "dashboard") return null;
  return toDashboardConfig(resolved.template);
}
