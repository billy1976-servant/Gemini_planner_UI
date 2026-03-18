# ROUND 3 — Phase 01: Pipeline Unification

**Goal:** Single runtime pipeline documented and enforced; no second main path.

---

## Objectives

1. Document the single trunk: Request → page.tsx → loadScreen | resolveLandingPage → [JSON path] doc prep → JsonRenderer → layout (getSectionLayoutId + resolveLayout) → Section/Registry → behavior-listener → state.
2. List secondary paths (GeneratedSiteViewer, SiteSkin, flow-loader) as "not trunk" in architecture doc.
3. Ensure no code path creates a second "main" pipeline (e.g. no alternate screen load that bypasses loadScreen for primary JSON).

---

## Acceptance criteria

- [ ] One canonical document (TRUNK_ARCHITECTURE_TARGET or system-architecture) contains the single pipeline diagram and step list.
- [ ] Secondary paths are named and marked "not trunk."
- [ ] No new entrypoints that compete with page → loadScreen → JsonRenderer for primary JSON.

---

## Files to touch (planning)

- refactor_ROUND 3/architecture/TRUNK_ARCHITECTURE_TARGET.md (already created)
- src/system-architecture/02_RUNTIME_PIPELINE.md or 01_SYSTEM_OVERVIEW.md (add "trunk vs secondary" paragraph)

---

*Planning only; execution later.*
