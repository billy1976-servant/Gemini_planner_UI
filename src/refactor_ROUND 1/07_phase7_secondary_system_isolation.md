# Phase 7 — Engine / Flow / Secondary Path Isolation

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 7 (7.1–7.6); 7.1 covered in Phase 1, 7.4 in Phase 3.

---

## Goal

Classify and document PRIMARY/SECONDARY/DEAD render paths; isolate flow/TSX from main JSON path; document site compiler as build-time/secondary.

---

## Files Expected to Change

- ARCHITECTURE_AUTOGEN (PIPELINE_AND_BOUNDARIES_REFERENCE), RUNTIME_CALL_GRAPH
- ScreenRenderer.tsx, generated-websites, app/sites (document only)
- src/lib/site-compiler, src/lib/site-engines, docs

---

## Exact Refactor Actions

1. **7.1** — Renderer table: covered in Phase 1 (PIPELINE_AND_BOUNDARIES_REFERENCE §1). No change.
2. **7.2** — renderFromSchema marked SECONDARY. Document: GeneratedSiteViewer + renderFromSchema secondary.
3. **7.3** — ScreenRenderer / Gibson path: document DEAD or wire. Decision documented.
4. **7.4** — Engine Runner: covered in Phase 3 (event-only, not mounted). No change.
5. **7.5** — Document: engine-registry, flow-loader, FlowRenderer secondary (TSX/flow path only).
6. **7.6** — Document: site compiler and applyEngineOverlays build-time or secondary.

---

## What Must NOT Change

- renderFromSchema; layout-bridge
- JsonRenderer
- page.tsx JSON branch; loadScreen
- renderFromSchema; compile scripts

---

## Acceptance Criteria

- Renderer table in single doc (Phase 1).
- renderFromSchema, GeneratedSiteViewer SECONDARY; ScreenRenderer DEAD; engine-registry/flow SECONDARY; site compiler build-time/secondary documented.

---

## Risk Level

**LOW**

---

## Dependencies

7.2, 7.6 depend on Phase 1.3, 1.13.


---

## Verification Report (Step 1 — 2026-02-06)

**Run:** Phase 7 verified; no changes required.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| All stages (7.1–7.6) documented | PASS |

### Current state verified

- **7.1** — Renderer table: Phase 1 (PIPELINE_AND_BOUNDARIES_REFERENCE §1). No change.
- **7.2** — renderFromSchema and GeneratedSiteViewer marked SECONDARY in §1 and §1b. No change.
- **7.3** — ScreenRenderer marked DEAD in §1 and §1b ("ScreenRenderer / Gibson path: DEAD"). No change.
- **7.4** — EngineRunner: Phase 3 (event-only, not mounted). No change.
- **7.5** — Engine-registry, flow-loader, FlowRenderer: §1b states "SECONDARY — only on TSX/flow path". No change.
- **7.6** — Site compiler: §12 states normalizeSiteData, compileSiteToSchema, applyEngineOverlays build-time/secondary. No change.

### Files changed this run

- **New:** src/refactor_ROUND 1/07_phase7_secondary_system_isolation.md (plan content only).

### Acceptance

- All secondary/DEAD paths and site compiler status documented in PIPELINE_AND_BOUNDARIES_REFERENCE.

