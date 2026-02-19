/**
 * TSX App Structure Engine — shared types.
 * JSON is the control plane; TSX is the renderer. No per-screen registry.
 */

export type StructureType =
  | "list"
  | "board"
  | "dashboard"
  | "editor"
  | "timeline"
  | "detail"
  | "wizard"
  | "gallery";

export interface ResolvedAppStructure {
  structureType: StructureType;
  template: Record<string, unknown>;
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
}

export interface ScreenMetadata {
  structure?: {
    type: StructureType;
    templateId?: string;
    overrides?: Record<string, unknown>;
  };
}

/** Timeline/Calendar structure config (from JSON template + overrides). */
export interface TimelineStructureConfig {
  slotMinutes: 5 | 10 | 15 | 30 | 60;
  dayStart: number;
  dayEnd: number;
  density: "compact" | "default" | "spacious";
  zoom?: { preset?: string; slotHeight?: number };
  axis: { show: boolean; width?: number; position?: "left" | "right" };
  overlayPolicy: "system" | "local";
  viewModes: ("day" | "week" | "month")[];
  defaultView: "day" | "week" | "month";
  interaction: { drag: boolean; resize: boolean; select: boolean };
  dataBinding?: { eventsKey?: string; tasksKey?: string; chunksKey?: string; adapter?: string };
}

/** List structure config. */
export interface ListStructureConfig {
  density: "compact" | "default" | "spacious" | "table";
  sort: { enabled: boolean; defaultKey?: string; defaultOrder?: "asc" | "desc" };
  filter: { enabled: boolean; placement?: "inline" | "above" | "drawer" };
  pagination: { mode: "none" | "page" | "infinite" | "loadMore"; pageSize?: number };
  selection: { mode: "none" | "single" | "multiple" };
  orientation: "vertical" | "horizontal";
}

/** Board structure config. */
export interface BoardStructureConfig {
  columns: { source: "config" | "data"; minWidth: number; maxWidth?: number };
  cards: { minHeight: number; showPreview: boolean };
  drag: { enabled: boolean; betweenColumnsOnly: boolean };
  swimlanes: { enabled: boolean; orientation?: "horizontal" | "vertical" };
  density: "compact" | "default" | "spacious";
}

/** Dashboard structure config. */
export interface DashboardStructureConfig {
  grid: { columns: number; gap: number; rowHeight: number };
  breakpoints?: { sm?: number; md?: number; lg?: number; xl?: number };
  widgets: { resizable: boolean; draggable: boolean; minW: number; minH: number };
  preset?: string;
}

/** Editor structure config. */
export interface EditorStructureConfig {
  toolbar: { placement: "top" | "bottom" | "floating" | "none"; sticky: boolean };
  sidebars: {
    left: { enabled?: boolean; width?: number; collapsible?: boolean } | null;
    right: { enabled?: boolean; width?: number; collapsible?: boolean } | null;
  };
  dirtyState: { indicator: "none" | "dot" | "badge" | "bar"; confirmOnLeave: boolean };
  contentArea: { maxWidth: number | null; padding: string };
}

/** Detail (master-detail) structure config. */
export interface DetailStructureConfig {
  split: {
    orientation: "horizontal" | "vertical";
    masterRatio: number;
    resizable: boolean;
    minMaster?: number;
    minDetail?: number;
  };
  master: { position: "left" | "right" | "top" | "bottom"; listDensity: "compact" | "default" | "spacious" };
  detail: { emptyState: string; persistSelection: boolean };
}

/** Wizard structure config. */
export interface WizardStructureConfig {
  steps: { source: "config" | "data"; showProgress: boolean; progressStyle: "bar" | "stepper" | "dots" | "minimal" };
  navigation: { back: boolean; next: boolean; skip: boolean; placement: "bottom" | "top" | "sides" };
  branching: { enabled: boolean; decisionKey?: string };
  linear: boolean;
}

/** Gallery structure config. */
export interface GalleryStructureConfig {
  layout: "grid" | "masonry" | "uniform";
  grid: { columns: number; gap: number; aspectRatio: string };
  lightbox: { enabled: boolean; swipe: boolean };
  density: "compact" | "default" | "spacious";
}

/** Resolver path-pattern config (e.g. from tsx-structure-resolver.json). */
export interface ResolverPatternConfig {
  glob: string;
  structureType: StructureType;
  templateId: string;
}

export interface ResolverConfig {
  patterns?: ResolverPatternConfig[];
  default?: { structureType: StructureType; templateId: string };
}

export const SCHEMA_VERSION = "1.0";
