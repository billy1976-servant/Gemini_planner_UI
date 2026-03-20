# Prayer Study System Implementation Report

This document describes the upgrades made to the Prayer Live Room annotation and study page system so it works as a complete slide + annotation + replay tool while preserving existing WebRTC, recording, and room functionality.

---

## 1. What Was Added

### Annotation visibility (Part 1)
- **Visible content** is now any of: active deck, screen share, session study pages (saved pages), or participant video.
- `AnnotationOverlay` mounts whenever `hasVisibleContent` is true (and annotations are visible), not only when a deck or screen share is active.
- When only participant video is available (no deck/screen share/saved slides), a **VideoContentView** shows the hostΓÇÖs camera or first remote video so annotations can overlay it.
- When there are saved study pages but no deck/screen share, **SessionSlidesView** shows them in the main content area with navigation.

### Real study slide system (Part 2)
- **StudyPage** (in `StudyPagesManager`) now supports:
  - `imageUrl?: string` ΓÇö data URL of the captured slide/screen/video frame.
  - `annotations?: AnnotationStroke[]` ΓÇö strokes on that slide at save time (for replay).
- Existing fields (`id`, `title`, `createdAt`, `timestampSec`) are unchanged; new fields are optional for backward compatibility.
- Study pages list in the Host panel shows thumbnails when `imageUrl` is present.

### Snapshot capture (Part 3)
- **capture-content.ts**: `findCaptureSource(container)` finds the first `video` or `img` inside the content wrapper; `captureElementToDataURL(element)` draws it to a canvas and returns a PNG data URL.
- On **Save page**, the current content is captured (slide image, screen share frame, or video frame) and stored as `slide.imageUrl`. Current annotation strokes are stored as `slide.annotations`.

### Annotation toolbar (Part 4)
- Existing tools kept: **Draw**, **Highlight**, **Erase**, **Clear**.
- **TODO** in `AnnotationOverlay.tsx`: optional tools (Rectangle, Arrow, Text) are not implemented; a comment marks where to add them.
- Toolbar is shown whenever the overlay is shown and the user is host (`showToolbar={isHost}`).

### Layer stacking (Part 5)
- **Z-index**:
  - Video/slide viewer content: **1** (content wrapper).
  - Annotation canvas: **10**.
  - Annotation toolbar: **110** (above moderator backdrop so it stays clickable when panel is open).
  - Moderator backdrop: **100**, aside: **102**.
- When the host has annotations visible, the content wrapper uses **z-index 101** so the annotation overlay (and toolbar) sit above the backdrop; the panel aside remains **102** so it stays on top.

### Toolbar visibility for host (Part 6)
- Toolbar renders whenever `annotationVisible && hasVisibleContent` and the user is host. It no longer depends on deck or screen share only; it appears for session slides and participant video as well.

### Replay integration (Part 7)
- **SessionReplayViewer** accepts optional `sessionStudyPages?: StudyPage[]`. When there is no deck (or for extra slides), it picks the current ΓÇ£session slideΓÇ¥ by time (`timestampSec <= currentTimeSec`) and shows that slideΓÇÖs `imageUrl` with annotation timeline replay.
- **ReplayTimeline** still shows study page markers (timestamp + title); markers remain clickable for seek. No change to marker behavior; extended so that when published, study pages can include `imageUrl` and `annotations` for replay.
- **PrayerTypes**: `studyPages` on `Prayer` now allows optional `imageUrl` and `annotations` for API/upload compatibility.

---

## 2. Files Modified

| File | Changes |
|------|--------|
| **room/StudyPagesManager.tsx** | Extended `StudyPage` with `imageUrl?`, `annotations?`; import `AnnotationStroke`; list items show thumbnail when `imageUrl` present. |
| **room/capture-content.ts** | **New.** `findCaptureSource(container)`, `captureElementToDataURL(element)` for snapshot capture. |
| **room/SessionSlidesView.tsx** | **New.** Displays session-captured study pages (with `imageUrl`) in the same layout as SlideViewer; supports navigation. |
| **room/VideoContentView.tsx** | **New.** Single-video content area (local or first remote) when no deck/screen share/session slides. |
| **PrayerRoom.tsx** | `hasVisibleContent` (deck \|\| screenShare \|\| studyPages.length \|\| hasParticipantVideo); `contentWrapperRef`; `currentSessionSlideIndex`; content block renders ScreenShareView \|\| SlideViewer \|\| SessionSlidesView \|\| VideoContentView; `handleSaveStudyPage` captures from `contentWrapperRef` and sets `imageUrl` + `annotations`; annotation recording uses `slideId` for session/screen/video; z-index 101 when host + annotationVisible. |
| **room/AnnotationOverlay.tsx** | Canvas `zIndex: 10`, toolbar `zIndex: 110`; TODO comment for Rectangle/Arrow/Text. |
| **room/ModeratorPanel.tsx** | Aside `zIndex: 102`; `SessionReplayViewer` receives `sessionStudyPages={studyPages}`. |
| **room/SessionReplayViewer.tsx** | `sessionStudyPages?: StudyPage[]`; `getCurrentSessionSlide()`; when no deck, current slide from session study pages by time; slide label supports session slides. |
| **PrayerTypes.ts** | `studyPages` entries may include `imageUrl?` and `annotations?`. |

---

## 3. How Slide Storage Works

1. Host has visible content (deck, screen share, session slides, or participant video).
2. Host clicks **Save page** in the Host panel and optionally enters a title.
3. **handleSaveStudyPage** in `PrayerRoom.tsx`:
   - Calls `findCaptureSource(contentWrapperRef.current)` to get the current `video` or `img` in the content area.
   - If found, calls `captureElementToDataURL(source)` to get a PNG data URL.
   - Builds a **StudyPage** with `id`, `title`, `createdAt`, `timestampSec` (from recording), `imageUrl` (if capture succeeded), and `annotations: [...annotationStrokes]`.
   - Appends it to `studyPages` state.
4. Study pages are sent on **Publish** via `formData.append("studyPages", JSON.stringify(studyPages))` (existing behavior; payload now includes `imageUrl` and `annotations` when present).

---

## 4. How Annotation Replay Works

- **Live room**: Strokes are stored in `annotationStrokes` and, when the host draws, pushed to `annotation-timeline` with `slideId` (deck slide id, `"screen"`, session slide id, or `"video"`).
- **SessionReplayViewer** (after recording):
  - Uses `sessionTimeline` for deck-based slide index (unchanged).
  - Uses `sessionStudyPages` to resolve the current slide by time when there is no deck or for session-captured slides.
  - Uses `annotationTimeline` filtered by `slideId` and `timestamp <= currentTimeSec` to draw annotations on the canvas over the current slide image.
- **ReplayTimeline**: Shows one marker per study page (with `timestampSec`); click seeks. Markers and timestamp linking are unchanged; backend/replay can now use `imageUrl` and `annotations` when present.

---

## 5. Remaining TODO Items

- **AnnotationOverlay.tsx**: Optional tools **Rectangle**, **Arrow**, **Text** ΓÇö left as TODO; implement when needed.
- **Session slide change events**: When the host changes the current session slide (SessionSlidesView index), that change is not yet recorded in `session-timeline` (only deck slide changes are). Replay by time for session slides still works via `timestampSec` on each saved page; optional future improvement is to record session-slide changes in the timeline.
- **Backend**: If the prayer API persists `studyPages` JSON, ensure it accepts and returns `imageUrl` and `annotations` (and any size limits for data URLs).

---

## 6. Backward Compatibility

- Existing study pages without `imageUrl` or `annotations` still display in the list (title + timestamp).
- Replay still works with deck + session timeline + annotation timeline when no session study pages are provided.
- WebRTC, recording, and room flow (join, mute, end room, etc.) are unchanged.
- ModeratorPanel and recording system are extended only (no removals).
