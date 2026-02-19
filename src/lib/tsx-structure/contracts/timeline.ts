/**
 * Timeline structure contract: config type, renderer props, and renderer boundary.
 */

import type { TimelineStructureConfig } from "../types";

export type { TimelineStructureConfig };

export interface TimelineRendererProps {
  structureConfig: TimelineStructureConfig;
  structureType: "timeline";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onSlotClick?: (date: Date, slotMinutes: number) => void;
  onViewChange?: (view: "day" | "week" | "month") => void;
  onEventMove?: (eventId: string, start: Date, end: Date) => void;
  onEventResize?: (eventId: string, start: Date, end: Date) => void;
}

/** JSON controls: slotMinutes, dayStart/dayEnd, density, zoom, axis show/width/position, overlayPolicy, viewModes, defaultView, interaction (drag/resize/select), dataBinding keys. TSX controls: slot/event components, drag/resize/select implementation, data fetching. */
export const TIMELINE_RENDERER_BOUNDARY =
  "JSON controls: slotMinutes, dayStart/dayEnd, density, zoom, axis show/width/position, overlayPolicy, viewModes, defaultView, interaction (drag/resize/select), dataBinding keys. TSX controls: slot/event components, drag/resize/select implementation, data fetching.";
