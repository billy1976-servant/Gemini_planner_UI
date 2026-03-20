# Prayer App — Full HICLARIFY Refactor Analysis

**Purpose:** Repo-aware architectural analysis and implementation plan for refactoring the Prayer app into the HICLARIFY system. No implementation, file moves, or rewrites in this document—analysis and recommendation only.

---

## 1. Current Prayer Architecture Assessment

### 1.1 File structure and roles

| Area | Files | Role |
|------|--------|------|
| **Entry** | [PrayerApp.tsx](src/01_App/Christian/Prayer/PrayerApp.tsx) | Main entry: routing (player / record / live / room / admin), mode, ~20+ `useState`. Wraps in `ActiveRoomsProvider`. Renders `PrayerRoom` when slug is `room/[roomId]`. |
| **Room** | [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) | Live room: join flow, WebRTC, content stage (slide/session/video/blank), annotation overlay, moderator panel. Uses `getSlice`/`writeSlice` and many local `useState`. |
| **Room sub** | [room/ModeratorPanel.tsx](src/01_App/Christian/Prayer/room/ModeratorPanel.tsx), [room/SlideViewer.tsx](src/01_App/Christian/Prayer/room/SlideViewer.tsx), [room/SessionSlidesView.tsx](src/01_App/Christian/Prayer/room/SessionSlidesView.tsx), [room/AnnotationOverlay.tsx](src/01_App/Christian/Prayer/room/AnnotationOverlay.tsx), [room/SessionReplayViewer.tsx](src/01_App/Christian/Prayer/room/SessionReplayViewer.tsx) | Content and host UI; all consume or write session slice where applicable. |
| **State** | [room/prayer-room-session.state.ts](src/01_App/Christian/Prayer/room/prayer-room-session.state.ts) | HICLARIFY slice: `getSlice(roomId)` / `writeSlice(roomId, next)`; `state.values.prayerRoomSession`. |
| **Platform** | PrayerPlayer, PrayerShare, PrayerLibrary, PrayerUpload, LiveSection, MomentsSection, GuidedSection, CommunitySection, etc. | Player-first experience; local state only. |
| **Data** | [data/store.ts](src/01_App/Christian/Prayer/data/store.ts), [api/prayer-api.ts](src/01_App/Christian/Prayer/api/prayer-api.ts) | Server-side JSON and client API. |

### 1.2 Where state lives

| Location | Kind | What |
|----------|------|------|
| **PrayerApp.tsx** | `useState` only | current, allPrayers, group, groups, groupLoading, loading, isPlaying, prayerTextOpen, totalListeners, liveCount, presenceTotal, durationSeconds, seekToSec, **mode**, contextToolsOpen, shareUrl, adminDropdownOpen, snapshotsOpen, editingDraftId. **Does not use** `getState`/`subscribeState`/`dispatchState`. |
| **PrayerRoom.tsx** | `useState` | room, participantId, role, hostId, joining, joinChoice, error, liveKitToken, liveKitUrl, moderatorPanelOpen, publishError, isPublishing, exportedSessionTimeline, exportedAnnotationTimeline. |
| **PrayerRoom.tsx** | HICLARIFY slice | `useSyncExternalStore(subscribeState, getState, getState)`; `sessionSlice = getSlice(roomId)` — studyPages, annotationStrokes, annotationVisible, activeDeck, currentSlideIndex, currentSessionSlideIndex. |
| **PrayerRoom** | sessionStorage | `ROOM_STORAGE_KEY-${roomId}`: participantId, role, hostId. |
| **room/prayer-room-session.state.ts** | Global slice | `state.values.prayerRoomSession` (single key; roomId inside slice). |
| **room/annotation-timeline.ts** | Module singleton | In-memory `AnnotationEvent[]`; used for replay/export. |
| **room/session-timeline.ts** | Module singleton | In-memory `SessionEvent[]`; only slide-change (and init) used; `recordAnnotationEvent` here is **not** used. |
| **usePrayerRoomWebRTC.ts** | `useState` | localStream, remoteStream, mixedStream, screenShareStream, myMuted, error, liveParticipants, muteByIdentity, localVideoTrack, videoEnabled, participantVideoTracks, cameraAvailable, audioAvailable. |
| **useRoomRecording.ts** | `useState` | recordingStatus, recordedBlob, recordDurationSec. |

**Conclusion:** Session/slide/annotation UI state is already in the HICLARIFY slice and used by PrayerRoom, SlideViewer, SessionSlidesView, and ModeratorPanel. Room/connection/WebRTC/recording/export state remains local. PrayerApp does not use the central state store at all.

### 1.3 UI logic and duplication

- **formatDuration / formatTime** reimplemented in: PrayerApp.tsx, PrayerRoom.tsx, ModeratorPanel.tsx, MomentsSection.tsx, StudyPagesManager.tsx, PrayerPlayer.tsx, PrayerTimerSelector.tsx, SessionReplayViewer.tsx (6+ places).
- **Empty slide states**: SlideViewer (“No slide deck loaded”) and SessionSlidesView (“Save a page to see it here”) — same layout/styling, two components.
- **“Current slide by time”**: SessionReplayViewer rederives current slide and annotations by time; PrayerRoom uses index-based slice. Two different derivations for the same concept.
- **Two timelines**: session-timeline (slide-change only; annotation branch unused) and annotation-timeline (actual strokes). Replay uses both; coordination is easy to get wrong.

### 1.4 Custom one-off vs reusable

- **Uses HICLARIFY:** Session slice (getSlice/writeSlice/deriveActiveSlideId) in PrayerRoom and room children.
- **Does not use:** TSXScreenWithEnvelope, layout-store, palette-store (Prayer uses `useTheme()` from ThemeProvider, not `getPaletteName()`/state), screen-loader, JSON-driven screens, or any of the 8 structure types.
- **One-off:** ListenerAudio inline in PrayerRoom; join/speaker UI; content-stage branching (screen share → deck → session pages → video → blank); SessionReplayViewer (only used in ModeratorPanel); prayer-theme.css and local class names instead of palette tokens.

### 1.5 Where slide/annotation/session/room “fight”

- **Content source priority** and **activeSlideId** are re-derived in: (1) render branch, (2) handleAnnotationChange (slideId for recordAnnotationEvent), (3) recording useEffect. `deriveActiveSlideId(slice, hasScreenShare)` in the state module is the single source for recording, but the render branch and callbacks still depend on the same slice + WebRTC.
- **ModeratorPanel** receives **40+ props** (roomId, recording, participants, webrtc, callbacks, session slice–derived data, exported timelines). Session slice is read inside ModeratorPanel via getSlice(roomId), but recording/webrtc/export are all passed from PrayerRoom.
- **Exported timelines**: Set in PrayerRoom only when recording stops, then passed into ModeratorPanel → SessionReplayViewer. Replay does not see a live-updating timeline.
- **session-timeline** vs **annotation-timeline**: Replay reconciles both with video time; session-timeline’s `recordAnnotationEvent` is dead. Confusing for maintainers.

---

## 2. Existing HICLARIFY Architecture in the Repo

### 2.1 JSON screen/content system

- **Screen loader:** [src/03_Runtime/engine/core/screen-loader.ts](src/03_Runtime/engine/core/screen-loader.ts) — `loadScreen(path)`: static JSON, `tsx:` branch returns `{ __type: "tsx-screen", path }`, else fetch/import JSON.
- **Pipeline:** app/page.tsx → loadScreen → JSON: composeOfflineScreen + ExperienceRenderer → JsonRenderer → JsonSkinEngine (for json-skin nodes). TSX: TSXScreenWithEnvelope + tsx-embed.
- **Config sources:** Container Creations “dash 2” uses `GET /api/container-creations-landing-config` → [ContainerCreationsLanding-2.json](src/01_App/Business/Container_Creations/) (or -v1/-v2/-v3). Gospel Discipleship and Prayer Stream Onboarding use the same pattern with local/static config.
- **Content rule:** Single universal renderer `renderContentBlocks(screen.content, options)` for all layouts; no layout filtering by block type ([renderContentBlocks](src/lib/landing-content-blocks/renderContentBlocks.tsx)).

### 2.2 State-store / state-resolver

- **Store:** [src/03_Runtime/state/state-store.ts](src/03_Runtime/state/state-store.ts) — append-only log; `getState()`, `subscribeState(fn)`, `dispatchState(intent, payload)`; persist except `state.update`.
- **Resolver:** [src/03_Runtime/state/state-resolver.ts](src/03_Runtime/state/state-resolver.ts) — pure `deriveState(log)` → DerivedState: `currentView`, `journal`, `values`, `layoutByScreen`, `dashboardLayout`, etc.
- **Pattern:** Domain slice under one key in `values` (e.g. `structure`, `paletteName`, `prayerRoomSession`). Read via getState(); write via `dispatchState("state.update", { key, value })`. No new intent needed for Prayer session slice.

### 2.3 Layout system

- **Layout store:** [src/03_Runtime/engine/core/layout-store.ts](src/03_Runtime/engine/core/layout-store.ts) — experience, type, preset, templateId, mode, regionPolicy.
- **Layout engine:** [src/04_Presentation/lib-layout/layout-engine/](src/04_Presentation/lib-layout/layout-engine/) — region-policy, composeScreen (role → regions). State holds `layoutByScreen[screenKey]` (section/card/organ presets, navTargets); JsonRenderer reads it.
- **Usage:** TSXScreenWithEnvelope uses getDefaultTsxEnvelopeProfile(screenPath); layout overrides come from state. Prayer is not in this pipeline.

### 2.4 Palette system

- **Palettes:** [src/04_Presentation/palettes/](src/04_Presentation/palettes/) — JSON files; index exports palettes. Active palette: `state.values.paletteName`.
- **Palette store:** [src/03_Runtime/engine/core/palette-store.ts](src/03_Runtime/engine/core/palette-store.ts) — getPaletteName/getPalette/setPalette via state; subscribePalette.
- **Consumption:** resolveToken / resolveParams; JsonRenderer; TSXScreenWithEnvelope + palette-bridge apply CSS vars to envelope root. Prayer uses ThemeProvider/useTheme and prayer-theme.css, not palette-store.

### 2.5 Best target architecture (already in repo)

**ContainerCreationsLanding-2** ([src/01_App/Business/Container_Creations/ContainerCreationsLanding-2.tsx](src/01_App/Business/Container_Creations/ContainerCreationsLanding-2.tsx)) is the reference:

- Fetches config from API (JSON); single content rule: `renderContentBlocks(screen.content, options)` for every layout (hero, stamped, twoCol, etc.).
- Uses `useWizardConfig` ([src/lib/tsx-structure/engines/wizard.ts](src/lib/tsx-structure/engines/wizard.ts)); step index can live in state.
- `registerJsonScreen` for dev node editor.
- Same layout class pattern and palette/layout integration.
- Gospel Discipleship and Prayer Stream Onboarding follow the same schema and pattern.

Prayer is **not** a wizard/onboarding flow; it is player + platform + **live room**. So the “dash 2” pattern applies to Prayer only for **non-room screens** (e.g. onboarding, guided flows, or a future JSON-driven platform shell). The **room** has no direct analogue in the current JSON/structure set.

### 2.6 Session engine (planned, not built)

From [.cursor/plans/session_engine_architecture_plan_9760bcf4.plan.md](.cursor/plans/session_engine_architecture_plan_9760bcf4.plan.md):

- Sessions could be a **new structure type** (e.g. `session`) or a detail/editor variant.
- New registry node types would be needed: e.g. `session-room`, `session-moderator-panel`, `session-participant-list`, `session-timeline`.
- SessionEngine would use the same state store for “current session id”, “recording on”, “screen share on”, etc. No such engine or registry nodes exist yet.

---

## 3. Reusable Patterns / Wrapper Styles in the Repo

The repo defines **eight** structure types with contracts and engines under [src/lib/tsx-structure/](src/lib/tsx-structure/):

| # | Type | Contract | Boundary (JSON vs TSX) | Relevance to Prayer |
|---|------|----------|------------------------|----------------------|
| 1 | **list** | [contracts/list.ts](src/lib/tsx-structure/contracts/list.ts) | JSON: list config, selection, filters. TSX: list item components, data fetch. | Library / past prayers. |
| 2 | **board** | [contracts/board.ts](src/lib/tsx-structure/contracts/board.ts) | JSON: columns, cards. TSX: card components, drag/drop. | Low (no board UI). |
| 3 | **dashboard** | [contracts/dashboard.ts](src/lib/tsx-structure/contracts/dashboard.ts) | JSON: grid, widgets, resizable. TSX: widget components, layout engine. | Platform home / workspace-style layout. |
| 4 | **editor** | [contracts/editor.ts](src/lib/tsx-structure/contracts/editor.ts) | JSON: editor chrome, panels. TSX: editor content. | Study deck manager. |
| 5 | **timeline** | [contracts/timeline.ts](src/lib/tsx-structure/contracts/timeline.ts) | JSON: slotMinutes, dayStart/dayEnd, viewModes. TSX: slot/event components, data. | Replay timeline UI (session + annotation by time). |
| 6 | **detail** | [contracts/detail.ts](src/lib/tsx-structure/contracts/detail.ts) | JSON: detail layout, fields. TSX: detail content. | Prayer detail / single view. |
| 7 | **wizard** | [contracts/wizard.ts](src/lib/tsx-structure/contracts/wizard.ts) | JSON: steps, progress, navigation. TSX: step content, validation. | Onboarding, guided flows (e.g. Prayer Stream Onboarding). |
| 8 | **gallery** | [contracts/gallery.ts](src/lib/tsx-structure/contracts/gallery.ts) | JSON: gallery layout, density. TSX: tile components. | Moments / media grid. |

**Convention map** ([resolver/convention.ts](src/lib/tsx-structure/resolver/convention.ts)): CO_LOCATED_MAP registers wizard for PrayerStreamOnboarding, ContainerCreationsLanding-2, GospelDiscipleship, HiClarifyOnboarding; dashboard for WorkspaceLayout. **Prayer (PrayerApp / PrayerRoom) is not registered** — it is rendered directly via APP_MODULE_LOADERS from the domain route, with no envelope or structure type.

**There is no “live session” or “media stage” structure type.** The live room (WebRTC, content stage, annotation, moderator panel) is a custom TSX stack. The session engine plan proposes a future `session` structure type and new registry nodes but they do not exist.

**Summary:** Prayer can reuse **wizard** (onboarding), **list** (library), **timeline** (replay), **dashboard** (platform shell), **gallery** (moments) where those screens are refactored to the pipeline. The **room itself** has no reusable wrapper yet; it would require a new structure type or remain a thick TSX component.

---

## 4. Best Target Architecture for Prayer

### 4.1 What Prayer should adopt (when and where)

| Piece | Use now? | Notes |
|-------|----------|--------|
| **State slice** | Yes (done) | Session/slide/annotation already in `prayerRoomSession`; keep and extend only if needed. |
| **State store for app shell** | Yes (next) | PrayerApp could put mode, current prayer, shareUrl, etc. in `values` so nav and shell stay in sync. |
| **TSXScreenWithEnvelope** | Yes (next) | Wrap PrayerApp (or domain route) so Prayer gets layout mode, palette from state, nav slots. |
| **Palette** | Yes (next) | Switch from ThemeProvider/useTheme + prayer-theme.css to palette-store + tokens so Prayer respects global palette. |
| **Layout (state.layoutByScreen)** | Optional | If Prayer uses envelope and multiple “screens” (player, library, live, room), layout overrides can drive sections. |
| **JSON-driven screens** | Partial | Non-room screens (library, live, moments, guides) could become JSON + renderContentBlocks or list/dashboard organisms; room stays TSX until session type exists. |
| **Wizard** | Optional | For onboarding or guided flows; Prayer Stream Onboarding already uses it. |
| **List / dashboard / gallery** | Optional | For library, platform home, moments if refactored to structure types. |

### 4.2 What should not be done yet

- **Full JSON-driven room:** No “session” structure type or session-room registry nodes. Building them is a separate, large change (session engine plan). Do not try to drive the room entirely from JSON until that exists.
- **Removing PrayerRoom TSX:** The room will remain a substantial TSX component (WebRTC, content stage, annotation, moderator panel). The goal is to make it a **thinner** wrapper over state + shared layout/palette, not to replace it with JSON.

---

## 5. What Would Simplify Dramatically

| Area | Today | After full/partial migration |
|------|--------|-------------------------------|
| **PrayerApp state** | 20+ useState; no state-store | Mode, current, shareUrl, etc. in state.values; fewer useState; optional single source for nav. |
| **PrayerRoom session state** | Already in slice | Keep; optionally move exportedSessionTimeline/exportedAnnotationTimeline into slice or a single “replay” key so ModeratorPanel/SessionReplayViewer read from state. |
| **ModeratorPanel props** | 40+ | Session slice already read via getSlice(roomId). Reduce by: room/recording/webrtc in state or a RoomContext; panel only needs roomId + callbacks. Estimate: **~20–25 fewer props** if room/recording/export live in state or context. |
| **formatDuration / formatTime** | 6+ reimplementations | One shared util (e.g. `@/lib/formatDuration` or palette/time util). |
| **Empty slide states** | Two components, same layout | One reusable empty-state component or shared content. |
| **“Current slide” logic** | Room: index from slice; Replay: time → index | Keep deriveActiveSlideId; document that replay derives by time in one place (SessionReplayViewer); no new duplication. |
| **Two timelines** | session-timeline + annotation-timeline | Consolidate or clearly document: one timeline for slide changes, one for strokes; single export format. Reduces confusion. |
| **Prop drilling** | PrayerRoom → ModeratorPanel, content children | Children already use getSlice where applicable. Further reduction by moving recording/webrtc to state or context. |
| **Palette/theme** | prayer-theme.css + useTheme | Palette-store + tokens → consistent with rest of app; theming without Prayer-specific overrides. |
| **Envelope** | None | TSXScreenWithEnvelope → layout mode, nav, palette applied to root; Prayer looks like other TSX apps. |

### 5.1 Rough quantification

- **PrayerRoom.tsx:** Today ~760 lines, many branches and callbacks. After state + envelope + prop reduction: **~15–25% fewer lines** (shared util, fewer props, no duplicate formatDuration). Large further reduction would require a session structure type and JSON-driven room (not recommended now).
- **useState in PrayerRoom:** 14 local (room, connection, recording, export). After moving export/replay into slice or state: **~2–4 fewer**. WebRTC/recording could move to state later for a bigger drop.
- **ModeratorPanel:** 40+ props → **~15–20** if session slice + room/recording from state or context.
- **Consistency:** One formatDuration; one palette path; one envelope; clearer boundaries (state vs TSX).

---

## 6. Migration Risks

| Risk | Mitigation |
|------|-------------|
| **Full JSON room without session type** | Do not do it. Room stays TSX; only adopt envelope, palette, state, and prop reduction. |
| **Regressions in join/record/replay** | Phased rollout: state/envelope first; then prop reduction; then palette. Test join, slide change, annotation, save page, record, replay, publish after each phase. |
| **Palette breakage** | Prayer-theme.css and useTheme are currently the source of truth. Migrate to palette tokens incrementally; keep fallbacks or feature flag. |
| **Envelope changing layout** | getDefaultTsxEnvelopeProfile for Prayer path may need a profile (e.g. full-viewport or scroll-region). Add convention entry for Christian/Prayer/PrayerApp if needed. |
| **State key collision** | Use a single key `prayerRoomSession` (already used). Any new keys (e.g. prayerAppShell) should be namespaced (e.g. `prayerApp`). |
| **Session engine not ready** | By design. Defer full JSON room; do partial migration only. |

---

## 7. Recommended Path

**Option C: Partial migration now (state + layout + wrapper reduction first, JSON second).**

- **State:** Session/slide/annotation already in HICLARIFY slice. Extend use of state only where it clearly helps (e.g. app shell, or export/replay in slice/state).
- **Now:** Stabilize and align with the platform: envelope + palette, single formatDuration, reduce ModeratorPanel props (state or context for room/recording), consolidate or document the two timelines. Optionally move PrayerApp shell state into state.values.
- **Later:** JSON-driven non-room screens (library, live, moments) using list/dashboard/gallery where it pays off. Full JSON-driven room only when a session structure type and registry nodes exist (session engine plan).

**Not recommended now:**

- **Option A (stabilize state only):** State for the room is already integrated. “Stabilize only” would mean just fixing formatDuration and timeline confusion; that’s a subset of the partial migration and leaves envelope/palette/props untouched.
- **Option B (full migration now):** The repo does not have a session structure type or session-room components. A full migration would require building that first; too large and risky for “now.”
- **Option D:** A different path (e.g. new Prayer-only framework) is not recommended; the repo already has the pieces; the gap is the **session** pattern, not the rest of HICLARIFY.

---

## 8. Phased Implementation Plan

### Phase 0: Prep / inventory

- Document current PrayerApp and PrayerRoom state (done in this analysis).
- Add Prayer to convention or envelope profile if needed (e.g. `Christian/Prayer/PrayerApp` → structure type + templateId for envelope).
- Create a single `formatDuration` (and if needed `formatTime`) util; list all call sites and replace.
- Decision: export/replay timelines — keep in PrayerRoom state or move to slice/state.values (e.g. `prayerRoomSession.exportedSessionTimeline`). Document.

### Phase 1: Isolate state

- **Already done:** Session/slide/annotation in `prayerRoomSession` slice; PrayerRoom and room children use getSlice/writeSlice.
- **Optional:** Move `exportedSessionTimeline` / `exportedAnnotationTimeline` into slice or `state.values.prayerRoomReplay` so ModeratorPanel/SessionReplayViewer read from state (no props).
- **Optional:** Move PrayerApp shell state (mode, current prayer id, shareUrl, etc.) into `state.values.prayerApp` so nav and future JSON screens can read it. Low priority unless you add envelope in Phase 2 and need nav sync.

### Phase 2: Move to wrapper pattern (envelope + palette)

- Render Prayer via **TSXScreenWithEnvelope** (or equivalent) from the domain route so Prayer gets the same layout/palette/nav pipeline as other TSX apps. That may require registering Prayer in the TSX resolution path used by the domain page (or wrapping the loaded Component in the domain page with the envelope).
- Switch Prayer from ThemeProvider/useTheme and prayer-theme.css to **palette-store** and token resolution: set palette for Prayer route (e.g. state.values.paletteName or profile); replace CSS variables with palette tokens where possible.
- Add **getDefaultTsxEnvelopeProfile** entry or convention for Prayer (e.g. full-viewport, scroll-region) so layout and chrome are correct.

### Phase 3: Reduce props and duplicate logic

- **ModeratorPanel:** Have it read session slice only from getSlice(roomId) (already does). Introduce a **RoomContext** or state keys for room meta, recording status, webrtc (participants, screen share, mute), and export/replay so that ModeratorPanel does not receive 40+ props from PrayerRoom. PrayerRoom provides context or dispatches to state; ModeratorPanel subscribes.
- **Single formatDuration:** Implement and replace all 6+ usages.
- **Empty slide state:** Single component or shared content for “no deck” / “no session pages” to avoid duplication.
- **Timelines:** Either merge session-timeline and annotation-timeline into one module with clear events, or document the split and remove dead `recordAnnotationEvent` from session-timeline to avoid confusion.

### Phase 4: Palette / layout integration

- Ensure Prayer uses only palette tokens and layout engine classes where applicable (e.g. section, card presets) so that theme and layout changes apply consistently.
- No need to move room layout to JSON yet; keep room as TSX with palette and shared layout primitives.

### Phase 5: Optional — screen/content into JSON (non-room only)

- If desired: Define JSON config (or API) for library, live, moments, guides and render via list/dashboard/gallery organisms or renderContentBlocks where the pattern fits (e.g. wizard for onboarding). PrayerApp would load screen from state or route and render JSON-driven screens for those sections; room remains TSX.
- Do **not** attempt to drive the room from JSON until session structure type and registry nodes exist.

### Phase 6: Verification / regression checklist

- Join room (speaker / listener).
- Select deck; change slide; draw annotation; save page; annotate screen.
- Start/stop recording; publish recording; export session.
- Replay: video + session timeline + annotation timeline in sync.
- Navigation: player, library, live, room, admin; share URL; theme/palette switch.
- No regressions in existing behavior; envelope and palette do not break layout or theming.

---

## 9. Expected Simplification (summary)

- **PrayerRoom:** ~15–25% fewer lines with shared util and fewer props; complexity drops further if room/recording move to state/context.
- **Prop drilling:** ~20–25 fewer props to ModeratorPanel with state or RoomContext.
- **useState:** 2–4 fewer in PrayerRoom if export/replay (and optionally more) move to state; PrayerApp can reduce useState if shell state moves to state.values.
- **Duplication:** One formatDuration; one empty-state pattern; clear single place for “current slide” (slice + deriveActiveSlideId) and for replay (time-based in SessionReplayViewer only).
- **Consistency:** Same envelope, palette, and layout pipeline as other apps; easier to maintain and to duplicate patterns for teaching, business training, church onboarding, safety training, and other session-driven apps **once the session structure type exists**. Until then, Prayer stays the reference implementation for “thick TSX room + HICLARIFY state slice.”

---

## 10. Duplication to Other Session-Driven Apps

If Prayer is migrated to the partial HICLARIFY path above:

- **Easier to maintain:** Yes — one state pattern, one palette, one envelope, less duplication and clearer boundaries.
- **Easier to duplicate for prayer/teaching, business training, church onboarding, safety training:** Partially. The **platform shell** (player, library, live, sections) and **onboarding** can be duplicated via JSON + wizard/list/dashboard. The **live room** (WebRTC, content stage, annotation, moderator panel) does not yet have a reusable JSON/structure type; it would need the session engine and new registry nodes. So: duplicate the **shell and flows** easily; duplicate the **room** by copying and adapting Prayer’s TSX until a session pattern exists.

---

## 11. Final Decision

| Question | Answer |
|----------|--------|
| **Refactor fully now?** | **No.** The session structure type and session-room components do not exist. Full migration would require building them first. |
| **Stabilize only (state) and wait?** | **No.** State for the room is already in place. Waiting only defers envelope, palette, and prop reduction without addressing them. |
| **Partial refactor now?** | **Yes.** State is done. Next: envelope + palette, single formatDuration, reduce ModeratorPanel props (state or context), consolidate or document timelines. Defer full JSON-driven room to when the session engine exists. |

**Final recommendation: partial migration now (Option C).** Do not move files or rewrite the app in one go. Execute Phases 0 → 1 → 2 → 3 → 4 in order; add Phase 5 only if you want JSON-driven non-room screens. Phase 6 verification after each phase. Do not attempt a full JSON room until the repo has a session structure type and the session engine plan is implemented.

---

## References (repo paths)

- State: [src/03_Runtime/state/state-store.ts](src/03_Runtime/state/state-store.ts), [state-resolver.ts](src/03_Runtime/state/state-resolver.ts)
- Prayer slice: [room/prayer-room-session.state.ts](src/01_App/Christian/Prayer/room/prayer-room-session.state.ts)
- Envelope: [TSXScreenWithEnvelope.tsx](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx), [getDefaultTsxEnvelopeProfile.ts](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts)
- Convention: [resolver/convention.ts](src/lib/tsx-structure/resolver/convention.ts)
- Target app: [ContainerCreationsLanding-2.tsx](src/01_App/Business/Container_Creations/ContainerCreationsLanding-2.tsx)
- Content blocks: [renderContentBlocks](src/lib/landing-content-blocks/renderContentBlocks.tsx)
- Session plan: [.cursor/plans/session_engine_architecture_plan_9760bcf4.plan.md](.cursor/plans/session_engine_architecture_plan_9760bcf4.plan.md)
- State integration (Prayer): [PRAYER_HICLARIFY_STATE_INTEGRATION_ANALYSIS.md](src/01_App/Christian/Prayer/PRAYER_HICLARIFY_STATE_INTEGRATION_ANALYSIS.md)
