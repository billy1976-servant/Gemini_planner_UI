# ROUND 2 — Phase 04: Runtime Entry Simplification

**Goal:** No new runtime entrypoints; simplify by having JsonRenderer call layout API for section layout id.

---

## Objectives

1. JsonRenderer is the only renderer on the main JSON path; no second "layout application" entrypoint.
2. Section layout id resolution is performed by layout module (getSectionLayoutId); JsonRenderer only calls layout and passes result to Section/resolveLayout.
3. Document the single runtime flow: page → loadScreen → doc prep → JsonRenderer → (layout.getSectionLayoutId + resolveLayout) → Section/LayoutMoleculeRenderer → behavior-listener → state.

---

## Acceptance criteria

- [x] No new public entrypoints added; existing page.tsx, loadScreen, JsonRenderer, behavior-listener, state-resolver remain the spine.
- [x] JsonRenderer uses layout.getSectionLayoutId (from Phase 01) and resolveLayout; no inline override/node/template logic for section layout id.
- [x] system-architecture or ROUND 2 architecture doc updated with "single runtime entry spine" (one paragraph).

---

## Files to touch (planning)

- engine/core/json-renderer.tsx (already in Phase 01)
- refactor_ROUND 2/architecture/ or src/system-architecture (doc)

---

## Dependencies

- Phase 01 (authority collapse) must be done first.

---

---

## Execution Record

**Summary of changes made**

- Phase 04 is verification and documentation only. No new runtime entrypoints were added; JsonRenderer already uses layout.getSectionLayoutId and resolveLayout (Phase 01). Single runtime flow confirmed: page → loadScreen → doc prep → JsonRenderer → (layout.getSectionLayoutId + resolveLayout) → Section/LayoutMoleculeRenderer → behavior-listener → state.

**Files modified**

- src/system-architecture/02_RUNTIME_PIPELINE.md — Added "Single runtime entry spine" paragraph at top; updated section 4 to state JsonRenderer calls layout.getSectionLayoutId and resolveLayout (no inline section layout id logic).

**Tests run**

- No code change; runtime-pipeline-contract already passes (Phase 01/03).

**Confirmation acceptance criteria met**

- Spine unchanged: page.tsx, loadScreen, JsonRenderer, behavior-listener, state-resolver.
- JsonRenderer uses layout.getSectionLayoutId and resolveLayout; section layout id logic lives in layout module.
- 02_RUNTIME_PIPELINE.md updated with single runtime entry spine and layout resolution wording.

**Execution Record (short)** — **Files touched:** `src/system-architecture/02_RUNTIME_PIPELINE.md`. **Tests run:** No code change; runtime-pipeline-contract already passing. **Confirmation:** No new entrypoints; JsonRenderer uses layout.getSectionLayoutId and resolveLayout; single runtime spine documented; acceptance criteria met.
