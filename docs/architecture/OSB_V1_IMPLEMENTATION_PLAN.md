# OSB V1 — System Assessment & Implementation Plan

**Document type:** Planning and design only. No implementation. No code changes to runtime, contracts, or engines in this phase.

**Goal:** Design Version 1 of the HIClarify OSB (Operating System Button) capture-first layer using the **existing** system: one input box, intent detection, route to correct system area, confirm → save, minimal navigation, ChatGPT-level simplicity.

---

## PHASE 1 — DISCOVERY (READ-ONLY MAP)

### 1.1 Parser system

| Location | What it does |
|----------|---------------|
| **`src/05_Logic/logic/engines/structure/extreme-mode-parser.ts`** | **Stream → split → interpret → candidates.** Pure; no state. |
| **Intent splitting** | `splitSentences(text)` — splits on `.!?` and on " and ", " also ", " then ". |
| **Keyword / intent detection** | `detectIntent(text)` returns `"task" \| "note" \| "question" \| "command"`: question (what/when/show/list/get me/who, or ends with ?), note (note/remember/journal), command (cancel/switch/add above/clear), else **task** (add/remind/schedule/task/todo/do, or default). |
| **Classification** | `interpretStream(segments)` → `ParseResult` with `segments`, `sentences`, `intent`. |
| **Text routing logic** | **Not used for routing today.** Parser output flows only into `structure-mapper.engine.ts` → `mapToCandidates()` which produces **StructureItem[]** (task-like items with categoryId, dueDate, recurrence). Intent is computed but **never used** to route to journal vs task vs note. |
| **NLP / pattern logic** | Heuristic only: regex on lowercase trim; no external NLP. `structure-mapper` adds: date phrase extraction (today/tomorrow/yesterday, relative), recurrence ("every day", "every Thursday"), categoryInference.keywords, priorityInference. |

**Conclusion:** Parser already does intent detection (task | note | question | command). It does **not** route by intent; `structureAddFromText` always writes to `state.values.structure` (planner/tasks). No "journal" or "track" in parser today.

---

### 1.2 State + behavior pipeline

| Component | Role |
|-----------|------|
| **`state:journal.add`** | Handled in **behavior-listener**: when `actionName.startsWith("state:")` and mutation === "journal.add", resolves value from `state.values[fieldKey]`, then `dispatchState("journal.add", { track, key, value })`. |
| **state-resolver** | Handles intent `journal.add` / `journal.set`: `derived.journal[track][key] = value` (track = payload.track or "default"). |
| **state.update** | behavior-listener dispatches `state.update` with key/value; state-resolver does `derived.values[key] = payload.value`. |
| **behavior-listener** | Listens for "action" events. Order: (1) state:* → resolve value, dispatchState; (2) navigate → navigate(to); (3) CONTRACT_VERBS → runBehavior; (4) else → interpretRuntimeVerb → runAction (action-registry). |
| **dispatchState** | state-store.ts: append to log, deriveState(log), notify listeners, persist (except state.update), trace. |

**State shape (state-resolver):** `journal: Record<string, Record<string, string>>`, `values: Record<string, any>`, `currentView`, `layoutByScreen`, scans, interactions. No dedicated "tasks" key in derived; tasks live inside `values.structure` (structure slice).

---

### 1.3 Launcher / FAB infrastructure

| File | Role |
|------|------|
| **`src/04_Presentation/shells/GlobalAppSkin.tsx`** | Bottom nav strip: left/right icons (person, people, build, tools) + **center orange launcher** (2/3 FAB). Launcher opens dropdown (portal) with links: Journal, Learn, Apps, Diagnostics, Home. Clicking center button currently fires `navigate` to Play. **No input field.** |
| **`src/04_Presentation/components/global/PersistentLauncher.tsx`** | Standalone FAB (blue, 56px), same dropdown links. Position: absolute, bottom-right. **No input field.** |

No other floating button or global capture UI found.

---

### 1.4 Modal infrastructure

| File | Role |
|------|------|
| **`src/04_Presentation/components/molecules/modal.compound.tsx`** | Presentational modal: SurfaceAtom, title/body slots, moleculeLayout (column/grid), children. **No built-in actions**; interaction via nested buttons. |
| **Registry** | `registry.tsx` and `molecules.json` register "modal"; json-renderer can render modal nodes. |
| **Behavior** | behavior.json maps "modal" to "nav.goModal". No capture/confirm flow. |

Modal is reusable for a confirm strip (e.g. "Save as Journal" / "Save as Task" / "Save as Note" / "Save as Track").

---

### 1.5 Track system (journal)

| File | Role |
|------|------|
| **`src/01_App/apps-json/apps/journal_track/app.json`** | Screen: per-track sections (Think, Repent, Ask, Conform, Keep). Each: prompt card, field (state key e.g. journal.think), Save button → `state:journal.add` with track, key "entry", valueFrom "input", fieldKey. |
| **`src/01_App/organs/track.json`** | Organ: same pattern — think/repent/ask/conform/keep views, fields, Save buttons with state:journal.add. |
| **Flow** | User picks track by view; types in one field; Save writes to `journal[track].entry`. No single-field capture that then chooses track. |

---

### 1.6 Blueprint compiler

| File | Role |
|------|------|
| **`src/07_Dev_Tools/scripts/blueprint.ts`** | Compiles blueprint → app.json. Knows `state:journal.add`: infers `track` from node name (e.g. "Save Think" → track "think"), emits Action params (name, track, key: "entry", valueFrom: "input"). |

**Parser → blueprint:** Parser output (candidates, intent) is **not** consumed by blueprint. Blueprint is compile-time; parser is runtime. OSB would use parser at runtime and then dispatch existing intents (journal.add, state.update, or logic actions); no change to blueprint required for V1.

---

## PHASE 2 — COMPATIBILITY ANALYSIS

### A) What already exists that OSB can reuse?

| Piece | Status |
|-------|--------|
| **Parser** | **Yes.** `extreme-mode-parser`: splitSentences, detectIntent (task \| note \| question \| command), interpretStream, streamToCandidates. Add "journal" (and optionally "track") to detectIntent or add a thin OSB-specific intent map. |
| **State pipeline** | **Yes.** dispatchState("journal.add", …), dispatchState("state.update", …); state-resolver handles both. No contract change. |
| **Journal storage** | **Yes.** derived.journal[track][key]; state:journal.add and fieldKey → state.values already wired in behavior-listener. |
| **Modal system** | **Yes.** ModalCompound + registry; use for confirm layer (title + body + action buttons). |
| **Launcher placement** | **Yes.** GlobalAppSkin center FAB or PersistentLauncher position; reuse position and affordance, change content from "dropdown links" to "open OSB capture modal/sheet". |
| **Track builder** | **Yes.** Journal tracks (think/repent/ask/conform/keep) and state:journal.add with track param; can be used from confirm ("Save as Think" etc.) or as default from intent. |
| **Logic actions** | **Yes.** structure:addFromText reads state.values.structure_draftText or action.text, runs streamToCandidates, writes to structure.items. Pattern: one action that reads draft + parser, writes to state. OSB can add a similar action (e.g. osb:capture) that uses intent to route. |

### B) What is missing?

| Gap | Description |
|-----|-------------|
| **Single global input component** | No one-field UI that is always or easily accessible (e.g. in shell or first thing in modal). Must add: one input bound to e.g. state.values.osb_draft or a dedicated draft key. |
| **Intent → routing bridge** | Parser produces intent (task/note/question/command) but nothing routes by it. Need: on submit, map intent (+ optional user override) → dispatch journal.add OR state.update (structure) OR note store OR journal with track. |
| **Confirm layer** | No "Save as Journal / Task / Note / Track" confirm step. Need: modal or inline strip with suggested type + buttons to confirm or override. |
| **Unified capture intent** | No single action that (1) takes draft text, (2) runs parser, (3) shows confirm, (4) dispatches to the right store. Either a new intent (e.g. "osb.capture" handled in behavior-listener) or a new logic action that performs (1)(2)(4) with (3) as UI in the same flow. |

### C) Overlap: Parser vs OSB intent detection

| Aspect | Current parser (extreme-mode-parser) | OSB V1 need |
|--------|--------------------------------------|-------------|
| **Strength** | Already has task \| note \| question \| command; pure, testable; used by structureAddFromText. | Same four + **journal** (and optionally track). |
| **Cleanliness** | Single place; no UI; clear ParseResult. | Keep single place; extend detectIntent or add osbIntentMap(text) that returns journal \| task \| note \| track (track can be "default" or think/repent/ask/conform/keep). |
| **Merge or replace?** | **Merge.** Extend detectIntent to return "journal" when e.g. "journal", "reflect", "pray" or similar; or add a small OSB-specific layer that maps parser intent + keywords → OSB routing type (journal/task/note/track). No second parser. |
| **Does current parser already solve routing?** | **No.** It produces intent but structureAddFromText ignores it and always writes to structure. Adding a **routing step** that uses intent (and optionally confirm) is the new piece. |

**Recommendation:** Keep parser; add minimal OSB routing layer: `getOSBRoute(text): { type: 'journal'|'task'|'note'|'track', track?: string }` using detectIntent + optional keyword rules for journal/track. Then: Input → Parser → getOSBRoute → Confirm (modal) → Dispatch.

---

## PHASE 3 — OSB V1 DESIGN PLAN

### 1. OSB philosophy

- **Capture-first:** User types in one place → system interprets → system suggests or user confirms → save to the right place.
- **Minimal navigation:** No need to open Journal screen or Planner screen first; capture from anywhere (shell or one tap).
- **ChatGPT-level simplicity:** One input box, minimal buttons, clear confirm step.

### 2. V1 scope (STRICT)

**In scope:**

- Global capture field (one input, always or one-tap accessible).
- Intent detection using existing parser + small OSB routing map (journal / task / note / track).
- Confirm modal (or strip): e.g. "Save as Journal", "Save as Task", "Save as Note", "Save as Track" (and optionally "Save as Think/Repent/Ask/Conform/Keep" for track).
- Routing to: **Journal** (state:journal.add), **Task** (structure:addFromText or state.update structure), **Note** (state.update e.g. values.notes or a note slice), **Track** (state:journal.add with track).

**Out of scope for V1:**

- No AI. No new NLP services.
- No major engine or contract rewrites. Extend-only: one new state key for draft, one new action or intent for "capture with confirm".
- No blueprint contract changes; optional later: blueprint can reference OSB capture node type.

### 3. Placement decision

**Option A:** Replace launcher FAB with OSB — FAB opens only capture (input + confirm).  
**Option B:** Expand launcher FAB — dropdown includes "Quick capture" that opens capture UI.  
**Option C:** Center OSB button opens modal — FAB becomes "capture"; click opens modal with input + confirm.

**Choice: Option C — Center OSB button opens modal.**

**Reasoning:**

- Keeps existing nav links (Journal, Learn, Apps, etc.) available from the same FAB or from a second tap (e.g. "More" in dropdown) so we don’t remove navigation.
- Single responsibility: center button = "capture". Modal gives enough space for one input + confirm strip (ChatGPT-style).
- Reuses launcher position and modal compound; no new shell layout.
- Clear mental model: one button = "add something"; modal = "what is it and where does it go?"

**Implementation note:** Center button in GlobalAppSkin (or PersistentLauncher) opens a modal that contains: (1) one text field (bound to e.g. state.values.osb_draft), (2) suggested type from parser, (3) confirm strip (Save as Journal / Task / Note / Track [and optionally track sub-types]).

### 4. Data flow design

```
User types in OSB input
  → input-change → state.update(osb_draft, value)  [existing]
User submits (Enter or "Save" button)
  → Read state.values.osb_draft
  → Parser: interpretStream([{ text, isFinal: true }]) → ParseResult (sentences, intent)
  → getOSBRoute(text, intent) → { type: 'journal'|'task'|'note'|'track', track?: string }
  → Show confirm modal/strip with suggested type + buttons
User confirms (e.g. "Save as Journal")
  → If journal: dispatchState("journal.add", { track: suggestedTrack || "default", key: "entry", value: draft })
  → If task: runAction({ name: "structure:addFromText", text: draft }) or dispatch state.update(structure_draftText, draft) + structure:addFromText
  → If note: dispatchState("state.update", { key: notesKey, value: appendOrSet(draft) })  [note store shape TBD]
  → If track: dispatchState("journal.add", { track, key: "entry", value: draft })
  → Clear osb_draft; close modal
```

**Use existing:**

- `state:journal.add` and existing state-resolver journal branch.
- `state.update` for osb_draft and for note store if stored in values.
- structure:addFromText for task (already reads text and writes to structure.items).
- Existing modal compound for confirm UI.

### 5. UI behavior (ChatGPT-style)

- **One screen (modal):** One input box (multiline optional), placeholder e.g. "What's on your mind?"
- **Minimal buttons:** Submit (or Enter), Cancel/Close, and confirm strip: "Save as Journal", "Save as Task", "Save as Note", "Save as Track" (and optionally track chips: Think, Repent, Ask, Conform, Keep).
- **Activity feed:** Not in V1 scope; can be a later addition (e.g. recent captures list in modal or on home).
- **Confirm strip:** Show suggested type from getOSBRoute; user can override by clicking another button. Primary = suggested; others secondary.

### 6. Integration strategy

| Existing system | How OSB plugs in |
|----------------|-------------------|
| **Parser** | Call `interpretStream([{ text: draft, isFinal: true }])` on submit. Use `parseResult.intent` and optional keyword pass to compute OSB route (journal/task/note/track). Add `getOSBRoute(text, intent)` in logic (e.g. next to extreme-mode-parser or in a small osb-routing module). |
| **State resolver** | No change. OSB dispatches existing intents: `journal.add`, `state.update`. |
| **Journal system** | OSB dispatches `dispatchState("journal.add", { track, key: "entry", value })`. Same as journal_track screens. |
| **Modal compound** | Shell or a wrapper component renders ModalCompound with content.title (e.g. "Quick capture"), content.body (optional), and **children** = input field + confirm strip. Input bound to state.values.osb_draft via existing input-change → state.update. Confirm buttons dispatch custom event "action" with params e.g. { name: "osb:confirm", type: "journal", track?: "think" } or directly dispatchState/journal.add and close modal. |
| **Launcher** | GlobalAppSkin (or PersistentLauncher): center button onClick opens OSB modal instead of (or in addition to) dropdown. Option: first click = open OSB modal; or dropdown item "Quick capture" opens OSB modal. |

**New pieces (minimal):**

1. **OSB routing helper:** `getOSBRoute(text: string, intent?: ParseResult['intent']): { type: 'journal'|'task'|'note'|'track', track?: string }` — can live in `src/05_Logic/logic/engines/structure/` or `src/05_Logic/logic/osb/`.
2. **OSB modal content component:** React component (or JSON-driven if we add an OSB screen) that: (a) reads state.values.osb_draft, (b) on submit runs parser + getOSBRoute, (c) shows confirm strip, (d) on confirm dispatches journal.add / structure:addFromText / state.update and clears draft + closes.
3. **Shell wiring:** One place (e.g. GlobalAppSkin or layout) that renders OSB modal and connects launcher button to "open OSB modal" (e.g. state.values.osb_modalOpen or a local state).

**Behavior-listener:** Either (1) add handling for a new action name e.g. `osb:confirm` that receives type/track/value and dispatches the right intent (journal.add / runAction(structure:addFromText) / state.update), or (2) keep confirm logic in the OSB modal component and dispatch existing intents directly (dispatchState + getState, runAction via engine-contract). Option (2) avoids new action names and keeps behavior-listener unchanged.

### 7. Risk assessment

| Risk | Mitigation |
|------|-------------|
| **Contract conflicts** | No new state intents; only new keys in values (osb_draft, osb_modalOpen, and note store if needed). State-resolver and behavior-listener remain extend-only. |
| **Blueprint impact** | None for V1. OSB is shell/TSX-driven. Later: optional blueprint node type "OSBCapture" that composes field + buttons. |
| **Engine conflicts** | Parser is pure; getOSBRoute is pure. Only structure:addFromText and dispatchState are used; no change to structure slice shape. |
| **Runtime coupling** | OSB modal must run in same client as state-store and behavior-listener. No new global event contract if confirm is done inside the component; if we add osb:confirm, it’s one new branch in behavior-listener or one new entry in action-registry that dispatches existing intents. |

### 8. Power rating (V1 OSB vs current navigation model)

| Criterion | Current (navigate to screen, then use screen UI) | V1 OSB (one input, confirm, route) |
|-----------|---------------------------------------------------|-------------------------------------|
| **Simplicity** | Medium (user must know where to go). | High (one place to type; system suggests where it goes). |
| **Adoption** | Depends on discoverability of screens. | High if launcher is prominent and one-tap to capture. |
| **Speed** | Multiple taps (open screen, find field, type, save). | Fewer taps (open modal, type, confirm). |
| **Emotional clarity** | Can feel fragmented (many screens). | Single "inbox" for thought → clear resolution (journal/task/note/track). |

---

## PHASE 4 — IMPLEMENTATION ROADMAP (DO NOT EXECUTE YET)

1. **Implement getOSBRoute** — Pure function: text + optional parser intent → { type, track? }. Extend or wrap detectIntent for journal/track keywords.
2. **Implement OSB modal UI** — Component: input (bound to osb_draft), submit handler (parser + getOSBRoute), confirm strip, dispatch on confirm; close and clear draft.
3. **Wire launcher to OSB modal** — GlobalAppSkin or layout: center FAB opens OSB modal (set osb_modalOpen or local open state).
4. **Define note storage** — If "note" is in scope: decide shape (e.g. values.notes = array, or values.notes_byId). Use state.update only.
5. **Optional: osb:confirm action** — If we want JSON-driven confirm later, register an action that takes type/track/value and dispatches journal.add or runs structure:addFromText or state.update.
6. **Test flow** — Type in OSB → suggest Journal → confirm → journal.add; same for Task (structure), Note (values), Track (journal with track).

---

## Summary

- **Parser:** Exists; intent task/note/question/command. Extend for journal/track and add **getOSBRoute** for OSB.
- **State pipeline:** Reuse journal.add, state.update, structure:addFromText; no contract change.
- **Launcher:** Reuse position; center button opens OSB modal.
- **Modal:** Reuse ModalCompound for confirm strip.
- **Missing:** Single global input, intent→routing bridge, confirm layer; all addable with minimal new code and no engine/contract rewrites.

This document is the foundation for the next phase (implementation). No code has been modified.
