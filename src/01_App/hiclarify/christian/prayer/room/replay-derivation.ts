/**
 * Shared replay derivation: current slide index, current session slide, annotations up to time.
 * Used by SessionReplayViewer and any other replay UI.
 */

import type { SessionEvent } from "./session-timeline";
import type { AnnotationEvent } from "./annotation-timeline";
import type { StudyPage } from "./StudyPagesManager";

export function getCurrentSlideIndex(sessionTimeline: SessionEvent[], currentTimeSec: number): number {
  let index = 0;
  for (const e of sessionTimeline) {
    if (e.type !== "slide-change" || e.timestamp > currentTimeSec) continue;
    const i = (e.data as { index?: number }).index;
    if (typeof i === "number") index = i;
  }
  return index;
}

/**
 * Get current session study page (with imageUrl) by timestamp: most recent page with timestampSec <= currentTimeSec.
 */
export function getCurrentSessionSlide(
  sessionStudyPages: StudyPage[],
  currentTimeSec: number
): StudyPage | null {
  const withImages = sessionStudyPages.filter((p) => p.imageUrl);
  if (withImages.length === 0) return null;
  let best: StudyPage | null = null;
  let bestSec = -1;
  for (const p of withImages) {
    const t = p.timestampSec ?? 0;
    if (t <= currentTimeSec && t >= bestSec) {
      best = p;
      bestSec = t;
    }
  }
  return best ?? withImages[0] ?? null;
}

export function getAnnotationsUpToTime(
  annotationTimeline: AnnotationEvent[],
  slideId: string,
  currentTimeSec: number
): AnnotationEvent[] {
  return annotationTimeline.filter(
    (e) => e.slideId === slideId && e.timestamp <= currentTimeSec
  );
}
