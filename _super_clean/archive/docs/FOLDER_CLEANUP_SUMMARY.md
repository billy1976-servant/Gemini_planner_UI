# Folder Cleanup Summary: Glue Pattern Analysis

**Date:** 2026-02-08  
**Purpose:** Summary of glue patterns identified across seven (eight) top-level sections

---

## Executive Summary

This analysis identifies **glue patterns** (re-exports, duplicates, thin adapters) across the codebase's top-level folder structure. The goal is to establish clear **authority boundaries** where each concept has a **single source of truth**.

**Key Findings:**
- **8 major glue patterns** identified across 7 folders (08 is archive)
- **Quick wins:** 02_Contracts_Reports (2 re-exports) and 01_App (4 duplicates)
- **High impact:** 06_Data (site-compiler vs siteCompiler naming split)
- **Estimated total effort:** 10-15 hours across all folders

---

## Glue Patterns by Folder

### 01_App: Entry Point Duplication
**4 duplicates identified:**
1. Two screen trees (`apps-tsx/tsx-screens/` vs `screens/tsx-screens/`)
2. Two ScreenRenderers (01_App vs 03_Runtime)
3. Two safe-json-loaders (01_App vs 03_Runtime)
4. Two screen-manifest.json files (01_App vs 03_Runtime)

**Authority:** 03_Runtime should own ScreenRenderer, loader, and manifest  
**Action:** Collapse 01_App versions to re-exports or delete

---

### 02_Contracts_Reports: Re-export Glue
**2 re-exports identified:**
1. `system/contracts/SystemContract.ts` → re-exports `@/contracts/SystemContract`
2. `03_Runtime/behavior/contract-verbs.ts` → re-exports `@/contracts/contract-verbs`

**Authority:** `@/contracts/*` is the single source  
**Action:** Delete both re-export files, update imports to `@/contracts/*`

**Note:** `behavior-listener.ts` already imports from `@/contracts/contract-verbs` correctly; only comment needs update.

---

### 03_Runtime: Spine Authority
**No new glue after 01 cleanup:**
- Becomes single home for ScreenRenderer, safe-json-loader, screen-manifest.json
- Document this authority in system-architecture docs

---

### 04_Presentation: Barrel & Component Duplication
**3 areas:**
1. **Excessive barrel files:** Many `index.ts` re-exports at subfolder level
2. **Duplicate layout in 08:** `08_Cleanup/0-core/layout/index.ts` mirrors 04 layout
3. **Duplicate site/section components:** Multiple renderer families (ProductGridSection vs ProductGrid)

**Action:** 
- Keep barrels only at public API boundaries
- Remove or deprecate 08's layout
- Unify site components into one subtree with consistent naming

---

### 05_Logic: Resolver & Registry Duplication
**3 areas:**
1. **calc-resolver:** Already `@deprecated`, optional; remove if no callers
2. **Engine/action registries:** Ensure single registry for each
3. **Duplicate engines:** Check for "onboarding-engines" or similar duplicates

**Action:** Remove calc-resolver if unused, verify single registries, remove duplicate engines

---

### 06_Data: Compiler Naming Split
**1 major issue:**
- **Two compiler surfaces:** `site-compiler/` vs `siteCompiler/`
- tsconfig exposes both: `@/lib/site-compiler/*` and `@/lib/siteCompiler/*`
- Code uses both inconsistently

**Authority:** Choose `site-compiler` (kebab-case) as canonical  
**Action:** Merge APIs into `site-compiler`, remove `siteCompiler` folder, update tsconfig

**Additional:**
- Content naming clarity: 05 = resolution, 06 = data (document, don't merge)

---

### 07_Dev_Tools: Documentation Gaps
**3 areas:**
1. **Multiple diagnostic surfaces:** engine-debug, engine-devtools, engine-diagnostics, runtime-diagnostics, devtools
2. **Scripts discoverability:** Many one-off scripts need documentation
3. **Types authority:** `site.types.ts`, `siteSchema.ts` may duplicate 02/06 types

**Action:** 
- Create `diagnostics/README.md` mapping surfaces
- Create `scripts/README.md` listing scripts
- Align types with 02/06 authority

---

### 08_Cleanup: Archive Management
**2 areas:**
1. **0-core/layout:** Duplicate of 04 layout
2. **1-ui:** Old screens/shared

**Action:** 
- Migrate callers, delete folders
- Create `README.md`: "Archive only; do not import for new features"

---

## Execution Priority

| Priority | Folder | Impact | Risk | Effort |
|----------|--------|--------|------|--------|
| **1** | 02_Contracts_Reports | High clarity | Low | 30 min |
| **2** | 01_App | High clarity | Medium | 2-3 hours |
| **3** | 06_Data | High clarity | Medium | 2-3 hours |
| **4** | 04_Presentation | Medium | Medium | 2-3 hours |
| **5** | 05_Logic | Medium | Low | 1-2 hours |
| **6** | 03_Runtime | Medium | Low | 1 hour |
| **7** | 07_Dev_Tools | Low | Low | 1 hour |
| **8** | 08_Cleanup | Low | Low | 30 min |

---

## Quick Reference: What Gets Removed

| File/Folder | Action | Reason |
|-------------|--------|--------|
| `02_Contracts_Reports/system/contracts/SystemContract.ts` | Delete | Re-export glue |
| `03_Runtime/behavior/contract-verbs.ts` | Delete | Re-export glue |
| `01_App/screens/core/ScreenRenderer.tsx` | Re-export | Duplicate of 03 |
| `01_App/screens/utils/safe-json-loader.ts` | Re-export | Duplicate of 03 |
| `01_App/screens/screen-manifest.json` | Delete | Duplicate of 03 |
| `01_App/screens/tsx-screens/` or `apps-tsx/tsx-screens/` | Consolidate | Duplicate screen tree |
| `06_Data/siteCompiler/` | Merge & delete | Naming split with site-compiler |
| `08_Cleanup/0-core/layout/` | Delete | Duplicate of 04 |
| `08_Cleanup/1-ui/` | Migrate & delete | Legacy screens |
| `05_Logic/logic/runtime/calc-resolver.ts` | Remove or doc | Optional, deprecated |

---

## Success Metrics

After cleanup:
- ✅ Each concept has **one canonical location**
- ✅ No re-export glue files (except intentional public API barrels)
- ✅ Consistent naming (e.g., `site-compiler` not `siteCompiler`)
- ✅ Clear authority boundaries documented
- ✅ Build passes
- ✅ Tests pass
- ✅ No broken imports

---

## Related Documents

- **Detailed Plan:** `docs/FOLDER_CLEANUP_PLAN.md` — Full folder-by-folder breakdown
- **Execution Checklist:** `docs/FOLDER_CLEANUP_CHECKLIST.md` — Step-by-step tracking
- **Original Reorganization:** `docs/FOLDER_REORGANIZATION_PLAN_01-08.md`
- **Refactor Plans:** `src/08_Cleanup/refactor_ROUND_2/` and `refactor_ROUND_3/`

---

## Next Steps

1. **Start with 02:** Quick win, low risk (30 min)
2. **Then 01:** High impact, establishes patterns (2-3 hours)
3. **Then 06:** Resolves major naming inconsistency (2-3 hours)
4. **Continue in priority order:** 04 → 05 → 03 → 07 → 08

**Remember:** Always grep for imports before deleting files. Test after each folder.
