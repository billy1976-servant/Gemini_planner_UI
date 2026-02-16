/**
 * Pure date utilities for structure engine. No state, no UI.
 * Parse relative date phrases to ISO date string.
 */

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

const RELATIVE_PATTERNS: Array<{ pattern: RegExp; fn: (ref: Date) => Date }> = [
  { pattern: /^today$/i, fn: (ref) => ref },
  { pattern: /^tomorrow$/i, fn: (ref) => addDays(ref, 1) },
  { pattern: /^yesterday$/i, fn: (ref) => addDays(ref, -1) },
];

/**
 * Parse relative date phrase to ISO date string (YYYY-MM-DD).
 * @param phrase e.g. "today", "tomorrow", "next Monday"
 * @param refDate reference date for relative resolution
 */
export function parseRelativeDate(phrase: string, refDate: Date): string | null {
  const trimmed = (phrase ?? "").trim();
  if (!trimmed) return null;

  for (const { pattern, fn } of RELATIVE_PATTERNS) {
    if (pattern.test(trimmed)) return toISODate(fn(refDate));
  }

  if (/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(trimmed)) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = trimmed.replace(/^next\s+/i, "").toLowerCase();
    const target = days.indexOf(dayName);
    if (target >= 0) {
      let d = addDays(refDate, 1);
      while (d.getDay() !== target) d = addDays(d, 1);
      return toISODate(d);
    }
  }

  // Bare weekday name (e.g. "thursday", "Thursday") → next occurrence of that day
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(trimmed)) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const target = days.indexOf(trimmed.toLowerCase());
    if (target >= 0) {
      let d = new Date(refDate);
      d.setHours(0, 0, 0, 0);
      while (d.getDay() !== target) d = addDays(d, 1);
      return toISODate(d);
    }
  }

  return null;
}

/**
 * Try to extract a date phrase from text (e.g. "task Thursday" or "task tomorrow") and return ISO date or null.
 * Looks for known relative phrases and weekday names.
 */
export function extractDatePhrase(text: string, refDate: Date): string | null {
  const lower = text.toLowerCase().trim();
  const phrases = ["today", "tomorrow", "yesterday"];
  for (const p of phrases) {
    if (lower.includes(p)) return parseRelativeDate(p, refDate);
  }
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  for (const day of days) {
    const re = new RegExp(`\\b(next\\s+)?${day}\\b`, "i");
    const m = text.match(re);
    if (m) return parseRelativeDate(m[0].trim(), refDate);
  }
  return null;
}

/**
 * Return whether the given ISO date string is the same calendar day as refDate.
 */
export function isToday(iso: string, refDate: Date): boolean {
  if (!iso || typeof iso !== "string") return false;
  const [y, m, d] = iso.split("-").map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  return (
    refDate.getFullYear() === y &&
    refDate.getMonth() + 1 === m &&
    refDate.getDate() === d
  );
}
