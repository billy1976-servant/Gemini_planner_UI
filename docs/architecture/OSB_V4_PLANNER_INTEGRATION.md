# OSB V4 — Planner Engine Integration Directive

**Document type:** Read-only architecture expansion. No implementation. No refactors. No new planner. Unify OSB with the existing planner; recognition, not invention.

**Intent:** Deeply integrate the existing Planner/Priority/Forecasting system into OSB so that OSB is the natural entry point, the planner is the invisible backbone, journeys auto-generate structured plans, and there is no duplication of logic, engines, or storage.

---

## 1. Core Realization

The planner is already the universal engine. It supports:

- Tasks (single, with dueDate)
- Recurring tasks (daily, weekly, monthly via RecurrenceBlock)
- Habits with ramping (HabitBlock: startValue → targetValue over durationDays)
- Long-term projects (categoryId, tree hierarchy)
- Priority 1–10 with escalation (days overdue → increased effective priority)
- Time-based emergence (dueDate + recurrence + scheduling/aggregation: what is due when)
- Cancel-day behavior (moveToNextDay or decrementPriority)

The same system applies to: camping trips, marriage recovery, addiction recovery, buying a house, starting a business, health improvement, prayer growth, skill development, financial planning. OSB must **feed** this engine, not replace it.

---

## 2. Where Planner Logic Already Lives

### 2.1 Storage shape and state keys

- **Single store:** `state.values.structure` (StructureSlice).
- **Shape:** `tree: StructureTreeNode[]`, `items: StructureItem[]`, `blocksByDate`, `rules: ResolvedRuleset`, `activePlannerId`, `calendarView`, `selectedDate`, `weekDates`, `monthRollup`, `stats`.
- **StructureItem:** id, title, categoryId, priority, dueDate, createdAt, updatedAt, recurrence (RecurrenceBlock), habit (HabitBlock), signals, blockers, opportunities, metadata.
- **StructureTreeNode:** id, name, children, order (hierarchy for domains/projects).
- **ResolvedRuleset:** priorityScale (min, max, default), escalation (enabled, daysUntilEscalation, incrementPerDay, maxPriority), cancelDayReset, recurrenceDefinitions, schedulingDefaults, categoryInference, priorityInference, habitDefaults.

All planner state is derived from this one slice. No separate planner store.

### 2.2 Priority 1–10 system

- **Location:** `prioritization.engine.ts`, `structure.types.ts` (ResolvedRuleset.priorityScale, StructureItem.priority).
- **Rules:** base.json defines priorityScale { min: 0, max: 10, default: 5 } and priorityInference (e.g. asap→9, urgent→9, high→7, medium→5, low→3).
- **Effective priority:** `effectivePriority(item, date, rules)` — base priority plus escalation: for each day overdue, priority increases by incrementPerDay (capped at maxPriority). So items become more “urgent” as they age.
- **Sort:** `sortByPriority(items, date, rules)` — sort by effective priority descending, then by dueDate ascending.

### 2.3 Forecasting and time-based activation

- **Recurrence:** `recurrence.engine.ts` — `nextOccurrences(task, fromDate, count)` returns future due dates for daily/weekly/monthly recurrence. `isDueOn(task, date)` answers whether a task is due on a given date.
- **Scheduling:** `scheduling.engine.ts` — `scheduledForDate(tasks, date, blocks, rules)` returns which tasks are due on that date (via isDueOn), with optional slot assignment.
- **Aggregation:** `aggregation.engine.ts` — `aggregateByDateRange(items, from, to, groupBy)` produces rollups (day/week/month) of items with dueDate in range. Used for stats (todayCount, weekCount, monthCount) and calendar rollups.
- **Forecast timing behavior:** There is no separate “forecast engine” that “activates” items at 1 month out vs 1 week out. The same machinery supports it: items have dueDate (and optionally recurrence). Any UI or filter that shows “items due in the next 7 days” or “items due in the next 30 days” will naturally surface items as time advances. So: trip in 3 months → create items with dueDate 1 month before, 1 week before, 3 days before, day-of → planner/calendar views that filter by date range will show them when those dates enter range. Time-based emergence = dueDate + existing aggregation/scheduling; no new engine.

### 2.4 Recurring task structure

- **RecurrenceBlock:** recurringType (daily | weekly | monthly | off), recurringDetails (e.g. weekday list for weekly). Stored on StructureItem.recurrence. Recurrence engine computes next occurrences and isDueOn.

### 2.5 Habit ramping logic

- **Location:** `progression.engine.ts`, structure.types (HabitBlock).
- **HabitBlock:** startValue, targetValue, durationDays; optional timeSlots, activeDays.
- **rampValueForDate(habit, refDate):** Linear ramp from startValue to targetValue over durationDays. Returns the target value for the habit at a given date (for display or validation). Same mechanism for pushups (5→10→20→50), prayer (2 min→5→10), savings ($20→$50→$100), recovery ramps.
- **habitDefaults in rules:** startValue, targetValue, durationDays (e.g. 0, 1, 21). Journey/template can set habit on items to trigger this ramp.

### 2.6 Project → task → subtask hierarchy

- **Tree:** slice.tree (StructureTreeNode[]) represents domains/projects (e.g. Life → Home, Work, Health, Finance in personal.json).
- **Items:** slice.items (StructureItem[]). Grouping is via categoryId (aligns with tree node names or category inference). There is no explicit “parent task id” on StructureItem; hierarchy is expressed by tree (domains) and categoryId (which domain/project an item belongs to). Subtasks can be items with the same categoryId or a convention (e.g. metadata.parentId) if needed; the existing model is flat items + tree; “subtask” can be “item in same category” or future metadata link.

### 2.7 Multi-person / shared responsibility

- **Current contract:** StructureItem has no dedicated assignee field. metadata is Record<string, unknown>, so responsibility/assignee can be stored in item.metadata (e.g. metadata.assigneeId, metadata.responsiblePerson) without changing the type. Any “who is helping?” logic that attaches responsibility to planner items can write into metadata; UI and reporting can read it. No new engine; optional convention.

### 2.8 Actions and derivation

- **Actions (structure.actions.ts):** structureAddItem, structureAddItems, structureUpdateItem, structureDeleteItem, structureSetBlocksForDate, structureSetActivePlanner, structureCancelDay, structureAddFromText, calendarSetDay, calendarSetWeek, calendarSetMonth, calendarSetDate. All write via writeSlice → dispatchState("state.update", { key: STRUCTURE_KEY, value: next }).
- **Derivation:** State is not re-derived from a separate planner pipeline; the structure slice is the source of truth. Planner UI and engines read getState().values.structure and use prioritization, recurrence, scheduling, aggregation, progression as pure functions over that data.

---

## 3. How OSB Should Plug Into the Planner

**Cleanest path:** User types once → system interprets → system **silently** creates a project, a journey, a habit ramp, a timeline (all as structure tree + items) **without** the user opening the planner.

- **Intent capture:** OSB (V2/V3) already captures input and suggests route (journal, task, track, note, journey). For planner-heavy intents (“vacation,” “remodel,” “recovery,” “start a business”), OSB selects a journey pack.
- **Journey = planner hierarchy:** The journey pack is JSON that describes tree nodes and StructureItem[] (with dueDate, priority, recurrence, habit). Loading the journey = merging that tree and those items into state.values.structure (via structureAddItems and tree merge), as in OSB V3.
- **Silent creation:** OSB (or the action that loads the journey) does not require the user to open the planner screen. It calls structureAddItems (or structure:addJourney) with the expanded items and tree; the planner store is updated. When the user later opens the planner/calendar, they see the injected plan. So: “User types once → system creates project/journey/ramp/timeline” = “OSB triggers structureAddItems / addJourney with the right items and dates.”
- **Priority and forecasting:** Journey templates assign priority (1–10) and dueDate to each item. Existing effectivePriority and sortByPriority will order them; existing aggregation and scheduling will surface them by date. No new logic; OSB/journey authoring must only **populate** priority and dueDate so that the existing engines do the rest.
- **Habit ramps:** Journey can include items with habit: { startValue, targetValue, durationDays }. progression.engine already computes rampValueForDate; no new engine. OSB triggers creation of those items via structureAddItems.

---

## 4. Journey Template Concept (Already Matches Existing Architecture)

A “journey” is a structured hierarchy that maps directly to planner hierarchy + forecasting:

- **Camping trip:** “1 week before → reservations, 3 days before → meal plan, 1 day before → pack, day of → depart” = StructureItem[] with dueDates set relative to a “trip date” (e.g. user provides date, or “in 2 weeks”). Each item has dueDate and optionally priority. Recurrence not required; single dueDates suffice. When the user’s “today” enters the range (e.g. 1 week before), aggregation/scheduling will show those items.
- **Buying house:** “Financial prep, credit improvement, realtor search, touring homes, offer process” = tree nodes or categoryIds + items with dueDate/priority. Can be phased (e.g. phase 1 items due in month 1, phase 2 in month 2) so they emerge over time.
- **Recovery:** “Daily habits, support contacts, trigger avoidance, progress ramp” = items with recurrence (daily) or habit (startValue→targetValue over durationDays). Same planner mechanism.

These are **not** new systems. They are: planner hierarchy (tree + items) + dueDate + priority + recurrence/habit. Journeys are preauthored JSON that, when loaded, inject that shape into the same structure slice.

---

## 5. Key Design Principle

OSB should:

- **Capture intent** → then convert it into:
  - Planner hierarchy (tree + items with categoryId)
  - Priority assignments (priority 1–10)
  - Forecasted emergence (dueDate on each item so that aggregation/scheduling surface them when relevant)
  - Ramping sequences (habit block on items where appropriate)

using the **same** planner engine (same slice, same actions, same prioritization/recurrence/scheduling/aggregation/progression). OSB does not recreate priority or forecasting; it **feeds** the existing engine with new items and tree nodes.

---

## 6. Priority System Alignment

- **Preserve:** Priority 1–10 model (priorityScale, priorityInference), effective priority with escalation, sortByPriority. No change to prioritization.engine or rules.
- **Future forecasting activation:** Items with dueDate in the future are already “in” the store; they become “visible” when a view filters by date range (e.g. “show items due in next 30 days”). So: “trip in 3 months → nothing visible yet → 1 month out → planning appears → 1 week out → action items appear → 3 days → execution items” is achieved by (1) journey creating items with dueDates at “1 month before,” “1 week before,” “3 days before,” “day of,” and (2) planner/calendar UI using aggregateByDateRange or scheduledForDate with a window (e.g. next 7 days, next 30 days). No new engine; only authoring of dueDates and optional UI filtering.
- **Time-based surfacing:** Same: dueDate + recurrence + isDueOn + aggregation. Context awareness (e.g. “show only items due this week”) is a view over the same data.

OSB must **use** this (by setting priority and dueDate on injected items), not recreate it.

---

## 7. Habit Ramping Integration

- **Where ramping exists:** progression.engine.ts — rampValueForDate(habit, refDate). HabitBlock: startValue, targetValue, durationDays. rules.habitDefaults.
- **How OSB can trigger ramp plans:** When the user intent is habit-like (e.g. “pray more,” “do pushups,” “save more”), OSB or the journey can create StructureItem(s) with habit: { startValue, targetValue, durationDays }. structureAddItems accepts items with habit; normalizeItem preserves habit. The planner and any habit UI can then use rampValueForDate to show target value for a date. No new engine; OSB/journey authoring sets habit on items and injects via structureAddItems.

---

## 8. Shared Responsibility Model

- **Planner support:** StructureItem has metadata (Record<string, unknown>). Assignee or “who is helping” can be stored as metadata.assigneeId or metadata.responsiblePerson. No type change required.
- **How OSB can generate “Who is helping?”:** When capturing a shared plan (e.g. “date night,” “family vacation”), OSB or the journey template can attach metadata to items (e.g. by person or role). The action that injects the journey (structureAddItems or structure:addJourney) includes metadata on each item. Future UI can show “assigned to” from metadata. No new store; no new engine.

---

## 9. Template Download Vision

- **User loads a journey** (e.g. camping plan, remodel plan, garden plan, business launch, vacation, recovery plan). These are prebuilt planner hierarchies: tree + items with dueDate, priority, recurrence, habit as needed.
- **How templates inject:** Same as OSB V3: load journey JSON → convert to StructureTreeNode[] + StructureItem[] → merge into state.values.structure via structureAddItems (and tree merge). Use existing priority (priority field on each item) and existing “forecasting” (dueDate; aggregation/scheduling surface by date). No duplication: one structure slice, one set of actions, one set of engines.
- **Avoiding duplication:** Templates do not define a second task model. They define a **payload** (tree + items) that conforms to StructureTreeNode and StructureItem. Inject = merge into the same slice. Priority and forecasting are already in the engine; templates only supply data.

---

## 10. OSB’s True Role (V4 Understanding)

OSB is **not**:

- Just capture  
- Just routing  

OSB **is**:

- **Intent → plan generator.** It triggers planner creation (tree + items), structure population (via structureAddItems or structure:addJourney), and forecasted life support (dueDate/priority/recurrence/habit on items so that existing prioritization and time-based views surface the right things at the right time).

User types once; system interprets; system can silently create a project, a journey, a habit ramp, a timeline in the **same** planner engine. The planner is the invisible backbone; OSB is the entry point that feeds it.

---

## 11. How Journeys Map to Planner Hierarchy

- **Journey pack JSON** = list of StructureTreeNode (or fragments to merge into slice.tree) + list of StructureItem (or partials: title, categoryId, priority, dueDate, recurrence, habit, metadata). IDs and timestamps can be generated at load time (normalizeItem).
- **Hierarchy:** tree = domains/projects; items = tasks; categoryId links items to tree (or to a category). Journey “Camping” might add tree node “Camping” with children “Packing,” “Budget,” “Docs” and items with categoryId “Camping” or “Packing,” etc.
- **Forecasting:** Each item has dueDate (ISO). Journey author sets dueDates relative to a “journey start” or “target date” (e.g. trip date). Aggregation and scheduling engines then surface items when the current date enters the relevant window.
- **Ramping:** Items that represent habits have habit: { startValue, targetValue, durationDays }. progression.engine rampValueForDate applies. Journey author sets these; no new ramping logic.

---

## 12. How Ramping Maps to Planner

- **Same planner mechanism:** HabitBlock on StructureItem; rampValueForDate(habit, refDate) in progression.engine. Pushups 5→10→20→50, prayer 2→5→10 min, savings $20→$50→$100, recovery “small wins → scaled wins” are all the same: startValue, targetValue, durationDays. Journey templates that describe ramps output items with habit set; structureAddItems merges them. OSB can trigger ramp plans by loading such a journey (e.g. “prayer growth” journey with items that have habit blocks).

---

## 13. How Forecasting Stays Central

- **Forecasting** = “what appears when” is determined by dueDate and recurrence (and optionally habit start). recurrence.engine (isDueOn, nextOccurrences), scheduling.engine (scheduledForDate), aggregation.engine (aggregateByDateRange) already implement this. No separate “forecast engine.”
- **Centrality:** Any UI or process that needs “what’s due in the next N days” or “what’s due on date D” uses these pure functions over slice.items. OSB and journeys only need to **set** dueDate (and recurrence/habit) correctly; forecasting behavior stays in the existing engines.

---

## 14. How Templates Inject Cleanly

- **Single entry point:** structureAddItems(action: { items }) or structure:addJourney(action: { journeyId } | { tree, items }). Both end in writeSlice({ ...slice, items: mergedItems }) (and optionally slice.tree merged). Single store write.
- **Existing priority + forecasting:** Injected items already have priority and dueDate. effectivePriority, sortByPriority, aggregateByDateRange, scheduledForDate work unchanged. No duplication of logic.
- **Clean architecture path:** Journey loader (or structure:addJourney) is a thin layer: resolve pack JSON → normalize to StructureItem[] (+ tree) → call structureAddItems (and tree merge) → done. All planner behavior is in existing engines.

---

## 15. Zero-Duplication Guarantees

- **One planner store:** state.values.structure only. No journey store, no duplicate task store.
- **One task model:** StructureItem (with recurrence, habit, priority, dueDate, categoryId, metadata). Journeys produce items of this shape only.
- **One set of engines:** prioritization, recurrence, scheduling, aggregation, progression. OSB/journeys do not reimplement any of them; they only supply input data (items and tree).
- **One write path:** structureAddItem, structureAddItems, or structure:addJourney (which calls the same merge/writeSlice). No parallel planner write path.

---

## 16. Risks

- **Journey authoring complexity:** Templates must correctly set dueDate, priority, recurrence, habit to get desired “emergence” and ramping. Poor authoring could clutter the planner or mis-time items. Mitigation: document conventions and optionally provide a small “journey compiler” that turns high-level dates (e.g. “1 week before trip”) into ISO dueDates given a user-provided trip date.
- **Tree merge conflicts:** If journey tree and user’s existing tree share ids or names, merge strategy must be defined (append vs replace by id). Same as in OSB V3.
- **Over-injection:** Loading many large journeys could create a very large items array. Consider lazy expansion (load sub-journeys on demand) and optional “preview before inject.” No new engine; design choice.

---

## 17. Cleanest Architecture Path

1. **OSB remains the entry point.** User types; OSB suggests route (journal, task, note, journey) and, for journey, suggests which pack (e.g. vacation, remodel, recovery).
2. **Journey load = planner inject.** Loading a journey means: resolve pack JSON to tree + items (with priority, dueDate, recurrence, habit as needed); call structureAddItems (and merge tree); no new actions strictly required, or one structure:addJourney that does this and still writes only to state.values.structure.
3. **No new planner.** All behavior (priority, escalation, recurrence, scheduling, aggregation, habit ramp) stays in existing engines. OSB and journeys only **populate** the structure slice so that those engines apply.
4. **Time-based emergence** = dueDate + existing aggregation/scheduling. Journey authors set dueDates so that items “appear” in the right windows; UI that filters by date range (or uses scheduledForDate / aggregateByDateRange) will show them at the right time.
5. **Shared responsibility** = metadata on StructureItem if needed; OSB/journey can set metadata when generating shared plans.

This is recognition of the existing planner as the universal engine and alignment of OSB V4 as the intent-to-plan generator that feeds it—no new planner, no duplication, only deep integration.
