# Engine Refactor Implementation Report

**Date:** 2025-03-15  
**Source:** [ENGINE_REFACTOR_ARCHITECTURE_REPORT.md](ENGINE_REFACTOR_ARCHITECTURE_REPORT.md) recommended refactors  
**Constraints:** UI and user experience unchanged; internal architecture only.

---

## 1. Files Modified

| File | Change |
|------|--------|
| [src/components/prayer/RecorderModule.tsx](src/components/prayer/RecorderModule.tsx) | Replaced local `formatTime` with import from `@/01_App/Christian/Prayer/utils/formatTime`. Replaced inline MediaRecorder logic with shared `createRecordingEngine()` from `room/recording-engine.ts`. |
| [src/01_App/Christian/Prayer/room/SessionReplayViewer.tsx](src/01_App/Christian/Prayer/room/SessionReplayViewer.tsx) | Removed local `getCurrentSlideIndex`, `getCurrentSessionSlide`, `getAnnotationsUpToTime`; now imports them from `./replay-derivation`. |
| [src/01_App/Christian/Prayer/PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) | Replaced with re-export from `./room/PrayerRoom`; entry point only. |
| [src/01_App/Christian/Prayer/room/PrayerRoom.tsx](src/01_App/Christian/Prayer/room/PrayerRoom.tsx) | **New.** Thin wrapper: calls `usePrayerRoomEngine(roomId, prayerBase)`, renders layout and composition only (loading, join, main room UI). |
| [src/01_App/Christian/Prayer/room/useRoomRecording.ts](src/01_App/Christian/Prayer/room/useRoomRecording.ts) | Switched from `PrayerRoomRecorder` to `createRecordingEngine()` from `./recording-engine`. Duration now from `engine.getDurationSec()`; final duration and blob set on stop. |
| [src/lib/tsx-structure/resolver/convention.ts](src/lib/tsx-structure/resolver/convention.ts) | Added `"Christian/Prayer/PrayerRoom": { structureType: "dashboard", templateId: "default", overrides: {} }` so Prayer Room participates in structure layout resolution. |
| [src/04_Presentation/components/organisms/tsx-organisms/TimelineOrganism.tsx](src/04_Presentation/components/organisms/tsx-organisms/TimelineOrganism.tsx) | Added `useTimelineConfig()` from `@/lib/tsx-structure/engines/timeline` for structure-engine alignment; data (`blocksByDate`) still from `state.values.structure`. |

---

## 2. Engines Extracted

| Engine | Location | Responsibility |
|--------|----------|----------------|
| **Replay derivation** | [src/01_App/Christian/Prayer/room/replay-derivation.ts](src/01_App/Christian/Prayer/room/replay-derivation.ts) | `getCurrentSlideIndex`, `getCurrentSessionSlide`, `getAnnotationsUpToTime` for replay sync by time. |
| **Prayer room engine** | [src/01_App/Christian/Prayer/room/PrayerRoomEngine.ts](src/01_App/Christian/Prayer/room/PrayerRoomEngine.ts) | Hook `usePrayerRoomEngine(roomId, prayerBase)`: WebRTC, recording, session slice, annotation, replay export, API (join, end, mute, token), and `PrayerRoomContextValue` for the wrapper. |
| **Recording engine** | [src/01_App/Christian/Prayer/room/recording-engine.ts](src/01_App/Christian/Prayer/room/recording-engine.ts) | `createRecordingEngine()`: `start(stream, mimeType?)`, `stop()`, `getBlob()`, `getDurationSec()`, `isRecording()`. Used by room recording and RecorderModule. |

---

## 3. Duplicated Code Removed

| Before | After |
|--------|--------|
| **formatTime** in RecorderModule (local ~5 lines) | Single import from `@/01_App/Christian/Prayer/utils/formatTime`. |
| **getCurrentSlideIndex, getCurrentSessionSlide, getAnnotationsUpToTime** in SessionReplayViewer (~40 lines) | Moved to `room/replay-derivation.ts`; SessionReplayViewer imports from there. |
| **MediaRecorder + duration + blob** in RecorderModule and (class) PrayerRoomRecorder in room | Shared `recording-engine.ts` used by `useRoomRecording` and RecorderModule. Room recording uses engine; RecorderModule uses same engine for start/stop/duration/blob. |

---

## 4. Wrappers Created

| Wrapper | Location | Role |
|---------|----------|------|
| **PrayerRoom (wrapper)** | [src/01_App/Christian/Prayer/room/PrayerRoom.tsx](src/01_App/Christian/Prayer/room/PrayerRoom.tsx) | Layout and composition only: loading state, join screen, main room (participants, content stage, controls). All behavior comes from `usePrayerRoomEngine()`. |
| **PrayerRoom (entry)** | [src/01_App/Christian/Prayer/PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) | Re-exports `PrayerRoom` and `PrayerRoomProps` from `./room/PrayerRoom` so existing imports (e.g. PrayerApp) are unchanged. |

ModeratorPanel was already a thin wrapper (PrayerRoomContext + getSlice/writeSlice); no structural change. Phase 4 verified it contains no engine logic to move.

---

## 5. Utilities Consolidated

| Utility | Location | Used by |
|---------|----------|--------|
| **Time formatting** | [src/01_App/Christian/Prayer/utils/formatTime.ts](src/01_App/Christian/Prayer/utils/formatTime.ts) | PrayerApp, PrayerRoom (engine/wrapper), ModeratorPanel, SessionReplayViewer, PrayerPlayer, RecorderModule, MomentsSection, PrayerTimerSelector, StudyPagesManager. |
| **Replay derivation** | [src/01_App/Christian/Prayer/room/replay-derivation.ts](src/01_App/Christian/Prayer/room/replay-derivation.ts) | SessionReplayViewer (and any future replay UI). |
| **Recording engine** | [src/01_App/Christian/Prayer/room/recording-engine.ts](src/01_App/Christian/Prayer/room/recording-engine.ts) | [room/useRoomRecording.ts](src/01_App/Christian/Prayer/room/useRoomRecording.ts), [components/prayer/RecorderModule.tsx](src/components/prayer/RecorderModule.tsx). |

---

## 6. Validation Checklist

- **Room join:** Unchanged; still handled in `usePrayerRoomEngine` (handleJoin, token, storage) and rendered by `room/PrayerRoom.tsx`.
- **Slides change:** Unchanged; slice and SlideViewer/SessionSlidesView behavior unchanged; engine still calls writeSlice and provides same props.
- **Annotations draw:** Unchanged; AnnotationOverlay still receives handleAnnotationChange from engine and same slice/context.
- **Recording:** Unchanged; room recording and RecorderModule now share recording-engine; same start/stop/duration/blob behavior.
- **Replay:** Unchanged; SessionReplayViewer uses replay-derivation; getReplay/setReplay and viewers unchanged.
- **Moderator panel:** Unchanged; still receives context and getSlice; no prop or behavior change.
- **Publishing/export:** Unchanged; handlePublishRecording and handleExportSession remain in engine and are passed via context.

No UI, routing, or API changes. PrayerRoomRecorder.ts remains in the repo (no longer used by useRoomRecording) for reference; recording-engine is the shared implementation.

---

## 7. Summary

- **Phase 1:** RecorderModule uses shared `formatTime`; duplicate removed.
- **Phase 2:** Replay derivation moved to `room/replay-derivation.ts`; SessionReplayViewer imports it.
- **Phase 3:** PrayerRoom split into `room/PrayerRoomEngine.ts` (hook with all logic) and `room/PrayerRoom.tsx` (wrapper); root PrayerRoom re-exports.
- **Phase 4:** ModeratorPanel confirmed thin wrapper; no code change.
- **Phase 5:** `room/recording-engine.ts` added; useRoomRecording and RecorderModule both use it.
- **Phase 6:** Convention updated with `Christian/Prayer/PrayerRoom` → dashboard.
- **Phase 7:** TimelineOrganism calls `useTimelineConfig()` for structure alignment; data still from state.
- **Phase 8:** Replay ownership and derivation verified (state in prayer-room-session.state, derivation in replay-derivation.ts, viewers unchanged).

Architecture now has: runtime engines (replay-derivation, PrayerRoomEngine hook, recording-engine), thin TSX wrappers (room/PrayerRoom, ModeratorPanel), and structure participation (PrayerRoom dashboard, TimelineOrganism using timeline config).
