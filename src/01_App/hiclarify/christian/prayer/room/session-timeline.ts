/**
 * Synchronized session timeline: slide changes and recording timestamps.
 * Annotation events are recorded only in annotation-timeline.ts; session-timeline
 * is used for slide-change events for replay/export. SessionEventType includes
 * "annotation" for type compatibility when reading merged timelines.
 */

export type SessionEventType = "slide-change" | "annotation";

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  /** Session-relative timestamp in seconds. */
  timestamp: number;
  slideId: string;
  data: Record<string, unknown>;
}

const sessionEvents: SessionEvent[] = [];
let sessionStartTimeSec: number | null = null;

export function initSessionTimeline(sessionStartSec: number): void {
  sessionEvents.length = 0;
  sessionStartTimeSec = sessionStartSec;
}

function nowSec(): number {
  return sessionStartTimeSec != null ? Date.now() / 1000 - sessionStartTimeSec : 0;
}

export function recordSlideChange(slideId: string, index: number): void {
  sessionEvents.push({
    id: crypto.randomUUID(),
    type: "slide-change",
    timestamp: nowSec(),
    slideId,
    data: { index },
  });
}

export function getSessionTimeline(): SessionEvent[] {
  return [...sessionEvents];
}

export function clearSessionTimeline(): void {
  sessionEvents.length = 0;
  sessionStartTimeSec = null;
}

export function getSessionStartTimeSec(): number | null {
  return sessionStartTimeSec;
}
