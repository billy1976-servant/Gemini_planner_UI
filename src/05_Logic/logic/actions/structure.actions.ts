/**
 * Structure actions — single key state.values.structure; atomic state.update only.
 */

import { getState, dispatchState } from "@/state/state-store";
import type { StructureItem, Block, ResolvedRuleset, StructureTreeNode, Rollup } from "@/logic/engines/structure/structure.types";
import { applyCancelDay } from "@/logic/engines/structure/prioritization.engine";
import { streamToCandidates } from "@/logic/engines/structure/extreme-mode-parser";
import { aggregateByDateRange } from "@/logic/engines/structure/aggregation.engine";
import { BASE_PLANNER_TREE } from "@/logic/planner/base-planner-tree";
import { mergeTreeFragmentsUnderBase } from "@/logic/planner/tree-merge";
import { resolveDueDate } from "@/logic/planner/relative-time";
import type { JourneyItemTemplate } from "@/logic/planner/journey-types";
import { getJourneyPack } from "@/logic/planner/journey-registry";

const STRUCTURE_KEY = "structure";

type StructureSlice = {
  domain?: string;
  tree: StructureTreeNode[];
  items: StructureItem[];
  blocksByDate: Record<string, Block[]>;
  rules: ResolvedRuleset;
  activePlannerId?: string;
  /** V6: calendar view mode */
  calendarView?: "day" | "week" | "month";
  /** V6: selected date (ISO) for day/week/month */
  selectedDate?: string;
  /** V6: 7 ISO dates for week view (Sun–Sat) */
  weekDates?: string[];
  /** V6: rollups per day for month view */
  monthRollup?: Rollup[];
  /** V6: counts for stats layer */
  stats?: { todayCount: number; weekCount: number; monthCount: number };
};

const EMPTY_SLICE: StructureSlice = {
  tree: [],
  items: [],
  blocksByDate: {},
  rules: {},
};

function getSlice(): StructureSlice {
  const values = getState()?.values;
  const s = values?.[STRUCTURE_KEY];
  if (s && typeof s === "object" && Array.isArray(s.items)) {
    const slice = s as StructureSlice;
    if (!slice.tree?.length) {
      const withBase = { ...slice, tree: [...BASE_PLANNER_TREE] };
      writeSlice(withBase);
      return withBase;
    }
    return slice;
  }
  const initial: StructureSlice = { ...EMPTY_SLICE, tree: [...BASE_PLANNER_TREE] };
  writeSlice(initial);
  return initial;
}

function writeSlice(next: StructureSlice): void {
  dispatchState("state.update", { key: STRUCTURE_KEY, value: next });
}

function nextId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function now(): string {
  return new Date().toISOString();
}

function normalizeItem(partial: Partial<StructureItem>): StructureItem {
  const id = (partial.id && String(partial.id).trim()) || nextId();
  return {
    id,
    title: typeof partial.title === "string" ? partial.title : "",
    categoryId: typeof partial.categoryId === "string" ? partial.categoryId : "default",
    priority: typeof partial.priority === "number" ? partial.priority : 5,
    dueDate: partial.dueDate != null ? partial.dueDate : null,
    createdAt: partial.createdAt ?? now(),
    updatedAt: partial.updatedAt ?? now(),
    ...(partial.recurrence && { recurrence: partial.recurrence }),
    ...(partial.habit && { habit: partial.habit }),
    ...(partial.signals && { signals: partial.signals }),
    ...(partial.blockers && { blockers: partial.blockers }),
    ...(partial.opportunities && { opportunities: partial.opportunities }),
    ...(partial.metadata && { metadata: partial.metadata }),
  };
}

export function structureAddItem(
  action: { item?: Partial<StructureItem> },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const item = normalizeItem(action.item ?? {});
  const items = [...slice.items];
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  writeSlice({ ...slice, items });
}

export function structureAddItems(
  action: { items?: Partial<StructureItem>[] },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const list = Array.isArray(action.items) ? action.items : [];
  const items = [...slice.items];
  for (const partial of list) {
    const item = normalizeItem(partial ?? {});
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
  }
  writeSlice({ ...slice, items });
}

export function structureUpdateItem(
  action: { id?: string; patch?: Partial<StructureItem> },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const id = action.id;
  if (!id) return;
  const items = slice.items.map((i) =>
    i.id === id ? { ...i, ...action.patch, updatedAt: now() } : i
  );
  writeSlice({ ...slice, items });
}

export function structureDeleteItem(
  action: { id?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const id = action.id;
  if (!id) return;
  const items = slice.items.filter((i) => i.id !== id);
  writeSlice({ ...slice, items });
}

export function structureSetBlocksForDate(
  action: { date?: string; blocks?: Block[] },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const date = action.date;
  if (!date) return;
  const blocksByDate = { ...slice.blocksByDate, [date]: Array.isArray(action.blocks) ? action.blocks : [] };
  writeSlice({ ...slice, blocksByDate });
}

export function structureSetActivePlanner(
  action: { plannerId?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  writeSlice({ ...slice, activePlannerId: action.plannerId ?? undefined });
}

export function structureCancelDay(
  action: { date?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const dateStr = action.date;
  if (!dateStr) return;
  const date = new Date(dateStr);
  const items = applyCancelDay(slice.items, date, slice.rules);
  writeSlice({ ...slice, items });
}

/** V6 Stage 1: Parse text into candidates and add to structure.items. Reads text from action.text or state.values.structure_draftText. */
/** OSB V5: Load journey pack (or payload), resolve relative-time, merge tree + items into structure. Single write. */
export function structureAddJourney(
  action: {
    journeyId?: string;
    tree?: StructureTreeNode[];
    items?: JourneyItemTemplate[];
    targetDate?: string;
    startDate?: string;
  },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  let treeFragments: StructureTreeNode[] = [];
  let itemTemplates: JourneyItemTemplate[] = [];
  let targetDate = action.targetDate;
  let startDate = action.startDate;

  if (action.journeyId) {
    const pack = getJourneyPack(action.journeyId);
    if (!pack) return;
    treeFragments = pack.tree ?? [];
    itemTemplates = pack.items ?? [];
    if (!targetDate && pack.items?.length) targetDate = toISODate(addDays(new Date(), 14));
  } else {
    treeFragments = action.tree ?? [];
    itemTemplates = action.items ?? [];
  }

  const resolvedItems: Partial<StructureItem>[] = itemTemplates.map((t) => {
    const dueDate = resolveDueDate(t, targetDate, startDate);
    const { dueOffset, relativeTo, ...rest } = t;
    return { ...rest, dueDate: dueDate ?? (rest.dueDate ?? null) };
  });

  const items = [...slice.items];
  for (const partial of resolvedItems) {
    const item = normalizeItem(partial);
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
  }

  const mergedTree = treeFragments.length
    ? mergeTreeFragmentsUnderBase(slice.tree, treeFragments)
    : slice.tree;

  writeSlice({ ...slice, tree: mergedTree, items });
}

const PLANNER_TRACE_PREFIX = "[structure:addFromText]";

export function structureAddFromText(
  action: { text?: string },
  _state: Record<string, any>
): void {
  const trace = getState()?.values?.diagnostics_plannerPipelineTrace === true;
  if (trace) console.log(`${PLANNER_TRACE_PREFIX} ENTER text=`, typeof action.text === "string" ? action.text : "(from draft)" );

  const slice = getSlice();
  const text =
    typeof action.text === "string"
      ? action.text.trim()
      : (getState()?.values?.structure_draftText as string)?.trim?.() ?? "";
  if (!text) {
    if (trace) console.log(`${PLANNER_TRACE_PREFIX} EXIT no text`);
    return;
  }
  const segments = [{ text, isFinal: true }];
  const refDate = new Date();
  const { candidates } = streamToCandidates(segments, slice.rules ?? {}, refDate);
  if (trace) console.log(`${PLANNER_TRACE_PREFIX} (1) parse → candidates=${candidates.length}`, candidates.map((c) => ({ title: c.title, dueDate: c.dueDate })));
  if (candidates.length === 0) {
    if (trace) console.log(`${PLANNER_TRACE_PREFIX} EXIT no candidates`);
    return;
  }
  const items = [...slice.items];
  for (const c of candidates) {
    const item = normalizeItem(c);
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
  }
  writeSlice({ ...slice, items });
  if (trace) console.log(`${PLANNER_TRACE_PREFIX} (2) writeSlice items.length=${items.length}; (3) blocksByDate NOT updated; (4) selectedDate/calendarView NOT updated; (5) scheduledFromState will populate at render from structure.items`);

  // Clear draft text if it was used
  if (getState()?.values?.structure_draftText != null) {
    dispatchState("state.update", { key: "structure_draftText", value: "" });
  }
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function computeStats(slice: StructureSlice): StructureSlice["stats"] {
  const items = slice.items;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = addDays(weekStart, 6);
  weekEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  const dayRoll = aggregateByDateRange(items, today, today, "day");
  const weekRoll = aggregateByDateRange(items, weekStart, weekEnd, "day");
  const monthRoll = aggregateByDateRange(items, monthStart, monthEnd, "day");
  const todayCount = dayRoll.reduce((s, r) => s + r.count, 0);
  const weekCount = weekRoll.reduce((s, r) => s + r.count, 0);
  const monthCount = monthRoll.reduce((s, r) => s + r.count, 0);
  return { todayCount, weekCount, monthCount };
}

/** V6 Stage 2: Set calendar view to day and selectedDate to today or payload date. */
export function calendarSetDay(
  action: { date?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const dateStr = action.date ?? toISODate(new Date());
  const stats = computeStats({ ...slice, selectedDate: dateStr });
  writeSlice({
    ...slice,
    calendarView: "day",
    selectedDate: dateStr,
    weekDates: undefined,
    monthRollup: undefined,
    stats,
  });
}

/** V6 Stage 2: Set calendar view to week; selectedDate = week start (Sunday); set weekDates (7 days). */
export function calendarSetWeek(
  action: { date?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const ref = action.date ? new Date(action.date) : new Date();
  const start = new Date(ref);
  start.setDate(start.getDate() - start.getDay());
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) weekDates.push(toISODate(addDays(start, i)));
  const stats = computeStats(slice);
  writeSlice({
    ...slice,
    calendarView: "week",
    selectedDate: toISODate(start),
    weekDates,
    monthRollup: undefined,
    stats,
  });
}

/** V6 Stage 2: Set calendar view to month; selectedDate = first of month; set monthRollup. */
export function calendarSetMonth(
  action: { date?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const ref = action.date ? new Date(action.date) : new Date();
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const monthRollup = aggregateByDateRange(slice.items, first, last, "day");
  const stats = computeStats(slice);
  writeSlice({
    ...slice,
    calendarView: "month",
    selectedDate: toISODate(first),
    weekDates: undefined,
    monthRollup,
    stats,
  });
}

/** V6 Stage 2: Set selectedDate only; refresh monthRollup if view is month. */
export function calendarSetDate(
  action: { date?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  if (!action.date) return;
  const selectedDate = action.date;
  let weekDates = slice.weekDates;
  let monthRollup = slice.monthRollup;
  if (slice.calendarView === "week") {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    weekDates = [];
    for (let i = 0; i < 7; i++) weekDates.push(toISODate(addDays(start, i)));
  }
  if (slice.calendarView === "month") {
    const first = new Date(selectedDate + "T00:00:00");
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    monthRollup = aggregateByDateRange(slice.items, first, last, "day");
  }
  const stats = computeStats({ ...slice, selectedDate });
  writeSlice({
    ...slice,
    selectedDate,
    weekDates,
    monthRollup,
    stats,
  });
}
