# BEHAVIOR_TO_STATE_MAP.generated.md

Mappings that exist in code: behavior listener, behavior runner, verb interpreter, state store, state resolver. Only code-derived entries.

---

## Behavior intent → state mutation (action event path)

| Behavior intent | Runtime verb / params | State mutation | File path |
|-----------------|------------------------|----------------|-----------|
| View switch (JSON: Action params.name = "state:currentView") | action; params.name "state:currentView", value or valueFrom/input | dispatchState("state:currentView", { value }) | src/engine/core/behavior-listener.ts |
| Generic key/value update (JSON: Action params.name = "state:update") | action; params.name "state:update", key, value or valueFrom/input, fieldKey | dispatchState("state.update", { key, value }) | src/engine/core/behavior-listener.ts |
| Journal add (JSON: Action params.name = "state:journal.add") | action; params.name "state:journal.add", track, key, valueFrom "input", fieldKey | dispatchState("journal.add", { track, key, value }) — value from getState().values[fk] or input buffer | src/engine/core/behavior-listener.ts |
| Navigate (JSON: Action params.name = "navigate") | action; params.name "navigate", params.to | navigate(to) — no state mutation | src/engine/core/behavior-listener.ts |
| state:* (generic) from runtime verb interpreter | action; params.name starts with "state:" | dispatchState(intent, { value, ...rest }) — intent = params.name without "state:" prefix | src/logic/runtime/runtime-verb-interpreter.ts (called from behavior-listener) |
| navigate from runtime verb interpreter | action; params.name === "navigate" | navigate(params.to ?? params.target) | src/logic/runtime/runtime-verb-interpreter.ts |

---

## Input → state (no action event)

| Behavior intent | Runtime verb | State mutation | File path |
|-----------------|--------------|----------------|-----------|
| Field typing | input-change (CustomEvent); detail.fieldKey, detail.value | dispatchState("state.update", { key: fieldKey, value }) | src/engine/core/behavior-listener.ts |

---

## Screen load default state

| Trigger | State mutation | File path |
|---------|----------------|-----------|
| loadScreen() with json.state.currentView | dispatchState("state:currentView", { value: json.state.currentView }) | src/engine/core/screen-loader.ts |

---

## State resolver intents (deriveState)

All intents below are handled in `deriveState(log)` and produce the derived state shape. Dispatched from the above or other callers.

| Intent | Effect on derived state | File path |
|--------|-------------------------|-----------|
| state:currentView | derived.currentView = payload.value (if string) | src/state/state-resolver.ts |
| journal.set, journal.add | derived.journal[track][key] = value | src/state/state-resolver.ts |
| state.update | derived.values[key] = payload.value | src/state/state-resolver.ts |
| scan.result, scan.interpreted | derived.scans.push(payload) | src/state/state-resolver.ts |
| interaction.record | derived.interactions.push(payload) | src/state/state-resolver.ts |

---

## Contract verbs → BehaviorEngine (no direct state-store mutation)

These are routed through runBehavior; handlers live in BehaviorEngine. Navigation handlers call ctx.navigate / setScreen / etc.; interaction handlers call UIState.set. No dispatchState in BehaviorEngine.

| Intent (from JSON Action) | Runtime verb | Handler (BehaviorEngine) | State mutation | File path |
|---------------------------|--------------|---------------------------|----------------|-----------|
| tap, double, long, drag, scroll, swipe (variants) | action name in contract list | interact.tap, interact.double, etc. | UIState.set("interaction.*", args) — not state-store | src/behavior/behavior-engine.ts |
| go (screen/modal/flow) | go + variant | nav.goScreen, nav.goModal, nav.goFlow | result.target → fireNavigation(ctx, target); navigate/setScreen | src/behavior/behavior-runner.ts, behavior-engine.ts |
| back (one/all/root) | back + variant | nav.backOne, nav.backAll, nav.backRoot | ctx.goBack / goRoot | src/behavior/behavior-engine.ts |
| open/close panel/sheet | open/close + variant | nav.openPanel, nav.openSheet, nav.closePanel, nav.closeSheet | ctx methods | src/behavior/behavior-engine.ts |
| route (internal/external) | route + variant | nav.routeInternal, nav.routeExternal | ctx.navigate(path) or window.location.href | src/behavior/behavior-engine.ts |
| crop, filter, frame, layout, motion, overlay (action verbs) | domain + verb from behavior-actions-6x7.json | cropMedia, applyFilter, etc. (if enabled) | BehaviorEngine[handler] — no state-store in file | src/behavior/behavior-verb-resolver.ts, behavior-engine.ts |

---

## Navigate event (direct)

| Behavior intent | Runtime verb | Effect | File path |
|-----------------|--------------|--------|-----------|
| Navigation (JSON: behavior.type "Navigation") | navigate CustomEvent; detail.to / screenId / target | navigate(destination) | src/engine/core/behavior-listener.ts, src/compounds/ui/12-molecules/button.compound.tsx |

---

## state-mutate event (legacy bridge)

| Trigger | State mutation | File path |
|---------|----------------|-----------|
| window "state-mutate" CustomEvent; detail.name, detail.* | dispatchState(detail.name, { ...detail }) | src/state/state-store.ts (installStateMutateBridge) |
