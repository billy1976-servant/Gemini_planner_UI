/**
 * In-memory built-in templates sourced from existing template JSON.
 * Map: structureType → templateId → template object.
 */

import type { StructureType } from "../types";

export type BuiltinTemplatesMap = Record<StructureType, Record<string, Record<string, unknown>>>;

export const BUILTIN_TEMPLATES: BuiltinTemplatesMap = {
  list: {
    default: { density: "default", sort: { enabled: true, defaultOrder: "asc" }, filter: { enabled: false }, pagination: { mode: "none" }, selection: { mode: "none" }, orientation: "vertical" },
    compact: { density: "compact", sort: { enabled: true, defaultOrder: "desc" }, filter: { enabled: true, placement: "inline" }, pagination: { mode: "loadMore", pageSize: 30 }, selection: { mode: "single" }, orientation: "vertical" },
    dense: { density: "table", sort: { enabled: true, defaultKey: "updated", defaultOrder: "desc" }, filter: { enabled: true, placement: "above" }, pagination: { mode: "page", pageSize: 50 }, selection: { mode: "multiple" }, orientation: "vertical" },
    minimal: { density: "spacious", sort: { enabled: false }, filter: { enabled: false }, pagination: { mode: "none" }, selection: { mode: "none" }, orientation: "vertical" },
  },
  board: {
    default: { columns: { source: "data", minWidth: 200 }, cards: { minHeight: 60, showPreview: true }, drag: { enabled: true, betweenColumnsOnly: true }, swimlanes: { enabled: false }, density: "default" },
    minimal: { columns: { source: "data", minWidth: 160 }, cards: { minHeight: 48, showPreview: false }, drag: { enabled: false, betweenColumnsOnly: true }, swimlanes: { enabled: false }, density: "compact" },
    pipeline: { columns: { source: "config", minWidth: 180, maxWidth: 280 }, cards: { minHeight: 72, showPreview: true }, drag: { enabled: true, betweenColumnsOnly: true }, swimlanes: { enabled: false }, density: "spacious" },
    swimlanes: { columns: { source: "data", minWidth: 220 }, cards: { minHeight: 60, showPreview: true }, drag: { enabled: true, betweenColumnsOnly: true }, swimlanes: { enabled: true, orientation: "horizontal" }, density: "default" },
  },
  dashboard: {
    default: { grid: { columns: 12, gap: 16, rowHeight: 80 }, widgets: { resizable: true, draggable: true, minW: 1, minH: 1 }, preset: "default" },
    compact: { grid: { columns: 12, gap: 8, rowHeight: 60 }, widgets: { resizable: true, draggable: true, minW: 1, minH: 1 }, preset: "compact" },
    "single-column": { grid: { columns: 1, gap: 16, rowHeight: 100 }, widgets: { resizable: false, draggable: true, minW: 1, minH: 1 }, preset: "single-column" },
    wide: { grid: { columns: 24, gap: 24, rowHeight: 80 }, widgets: { resizable: true, draggable: true, minW: 2, minH: 1 }, preset: "wide" },
  },
  editor: {
    default: { toolbar: { placement: "top", sticky: true }, sidebars: { left: null, right: null }, dirtyState: { indicator: "dot", confirmOnLeave: true }, contentArea: { maxWidth: null, padding: "normal" } },
    minimal: { toolbar: { placement: "none", sticky: false }, sidebars: { left: null, right: null }, dirtyState: { indicator: "none", confirmOnLeave: false }, contentArea: { maxWidth: null, padding: "normal" } },
    "sidebar-left": { toolbar: { placement: "top", sticky: true }, sidebars: { left: { enabled: true, width: 280, collapsible: true }, right: null }, dirtyState: { indicator: "dot", confirmOnLeave: true }, contentArea: { maxWidth: null, padding: "normal" } },
    fullscreen: { toolbar: { placement: "floating", sticky: false }, sidebars: { left: null, right: null }, dirtyState: { indicator: "bar", confirmOnLeave: true }, contentArea: { maxWidth: null, padding: "minimal" } },
  },
  timeline: {
    default: { slotMinutes: 15, dayStart: 360, dayEnd: 1320, density: "default", axis: { show: true, width: 48, position: "left" }, overlayPolicy: "local", viewModes: ["day", "week", "month"], defaultView: "day", interaction: { drag: true, resize: true, select: true }, dataBinding: {} },
    compact: { slotMinutes: 30, dayStart: 360, dayEnd: 1320, density: "compact", axis: { show: true, width: 40, position: "left" }, overlayPolicy: "local", viewModes: ["day", "week"], defaultView: "day", interaction: { drag: true, resize: false, select: true }, dataBinding: {} },
    "day-only": { slotMinutes: 10, dayStart: 0, dayEnd: 1439, density: "default", axis: { show: true, width: 56, position: "left" }, overlayPolicy: "system", viewModes: ["day"], defaultView: "day", interaction: { drag: true, resize: true, select: true }, dataBinding: { eventsKey: "events", tasksKey: "tasks" } },
    "week-month": { slotMinutes: 15, dayStart: 360, dayEnd: 1320, density: "spacious", axis: { show: true, width: 48, position: "left" }, overlayPolicy: "system", viewModes: ["day", "week", "month"], defaultView: "week", interaction: { drag: true, resize: true, select: true }, dataBinding: {} },
  },
  detail: {
    default: { split: { orientation: "horizontal", masterRatio: 0.35, resizable: true }, master: { position: "left", listDensity: "default" }, detail: { emptyState: "Select an item", persistSelection: true } },
    minimal: { split: { orientation: "horizontal", masterRatio: 0.25, resizable: false }, master: { position: "left", listDensity: "compact" }, detail: { emptyState: "", persistSelection: false } },
    "detail-right": { split: { orientation: "horizontal", masterRatio: 0.35, resizable: true }, master: { position: "left", listDensity: "compact" }, detail: { emptyState: "Select an item", persistSelection: true } },
    "detail-bottom": { split: { orientation: "vertical", masterRatio: 0.4, resizable: true }, master: { position: "top", listDensity: "default" }, detail: { emptyState: "Select an item", persistSelection: true } },
  },
  wizard: {
    default: { steps: { source: "config", showProgress: true, progressStyle: "stepper" }, navigation: { back: true, next: true, skip: false, placement: "bottom" }, branching: { enabled: false }, linear: true },
    minimal: { steps: { source: "config", showProgress: false, progressStyle: "minimal" }, navigation: { back: true, next: true, skip: false, placement: "bottom" }, branching: { enabled: false }, linear: true },
    linear: { steps: { source: "config", showProgress: true, progressStyle: "dots" }, navigation: { back: true, next: true, skip: false, placement: "sides" }, branching: { enabled: false }, linear: true },
    branched: { steps: { source: "data", showProgress: true, progressStyle: "bar" }, navigation: { back: true, next: true, skip: true, placement: "bottom" }, branching: { enabled: true, decisionKey: "branch" }, linear: false },
  },
  gallery: {
    default: { layout: "grid", grid: { columns: 3, gap: 16, aspectRatio: "1/1" }, lightbox: { enabled: true, swipe: true }, density: "default" },
    minimal: { layout: "grid", grid: { columns: 2, gap: 8, aspectRatio: "1/1" }, lightbox: { enabled: false, swipe: false }, density: "compact" },
    masonry: { layout: "masonry", grid: { columns: 4, gap: 12, aspectRatio: "auto" }, lightbox: { enabled: true, swipe: true }, density: "compact" },
    uniform: { layout: "uniform", grid: { columns: 4, gap: 24, aspectRatio: "16/9" }, lightbox: { enabled: true, swipe: true }, density: "spacious" },
  },
};
