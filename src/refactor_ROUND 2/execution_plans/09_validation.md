# ROUND 2 — Phase 09: Validation

**Goal:** Reachability seed and critical path tests pass; boundary checklist verified.

---

## Objectives

1. Run reachability report (if used); ensure seed entrypoints include layout (resolveLayout, getSectionLayoutId), state-resolver, action-registry, registry, screen-loader.
2. Run critical path smoke test and runtime-pipeline-contract test; both pass.
3. Verify BOUNDARY_SEPARATION_CHECKLIST: no layout in state, no behavior in layout, no blueprint in runtime, single content entrypoint.

---

## Acceptance criteria

- [ ] `npx playwright test tests/runtime-pipeline-contract.spec.ts` passes.
- [ ] critical-path.smoke.test.ts (or equivalent) passes.
- [ ] Reachability seed (if applicable) includes layout module and state-resolver; no broken references.
- [ ] Boundary checklist reviewed; no new violations from ROUND 2 changes.

---

## Files to touch (planning)

- tests/runtime-pipeline-contract.spec.ts (no change unless test updates needed)
- contracts/critical-path.smoke.test.ts
- scripts/docs/generate-reachability-report.ts (seed list if needed)
- docs or checklist files (review only)

---

*Planning only; execution later.*
