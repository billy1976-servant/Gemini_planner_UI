# V2 Unified Planner Merge Plan

Analysis and step-by-step integration plan. Implementation completed per this document.

---

## Phase 1 — Discovery Summary

### 1.1 JSX_DayView.tsx

| Aspect                    | Finding                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Time column**           | Rendered inside a single `dayGrid` div: `position: absolute`, `left: 0`, `width: 48`, `top: 0`, `bottom: 0`. Contains `TOTAL_SLOTS + 1` rows (06:00–24:00, 30-min slots).                        |
| **Time slot height**      | `SLOT_HEIGHT = 30`; each label uses `height: 30`, `lineHeight: "30px"`.                                                                                                                          |
| **Grid constants**       | `DAY_START_MIN = 360`, `DAY_END_MIN = 1440`, `SLOT_MINUTES = 30`, `TOTAL_SLOTS = 36`.                                                                                                            |
| **Block positioning**     | Local `blockToPosition(block)` returns `{ top: "${top}%", height: "${height}%" }` using `fromHM()` from `@/logic/planner/date-helpers`. Blocks are `position: absolute`, `left: 52`, `right: 8`. |
| **Scroll**                | No inner scroll on the grid. The grid has fixed height `TOTAL_SLOTS * SLOT_HEIGHT` (1080px). Page-level scroll via `section` with padding.                                                       |
| **Vertical height owner** | The single wrapper `div` with `styles.dayGrid` and `height: TOTAL_SLOTS * SLOT_HEIGHT` owns height; time axis and blocks are siblings inside it (both positioned within that container).         |
| **Data**                  | `useDayViewModel()` → `blocks`, `items`, `selectedDate`, etc. Blocks from `structure.blocksByDate[selectedDate]`; structure.items for task list below.                                           |

### 1.2 JSX_planner_test.tsx

| Aspect                | Finding                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout**            | Chunk-based: vertical list of `ChunkCard`s (Morning, Lunch, Afternoon, Evening). No continuous 06:00–24:00 axis.                                                                              |
| **Time handling**     | Local `toMin` / `fromMin` (duplicates of date-helpers). Chunks have `start`/`end` ("08:00", "12:00", etc.).                                                                                  |
| **Chunk card height** | Per-chunk: internal "hour ticks" use `height: 40` per tick — not aligned to DayView's 30px/slot.                                                                                             |
| **Scroll**            | `main` is a flex column with gap; vertical scroll only. No horizontal swipe.                                                                                                                  |
| **Vertical height**   | No shared time grid. Each ChunkCard is self-contained with its own mini time strip (64px + content).                                                                                         |
| **Data**              | Local state: `chunks` (INITIAL_CHUNKS), `date`. Catalog/category logic is self-contained; no `structure.items` or `blocksByDate`.                                                             |

### 1.3 JSX_PlannerShell.tsx

| Aspect              | Finding                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Role**            | Tab bar: Day \| Week \| Month \| Add tasks.                                                                      |
| **Planner test**    | **Not** in shell. `JSX_planner_test` is a standalone screen (e.g. via dev `?screen=HiClarify/JSX_planner_test`). |
| **View switching**  | Tab click → swap component; no shared layout or fixed time column.                                               |

### 1.4 JSX_WeekView.tsx (reference)

- Own time axis (sticky left), `DAY_START_MIN`/`DAY_END_MIN` same as DayView; **SLOT_HEIGHT = 32** (vs DayView 30). Own `blockToPosition` (same formula). Horizontal scroll for day columns. Useful as "future week layer" in the unified model.

---

## Phase 2 — Unified Layout Model

Single reference: **one vertical time scale (06:00–24:00), fixed left column; only the content area changes (swipe/pager).**

- **PlannerRoot:** Viewport, shared header (date + nav), single body layout. Body: flex row — **TimeAxis** (fixed width) + **SwipeContainer** (flex: 1, overflow hidden).
- **TimeAxis (TimelineAxis.tsx):** Renders 06:00–24:00 using one shared slot height (30px). Height = `TOTAL_SLOTS * SLOT_HEIGHT`.
- **SwipeContainer:** Horizontal pager; children: DayTimelineLayer \| ChunkPlannerLayer \| FutureWeekLayer (placeholder).
- **Vertical sync:** TimeAxis height = content area height = `TOTAL_SLOTS * SLOT_HEIGHT`. All layers use the same `blockToPosition` and constants.

---

## Phase 3 — Time Axis Extraction

- **TimelineAxis.tsx** renders 06:00–24:00 using shared constants and `toMin` from date-helpers. Optional props: `slotHeight`, `dayStartMin`, `dayEndMin`, `slotMinutes`, `width`.
- **planner-timeline-constants.ts** defines `DAY_START_MIN`, `DAY_END_MIN`, `SLOT_MINUTES`, `SLOT_HEIGHT`, `TOTAL_SLOTS`, `TIMELINE_GRID_HEIGHT`, and `blockToPosition(block)`.

---

## Phase 4 — DayView Adaptation

- Time column removed from JSX_DayView. Uses shared `blockToPosition` and `TIMELINE_GRID_HEIGHT`.
- Block slots use `left: 8`, `right: 8` (no 52px offset; time column is in parent).
- Optional `embedded` prop: when true, renders only grid + tasks (no screen wrapper or header) for use inside PlannerRoot.

---

## Phase 5 — Chunk (Planner Test) Adaptation

- **ChunkPlannerLayer.tsx** renders chunks as time-aligned bands using shared `blockToPosition` and `TIMELINE_GRID_HEIGHT`. Same vertical scale as Day timeline.
- Chunk data remains local state (INITIAL_CHUNKS). Time formatting can later use date-helpers in JSX_planner_test when refactored.

---

## Phase 6 — Swipe Engine

- **SwipeContainer** uses CSS scroll snap: `scroll-snap-type: x mandatory`, `scroll-snap-align: start` on panes. Time column is a sibling, never moves horizontally.
- **SwipePane** wraps each layer with same height and full width; vertical overflow auto for scrollable content (e.g. Day tasks).

---

## Phase 7 — State and Position Consistency

- **fromHM / toMin:** Use from `@/logic/planner/date-helpers`. ChunkPlannerLayer uses shared `blockToPosition` only (no time string parsing in layer).
- **blockToPosition:** Single implementation in `planner-timeline-constants.ts`; used by DayView, ChunkPlannerLayer, and TimelineAxis (axis does not use it; it only renders labels).
- **Slot height:** Unified on 30px for TimeAxis, DayView content, and ChunkPlannerLayer.

---

## Phase 8 — Integration Sequence and Risks

### Implementation order (completed)

1. Shared constants and `blockToPosition` — `planner-timeline-constants.ts`
2. TimelineAxis — `TimelineAxis.tsx`
3. PlannerRoot + fixed TimeAxis + single content area — `UnifiedPlannerLayout.tsx`
4. DayView content-only + shared blockToPosition — `JSX_DayView.tsx` with `embedded` prop
5. SwipeContainer + Day pane — inside PlannerRoot
6. ChunkPlannerLayer time-aligned + second pane — `ChunkPlannerLayer.tsx` + third pane placeholder (Week)
7. Shell: Day tab renders PlannerRoot — `JSX_PlannerShell.tsx`
8. (Later) Week layer with same axis

### Risk points

- **Height sync:** Single source of truth (`planner-timeline-constants.ts`) keeps TimeAxis and content aligned.
- **Duplicate time helpers in planner_test:** When refactoring JSX_planner_test further, remove local `toMin`/`fromMin` and use date-helpers.
- **WeekView slot height:** WeekView still uses 32px; when added as a pane, use shared 30px or make constants configurable.
- **Scroll ownership:** Day pane has vertical scroll for grid + tasks; body height is fixed to `TIMELINE_GRID_HEIGHT`; entire screen can scroll if viewport is smaller.

---

## Architecture Diagram (high level)

```
PlannerRoot
  ├─ Header (date nav, ViewSwitcherLinks, scheduled section, cancel day)
  └─ Body (flex row)
        ├─ TimeAxis (fixed left, 06:00–24:00)
        └─ SwipeContainer (horizontal scroll snap)
              ├─ Pane 1: DayTimelineLayer (JSX_DayView embedded)
              ├─ Pane 2: ChunkPlannerLayer
              └─ Pane 3: Week placeholder (future)
```

---

## References (file paths)

- `src/01_App/apps-tsx/HiClarify/JSX_DayView.tsx`
- `src/01_App/apps-tsx/HiClarify/JSX_planner_test.tsx`
- `src/01_App/apps-tsx/HiClarify/JSX_PlannerShell.tsx`
- `src/01_App/apps-tsx/HiClarify/UnifiedPlannerLayout.tsx`
- `src/01_App/apps-tsx/HiClarify/TimelineAxis.tsx`
- `src/01_App/apps-tsx/HiClarify/ChunkPlannerLayer.tsx`
- `src/01_App/apps-tsx/HiClarify/planner-timeline-constants.ts`
- `src/05_Logic/logic/planner/date-helpers.ts`
- `src/01_App/apps-tsx/HiClarify/usePlannerViewModels.ts`
- `src/05_Logic/logic/engines/structure/structure.types.ts` (Block type)
