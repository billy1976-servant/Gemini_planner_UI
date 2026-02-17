/**
 * OSB V5 — Relative-time: offset + refDate → dueDate (ISO).
 * Used by journey loader only; store only dueDate on StructureItem.
 */

export function addDays(isoDate: string, offsetDays: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Resolve dueDate from template: use dueDate if set, else dueOffset + refDate.
 */
export function resolveDueDate(
  item: { dueDate?: string | null; dueOffset?: number; relativeTo?: "targetDate" | "startDate" },
  targetDate: string | undefined,
  startDate: string | undefined
): string | null {
  if (item.dueDate != null && item.dueDate !== "") return item.dueDate;
  const offset = item.dueOffset;
  if (offset == null) return null;
  const ref = item.relativeTo === "startDate" ? startDate : targetDate;
  if (!ref) return null;
  return addDays(ref, offset);
}
