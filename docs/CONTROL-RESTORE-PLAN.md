# Control Restore Plan — TSX vs JSON/Layout/Palette Authority

**Mode:** Analysis only. No code changes, file moves, or refactors.  
**Goal:** Map why TSX screens (especially David onboarding) render outside the JSON/layout/palette control system and how to restore the architecture where **JSON = authority**, **TSX = renderer only**.

---

## 1. Where Control Was Lost

### 1.1 David Onboarding — Mount Chain

| Step | Location | What happens |
|------|----------|--------------|
| **Entry** | `src/app/dev/page.tsx` | When `?flow=...` is present (and no `screen`), the page does **not** call `loadScreen(screen)`. It calls `loadScreen("tsx:tsx-screens/onboarding/david-onboarding")` (hardcoded path at line 367). |
| **Loader** | `src/03_Runtime/engine/core/screen-loader.ts` | For any path starting with `tsx:`, `loadScreen()` **never fetches JSON**. It returns `{ __type: "tsx-screen", path: "tsx-screens/onboarding/david-onboarding" }` (lines 46–51). No screen JSON, no default state from JSON, no layout/palette from JSON. |
| **Page state** | `src/app/dev/page.tsx` (lines 370–377) | When `data?.__type === "tsx-screen"`, the page calls `resolveTsxScreen(data.path)` to get a dynamic component, then `setTsxMeta`, `setTsxComponent`, **`setJson(null)`**. |
| **Render branch** | `src/app/dev/page.tsx` (lines 482–489) | **Early return:** `if (TsxComponent) return ( <PreviewStage><TsxComponent /><RightFloatingSidebar /></PreviewStage> );` So the **entire** JSON pipeline is skipped: no `composeOfflineScreen`, no `sectionLayoutPresetOverrides`, no `ExperienceRenderer`, no `JsonRenderer`. |
| **Component** | `src/01_App/apps-tsx/tsx-screens/onboarding/david-onboarding.tsx` | Re-exported as default from `engine-viewer.tsx`. Renders a full page with its own layout, chrome, and styling. |

**Conclusion:** David onboarding is mounted **outside** ExperienceRenderer and JsonRenderer. Layout is never “chosen” by the system—the TSX component is the root.

### 1.2 Other TSX Entry Points

- **Dev page (`/dev`)**  
  - **With `?screen=<path>`:** If the API or loader returns `__type: "tsx-screen"` (e.g. `screen=tsx-screens/onboarding/david-onboarding` or any path that resolves to a TSX file in `apps-tsx`), the same early return applies: `TsxComponent` is rendered raw inside `PreviewStage`, no JSON pipeline.
- **Main app (`/`)**  
  - `src/app/page.tsx`: When `loadScreen(effectivePath)` returns `__type: "tsx-screen"`, `isTsxScreen` is true. The page then renders **always** `<HiClarifyOnboarding />` (lines 129–134), not a dynamically resolved component from the loaded path. So TSX “authority” is both (a) bypassing JSON and (b) ignoring the actual TSX path in favor of a single hardcoded component.
- **Screen loader**  
  - `screen-loader.ts`: Any `tsx:*` path returns only the descriptor; no JSON is loaded or applied.
- **Screens API**  
  - `src/app/api/screens/[...path]/route.ts`: For planner and for any path that resolves to a `.tsx` under `TSX_ROOT`, the API returns `{ __type: "tsx-screen", path: "..." }`. Callers that use this response to set “TSX mode” then render that TSX component without going through the JSON/layout/palette pipeline.

### 1.3 TSX Files That Override Layout / Chrome / Positioning

These TSX screens are (or can be) mounted as full-page roots and define their own layout and chrome instead of being driven by JSON + layout-store + palette:

| File | Layout / chrome / positioning |
|------|-------------------------------|
| **tsx-screens/onboarding/david-onboarding.tsx** | **Own layout:** `containerStyle` (padding 24, maxWidth 800, margin 0 auto, fontFamily). **Own chrome:** Flow/engine selectors, “Why this next?” panel, notes panel, engine debug panel, ordered step list. **Own positioning:** Inline styles for panels, selectors, card wrapper (e.g. `selectorContainer`, `explainPanel`, `debugPanel`, `stepListPanel`). **Palette:** None; hardcoded colors (#0f172a, #334155, #1e293b, #3b82f6, etc.). |
| **engine-viewer.tsx** | Re-exports `david-onboarding`; no extra layout (delegates to David onboarding). |
| **HiClarify/HiClarifyOnboarding.tsx** | Used as the single TSX screen on the main app; has its own shell/layout (would need a separate read to list exact overrides). |
| **HiClarify/JSX_PlannerShell.tsx** | Planner screen returned as TSX from API; has its own layout/chrome (planner shell, timeline, etc.). |
| **Other TSX under apps-tsx** | Any screen loaded via `?screen=...` or API returning `tsx-screen` and rendered by dev (or app) as `TsxComponent` is by definition a root that can supply its own layout/nav/positioning unless it is refactored to be a dumb renderer. |

### 1.4 Components Mounted Outside System Flow

- **David onboarding:** Mounted when dev page sees `?flow=...` and calls `loadScreen("tsx:tsx-screens/onboarding/david-onboarding")` → TSX branch → `<TsxComponent />` in `PreviewStage`. No section keys, no layout overrides, no palette, no JsonRenderer.
- **Any TSX screen on /dev:** Same: once `TsxComponent` is set, render is `<PreviewStage><TsxComponent /><RightFloatingSidebar /></PreviewStage>`.
- **“TSX” on main app:** Renders `<HiClarifyOnboarding />` regardless of the loaded path; still outside JSON pipeline.
- **Planner (via API):** Request for planner screen returns `tsx-screen` with path `HiClarify/JSX_PlannerShell`; when that is used as the screen to load, the same TSX-only render path applies on the client.

### 1.5 Where TSX Injects Its Own Logic

- **Layout:** In `david-onboarding.tsx`, the root `<div style={containerStyle}>` and all inner wrappers (`selectorContainer`, `cardWrapper`, `explainPanel`, `notesPanel`, `debugPanel`, `stepListPanel`) are explicit layout/positioning. No `layout-store`, no `getSectionLayoutIds`, no template or section/card/organ presets.
- **Chrome / nav:** Flow selector, engine selector, “Why this next?” panel, copy-debug button, close button, engine notes, engine selection debug panel, ordered step list—all defined and positioned in TSX.
- **Palette / tokens:** No use of `getPaletteName`, `palette-store`, or `resolveParams` (palette-resolver). Colors and typography are inline style objects (e.g. `#f1f5f9`, `#94a3b8`, `#3b82f6`).
- **Behavior:** Flow/engine selection, URL updates, and card state are handled inside the component (and in `EducationCard`). This is acceptable for “behavior” if we later drive it from engines + JSON; the problem is layout/chrome/palette being in TSX instead of JSON/system.

---

## 2. Which Layer Should Own What

| Concern | Owner | Notes |
|--------|--------|--------|
| **Layout** | JSON + layout system | Section/card/organ presets, template profile, `layoutByScreen`, `composeOfflineScreen`. Resolved in page (dev/app) and passed as `sectionLayoutPresetOverrides`, `cardLayoutPresetOverrides`, `organInternalLayoutOverrides` and `profileOverride` into ExperienceRenderer → JsonRenderer. TSX should not define page-level layout or section/card structure. |
| **Palette** | Palette tokens (palette-store + palette-resolver) | `getPaletteName()`, `state.values.paletteName`, `paletteOverride`. JsonRenderer uses `resolveParams(..., palette)` for token resolution. TSX should not hardcode colors/fonts; it should consume tokens or be driven by JSON that references tokens. |
| **Behavior** | Engines + state | Flow routing, engine selection, step index, visibility (e.g. `when`). Can stay in logic/engines and state; TSX can remain a consumer of state and callbacks, but “what to show” and “how it’s laid out” should come from JSON + layout. |
| **TSX** | Visual rendering only | TSX should render what JSON describes: render tree from JSON, layout from profile + overrides, palette from tokens. No layout logic, no nav/chrome logic, no positioning logic inside TSX screens that are intended to be under system control. |

---

## 3. Exact Minimal Steps to Restore (TSX as “Dumb Renderer”)

### 3.1 Principle

- **JSON = authority:** Screen content and structure (sections, cards, organs, flow steps) come from screen JSON (or from a flow/screen descriptor that produces a tree).
- **Layout system = authority:** Section/card/organ layout and template profile come from layout-store, state.layoutByScreen, and page-built overrides; passed into ExperienceRenderer → JsonRenderer.
- **Palette = authority:** Colors and typography come from palette-store / palette-resolver; JsonRenderer (and any compliant molecule) resolves tokens.
- **TSX = renderer only:** TSX components used for “screens” should either (a) be replaced by a JSON-driven screen that uses JsonRenderer, or (b) be reduced to a thin wrapper that receives the same tree + profile + overrides + palette as JsonRenderer and does not add its own layout/chrome/positioning.

### 3.2 Minimal Steps (in order)

1. **Stop bypassing the JSON pipeline for David onboarding (and flow entry)**  
   - **Where:** `src/app/dev/page.tsx` (and, if used, main app flow entry).  
   - **Change (conceptual):** When the user intends “David onboarding,” resolve a **screen JSON** (or a composed tree) that describes the onboarding screen (sections, steps, selectors as optional regions), instead of calling `loadScreen("tsx:tsx-screens/onboarding/david-onboarding")` and rendering `<TsxComponent />`.  
   - **Result:** Same URL/entry can be served by the existing JSON path: loadScreen returns JSON → composeOfflineScreen → treeForRender → ExperienceRenderer → JsonRenderer. No `TsxComponent` branch for this screen.

2. **Introduce or reuse a JSON screen for “David onboarding”**  
   - **Where:** Screen JSON (e.g. under apps-json or a flow-specific screen) or a screen API that returns JSON for the flow/onboarding entry.  
   - **Content:** Root + sections/cards that represent flow selector, engine selector, main card area, and optional panels (explain, notes, debug, step list). Structure and ordering come from JSON; layout from layout system.  
   - **Result:** One source of truth for what the screen contains; layout and palette applied by existing pipeline.

3. **Use Registry + JsonRenderer for the “card” and panels**  
   - **Where:** Registry already maps node types to components (e.g. flow/onboarding cards).  
   - **Change:** Ensure the onboarding “card” (step content, choices, explain) is a registered type that JsonRenderer renders with engine-driven props (onAdvance, onComplete, onExplain, etc.) supplied by the page or a small behavior layer, not by a full-page TSX screen.  
   - **Result:** EducationCard (or equivalent) is used as a **molecule** inside the JSON tree, not as the root of a TSX-only page.

4. **Remove or reduce TSX-only branch on dev page**  
   - **Where:** `src/app/dev/page.tsx`: the `if (TsxComponent) { return ( <PreviewStage>...<TsxComponent />... ); }` block.  
   - **Options:** (a) Remove TSX branch entirely for screens that have a JSON counterpart; or (b) Keep TSX branch only for legacy/diagnostic screens that are explicitly “outside” the system, and ensure David onboarding (and any other system screen) never goes through this branch.  
   - **Result:** David onboarding and other restored screens always go through ExperienceRenderer + JsonRenderer when loaded from the app.

5. **Strip layout/chrome/positioning from david-onboarding.tsx if it remains**  
   - **Where:** `src/01_App/apps-tsx/tsx-screens/onboarding/david-onboarding.tsx`.  
   - **Change:** If this file remains as a component (e.g. used as a single “card” or region), remove root layout (containerStyle, maxWidth, padding), remove flow/engine selectors, explain panel, notes panel, debug panel, step list panel from this file; those become JSON-defined sections/organs or layout-controlled regions. Replace hardcoded colors with palette tokens or with styles derived from props/palette.  
   - **Result:** No layout logic, no nav logic, no positioning in TSX; only rendering of what’s passed in (e.g. one card or one region).

6. **Align main app TSX handling with JSON-first**  
   - **Where:** `src/app/page.tsx`: the `if (isTsxScreen) return ( ... <HiClarifyOnboarding /> ... )` block.  
   - **Change:** Either (a) serve the entry screen as JSON so `isTsxScreen` is false and ExperienceRenderer + JsonRenderer render it, or (b) keep a single TSX entry only for a defined “legacy” path and ensure all other paths use JSON.  
   - **Result:** No generic “any TSX path → one hardcoded component”; either JSON or an explicit exception.

7. **Ensure palette and layout tokens reach any remaining TSX**  
   - **Where:** Any TSX that must remain as a root (e.g. a temporary bridge) should receive `profileOverride`, `sectionLayoutPresetOverrides`, and palette (e.g. `paletteOverride` or palette name from state) as props and use them for container/section styling instead of inline styles.  
   - **Result:** No layout or palette logic inside TSX; only consumption of system props.

### 3.3 Summary Checklist

- [ ] David onboarding (and flow entry) no longer loaded via `tsx:...` for the main content path.  
- [ ] A JSON screen (or composed tree) describes the onboarding screen structure.  
- [ ] Dev page does not render David onboarding as `<TsxComponent />` outside JsonRenderer.  
- [ ] Layout comes only from JSON + layout-store + overrides → ExperienceRenderer → JsonRenderer.  
- [ ] Palette comes only from palette-store / resolver; no hardcoded colors in TSX for system screens.  
- [ ] TSX used for onboarding is at most a dumb renderer (or a registered molecule); no layout logic, no nav logic, no positioning in TSX.  
- [ ] Main app TSX branch (if any) is aligned with JSON-first and does not override path with a single hardcoded component unless by design.

---

## 4. Reference: JSON Path vs TSX Path (Current)

**JSON path (controlled):**  
`loadScreen(screen)` → JSON → `assignSectionInstanceKeys` → `expandOrgansInDocument` → `applySkinBindings` → `composeOfflineScreen` → `treeForRender` → `sectionLayoutPresetOverrides` / `cardLayoutPresetOverrides` / `organInternalLayoutOverrides` from state + layout-store → **ExperienceRenderer** (experience, step index, active section) → **JsonRenderer** (profileOverride, section/card/organ overrides, paletteOverride, Registry) → molecules/atoms.

**TSX path (current, uncontrolled):**  
`loadScreen("tsx:...")` or API returns `__type: "tsx-screen"` → **screen-loader** returns `{ __type, path }` only → page sets `TsxComponent`, `setJson(null)` → **early return** with `<TsxComponent />` → no layout-store, no palette, no JsonRenderer. Component (e.g. david-onboarding) provides its own layout, chrome, and colors.

This document is diagnosis only; no code has been modified, and no files have been moved or refactored.
