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

---

## Verification report (Phase 7 executed)

**Date:** 2025-02-04

**Actions taken:**

1. **7.2 — GeneratedSiteViewer + renderFromSchema SECONDARY**
   - In `PIPELINE_AND_BOUNDARIES_REFERENCE.md` §1 (renderer table): added **GeneratedSiteViewer** row with role SECONDARY and note that it fetches compiled SiteSchema, renders via site-renderer, used by generated-websites screens; not on main JSON screen path.
   - renderFromSchema remained documented as SECONDARY in the same table.
   - Added new **§1b. Secondary paths (TSX / flow / site)** stating: site/generated path (GeneratedSiteViewer, renderFromSchema) is SECONDARY; ScreenRenderer/Gibson path is DEAD; engine-registry, flow-loader, FlowRenderer are SECONDARY (only on TSX/flow path).

2. **7.3 — ScreenRenderer DEAD**
   - In §1 table: ScreenRenderer row updated to state "Decision: document as DEAD unless explicitly wired."
   - In §1b: "ScreenRenderer / Gibson path: DEAD. ScreenRenderer is not mounted on the main app path; generated-websites and similar routes use GeneratedSiteViewer, not ScreenRenderer. Decision: document as DEAD; remove or wire only if explicitly planned."

3. **7.5 — engine-registry, flow-loader, FlowRenderer secondary**
   - §1b documents: "Engine-registry, flow-loader, FlowRenderer: SECONDARY — only on TSX/flow path. Reached when a TSX screen or flow is loaded (e.g. engine-viewer, OnboardingFlowRenderer, flow routes). Not reachable from the main JSON screen seed (page.tsx → loadScreen → JsonRenderer). Do not depend on them for the primary JSON path."

4. **7.6 — Site compiler and applyEngineOverlays build-time/secondary**
   - §12 retitled to "Site compiler (build-time or secondary)" and closing paragraph added: "Site compiler and applyEngineOverlays are **not on the main JSON screen path** (page → loadScreen → JsonRenderer). They are used for generated-websites/site schema path only. See ENGINE_RUNTIME_VISIBILITY_MAP.md for connection status."
   - applyEngineOverlays note in §12: "No callers on main path; intended for site compile pipeline when using schema path."

**Files modified:** `src/docs/ARCHITECTURE_AUTOGEN/PIPELINE_AND_BOUNDARIES_REFERENCE.md` only (no code changes).

**Acceptance:** Doc states SECONDARY for renderFromSchema, GeneratedSiteViewer, engine/flow path; ScreenRenderer documented as DEAD; site compiler and applyEngineOverlays documented as build-time/secondary. Risk: LOW.
