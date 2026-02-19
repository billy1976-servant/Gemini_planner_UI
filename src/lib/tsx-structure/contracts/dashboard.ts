/**
 * Dashboard structure contract: config type, renderer props, and renderer boundary.
 */

import type { DashboardStructureConfig } from "../types";

export type { DashboardStructureConfig };

export interface DashboardRendererProps {
  structureConfig: DashboardStructureConfig;
  structureType: "dashboard";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onLayoutChange?: (layout: unknown) => void;
}

/** JSON controls: grid columns/gap/rowHeight, widgets resizable/draggable/minW/minH, preset. TSX controls: widget components, layout engine, data fetching. */
export const DASHBOARD_RENDERER_BOUNDARY =
  "JSON controls: grid columns/gap/rowHeight, widgets resizable/draggable/minW/minH, preset. TSX controls: widget components, layout engine, data fetching.";
