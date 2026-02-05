# STATE_SHAPE_CONTRACT.generated.md

Runtime state tree: keys written by dispatchState, read by deriveState, default state on load, persisted vs transient. Code-derived only.

---

## Keys written by dispatchState (intent → payload shape)

| Intent | Payload keys | Call site (file) |
|--------|--------------|------------------|
| state:currentView | value | src/engine/core/screen-loader.ts, src/engine/core/behavior-listener.ts, src/app/layout.tsx, src/state/state-store.ts (ensureInitialView), src/screens/tsx-screens/control-json/tsx-proof.tsx |
| state.update | key, value | src/engine/core/behavior-listener.ts, src/logic/engines/json-skin.engine.tsx, src/logic/actions/resolve-onboarding.action.ts, src/logic/actions/run-calculator.action.ts, src/screens/tsx-screens/onboarding/cards/EducationCard.tsx |
| journal.add | track, key, value | src/engine/core/behavior-listener.ts |
| journal.set | key, value | src/state/state-store.ts (TEST_STATE), src/state/state-adapter.ts |
| scan.result | (payload) | src/engine/core/global-scan.engine.ts |
| scan.interpreted | (payload) | src/state/global-scan.state-bridge.ts |
| scan.record | (payload) | src/state/state-store.ts (recordScan) |
| scan.batch | scans | src/state/state-store.ts (recordScanBatch) |
| interaction.record | (payload) | src/logic/runtime/interaction-controller.ts |
| (any) | (detail) | src/state/state-store.ts installStateMutateBridge: window "state-mutate" → dispatchState(detail.name, { ...detail }) |

---

## Keys read by deriveState (state-resolver)

| Intent handled | Derived key(s) | File |
|----------------|----------------|------|
| state:currentView | derived.currentView = payload.value | src/state/state-resolver.ts |
| journal.set, journal.add | derived.journal[track][key] = value | src/state/state-resolver.ts |
| state.update | derived.values[key] = payload.value | src/state/state-resolver.ts |
| scan.result, scan.interpreted | derived.scans.push(payload) | src/state/state-resolver.ts |
| interaction.record | derived.interactions.push(payload) | src/state/state-resolver.ts |

Intents NOT handled in deriveState (written to log only; no derived key): scan.record, scan.batch, and any unknown intent from state-mutate bridge.

---

## Derived state shape (runtime type)

| Key | Type | Notes |
|-----|------|--------|
| journal | Record&lt;string, Record&lt;string, string&gt;&gt; | track → key → value |
| rawCount | number | log.length |
| currentView | string | optional |
| scans | any[] | append-only |
| interactions | any[] | append-only |
| values | Record&lt;string, any&gt; | generic key/value; used by Field, engines, calculators |

Source: src/state/state-resolver.ts DerivedState type and deriveState() initial value.

---

## Default state injected on load

| Trigger | Key(s) set | File |
|---------|------------|------|
| loadScreen() with json.state.currentView | dispatchState("state:currentView", { value: json.state.currentView }) | src/engine/core/screen-loader.ts |
| Bootstrap (client) | ensureInitialView("|home") → dispatchState("state:currentView", { value: defaultView }) if !state?.currentView | src/state/state-store.ts |
| JsonRenderer defaultState | json?.state passed as defaultState; used in shouldRenderNode for when.key fallback and initial view | src/app/page.tsx, src/engine/core/json-renderer.tsx |

---

## Persisted vs transient

| Persisted | Key | Behavior |
|-----------|-----|----------|
| Yes | __app_state_log__ | localStorage.setItem(KEY, JSON.stringify(log)) on every dispatch except when intent === "state.update" | src/state/state-store.ts persist() |
| No (in-memory only) | — | intent === "state.update" skips persist() | src/state/state-store.ts |
| Rehydration | — | On bootstrap (typeof window !== "undefined"): rehydrate() reads localStorage __app_state_log__, log = parse(raw), state = deriveState(log) | src/state/state-store.ts |

---

## Consumers of getState() / state snapshot

| Consumer | Keys read | File |
|----------|-----------|------|
| JsonRenderer (stateSnapshot) | currentView, values, journal | src/engine/core/json-renderer.tsx (shouldRenderNode: state[key], defaultState[key]; field value: stateSnapshot.values[fk], stateSnapshot[fk]; JournalHistory: getState()?.journal?.[track]?.entry) |
| behavior-listener | values (for valueFrom "input" / journal.add fieldKey) | src/engine/core/behavior-listener.ts |
| JsonSkinEngine | globalState.values, globalState.currentView, globalState.currentFlow | src/logic/engines/json-skin.engine.tsx |
| user-input-viewer | state.journal[track][key] | src/ui/user-input-viewer.tsx |
| state-adapter | state.journal?.[rawKey] | src/state/state-adapter.ts |
