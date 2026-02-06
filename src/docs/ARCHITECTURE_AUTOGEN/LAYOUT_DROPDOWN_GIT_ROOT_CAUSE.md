# Layout Dropdown Git Root Cause

**WORKING_COMMIT:** `3d03e32` — "FINALLY! - Layout Dropdowns work!!! JSON Contract - Removed all HARD-CODED LAYOUT issues in Json screen files. THE BIG FIX"

## 1. What worked before (data flow)

- **OrganPanel** section layout dropdown: `onChange` called `onSectionLayoutPresetOverride(sectionKey, value)`.
- **page.tsx** passed `onSectionLayoutPresetOverride={(sectionKey, presetId) => setSectionLayoutPresetOverride(screenKey, sectionKey, presetId)}`.
- **section-layout-preset-store:** `setSectionLayoutPresetOverride(screenId, sectionKey, presetId)` updated in-memory map and localStorage; subscribers (e.g. page) re-rendered.
- **page.tsx** passed overrides into JsonRenderer: `sectionLayoutPresetOverrides={getOverridesForScreen(screenKey)}`.
- **json-renderer** `applyProfileToNode` used `sectionLayoutPresetOverrides[sectionKey]` (sectionKey = node.id ?? node.role) to choose layout; layout visibly changed.

So: **Dropdown → callback → setSectionLayoutPresetOverride → store → getOverridesForScreen → JsonRenderer props → applyProfileToNode → visible layout.**

## 2. What changed

- Dropdowns were switched to **only** dispatch `CustomEvent("action")` with `params.name: "state:update"` and `params.key` / `params.value` (e.g. `sectionLayoutPreset.${sectionKey}`, `cardLayoutPreset.${sectionKey}`, `organInternalLayout.${sectionKey}`).
- **page.tsx** stopped calling `setSectionLayoutPresetOverride` (and card/organ store setters); the callbacks passed to OrganPanel were replaced with no-ops: `handleSectionLayoutPresetOverride = () => {}`, etc.
- Override source for section/card was changed to prefer **state-derived** maps: `overridesFromState("sectionLayoutPreset")` / `overridesFromState("cardLayoutPreset")`, with store used only when state has no keys. Organ internal overrides passed to JsonRenderer were left as **store-only** (`getOrganInternalLayoutOverridesForScreen(screenKey)`), while state-derived organ overrides are used only for `expandOrgansInDocument`.

## 3. Where the pipeline is broken

- **Override stores are never updated** — Because the dropdown handlers no longer call the callbacks that invoke `setSectionLayoutPresetOverride`, `setCardLayoutPresetOverride`, or `setOrganInternalLayoutOverride`, the stores that were the original source of truth for JsonRenderer are stale. Any code path that reads overrides only from the stores (e.g. organ overrides passed to JsonRenderer) will never see dropdown changes.
- **State updates are intended to drive section/card overrides** — page.tsx builds `sectionLayoutPresetFromState` / `cardLayoutPresetFromState` from `stateSnapshot.values` and passes them to JsonRenderer when non-empty. So in principle, after a dropdown change, state updates → page re-renders → new override maps are passed → layout should update. If the screen still does not change, then either: (1) state-derived override keys do not match the section keys used in `applyProfileToNode` (key mismatch), or (2) the component that passes the props does not re-render when state changes (subscription/usage issue), or (3) organ overrides are still store-only and never reflect state.

## 4. Summary

- **State updates:** Not ignored by the state-derivation pipeline (behavior-listener → state.update → deriveState → stateSnapshot.values). Debugger shows state diff and re-render.
- **Layout resolver:** Does not read from state directly; it reads only from the override maps passed as props. So the fix is either to (A) feed the resolver again from the stores by reattaching the store writes, or (B) ensure the state-derived maps passed from page.tsx are always correct and complete (including organ) and that keys match.

- **Conclusion:** The pipeline is broken because **dropdowns no longer write to the override stores**, and the fallback to **state-derived** overrides is either incomplete (organ not passed from state) or failing due to key/timing issues. The safest repair is to **reattach the store writes** (Option A) while keeping the existing `state:update` events for tracing.

## 5. Proposed repair (Option A — executed)

**Recommendation: Option A (fastest / lowest risk)**

- Reattach dropdowns to the **original override stores** so that layout resolution again receives updates from the stores, while **keeping** the existing `CustomEvent("action")` with `state:update` for tracing and Pipeline Debugger.
- Do **not** remove or change the JSON architecture, the single `"action"` event pipeline, or the debugger/tests.

**Exact files changed**

1. **src/app/page.tsx**
   - Re-imported `setSectionLayoutPresetOverride` and `setCardLayoutPresetOverride` from `@/state/section-layout-preset-store`; imported `setOrganInternalLayoutOverride` from `@/state/organ-internal-layout-store`.
   - Replaced no-op callbacks with real ones: `onSectionLayoutPresetOverride={(sectionKey, presetId) => setSectionLayoutPresetOverride(screenKey, sectionKey, presetId)}`, and the same pattern for card and organ internal layout.
   - Override source logic left as-is (prefer state-derived when non-empty, fallback store); stores are now updated so both state and store stay in sync.

2. **src/organs/OrganPanel.tsx**
   - In each of the three `<select>` elements (section layout, card layout, organ internal layout), in `onChange`: after dispatching the existing `CustomEvent("action", ...)`, added a call to the corresponding callback: `onSectionLayoutPresetOverride?.(sectionKey, value)`, `onCardLayoutPresetOverride?.(sectionKey, value)`, `onOrganInternalLayoutOverride?.(sectionKey, value)`.
   - The `state:update` dispatch is unchanged.

3. **src/dev/section-layout-dropdown.tsx**
   - No change (main fix is OrganPanel + page.tsx).

**What not to do**

- Do not introduce a new event type or parallel layout system.
- Do not revert to a non-JSON layout architecture.
- Do not remove the Pipeline Debugger or the existing `"action"` / `state:update` dispatch from the dropdowns.
