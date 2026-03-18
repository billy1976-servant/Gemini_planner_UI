# Folder Cleanup Execution Checklist

**Quick reference for tracking cleanup progress.**  
See `FOLDER_CLEANUP_PLAN.md` for detailed steps and rationale.

---

## Phase 1: Quick Wins

### ✅ 02_Contracts_Reports
- [ ] Grep for `system/contracts/SystemContract` imports
- [ ] Delete `src/02_Contracts_Reports/system/contracts/SystemContract.ts`
- [ ] Update imports to `@/contracts/SystemContract`
- [ ] Grep for `behavior/contract-verbs` imports
- [ ] Delete `src/03_Runtime/behavior/contract-verbs.ts`
- [ ] Update imports to `@/contracts/contract-verbs`
- [ ] Run build: `npm run build`
- [ ] Run tests: `npm test` (if available)

### ⬜ 01_App
- [ ] Audit: Find all imports of duplicate screen trees
- [ ] Choose canonical tree (`apps-tsx/tsx-screens/`)
- [ ] Migrate unique files from `screens/tsx-screens/` to canonical
- [ ] Delete duplicate tree or make it re-exports
- [ ] Update all screen imports
- [ ] Make `01_App/screens/core/ScreenRenderer.tsx` re-export from `@/runtime/screens/ScreenRenderer`
- [ ] Make `01_App/screens/utils/safe-json-loader.ts` re-export from `@/runtime/loaders/safe-json-loader`
- [ ] Delete `01_App/screens/screen-manifest.json` (keep `03_Runtime/runtime/registry/screen-manifest.json`)
- [ ] Update all manifest references
- [ ] Run build and tests

---

## Phase 2: Core Cleanup

### ⬜ 03_Runtime
- [ ] Document: Runtime is single home for ScreenRenderer, safe-json-loader, screen-manifest
- [ ] Add to `02_Contracts_Reports/docs/` or `system-architecture/`
- [ ] Verify no duplicate engine execution paths

### ⬜ 06_Data
- [ ] Grep for `@/lib/site-compiler/*` imports
- [ ] Grep for `@/lib/siteCompiler/*` imports
- [ ] Choose canonical: `site-compiler` (kebab-case)
- [ ] Merge APIs: Consolidate functions/types into `site-compiler/`
- [ ] Update tsconfig: Remove `@/lib/siteCompiler/*` alias
- [ ] Update all imports to `@/lib/site-compiler/*`
- [ ] Delete `siteCompiler` folder
- [ ] Document content naming (05 = resolution, 06 = data)
- [ ] Run build and tests

---

## Phase 3: Presentation & Logic

### ⬜ 04_Presentation
- [ ] List all `index.ts` barrel files
- [ ] Identify public API vs internal barrels
- [ ] Remove redundant barrels (keep only top-level public APIs)
- [ ] Grep for `08_Cleanup/0-core/layout` imports
- [ ] Migrate to `@/layout` or make re-export with `@deprecated`
- [ ] Delete `08_Cleanup/0-core/layout` after migration
- [ ] Audit site/section components (find duplicates)
- [ ] Consolidate into one subtree with consistent naming
- [ ] Update all imports
- [ ] Run build and tests

### ⬜ 05_Logic
- [ ] Grep for `calc-resolver` imports
- [ ] Remove `calc-resolver.ts` if no callers, or keep with clear docs
- [ ] Verify single engine registry (`logic/engines`)
- [ ] Verify single action registry (`logic/runtime/action-runner` or `logic/registries`)
- [ ] Search for duplicate engine folders
- [ ] Remove duplicates or merge into `logic/engines`
- [ ] Run build and tests

---

## Phase 4: Documentation & Archive

### ⬜ 07_Dev_Tools
- [ ] Create `diagnostics/README.md` mapping each diagnostic surface
- [ ] Create `scripts/README.md` listing scripts and purposes
- [ ] Compare `07_Dev_Tools/types/` with `02/contracts` and `06/site-schema`
- [ ] Re-export duplicate types from single authority
- [ ] Document: "Site types live in `@/lib/site-schema` or `@/contracts`"

### ⬜ 08_Cleanup
- [ ] Grep for `08_Cleanup/0-core/layout` imports (if not done in 04)
- [ ] Grep for `08_Cleanup/1-ui` imports
- [ ] Migrate `1-ui` callers to `01_App` or `04_Presentation`
- [ ] Delete `0-core` and `1-ui` folders
- [ ] Create `08_Cleanup/README.md`: "Archive only; do not import for new features"

---

## Verification Commands

```bash
# Find imports before deletion
grep -r "system/contracts/SystemContract" src/
grep -r "behavior/contract-verbs" src/
grep -r "@/lib/siteCompiler" src/
grep -r "08_Cleanup/0-core/layout" src/

# Build verification
npm run build

# Test verification (if available)
npm test
```

---

## Progress Summary

| Folder | Status | Notes |
|--------|--------|-------|
| 02_Contracts_Reports | ⬜ | Quick win |
| 01_App | ⬜ | High impact |
| 03_Runtime | ⬜ | Documentation |
| 06_Data | ⬜ | High impact |
| 04_Presentation | ⬜ | Medium complexity |
| 05_Logic | ⬜ | Low risk |
| 07_Dev_Tools | ⬜ | Documentation |
| 08_Cleanup | ⬜ | Archive cleanup |

---

**Last Updated:** 2026-02-08
