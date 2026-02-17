# OSB V1 Smart Architecture

**Document type:** Design only. No implementation. Extend existing pipelines only; no new core engines, no contract rewrites.

**Goal:** Define the lightest possible intelligent OSB layer that understands the user, suggests direction, guides decisions, and routes input into the correct system areas using existing parser, state, and actions.

---

## 1. System Context (Respected Boundaries)

| System | Role | OSB use |
|--------|------|---------|
| **extreme-mode-parser** | `splitSentences`, `detectIntent`, `interpretStream` → ParseResult (sentences, intent: task \| note \| question \| command). | Single source for intent; extend detectIntent or add thin OSB intent map for journal/track/plan/relationship. |
| **behavior-listener** | Handles action events: state:*, navigate, CONTRACT_VERBS, else interpretRuntimeVerb → runAction. | OSB dispatches existing actions (state:journal.add, state.update) or invokes runAction(structure:addFromText); no new action names required. |
| **state-resolver** | Derives journal, values, currentView, interactions, layoutByScreen, scans. | OSB reads getState() for context; writes via existing intents only. |
| **structure:addFromText** | Reads action.text or values.structure_draftText; streamToCandidates → structure.items. | OSB passes text when user accepts "Task" or "Plan" suggestion. |
| **journal.add** | dispatchState("journal.add", { track, key, value }); state-resolver writes derived.journal[track][key]. | OSB passes track (default or think/repent/ask/conform/keep) and value when user accepts Journal/Track. |
| **track organ / journal_track** | Tracks: think, repent, ask, conform, keep. Same journal.add contract. | OSB suggests track when input matches TRACK semantics; same storage. |
| **GlobalAppSkin / PersistentLauncher** | Shell nav + center FAB. | Center FAB opens OSB modal; launcher adapts (see OSB_SHELL_INTEGRATION_PLAN.md). |
| **modal.compound** | Surface + title/body + children. | OSB modal content (input, question, chips, confirm) as children. |

---

## 2. Intelligence Model (Lightweight, No New Engine)

Intelligence is a **thin read-only layer** of pure functions that combine:

1. **Parser output** — `interpretStream([{ text, isFinal: true }])` → intent (task | note | question | command) and sentences.
2. **State snapshot** — `getState()` → journal tracks with content, values.structure (item count, recent categories), values.currentView, last N interactions.
3. **Simple heuristics** — Keyword hints for track (think/repent/ask/conform/keep), plan (schedule, tomorrow, meeting), relationship (who, call, meet, name), personal vs work (keyword lists).
4. **Learning hints** — Optional `values.osb_hints` (or similar) written by a small learning pass: e.g. "user often routes X to journal" (see OSB_LEARNING_MODEL.md). Read by suggestion logic; not required for V1.

**No new engine:** Functions live in a single module (e.g. `osb-suggestion` or under `logic/engines/structure`) that imports parser and getState only. No new state machine, no new derivation pipeline.

---

## 3. Routing Logic

**Inputs:** Draft text, optional ParseResult (intent, sentences), state snapshot.

**Outputs:** Suggested route(s) and optional track/subtype.

**Route set (V1):** Journal, Task, Track, Note, Plan, Relationship.

- **Journal** — General reflection; store in journal.default or suggest track.
- **Task** — Actionable; → structure:addFromText (existing pipeline).
- **Track** — TRACK study (think/repent/ask/conform/keep); → journal.add with that track.
- **Note** — Remember/fact; → state.update (e.g. values.notes).
- **Plan** — Scheduling/planning; can map to structure (task with date) or future planner slice; V1 can treat as Task with date hint.
- **Relationship** — People/outreach; V1 can map to Note or future relationship module; suggest "Note" or "Relationship" chip.

**Logic (extend-only):**

1. Run parser: `interpretStream([{ text: draft, isFinal: true }])` → intent.
2. Optional keyword pass: match draft against small lists (e.g. track keywords, plan keywords, relationship keywords) to suggest subtype or secondary route.
3. Optional state pass: if `journal.think` (or other track) was last written recently, boost "Track" suggestion; if structure.items length high, boost "Task" or "Plan."
4. Return ordered suggestions: e.g. `{ primary: "journal", secondary: ["track", "note"], trackHint: "think" }` or similar. No contract change; this is a suggestion object for UI only.

**Integration with existing:**

- **journal.add** — Suggestion "Journal" or "Track (think)" → UI shows chip; on accept, dispatchState("journal.add", { track, key: "entry", value: draft }) with fieldKey resolution via state.values.osb_draft or explicit value.
- **structure:addFromText** — Suggestion "Task" or "Plan" → on accept, runAction({ name: "structure:addFromText", text: draft }).
- **Note** — Suggestion "Note" → on accept, dispatchState("state.update", { key: notesKey, value: appendOrSet(draft) }).
- **Relationship** — V1: suggest chip and route to Note or reserve for future; no new state intent.

---

## 4. UI Structure

**OSB modal (single surface):**

1. **One primary input** — Bound to `state.values.osb_draft`; same input-change → state.update pipeline as existing fields.
2. **One guiding question (dynamic)** — Prompt text chosen from a small set based on time of day, currentView, or last route (e.g. "What's on your mind?", "What needs attention?", "What are you doing today?", "Who are you thinking about?"). Stored in state or derived in component; no new engine.
3. **Suggestion chips** — Rendered from routing logic output: e.g. "Looks like a task", "Journal entry", "TRACK: Think", "Save as note", "Plan it", "Relationship". Primary suggestion emphasized; user can tap to accept or override.
4. **Intent hints** — Optional short line showing parser intent (e.g. "Intent: task") for transparency; can be hidden in V1.
5. **Optional confirm** — After user taps a chip, optional one-step confirm ("Save as Journal?") or direct save. Design choice: V1 can do direct save on chip tap to reduce friction.

**Modal implementation:** Reuse ModalCompound; children = input (with fieldKey so input-change works), dynamic question text, chip list, optional confirm. All actions dispatch existing intents or runAction.

---

## 5. State Interactions

| State read | Purpose |
|------------|---------|
| `getState().values.osb_draft` | Current draft text for input binding and for parser/suggestion. |
| `getState().journal` | Which tracks exist and have content; recent journal activity for context. |
| `getState().values.structure` | Presence of structure slice, item count, recent categories (if exposed). |
| `getState().currentView` | Screen context (e.g. on track screen → boost track suggestion). |
| `getState().interactions` | Last N entries for "recent activity" (e.g. type, target). |
| `getState().values.osb_hints` | Optional learning output (see OSB_LEARNING_MODEL.md). |

| State write | Mechanism |
|-------------|------------|
| Draft | `dispatchState("state.update", { key: "osb_draft", value })` on input; clear on save. |
| Modal open | Local React state or `state.update("osb_modalOpen", true/false)`. |
| Journal | `dispatchState("journal.add", { track, key: "entry", value })` (value from draft or fieldKey). |
| Note | `dispatchState("state.update", { key: notesKey, value })`. |
| Task/Plan | runAction({ name: "structure:addFromText", text: draft }). |
| Learning hints | Optional: `state.update("osb_hints", { ... })` from a lightweight learning pass (no new intent; use state.update only). |

No new intents in state-resolver. No new branches in behavior-listener for OSB-specific actions unless we add a single optional action (e.g. osb:confirm) that delegates to existing intents; recommendation is to keep confirm logic in the OSB component and call dispatchState/runAction directly.

---

## 6. Summary

- **Intelligence:** Thin layer of pure functions (parser + state + heuristics) producing suggestion object for UI. No new engine.
- **Routing:** Map suggestion (Journal, Task, Track, Note, Plan, Relationship) to existing pipelines only.
- **UI:** One input, one dynamic question, suggestion chips, optional intent hint, optional confirm; modal uses ModalCompound.
- **State:** Read existing state for context; write only via journal.add, state.update, and structure:addFromText. Optional osb_hints for learning.

This document is the architecture foundation for OSB V1 Smart. No code has been modified.
