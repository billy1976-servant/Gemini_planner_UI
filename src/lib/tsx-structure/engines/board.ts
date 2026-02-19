"use client";

/**
 * Board engine: normalizer and useBoardConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { BoardStructureConfig } from "../types";

export function toBoardConfig(template: Record<string, unknown>): BoardStructureConfig {
  const columns = (template.columns as Record<string, unknown>) ?? {};
  const cards = (template.cards as Record<string, unknown>) ?? {};
  const drag = (template.drag as Record<string, unknown>) ?? {};
  const swimlanes = (template.swimlanes as Record<string, unknown>) ?? {};
  return {
    columns: {
      source: columns.source === "config" ? "config" : "data",
      minWidth: typeof columns.minWidth === "number" ? Math.max(120, columns.minWidth) : 200,
      maxWidth: typeof columns.maxWidth === "number" ? columns.maxWidth : undefined,
    },
    cards: {
      minHeight: typeof cards.minHeight === "number" ? Math.max(40, cards.minHeight) : 60,
      showPreview: cards.showPreview !== false,
    },
    drag: {
      enabled: drag.enabled !== false,
      betweenColumnsOnly: drag.betweenColumnsOnly !== false,
    },
    swimlanes: {
      enabled: swimlanes.enabled === true,
      orientation: swimlanes.orientation === "vertical" ? "vertical" : "horizontal",
    },
    density: ((): BoardStructureConfig["density"] => {
      const v = template.density as string;
      return ["compact", "default", "spacious"].includes(v) ? (v as BoardStructureConfig["density"]) : "default";
    })(),
  };
}

export function useBoardConfig(): BoardStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "board") return null;
  return toBoardConfig(resolved.template);
}
