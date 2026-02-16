# Universal Structure Engine + Planner + Extreme Mode Task Parser — V5 Implementation Plan

**Document type:** Exhaustive implementation plan (plan-only; no runtime code changes in this deliverable)  
**Version:** 5  
**Scope:** HiSense/Azure Clarify runtime — event log, deriveState, actions, engines, JSON UI.  
**Output:** Single file `architecture/PLANNER_UNIVERSAL_ENGINE_V5_IMPLEMENTATION_PLAN.md`.  
**Constraints:** No schema DB; event log + deriveState(log); structure under one state.values key; JSON is the brain; minimal necessary runtime changes specified but not implemented.

---

## 1. Executive Overview

### 1.1 Universal Structure Engine — Definition

The **Universal Structure Engine** is the primitive that models **tree + items + rules + time + interpreter**:

- **Tree:** Recursive hierarchy (e.g. categories: Home, Finances, Maintenance). Nodes have `id`, `name`, optional `children`, optional ordering.
- **Items:** Universal records (e.g. tasks, touchpoints, jobs) with minimal required fields and optional blocks (recurrence, habit, signals/blockers).
- **Rules:** JSON-defined rulesets (priority scale, escalation, cancel-day, recurrence definitions, category inference, scheduling defaults). Layered: base → industry → planner → user.
- **Time:** Due dates, blocks per date, recurrence, habit progression. Engines compute “due on date,” “next occurrence,” “ramp value.”
- **Interpreter:** Parse result + context + rules → normalized candidates (e.g. task candidates) + trace. Single entry for speech-to-task, form submit, bulk import.

Planner is the **first instance** of this primitive. Relationships, business workflows, diagnostics-driven suggestions, and decisions (signals/blockers) use the same primitive with different JSON templates and labels.

### 1.2 Why State Is “Almost Nothing”

- **State = event log + deriveState(log).** No separate database or Firestore schema. All mutable state is an append-only log; `deriveState(log)` in [state-resolver.ts](src/03_Runtime/state/state-resolver.ts) recomputes the full snapshot. Same log ⇒ same state; replay and time-travel are feasible.
- **One key per domain.** Planner/structure lives under a single `state.values` key (recommended: `structure`). Every mutation is one `state.update` with that key and the **full slice** (atomic replace). No partial patches; actions read state → call engines → produce next slice → dispatch once.
- **Log growth:** Optional snapshot/compaction (e.g. periodic snapshot + tail) is specified later; not required for V1.

### 1.3 What Is JSON vs Engines vs Actions vs Renderer

| Layer | Responsibility | Ownership |
|-------|----------------|-----------|
| **JSON** | Structure (tree, templates), rulesets (priority, escalation, recurrence defs, category inference), screen definitions, Plan section UI. | Config / data. |
| **Engines** | Pure math and derivation: recurrence next-occurrence, progression ramp, scheduling, prioritization, aggregation, rule evaluation (when/then), structure mapping (parse → items). No state writes, no UI. | Pure functions. |
| **Actions** | Orchestration: read state, call engines, dispatch single `state.update` with key e.g. `structure`. | [action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts) + handlers. |
| **Renderer** | Bind state slice to UI: e.g. List items from `state.values.structure.items` via a chosen binding convention. Field/Select already use `stateSnapshot.values[fieldKey]`. | [json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx), [list.compound.tsx](src/04_Presentation/components/molecules/list.compound.tsx). |

---

## 2. Canonical Contracts

### 2.1 State Contract (Single Key)

**Recommended key:** `structure` (one key for the universal structure domain; planner is one use case).

**Single-planner shape (sufficient for V1):**

```ts
// state.values.structure
{
  domain: "planner";           // optional; for multi-domain later
  tree: StructureTreeNode[];  // or single root: StructureTreeNode
  items: StructureItem[];      // tasks
  blocksByDate: Record<string, Block[]>;  // date ISO -> blocks
  rules: ResolvedRuleset;      // merged rules (or rulesetId ref)
  activePlannerId?: string;    // for multi-planner
}
```

**Multi-planner shape (optional extension):**

```ts
{
  domain: "planner";
  planners: Record<string, PlannerSlice>;  // plannerId -> { tree, items, blocksByDate, rules }
  activePlannerId: string;
}
// PlannerSlice = { tree, items, blocksByDate, rules }
```

**Atomic update rule:** Every write is `dispatchState("state.update", { key: "structure", value: nextFullSlice })`. No partial updates; actions compute the next full slice from current state + engines.

**Log growth / compaction (optional):**  
- No compaction required for V1.  
- If needed later: define intent `state.snapshot` with payload `{ key: "structure", value: snapshot }` and compaction policy (e.g. keep last N events or snapshot every M events + tail). state-resolver would treat `state.snapshot` as replace (same as state.update for that key). Document in STATE_INTENTS; no new resolver branch beyond one optional intent.

**File touch points (future):**  
- [state-resolver.ts](src/03_Runtime/state/state-resolver.ts): no change (already handles `state.update` for any key).  
- [state-store.ts](src/03_Runtime/state/state-store.ts): no change.  
- Persistence: existing `__app_state_log__` persists full log; compaction would be a separate optional step.

---

### 2.2 Item / Task Contract (Universal Item)

Minimal required fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Stable unique id (nanoid/uuid). |
| title | string | yes | Display title. |
| categoryId | string | yes | References tree node id. |
| priority | number | yes | Numeric priority (scale from rules). |
| dueDate | string \| null | no | ISO date or null. |
| createdAt | string | no | ISO. |
| updatedAt | string | no | ISO. |

Optional blocks:

| Block | Purpose |
|-------|---------|
| recurrence | recurringType (daily\|weekly\|monthly\|off), recurringDetails (e.g. "Mon,Wed,Fri"). |
| habit | startValue, targetValue, durationDays, timeSlots?, activeDays?; progression engine uses this. |
| signals/blockers/opportunities | For decision/aggregation; array of strings. |
| metadata | Arbitrary key/value for domain-specific data. |

**Invariant:** Engines never mutate items in place; actions produce new arrays and replace the slice.

---

### 2.3 Tree / Hierarchy Contract

- **Node shape:** `{ id: string, name: string, children?: StructureTreeNode[], order?: number }`. Recursive.
- **Subtree resolution:** Given root id, collect all descendant ids: walk tree recursively (or iterative stack); return set of ids. “Tasks in category X” = items where `item.categoryId === X` or `item.categoryId` is in subtree id set of X.
- **Ordering:** Optional `order` on nodes; sort children by `order` then by array index. Items may be ordered by a separate list or by sort key (e.g. effectivePriority, dueDate) in engines.

**Contract:** One function `getSubtreeIds(tree, rootId): string[]`; pure; no state.

---

### 2.4 Ruleset Contract (JSON Rules)

Rules live in JSON. Layering order: **base → industry → planner → user**. Merge semantics: later keys overwrite earlier; optional `$merge: true` on a key to merge arrays (e.g. category keywords append).

| Rule block | Content |
|------------|---------|
| priorityScale | min, max, default (number). |
| escalation | enabled, daysUntilEscalation, incrementPerDay, maxPriority. |
| cancelDayReset | "none" \| "moveToNextDay" \| "decrementPriority". |
| recurrenceDefinitions | Enum/labels for recurring types. |
| schedulingDefaults | defaultDayTemplate (blocks), businessHours, slotDuration. |
| categoryInference | keywords: Record<string, categoryId>; defaultCategoryId. |
| priorityInference | phrase/word → number (e.g. "asap" → 9, "when you can" → 3). |
| habitDefaults | startValue, targetValue, durationDays. |

**Rule evaluator contract:** `evaluateRules(ruleSet, context): { matched: RuleMatch[], derived: Record<string, unknown> }`. when/then conditions; context = { date, item?, stateSlice?, ... }. No state writes.

---

### 2.5 Interpreter Contract (Parser → Candidates)

- **Input:** Streaming segments (e.g. partial transcript chunks) + context (date, activeCategoryId, rules).
- **Output:** Normalized **candidate items** (array of partial/full StructureItem) + **trace** (matched rules, confidence, parse segments used).
- **Commit boundary:**  
  - **Draft:** Candidates held in memory or in a transient state key (e.g. `structure_draft`); not committed to `structure`.  
  - **Commit:** One or more candidates written via `structure:addItem` / `structure:addItems`.  
  - **Batch commit:** Multiple candidates in one `structure:addItems` payload; single state.update.

**Traceability:** Store parse/interpreter trace in a debug-only key (e.g. `values.structure_lastTrace`) or append to a bounded in-memory log; do not grow main event log with trace. Optional: one intent `structure.trace` for dev tools (append-only, cap size).

---

## 3. Full Parser System Plan (Extreme Mode)

### 3.1 Streaming Ingestion Model

- **Input:** Stream of segments (e.g. from speech: partial transcripts, final transcripts). Segments have optional `isFinal`, `text`, `timestamp`.
- **Buffer:** Accumulate segments until commit boundary (e.g. pause, final segment, or explicit “add” command). On finalization, run sentence splitting then interpretation.
- **Output:** List of candidate items + trace. No state write inside parser/interpreter; action layer commits.

### 3.2 Sentence Splitting (Multi-Task → N Tasks)

- Rules: split on sentence boundaries (.!?), and on conjunctions (“and”, “also”, “then”) when followed by a verb or task-like phrase. One sentence or phrase → one candidate unless rule says “merge.”
- Configurable regex or pattern list in JSON (e.g. `sentenceSplitPatterns`). Default: split on `[.!?]` and on “ and ” / “ also ” with simple heuristics.

### 3.3 Intent Detection

Classify segment or sentence into: **task** | **note** | **question** | **command**.

- **Task:** Create/update task (title, optional due/recurrence/category/priority).  
- **Note:** Attach to journal or to item note; no structure item.  
- **Question:** Query (e.g. “what’s due today”); may drive UI or another engine; no write.  
- **Command:** “Cancel day,” “switch to work,” “add above”; mapped to actions.

Intent can be keyword/heuristic first (e.g. “add”, “remind me”, “schedule” → task; “note” → note; “what”/“show” → question). No new runtime code in this plan; specify as contract and test vectors.

### 3.4 Extraction Fields

From text, extract:

| Field | Examples / cues |
|-------|------------------|
| title | Rest of sentence after intent; trim stop words. |
| due words | “today”, “tomorrow”, “next Monday”, “on Friday” → normalize to date. |
| recurrence phrases | “every day”, “weekly”, “every Mon and Wed” → recurringType + details. |
| category keywords | From rules categoryInference keywords. |
| priority cues | From rules priorityInference (“urgent”, “asap”, “low”). |
| habit cues | “daily habit”, “streak” → set habit block. |

All extraction rules in JSON where possible; fallback to deterministic defaults (e.g. default priority from rules, default category).

### 3.5 Deterministic Fallback

When no rule matches: use default category, default priority, no recurrence, dueDate = null unless date phrase matched. Never throw; always return at least one candidate with minimal fields.

### 3.6 Traceability

Trace = { segmentsUsed, sentenceSplits, intentPerSegment, extractedFields, matchedRuleIds }. Store in `values.structure_lastTrace` (last run only) or dev-only store; do not append to main event log. Optional: `structure.trace` intent with cap (e.g. last 20 traces).

---

## 4. Engine Build Plan (Pure Engines) — File-by-File

All under a new directory: `src/05_Logic/logic/engines/structure/`. No state writes; no UI imports.

### 4.1 date-utils.ts

- **Purpose:** Parse relative date phrases (“today”, “tomorrow”, “next Monday”) to ISO date string; timezone from context or default UTC/local.
- **Signatures:** `parseRelativeDate(phrase: string, refDate: Date): string | null`; `isToday(iso: string, refDate: Date): boolean`.
- **Inputs/Outputs:** phrase + refDate → ISO or null. Pure.
- **Test vectors:** “today” → refDate; “tomorrow” → refDate+1; “next Monday” → next Monday.

### 4.2 recurrence.engine.ts

- **Purpose:** Next occurrence(s) for a task; whether task is due on a given date.
- **Signatures:** `nextOccurrences(task: StructureItem, fromDate: Date, count: number): string[]`; `isDueOn(task: StructureItem, date: Date): boolean`.
- **Inputs:** task (with recurrence block), date. Outputs: array of ISO dates; boolean.
- **Invariants:** No mutation; recurrence definitions from task or passed in.

### 4.3 progression.engine.ts

- **Purpose:** Habit ramp value for a date (e.g. linear ramp from startValue to targetValue over durationDays).
- **Signatures:** `rampValueForDate(habit: HabitBlock, refDate: Date): number`; optional `streakDays(habit, log): number`.
- **Inputs:** habit block + date. Outputs: number.
- **Invariants:** Pure; no state.

### 4.4 scheduling.engine.ts

- **Purpose:** Given tasks + date + blocks + rules, return scheduled items (which tasks appear on that date, with optional slot/block assignment).
- **Signatures:** `scheduledForDate(tasks: StructureItem[], date: Date, blocks: Block[], rules): ScheduledItem[]`.
- **Inputs:** tasks, date, blocks, rules. Outputs: list of scheduled items (task id, slot, effective time).
- **Invariants:** Pure; no state write.

### 4.5 prioritization.engine.ts

- **Purpose:** Effective priority (base + escalation), sort order, cancel-day adjustment.
- **Signatures:** `effectivePriority(item: StructureItem, date: Date, rules): number`; `sortByPriority(items: StructureItem[], date: Date, rules): StructureItem[]`; optional `applyCancelDay(items, date, rules): StructureItem[]`.
- **Inputs:** items, date, rules. Outputs: number or sorted list.
- **Invariants:** Pure; reads rules only.

### 4.6 aggregation.engine.ts

- **Purpose:** Rollups: by day/week/month; or decision-style (signals/blockers/opportunities from items).
- **Signatures:** `aggregateByDateRange(items: StructureItem[], from: Date, to: Date, groupBy: 'day'|'week'|'month'): Rollup[]`; `aggregateSignals(items: StructureItem[]): { signals, blockers, opportunities }`.
- **Inputs:** items, range or list, config. Outputs: rollup structures.
- **Invariants:** Pure; reusable for decision/planner fusion.

### 4.7 rule-evaluator.engine.ts

- **Purpose:** Generic when/then evaluator; condition matching; derive values from rules.
- **Signatures:** `evaluateRules(ruleSet: ResolvedRuleset, context: RuleContext): { matched: RuleMatch[], derived: Record<string, unknown> }`; `evaluateCondition(when: WhenClause, context): boolean`.
- **Inputs:** ruleSet (JSON), context (date, item, stateSlice, …). Outputs: matched rules, derived key/values.
- **Invariants:** No state; no side effects.

### 4.8 structure-mapper.engine.ts

- **Purpose:** Parse result (from parser) + rules + context → normalized candidate items (StructureItem shape).
- **Signatures:** `mapToCandidates(parseResult: ParseResult, rules: ResolvedRuleset, context: MapperContext): { candidates: StructureItem[], trace: MapperTrace }`.
- **Inputs:** parse result (segments, extracted phrases), rules, context. Outputs: candidates + trace.
- **Invariants:** Pure; id generation can be deferred to action layer (mapper may return items without id; action adds id on commit).

**Test vectors (examples) for each engine:** Add unit tests with fixed inputs and expected outputs; document in plan as “golden” examples (e.g. recurrence: “every Monday” + fromDate → list of Mondays; prioritization: overdue task + escalation rule → higher effective priority).

---

## 5. Action Layer Plan — Exact Actions and Payloads

Handlers live in `src/05_Logic/logic/actions/` (or under a `structure/` subfolder). Each handler: read state → optional call engines → compute next slice → `dispatchState("state.update", { key: "structure", value: nextSlice })`. Id generation: nanoid or uuid in handler when adding items.

| Action | Payload | Behavior |
|--------|---------|----------|
| structure:addItems | `{ items: Partial<StructureItem>[] }` | For each item, assign id (if missing), createdAt/updatedAt, merge into state.values.structure.items. Single state.update with full slice. |
| structure:addItem | `{ item: Partial<StructureItem> }` | Same as addItems with one item. |
| structure:updateItem | `{ id: string, patch: Partial<StructureItem> }` | Find item by id, merge patch, set updatedAt. Replace items array; one state.update. |
| structure:deleteItem | `{ id: string }` | Filter out item by id; one state.update. |
| structure:setBlocksForDate | `{ date: string, blocks: Block[] }` | Set blocksByDate[date] = blocks; one state.update. |
| structure:selectCategory | `{ categoryId: string }` | Set activeCategoryId in slice (if in schema) or leave to UI state. Optional. |
| structure:setActivePlanner | `{ plannerId: string }` | Set activePlannerId; one state.update. |
| structure:cancelDay | `{ date: string }` | Optional. Run prioritization/cancelDay logic in engine; apply result to items; one state.update. |

**Id generation:** In handler: `id = item.id ?? nanoid()` (or uuid). Never allow duplicate ids; reject or overwrite by id on add (document policy: overwrite by id if id provided).

**Immutability:** Handlers never mutate `getState().values.structure`; they clone, modify, and dispatch the new object.

**File touch points (future):**  
- [action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts): register `structure:addItems`, `structure:addItem`, `structure:updateItem`, `structure:deleteItem`, `structure:setBlocksForDate`, `structure:setActivePlanner`, (optional) `structure:selectCategory`, `structure:cancelDay`.  
- New file(s): e.g. `structure.actions.ts` exporting handlers; each handler calls `getState()`, computes next slice, `dispatchState("state.update", { key: "structure", value })`.

---

## 6. Renderer Binding Plan

**Problem:** List molecule currently receives `content.items` from JSON only ([list.compound.tsx](src/04_Presentation/components/molecules/list.compound.tsx) lines 50–56, 94–106). There is no binding from `state.values.*` to list items. Field/Select already use `stateSnapshot.values[fieldKey]` in [json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx) (lines 1119–1164).

**Options:**

| Option | Description |
|--------|-------------|
| **A) Renderer convention: content.itemsFromState** | In JSON, set `content.itemsFromState: "structure.items"` (and optional `itemMapper: "structureToListItem"` or a mapper id). Renderer, before rendering List, resolves `stateSnapshot.values.structure.items` (or path from itemsFromState), maps to `{ label, behavior }[]`, and passes as `content.items`. |
| **B) Loader injection** | A loader or adapter runs before render: given screen tree + state, inject into the JSON tree a `List` node’s `content.items` from state (e.g. from `state.values.structure.items`). Renderer sees static content; no new convention in renderer. |
| **C) Dedicated StructureList compound** | New compound component (e.g. StructureList) that reads `state.values.structure` (or configurable key) and a slice (e.g. items), maps to list items, renders same as List. Registry maps type "StructureList" to this component. |

**Recommended: Option A (Renderer convention: content.itemsFromState + mapper).**

- **Rationale:** Single point of resolution (renderer); consistent with Field/Select pattern (state path → value); no new component to maintain; JSON declares binding. Mapper can be a small function or named adapter (e.g. structureItemToListItem) that maps `StructureItem` → `{ label, behavior }` (e.g. label = title, behavior = Action structure:updateItem or navigate to detail).
- **Exact JSON schema fields:**  
  - `content.itemsFromState`: string, state path (e.g. `"structure.items"`).  
  - `content.itemsFromStateMapper` (optional): string, name of mapper (e.g. `"structureToList"`); default = map item to `{ label: item.title, behavior: { type: "Action", params: { name: "structure:updateItem", id: item.id } } }`).
- **Code insertion points (later):** In [json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx), in the block where props are built for the node (before passing to Registry), if `resolvedNode.type === "List"` (or "list") and `resolvedNode.content?.itemsFromState`: (1) resolve path from stateSnapshot (e.g. `stateSnapshot.values.structure.items`); (2) if array, run mapper (from registry or inline); (3) set `props.content.items` to mapped array. Fallback: if path missing or not array, use `content.items` from JSON.
- **Mapping shape to List items:** `{ label: string, behavior?: { type: "Action", params: { name, ... } }, onTap?: () => void }`. Mapper produces this from each structure item.
- **Blocks list and week/month grid later:** Same convention can extend to `content.blocksFromState: "structure.blocksByDate.2025-02-15"` and a blocks mapper; or a separate compound (e.g. StructureBlocks) that reads blocks for a date. Week/month grid: either a grid compound that takes `content.cellsFromState` + date range, or a derived key in state (engine output) that provides cells; binding same idea.

---

## 7. JSON Integration Plan

### 7.1 Templates and Rules

- **planner-templates/*.json (industry templates):** One file per industry (e.g. personal, contractor, medical). Each file: tree (root + children), defaultTasks (optional), defaultBlocks (optional), rulesetId or inline rules. “Create from template” = load JSON, generate new ids for tree nodes and tasks, merge into state (or create new planner in planners map), set activePlannerId.
- **rulesets/*.json:** base.json (priorityScale, escalation, categoryInference defaults), industry-specific (e.g. contractor.json), user overrides (optional, loaded from state or file). Layering: resolveRules([base, industry, planner, user]) → single ResolvedRuleset.
- **No TSX for new industries:** Adding a new industry = add JSON template + optional ruleset; no new engines or actions.

### 7.2 app.json Plan Section

- **Current:** [app.json](src/01_App/apps-json/apps/hiclarify/app.json) has Plan tab and |PlanSection with Cards and Toolbar (lines 121–126). No list from state yet.
- **Minimal V1:** Add one List under |PlanSection with `content.itemsFromState: "structure.items"` and default mapper (or omit mapper and use default). Optional: add “Add task” button with action `structure:addItem` (form or simple prompt). Expandable: later add filters (by category, by date), blocks list, week view.

---

## 8. Universalization Beyond Planner

Same primitive supports:

| Domain | Change | Notes |
|--------|--------|-------|
| **Relationships (touchpoints)** | New template + ruleset; items = touchpoints; tree = contact groups. Same engines (aggregation, rule evaluator); no new engines. |
| **Business workflows (jobs)** | New template + ruleset; items = jobs/tasks; tree = clients/projects. Same scheduling, prioritization, recurrence. |
| **Diagnostics-driven suggestions** | Diagnostics write to `values.diagnostics_*`; planner (or structure) actions read and optionally adjust items or suggest; optional rule in rule evaluator “when diagnostics.X then suggest Y.” |
| **Decisions (signals/blockers)** | Items carry signals/blockers/opportunities; aggregation engine (same as decision aggregate generalized) produces recommendations. Rule set for weighting. |

**What changes:** Only JSON templates/rules + labels; no new engines. State key can stay `structure` with domain field or separate keys per app (e.g. `planner`, `relationships`) if preferred; both are “one key per domain.”

---

## 9. Testing & Validation Plan

### 9.1 Unit Tests (Per Engine)

- **date-utils:** Parse “today”, “tomorrow”, “next Monday” → expected ISO.
- **recurrence.engine:** nextOccurrences, isDueOn for daily/weekly/monthly.
- **progression.engine:** rampValueForDate for linear ramp.
- **scheduling.engine:** scheduledForDate with mock tasks and blocks.
- **prioritization.engine:** effectivePriority with escalation; sortByPriority.
- **aggregation.engine:** aggregateByDateRange; aggregateSignals.
- **rule-evaluator.engine:** evaluateRules with when/then; evaluateCondition.
- **structure-mapper.engine:** mapToCandidates with mock parse result and rules.

### 9.2 Golden Tests (Interpreter)

- **Input:** Fixed text (e.g. “Add buy milk tomorrow and call John on Friday”).  
- **Expected:** Parsed segments → interpreter → candidates (title, dueDate, etc.) + rule trace. Golden file or inline expected structure.  
- **Coverage:** Multi-task sentence, recurrence phrase, priority cue, category keyword, fallback (no match).

### 9.3 Integration Tests

- **JSON Action → state log → deriveState → UI binding:** Dispatch `structure:addItem`; assert log has one `state.update`; deriveState(log).values.structure.items includes new item; (if renderer binding implemented) List receives items from state.
- **Contract:** Action handler registered; state-resolver unchanged (generic state.update); no regression on existing intents.

### 9.4 Performance Tests

- **Log replay:** Replay log with N events (e.g. 10k state.update events); measure deriveState(log) time; set threshold (e.g. < 500 ms).
- **Planner slice size:** Structure slice with M items (e.g. 1k items); one state.update; measure handler + deriveState time.

### 9.5 Regression Tests

- Existing flows (learning, calculator, diagnostics, navigation, state:currentView, journal.add, layout.override) still run unchanged. No removal or change of existing intents or action handlers.

---

## 10. Implementation Steps Checklist (Do This in Order)

**Phase 1 — Contracts and engines (no UI)**

1. **Contracts document:** Create `architecture/STRUCTURE_CONTRACTS.md` (or add to this plan) with state shape, item shape, tree shape, ruleset shape. Acceptance: reviewable.  
2. **Engines — date-utils + recurrence + progression:** Add `src/05_Logic/logic/engines/structure/date-utils.ts`, `recurrence.engine.ts`, `progression.engine.ts`. Unit tests for each. Acceptance: tests pass. Failure: wrong calendar math; fix with test vectors.  
3. **Engines — scheduling + prioritization + aggregation:** Add `scheduling.engine.ts`, `prioritization.engine.ts`, `aggregation.engine.ts`. Unit tests. Acceptance: tests pass.  
4. **Engines — rule-evaluator + structure-mapper:** Add `rule-evaluator.engine.ts`, `structure-mapper.engine.ts`. Unit tests + golden test for mapper (parse result → candidates). Acceptance: tests pass. Failure: mapper returns wrong shape; fix mapping.  
5. **Actions — structure:* handlers:** Implement handlers for structure:addItems, addItem, updateItem, deleteItem, setBlocksForDate, setActivePlanner. Register in action-registry. Acceptance: dispatch structure:addItem → state.values.structure updated. Verify: run action, getState().values.structure.  
6. **State bootstrap (optional):** If app needs initial empty structure, ensure one-time seed or default screen action that dispatches state.update with key "structure" and initial slice. Acceptance: state.values.structure exists after bootstrap.

**Phase 2 — Parser and interpreter**

7. **Parser (stream → segments):** Implement or wire streaming ingestion (partial/final segments). Sentence splitting (multi-task → N). Output: parse result (segments, sentences). Acceptance: unit test with fixed input text → expected segments.  
8. **Interpreter (parse + rules → candidates):** Wire structure-mapper with parse result + rules + context. Intent detection (task/note/question/command). Extraction (title, due, recurrence, category, priority). Acceptance: golden test input text → expected candidates + trace.  
9. **Trace storage:** Optional key `structure_lastTrace` or dev-only; document. Acceptance: trace available for debug.

**Phase 3 — Renderer binding**

10. **itemsFromState in renderer:** In json-renderer, for List, if content.itemsFromState: resolve path from stateSnapshot, map to items (default mapper: item → { label: item.title, behavior: { type: "Action", params: { name: "structure:updateItem", id: item.id } } }). Pass to List. Acceptance: Plan section List shows items from state.values.structure.items. Verify: add item via action, refresh/list shows it.  
11. **app.json Plan section:** Set List content.itemsFromState = "structure.items". Optional Add task button. Acceptance: UI shows task list from state.

**Phase 4 — JSON and templates**

12. **Rulesets:** Add rulesets/base.json (and optional industry). Implement resolveRules(layers). Acceptance: engine receives merged rules.  
13. **Templates:** Add planner-templates/personal.json (tree + defaults). “Create from template” action or loader: load template, generate ids, dispatch state.update structure. Acceptance: new planner from template has tree and defaults.  
14. **No TSX for new industry:** Document: new industry = new JSON only. Verify by adding a second template and loading it.

**Phase 5 — Validation and performance**

15. **Integration test:** Action → log → deriveState → binding. Acceptance: automated test passes.  
16. **Performance test:** Log replay N events; planner slice M items. Acceptance: within thresholds.  
17. **Regression:** Run existing flow tests; no regressions.

**Verification commands (examples):**

- `npm test -- --grep "structure"` (unit tests).  
- `npm test -- --grep "integration"` (integration).  
- Manual: open app → Plan tab → add task (button or action) → confirm list updates.

---

## 11. Time / Complexity

| Phase | Fast path (hours) | Full universal (hours) |
|-------|--------------------|-------------------------|
| Phase 1 — Contracts + engines | 2–3 | 4–6 |
| Phase 2 — Parser + interpreter | 1–2 | 3–5 |
| Phase 3 — Renderer binding | 1 | 1.5–2 |
| Phase 4 — JSON/templates | 0.5–1 | 2–3 |
| Phase 5 — Tests + perf | 1 | 2–3 |
| **Total** | **5.5–8** | **12.5–19** |

**Fast path (4–6 hour build):** Phase 1 (engines only: date-utils, recurrence, prioritization, scheduling, one or two of aggregation/rule-evaluator/structure-mapper), Phase 3 (binding only: itemsFromState + default mapper), Phase 5 minimal (one integration test). Skip: full parser stream; full interpreter golden tests; multiple templates; performance tests.

**What pushes beyond 6 hours:** Full parser (streaming + sentence split + intent), full interpreter with all extraction rules, rule-evaluator + structure-mapper with full rule set, multiple industry templates, exhaustive golden tests, performance and regression suite.

**Minimal viable (fast path):** One state key `structure` with items + tree; structure:addItem/updateItem/deleteItem; scheduling + prioritization engines; List binding via itemsFromState; one ruleset (base); no streaming parser (form or single-line input only).

---

## 12. Minimal Necessary Runtime Code Changes (Specification Only)

The following are the **exact** code touch points to implement later (not in this plan):

| Location | Change |
|----------|--------|
| [state-resolver.ts](src/03_Runtime/state/state-resolver.ts) | None for V1 (state.update already supports any key). Optional: add `state.snapshot` for compaction later. |
| [state-store.ts](src/03_Runtime/state/state-store.ts) | None. |
| [behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts) | None; structure:* actions fall through to interpretRuntimeVerb → action-runner. |
| [runtime-verb-interpreter.ts](src/05_Logic/logic/runtime/runtime-verb-interpreter.ts) | None. |
| [action-runner.ts](src/05_Logic/logic/runtime/action-runner.ts) | None. |
| [action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts) | Register structure:* handlers (add only). |
| New files | `src/05_Logic/logic/engines/structure/*.ts` (8 engines); `src/05_Logic/logic/actions/structure.actions.ts` (or equivalent); rulesets/*.json; planner-templates/*.json. |
| [json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx) | For node type List (or list), if content.itemsFromState: resolve path from stateSnapshot, apply mapper, set props.content.items. |
| [list.compound.tsx](src/04_Presentation/components/molecules/list.compound.tsx) | No change (already consumes content.items). |
| [app.json](src/01_App/apps-json/apps/hiclarify/app.json) | Plan section: add List with content.itemsFromState and optional itemsFromStateMapper. |

---

*End of plan. No code modifications in this deliverable; all implementation is future work per this specification.*
