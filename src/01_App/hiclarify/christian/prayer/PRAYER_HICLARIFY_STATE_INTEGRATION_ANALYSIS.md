# Prayer App ΓÇö HICLARIFY State Integration Analysis

## Purpose

This document analyzes how the Prayer Live Room should adopt the **existing HICLARIFY-style state system** already used elsewhere in the repo, rather than introducing a Prayer-only store. It identifies the real state architecture in the codebase, maps PrayerΓÇÖs current state to it, and proposes the smallest safe integration so slide/annotation/session workflow stabilizes without a full refactor.

---

## 1. Existing HICLARIFY State Architecture in the Repo

### 1.1 Core state store and resolver

| Piece | Location | Role |
|-------|----------|------|
| **State store** | [src/03_Runtime/state/state-store.ts](src/03_Runtime/state/state-store.ts) | Append-only event log; `dispatchState(intent, payload)`; `getState()`; `subscribeState(fn)`. Persists log to localStorage (except `state.update`). Rehydrates on boot. |
| **State resolver** | [src/03_Runtime/state/state-resolver.ts](src/03_Runtime/state/state-resolver.ts) | Pure `deriveState(log)` ΓåÆ `DerivedState`. Single source of truth for derived snapshot. |
| **State intents** | [src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md](src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md) | Contract: all mutations use documented intents; new intents require a branch in state-resolver and an entry here. |

Consumers import from **`@/state/state-store`** (path alias to the state module).

### 1.2 Derived state shape

From [state-resolver.ts](src/03_Runtime/state/state-resolver.ts):

- **currentView** ΓÇö active screen/path (e.g. `state:currentView`).
- **values** ΓÇö `Record<string, any>`. Generic key/value surface used for domain slices (planner structure, palette, list confirm id, etc.).
- **layoutByScreen** ΓÇö section/card/organ overrides and nav targets per screen.
- **dashboardLayout** ΓÇö widget rects per screen (dedicated intents `dashboard.layout` / `dashboard.updateWidget`).
- **journal**, **scans**, **interactions** ΓÇö append-only / domain-specific.

No change to the resolver is required to add Prayer: **`state.update`** already supports any key in `values`.

### 1.3 Patterns already used for ΓÇ£state separate from TSXΓÇ¥

**A. Domain slice under a single key (structure.actions)**

- [src/05_Logic/logic/actions/structure.actions.ts](src/05_Logic/logic/actions/structure.actions.ts): `STRUCTURE_KEY = "structure"`.
- **getSlice()**: `getState()?.values?.[STRUCTURE_KEY]` ΓåÆ full slice (items, tree, calendarView, selectedDate, parserStaging, etc.).
- **writeSlice(next)**: `dispatchState("state.update", { key: STRUCTURE_KEY, value: next })`.
- All structure mutations go through actions that read slice ΓåÆ mutate ΓåÆ write slice. UI and other domains do not duplicate this state.

**B. Thin wrapper that reads/writes state (palette-store)**

- [src/03_Runtime/engine/core/palette-store.ts](src/03_Runtime/engine/core/palette-store.ts): Single source of truth is `state.values.paletteName`.
- `setPalette(name)` ΓåÆ `dispatchState("state.update", { key: "paletteName", value: next })`.
- `getPaletteName()` ΓåÆ `getState()?.values?.paletteName ?? "default"`.
- Subscribes to state so renderer stays in sync: `subscribeState(notifyListeners)`.

**C. TSX organisms as thin consumers**

- [src/04_Presentation/components/organisms/tsx-organisms/ListOrganism.tsx](src/04_Presentation/components/organisms/tsx-organisms/ListOrganism.tsx): `const state = useSyncExternalStore(subscribeState, getState, getState)`; reads `state?.values?.structure`, `state?.values?.listConfirmDeleteId`.
- No local useState for that data; UI is a thin wrapper over state.

**D. Dashboard: dedicated intents for structured data**

- [src/05_Logic/logic/actions/dashboard.actions.ts](src/05_Logic/logic/actions/dashboard.actions.ts): Uses `dashboard.layout` and `dashboard.updateWidget`; state-resolver has dedicated branches; shape lives in `derived.dashboardLayout[screenKey]`.
- Shows that for more complex shapes the repo can add a new intent + resolver branch; for Prayer, a single key in `values` is enough.

### 1.4 Session engine architecture (planned)

From [.cursor/plans/session_engine_architecture_plan_9760bcf4.plan.md](.cursor/plans/session_engine_architecture_plan_9760bcf4.plan.md):

- ΓÇ£SessionEngine can use the **same store** for ΓÇÿcurrent session idΓÇÖ, ΓÇÿrecording onΓÇÖ, ΓÇÿscreen share onΓÇÖ, etc., so JSON and TSX screens stay in sync.ΓÇ¥
- ΓÇ£Domain-specific session data ΓÇª can remain in a dedicated store (or API) and be **referenced by state keys** (e.g. `state.values.sessionId`).ΓÇ¥

So the intended pattern is: **session/slide/annotation UI state in the central state store** (e.g. under `state.values`), not a separate Prayer-only store.

### 1.5 Summary: HICLARIFY state pattern

- **Separated state**: State lives in state-store; UI reads via `getState()` / `useSyncExternalStore(subscribeState, getState, getState)` and writes via `dispatchState(...)`.
- **Thin wrappers**: Components do not hold duplicate domain state; they subscribe and render from state (and optionally dispatch actions).
- **Centralized current entity / active item**: Stored in `state.values` under a domain key (e.g. `structure`, `paletteName`). One slice per domain (or per screen/key) avoids duplicated derived state across components.
- **No new store per app**: New domains use either `state.update` with a namespaced key or a new intent + resolver branch if the shape justifies it.

---

## 2. How This Differs From Current Prayer App

### 2.1 Prayer does not use the central state system

- **No imports** of `getState`, `dispatchState`, or `subscribeState` from `@/state/state-store` anywhere under [src/01_App/Christian/Prayer](src/01_App/Christian/Prayer).
- All live-room UI state is **local React state** in [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) and **props** passed down (ModeratorPanel, SlideViewer, SessionSlidesView, AnnotationOverlay).

### 2.2 Current Prayer state (all in PrayerRoom)

| State | Current location | Passed as |
|-------|------------------|-----------|
| studyPages | useState | props to ModeratorPanel, SessionSlidesView, handleSaveStudyPage, handleAnnotateScreen, publish |
| annotationStrokes | useState | props to AnnotationOverlay, handleAnnotationChange, handleSaveStudyPage, handleAnnotateScreen, onClear/onUndo |
| annotationVisible | useState | props to ModeratorPanel, content wrapper visibility, AnnotationOverlay mount |
| activeDeck | useState | props to ModeratorPanel, SlideViewer, handleAnnotationChange, recording useEffect |
| currentSlideIndex | useState | props to ModeratorPanel, SlideViewer, handleAnnotationChange, recording useEffect |
| currentSessionSlideIndex | useState | props to SessionSlidesView, handleSaveStudyPage/handleAnnotateScreen (set inside setStudyPages callback), handleAnnotationChange |
| exportedSessionTimeline / exportedAnnotationTimeline | useState | props to ModeratorPanel (after recording stopped) |
| moderatorPanelOpen, publishError, isPublishing | useState | ModeratorPanel only |

Room/connection state (room, participantId, role, hostId, liveKitToken, etc.) and WebRTC/recording (usePrayerRoomWebRTC, useRoomRecording) remain in PrayerRoom; they are not in scope for this ΓÇ£state layer onlyΓÇ¥ integration.

### 2.3 Duplication and ΓÇ£fightingΓÇ¥ today

- **Active slide / content source** is not a single concept. It is re-derived in:
  1. Render branch (which of ScreenShareView / SlideViewer / SessionSlidesView / VideoContentView / blank is shown),
  2. `handleAnnotationChange` (slideId for `recordAnnotationEvent`: same if/else on activeDeck, currentSlideIndex, screenShareStream, studyPages, currentSessionSlideIndex),
  3. Recording useEffect (slide change only for deck; session-slide index changes are not recorded in session-timeline).
- **Annotation recording** depends on that same if/else; a brief state update ordering (e.g. setStudyPages then setCurrentSessionSlideIndex) can make slideId wrong for a stroke.
- **Session-slide index** is adjusted in a useEffect when `currentSessionSlideIndex >= sessionSlidesWithImages.length` and is also set inside a `setStudyPages` callback to avoid stale closure ΓÇö two different patterns for one concept.
- **ModeratorPanel** receives ~40+ props, many of which are simple pass-throughs of the above state and setters.

---

## 3. Mapping Prayer Problem Areas to HICLARIFY State

| Prayer problem area | HICLARIFY analogue | Suggested state location |
|---------------------|--------------------|---------------------------|
| **Active slide** (which content + index) | ΓÇ£Current entityΓÇ¥ / active item | Single derived value from slice: e.g. `contentSource` + `currentSlideIndex` + `currentSessionSlideIndex` in one slice |
| **Session slides** (studyPages) | Domain list (like structure.items) | `state.values.prayerRoomSession.studyPages` (or single key `prayerRoomSession` holding full slice) |
| **Annotation strokes** | Domain list | `state.values.prayerRoomSession.annotationStrokes` |
| **Annotation visibility** | UI toggle (like paletteName) | `state.values.prayerRoomSession.annotationVisible` |
| **Capture/snapshot result** | Effect of action (append to studyPages) | Same slice: new study page pushed to `studyPages` via dispatch |
| **Active content source** | Enum: screenShare \| deck \| session \| video \| blank | `state.values.prayerRoomSession.contentSource` (or derived from activeDeck/screenShare/studyPages) |
| **Current deck/session indices** | Indices into current source | `state.values.prayerRoomSession.currentSlideIndex`, `currentSessionSlideIndex` |
| **Active deck** | Reference (id or null) | `state.values.prayerRoomSession.activeDeck` (or `activeDeckId` + deck loaded separately) |

Recommended: **one slice key**, e.g. **`prayerRoomSession`** (or `prayer_session`), scoped by `roomId` inside the slice so one tab = one room. Shape:

```ts
// Conceptual; type lives in Prayer app
interface PrayerRoomSessionSlice {
  roomId: string | null;           // scope
  contentSource: 'screenShare' | 'deck' | 'session' | 'video' | 'blank';
  activeDeck: StudyDeck | null;    // or activeDeckId and load elsewhere
  currentSlideIndex: number;
  currentSessionSlideIndex: number;
  studyPages: StudyPage[];
  annotationStrokes: AnnotationStroke[];
  annotationVisible: boolean;
  // optional: annotationMode, lastCaptureId
}
```

All reads/writes go through **getSlice(roomId)** / **writeSlice(roomId, next)** using `state.update` and a single key (e.g. `prayerRoomSession` or keyed per room if multiple rooms in one app instance).

---

## 4. Smallest Safe Integration (State Portion Only)

### 4.1 Reuse existing pieces ΓÇö no new architecture

- **State store / resolver**: Use as-is. No new intent required; use **`state.update`** with key `prayerRoomSession` (or a key per roomId).
- **Pattern to copy**: [structure.actions.ts](src/05_Logic/logic/actions/structure.actions.ts) (getSlice / writeSlice, one key in `values`).
- **Subscription**: Same as [ListOrganism](src/04_Presentation/components/organisms/tsx-organisms/ListOrganism.tsx) and [palette-store](src/03_Runtime/engine/core/palette-store.ts): `useSyncExternalStore(subscribeState, getState, getState)` in PrayerRoom (and optionally in children that need the slice).

### 4.2 Minimal integration steps

1. **Add a Prayer-room session module** (e.g. `src/01_App/Christian/Prayer/room/prayer-room-session.state.ts` or next to PrayerRoom):
   - **getSlice(roomId: string | null)**: read `getState()?.values?.prayerRoomSession`; if scoped by roomId, return slice for that room or default.
   - **writeSlice(roomId, next)**: `dispatchState("state.update", { key: "prayerRoomSession", value: next })` (or keyed by roomId if you store multiple rooms).
   - Define `PrayerRoomSessionSlice` and default/empty slice.

2. **PrayerRoom**:
   - Subscribe: `const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);`
   - Derive slice: `const sessionSlice = getSlice(roomId)` (or from stateSnapshot.values.prayerRoomSession).
   - Replace the relevant `useState` (studyPages, annotationStrokes, annotationVisible, activeDeck, currentSlideIndex, currentSessionSlideIndex) with reads from the slice.
   - Replace setters with `writeSlice(roomId, { ...sessionSlice, ...updates })` (or helper setters that call writeSlice).
   - Keep room/connection/WebRTC/recording state in PrayerRoom as today.

3. **Children (ModeratorPanel, SlideViewer, SessionSlidesView, AnnotationOverlay)**:
   - Option A: Keep passing props from PrayerRoom, but PrayerRoom gets those props from the slice (so single source of truth is state).
   - Option B: Have them subscribe to state and read the slice themselves (fewer props, more consistent with ListOrganism).

4. **Active slideId for recording**:
   - Derive **once** from the slice (contentSource + activeDeck + currentSlideIndex + studyPages + currentSessionSlideIndex) in PrayerRoom or in the session state module, and use that when calling `recordAnnotationEvent` and in the recording useEffect. No duplicated if/else in multiple callbacks.

5. **Session/annotation timeline modules** (session-timeline.ts, annotation-timeline.ts):
   - No change. They stay module-level; PrayerRoom (or the slice writer) still calls `recordSlideChange` / `recordAnnotationEvent` with the correct slideId derived from the slice.

### 4.3 What stays out of scope (no big refactor)

- Room/connection/LiveKit state and usePrayerRoomWebRTC / useRoomRecording.
- Moving Prayer into the JSON-driven screen loader or tsx-embed pipeline.
- New intents or state-resolver branches (unless you later add e.g. `prayer.session` for partial updates).
- Changing file layout or moving Prayer to a different app shell.

---

## 5. Expected Simplification

| Area | Before | After (with state slice) |
|------|--------|---------------------------|
| **Props** | ModeratorPanel receives 40+ props; many are session/slide/annotation state and setters | Can drop ~15+ props if children read from state; or same props but sourced from one slice (no duplication) |
| **useState in PrayerRoom** | ~12+ useState for session/slide/annotation | Replaced by one subscription + getSlice(); 0 useState for that domain |
| **Duplicated if/else** | activeSlide/slideId derived in render branch, handleAnnotationChange, recording useEffect | Derived once (in getSlice or a selector) and reused for annotation recording and slide-change recording |
| **Race conditions** | setCurrentSessionSlideIndex inside setStudyPages callback to avoid stale closure | Single writeSlice({ studyPages: next, currentSessionSlideIndex: next.length - 1 }); no callback ordering issues |
| **Active-slide logic** | Scattered across three places | One place: slice or small helper from slice |
| **Annotation sync** | handleAnnotationChange depends on many useState deps; slideId can lag | slideId from slice; one source of truth for ΓÇ£current slideΓÇ¥ when recording a stroke |

Rough quantification:

- **Fewer props**: ~15ΓÇô20 fewer if ModeratorPanel and content components read from state.
- **Fewer useState**: 6ΓÇô8 removed from PrayerRoom (studyPages, annotationStrokes, annotationVisible, activeDeck, currentSlideIndex, currentSessionSlideIndex; optionally exported timelines if you move them).
- **Fewer duplicated branches**: The ΓÇ£which content / what slideIdΓÇ¥ logic goes from 3 to 1.
- **Fewer race-prone patterns**: No setState-in-callback for index sync; one write for ΓÇ£new session slide + switch to itΓÇ¥.

---

## 6. Recommended Implementation Path

### Option A: Mirror current Prayer state into HICLARIFY state first

- Keep all existing useState in PrayerRoom.
- On every change, also call `writeSlice(roomId, { ... })` so the state-store mirror is updated.
- Add `useSyncExternalStore` and optionally let one or two components read from state to verify.
- **Pro**: Safest; easy rollback. **Con**: Temporary duplication and two sources of truth until you remove local state.

### Option B: Move active slide / session / annotation state into HICLARIFY state now

- Introduce `prayerRoomSession` slice and getSlice/writeSlice.
- PrayerRoom (and optionally children) subscribe and read/write only through the slice.
- Remove the corresponding useState and prop drilling for that slice.
- **Pro**: Single source of truth immediately; aligns with structure/palette pattern. **Con**: Slightly larger first step.

### Option C: Hybrid (recommended)

- **Phase 1**: Add `prayerRoomSession` and getSlice/writeSlice. PrayerRoom **writes** all session/slide/annotation updates to the slice (writeSlice) and **reads** from the slice (getSlice(roomId) from state). Remove the matching useState in PrayerRoom so the slice is the only source for that data. Keep passing props to children so child components donΓÇÖt need to change yet.
- **Phase 2**: Have ModeratorPanel (and optionally SlideViewer, SessionSlidesView, AnnotationOverlay) subscribe to state and read the slice; then remove the props that only passed that state down.

**Recommendation: Option C, Phase 1 first.** It gives you a single source of truth and clearer active-slide/annotation sync without touching every child. Phase 2 then reduces props and makes wrappers thin.

---

## 7. Files to Reuse (Exact References)

| Purpose | File | How to use |
|---------|------|-------------|
| State read/write/subscribe | [src/03_Runtime/state/state-store.ts](src/03_Runtime/state/state-store.ts) | Import `getState`, `dispatchState`, `subscribeState` (alias `@/state/state-store`). |
| State derivation | [src/03_Runtime/state/state-resolver.ts](src/03_Runtime/state/state-resolver.ts) | No change; `state.update` already supports any key. |
| Domain slice pattern | [src/05_Logic/logic/actions/structure.actions.ts](src/05_Logic/logic/actions/structure.actions.ts) | Copy getSlice/writeSlice pattern: one key, read full slice from `getState()?.values?.[KEY]`, write with `dispatchState("state.update", { key, value })`. |
| Subscribe + read in component | [src/04_Presentation/components/organisms/tsx-organisms/ListOrganism.tsx](src/04_Presentation/components/organisms/tsx-organisms/ListOrganism.tsx) | `useSyncExternalStore(subscribeState, getState, getState)`; read `state?.values?.prayerRoomSession`. |
| Thin wrapper (optional) | [src/03_Runtime/engine/core/palette-store.ts](src/03_Runtime/engine/core/palette-store.ts) | Pattern: subscribeState(notifyListeners); get/set via state.values.<key>. |
| Intent contract | [src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md](src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md) | No new intent needed; document that Prayer uses `state.update` with key `prayerRoomSession`. |

Do **not** add a new Zustand store or a Prayer-only context for this session state; use the existing state-store and `state.values` as above.

---

## 8. Recommended Next Implementation Step

1. **Add** `prayer-room-session.state.ts` (or equivalent) under `src/01_App/Christian/Prayer/room/` (or next to PrayerRoom):
   - Define `PrayerRoomSessionSlice` and default slice.
   - Implement `getSlice(roomId)`: from `getState()?.values?.prayerRoomSession`, return slice for roomId or default.
   - Implement `writeSlice(roomId, next)`: `dispatchState("state.update", { key: "prayerRoomSession", value: next })`.
   - Export a helper that derives `activeSlideId` (or contentSource + indices) from the slice so annotation and slide-change recording use it in one place.

2. **In PrayerRoom**:
   - Import `getState`, `subscribeState`, `dispatchState` from `@/state/state-store` and the new getSlice/writeSlice (and activeSlideId helper).
   - Add `useSyncExternalStore(subscribeState, getState, getState)`.
   - Replace the 6ΓÇô8 session/slide/annotation useState variables with: read from `getSlice(roomId)` (or from stateSnapshot), and write via `writeSlice(roomId, { ...slice, ... })`.
   - In `handleAnnotationChange`, use the derived activeSlideId from the slice for `recordAnnotationEvent`.
   - In the recording useEffect, use the slice for currentSlideIndex/activeDeck so slide changes are recorded from one source.
   - Keep passing the same props to ModeratorPanel and content components (they still receive data and callbacks, but PrayerRoom now sources them from the slice).

3. **Smoke test**: Enter room, select deck, change slide, draw annotation, save page, annotate screen. Confirm one source of truth and no regressions.

4. **(Later)** Phase 2: Have ModeratorPanel (and optionally other components) subscribe to state and read the slice; remove the props that only forwarded that state.

---

## Summary

- The repo already has a **HICLARIFY-style state system**: append-only log, `deriveState`, `state.values` for domain slices, thin TSX wrappers that subscribe and read/write via `dispatchState`.
- **Prayer currently does not use it**: all session/slide/annotation state is local state and props in PrayerRoom, which causes duplicated ΓÇ£active slideΓÇ¥ logic and brittle ordering.
- **Smallest safe integration**: Introduce a single **`prayerRoomSession`** slice in `state.values`, with getSlice/writeSlice (same pattern as structure.actions), and move only the session/slide/annotation state from PrayerRoom into that slice. Reuse existing state-store and resolver; no new intents or new architecture.
- **Recommended path**: Option C ΓÇö Phase 1: slice + PrayerRoom reads/writes slice only (remove matching useState); Phase 2: children subscribe and read slice to reduce props.
- **Exact files to reuse**: state-store.ts, state-resolver.ts (as-is), structure.actions.ts (pattern), ListOrganism.tsx (subscribe + read pattern), STATE_INTENTS.md (document key usage).

This limits the change to the **state layer** of the Prayer live room and aligns it with the existing HICLARIFY state model without a full app refactor.
