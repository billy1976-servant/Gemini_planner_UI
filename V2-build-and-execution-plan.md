# V2 Build and Execution Plan — Full System Audit

**Constraint:** V2 retains 100% of V1 scope. Only refine, clarify, and fill gaps. Do not remove systems or propose new architecture directions.

---

## A) What Already Exists and Is Working

| Component | Location | Status |
|-----------|----------|--------|
| **Prioritization engine** | `prioritization.engine.ts` | Implemented: `effectivePriority`, `sortByPriority`, `isVisibleInWeekView`, `applyCancelDay`. Uses `item.priority`, optional `priorityRamp` (days until due), and `escalation` (overdue). All logic is pure and in use. |
| **Recurrence engine** | `recurrence.engine.ts` | Implemented: `isDueOn`, `nextOccurrences`. Supports daily, weekly (with recurringDetails e.g. sat), monthly, quarterly. Used by view models and scheduling. |
| **Parser V4 pipeline** | `parser-v4.engine.ts` | Implemented: `tokenize`, `parseLooseDate`, `scoreMatch`, `findBestRowAndTask`, `buildRow`, `runPhrasePipeline`. Consumes `TaskTemplateRow[]` with folder/subfolder/category/task/taskAlternatives. |
| **Structure types** | `structure.types.ts` | Complete: `StructureItem`, `Block`, `ResolvedRuleset` (priorityScale, priorityRamp, visibilityMinPriority, escalation, cancelDayReset, schedulingDefaults, etc.), `TaskTemplateRow`, `StructureTreeNode`. |
| **Task tree engine** | `task-tree-engine.ts` | Implemented: `foldersList`, `subByFolder`, `catBySub`, `flattenTreeToFSC`. Pure; builds folder → subfolder → category index from `StructureTreeNode[]`. |
| **Date helpers** | `date-helpers.ts` | Implemented: `toKey`, `fromHM`, `toMin`, `getWeekDates`, `getMonthCells`, `addDays`, `betweenTs`. Used by planners and engines. |
| **Structure actions** | `structure.actions.ts` | Implemented: add/update/delete item, setBlocksForDate, cancelDay (calls `applyCancelDay`), calendar set day/week/month, addFromText, parseToStaging, confirmStaging, setTaskTemplateRows, setTaskFolderTemplate, setParserConfig. Tree initialized from `BASE_PLANNER_TREE` when empty. |
| **usePlannerViewModels** | `usePlannerViewModels.ts` | Implemented: `useDayViewModel` (selectedDate, blocks, items sorted by `sortByPriority`, rules from slice), `useWeekViewModel` (itemsByDay with `isVisibleInWeekView` + sortByPriority, rules), `useMonthViewModel` (cells, rollupByKey). All use `slice.rules` when present. |
| **JSX_DayView** | `JSX_DayView.tsx` | Working: header nav, time blocks list, tasks list. Uses `useDayViewModel`; items are sorted by effective priority. Displays **raw** `item.priority` (see C). |
| **JSX_WeekView** | `JSX_WeekView.tsx` | Working: 7-day grid, items per day from `itemsByDay` (visibility + sort applied). Calls `calendar:setWeek` on mount. |
| **JSX_MonthView** | `JSX_MonthView.tsx` | Working: 42-cell grid, rollup counts. Calls `calendar:setMonth` on mount. |
| **JSX_ConfirmList** | `JSX_ConfirmList.tsx` | Working: draft input, Parse to staging (`structure:parseToStaging`), row status (use/add_use/pending), Confirm (`structure:confirmStaging`). Reads `structure.parserStaging`. |
| **Staging + Confirm flow** | Actions + JSX_ConfirmList | End-to-end: parseToStaging uses V4 pipeline when `taskTemplateRows` exist (else extreme-mode); confirmStaging adds rows with status use/add_use to structure.items. |
| **Ruleset definition** | `rulesets/base.json` | Exists: priorityScale 0–10, escalation on, cancelDayReset "none", schedulingDefaults, categoryInference, priorityInference, habitDefaults. **Does not include priorityRamp or visibilityMinPriority.** |
| **Scheduling engine** | `scheduling.engine.ts` | Implemented: `scheduledForDate` (filters by isDueOn, assigns to blocks). Not yet wired into DayView as primary source for “scheduled” list (DayView shows blocks + tasks separately). |
| **Base planner tree** | `base-planner-tree.ts` | Exists: Life → home, business, health, relationships, finance, projects, travel, maintenance, growth (one level; no subfolders/categories). Used to seed structure.tree and to build default task template rows. |

---

## B) What Exists but Is Not Connected

| Item | Where it exists | What is not connected |
|------|-----------------|------------------------|
| **priorityRamp** | Implemented in `prioritization.engine.ts` (lines 21–37); type in `ResolvedRuleset` | **Disabled in practice:** (1) Not present in `base.json`, so no ramp values in rules. (2) `structure.rules` is never populated from any ruleset file (see D). So ramp is never applied. **Confirmed: priorityRamp is implemented but disabled.** |
| **visibilityMinPriority** | Implemented in `isVisibleInWeekView` in prioritization.engine; type in ResolvedRuleset | Not in base.json; structure.rules empty. Week view therefore never filters by minimum priority (all items shown). |
| **cancelDayReset** | In base.json as "none"; applyCancelDay in engine; structureCancelDay action exists | No UI invokes structureCancelDay; cancelDayReset is "none" so even if called, no change. |
| **Task tree engine** | `task-tree-engine.ts` (foldersList, subByFolder, catBySub, flattenTreeToFSC) | **Not wired to parser or planner UI.** Parser uses `taskTemplateRows` from slice or getDefaultTaskTemplateRows() (derived from BASE_PLANNER_TREE only). No code calls foldersList/subByFolder/catBySub/flattenTreeToFSC for the planner or for building template rows. **Confirmed: tree engine present but not wired to parser.** |
| **TaskFolderTemplate / taskTemplateRows** | structure.actions: slice.taskFolderTemplate, slice.taskTemplateRows; actions structureSetTaskFolderTemplate, structureSetTaskTemplateRows | **Parser uses default template, not real TaskFolderTemplate.** structureParseToStaging uses `slice.taskTemplateRows` if length > 0, else `getDefaultTaskTemplateRows()` (hardcoded from BASE_PLANNER_TREE + small alternatives map). No loader fills taskTemplateRows from the full Task Folder Details table (folder → subfolder → category → task + taskAlternatives). **Confirmed: parser using default template instead of real TaskFolderTemplate.** |
| **Ruleset (base.json)** | File at `apps-json/rulesets/base.json` | **Never loaded into state.** structure slice initializes with `rules: {}`. No action or bootstrap fetches base.json (or template’s rulesetId) and merges into structure.rules. So prioritization and visibility use empty rules (scale defaults only; no ramp, no visibilityMinPriority, escalation runs with item.dueDate only). **Confirmed: rules are not loading into structure.rules.** |
| **Day/Week/Month planners** | JSX_DayView, JSX_WeekView, JSX_MonthView | Not mounted as the main Planner screen. App navigates to HiClarify/planner_screen which serves JSON placeholder (or 404). TSX Day/Week/Month views exist but are not the route target. |
| **Section scheduling (SCHEDULED WORK DAY / section menus)** | Design only (image) | No UI for “Change to: Workday / Day Off / Project Day” or “Pick a Project (e.g. Gardening Folder)” or per-section “Change AFTERNOON to: Work / Cancel / Replace / Family / Project.” Blocks are set via structureSetBlocksForDate only. |

---

## C) What Exists but Is Incomplete

| Item | Current state | Gap |
|------|---------------|-----|
| **effectivePriority and recurrence** | effectivePriority uses only `item.dueDate` (single ISO date) for ramp and escalation | **Recurring tasks:** For items with `recurrence` (e.g. weekly Saturdays), there is no “next due date” passed to the priority logic. Ramp/escalation either skip (no dueDate) or use a stale dueDate. **Confirmed: effectivePriority ignores recurrence.** Recurrence engine has nextOccurrences/isDueOn but prioritization does not call it. |
| **DayView priority display** | JSX_DayView line 149: `P{item.priority}` | **Shows raw priority, not effective priority.** useDayViewModel already returns sorted-by-effective-priority items and exposes `rules`. DayView should display effectivePriority(item, refDate, rules) for the badge. **Confirmed: DayView showing raw priority instead of effective priority.** |
| **Planners and full rule integration** | View models pass slice.rules to sortByPriority and isVisibleInWeekView | Because structure.rules is always {}, only default scale and escalation (with item.dueDate) apply. priorityRamp and visibilityMinPriority never apply. **Confirmed: planners use engines but not full rule integration (rules empty).** |
| **addFromText path** | structureAddFromText uses streamToCandidates (extreme-mode-parser → structure-mapper) | Does **not** use V4 parser or TaskTemplateRow. Uses structure-mapper’s inferCategory/inferPriority (keyword-based) and extractDatePhrase/extractRecurrence. So “add from text” in app does not use the folder/subfolder/category template; only parseToStaging → confirmStaging does. |
| **Tree shape** | BASE_PLANNER_TREE has one level under Life (home, business, …) | Task Folder Details table is folder → subfolder → category → task. Tree has no subfolder or category level; task-tree-engine expects 3-level tree (folder → subfolder → category). So full hierarchy exists in design/table only, not in structure.tree. |
| **Cancel-day for recurring** | applyCancelDay only adjusts items where item.dueDate === ref (exact date match) | Recurring tasks may not have dueDate set to that day; isDueOn is date-based. So cancel-day may not move or decrement recurring items that are “due” that day by recurrence. |

---

## D) What Is Missing

| Item | Notes |
|------|-------|
| **Ruleset loading** | No code path loads base.json (or ruleset by id) into `state.values.structure.rules`. Required for priorityRamp, visibilityMinPriority, cancelDayReset to take effect. |
| **priorityRamp and visibilityMinPriority in base.json** | base.json does not define priorityRamp or visibilityMinPriority. Must add them for ramp and week-view filter to work. |
| **Recurrence-aware effective priority** | prioritization.engine should, when item has recurrence, compute “next due date” (e.g. next occurrence on or after ref date) and use that for ramp and escalation instead of item.dueDate. Recurrence engine already exposes nextOccurrences/isDueOn. |
| **Task Folder Details as single source** | No JSON or loader for the full Task Folder Details table (folder, subfolder, category, task, taskAlternatives). Need: (1) asset or API that provides TaskTemplateRow[] (and optionally tree), (2) bootstrap or action that sets structure.taskTemplateRows (and optionally structure.tree) from it so parser and tree engine use one source. |
| **Tree with 3 levels** | structure.tree (and BASE_PLANNER_TREE) are 2-level (Life → folders). Task Folder Details implies 3 levels (folder → subfolder → category). Need either tree expansion or derivation of template rows from table without requiring full tree in state. |
| **Continuous time grid in DayView** | DayView shows blocks as a list and tasks as a list. No single continuous time axis (e.g. 06:00–24:00) where blocks can span arbitrary start–end; no prevention of “break in hours” between sections. JSX_planner_test has chunk-based layout (Morning/Lunch/Afternoon/Evening) with gaps. |
| **Section scheduling UI** | No SCHEDULED WORK DAY or SCHEDULED [section] menus; no “Pick a Project (e.g. Gardening Folder)” or folder → subfolder → category picker wired to blocks or day template. |
| **Planner route → DayView** | Navigation to planner does not render JSX_DayView (or Week/Month). Need to point planner_screen route at TSX that renders DayView (or shell with day/week/month + grid). |
| **Availability / “free for 2 hours”** | No engine or state for availability windows that reprioritize or filter suggestions. Defer per V1. |

---

## E) What Should NOT Be Rebuilt

- **Prioritization engine:** Keep as-is; add recurrence-aware “next due” input only.
- **Recurrence engine:** Keep as-is.
- **Parser V4 pipeline:** Keep as-is; feed it real taskTemplateRows from Task Folder Details.
- **Task tree engine:** Keep as-is; wire its output to planner UI and optionally to template row derivation.
- **Structure actions and state shape:** Keep single structure slice; add rules loading and taskTemplateRows loading only.
- **usePlannerViewModels:** Keep; they already use rules and engines correctly once rules are populated.
- **JSX_DayView / WeekView / MonthView / ConfirmList:** Keep; extend DayView with continuous grid and effective-priority display; do not replace.
- **Types (structure.types.ts):** Keep ResolvedRuleset, TaskTemplateRow, StructureTreeNode, etc.
- **base.json and ruleset concept:** Keep; extend with priorityRamp and visibilityMinPriority and add loading path.

---

## F) What Must Be Added to Reach Full System Vision

1. **Load ruleset into structure.rules**  
   Add bootstrap or action (e.g. on app init or when opening planner) that fetches ruleset (e.g. base.json by id or path) and merges into `structure.rules`. Ensure getSlice() or first read sees populated rules when a ruleset is selected.

2. **Add priorityRamp and visibilityMinPriority to base.json**  
   Example: `"priorityRamp": { "daysOutForMin": 7, "daysOutForMax": 0, "minPriority": 1, "maxPriority": 10 }`, and optionally `"visibilityMinPriority": 6`.

3. **Recurrence-aware effective priority**  
   In prioritization.engine, for items with recurrence: compute next due date (e.g. first of nextOccurrences from ref date) and use it for ramp and escalation; for items without recurrence, keep current dueDate behavior.

4. **Task Folder Details integration**  
   Add JSON (or API) for full Task Folder Details table. Add loader that sets structure.taskTemplateRows (and optionally structure.tree) from it so parser and planner use one source. Parser already consumes taskTemplateRows; ensure addFromText path can optionally use V4 with same rows or keep extreme-mode for quick add.

5. **DayView: show effective priority**  
   In JSX_DayView, use effectivePriority(item, refDate, rules) for the badge (and optionally add “Priority only 6–10” filter using visibilityMinPriority or local state).

6. **Wire planner route to DayView**  
   Make HiClarify/planner_screen (or equivalent) render JSX_DayView (or a shell with day/week/month tabs and DayView as default). No new architecture; only routing/embedding.

7. **Continuous time grid in DayView**  
   Replace or augment the blocks list with a single continuous time axis (e.g. 15 or 30 min slots from day start to day end). Allow blocks to span any range; no section boundaries that split appointments. Reuse date-helpers for time math.

8. **Section scheduling (SCHEDULED WORK DAY / section menus)**  
   Add UI that reads folder/subfolder/category from task-tree-engine or Task Folder Details, and updates blocks or day template per section. Persist section-to-project in state; reflect in DayView.

9. **Cancel-day UI and optional rule**  
   Expose “Cancel day” in planner UI (e.g. day header menu) that calls structureCancelDay. Optionally set cancelDayReset in base.json to "moveToNextDay" or "decrementPriority" and document recurring-item behavior (extend applyCancelDay for recurrence if needed).

---

## G) Final Staged Build Order (Updated)

**Stage 1 — Rules and priority (no new engines)**  
1. Add priorityRamp and visibilityMinPriority to base.json.  
2. Implement ruleset loading into structure.rules (bootstrap or structure:loadRuleset).  
3. DayView: display effectivePriority(item, refDate, rules) and optional “Priority only 6–10” filter.  
4. Recurrence-aware effective priority in prioritization.engine (use next due from recurrence when present).

**Stage 2 — Task Folder Details and parser**  
5. Add Task Folder Details JSON (or source) and loader; set structure.taskTemplateRows (and optionally structure.tree) so parser and tree engine use one source.  
6. Keep staging + confirm flow; ensure parseToStaging uses loaded taskTemplateRows. Optionally add addFromText path that uses V4 when rows exist (or keep extreme-mode as default for quick add).

**Stage 3 — Planner layout and grid**  
7. Wire planner route to TSX that renders JSX_DayView (or day/week/month shell with DayView default).  
8. Add continuous time grid to DayView (single axis, blocks can span any range); keep blocks + tasks data from structure.

**Stage 4 — Section scheduling and cancel-day**  
9. Add SCHEDULED WORK DAY and per-section SCHEDULED [section] menus using tree/task folder data; persist section-to-project and reflect in DayView.  
10. Expose Cancel day in UI; optionally set cancelDayReset and extend applyCancelDay for recurring items if required.

---

## Specific Confirmations (Audit Checklist)

| Question | Answer |
|----------|--------|
| Is priorityRamp implemented but disabled? | **Yes.** Implemented in prioritization.engine; not in base.json; structure.rules never populated, so ramp never runs. |
| Are rules not loading into structure.rules? | **Yes.** No code loads base.json or any ruleset into structure.rules; slice initializes with rules: {}. |
| Does effectivePriority ignore recurrence? | **Yes.** It uses only item.dueDate for ramp and escalation; does not call recurrence engine for “next due.” |
| Is the tree engine present but not wired to parser? | **Yes.** task-tree-engine is not called by parser or planner UI; parser uses getDefaultTaskTemplateRows() from BASE_PLANNER_TREE only. |
| Is parser using default template instead of real TaskFolderTemplate? | **Yes.** structureParseToStaging uses slice.taskTemplateRows if length > 0, else getDefaultTaskTemplateRows(). No loader sets taskTemplateRows from full Task Folder Details. |
| Is DayView showing raw priority instead of effective priority? | **Yes.** Line 149: P{item.priority}. useDayViewModel returns rules but DayView does not call effectivePriority. |
| Are planners using engines but not full rule integration? | **Yes.** View models pass slice.rules to engines, but structure.rules is empty so only defaults apply; no priorityRamp or visibilityMinPriority. |

---

**Summary:** The engines and types are in place and designed for the full system. The main gaps are: (1) rules never loaded into structure.rules, (2) priorityRamp/visibilityMinPriority not in base.json and thus disabled, (3) effectivePriority does not use recurrence for “next due,” (4) task tree and Task Folder Details not wired as single source for parser and planner, (5) DayView shows raw priority and has no continuous time grid, (6) planner route and section scheduling UI not connected. The path to the full system is to load rules, extend effective priority for recurrence, load Task Folder Details into taskTemplateRows (and tree if desired), then wire DayView display and grid, planner route, and section menus—without rebuilding existing engines.

---

## V2 Integration Deliverable Checklist (Implemented)

- [x] **Rules loaded into structure.rules** — Bootstrap in JSX_DayView fetches `/api/rulesets/base` and dispatches `structure:loadRuleset`; API route serves `apps-json/rulesets/base.json`.
- [x] **priorityRamp active** — Added `priorityRamp` and `visibilityMinPriority` to `base.json`; rules merged into slice so prioritization engine applies ramp.
- [x] **Recurrence-aware priority working** — In `prioritization.engine.ts`, `dueDateForPriority()` uses `nextOccurrences()` for recurring items; ramp and escalation use that date.
- [x] **DayView showing effective priority** — Badge uses `effectivePriority(item, refDate, rules)` instead of raw `item.priority`.
- [x] **Parser using real taskTemplateRows** — `structureParseToStaging` already prefers `slice.taskTemplateRows`; `structure:ensureTaskTemplateRows` primes from default when empty.
- [x] **Planner route pointing to TSX DayView** — API route returns `{ __type: "tsx-screen", path: "HiClarify/JSX_DayView" }` for `HiClarify/planner_screen` (no JSON placeholder).
- [x] **Tree engine wired to planner** — `useDayViewModel` exposes `treeFolders`, `subByFolder`, `catBySub` from `task-tree-engine`; section menu uses `treeFolders`.
- [x] **Continuous day grid active** — DayView has single time axis (06:00–24:00), blocks positioned by `fromHM`/`toMin`; existing block data and structure state preserved.
- [x] **Section menus** — "Scheduled" dropdown (Work day + folder list) and `structure:setScheduledSection`; selection persisted in `structure.scheduledSection`.
- [x] **Cancel day UI** — "Cancel day" button in header calls `structure:cancelDay`; optional `cancelDayReset: "moveToNextDay"` enabled in `base.json`.
