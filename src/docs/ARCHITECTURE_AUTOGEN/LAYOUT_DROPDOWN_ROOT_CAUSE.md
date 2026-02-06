// Root-cause summary (from existing autogen docs):
// - DROPDOWN_STATE_PIPELINE_RESTORATION_REPORT: dropdowns now dispatch CustomEvent("action") with params.name="state:update"
//   for experience, layoutMode, templateId, paletteName, sectionLayoutPreset.*, cardLayoutPreset.*, organInternalLayout.*, devSectionLayout.*
// - DROPDOWN_ARCH_VERIFICATION: JSON engine has a SelectAtom + registry entry; behavior-listener already routes "state:*" actions to state-store.
// - LAYOUT_DECISION_ENGINE: future suggestion/scoring engine only; current layout selection uses override → explicit → template role → default.
// - LAYOUT_SIGNAL_PRIORITY.generated: layout is driven by profile/template + preset overrides (section/card/organ) and explicit node.layout — not by state keys.
// - GLOBAL_INTERACTION_PIPELINE_AUDIT + RUNTIME_SYSTEMS_AUDIT: confirm the intended pipeline is action → behavior-listener → state-store → json-renderer.

# Layout Dropdown Root Cause

## 1. What dropdowns update (keys)

From `DROPDOWN_STATE_PIPELINE_RESTORATION_REPORT.md`, the dropdowns that participate in the pipeline now write the following keys via `CustomEvent("action")` with `params.name: "state:update"`:

- **Global layout controls (layout.tsx)**:
  - `experience` — experience selector (Website/App/Learning).
  - `layoutMode` — layout mode (Template/Custom).
  - `templateId` — section layout template/profile id.
  - `paletteName` — palette selector name.
- **Per-section/card/organ layout controls (OrganPanel.tsx)**:
  - `sectionLayoutPreset.{sectionKey}` — section layout preset override per section key.
  - `cardLayoutPreset.{sectionKey}` — card layout preset override per section key.
  - `organInternalLayout.{sectionKey}` — organ internal layout override per section key.
- **Dev-only section layout controls (section-layout-dropdown.tsx)**:
  - `devSectionLayout.{sectionId}` — dev-only section layout id per section (TSX overlay tool).

All of these updates follow the **existing behavior contract**:

- Event name: `CustomEvent("action")`.
- Behavior type: `"Action"`.
- `params.name: "state:update"`.
- `params.key`: one of the keys above.
- `params.value`: the selected dropdown value (layout id, palette name, etc.).

The behavior-listener then maps `state:update` → `dispatchState("state.update", { key, value })`, which feeds the **state-store**.

## 2. What actually drives layout rendering today

Despite the state keys above being written correctly, layout rendering is still driven primarily by **non-state stores and template profiles**:

- **Layout profile (`layout-store.ts`)**:
  - `JsonRenderer` uses `useSyncExternalStore(subscribeLayout, getLayout, getLayout)` to obtain a `layoutSnapshot` (`activeLayout`).
  - `activeLayout` holds:
    - `experience: LayoutExperience`
    - `templateId: string`
    - `mode: "template" | "custom"`
    - `type`, `preset`, and `regionPolicy` (nav + regions).
  - `setLayout` mutates this in-memory store; it is **not derived from state-store**.
- **Palette (`palette-store.ts`)**:
  - Palette selection (`paletteName`) is managed via a palette-specific store; `JsonRenderer` subscribes via `subscribePalette` and `getPaletteName`.
- **Layout decision + overrides (`json-renderer.tsx`)**:
  - `JsonRenderer` picks a `profile` from `profileOverride ?? layoutSnapshot` — the layout profile comes from `layout-store`, not from state keys.
  - `applyProfileToNode` drives section/card/organ layout:
    - Section layout:
      - Strips `params.moleculeLayout`, `layoutPreset`, `layout`, `containerWidth`, `backgroundVariant`, `split` from the node.
      - Computes `layoutId` based on:
        - `existingLayoutId` (explicit `node.layout`).
        - `overrideId` from `sectionLayoutPresetOverrides[sectionKey]`.
        - Template role layout (`getPageLayoutId(null, { templateId, sectionRole })`).
        - Template default layout (`getDefaultSectionLayoutId(templateId)` / `profile.defaultSectionLayoutId`).
      - Writes `next.layout = layoutId` and records it in `PipelineDebugStore.setLayout`.
    - Card layout:
      - Uses `cardLayoutPresetOverrides[parentSectionKey]` + `getCardLayoutPreset` for `mediaPosition` and `contentAlign`.
    - Organ internal layout:
      - Uses `organInternalLayoutOverrides[sectionKey]` and organ layout resolver (via other layout system files).
  - The **layout preset override maps** (`sectionLayoutPresetOverrides`, `cardLayoutPresetOverrides`, `organInternalLayoutOverrides`) are passed into `JsonRenderer` as props from the page/runtime — they are **not read from state-store**.
- **Signal precedence (`LAYOUT_SIGNAL_PRIORITY.generated.md`)**:
  - Confirms the order:
    1. Explicit `node.layout`.
    2. Profile overrides via `applyProfileToNode` (section/card presets).
    3. Template role-based layout.
    4. Template default.
    5. Card preset layout.
    6. Organ internal defaults.
    7. Fallbacks.
  - None of these reference the `state:update` keys above (`experience`, `layoutMode`, `templateId`, `paletteName`, `sectionLayoutPreset.*`, etc.).

In short, **layout decisions are made from layout/palette/preset stores and template JSON**, not from state-store, and the preset override maps are supplied externally, not derived from `stateSnapshot`.

## 3. Where the mismatch occurs (root cause)

The end-to-end interaction pipeline is correctly wired at the event and state levels:

- **Intent path** (per `GLOBAL_INTERACTION_PIPELINE_AUDIT` and `RUNTIME_SYSTEMS_AUDIT`):
  - Dropdown change → `CustomEvent("action")` → `behavior-listener` → `dispatchState("state.update", { key, value })` → `state-store` → subscribers (including `JsonRenderer`).
- **Observation**:
  - `state-store` records these updates and exposes them via `getState` and the `stateSnapshot` used by `JsonRenderer` (including `stateSnapshot.values[...]`).

The mismatch (split-brain) happens **after** state-store:

- Layout-related keys written by dropdowns (`experience`, `layoutMode`, `templateId`, `paletteName`, `sectionLayoutPreset.*`, `cardLayoutPreset.*`, `organInternalLayout.*`, `devSectionLayout.*`) are:
  - **Visible** in state (for tracing and tests).
  - **Not treated as the authoritative source** for layout or palette.
- Layout rendering instead reads:
  - `layoutSnapshot` from `layout-store` (`getLayout`) for `templateId`, `mode`, `experience`, `regionPolicy`.
  - Override maps (`sectionLayoutPresetOverrides`, `cardLayoutPresetOverrides`, `organInternalLayoutOverrides`) passed in from non-state sources.
  - Palette name from `palette-store`.

As a result:

- Changing a dropdown **does**:
  - Emit a correct `"action"` event.
  - Produce a `state:update` entry and corresponding state diff.
  - Update `stateSnapshot.values[...]`.
- But it **does not necessarily**:
  - Update the layout profile in `layout-store`.
  - Update the override maps passed into `JsonRenderer`.
  - Trigger layout recalculation based on the new state keys.

This is the **root cause**:

> **Layout is still driven by `layout-store` + override/preset stores and template profiles, while dropdowns now write to `state-store` keys that layout resolution does not read. State and layout are split-brain; the state pipeline is traceable but not authoritative for layout.**

Concretely:

- **Global layout controls (experience, layoutMode, templateId, paletteName)**:
  - Dropdowns write both local/legacy layout-store setters and new `state:update` keys.
  - Visual layout still follows `layout-store` / `palette-store`; state-store is only a mirror.
- **Section/Card/Organ layout controls (OrganPanel, dev section layout dropdown)**:
  - Dropdowns write preset keys into state (`sectionLayoutPreset.*`, `cardLayoutPreset.*`, `organInternalLayout.*`, `devSectionLayout.*`).
  - The actual layout overrides used by `applyProfileToNode` come from prop-level maps (supplied by the page/runtime), not directly from these state keys.
  - There is no guaranteed subscription that mirrors `state.update` for these keys into the layout/preset stores or override maps.

### Required architectural fix (high level)

To eliminate this split-brain and make the pipeline single-source-of-truth:

- **Preferred Option A (architectural target)**:
  - Derive layout profile and preset override maps **directly from state-store** (e.g. from `stateSnapshot.values[...]`) and feed them into `JsonRenderer` and `applyProfileToNode`.
  - `layout-store` becomes either:
    - A thin view over state, or
    - A compatibility layer that is populated from state, not vice versa.
- **Fallback Option B (bridge, if Option A is too invasive for now)**:
  - Introduce a single, well-documented synchronizer that:
    - Subscribes to state-store changes for layout-related keys.
    - Updates `layout-store`, palette-store, and preset override maps from those keys.
  - Clearly marks this as a **bridge** in this document and the layout plan, with a TODO to converge on state-store as the authoritative source.

The implementation work that follows (captured and verified in `1.11_DROPDOWN_LAYOUT_PIPELINE_REPAIR_PLAN.md`) aligns dropdown keys with layout inputs, makes `state-store` the primary source for layout-related values, and uses the Pipeline Debugger’s Tests tab to prove the full chain: dropdown change → behavior → state diff (expected key/value) → layout diff → render.

---

## 4. Change summary — repaired pipeline

### Root cause (before repair)

- Dropdowns were correctly emitting `CustomEvent("action")` events and writing layout-related keys into `state-store`, but:
  - `JsonRenderer`’s layout decisions relied on `layout-store` and preset override maps that were **not derived** from those state keys.
  - Global layout controls (experience, layoutMode, templateId, paletteName) and section/card/organ presets used separate stores and React state as their effective source of truth.
  - The observable state pipeline (for tracing) and the actual layout-driving stores diverged, creating a split-brain between state and layout.

### Key files changed to make state the single source of truth

- **`src/app/layout.tsx`**
  - Reads `experience`, `layoutMode`, `templateId`, and `paletteName` from `stateSnapshot.values` first, with `layout-store` / `palette-store` as fallback.
  - Global layout and palette dropdowns dispatch `"action"` events with `params.name: "state:update"` and appropriate keys, so UI chrome reflects and drives the same state that the engine uses.

- **`src/app/page.tsx`**
  - Treats `stateSnapshot.values` as the authoritative layout state:
    - Derives `experience`, `templateId`, and `layoutMode` from state (falling back to `layoutSnapshot` only when state keys are missing).
    - Builds `sectionLayoutPresetFromState`, `cardLayoutPresetFromState`, and `organInternalLayoutFromState` by scanning `stateSnapshot.values` for the prefixes `sectionLayoutPreset.`, `cardLayoutPreset.`, and `organInternalLayout.`.
  - Feeds state-derived overrides into `JsonRenderer`:
    - `sectionLayoutPresetOverrides` and `cardLayoutPresetOverrides` are taken from the state-backed maps when present, otherwise from `section-layout-preset-store` as a legacy fallback.
    - `organInternalLayoutOverrides` is built from state-backed overrides with fallback to `organ-internal-layout-store`.
  - Sets `onSectionLayoutPresetOverride`, `onCardLayoutPresetOverride`, and `onOrganInternalLayoutOverride` to no-ops, ensuring dropdowns rely solely on `CustomEvent("action")` → state, not direct mutation of override stores.

- **`src/lib/site-renderer/palette-bridge.tsx`**
  - `usePaletteCSS` resolves palette name from `getState()?.values?.paletteName` first, falling back to `getPaletteName()` and `getPalette()`.
  - Subscribes to both state and palette-store so CSS variables update in response to `state:update` for `paletteName`.

- **`src/devtools/InteractionTracerPanel.tsx` & `src/devtools/pipeline-debug-store.ts`**
  - Added a **Tests** tab to the existing Pipeline Debugger using `PipelineDebugStore` snapshots (no new event systems).
  - Tests assert, after the last interaction:
    - An interaction event was recorded.
    - A behavior/action (including `state:update`) was seen.
    - State diffs include the expected dropdown keys (e.g. `values.sectionLayoutPreset.{sectionKey}`).
    - Layout maps or `layoutChangeTrace` show section layout changes.
    - A render pass occurred (`lastRenderRoot` and `sectionRenderRows` updated).

- **`src/components/9-atoms/primitives/select.tsx`, `src/engine/core/registry.tsx`, `src/engine/core/json-renderer.tsx`**
  - `SelectAtom` renders a native `<select>` and dispatches `"action"` with `params.name: "state:update"`, `params.key`/`fieldKey`, and `params.value`.
  - `registry.tsx` maps `select` / `Select` to `SelectAtom`, making it available to JSON screens.
  - `json-renderer.tsx` binds Select’s `value` from `stateSnapshot` so Select is controlled by `state-store`, matching the existing Field atom pattern.

### Why the new pipeline is single-source-of-truth

- **Events**: All dropdowns (global layout controls, OrganPanel presets, dev overlays, JSON Selects) emit `CustomEvent("action")` with `params.name: "state:update"` and a layout-related key.
- **State**: `behavior-listener` routes these actions into `dispatchState("state.update", { key, value })`, updating `state-store` and `stateSnapshot.values`.
- **Layout & palette**:
  - Global layout and palette selectors in `app/layout.tsx` and `page.tsx` read from `stateSnapshot.values.*` first.
  - Section/card/organ layout overrides consumed by `JsonRenderer` and `applyProfileToNode` come from override maps derived from `stateSnapshot.values` (with stored overrides as legacy fallback only).
  - Palette CSS derives its palette name from state as well, ensuring visual theming follows the same source.
- **Verification**:
  - The Pipeline Debugger’s Tests tab, backed by `PipelineDebugStore`, can show a full dropdown → behavior → state diff → layout diff → render chain for section, card, and organ layout changes.

Together, these changes mean that **the only authoritative source for layout-driving dropdown values is `state-store`**, with layout/preset/palette stores and override maps acting as views or fallbacks, not as competing sources of truth. Existing interactions (journal, fields, buttons) remain on the same `CustomEvent("action")` → behavior → state pipeline and are not degraded by this repair.

