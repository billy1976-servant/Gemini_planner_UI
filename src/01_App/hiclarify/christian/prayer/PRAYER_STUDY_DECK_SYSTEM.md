# Prayer Study Deck + Annotation Replay System

## Overview

Hosts can build slide decks before a session (images, scripture snapshots), annotate during the live room, and later replay or export the teaching session with slides and annotations synchronized to the recording.

---

## Files Created

| File | Purpose |
|------|---------|
| `study/StudySlide.ts` | Types: `StudySlide` (id, imageUrl, title, notes, createdAt, order), `StudyDeck` (id, title, slides[], createdAt, updatedAt). |
| `study/study-deck-store.ts` | Local persistence (localStorage). API: `createDeck`, `addSlide`, `removeSlide`, `reorderSlides`, `loadDeck`, `loadAllDecks`, `updateDeck`, `deleteDeck`. |
| `study/StudyDeckManager.tsx` | UI to create decks, add slides (file upload or image URL), reorder/remove slides, and select a deck for use in the room. |
| `room/SlideViewer.tsx` | Displays current slide from active deck; host can next/previous/jump; slide shown behind annotation overlay. |
| `room/annotation-timeline.ts` | In-memory list of `AnnotationEvent` (slideId, timestamp, type, path, color, width). `recordAnnotationEvent()`, `getAnnotationTimeline()`, `initAnnotationTimeline()`, `clearAnnotationTimeline()`. |
| `room/session-timeline.ts` | Synchronized session events: `SessionEvent` (type: "slide-change" \| "annotation", timestamp, slideId, data). `recordSlideChange()`, `recordAnnotationEvent()`, `getSessionTimeline()`, `initSessionTimeline()`. |
| `room/SessionReplayViewer.tsx` | Plays recording; re-renders slide by time (from session timeline); replays annotations up to current time. Controls: play, pause, seek (range input). |
| `room/export-session.ts` | `buildSessionManifest()`, `exportSession()`, `downloadSessionManifest()`, `downloadRecordingBlob()`. Exports JSON manifest + recording file. |

---

## Integration Points

- **PrayerRoom.tsx**
  - State: `activeDeck`, `currentSlideIndex`, `exportedSessionTimeline`, `exportedAnnotationTimeline`.
  - When recording starts: `initSessionTimeline(startSec)`, `initAnnotationTimeline(startSec)`.
  - On slide change (while recording): `recordSlideChange(slide.id, currentSlideIndex)`.
  - On annotation stroke (host): `recordAnnotationEvent({ slideId, timestampSec, type, path, color, width })` in `handleAnnotationChange`.
  - Content area: if `activeDeck` and no screen share → `SlideViewer` + `AnnotationOverlay`; if screen share → `ScreenShareView` + `AnnotationOverlay`. Annotation overlay stays on top of slide or screen share.
  - Export: `handleExportSession()` calls `exportSession(recordedBlob, activeDeck, getSessionTimeline(), getAnnotationTimeline(), recordDurationSec)` and triggers downloads.
  - Replay/export data passed to `ModeratorPanel`: `recordedBlob`, `sessionTimeline`, `annotationTimeline`, `recordDurationSec`, `onExportSession`, `canExportSession`.

- **ModeratorPanel.tsx**
  - STUDY SLIDES: “Open deck” toggles `StudyDeckManager`; when a deck is selected, Next / Previous / jump-to-slide (dropdown); deck selection via `onSelectDeck`, `activeDeck`, `currentSlideIndex`, `onNextSlide`, `onPrevSlide`, `onJumpSlide`.
  - ANNOTATION: unchanged (draw / highlight / erase, show/hide, clear).
  - Recording: “Export session (recording + JSON)” when `canExportSession`; below that, `SessionReplayViewer` when there is a recorded blob and timelines.
  - Replay uses `recordedBlob`, `sessionTimeline`, `annotationTimeline`, `activeDeck` (deck used in session).

- **StudyPagesManager.tsx**
  - Unchanged. Existing “Save page” / snapshot behavior is preserved. No removal of study page tools.

- **AnnotationOverlay.tsx**
  - Unchanged for this feature. Strokes still have optional `mode` (draw/highlight/erase). Recording is done in PrayerRoom’s `handleAnnotationChange` by pushing to `annotation-timeline`.

---

## How Slides, Annotations, and Recording Synchronize

1. **Recording start**  
   Host starts recording → `initSessionTimeline(startSec)` and `initAnnotationTimeline(startSec)` with wall-clock start time. Recording runs as today (mixed stream + optional screen share).

2. **Slide changes**  
   Host changes slide → `recordSlideChange(slideId, index)`. Event timestamp is `nowSec()` = seconds since recording start. Session timeline is used in replay to decide which slide to show at a given playback time.

3. **Annotations**  
   Host draws → on stroke complete, `handleAnnotationChange` pushes to `annotation-timeline` with `slideId` (current slide), `timestampSec: recording.recordDurationSec`, and path/type/color/width. Replay uses annotation timeline to draw strokes up to current playback time for the current slide.

4. **Replay**  
   `SessionReplayViewer` uses the recording’s `currentTime` as “seconds since start.” It:
   - Computes current slide index from `sessionTimeline` (latest `slide-change` with `event.timestamp <= currentTime`).
   - Shows that slide image and filters `annotationTimeline` to `slideId === currentSlide && event.timestamp <= currentTime`, then draws those events on a canvas. Play/pause/seek drive `currentTime`.

5. **Export**  
   `exportSession()` builds a manifest (deck, sessionTimeline, annotationTimeline, recording mime/size, duration) and downloads JSON + recording file (e.g. WebM). No ZIP in this implementation; manifest + recording are separate files.

---

## Export Format

- **Manifest (JSON)**  
  - `version: 1`  
  - `exportedAt` (ISO string)  
  - `recording`: `{ mimeType, sizeBytes }`  
  - `deck`: full `StudyDeck` or null  
  - `sessionTimeline`: array of `SessionEvent`  
  - `annotationTimeline`: array of `AnnotationEvent`  
  - `durationSec`: number  

- **Recording file**  
  - Same blob as recorded (e.g. `audio/webm` or `video/webm`). Filename pattern: `{filenameBase}-recording.webm`.

- **Usage**  
  - Replay can be implemented by loading the manifest + recording, then using the same logic as `SessionReplayViewer` (slide index from session timeline, annotations from annotation timeline by time and slideId).

---

## Backward Compatibility

- **StudyPagesManager** and existing “Save page” / snapshot tools are unchanged.
- **AnnotationOverlay** and existing draw/highlight/erase/clear behavior are unchanged.
- **PrayerRoom** routing, auth, and room logic are unchanged.
- Slide deck and replay are additive: no deck or no recording still behaves as before; when a deck is selected, `SlideViewer` is shown (with overlay on top); when screen share is on, screen share is shown with the same overlay.

---

## Data Flow Summary

```
Host selects deck → activeDeck, currentSlideIndex
Host starts recording → init session + annotation timelines
Host changes slide → recordSlideChange(slideId, index)
Host draws → recordAnnotationEvent({ slideId, timestampSec, type, path, color, width })
Host stops recording → blob + timelines available for export/replay
Export → JSON manifest + recording file
Replay → SessionReplayViewer(blob, sessionTimeline, annotationTimeline, deck) → play/pause/seek, slide + annotations by time
```
