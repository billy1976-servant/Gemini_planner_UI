# OSB V2 — Full System Integration Plan

**Document type:** Read-only analysis and architecture planning. No implementation. No modifications to runtime code, JSON, engines, contracts, or compilers.

**Goal:** Rethink the system around the OSB (Operating System Button) as the primary life-interaction surface and design Version 2 as an intelligent, suggestion-driven, capture-first layer that integrates with the existing JSON architecture, engines, logic system, and state pipeline.

---

## 1. Full System Understanding Summary

### 1.1 JSON screens and app structure

- **Location:** `src/01_App/apps-json/`. Screens are JSON trees with `id`, `type`, `state`, `children`, `content`, `behavior`, `params`, `when`.
- **Types:** Root `screen`; structural nodes `section`, `card`; UI molecules `button`, `field`, `modal`, `stepper`, etc. Types resolve via the engine Registry; molecules resolve via `getCompoundComponent(type)` from `molecules.json` and compound TSX components.
- **HiClarify:** Nested under `HiClarify/` (home, me, others, build, tools, play) and `apps/hiclarify/` (journal, notes, planner, ideas, outreach, etc.). Home screen is a single screen with hero + nav section; nav is cards with `behavior: { type: "Action", params: { name: "navigate", to: "HiClarify/me/me_home" } }`.
- **Loading:** Screens are loaded by path (e.g. from URL or app router); a screen-loader or equivalent fetches/composes JSON; the root is passed to JsonRenderer.

### 1.2 Organs

- **Location:** `src/01_App/organs/`. Organs are reusable JSON subtrees (e.g. `track.json`) referenced by `organId` from app JSON. The blueprint compiler and/or renderer can inline or compose organs.
- **Track organ:** Defines TRACK journal: Stepper for think/repent/ask/conform/keep; per-track sections with card (prompt), field (state key `journal.think` etc.), button (Save with `state:journal.add`, track, key `entry`, valueFrom `input`, fieldKey), UserInputViewer. All journal writes go through the same state intent `journal.add` with track and key.

### 1.3 Molecules and layout contracts

- **Molecules:** `src/04_Presentation/components/molecules/` (e.g. `modal.compound.tsx`, `button.compound.tsx`, `card.compound.tsx`) and `molecules.json` (variants, sizes). Registry maps JSON `type` to atoms or getCompoundComponent("modal") etc. Molecules receive `params`, `content`, `children`; behavior is attached to triggers (e.g. buttons) and emits action events.
- **Layout:** Section/card/organ layout comes from layout-store, template-profiles, molecule-layout resolver; `getSectionLayoutId`, `resolveMoleculeLayout`, card presets. Layout override is stored in `state.layoutByScreen[screenKey]` (section/card/organ preset IDs). JsonRenderer uses these to choose layout and preset per node.

### 1.4 Behavior pipeline

- **Entry:** User interaction (e.g. button click) causes the interaction-controller or TriggerAtom to emit a CustomEvent `"action"` with `detail: { type: "Action", params: { name, ... } }` or equivalent.
- **behavior-listener** (installed once, listens on `window`):
  1. **state:*** — Strips `state:` prefix; resolves value (for `valueFrom: "input"` from `state.values[fieldKey]` for journal.add, else ephemeral buffers); then dispatches to state-store: `state:currentView`, `state.update`, or `journal.add` (as intent).
  2. **navigate** — Calls `navigate(params.to)`.
  3. **CONTRACT_VERBS** — Passes to behavior-runner (tap, go, back, etc.) which invokes BehaviorEngine handlers (interact.*, nav.*).
  4. **Else** — Passes to `interpretRuntimeVerb` with `{ name: actionName, ...params }` and current state. interpretRuntimeVerb normalizes to action shape and calls `runAction(action, state)`.
- **action-runner:** Looks up `getActionHandler(action.name)` from action-registry; runs handler with (action, state). Handlers (e.g. structure:addFromText, diagnostics:*) perform domain logic and write state via `dispatchState` only (no direct state mutation).

### 1.5 State pipeline

- **state-store:** Holds an event log (StateEvent[]) and derives state by replaying the log through `deriveState(log)` from state-resolver. `dispatchState(intent, payload)` appends to log, re-derives, notifies subscribers, persists (except for state.update), traces.
- **state-resolver:** Pure function `deriveState(log)` → DerivedState. Handles intents: `state:currentView` → derived.currentView; `journal.set` / `journal.add` → derived.journal[track][key] = value; `state.update` → derived.values[key] = value; `layout.override` → derived.layoutByScreen; `scan.*` → derived.scans; `interaction.record` → derived.interactions.push(payload). No other mutation path; extend-only by adding new intent branches.

### 1.6 Structure engine

- **structure.actions:** Read/write a single slice `state.values.structure` (StructureSlice: tree, items, blocksByDate, rules, calendar view, stats). structureAddFromText reads `action.text` or `state.values.structure_draftText`, builds segments `[{ text, isFinal: true }]`, calls `streamToCandidates(segments, slice.rules, refDate)` from extreme-mode-parser, then normalizes candidates to StructureItems and merges into slice.items; writes via `dispatchState("state.update", { key: STRUCTURE_KEY, value: next })`. No other engine; parser is used only inside this action for the task/plan path.

### 1.7 Journal engine

- **No separate journal “engine”:** Journal is state only. Writes: behavior-listener (on action `state:journal.add`) resolves value from state.values[fieldKey], then `dispatchState("journal.add", { track, key, value })`. state-resolver applies `journal.add` to derived.journal[track][key]. Reads: JsonRenderer and UserInputViewer read `getState().journal[track]` for display. journal_track app and track organ are JSON screens that bind fields to journal.think etc. and buttons to state:journal.add with the appropriate track and fieldKey.

### 1.8 Parser (extreme-mode-parser)

- **Location:** `src/05_Logic/logic/engines/structure/extreme-mode-parser.ts`. Pure functions: `splitSentences(text)` (sentence boundaries and conjunction split), `detectIntent(text)` → task | note | question | command (regex/heuristic), `interpretStream(segments)` → ParseResult { segments, sentences, intent }, `interpretToCandidates` / `streamToCandidates` (parse + structure-mapper → StructureItem[]). Parser does not route; structureAddFromText ignores intent and always produces tasks into structure.items.

### 1.9 Blueprint compiler

- **Location:** `src/07_Dev_Tools/scripts/blueprint.ts`. Compiles blueprint.txt (and content) → app.json. Parses node list (indent, type, name, content, logic, target); builds tree; emits JSON with behavior. For Save nodes with `logic: state:journal.add`, infers track from node name (e.g. "Save Think" → track "think"), emits full Action params (name, track, key: "entry", valueFrom: "input", fieldKey: "journal.{track}"). Compiler is compile-time only; it does not see runtime state or OSB.

### 1.10 Launcher and shell

- **GlobalAppSkin:** Bottom nav strip (left: person, people; center: orange launcher button; right: build, tools). Center button currently navigates to Play and closes a dropdown; dropdown shows links (Journal, Learn, Apps, Diagnostics, Home). NAV_TARGET_BY_ICON maps icon keys to HiClarify hub paths.
- **PersistentLauncher:** Standalone FAB (blue), same nav links in a panel. Both are navigation-only; no capture input.

---

## 2. OSB V2 Role in the Architecture

### 2.1 Where OSB sits

- **Shell layer:** OSB is the primary shell-level entry point. The center FAB (or equivalent) opens the OSB experience (modal or sheet). Shell owns “open OSB” and “close OSB”; it does not own suggestion logic.
- **Runtime layer:** The OSB modal/content runs in the same runtime as JsonRenderer and behavior-listener. It subscribes to state, emits action events or calls dispatchState/runAction directly, and listens for input-change when using a field bound to osb_draft. No new runtime; OSB is a client of the existing event and state APIs.
- **State layer:** OSB reads state (journal, values, currentView, interactions) for context and suggestion; writes only through existing intents (journal.add, state.update) or by invoking registered actions (structure:addFromText). It may introduce one or a few values keys (e.g. osb_draft, osb_modalOpen, osb_hints) under the existing state.update contract. It does not add new state intents unless the architecture explicitly extends the state-resolver for a new intent.
- **Logic layer:** Suggestion and ranking logic live in the logic tier: pure functions that take draft text, parser output, and state snapshot and return a small set of ranked suggestions (and optional track/plan/relationship hints). These functions do not dispatch; the UI layer uses their output to render chips and, on user choice, to call dispatchState or runAction. Optionally, a minimal “OSB action” (e.g. osb:confirm) can be registered that delegates to existing intents to keep all persistence paths going through the action-registry for traceability.

### 2.2 How OSB connects to existing and future systems

- **journal.add:** User accepts “Journal” or “Track (think|repent|ask|conform|keep)” → OSB passes value (from osb_draft or current input) and track to the same contract: dispatchState("journal.add", { track, key: "entry", value }). Same derived.journal[track][key] as journal_track and track organ; no new storage.
- **structure:addFromText:** User accepts “Task” or “Plan” → OSB calls runAction({ name: "structure:addFromText", text: draft }). Existing action; single parse inside the action; structure slice unchanged.
- **state.update:** Used for osb_draft, osb_modalOpen, notes (e.g. values.notes or a dedicated key), and optional osb_hints. All existing; no new intent.
- **Future systems (notes, people, planner, research, tools):** OSB can suggest “Note”, “People”, “Planner”, “Research”, “Tools” as route chips. For V2, routing to them is either: (1) state.update into a reserved values key (e.g. values.notes, values.people_draft), or (2) a new registered action (e.g. people:addFromText) that the OSB invokes with the draft, or (3) navigate to the appropriate screen with the draft passed via state (e.g. state.update("planner_draft", draft) then navigate to planner). No new state intents required until those domains introduce their own intents; OSB remains the router that calls existing or extended actions and state.update.

---

## 3. Intelligent Suggestion Model (No AI)

### 3.1 Goal

Reduce “infinite” user possibilities (thoughts, plans, tasks, relationships, reminders, spiritual notes, business items, questions, ideas) to **1–3 top suggestions** so the user sees “where this could go” without choosing from 1000 options. The system interprets, classifies, ranks, and suggests; the user confirms or overrides.

### 3.2 Inputs (all existing or derivable)

- **Parser outputs:** interpretStream([{ text: draft, isFinal: true }]) → ParseResult (sentences, intent: task | note | question | command). Extend or wrap with a thin OSB intent map so that additional keywords (e.g. pray, reflect, Scripture, confess, who, meeting, tomorrow) map to OSB route hints (track, plan, relationship).
- **Keyword detection:** Phrase lists per domain (track, plan, relationship, work, personal, spiritual). Match draft (lowercase, trimmed) against lists; output boolean or score per domain. No NLP; pure string/regex.
- **State context:** getState() → journal (which tracks exist and have content), values.structure (if present: item count, recent categoryIds), currentView (e.g. on a track screen → boost track), values.osb_hints (if present: routeWeights, trackWeights from learning).
- **Recent activity:** derived.interactions (last N), or last few state intents (journal.add, state.update) inferred from a small tail of the state log or from a dedicated “last routes” written by OSB on each capture. Used to bias “same as last time” or “you often put this in Journal.”
- **Known entities (V2 extension):** If values.structure has items with categoryIds or titles, or a future people/planner slice exists, names and project labels can be matched against the draft to suggest “Add to project X” or “About [person].” V2 can define a minimal “entity” list (e.g. from structure categories or a static list) and use it for ranking only.
- **Time of day:** Optional. Morning vs evening can select which guiding question or which default suggestion is emphasized (e.g. “What’s the one thing?” vs “What do you want to remember?”). No new engine; a small pure function.
- **Priority weighting:** Combine parser intent score, keyword scores, state-context weights, and optional osb_hints into a single score per route (and per track or per secondary route). Sort and take top 1–3; return as primary + secondary array + optional trackHint/planHint/relationshipHint.

### 3.3 Output

A **suggestion object** (internal contract; not a state intent): e.g. { primary: Route, secondary: Route[], trackHint?: string, phrase: string, optionalIntentLabel?: string }. Route is one of Journal, Task, Track, Note, Plan, People, Planner, Research, Tools (or a subset for V2). The UI renders primary as the main chip and secondary as alternates; trackHint selects which track to pre-select when user taps “Track” or “Journal (TRACK).”

### 3.4 No new engine

All of the above is a **rule-based decision layer**: pure functions in a single module that import parser and getState (and optionally a small learning module that reads/writes osb_hints). No new derivation pipeline, no new state machine, no AI service.

---

## 4. Routing Strategy

### 4.1 Route set (V2)

- **Journal** — General reflection; default track or let user pick track.
- **Task** — Actionable item; → structure:addFromText.
- **Track** — TRACK study (think/repent/ask/conform/keep); → journal.add with that track.
- **Note** — Remember/fact; → state.update(notesKey, value).
- **Plan** — Scheduling/planning; V2 can route to structure:addFromText (task with date) or to a future planner action/screen.
- **People** — Relationship/outreach; V2 can route to state.update(peopleKey) or a future people:add action.
- **Planner** — Explicit planner flow; can be “navigate to planner with draft” or a dedicated action if one exists.
- **Research** / **Tools** — Can be “save as note and tag” or “navigate to research/tools with context”; V2 can keep as suggestion chip that navigates or stores in a reserved key.

### 4.2 Confirm-ability

User stays in control: the system suggests 1–3 options; the user taps one to accept or taps “Other” to see a full list or type a custom destination. After tap, either (1) direct save (one tap to route), or (2) one-step confirm (“Save as Journal?”) then save. Recommendation: primary suggestion can be one-tap; secondary and “Other” can require one confirm to avoid misroutes. No auto-route without user acceptance.

### 4.3 Routing implementation (no new intents)

- **Journal / Track:** dispatchState("journal.add", { track, key: "entry", value }). Value from state.values.osb_draft or passed from component.
- **Task / Plan:** runAction({ name: "structure:addFromText", text: draft }).
- **Note:** dispatchState("state.update", { key: notesKey, value }).
- **People / Planner / Research / Tools:** As above: state.update to a reserved key, or runAction if an action is registered, or navigate with draft in state.

---

## 5. Engine Compatibility Check

### 5.1 Engines that already support OSB routing

- **State-resolver:** Already supports journal.add, state.update, state:currentView, layout.override, interaction.record, scan.*. No change needed for OSB; OSB only dispatches these intents.
- **Structure pipeline:** structure:addFromText already accepts text and writes to state.values.structure. OSB passes text on “Task”/“Plan” accept; no change to the action or slice shape.
- **Journal pipeline:** behavior-listener already resolves state:journal.add with fieldKey and dispatches journal.add; state-resolver already applies it. OSB can either emit an action event with state:journal.add and fieldKey "osb_draft", or call dispatchState("journal.add", { track, key, value }) directly with value from osb_draft. Both paths are compatible.
- **Parser:** Already provides intent and sentences. OSB uses it once per submit for suggestion; when user chooses Task, structure:addFromText runs parser again internally (single responsibility; no duplication of storage, only of parse call for that path).

### 5.2 State intents that already exist

- journal.set, journal.add
- state.update
- state:currentView
- layout.override
- scan.result, scan.record, scan.batch
- interaction.record

No new intents required for OSB V2 core; optional future intents (e.g. notes.append) would be a separate extension.

### 5.3 Flows reusable as-is

- Input binding: Any field with state.mode two-way and a fieldKey (e.g. osb_draft) will, on input-change, trigger behavior-listener’s handler and thus state.update(osb_draft, value). Reused for OSB input.
- Action dispatch: Either (1) OSB component calls dispatchState and getState/runAction directly, or (2) OSB triggers CustomEvent "action" with params that behavior-listener already handles (state:journal.add, navigate) or forwards to interpretRuntimeVerb (structure:addFromText, etc.). Both are valid.
- Modal: ModalCompound or a wrapper that renders input + chips + optional confirm; no change to modal contract.

### 5.4 Minimal extensions

- **Suggestion/ranking module:** New pure functions (no new “engine” in the sense of a state machine or new pipeline). Input: draft, getState(), optional time. Output: suggestion object. Lives in logic (e.g. next to parser or in a small osb module).
- **Optional action:** If desired, register one action (e.g. osb:confirm) that takes type, track, value and calls dispatchState or getActionHandler("structure:addFromText")(action, state) so that all OSB-originated writes go through the action-registry for diagnostics. Not required if the OSB component calls existing APIs directly.
- **values keys:** osb_draft, osb_modalOpen, osb_hints (and notes key, people key, etc. if needed). All via state.update; no new intent.

---

## 6. Cognitive Load Design

### 6.1 Child-simple on the surface

- One box: “What’s on your mind?” (or a dynamic question). User types one thing.
- One line of 1–3 suggestions: “Looks like a task” | “Journal” | “TRACK: Think.” User taps one.
- Optional one confirm: “Save as Journal?” → Yes/No. Then done.
- No menus of 1000 options; no need to know where things “live” in the app. The system proposes; the user approves or picks another chip.

### 6.2 Extremely deep underneath

- Parser classifies intent; keyword and state context refine route and track; learning hints (frequency, recency) bias ranking; multiple domains (journal, structure, notes, track, people, planner, research, tools) are available as destinations; each destination is backed by the full engine (journal state, structure engine, state.update, future modules). The user never sees the depth; they see “type once → system suggests → tap to save.”

### 6.3 “Type once → system thinks → suggests next step”

- **Type once:** Draft lives in one input (osb_draft). No need to open different screens to capture.
- **System thinks:** On submit (or on debounced change), run parser + suggestion layer: interpretStream, keyword/context/learning pass, rank routes, produce top 1–3.
- **Suggests next step:** UI shows chips (and optional intent label). User’s “next step” is to tap a chip (or “Other”) and optionally confirm. Then the system routes into the correct engine. The “next step” can be extended later (e.g. “Add to calendar?” or “Tag with project?”) without changing the one-box surface.

---

## 7. OSB vs Launcher

### 7.1 Recommendation: OSB replaces center FAB’s primary action

- **Center FAB:** Single tap = open OSB (smart capture modal). The center becomes the “life operating entry point”; capture is the primary action, not navigation to Play.
- **Play, Me, Others, Build, Tools:** Keep them as strip icons (left/right) or as a secondary menu. Current NAV_TARGET_BY_ICON already maps person → me_home, people → others_home, play → play_home, build → build_home, tools → tools_home. No need to remove these; move “open nav menu” off the center (e.g. long-press on center for dropdown, or a “More” icon that opens the same links). So: **navigation and capture stay clean** — one tap = capture (OSB); nav = strip or overflow.

### 7.2 Coexistence

- OSB does not replace the existence of Play, Me, Others, Build, Tools; it replaces only the **center button’s primary action**. Those hubs remain reachable from the strip or from inside OSB (e.g. “Open Journal” as a chip that navigates after saving, or a link in the modal footer). Launcher “adapts” by: (1) center = open OSB modal, (2) dropdown/menu = nav links, triggered by long-press or a separate control.

---

## 8. Version 2 Implementation Strategy (Phased Plan Only)

### Phase A — Integrate capture

- Add OSB entry point: center FAB opens a modal (or sheet). Modal contains one input bound to osb_draft (fieldKey so input-change → state.update). No suggestion yet; optional static “Save as Journal” / “Save as Task” / “Save as Note” buttons that dispatch journal.add, structure:addFromText, state.update. Goal: prove that one box can write to journal, structure, and notes using existing intents and actions only.

### Phase B — Add suggestion ranking

- Introduce the suggestion module: parser + keyword + state context → ranked list. Modal shows 1–3 chips from the ranking; user taps to accept. Optional confirm step. Learning (osb_hints) can be skipped in this phase or added as a simple frequency counter.

### Phase C — Connect engines

- Ensure all V2 routes (Journal, Task, Track, Note, Plan, People, Planner, Research, Tools) are wired: each chip maps to a dispatch or runAction or navigate. Add any minimal actions (e.g. people:addFromText) or state keys needed for domains that don’t yet have a write path. No new state intents unless a domain introduces one independently.

### Phase D — Refine learning model

- Implement or refine osb_hints: after each capture, update routeWeights, trackWeights, recentRoutes from state; write back via state.update. Suggestion layer reads osb_hints to bias ranking. Optional: time-of-day and currentView weighting. No AI; only counts and ratios.

---

## 9. Risk Analysis

### 9.1 Conflicts with blueprint compiler

- **Risk:** Blueprint emits state:journal.add with track and fieldKey for Save nodes. OSB also triggers journal.add (from a different entry point, with value from osb_draft). Both write to the same derived.journal[track][key].  
- **Assessment:** No conflict. Blueprint is compile-time; OSB is runtime. Same state contract; different UI entry points. No change to blueprint required for OSB.

### 9.2 Conflicts with journal_track

- **Risk:** journal_track app and track organ use the same journal.add and same tracks (think, repent, ask, conform, keep). OSB could overwrite or duplicate entries.  
- **Assessment:** No conflict. OSB and journal_track are two entry points to the same store. Journal state does not distinguish “source”; both write journal[track].entry (or other keys). If the product wants “OSB journal vs screen journal” separation, that would require a new state shape (e.g. journal.osb vs journal.screen); not recommended for V2. Same store, multiple entry points is the intended design.

### 9.3 Parser duplication risks

- **Risk:** OSB calls interpretStream for suggestion; structure:addFromText calls streamToCandidates (which calls interpretStream) when user chooses Task. So the same text is parsed twice when the user selects Task.  
- **Assessment:** Acceptable. Parser is pure and cheap; duplication is one extra parse per capture for the Task path. Avoiding it would require either (1) passing parse result from OSB into structure:addFromText (change to action signature and behavior) or (2) not using parser for suggestion (weaker UX). Recommendation: keep current design; document that Task path parses twice. Optional future: structure:addFromText accepts optional precomputed parseResult to avoid second parse when called from OSB.

### 9.4 State explosion risks

- **Risk:** Many new keys under values (osb_draft, osb_modalOpen, osb_hints, notes, people_draft, etc.) could bloat state or complicate persistence.  
- **Assessment:** Manageable. All keys are under the existing values bucket; state-resolver does not care about key names. Persistence already skips or handles state.update; document which keys are ephemeral (e.g. osb_draft cleared on save) vs durable (osb_hints, notes). No new intents; no state explosion in the sense of new derivation branches.

---

## 10. Final Verdict

**Is OSB V2 the correct architectural center for a 100-app life OS?**

**Yes.**

**Reasoning:**

1. **Single entry point:** A life OS with many apps (journal, planner, notes, people, research, tools, etc.) would otherwise force the user to open the “right” app before capturing. OSB inverts that: capture first, then the system suggests where it belongs. That reduces cognitive load and supports the “one box” mental model (like a single inbox) while still routing into the full depth of the architecture.

2. **Leverage without replacement:** OSB does not replace JSON screens, organs, structure engine, journal, or parser. It sits in front of them as the primary interaction surface and routes into them. All existing engines remain the source of truth for storage and behavior; OSB is the router and suggester.

3. **Scalability:** New domains (people, planner, research, tools) can be added as new routes and new actions or state keys without changing the OSB contract. The suggestion layer can be extended with more keywords and more context (entities, time, learning) without new core engines. The architecture stays clean: one entry point, many destinations, same state and action pipelines.

4. **Child-simple, deep underneath:** The design achieves “type once → system suggests → tap to confirm” on the surface while using the full engine stack underneath. That is the right architectural center for a life OS: simple for the user, maximally capable under the hood.

5. **No contract rewrites:** The plan uses only existing intents (journal.add, state.update), existing actions (structure:addFromText, and future ones), and optional new values keys. No change to state-resolver semantics, behavior-listener order, or blueprint. That keeps risk low and allows OSB V2 to be implemented as an additive layer.

**Conclusion:** OSB V2 as the primary life-interaction surface, with an intelligent suggestion layer that reduces many possibilities to 1–3 ranked options and routes into existing engines, is the correct architectural center for a 100-app life OS. This document should be treated as the reference for that design; implementation remains phased and code-free in this plan.
