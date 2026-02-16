# Folder-by-Folder Cleanup Plan: Removing Glue and Duplication

**Purpose:** Systematic removal of glue patterns (re-exports, duplicates, thin adapters) across the seven (eight) top-level sections to establish clear authority boundaries and single sources of truth.

**Status:** Planning / Execution Guide  
**Last Updated:** 2026-02-08

---

## How to Use This Plan

1. **Assess:** For each folder, identify what is "authority" (single source of truth) vs "glue" (re-exports, thin adapters, duplicates).
2. **Refactor:** Collapse glue into the authority surface so callers import from one place; then delete or archive the glue.
3. **Order:** Execute in sequence: **02** → **01** → **03** → **04** → **05** → **06** → **07** → **08** (02 and 01 first for maximum clarity; 08 last as archive sink).

---

## Execution Order Summary

| Priority | Folder | Impact | Risk | Estimated Effort |
|----------|--------|--------|------|------------------|
| **1** | **02_Contracts_Reports** | High clarity | Low | 30 min |
| **2** | **01_App** | High clarity | Medium | 2-3 hours |
| **3** | **03_Runtime** | Medium | Low | 1 hour |
| **4** | **04_Presentation** | Medium | Medium | 2-3 hours |
| **5** | **05_Logic** | Medium | Low | 1-2 hours |
| **6** | **06_Data** | High clarity | Medium | 2-3 hours |
| **7** | **07_Dev_Tools** | Low | Low | 1 hour |
| **8** | **08_Cleanup** | Low | Low | 30 min |

---

## 01_App: Entry Point Cleanup

**Role:** Entry — screens, app definitions (Next `app/` stays at `src/app`).

### Glue / Duplication Identified

#### 1. Two Screen Trees (HIGH PRIORITY)
- **Location 1:** `src/01_App/apps-tsx/tsx-screens/`
- **Location 2:** `src/01_App/screens/tsx-screens/`
- **Issue:** Many duplicate screens (onboarding, flows-cleanup-CO, global-scans, sites/generated)
- **Action:** 
  - Choose canonical tree (recommend `apps-tsx/tsx-screens/` as it's more complete)
  - Make the other tree re-export from canonical, or move unique files and delete duplicate tree
  - Update all imports to point to canonical location

#### 2. Two ScreenRenderers (HIGH PRIORITY)
- **Location 1:** `src/01_App/screens/core/ScreenRenderer.tsx`
- **Location 2:** `src/03_Runtime/runtime/screens/ScreenRenderer.tsx`
- **Issue:** Identical implementations (verified: same interface, same logic)
- **Action:**
  - Keep `03_Runtime/runtime/screens/ScreenRenderer.tsx` as authority (runtime is the spine)
  - Make `01_App/screens/core/ScreenRenderer.tsx` a re-export: `export { default } from "@/runtime/screens/ScreenRenderer"`
  - Update tsconfig if needed to maintain `@/apps-tsx/core/*` → `screens/core/*` mapping
  - Verify all callers work with re-export

#### 3. Two safe-json-loaders (HIGH PRIORITY)
- **Location 1:** `src/01_App/screens/utils/safe-json-loader.ts`
- **Location 2:** `src/03_Runtime/runtime/loaders/safe-json-loader.ts`
- **Issue:** Same functionality, different relative paths to `apps-json`
- **Action:**
  - Keep `03_Runtime/runtime/loaders/safe-json-loader.ts` as authority
  - Make `01_App/screens/utils/safe-json-loader.ts` a re-export: `export * from "@/runtime/loaders/safe-json-loader"`
  - Update all imports to use `@/runtime/loaders/safe-json-loader` or keep re-export if alias is needed

#### 4. Two screen-manifest.json (MEDIUM PRIORITY)
- **Location 1:** `src/01_App/screens/screen-manifest.json`
- **Location 2:** `src/03_Runtime/runtime/registry/screen-manifest.json`
- **Issue:** tsconfig maps `@/runtime/registry/screen-manifest.json` → runtime version
- **Action:**
  - Keep `03_Runtime/runtime/registry/screen-manifest.json` as single source
  - Delete `01_App/screens/screen-manifest.json` or make it a symlink/copy (prefer delete)
  - Ensure all references use `@/runtime/registry/screen-manifest.json`

### Cleanup Steps

1. ✅ **Audit:** Find all imports of duplicate screen trees, ScreenRenderer, safe-json-loader, screen-manifest
2. ⬜ **Consolidate screen trees:** Choose canonical (`apps-tsx/tsx-screens/`), migrate unique files, delete duplicate tree
3. ⬜ **Collapse ScreenRenderer:** Re-export from runtime, test all callers
4. ⬜ **Collapse safe-json-loader:** Re-export from runtime, test all callers
5. ⬜ **Unify screen-manifest:** Delete 01_App version, update all references
6. ⬜ **Verify:** Run tests, check build, ensure no broken imports

### Acceptance Criteria

- [ ] Only one screen tree exists (or second is pure re-exports)
- [ ] Only one ScreenRenderer implementation (01_App re-exports from 03)
- [ ] Only one safe-json-loader implementation (01_App re-exports from 03)
- [ ] Only one screen-manifest.json (in 03_Runtime)
- [ ] All imports resolve correctly
- [ ] Build passes
- [ ] Tests pass

---

## 02_Contracts_Reports: Authority Cleanup

**Role:** Authority — contracts, system reports, docs, cursor plans, system.

### Glue / Duplication Identified

#### 1. SystemContract Re-export (HIGH PRIORITY)
- **Location:** `src/02_Contracts_Reports/system/contracts/SystemContract.ts`
- **Content:** `export * from "@/contracts/SystemContract"`
- **Issue:** Unnecessary re-export layer; contracts should be imported directly
- **Action:**
  - Delete `system/contracts/SystemContract.ts`
  - Find all imports from `@/system/contracts/SystemContract` or `system/contracts/SystemContract`
  - Update to `@/contracts/SystemContract` or `@/contracts`
  - Verify no broken imports

#### 2. contract-verbs Re-export in Runtime (HIGH PRIORITY)
- **Location:** `src/03_Runtime/behavior/contract-verbs.ts`
- **Content:** `export * from "@/contracts/contract-verbs"`
- **Issue:** Re-export in wrong folder (should be in 02, not 03)
- **Action:**
  - Delete `03_Runtime/behavior/contract-verbs.ts`
  - Find all imports from `@/behavior/contract-verbs` or `behavior/contract-verbs`
  - Update to `@/contracts/contract-verbs`
  - Verify no broken imports

### Cleanup Steps

1. ✅ **Audit:** Grep for imports of `system/contracts/SystemContract` and `behavior/contract-verbs`
2. ⬜ **Delete re-export files:** Remove both files
3. ⬜ **Update imports:** Change all callers to use `@/contracts/*` directly
4. ⬜ **Verify:** Build and tests pass

### Acceptance Criteria

- [ ] `system/contracts/SystemContract.ts` deleted
- [ ] `03_Runtime/behavior/contract-verbs.ts` deleted
- [ ] All imports use `@/contracts/SystemContract` and `@/contracts/contract-verbs`
- [ ] Build passes
- [ ] Tests pass

### Optional: Documentation

Add to `02_Contracts_Reports/docs/` or `cursor/`:
- Short "contract index" doc listing canonical contract files
- Note: "Do not create re-exports; import from `@/contracts/*` directly"

---

## 03_Runtime: Spine Cleanup

**Role:** Engine, behavior, state, runtime (spine: JSON → engines → state → layout → renderer).

### Glue / Duplication Identified

#### 1. behavior/contract-verbs.ts (ALREADY HANDLED IN 02)
- **Action:** Remove as part of 02 cleanup

#### 2. Runtime Becomes Single Home (AFTER 01 CLEANUP)
- **After 01 cleanup:** `03_Runtime` will be the single home for:
  - `ScreenRenderer` (authority)
  - `safe-json-loader` (authority)
  - `screen-manifest.json` (authority)
- **Action:** Document this authority in `02_Contracts_Reports/docs/` or system-architecture

#### 3. Engine Core vs Logic (LOW PRIORITY)
- **Issue:** Potential duplication of engine execution logic
- **Action:** 
  - Keep `engine/core` as the spine
  - Ensure `logic/engines` (05) registers and runs micro-engines
  - Document: "engine/core = spine; logic/engines = micro-engines"

### Cleanup Steps

1. ⬜ **Complete 01 cleanup first:** ScreenRenderer, loader, manifest authority established
2. ⬜ **Document authority:** Add to system-architecture docs that runtime is single home for screen loading/rendering
3. ⬜ **Verify engine boundaries:** Ensure no duplicate engine execution paths

### Acceptance Criteria

- [ ] Runtime is documented as single home for screen loading/rendering
- [ ] No duplicate engine execution paths
- [ ] Build and tests pass

---

## 04_Presentation: Layout & Components Cleanup

**Role:** Layout, components, UI, palettes, registry (what gets rendered).

### Glue / Duplication Identified

#### 1. Excessive Barrel Index Files (MEDIUM PRIORITY)
- **Issue:** Many barrel files (`layout/index.ts`, `layout-organ/index.ts`, `layout/page/index.ts`, `layout/component/index.ts`, `layout/resolver/index.ts`, `layout/compatibility/index.ts`, `components/atoms/index.ts`, `components/organs/index.ts`, `ui/molecules/cards/index.ts`, `lib-layout/index.ts`, etc.)
- **Action:**
  - Keep barrels only at clear API boundaries (e.g., `@/layout`, `@/components/atoms`, `@/components/molecules`)
  - Remove redundant barrels from subfolders
  - Have internals import by file path
  - Reduces churn when adding/removing files

#### 2. Duplicate Layout in 08_Cleanup (MEDIUM PRIORITY)
- **Location:** `src/08_Cleanup/0-core/layout/index.ts`
- **Issue:** Mirrors `04_Presentation/layout/index.ts` but points at old path `../lib/layout/`
- **Action:**
  - Option A: Delete `08_Cleanup/0-core/layout/index.ts` if no callers
  - Option B: Make it a one-line re-export: `export * from "@/layout"` with `@deprecated` comment
  - Grep for imports from `08_Cleanup/0-core/layout` and migrate to `@/layout`
  - Delete after migration complete

#### 3. Duplicate Site/Section Components (MEDIUM PRIORITY)
- **Issue:** Two section/site renderer families (e.g., `ProductGridSection` vs `ProductGrid`, `HeroSection` in multiple places)
- **Action:**
  - Audit: Find all site/section components
  - Choose one naming scheme (e.g., all "Section" or all "Renderer")
  - Consolidate into one subtree (e.g., `components/site/` or `siteRenderer/`)
  - Update all imports to use single location
  - Document: "Site UI building blocks live in `components/site/`"

### Cleanup Steps

1. ⬜ **Audit barrel files:** List all `index.ts` files, identify which are public API vs internal
2. ⬜ **Remove redundant barrels:** Keep only top-level public API barrels
3. ⬜ **Migrate 08_Cleanup layout:** Re-export or delete, update callers
4. ⬜ **Consolidate site components:** Unify naming and location
5. ⬜ **Verify:** Build and tests pass

### Acceptance Criteria

- [ ] Only necessary barrel files remain (public API boundaries)
- [ ] `08_Cleanup/0-core/layout` removed or deprecated re-export
- [ ] Site/section components unified in one subtree with consistent naming
- [ ] All imports resolve correctly
- [ ] Build passes
- [ ] Tests pass

---

## 05_Logic: Engines & Flows Cleanup

**Role:** Engines, flows, actions, products, runtime verbs.

### Glue / Duplication Identified

#### 1. calc-resolver (MEDIUM PRIORITY)
- **Location:** `src/05_Logic/logic/runtime/calc-resolver.ts`
- **Status:** Already documented as `@deprecated` and "optional; not on main JSON screen path"
- **Action:**
  - Option A: Remove if no callers (grep first)
  - Option B: Keep with clear documentation if used by flow/TSX integration
  - Ensure no main-path imports

#### 2. Engine/Action Registry Duplication (LOW PRIORITY)
- **Issue:** Ensure single engine registry, single action registry
- **Action:**
  - Verify: `logic/engines` is single engine registry
  - Verify: `logic/runtime/action-runner` or `logic/registries` is single action registry
  - Document: "One engine registry, one action registry"

#### 3. Duplicate Engines (LOW PRIORITY)
- **Issue:** If "onboarding-engines" or similar duplicates exist
- **Action:**
  - Find duplicates
  - Remove or merge into `logic/engines`
  - Update callers

#### 4. Barrel Files (OPTIONAL)
- **Issue:** `logic/products/index.ts` and `logic/extractors/index.ts` are re-exports
- **Action:** Keep as public API (fine) or collapse to direct imports (optional)

### Cleanup Steps

1. ⬜ **Audit calc-resolver:** Grep for imports, decide remove vs keep
2. ⬜ **Verify registries:** Ensure single engine/action registry
3. ⬜ **Find duplicate engines:** Search for duplicate engine folders
4. ⬜ **Clean up:** Remove calc-resolver if unused, remove duplicate engines
5. ⬜ **Verify:** Build and tests pass

### Acceptance Criteria

- [ ] calc-resolver removed or clearly documented as optional
- [ ] Single engine registry exists
- [ ] Single action registry exists
- [ ] No duplicate engine folders
- [ ] Build passes
- [ ] Tests pass

---

## 06_Data: Site Compiler & Content Cleanup

**Role:** Content, site pipeline, web2extractor.

### Glue / Duplication Identified

#### 1. Two Compiler Surfaces (HIGH PRIORITY)
- **Location 1:** `src/06_Data/site-compiler/` (compileSiteToSchema, normalizeSiteData, compileSiteToScreenModel)
- **Location 2:** `src/06_Data/siteCompiler/` (compileSite, normalize, types, loaders)
- **Issue:** 
  - tsconfig exposes both: `@/lib/site-compiler/*` and `@/lib/siteCompiler/*`
  - Code uses both (ScreenRenderer uses `siteCompiler` types; site-skin uses `site-compiler` normalize/compile)
- **Action:**
  - **Unify naming:** Choose one folder name (recommend `site-compiler` for consistency)
  - **Merge APIs:** Create single public API:
    - `normalizeSiteData` (from site-compiler)
    - `compileSiteToSchema` (from site-compiler)
    - `compileSiteToScreenModel` (from site-compiler)
    - `compileSite` (from siteCompiler) — keep or merge into compileSiteToSchema
    - Types from one module (prefer site-compiler types)
  - **Migration:**
    - Move or re-export from `siteCompiler` into `site-compiler`
    - Update tsconfig: remove `@/lib/siteCompiler/*`, keep only `@/lib/site-compiler/*`
    - Update all imports to use `@/lib/site-compiler/*`
    - Delete `siteCompiler` folder after migration
  - **Document:** "Site compilation API: `@/lib/site-compiler/*`"

#### 2. Content Naming Clarity (LOW PRIORITY)
- **Location 1:** `src/05_Logic/logic/content/` (content-map, content-resolver, flows)
- **Location 2:** `src/06_Data/content/` (sites, compiled, data.content.json)
- **Issue:** Both named "content" but different purposes
- **Action:**
  - Document: `05_Logic/logic/content` = content resolution/flows
  - Document: `06_Data/content` = raw and compiled content data
  - No merge needed; just clarify naming

#### 3. product-screen-adapter (OPTIONAL)
- **Location:** `src/06_Data/product-screen-adapter/`
- **Issue:** Thin adapter layer
- **Action:**
  - Option A: Keep as-is (thin adapter is fine)
  - Option B: Merge into `site-compiler` or `site-skin` API if it's just "compile product to screen"

### Cleanup Steps

1. ⬜ **Audit usage:** Grep for imports from both `site-compiler` and `siteCompiler`
2. ⬜ **Choose canonical:** Decide on `site-compiler` as single name
3. ⬜ **Merge APIs:** Consolidate functions/types into `site-compiler`
4. ⬜ **Update tsconfig:** Remove `siteCompiler` alias
5. ⬜ **Update imports:** Change all callers to `@/lib/site-compiler/*`
6. ⬜ **Delete old folder:** Remove `siteCompiler` after migration
7. ⬜ **Document:** Add to docs clarifying content vs content resolution
8. ⬜ **Verify:** Build and tests pass

### Acceptance Criteria

- [ ] Only `site-compiler` exists (or `siteCompiler` is pure re-export)
- [ ] Single public API for site compilation
- [ ] tsconfig has only `@/lib/site-compiler/*` alias
- [ ] All imports use `@/lib/site-compiler/*`
- [ ] Content naming documented (05 = resolution, 06 = data)
- [ ] Build passes
- [ ] Tests pass

---

## 07_Dev_Tools: Scripts & Diagnostics Cleanup

**Role:** Scripts, diagnostics, debug, config, styles, types, system-control, scans.

### Glue / Duplication Identified

#### 1. Diagnostics Surface Clarity (LOW PRIORITY)
- **Issue:** Multiple diagnostic/debug surfaces (engine-debug, engine-devtools, engine-diagnostics, runtime-diagnostics, devtools)
- **Action:**
  - Document: Create `diagnostics/README.md` mapping each subfolder to purpose:
    - `engine-debug` = engine pipeline trace
    - `engine-devtools` = engine devtools
    - `engine-diagnostics` = engine diagnostics
    - `runtime-diagnostics` = runtime trace
    - `devtools` = general devtools
  - No deletion needed; just document to prevent future duplication

#### 2. Scripts Discoverability (LOW PRIORITY)
- **Issue:** Many one-off scripts (websites, logic-compiler, system-report, etc.)
- **Action:**
  - Create `scripts/README.md` listing:
    - Script name
    - What it does
    - When to run it
  - Improves discoverability without deleting files

#### 3. Types Authority (MEDIUM PRIORITY)
- **Issue:** `site.types.ts`, `siteSchema.ts` in `07_Dev_Tools/types/` may duplicate `02_Contracts_Reports/contracts` or `06_Data/site-schema` types
- **Action:**
  - Audit: Compare types in `07_Dev_Tools/types/` with `02/contracts` and `06/site-schema`
  - If duplicates: Re-export from single place (e.g., `@/contracts` or `@/lib/site-schema`)
  - Document: "Site types live in `@/lib/site-schema` or `@/contracts`"

#### 4. diagnostics/index.ts (FINE)
- **Status:** Re-exports provider + runDiagnostics
- **Action:** Keep as public API (no change needed)

### Cleanup Steps

1. ⬜ **Create diagnostics README:** Map each diagnostic subfolder to purpose
2. ⬜ **Create scripts README:** List scripts and their purposes
3. ⬜ **Audit types:** Compare `07/types` with `02/contracts` and `06/site-schema`
4. ⬜ **Align types:** Re-export duplicates from single authority
5. ⬜ **Verify:** Build and tests pass

### Acceptance Criteria

- [ ] `diagnostics/README.md` documents each diagnostic surface
- [ ] `scripts/README.md` lists all scripts and purposes
- [ ] Site types have single authority (no duplicates)
- [ ] Build passes
- [ ] Tests pass

---

## 08_Cleanup: Archive Management

**Role:** Legacy, refactor docs, unused.

### Glue / Duplication Identified

#### 1. 0-core/layout (MEDIUM PRIORITY)
- **Location:** `src/08_Cleanup/0-core/layout/index.ts`
- **Issue:** Re-export or duplicate of `04_Presentation/layout`
- **Action:**
  - Grep for imports from `08_Cleanup/0-core/layout`
  - Migrate callers to `@/layout`
  - Delete `0-core/layout` folder

#### 2. 1-ui (LOW PRIORITY)
- **Location:** `src/08_Cleanup/1-ui/`
- **Issue:** Old screens/shared
- **Action:**
  - Grep for imports from `08_Cleanup/1-ui`
  - If no imports: Delete
  - If imports: Migrate to `01_App` or `04_Presentation`, then delete

#### 3. Archive Documentation (LOW PRIORITY)
- **Action:**
  - Create `08_Cleanup/README.md`: "Do not import from here for new features; this is archive only."
  - Prevents accidental imports from legacy code

### Cleanup Steps

1. ⬜ **Audit 0-core/layout:** Find all imports, migrate to `@/layout`
2. ⬜ **Delete 0-core/layout:** After migration complete
3. ⬜ **Audit 1-ui:** Find all imports, migrate or delete
4. ⬜ **Create README:** Document archive-only status
5. ⬜ **Verify:** Build and tests pass

### Acceptance Criteria

- [ ] `0-core/layout` removed (or no imports remain)
- [ ] `1-ui` removed or migrated
- [ ] `08_Cleanup/README.md` documents archive-only status
- [ ] Build passes
- [ ] Tests pass

---

## Summary: Glue Removal Checklist

| Folder | Glue Removed | Status |
|--------|--------------|--------|
| **01_App** | One screen tree; one ScreenRenderer (re-export); one safe-json-loader (re-export); one screen-manifest | ⬜ |
| **02** | Delete `system/contracts/SystemContract.ts`; delete `03_Runtime/behavior/contract-verbs.ts` | ⬜ |
| **03** | No new glue; becomes single home for screen loader + manifest + ScreenRenderer | ⬜ |
| **04** | Fewer barrels; remove/re-export `08/0-core/layout`; unify site/section components | ⬜ |
| **05** | Remove/merge calc-resolver; single engine/action registry; remove duplicate engines | ⬜ |
| **06** | Unify `site-compiler` vs `siteCompiler`; optional merge of product-screen-adapter | ⬜ |
| **07** | Document diagnostics and scripts; align site types with 02/06 | ⬜ |
| **08** | Remove `0-core` and `1-ui` after migration; document as archive-only | ⬜ |

---

## Execution Tracking

### Phase 1: Quick Wins (02 + 01)
- [ ] **02_Contracts_Reports:** Remove re-exports (30 min)
- [ ] **01_App:** Collapse ScreenRenderer, safe-json-loader, screen-manifest (2-3 hours)

### Phase 2: Core Cleanup (03 + 06)
- [ ] **03_Runtime:** Document authority (1 hour)
- [ ] **06_Data:** Unify site-compiler vs siteCompiler (2-3 hours)

### Phase 3: Presentation & Logic (04 + 05)
- [ ] **04_Presentation:** Barrel cleanup, site components (2-3 hours)
- [ ] **05_Logic:** calc-resolver, engine registry (1-2 hours)

### Phase 4: Documentation & Archive (07 + 08)
- [ ] **07_Dev_Tools:** Add READMEs, align types (1 hour)
- [ ] **08_Cleanup:** Remove 0-core/1-ui, add README (30 min)

---

## Related Documents

- `docs/FOLDER_REORGANIZATION_PLAN_01-08.md` — Original folder structure plan
- `src/08_Cleanup/refactor_ROUND_2/` — Resolver unification plans
- `src/08_Cleanup/refactor_ROUND_3/` — Additional refactor plans
- `src/refactor_MASTER_FULL_PLAN.md` — Master refactor plan

---

## Notes

- **Risk Mitigation:** Always grep for imports before deleting files
- **Testing:** Run build and tests after each folder cleanup
- **Documentation:** Update system-architecture docs as authority boundaries are established
- **Incremental:** Complete one folder fully before moving to the next
