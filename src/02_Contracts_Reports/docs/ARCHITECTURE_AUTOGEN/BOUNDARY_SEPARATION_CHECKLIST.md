# Boundary Separation Checklist (Phase 9.5)

**Purpose:** Document system boundaries and the rule that modules must not perform cross-boundary writes. Use this checklist when adding or changing code that touches multiple domains.

---

## Boundaries (distinct domains)

| Boundary | Scope | Primary locations |
|----------|--------|-------------------|
| **Layout** | Layout resolution, page/component/section layout IDs, resolveLayout, LAYOUT_NODE_TYPES, collapse-layout-nodes | `src/layout/`, `src/engine/core/collapse-layout-nodes.ts` |
| **Logic** | Runtime verbs, action-runner, action-registry, flows, engines, content resolution (logic path) | `src/logic/` |
| **State** | dispatchState, deriveState, event log, persistence, state intents | `src/state/` |
| **Behavior** | behavior-listener, runBehavior, contract verbs, navigate, input-change, action events | `src/engine/core/behavior-listener.ts`, `src/behavior/` |
| **Blueprint** | Compiler output (app.json, content.manifest); build-time only | `src/scripts/blueprint.ts`; not imported at runtime by app/engine/state/layout |
| **Organs** | Organ registry, expandOrgansInDocument, organ variants, internal layout | `src/organs/`, `src/layout-organ/` |
| **Registry** | JSON type → React component mapping; component registry | `src/engine/core/registry.tsx` |

---

## Rule: No cross-boundary writes

- **Layout** must not write to state store, behavior listener, or logic action registry.
- **Logic** must not write layout IDs into the screen tree or override stores; it may call dispatchState (state is the integration point).
- **State** must not mutate layout, registry, or blueprint output; it owns the event log and derived state only.
- **Behavior** must not resolve layout or organs; it routes events and calls dispatchState / runBehavior / interpretRuntimeVerb.
- **Blueprint** is build-time only; no runtime import from app/engine/state/layout.
- **Organs** expansion reads layout/organ config; does not own state or behavior routing.
- **Registry** is read-only mapping; no side effects into state, layout, or logic.

Integration between boundaries is via **defined APIs only**: e.g. dispatchState (state), runBehavior / interpretRuntimeVerb (behavior → logic/state), applyProfileToNode (layout IDs from profile/override), loadScreen (screen doc → state default).

---

## Checklist (when changing code)

- [ ] Does this change write from one boundary into another (e.g. layout writing to state)? If yes, use the documented integration point (e.g. dispatchState) or add to this doc.
- [ ] Does this change add a new cross-boundary dependency? If yes, document it in PIPELINE_AND_BOUNDARIES_REFERENCE.md or STATE_MUTATION_SURFACE_MAP.md as appropriate.
- [ ] Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry: no module in one domain should directly mutate another domain’s data structures or stores except through the documented surfaces above.

---

## Phase 10 sign-off (final boundary check)

**Date:** 2025-02-05

| Check | Result |
|-------|--------|
| No layout in state | PASS — `src/layout/` does not import state-store or dispatchState |
| No behavior in layout | PASS — `src/layout/` does not import behavior-listener or runBehavior |
| No blueprint in runtime | PASS — app/engine/state do not import blueprint or scripts |
| JSON authority / JsonRenderer primary | PASS — page.tsx JSON branch → loadScreen → JsonRenderer; doc §1 |
| Separation checklist | PASS — this document; boundaries and rule documented |

All acceptance criteria from REFRACTOR_EXECUTION_MASTER_ROADMAP Part I D (including extended list 10.3) verified. Checklist signed off.

---

*Ref: Phase 9 — Validation Layer & Contract Enforcement; Phase 10 — Final System Integrity Pass; PIPELINE_AND_BOUNDARIES_REFERENCE.md; STATE_MUTATION_SURFACE_MAP.md.*
