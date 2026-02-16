/**
 * Structure mapper — parse result + rules + context → normalized candidate items. Pure; no state.
 */

import type {
  StructureItem,
  ResolvedRuleset,
  ParseResult,
  MapperContext,
  MapperTrace,
  RecurrenceBlock,
} from "./structure.types";
import { extractDatePhrase } from "./date-utils";

/**
 * Map parse result to candidate StructureItems (ids can be assigned in action layer).
 * Extracts dueDate (relative date phrases) and recurrence ("every day", "every Thursday", etc.) when present.
 */
export function mapToCandidates(
  parseResult: ParseResult,
  rules: ResolvedRuleset,
  context: MapperContext
): { candidates: StructureItem[]; trace: MapperTrace } {
  const trace: MapperTrace = {
    segmentsUsed: parseResult.segments.map((s) => s.text),
    matchedRuleIds: [],
    extractedFields: {},
  };
  const defaultCat = rules.categoryInference?.defaultCategoryId ?? "default";
  const defaultPri =
    (typeof rules.priorityScale?.default === "number" ? rules.priorityScale.default : 5) as number;
  const refDate = context.refDate ?? new Date();

  const candidates: StructureItem[] = [];
  const sentences = parseResult.sentences.length ? parseResult.sentences : parseResult.segments.map((s) => s.text).filter(Boolean);

  for (const sentence of sentences) {
    const title = sentence.trim();
    if (!title) continue;
    const inferredCat = inferCategory(title, rules);
    const inferredPri = inferPriority(title, rules);
    const dueDate = extractDatePhrase(title, refDate) ?? null;
    const recurrence = extractRecurrence(title);
    candidates.push({
      id: "",
      title,
      categoryId: inferredCat ?? defaultCat,
      priority: inferredPri ?? defaultPri,
      dueDate,
      recurrence: recurrence ?? undefined,
      createdAt: refDate.toISOString?.() ?? new Date().toISOString(),
      updatedAt: refDate.toISOString?.() ?? new Date().toISOString(),
    });
  }

  if (candidates.length > 0) {
    trace.extractedFields = { title: candidates[0].title, count: candidates.length };
  }
  return { candidates, trace };
}

const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAY_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function extractRecurrence(text: string): RecurrenceBlock | null {
  const lower = text.toLowerCase();
  if (/\b(every\s+)?day\b|\bdaily\b/.test(lower)) {
    return { recurringType: "daily" };
  }
  if (/\bweekly\b|\bevery\s+week\b/.test(lower)) {
    return { recurringType: "weekly", recurringDetails: "mon,tue,wed,thu,fri,sat,sun" };
  }
  if (/\bmonthly\b|\bevery\s+month\b/.test(lower)) {
    return { recurringType: "monthly" };
  }
  const matched: string[] = [];
  for (let i = 0; i < WEEKDAY_NAMES.length; i++) {
    if (new RegExp(`\\bevery\\s+${WEEKDAY_NAMES[i]}\\b`).test(lower)) {
      matched.push(WEEKDAY_SHORT[i]);
    }
  }
  if (matched.length > 0) {
    return { recurringType: "weekly", recurringDetails: matched.join(",") };
  }
  return null;
}

function inferCategory(title: string, rules: ResolvedRuleset): string | undefined {
  const keywords = rules.categoryInference?.keywords;
  if (!keywords) return undefined;
  const lower = title.toLowerCase();
  for (const [phrase, categoryId] of Object.entries(keywords)) {
    if (lower.includes(phrase.toLowerCase())) return categoryId;
  }
  return undefined;
}

function inferPriority(title: string, rules: ResolvedRuleset): number | undefined {
  const inference = rules.priorityInference;
  if (!inference) return undefined;
  const lower = title.toLowerCase();
  for (const [phrase, num] of Object.entries(inference)) {
    if (lower.includes(phrase.toLowerCase())) return num;
  }
  return undefined;
}
