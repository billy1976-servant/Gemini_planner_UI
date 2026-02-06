# Phase 3 — Duplication & Dead System Resolution

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 3 (stages 3.1–3.7); Part I A "Where duplication exists", B Gaps 10–12.

---

## Goal

Remove duplicate interpreters/resolvers; resolve or document dead/secondary paths.

---

## Files Expected to Change

- `src/engine/runtime/runtime-verb-interpreter.ts`, `runtime-navigation.ts` (delete or deprecate)
- `src/content/content-resolver.ts`, `src/logic/content/content-resolver.ts`, landing-page-resolver
- layout/resolver, layout/index, page.tsx, OrganPanel, section-layout-dropdown (getLayout2Ids → getSectionLayoutIds)
- view-resolver.ts, summary/export-resolver.ts
- calc-resolver.ts, flow/step logic
- applyEngineOverlays.ts, build-site or compile
- engine-runner.tsx, layout or app-loader

---

## Exact Refactor Actions

1. **3.1** — Remove or deprecate engine/runtime runtime-verb-interpreter; no import from engine/runtime in behavior path.
2. **3.2** — Single content resolution entrypoint; remove or rename unused; single content-resolver import.
3. **3.3** — Export getSectionLayoutIds (or keep alias); update call sites or document.
4. **3.4** — View Resolver: add callers or document legacy.
5. **3.5** — Calc Resolver: resolveCalcs called or document legacy.
6. **3.6** — Apply Engine Overlays: call from site compile or document unused.
7. **3.7** — EngineRunner: mount or document "event-only, not mounted".

---

## What Must NOT Change

- logic/runtime; behavior-listener require path; getPageLayoutIds(); resolveLayout
- summary/export-resolver; action-runner; run-calculator; renderFromSchema; compileSiteToSchema; JsonRenderer; event contract

---

## Acceptance Criteria

- No import from engine/runtime for interpreter.
- Single content-resolver import.
- getSectionLayoutIds public API clear.
- View/calc/overlays/EngineRunner either wired or marked legacy/unused/mounted.

---

## Risk Level

**MED** (3.1, 3.2, 3.4, 3.5); **LOW** (3.3, 3.6, 3.7)

---

## Dependencies

1.1 (for 3.1 — doc must state logic/runtime before removing engine copy)

---

## Verification Report (Step 1)

**Plan Name:** Phase 3 — Duplication & Dead System Resolution

**Scope:** Remove duplicate interpreters/resolvers; resolve or document dead/secondary paths. Changes: engine/runtime (delete), content-resolver (deprecate legacy), layout resolver (getSectionLayoutIds), view-resolver, calc-resolver, applyEngineOverlays, EngineRunner (document only). No changes to logic/runtime, behavior-listener require path, getPageLayoutIds(), resolveLayout, summary/export-resolver, action-runner, run-calculator, renderFromSchema, compileSiteToSchema, JsonRenderer, event contract.

**Date:** 2026-02-04

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | ✅ PASS |
| No forbidden changes made | ✅ PASS |
| No unexpected side effects | ✅ PASS |
| All files referenced exist | ✅ PASS |

### Detailed Findings

**What was verified**

- **3.1** — Removed `src/engine/runtime/runtime-verb-interpreter.ts` and `src/engine/runtime/runtime-navigation.ts`. No import from engine/runtime in behavior path (behavior-listener uses logic/runtime only). Grep confirms no remaining imports from engine/runtime for interpreter.
- **3.2** — Single content resolution entrypoint: `@/logic/content/content-resolver` (landing-page-resolver, education-resolver). `src/content/content-resolver.ts` marked @deprecated LEGACY with comment that single entrypoint is logic/content.
- **3.3** — Exported `getSectionLayoutIds()` from layout/resolver and @/layout; kept `getLayout2Ids()` as @deprecated alias. Public API clear; call sites unchanged (still use getLayout2Ids where they did).
- **3.4** — view-resolver.ts: added comment "Used by summary/export flows when decision engine is active. Not on main JSON screen path; legacy/secondary." resolveView (flow-resolver) remains wired from resolve-onboarding.action.
- **3.5** — calc-resolver.ts: added comment "Legacy/unused on main JSON screen path. No callers of resolveCalcs in codebase; for future calculator/flow integration."
- **3.6** — applyEngineOverlays.ts: added status comment "Build-time/secondary. Not on main JSON screen path. No callers; intended for site compile pipeline. Wire from build-site or compile script when using site schema path."
- **3.7** — EngineRunner: added JSDoc "Event-only; not mounted in app layout. Listens for hicurv.app.load; mounts JsonRenderer when event fires. Primary render path is page.tsx → loadScreen → JsonRenderer."

**Files changed / removed**

- **Deleted:** `src/engine/runtime/runtime-verb-interpreter.ts`, `src/engine/runtime/runtime-navigation.ts`.
- **Modified:** `src/content/content-resolver.ts`, `src/layout/resolver/layout-resolver.ts`, `src/layout/index.ts`, `src/logic/runtime/view-resolver.ts`, `src/logic/runtime/calc-resolver.ts`, `src/lib/site-engines/applyEngineOverlays.ts`, `src/engine/runners/engine-runner.tsx`.

**Gaps / follow-up**

- None. Acceptance criteria met: no import from engine/runtime for interpreter; single content-resolver import (logic/content); getSectionLayoutIds public API clear; view/calc/overlays/EngineRunner documented as legacy, unused, or event-only.
