/**
 * Structure types and templates per type — single source of truth for LAYOUT_SYSTEM_CONTRACT.
 * Authority: LAYOUT_SYSTEM_CONTRACT.md §1 and §3. Used by run-apps for validation and reporting.
 */
export const STRUCTURE_TYPES: readonly string[] = [
  "list",
  "board",
  "dashboard",
  "editor",
  "timeline",
  "detail",
  "wizard",
  "gallery",
] as const;

export const TEMPLATES_BY_STRUCTURE_TYPE: Readonly<Record<string, readonly string[]>> = {
  list: ["default", "compact", "dense", "minimal"],
  board: ["default", "minimal", "pipeline", "swimlanes"],
  dashboard: ["default", "compact", "single-column", "wide"],
  editor: ["default", "minimal", "sidebar-left", "fullscreen"],
  timeline: ["default", "compact", "day-only", "week-month"],
  detail: ["default", "minimal", "detail-right", "detail-bottom"],
  wizard: ["default", "minimal", "linear", "branched"],
  gallery: ["default", "minimal", "masonry", "uniform"],
} as const;
