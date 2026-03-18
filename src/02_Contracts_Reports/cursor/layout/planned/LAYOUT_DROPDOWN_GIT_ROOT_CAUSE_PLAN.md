# Layout Dropdown Git Root Cause and Repair Plan

**WORKING_COMMIT:** `3d03e32` — "FINALLY! - Layout Dropdowns work!!! JSON Contract - Removed all HARD-CODED LAYOUT issues in Json screen files. THE BIG FIX"

---

## STEP 1 — Last known working commit

- **Command run:** `git log --grep="Layout Dropdowns work" --oneline`
- **Result:** `3d03e32 FINALLY! - Layout Dropdowns work!!!`
- **WORKING_COMMIT:** `3d03e32`

---

## STEP 2 — Summary of diffs (working vs HEAD)

- **page.tsx:** At 3d03e32, imported `setSectionLayoutPresetOverride` and passed `onSectionLayoutPresetOverride={(sectionKey, presetId) => setSectionLayoutPresetOverride(screenKey, sectionKey, presetId)}`. At HEAD, those callbacks are no-ops and the store setter is not imported; section/card overrides prefer state-derived maps.
- **OrganPanel:** At 3d03e32, section layout dropdown called `onSectionLayoutPresetOverride(sectionKey, e.target.value)`. At HEAD, dropdowns only dispatch `CustomEvent("action", { params: { name: "state:update", key, value } })` and do not call the callbacks.
- **section-layout-preset-store / organ-internal-layout-store:** Store APIs unchanged; they are no longer written by dropdowns because callbacks are no-ops.
- **json-renderer:** Still reads overrides only from props; no direct state read for layout overrides.

---

## STEP 3 — Identified break

- Dropdowns previously called the override store setters via callbacks; they now only dispatch `state:update`. JsonRenderer still reads overrides from props (supplied by page.tsx). Page.tsx prefers state-derived maps when state has keys but the stores are never updated, so the working path (store update → getOverridesForScreen → props) was removed. The state-derived path can be incomplete (e.g. organ overrides not passed to JsonRenderer from state).

---

## STEP 4 — Root-cause document

See [src/docs/ARCHITECTURE_AUTOGEN/LAYOUT_DROPDOWN_GIT_ROOT_CAUSE.md](../../docs/ARCHITECTURE_AUTOGEN/LAYOUT_DROPDOWN_GIT_ROOT_CAUSE.md) for the full root-cause narrative (what worked before, what changed, where the pipeline is broken, summary, and proposed repair).

---

## STEP 5 — Proposed repair (Option A — executed)

- Reattach dropdowns to the original override stores; keep `CustomEvent("action")` with `state:update` for tracing.
- **Files changed:** [src/app/page.tsx](../../app/page.tsx), [src/organs/OrganPanel.tsx](../../organs/OrganPanel.tsx).

**What not to do:** No new event types, no parallel layout system, no revert of JSON architecture, no removal of Pipeline Debugger or `state:update` dispatch.

---

## Execution report

**Date:** 2025-02-05

**Option A implemented:**

1. **src/app/page.tsx**
   - Imported `setSectionLayoutPresetOverride` and `setCardLayoutPresetOverride` from `@/state/section-layout-preset-store`, and `setOrganInternalLayoutOverride` from `@/state/organ-internal-layout-store`.
   - Replaced the three no-op handlers with real implementations that call the store setters with `screenKey` and the section/value arguments:
     - `handleSectionLayoutPresetOverride(sectionKey, presetId)` → `setSectionLayoutPresetOverride(screenKey, sectionKey, presetId)`
     - `handleCardLayoutPresetOverride(sectionKey, presetId)` → `setCardLayoutPresetOverride(screenKey, sectionKey, presetId)`
     - `handleOrganInternalLayoutOverride(sectionKey, internalLayoutId)` → `setOrganInternalLayoutOverride(screenKey, sectionKey, internalLayoutId)`

2. **src/organs/OrganPanel.tsx**
   - In each of the three `<select>` `onChange` handlers, after dispatching the `CustomEvent("action", { params: { name: "state:update", key, value } })`, added a call to the corresponding callback:
     - Section layout: `onSectionLayoutPresetOverride?.(sectionKey, value)`
     - Card layout: `onCardLayoutPresetOverride?.(sectionKey, value)`
     - Organ internal layout: `onOrganInternalLayoutOverride?.(sectionKey, value)`

**Result:** Dropdowns again update the section/card/organ-internal override stores that `JsonRenderer` reads via props from page.tsx (which uses `getOverridesForScreen` / `getCardOverridesForScreen` / `getOrganInternalLayoutOverridesForScreen(screenKey)`). The `state:update` event is still dispatched for Pipeline Debugger / tracing. Lint: no new errors.
