/**
 * Shared date/time helpers for day/week/month planners. Pure; no state.
 */

/** ISO date key YYYY-MM-DD from Date. */
export function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Minutes since midnight from "HH:mm" string. */
export function fromHM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** "HH:mm" from minutes since midnight. */
export function toMin(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Alias for fromHM for naming consistency with existing code. */
export function toMinutes(t: string): number {
  return fromHM(t);
}

/** Alias for toMin. */
export function fromMin(mins: number): string {
  return toMin(mins);
}

/** Whether timestamp (ms) falls within [start, end) in minutes-from-midnight. */
export function betweenTs(
  tsMs: number,
  dayStart: Date,
  startMin: number,
  endMin: number
): boolean {
  const d = new Date(tsMs);
  if (toKey(d) !== toKey(dayStart)) return false;
  const min = d.getHours() * 60 + d.getMinutes();
  return min >= startMin && min < endMin;
}

/** Get 7 ISO date strings (Sun–Sat) for the week containing the given date. */
export function getWeekDates(ref: Date): string[] {
  const start = new Date(ref);
  start.setDate(start.getDate() - start.getDay());
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(toKey(d));
  }
  return out;
}

export type MonthCell = {
  dateKey: string;
  isCurrentMonth: boolean;
  dayOfMonth: number;
};

/** 42 cells (6 rows × 7) for a month calendar; first row starts on Sunday. */
export function getMonthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const cells: MonthCell[] = [];
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLast = new Date(prevYear, prevMonth + 1, 0);
  const prevDays = prevLast.getDate();

  for (let i = 0; i < startPad; i++) {
    const d = prevDays - startPad + 1 + i;
    const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ dateKey, isCurrentMonth: false, dayOfMonth: d });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ dateKey, isCurrentMonth: true, dayOfMonth: d });
  }
  const remaining = 42 - cells.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let d = 1; d <= remaining; d++) {
    const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ dateKey, isCurrentMonth: false, dayOfMonth: d });
  }
  return cells.slice(0, 42);
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
