/**
 * In-memory timeline of annotation events for replay/export.
 * All drawing actions can push events here; replay consumes by timestamp.
 */

export type AnnotationEventType = "draw" | "highlight" | "erase";

export interface AnnotationPathPoint {
  x: number;
  y: number;
}

export interface AnnotationEvent {
  id: string;
  slideId: string;
  /** Session-relative timestamp in seconds. */
  timestamp: number;
  type: AnnotationEventType;
  path: AnnotationPathPoint[];
  color: string;
  width: number;
}

const timeline: AnnotationEvent[] = [];
let sessionStartTimeSec: number | null = null;

export function initAnnotationTimeline(sessionStartSec: number): void {
  timeline.length = 0;
  sessionStartTimeSec = sessionStartSec;
}

export function recordAnnotationEvent(event: Omit<AnnotationEvent, "id" | "timestamp"> & { timestampSec?: number }): void {
  const now = sessionStartTimeSec != null ? event.timestampSec ?? (Date.now() / 1000) - sessionStartTimeSec : (event.timestampSec ?? 0);
  timeline.push({
    ...event,
    id: crypto.randomUUID(),
    timestamp: now,
  });
}

export function getAnnotationTimeline(): AnnotationEvent[] {
  return [...timeline];
}

export function clearAnnotationTimeline(): void {
  timeline.length = 0;
  sessionStartTimeSec = null;
}

export function getAnnotationTimelineForSlide(slideId: string): AnnotationEvent[] {
  return timeline.filter((e) => e.slideId === slideId);
}

export function getSessionStartTimeSec(): number | null {
  return sessionStartTimeSec;
}
