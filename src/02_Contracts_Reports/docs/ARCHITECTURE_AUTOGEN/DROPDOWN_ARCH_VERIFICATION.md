# Dropdown Architecture Verification Report

Generated from the Dropdown Pipeline Restoration plan. Summarizes what exists, what is missing, and whether the proposed fix matches system design.

---

## 1. What exists

### Intended pattern

- **JSON UI components** emit `CustomEvent("action")` with `detail` = behavior object (`{ type, params }`). Examples: [button.compound.tsx](src/compounds/ui/12-molecules/button.compound.tsx), [list.compound.tsx](src/compounds/ui/12-molecules/list.compound.tsx).
- **behavior-listener** subscribes to `"action"`, reads `actionName = e.detail.params.name`, then either dispatches to state (`state:currentView`, `state:update`) or routes contract verbs to `runBehavior`.
- **state-store** → **state-resolver** derives `currentView` and `values[key]`; **json-renderer** subscribes to state and passes `stateSnapshot` into `renderNode`, driving re-render and `shouldRenderNode` (visibility).

So: **action → behavior-listener → state dispatch → state-store → state-resolver → json-renderer re-render** is the intended path.

### List variant "dropdown"

- [src/compounds/ui/definitions/list.json](src/compounds/ui/definitions/list.json) defines a variant `"dropdown"` (styling only: column, gap, scrollable, surface). Behavior is only applied when JSON sets `content.items[].behavior` per item; there is no native `<select>` or single "selected value" semantics.

### Field atom

- [src/components/9-atoms/primitives/field.tsx](src/components/9-atoms/primitives/field.tsx) renders `<input>` or `<textarea>` and emits `CustomEvent("input-change")` with `value` and `fieldKey`. It does not render `<select>`.

### Dropdown-like usages (classification)

| Location | Classification |
|----------|----------------|
| src/app/layout.tsx | Dev-only React state (`<select>` + useState) |
| src/organs/OrganPanel.tsx | Dev-only React state |
| src/dev/section-layout-dropdown.tsx | Dev-only React state |
| src/engine/site-runtime/GeneratedSiteViewer.tsx | Dev-only React state |
| src/compounds/ui/definitions/list.json | Visual-only (List variant; no native select) |
| src/components/9-atoms/primitives/field.tsx | Not a dropdown (input/textarea) |
| src/components/site/CalculatorSection.tsx | Dev/site-specific (not in JSON engine registry) |

### Registry

- [src/engine/core/registry.tsx](src/engine/core/registry.tsx) includes Field, FieldAtom, List, Button, Card, etc. **No Select or Dropdown component type.**

---

## 2. What is missing

- **JSON-driven Select component in registry.** There is no component type that renders a native `<select>` and participates in the JSON behavior pipeline.
- **A single "selection change" event that carries the selected value into state.** List emits per-item tap with that item’s behavior; there is no component that emits `CustomEvent("action")` with `params.name` (e.g. `state:update` or `state:currentView`) and `params.value` set to the chosen option value for a native dropdown.

---

## 3. Whether the proposed fix matches system design

**Yes.** The proposed fix is to add a **Select atom** that:

- Renders a native `<select>` with options from `content.options` (e.g. `[{ label, value }]`).
- On change, dispatches `CustomEvent("action")` with a behavior object that includes `params.name` (e.g. `state:update` or `state:currentView`) and `params.value` = the selected option value (and `params.key` or `params.fieldKey` for the state key).
- Receives a controlled value from JsonRenderer when the node has `params.field.fieldKey` (or `params.key`), with that value sourced from `stateSnapshot.values[key]`.

This uses the **existing** behavior/state path:

- No new event types (only `"action"`).
- behavior-listener already handles `state:update` with `params.value` when `valueFrom !== "input"`.
- state-store and state-resolver already support `state.update` and `state:currentView`.
- JsonRenderer already subscribes to state and passes stateSnapshot; adding a state-binding block for Select (like Field) keeps the Select controlled and reactive.

Layout and visibility continue to react only via state-driven re-render (e.g. `when` and `currentView` / `values`); no changes to layout-resolver.
