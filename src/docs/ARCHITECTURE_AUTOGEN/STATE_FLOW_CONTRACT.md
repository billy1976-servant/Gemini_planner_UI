# STATE FLOW CONTRACT

**Purpose:** Document the complete runtime state lifecycle for external systems (planning, diagnostics, AI assistance). Read-only architecture contract — not implementation.

**Generated from:** Codebase scan. Only documents what exists or is provably unconnected.

---

## 1. State Entry Points

Every file/function that introduces or dispatches state (dispatchState calls, state: verbs, behavior-listener state routing, screen-loader initial state, API payload injection).

| Source | File | Function / Trigger | Intent Type | Notes |
|--------|------|-------------------|-------------|--------|
| Screen load (JSON default) | `src/engine/core/screen-loader.ts` | `loadScreen()` after fetch | `state:currentView` | Applies `json.state.currentView` when loading a new screen; always dispatches to sync initial view. |
| Bootstrap | `src/state/state-store.ts` | `ensureInitialView("|home")` (client) | `state:currentView` | Only if `!state?.currentView`. |
| App layout nav | `src/app/layout.tsx` | Nav link click → `navigate(to)` | `state:currentView` | Dispatches when user navigates to a route. |
| Behavior listener (action) | `src/engine/core/behavior-listener.ts` | `window "action"` with `params.name` starting `state:` | `state:currentView`, `state.update`, `journal.add` | Maps `state:currentView` → dispatchState("state:currentView"); `state:update` → dispatchState("state.update"); `state:journal.add` → dispatchState("journal.add"). Resolves valueFrom:"input" from getState()?.values?.[fieldKey]. |
| Input capture | `src/engine/core/behavior-listener.ts` | `window "input-change"` | `state.update` | key = fieldKey, value = typed value; writes to DerivedState.values. |
| Runtime verb interpreter | `src/engine/runtime/runtime-verb-interpreter.ts` | `window "action"` → `handleAction` | **Intent name without prefix** | Dispatches `params.name.replace("state:", "")` (e.g. `currentView`). **Mismatch:** state-resolver expects `state:currentView`; this path does not update derived state for view. |
| State-mutate bridge | `src/state/state-store.ts` | `window "state-mutate"` | Any (detail.name) | `dispatchState(detail.name, { ...detail })`. External or legacy code can push intents this way. |
| JsonSkinEngine | `src/logic/engines/json-skin.engine.tsx` | Button/action handlers | `state.update` | key/value from JSON behavior. |
| Resolve onboarding | `src/logic/actions/resolve-onboarding.action.ts` | Action handler | `state.update` | Writes answers and related keys. |
| Run calculator | `src/logic/actions/run-calculator.action.ts` | Action handler | `state.update` | Writes calculator result keys. |
| EducationCard | `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` | User action | `state.update` | Writes to state.values. |
| State adapter | `src/state/state-adapter.ts` | `applyStateToNode` (field two-way) | `journal.set` | On field change: dispatchState("journal.set", { key, value }). |
| Global scan engine | `src/engine/core/global-scan.engine.ts` | Scan result | `scan.result` | Single or batch results. |
| Global scan state bridge | `src/state/global-scan.state-bridge.ts` | Interpreted scan | `scan.interpreted` | dispatchState("scan.interpreted", payload). |
| State store API | `src/state/state-store.ts` | `recordScan` / `recordScanBatch` | `scan.record`, `scan.batch` | Public API; appended to log only (see §5). |
| Interaction controller | `src/logic/runtime/interaction-controller.ts` | Interaction event | `interaction.record` | dispatchState("interaction.record", payload). |
| TSX proof / tests | `src/screens/tsx-screens/control-json/tsx-proof.tsx` | Test buttons | `state:currentView` | A/B/C/D view switching. |
| Test / dev | `src/state/state-store.ts` | `window.TEST_STATE` (if set) | `journal.set` | key "test", value "hello". |

---

## 2. State Storage Layer

| Store | File | What it holds | Persistence | Notes |
|-------|------|----------------|-------------|--------|
| **State log + derived snapshot** | `src/state/state-store.ts` | `log: StateEvent[]`, `state = deriveState(log)`. Derived: journal, rawCount, currentView, scans, interactions, values. | `localStorage.__app_state_log__` (log only). Rehydrate on boot. intent === "state.update" skips persist (high-frequency). | Single source of truth for app state. subscribeState / getState. |
| **Layout (active layout)** | `src/engine/core/layout-store.ts` | activeLayout: experience, type, preset, templateId, mode, regionPolicy. | None (in-memory). | useSyncExternalStore(subscribeLayout, getLayout). Not derived from state-store. |
| **Section layout preset overrides** | `src/state/section-layout-preset-store.ts` | sectionLayoutPresetOverrides, cardLayoutPresetOverrides (screenId → sectionKey → layoutId). | localStorage: section-layout-preset-overrides, card-layout-preset-overrides. | useSyncExternalStore for both. |
| **Organ internal layout overrides** | `src/state/organ-internal-layout-store.ts` | OverridesMap: screenId → { sectionKey → internalLayoutId }. | localStorage: organ-internal-layout-overrides. | useSyncExternalStore(subscribeOrganInternalLayoutOverrides, getOrganInternalLayoutOverrides). |
| **Palette** | (in layout-store or separate) | Palette name. | — | useSyncExternalStore(subscribePalette, getPaletteName). |
| **View / experience** | `src/state/view-store` | Experience ID (e.g. views.journal). | — | experience-dropdown uses useSyncExternalStore(subscribeExperience, getExperienceId). Not state-store. |
| **UI state (internal)** | `src/engine/core/ui-state.ts` | lastEvent, lastArgs (ephemeral). | None. | useUIState() — separate from state-store; for UI debugging / last event. |

---

## 3. State Derivation Layer

Logic that transforms the state log into runtime state. All in `src/state/state-resolver.ts`; `deriveState` is pure.

| File | Function | Inputs | Outputs | Pure? |
|------|----------|--------|----------|-------|
| `src/state/state-resolver.ts` | `deriveState(log)` | `log: StateEvent[]` | `DerivedState` (journal, rawCount, currentView, scans, interactions, values) | Yes |

**Intent → derived key:**

- `state:currentView` → `derived.currentView = payload.value`
- `journal.set` / `journal.add` → `derived.journal[track][key] = value`
- `state.update` → `derived.values[key] = payload.value`
- `scan.result` / `scan.interpreted` → `derived.scans.push(payload)`
- `interaction.record` → `derived.interactions.push(payload)`

**Not used in derivation:** `logic-interaction.reducer.ts` (reduceInteraction) is never imported; interactions are appended only inside state-resolver.

---

## 4. State Consumers (READ PATHS)

Where state influences runtime behavior or rendering.

| Consumer Type | File | What it reads | Effect |
|---------------|------|----------------|--------|
| **JsonRenderer** | `src/engine/core/json-renderer.tsx` | `useSyncExternalStore(subscribeState, getState)`. stateSnapshot: currentView, values, journal. | `shouldRenderNode(node, state, defaultState)`: node.when.state === node.when.equals; field value from stateSnapshot.values[fk]; JournalHistory from getState()?.journal?.[track]. |
| **Behavior listener** | `src/engine/core/behavior-listener.ts` | getState()?.values?.[fieldKey] for valueFrom:"input" (journal.add). | Resolves input value for journal.add from state.values. |
| **JsonSkinEngine** | `src/logic/engines/json-skin.engine.tsx` | useSyncExternalStore(subscribeState, getState). globalState.values, currentView (and engineState). | selectActiveChildren: when.state / when.equals gating; merges globalState?.values into engine state. |
| **UserInputViewer** | `src/ui/user-input-viewer.tsx` | useSyncExternalStore(subscribeState, getState). state.values, state.journal[track][key]. | Displays current values and journal entries. |
| **State adapter** | `src/state/state-adapter.ts` | state.journal?.[rawKey]. | applyStateToNode: injects journal value into field nodes (two-way binding). |
| **ScreenRenderer** | `src/screens/core/ScreenRenderer.tsx` | useSyncExternalStore(subscribeState, getState). globalState. | Passes state to screen tree. |
| **Resolve onboarding** | `src/logic/actions/resolve-onboarding.action.ts` | getState(): values, interactions. | Builds fullState for flow; reads answers, calculatorInput, interactions. |
| **Landing page resolver** | `src/logic/runtime/landing-page-resolver.ts` | getState(): currentView, state?.answers (see note). | resolveLandingPage, getCurrentView. |
| **Flow resolver** | `src/logic/runtime/flow-resolver.ts` | derived.interactions (DerivedState). | resolveView(flowId, derived): step progression from interaction types (e.g. calculator.completed). |
| **Global scan selectors** | `src/engine/selectors/select-global-window.ts`, `select-global-window-by-source.ts`, `select-global-scan-time-window.ts`, `global-scan-time-window-viewer.ts` | getState(); state.scans. | Filter/time-window over scans for dashboards/charts. |
| **Google Ads dashboard** | `src/screens/tsx-screens/google-ads/google-ads-dashboard.tsx` | getState(); state.scans. | Filters ScanEvents for UI. |
| **UseGlobalWindow** | `src/screens/tsx-screens/global-scans/selectors/UseGlobalWindow.ts` | getState(); state.scans. | Scan list for global scan UI. |
| **Screen loader** | `src/engine/core/screen-loader.ts` | getState(). | Compares currentView with json.state.currentView to decide whether to dispatch default state. |
| **Pipeline proof / scripts** | `src/scripts/pipeline-proof.ts`, `src/scripts/global-scan.ts` | getState() (journal, values). | Tests and scripts. |

**Layout/profile:** Layout snapshot and overrides come from layout-store and section/organ override stores (useSyncExternalStore). They do **not** read from state-store. Layout Decision Engine (planned) is not wired to state-store.

---

## 5. Missing / Disconnected State Paths

### Unused State Signals (dispatched but not read or not derived)

- **scan.record** — Dispatched in `src/state/state-store.ts` (recordScan). Not handled in deriveState; only written to log. No consumer reads it from derived state (scans are populated from scan.result / scan.interpreted).
- **scan.batch** — Dispatched in `src/state/state-store.ts` (recordScanBatch). Same as above; not handled in deriveState.
- **state:noop** — Referenced in JSON (e.g. Test-Molecules-Work/all-twelve-together.json). No handler in state-resolver; effectively no-op as intended.
- **runtime-verb-interpreter view intent** — When JSON sends `params.name === "state:currentView"`, runtime-verb-interpreter dispatches intent `"currentView"` (stripped prefix). state-resolver only handles `"state:currentView"`. So this path does **not** update derived currentView. behavior-listener correctly dispatches `"state:currentView"`; order of listeners and which one handles the event determines behavior.

### Intents from state-mutate bridge

- Any intent name from `window "state-mutate"` is dispatched as-is. Unknown intents are appended to log but not processed by deriveState (no derived key). Only intents listed in §3 update derived state.

### Engines With No State Inputs (or not wired to state-store)

- **Layout Decision Engine (planned)** — Documented in logic/layout plans; would score compatible layouts. Not implemented; no state-store wiring.
- **Contextual Layout Logic** — No rules or engine in code; no state input.
- **layout-store / section / organ override stores** — Do not read from state-store; they are separate view-state stores.
- **experience-dropdown / view-store** — Reads experience ID from view-store, not state-store.

### Dead / unused code

- **logic-interaction.reducer.ts** — reduceInteraction is never imported; interaction append is done only inside state-resolver.

---

## 6. State Flow Summary Diagram (Textual)

```
Action/Event
    │
    ├─► [behavior-listener]  "action" (state:currentView | state:update | state:journal.add)
    │       └─► dispatchState("state:currentView" | "state.update" | "journal.add", …)
    │
    ├─► [behavior-listener]  "input-change"
    │       └─► dispatchState("state.update", { key: fieldKey, value })
    │
    ├─► [runtime-verb-interpreter]  "action" (state:*)
    │       └─► dispatchState(intentWithoutPrefix, …)  ⚠ currentView not applied in resolver
    │
    ├─► [screen-loader]  after loadScreen(json)
    │       └─► dispatchState("state:currentView", { value: json.state.currentView })
    │
    ├─► [state-store]  "state-mutate", ensureInitialView, recordScan, recordScanBatch, etc.
    │       └─► dispatchState(intent, payload)
    │
    ▼
dispatchState(intent, payload)
    │
    ▼
state-store: log.push({ intent, payload })
    │
    ▼
state = deriveState(log)   [state-resolver — PURE]
    │
    ├─► state:currentView → currentView
    ├─► journal.set / journal.add → journal[track][key]
    ├─► state.update → values[key]
    ├─► scan.result / scan.interpreted → scans[]
    ├─► interaction.record → interactions[]
    └─► (scan.record, scan.batch, unknown → log only, no derived key)
    │
    ▼
persist() [unless intent === "state.update"]
listeners.forEach(l => l())
    │
    ▼
Consumers (subscribeState / getState / useSyncExternalStore)
    │
    ├─► JsonRenderer  → when/state gating, field values, JournalHistory
    ├─► JsonSkinEngine → when/state, values
    ├─► behavior-listener → values (input resolution for journal.add)
    ├─► UserInputViewer, state-adapter, ScreenRenderer
    ├─► flow-resolver (interactions), landing-page-resolver (currentView / answers)
    ├─► Global scan selectors, Google Ads dashboard, UseGlobalWindow (scans)
    └─► Tests / scripts
```

---

## Summary Checklist

| Question | Answer |
|----------|--------|
| What state exists? | currentView, journal, values, scans, interactions (and rawCount). Stored in state-store; layout/override/view stores are separate. |
| What state affects runtime? | currentView and values drive when/state and field binding; journal drives JournalHistory and flow; scans drive global-scan UIs; interactions drive flow-resolver steps. |
| What engines are blind? | Layout Decision Engine (not implemented); layout/profile path does not read state-store. |
| Where is wiring missing? | scan.record/scan.batch not derived; runtime-verb-interpreter sends "currentView" not "state:currentView"; reduceInteraction unused. |
