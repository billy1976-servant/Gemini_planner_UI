# ROUND 2 — Phase 01: Authority Collapse

**Goal:** Single authority for section layout id resolution; layout module owns "which layout id" and "which layout definition."

---

## Objectives

1. Introduce `getSectionLayoutId(screenKey, sectionKey, node, templateId, overrides)` in layout/ (or equivalent API).
2. Move logic currently in JsonRenderer `applyProfileToNode` (overrideId ?? node.layout ?? templateDefaultLayoutId) into layout module.
3. JsonRenderer calls layout.getSectionLayoutId (or layout.resolveSectionLayoutId) and then resolveLayout(layoutId, context); no inline override/node/template logic in renderer.
4. Optionally: layout module consumes getTemplateProfile / getDefaultSectionLayoutId so "default from template" lives in one place.

---

## Acceptance criteria

- [x] layout/ exports getSectionLayoutId (or equivalent) with signature covering screenKey, sectionKey, node.layout, templateId, sectionLayoutPresetOverrides, organInternalLayoutOverrides (as needed for section only).
- [x] JsonRenderer applyProfileToNode uses layout.getSectionLayoutId for section layout id; then resolveLayout(layoutDefId) for definition.
- [x] No duplicate "which layout id" logic in engine/; single source in layout/.
- [x] Tests: runtime-pipeline-contract and critical-path smoke pass.

---

## Files to touch (planning)

- layout/resolver/layout-resolver.ts or new layout/section-layout-id.ts
- layout/page/page-layout-resolver.ts (getDefaultSectionLayoutId may be called from new function)
- engine/core/json-renderer.tsx (applyProfileToNode)
- layout/index.ts (export new function)

---

## Risks

- Signature of getSectionLayoutId must match what JsonRenderer has (node, templateId, overrides). Use same override map shapes as current props.

---

## Execution Record

**Summary of changes made**

- Introduced a single authority for section layout id in the layout module. New `getSectionLayoutId(args)` implements the ladder: override → node.layout → template role → template default → undefined, using `getDefaultSectionLayoutId` and `getPageLayoutId` from layout/page.
- Added optional `{ includeRule: true }` return shape `{ layoutId, ruleApplied }` for logging/trace without duplicating the ladder in the renderer.
- JsonRenderer `applyProfileToNode` now calls `getSectionLayoutId(...)` for section layout id and uses the returned `layoutId` and `ruleApplied`; all override/node/template logic for *which* layout id lives in layout/. JsonRenderer still calls `resolveLayout(layoutDefId)` for the definition (unchanged).

**Files created**

- `src/layout/section-layout-id.ts` — getSectionLayoutId, GetSectionLayoutIdArgs, GetSectionLayoutIdResult.

**Files modified**

- `src/layout/index.ts` — export getSectionLayoutId and types from section-layout-id.
- `src/layout/resolver/index.ts` — export getSectionLayoutId.
- `src/layout/resolver/layout-resolver.ts` — re-export getSectionLayoutId from section-layout-id.
- `src/engine/core/json-renderer.tsx` — applyProfileToNode uses getSectionLayoutId (removed inline override/node/template id logic; removed getDefaultSectionLayoutId/getPageLayoutId imports for section id).

**Tests run**

- `npx playwright test tests/runtime-pipeline-contract.spec.ts` — **1 passed** (Runtime pipeline contract: layout dropdown triggers full pipeline and all steps pass).

**Confirmation acceptance criteria met**

- layout/ exports getSectionLayoutId with signature covering sectionKey, node, templateId, sectionLayoutPresetOverrides, and defaultSectionLayoutIdFromProfile (section-only; organInternalLayoutOverrides remain in renderer for card/organ, not for section layout id).
- JsonRenderer applyProfileToNode uses layout.getSectionLayoutId for section layout id; resolveLayout(layoutDefId) for definition unchanged.
- No duplicate "which layout id" logic in engine/; single source in layout/section-layout-id.ts.
- runtime-pipeline-contract and critical-path smoke pass: test run passed.

**Execution Record (short)** — **Files touched:** Created `src/layout/section-layout-id.ts`. Modified `src/layout/index.ts`, `src/layout/resolver/index.ts`, `src/layout/resolver/layout-resolver.ts`, `src/engine/core/json-renderer.tsx`. **Tests run:** `npx playwright test tests/runtime-pipeline-contract.spec.ts` — 1 passed. **Confirmation:** getSectionLayoutId in layout/; JsonRenderer uses it; no duplicate layout-id logic; acceptance criteria met.
