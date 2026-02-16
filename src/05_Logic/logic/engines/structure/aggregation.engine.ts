/**
 * Aggregation engine — rollups by date range and signals/blockers/opportunities. Pure; no state.
 */

import type { StructureItem, Rollup } from "./structure.types";

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregate items by date range, grouped by day | week | month.
 */
export function aggregateByDateRange(
  items: StructureItem[],
  from: Date,
  to: Date,
  groupBy: "day" | "week" | "month"
): Rollup[] {
  const rollups: Rollup[] = [];
  const fromTime = from.getTime();
  const toTime = to.getTime();

  const withDue = items.filter((i) => i.dueDate);
  const byKey: Record<string, StructureItem[]> = {};

  for (const item of withDue) {
    const d = new Date(item.dueDate!);
    if (d.getTime() < fromTime || d.getTime() > toTime) continue;
    let key: string;
    if (groupBy === "day") key = toISO(d);
    else if (groupBy === "week") {
      const start = new Date(d);
      start.setDate(start.getDate() - start.getDay());
      key = toISO(start);
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(item);
  }

  for (const [period, list] of Object.entries(byKey)) {
    rollups.push({
      period,
      from: period,
      to: period,
      count: list.length,
      items: list,
    });
  }
  return rollups.sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Aggregate signals, blockers, opportunities from items (decision-style).
 */
export function aggregateSignals(items: StructureItem[]): {
  signals: string[];
  blockers: string[];
  opportunities: string[];
} {
  const signals: string[] = [];
  const blockers: string[] = [];
  const opportunities: string[] = [];
  for (const item of items) {
    if (item.signals) signals.push(...item.signals);
    if (item.blockers) blockers.push(...item.blockers);
    if (item.opportunities) opportunities.push(...item.opportunities);
  }
  return {
    signals: [...new Set(signals)],
    blockers: [...new Set(blockers)],
    opportunities: [...new Set(opportunities)],
  };
}
