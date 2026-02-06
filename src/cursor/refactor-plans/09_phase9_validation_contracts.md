# Phase 9 — Validation Layer & Contract Enforcement

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 9 (9.1–9.6); Part I B Gaps 13, 20; acceptance tests.

---

## Goal

Reachability seed fix; blueprint contract (no layout primitives); optional schema validation; separation checklist; test coverage for critical path.

---

## Files Expected to Change

- generate-reachability-report.ts or equivalent (seed fix)
- blueprint.ts, BLUEPRINT_RUNTIME_INTERFACE (contract doc / enforcement)
- compose-offline-screen.ts or screen-loader.ts (optional validation)
- JSON_SCREEN_CONTRACT.json, one validator (optional, if 9.3)
- src/cursor or src/docs (separation checklist)
- Tests (critical path: loadScreen, applyProfileToNode, behavior-listener, deriveState)

---

## Exact Refactor Actions

1. **9.1** — Reachability: include layout/index, registry, state-resolver, action-registry in seed or fix alias; fewer false unreachable.
2. **9.2** — Blueprint: no layout primitives (Grid/Row/Column/Stack) in screen tree; contract enforced.
3. **9.3** — Optional: runtime schema validation at single place (compose-offline-screen or screen-loader).
4. **9.4** — Optional: if 9.3, single JSON_SCREEN_CONTRACT import for validator.
5. **9.5** — Separation checklist: Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry; no cross-boundary writes.
6. **9.6** — Test coverage: loadScreen, applyProfileToNode, behavior-listener, deriveState; update when refactor changes behavior.

---

## What Must NOT Change

- Module graph; runtime collapseLayoutNodes; screen shape; loadScreen; contract schema; all boundaries; runtime behavior except where tests assert

---

## Acceptance Criteria

- Fewer false unreachable.
- Blueprint contract documented/enforced.
- At most one validation call site if added.
- Checklist in doc.
- Critical path covered by tests.

---

## Risk Level

**MED** (9.3, 9.5); **LOW** (9.1, 9.2, 9.4, 9.6)

---

## Dependencies

1.4 (9.2), 1.6 (9.3), Phases 1–9 for 9.6

---

## Verification report (Phase 9 executed)

**Plan name:** Phase 9 — Validation Layer & Contract Enforcement  
**Scope:** Reachability seed fix; blueprint contract; optional validation; separation checklist; critical-path tests.  
**Date:** 2025-02-04

| Check | Status |
|-------|--------|
| Runtime matches plan contract | ✅ PASS |
| No forbidden changes made | ✅ PASS |
| No unexpected side effects | ✅ PASS |
| All files referenced exist | ✅ PASS |

**Detailed findings**

- **9.1 — Reachability seed:** Added to `generate-reachability-report.ts` SEED_ENTRYPOINTS: `src/engine/core/registry.tsx`, `src/state/state-resolver.ts`, `src/logic/runtime/action-registry.ts`. `src/layout/index.ts` was already in seed. Re-running the script will report fewer false unreachable (registry, state-resolver, action-registry no longer listed as UNREACHABLE).
- **9.2 — Blueprint / no layout primitives:** Added subsection **"Contract (9.2): No layout primitives in screen tree"** in `BLUEPRINT_RUNTIME_INTERFACE.generated.md` stating screen tree must not contain Grid/Row/Column/Stack; blueprint must not emit them; runtime uses collapseLayoutNodes in dev if present. Existing "Fields compiler must NOT generate" already included layout primitive nodes.
- **9.3 / 9.4 — Optional:** Not implemented (at most one validation call site and single JSON_SCREEN_CONTRACT import deferred).
- **9.5 — Separation checklist:** Created `src/docs/ARCHITECTURE_AUTOGEN/BOUNDARY_SEPARATION_CHECKLIST.md` with boundaries (Layout, Logic, State, Behavior, Blueprint, Organs, Registry), rule "no cross-boundary writes", and checklist for changes. Linked from DOCS_INDEX.
- **9.6 — Test coverage:** Added `src/contracts/critical-path.smoke.test.ts` importing and asserting: `deriveState` (state-resolver), `loadScreen` (screen-loader), `installBehaviorListener` (behavior-listener). JsonRenderer/applyProfileToNode not imported in smoke to avoid TSX under ts-node; documented in file. Run: `npx ts-node -r tsconfig-paths/register src/contracts/critical-path.smoke.test.ts` — passes.

**Files modified:** `src/scripts/docs/generate-reachability-report.ts`, `src/docs/ARCHITECTURE_AUTOGEN/BLUEPRINT_RUNTIME_INTERFACE.generated.md`, `src/docs/ARCHITECTURE_AUTOGEN/BOUNDARY_SEPARATION_CHECKLIST.md` (new), `src/docs/SYSTEM_MAP_AUTOGEN/DOCS_INDEX.md`, `src/contracts/critical-path.smoke.test.ts` (new).
