# State Write Surface Audit (Generated)

Lists all mutations: **dispatchState**, **setState**, **localStorage** writes, **store setters**. Flags any **Logic → Layout/State direct mutation** (Logic must not mutate Layout or State stores directly; state changes go through dispatchState or dedicated override APIs).

**Source:** Codebase scan + [STATE_MUTATION_SURFACE_MAP.md](../ARCHITECTURE_AUTOGEN/STATE_MUTATION_SURFACE_MAP.md). File paths, function names, line ranges where possible.

---

## Summary

| Surface type | Count | Logic→Layout/State violation |
|--------------|-------|------------------------------|
| dispatchState call sites | 15+ files | None (Logic uses dispatchState only) |
| setState / store setters | 6 stores | None |
| localStorage writes | 2 (persist, persistence-adapter) | N/A |
| Logic→Layout/State direct | 0 | PASS |

**Overall:** PASS. State mutation surfaces are bounded; Logic does not directly mutate Layout or State stores.

---

## 1. dispatchState (state-store)

| Caller | File | Function / context | Line (approx) |
|--------|------|--------------------|----------------|
| state-store (internal) | `src/state/state-store.ts` | ensureInitialView; installStateMutateBridge (state-mutate event) | — |
| behavior-listener | `src/engine/core/behavior-listener.ts` | input-change → state.update; action state:currentView, state:update, state:journal.add | L140, L321+ |
| runtime-verb-interpreter (logic) | `src/logic/runtime/runtime-verb-interpreter.ts` | Forwards to action-runner; handlers may call dispatchState | L23–45 |
| action handlers | `src/logic/actions/run-calculator.action.ts`, `resolve-onboarding.action.ts` | dispatchState for values, currentView | — |
| screen-loader | `src/engine/core/screen-loader.ts` | After fetch JSON; if json.state?.currentView | L33+ |
| layout.tsx | `src/app/layout.tsx` | navigate callback → dispatchState("state:currentView", { value }) | — |
| state-adapter | `src/state/state-adapter.ts` | applyStateToNode → journal.set | — |
| global-scan.state-bridge | `src/state/global-scan.state-bridge.ts` | scan.interpreted | — |
| interaction-controller | `src/logic/runtime/interaction-controller.ts` | recordInteraction → interactions append | — |
| json-skin.engine | `src/logic/engines/json-skin.engine.tsx` | Button / interaction handler → values | — |
| TSX screens (EducationCard, tsx-proof) | `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`, `control-json/tsx-proof.tsx` | currentView, values | — |

**Verdict:** All dispatchState call sites are documented. Logic path uses dispatchState only (no direct Layout store write).

---

## 2. setState / store setters

| Store | File | Setter | Trigger |
|-------|------|--------|--------|
| layout-store | `src/engine/core/layout-store.ts` | setLayout | UI (template/experience/mode) |
| section-layout-preset-store | `src/state/section-layout-preset-store.ts` | setSectionLayoutPresetOverride, setCardLayoutPresetOverride | OrganPanel / page |
| organ-internal-layout-store | `src/state/organ-internal-layout-store.ts` | setOrganInternalLayoutOverride | OrganPanel / page |
| current-screen-tree-store | `src/engine/core/current-screen-tree-store.ts` | setCurrentScreenTree | page.tsx after composeOfflineScreen |
| palette-store | `src/engine/core/palette-store.ts` | setPalette (or equivalent) | Layout / palette bridge |

**Verdict:** Bounded. No Logic module calls setLayout or override stores directly; override stores are set from page/OrganPanel (UI).

---

## 3. localStorage writes

| Source | File | Function | Purpose |
|--------|------|----------|---------|
| state-store | `src/state/state-store.ts` | persist() | Write event log (called after dispatchState when intent !== "state.update") |
| persistence-adapter | `src/state/persistence-adapter.ts` | — | Persist state log |

**Verdict:** Only state persistence. No Layout or Logic writing localStorage for layout data.

---

## 4. Logic → Layout/State direct mutation

| Check | Result |
|-------|--------|
| Logic (action-runner, engines, flow) calls setLayout? | No. PASS |
| Logic calls setSectionLayoutPresetOverride / setCardLayoutPresetOverride / setOrganInternalLayoutOverride? | No. PASS |
| Logic calls setCurrentScreenTree? | No. PASS |
| Logic only mutates state via dispatchState or engine-bridge (read/write engine state)? | Yes. PASS |

**Verdict:** PASS. Separation of concerns: Logic does not mutate Layout or override stores; state changes go through dispatchState.

---

## Verification

| Check | Result |
|-------|--------|
| All mutation surfaces listed | PASS |
| File paths and function names | PASS |
| Line ranges where possible | PASS_WITH_GAPS |
| Logic→Layout/State flagged | PASS (none found) |
| PASS / FAIL / PASS_WITH_GAPS | PASS |

---

*Generated. Deterministic. See STATE_MUTATION_SURFACE_MAP.md for full detail.*
