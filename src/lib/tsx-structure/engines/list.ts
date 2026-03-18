"use client";

/**
 * List engine: normalizer and useListConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { ListStructureConfig } from "../types";

export function toListConfig(template: Record<string, unknown>): ListStructureConfig {
  const sort = (template.sort as Record<string, unknown>) ?? {};
  const filter = (template.filter as Record<string, unknown>) ?? {};
  const pagination = (template.pagination as Record<string, unknown>) ?? {};
  const selection = (template.selection as Record<string, unknown>) ?? {};
  const densityVal = template.density as string;
  const density: ListStructureConfig["density"] = ["compact", "default", "spacious", "table"].includes(densityVal)
    ? (densityVal as ListStructureConfig["density"])
    : "default";
  const placementVal = filter.placement as string;
  const placement: ListStructureConfig["filter"]["placement"] | undefined = ["inline", "above", "drawer"].includes(placementVal)
    ? (placementVal as ListStructureConfig["filter"]["placement"])
    : undefined;
  const modeVal = pagination.mode as string;
  const paginationMode: ListStructureConfig["pagination"]["mode"] = ["none", "page", "infinite", "loadMore"].includes(modeVal)
    ? (modeVal as ListStructureConfig["pagination"]["mode"])
    : "none";
  const selectionModeVal = selection.mode as string;
  const selectionMode: ListStructureConfig["selection"]["mode"] = ["none", "single", "multiple"].includes(selectionModeVal)
    ? (selectionModeVal as ListStructureConfig["selection"]["mode"])
    : "none";

  return {
    density,
    sort: {
      enabled: sort.enabled !== false,
      defaultKey: sort.defaultKey as string | undefined,
      defaultOrder: (sort.defaultOrder === "desc" ? "desc" : "asc") as "asc" | "desc",
    },
    filter: {
      enabled: filter.enabled === true,
      placement,
    },
    pagination: {
      mode: paginationMode,
      pageSize: typeof pagination.pageSize === "number" ? pagination.pageSize : undefined,
    },
    selection: {
      mode: selectionMode,
    },
    orientation: template.orientation === "horizontal" ? "horizontal" : "vertical",
  };
}

export function useListConfig(): ListStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "list") return null;
  return toListConfig(resolved.template);
}
