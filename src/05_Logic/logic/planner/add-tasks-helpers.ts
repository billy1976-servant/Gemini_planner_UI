/**
 * Helpers for Add Tasks / Quick-Add flow: estimate start date and recurrence from UI choices.
 * Used by JSX_AddTasks; pure, no state.
 */
import { addDays, toKey } from "./date-helpers";
import type { RecurrenceBlock } from "@/logic/engines/structure/structure.types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function clone(d: Date): Date {
  return new Date(d.getTime());
}

function nextDowOnOrAfter(base: Date, dayOfWeek: number): Date {
  return addDays(base, (dayOfWeek - base.getDay() + 7) % 7);
}

function nextWeekdayOnOrAfter(base: Date): Date {
  let d = clone(base);
  while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
  return d;
}

function nextWeekendOnOrAfter(base: Date): Date {
  const sat = nextDowOnOrAfter(base, 6);
  const sun = nextDowOnOrAfter(base, 0);
  return sat <= sun ? sat : sun;
}

function nextMonthStart(d: Date, n = 1): Date {
  const x = clone(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type EstimateDayOptions = {
  mode: string;
  button?: string;
  today?: Date;
};

/** Compute the first occurrence date from "Start" button and folder mode (Home/Business/Church). */
export function estimateDay(options: EstimateDayOptions): Date {
  const now = options.today ?? new Date();
  let base = now;

  if (options.button?.startsWith("Day: ")) {
    const dayStr = options.button.split(": ")[1];
    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const targetDow = dayMap[dayStr ?? ""];
    if (targetDow !== undefined) return nextDowOnOrAfter(now, targetDow);
  }

  if (options.button === "Today" || options.button?.startsWith("Start now")) {
    base = now;
  } else if (options.button?.startsWith("In ")) {
    const parts = options.button.split(" ");
    const n = parseInt(parts[1] ?? "0", 10);
    const unit = parts[2] ?? "";
    if (unit.startsWith("week")) base = addDays(now, n * 7);
    else if (unit.startsWith("month")) base = nextMonthStart(now, n);
  } else if (options.button === "This week") {
    base = now;
  }

  switch (options.mode) {
    case "Church":
      return nextDowOnOrAfter(base, 0);
    case "Business":
      return nextWeekdayOnOrAfter(base);
    case "Home":
      return nextWeekendOnOrAfter(base);
    default:
      return nextWeekdayOnOrAfter(base);
  }
}

export function fmtEst(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

/** Suggest recurrence from task name (e.g. "oil change" → 3m). */
export function suggestFrequency(taskName: string): string {
  const t = taskName.toLowerCase();
  if (/haircut|barber/.test(t)) return "3w";
  if (/dentist/.test(t)) return "6m";
  if (/oil change/.test(t)) return "3m";
  if (/bill|rent|mortgage|internet|electric|water|phone/.test(t)) return "1m";
  if (/mow/.test(t)) return "1w";
  return "off";
}

export function formatFrequency(freq: string): string {
  if (!freq || freq === "off") return "One-time";
  const n = parseInt(freq, 10);
  const unit = freq.endsWith("w") ? "week" : "month";
  return `Every ${n > 1 ? `${n} ` : ""}${unit}${n > 1 ? "s" : ""}`;
}

export type StartDateOption = { label: string; value: string };

export function getStartDateOptions(freq: string): StartDateOption[] {
  if (!freq || freq === "off") {
    return [
      { label: "Today", value: "Today" },
      { label: "This week", value: "This week" },
      { label: "Choose day", value: "Choose day" },
    ];
  }
  const n = parseInt(freq, 10);
  const unit = freq.endsWith("w") ? "week" : "month";
  const options: StartDateOption[] = [{ label: "now", value: "Start now" }];
  for (let i = 1; i <= Math.min(n, 4); i++) {
    options.push({
      label: `${i} ${unit}${i > 1 ? "s" : ""}`,
      value: `In ${i} ${unit}${i > 1 ? "s" : ""}`,
    });
  }
  return options;
}

/** Map Quick-Add freq string to RecurrenceBlock for structure items. */
export function freqToRecurrence(freq: string): RecurrenceBlock | undefined {
  if (!freq || freq === "off") return undefined;
  if (freq.endsWith("w")) {
    return { recurringType: "weekly", recurringDetails: "" };
  }
  if (freq.endsWith("m")) {
    const n = parseInt(freq, 10);
    if (n >= 3) return { recurringType: "quarterly" };
    return { recurringType: "monthly" };
  }
  return undefined;
}

/** Map folder display name to structure categoryId (tree node id). */
export function folderToCategoryId(folder: string): string {
  const map: Record<string, string> = {
    Home: "home",
    Business: "business",
    Church: "relationships",
    Health: "health",
    Relationships: "relationships",
    Finance: "finance",
    Projects: "projects",
    Travel: "travel",
    Maintenance: "maintenance",
    Growth: "growth",
  };
  return map[folder] ?? folder.toLowerCase().replace(/\s+/, "_");
}
