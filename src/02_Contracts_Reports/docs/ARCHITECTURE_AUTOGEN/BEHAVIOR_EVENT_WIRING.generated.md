# Behavior Event Wiring (Generated)

Complete event → behavior → action pipeline. Imports and calls only; no conceptual description.

---

## Stage 1: DOM / component callbacks

| File Path | Function / Trigger | Input Shape | Output / Side Effect | Next |
|-----------|--------------------|-------------|----------------------|------|
| `src/components/9-atoms/primitives/field.tsx` | User input → handler calls `dispatchEvent` | `value`, `params.fieldKey` | `CustomEvent("input-change", { detail: { value, fieldKey } })` | window listener in behavior-listener |
| `src/compounds/ui/12-molecules/button.compound.tsx` | `handleTap` (from TriggerAtom click) | `behavior`: `{ type, params }` | If Navigation: `CustomEvent("navigate", { detail: { to } })`. If Action: `CustomEvent("action", { detail: behavior })`. If Interaction: `CustomEvent("interaction", { detail: behavior })` | window listener in behavior-listener |
| `src/compounds/ui/12-molecules/card.compound.tsx` | Same pattern (handleTap) | Same | Same | Same |
| `src/compounds/ui/12-molecules/chip.compound.tsx` | Same | Same | Same | Same |
| `src/compounds/ui/12-molecules/list.compound.tsx` | Same | Same | Same | Same |
| `src/compounds/ui/12-molecules/avatar.compound.tsx` | Same | Same | Same | Same |
| `src/compounds/ui/12-molecules/footer.compound.tsx` | Same | Same | Same | Same |
| `src/compounds/ui/12-molecules/stepper.compound.tsx` | Same (per step) | Same | Same | Same |
| `src/compounds/ui/12-molecules/toolbar.compound.tsx` | Same (per action) | Same | Same | Same |
| `src/compounds/ui/12-molecules/toast.compound.tsx` | Same | Same | Same | Same |

---

## Stage 2: Behavior listener (capture)

| File Path | Function | Input Shape | Output / Side Effect | Next |
|-----------|----------|-------------|----------------------|------|
| `src/engine/core/behavior-listener.ts` | `window.addEventListener("input-change", ...)` | `e.detail`: `{ value?, fieldKey? }` | Writes ephemeral buffers; if `fieldKey` and `value` present: `dispatchState("state.update", { key: fieldKey, value })` | state-store |
| `src/engine/core/behavior-listener.ts` | `window.addEventListener("navigate", ...)` | `e.detail`: `{ to?, screenId?, target? }` | `navigate(destination)` | Callback from `installBehaviorListener` (layout.tsx) |
| `src/engine/core/behavior-listener.ts` | `window.addEventListener("action", ...)` | `e.detail`: `behavior` = `{ type?, params? }`, `params.name`, `params.target`, etc. | Branch by `actionName`; see Stage 3 | dispatchState / navigate / runBehavior / interpretRuntimeVerb |

---

## Stage 3: Action routing (inside action listener)

| Condition | Next Function | File Path |
|-----------|----------------|-----------|
| `actionName.startsWith("state:")` | `dispatchState(mutation, …)` (state:currentView, state.update, journal.add) or legacy `state-mutate` | `src/engine/core/behavior-listener.ts` → `src/state/state-store.ts` |
| `actionName === "navigate"` | `navigate(params.to)` | Same → `src/app/layout.tsx` callback |
| `actionName` in contract verb set (tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay) | `runBehavior(domain, actionName, { navigate }, params)` | `src/engine/core/behavior-listener.ts` → `src/behavior/behavior-runner.ts` |
| `actionName === "visual-proof"` | DOM query + style/text change | `src/engine/core/behavior-listener.ts` (no next) |
| Else (other action names) | `interpretRuntimeVerb({ name: actionName, ...params }, getState())` | `src/engine/core/behavior-listener.ts` → `src/logic/runtime/runtime-verb-interpreter.ts` |

---

## Stage 4: Behavior runner

| File Path | Function | Input Shape | Output Shape | Next |
|-----------|----------|-------------|--------------|------|
| `src/behavior/behavior-runner.ts` | `runBehavior(domain, action, ctx, args)` | `domain`: string; `action`: string; `ctx`: `{ navigate?, setScreen?, router? }`; `args`: params object | Return value of engine handler or undefined | `resolveBehaviorVerb(domain, action)` or `interactions[action]` or `navigations[verb][variant]` → `BehaviorEngine[handlerName](ctx, args)`; if navigation domain: `fireNavigation(ctx, result?.target ?? args?.target)` |
| `src/behavior/behavior-verb-resolver.ts` | `resolveBehaviorVerb(domain, verb)` | domain from behavior-actions-6x7.json keys; verb string | `{ handler, params }` or null | Used by runBehavior |
| `src/behavior/behavior-runner.ts` | `resolveNavVariant(action, args)` | action (go, open, close, route, back); args | variant string or undefined | Used to key navigations[verb][variant] |
| `src/behavior/behavior-engine.ts` | `BehaviorEngine[handlerName](ctx, args)` | ctx, args | void or result object (e.g. `{ target }`) | If navigation: `fireNavigation(ctx, result?.target ?? args?.target)` (in runBehavior) |

---

## Stage 5: Runtime verb interpreter

| File Path | Function | Input Shape | Output Shape | Next |
|-----------|----------|-------------|--------------|------|
| `src/logic/runtime/runtime-verb-interpreter.ts` | `interpretRuntimeVerb(verb, state)` | `verb`: `{ name, ...params }` or `{ type: "Action", params }`; `state`: Record | Same state (handlers mutate via dispatchState) | Normalize then `runAction(verb, state)` |
| `src/logic/runtime/action-runner.ts` | `runAction(action, state)` | `action`: `{ name: string, ... }`; `state`: Record | Returns state (unchanged; handlers do side effects) | `getActionHandler(action.name)` → `handler(action, state)` |
| `src/logic/runtime/action-registry.ts` | `getActionHandler(name)` | name: string | `ActionHandler` or undefined | Registry lookup; handlers: runCalculator, run25X, resolveOnboardingAction |

---

## Alternate path: JSON-skin → interaction controller

| File Path | Function | Input Shape | Output / Side Effect | Next |
|-----------|----------|-------------|----------------------|------|
| `src/logic/engines/json-skin.engine.tsx` | `recordInteraction(payload)` | payload: `{ type?, verb?, ... }` | — | `src/logic/runtime/interaction-controller.ts` |
| `src/logic/runtime/interaction-controller.ts` | `recordInteraction(payload)` | payload | `dispatchState("interaction.record", payload)`; then if `payload.verb?.name`: `interpretRuntimeVerb(verb, readEngineState())` | state-store; then runtime-verb-interpreter → action-runner |

---

## Flow summary

```
UI Event (click / input)
  → Component: dispatchEvent("navigate" | "action" | "input-change")
  → Behavior Listener (src/engine/core/behavior-listener.ts): window listeners
  → Branch:
      input-change → dispatchState("state.update") → State
      navigate → navigate(to) → layout.tsx callback → router.replace | dispatchState("state:currentView")
      action state:* → dispatchState(...) → State
      action navigate → navigate(to) → same
      action contract verb → Behavior Runner → BehaviorEngine handler → optional fireNavigation
      action other → Runtime Verb Interpreter → Action Runner → registry handler → State / side effect
```

**Fully wired path (action → state):**  
UI Event → Behavior Listener → Behavior Runner (contract verbs) **or** Runtime Verb Interpreter → Action Runner → State / Navigation / Side Effect.
