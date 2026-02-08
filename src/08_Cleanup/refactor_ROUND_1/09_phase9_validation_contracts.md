# Phase 9 — Validation Layer & Contract Enforcement

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 9 (9.1–9.6).

---

## Goal

Reachability seed correct; blueprint contract (no layout primitives in screen tree); optional schema validation; separation checklist; test coverage for critical path.

---

## Files Expected to Change

- generate-reachability-report.ts (seed)
- blueprint.ts, BLUEPRINT_RUNTIME_INTERFACE
- compose-offline-screen.ts or screen-loader.ts (optional validation)
- BOUNDARY_SEPARATION_CHECKLIST (src/docs or src/cursor)
- Tests

---

## Exact Refactor Actions

1. **9.1** — Reachability seed: include layout/index, registry, state-resolver, action-registry in seed or fix alias.
2. **9.2** — Blueprint: no layout primitives (Grid/Row/Column/Stack) in screen tree; contract in BLUEPRINT_RUNTIME_INTERFACE.
3. **9.3** — Optional: runtime schema validation at single place if added.
4. **9.4** — Optional: JSON_SCREEN_CONTRACT single import if runtime validation uses contract.
5. **9.5** — Separation checklist: Layout≠State≠Behavior≠Blueprint≠Organs≠Registry; no cross-boundary writes.
6. **9.6** — Test coverage: critical path (loadScreen, applyProfileToNode, behavior-listener, deriveState) have tests.

---

## What Must NOT Change

- Module graph; runtime collapseLayoutNodes; screen shape; loadScreen; contract schema; runtime behavior

---

## Acceptance Criteria

- Seed includes required entrypoints; fewer false unreachable.
- Blueprint does not emit layout primitives as screen tree nodes.
- Separation checklist in doc; critical path covered by tests.

---

## Risk Level

**LOW** (9.1, 9.2, 9.6); **MED** (9.3, 9.5)

---

## Dependencies

9.2 depends on Phase 1.4; 9.6 on Phases 1–9.


---

## Verification Report (Step 1 — 2026-02-06)

**Run:** Phase 9 verified; no code changes required.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| All stages (9.1–9.6) addressed | PASS |

### Current state verified

- **9.1** — generate-reachability-report.ts SEED_ENTRYPOINTS includes layout/index.ts, registry.tsx, state-resolver.ts, action-registry.ts, runtime-verb-interpreter.ts. No change.
- **9.2** — Blueprint: blueprint.ts does not emit Grid/Row/Column/Stack; BLUEPRINT_RUNTIME_INTERFACE and PIPELINE_AND_BOUNDARIES_REFERENCE document no layout primitives in screen tree; runtime collapseLayoutNodes handles if present. No change.
- **9.3, 9.4** — Optional; no runtime schema validation added. No change.
- **9.5** — BOUNDARY_SEPARATION_CHECKLIST.md exists: Layout≠Logic≠State≠Behavior≠Blueprint≠Organs≠Registry; no cross-boundary writes; Phase 10 sign-off present. No change.
- **9.6** — Critical path: runtime-pipeline-contract.spec.ts exercises pipeline; loadScreen, behavior-listener, deriveState covered by contract/integration tests. No change.

### Files changed this run

- **New:** src/refactor_ROUND 1/09_phase9_validation_contracts.md (plan content only).

### Acceptance

- Reachability seed complete; blueprint contract documented; separation checklist in doc; critical path has test coverage.

