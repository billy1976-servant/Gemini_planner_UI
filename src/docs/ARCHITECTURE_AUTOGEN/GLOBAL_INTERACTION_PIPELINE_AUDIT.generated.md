# Global Interaction Pipeline Audit (Generated)

Read-only analysis of the global interaction diagnostics and interaction pipeline trace. No runtime changes.

---

## 1. Event Wiring

**Do dropdown components emit events?**

| Finding | File path | What exists | What is missing or mismatched |
|--------|-----------|--------------|-------------------------------|
| No dedicated Dropdown/Select in registry | `src/engine/core/registry.tsx` | Registry maps `list`/`List`, `field`/`Field`, Button, Card, etc. No `Select` or `Dropdown` type. | No JSON-driven `<select>` component; dropdowns must be modeled as another type. |
| List has a "dropdown" variant (styling only) | `src/compounds/ui/definitions/list.json` | Variant `dropdown` defines column layout, gap, scrollable, surface styles. | Variant does not add selection semantics or a dedicated event; it is visual only. |
| List emits "action" only on item tap, using item.behavior | `src/compounds/ui/12-molecules/list.compound.tsx` | `fire(behavior, onTap)` dispatches `CustomEvent("action", { detail: behavior })` when `behavior.type === "Action"`. Items come from `content.items`. | List only uses `content.items` (e.g. `content.items[].label`, `content.items[].behavior`). If JSON supplies list options as `children` instead of `content.items`, List renders no items and no events fire. |
| FieldAtom does not render `<select>` | `src/components/9-atoms/primitives/field.tsx` | Renders `<input>` or `<textarea>`; emits `CustomEvent("input-change", { detail: { value, fieldKey } })` on change. | No `<select>` / `<option>`; no "select-change" or "dropdown-change" event. Value-based dropdowns cannot use the Field path. |
| JsonRenderer passes behavior and content through | `src/engine/core/json-renderer.tsx` | Builds `props` from `resolvedNode` (including `behavior`, `content`, `params`, `onTap`) and passes to Registry component. Does not special-case List or dropdown. | No wiring that turns a "dropdown selection" into an event; behavior must be on the node or (for List) on each item in `content.items`. |

**Summary:** Dropdowns in the JSON UI are either (1) a List with variant `dropdown` where each option is an item in `content.items` with a `behavior`, or (2) dev-only TSX (e.g. `src/app/layout.tsx`, `OrganPanel`, `SectionLayoutDropdown`) using React state, not the global behavior pipeline. Only (1) can emit events, and only when `content.items[].behavior` is set and the user taps an item.

---

## 2. Behavior Trigger

**Does the event reach behavior-listener? What verb/action is (or is not) fired?**

| Finding | File path | What exists | What is missing or mismatched |
|--------|-----------|--------------|-------------------------------|
| Listener subscribes to "action" | `src/engine/core/behavior-listener.ts` | `window.addEventListener("action", ...)`; reads `behavior = e.detail`, `params = behavior.params`, `actionName = params.name`. | Event reaches the listener only if some component dispatches "action" with `detail.params.name` set. |
| actionName required | `src/engine/core/behavior-listener.ts` | If `!actionName`, logs "Missing action name" and returns. | If List items have `behavior` without `params.name` (or with wrong shape), the listener does nothing. |
| state:* handled in listener | `src/engine/core/behavior-listener.ts` | If `actionName.startsWith("state:")`, listener resolves value (including `valueFrom: "input"`) and calls `dispatchState("state:currentView", …)` or `dispatchState("state.update", …)`. | For dropdown-as-List to drive state, JSON must set e.g. `behavior: { type: "Action", params: { name: "state:currentView", value: "viewId" } }` per item. No dedicated "dropdown.select" verb. |
| No "select" or "dropdown" event | `src/engine/core/behavior-listener.ts` | Listener only handles "navigate", "action", "input-change" (input-change is handled in a separate block). | There is no "select-change" or "dropdown-change" listener; selection must be expressed as an "action" with the right `params.name` and `params.value`. |

**Summary:** The event reaches behavior-listener only when (1) a List item is tapped and (2) that item has `behavior.type === "Action"` and `behavior.params.name` (e.g. `"state:currentView"`). The "verb" fired is `params.name`; there is no separate dropdown-specific verb.

---

## 3. Behavior Engine Handling

**Does a handler exist? If missing, list verb names.**

| Finding | File path | What exists | What is missing or mismatched |
|--------|-----------|--------------|-------------------------------|
| state:* never goes to BehaviorEngine | `src/engine/core/behavior-listener.ts` | When `actionName.startsWith("state:")`, listener calls `dispatchState` and returns; `runBehavior` is not invoked. | No engine handler is required for state:currentView or state:update; handling is entirely in the listener. |
| Contract verbs (tap, go, back, …) go to runBehavior | `src/behavior/behavior-runner.ts`, `src/behavior/contract-verbs.ts` | `CONTRACT_VERBS` includes tap, double, long, drag, scroll, swipe, go, back, open, close, route. These are routed to BehaviorEngine (e.g. interact.tap, nav.goScreen). | No "select" or "dropdown" contract verb. If JSON used `params.name: "tap"` for a dropdown item, runBehavior would run interact.tap, which does not update view/layout state. |
| BehaviorEngine has no selection handler | `src/behavior/behavior-engine.ts` | Handlers for interact.*, nav.*, and image-domain stubs. | No handler for "select", "choose", or "dropdown.change"; no engine path that maps selection to layout/state. |

**Summary:** For dropdown selection to affect layout/state, JSON must use a state-mutating action (e.g. `state:currentView`, `state:update`) on the list item behavior, which is handled in the listener. The BehaviorEngine does not need and does not have a dropdown-specific handler; if the action name is a contract verb like "tap", the engine runs that verb and no state/layout update occurs.

---

## 4. State Transition

**Is state updated after dropdown? Missing intents?**

| Finding | File path | What exists | What is missing or mismatched |
|--------|-----------|--------------|-------------------------------|
| state:currentView → currentView | `src/state/state-resolver.ts` | `deriveState` handles intent `state:currentView` and sets `derived.currentView = payload.value`. | Works only if the listener actually dispatches `state:currentView` (i.e. list item behavior has `params.name: "state:currentView"` and resolved value). |
| state.update → values[key] | `src/state/state-resolver.ts` | Intent `state.update` sets `derived.values[key] = payload.value`. | Same condition: listener must dispatch it, which requires an action name that the listener maps to state.update (e.g. `state:update` with key in params). |
| dispatchState enqueues and derives | `src/state/state-store.ts` | `dispatchState(intent, payload)` pushes to log and calls `deriveState(log)`; subscribers are notified. | No missing intents for "dropdown value" per se; the gap is that no component emits an action that triggers these intents when a dropdown option is chosen, unless JSON explicitly wires it. |

**Summary:** State does update when the listener dispatches `state:currentView` or `state.update`. The missing piece is that dropdown selection does not trigger those dispatches unless the JSON configures list items with the corresponding behavior (e.g. `params.name: "state:currentView"`, `params.value: "<viewId>"`). There is no dedicated "dropdown value" intent.

---

## 5. Layout Reaction

**Does layout depend on missing state? Where pipeline breaks.**

| Finding | File path | What exists | What is missing or mismatched |
|--------|-----------|--------------|-------------------------------|
| Layout resolver does not read state | `src/layout/resolver/layout-resolver.ts` | `resolveLayout(layout, context)` uses layout id and optional `templateId`/`sectionRole`; no state or dropdown value. | Layout resolution does not depend on state; it cannot "react" to dropdown selection by itself. |
| Section layout from profile/overrides | `src/engine/core/json-renderer.tsx` | `applyProfileToNode` sets section layout from overrides, node.layout, template role, or template default. Profile comes from layout-store (or profileOverride), not from state-store. | Section layout is not driven by a dropdown-backed state key unless some other layer (e.g. OrganPanel) maps dropdown UI to overrides. |
| Visibility depends on state | `src/engine/core/json-renderer.tsx` | `shouldRenderNode(node, state, defaultState)` uses `node.when` and compares `state[key]` (or defaultState) to `equals`; reactive state is used when present. | If state (e.g. currentView) never updates because the dropdown never dispatches a state-mutating action, visibility does not change. |
| stateSnapshot passed to renderNode | `src/engine/core/json-renderer.tsx` | Effective state (including currentView and values) is passed as stateSnapshot to renderNode and into Field value binding. | Layout "reaction" is indirect: state change → re-render → different when visibility or field values. If dropdown does not update state, this chain never starts. |

**Summary:** Layout does depend on state only indirectly (visibility via `when`, and any layout that is driven by overrides that are themselves driven by state). The pipeline breaks earlier: if the dropdown never updates state (because events are not emitted or actions are not state-mutating), layout and visibility do not react.

---

## 6. Root Cause Summary

1. **Dropdowns do not trigger layout/state updates** because the JSON UI has no native Select component: the only dropdown-like primitive is **List with variant "dropdown"**, which is a list of tappable items. Selection is implemented as "tap item → fire that item’s behavior." If the screen JSON does not attach a behavior with a state-mutating `params.name` (e.g. `state:currentView`) and the selected value to each list item, no state change occurs and layout/visibility do not update.

2. **A second cause** is that List only uses **`content.items`** for its options and behaviors. If the screen structure supplies list options as **children** instead of `content.items`, the List renders no items and no selection events are fired, so the pipeline never starts.

---

*Generated for global interaction diagnostics and interaction pipeline trace. No source files were modified.*
