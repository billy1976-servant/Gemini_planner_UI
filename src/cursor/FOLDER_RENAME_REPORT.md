# FOLDER RENAME REPORT — Global Safe Rename (No Breakage)

**Objective:** Rename structural app folders so naming reflects architecture without breaking runtime.

**Target structure:**
- `src/apps-offline/` → `src/apps-json/` (JSON app definitions)
- `src/screens/` → `src/apps-tsx/` (TSX app screens)

---

## 1. Folder renames (MUST BE DONE MANUALLY)

Automated rename failed (access denied — folder likely in use by IDE or another process).

**You must perform these renames manually:**

| From | To |
|------|-----|
| `src/apps-offline` | `src/apps-json` |
| `src/screens` | `src/apps-tsx` |

**Suggested steps:**
1. Close the IDE or any process using these folders.
2. From repo root:
   - **Windows (PowerShell):** `Rename-Item -Path "src\apps-offline" -NewName "apps-json"; Rename-Item -Path "src\screens" -NewName "apps-tsx"`
   - **Git (if index allows):** `git mv src/apps-offline src/apps-json` then `git mv src/screens src/apps-tsx`
3. Reopen the project. All code references below are already updated to the new names.

Until these renames are done, **build and runtime will fail** (paths in code point to `apps-json` and `apps-tsx`).

---

## 2. Path aliases updated

| Location | Change |
|----------|--------|
| `tsconfig.json` | `"@/screens/*": ["src/screens/*"]` → `"@/apps-tsx/*": ["src/apps-tsx/*"]`; added `"@/apps-json/*": ["src/apps-json/*"]` |
| `tsconfig.json` | `exclude` `src/screens/tsx-screens/generated/**/*` → `src/apps-tsx/tsx-screens/generated/**/*` |

---

## 3. Path replacements (code & config)

### 3.1 `apps-offline` → `apps-json`

| File | Replacement |
|------|-------------|
| `src/app/api/screens/[...path]/route.ts` | `SCREENS_ROOT`: `"apps-offline"` → `"apps-json"` |
| `src/app/api/screens/route.ts` | `BASE`, `TSX_BASE` comment path |
| `src/app/api/sites/[domain]/route.ts` | `SITES_ROOT` and fallback comment |
| `src/contracts/load-app-offline-json.node.ts` | Comment + `ROOT` path |
| `src/engine/core/safe-json-import.ts` | JSDoc + `normalized` regex replacements |
| `src/engine/core/screen-loader.ts` | Path normalizer regex |
| `src/engine/core/safe-screen-registry.ts` | JSDoc comment |
| `src/screens/utils/safe-json-loader.ts` | `require.context("../../apps-json/apps")` + JSDoc |
| `src/screens/tsx-screens/diagnostics/ScreenDiagnostics.tsx` | UI suggested path string |
| `src/scripts/blueprint.ts` | `APPS_ROOT` |
| `src/scripts/contract-report.ts` | Comment + `ROOT` |
| `src/scripts/contract-validate.ts` | `ROOT` |
| `src/scripts/compile-product-screen.ts` | Comment + `APPS_WEBSITES` |
| `src/scripts/pipeline-proof.ts` | `DIAG_DIR` path segments |
| `src/lib/screens/compose-offline-screen.ts` | JSDoc |
| `src/lib/site-skin/compileSkinFromBlueprint.ts` | Default `domain` value |
| `src/scripts/system-report/ai-snapshot-pack.ts` | Role description string |
| `src/system-reports/summaries/AI_SNAPSHOT_PACK.json` | Role + path |
| `src/map (old)/engine/map-engine.ts` | `APPS_ROOT` |
| `src/map (old)/engine/content-engine.ts` | `APPS_ROOT` |

### 3.2 `screens` → `apps-tsx` (path roots and aliases)

| File | Replacement |
|------|-------------|
| `src/app/api/screens/[...path]/route.ts` | `TSX_ROOT`: `"screens"` → `"apps-tsx"` |
| `src/app/api/screens/route.ts` | `TSX_BASE` + comment |
| `src/app/page.tsx` | `require.context("@/apps-tsx")`, `import(\`@/apps-tsx/${normalized}\`)`, comment |
| `src/diagnostics/diagnostics.json` | `"src/screens"` → `"src/apps-tsx"` |
| `src/scripts/logic/compile.ts` | `GENERATED_ROOT` + error message path |
| `SRC_EXPORT.json` | `"./src/screens"` → `"./src/apps-tsx"` and listed paths |
| `src/screens/core/ScreenRenderer.tsx` | JSDoc + dynamic `import(\`@/apps-tsx/config/...\`)` |
| `src/screens/tsx-screens/sites/SiteIndex.tsx` | Display path string |
| `src/screens/tsx-screens/onboarding/engine-viewer.tsx` | Console log path |
| `src/screens/tsx-screens/global-scans/selectors/UseGlobalWindow.ts` | File path comment |
| `src/screens/tsx-screens/global-scans/charts/LineChart.tsx` | File path comment |
| `src/screens/tsx-screens/global-scans/types.ts` | File path comment |

### 3.3 Import path: `@/screens/` → `@/apps-tsx/`

| File | Imports updated |
|------|------------------|
| `src/screens/tsx-screens/onboarding/json-skin.tsx` | `@/apps-tsx/utils/safe-json-loader`, `@/apps-tsx/screen-manifest.json` |
| `src/logic/flows/flow-loader.ts` | `@/apps-tsx/tsx-screens/Gibson_Guitars/...` |
| `src/logic/flow-runtime/FlowRenderer.tsx` | `@/apps-tsx/tsx-screens/onboarding/cards/EducationCard` |
| `src/engine/onboarding/OnboardingFlowRenderer.tsx` | CalculatorCard, EducationCard, SummaryCard |
| `src/engine/onboarding/IntegrationFlowEngine.tsx` | Same |
| `src/screens/tsx-screens/onboarding/integration-flow-engine.tsx` | Same |
| `src/screens/tsx-screens/onboarding/legacy/IntegrationFlowEngine.legacy.tsx` | Same |
| `src/screens/tsx-screens/sites/generated/Gibson_Guitars/GibsonSiteScreen.tsx` | `@/apps-tsx/core/ScreenRenderer` |
| `src/screens/tsx-screens/onboarding/premium-onboarding-tsx.tsx` | calculators + Education-flow |
| `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-2.tsx` | Same |
| `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-3.tsx` | Same |
| `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-5.tsx` | Same |
| `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-7.tsx` | Same |
| `src/screens/tsx-screens/flows-cleanup-CO/premiumOnboarding-TSX2.tsx` | calculator, education |
| `src/screens/tsx-screens/calculators/pricing-jump-flow.tsx` | calculator-1 |

---

## 4. Files updated (summary)

- **Config:** `tsconfig.json`, `src/diagnostics/diagnostics.json`, `SRC_EXPORT.json`
- **App/API:** `src/app/page.tsx`, `src/app/api/screens/[...path]/route.ts`, `src/app/api/screens/route.ts`, `src/app/api/sites/[domain]/route.ts`
- **Engine:** `src/engine/core/screen-loader.ts`, `src/engine/core/safe-json-import.ts`, `src/engine/core/safe-screen-registry.ts`, `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/engine/onboarding/IntegrationFlowEngine.tsx`
- **Screens (now apps-tsx):** multiple under `src/screens/` (json-skin, diagnostics, core, onboarding, sites, flows-cleanup-CO, calculators, global-scans)
- **Logic:** `src/logic/flows/flow-loader.ts`, `src/logic/flow-runtime/FlowRenderer.tsx`
- **Lib:** `src/lib/screens/compose-offline-screen.ts`, `src/lib/site-skin/compileSkinFromBlueprint.ts`
- **Contracts:** `src/contracts/load-app-offline-json.node.ts`
- **Scripts:** `src/scripts/blueprint.ts`, `src/scripts/contract-report.ts`, `src/scripts/contract-validate.ts`, `src/scripts/compile-product-screen.ts`, `src/scripts/pipeline-proof.ts`, `src/scripts/logic/compile.ts`, `src/scripts/system-report/ai-snapshot-pack.ts`
- **Reports:** `src/system-reports/summaries/AI_SNAPSHOT_PACK.json`
- **Legacy:** `src/map (old)/engine/map-engine.ts`, `src/map (old)/engine/content-engine.ts`

---

## 5. Unresolved references

- **None** in source or config under `src/` for runtime path resolution. All references to `apps-offline` and `screens` (as folder names) have been updated to `apps-json` and `apps-tsx`.
- **Documentation** under `src/docs/`, `ENGINE_INDEX.md`, `RUNTIME_PIPELINE.md`, `DOCS_INDEX.md`, `GAP_REPORT.md`, `REPO_TREE.md`, and other `.md` files still mention `apps-offline` and `src/screens` in prose. They were **not** changed per “NO layout changes; ONLY renaming + path alignment.” You may update docs in a follow-up pass if desired.

---

## 6. Build status guess

- **After you rename the two folders** (`apps-offline` → `apps-json`, `screens` → `apps-tsx`):
  - **TypeScript:** Should resolve; path aliases and imports are aligned with the new structure.
  - **Next.js:** Should resolve; API routes and `page.tsx` use the new paths and aliases.
  - **JSON loaders:** `safe-json-loader` and API route read from `apps-json/apps`; `require.context` is relative and will resolve once the folder is named `apps-json`.
  - **TSX loaders:** `page.tsx` and API route use `apps-tsx`; dynamic `import(\`@/apps-tsx/...\`)` will resolve once the folder is named `apps-tsx`.
- **Before renaming:** Build and runtime will fail with “module not found” or “path not found” because the directories are still named `apps-offline` and `screens`.

---

## 7. Constraints respected

- No runtime logic or behavior changes.
- No layout, engine, or registry logic edits beyond path strings.
- No file deletions; only renames (to be done manually) and path/alias updates.
- No moves other than the two folder renames (and their contents).
- Git history: use `git mv` when you perform the renames so history is preserved.
