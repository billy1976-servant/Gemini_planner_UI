/**
 * Structure engine types — pure contracts. No UI, no state, no side effects.
 * Used by structure engines and actions only.
 */

export type StructureTreeNode = {
  id: string;
  name: string;
  children?: StructureTreeNode[];
  order?: number;
};

export type RecurrenceBlock = {
  recurringType: "daily" | "weekly" | "monthly" | "quarterly" | "off";
  recurringDetails?: string;
  /** When set, next occurrence after miss uses this + interval. */
  lastExpectedAt?: string;
  lastCompletedAt?: string;
};

export type HabitBlock = {
  startValue: number;
  targetValue: number;
  durationDays: number;
  timeSlots?: string[];
  activeDays?: number[];
};

export type StructureItem = {
  id: string;
  title: string;
  categoryId: string;
  priority: number;
  dueDate: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Optional parent item id for sub-tasks. */
  parentId?: string;
  recurrence?: RecurrenceBlock;
  habit?: HabitBlock;
  signals?: string[];
  blockers?: string[];
  opportunities?: string[];
  metadata?: Record<string, unknown>;
};

export type Block = {
  id?: string;
  start: string;
  end: string;
  label?: string;
};

export type ResolvedRuleset = {
  priorityScale?: { min: number; max: number; default: number };
  /** Ramp priority 1–10 by days until due (e.g. 7 days out = 1, day of = 10). */
  priorityRamp?: {
    daysOutForMin?: number;
    daysOutForMax?: number;
    minPriority?: number;
    maxPriority?: number;
  };
  /** Hide from weekly view until effective priority >= this. */
  visibilityMinPriority?: number;
  escalation?: {
    enabled: boolean;
    daysUntilEscalation?: number;
    incrementPerDay?: number;
    maxPriority?: number;
  };
  cancelDayReset?: "none" | "moveToNextDay" | "decrementPriority";
  recurrenceDefinitions?: Record<string, unknown>;
  schedulingDefaults?: {
    defaultDayTemplate?: Block[];
    businessHours?: { start: string; end: string };
    slotDuration?: number;
  };
  categoryInference?: {
    keywords?: Record<string, string>;
    defaultCategoryId?: string;
  };
  priorityInference?: Record<string, number>;
  habitDefaults?: { startValue: number; targetValue: number; durationDays: number };
  [key: string]: unknown;
};

export type ScheduledItem = {
  itemId: string;
  slot?: number;
  effectiveTime?: string;
};

export type Rollup = {
  period: string;
  from: string;
  to: string;
  count: number;
  items?: StructureItem[];
};

export type WhenClause = Record<string, unknown>;
export type RuleMatch = { ruleId: string; when: WhenClause; then?: Record<string, unknown> };
export type RuleContext = { date?: Date; item?: StructureItem; stateSlice?: unknown; [key: string]: unknown };

export type ParseSegment = { text: string; isFinal?: boolean; timestamp?: number };
export type ParseResult = {
  segments: ParseSegment[];
  sentences: string[];
  intent?: "task" | "note" | "question" | "command";
};
export type MapperContext = {
  refDate: Date;
  activeCategoryId?: string;
  rules: ResolvedRuleset;
};
export type MapperTrace = {
  segmentsUsed: string[];
  matchedRuleIds: string[];
  extractedFields: Record<string, unknown>;
};

/* ========== V4 Parser pipeline types ========== */

/** One row in the Task Folder Details template (Folder → Subfolder → Category → Task). */
export type TaskTemplateRow = {
  folder: string;
  subfolder: string;
  category: string;
  task: string;
  taskAlternatives?: string[];
  modifierRequired?: boolean;
  defaultDue?: string;
  displayTask?: string;
};

/** Output of tokenize step: verb, contact, topic, date token, words for scoring. */
export type TokenizedPhrase = {
  verb: string;
  contact: string;
  topicDisplay: string;
  topicMatch: string;
  dateTok: string;
  words: string[];
  raw: string;
};

/** Output of date step: resolved ISO or ambiguity. */
export type ParsedDate = {
  dueDate: string | null;
  ambiguity?: boolean;
};

/** Parsed phrase (tokenize + date) ready for matcher. */
export type ParsedPhrase = TokenizedPhrase & ParsedDate;

/** Parser pipeline config (tokenWeights, modifierVerbs, threshold). */
export type ParserPipelineConfig = {
  modifierVerbs?: string[];
  tokenWeights?: Record<string, number>;
  matcherThreshold?: number;
  autoConfirmThreshold?: number;
  rollForward?: boolean;
};
