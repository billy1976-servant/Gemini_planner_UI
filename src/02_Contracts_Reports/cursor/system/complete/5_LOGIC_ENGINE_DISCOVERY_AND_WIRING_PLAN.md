# Plan 5 — Logic Engine Discovery and Wiring

**Purpose:** Discover all logic engines; classify ACTIVE/DORMANT/DISCONNECTED; document wiring and optional static entry for flow path.

**Scope:** `src/logic/engines/`, `src/logic/engine-system/`, `src/logic/runtime/`, `src/logic/actions/`, `src/logic/flows/`, `src/logic/flow-runtime/`.

**Non-negotiables:**
- All engines either wired (documented path) or removed/archived; no orphan engines without decision.
- Logic does not mutate Layout or State stores directly; state via dispatchState only.
- Action registry is single place for action name → handler on main path.

**Current runtime summary:**
- ACTIVE: json-skin, Onboarding-flow-router, engine-bridge, action-runner, action-registry, 25x, resolve-onboarding, run-calculator, layout resolver, content-resolver, skinBindings.apply, runtime-verb-interpreter. DISCONNECTED: engine-registry, flow-loader, FlowRenderer, learning/calculator/abc/decision/summary engines, value-comparison, export-resolver, etc. Reached only via TSX/flow dynamic path. Status: See ENGINE_WIRING_STATUS.generated.md.

**Required outputs:**
- Engine list with status (ACTIVE/DORMANT/DISCONNECTED).
- Optional: thin static import from seed to flow entry for reachability report; or document dynamic path as first-class.
- No removal of engines in this plan (docs/plan only).

**Verification checklist:**
- [ ] Every engine under src/logic/engines and engine-system classified.
- [ ] Action registry and runtime-verb-interpreter path documented.
- [ ] No Logic→Layout/State direct mutation.

---

## Verification Report (Step 5)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
