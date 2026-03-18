---
name: Prayer annotation audit report
overview: Audit the Prayer Live Room annotation and study page system to determine why annotation tools are not visible/clickable, trace state and mounting, verify toolbar and handlers, check overlay blocking and layer order, and document the study page flow—then produce PRAYER_ANNOTATION_SYSTEM_AUDIT.md (read-only; no logic changes).
todos: []
isProject: false
---

# Prayer Live Room Annotation & Study Page System Audit

## Summary of findings

- **Annotation state**: `annotationVisible` and `annotationStrokes` live in [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx). `AnnotationOverlay` is only mounted when **both** `annotationVisible` is true **and** there is content to annotate: `(activeDeck || webrtc.screenShareStream)`.
- **Root cause of "tools not visible"**: The overlay (and thus the Draw/Highlight/Erase/Clear toolbar) is **only rendered when a slide deck is loaded or screen share is active**. If the host has not selected a deck (Study slides → Open deck) or started screen share, the content block `{(activeDeck || webrtc.screenShareStream) && ( ... AnnotationOverlay ... )}` never renders, so the toolbar never appears. The ModeratorPanel still shows "Hide annotations" and "Clear annotations" because those props are passed whenever the host has the panel open.
- **Toolbar**: Exists inside [AnnotationOverlay.tsx](src/01_App/Christian/Prayer/room/AnnotationOverlay.tsx) (Draw, Highlight, Erase, Clear). It is shown only when `showToolbar && editable`; [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) passes `showToolbar={isHost}` and `editable={isHost}`. No separate "shapes" or "text" annotation tools exist in the codebase.
- **Click handlers**: ModeratorPanel "Hide annotations", "Clear annotations", and StudyPagesManager "Save page" are wired. AnnotationOverlay toolbar buttons (mode + Clear) have `onClick` handlers. When the panel is open, its fixed backdrop (z-index 100) covers the main area, so the overlay toolbar is not clickable until the panel is closed.
- **Layer order**: Toolbar has `zIndex: 2`, canvas has no z-index; toolbar is the first child in the fragment, canvas the second. Stacking is correct (toolbar on top). Making the canvas explicitly `z-index: 0` would make intent clearer.
- **Study page / Save page**: "Save page" does **not** capture a screenshot or slide image. It only appends a metadata entry (id, title, createdAt, `timestampSec`) to `studyPages` in [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) (`handleSaveStudyPage`). Saved pages are sent with publish as JSON and shown in the panel list and in [ReplayTimeline.tsx](src/01_App/Christian/Prayer/ReplayTimeline.tsx) as seek markers; no slide/screenshot is stored or displayed.

---

## 1. Annotation state trace


| Item                          | Location                                                                                                                                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **State defined**             | [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx): `annotationStrokes` (line 104), `annotationVisible` (line 274).                                                                                                                                     |
| **Toggled**                   | `annotationVisible`: only in ModeratorPanel via `onAnnotationVisibleChange(!annotationVisible)` (ModeratorPanel line 566). `annotationStrokes`: cleared via `setAnnotationStrokes([])` from panel "Clear annotations" and from overlay "Clear" button.            |
| **AnnotationOverlay mounted** | PrayerRoom lines 596–621: inside `{(activeDeck || webrtc.screenShareStream) && ( <div> ... {annotationVisible && ( <AnnotationOverlay ... /> )} </div> )}`. So overlay exists only when (1) there is a deck or screen share, and (2) `annotationVisible` is true. |


**Conclusion**: Annotation overlay is **conditional on having content** (deck or screen share). Without that, the UI can show "Hide annotations" / "Clear annotations" but there is no overlay and no toolbar.

---

## 2. Toolbar component

- **Exists**: Yes. [AnnotationOverlay.tsx](src/01_App/Christian/Prayer/room/AnnotationOverlay.tsx) lines 152–205: toolbar with Draw, Highlight, Erase, and (when `onClear` provided) Clear.
- **Visibility condition**: Rendered only when `showToolbar && editable`. PrayerRoom passes `showToolbar={isHost}` and `editable={isHost}`, so only the host sees the toolbar, and only when the overlay is mounted (deck or screen share).
- **Shapes / text**: Not implemented. Only modes are `draw`, `highlight`, `erase` ([AnnotationOverlay.tsx](src/01_App/Christian/Prayer/room/AnnotationOverlay.tsx) line 17). No shape or text tool components in `src/01_App/Christian/Prayer/`**.

**Conclusion**: The UI toggle ("Hide annotations") exists in the panel even when no overlay exists. The actual annotation toolbar exists but only when there is a deck or screen share and the user is host.

---

## 3. Click handler check


| Control               | Wired?       | Notes                                                                                                                                                                    |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hide annotations**  | Yes          | ModeratorPanel: `onClick={() => onAnnotationVisibleChange(!annotationVisible)}` (line 566).                                                                              |
| **Clear annotations** | Yes          | ModeratorPanel: `onClick={onClearAnnotations}`; PrayerRoom passes `onClearAnnotations={() => setAnnotationStrokes([])}`. Overlay Clear: `onClick={onClear}` same effect. |
| **Save page**         | Yes          | StudyPagesManager: `onClick={handleSave}` calls `onSavePage(trimmed || "Study page")`; PrayerRoom passes `onSaveStudyPage={handleSaveStudyPage}`.                        |
| **Study page (list)** | Display only | Study pages list in panel and ReplayTimeline; no "open study page" click that loads a slide/screenshot (none is stored).                                                 |


**Overlay blocking**: When ModeratorPanel is open, the backdrop is `position: fixed; inset: 0; z-index: 100` with `onClick={onClose}`. Main content (including overlay and toolbar) is behind it, so overlay tools are not clickable until the panel is closed. This is expected modal behavior.

---

## 4. Overlay blocking and CSS

- **AnnotationOverlay**: Toolbar has `pointerEvents: "auto"`, canvas has `pointerEvents: editable ? "auto" : "none"`. No full-screen layer in AnnotationOverlay that would block the sidebar; the panel is a separate fixed layer.
- **ModeratorPanel**: Backdrop (z-index 100) and aside (z-index 101). Closing the panel is required to interact with the annotation overlay.
- **Recommendation**: Give the annotation canvas an explicit `zIndex: 0` so the toolbar (z-index 2) is clearly above it and stacking is robust.

---

## 5. Video / canvas layer order

Rendering order in PrayerRoom (lines 596–621):

1. Wrapper: `position: "relative"`.
2. Slide or screen share: `ScreenShareView` or `SlideViewer`.
3. If `annotationVisible`: fragment from AnnotationOverlay:
  - Toolbar div: `position: absolute; top/left/right; zIndex: 2`.
  - Canvas: `position: absolute; inset: 0`; no z-index.

So: **Slide/video → annotation canvas (same container) → toolbar**. Toolbar is above the canvas. Correct.

---

## 6. Study page system

- **Save page**: [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) `handleSaveStudyPage` (391–401) creates `{ id, title, createdAt, timestampSec }` and pushes to `studyPages`. No screenshot, no slide image, no canvas capture.
- **Publish**: On publish, `studyPages` is sent as JSON in form data (lines 371–372). No image upload for study pages.
- **Access/display**: Study pages appear as a list in ModeratorPanel (StudyPagesManager) and as seek markers in [ReplayTimeline.tsx](src/01_App/Christian/Prayer/ReplayTimeline.tsx) when `prayer.studyPages` and duration exist. ReplayTimeline does not display a slide or screenshot for a "study page"; it only shows a marker and seek.

**Conclusion**: "Save page" is a bookmark (title + timestamp), not a saved slide or screenshot. Saved "pages" are not displayed as content elsewhere; they are metadata and replay markers.

---

## 7. Deliverable

A single markdown file will be produced:

**File**: `PRAYER_ANNOTATION_SYSTEM_AUDIT.md`  
**Location**: `src/01_App/Christian/Prayer/` (or repo root if you prefer).

**Contents** (as in this plan):

- Where annotation state is defined and toggled.
- Where AnnotationOverlay is mounted and under what conditions.
- That the toolbar exists (Draw/Highlight/Erase/Clear) but only when deck or screen share is active and user is host.
- That shapes and text tools do not exist.
- Why annotation tools can appear "not visible": overlay (and toolbar) not rendered without deck or screen share; panel open so overlay is behind backdrop.
- Click handler verification for Hide/Clear/Save page and study page list.
- Overlay and z-index behavior; recommendation to set canvas `z-index: 0`.
- Layer order (slide → canvas → toolbar).
- Study page: metadata-only, no screenshot/slide capture; how they're used on publish and in ReplayTimeline.
- Summary of placeholders vs implemented: panel labels and Clear/Hide are implemented; overlay and toolbar are implemented but gated on content; shapes/text not implemented; "Save page" is metadata-only.

No code or logic will be changed; this is audit and report only.