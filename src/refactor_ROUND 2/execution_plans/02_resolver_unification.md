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

*Planning only; execution later.*

---

## Execution Record (pre-execution)

**Alignment gate:** PHASE_02_ALIGNMENT_REPORT.md — GO (zero drift).  
**Date:** 2026-02-06.  
**Status:** Pre-execution; no code changes claimed.

**Planned files to touch:**

| File | Action |
|------|--------|
| `src/content/content-resolver.ts` | Remove or keep stub with @deprecated; ensure no used exports. |
| `src/logic/runtime/landing-page-resolver.ts` | Verify import: `@/logic/content/content-resolver` only. |
| `src/logic/content/education-resolver.ts` | Verify import: logic/content content-resolver only. |
| `src/logic/runtime/calc-resolver.ts` | Remove or add top-level comment "Optional; not on main JSON screen path." |
| Any test or script importing `content/content-resolver` or `calc-resolver` | Update or remove imports after grep. |

**Tests to run (after execution):**

- Existing reachability / system tests referenced in acceptance criteria.
- Build and any tests that depend on `content/content-resolver` or `calc-resolver` (grep first).
- No new tests required by Phase 02 scope.
