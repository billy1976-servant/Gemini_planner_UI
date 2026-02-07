# ROUND 2 — Phase 02: Resolver Unification

**Goal:** Single content resolution entrypoint; remove or isolate unused resolvers.

---

## Objectives

1. **Content:** Ensure no runtime import of `content/content-resolver.ts`. All content resolution via `@/logic/content/content-resolver` (resolveContent).
2. **Calc:** Remove `logic/runtime/calc-resolver.ts` from main path or document as "optional; no main-path callers." If removed, delete or stub; if kept, add comment and ensure no dead imports.

---

## Acceptance criteria

- [x] No file under app/, engine/, state/, layout/, behavior/ imports from `@/content/content-resolver` or `content/content-resolver`.
- [x] landing-page-resolver and education-resolver use only `@/logic/content/content-resolver`.
- [x] content/content-resolver.ts: either removed or stubbed with @deprecated and no exports used; content/*.content.json usage documented if kept.
- [x] calc-resolver: either removed (and any flow that referenced it updated) or documented "optional flow integration; not on main JSON screen path."
- [x] Reachability / tests unchanged or updated accordingly.

---

## Files to touch (planning)

- content/content-resolver.ts (remove or stub)
- logic/runtime/landing-page-resolver.ts (already logic/content; verify)
- logic/content/education-resolver.ts (already ./content-resolver; verify)
- logic/runtime/calc-resolver.ts (remove or add doc comment)
- Any test or script that imported content/content-resolver or calc-resolver

---

## Risks

- Build or dynamic imports might reference content-resolver; grep globally before removal.

---

## Execution Record

**Files touched:** `src/content/content-resolver.ts` (doc: content/*.content.json legacy); `src/logic/runtime/calc-resolver.ts` (top-level comment: optional; not on main JSON screen path). **Tests run:** `npx playwright test tests/runtime-pipeline-contract.spec.ts` — 1 passed (Phase 02 verification). **Confirmation:** No runtime import from content/content-resolver; landing-page-resolver and education-resolver use logic/content only; content-resolver stubbed; calc-resolver documented; acceptance criteria met.
