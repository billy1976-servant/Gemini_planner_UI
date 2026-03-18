# ROUND 3 — Phase 05: Final Integrity Pass

**Goal:** Full test run; trunk checklist; ROUND 3 sign-off.

---

## Objectives

1. Run full agreed test suite (runtime-pipeline-contract, critical-path, any calculator/organ/layout tests).
2. Verify trunk checklist: single pipeline, single authority per domain, minimal JSON surface, contract frozen. **Renderer boundary:** JsonRenderer imports only @/layout, @/state, registry, behavior contract; no @/lib/layout, no preset/molecule resolvers, no config readers. **Layout authority:** all layout resolution via @/layout only.
3. Create ROUND 3 completion report: phases 1–5 status, file count (core trunk), any deferred items.

---

## Acceptance criteria

- [ ] All tests in scope pass.
- [ ] Trunk checklist (pipeline, authority, JSON surface, contract) verified and signed off.
- [ ] Renderer boundary verified (no forbidden imports in JsonRenderer). Layout authority verified (no app/renderer direct imports to lib/layout).
- [ ] refactor_ROUND 3/ROUND3_FINAL_REPORT.md created: phases done, core file count, deferred items.

---

## Files to touch (planning)

- (At execution) refactor_ROUND 3/ROUND3_FINAL_REPORT.md
- No code changes; verification and report only.

---

*Planning only; execution later.*
