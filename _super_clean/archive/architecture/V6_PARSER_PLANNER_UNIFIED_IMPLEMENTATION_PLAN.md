# V6 — Parser + Planner Unified Implementation Plan

**Document type:** Architecture contract and implementation blueprint  
**Version:** 6  
**Scope:** HiSense/HIClarify — Natural Language Task Parser + Structure Engine + Planner UI as a single JSON-driven system.  
**Status:** Contract doc. Implementation not started.

This document is the **spine of the HI planning system**. It connects parser output → structure state → planner UI and defines day/week/month parity and molecule strategy while keeping the system JSON-driven. It builds on: V4 (engine foundation), V5 (structure system), and the Legacy UI Parity Analysis.

---

## PHASE 1 — SYSTEM DISCOVERY (FULL REPO SCAN) — Findings

### A) Parser System

**Located in HiSense:**

- **Task parsing logic:** `src/05_Logic/logic/engines/structure/extreme-mode-parser.ts`
  - `splitSentences(text)` — split on `.!?` and on " and ", " also ", " then "
  - `detectIntent(text)` — returns "task" | "note" | "question" | "command" (heuristic)
  - `interpretStream(segments)` — segments to ParseResult (segments, sentences, intent)
  - `interpretToCandidates(parseResult, rules, context)` — delegates to structure-mapper
  - `streamToCandidates(segments, rules, refDate, activeCategoryId)` — full pipeline
- **Output schema (current):** ParseResult = { segments: ParseSegment[], sentences: string[], intent? }. ParseSegment = { text, isFinal?, timestamp? }. No `display_text`, `verb`, `modifier_text`, `date_phrase`, `tokens_norm`, or `low_confidence` in code — those are optional extension fields for a future or external parser contract.
- **Structure-mapper:** `src/05_Logic/logic/engines/structure/structure-mapper.engine.ts` — `mapToCandidates(parseResult, rules, context)` → { candidates: StructureItem[], trace: MapperTrace }. Candidates get: title (from sentence), categoryId (inferCategory from rules.categoryInference.keywords), priority (inferPriority from rules.priorityInference), dueDate: **null** (not yet extracted), no recurrence.
- **Voice/text ingestion:** No dedicated UI or entry point in HiSense. EXTREME_MODE doc describes stream → parse → interpreter; no TaskParserApp or DB_PreMatchParsing references in repo. Integration point: action or handler that receives text/segments and calls `streamToCandidates` then `structure:addItems`.

### B) Structure Engine

- **State:** `state.values.structure` = { tree, items, blocksByDate, rules, activePlannerId? } — see `src/05_Logic/logic/actions/structure.actions.ts`, `src/05_Logic/logic/engines/structure/structure.types.ts`.
- **Engines:** date-utils (parseRelativeDate, isToday), recurrence (nextOccurrences, isDueOn), scheduling (scheduledForDate), prioritization (effectivePriority, sortByPriority, applyCancelDay), aggregation (aggregateByDateRange, aggregateSignals), progression (rampValueForDate), rule-evaluator, structure-mapper, extreme-mode-parser — all exported from `src/05_Logic/logic/engines/structure/index.ts`.
- **Actions:** structure:addItem, structure:addItems, structure:updateItem, structure:deleteItem, structure:setBlocksForDate, structure:setActivePlanner, structure:cancelDay — `src/05_Logic/logic/runtime/action-registry.ts`.

### C) Planner UI + Docs

- **Docs:** `docs/PLANNER_V2_MASTER_PLAN.md`, `docs/PLANNER_SYSTEM_V3_MASTER_PLAN.md`, `architecture/PLANNER_UNIVERSAL_ENGINE_V4_FULL_REPORT.md`, `architecture/PLANNER_UNIVERSAL_ENGINE_V5_IMPLEMENTATION_PLAN.md`, `architecture/EXTREME_MODE_TASK_INPUT_COMPARISON.md`. Legacy weekly/day references: V2 describes dayview2, weeklyView, habitrackerdemo, relationship2 (no code in repo).
- **JSON Plan section:** `src/01_App/apps-json/apps/hiclarify/app.json` — Section when currentView === "plan" with List (itemsFromState: "structure.items"), Toolbar (Today/Week/Month → calendar.today/week/month), static Cards (Calendar View, Upcoming Events). calendar.* actions not registered.

### D) Renderer Layer

- **json-renderer.tsx:** itemsFromState resolved at lines 1177–1197: path from stateSnapshot.values, default mapper item → { label: item.title, behavior: structure:updateItem }. No blocksFromState.
- **when/equals:** Section visibility via shouldRenderNode using state key (e.g. currentView) and equals value.
- **Stepper / currentView:** state:currentView in state-resolver; Stepper gets activeValue = currentView; Plan tab sets value "plan".

---

## PHASE 2 — PARSER → STATE PIPELINE DESIGN

**Architecture (no schema creation; state remains JSON values):**

1. **Voice/Text input** → Source (future: mic/stream or text field) produces string or ParseSegment[].
2. **Parser** → extreme-mode-parser: `splitSentences(text)` then `interpretStream(segments)` → ParseResult { segments, sentences, intent }.
3. **Date binding:** Extend structure-mapper (or add extraction step) to detect date phrases in each sentence (e.g. "Thursday", "every Thursday") and call date-utils.parseRelativeDate(phrase, refDate) for dueDate; map "every X" patterns to recurrence (recurringType + recurringDetails) using rules.recurrenceDefinitions or inline patterns.
4. **Category inference:** Already in mapper via rules.categoryInference.keywords; optional tokens_norm (normalized tokens) can be used to match keywords for category placement.
5. **Recurrence extraction:** Add to mapper or to a pre-mapper step: from sentence text, match patterns (e.g. "every day", "weekly", "every Mon and Wed") → set item.recurrence { recurringType, recurringDetails }. Reuse recurrence.engine semantics.
6. **Low_confidence:** If parser output includes a confidence flag, options: (a) show preview only and require confirm before structure:addItems, (b) write to a draft key (e.g. structure_draft) and commit on confirm, (c) commit with metadata on item for later review. No new schema; optional field on item or in trace.
7. **Multiple parsed tasks batch-insert:** One action call: `structure:addItems` with payload { items: candidates }. Handler already supports array; single state.update.
8. **Planner render:** After state.update, deriveState updates; List with itemsFromState re-renders. Optional: filter list by selectedDate using scheduling engine output (scheduledForDate) and bind to a derived path or a new state key (e.g. structure.scheduledToday).

**Exact flow:** Input text → splitSentences → interpretStream → mapToCandidates (with future date/recurrence extraction) → structure:addItems({ items: candidates }) → state.values.structure.items updated → Plan section List shows items.

---

## PHASE 3 — PLANNER UI PARITY MODEL (from docs)

- **Day view:** Time blocks stacked vertically; each block = label + time range (Block.start, Block.end); tasks slotted via scheduling.engine scheduledForDate → ScheduledItem[]. Bind: blocksFromState = structure.blocksByDate[selectedDate], tasks = scheduledForDate(items, selectedDate, blocks, rules).
- **Week view:** 7-column layout; each column = one day; column bound to blocksByDate[date] and scheduledForDate(tasks, date, blocks, rules) for that date. Week start: aggregation uses Sunday; configurable in date-utils or rules.
- **Month view:** aggregation.engine aggregateByDateRange(items, from, to, "day" | "month") → Rollup[]; summary cells per day (count, optional items). Bind cells to rollups or to a derived state key.
- **Stats layer:** Total time per block = sum(block.end - block.start) for blocks; total per category = filter items by categoryId and sum; total tasks per day/week = aggregation count. All derivable from existing engines + state; no new schema.

---

## PHASE 4 — MOLECULE STRATEGY (JSON-DRIVEN ONLY)

**Reusable molecules (all renderable via JSON; no new TSX layout logic for now):**

- **DayColumn** — One column for a single date: content.blocksFromState path + content.scheduledFromState (or date param + state path for tasks). Implement as Section + List of blocks and List of tasks, or one compound registered in Registry that reads state path + date.
- **WeekGrid** — Row or Grid of 7 DayColumn instances; content.datesFromState or content.weekRange + state path. Can be 7× Section with when/params date, or one Grid compound with cellsFromState. *Note: WeekGrid may eventually be a dedicated compound for performance/layout; for now keep JSON-first (7× Section or Grid).*
- **MonthGrid** — Grid of day cells; content.cellsFromState = aggregation rollups or content.monthRollupFromState. *Note: MonthGrid may eventually be a dedicated compound; for now keep JSON-first.*
- **TimeBlockRow** — Card or List item for one Block: label + start–end. Content from block object; can be current Card with content.title = block.label, content.body = time range.
- **TaskSlotCard** — Card for a task in a slot; content from ScheduledItem + item lookup. Card with title = item.title, optional behavior = structure:updateItem.
- **CategorySelector** — List or Stepper of structure.tree nodes; behavior = calendar:selectCategory or structure:selectCategory; active from state.
- **ParserInputPanel** — Field (textarea) + Button "Add from text"; behavior triggers action that takes field value, runs streamToCandidates, then structure:addItems or shows preview. JSON: Field with fieldKey + Button with action name.
- **ParsedTaskPreview** — List with content.itemsFromState = structure_draft or content.items from action payload; confirm button → structure:addItems. Requires draft state key or preview in modal.
- **SchedulingSummary** — Text or Card showing stats (e.g. total tasks today, total block hours). Content from derived state or engine call in action that writes to a summary key.

All must be expressible as existing molecules (Section, List, Card, Toolbar, Field, Stepper) plus binding conventions (itemsFromState, blocksFromState, cellsFromState) or new compounds that only read state and render; no TSX layout logic beyond what Registry already supports. **Rule: No new TSX beyond what is already in Registry** — WeekGrid/MonthGrid stay JSON-composed until a later decision to add dedicated compounds.

---

## PHASE 5 — VIEW STATE MODEL

**Planner view state (design):**

- **calendarView:** "day" | "week" | "month" — stored in state.values.structure (e.g. structure.calendarView) or in a dedicated key (e.g. values.plannerView) to avoid widening structure slice. Alternative: state.currentView values "plan-day" | "plan-week" | "plan-month" when on Plan tab.
- **selectedDate:** ISO date string (e.g. "2025-02-15"). structure.selectedDate or plannerView.selectedDate.
- **Bindings:** Day: blocksByDate[selectedDate], scheduledForDate(items, selectedDate, blocks, rules). Week: for each date in week range, same. Month: aggregateByDateRange for month.
- **Actions:** calendar:setDay → set calendarView=day, selectedDate=today (or payload date). calendar:setWeek → calendarView=week, selectedDate=week start or today. calendar:setMonth → calendarView=month, selectedDate=first of month. calendar:setDate → selectedDate=payload.date. Register in action-registry; handlers write to state (structure or plannerView key).

---

## PHASE 6 — ONBOARDING FLOW (PARSER-FIRST)

**First-use experience:**

1. User speaks or types: e.g. "Run to the bank Thursday, take out trash every Thursday."
2. System: Parser runs (splitSentences → interpretToCandidates with date/recurrence extraction).
3. Preview: Parsed tasks shown in ParsedTaskPreview (draft list); user can edit or confirm.
4. Confirm: Action structure:addItems({ items: candidates }) with ids assigned; recurrence already on items from mapper.
5. Auto-place: Scheduling engine already computes scheduledForDate; no extra "auto-place" step unless blocks are auto-created (e.g. default template for week). Optional: action that for each new item with dueDate runs scheduling and optionally assigns to a block slot.
6. This flow = **Parser Onboarding Mode:** one Section or Modal with ParserInputPanel + ParsedTaskPreview + Confirm button; JSON-driven; entry from Plan tab "Add by voice" or "Add from text".

---

## PHASE 7 — GAP REPORT

**Already exists:**

- Engines: recurrence, scheduling, prioritization, aggregation, progression, date-utils, structure-mapper, extreme-mode-parser, rule-evaluator.
- State slice: structure (tree, items, blocksByDate, rules).
- Actions: structure:addItem, structure:addItems, structure:updateItem, structure:deleteItem, structure:setBlocksForDate, structure:setActivePlanner, structure:cancelDay.
- Parser: sentence split, intent, mapToCandidates (title, category, priority; dueDate/recurrence not yet extracted).
- List binding: itemsFromState for structure.items.
- Plan section: Section when plan, List, Toolbar, Cards.
- Recurrence and scheduling logic in engines.

**Missing:**

- Day/week/month UI compounds (DayColumn, WeekGrid, MonthGrid, TimeBlockRow, TaskSlotCard).
- blocksFromState (and cellsFromState) in json-renderer.
- Parser → structure insertion bridge: no action that accepts text/segments and calls streamToCandidates then structure:addItems.
- Calendar view state (calendarView, selectedDate) and calendar:setDay/setWeek/setMonth/setDate actions.
- Date and recurrence extraction inside structure-mapper (or pre-step).
- Slot visualizers (tasks in blocks).
- ParsedTaskPreview / draft state for confirm-before-commit.
- Parser input UI (ParserInputPanel) wired to parser action.

---

## PHASE 8 — IMPLEMENTATION ROADMAP

**Stage 1 — Parser → Structure connection**

- Add action (e.g. structure:addFromText or structure:commitCandidates) that accepts { text } or { segments }; call streamToCandidates; then structure:addItems({ items: candidates }). Optionally extend mapToCandidates to set dueDate (parseRelativeDate) and recurrence from sentence.
- Files: action-registry.ts, new or existing structure.actions.ts, optionally structure-mapper.engine.ts and date-utils usage.
- JSON: Plan section button "Add from text" with action name.

**Stage 2 — Calendar view state**

- Add state key (e.g. structure.calendarView, structure.selectedDate) or values.plannerView.
- Register actions calendar:setDay, calendar:setWeek, calendar:setMonth, calendar:setDate; handlers read/write state.
- Files: action-registry.ts, structure.actions.ts or new calendar.actions.ts, state-resolver if new intent.
- JSON: Toolbar Today/Week/Month already fire calendar.*; wire to new handlers.

**Stage 3 — Day layout molecules**

- Add blocksFromState resolution in json-renderer (path to array of blocks for a date); mapper block → { label, body: timeRange }.
- Define DayColumn in JSON as Section + List content.blocksFromState for selectedDate.
- Files: json-renderer.tsx, app.json Plan section.
- Engines: scheduling.engine for scheduledForDate; blocks from structure.blocksByDate.

**Stage 4 — Week grid**

- Week range from selectedDate (e.g. getWeekStart(selectedDate), 7 days).
- JSON: 7× Section or one Grid with 7 cells; each cell content.blocksFromState + content.scheduledFromState for date[i]. Or new compound WeekGrid registered, reading state + date range.
- Files: app.json, optionally registry + one compound.
- Engines: scheduling, date-utils for week range.

**Stage 5 — Month aggregation view**

- aggregateByDateRange(items, monthStart, monthEnd, "day") → bind to List or Grid cells.
- JSON: Grid or List with content.cellsFromState or content.rollupFromState (path to derived rollups). Optional: action that writes aggregation result to state.values.structure.monthRollup for binding.
- Files: app.json, optional action to compute and write rollup.
- Engines: aggregation.engine.

**Stage 6 — Task slot rendering**

- ScheduledItem[] + items → show task per block. TimeBlockRow = block; TaskSlotCard = task in slot. Bind from scheduling output; either derive in renderer from state path + selectedDate or store scheduledToday in state.
- Files: json-renderer (optional scheduledFromState binding), app.json.
- Engines: scheduling.engine.

**Stage 7 — Stats layer**

- Total time per block: sum from blocks; total tasks per day/week: aggregation. Optional state key structure.stats or compute in component from state.
- JSON: Card or Text with content from state path (e.g. structure.stats.todayTotal).
- Files: optional action to compute stats and write; app.json.
- Engines: aggregation.

Each stage: only existing engines + JSON/additive renderer bindings; no new DB schema.

---

## PHASE 9 — FINAL ASSESSMENT

- **How close the current system is:** Logic and state are ~70–75% in place (structure slice, all engines, parser pipeline, itemsFromState, Plan section). Missing: parser→state bridge, calendar view state, day/week/month layout and bindings (blocksFromState, cellsFromState), and parser UI/onboarding.
- **% logic already built:** ~75% (engines, actions, parser, recurrence, scheduling, prioritization, aggregation).
- **% UI missing:** ~60% (day column, week grid, month grid, time blocks, task slots, parser input/preview, calendar view switch).
- **Estimated build hours remaining:** Stage 1 ~2–4 h; Stage 2 ~1–2 h; Stage 3 ~3–5 h; Stage 4 ~4–6 h; Stage 5 ~3–4 h; Stage 6 ~2–3 h; Stage 7 ~1–2 h. Total ~16–26 h (single developer, no new TSX compounds). More if new compounds (WeekGrid, MonthGrid) are implemented as TSX later.
- **Stability impact:** Additive only (new actions, new bindings, new JSON). No change to deriveState or existing intents; low risk.
- **Scalability impact:** State remains one key (structure); optional plannerView key. Rollups and scheduling are pure; no new persistence. Scales to multi-planner if structure.planners map is used later.

---

## CRITICAL RULES (CONFIRMED)

- No new TSX beyond what is already in Registry. WeekGrid/MonthGrid stay JSON-composed for now; they may become dedicated compounds later if needed.
- No new database schemas.
- Design uses only existing engines + JSON layer and additive renderer bindings.
- Parser output → JSON candidates; structure → JSON state; planner UI → JSON layout; molecules → JSON composition. Scheduling and recurrence remain pure engine logic. The only TS layer is renderer plumbing and engine execution — everything else is declarative.

---

*This document is the V6 contract for the unified planner + parser architecture and the spine of the HI planning system.*
