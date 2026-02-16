# Planner Runtime Control Audit

**Mode:** Read-only analysis. No code changes. Structural x-ray only.

**Goal:** Map how the Planner is mounted, rendered, and where it bypasses system control (layout, palette, behavior, JSON pipeline, overlays).

---

## Phase 1 — Trace Planner Entry Path

### app/page.tsx (user route `/`)

- **effectivePath:** `currentView || defaultPath`
  - `currentView` from `stateSnapshot?.values?.currentView` (state-store).
  - `defaultPath` = `isReturningUser() ? HOME_SCREEN_PATH : ENTRY_SCREEN_PATH`  
    (`HOME_SCREEN_PATH = "HiClarify/home/home_screen"`, `ENTRY_SCREEN_PATH = "tsx:HiClarify/HiClarifyOnboarding"`).
- **Planner path:** Navigation to planner sets `currentView` to `"HiClarify/planner_screen"` (e.g. from `me_home.json` navigate action). So `effectivePath = "HiClarify/planner_screen"`.
- **loadScreen(effectivePath):** No `tsx:` prefix → JSON branch in screen-loader. Client calls `safeImportJson`, which **fetches** `/api/screens/HiClarify/planner_screen.json`.
- **API response:** `src/app/api/screens/[...path]/route.ts` has a **hardcoded planner branch** (lines 95–107): for `HiClarify/planner_screen` (or `planner_screen.json`, or `HiClarify/build/planner/planner_screen`) it **does not** return the JSON file; it returns:
  ```json
  { "__type": "tsx-screen", "__tsx__": true, "screen": "HiClarify/JSX_PlannerShell", "path": "HiClarify/JSX_PlannerShell" }
  ```
- **Branch taken:** TSX branch. `data.__type === "tsx-screen"` → `json = null`, `isTsxScreen = true`.
- **What actually renders:** Page.tsx **ignores** `data.path`. For *any* TSX screen it renders **only** `<HiClarifyOnboarding />` (lines 127–132). So when the user navigates to the planner, **the planner is never shown in user mode**; they see HiClarifyOnboarding instead.

### screen-loader.ts

- For path **without** `tsx:` prefix, `loadScreen` does **not** call the API itself for the initial branch decision: the **client** calls `loadScreen("HiClarify/planner_screen")`, and screen-loader goes to the **JSON** branch and uses `safeImportJson(pathWithJson)`.
- `safeImportJson` **fetches** `/api/screens/HiClarify/planner_screen.json`. The **API** returns the `tsx-screen` marker above, so the **resolved** value from `loadScreen` is `{ __type: "tsx-screen", path: "HiClarify/JSX_PlannerShell" }`.
- For path **with** `tsx:` prefix, `loadScreen` returns immediately `{ __type: "tsx-screen", path: tsxPath }` and never fetches JSON.

### Where the planner *is* actually mounted

- **Dev route only:** `src/app/dev/page.tsx` with `?screen=HiClarify/planner_screen` (or any path that the API redirects to the planner).
- Flow:
  1. `screen = searchParams.get("screen")` → e.g. `"HiClarify/planner_screen"`.
  2. `loadScreen(screen)` → fetch `/api/screens/HiClarify/planner_screen.json` → API returns `{ __type: "tsx-screen", path: "HiClarify/JSX_PlannerShell" }`.
  3. `data.__type === "tsx-screen"` and `tsxPath = "HiClarify/JSX_PlannerShell"`.
  4. `resolveTsxScreen(tsxPath)` uses `AUTO_TSX_MAP` (require.context over `apps-tsx`) → key `"HiClarify/JSX_PlannerShell"` → dynamic import of `JSX_PlannerShell.tsx`.
  5. `TsxComponent = JSX_PlannerShell`; render: `<PreviewStage><TsxComponent /></PreviewStage>`.
- So the **true entry** for the planner in the app is **dev page** + API returning the tsx-screen marker; the **component root** is **JSX_PlannerShell**.

### Mount order (when planner is shown in dev)

| Order | Component | File |
|-------|-----------|------|
| 1 | DevPage | `src/app/dev/page.tsx` |
| 2 | PreviewStage | (wraps TSX content) |
| 3 | **JSX_PlannerShell** | `HiClarify/JSX_PlannerShell.tsx` ← **true root** |
| 4 | PlannerRoot (when Day tab) | `UnifiedPlannerLayout.tsx` |
| 5 | TimelineAxis, SwipeContainer, SwipePane(s) | `UnifiedPlannerLayout.tsx` |
| 6 | JSX_DayView (embedded), ChunkPlannerLayer, Week placeholder | Inside SwipePanes |

- **JSON branch:** Planner is **not** rendered from the JSON screen `planner_screen.json` (that file is a placeholder Section/Card). The API intercepts the path and returns the TSX marker, so the planner **always** goes TSX when requested via API.
- **True root:** **JSX_PlannerShell** is the single root for the planner experience when mounted.

---

## Phase 2 — Layout Control Trace

| File | Owns layout? | Uses layout resolver? | Overrides global layout? |
|------|--------------|----------------------|---------------------------|
| **JSX_PlannerShell.tsx** | Yes | No | Yes |
| **UnifiedPlannerLayout.tsx** | Yes | No | Yes |
| **ChunkPlannerLayer.tsx** | N/A (re-export) | No | — |
| **JSX_planner_test.tsx** | Yes | No | Yes |
| **TimelineAxis.tsx** | Yes | No | Yes |
| **JSX_DayView.tsx** | Yes | No | Yes |
| **JSX_WeekView.tsx** | Yes | No | Yes |
| **JSX_MonthView.tsx** | Yes | No | Yes |
| **ViewSwitcherLinks.tsx** | Local (inline) | No | No |

**Details:**

- **All planner TSX files** use manual flex/grid and explicit dimensions (e.g. `minHeight: "100vh"`, `display: "flex"`, `flexDirection: "row"`, `height: TIMELINE_GRID_HEIGHT`, `position: "sticky"`, `position: "absolute"`). None call `getLayout`, `subscribeLayout`, or any layout-store API. None use template profiles or section/card layout resolver. Layout is fully owned and overrides any global layout for the planner tree.

---

## Phase 3 — Palette Control Trace

| File | Palette controlled? | Inline styles present? |
|------|---------------------|-------------------------|
| **JSX_PlannerShell.tsx** | Partial | Yes |
| **UnifiedPlannerLayout.tsx** | Partial | Yes |
| **JSX_planner_test.tsx** | Partial | Yes |
| **TimelineAxis.tsx** | Partial | Yes |
| **JSX_DayView.tsx** | Partial | Yes |
| **JSX_WeekView.tsx** | Partial | Yes |
| **JSX_MonthView.tsx** | Partial | Yes |
| **ViewSwitcherLinks.tsx** | Partial | Yes |

**Details:**

- **usePaletteCSS:** Not used in any planner file. Layout (UserLayoutChrome) may call it, but the planner tree does not.
- **resolveParams / palette tokens:** Not used. Styling uses **CSS variables** (e.g. `var(--color-bg-primary)`, `var(--color-text-primary)`, `var(--color-border)`, `var(--spacing-md)`, `var(--font-size-sm)`). If the shell injects these variables (e.g. from palette-store), the planner can *reflect* theme; it does not *pull* from a palette API.
- **Inline styles:** All use `style={...}` or `styles.*` objects (React.CSSProperties). No palette resolver or token lookup inside planner components.
- **Verdict:** Palette control is **partial**: token-like names via CSS vars, but no direct use of palette engine or usePaletteCSS inside the planner.

---

## Phase 4 — Behavior Coupling

| File | behavior-listener | state-store | action registry (runAction) | Local state only | Direct event handlers |
|------|-------------------|------------|-----------------------------|------------------|-------------------------|
| **JSX_PlannerShell.tsx** | No | Yes (useSyncExternalStore, getState) | Yes (runAction: calendar:setDay/Week/Month) | Yes (showAdd) | Yes (onClick goTo) |
| **UnifiedPlannerLayout.tsx** | No | Yes (getState) | Yes (runAction: calendar:*, structure:cancelDay, structure:setScheduledSection) | No | Yes (onClick nav, select) |
| **usePlannerViewModels.ts** | No | Yes (getState, subscribeState) | No | Yes (slice) | No |
| **JSX_DayView.tsx** | No | Yes (getState) | Yes (runAction: calendar:*, structure:*) | No | Yes (onClick, onChange) |
| **JSX_planner_test.tsx** | No | No | No | Yes (date, chunks, modals) | Yes (onClick, long-press) |
| **ChunkPlannerLayer** (in JSX_planner_test) | No | No | No | Yes (chunks) | Yes |
| **TimelineAxis.tsx** | No | No | No | No | No |
| **ViewSwitcherLinks.tsx** | No | Yes (getState) | Yes (runAction: calendar:*) | No | Yes (onClick) |

**Summary:**

- Planner does **not** use `installBehaviorListener` or the global behavior-listener for navigation or actions.
- It **does** use **state-store** (getState, subscribeState, useSyncExternalStore) and **runAction** (action-runner → getActionHandler → action registry: `calendar:setDay`, `calendar:setWeek`, `calendar:setMonth`, `structure:cancelDay`, `structure:setScheduledSection`, `structure:loadRuleset`, `structure:ensureTaskTemplateRows`, etc.).
- **JSX_planner_test** (and its ChunkPlannerLayer export) uses only local state and direct event handlers; no state-store or action registry.
- Behavior authority: **state-store + action registry**; not behavior-listener or JSON-driven behavior.

---

## Phase 5 — Overlay / Wrapper Detection

| Overlay / layer | Origin file | Notes |
|-----------------|-------------|--------|
| **Sticky header** | UnifiedPlannerLayout.tsx | `position: "sticky", top: 0, zIndex: 10` — in-flow, not a global overlay |
| **Time axis wrap** | UnifiedPlannerLayout.tsx | `position: "sticky", left: 0, zIndex: 2` — sticky column |
| **Modal (slot options)** | JSX_planner_test.tsx | `modalOverlay` (position: fixed, inset: 0, zIndex: 30); `modalPanel` |
| **Folder picker modal** | JSX_planner_test.tsx | Same pattern, zIndex: 50 |
| **Continue-after modal** | JSX_planner_test.tsx | `modalOverlay` + `modalPanel` |
| **Month view overlay bar** | JSX_MonthView.tsx | `overlayBar` (sticky, zIndex: 20); UI for overlay mode (priority/health/projects), not a floating modal |

**Fixed-position layers:**

- **JSX_planner_test.tsx:** Three modals (slot options, folder picker, continue-after), all `position: "fixed"`, overlay + panel. Used only when that screen is mounted (e.g. standalone JSX_planner_test or ChunkPlannerLayer’s parent has no modals; ChunkPlannerLayer itself does not render the modals — the full JSX_planner_test page does).
- **ChunkPlannerLayer** (export from JSX_planner_test): Renders only the time-aligned chunk list; **no modals**.
- No global app-level toolbars or panels are defined inside the planner; PreviewStage and dev chrome are outside the planner root.

---

## Phase 6 — Time Axis Sync Structure

- **Constants:** `planner-timeline-constants.ts` exports `DAY_START_MIN`, `DAY_END_MIN`, `SLOT_MINUTES`, `SLOT_HEIGHT`, `TOTAL_SLOTS`, `TIMELINE_GRID_HEIGHT`, and `blockToPosition(block)`.
- **TimelineAxis:** Rendered in **UnifiedPlannerLayout** inside `styles.timeAxisWrap` (sticky left column). Uses the same constants; height = `totalSlots * slotHeight` = same as `TIMELINE_GRID_HEIGHT`. Exports `TIMELINE_GRID_HEIGHT` (re-export from constants).
- **Swipe container:** In UnifiedPlannerLayout: `SwipeContainer` wraps `SwipePane` children. Structure:
  - `styles.body` = flex row, `height: TIMELINE_GRID_HEIGHT`, overflow hidden.
  - Left: `timeAxisWrap` → **TimelineAxis** (fixed width 48px, same height).
  - Right: `swipeWrap` → `swipeContainer` (flex row, scroll snap, overflow-x auto) → multiple **SwipePane** (each flex 0 0 100%, minWidth 100%, height 100%).
- **Panes:** First pane = Day (JSX_DayView embedded), second = Chunk (ChunkPlannerLayer), third = Week placeholder. All panes share the same vertical height (`TIMELINE_GRID_HEIGHT`) so the time axis and content stay aligned.
- **JSX_DayView (embedded):** Uses `blockToPosition` and `TIMELINE_GRID_HEIGHT` from planner-timeline-constants; grid height matches axis.
- **ChunkPlannerLayer:** Uses `blockToPosition` and `TIMELINE_GRID_HEIGHT` from same constants; blocks are positioned with the same scale as the axis.
- **Time scale:** Shared only via **constants** and **re-exports**; no React context or store for time scale. Single source of truth: `planner-timeline-constants.ts`.

---

## Phase 7 — Escape Points (Critical)

| System | Escaped? | How | Severity |
|--------|----------|-----|----------|
| **Layout engine** | Yes | All planner TSX own layout (flex/grid, dimensions); no layout-store, no template/section/card resolver. | **Hard** — planner is not composable by layout system |
| **Palette engine** | Partial | No usePaletteCSS or resolveParams in planner; uses CSS vars only. If shell sets vars, planner follows; planner does not query palette. | **Soft** — acceptable if vars are the contract |
| **JSON renderer** | Yes | Planner is never rendered by JsonRenderer. API returns tsx-screen; dev page mounts TSX root; user page does not show planner at all for planner path. | **Hard** — JSON pipeline never controls planner |
| **ExperienceRenderer** | Yes | Planner is not a node inside ExperienceRenderer. When shown, it replaces the JSON tree (TSX branch). | **Hard** — bypasses experience tree |
| **Registry (screen list)** | Partial | Planner appears in API/categories as a screen; resolution is API + AUTO_TSX_MAP. No single JSON “planner_screen” driving it (API overrides to TSX). | **Soft** — registry exists but path is special-cased |
| **Default state from JSON** | Yes | TSX branch gets no screen JSON → no `json?.state` → no default state from screen file. State comes from state-store and actions only. | **Hard** for JSON-driven default state |

**Summary:**

- **Soft escape:** Palette via CSS vars; registry/category listing.
- **Hard escape:** Layout, JSON renderer, ExperienceRenderer, default state from screen JSON; planner is a TSX-only, layout-self-owned screen when mounted.

---

## Phase 8 — Summary Section

### Planner Control Summary

| Question | Answer |
|----------|--------|
| **True root component** | **JSX_PlannerShell** (when planner is shown; only in dev with `?screen=HiClarify/planner_screen` or equivalent). |
| **Layout authority** | **Planner-owned.** No layout-store, no template/section/card resolver. All layout is inline/flex/grid and explicit dimensions in planner TSX. |
| **Palette authority** | **Partial.** CSS variables only; no usePaletteCSS or palette resolver in planner. Shell can drive vars; planner does not call palette engine. |
| **Behavior authority** | **State-store + action registry.** runAction(calendar:*, structure:*); getState/subscribeState for structure slice. No behavior-listener. |
| **JSON involvement** | **No.** Planner is never rendered from JSON. API returns tsx-screen; dev mounts JSX_PlannerShell. User route shows HiClarifyOnboarding for any tsx-screen (planner not shown). |
| **Overlay sources** | JSX_planner_test modals (slot options, folder picker, continue-after); UnifiedPlannerLayout sticky header and time axis; JSX_MonthView overlay bar (in-flow). All local to planner TSX. |
| **Control risks** | Layout and experience cannot be driven by JSON or layout engine; default state cannot be set from screen JSON; user route never shows planner when navigating to planner path. |

### What the planner is acting as

- **Tool engine:** Yes — calendar/structure actions, state-store, time grid, chunks.
- **App screen:** Yes — it is the full screen when mounted in dev (JSX_PlannerShell as root).
- **Shell layer:** Partially — it provides its own chrome (tabs, header, axis, swipe) and does not sit inside a JSON-defined shell.
- **Mixed:** It is a **TSX-only app screen** that behaves as a **tool engine** (state + actions + timeline) and **owns its own shell** (tabs, header, panes). It does not act as a slot inside the JSON/ExperienceRenderer pipeline.

---

*End of audit. No code changes; structural map only.*
