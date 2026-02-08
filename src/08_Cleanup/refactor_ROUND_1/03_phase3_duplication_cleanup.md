# Phase 3 — Duplication & Dead System Resolution

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 3 (stages 3.1–3.7).

---

## Goal

Remove duplicate interpreters/resolvers; resolve or document dead/secondary paths.

---

## Files Expected to Change

- engine/runtime (delete or deprecate if present), logic/runtime
- content/content-resolver.ts, logic/content/content-resolver.ts, landing-page-resolver
- layout/resolver, layout/index, page.tsx, OrganPanel, section-layout-dropdown
- view-resolver.ts, summary/export-resolver
- calc-resolver.ts, flow/step logic
- applyEngineOverlays.ts, build-site or compile
- engine-runner.tsx, layout or app-loader

---

## Exact Refactor Actions

1. **3.1** — Remove or deprecate engine/runtime runtime-verb-interpreter; no import from engine/runtime in behavior path.
2. **3.2** — Single content resolution entrypoint; remove or rename unused; single content-resolver import (logic/content).
3. **3.3** — getLayout2Ids → getSectionLayoutIds (or alias); export getSectionLayoutIds; update call sites or document.
4. **3.4** — View Resolver: add callers or document legacy.
5. **3.5** — Calc Resolver: resolveCalcs called or document legacy.
6. **3.6** — Apply Engine Overlays: call from site compile or document unused.
7. **3.7** — EngineRunner: mount or document "event-only, not mounted".

---

## What Must NOT Change

- logic/runtime; behavior-listener require
- landing-page-resolver; resolveContent
- getPageLayoutIds(); resolveLayout
- summary/export-resolver (if view-resolver is legacy)
- action-runner; run-calculator
- renderFromSchema; compileSiteToSchema
- JsonRenderer; event contract

---

## Acceptance Criteria

- No import from engine/runtime for interpreter.
- Single content-resolver import (logic).
- getSectionLayoutIds public API clear; call sites use it or alias documented.
- View/calc/applyEngineOverlays/EngineRunner: callers or marked legacy/unused/mounted.

---

## Risk Level

**MED** (3.1, 3.2, 3.4, 3.5); **LOW** (3.3, 3.6, 3.7)

---

## Dependencies

3.1 depends on Phase 1.1 (doc path correction).


---

## Verification Report (Step 1 — 2026-02-06)

**Run:** Phase 3 executed; duplication and dead system resolution verified.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| No unexpected side effects | PASS |
| All 7 refactor actions addressed | PASS |

### Actions verified / taken

- **3.1** — No engine/runtime folder; interpreter lives in logic/runtime; behavior-listener imports from logic. No import from engine/runtime. DONE.
- **3.2** — Single content entrypoint: landing-page-resolver and education-resolver use @/logic/content/content-resolver only. src/content/content-resolver.ts exists with @deprecated LEGACY comment pointing to logic. DONE.
- **3.3** — getSectionLayoutIds is preferred API; getLayout2Ids kept as @deprecated alias in layout-resolver. **Call sites updated** to use getSectionLayoutIds: page.tsx, OrganPanel.tsx, section-layout-dropdown.tsx. Public API clear. DONE.
- **3.4** — view-resolver.ts (logic/runtime) has comment: "Used by summary/export flows when decision engine is active. Not on main JSON screen path; legacy/secondary." resolveView lives in flow-resolver and is used by resolve-onboarding.action. View resolver marked legacy. DONE.
- **3.5** — calc-resolver.ts has comment: "Legacy/unused on main JSON screen path. No callers of resolveCalcs in codebase." DONE.
- **3.6** — applyEngineOverlays.ts has header: "Status: Build-time/secondary. Not on main JSON screen path. No callers in codebase; intended for site compile pipeline." Documented in PIPELINE_AND_BOUNDARIES_REFERENCE.md. DONE.
- **3.7** — EngineRunner (engine/runners/engine-runner.tsx) has comment: "Event-only; not mounted in app layout. Listens for hicurv.app.load." Documented. DONE.

### Files changed this run

- **New:** src/refactor_ROUND 1/03_phase3_duplication_cleanup.md (plan content populated from master roadmap).
- **Modified:** src/app/page.tsx (getLayout2Ids → getSectionLayoutIds), src/organs/OrganPanel.tsx (same), src/dev/section-layout-dropdown.tsx (same).

### Acceptance

- No import from engine/runtime for interpreter; single content-resolver import (logic); getSectionLayoutIds used at call sites; view/calc/applyEngineOverlays/EngineRunner documented as legacy or event-only.

