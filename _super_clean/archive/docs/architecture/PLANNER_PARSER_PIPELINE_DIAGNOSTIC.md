# Planner Parser Pipeline — End-to-End Diagnostic

When text is added through **structure:addFromText**, this doc describes what the pipeline does, what it does *not* do, and how to run the diagnostic.

## Pipeline steps (what is traced)

| Step | Question | Fires? | Action/Engine |
|------|----------|--------|----------------|
| **(1) Parse dates/times** | Does the parser extract date phrases (e.g. "tomorrow", "Thursday")? | ✅ Yes | `extreme-mode-parser` → `interpretStream`; `structure-mapper.engine` → `mapToCandidates`; `date-utils` → `extractDatePhrase` |
| **(2) Create structured items** | Are candidates written to `state.values.structure.items`? | ✅ Yes | `structureAddFromText` → `streamToCandidates` → `normalizeItem` → `writeSlice` |
| **(3) Assign due dates** | Do created items get `dueDate` set when the text contains a date phrase? | ✅ Yes | `mapToCandidates` sets `dueDate` from `extractDatePhrase(title, refDate)`; `normalizeItem` preserves it |
| **(4) Update blocksByDate** | Does addFromText update `state.values.structure.blocksByDate`? | ❌ **No** | **Chain break.** Only **structure:setBlocksForDate** updates `blocksByDate`. addFromText never calls it. |
| **(5) Update selectedDate/calendarView** | Does addFromText set calendar view or selected date? | ❌ **No** | **Chain break.** Only **calendar:setDay**, **calendar:setWeek**, **calendar:setMonth**, **calendar:setDate** update these. |
| **(6) scheduledFromState lists** | Do planner lists (day/week) show the new tasks? | ✅ Yes (at render) | No action. **json-renderer** Phase C derives list from `structure.items` filtered by `isDueOn(item, date)`; `dateKey` comes from `structure.selectedDate` or `structure.weekDates[i]` or falls back to today. |

## Where the chain breaks

- **Step 4 — blocksByDate:** `structure:addFromText` only updates `structure.items`. It does **not** call `structure:setBlocksForDate`. So time blocks for the day layout are never updated by the parser pipeline. If the UI expects `blocksByDate[date]` to be populated from added tasks, that must be done by some other flow (e.g. a separate action or a sync from items → blocks).
- **Step 5 — selectedDate/calendarView:** addFromText does not switch the calendar to the due date or set view. So the calendar view and selected date are unchanged by adding text. Lists still populate (step 6) because the renderer uses `selectedDate`/`weekDates`/today; if the user hasn’t set a date, the renderer falls back to today.

## How to run the diagnostic

1. **From the app (behavior / dev):**  
   Dispatch an action with name **diagnostics:plannerParserPipeline** and params:
   - `text` (optional): sample input, e.g. `"Review docs tomorrow"`. Default: `"Review docs tomorrow"`.
   - `dryRun` (optional): if `true` (default), only trace and report; if `false`, also run **structure:addFromText** so state is updated.

2. **Result:**
   - Console: each step is logged with prefix `[PlannerParserPipeline]` (1–6 and SUMMARY).
   - State: report is written to **state.values.diagnostics_plannerParserPipeline** with:
     - `step1_parseDatesTimes` … `step6_scheduledFromStatePopulates`
     - `summary.allOk`, `summary.brokenSteps`
     - `timestamp`

3. **Optional trace on real addFromText:**  
   Set **state.values.diagnostics_plannerPipelineTrace** to `true`. Then every **structure:addFromText** call will log:
   - ENTER with text
   - (1) parse → candidates count and per-candidate title/dueDate
   - (2) writeSlice; (3)–(5) explicit note that blocksByDate and selectedDate/calendarView are NOT updated; (5) scheduledFromState will populate at render.

## Summary table

| Step | Expected? | Fires? | Who does it |
|------|-----------|--------|-------------|
| 1. Parse dates/times | Yes | ✅ | Parser + date-utils |
| 2. Items in structure.items | Yes | ✅ | structureAddFromText |
| 3. Due dates on items | Yes | ✅ | mapToCandidates + normalizeItem |
| 4. blocksByDate updated | Maybe | ❌ | **Nothing in this pipeline** — only structure:setBlocksForDate |
| 5. selectedDate/calendarView updated | Maybe | ❌ | **Nothing in this pipeline** — only calendar:* actions |
| 6. scheduledFromState lists | Yes | ✅ | json-renderer (derived at render) |

**Conclusion:** The pipeline is intact for (1)–(3) and (6). Steps (4) and (5) do **not** run as part of addFromText; if product requirements need “add from text” to update blocksByDate or to change the calendar view to the task’s due date, those need to be added (e.g. call structure:setBlocksForDate or calendar:setDay from the same flow, or a follow-up action).
