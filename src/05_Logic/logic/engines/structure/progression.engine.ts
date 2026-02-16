/**
 * Progression engine — habit ramp value for a date. Pure; no state.
 */

import type { HabitBlock } from "./structure.types";

/**
 * Linear ramp from startValue to targetValue over durationDays.
 * Returns value at refDate (clamped to [startValue, targetValue]).
 */
export function rampValueForDate(
  habit: HabitBlock,
  refDate: Date
): number {
  const { startValue, targetValue, durationDays } = habit;
  if (durationDays <= 0) return targetValue;
  const start = new Date(refDate);
  start.setHours(0, 0, 0, 0);
  const t = start.getTime() / (durationDays * 24 * 60 * 60 * 1000);
  const linear = startValue + (targetValue - startValue) * Math.min(1, Math.max(0, t));
  return Math.min(
    Math.max(startValue, targetValue),
    Math.max(Math.min(startValue, targetValue), linear)
  );
}

/**
 * Optional: streak days from a log (array of ISO dates when habit was done).
 * Not required for V5; stub for contract.
 */
export function streakDays(
  _habit: HabitBlock,
  _log: string[]
): number {
  return 0;
}
