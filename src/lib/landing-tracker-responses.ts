export type ResponseRule =
  | { type: "valueLabel"; field: string; map: Record<string, string> }
  | { type: "boolean"; field: string; trueText: string; falseText?: string }
  | { type: "numberTemplate"; field: string; template: string }
  | {
      type: "range";
      field: string;
      ranges: Array<{ min?: number; max?: number; text: string }>;
      defaultText?: string;
    }
  | { type: "compoundTemplate"; fields: string[]; template: string };

export type TrackerResponseConfig = {
  enabled?: boolean;
  rule?: ResponseRule;
  fallbackText?: string;
};

export type StepTrackerResponseConfig = {
  title: string;
  description: string;
  showResponses?: boolean;
  responsePlaceholder?: string;
  completedOnly?: boolean;
};

export type DynamicSummaryLine = {
  sourceStepId?: string;
  rule?: ResponseRule;
  prefix?: string;
};

export type DynamicSummaryConfig = {
  mode?: "autoFromTrackerRules" | "lines";
  heading?: string;
  includeUnanswered?: boolean;
  lines?: DynamicSummaryLine[];
};

export type TrackerStatus = "done" | "current" | "todo";

export function resolveFieldValue(values: Record<string, unknown>, field: string): unknown {
  return values[field];
}

function applyTemplate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const raw = values[key];
    if (raw == null) return "";
    return String(raw);
  });
}

export function formatResponse(rule: ResponseRule, values: Record<string, unknown>): string | null {
  if (rule.type === "valueLabel") {
    const raw = resolveFieldValue(values, rule.field);
    if (raw == null || raw === "") return null;
    const mapped = rule.map[String(raw)];
    return mapped ?? String(raw);
  }

  if (rule.type === "boolean") {
    const raw = resolveFieldValue(values, rule.field);
    if (raw !== true && raw !== false) return null;
    if (raw === true) return rule.trueText;
    return rule.falseText ?? null;
  }

  if (rule.type === "numberTemplate") {
    const raw = resolveFieldValue(values, rule.field);
    if (typeof raw !== "number" || Number.isNaN(raw)) return null;
    return applyTemplate(rule.template, { value: raw });
  }

  if (rule.type === "range") {
    const raw = resolveFieldValue(values, rule.field);
    if (typeof raw !== "number" || Number.isNaN(raw)) return null;
    const hit = rule.ranges.find((r) => {
      const meetsMin = r.min == null || raw >= r.min;
      const meetsMax = r.max == null || raw <= r.max;
      return meetsMin && meetsMax;
    });
    if (hit) return hit.text;
    return rule.defaultText ?? null;
  }

  if (rule.type === "compoundTemplate") {
    const mapped: Record<string, unknown> = {};
    for (const field of rule.fields) {
      const raw = resolveFieldValue(values, field);
      if (raw == null || raw === "") return null;
      mapped[field] = raw;
    }
    return applyTemplate(rule.template, mapped);
  }

  return null;
}

export function getScreenTrackerResponse(args: {
  screen: { trackerResponse?: TrackerResponseConfig };
  values: Record<string, unknown>;
  trackerConfig: StepTrackerResponseConfig;
  status: TrackerStatus;
}): string | null {
  const { screen, values, trackerConfig, status } = args;
  if (trackerConfig.showResponses !== true) return null;
  if (trackerConfig.completedOnly === true && status === "todo") return null;
  if (screen.trackerResponse?.enabled === false) return null;

  const rule = screen.trackerResponse?.rule;
  if (rule) {
    const fromRule = formatResponse(rule, values);
    if (fromRule && fromRule.trim().length > 0) return fromRule;
  }

  if (screen.trackerResponse?.fallbackText) return screen.trackerResponse.fallbackText;
  return trackerConfig.responsePlaceholder ?? null;
}

export function buildSummaryFromConfig(args: {
  screens: Array<{
    id: string;
    stepLabel: string;
    trackerResponse?: TrackerResponseConfig;
    dynamicSummaryConfig?: DynamicSummaryConfig;
  }>;
  values: Record<string, unknown>;
  summaryConfig?: DynamicSummaryConfig;
  trackerConfig: StepTrackerResponseConfig;
  legacyFallback: () => string;
}): string {
  const { screens, values, summaryConfig, trackerConfig, legacyFallback } = args;
  if (!summaryConfig) return legacyFallback();

  const mode = summaryConfig.mode ?? "autoFromTrackerRules";
  const includeUnanswered = summaryConfig.includeUnanswered === true;
  const placeholder = trackerConfig.responsePlaceholder ?? "Not answered";
  const lines: string[] = [];

  if (mode === "lines") {
    for (const line of summaryConfig.lines ?? []) {
      const sourceScreen = line.sourceStepId ? screens.find((s) => s.id === line.sourceStepId) : undefined;
      const rule = line.rule ?? sourceScreen?.trackerResponse?.rule;
      if (!rule) continue;
      const text = formatResponse(rule, values);
      if (text) lines.push(line.prefix ? `${line.prefix} ${text}` : text);
      else if (includeUnanswered) lines.push(line.prefix ? `${line.prefix} ${placeholder}` : placeholder);
    }
  } else {
    for (const screen of screens) {
      if (screen.trackerResponse?.enabled === false) continue;
      const rule = screen.trackerResponse?.rule;
      if (!rule) continue;
      const text = formatResponse(rule, values);
      if (text) lines.push(`${screen.stepLabel}: ${text}`);
      else if (includeUnanswered) lines.push(`${screen.stepLabel}: ${placeholder}`);
    }
  }

  if (!lines.length) return legacyFallback();
  if (summaryConfig.heading) return `${summaryConfig.heading} ${lines.join(" ")}`;
  return lines.join(" ");
}
