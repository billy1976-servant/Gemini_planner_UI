# TSX Relocation Applied Report

**Date:** 2025-02-07  
**Scope:** Implement relocation plan: extract non-screen responsibilities from `src/apps-tsx` into `src/runtime` and `src/ui`. Structure change and import updates only; no behavior or logic changes.

---

## 1. Preconditions (Step 0)

- **src/apps-tsx:** Present.
- **src/apps-json:** Present.
- **tsconfig.json:** Already had `"@/apps-tsx": ["src/apps-tsx"]` and `"@/apps-tsx/*": ["src/apps-tsx/*"]`. No change needed.
- **next.config.js:** No override of `@/apps-tsx`; comment confirms resolution via tsconfig. No change.

---

## 2. Target Folders Created (Step 1)

Created (with files or .gitkeep where needed):

- `src/runtime/`
- `src/runtime/screens/`
- `src/runtime/loaders/`
- `src/runtime/registry/`
- `src/runtime/diagnostics/` (`.gitkeep` only)
- `src/ui/` (already existed)
- `src/ui/atoms/` (`.gitkeep` only)
- `src/ui/molecules/` (already existed; added `cards/`, `charts/`, `panels/`)
- `src/ui/compounds/` (created with `skins/`)

---

## 3. Path Aliases (Step 6)

**tsconfig.json** — added:

- `"@/runtime": ["src/runtime"]`
- `"@/runtime/*": ["src/runtime/*"]`

`"@/ui/*": ["src/ui/*"]` was already present. No aliases removed.

---

## 4. Files Moved (From → To)

### 4.1 Runtime (screen loading / render infra + registry)

| From | To |
|------|----|
| `src/apps-tsx/core/ScreenRenderer.tsx` | `src/runtime/screens/ScreenRenderer.tsx` |
| `src/apps-tsx/utils/safe-json-loader.ts` | `src/runtime/loaders/safe-json-loader.ts` |
| `src/apps-tsx/screen-manifest.json` | `src/runtime/registry/screen-manifest.json` |

**Import updates:**

- `src/apps-tsx/tsx-screens/sites/generated/Gibson_Guitars/GibsonSiteScreen.tsx`: `@/apps-tsx/core/ScreenRenderer` → `@/runtime/screens/ScreenRenderer`
- `src/apps-tsx/tsx-screens/onboarding/json-skin.tsx`: `@/apps-tsx/utils/safe-json-loader` → `@/runtime/loaders/safe-json-loader`; `@/apps-tsx/screen-manifest.json` → `@/runtime/registry/screen-manifest.json`

**Loader note:** `safe-json-loader.ts` uses `require.context("../../apps-json/apps", ...)`. From `src/runtime/loaders/`, `../../apps-json` correctly resolves to `src/apps-json`. No path change needed.

### 4.2 UI — Cards (onboarding cards)

| From | To |
|------|----|
| `src/apps-tsx/tsx-screens/onboarding/cards/CalculatorCard.tsx` | `src/ui/molecules/cards/CalculatorCard.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/EducationCard.tsx` | `src/ui/molecules/cards/EducationCard.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/SummaryCard.tsx` | `src/ui/molecules/cards/SummaryCard.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/ProductCard.tsx` | `src/ui/molecules/cards/ProductCard.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/ComparisonCard.tsx` | `src/ui/molecules/cards/ComparisonCard.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/ProductCalculatorCard.tsx` | `src/ui/molecules/cards/ProductCalculatorCard.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/ExportButton.tsx` | `src/ui/molecules/cards/ExportButton.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/ExternalReferenceCard.tsx` | `src/ui/molecules/cards/ExternalReferenceCard.tsx` |
| `src/apps-tsx/tsx-screens/onboarding/cards/index.ts` | `src/ui/molecules/cards/index.ts` |

**Barrel:** `index.ts` was updated to export `CalculatorCard` and `SummaryCard` in addition to existing exports.

**Import updates:**

- `src/apps-tsx/tsx-screens/onboarding/integration-flow-engine.tsx`: `@/apps-tsx/tsx-screens/onboarding/cards/*` → `@/ui/molecules/cards`
- `src/apps-tsx/tsx-screens/onboarding/legacy/IntegrationFlowEngine.legacy.tsx`: same
- `src/apps-tsx/tsx-screens/onboarding/engine-viewer.tsx`: `./cards/EducationCard` → `@/ui/molecules/cards`
- `src/engine/onboarding/IntegrationFlowEngine.tsx`: `@/apps-tsx/tsx-screens/onboarding/cards/*` → `@/ui/molecules/cards`
- `src/engine/onboarding/OnboardingFlowRenderer.tsx`: same
- `src/logic/flow-runtime/FlowRenderer.tsx`: `@/apps-tsx/tsx-screens/onboarding/cards/EducationCard` → `@/ui/molecules/cards`

### 4.3 UI — Charts and panels (global-scans)

| From | To |
|------|----|
| `src/apps-tsx/tsx-screens/global-scans/charts/LineChart.tsx` | `src/ui/molecules/charts/LineChart.tsx` |
| `src/apps-tsx/tsx-screens/global-scans/panels/MomentumTimeline.tsx` | `src/ui/molecules/panels/MomentumTimeline.tsx` |
| `src/apps-tsx/tsx-screens/global-scans/panels/ScoreTimeline.tsx` | `src/ui/molecules/panels/ScoreTimeline.tsx` |
| `src/apps-tsx/tsx-screens/global-scans/panels/SnapshotTable.tsx` | `src/ui/molecules/panels/SnapshotTable.tsx` |
| `src/apps-tsx/tsx-screens/global-scans/panels/SourceBreakdown.tsx` | `src/ui/molecules/panels/SourceBreakdown.tsx` |
| `src/apps-tsx/tsx-screens/global-scans/panels/StabilityMatrix.tsx` | `src/ui/molecules/panels/StabilityMatrix.tsx` |
| `src/apps-tsx/tsx-screens/global-scans/panels/SystemDirective.tsx` | `src/ui/molecules/panels/SystemDirective.tsx` |

**New file:** `src/ui/molecules/panels/scan-types.ts` — minimal `Scan` type for `SnapshotTable` (no dependency on `apps-tsx`).

**Import updates inside moved panels:**

- `MomentumTimeline.tsx`, `ScoreTimeline.tsx`: `../charts/LineChart` → `@/ui/molecules/charts/LineChart`
- `SnapshotTable.tsx`: `../types` → `./scan-types` (local type module)

### 4.4 UI — Skins

| From | To |
|------|----|
| `src/apps-tsx/tsx-screens/skins/beautiful-skin.tsx` | `src/ui/compounds/skins/beautiful-skin.tsx` |
| `src/apps-tsx/tsx-screens/skins/json-skin.tsx` | `src/ui/compounds/skins/json-skin.tsx` |

No external importers of these skins were found; no import updates required.

---

## 5. Step 5 — Schema / layout under apps-tsx

- No `*.schema.json` or `schema/*` under `src/apps-tsx`. Nothing moved.

---

## 6. Build Status (Step 7)

- **Relocated files:** No linter errors on checked runtime and UI files and updated screen/engine/logic imports.
- **Full repo:**
  - `npx tsc --noEmit`: Fails on pre-existing errors in `src/engine/system7/definitions/*.ts` (syntax/parsing), unrelated to this relocation.
  - `npx next build`: Fails on pre-existing type error in `src/app/api/google-ads/client.ts` (`access_token` vs `CustomerOptions`), unrelated to this relocation.

Relocation itself did not introduce new build or type errors.

---

## 7. Summary

- **Runtime:** Screen renderer, JSON screen loader, and screen manifest live under `src/runtime` (screens, loaders, registry). All references updated to `@/runtime/...`.
- **UI:** Onboarding cards, global-scan charts/panels, and reusable skins live under `src/ui` (molecules/cards, molecules/charts, molecules/panels, compounds/skins). Cards and engine/logic imports updated to `@/ui/molecules/cards`; charts/panels use `@/ui/molecules/...`.
- **apps-tsx:** Contains only screens and screen-only assets (tsx-screens, generated-websites, root screens). No remaining `core/`, `utils/`, or top-level `screen-manifest.json`; no `cards/`, `charts/`, `panels/`, or `skins/` under tsx-screens.
- **Aliases:** `@/runtime` and `@/runtime/*` added; `@/ui/*` unchanged.

---

## 8. Not changed (per task)

- No moves from or into `src/components`.
- `src/engine` and `src/logic` unchanged except import path updates to cards.
- `src/apps-json` unchanged.
- No new architectural categories beyond the audit; only extraction from apps-tsx into runtime and ui.
