"use client";

/**
 * Gallery engine: normalizer and useGalleryConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { GalleryStructureConfig } from "../types";

export function toGalleryConfig(template: Record<string, unknown>): GalleryStructureConfig {
  const grid = (template.grid as Record<string, unknown>) ?? {};
  const lightbox = (template.lightbox as Record<string, unknown>) ?? {};
  const layoutVal = template.layout as string;
  const layout: GalleryStructureConfig["layout"] = ["grid", "masonry", "uniform"].includes(layoutVal)
    ? (layoutVal as GalleryStructureConfig["layout"])
    : "grid";
  const densityVal = template.density as string;
  const density: GalleryStructureConfig["density"] = ["compact", "default", "spacious"].includes(densityVal)
    ? (densityVal as GalleryStructureConfig["density"])
    : "default";

  return {
    layout,
    grid: {
      columns: typeof grid.columns === "number" ? Math.max(1, Math.min(12, grid.columns)) : 3,
      gap: typeof grid.gap === "number" ? Math.max(0, grid.gap) : 16,
      aspectRatio: typeof grid.aspectRatio === "string" ? grid.aspectRatio : "1/1",
    },
    lightbox: {
      enabled: lightbox.enabled !== false,
      swipe: lightbox.swipe !== false,
    },
    density,
  };
}

export function useGalleryConfig(): GalleryStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "gallery") return null;
  return toGalleryConfig(resolved.template);
}
