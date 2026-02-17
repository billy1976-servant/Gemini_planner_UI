/**
 * Recurrence engine — next occurrence(s) and isDueOn. Pure; no state.
 */

import type { StructureItem, RecurrenceBlock } from "./structure.types";

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function parseWeeklyDetails(details: string | undefined): number[] {
  if (!details) return [1, 2, 3, 4, 5];
  const days: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const out: number[] = [];
  const parts = (details || "").toLowerCase().split(/[\s,]+/);
  for (const p of parts) {
    const d = days[p?.slice(0, 3) ?? ""];
    if (d !== undefined && !out.includes(d)) out.push(d);
  }
  return out.length ? out.sort((a, b) => a - b) : [1, 2, 3, 4, 5];
}

/**
 * Next N occurrence dates for a task (with recurrence block).
 */
export function nextOccurrences(
  task: StructureItem,
  fromDate: Date,
  count: number
): string[] {
  const rec = task.recurrence as RecurrenceBlock | undefined;
  if (!rec || rec.recurringType === "off") {
    if (task.dueDate) return [task.dueDate].slice(0, count);
    return [];
  }

  const out: string[] = [];
  let d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);

  if (rec.recurringType === "daily") {
    for (let i = 0; i < count; i++) {
      out.push(toISO(d));
      d = addDays(d, 1);
    }
    return out;
  }

  if (rec.recurringType === "weekly") {
    const weekdays = parseWeeklyDetails(rec.recurringDetails);
    let steps = 0;
    const maxSteps = 366;
    while (out.length < count && steps++ < maxSteps) {
      if (weekdays.includes(d.getDay())) out.push(toISO(d));
      d = addDays(d, 1);
    }
    return out;
  }

  if (rec.recurringType === "monthly") {
    const dayOfMonth = fromDate.getDate();
    for (let i = 0; i < count; i++) {
      const next = new Date(d.getFullYear(), d.getMonth(), dayOfMonth);
      if (next >= d) out.push(toISO(next));
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return out.slice(0, count);
  }

  if (rec.recurringType === "quarterly") {
    const dayOfMonth = fromDate.getDate();
    let y = d.getFullYear();
    let m = d.getMonth();
    while (out.length < count) {
      const next = new Date(y, m, Math.min(dayOfMonth, new Date(y, m + 1, 0).getDate()));
      if (next >= d) out.push(toISO(next));
      m += 3;
      if (m >= 12) {
        m -= 12;
        y += 1;
      }
      d = new Date(y, m, 1);
    }
    return out.slice(0, count);
  }

  return [];
}

/**
 * Whether the task is due on the given date (recurrence or single dueDate).
 */
export function isDueOn(task: StructureItem, date: Date): boolean {
  const rec = task.recurrence as RecurrenceBlock | undefined;
  const ref = toISO(date);

  if (!rec || rec.recurringType === "off") {
    return task.dueDate === ref;
  }

  if (rec.recurringType === "daily") return true;
  if (rec.recurringType === "weekly") {
    const weekdays = parseWeeklyDetails(rec.recurringDetails);
    return weekdays.includes(date.getDay());
  }
  if (rec.recurringType === "monthly") {
    return task.dueDate?.endsWith(ref.slice(5)) ?? false;
  }
  if (rec.recurringType === "quarterly") {
    const q = Math.floor(date.getMonth() / 3) + 1;
    const qDue = task.dueDate ? Math.floor(new Date(task.dueDate).getMonth() / 3) + 1 : 0;
    return q === qDue && task.dueDate?.slice(8, 10) === ref.slice(8, 10);
  }
  return false;
}
