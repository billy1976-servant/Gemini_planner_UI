# Structure Cleanup — Final Report

**Date:** 2026-02-08  
**Mode:** Structure cleanup only — NO logic rewrites, NO behavior changes

---

## EXECUTION SUMMARY

### ✅ COMPLETED ACTIONS

#### 1. ScreenRenderer — CONVERTED TO RE-EXPORT
- **Authority:** `src/03_Runtime/runtime/screens/ScreenRenderer.tsx` ✅
- **Duplicate:** `src/01_App/screens/core/ScreenRenderer.tsx`
  - **Action:** Converted to re-export wrapper
  - **Result:** Single implementation, alias `@/apps-tsx/core/ScreenRenderer` still works

#### 2. safe-json-loader — ARCHIVED
- **Authority:** `src/03_Runtime/runtime/loaders/safe-json-loader.ts` ✅
- **Duplicate:** `src/01_App/screens/utils/safe-json-loader.ts`
  - **Status:** NOT IMPORTED
  - **Action:** Archived to `src/08_Cleanup/legacy/safe-json-loader.ts`
  - **Result:** Single implementation remains

#### 3. screen-manifest.json — ARCHIVED
- **Authority:** `src/03_Runtime/runtime/registry/screen-manifest.json` ✅
- **Duplicate:** `src/01_App/screens/screen-manifest.json`
  - **Status:** NOT IMPORTED (code uses `@/runtime/registry/screen-manifest.json`)
  - **Action:** Archived to `src/08_Cleanup/legacy/screen-manifest.json`
  - **Result:** Single manifest remains

#### 4. Contract Re-exports — ARCHIVED
- **Authority:** `src/02_Contracts_Reports/contracts/` ✅
- **Mirror 1:** `src/02_Contracts_Reports/system/contracts/SystemContract.ts`
  - **Status:** NOT IMPORTED
  - **Action:** Archived to `src/08_Cleanup/legacy/system-contracts-SystemContract.ts`
- **Mirror 2:** `src/03_Runtime/behavior/contract-verbs.ts`
  - **Status:** NOT IMPORTED (only mentioned in comment)
  - **Action:** Archived to `src/08_Cleanup/legacy/behavior-contract-verbs.ts`
  - **Result:** Contracts authority is now `@/contracts/*` only

---

## ⚠️ DEFERRED ITEMS (Requires Analysis)

### 5. Site Compiler Folders — DIFFERENT APIs DETECTED
- **site-compiler:** `src/06_Data/site-compiler/` (kebab-case)
  - Functions: `compileSiteToSchema`, `normalizeSiteData`, `compileSiteToScreenModel`
  - Output: `NormalizedSite`, `SiteSchema`
- **siteCompiler:** `src/06_Data/siteCompiler/` (camelCase)
  - Functions: `compileSite`, `normalize`, `loaders`, `types`
  - Output: `CompiledSiteModel`
  - **Status:** HEAVILY IMPORTED (`@/lib/siteCompiler/types` used in 15+ files)

**Decision:** These appear to be **different APIs serving different purposes**:
- `site-compiler`: Modern pipeline (NormalizedSite → SiteSchema)
- `siteCompiler`: Legacy pipeline (raw data → CompiledSiteModel)

**Action:** **DEFERRED** — Requires API analysis to determine if they can be unified without logic rewrites.

**Recommendation:** Document the relationship and plan future consolidation if appropriate.

---

### 6. Screen Tree Duplicates — PARTIAL OVERLAP
- **Authority:** `src/01_App/apps-tsx/tsx-screens/` (used by page.tsx routing)
- **Duplicate:** `src/01_App/screens/tsx-screens/` (subset, fewer files)

**Status:** Some files may be unique. Requires file-by-file audit.

**Action:** **DEFERRED** — Requires import analysis to identify which files are actually used.

**Recommendation:** Audit imports, archive unused files, keep unique files in canonical location.

---

## VERIFICATION RESULTS

### ✅ Single Sources of Truth Established

| Category | Authority Location | Status |
|----------|-------------------|--------|
| **ScreenRenderer** | `03_Runtime/runtime/screens/ScreenRenderer.tsx` | ✅ SINGLE |
| **safe-json-loader** | `03_Runtime/runtime/loaders/safe-json-loader.ts` | ✅ SINGLE |
| **screen-manifest.json** | `03_Runtime/runtime/registry/screen-manifest.json` | ✅ SINGLE |
| **Contracts** | `02_Contracts_Reports/contracts/` | ✅ SINGLE |

### ⚠️ Remaining Duplicates (Deferred)

| Category | Status | Reason |
|----------|--------|--------|
| **Site Compiler** | DEFERRED | Different APIs, requires analysis |
| **Screen Trees** | DEFERRED | Requires import audit |

---

## FILES ARCHIVED

All archived files moved to `src/08_Cleanup/legacy/`:

1. `safe-json-loader.ts` (from `01_App/screens/utils/`)
2. `screen-manifest.json` (from `01_App/screens/`)
3. `system-contracts-SystemContract.ts` (from `02_Contracts_Reports/system/contracts/`)
4. `behavior-contract-verbs.ts` (from `03_Runtime/behavior/`)

**Total:** 4 files archived

---

## FILES CONVERTED TO RE-EXPORTS

1. `src/01_App/screens/core/ScreenRenderer.tsx` → Re-exports from `@/runtime/screens/ScreenRenderer`

**Total:** 1 file converted

---

## RISKY COLLISIONS FOUND

**None** — All changes were safe re-exports or archiving of unused files.

---

## NEXT STEPS (Optional)

1. **Site Compiler Analysis:** Determine if `site-compiler` and `siteCompiler` can be unified
2. **Screen Tree Audit:** Identify which files in `screens/tsx-screens/` are actually imported
3. **Import Updates:** Update any remaining references to archived files (if any)

---

## COMPLIANCE CHECKLIST

- ✅ NO logic rewrites
- ✅ NO behavior changes
- ✅ NO contract edits
- ✅ NO blueprint compiler changes
- ✅ NO atom/molecule renames
- ✅ Structure cleanup only
- ✅ Files archived (not deleted)
- ✅ Re-exports maintain compatibility

---

**Cleanup Complete:** Basic structure stabilization achieved for clear duplicates.  
**Deferred Items:** Require deeper analysis to avoid logic changes.
