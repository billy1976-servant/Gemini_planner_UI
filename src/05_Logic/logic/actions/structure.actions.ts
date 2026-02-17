/**
 * Structure actions — single key state.values.structure; atomic state.update only.
 */

import { getState, dispatchState } from "@/state/state-store";
import type { StructureItem, Block, ResolvedRuleset, StructureTreeNode, Rollup, TaskTemplateRow, ParserPipelineConfig } from "@/logic/engines/structure/structure.types";
import { applyCancelDay } from "@/logic/engines/structure/prioritization.engine";
import { streamToCandidates, splitSentences } from "@/logic/engines/structure/extreme-mode-parser";
import { runPhrasePipeline } from "@/logic/engines/structure/parser-v4.engine";
import { aggregateByDateRange } from "@/logic/engines/structure/aggregation.engine";
import { BASE_PLANNER_TREE } from "@/logic/planner/base-planner-tree";
import { mergeTreeFragmentsUnderBase } from "@/logic/planner/tree-merge";
import { resolveDueDate } from "@/logic/planner/relative-time";
import type { JourneyItemTemplate } from "@/logic/planner/journey-types";
import { getJourneyPack } from "@/logic/planner/journey-registry";

const STRUCTURE_KEY = "structure";

/** V3/V4: one row from parser (candidate + user choice). */
export type ParserStagingRow = {
  id: string;
  raw: string;
  title: string;
  dueDate: string | null;
  categoryId: string;
  score?: number;
  status: "pending" | "use" | "add_use";
};

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
  /** V3/V4: parser staging (candidates before confirm). */
  parserStaging?: ParserStagingRow[];
  /** V4: task folder template (Folder → Subfolder → Category) for matcher. */
  taskFolderTemplate?: Record<string, { subfolders?: Record<string, { categories?: string[] }> }>;
  /** V4: flat template rows for tokenize/scoreMatch matcher. */
  taskTemplateRows?: TaskTemplateRow[];
  /** V4: parser pipeline config (tokenWeights, modifierVerbs, matcherThreshold). */
  parserConfig?: ParserPipelineConfig;
  /** V2: Section scheduling — selected folder/section for day (SCHEDULED WORK DAY / SCHEDULED [section]). */
  scheduledSection?: string;
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

/** V4: Default template rows from base tree for matcher (folder/subfolder/category + task alternatives). */
function getDefaultTaskTemplateRows(): TaskTemplateRow[] {
  const root = BASE_PLANNER_TREE.find((n) => n.children?.length);
  if (!root?.children) return [];
  const alternatives: Record<string, string[]> = {
    home: ["gardening", "lawn", "mow", "bills", "house", "chores", "errands", "shopping", "groceries"],
    business: ["email", "call", "meeting", "report", "client", "office", "work"],
    health: ["gym", "run", "exercise", "doctor", "appointment", "medicine"],
    relationships: ["call mom", "call dad", "family", "friend", "visit", "dinner"],
    finance: ["bank", "bills", "pay", "invoice", "budget", "tax"],
    projects: ["project", "task", "deadline", "review", "draft"],
    travel: ["book", "flight", "hotel", "trip", "vacation"],
    maintenance: ["oil change", "car", "repair", "fix", "service"],
    growth: ["read", "learn", "course", "practice"],
  };
  return root.children.map((node) => ({
    folder: root.id,
    subfolder: node.id,
    category: node.id,
    task: node.name,
    taskAlternatives: alternatives[node.id] ?? [],
  }));
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

/** V3/V4: Parse text to staging rows. Uses V4 pipeline (tokenize + matcher) when taskTemplateRows present. */
export function structureParseToStaging(
  action: { text?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const text =
    typeof action.text === "string"
      ? action.text.trim()
      : (getState()?.values?.structure_draftText as string)?.trim?.() ?? "";
  if (!text) return;
  const refDate = new Date();
  const templateRows = slice.taskTemplateRows?.length
    ? slice.taskTemplateRows
    : getDefaultTaskTemplateRows();
  const config = slice.parserConfig;

  if (templateRows.length > 0) {
    const phrases: string[] = [];
    const chunks = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    for (const chunk of chunks) {
      const parts = splitSentences(chunk);
      phrases.push(...(parts.length ? parts : [chunk]));
    }
    const rows: ParserStagingRow[] = phrases.map((phrase) => {
      const { built, match, lowConfidence } = runPhrasePipeline(phrase, templateRows, refDate, config);
      return {
        id: nextId(),
        raw: phrase,
        title: built.title ?? phrase,
        dueDate: built.dueDate ?? null,
        categoryId: built.categoryId ?? "default",
        score: match?.score,
        status: "pending",
      };
    });
    writeSlice({ ...slice, parserStaging: rows });
    if (getState()?.values?.structure_draftText != null) {
      dispatchState("state.update", { key: "structure_draftText", value: "" });
    }
  } else {
    const segments = [{ text, isFinal: true }];
    const { candidates } = streamToCandidates(segments, slice.rules ?? {}, refDate);
    const sentences = splitSentences(text);
    const rows: ParserStagingRow[] = candidates.map((c, i) => ({
      id: nextId(),
      raw: sentences[i] ?? c.title,
      title: c.title,
      dueDate: c.dueDate ?? null,
      categoryId: c.categoryId ?? "default",
      score: undefined,
      status: "pending",
    }));
    writeSlice({ ...slice, parserStaging: rows });
    if (getState()?.values?.structure_draftText != null) {
      dispatchState("state.update", { key: "structure_draftText", value: "" });
    }
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

/** V3/V4: Set parser staging rows (from Task Matcher). */
export function structureSetParserStaging(
  action: { rows?: ParserStagingRow[] },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const rows = Array.isArray(action.rows) ? action.rows : [];
  writeSlice({ ...slice, parserStaging: rows });
}

/** V3/V4: Update a single staging row's status (pending | use | add_use). */
export function structureUpdateStagingRow(
  action: { id?: string; status?: ParserStagingRow["status"] },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const rows = slice.parserStaging ?? [];
  const { id, status } = action;
  if (!id || !status) return;
  const next = rows.map((r) => (r.id === id ? { ...r, status } : r));
  writeSlice({ ...slice, parserStaging: next });
}

/** V3/V4: Confirm staging: add rows with status 'use' or 'add_use' to structure.items and clear staging. */
export function structureConfirmStaging(
  _action: Record<string, unknown>,
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const rows = slice.parserStaging ?? [];
  const toAdd = rows.filter((r) => r.status === "use" || r.status === "add_use");
  if (toAdd.length) {
    const items = toAdd.map((r) =>
      normalizeItem({
        title: r.title,
        dueDate: r.dueDate,
        categoryId: r.categoryId,
        priority: 5,
      })
    );
    const nextItems = [...slice.items];
    for (const item of items) {
      const idx = nextItems.findIndex((i) => i.id === item.id);
      if (idx >= 0) nextItems[idx] = item;
      else nextItems.push(item);
    }
    writeSlice({ ...slice, items: nextItems, parserStaging: undefined });
  } else {
    writeSlice({ ...slice, parserStaging: undefined });
  }
}

/** V4: Set task folder template (Folder → Subfolder → Category) for parser matcher. */
export function structureSetTaskFolderTemplate(
  action: { template?: StructureSlice["taskFolderTemplate"] },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  writeSlice({ ...slice, taskFolderTemplate: action.template ?? undefined });
}

/** V4: Set flat task template rows for tokenize/scoreMatch pipeline. */
export function structureSetTaskTemplateRows(
  action: { rows?: TaskTemplateRow[] },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  writeSlice({ ...slice, taskTemplateRows: action.rows ?? undefined });
}

/** V4: Set parser pipeline config (tokenWeights, modifierVerbs, matcherThreshold). */
export function structureSetParserConfig(
  action: { config?: ParserPipelineConfig },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  writeSlice({ ...slice, parserConfig: action.config ?? undefined });
}

/** V2: Load ruleset into structure.rules. Merge payload.rules (e.g. from /api/rulesets/base). */
export function structureLoadRuleset(
  action: { rules?: ResolvedRuleset; rulesetId?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  const rules = action.rules;
  if (rules && typeof rules === "object") {
    const merged: ResolvedRuleset = { ...slice.rules, ...rules };
    writeSlice({ ...slice, rules: merged });
  }
}

/** V2: Ensure structure.taskTemplateRows is set; if empty, set from default (BASE_PLANNER_TREE). */
export function structureEnsureTaskTemplateRows(
  _action: Record<string, unknown>,
  _state: Record<string, any>
): void {
  const slice = getSlice();
  if (slice.taskTemplateRows?.length) return;
  writeSlice({ ...slice, taskTemplateRows: getDefaultTaskTemplateRows() });
}

/** V2: Set scheduled section (folder id or "work" / "dayOff") for section menus. */
export function structureSetScheduledSection(
  action: { section?: string },
  _state: Record<string, any>
): void {
  const slice = getSlice();
  writeSlice({ ...slice, scheduledSection: action.section ?? undefined });
}
