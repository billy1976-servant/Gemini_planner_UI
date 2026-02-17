/**
 * Shared timeline constants and blockToPosition for the unified planner.
 * Single source of truth so TimeAxis, DayView, and ChunkPlannerLayer stay aligned.
 */
import { fromHM } from "@/logic/planner/date-helpers";

export const DAY_START_MIN = 6 * 60;
export const DAY_END_MIN = 24 * 60;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 30;
export const TOTAL_SLOTS = (DAY_END_MIN - DAY_START_MIN) / SLOT_MINUTES;

/** Total height of the timeline grid in px. */
export const TIMELINE_GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;

export type BlockLike = { start: string; end: string };

/**
 * Returns CSS top/height as percentage for a block within the day range.
 * Use with the same DAY_START_MIN / DAY_END_MIN as the timeline axis.
 */
export function blockToPosition(block: BlockLike): { top: string; height: string } {
  const startMin = Math.max(DAY_START_MIN, fromHM(block.start));
  const endMin = Math.min(DAY_END_MIN, fromHM(block.end));
  const top = ((startMin - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100;
  const height = ((endMin - startMin) / (DAY_END_MIN - DAY_START_MIN)) * 100;
  return { top: `${top}%`, height: `${height}%` };
}
