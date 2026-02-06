# Pipeline Diagnostic Trace Report

**Context:** User reported Pipeline Debugger output after changing the section layout dropdown (features_section) to "content-narrow". State showed the update; section table showed a different layout. This document traces root causes and recommended fixes.

---

## 1. Active node: "No section row for this node"

**Observed:** Last interaction: click → node id/key: `section-layout-preset-features_section`. Message: "No section row for this node (not in last render pass)."

**Cause:** The active node id comes from the **DOM element** that received the interaction. The section layout dropdown in OrganPanel uses:

- `id={`section-layout-preset-${sectionKey}`}` → e.g. `section-layout-preset-features_section`

The Pipeline Debug store’s section rows use **section ids** from the tree: `features_section`, `nav_section`, `gallery_section`, etc. There is no row with `sectionId === "section-layout-preset-features_section"`, so the lookup fails.

**Fix:** In `InteractionTracerPanel.tsx`, when resolving the section row for the active node, normalize control ids to section keys:

- If `activeId` is `section-layout-preset-<sectionKey>`, use `sectionKey` for the row lookup.
- Same for `card-layout-preset-<sectionKey>` and `organ-internal-layout-<sectionKey>`.

Example: strip prefix `section-layout-preset-` and look up `sectionRenderRows.find(r => r.sectionId === sectionKey)`.

**File:** `src/devtools/InteractionTracerPanel.tsx` (ActiveNodeSnapshotBlock, around line 58).

---

## 2. Pipeline stage: action FAIL — "No action emitted for interaction"

**Observed:** Stage trace shows action = FAIL, message "No action emitted for interaction", while state/layout/render pass.

**Cause:** In `InteractionTracerPanel.tsx`, the document-level handler (used for click, change, input) does this **first**:

```ts
const handler = (e: Event) => {
  resetPipelineTrace();  // ← clears the trace
  // ...
  PipelineDebugStore.setLastEvent({ type: e.type, target: nodeId });
  notify();  // panel re-renders
};
```

For a **select**:

1. Native `change` fires (capture).
2. Handler runs: **trace is cleared**, then `setLastEvent("change", "section-layout-preset-features_section")`, then `notify()`.
3. Panel re-renders and reads `getLastPipelineTrace()` → **empty** → action FAIL.
4. Later in the same tick (or next), React’s `onChange` runs → `CustomEvent("action")` is dispatched → behavior listener runs → `recordStage("action", "pass", ...)` and rest of pipeline.

So the trace is cleared **before** the action event is dispatched; the panel often renders once with an empty trace.

**Fix:** Do **not** clear the pipeline trace in the document click/change/input handler. Clear it only when a new action is **received** in the behavior listener, so the trace always reflects the pipeline for the last action:

- In `src/engine/core/behavior-listener.ts`, at the start of the `window.addEventListener("action", ...)` callback, call `resetPipelineTrace()` (import from `@/engine/debug/pipelineStageTrace`), then proceed to `recordStage("action", ...)` and the rest. Remove `resetPipelineTrace()` from the document handler in `InteractionTracerPanel.tsx`.

Result: last interaction can still be click/change; the trace will show action pass/fail for the **last** action that was handled, and the panel will show the correct status after the full cycle.

**Files:**

- `src/engine/core/behavior-listener.ts` — add `resetPipelineTrace()` at start of action handler.
- `src/devtools/InteractionTracerPanel.tsx` — remove `resetPipelineTrace()` from the document handler.

---

## 3. behavior FAIL — "No behavior matched action"

**Observed:** behavior stage = FAIL, "No behavior matched action".

**Cause:** The dropdown dispatches `state:update` (generic key/value). The behavior runner matches actions to **verbs** (e.g. logic:run25x, navigation). There is no verb that “handles” `state:update`; the state mutation is done inside the action listener via `dispatchState("state.update", { key, value })`. So from the behavior-runner’s point of view, “no behavior matched” is expected for this action.

**Conclusion:** This is expected. No code change required unless you want to treat `state:update` as a “matched” behavior (e.g. record behavior pass when action is state:update).

---

## 4. Section table: Layout Resolved = features-grid-3 vs state content-narrow

**Observed:** State diff shows `values.sectionLayoutPreset.features_section: "content-stack" → "content-narrow"`. Layout says it consumes `values.sectionLayoutPreset.features_section`. Yet SECTION RENDER TABLE shows `features_section` with Layout Requested/Resolved = **features-grid-3**.

**Possible causes:**

1. **Timing / trace from previous render**  
   The section table is filled during `applyProfileToNode` in the **current** render. If the snapshot you’re looking at was taken right after the document handler ran (trace cleared, lastEvent set) but **before** the store/state had triggered a new render with the override, that render would still be using the previous overrides (or template default), so you’d see features-grid-3. After the full cycle (store + state updated, page re-rendered, JsonRenderer gets new overrides), the next render should show content-narrow for features_section. So one possibility is “first re-render after change” vs “second re-render with new overrides”.

2. **State vs store precedence**  
   Page uses: `sectionLayoutPresetOverrides = sectionLayoutPresetFromState non-empty ? sectionLayoutPresetFromState : getOverridesForScreen(screenKey)`. So if state has `sectionLayoutPreset.features_section`, that wins. If for some reason state wasn’t updated yet in that pass (e.g. async dispatchState), we’d fall back to store. After the Option A fix, the store is updated synchronously in the dropdown callback, so the next read of `getOverridesForScreen(screenKey)` should return the new value. So either that render was before the store update was visible, or screenKey mismatch (see below).

3. **screenKey mismatch**  
   Overrides are stored and read by `screenKey`. If the key used in `setSectionLayoutPresetOverride(screenKey, "features_section", "content-narrow")` differs from the key used in `getOverridesForScreen(screenKey)` when building props for JsonRenderer (e.g. path vs hash, or different normalization), the override would be stored under a different key and not used for this screen. Checking that `screenKey` is identical in both call sites in `page.tsx` is recommended.

**Recommendation:** Verify on the **next** full render after selecting "content-narrow" (e.g. after state + store have both updated and the section table has been repopulated). If the table still shows features-grid-3, add a one-off log in `applyProfileToNode` for that section: log `sectionKey`, `sectionLayoutPresetOverrides?.[sectionKey]`, and the resolved `layoutId` to confirm override presence and resolution.

---

## 5. STATE–LAYOUT “disconnect” (journal, rawCount, scans, interactions)

**Observed:** Diagnostic says these keys are “changed but not consumed by layout” and suggests wiring them to layout.

**Conclusion:** These are app/UX state (journal, counters, interactions), not layout controls. They are not supposed to drive section layout. The message is generic. No change needed for layout behavior; optionally the diagnostic could treat `values.sectionLayoutPreset.*`, `values.cardLayoutPreset.*`, `values.organInternalLayout.*`, `values.templateId`, `values.layoutMode`, `values.experience` as “consumed by layout” and not suggest wiring journal/rawCount/scans/interactions to layout.

---

## 6. Summary

| Issue | Root cause | Fix |
|-------|------------|-----|
| No section row for this node | Active node id is control id (`section-layout-preset-features_section`), rows keyed by section id (`features_section`) | Normalize control id to section key in ActiveNodeSnapshotBlock (strip known prefixes) when resolving the section row. |
| action FAIL | Trace is cleared in document handler before React/dispatch runs, so panel often renders with empty trace | Move `resetPipelineTrace()` into the action handler in behavior-listener; remove from document handler in InteractionTracerPanel. |
| behavior FAIL | state:update is handled in listener, not in behavior-runner | Expected; optional: record behavior pass for state:update if desired. |
| Layout resolved ≠ state | Timing (first re-render before overrides applied) or screenKey mismatch | Confirm after full cycle; if still wrong, log override and layoutId in applyProfileToNode for that section. |
| State–layout “disconnect” | Generic diagnostic for any changed key | No change for layout; optional: narrow “consumed by layout” to known layout keys. |

---

## 7. Gallery vs features section

You mentioned “gallery section” in the message; the node id and state key are for **features_section** (`section-layout-preset-features_section`, `values.sectionLayoutPreset.features_section`). So the diagnostic is for the **features** section dropdown. The same behavior and fixes apply to the gallery section dropdown (and any other section); the section key would be `gallery_section` and the control id `section-layout-preset-gallery_section`.

---

## 8. Verification Report — Battery Checks + Snapshot Export (AUTOGEN)

**Purpose:** The Pipeline Debugger was extended with "battery/ignition" stages and snapshot-only export. This section describes what is recorded and an example snapshot.

### 8.1 Stages recorded (order)

| Stage | When | File |
|-------|------|------|
| **listener** | When `installBehaviorListener` runs (pass once; warn if called again). | `behavior-listener.ts` |
| **interaction** | When document captures click/change/input (type, targetId, ts). | `InteractionTracerPanel.tsx` (document handler) |
| **action** | At top of action handler after `resetPipelineTrace()` (name, key, value, ts); fail if params missing or no action name. | `behavior-listener.ts` |
| **behavior** | After matching: pass with matchedName or bypass "state:update is direct state op"; fail if no match. | `behavior-listener.ts` |
| **state** | After `dispatchState` returns: pass with key, value, storedValue, ts; fail if storedValue ≠ value or no mutation. | `state-store.ts` |
| **page-overrides** | In page.tsx: override maps built from state; fail if state has keys but overrides empty. | `page.tsx` |
| **page** | In page.tsx before JsonRenderer: screenKey, activeTemplateId, overrides (pruned to last interaction section or 5 keys), ts. | `page.tsx` |
| **jsonRenderer** | At top of JsonRenderer render: templateId, hasDoc, overrideKeys (up to 8 per type), ts. | `json-renderer.tsx` |
| **resolver** | In applyProfileToNode only for the **target section** (lastEvent.target): sectionKey, requested, overrides, finalLayout, chain, ts. | `json-renderer.tsx` |
| **layout** | Same place for target section: sectionKey, layoutResolved, layoutRequested, ts. | `json-renderer.tsx` |
| **render** | After render cycle. | `json-renderer.tsx` |

All pipeline instrumentation is gated with `process.env.NODE_ENV === "development"`. Reset happens only at the start of the action handler (not in the document handler).

### 8.2 Snapshot export (default)

The **Export** button in the Pipeline Debugger copies a **snapshot** to the clipboard (not the full report):

- **Caps:** `pipelineStages` ≤ 30; last interaction only; no full `stateSnapshot.values`; no full interactions history.
- **Contents:** `exportedAt`, `lastInteraction`, `pipelineStages`, `lastAction`, `lastStateWrite`, `pageOverrides` (pruned), `resolverStage`, `layoutRow` (target section only), `renderTick`.

### 8.3 Example snapshot (after one layout dropdown change)

```json
{
  "exportedAt": "2025-02-05T12:00:00.000Z",
  "lastInteraction": { "type": "change", "target": "section-layout-preset-features_section" },
  "pipelineStages": [
    { "stage": "listener", "status": "pass", "message": { "installed": true, "ts": 1234567890 } },
    { "stage": "interaction", "status": "pass", "message": { "type": "change", "targetId": "section-layout-preset-features_section", "ts": 1234567891 } },
    { "stage": "action", "status": "pass", "message": { "name": "state:update", "key": "sectionLayoutPreset.features_section", "value": "content-narrow", "ts": 1234567892 } },
    { "stage": "behavior", "status": "pass", "message": { "matched": false, "bypass": "state:update is direct state op" } },
    { "stage": "state", "status": "pass", "message": { "key": "sectionLayoutPreset.features_section", "value": "content-narrow", "storedValue": "content-narrow", "ts": 1234567893 } },
    { "stage": "page-overrides", "status": "pass", "message": { "sectionOverrides": { "features_section": "content-narrow" }, "cardOverrides": {}, "organOverrides": {} } },
    { "stage": "page", "status": "pass", "message": { "screenKey": "apps-journal_track-app-1", "activeTemplateId": "default", "overrides": { "section": { "features_section": "content-narrow" }, "card": {}, "organ": {} }, "ts": 1234567894 } },
    { "stage": "jsonRenderer", "status": "pass", "message": { "templateId": "default", "hasDoc": true, "overrideKeys": { "section": ["features_section"], "card": [], "organ": [] }, "ts": 1234567895 } },
    { "stage": "resolver", "status": "pass", "message": { "sectionKey": "features_section", "requested": null, "sectionOverride": "content-narrow", "cardOverride": null, "organOverride": null, "finalLayout": "content-narrow", "chain": [], "ts": 1234567896 } },
    { "stage": "layout", "status": "pass", "message": { "sectionKey": "features_section", "layoutResolved": "content-narrow", "layoutRequested": null, "ts": 1234567897 } },
    { "stage": "render", "status": "pass", "message": "Render cycle completed" }
  ],
  "lastAction": { "name": "state:update", "key": "sectionLayoutPreset.features_section", "value": "content-narrow" },
  "lastStateWrite": { "key": "sectionLayoutPreset.features_section", "value": "content-narrow", "storedValue": "content-narrow" },
  "pageOverrides": { "section": { "features_section": "content-narrow" }, "card": {}, "organ": {} },
  "resolverStage": { "stage": "resolver", "status": "pass", "message": {} },
  "layoutRow": { "sectionId": "features_section", "layoutResolved": "content-narrow" },
  "renderTick": true
}
```

If any stage is missing or fails, the snapshot shows where the pipeline stopped (e.g. action fail, state fail, or page/resolver/layout for the target section).
