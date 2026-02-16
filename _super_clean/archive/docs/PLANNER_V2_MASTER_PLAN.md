# Planner System V2 — Master Architecture & Rebuild Plan

**Version:** 2  
**Mode:** Read-only system analysis + strategic plan  
**Scope:** JSON-first planner inside HiSense runtime; no implementation in this document.

---

## SECTION 1 — System Understanding

### How the planner fits into the current architecture

- **State:** The runtime has a single derived state tree built by `deriveState(log)` in `state-resolver.ts`. It exposes `journal`, `currentView`, `values` (generic key/value), and `layoutByScreen`. There is no planner-specific intent or slice today. The planner must live under **one key** in `state.values` (e.g. `planner`) because `state.update` supports only a single key and value per dispatch.

- **Actions:** The action pipeline is extend-only: `behavior-listener` → `runtime-verb-interpreter` → `action-runner` → `getActionHandler(name)` from `action-registry`. Any `planner:*` action name will reach the registry if registered. Handlers receive `(action, state)` and can call `dispatchState("state.update", { key: "planner", value: nextPlanner })`.

- **JSON UI:** Screens are defined in `apps-json` (e.g. `apps/hiclarify/app.json`). The root is a `screen` with `state.currentView` and `children`: `Stepper` (tabs), then `Section` nodes with `when: { state, equals }` so only one section renders. Sections have `layout` (e.g. `content-stack`) and `children` (Card, List, Toolbar). The Plan tab already exists; its section can be extended with planner-driven content.

- **Render path:** `ExperienceRenderer` / `JsonRenderer` receive the tree and `stateSnapshot` (state + state.values spread). They resolve `when` from `stateSnapshot.currentView`, then render Section children. Field/Select get controlled values from `stateSnapshot.values[fieldKey]`; List gets `content.items` from the node only—there is no built-in binding from a state path to list items.

- **Engines:** Logic lives in `05_Logic/logic/engines/` and `engine-system/`. Engines are invoked by actions or by other engines; they do not write state directly. Planner engines (recurrence, progression, scheduling, etc.) would be pure or read-only from state and return derived data; actions would call them and then dispatch state updates.

### JSON vs engine responsibilities

| Owned by JSON (config / structure) | Owned by engines (logic / math) |
|-----------------------------------|---------------------------------|
| Planner type (personal, business, contractor, etc.) | Recurrence next-occurrence math |
| Hierarchy tree (categories, nodes) | Ramp value for a given date |
| Default blocks template | Scheduling: which tasks appear on a date |
| Task/blocks schema shape | Priority score and escalation |
| Rulesets (which rules apply to which planner type) | Day → week → month aggregation |
| Recurrence and ramp *definitions* (enums, labels) | Streak calculation |
| UI layout (sections, lists, tabs) | Due-today / slot-status derivation |

JSON defines **what** (structure, types, rulesets, defaults). Engines define **how** (computations over that structure).

---

## SECTION 2 — Recommended Schema Model

### Task schema

```json
{
  "id": "string",
  "title": "string",
  "priority": 1,
  "categoryId": "string",
  "plannerId": "string",
  "recurringType": "daily|weekly|monthly|off|...",
  "recurringDetails": "string",
  "dueDate": "ISO date or null",
  "habit": {
    "startValue": 1,
    "targetValue": 10,
    "durationDays": 30,
    "timeSlots": ["08:00", "12:00"],
    "activeDays": ["M", "T", "W", "Th", "F"]
  },
  "log": ["ISO timestamp"],
  "lastCompleted": "ISO or null",
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

- `categoryId` points into the planner hierarchy. `plannerId` identifies which planner (or template) the task belongs to. Habit is optional; when present, progression and scheduling engines use it.

### Block schema

```json
{
  "id": "string",
  "label": "string",
  "start": 8.0,
  "end": 12.0,
  "color": "string or token",
  "taskIds": ["id1", "id2"]
}
```

- `start`/`end` as decimal hours (or time strings; one convention). Stored per date in `blocksByDate[dateISO]`.

### Planner tree schema (hierarchy)

```json
{
  "id": "string",
  "name": "Home",
  "type": "personal|business|contractor|medical|...",
  "children": [
    {
      "id": "cat-finances",
      "name": "Finances",
      "children": []
    },
    {
      "id": "cat-maintenance",
      "name": "Maintenance",
      "children": [
        { "id": "cat-house", "name": "House", "children": [] },
        { "id": "cat-garden", "name": "Garden", "children": [] }
      ]
    }
  ]
}
```

- Unlimited depth. Each node has `id`, `name`, optional `children`. Tasks reference `categoryId` = one of these node ids. This tree can live in JSON config or in `state.values.planner.tree` (or per-planner in a multi-planner model).

### Rules schema

```json
{
  "plannerType": "personal",
  "priorityScale": { "min": 1, "max": 10, "default": 5 },
  "escalation": {
    "enabled": true,
    "daysUntilEscalation": 3,
    "incrementPerDay": 1
  },
  "recurringEscalation": false,
  "cancelDayReset": "none|moveToNextDay|decrementPriority",
  "habitAsTask": true
}
```

- JSON defines the rules; the prioritization engine interprets them (e.g. escalation math, reset behavior).

### State shape (single key)

```json
{
  "planner": {
    "activePlannerId": "string or null",
    "planners": {
      "id": {
        "tree": { ... },
        "tasks": [],
        "blocksByDate": {},
        "rules": { ... }
      }
    }
  }
}
```

- Alternatively, a single planner: `planner: { tree, tasks, blocksByDate, rules }`. Multi-planner uses `planners` map and `activePlannerId`.

---

## SECTION 3 — Hierarchy Engine Plan

### How nested planners should work

- **Single tree per planner:** Each planner instance has one root tree (e.g. Home, Business). Tasks have `categoryId` referencing a node anywhere in that tree. Engines do not care about depth; they only need “all tasks” or “tasks for category X” (filter by `categoryId` or subtree).

- **Resolving “subtree”:** Given a node id, collect all descendant ids (from the tree JSON), then filter tasks where `categoryId` is in that set (or self). This can be a small pure function in a hierarchy util or engine.

- **No special “planner” entity for hierarchy:** The tree is just data. Duplication = copy the tree JSON (and optionally tasks/blocks) into a new planner object. No separate hierarchy “engine” is required for structure; only for any rules that depend on depth (e.g. “inherit priority from parent”) if desired later.

### How templates duplicate

- **Templates as JSON files:** e.g. `planner-templates/personal.json`, `contractor.json`, each containing:
  - `tree`: hierarchy
  - `defaultCategories`: optional seed nodes
  - `defaultTasks`: optional seed tasks
  - `rules`: ruleset
  - `defaultBlocks`: default day template

- **Creation flow:** User selects “Create from template → Contractor.” Loader reads `contractor.json`, generates new ids for tree and tasks, sets `activePlannerId` to new planner id, dispatches `state.update` with `planner: { ...merged, planners: { [newId]: templateCopy } }`. No engine needed for “duplicate”; only for subsequent scheduling/priority.

- **Unlimited depth:** Tree is recursive; UI can render with a recursive Section/List or a dedicated Tree molecule that walks `children`. No engine constraint on depth.

---

## SECTION 4 — Priority System Design

### Scaling model

- **1 → 10 scale:** Stored on each task as `priority`. Default from rules (e.g. 5). JSON rules define `min`, `max`, `default`. Sort order: higher number = higher priority (or configurable “high number = do first” vs “high = important but not urgent”).

- **Display/order:** Task list is sorted by priority (then optionally by due date, category). Engine can expose `sortTasks(tasks, rules)`.

### Escalation logic

- **Time-based:** If `escalation.enabled` and `dueDate` is in the past, increase effective priority by `incrementPerDay * daysOverdue`, capped at `max`. Formula: `effectivePriority = min(max, task.priority + (daysOverdue * incrementPerDay))`. Engine only; no JSON change.

- **Recurring escalation:** If a recurring task was due and not completed, next occurrence can get a higher priority (e.g. +1). Rule flag `recurringEscalation`; engine applies when computing “next occurrence” or when building the day list.

### Recurring behavior

- Recurrence type and details live on the task (JSON). Engine computes “next N occurrences” or “is due on date D.” Normalization (e.g. DB enum → internal code) in recurrence engine; enum and labels can be in JSON.

### Cancel-day reset model

- **Options in rules:** `cancelDayReset: "none" | "moveToNextDay" | "decrementPriority"`.
  - **none:** No automatic change; user can manually reschedule.
  - **moveToNextDay:** When user marks “cancel day,” engine moves due date to next day (or next occurrence for recurring).
  - **decrementPriority:** Decrease task priority by 1 (or by rule amount) when day is cancelled.

- Implementation: action `planner:cancelDay` with payload `{ date, taskIds? }`; handler calls engine to compute new due dates / priority; then dispatch updated planner state.

### Habits as tasks

- **Rule:** `habitAsTask: true` means habit tasks appear in the same list as one-off tasks and are ordered by the same priority/date logic. Habit-specific fields (`habit.startValue`, `timeSlots`, etc.) are used by progression and scheduling engines; the rest of the pipeline treats them as tasks with optional habit config.

---

## SECTION 5 — Engine Map

| Engine | Responsibility | Inputs | Outputs |
|--------|----------------|--------|---------|
| **scheduling** | Which tasks appear on a date; place into blocks | planner.tasks, date, blocksByDate[date], rules | scheduledItems[], optional blocks with taskIds |
| **recurrence** | Normalize type; next occurrence(s); is due on date | task, date | boolean or date[] or code |
| **progression** | Ramp value for a date | habit config, date | number (and “ramp active” flag) |
| **prioritization** | Effective priority; sort; escalation | task, date, rules | effectivePriority, sorted task list |
| **aggregation** | Day → week, week → month rollups | tasks, blocksByDate, date range | week summary, month summary (e.g. counts, completion) |

- **Hierarchy:** No dedicated “hierarchy engine”; tree is data. Optional util: “get subtree ids” or “tasks in category” for filtering.

- **Streak / due-today:** Can live in a small “habit” or “planner” util used by scheduling or UI: streak from `log`, due-today from `activeDays` + date.

---

## SECTION 6 — JSON Ownership Model

| In JSON (config / app) | In logic (TS/engine) |
|------------------------|----------------------|
| Planner type and template id | Recurrence next-occurrence math |
| Hierarchy tree (per planner or template) | rampLinearForDate(start, end, startDate, duration, date) |
| Task and block schema (as types or docs) | normalizeRecurringType(rt) |
| Default blocks template | evenTimes(count, start, end) |
| Rules: priority scale, escalation, cancel-day, habitAsTask | Scheduling: filter by due + recurrence + habit |
| Recurrence and ramp labels/enums | Priority escalation formula |
| Screen structure: Plan section, lists, tabs | sortTasks(tasks, rules) |
| Industry template files (personal, contractor, …) | Day/week/month aggregation functions |
| List item shape (label, behavior) when bound from state | Binding: state path → list items (renderer or adapter) |

- **Schema and defaults** in JSON; **evaluation and side-effect-free math** in engines; **state updates** only in actions.

---

## SECTION 7 — UI Binding Strategy

### Current molecule support

- **List:** Takes `content.items` array of `{ label, behavior }`. No state-path binding today. To show planner tasks: either (a) inject `items` from `state.values.planner.tasks` in the renderer when node has e.g. `content.itemsFromState: "planner.tasks"`, or (b) inject in the screen loader, or (c) a wrapper component that subscribes to state and renders List with mapped items.

- **Card:** Static or dynamic content (title, body). Can represent a block or a task row if content is bound (e.g. block label + time from state).

- **Section:** Has `when`, `layout`, `children`. Plan section already uses `when: { state: "currentView", equals: "plan" }`. Can contain multiple Lists (e.g. tasks list, blocks list) and Toolbars.

- **Stepper:** Used as tabs; already drives `currentView`. No change for planner.

### Trees and expandable hierarchy

- **Option A:** Recursive Section/List: each hierarchy node is a Section (or Card) with a List of children; `when` or a `children` array from state drives expansion. Possible with current molecules if the tree is expanded into a flat structure of sections keyed by parent.

- **Option B:** New “Tree” or “PlannerTree” compound that accepts `content.nodes` (tree) and renders indented rows with expand/collapse. Would need registry + compound. Tree data from `state.values.planner.tree` or from `planner.planners[id].tree`.

- **Option C:** Flat list with `categoryId` and optional `depth`; sort by hierarchy order and indent by depth. Single List with items from engine that flattens tree + tasks.

### Task rows and block rows

- **Task row:** List item with `label: task.title`, optional secondary text (due date, priority), `behavior: { type: "Action", params: { name: "planner:selectTask", id: task.id } }`. Items from `planner.tasks` (and optionally prioritization engine for order).

- **Block row:** Same idea; items from `planner.blocksByDate[today]` or default template. Label = block.label, body or subtitle = time range.

### Weekly / monthly views

- **Weekly:** Section with 7 columns (or 7 Cards/Lists), each bound to `blocksByDate[date]` or to scheduling output for that date. Requires either (1) a molecule that takes a date range and state path and renders multiple day cells, or (2) JSON that repeats a “day” block 7 times with different `date` params and a binding that fills each from state.

- **Monthly:** Similar; grid of days or list of weeks. Engine can supply “month view” data (e.g. counts per day); JSON defines layout; binding connects state to cells.

- **Binding gap:** Today the renderer does not resolve “content from state path” for List or Card. Closing that gap (one convention + one resolution point) is required for dynamic task list, blocks list, and week/month cells.

---

## SECTION 8 — V2 Build Phases

### Phase 1 — Core planner brain

- State: single key `planner` with `{ tasks, blocksByDate, tree? }` (minimal tree or flat categories).
- Actions: addTask, updateTask, deleteTask, setBlocksForDate.
- Engines: date-utils, recurrence (normalize + optional next occurrence), progression (ramp), scheduling (due today + habit slots + default blocks).
- UI: Plan section with one List bound to tasks (after binding exists) and one “add task” trigger. Optional blocks list for today.
- **Deliverable:** Add/edit/delete tasks, see them on Plan tab, see today’s blocks (default or saved).

### Phase 2 — Hierarchy

- Schema: planner tree (nested nodes with id, name, children). Tasks have categoryId.
- JSON: default tree per template; or single tree in state.
- Engine: optional “tasks in category” / “subtree ids” util.
- UI: Tree or recursive List/Section for categories; task list filtered by selected category or full list.
- **Deliverable:** Categories in JSON; tasks assigned to category; UI can browse by category.

### Phase 3 — Priority engine

- Schema: task.priority (1–10); rules (scale, escalation, cancel-day).
- Engine: prioritization (effective priority, sort, escalation, cancel-day reset).
- Actions: planner:setPriority, planner:cancelDay (optional).
- UI: Priority in task row; list ordered by priority (and optionally due date).
- **Deliverable:** Priority on tasks; auto-escalation and cancel-day behavior per rules.

### Phase 4 — Weekly / monthly

- Engine: aggregation (day → week, week → month): e.g. completion counts, overdue counts per day.
- UI: Week view (7 days), month view (grid or list). Data from state + aggregation engine; binding from state path to cells.
- **Deliverable:** Week and month views with derived metrics.

### Phase 5 — Industry templates

- JSON: planner-templates/*.json (personal, contractor, dental, medical, construction, household) with tree, defaultTasks, defaultBlocks, rules.
- Loader or action: “Create planner from template” copies template into state with new ids.
- **Deliverable:** User can create a new planner from a template; hierarchy and defaults come from JSON.

---

## SECTION 9 — Simplification Opportunities

### Where the system can become more powerful and generic

- **Single storage model:** One state key, one replay log. No Firestore, no WeekSync, no separate localStorage keys for habits vs tasks. All planner state is in `state.values.planner`. Sync and persistence are the same as for the rest of the app.

- **JSON-driven structure:** Hierarchy, rules, and defaults live in JSON. Adding a new industry = new JSON file, no new engine code. Priority and escalation behavior are parameterized by rules, not hard-coded.

- **Engines as pure math:** Recurrence, progression, scheduling, prioritization, aggregation are pure functions or read-only. They are easy to test and reuse. No hidden state in the planner except in `state.values.planner`.

- **Less code:** Legacy had habit logic in habitrackerdemo, day logic in dayview2, week in weeklyView, tasks in App/relationship2, and Firestore. V2 has one planner slice, one action surface, and a small set of engines. UI is JSON + one binding convention for dynamic lists/cells.

- **More scalable:** New planner type = new template JSON. New category = new node in tree. New rule = new rule object. No new components required for new industries if the molecule set supports tree and list.

### Comparison: old vs new

| Old system | New system |
|------------|------------|
| Firestore `tasks` + local habits + WeekSync in memory + day_chunks in localStorage | Single `state.values.planner` |
| Logic in multiple React components and weeklyView.js | Logic in engines; UI in JSON + registry |
| Recurrence and ramp buried in UI | Recurrence and progression in dedicated engines |
| No priority model | Priority 1–10 + escalation + rules in JSON |
| No hierarchy | Tree in JSON; tasks reference categoryId |
| Different apps (hiclarify vs HiSense) | One runtime; planner is one domain |

---

## SECTION 10 — Risk + Gaps

### What could break

- **Large planner state:** Very large `tasks` or `blocksByDate` can make log replay and re-renders slower. Mitigation: cap stored history (e.g. blocksByDate only for last N days), or archive old data to a separate key.

- **Binding contract:** If List binding expects `planner.tasks` but state has `planner.planners[id].tasks`, path is wrong. Document the exact state path and shape for bindings.

- **Action payload shape:** Handlers expect a certain payload (e.g. task object with id). If JSON sends a different shape, handlers must be defensive or the contract must be explicit.

### What needs new bindings

- **List (and similar) from state path:** Renderer or adapter must resolve e.g. `content.itemsFromState: "planner.tasks"` (and optionally a map expression) to `content.items` for the List. Without this, the Plan section cannot show dynamic tasks from state.

- **Optional: block list and week/month cells** from state paths or from engine output (e.g. `planner.scheduledToday`).

- **Optional: Tree compound** if the product wants an expandable hierarchy UI; otherwise recursive Section/List or flat list with depth.

### What is already supported

- **State:** `state.update` with key `planner` and value object. No resolver change.
- **Actions:** Registry is extend-only; `planner:*` actions will run when registered.
- **Pipeline:** JSON → action → handler → dispatchState → re-render. Subscribers get new state.
- **Plan tab:** Section with `when` currentView === "plan" exists; only content and binding need to be added.
- **Molecules:** List, Card, Section, Toolbar, Stepper exist. They can represent task rows, block rows, and layout; they need a source of dynamic items (state binding).
- **Layout:** Section layout (e.g. content-stack) and layout definitions already support the Plan section structure.

---

*End of Planner V2 Master Plan. This document is analysis and strategy only; no code or file changes beyond the creation of this plan file.*
