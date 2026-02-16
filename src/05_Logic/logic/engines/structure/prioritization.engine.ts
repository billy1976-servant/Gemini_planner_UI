/**
 * Prioritization engine — effective priority, sort order, cancel-day. Pure; no state.
 */

import type { StructureItem, ResolvedRuleset } from "./structure.types";

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Effective priority (base + escalation by days overdue).
 */
export function effectivePriority(
  item: StructureItem,
  date: Date,
  rules: ResolvedRuleset
): number {
  const scale = rules.priorityScale ?? { min: 0, max: 10, default: 5 };
  let p = typeof item.priority === "number" ? item.priority : scale.default ?? 5;
  const esc = rules.escalation;
  if (esc?.enabled && item.dueDate) {
    const due = new Date(item.dueDate);
    const ref = new Date(date);
    ref.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const daysOver = Math.max(0, Math.floor((ref.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)));
    const inc = esc.incrementPerDay ?? 1;
    const max = esc.maxPriority ?? scale.max ?? 10;
    p = Math.min(max, p + daysOver * inc);
  }
  return Math.max(scale.min ?? 0, Math.min(scale.max ?? 10, p));
}

/**
 * Sort items by effective priority (desc), then by due date (asc).
 */
export function sortByPriority(
  items: StructureItem[],
  date: Date,
  rules: ResolvedRuleset
): StructureItem[] {
  return [...items].sort((a, b) => {
    const pa = effectivePriority(a, date, rules);
    const pb = effectivePriority(b, date, rules);
    if (pb !== pa) return pb - pa;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/**
 * Apply cancel-day reset: move to next day or decrement priority per rules.
 */
export function applyCancelDay(
  items: StructureItem[],
  date: Date,
  rules: ResolvedRuleset
): StructureItem[] {
  const mode = rules.cancelDayReset ?? "none";
  if (mode === "none") return items;

  const ref = toISO(date);
  return items.map((item) => {
    if (item.dueDate !== ref) return item;
    if (mode === "moveToNextDay") {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return { ...item, dueDate: toISO(next), updatedAt: new Date().toISOString() };
    }
    if (mode === "decrementPriority") {
      const scale = rules.priorityScale ?? { min: 0, max: 10 };
      const p = Math.max(scale.min ?? 0, (item.priority ?? 5) - 1);
      return { ...item, priority: p, updatedAt: new Date().toISOString() };
    }
    return item;
  });
}
