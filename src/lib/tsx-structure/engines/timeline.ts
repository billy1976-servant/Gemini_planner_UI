"use client";

/**
 * Timeline engine: normalizer and useTimelineConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { TimelineStructureConfig } from "../types";

const SLOT_MINUTES = [5, 10, 15, 30, 60] as const;
const DEFAULT_SLOT = 15;

function toSlotMinutes(v: unknown): 5 | 10 | 15 | 30 | 60 {
  const n = Number(v);
  if (Number.isInteger(n) && (SLOT_MINUTES as readonly number[]).includes(n))
    return n as 5 | 10 | 15 | 30 | 60;
  return DEFAULT_SLOT;
}

export function toTimelineConfig(template: Record<string, unknown>): TimelineStructureConfig {
  const axis = (template.axis as Record<string, unknown>) ?? {};
  const interaction = (template.interaction as Record<string, unknown>) ?? {};
  const viewModes = (template.viewModes as ("day" | "week" | "month")[]) ?? ["day", "week", "month"];
  const defaultView = (template.defaultView as "day" | "week" | "month") ?? "day";
  return {
    slotMinutes: toSlotMinutes(template.slotMinutes),
    dayStart: Math.max(0, Math.min(1439, Number(template.dayStart) || 360)),
    dayEnd: Math.max(0, Math.min(1439, Number(template.dayEnd) || 1320)),
    density: ((): TimelineStructureConfig["density"] => {
      const v = template.density as string;
      return ["compact", "default", "spacious"].includes(v) ? (v as TimelineStructureConfig["density"]) : "default";
    })(),
    zoom: template.zoom as TimelineStructureConfig["zoom"],
    axis: {
      show: axis.show !== false,
      width: typeof axis.width === "number" ? axis.width : 48,
      position: axis.position === "right" ? "right" : "left",
    },
    overlayPolicy: template.overlayPolicy === "system" ? "system" : "local",
    viewModes: Array.isArray(viewModes) ? viewModes : ["day", "week", "month"],
    defaultView: ["day", "week", "month"].includes(defaultView) ? defaultView : "day",
    interaction: {
      drag: interaction.drag !== false,
      resize: interaction.resize !== false,
      select: interaction.select !== false,
    },
    dataBinding: (template.dataBinding as TimelineStructureConfig["dataBinding"]) ?? undefined,
  };
}

export function useTimelineConfig(): TimelineStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "timeline") return null;
  return toTimelineConfig(resolved.template);
}
