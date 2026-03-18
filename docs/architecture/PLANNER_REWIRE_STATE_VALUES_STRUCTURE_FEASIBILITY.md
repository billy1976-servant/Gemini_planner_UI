# Planner Rewire to state.values.structure — Feasibility Plan

**Document type:** Audit + step-by-step feasibility plan (no code).  
**Objective:** Locate the original TSX planner (day/week/month), audit how it reads and structures data, then produce a plan to render the same UI using the current JSON state system with `state.values.structure`, including gaps, mappings, and risks.

---

## 1. Audit: “Original” TSX Planner and Data Source

### 1.1 Finding: No Separate TSX Planner Component Using a Database

- **Search results:** No dedicated TSX file that implements a day/week/month planner UI and reads from a database (Supabase, Firestore, or other) was found in the repo.
- **Deleted files (git status):** `OnboardingEngineV3.tsx` and `OnboardingEnginev2.tsx` were removed; they were onboarding flows, not the planner calendar.
- **Archive/docs:** `_super_clean/archive/docs/PLANNER_V2_MASTER_PLAN.md` and related docs describe a **design** where the planner lives under one key in `state.values` (e.g. `planner`), with no planner-specific intent or slice at that time. That design is **already aligned** with the current approach: the planner slice is `state.values.structure`.
- **Conclusion:** The “original” planner in this codebase is **not** a legacy TSX component backed by a DB. It is the **JSON-defined Plan section** in `apps-json/apps/hiclarify/app.json`, rendered by the **JSON renderer** (`json-renderer.tsx`) with bindings to **state.values.structure**. Any “old database” reference likely means either (a) a pre–HiSense design that never landed here, or (b) a future persistence layer; **current behavior is in-memory state only**.

### 1.2 Where the Day/Week/Month Planner Actually Lives

| Layer | Location | Role |
|-------|----------|------|
| **Screen definition** | `src/01_App/apps-json/apps/hiclarify/app.json` | Plan section: Stepper (Today/Week/Month), Day/Week/Month sections with `when: values.structure.calendarView`, Lists bound to structure |
| **Rendering** | `src/03_Runtime/engine/core/json-renderer.tsx` | Resolves `when`, `itemsFromState`, `blocksFromState`, `scheduledFromState`, `cellsFromState`, `bodyFromState` from `stateSnapshot.values` (and dotted paths) |
| **State** | `state.values.structure` (single key) | StructureSlice: tree, items, blocksByDate, rules, calendarView, selectedDate, weekDates, monthRollup, stats |
| **Actions** | `src/05_Logic/logic/actions/structure.actions.ts` | structureAddItem, structureAddItems, structureUpdateItem, structureDeleteItem, structureSetBlocksForDate, structureCancelDay, structureAddFromText, structureAddJourney, **calendarSetDay**, **calendarSetWeek**, **calendarSetMonth**, calendarSetDate |
| **Engines** | `src/05_Logic/logic/engines/structure/` | recurrence (isDueOn), prioritization (sortByPriority), aggregation (aggregateByDateRange), scheduling, etc. |

---

## 2. How the Current Planner Reads and Structures Data

### 2.1 State Shape (StructureSlice)

- **Source of truth:** `getState().values.structure` (written only via `state.update` with key `"structure"`).
- **Read path:** `getSlice()` in `structure.actions.ts` reads from `getState()?.values?.[STRUCTURE_KEY]`; if missing or invalid, it writes an initial slice (with `BASE_PLANNER_TREE`) and returns it.
- **Initialization:** The slice is **lazy**: it is created on first use by any action that calls `getSlice()`. There is no bootstrap on app load or on navigating to the Plan tab.

### 2.2 Data Flow for Day/Week/Month UI

1. **View gating:** Sections use `when: { state: "values.structure.calendarView", equals: "day" | "week" | "month" }`. The renderer resolves this via `getByPath(stateSnapshot, "values.structure.calendarView")`. If `calendarView` is undefined, the renderer **special-cases** `equals === "day"` and treats it as `"day"` so the Day view shows on first open.
2. **Day view:**
   - **Tasks:** List with `scheduledFromState: "structure"`, `scheduledFromStateDateKey: "structure.selectedDate"`. Renderer resolves `stateSnapshot.values.structure`, then filters `slice.items` with `isDueOn(item, date)` and sorts with `sortByPriority`.
   - **Blocks:** List with `blocksFromState: "structure.blocksByDate"`, `blocksFromStateDateKey: "structure.selectedDate"`. Renderer reads `structure.blocksByDate[selectedDate]` (array of Block: start, end, label).
3. **Week view:**
   - Seven “day columns”: each has List with `blocksFromState` / `blocksFromStateDateKey` and List with `scheduledFromState` / `scheduledFromStateDateKey` for `structure.weekDates.0` … `structure.weekDates.6`.
   - `weekDates` is set only when **calendarSetWeek** runs (7 ISO dates from week start).
4. **Month view:**
   - List with `cellsFromState: "structure.monthRollup"`. Renderer reads `structure.monthRollup` (Rollup[]: period, count). **monthRollup** is set only when **calendarSetMonth** runs (aggregateByDateRange for the month).
5. **Stats card:** `bodyFromState: "structure.stats"`. Renderer formats `stats.todayCount`, `stats.weekCount`, `stats.monthCount`. Stats are computed inside **calendarSetDay** / **calendarSetWeek** / **calendarSetMonth** and written into the slice.
6. **Toolbar:** Today / Week / Month buttons dispatch `calendar.today`, `calendar.week`, `calendar.month` (mapped in action-registry to calendarSetDay, calendarSetWeek, calendarSetMonth).

### 2.3 Where State Snapshot Comes From

- **JsonRenderer:** `stateSnapshot = { ...rawState, ...rawState?.values, currentView: effectiveCurrentView }`, with `rawState = useSyncExternalStore(subscribeState, getState, getState)`.
- So `stateSnapshot.values` is `rawState.values` (the same reference). Paths like `structure.blocksByDate` are resolved as `stateSnapshot.values.structure` → `.blocksByDate`; `structure.selectedDate` as `stateSnapshot.values.structure.selectedDate`, etc. All bindings already assume **state.values.structure**.

---

## 3. Step-by-Step Feasibility Plan (Rewire to state.values.structure)

The UI is **already wired** to `state.values.structure` in app.json and json-renderer. The “rewire” is really: **ensure the slice is bootstrapped and kept in sync so that the same UI renders correctly** (no new UI code).

### Step 1: Bootstrap structure on first Plan view

- **Goal:** Ensure `state.values.structure` exists and has at least `calendarView`, `selectedDate`, and (when needed) `weekDates`, `monthRollup`, `stats` so that Day/Week/Month sections and Lists do not see undefined.
- **Options:**  
  (A) When the user navigates to the Plan tab (currentView === "plan"), dispatch an action that calls the equivalent of **calendarSetDay** (no date payload → today). That runs getSlice(), sets calendarView, selectedDate, stats, and writeSlice.  
  (B) Or: ensure the screen’s **defaultState** (e.g. from app.json or page-level props) includes `values.structure` with a minimal shape (calendarView: "day", selectedDate: today ISO, tree, items: [], blocksByDate: {}, rules: {}). Then no dispatch is required for first paint.
- **Recommendation:** Prefer (A) so a single code path (actions) owns structure shape; document that “open Plan” triggers calendarSetDay (or a thin “structure.ensure” action that does the same).

### Step 2: Ensure Week view has weekDates

- **Current:** calendarSetWeek computes `weekDates` (7 ISO dates from week start) and writeSlice. JSON already binds `blocksFromStateDateKey` and `scheduledFromStateDateKey` to `structure.weekDates.0` … `structure.weekDates.6`.
- **Gap:** If the user opens Plan and clicks “Week” before any other action, getSlice() will run inside calendarSetWeek and structure will be created with week view and weekDates. No change required if Step 1 is done (Plan open triggers calendarSetDay); otherwise the first click on Week will create the slice with week data. Confirm that **calendarSetWeek** is registered and invoked by the Toolbar “Week” button (already the case in app.json).

### Step 3: Ensure Month view has monthRollup

- **Current:** calendarSetMonth runs aggregateByDateRange(slice.items, first, last, "day") and sets monthRollup and stats.
- **Gap:** Same as Step 2: if structure is bootstrapped on Plan open (Step 1), switching to Month will run calendarSetMonth and populate monthRollup. No additional mapping; verify action binding.

### Step 4: Default state for when/structure paths

- **Current:** shouldRenderNode uses getByPath(state, key) ?? getByPath(defaultState, key). For "values.structure.calendarView", if neither state nor defaultState has it, only the special case for "day" makes the Day section visible.
- **Action:** Either (a) bootstrap structure in state on Plan load (Step 1), or (b) provide defaultState with `values.structure.calendarView: "day"` and optionally `values.structure.selectedDate` so Week/Month sections stay hidden until user clicks Week/Month. Reduces reliance on the renderer’s undefined → "day" special case.

### Step 5: scheduledFromState path resolution

- **Current:** scheduledFromState path is "structure"; renderer then uses scheduledFromStateDateKey to get the date and reads slice.items from the object at "structure". So it expects stateSnapshot.values.structure to be the full slice (with .items, .rules). Confirmed in json-renderer: slice = stateSnapshot.values.structure, dateKey from structure.selectedDate or structure.weekDates.i.
- **Mapping:** No change; path "structure" is correct. Ensure getSlice() always returns (and writeSlice writes) the full slice including items, rules, selectedDate, weekDates so that scheduledFromState resolution never sees a partial object.

### Step 6: blocksByDate and selectedDate / weekDates

- **Current:** blocksByDate is slice.blocksByDate; date key is slice.selectedDate (day) or slice.weekDates[i] (week). If blocksByDate[date] is missing, the List gets undefined and may render empty. structureSetBlocksForDate(date, blocks) writes blocks for one date.
- **Gap:** blocksByDate is not auto-populated. Day/Week columns show time blocks only if the app or a future feature has written blocks for those dates. For “same UI” parity, either (a) accept empty blocks until a block-editing feature exists, or (b) add an optional “default day template” from rules.schedulingDefaults.defaultDayTemplate and seed blocksByDate for selectedDate / weekDates when switching view. Document as optional enhancement.

### Step 7: Stats and bodyFromState

- **Current:** structure.stats is set by calendarSetDay, calendarSetWeek, calendarSetMonth (computeStats(slice)). Card with bodyFromState: "structure.stats" renders "Today: X | Week: Y | Month: Z".
- **Mapping:** Already correct. Ensure computeStats is called whenever slice or selectedDate changes in those actions (already the case).

### Step 8: itemsFromState for “all items” list

- **Current:** List with itemsFromState: "structure.items" shows all structure items; mapper produces label (title) and behavior (structure:updateItem).
- **Mapping:** No change; state.values.structure.items is the canonical list.

### Step 9: Action registry and names

- **Current:** calendar.today, calendar.week, calendar.month and calendar:setDay, calendar:setWeek, calendar:setMonth are registered to calendarSetDay, calendarSetWeek, calendarSetMonth. structure:addFromText, structure:addItem(s), structure:updateItem, structure:deleteItem, structure:setBlocksForDate, structure:addJourney, etc. are registered.
- **Action:** Verify no duplicate or missing names; document that all planner UI behaviors must go through these actions and state.update("structure", ...) only.

### Step 10: Placeholder planner_screen.json

- **Current:** `planner_screen.json` (under apps/hiclarify and HiClarify/build/planner) contains only a placeholder card (“Placeholder. Coming soon.”).
- **Action:** Decide whether the real planner content lives only in the monolithic app.json Plan section (current) or should be moved into a dedicated planner_screen.json loaded when routing to the planner. No change to data flow; only to where the JSON is defined.

---

## 4. Gaps Summary

| Gap | Description | Severity |
|-----|-------------|----------|
| **Structure bootstrap** | structure slice is created on first action (getSlice). If user opens Plan and never clicks Today/Week/Month, structure may be undefined until first calendar action. Week/Month sections depend on weekDates/monthRollup set by those actions. | Medium – mitigated by renderer treating undefined calendarView as "day". |
| **defaultState.structure** | defaultState (e.g. from json.state) does not typically include values.structure. Initial visibility for Week/Month relies on calendarView being set by an action or on defaultState. | Low if Step 1 (bootstrap on Plan open) is done. |
| **blocksByDate empty** | No automatic population of time blocks per date. Day/Week block lists may be empty until structureSetBlocksForDate is used or a default template is applied. | Low for “same UI” (layout is the same; content can be empty). |
| **selectedDate on first load** | If structure is bootstrapped only when user clicks “Today”, the very first paint might not have selectedDate; scheduledFromState would then use a fallback date (today in renderer). | Low – renderer has fallback to today. |
| **No date picker** | JSON has no control to change selectedDate (e.g. “previous/next day” or date picker). calendarSetDate exists but may not be bound in UI. | Feature gap; not a rewire blocker. |

---

## 5. Required Mappings (Summary)

| UI / Behavior | Data source | Mapping status |
|---------------|-------------|----------------|
| Day section visible | values.structure.calendarView === "day" | Done (when + special case) |
| Week section visible | values.structure.calendarView === "week" | Done |
| Month section visible | values.structure.calendarView === "month" | Done |
| Day tasks | structure.items + selectedDate → isDueOn + sortByPriority | Done (scheduledFromState) |
| Day blocks | structure.blocksByDate[structure.selectedDate] | Done (blocksFromState) |
| Week day i tasks | structure.items + structure.weekDates[i] | Done |
| Week day i blocks | structure.blocksByDate[structure.weekDates[i]] | Done |
| Month cells | structure.monthRollup | Done (cellsFromState) |
| Stats card | structure.stats (todayCount, weekCount, monthCount) | Done (bodyFromState) |
| All items list | structure.items | Done (itemsFromState) |
| Today/Week/Month buttons | calendar.today / .week / .month → calendarSetDay/Week/Month | Done (action-registry) |

All required mappings for the **current** day/week/month UI are already implemented in app.json and json-renderer. The main work is **bootstrap and consistency** (Step 1 and defaultState if desired).

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| **Structure undefined on first render** | Bootstrap structure when entering Plan tab (dispatch calendarSetDay or structure.ensure). Optionally add defaultState.values.structure for initial paint. |
| **Large items array** | structure.items is in memory; no pagination in current bindings. For very large lists, consider virtualized list or filtering by date/category in JSON or a derived key. |
| **weekDates / monthRollup stale** | They are updated only when calendarSetWeek / calendarSetMonth run. Navigating “next week” / “next month” requires actions that call calendarSetWeek(undefined) or with a new date and re-run aggregation. Document that “next/prev” buttons must dispatch calendar actions with the new date. |
| **blocksByDate never populated** | UI still renders (empty blocks). Future feature or rules.schedulingDefaults.defaultDayTemplate can seed blocks; not required for rewire parity. |
| **Multiple writers** | Only structure actions should write to state.values.structure (single key, atomic update). Ensure no other code path does state.update("structure", ...) with a partial or conflicting shape. |
| **Renderer path resolution** | All paths are from stateSnapshot.values (e.g. "structure.blocksByDate"). If state is ever namespaced differently (e.g. values.planner.structure), JSON and renderer would need path updates. Keep single key "structure" under values. |

---

## 7. Conclusion

- **Original TSX planner:** There is no separate TSX planner component that used an “old database” in this repo. The day/week/month planner is the **JSON-defined Plan section** in app.json, rendered by the JSON renderer and bound to **state.values.structure**.
- **Data flow:** Structure slice is read via getSlice() in actions and via stateSnapshot.values.structure in the renderer; all List/Card bindings (itemsFromState, blocksFromState, scheduledFromState, cellsFromState, bodyFromState) and when (calendarView) already use this slice.
- **Feasibility:** Rewiring is **complete** at the binding level. Remaining work is **operational**: bootstrap structure when the user opens the Plan tab (and optionally supply defaultState), ensure calendar actions are the only writers, and document optional enhancements (default blocks, date picker, next/prev). No new UI code is required to “render the same UI” from state.values.structure; only ensure the slice exists and is updated by existing actions.
