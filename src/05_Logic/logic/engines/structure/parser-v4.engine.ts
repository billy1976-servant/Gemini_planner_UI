/**
 * V4 Parser pipeline — tokenize, parseLooseDate, scoreMatch, findBestRowAndTask, buildRow.
 * Pure; no state. Template rows from taskTemplateRows; config from ParserPipelineConfig.
 */

import type {
  StructureItem,
  TaskTemplateRow,
  TokenizedPhrase,
  ParsedPhrase,
  ParsedDate,
  ParserPipelineConfig,
} from "./structure.types";

const DEFAULT_MODIFIER_VERBS = [
  "call", "email", "text", "message", "visit", "meet", "see", "ask", "tell",
  "remind", "check", "follow up", "followup", "pick up", "pickup", "send", "reply",
];
const PREPS = ["about", "for", "with", "to", "on", "regarding", "re"];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/**
 * Tokenize a single phrase: verb, contact (for contact verbs), topicDisplay, topicMatch (stripped for scoring), dateTok.
 */
export function tokenize(
  phrase: string,
  config?: ParserPipelineConfig
): TokenizedPhrase {
  const raw = (phrase ?? "").trim();
  const lower = raw.toLowerCase();
  const modifierVerbs = config?.modifierVerbs ?? DEFAULT_MODIFIER_VERBS;
  const words = lower.split(/\s+/).filter(Boolean);

  let verb = "";
  let contact = "";
  let topicDisplay = raw;
  let topicMatch = lower;
  let dateTok = "";

  if (words.length > 0) {
    verb = words[0];
    const isContactVerb = modifierVerbs.some((v) => verb.includes(v) || v.includes(verb));
    let topicStart = 1;
    if (isContactVerb) {
      let prepIdx = -1;
      for (let i = 1; i < words.length; i++) {
        if (PREPS.includes(words[i])) {
          prepIdx = i;
          break;
        }
      }
      if (prepIdx > 1) {
        contact = words.slice(1, prepIdx).join(" ");
        topicStart = prepIdx + 1;
      } else if (words.length > 1) {
        contact = words.slice(1).join(" ");
        topicStart = words.length;
      }
    }
    const topicWords = words.slice(topicStart);
    topicDisplay = topicWords.join(" ") || raw;
    topicMatch = topicWords.join(" ");
  }

  const patterns = [
    /\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\b/i,
    /\b(today|tomorrow|yesterday)\b/i,
    /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/,
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m?.[0]) {
      dateTok = m[0].trim();
      break;
    }
  }

  if (dateTok) {
    topicMatch = topicMatch.replace(new RegExp(dateTok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "").trim();
    topicMatch = topicMatch.replace(/\s+/g, " ").trim();
  }

  return {
    verb,
    contact,
    topicDisplay: topicDisplay.trim() || raw,
    topicMatch: topicMatch.replace(/\s+/g, " ").trim() || lower,
    dateTok,
    words,
    raw,
  };
}

/**
 * Parse date token to ISO (YYYY-MM-DD) with optional rollForward and ambiguity flag.
 */
export function parseLooseDate(
  dateTok: string,
  refDate: Date,
  config?: ParserPipelineConfig
): ParsedDate {
  if (!dateTok || !dateTok.trim()) return { dueDate: null };

  const t = dateTok.trim().toLowerCase();
  const rollForward = config?.rollForward !== false;

  if (/^today$/i.test(t)) return { dueDate: toISODate(refDate) };
  if (/^tomorrow$/i.test(t)) return { dueDate: toISODate(addDays(refDate, 1)) };
  if (/^yesterday$/i.test(t)) return { dueDate: toISODate(addDays(refDate, -1)) };

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const nextMatch = t.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextMatch) {
    const target = weekdays.indexOf(nextMatch[1]);
    let d = addDays(refDate, 1);
    while (d.getDay() !== target) d = addDays(d, 1);
    return { dueDate: toISODate(d) };
  }
  const simpleDay = weekdays.find((d) => t === d);
  if (simpleDay) {
    const target = weekdays.indexOf(simpleDay);
    let d = new Date(refDate);
    d.setHours(0, 0, 0, 0);
    while (d.getDay() !== target) d = addDays(d, 1);
    return { dueDate: toISODate(d) };
  }

  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6,
    august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const monthDayMatch = t.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/);
  if (monthDayMatch) {
    const month = months[monthDayMatch[1].toLowerCase()];
    const day = parseInt(monthDayMatch[2], 10);
    const y = refDate.getFullYear();
    const d = new Date(y, month, day);
    if (rollForward && d < refDate) d.setFullYear(y + 1);
    return { dueDate: toISODate(d) };
  }

  const md = t.match(/^(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{2,4}))?$/);
  if (md) {
    let month = parseInt(md[1], 10) - 1;
    let day = parseInt(md[2], 10);
    let year = refDate.getFullYear();
    if (md[4]) year = parseInt(md[4].length === 2 ? "20" + md[4] : md[4], 10);
    const d = new Date(year, month, day);
    if (rollForward && d < refDate) d.setFullYear(d.getFullYear() + 1);
    const ambiguity = (parseInt(md[1], 10) <= 12 && parseInt(md[2], 10) <= 12 && !md[4]);
    return { dueDate: toISODate(d), ambiguity };
  }

  return { dueDate: null };
}

export type MatchResult = {
  rowIndex: number;
  score: number;
  folder: string;
  subfolder: string;
  category: string;
  chosenTask: string;
  lowConfidence: boolean;
};

/**
 * Score one parsed phrase against one template row. Higher = better match.
 */
export function scoreMatch(
  parsed: TokenizedPhrase & ParsedDate,
  row: TaskTemplateRow,
  config?: ParserPipelineConfig
): number {
  const tokenWeights = config?.tokenWeights ?? {};
  const topic = parsed.topicMatch.toLowerCase();
  const taskLower = row.task.toLowerCase();
  const alternatives = (row.taskAlternatives ?? []).map((a) => a.toLowerCase());
  const allTasks = [taskLower, ...alternatives];

  let score = 0;

  const topicWords = topic.split(/\s+/).filter(Boolean);
  for (const word of topicWords) {
    for (const t of allTasks) {
      if (t.includes(word) || word.length >= 3 && t.includes(word)) score += 1;
    }
    const w = tokenWeights[word];
    if (w) score += w;
  }

  if (parsed.contact && (row.task.toLowerCase().includes("call") || row.task.toLowerCase().includes("contact")))
    score += 1;
  if (row.folder && topic.includes(row.folder.toLowerCase())) score += 1;
  if (row.subfolder && topic.includes(row.subfolder.toLowerCase())) score += 1;
  if (row.category && topic.includes(row.category.toLowerCase())) score += 1;

  const exactPhrase = topicWords.join(" ");
  for (const t of allTasks) {
    if (t === exactPhrase || exactPhrase.includes(t) || t.includes(exactPhrase)) score += 2;
  }

  return score;
}

/**
 * Find best matching template row and chosen task (task or one of taskAlternatives) for a parsed phrase.
 */
export function findBestRowAndTask(
  parsed: ParsedPhrase,
  templateRows: TaskTemplateRow[],
  config?: ParserPipelineConfig
): MatchResult | null {
  const threshold = config?.matcherThreshold ?? 2;

  let best: { index: number; score: number; row: TaskTemplateRow; chosenTask: string } | null = null;

  for (let i = 0; i < templateRows.length; i++) {
    const row = templateRows[i];
    const score = scoreMatch(parsed, row, config);
    const alternatives = (row.taskAlternatives ?? []).concat(row.task);
    let chosenTask = row.task;
    let bestScore = score;
    for (const alt of alternatives) {
      const rowAlt = { ...row, task: alt, taskAlternatives: undefined };
      const s = scoreMatch(parsed, rowAlt, config);
      if (s > bestScore) {
        bestScore = s;
        chosenTask = alt;
      }
    }
    if (bestScore > 0 && (best === null || bestScore > best.score)) {
      best = { index: i, score: bestScore, row, chosenTask };
    }
  }

  if (!best) return null;

  return {
    rowIndex: best.index,
    score: best.score,
    folder: best.row.folder,
    subfolder: best.row.subfolder,
    category: best.row.category,
    chosenTask: best.chosenTask,
    lowConfidence: best.score < threshold,
  };
}

/**
 * Build a StructureItem-shaped object from parsed phrase + match result.
 */
export function buildRow(
  parsed: ParsedPhrase,
  match: MatchResult | null,
  defaultCategoryId: string = "default",
  defaultPriority: number = 5
): Partial<StructureItem> {
  const title = parsed.contact
    ? `${parsed.verb} ${parsed.contact} ${parsed.topicDisplay}`.trim()
    : (parsed.topicDisplay || parsed.raw);
  const categoryId = match ? match.category || defaultCategoryId : defaultCategoryId;
  return {
    title: title || parsed.raw,
    dueDate: parsed.dueDate ?? null,
    categoryId,
    priority: defaultPriority,
    metadata: {
      displayTask: match?.chosenTask,
      modifierText: parsed.contact || undefined,
      raw: parsed.raw,
    },
  };
}

/**
 * Run full pipeline on one phrase: tokenize → date → matcher → buildRow.
 */
export function runPhrasePipeline(
  phrase: string,
  templateRows: TaskTemplateRow[],
  refDate: Date,
  config?: ParserPipelineConfig
): {
  parsed: ParsedPhrase;
  match: MatchResult | null;
  built: Partial<StructureItem>;
  lowConfidence: boolean;
} {
  const tok = tokenize(phrase, config);
  const dateResult = parseLooseDate(tok.dateTok, refDate, config);
  const parsed: ParsedPhrase = { ...tok, ...dateResult };
  const match = findBestRowAndTask(parsed, templateRows, config);
  const built = buildRow(parsed, match, "default", 5);
  return {
    parsed,
    match,
    built,
    lowConfidence: match?.lowConfidence ?? true,
  };
}
