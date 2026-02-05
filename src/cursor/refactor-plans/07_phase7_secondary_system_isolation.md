# Phase 7 — Engine / Flow / Secondary Path Isolation

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 7 (7.2, 7.3, 7.5, 7.6); 7.1/7.4 in Phase 1/3; Part I Renderer classification.

---

## Goal

Classify and document PRIMARY/SECONDARY/DEAD render paths; isolate flow/TSX from main JSON path.

---

## Files Expected to Change

- ARCHITECTURE_AUTOGEN or roadmap doc (renderFromSchema SECONDARY)
- ScreenRenderer.tsx, generated-websites, app/sites (DEAD or wire)
- RUNTIME_CALL_GRAPH.generated.md, ARCHITECTURE_AUTOGEN (engine registry TSX/flow path)
- src/lib/site-compiler, src/lib/site-engines, docs (site compiler build-time/secondary)

---

## Exact Refactor Actions

1. **7.2** — Document: GeneratedSiteViewer + renderFromSchema SECONDARY.
2. **7.3** — ScreenRenderer / Gibson path: decision to remove or wire; document DEAD.
3. **7.5** — Document: engine-registry, flow-loader, FlowRenderer secondary (only on TSX/flow path).
4. **7.6** — Document: site compiler and applyEngineOverlays build-time or secondary.

---

## What Must NOT Change

- renderFromSchema; layout-bridge; JsonRenderer; page.tsx JSON branch; loadScreen; compile scripts

---

## Acceptance Criteria

- Doc states SECONDARY for renderFromSchema and engine/flow path.
- ScreenRenderer decision documented.
- Site compiler documented.

---

## Risk Level

**LOW**

---

## Dependencies

1.3 (renderer table); 1.13 (site compiler pipeline doc)
