# Planner System V3 — Universal Structure Engine Plan

**Version:** 3  
**Mode:** Read-only analysis + strategic architecture  
**Premise:** The planner is not just a planner—it is a universal structure engine that can power planning, decisions, relationships, business workflows, diagnostics, life tracking, habits, hierarchy navigation, learning, industry templates, and multi-domain apps.

---

## System Reinterpretation

### Current system, briefly

- **State:** Single derived tree from an event log (`deriveState(log)`). Intents: `state:currentView`, `journal.set`/`journal.add`, `state.update` (key/value into `values`), `layout.override`, `scan.*`, `interaction.record`. No domain-specific intents; any new domain (planner, decisions, relationships) must fit under `values` or a new intent branch.
- **Engines:** Execution engines (learning, calculator, abc) consume `EducationFlow` and return transformed flow / step order. Aftermath processors (decision, summary) consume `EngineState` (step outcomes, signals, blockers). Flow-router uses `EducationFlow` + routing rules to compute next step. All are **flow/step/education-centric**; inputs and outputs are tied to the TSX-driven learning/flow model.
- **Actions:** Registry is extend-only; handlers receive `(action, state)`. They can read state and call `dispatchState`. No UI in the action layer.
- **JSON UI:** Screens are trees (screen → Stepper, Section, Card, List, Toolbar). Sections use `when: { state, equals }`. Content is mostly static from the tree; Field/Select get values from `stateSnapshot.values[fieldKey]`. List has no state-path binding.
- **Layout:** Section layout ids (e.g. content-stack), layout definitions, molecule layout params. Structure is JSON; resolution is in code.

### How well this supports “universal structured systems”

| Capability | Support | Gap |
|------------|---------|-----|
| Arbitrary hierarchy (tree) | Partial | Tree can live in `values`; no generic tree renderer or “filter by subtree” contract. |
| Domain-agnostic state | Good | `values` is key/value; any slice (planner, decisions, relationships) can live under one key. |
| Rule-driven behavior | Partial | Rules can live in JSON; **evaluation** requires engines. Current engines are flow-specific, not generic rule evaluators. |
| Multi-domain apps | Good | Multiple sections/tabs; each can bind to different state keys. No cross-domain engine today. |
| Industry templates | Good | JSON files can define structure and defaults; duplication is copy. No template loader contract. |
| Scheduling / recurrence / progression | Missing | No generic engines; would be new pure modules. |
| Prioritization / escalation | Missing | No engine; would be new. |
| Decisions from structured data | Partial | Decision engine exists but consumes EngineState (step outcomes), not planner or relationship state. |
| Diagnostics feeding planning | Conceptual | Diagnostics write to `values`; planner could read them. No defined “diagnostics → planner” pipeline. |

**Summary:** The **state and action pipeline** are already universal (key/value + event log + actions). The **engine layer** is not: it is built for education flows and step outcomes. To support a universal structure engine, the logic layer must be reassessed so that **structure and rules live in JSON** and **engines perform only math, interpretation, derivation, sorting, and aggregation** on that structure.

---

## Engine Refactor Direction

### Existing engines: TSX-centric and UI-coupled

- **learning.engine:** Takes `EducationFlow`; filters and reorders steps by signals (understand, learned, comprehension, etc.). **TSX/flow-centric.** Not reusable for planner or relationships without a different input type.
- **calculator.engine:** Flow-based calc steps; tied to flow structure. **Flow-centric.** The **calc math** (e.g. product-calculator, long-term-exposure) could be extracted as pure functions; the engine wrapper is flow-specific.
- **abc.engine:** Flow-based. **Flow-centric.**
- **decision (aggregate):** Consumes `EngineState` and outcomes; produces recommendations. **Input is step outcomes.** Logic (aggregate signals/blockers/opportunities) could be generalized to any “items with signals/blockers”; the **contract** is currently EngineState.
- **summary.engine:** Consumes state; produces export/summary. **Could be generalized** to “summarize any structured slice” if input were generic.
- **flow-router:** Uses `EducationFlow` and routing rules (when signals/blockers/opportunities, then skip/goto/repeat). **Routing rule evaluation** is generic; only the **input** (flow, step index, outcomes) is flow-specific.
- **json-skin.engine:** Binds JSON to state and layout. **UI-facing** but not “logic”; more of a bridge. Can remain; its role is to apply JSON-driven structure to the tree.

### Which engines can be reused

- **Pure calc functions** (e.g. in calculator/calcs): Reuse as pure math; callable from any action or engine. No refactor of contract; extract and call.
- **Decision aggregate logic:** Reuse pattern (accumulate, score, recommend) if we pass a generic “item list with signals/blockers” instead of EngineState. Refactor = new input shape + same aggregation idea.
- **Flow-router rule evaluation:** Reuse the “when/then” rule pattern for non-flow domains (e.g. “when priority > 8 and overdue, then escalate”). Refactor = generic rule input (JSON) + same evaluation pattern.

### Which must be rebuilt

- **Scheduling:** New. Input = tasks + date + rules; output = scheduled items / blocks. No current equivalent.
- **Recurrence:** New. Input = task + date; output = next occurrence(s) or “due on date.” No current equivalent.
- **Progression (ramp):** New. Input = habit config + date; output = value. No current equivalent.
- **Prioritization / escalation:** New. Input = tasks + rules + date; output = effective priority, sort order. No current equivalent.
- **Day/week/month aggregation:** New. Input = tasks + blocks + date range; output = rollups. No current equivalent.

### Which should become generic system engines

- **Rule evaluator:** Given a rule set (JSON) and a context (state slice + date + user), evaluate “when” conditions and return “then” actions or derived values. Flow-router’s rule logic, generalized. One engine, many rule sets.
- **Aggregator:** Given a list of items and a config (groupBy, sumBy, countBy, dateRange), return rollups. Summary/decision aggregation, generalized. One engine, many schemas.
- **Sorter:** Given a list and a sort config (priority, date, category order), return sorted list. Trivial but consistent with “engines only do math/derivation.”

### Target architecture

- **Pure engines:** No UI imports. Inputs: JSON config (rules, schema, defaults) + state slice(s) + optional context (date, userId). Outputs: derived data (lists, scores, next step, etc.).
- **JSON-driven inputs:** Structure, hierarchy, rules, and defaults come from JSON (files or state). Engines do not hard-code domain types.
- **State-driven outputs:** Engines return values; **actions** write to state via `dispatchState`. Engines never call dispatchState.
- **No UI coupling:** Engines do not know about Section, Card, or React. They operate on plain objects and arrays.

---

## JSON Rule Architecture

### What belongs in JSON

- **Priority scaling rules:** min, max, default, label map (e.g. 1 = Low, 10 = Urgent). Engine reads rules and applies math.
- **Escalation logic:** enabled, daysUntilEscalation, incrementPerDay, maxPriority. Engine interprets and computes effective priority.
- **Industry templates:** Full tree, default categories, default tasks, default blocks, ruleset id. Loader or action copies into state.
- **Hierarchy trees:** Nested nodes (id, name, children). No depth limit in JSON; engine or util walks the tree.
- **Planner types:** personal, business, contractor, medical, etc. as enum or registry in JSON; engines receive type and select ruleset.
- **Scheduling defaults:** Default day template (blocks), business hours, slot duration. Engine uses when no user override.
- **Progression models:** Linear ramp params (startValue, targetValue, durationDays); future: step or curve type in JSON. Engine computes value for date.
- **Recurrence definitions:** Enum and labels (daily, weekly, monthly, …); engine does next-occurrence math from type + details.

### What must remain in engines

- **Recurrence next-occurrence math:** Calendar arithmetic (next N occurrences, is due on D). Code only.
- **Ramp value for date:** `rampLinearForDate(start, end, startDate, duration, date)`. Code only.
- **Sorting and comparison:** Sort by priority, date, category order. Code only.
- **Aggregation:** Group by category, sum by week, count overdue. Code only.
- **Rule condition evaluation:** “When priority > 8 and dueDate < today” → boolean or action. Engine evaluates; rule structure is JSON.

### Stacking rule sets

- **Layering:** Multiple JSON rule sets can be composed. Example: base rules (priority 1–10) + industry rules (contractor escalation) + user overrides (my escalation = 2 days). Resolution order: user > industry > base. Single “resolveRules(domain, type, overrides)” that merges; engine receives resolved rules.
- **Inheritance:** A template can extend another. JSON: `"extends": "personal"`; loader merges tree and rules, then applies overrides. No engine change; merge at load time.

### Multiple rule layers combining

- **Priority:** Explicit order (e.g. [ "user", "planner", "industry", "base" ]). Each layer is a JSON object; merge in order, later keys overwrite earlier. Result is one effective ruleset per domain/planner.
- **Conflict:** Last-wins unless a rule explicitly marks “merge arrays” (e.g. escalation rules append). Optional convention in JSON: `"$merge": true` on a key to merge arrays instead of replace.

---

## State Model Confirmation

### The system is not a database

- **Incremental event log:** Every mutation is an intent + payload appended to `log`. State is never “patched” directly; it is **reconstructed** by replaying the log.
- **Reconstructable state:** `deriveState(log)` is pure. Same log ⇒ same state. No hidden mutable store.
- **Replayable decisions:** Rehydrate from localStorage = replay log = same state. Debugging and time-travel are feasible by replaying subsets of the log.
- **Stacked intelligence:** New intents (e.g. `planner:addTask`) append to the log; derivation includes the new event. “Stacking” = more events, richer state, same derivation contract.

### Sufficiency for planner and multi-planner

- **Planner:** One key `planner` with value `{ tree, tasks, blocksByDate, rules, activePlannerId }` (or single-planner shape). All planner mutations go through actions that read state, compute next state, and dispatch one `state.update` with key `planner`. **Sufficient.**
- **Multi-planner:** Same. `planner.planners` is a map; `planner.activePlannerId` selects current. Actions and engines treat “current planner” as a slice of state. **Sufficient.**

### Sufficiency for a universal system layer

- **Multiple domains:** Each domain can have one or more keys under `values` (e.g. `planner`, `decisions`, `relationships`, `diagnostics`). Same event log, same derivation. Domains do not need separate logs. **Sufficient.**
- **Cross-domain reads:** An action or engine can read `getState().values.planner` and `getState().values.diagnostics` and combine them (e.g. “suggest plan based on diagnostics”). No new state model. **Sufficient.**
- **Limitation:** Very large logs may slow replay. Mitigation: cap log size, or archive old segments and re-bootstrap state from a snapshot + tail. For V3, the model is sufficient; scaling is an operational concern.

---

## Hierarchy Expansion Model

### Conceptual structure (already in V2 plan)

- **Home:** Finances, Maintenance (House, Garden, Repairs), Health, etc.
- **Business:** Clients, Projects, Operations, Marketing, etc.
- **Personal:** Health, Relationships, Growth, etc.
- **Vehicles:** Car, Truck (under Maintenance or standalone).

### Maximum depth capability

- **No fixed limit in JSON.** Trees are recursive `{ id, name, children[] }`. Engines that “walk” the tree (e.g. collect subtree ids, filter tasks by category) use recursion or iterative stack. Depth is only limited by stack size or a configured max (e.g. 20) to avoid abuse. **Unlimited depth is feasible.**

### Recursion feasibility

- **Resolution:** “Tasks in category X” = collect all descendant ids of X from the tree, then filter tasks where `categoryId` is in that set (or equals X). Single recursive or iterative pass. **Feasible.**
- **Rendering:** UI can render recursively (Section per level, or Tree compound that walks children). **Feasible.**

### Performance impact

- **Shallow trees (depth 2–4):** Negligible. Small arrays, few iterations.
- **Deep trees (depth 10+):** Still small data; worst case is one walk per “get tasks for category.” Acceptable for in-memory state.
- **Large task lists (thousands):** Filtering/sorting by category or priority is O(n) or O(n log n). Acceptable. If needed, index by categoryId in the engine (build a map once per state read).

### How templates can replicate trees

- **Copy on create:** “Create from template” loads template JSON (tree + default tasks + rules). Generate new ids for nodes and tasks (UUID or nanoid). Insert into `state.values.planner` (or into `planner.planners[newId]`). No “live link” to template; it’s a one-time copy. **Replication is trivial.**

---

## Cross-Domain Application Map

| Domain | How planner/structure model extends | Shared primitives |
|--------|-------------------------------------|--------------------|
| **Personal life** | One planner tree (Home, Health, Finances, …); tasks and habits. | Tree, task, block, rules. |
| **Business operations** | Planner type “business”; tree (Clients, Projects, Ops); tasks with due dates and priority. | Same; ruleset differs. |
| **Contractor workflows** | Jobs, materials, equipment as categories; scheduling and recurrence for jobs. | Same + scheduling engine. |
| **Medical/dental** | Appointments, procedures, follow-ups; recurrence and priority. | Same + industry template. |
| **Maintenance tracking** | Assets (House, Garden, Vehicles) as tree; tasks = maintenance items; recurrence. | Same. |
| **Financial systems** | Categories = accounts or buckets; “tasks” = transactions or goals. | Tree + items; aggregation engine. |
| **Relationship tracking** | Tree = contact groups or relationship types; “tasks” = touchpoints or goals. | Same; different labels. |
| **Decision modeling** | Decisions as items with signals/blockers/opportunities; aggregate engine. | Rule evaluation + aggregation. |
| **Habit intelligence** | Habits = tasks with habit config; progression engine. | Task + progression. |
| **Educational paths** | Learning steps as a tree or sequence; flow-router-like rules from JSON. | Tree/sequence + rule evaluator. |
| **Diagnostics mapping** | Diagnostics write to `values`; planner (or decision) reads and suggests. | State keys; no new primitive. |

The **planner model** (tree + items + rules + time) becomes the **universal life-structure model** when:

- The **tree** is generic (any labels, any depth).
- **Items** (tasks) are generic (title, priority, categoryId, dates, recurrence, optional habit/recurrence config).
- **Rules** are in JSON (priority scale, escalation, cancel-day, etc.).
- **Engines** are generic (scheduling, recurrence, progression, prioritization, aggregation) and do not assume “planning” semantics—they assume structure.

Same architecture; different templates and labels.

---

## Simplification Strategy

### Where the system can become simpler and more universal

1. **Single structure primitive:** One “item” shape (task-like) and one “tree” shape. Planner, relationships, decisions, and diagnostics all use items-in-a-tree or items-with-signals. No separate “habit” vs “task” storage; habit is an optional block on the item. **Fewer concepts.**

2. **One event log:** No separate Firestore or WeekSync. All mutable state is in the log and derived. **One persistence model.**

3. **Engines as pure functions:** No flow or step types inside engines. Input = (config, stateSlice, context). Output = derived data. **Reusable across domains.**

4. **Rules in JSON only:** No rule logic in TS except “evaluate(rule, context).” All rule content (priority scale, escalation, routing when/then) in JSON. **Easier to add industries.**

5. **Templates as JSON files:** New industry = new JSON file. No new code. **Scalable.**

6. **Binding convention:** One convention (e.g. `content.itemsFromState: "planner.tasks"`) for “list from state.” One resolution point in the renderer or adapter. **Less special-case UI.**

### Power multipliers (high-impact upgrades)

- **Stacking rule sets:** User + planner + industry + base. One merge and evaluate. More flexible without more engines.
- **Cross-engine pipeline:** Scheduling engine outputs “scheduled today”; prioritization engine sorts; aggregation engine rolls up week. Actions orchestrate; each engine is pure. **Composable.**
- **Decision + planning fusion:** Decision engine (or a generic aggregate) consumes planner state: e.g. “overdue tasks” as blockers, “completed today” as signals. Recommendations can suggest next task. **One state, multiple views.**
- **Diagnostics feeding planning:** Diagnostics write to `values.diagnostics_*`. Planner actions can read and adjust (e.g. “low battery → suggest shorter blocks”). **Optional later.**
- **Planning feeding decisions:** Planner state (e.g. completion rate, overdue count) as input to decision aggregate. **Same pattern.**
- **Life-graph structures:** If “relationships” are also tree + items (contacts, touchpoints), the same hierarchy engine and aggregation can support “relationship health” or “next contact.” **One structure, many domains.**
- **Sensor inputs later:** Camera, gyro, location as future state or context. Engines stay pure; they receive “context” that can include sensor-derived data. **Extensible.**

Focus: **simpler** (one structure, one log, one binding), **more powerful** (stacked rules, cross-engine, fusion), **more universal** (any industry from JSON).

---

## V3 Build Phases

### Phase 1 — Core structure engine (planner brain)

- State: `values.planner` = { tree, tasks, blocksByDate, rules } (single planner).
- Actions: addTask, updateTask, deleteTask, setBlocksForDate.
- Engines: date-utils, recurrence (normalize + next occurrence), progression (ramp), scheduling (due today, slots, default blocks). All pure; inputs from state + JSON rules.
- JSON: Task and block schema; default rules; default tree and blocks template.
- UI: Plan section with task list (after state→list binding) and add-task. Optional blocks list.
- **Outcome:** Planner works as universal “items + tree + time” with one state key and generic engines.

### Phase 2 — Hierarchy and templates

- Tree: Nested nodes; tasks have categoryId. Optional “tasks in category” util.
- Templates: JSON files per industry (personal, contractor, medical, …). Loader or action “create from template” copies into state with new ids.
- UI: Tree or recursive list for categories; filter tasks by category.
- **Outcome:** Any industry can be added by adding JSON; no new code.

### Phase 3 — Priority and rules engine

- Rules in JSON: priority scale, escalation, cancel-day, habitAsTask.
- Engine: prioritization (effective priority, sort, escalation, cancel-day). Reads rules from state or config.
- Actions: setPriority, cancelDay (optional).
- **Outcome:** Behavior is data-driven; new behaviors = new rules in JSON.

### Phase 4 — Generic rule evaluator and aggregator

- Rule evaluator: Generic “evaluate(ruleSet, context)” used by flow-router (if kept), prioritization, and future decision/planner fusion. Input = JSON rules + context.
- Aggregator: Generic “aggregate(items, config)” for day/week/month and for decision-style summaries. Input = list + groupBy/sumBy/countBy/dateRange.
- **Outcome:** Reusable engines for any domain that needs rules or rollups.

### Phase 5 — Cross-domain and fusion

- Decision/planner fusion: Decision aggregate (or new “recommendation” engine) can accept planner slice (e.g. overdue, completed) as input and produce recommendations.
- Diagnostics → planner: Optional action or engine that reads diagnostics and suggests plan changes.
- Multi-planner UI: Switch active planner; each planner has its own tree, tasks, blocks, rules.
- **Outcome:** Planner is one instance of the universal structure engine; other domains (decisions, relationships) can use the same engines and state pattern.

---

## Risks + Limits

### Risks

- **Engine refactor scope:** Existing execution engines (learning, calculator, abc) are flow-coupled. Replacing them with JSON-driven logic may require a parallel “flow 2.0” that is driven by JSON structure and generic rule evaluation. Risk: breaking existing flows. Mitigation: keep legacy engines behind a feature flag or route; introduce new engines and new flow format alongside.
- **State key design:** If we split planner into multiple keys (e.g. `planner_tasks`, `planner_blocks`) for convenience, we lose atomic updates and add complexity. Mitigation: one key per domain (e.g. `planner`); large updates replace the whole slice.
- **Binding contract:** If different screens expect different shapes for `planner.tasks` (e.g. with vs without computed priority), UI can break. Mitigation: document the “canonical” shape; engines that add computed fields should do so in a derived view, not mutate stored state.
- **Template id collision:** Copying a template with fixed ids could collide if two planners share the same template. Mitigation: always generate new ids on copy (nodes and tasks).

### Limits

- **Log size:** Event log grows unbounded unless we cap or archive. For very long-lived sessions, replay cost can grow. Limit: operational (snapshot + tail, or periodic reset).
- **Depth of tree:** Theoretically unlimited; practically, UI and performance may want a cap (e.g. 20). Limit: configurable max depth in tree walk.
- **Engine purity:** As long as engines do not dispatch state or read outside (config + state + context), they stay testable and reusable. Limit: discipline; no UI in engines.

### What is already supported

- State: `values` + `state.update`; sufficient for planner and multi-domain.
- Actions: Extend-only registry; any `domain:action` pattern works.
- JSON UI: Sections, tabs, List, Card; only missing state→list (and optional state→cells for week/month).
- Replay and persistence: Log replay and localStorage are sufficient for universal state.

---

## Final Strategic Assessment

### Planner as structural primitive

The planner is best treated as a **structural primitive**: a generic “tree + items + rules + time” model that can back planning, habits, relationships, business workflows, diagnostics mapping, and learning paths. The same state shape (hierarchy, items with optional habit/recurrence, rules) and the same engine types (scheduling, recurrence, progression, prioritization, aggregation) apply across domains. **Specialization is in JSON (templates and rules), not in code.**

### Universality

The architecture **can** extend to the listed domains (personal, business, contractor, medical, maintenance, financial, relationship, decision, habit, educational, diagnostics) **if**:

1. **Engines are generalized** to accept JSON config and state slices instead of EducationFlow and EngineState.
2. **Rules live in JSON** and are evaluated by a generic rule engine.
3. **One binding convention** connects state paths to list (and optionally grid) content.
4. **Templates are JSON** and are copied into state with new ids on “create from template.”

### Rebuild strategy in one sentence

**Move structure, rules, and hierarchy into JSON; implement a small set of pure, generic engines (scheduling, recurrence, progression, prioritization, aggregation, rule evaluation); keep state as a single event log and derived state; and expose one state key per domain (e.g. `planner`) so that the planner—and any future domain that fits the same primitive—is driven by data, not by TSX.**

### Foundation for next generation

V3 establishes:

- **JSON as system brain** for structure, rules, and templates.
- **Engines as math and interpretation only** with no UI or flow coupling.
- **State as incremental log** that is reconstructable and replayable.
- **Planner as first instance** of a universal structure engine that can be replicated for other domains with the same architecture and different JSON.

This document is analysis and strategy only. No code or file changes beyond the creation of this plan.
