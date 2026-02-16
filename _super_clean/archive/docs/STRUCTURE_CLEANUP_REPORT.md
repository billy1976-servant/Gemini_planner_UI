# Structure Cleanup Report — Basic Structure Stabilization

**Date:** 2026-02-08  
**Mode:** Structure cleanup only — NO logic rewrites, NO behavior changes

---

## PHASE 1 — DUPLICATES FOUND

### 1. Renderer Duplicates
- ✅ **AUTHORITY:** `src/03_Runtime/runtime/screens/ScreenRenderer.tsx`
- ⚠️ **DUPLICATE:** `src/01_App/screens/core/ScreenRenderer.tsx`
  - Imported via: `@/apps-tsx/core/ScreenRenderer` (tsconfig alias)
  - Status: **IMPORTED** → Convert to re-export

### 2. Loader Duplicates
- ✅ **AUTHORITY:** `src/03_Runtime/runtime/loaders/safe-json-loader.ts`
- ⚠️ **DUPLICATE:** `src/01_App/screens/utils/safe-json-loader.ts`
  - Status: **NOT IMPORTED** → Archive to 08_Cleanup/legacy/

### 3. Manifest Duplicates
- ✅ **AUTHORITY:** `src/03_Runtime/runtime/registry/screen-manifest.json`
- ⚠️ **DUPLICATE:** `src/01_App/screens/screen-manifest.json`
  - Status: **NOT IMPORTED** (code uses `@/runtime/registry/screen-manifest.json`)
  - Action: Archive to 08_Cleanup/legacy/

### 4. Compiler Duplicates
- ✅ **AUTHORITY:** `src/06_Data/site-compiler/` (kebab-case, modern API)
  - Files: `compileSiteToSchema.ts`, `normalizeSiteData.ts`, `compileSiteToScreenModel.ts`
- ⚠️ **DUPLICATE:** `src/06_Data/siteCompiler/` (camelCase, legacy)
  - Files: `compileSite.ts`, `normalize.ts`, `loaders.ts`, `types.ts`, `index.ts`
  - Status: **IMPORTED** (via `@/lib/siteCompiler/*`)
  - Action: Convert to re-exports pointing to site-compiler

### 5. Screen Tree Duplicates
- ✅ **AUTHORITY:** `src/01_App/apps-tsx/tsx-screens/` (used by page.tsx routing)
- ⚠️ **DUPLICATE:** `src/01_App/screens/tsx-screens/` (subset, fewer files)
  - Status: **PARTIALLY IMPORTED** (some files may be referenced)
  - Action: Audit imports, archive unused files

### 6. Contract Re-exports (Mirrors)
- ✅ **AUTHORITY:** `src/02_Contracts_Reports/contracts/` (single source)
- ⚠️ **MIRROR 1:** `src/02_Contracts_Reports/system/contracts/SystemContract.ts`
  - Content: `export * from "@/contracts/SystemContract"`
  - Status: **CHECK IMPORTS** → Convert to re-export or archive
- ⚠️ **MIRROR 2:** `src/03_Runtime/behavior/contract-verbs.ts`
  - Content: `export * from "@/contracts/contract-verbs"`
  - Status: **CHECK IMPORTS** → Convert to re-export or archive

---

## PHASE 2 — AUTHORITIES SELECTED

| Category | Authority Location | Reason |
|----------|-------------------|--------|
| **ScreenRenderer** | `03_Runtime/runtime/screens/ScreenRenderer.tsx` | Runtime is spine; screen rendering is runtime concern |
| **safe-json-loader** | `03_Runtime/runtime/loaders/safe-json-loader.ts` | Runtime is spine; loading is runtime concern |
| **screen-manifest.json** | `03_Runtime/runtime/registry/screen-manifest.json` | Runtime is spine; registry is runtime concern |
| **Site Compiler** | `06_Data/site-compiler/` | Kebab-case consistency; modern API surface |
| **Screen Tree** | `01_App/apps-tsx/tsx-screens/` | Referenced by page.tsx routing (`../01_App/apps-tsx`) |
| **Contracts** | `02_Contracts_Reports/contracts/` | Single source of truth for all contracts |

---

## PHASE 3 — COLLAPSE PLAN

### Files to Convert to Re-exports (IMPORTED)
1. `src/01_App/screens/core/ScreenRenderer.tsx` → Re-export from `@/runtime/screens/ScreenRenderer`
2. `src/06_Data/siteCompiler/*` → Re-export from `@/lib/site-compiler/*` (per file)
3. `src/02_Contracts_Reports/system/contracts/SystemContract.ts` → Check imports first
4. `src/03_Runtime/behavior/contract-verbs.ts` → Check imports first

### Files to Archive (NOT IMPORTED)
1. `src/01_App/screens/utils/safe-json-loader.ts` → Move to `08_Cleanup/legacy/`
2. `src/01_App/screens/screen-manifest.json` → Move to `08_Cleanup/legacy/`
3. `src/01_App/screens/tsx-screens/` → Audit first, then archive unused files

---

## EXECUTION STATUS

- [x] Phase 1: Duplicates identified
- [ ] Phase 2: Authorities selected (DONE)
- [ ] Phase 3: Collapse duplicates
- [ ] Phase 4: Verify structure
- [ ] Phase 5: Final report
