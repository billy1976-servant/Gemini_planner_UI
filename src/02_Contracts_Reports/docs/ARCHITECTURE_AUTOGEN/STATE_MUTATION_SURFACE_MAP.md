# State Mutation Surface Map

**Purpose:** Every place state can change. Read-only selectors are excluded.

**Contribution rule:** Any new `dispatchState` call site must be added to the bounded audit below and to the appropriate section (2–13). New intents must be added to [STATE_INTENTS.md](./STATE_INTENTS.md) and to state-resolver deriveState. No new state mutation surfaces without updating this contract.

---

## Bounded audit: every dispatchState call site

| File | Intent(s) | Trigger |
|------|-----------|---------|
| src/state/state-store.ts | (internal) name, payload from event | installStateMutateBridge — "state-mutate" CustomEvent |
| src/state/state-store.ts | state:currentView | ensureInitialView(defaultView) when !state?.currentView |
| src/state/state-store.ts | journal.set, scan.record, scan.batch | Dev/test only (TEST_STATE, recordScan, recordScanBatch) |
| src/engine/core/behavior-listener.ts | state.update | input-change CustomEvent (fieldKey, value) |
| src/engine/core/behavior-listener.ts | state:currentView, state.update, journal.add | action (params.name state:*, valueFrom input) |
| src/engine/core/screen-loader.ts | state:currentView | loadScreen JSON path — json.state?.currentView |
| src/logic/engines/json-skin.engine.tsx | state.update | Button / interaction handler from json-skin |
| src/app/layout.tsx | state:currentView | navigate(to) callback with view id |
| src/logic/actions/resolve-onboarding.action.ts | state.update | resolveOnboarding action handler |
| src/screens/tsx-screens/onboarding/cards/EducationCard.tsx | state.update | Button / logic in EducationCard |
| src/logic/actions/run-calculator.action.ts | state.update | run-calculator action (outputKey, __proof.lastCalculatorRun) |
| src/state/state-adapter.ts | journal.set | applyStateToNode — field two-way binding |
| src/state/global-scan.state-bridge.ts | scan.interpreted | Interpreted scan result |
| src/screens/tsx-screens/control-json/tsx-proof.tsx | state:currentView | Proof screen buttons A/B/C/D |
| src/logic/runtime/interaction-controller.ts | interaction.record | recordInteraction(payload) |
| src/engine/core/global-scan.engine.ts | scan.result | fetchScanSignal / scan run (single or batch) |
| src/app/page.tsx | layout.override | Layout preset changes (section/card/organ) from OrganPanel |
| src/behavior/behavior-engine.ts | interaction.record, state.update | Gesture handlers (tap/drag/scroll/swipe); state updates from behavior engine |

---

## 1. dispatchState (state-store) — Central Log

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| Event log append | All derived state (currentView, journal, values, scans, interactions) | Any caller of dispatchState(intent, payload) | src/state/state-store.ts |

Derivation is in state-resolver.deriveState(log). Intents: state:currentView, state.update, journal.set, journal.add, scan.result, scan.interpreted, interaction.record.

---

## 2. Behavior Listener → dispatchState

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| input-change | values[fieldKey] | CustomEvent "input-change" with fieldKey + value | src/engine/core/behavior-listener.ts |
| action state:currentView | currentView | Action params.name "state:currentView", value or valueFrom input | src/engine/core/behavior-listener.ts |
| action state:update | values[key] | Action params.name "state:update", key, value or valueFrom input | src/engine/core/behavior-listener.ts |
| action state:journal.add | journal[track][key] | Action params.name "state:journal.add", track, key, valueFrom input | src/engine/core/behavior-listener.ts |

---

## 3. Runtime Verb Interpreter (logic) → Handlers → dispatchState

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| interpretRuntimeVerb → runAction → handler | values, currentView (via handler) | "action" event with name not state:/navigate/contract/visual-proof | src/logic/runtime/runtime-verb-interpreter.ts → action-runner → registered handlers |
| run-calculator action | values[outputKey], values["__proof.lastCalculatorRun"] | Action name e.g. logic:runCalculator | src/logic/actions/run-calculator.action.ts |
| resolve-onboarding action | values (keys from handler) | Action e.g. resolveOnboarding | src/logic/actions/resolve-onboarding.action.ts |

---

## 4. Runtime Verb Interpreter (logic) → dispatchState

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| handleAction state:* | intent = params.name without "state:"; payload value + rest | CustomEvent detail with params.name starting "state:" | src/logic/runtime/runtime-verb-interpreter.ts |

---

## 5. Screen Loader → dispatchState

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| loadScreen JSON default state | currentView | After fetch /api/screens/...; if json.state?.currentView | src/engine/core/screen-loader.ts |

---

## 6. Layout / Profile Stores (not state-store)

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| setLayout | activeLayout (experience, type, preset, templateId, mode, regionPolicy) | User UI (layout.tsx, layout-dropdown, etc.) | src/engine/core/layout-store.ts |
| setSectionLayoutPresetOverride | Section layout override per screen/section | OrganPanel / page.tsx | src/state/section-layout-preset-store.ts |
| setCardLayoutPresetOverride | Card preset override per screen/section | OrganPanel / page.tsx | src/state/section-layout-preset-store.ts |
| setOrganInternalLayoutOverride | Organ internal layout override per screen/section | OrganPanel / page.tsx | src/state/organ-internal-layout-store.ts |

---

## 7. State Store Internal → dispatchState

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| ensureInitialView | currentView | When !state?.currentView; defaultView passed in | src/state/state-store.ts |
| installStateMutateBridge | Any intent | CustomEvent "state-mutate" with detail.name | src/state/state-store.ts |

---

## 8. Current Screen Tree (Document)

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| setCurrentScreenTree | Composed screen tree (in-memory store) | After composeOfflineScreen in page.tsx | src/engine/core/current-screen-tree-store.ts |

---

## 9. State Adapter

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| applyStateToNode (field two-way) | journal[track][key] | Field change → dispatchState("journal.set", { key, value }) | src/state/state-adapter.ts |

---

## 10. Global Scan / Scan Engines

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| global-scan.engine | scans (via scan.result) | fetchScanSignal / scan run | src/engine/core/global-scan.engine.ts |
| global-scan.state-bridge | scan.interpreted | Interpreted scan result | src/state/global-scan.state-bridge.ts |

---

## 11. Interaction Controller & Behavior Engine

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| recordInteraction | interactions (append) | recordInteraction(payload) | src/logic/runtime/interaction-controller.ts |
| behavior-engine gesture handlers | interactions (append) | tap/drag/scroll/swipe → dispatchState("interaction.record", …) | src/behavior/behavior-engine.ts |
| behavior-engine state updates | values | dispatchState("state.update", …) from behavior engine | src/behavior/behavior-engine.ts |

---

## 12. JSON Skin Engine

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| Button / interaction handler | values (keys from handler) | recordInteraction + interpretRuntimeVerb from json-skin | src/logic/engines/json-skin.engine.tsx |

---

## 13. Other Call Sites (dispatchState)

| Source | What It Can Change | How Triggered | File |
|--------|--------------------|---------------|------|
| page.tsx layout preset handlers | layoutByScreen | OrganPanel section/card/organ preset change → dispatchState("layout.override", { screenKey, type, sectionId, presetId }) | src/app/page.tsx |
| layout.tsx navigate callback | currentView | navigate(to) with view id → dispatchState("state:currentView", { value: to }) | src/app/layout.tsx |
| TSX proof screens | currentView | Button click | src/screens/tsx-screens/control-json/tsx-proof.tsx |
| EducationCard | values | Button / logic | src/screens/tsx-screens/onboarding/cards/EducationCard.tsx |
| state-store dev/test | journal.set, scan.record, scan.batch | Dev/test only | src/state/state-store.ts |

---

## Summary Table (Mutation Surfaces)

| Surface | What Changes | Trigger |
|---------|--------------|---------|
| dispatchState (all callers) | currentView, values, journal, layoutByScreen, scans, interactions | action, input-change, screen load, ensureInitialView, state-mutate, handlers, adapters, scan, interaction, layout preset (page), behavior-engine |
| setLayout | activeLayout (profile snapshot) | UI (template/experience/mode) |
| setSectionLayoutPresetOverride | Section override map | OrganPanel |
| setCardLayoutPresetOverride | Card override map | OrganPanel |
| setOrganInternalLayoutOverride | Organ internal override map | OrganPanel |
| setCurrentScreenTree | Composed tree | page.tsx after compose |

---

## Contribution rule

**New dispatchState call sites:** Must be added to (1) the **Bounded audit** table above, (2) the relevant section (2–13), and (3) [STATE_INTENTS.md](./STATE_INTENTS.md) if the intent is new. **New intents** also require a branch in `src/state/state-resolver.ts` deriveState. No new state mutation surfaces without this contract update.

---

This file exposes runtime decision logic that is not visible in static architecture diagrams. It lists every state mutation surface so that planning and auditing can account for all sources of change.
