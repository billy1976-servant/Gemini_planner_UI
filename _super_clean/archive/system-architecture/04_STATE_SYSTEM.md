# 04 — State System

**Source:** Compiled from `src/docs/ARCHITECTURE_AUTOGEN/STATE_FLOW_CONTRACT.md`, `STATE_MUTATION_SURFACE_MAP.md`, `STATE_INTENTS.md`, `PIPELINE_AND_BOUNDARIES_REFERENCE.md`.

---

## State storage layer

| Store | File | What it holds | Persistence |
|-------|------|----------------|-------------|
| State log + derived snapshot | src/state/state-store.ts | log: StateEvent[]; state = deriveState(log). Derived: journal, rawCount, currentView, values, layoutByScreen, scans, interactions | localStorage.__app_state_log__ (log only). intent === "state.update" skips persist. Rehydrate on boot. |
| Layout (active layout) | src/engine/core/layout-store.ts | activeLayout: experience, type, preset, templateId, mode, regionPolicy | None (in-memory) |
| Section layout preset overrides | src/state/section-layout-preset-store.ts | sectionLayoutPresetOverrides, cardLayoutPresetOverrides (screenId → sectionKey → layoutId) | localStorage: section-layout-preset-overrides, card-layout-preset-overrides |
| Organ internal layout overrides | src/state/organ-internal-layout-store.ts | screenId → { sectionKey → internalLayoutId } | localStorage: organ-internal-layout-overrides |

---

## State derivation (state-resolver)

- **deriveState(log)** — pure; input: log: StateEvent[]; output: DerivedState (journal, rawCount, currentView, values, layoutByScreen, scans, interactions).
- **Intent → derived key:** state:currentView → currentView; journal.set / journal.add → journal[track][key]; state.update → values[key]; scan.result / scan.interpreted → scans; interaction.record → interactions. scan.record, scan.batch → logged only, not derived.

---

## State intents (single reference)

**Handled by deriveState:**

| Intent | Effect | Payload shape |
|--------|--------|----------------|
| state:currentView | derived.currentView = payload.value | { value: string } |
| state.update | derived.values[payload.key] = payload.value | { key, value } |
| journal.set / journal.add | derived.journal[track][key] = value | { track?, key, value } |
| scan.result / scan.interpreted | derived.scans.push(payload) | scan payload |
| interaction.record | derived.interactions.push(payload) | interaction payload |

**Logged but not derived:** scan.record, scan.batch (state-store recordScan / recordScanBatch). **Legacy bridge:** "state-mutate" CustomEvent — any detail.name dispatched as-is; only intents above affect derived state.

---

## State entry points (dispatchState call sites)

| Source | File | Intent(s) | Trigger |
|-------|------|-----------|---------|
| Screen load | screen-loader.ts | state:currentView | json.state?.currentView after fetch |
| Bootstrap | state-store.ts | state:currentView | ensureInitialView when !state?.currentView |
| App layout nav | layout.tsx | state:currentView | navigate(to) callback |
| Behavior listener | behavior-listener.ts | state:currentView, state.update, journal.add | action (params.name state:*); valueFrom:"input" from getState()?.values?.[fieldKey] |
| input-change | behavior-listener.ts | state.update | window "input-change" (fieldKey, value) |
| Runtime verb interpreter | runtime-verb-interpreter.ts | intent without "state:" prefix | handleAction — note: "currentView" not "state:currentView" does not update derived currentView |
| state-mutate bridge | state-store.ts | Any (detail.name) | window "state-mutate" |
| JsonSkinEngine, resolve-onboarding, run-calculator, EducationCard, state-adapter, global-scan.engine, global-scan.state-bridge, interaction-controller, tsx-proof | Various | state.update, journal.set, scan.*, interaction.record | Handlers / adapters / tests |

---

## State consumers (read paths)

- **JsonRenderer:** useSyncExternalStore(subscribeState, getState). shouldRenderNode(node.when, state); field value from stateSnapshot.values; JournalHistory from getState()?.journal?.[track].
- **Behavior listener:** getState()?.values?.[fieldKey] for valueFrom:"input" (journal.add).
- **JsonSkinEngine, UserInputViewer, state-adapter, ScreenRenderer:** getState(); values, journal, currentView.
- **Landing-page-resolver, flow-resolver, global scan selectors, screen-loader:** getState() for currentView, answers, interactions, scans.

Layout/profile and override stores do **not** read from state-store; they are separate view-state stores.

---

## State flow summary (textual)

```
Action/Event → behavior-listener (state:* | input-change) / runtime-verb-interpreter / screen-loader / state-store (ensureInitialView, state-mutate, recordScan…)
    → dispatchState(intent, payload)
    → log.push({ intent, payload })
    → state = deriveState(log)  [state-resolver — PURE]
    → persist() [unless intent === "state.update"]
    → listeners.forEach(l => l())
    → Consumers: JsonRenderer, JsonSkinEngine, behavior-listener, UserInputViewer, flow-resolver, landing-page-resolver, scan selectors, tests
```

---

## Persistence contract

- **localStorage key:** Defined in state-store; used by persist() and rehydration.
- **Event log shape:** Append-only { intent, payload }; deriveState(log) produces derived state.
- **Rehydration:** On init, state-store reads from localStorage and replays log to deriveState.
- **No new persistence** without updating this contract and state-store.
