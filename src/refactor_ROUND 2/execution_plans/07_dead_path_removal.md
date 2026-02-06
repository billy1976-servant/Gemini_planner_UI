# ROUND 2 — Phase 07: Dead Path Removal

**Goal:** Remove or stub legacy content-resolver; remove or document calc-resolver.

---

## Objectives

1. **content/content-resolver.ts:** Remove file or replace with stub that re-exports from logic/content/content-resolver (with @deprecated) so any stray imports don't break. Prefer removal after confirming zero imports.
2. **logic/runtime/calc-resolver.ts:** Remove if no callers; or add top-level comment "Optional; not on main JSON screen path. Used only by flow/TSX if at all." and ensure no main-path imports.

---

## Acceptance criteria

- [x] content/content-resolver: removed or stubbed; no main-path import from content/content-resolver.
- [x] calc-resolver: removed or documented; no main-path dependency.
- [x] Reachability and tests still pass; no broken imports.

---

## Files to touch (planning)

- content/content-resolver.ts
- content/text.content.json, media.content.json, data.content.json (if content-resolver removed: document as legacy or remove if unused)
- logic/runtime/calc-resolver.ts
- Any file that imported these (grep result)

---

## Risks

- Grep for "content-resolver" and "calc-resolver" across repo; ensure no dynamic or test-only paths break.

---

---

## Execution Record

**Summary of changes made**

- Phase 07 was satisfied in Phase 02 (Resolver Unification). No additional code changes: (1) content/content-resolver.ts remains a stub with @deprecated and throws on use; zero runtime imports (only @/content/ imports in code are to JSON under content/sites/). (2) calc-resolver.ts has top-level comment "Optional; not on main JSON screen path. No main-path callers" and @deprecated; imports executeCalc from @/logic/registries/calculator.registry. No main-path dependency on calc-resolver.

**Files modified**

- None this phase (content-resolver stub and calc-resolver docs were updated in Phase 02).

**Tests run**

- npx playwright test tests/runtime-pipeline-contract.spec.ts — **1 passed**. No broken imports (landing-page-resolver uses @/logic/content/content-resolver; no references to content/content-resolver or calc-resolver on main path).

**Confirmation acceptance criteria met**

- content/content-resolver: stubbed; no main-path import.
- calc-resolver: documented optional/legacy; no main-path dependency.
- Reachability and tests pass; no broken imports.
