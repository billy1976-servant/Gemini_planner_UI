# OSB V5 — Final Implementation Plan (Execution Plan Only)

**Document type:** Structured execution plan. No code. No refactors. Deep integration pass only.

**Purpose:** Single authoritative plan that unifies OSB V1–V5 into one implementation sequence. Ensures OSB is the single entry point, planner is the invisible backbone, and all complexity stays behind the curtain.

**Prerequisite reading:** OSB V1 (Smart Architecture + Implementation Plan), OSB V2, OSB V3, OSB V4, OSB V5.

---

## Part 1 — Compatibility Verification

### 1.1 Current Architecture Snapshot (Verified)

| Component | Location | Status for V5 |
|-----------|----------|----------------|
| **Structure slice** | `state.values.structure` (state-resolver `values`; structure.actions reads/writes via state.update) | Single store. All planner/journey writes must go here only. |
| **structureAddItems** | structure.actions.ts | Exists. Accepts `items: Partial<StructureItem>[]`; normalizes (id, title, categoryId, priority, dueDate, recurrence, habit, metadata); merge by id; writeSlice. **Reuse for journey injection.** |
| **structureAddFromText** | structure.actions.ts | Exists. Parser → candidates → merge items. Keep for single-sentence task capture. Do not use for journey injection. |
| **writeSlice** | structure.actions.ts | Single write path: dispatchState("state.update", { key: STRUCTURE_KEY, value: next }). No other writer. |
| **StructureSlice shape** | structure.actions.ts (local type), structure.types.ts (item/tree types) | Has `tree: StructureTreeNode[]`, `items: StructureItem[]`, blocksByDate, rules, calendar fields, stats. **Tree exists in slice but is not yet merged by any action.** |
| **StructureItem** | structure.types.ts | id, title, categoryId, priority, dueDate, recurrence, habit, metadata (Record<string, unknown>). HabitBlock: startValue, targetValue, durationDays. **No type change.** |
| **StructureTreeNode** | structure.types.ts | id, name, children?, order?. Base tree and journey fragments use same type. |
| **Parser** | extreme-mode-parser.ts | detectIntent (task \| note \| question \| command), interpretStream, streamToCandidates. **Extend usage for journey intent detection (keyword layer); do not replace.** |
| **Prioritization** | prioritization.engine.ts | effectivePriority, sortByPriority, escalation. No change. |
| **Recurrence** | recurrence.engine.ts | nextOccurrences, isDueOn. No change. |
| **Scheduling** | scheduling.engine.ts | scheduledForDate. No change. |
| **Aggregation** | aggregation.engine.ts | aggregateByDateRange. No change. |
| **Progression (habit ramp)** | progression.engine.ts | rampValueForDate(habit, refDate). No change. Journeys only inject items with habit. |
| **State intents** | state-resolver.ts | journal.add, journal.set, state.update, state:currentView, layout.override, scan.*, interaction.record. **No new intents for OSB V5.** |
| **Journal / Track** | behavior-listener + state-resolver | state:journal.add → journal.add; same contract. OSB reuses. |
| **Modal** | modal.compound.tsx | Presentational; reuse for OSB modal (one input, chips, confirm). |
| **Launcher / Shell** | GlobalAppSkin.tsx, PersistentLauncher | Center FAB; currently nav. **V5: center = OSB capture (one tap → modal).** |

### 1.2 Gaps Confirmed (Must Be Filled, Not Replaced)

| Gap | Resolution |
|-----|------------|
| **No base planner tree in codebase** | Introduce one canonical base tree (Life → Home, Business, Health, Relationships, Finance, Projects, Travel, Maintenance, Growth). Load from JSON or constant; store in slice.tree on bootstrap or first load. **Not created by journeys.** |
| **No tree merge logic** | Add tree merge in one place: given slice.tree and journey tree fragments, attach fragments under existing base nodes by id; then writeSlice. No new action required if done inside a journey loader that calls existing structureAddItems and a new tree-merge helper that updates slice then writeSlice. |
| **No OSB UI** | Add OSB modal + one input (osb_draft) + suggestion chips + optional confirm. Wire center FAB to open modal. |
| **No intent → route layer** | Add getOSBRoute (or equivalent) using parser + keyword map for journal/task/note/track/**journey**. Journey intent triggers "Start [Journey] plan" chip. |
| **No journey pack loader** | Add journey loader: load pack JSON → normalize items (ids, dueDate from relative-time) → structureAddItems(items) + merge tree into slice.tree → writeSlice. Optional single action structure:addJourney that does this. |
| **No relative-time conversion** | Add pure function: (offsetDays, refDate) → dueDate (ISO). Used by journey loader only; output is dueDate on item. No new field on StructureItem. |
| **No human builder** | Builder = form/wizard → payload → same journey payload shape → same inject path (structureAddItems + tree merge). Builder is an alternative producer of the same JSON. |
| **No export/import** | Export: subtree (tree fragment + items) → journey pack JSON. Import: same as load journey → structureAddItems + tree merge. |

---

## Part 2 — Non-Negotiable System Rules (Checklist)

Before and during implementation, ensure:

- [ ] **Do NOT:** create new engines, new stores, parallel planners, duplicate task models, rewrite contracts, change state shape, add new core architecture layers.
- [ ] **Reuse:** structure slice, planner priority system, forecasting (aggregation/scheduling/recurrence), recurrence, habit ramp (progression.engine), aggregation, scheduling, parser, existing actions (structureAddItems, structureAddFromText, journal.add, state.update).
- [ ] **Single write target:** Everything writes only to `state.values.structure` for planner/journey data; journal/track still use journal.add; draft/modal use state.update for values keys only.
- [ ] **Simplicity lock:** OSB = one button, one input, one confirm moment, one expansion layer. No dashboards required, no forced forms, no friction. Type → Confirm → System builds plan automatically.

---

## Part 3 — Base Tree Directive

### 3.1 Canonical Base Tree (Permanent Schema)

- **Life** (root)
  - Home
  - Business
  - Health
  - Relationships
  - Finance
  - Projects
  - Travel
  - Maintenance
  - Growth

### 3.2 Requirements

- **Editable by humans** via UI (e.g. planner settings or a dedicated “Edit life areas” flow). Edits write back to structure (e.g. structureUpdateTree or equivalent that writeSlice with updated tree).
- **Not edited directly via JSON by end users.** System loads base tree from JSON/config internally; UI allows rename/reorder/add/remove of nodes.
- **Journeys attach to this tree.** They do not create new roots. categoryId on items must resolve to base tree node ids (or children of them). Journey tree fragments are merged as children of the matching base node (e.g. "Vacation 2025" under Travel).

### 3.3 Implementation Notes

- **Source of truth:** One JSON file or constant (e.g. `base-planner-tree.json` or in structure bootstrap). On first load or when slice.tree is empty, seed slice from this base.
- **Tree merge rule:** When merging journey tree fragments, for each fragment node, find base node by id (e.g. "travel"); attach fragment as child of that base node. If base node does not exist, fallback: append under root or skip (document behavior).

---

## Part 4 — Journey Expansion Engine (V3 + V4 + V5)

### 4.1 Intent Detection

When OSB detects journey-like intent (e.g. vacation, remodel, recovery, business, relationship, health, trip, “plan something”), use keyword/suggestion layer to:

- Select **matching journey pack** (e.g. travel, remodel, recovery).
- Offer **expansion chips** from pack (e.g. Dog, Kids, Budget, Packing).

### 4.2 Flow

1. User types in OSB.
2. System suggests route chips: Journal, Task, Note, Track, **or** “Start [Journey name] plan.”
3. If user chooses “Start [Journey] plan”: load root pack; show expansion chips (suggestedDomains / subJourneys).
4. User selects chips (e.g. Dog, Kids); optionally open human builder for target date / options.
5. Load sub-journeys on demand (lazy); build combined payload (tree fragments + items).
6. **Build plan:** Resolve relative-time → dueDates; then **structureAddItems(items)** and **tree merge**; writeSlice once. No new data paths.

### 4.3 Injection Contract

- **Only** structureAddItems and tree merge (then writeSlice). No new actions required for injection; optional structure:addJourney can wrap: resolve pack(s) → normalize items → structureAddItems + merge tree → writeSlice.

---

## Part 5 — Relative Time System

- **Convention:** Journey items may specify offset from a reference date (e.g. −30, −7, −3, 0, +7 days).
- **Conversion rule:** `dueDate = addDays(targetDate, offset)`. Store only **dueDate** on StructureItem. No new field.
- **Forecasting:** Existing aggregation/scheduling/recurrence handle dueDate as today. No new forecast system.
- **Implementation:** Pure function in journey loader; input = item template with dueOffset (or relativeTo + offsetDays), targetDate/startDate from user or builder; output = item with dueDate set.

---

## Part 6 — Habit Ramp Injection

- **Use existing HabitBlock:** startValue, targetValue, durationDays (optional timeSlots, activeDays).
- **Use progression.engine only:** rampValueForDate(habit, refDate). No new ramp engine.
- **Journey packs** may define items with habit; loader sets item.habit; structureAddItems accepts it (normalizeItem already preserves habit). Examples: prayer growth, pushup ramp, recovery ramp, savings ramp.

---

## Part 7 — Gantt-Aware Metadata (Non-Engine)

- **Optional conventions** on `StructureItem.metadata` (existing contract):
  - `metadata.phase` — string or number (e.g. "1", "Planning").
  - `metadata.sequenceOrder` — number for ordering.
  - `metadata.dependsOn` — string or string[] (item ids).
- **Purpose:** Ordering, grouping, future Gantt visualization. **Do not build a Gantt engine.** Prioritization/scheduling do not read these; they are for UI/export only.

---

## Part 8 — Shared Responsibility Model

- **Standardized keys** in metadata: `assignee`, `participants`, `owner`, `role`. Used by journeys/builder only. No new assignment system; no sync in V5.

---

## Part 9 — Human Builder Layer

- **Goal:** User creates journeys without touching JSON.
- **Mechanism:** Simple questions (e.g. trip date, dog?, kids?) → answers as payload → **conversion layer** produces same tree + items shape as a static pack → inject via structureAddItems + tree merge.
- **Output:** Same StructureItem[] and tree fragments; same inject path. Users never see JSON.
- **Placement:** Optional path from OSB (e.g. “Customize plan” opens builder) or standalone “Create plan” entry. Default OSB behavior remains: type → confirm → auto-implement; builder is optional.

---

## Part 10 — Export / Import Ecosystem

- **Export:** Planner subtree (selected node + items with categoryId in that subtree) → serialize to journey pack JSON (same schema as loadable pack). Optional: include builder answers for re-edit.
- **Import:** Receive journey JSON → same loader as “load journey” → structureAddItems + tree merge. No second storage system.
- **Sharing:** Export → file/link → another user imports. Format matches journey pack format.

---

## Part 11 — OSB Behavior Rule

- **Default:** Type once → system interprets → system creates plan automatically. Builder is optional. Do not force users into forms.
- **Auto-implementation is the default.** Confirm moment = one tap on suggested chip (or “Build plan” for journeys); optional second confirm for “Save as X?” is acceptable but not required for primary suggestion.

---

## Part 12 — Safest Integration Order

Recommended sequence to avoid regressions and to build on solid footing:

1. **Base tree**
   - Define canonical base tree (Life → …) in JSON or constant.
   - Add bootstrap/seed so slice.tree is populated from base tree when empty (or on first planner load). Ensure no existing code assumes empty tree without migration.
   - Add minimal “tree merge” helper: given current slice.tree and list of fragment nodes + parentId, attach fragments under parent; return new tree; caller writes via writeSlice.

2. **OSB shell + modal (no journey yet)**
   - Center FAB opens OSB modal. One input bound to state.values.osb_draft.
   - getOSBRoute(draft, parser): returns route suggestions (journal, task, note, track). No journey yet.
   - Chips: Journal, Task, Note, Track (and track sub-chips if needed). On accept: dispatch journal.add, runAction(structure:addFromText), or state.update as today.
   - Confirm: one tap to route; optional “Save as Journal?” etc. Keep simplicity lock.

3. **Journey intent + chips (no inject yet)**
   - Extend suggestion layer: keyword match for journey intents (vacation, remodel, recovery, …) → suggest “Start [Journey] plan” chip.
   - When selected: load one root journey pack (static JSON); show expansion chips (suggestedDomains). No structure write yet; just UI and pack loading.

4. **Journey loader + structure inject**
   - Journey loader: load pack(s) → normalize items (ids, dueDate from relative-time if present) → structureAddItems(items).
   - Tree merge: merge pack’s tree fragments under base tree by parent id → writeSlice with updated tree + items.
   - “Build plan” button: run loader + tree merge + writeSlice. Verify only state.values.structure is written.

5. **Relative-time**
   - Add offset → dueDate conversion in loader; use targetDate/startDate from user or builder payload. All journey items get dueDate set at load time.

6. **Habit ramp in packs**
   - Allow journey JSON to include habit on items; loader passes through; normalizeItem already keeps habit. No code change in progression.engine.

7. **Metadata conventions**
   - Document metadata.phase, sequenceOrder, dependsOn, assignee, participants, owner, role. Use in journey authoring and builder output only. No engine changes.

8. **Human builder**
   - Define builder schema per journey type (questions, map to targetDate, subJourneys, overrides). Form → payload → same conversion as loader input → structureAddItems + tree merge. Optional entry from OSB or separate screen.

9. **Export / import**
   - Export: from planner UI, select subtree → serialize to journey pack format.
   - Import: file/URL → same loader as load journey → inject. No new store.

10. **Base tree editable in UI**
    - Add UI to edit base tree (rename, reorder, add/remove nodes). Writes back to slice.tree via existing or one new structure action (e.g. structureSetTree) that writeSlice. Not editable via raw JSON by user.

---

## Part 13 — Risk Register

| Risk | Mitigation |
|------|------------|
| **Tree merge conflicts** (same id, duplicate children) | Single merge function; rules: attach by parent id; generate new ids for journey nodes if id clashes with existing. Document and test. |
| **Over-injection** (huge plans in one go) | Lazy load sub-journeys; optional “Preview: N items” before Build plan; consider batch size or phase-by-phase inject for very large packs. |
| **Parser called twice** (OSB suggest + structureAddFromText on Task) | Acceptable per V1/V2; optional later: pass precomputed parseResult into structureAddFromText when invoked from OSB. |
| **Base tree drift** (multiple sources of truth) | Single source: one JSON/constant; all UIs and loaders read from slice; edits write back to slice only. |
| **Builder schema versioning** | Version builder schema or pack format so shared “builder answers” remain valid across app updates. |
| **Metadata key collision** | Single doc for metadata conventions; reserve phase, sequenceOrder, dependsOn, assignee, participants, owner, role for planner/journey use. |
| **User sees complexity** | Strict simplicity lock: one button, one input, one confirm, one expansion layer. All journey/planner/ramp logic invisible; no dashboards or forms unless user opts in (builder). |

---

## Part 14 — Simplification and Strengthening

### 14.1 Simpler

- **Single action for journey inject:** Prefer one structure:addJourney(action: { journeyId?, tree?, items?, targetDate? }) that does load (if id) or use payload, normalize, relative-time, structureAddItems + tree merge. Fewer entry points.
- **Base tree in one file:** One `base-planner-tree.json` (or TS constant) referenced by bootstrap and by merge logic. No drift.
- **Unify “route” and “journey” in suggestion:** One getOSBSuggestion() that returns either route chips (journal, task, note, track) or journey chip (“Start X plan”) so UI is one list of chips.

### 14.2 Stronger

- **Validation at load:** Journey loader validates pack shape (tree fragments, items with categoryId in base tree) and skips invalid entries; log or surface minimal error.
- **Idempotent merge:** Tree merge and structureAddItems by id ensure re-loading same pack doesn’t duplicate items (same id → update). Document for export/import.

### 14.3 More Stable

- **No new state intents.** All persistence via state.update(structure, value), journal.add, state.update(key, value). State-resolver unchanged.
- **Lock metadata keys** in one place (e.g. METADATA_KEYS in structure or docs) so future features don’t overwrite phase/assignee etc.

### 14.4 More Scalable

- **Lazy sub-journeys** keep initial payload small. Optional “archive” for old plan nodes (e.g. move to archive slice or mark hidden) if tree size grows.
- **Export format = import format:** Enables community packs and sharing without extra adapters.

---

## Part 15 — Cognitive Load

- **User-facing:** One button (FAB) → one input → one decision (tap chip or “Build plan”) → optional expansion (tap Dog, Kids) → done. No dashboards, no forced forms, no “planner engine” visibility.
- **Builder users:** Simple questions only; no JSON. Template authors need doc for base tree ids, relative-time, metadata keys.
- **Developers:** One place for tree merge, one for journey load, one for relative-time; document in this plan and in code comments.

---

## Part 16 — Final Checklist Before Implementation

- [ ] All of Part 2 (non-negotiables) satisfied.
- [ ] Base tree defined and load path decided (bootstrap/seed).
- [ ] Tree merge semantics documented and implemented in one function.
- [ ] Journey injection uses only structureAddItems + tree merge + writeSlice.
- [ ] Relative-time is template-only; output is dueDate on item.
- [ ] Habit ramps use existing HabitBlock and progression.engine.
- [ ] Gantt metadata is convention-only; no new engine.
- [ ] Shared responsibility is metadata-only; no new assignment system.
- [ ] Human builder output conforms to same payload as static pack; same inject path.
- [ ] Export produces journey pack format; import uses same loader.
- [ ] OSB default is auto-implement; builder optional.
- [ ] Simplicity lock: one button, one input, one confirm, one expansion.

---

## Summary

This plan is the **final architecture pass** before implementation. It:

- **Verifies** compatibility with current architecture (structure slice, actions, engines, state, parser).
- **Identifies** missing pieces: base tree, tree merge, OSB UI, getOSBRoute, journey loader, relative-time, builder, export/import.
- **Suggests** safest integration order (base tree → OSB shell → journey intent → inject → relative-time → habit → metadata → builder → export/import → editable base tree).
- **Highlights** risks (tree merge, over-injection, schema versioning, metadata collision, complexity leak) and mitigations.
- **Suggests** ways to make the system simpler (single addJourney, one base tree file, unified chips), stronger (validation, idempotent merge), more stable (no new intents, locked metadata keys), and more scalable (lazy packs, export=import).
- **Ensures** cognitive load stays minimal for the user (one button, one input, one decision, optional expansion; planner and journeys invisible).

**Do not write code until this plan is agreed and the integration order is started in sequence.** This document is the execution plan only.
