# Layout-2 Folder Removal

**Classification:** HISTORICAL — layout-2 removed; use src/layout only.

**Domain:** Layout  
**Status:** Complete

## Goal

Remove the stray `src/layout-2` folder (no runtime imports used it); update docs and comments so future work uses `@/layout` / `src/layout` only and does not recreate layout-2.

## What Was Done

- **Removed `src/layout-2`:** Deleted all 5 files (capabilities.ts, index.ts, layout-resolver.ts, LayoutMoleculeRenderer.tsx, section-helpers.ts). Runtime already used `@/layout` only.
- **Docs updated:** UNIFIED_LAYOUT_SYSTEM_REFACTOR_PLAN.md, UNIFIED_LAYOUT_SYSTEM_REFACTOR_CORRECTED_PLAN.md, SECTION_LAYOUT_LAYOUT2_ACTION_PLAN.md, and src/cursor/layout/organ-structures-audit.md — path references changed from `src/layout-2/*` and `@/layout-2` to `src/layout/page/*`, `src/layout/resolver/*`, `src/layout/renderer/*`, and `@/layout`.
- **Comments updated:** In-source comments that referred to “layout-2” folder or “layout-2 id” were changed to “section layout” / “section layout id” in section.compound.tsx, organ-internal-layout-store.ts, layout-organ, OrganPanel.tsx, section-layout-dropdown.tsx, json-renderer.tsx, and section-layout-requirements.json. DOM attributes `data-layout-2` and `data-layout-2-media` were left unchanged.

## Files Touched

| Area | Files |
|------|--------|
| Deleted | src/layout-2/* (entire folder) |
| Docs | docs/HI_SYSTEM/UNIFIED_LAYOUT_SYSTEM_REFACTOR_PLAN.md, UNIFIED_LAYOUT_SYSTEM_REFACTOR_CORRECTED_PLAN.md, docs/SECTION_LAYOUT_LAYOUT2_ACTION_PLAN.md, src/cursor/layout/organ-structures-audit.md |
| Comments | section.compound.tsx, organ-internal-layout-store.ts, layout-organ/*, OrganPanel.tsx, section-layout-dropdown.tsx, json-renderer.tsx, layout/requirements/section-layout-requirements.json |

## Verification

- Build compiles successfully (layout code path). No imports referenced `@/layout-2`; removal does not change runtime behavior.
