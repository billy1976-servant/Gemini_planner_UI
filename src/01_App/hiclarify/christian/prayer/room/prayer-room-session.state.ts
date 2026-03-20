/**
 * Prayer Live Room session state — HICLARIFY state slice.
 * Single key state.values.prayerRoomSession; pattern from structure.actions.ts.
 * Used by PrayerRoom and (optionally) children for slide/session/annotation state.
 * Replay data (exported timelines) lives in state.values.prayerRoomReplay when recording stops.
 */

import { getState, dispatchState } from "@/state/state-store";
import type { StudyPage } from "./StudyPagesManager";
import type { StudyDeck } from "../study/StudySlide";
import type { AnnotationStroke } from "./AnnotationOverlay";
import type { SessionEvent } from "./session-timeline";
import type { AnnotationEvent } from "./annotation-timeline";

const PRAYER_ROOM_SESSION_KEY = "prayerRoomSession";
const PRAYER_ROOM_REPLAY_KEY = "prayerRoomReplay";

export interface PrayerRoomReplaySlice {
  roomId: string | null;
  sessionTimeline: SessionEvent[];
  annotationTimeline: AnnotationEvent[];
}

export interface PrayerRoomSessionSlice {
  roomId: string | null;
  studyPages: StudyPage[];
  annotationStrokes: AnnotationStroke[];
  annotationVisible: boolean;
  activeDeck: StudyDeck | null;
  currentSlideIndex: number;
  currentSessionSlideIndex: number;
}

const DEFAULT_SLICE: PrayerRoomSessionSlice = {
  roomId: null,
  studyPages: [],
  annotationStrokes: [],
  annotationVisible: true,
  activeDeck: null,
  currentSlideIndex: 0,
  currentSessionSlideIndex: 0,
};

/**
 * Read the session slice from state. If missing or invalid, returns default for the given roomId.
 */
export function getSlice(roomId: string | null): PrayerRoomSessionSlice {
  const raw = getState()?.values?.[PRAYER_ROOM_SESSION_KEY];
  if (raw && typeof raw === "object" && Array.isArray(raw.studyPages)) {
    const slice = raw as PrayerRoomSessionSlice;
    return {
      ...DEFAULT_SLICE,
      ...slice,
      roomId: roomId ?? slice.roomId ?? null,
      studyPages: Array.isArray(slice.studyPages) ? slice.studyPages : [],
      annotationStrokes: Array.isArray(slice.annotationStrokes) ? slice.annotationStrokes : [],
    };
  }
  return {
    ...DEFAULT_SLICE,
    roomId,
  };
}

/**
 * Write the session slice to state. Merges with current slice when partial update.
 */
export function writeSlice(roomId: string | null, next: Partial<PrayerRoomSessionSlice> | PrayerRoomSessionSlice): void {
  const current = getSlice(roomId);
  const merged: PrayerRoomSessionSlice = {
    ...current,
    ...next,
    roomId: roomId ?? current.roomId,
  };
  dispatchState("state.update", { key: PRAYER_ROOM_SESSION_KEY, value: merged });
}

/**
 * Derive the active slide id for annotation/timeline recording.
 * Single place for "which content is active" logic — used by recordAnnotationEvent and recordSlideChange.
 */
export function deriveActiveSlideId(
  slice: PrayerRoomSessionSlice,
  hasScreenShare: boolean
): string {
  if (hasScreenShare) return "screen";
  if (slice.activeDeck?.slides?.length && slice.currentSlideIndex < slice.activeDeck.slides.length) {
    const slide = slice.activeDeck.slides[slice.currentSlideIndex];
    if (slide) return slide.id;
  }
  const withImages = slice.studyPages.filter((p) => p.imageUrl);
  if (withImages.length > 0) {
    const sessionSlide = withImages[slice.currentSessionSlideIndex];
    return sessionSlide?.id ?? "session";
  }
  return "video";
}

/**
 * Read exported replay data from state (set when recording stops).
 */
export function getReplay(roomId: string | null): PrayerRoomReplaySlice {
  const raw = getState()?.values?.[PRAYER_ROOM_REPLAY_KEY];
  if (raw && typeof raw === "object" && Array.isArray(raw.sessionTimeline) && Array.isArray(raw.annotationTimeline)) {
    return {
      roomId: roomId ?? (raw as PrayerRoomReplaySlice).roomId ?? null,
      sessionTimeline: (raw as PrayerRoomReplaySlice).sessionTimeline,
      annotationTimeline: (raw as PrayerRoomReplaySlice).annotationTimeline,
    };
  }
  return {
    roomId,
    sessionTimeline: [],
    annotationTimeline: [],
  };
}

/**
 * Write replay data to state (call when recording stops).
 */
export function setReplay(
  roomId: string | null,
  data: { sessionTimeline: SessionEvent[]; annotationTimeline: AnnotationEvent[] }
): void {
  dispatchState("state.update", {
    key: PRAYER_ROOM_REPLAY_KEY,
    value: { roomId, sessionTimeline: data.sessionTimeline, annotationTimeline: data.annotationTimeline },
  });
}
