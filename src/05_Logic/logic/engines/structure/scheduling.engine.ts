/**
 * Scheduling engine — which tasks appear on a date with optional slot assignment. Pure; no state.
 */

import type { StructureItem, Block, ResolvedRuleset, ScheduledItem } from "./structure.types";
import { isDueOn } from "./recurrence.engine";

/**
 * Return scheduled items for the given date: tasks that are due on that date,
 * optionally assigned to blocks/slots from rules or blocks array.
 */
export function scheduledForDate(
  tasks: StructureItem[],
  date: Date,
  blocks: Block[],
  _rules: ResolvedRuleset
): ScheduledItem[] {
  const due = tasks.filter((t) => isDueOn(t, date));
  const result: ScheduledItem[] = due.map((t, i) => ({
    itemId: t.id,
    slot: blocks.length > 0 ? i % blocks.length : undefined,
    effectiveTime: blocks[i]?.start,
  }));
  return result;
}
