# Prayer App — Phased Stabilization Implementation Plan

**Purpose:** Step-by-step execution plan to clean up and stabilize the Prayer app using the existing HICLARIFY architecture. No code implementation, file moves, or room-to-JSON rewrite in this document—planning only. Repo-aware and based on actual files in the project.

---

## 1. Current Pain Points

| Pain point | Location | Impact |
|------------|----------|--------|
| **Duplicate time helpers** | `formatDuration` in PrayerApp.tsx (L55), PrayerRoom.tsx (L305), ModeratorPanel.tsx (L121), MomentsSection.tsx (L19). `formatTime` in PrayerPlayer.tsx (L9), PrayerTimerSelector.tsx (L47), StudyPagesManager.tsx (L33), SessionReplayViewer.tsx (L162). | 8 call sites; inconsistent behavior if one is changed; maintenance burden. |
| **Duplicate empty-state UI** | [room/SlideViewer.tsx](src/01_App/Christian/Prayer/room/SlideViewer.tsx) (`prayer-slide-viewer-empty`) and [room/SessionSlidesView.tsx](src/01_App/Christian/Prayer/room/SessionSlidesView.tsx) (`prayer-session-slides-empty`) use identical inline styles and layout; only message and class name differ. | Drift risk; styling changes must be done twice. |
| **ModeratorPanel prop overload** | [room/ModeratorPanel.tsx](src/01_App/Christian/Prayer/room/ModeratorPanel.tsx) has 40+ props (roomId, recording, webrtc, callbacks, session-derived, export timelines). PrayerRoom passes ~30+ props at call site (L584–630). | Hard to refactor; easy to pass wrong or stale values; unclear ownership. |
| **Two timeline modules** | [room/session-timeline.ts](src/01_App/Christian/Prayer/room/session-timeline.ts) records slide changes; [room/annotation-timeline.ts](src/01_App/Christian/Prayer/room/annotation-timeline.ts) records strokes. session-timeline’s `recordAnnotationEvent` is **never called** (dead branch). Replay in SessionReplayViewer reconciles both by time. | Confusion; risk of using wrong timeline; dead code. |
| **Active-slide derivation in two places** | Live: index-based from slice in PrayerRoom + `deriveActiveSlideId` in [room/prayer-room-session.state.ts](src/01_App/Christian/Prayer/room/prayer-room-session.state.ts). Replay: time-based derivation inside [room/SessionReplayViewer.tsx](src/01_App/Christian/Prayer/room/SessionReplayViewer.tsx). | Documented and acceptable (live vs replay differ by design); ensure no third copy. |
| **PrayerApp not in HICLARIFY pipeline** | [PrayerApp.tsx](src/01_App/Christian/Prayer/PrayerApp.tsx) uses 20+ useState; no `getState`/`subscribeState`/`dispatchState`; no TSXScreenWithEnvelope; no palette-store. Rendered raw from [app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx). | Inconsistent with ContainerCreationsLanding-2, Gospel Discipleship; theme/layout not shared. |
| **Replay/export state only in PrayerRoom** | `exportedSessionTimeline` and `exportedAnnotationTimeline` are useState in PrayerRoom; set when recording stops; passed as props to ModeratorPanel → SessionReplayViewer. | Replay only available after stop; props could be replaced by state or context. |
| **Prayer-specific theme** | [prayer-theme.css](src/01_App/Christian/Prayer/prayer-theme.css) and `useTheme()` from ThemeProvider; palette-store and token resolution not used. | Theme changes require Prayer-specific CSS; no reuse of global palettes. |

---

## 2. What Is Easy to Clean Up

| Item | Effort | Files | Notes |
|------|--------|--------|------|
| **Single formatDuration / formatTime util** | Low | Add 1 util (e.g. under `src/01_App/Christian/Prayer/utils/` or `src/lib/`); replace in PrayerApp, PrayerRoom, ModeratorPanel, MomentsSection, PrayerPlayer, PrayerTimerSelector, StudyPagesManager, SessionReplayViewer. | Same signature: `(seconds: number) => string` (e.g. `m:ss`). Optional second util for “remaining” or reuse one with a flag. |
| **Shared empty-state component** | Low | Add 1 component (e.g. `room/EmptyContentState.tsx`); use in SlideViewer and SessionSlidesView with `message` and optional `className` prop. | Extract the common style object and wrapper; two call sites. |
| **Document or remove dead timeline branch** | Low | [room/session-timeline.ts](src/01_App/Christian/Prayer/room/session-timeline.ts): either remove `recordAnnotationEvent` or add a comment that annotation events are recorded only in annotation-timeline. | Prevents future misuse. |
| **Single place for “current slide” in live path** | Already done | `deriveActiveSlideId(slice, hasScreenShare)` in prayer-room-session.state.ts is the single source for recording. | Ensure all recording/annotation call sites use it; no new derivation in PrayerRoom. |

---

## 3. What Is Medium-Risk

| Item | Risk | Mitigation |
|------|------|------------|
| **Reducing ModeratorPanel props via RoomContext** | Medium | Introduce a RoomContext that provides roomId, recording state, webrtc (participants, screen share, mute, video), and export/replay data. PrayerRoom provides the context; ModeratorPanel (and optionally others) consume it. Keep callbacks (onStartRecording, onEndRoom, etc.) as props or put them in context. Test: join, record, screen share, mute, export, replay. |
| **Moving export/replay into HICLARIFY state** | Medium | Store `exportedSessionTimeline` and `exportedAnnotationTimeline` in `state.values.prayerRoomSession` (or a dedicated key like `prayerRoomReplay`) when recording stops. ModeratorPanel/SessionReplayViewer read from state. Test: stop recording, open replay, verify timeline and annotations. |
| **Wrapping Prayer in TSXScreenWithEnvelope** | Medium | Domain page currently renders `<Component slug=... basePath=... />`. To use envelope, either (a) wrap Component in TSXScreenWithEnvelope in the domain page when Component is PrayerApp, or (b) have PrayerApp render inside an envelope-like wrapper that uses getDefaultTsxEnvelopeProfile. Risk: layout/chrome change (nav, full-viewport). Test: all routes (player, library, live, room), back links, share URL. |
| **Switching Prayer to palette-store** | Medium | Replace useTheme() and prayer-theme.css vars with palette-store (getPaletteName, getPalette) and token resolution or CSS vars from palette-bridge. Risk: visual regressions. Mitigation: do after envelope; keep a fallback or feature flag. |

---

## 4. What Should Wait

| Item | Reason |
|------|--------|
| **Room as JSON-driven screen** | No “session” structure type or session-room registry nodes in repo; session engine is planned, not built. Do not attempt to drive the room from JSON until that exists. |
| **Moving WebRTC/recording into HICLARIFY state** | usePrayerRoomWebRTC and useRoomRecording are complex runtime engines; state is append-only and persisted. Moving streams/Blobs into state would be a larger redesign. Keep them in hooks/local state for now; expose via RoomContext only. |
| **PrayerApp shell state (mode, current prayer) in state.values** | Optional and lower priority. Reduces local useState but does not unblock stabilization. Do only if envelope/nav integration needs it. |
| **Non-room screens to JSON (library, moments, etc.)** | Phase 6 (optional). Do after Prayer is stable and envelope/palette are in place. |

---

## 5. Duplication Cleanup Plan

### 5.1 formatDuration / formatTime

- **Current:** 8 call sites across 8 files (see §1). All produce `m:ss` or similar.
- **Target:** One shared util, e.g. `src/01_App/Christian/Prayer/utils/formatTime.ts` (or `src/lib/formatTime.ts` if used elsewhere):
  - `formatDuration(seconds: number): string` — for “elapsed” (e.g. `0:00`, `1:23`).
  - Optionally `formatTime(seconds: number): string` as alias or same function.
- **Replace in:** PrayerApp.tsx, PrayerRoom.tsx, ModeratorPanel.tsx, MomentsSection.tsx, PrayerPlayer.tsx, PrayerTimerSelector.tsx, StudyPagesManager.tsx, SessionReplayViewer.tsx. Delete local implementations.
- **Verification:** All duration/time displays (player, recording, replay, moments, timer) unchanged visually and behaviorally.

### 5.2 Empty-state components

- **Current:** SlideViewer and SessionSlidesView each have an empty-state div with the same style object and border/background; only text and class differ.
- **Target:** Add `room/EmptyContentState.tsx` (or `EmptySlideState.tsx`) with props: `message: string`, `className?: string`. Single style source (or use a shared CSS class in prayer-theme.css).
- **Replace in:** SlideViewer (message: “No slide deck loaded…”), SessionSlidesView (message: “Save a page to see it here…”).
- **Verification:** Empty states still show correctly when no deck / no session pages; styling unchanged.

### 5.3 Active-slide logic

- **Current:** Live path uses `deriveActiveSlideId(slice, hasScreenShare)` from prayer-room-session.state.ts for recording. Replay path derives current slide by time in SessionReplayViewer. No third derivation.
- **Action:** No new consolidation. Add a short comment in PrayerRoom and SessionReplayViewer that “current slide” for live is from slice + deriveActiveSlideId; for replay it is time-based in SessionReplayViewer only.

### 5.4 Timeline logic / dead branches

- **Current:** session-timeline has `recordSlideChange` (used) and `recordAnnotationEvent` (never called). annotation-timeline has `recordAnnotationEvent` (used). Replay reads both.
- **Action:** In session-timeline.ts, remove `recordAnnotationEvent` export and implementation, or document “Annotations are recorded only in annotation-timeline; this export is unused.” Do not change annotation-timeline or SessionReplayViewer logic in this phase.
- **Verification:** Recording + replay still work; no references to session-timeline’s recordAnnotationEvent.

### 5.5 Repeated layout/styling

- **Current:** Empty states share inline styles; room join/card UI and moderator panel use similar borders and spacing (prayer-theme.css vars).
- **Action:** After shared EmptyContentState, consider one shared class or small component for “card panel” style (border-radius, border, padding) if more duplication appears. Not required for Phase 1; can be part of palette integration (Phase 5).

---

## 6. Prop Drilling Reduction Plan

### 6.1 Where large prop chains exist

| Source | Consumer | Count | Contents |
|--------|----------|--------|----------|
| PrayerRoom | ModeratorPanel | 30+ props | roomId, isOpen, onClose, roomTitle, recordingStatus, recordedBlob, recordDurationSec, participants, currentParticipantId, onStartRecording, onStopRecording, onPublishRecording, onMuteParticipant, onEndRoom, isPublishing, publishError, canScreenShare, isScreenSharing, onStartScreenShare, onStopScreenShare, onSaveStudyPage, recordingReady, screenShareReady, connectionStatus, videoEnabled, setVideoEnabled, cameraAvailable, onCopyInviteLink, onMuteAll, myMuted, onMuteSelf, onExportSession, canExportSession, sessionTimeline, annotationTimeline, hasAnnotatableContent, onAnnotateScreen. |
| PrayerRoom | SlideViewer, SessionSlidesView, AnnotationOverlay, ParticipantVideoGrid, PrayerRoomControls | Fewer each | roomId, canNavigate, or stroke/callback props. SlideViewer/SessionSlidesView already read slice via getSlice(roomId). |

### 6.2 What should move to RoomContext

- **Room identity:** roomId (already passed everywhere).
- **Room meta:** room (object), hostId, participantId, role.
- **Recording:** recordingStatus, recordedBlob, recordDurationSec, and optionally handlers: onStartRecording, onStopRecording, onPublishRecording (or keep handlers as props to avoid context instability).
- **WebRTC:** participants, currentParticipantId, screen share (isScreenSharing, onStartScreenShare, onStopScreenShare), video (videoEnabled, setVideoEnabled, cameraAvailable), mute (myMuted, onMuteSelf, onMuteAll, onMuteParticipant), connectionStatus, recordingReady, screenShareReady, error.
- **Export/replay:** exportedSessionTimeline, exportedAnnotationTimeline, canExportSession, onExportSession (or read from state if moved to HICLARIFY).
- **UI:** moderatorPanelOpen could stay in PrayerRoom (toggle is local); or expose setModeratorPanelOpen in context.

**Recommendation:** Create `PrayerRoomContext` (or `RoomContext`) in e.g. `room/PrayerRoomContext.tsx`. Provider in PrayerRoom (when participantId and role are set). Value: roomId, room, hostId, participantId, role, recording (status, blob, durationSec, start, stop, publish), webrtc (participants, screen share, video, mute, connectionStatus, recordingReady, screenShareReady, error), export/replay (timelines, canExport, onExport), and callbacks (onEndRoom, onSaveStudyPage, onAnnotateScreen). ModeratorPanel uses `useContext(PrayerRoomContext)` and drops the corresponding props; it still receives isOpen, onClose, and optionally roomTitle for the panel header. PrayerRoom passes only isOpen, onClose, roomTitle (and roomId if not in context) to ModeratorPanel.

### 6.3 What should stay as props

- **ModeratorPanel:** isOpen, onClose (panel toggle), and optionally roomTitle. roomId can stay as prop for getSlice(roomId) and writeSlice calls, or come from context.
- **SlideViewer / SessionSlidesView:** roomId, canNavigate. They already read slice from state; no change.
- **AnnotationOverlay:** strokes, onChange, editable, onClear, onUndo (or equivalent). These are slice-driven; PrayerRoom can keep passing them from slice for now.

### 6.4 What should read directly from HICLARIFY state

- **Session slice (already):** SlideViewer, SessionSlidesView, ModeratorPanel already use getSlice(roomId) and writeSlice(roomId, …) where needed. Keep this.
- **Replay/export (optional):** If exportedSessionTimeline and exportedAnnotationTimeline are moved to state.values (e.g. prayerRoomReplay or under prayerRoomSession), SessionReplayViewer (or ModeratorPanel) can read from getState() instead of receiving as props. Then RoomContext does not need to pass timelines.

---

## 7. HICLARIFY State Alignment Plan

### 7.1 What is already in prayerRoomSession

From [room/prayer-room-session.state.ts](src/01_App/Christian/Prayer/room/prayer-room-session.state.ts):

- roomId, studyPages, annotationStrokes, annotationVisible, activeDeck, currentSlideIndex, currentSessionSlideIndex.
- getSlice(roomId), writeSlice(roomId, next), deriveActiveSlideId(slice, hasScreenShare).

### 7.2 What remaining Prayer state should move into HICLARIFY state

| State | Current location | Recommendation |
|-------|------------------|----------------|
| exportedSessionTimeline, exportedAnnotationTimeline | useState in PrayerRoom | Optional: add to state.values, e.g. `prayerRoomReplay` or extend prayerRoomSession with optional `exportedSessionTimeline`, `exportedAnnotationTimeline` when recording stops. Lets ModeratorPanel/SessionReplayViewer read from state. |
| moderatorPanelOpen | useState in PrayerRoom | Can stay local (UI-only). Optionally state.values.prayerRoomSession.panelOpen for persistence. Low priority. |
| publishError, isPublishing | useState in PrayerRoom | Can stay local (ephemeral). Or state.values for cross-component visibility; low priority. |

### 7.3 What state should stay local for now

- **Room/connection:** room, participantId, role, hostId, joining, joinChoice, error, liveKitToken, liveKitUrl (PrayerRoom + sessionStorage). Connection lifecycle is transient and room-scoped; no need to put in global state.
- **WebRTC:** All state inside usePrayerRoomWebRTC (streams, tracks, participants, mute, video). Runtime engines; keep in hook.
- **Recording:** recordingStatus, recordedBlob, recordDurationSec in useRoomRecording. Blob is large and non-serializable; keep in hook; expose via context.
- **PrayerApp:** current, allPrayers, group, groups, loading, isPlaying, etc. Can stay local unless envelope/nav need them in state (Phase 4).

### 7.4 Replay/export state

- **Option A:** Keep exportedSessionTimeline and exportedAnnotationTimeline in PrayerRoom useState; pass via props or RoomContext. Simplest; no state-store change.
- **Option B:** When recording stops, write to state: e.g. `dispatchState("state.update", { key: "prayerRoomReplay", value: { roomId, sessionTimeline, annotationTimeline } })`. SessionReplayViewer reads from getState()?.values?.prayerRoomReplay. Cleans up props and aligns with “read from state” pattern. Recommended if doing Phase 3 (state alignment) fully.

---

## 8. Envelope + Palette Integration Plan

### 8.1 TSXScreenWithEnvelope

- **Current:** Domain page [app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx) loads Component via APP_MODULE_LOADERS and renders `<Component key=... slug=... basePath=... />`. Prayer gets no envelope.
- **Target:** When the loaded component is PrayerApp (or when domain+folder indicate Prayer), wrap it in TSXScreenWithEnvelope. Requires: (a) a stable screen path for Prayer (e.g. `Christian/Prayer/PrayerApp` or `tsx:Christian/Prayer/PrayerApp`), and (b) getDefaultTsxEnvelopeProfile(screenPath) returning a sensible layout (e.g. full-viewport or scroll-region). Add convention in [resolver/convention.ts](src/lib/tsx-structure/resolver/convention.ts) if needed (e.g. `Christian/Prayer/PrayerApp` → list or dashboard, default template).
- **Risk:** Envelope may add chrome (nav, layout wrapper) that changes Prayer’s current look. Mitigation: choose a minimal profile (e.g. full-viewport, no nav) for Prayer first; test all routes.

### 8.2 Layout/profile conventions

- **File:** [getDefaultTsxEnvelopeProfile.ts](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts). Add a path pattern for Prayer (e.g. `Christian/Prayer/*` or `**/Prayer/*`) with layoutMode: `full-viewport` or `scroll-region`, and nav/chrome as needed.
- **Convention:** [resolver/convention.ts](src/lib/tsx-structure/resolver/convention.ts) CO_LOCATED_MAP: add `Christian/Prayer/PrayerApp` with structureType and templateId if the envelope resolver uses it.

### 8.3 Palette-store

- **Current:** Prayer uses `useTheme()` and `palette` from ThemeProvider and prayer-theme.css.
- **Target:** Use getPaletteName() / getPalette() from [palette-store.ts](src/03_Runtime/engine/core/palette-store.ts) and apply palette to the Prayer root (e.g. via palette-bridge or by setting CSS variables from palette in Prayer’s root). Replace or map prayer-theme.css vars to palette tokens where possible.
- **Scope:** Do after envelope so the envelope root can apply palette; or apply inside PrayerApp root div. Test: switch palette (if app supports it); verify colors and contrast.

### 8.4 Token-based theme usage

- **Target:** Use resolveToken / palette tokens for primary actions, borders, backgrounds, text. Reduces hardcoded hex and Prayer-specific vars. Can be incremental: start with one screen (e.g. room join card), then expand.

---

## 9. Non-Room JSON Migration (Later)

Map non-room Prayer screens to existing structure types (from [contracts/index.ts](src/lib/tsx-structure/contracts/index.ts)):

| Screen | Structure type | Notes |
|--------|----------------|-------|
| Player (single prayer playback) | **detail** | One entity; playback controls; optional expandable sections. |
| Library (past prayers list) | **list** | List config, selection, filters; TSX for row content and data fetch. |
| Moments | **gallery** | Grid of moments; gallery layout and density from JSON. |
| Onboarding / guides | **wizard** | Step-based; same pattern as PrayerStreamOnboarding, Gospel Discipleship. |
| Platform shell (tabs: live, moments, guides, community) | **dashboard** or **list** | Dashboard if widget-style; list if single list of sections. |
| Live section (create room, 1-on-1, link) | Could stay TSX or **wizard** if it becomes a short flow. | Low priority. |

**Do not** migrate the room to JSON; no session type exists. This section is for Phase 6 (optional) only.

---

## 10. Safe Phased Execution Plan

### Phase 0: Inventory and safety checks

- **Goal:** Baseline and safety.
- **Actions:**
  - List all files that define formatDuration or formatTime (done in §1).
  - List all ModeratorPanel props and where they come from (PrayerRoom, webrtc, recording).
  - Confirm prayerRoomSession slice shape and usage (getSlice/writeSlice) in PrayerRoom, SlideViewer, SessionSlidesView, ModeratorPanel.
  - Add a short regression checklist (join, select deck, change slide, annotate, save page, record, stop, replay, publish) and run it once to document current behavior.
- **Files:** None modified; optional: add PRAYER_REGRESSION_CHECKLIST.md or a section in this plan.
- **Benefit:** Clear baseline; safe to proceed.
- **Risk:** None.
- **Test before moving on:** Checklist run; no regressions.

---

### Phase 1: Duplicate utility cleanup

- **Goal:** Single formatDuration/formatTime; shared empty-state component; timeline dead branch removed or documented.
- **Actions:**
  1. Add `src/01_App/Christian/Prayer/utils/formatTime.ts` (or `src/lib/formatTime.ts`) with `formatDuration(seconds: number): string` (and optionally `formatTime` alias). Use same m:ss logic as current implementations.
  2. Replace every in-file formatDuration/formatTime with import from util in: PrayerApp.tsx, PrayerRoom.tsx, ModeratorPanel.tsx, MomentsSection.tsx, PrayerPlayer.tsx, PrayerTimerSelector.tsx, StudyPagesManager.tsx, SessionReplayViewer.tsx.
  3. Add `room/EmptyContentState.tsx` with shared empty-state styling and `message` (+ optional className). Use in SlideViewer and SessionSlidesView.
  4. In session-timeline.ts: remove or document the unused `recordAnnotationEvent`; ensure no call sites.
- **Files affected:** New: utils/formatTime.ts, room/EmptyContentState.tsx. Modified: PrayerApp.tsx, PrayerRoom.tsx, ModeratorPanel.tsx, MomentsSection.tsx, PrayerPlayer.tsx, PrayerTimerSelector.tsx, StudyPagesManager.tsx, SessionReplayViewer.tsx, SlideViewer.tsx, SessionSlidesView.tsx, room/session-timeline.ts.
- **Benefit:** One place for time formatting and empty state; less confusion; no dead timeline API.
- **Risk:** Low (behavior should be identical).
- **Test before moving on:** All duration/time displays correct; empty states render; recording + replay still work; regression checklist.

---

### Phase 2: Prop drilling reduction

- **Goal:** Introduce RoomContext; reduce ModeratorPanel props to a small set (e.g. isOpen, onClose, roomTitle).
- **Actions:**
  1. Add `room/PrayerRoomContext.tsx`. Define context value: roomId, room, hostId, participantId, role, recording (status, blob, durationSec, start, stop, publish), webrtc (participants, screenShare, video, mute, connectionStatus, recordingReady, screenShareReady, error), export/replay (timelines, canExport, onExport), and callbacks (onEndRoom, onSaveStudyPage, onAnnotateScreen). Provide from PrayerRoom when participantId and role exist.
  2. In ModeratorPanel, use useContext(PrayerRoomContext) for all room/recording/webrtc/export data; keep isOpen, onClose, roomTitle (and roomId if not in context) as props.
  3. Remove the 30+ props from PrayerRoom’s ModeratorPanel call site that are now provided by context.
- **Files affected:** New: room/PrayerRoomContext.tsx. Modified: PrayerRoom.tsx, room/ModeratorPanel.tsx.
- **Benefit:** ModeratorPanel interface shrinks; single source for room/recording/webrtc; easier to add panel features later.
- **Risk:** Medium (context value stability; ensure callbacks don’t change identity every render).
- **Test before moving on:** Join as host; open moderator panel; record, screen share, mute, save page, annotate screen, stop, replay, publish, export; join as listener; regression checklist.

---

### Phase 3: State alignment

- **Goal:** Move export/replay data into HICLARIFY state (optional); document what stays local.
- **Actions:**
  1. Decide: keep export/replay in context (Phase 2) or move to state. If state: add key `prayerRoomReplay` (or extend prayerRoomSession) with exportedSessionTimeline, exportedAnnotationTimeline when recording stops. Write from PrayerRoom (or from recording stop handler); SessionReplayViewer (or ModeratorPanel) reads from getState()?.values?.prayerRoomReplay.
  2. If moved to state: remove from RoomContext and from ModeratorPanel props; SessionReplayViewer gets data via useSyncExternalStore + getState().
  3. Document in prayer-room-session.state.ts (or a short README) which state is in slice (session/slide/annotation), which is in values (replay if applicable), and which remains local (room/connection, webrtc, recording engine).
- **Files affected:** room/prayer-room-session.state.ts (optional new key or shape), PrayerRoom.tsx, room/ModeratorPanel.tsx, room/SessionReplayViewer.tsx, room/PrayerRoomContext.tsx (if replay removed from context).
- **Benefit:** Replay data in one place; consistent with other HICLARIFY state consumers.
- **Risk:** Medium (state shape; clearing replay when leaving room).
- **Test before moving on:** Stop recording; open replay; verify timelines and annotations; leave room and rejoin; regression checklist.

---

### Phase 4: Envelope integration

- **Goal:** Prayer rendered inside TSXScreenWithEnvelope so it gets layout and chrome from the shared pipeline.
- **Actions:**
  1. In domain page or in app routing, when the loaded app is Prayer, wrap Component in TSXScreenWithEnvelope with a stable screenPath (e.g. `Christian/Prayer/PrayerApp`).
  2. In getDefaultTsxEnvelopeProfile (and convention if needed), add Prayer path with layoutMode (e.g. full-viewport or scroll-region) and minimal nav/chrome so current behavior is preserved.
  3. Verify PrayerApp still receives slug and basePath correctly and that back links and share URL work.
- **Files affected:** app/(domain)/[domain]/[[...path]]/page.tsx (or equivalent), getDefaultTsxEnvelopeProfile.ts, possibly resolver/convention.ts.
- **Benefit:** Prayer aligned with other TSX apps; layout/chrome consistent; foundation for palette.
- **Risk:** Medium (layout or nav may change UX).
- **Test before moving on:** All routes (player, library, live, room, admin); back links; share URL; regression checklist.

---

### Phase 5: Palette integration

- **Goal:** Prayer uses palette-store and token-based theme where possible; reduce reliance on prayer-theme.css and useTheme.
- **Actions:**
  1. In Prayer root (or envelope root), use getPaletteName()/getPalette() and apply palette CSS vars (e.g. via palette-bridge or manual var set). Ensure Prayer’s root is the target of palette application when Prayer is active.
  2. Replace prayer-theme.css vars with palette tokens incrementally (e.g. --color-primary, --color-bg-primary from palette). Keep fallbacks during transition.
  3. Remove or reduce useTheme() in Prayer in favor of palette-store where it makes sense.
- **Files affected:** PrayerApp.tsx (or PrayerRoom if room is entry), prayer-theme.css, any component using useTheme for colors.
- **Benefit:** Theming consistent with rest of app; one palette system.
- **Risk:** Medium (visual regressions).
- **Test before moving on:** Visual pass on player, library, room join, room in-session, moderator panel; regression checklist.

---

### Phase 6: Optional non-room JSON migration

- **Goal:** Only if desired; migrate one or more non-room screens (library, moments, onboarding) to JSON + structure type (list, gallery, wizard) using existing patterns (renderContentBlocks, useWizardConfig, etc.).
- **Actions:** Per-screen: define JSON config or API; load in PrayerApp for that route; render via list/dashboard/gallery organism or wizard; keep room and player as TSX.
- **Files affected:** New JSON/config; PrayerApp routing and conditional render.
- **Benefit:** Reuse of structure types; less custom TSX for static flows.
- **Risk:** Medium (routing and data flow changes).
- **Test before moving on:** Each migrated screen; regression checklist.

---

### Phase 7: Regression and verification

- **Goal:** Final pass; document stable behavior.
- **Actions:**
  - Run full regression checklist: join (speaker/listener), deck selection, slide change, annotation, save page, annotate screen, record, stop, replay, publish, export; player, library, live, moments, guides, admin; share URL; palette (if applicable).
  - Update this plan or PRAYER_REGRESSION_CHECKLIST.md with any new steps.
  - Optionally: add a one-page “Prayer stabilization summary” (what was done, what remains TSX, what is in state).
- **Files affected:** Optional checklist or summary doc.
- **Benefit:** Confidence; clear handoff.
- **Risk:** None.
- **Test before moving on:** All checks pass.

---

## 11. Verification Checklist After Each Phase

Use this after every phase before proceeding:

- [ ] **Room join:** Join as speaker; join as listener; leave.
- [ ] **Deck/slides:** Select deck; change slide; no deck / empty deck shows empty state.
- [ ] **Session pages:** Save page; annotate screen; switch session slide; empty session shows empty state.
- [ ] **Annotation:** Draw; clear; undo (if present); strokes persist on session slide.
- [ ] **Recording:** Start; stop; recording duration displays; replay shows after stop.
- [ ] **Replay:** Video plays; session timeline and annotation timeline in sync with video time.
- [ ] **Publish/export:** Publish recording; export session; download works.
- [ ] **Moderator panel:** Open/close; screen share; mute participant; mute self; copy invite; end room.
- [ ] **Navigation:** Player, library, live, room, admin; back links; share URL.
- [ ] **No console errors or warnings** related to Prayer/room.

---

## 12. Complexity Reduction Estimate

| Metric | Before | After (all phases) | Notes |
|--------|--------|---------------------|------|
| **Duplicate time helpers** | 8 | 1 | Single util. |
| **Empty-state implementations** | 2 (nearly identical) | 1 shared component | Two call sites, one implementation. |
| **ModeratorPanel prop count** | 40+ | ~3–5 (isOpen, onClose, roomTitle, roomId?) | Rest from context or state. |
| **PrayerRoom → ModeratorPanel prop lines** | ~45 | ~5–10 | Smaller call site. |
| **Dead timeline API** | 1 (session-timeline recordAnnotationEvent) | 0 | Removed or documented. |
| **State in HICLARIFY** | Session/slide/annotation only | + optional replay in state | Clear ownership. |
| **Envelope/palette** | None | Envelope + palette-store | Aligned with other apps. |
| **Code size (Prayer)** | ~760 lines PrayerRoom; many in ModeratorPanel | ~10–15% fewer lines in touched files | From util + empty state + context. |
| **Inherent complexity** | WebRTC, recording, replay sync | Unchanged | Runtime engines stay; only wiring and duplication reduced. |

---

## 13. Final Recommendation

- **Should this phased cleanup start now?** **Yes.** Duplication and prop overload are real; the room is already on HICLARIFY state for session/slide/annotation; the plan is incremental and low-to-medium risk.
- **Should the room remain TSX for now?** **Yes.** Do not rewrite the room into JSON. No session structure type exists; keep the room as a TSX component and only reduce props, align state, and add envelope/palette.
- **Which phase should be done first?** **Phase 0** (inventory and safety), then **Phase 1** (duplicate utility cleanup). Phase 1 is the lowest risk and gives immediate benefit (single formatDuration/formatTime, shared empty state, no dead timeline code).
- **What would be a mistake to attempt too early?**
  - Moving the **room** to JSON or a “session” screen type before the repo has that type and registry nodes.
  - Putting **WebRTC streams or recording Blobs** into HICLARIFY state (persistence and shape are wrong for that).
  - Doing **envelope or palette** before **Phase 1 and 2** (you want a smaller, clearer Prayer surface before changing its shell).
  - **Big-bang refactor:** do not change all of Prayer in one PR; execute phase by phase with the verification checklist after each.

---

## References (repo paths)

- Prayer entry: [PrayerApp.tsx](src/01_App/Christian/Prayer/PrayerApp.tsx), [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx)
- Room state: [room/prayer-room-session.state.ts](src/01_App/Christian/Prayer/room/prayer-room-session.state.ts)
- Room UI: [room/ModeratorPanel.tsx](src/01_App/Christian/Prayer/room/ModeratorPanel.tsx), [room/SlideViewer.tsx](src/01_App/Christian/Prayer/room/SlideViewer.tsx), [room/SessionSlidesView.tsx](src/01_App/Christian/Prayer/room/SessionSlidesView.tsx)
- Timelines: [room/session-timeline.ts](src/01_App/Christian/Prayer/room/session-timeline.ts), [room/annotation-timeline.ts](src/01_App/Christian/Prayer/room/annotation-timeline.ts)
- Domain route: [app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx)
- Envelope: [TSXScreenWithEnvelope.tsx](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx), [getDefaultTsxEnvelopeProfile.ts](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts)
- Convention: [resolver/convention.ts](src/lib/tsx-structure/resolver/convention.ts)
- Palette: [palette-store.ts](src/03_Runtime/engine/core/palette-store.ts), [palettes/](src/04_Presentation/palettes/)
- Analysis: [PRAYER_FULL_HICLARIFY_REFACTOR_ANALYSIS.md](src/01_App/Christian/Prayer/PRAYER_FULL_HICLARIFY_REFACTOR_ANALYSIS.md)
