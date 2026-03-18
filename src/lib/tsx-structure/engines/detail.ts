"use client";

/**
 * Detail engine: normalizer and useDetailConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { DetailStructureConfig } from "../types";

export function toDetailConfig(template: Record<string, unknown>): DetailStructureConfig {
  const split = (template.split as Record<string, unknown>) ?? {};
  const master = (template.master as Record<string, unknown>) ?? {};
  const detail = (template.detail as Record<string, unknown>) ?? {};
  return {
    split: {
      orientation: split.orientation === "vertical" ? "vertical" : "horizontal",
      masterRatio: typeof split.masterRatio === "number" ? Math.max(0.1, Math.min(0.9, split.masterRatio)) : 0.35,
      resizable: split.resizable !== false,
      minMaster: typeof split.minMaster === "number" ? split.minMaster : undefined,
      minDetail: typeof split.minDetail === "number" ? split.minDetail : undefined,
    },
    master: {
      position: ((): DetailStructureConfig["master"]["position"] => {
        const v = master.position as string;
        return ["left", "right", "top", "bottom"].includes(v) ? (v as DetailStructureConfig["master"]["position"]) : "left";
      })(),
      listDensity: ((): DetailStructureConfig["master"]["listDensity"] => {
        const v = master.listDensity as string;
        return ["compact", "default", "spacious"].includes(v) ? (v as DetailStructureConfig["master"]["listDensity"]) : "default";
      })(),
    },
    detail: {
      emptyState: typeof detail.emptyState === "string" ? detail.emptyState : "Select an item",
      persistSelection: detail.persistSelection !== false,
    },
  };
}

export function useDetailConfig(): DetailStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "detail") return null;
  return toDetailConfig(resolved.template);
}
