# State Intent Origin Map (Generated)

Traces where state mutations originate. Code paths only; no abstract descriptions.

## Table: UI Trigger → Event → Behavior Intent → Runtime Verb / State Key

| UI Trigger | Event Type | Behavior Intent | Runtime Verb | State Key Mutated | File Path |
|------------|------------|-----------------|--------------|-------------------|-----------|
| FieldAtom value change | `input-change` (CustomEvent) | — | — | `values[fieldKey]` via `state.update` | `src/components/9-atoms/primitives/field.tsx` → `src/engine/core/behavior-listener.ts` (window listener) → `src/state/state-store.ts` `dispatchState("state.update", { key: fieldKey, value })` |
| Button / Card / Chip / List / Avatar / Footer / Stepper / Toolbar / Toast click with `behavior.type === "Navigation"` | `navigate` (CustomEvent) | — | — | None (navigation only); destination to `router.replace` or `state:currentView` when `to` starts with `\|` | `src/compounds/ui/12-molecules/button.compound.tsx` (and others) → `src/engine/core/behavior-listener.ts` (navigate listener) → `src/app/layout.tsx` `installBehaviorListener` callback |
| Same molecules with `behavior.type === "Action"` | `action` (CustomEvent) | From `params.name` | — | See action-name rows below | `src/compounds/ui/12-molecules/*.compound.tsx` → `src/engine/core/behavior-listener.ts` (action listener) |
| Action `state:currentView` | `action` | `state:currentView` | — | `currentView` | `src/engine/core/behavior-listener.ts` → `dispatchState("state:currentView", { value })` → `src/state/state-resolver.ts` |
| Action `state:update` | `action` | `state:update` | — | `values[key]` | `src/engine/core/behavior-listener.ts` → `dispatchState("state.update", { key, value })` → `src/state/state-resolver.ts` |
| Action `state:journal.add` | `action` | `journal.add` | — | `journal[track][key]` | `src/engine/core/behavior-listener.ts` → `dispatchState("journal.add", { track, key, value })` → `src/state/state-resolver.ts` |
| Action `navigate` | `action` | navigate | — | None or `currentView` (when callback uses `\|` view id) | `src/engine/core/behavior-listener.ts` → `navigate(to)` → `src/app/layout.tsx` callback: `dispatchState("state:currentView", { value: to })` or `router.replace(...)` |
| Action contract verb (tap, go, open, layout, etc.) | `action` | — | runBehavior (no state-store write) | None (navigation via `fireNavigation(ctx, result?.target ?? args?.target)` only) | `src/engine/core/behavior-listener.ts` → `runBehavior(domain, actionName, { navigate }, params)` → `src/behavior/behavior-runner.ts` |
| Action other (e.g. `logic:runCalculator`) | `action` | — | interpretRuntimeVerb → runAction | `values[outputKey]`, `values["__proof.lastCalculatorRun"]` | `src/engine/core/behavior-listener.ts` → `interpretRuntimeVerb(...)` → `src/logic/runtime/runtime-verb-interpreter.ts` → `src/logic/runtime/action-runner.ts` → `src/logic/actions/run-calculator.action.ts` `dispatchState("state.update", ...)` |
| Action other (e.g. `logic:resolveOnboarding`) | `action` | — | same pipeline | `values` (keys from handler) | `src/logic/actions/resolve-onboarding.action.ts` `dispatchState("state.update", ...)` |
| JSON-skin button / interaction | N/A (direct call) | — | recordInteraction → interpretRuntimeVerb | `interactions[]` (append) + handler-driven `values` | `src/logic/engines/json-skin.engine.tsx` `recordInteraction(...)` → `src/logic/runtime/interaction-controller.ts` → `dispatchState("interaction.record", payload)` then `interpretRuntimeVerb(verb, state)` → action-runner → handlers |
| Layout experience / mode / template dropdown | React `onChange` | — | — | layout-store (experience, mode, templateId) | `src/app/layout.tsx` → `setLayout({ experience })` / `setLayout({ mode })` / `setLayout({ templateId })` → `src/engine/core/layout-store.ts` |
| Layout type / preset dropdown | React `onChange` | — | — | layout-store (type, preset) | `src/lib/layout/layout-dropdown.tsx` → `setLayout({ type, preset })` → `src/engine/core/layout-store.ts` |
| Legacy `state-mutate` CustomEvent | `state-mutate` | detail.name | — | Intent = detail.name, payload = rest | `src/state/state-store.ts` `installStateMutateBridge()` → `dispatchState(name, payload)` |

## Notes

- **State store intents** (from `state-resolver.ts`): `state:currentView`, `journal.set`, `journal.add`, `state.update`, `scan.result`, `scan.interpreted`, `interaction.record`.
- **Layout store** is separate from state-store; mutated only by `setLayout()` from layout.tsx and layout-dropdown.tsx.
- **UNDETERMINED IN CODE:** Exact list of action names that reach `interpretRuntimeVerb` vs contract verbs is fixed in behavior-listener (contract list: tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay). All other action names fall through to runtime verb interpreter; which handlers exist is in `src/logic/runtime/action-registry.ts`.
