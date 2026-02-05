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
