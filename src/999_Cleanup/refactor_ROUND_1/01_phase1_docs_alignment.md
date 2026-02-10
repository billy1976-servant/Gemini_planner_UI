# Phase 1 — Documentation + Contract Alignment

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Part II Section 2, "Phase 1 — Documentation + Contract Alignment" (stages 1.1–1.15); Part I Section A (Current Truth), B (Gaps 14, 18–20), E (Do First #1).

---

## Goal

Fix doc drift; establish single source of truth for pipeline, boundaries, and renderer classification.

---

## Files Expected to Change

- `src/docs/ARCHITECTURE_AUTOGEN/*.md`
- `src/docs/RUNTIME/*.md`
- `src/docs/SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md` (or ARCHITECTURE_AUTOGEN)
- New or existing docs under `src/docs` for: screen load, layout order, organ expand/skin order, ui-verb-map, override stores, scripts boundary, state persistence, site compiler, error/reporting, diagnostics

---

## Exact Refactor Actions

1. **1.1** — Replace any doc stating "engine/runtime/runtime-verb-interpreter" as active path with "logic/runtime/runtime-verb-interpreter".
2. **1.2** — Add note: API routes invoked by Next.js/fetch; exclude from module reachability seed or document.
3. **1.3** — Add/update renderer table: JsonRenderer PRIMARY; renderFromSchema SECONDARY; ScreenRenderer DEAD; SiteSkin SECONDARY; EngineRunner DEAD/PARTIAL.
4. **1.4** — Blueprint compiler boundary: compiler output only; no runtime layout IDs; no blueprint script in runtime.
5. **1.5** — Document behavior listener branch order: state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn.
6. **1.6** — Single reference: loadScreen path rules, TSX vs JSON, state init, API route location.
7. **1.7** — Single reference: layout resolution order (page → component → organ internal).
8. **1.8** — Single reference: assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen.
9. **1.9** — Clarify config/ui-verb-map.json design-time; runtime uses behavior-runner + listener.
10. **1.10** — One table: section-layout-preset-store, card overrides, organ-internal-layout-store.
11. **1.11** — Document scripts: build-time or one-off; no script imported by app/engine/state/layout at runtime.
12. **1.12** — Document state persistence: localStorage key, event log shape, rehydration; no new persistence without contract.
13. **1.13** — Document site compiler: normalizeSiteData, compileSiteToSchema, applyEngineOverlays build-time/secondary.
14. **1.14** — Document where errors are reported; no silent swallows in primary path.
15. **1.15** — Document dev-only surfaces (runtime-decision-trace, diagnostics); they do not change production paths.

---

## What Must NOT Change

- Runtime code; behavior-listener require path; screen-loader; API route
- Resolver implementations; page.tsx order; behavior-runner/listener; store implementations
- persist/rehydrate logic; renderFromSchema/GeneratedSiteViewer; existing throw/warn; production branches

---

## Acceptance Criteria

- Grep finds no doc stating engine path is the active interpreter.
- All 15 doc artifacts exist.
- Renderer table in single doc.
- Doc matches code for branch order and pipeline order.

---

## Risk Level

**LOW**

---

## Dependencies

None

---

## Verification Report (Step 1)

**Plan Name:** Phase 1 — Documentation + Contract Alignment

**Scope:** Fix doc drift; establish single source of truth for pipeline, boundaries, and renderer classification. Changes limited to docs under `src/docs/` (ARCHITECTURE_AUTOGEN, RUNTIME, SYSTEM_MAP_AUTOGEN, System Files Update Reports). No runtime code, behavior-listener require path, screen-loader, API route, resolvers, stores, or production branches modified.

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

- All 15 refactor actions (1.1–1.15) executed: interpreter path corrected to logic in all docs; API routes note added; renderer table in single doc; blueprint boundary; behavior branch order; single references for loadScreen, layout order, pipeline order, override stores, ui-verb-map, scripts, state persistence, site compiler, errors, dev-only surfaces.
- Acceptance: Grep finds no doc stating engine path as the active interpreter (only “obsolete” or “replace with logic”). Renderer table lives in PIPELINE_AND_BOUNDARIES_REFERENCE.md. Branch and pipeline order match behavior-listener and page.tsx.

**Files checked / changed**

- PATH CORRECTIONS: STATE_MUTATION_SURFACE_MAP.md, STATE_FLOW_CONTRACT.md, ENGINE_DECISION_TRACE_MAP.md, REACHABILITY_REPORT.generated.md, RUNTIME/SYSTEM_FILES_UPDATE_DIFF_REPORT.md, System Files Update Reports/DIFF_2025-02-04.md.
- NEW: ARCHITECTURE_AUTOGEN/PIPELINE_AND_BOUNDARIES_REFERENCE.md (renderer table, API note, blueprint boundary, branch order, loadScreen, layout order, pipeline order, override stores, ui-verb-map, scripts, state persistence, site compiler, errors, dev-only).
- UPDATED: BLUEPRINT_RUNTIME_INTERFACE.generated.md (Blueprint compiler boundary section), RUNTIME_PIPELINE_CONTRACT.md (branch-order cross-reference), REACHABILITY_REPORT.generated.md (API routes note; obsolete engine path note), DOCS_INDEX.md (PIPELINE_AND_BOUNDARIES_REFERENCE entry).

**Gaps / follow-up**

- None. All 15 doc artifacts exist; no forbidden changes; protocol “append report to plan file” satisfied.
---

## Verification Report (Step 2 — 2026-02-06)

**Run:** Phase 1 executed again; docs-only alignment verified.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| No unexpected side effects | PASS |
| All 15 refactor actions present in docs | PASS |

### Actions taken this run

- **1.2** — Added API routes note to REACHABILITY_REPORT.generated.md: API routes (e.g. GET /api/screens/[...path]) are invoked by Next.js/fetch and are not part of the module graph; excluded from reachability seed. See PIPELINE_AND_BOUNDARIES_REFERENCE.md section 2.
- **1.1** — Verified: grep finds no doc stating engine path as the active interpreter; only DIFF reports mention src/engine/runtime/ (as replaced with logic or deleted).
- **1.3–1.15** — Confirmed already present in PIPELINE_AND_BOUNDARIES_REFERENCE.md (renderer table, blueprint boundary, branch order, loadScreen, layout order, pipeline order, override stores, ui-verb-map, scripts, state persistence, site compiler, errors, dev-only).

### Files changed

- src/docs/SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md — API routes note added after seed list.
