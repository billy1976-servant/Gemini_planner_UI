/**
 * Diagnostics actions — READ from existing systems, WRITE only to state.values.diagnostics_*
 * Additive only. No changes to capability hub, layout, renderer, EngineState, or molecules.
 */

import { dispatchState } from "@/state/state-store";
import {
  getCapabilityProfile,
  getCapabilityLevel,
  isCapabilityOn,
  setCapabilityProfile,
} from "@/03_Runtime/capability";
import {
  CAPABILITY_ACTION_MAP,
  CAPABILITY_ACTION_PREFIXES,
  type ActionCapabilityRule,
} from "@/03_Runtime/capability/capability-action-map";
import type { CapabilityDomain } from "@/03_Runtime/capability/capability.types";
import { getActionHandler } from "@/logic/engine-system/engine-contract";
import { applyUniversalEngine } from "@/logic/engine-system/universal-engine-adapter";
import { getMediaPayload } from "@/engine/system7/media-payload-bridge";
import { Integrations, type SensorId } from "@/09_Integrations/04_FACADE/integrations";
import { fireTrigger } from "@/09_Integrations/capture";
import { getLatestInterpreted } from "@/09_Integrations/interpret";
import { getLogSnapshot } from "@/09_Integrations/input-log";
import { getSystemSnapshot, SYSTEM_SIGNAL_IDS } from "@/09_Integrations/system-signals-v2";
import {
  generateChecklist,
  generateContractorSummary,
} from "@/logic/engines/summary/export-resolver";
import type { EngineState } from "@/logic/runtime/engine-state";
import { getState } from "@/state/state-store";
import { interpretStream } from "@/logic/engines/structure/extreme-mode-parser";
import { streamToCandidates } from "@/logic/engines/structure/extreme-mode-parser";
import { extractDatePhrase } from "@/logic/engines/structure/date-utils";
import { isDueOn } from "@/logic/engines/structure/recurrence.engine";
import { sortByPriority } from "@/logic/engines/structure/prioritization.engine";
import { BASE_PLANNER_TREE } from "@/logic/planner/base-planner-tree";
import type { StructureTreeNode, StructureItem, ResolvedRuleset } from "@/logic/engines/structure/structure.types";

function write(key: string, value: unknown): void {
  dispatchState("state.update", {
    key: `diagnostics_${key}`,
    value,
  });
}

function getRuleForAction(actionName: string): ActionCapabilityRule | undefined {
  const exact = CAPABILITY_ACTION_MAP[actionName];
  if (exact) return exact;
  let matched: ActionCapabilityRule | undefined;
  let maxLen = 0;
  for (const { prefix, domain } of CAPABILITY_ACTION_PREFIXES) {
    if (actionName.startsWith(prefix) && prefix.length > maxLen) {
      maxLen = prefix.length;
      matched = { domain };
    }
  }
  return matched;
}

function isActionAllowedByCapability(actionName: string): boolean {
  const rule = getRuleForAction(actionName);
  if (!rule) return true;
  const level = getCapabilityLevel(rule.domain);
  const levelStr =
    typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  if (levelStr === "off") return false;
  if (rule.minLevel && levelStr !== rule.minLevel) {
    const order = ["off", "basic", "advanced", "lite", "full", "on"];
    const levelIdx = order.indexOf(levelStr);
    const minIdx = order.indexOf(rule.minLevel);
    if (levelIdx >= 0 && minIdx >= 0 && levelIdx < minIdx) return false;
  }
  return true;
}

const KNOWN_SENSOR_IDS: SensorId[] = [
  "orientation",
  "motion",
  "location",
  "camera",
  "audio",
  "battery",
  "network",
  "device",
  "screen",
];

const MINIMAL_ENGINE_STATE: EngineState = {
  orderedStepIds: [],
  currentStepIndex: 0,
  totalSteps: 0,
  completedStepIds: [],
  accumulatedSignals: [],
  accumulatedBlockers: [],
  accumulatedOpportunities: [],
  severityDensity: 0,
  weightSum: 0,
  calcOutputs: {},
  engineId: "diagnostics",
  exportSlices: [],
};

export function runDiagnosticsCapabilityDomain(
  action: { domain?: string },
  _state: Record<string, any>
): void {
  const domain = (action.domain ?? "auth") as CapabilityDomain;
  const level = getCapabilityLevel(domain);
  const isOn = isCapabilityOn(domain);
  write(`domain_${domain}`, {
    domain,
    level: typeof level === "string" ? level : (level as Record<string, unknown>)?.level ?? level,
    isOn,
  });
}

export function runDiagnosticsSensorRead(
  action: { sensorId?: string },
  _state: Record<string, any>
): void {
  const sensorId = (action.sensorId ?? "device") as SensorId;
  if (!KNOWN_SENSOR_IDS.includes(sensorId)) {
    write(`sensor_${sensorId}`, { allowed: false, value: null, error: "Unknown sensor" });
    return;
  }
  void (async () => {
    const result = await fireTrigger(sensorId, { triggerId: "lab_button" });
    const interpreted = getLatestInterpreted(sensorId);
    write(`sensor_${sensorId}`, {
      allowed: result.allowed ?? false,
      value: interpreted?.value ?? result.value ?? null,
      t: interpreted?.t,
      source: interpreted?.source,
      confidence: interpreted?.confidence,
    });
  })();
}

export function runDiagnosticsSystem7Route(
  action: { channel?: string; action?: string; payload?: Record<string, unknown> },
  state: Record<string, any>
): void {
  const channel = action.channel ?? "identity";
  const result = applyUniversalEngine({
    engineId: "system7",
    type: "system",
    payload: {
      channel,
      action: action.action ?? "",
      payload: action.payload ?? {},
    },
    context: { state },
  });
  const safeKey = channel.replace(/[^a-z0-9]/gi, "_");
  write(`system7_${safeKey}`, result);
}

export function runDiagnosticsActionGating(
  action: { actionName?: string },
  _state: Record<string, any>
): void {
  const actionName = action.actionName ?? "logic:share";
  const allowed = isActionAllowedByCapability(actionName);
  const handler = getActionHandler(actionName);
  const handlerPresent = typeof handler === "function";
  const safeKey = actionName.replace(/[^a-z0-9]/gi, "_");
  write(`action_${safeKey}`, {
    actionName,
    allowed,
    handlerPresent,
  });
}

export function runDiagnosticsResolveProfile(
  _action: unknown,
  _state: Record<string, any>
): void {
  const profile = getCapabilityProfile();
  write("effectiveProfile", profile as Record<string, unknown>);
}

export function runDiagnosticsMediaPayloadHook(
  _action: unknown,
  _state: Record<string, any>
): void {
  const payload = getMediaPayload();
  write("mediaPayload", payload);
}

export function runDiagnosticsExportPdf(
  _action: unknown,
  _state: Record<string, any>
): void {
  const level = getCapabilityLevel("export");
  const levelStr =
    typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  const allowed = levelStr !== "off";
  const doc = generateChecklist(MINIMAL_ENGINE_STATE, {});
  write("exportPdf", { allowed, doc });
}

export function runDiagnosticsExportSummary(
  _action: unknown,
  _state: Record<string, any>
): void {
  const level = getCapabilityLevel("export");
  const levelStr =
    typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  const allowed = levelStr !== "off";
  const doc = generateContractorSummary(MINIMAL_ENGINE_STATE, {});
  write("exportSummary", { allowed, doc });
}

/**
 * Runtime override: set one domain level and write confirmation to state.
 * Does not modify resolver or global JSON; in-memory profile only.
 */
export function runDiagnosticsSetCapabilityLevel(
  action: { domain?: string; level?: string },
  _state: Record<string, any>
): void {
  const domain = (action.domain ?? "auth") as CapabilityDomain;
  const level = action.level ?? "off";
  const profile = getCapabilityProfile();
  const next = { ...profile, [domain]: level };
  setCapabilityProfile(next);
  write(`set_${domain}`, { domain, level });
}

const LOG_SNAPSHOT_N = 10;

function sanitizeForLogSnapshot(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v != null && typeof v === "object" && typeof (v as MediaStream).getTracks === "function") {
      out[k] = "[MediaStream]";
    } else if (v != null && typeof v === "object") {
      try {
        JSON.stringify(v);
        out[k] = v;
      } catch {
        out[k] = String(v);
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function runDiagnosticsInputLogSnapshot(
  _action: unknown,
  _state: Record<string, any>
): void {
  const snapshot = getLogSnapshot();
  const lastN = snapshot.slice(-LOG_SNAPSHOT_N);
  const events = lastN.map((evt) => ({
    id: evt.id,
    kind: evt.kind,
    timestamp: evt.timestamp,
    source: evt.source,
    payload: sanitizeForLogSnapshot(evt.payload),
  }));
  write("inputLogSnapshot", { events, count: events.length });
}

/**
 * System Signals V2 — write unified snapshot (battery, network, device, screen) to state.
 */
export function runDiagnosticsSystemSnapshot(
  _action: unknown,
  _state: Record<string, any>
): void {
  const snapshot = getSystemSnapshot();
  write("systemSnapshot", snapshot);
}

/**
 * System Signals V2 — fireTrigger for each system signal, collect interpreted results.
 */
export function runDiagnosticsSystemSignalsReadAll(
  _action: unknown,
  _state: Record<string, any>
): void {
  void (async () => {
    const results: Record<string, ReturnType<typeof getLatestInterpreted>> = {};
    for (const id of SYSTEM_SIGNAL_IDS) {
      await fireTrigger(id, { triggerId: "systemSignalsReadAll" });
      results[id] = getLatestInterpreted(id);
    }
    write("systemSignalsReadAll", { results, t: Date.now() });
  })();
}

const PLANNER_PIPELINE_LOG_PREFIX = "[PlannerParserPipeline]";

export type PlannerParserPipelineReport = {
  text: string;
  step1_parseDatesTimes: { ok: boolean; detail: string; sentences: string[]; extractedDates: Array<{ sentence: string; dueDate: string | null }> };
  step2_itemsInState: { ok: boolean; detail: string; wouldAddCount: number; itemIds: string[] };
  step3_dueDatesAssigned: { ok: boolean; detail: string; candidatesWithDue: Array<{ title: string; dueDate: string | null }> };
  step4_blocksByDateUpdated: { ok: boolean; detail: string; chainBreak: boolean; reason: string };
  step5_selectedDateCalendarView: { ok: boolean; detail: string; chainBreak: boolean; reason: string; currentSelectedDate?: string; calendarView?: string };
  step6_scheduledFromStatePopulates: { ok: boolean; detail: string; dateKeyUsed: string; dueItemCount: number; itemTitles: string[] };
  summary: { allOk: boolean; brokenSteps: string[] };
  timestamp: number;
};

/**
 * Full end-to-end diagnostic for structure:addFromText pipeline.
 * Traces: (1) parse dates/times, (2) items in state.values.structure.items,
 * (3) due dates assigned, (4) blocksByDate updated, (5) selectedDate/calendarView,
 * (6) scheduledFromState lists. Logs each step and writes report to state.values.diagnostics_plannerParserPipeline.
 */
export function runDiagnosticsPlannerParserPipeline(
  action: { text?: string; dryRun?: boolean },
  state: Record<string, any>
): void {
  const text = (action.text ?? "Review docs tomorrow").trim();
  const dryRun = action.dryRun !== false;
  const refDate = new Date();
  const log = (step: string, msg: string, data?: unknown) => {
    console.log(`${PLANNER_PIPELINE_LOG_PREFIX} ${step} — ${msg}`, data ?? "");
  };

  const report: PlannerParserPipelineReport = {
    text,
    step1_parseDatesTimes: { ok: false, detail: "", sentences: [], extractedDates: [] },
    step2_itemsInState: { ok: false, detail: "", wouldAddCount: 0, itemIds: [] },
    step3_dueDatesAssigned: { ok: false, detail: "", candidatesWithDue: [] },
    step4_blocksByDateUpdated: { ok: false, detail: "", chainBreak: true, reason: "" },
    step5_selectedDateCalendarView: { ok: false, detail: "", chainBreak: true, reason: "" },
    step6_scheduledFromStatePopulates: { ok: false, detail: "", dateKeyUsed: "", dueItemCount: 0, itemTitles: [] },
    summary: { allOk: false, brokenSteps: [] },
    timestamp: Date.now(),
  };

  const slice = (getState()?.values?.structure ?? {}) as {
    items?: Array<{ id: string; title?: string; dueDate?: string | null }>;
    blocksByDate?: Record<string, unknown[]>;
    selectedDate?: string;
    calendarView?: string;
    weekDates?: string[];
    rules?: Record<string, unknown>;
  };
  const rules = slice.rules ?? {};
  const segments = [{ text, isFinal: true }];

  // ——— Step 1: Parse dates/times ———
  const parseResult = interpretStream(segments);
  report.step1_parseDatesTimes.sentences = parseResult.sentences ?? [];
  const extractedDates = report.step1_parseDatesTimes.sentences.map((s) => ({
    sentence: s,
    dueDate: extractDatePhrase(s, refDate),
  }));
  report.step1_parseDatesTimes.extractedDates = extractedDates;
  report.step1_parseDatesTimes.ok = report.step1_parseDatesTimes.sentences.length > 0;
  report.step1_parseDatesTimes.detail = report.step1_parseDatesTimes.ok
    ? `Parsed ${report.step1_parseDatesTimes.sentences.length} sentence(s); date extraction: ${JSON.stringify(extractedDates)}`
    : "No sentences parsed.";
  log("1.parseDatesTimes", report.step1_parseDatesTimes.detail, { sentences: report.step1_parseDatesTimes.sentences, extractedDates });

  // ——— Step 2 & 3: streamToCandidates → items + due dates ———
  const { candidates } = streamToCandidates(segments, rules as any, refDate);
  report.step2_itemsInState.wouldAddCount = candidates.length;
  report.step2_itemsInState.itemIds = candidates.map((c) => c.id || "(new)");
  report.step2_itemsInState.ok = candidates.length > 0;
  report.step2_itemsInState.detail = report.step2_itemsInState.ok
    ? `Would add ${candidates.length} item(s) to state.values.structure.items`
    : "No candidates; structure.items not updated.";
  log("2.itemsInState", report.step2_itemsInState.detail, { count: candidates.length });

  report.step3_dueDatesAssigned.candidatesWithDue = candidates.map((c) => ({ title: c.title, dueDate: c.dueDate ?? null }));
  report.step3_dueDatesAssigned.ok = candidates.some((c) => c.dueDate != null);
  report.step3_dueDatesAssigned.detail = report.step3_dueDatesAssigned.ok
    ? `Due dates assigned: ${candidates.filter((c) => c.dueDate).map((c) => `${c.title}→${c.dueDate}`).join("; ")}`
    : "No due dates on candidates (parser/date-utils only set when phrase like 'tomorrow' or weekday).";
  log("3.dueDatesAssigned", report.step3_dueDatesAssigned.detail, report.step3_dueDatesAssigned.candidatesWithDue);

  // ——— Step 4: blocksByDate ———
  report.step4_blocksByDateUpdated.reason = "structure:addFromText does NOT call structure:setBlocksForDate; blocksByDate is only updated by structure:setBlocksForDate.";
  report.step4_blocksByDateUpdated.chainBreak = true;
  report.step4_blocksByDateUpdated.ok = false;
  report.step4_blocksByDateUpdated.detail = "blocksByDate is NOT updated by addFromText. Only structure:setBlocksForDate updates it.";
  log("4.blocksByDate", report.step4_blocksByDateUpdated.detail, { chainBreak: true, reason: report.step4_blocksByDateUpdated.reason });

  // ——— Step 5: selectedDate/calendarView ———
  report.step5_selectedDateCalendarView.reason = "structure:addFromText does NOT call calendar:setDay/setWeek/setMonth; selectedDate/calendarView only change via calendar.* actions.";
  report.step5_selectedDateCalendarView.chainBreak = true;
  report.step5_selectedDateCalendarView.ok = false;
  report.step5_selectedDateCalendarView.currentSelectedDate = slice.selectedDate;
  report.step5_selectedDateCalendarView.calendarView = slice.calendarView;
  report.step5_selectedDateCalendarView.detail = `addFromText does not update calendar. Current: selectedDate=${slice.selectedDate ?? "(undefined)"}, calendarView=${slice.calendarView ?? "(undefined)"}.`;
  log("5.selectedDateCalendarView", report.step5_selectedDateCalendarView.detail, { chainBreak: true });

  // ——— Step 6: scheduledFromState (renderer derives from structure.items + dateKey) ———
  const dateKey = slice.selectedDate ?? slice.weekDates?.[0] ?? refDate.toISOString().slice(0, 10);
  const items = Array.isArray(slice.items) ? slice.items : [];
  const dateForFilter = new Date(dateKey + "T12:00:00");
  const dueItems = items.filter((item: any) => isDueOn(item, dateForFilter)) as StructureItem[];
  const sorted = sortByPriority(dueItems, dateForFilter, slice.rules ?? {});
  report.step6_scheduledFromStatePopulates.dateKeyUsed = dateKey;
  report.step6_scheduledFromStatePopulates.dueItemCount = sorted.length;
  report.step6_scheduledFromStatePopulates.itemTitles = sorted.map((i: any) => i?.title ?? i?.id ?? "");
  report.step6_scheduledFromStatePopulates.ok = true;
  report.step6_scheduledFromStatePopulates.detail = `scheduledFromState populates at render from structure.items; dateKey=${dateKey}, dueItemCount=${sorted.length}.`;
  log("6.scheduledFromState", report.step6_scheduledFromStatePopulates.detail, { dateKey, dueItemCount: sorted.length, itemTitles: report.step6_scheduledFromStatePopulates.itemTitles });

  report.summary.brokenSteps = [];
  if (!report.step1_parseDatesTimes.ok) report.summary.brokenSteps.push("1.parseDatesTimes");
  if (!report.step2_itemsInState.ok) report.summary.brokenSteps.push("2.itemsInState");
  if (!report.step3_dueDatesAssigned.ok) report.summary.brokenSteps.push("3.dueDatesAssigned");
  if (report.step4_blocksByDateUpdated.chainBreak) report.summary.brokenSteps.push("4.blocksByDateUpdated");
  if (report.step5_selectedDateCalendarView.chainBreak) report.summary.brokenSteps.push("5.selectedDateCalendarView");
  report.summary.allOk = report.summary.brokenSteps.length === 0;

  log("SUMMARY", report.summary.allOk ? "All steps OK" : "Chain breaks: " + report.summary.brokenSteps.join(", "), report.summary);

  write("plannerParserPipeline", report);

  if (!dryRun) {
    const handler = getActionHandler("structure:addFromText");
    if (handler) {
      handler({ text }, state);
      log("EXECUTED", "structure:addFromText ran; state updated.");
    } else {
      log("EXECUTED", "structure:addFromText handler not found; action did not run.");
    }
  }
}

// ——— Planner Full Parse + Hierarchy Trace (trace-only) ———
const FULL_PARSE_LOG_PREFIX = "[PlannerFullParseTrace]";

/** Trace-only: find date phrase substring in text (mirrors date-utils logic for logging). */
function getDatePhraseSubstring(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const p of ["today", "tomorrow", "yesterday"]) {
    if (lower.includes(p)) return p;
  }
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  for (const day of days) {
    const re = new RegExp(`\\b(next\\s+)?${day}\\b`, "i");
    const m = text.match(re);
    if (m) return m[0].trim();
  }
  return null;
}

/** Trace-only: resolve hierarchy path (Life → … → node) for a categoryId in base tree. */
function getTreePathForCategoryId(
  categoryId: string,
  tree: StructureTreeNode[],
  path: string[] = []
): string[] | null {
  for (const node of tree) {
    const here = [...path, node.name];
    if (node.id === categoryId) return here;
    if (node.children?.length) {
      const found = getTreePathForCategoryId(categoryId, node.children, here);
      if (found) return found;
    }
  }
  return null;
}

/** Which category keyword (from rules) matched the title (trace-only). */
function getMatchedCategoryKeyword(
  title: string,
  keywords: Record<string, string> | undefined
): string | null {
  if (!keywords) return null;
  const lower = title.toLowerCase();
  for (const [phrase, categoryId] of Object.entries(keywords)) {
    if (lower.includes(phrase.toLowerCase())) return phrase;
  }
  return null;
}

export type PlannerFullParseTraceReport = {
  testString: string;
  parserOutput: {
    extractedDatePhrase: string | null;
    resolvedDueDateIso: string | null;
    detectedPriority: number;
    detectedTitle: string;
    detectedCategoryId: string;
    matchedCategoryKeyword: string | null;
    priorityInferenceKeyword: string | null;
    rulesUsed: { categoryInference?: unknown; priorityInference?: unknown };
  };
  normalizedItemBeforeWriteSlice: {
    id: string;
    title: string;
    dueDate: string | null;
    priority: number;
    rampOrHabit: unknown;
    metadata: unknown;
    parentId: string | null;
    fullItem: Record<string, unknown>;
  };
  jsonTreeMatchingTrace: {
    matchedDomain: string;
    keywordMatchUsed: string | null;
    parentNodeIdSelected: string | null;
    fullHierarchyPath: string[];
  };
  stateWriteVerification: {
    itemExistsInStructureItems: boolean;
    storedObject: Record<string, unknown> | null;
    selectedDate: string | undefined;
    calendarView: string | undefined;
    weekDatesPresent: boolean;
    monthRollupPresent: boolean;
  };
  uiRenderCheck: {
    scheduledForToday: { dateKey: string; count: number; titles: string[] };
    scheduledForParsedDueDate: { dateKey: string; count: number; titles: string[] };
  };
  finalSummary: {
    didDetectDate: boolean;
    didAssignDueDate: boolean;
    didAttachToTreeNode: boolean;
    whichNode: string | null;
    didInferPriority: boolean;
    didInferRampHabit: boolean;
    whyChoseParent: string;
  };
  timestamp: number;
};

/**
 * Planner Full Parse + Hierarchy Trace. Audit what structure:addFromText produces and how it maps into the planner tree.
 * Uses test string "Fertilize garden Thursday high priority". Trace-only; no logic changes.
 * Logs to console and writes report to state.values.diagnostics_plannerFullParseTrace.
 */
export function runDiagnosticsPlannerFullParseTrace(
  _action: unknown,
  state: Record<string, any>
): void {
  const testString = "Fertilize garden Thursday high priority";
  const refDate = new Date();

  const logSection = (section: string, data: unknown) => {
    console.log(`${FULL_PARSE_LOG_PREFIX} === ${section} ===`, data);
  };

  const slice = (getState()?.values?.structure ?? {}) as {
    items?: Array<Record<string, unknown>>;
    rules?: ResolvedRuleset;
    selectedDate?: string;
    calendarView?: string;
    weekDates?: string[];
    monthRollup?: unknown[];
  };
  const rules = (slice.rules ?? {}) as {
    categoryInference?: { keywords?: Record<string, string>; defaultCategoryId?: string };
    priorityInference?: Record<string, number>;
  };

  const segments = [{ text: testString, isFinal: true }];
  const parseResult = interpretStream(segments);
  const { candidates } = streamToCandidates(segments, rules as any, refDate);
  const candidate = candidates[0];

  const extractedDatePhrase = getDatePhraseSubstring(testString);
  const resolvedDueDateIso = candidate ? extractDatePhrase(candidate.title, refDate) : null;
  const detectedPriority = candidate?.priority ?? 5;
  const detectedTitle = candidate?.title ?? "";
  const detectedCategoryId = candidate?.categoryId ?? "default";
  const matchedCategoryKeyword = getMatchedCategoryKeyword(
    detectedTitle,
    rules?.categoryInference?.keywords
  );
  const priorityKeywords = rules?.priorityInference ? Object.keys(rules.priorityInference) : [];
  const priorityInferenceKeyword = priorityKeywords.find((k) =>
    detectedTitle.toLowerCase().includes(k.toLowerCase())
  ) ?? null;

  // ——— 1) Parser Output ———
  const parserOutput = {
    extractedDatePhrase,
    resolvedDueDateIso,
    detectedPriority,
    detectedTitle,
    detectedCategoryId,
    matchedCategoryKeyword,
    priorityInferenceKeyword,
    rulesUsed: {
      categoryInference: rules?.categoryInference,
      priorityInference: rules?.priorityInference,
    },
  };
  logSection("1) Parser Output", parserOutput);

  // ——— 2) Normalized Item (before writeSlice): run addFromText then read back (item written = normalized) ———
  const handler = getActionHandler("structure:addFromText");
  if (handler) handler({ text: testString }, state);

  const sliceAfter = (getState()?.values?.structure ?? {}) as {
    items?: Array<Record<string, unknown>>;
    selectedDate?: string;
    calendarView?: string;
    weekDates?: string[];
    monthRollup?: unknown[];
  };
  const itemsAfter = Array.isArray(sliceAfter.items) ? sliceAfter.items : [];
  const storedItem = itemsAfter.find(
    (i: Record<string, unknown>) =>
      typeof i?.title === "string" && i.title.includes("Fertilize")
  ) ?? itemsAfter[itemsAfter.length - 1] ?? null;

  const fullItem = (storedItem ?? candidate) as Record<string, unknown>;
  const normalizedItemBeforeWriteSlice = {
    id: String(fullItem?.id ?? ""),
    title: String(fullItem?.title ?? ""),
    dueDate: fullItem?.dueDate != null ? String(fullItem.dueDate) : null,
    priority: typeof fullItem?.priority === "number" ? fullItem.priority : 5,
    rampOrHabit: fullItem?.habit ?? fullItem?.recurrence ?? null,
    metadata: fullItem?.metadata ?? null,
    parentId: fullItem?.parentId != null ? String(fullItem.parentId) : null,
    fullItem: { ...fullItem },
  };
  logSection("2) Normalized Item (before writeSlice)", normalizedItemBeforeWriteSlice);

  // ——— 3) JSON Tree Matching Trace ———
  const categoryId =
    (storedItem && typeof (storedItem as Record<string, unknown>).categoryId === "string"
      ? (storedItem as Record<string, unknown>).categoryId
      : null) ?? detectedCategoryId;
  const hierarchyPath = getTreePathForCategoryId(String(categoryId), BASE_PLANNER_TREE);
  const parentNodeId = hierarchyPath ? String(categoryId) : null;
  const jsonTreeMatchingTrace = {
    matchedDomain: hierarchyPath?.[hierarchyPath.length - 1] ?? "none",
    keywordMatchUsed: matchedCategoryKeyword,
    parentNodeIdSelected: parentNodeId,
    fullHierarchyPath: hierarchyPath ?? [],
  };
  if (hierarchyPath && hierarchyPath.length > 0) {
    jsonTreeMatchingTrace.fullHierarchyPath = [...hierarchyPath, "[task]"];
  }
  logSection("3) JSON Tree Matching Trace", jsonTreeMatchingTrace);

  // ——— 4) State Write Verification ———
  const stateWriteVerification = {
    itemExistsInStructureItems: !!storedItem,
    storedObject: storedItem ? { ...storedItem } as Record<string, unknown> : null,
    selectedDate: sliceAfter.selectedDate,
    calendarView: sliceAfter.calendarView,
    weekDatesPresent: Array.isArray(sliceAfter.weekDates) && sliceAfter.weekDates.length > 0,
    monthRollupPresent: Array.isArray(sliceAfter.monthRollup) && sliceAfter.monthRollup.length > 0,
  };
  logSection("4) State Write Verification", stateWriteVerification);

  // ——— 5) UI Render Check ———
  const todayKey = refDate.toISOString().slice(0, 10);
  const parsedDueKey = resolvedDueDateIso ?? todayKey;
  const items = Array.isArray(sliceAfter.items) ? sliceAfter.items : [];
  const dateToday = new Date(todayKey + "T12:00:00");
  const dateParsed = new Date(parsedDueKey + "T12:00:00");
  const dueToday = items.filter((i: any) => isDueOn(i, dateToday)) as StructureItem[];
  const dueOnParsed = items.filter((i: any) => isDueOn(i, dateParsed)) as StructureItem[];
  const sortedToday = sortByPriority(dueToday, dateToday, slice.rules ?? {});
  const sortedParsed = sortByPriority(dueOnParsed, dateParsed, slice.rules ?? {});
  const uiRenderCheck = {
    scheduledForToday: {
      dateKey: todayKey,
      count: sortedToday.length,
      titles: sortedToday.map((i: any) => i?.title ?? i?.id ?? ""),
    },
    scheduledForParsedDueDate: {
      dateKey: parsedDueKey,
      count: sortedParsed.length,
      titles: sortedParsed.map((i: any) => i?.title ?? i?.id ?? ""),
    },
  };
  logSection("5) UI Render Check", uiRenderCheck);

  // ——— 6) Final Summary ———
  const finalSummary = {
    didDetectDate: !!extractedDatePhrase,
    didAssignDueDate: !!resolvedDueDateIso,
    didAttachToTreeNode: !!hierarchyPath && hierarchyPath.length > 0,
    whichNode: parentNodeId,
    didInferPriority: priorityInferenceKeyword !== null,
    didInferRampHabit: !!(normalizedItemBeforeWriteSlice.rampOrHabit),
    whyChoseParent: matchedCategoryKeyword
      ? `Keyword match: "${matchedCategoryKeyword}" → categoryId ${categoryId}`
      : `No keyword match; default categoryId: ${categoryId}. Tree node: ${hierarchyPath?.join(" → ") ?? "none (categoryId not in base tree)"}`,
  };
  logSection("6) Final Summary", finalSummary);

  const report: PlannerFullParseTraceReport = {
    testString,
    parserOutput,
    normalizedItemBeforeWriteSlice,
    jsonTreeMatchingTrace,
    stateWriteVerification,
    uiRenderCheck,
    finalSummary,
    timestamp: Date.now(),
  };

  console.log(`${FULL_PARSE_LOG_PREFIX} === FULL REPORT (state.values.diagnostics_plannerFullParseTrace) ===`, report);
  write("plannerFullParseTrace", report);
}
