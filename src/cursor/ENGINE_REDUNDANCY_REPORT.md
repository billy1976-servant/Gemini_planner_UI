# Engine Redundancy Report

**Scope:** `src/engine/`, `src/logic/engines/`  
**Purpose:** List entry files, importers, duplicates (ordering/routing), unreferenced engines, and safe merge candidates. No deletions.

---

## Active engines

| Entry file | Imported by | Role |
|------------|-------------|------|
| **engine/core/json-renderer.tsx** | app/page.tsx, apps-tsx json-skin, trial/premium-onboarding, engine-runner (unused), lib/site-skin/SiteSkin, engine/runners/engine-runner | JSON tree → React; uses Registry, definitions, layout-store, palette-store |
| **engine/core/registry.tsx** | engine/core/json-renderer (via Registry), diagnostics.provider (safeImport) | type → React component map |
| **engine/core/screen-loader.ts** | app/page (loadScreen), trial/premium-onboarding, app-loader, critical-path.smoke.test | Load JSON/TSX screen config |
| **engine/core/behavior-listener.ts** | app/layout (installBehaviorListener) | Behavior subscription |
| **engine/core/palette-store.ts** | json-renderer, layout.tsx, ScreenRenderer, palette-resolver, palette-resolve-token, lib/site-renderer/palette-bridge, GeneratedSiteViewer | Palette state |
| **engine/core/layout-store.ts** | app/page, layout.tsx, json-renderer, ScreenRenderer, GeneratedSiteViewer, lib/layout-dropdown, devtools/InteractionTracerPanel | Layout presets / section overrides |
| **engine/core/palette-resolver.ts** | json-renderer, compounds (12-molecules), layout/LayoutMoleculeRenderer, contracts/param-key-mapping.test | Resolve params from tokens |
| **engine/core/global-scan.engine.ts** | state/global-scan.state-bridge, scans/global-scans/global-scan.test | Global scan execution |
| **engine/schedulers/scan-scheduler.ts** | apps-tsx/tsx-screens/global-scans/ScanDashboard | Scan scheduling |
| **engine/site-runtime/GeneratedSiteViewer.tsx** | apps-tsx SiteGeneratedScreen, SiteViewerScreen, template_SiteGeneratedScreen | Site block rendering |
| **engine/onboarding/OnboardingFlowRenderer.tsx** | apps-tsx OnboardingGeneratedScreen, SiteOnboardingScreen, template_OnboardingGeneratedScreen | Onboarding flow UI |
| **engine/onboarding/IntegrationFlowEngine.tsx** | (see engine folder; may be re-export or alternate) | Flow integration |
| **engine/bridge/WebsiteBlockRenderer.tsx** | engine/onboarding/OnboardingFlowRenderer | Block-type rendering for onboarding |
| **logic/engines/json-skin.engine.tsx** | engine/core/json-renderer (JsonSkinEngine) | json-skin screen type rendering |
| **logic/engine-system/engine-contract.ts** | flow-loader, engine-viewer (apps-tsx, screens, logic/ui-bindings), universal-engine-adapter | Facade: applyEngine, getPresentation, getAvailableEngines |
| **logic/engine-system/engine-registry.ts** | engine-contract only | learning, calculator, abc, decision, summary, system7 (stub) |
| **logic/engines/flow-router.ts** | EducationCard (resolveNextStep), engine-explain | Step routing / next step |
| **logic/engines/Onboarding-flow-router.tsx** | resolve-onboarding.action, landing-page-resolver | Onboarding resolution from answers |
| **logic/engines/25x.engine.ts** | action-registry (run25X), Onboarding-flow-router (logic/orchestration and logic/engines), 25x-Onboarding.Test | 25x scan run |
| **logic/engines/calculator/calculator.engine.ts** | engine-registry, calculator.module | Calculator flow transform |
| **logic/engines/calculator/calculator.module.ts** | logic/engines/calculator (internal), logic/actions/run-calculator.action | runCalculators |
| **logic/engines/decision/decision.engine.ts** | engine-registry, hi-engine-runner (processDecisionState) | Decision aftermath |
| **logic/engines/summary/summary.engine.ts** | engine-registry | Summary aftermath |
| **logic/engines/learning.engine.ts** | engine-registry (learningEngine, EngineFlow type) | Learning execution engine |
| **logic/engines/abc.engine.ts** | engine-registry | ABC execution engine |
| **logic/engines/post-processing/hi-engine-runner.ts** | EducationCard (runHIEngines) | Post-processing: calculator, comparison, decision, shared |
| **logic/engines/shared/engine-selector.ts** | FlowRenderer, engine-viewer, hi-engine-runner (selectExecutionEngine) | Execution engine selection |
| **logic/engines/presentation-types.ts** | OnboardingFlowRenderer, IntegrationFlowEngine, engine-viewer, EducationCard | PresentationModel type |
| **logic/engines/next-step-reason.ts** | engine-viewer | Next step reason formatting |
| **logic/engines/comparison/value-translation.engine.ts** | value-comparison.engine, proof-runs, value-translation-adapter, logic/value (value-annotation, validation-guardrails) | Value translation |
| **logic/engines/comparison/value-comparison.engine.ts** | proof-runs, value-translation-adapter usage path | Product comparison |
| **logic/engines/comparison/value-dimensions.ts** | proof-runs, value-translation-adapter | Default dimensions |
| **logic/engines/calculator/calcs/product-calculator.ts** | ProductCalculatorCard, ExportButton | Product cost calculation |
| **engine/system7/system7-router.ts** | universal-engine-adapter (System7Router.route), system7.entry.ts, system7.tsx | System7 channel routing |
| **engine/system7/system7.entry.ts** | (entry; may be called from adapter) | System7 entry |

---

## Dormant engines

| Entry file | Evidence |
|------------|----------|
| **engine/runners/engine-runner.tsx** | No static imports. Only comment in app-loader ("engine-runner listens for this") and SRC_EXPORT.json. Documented DEAD/PARTIAL (event-only, not mounted). |
| **engine/loaders/theme-loader.ts** | No imports from @/engine/loaders/theme-loader. ui-loader and ux-loader are used elsewhere; theme-loader has zero references. |
| **engine/loaders/ui-loader.ts** | Referenced in reachability as "First break" (disconnected from seed). Confirm if any dynamic or build use. |
| **engine/loaders/ux-loader.ts** | Same as ui-loader. |

---

## Overlapping engines

- **Routing / ordering:**
  - **flow-router.ts** (resolveNextStep) — step routing for education flow.
  - **Onboarding-flow-router.tsx** — resolves onboarding from answers; uses run25X.
  - **logic/orchestration/Onboarding-flow-router.tsx** — duplicate name; also imports 25x.engine. Two files with same name in logic/engines and logic/orchestration.
- **Execution vs aftermath:** engine-registry clearly separates EXECUTION_ENGINE_REGISTRY (learning, calculator, abc) and AFTERMATH_PROCESSOR_REGISTRY (decision, summary). No duplicate "ordering" logic; flow-router and engine-selector drive which engine runs.
- **system7:** Registered as stub in engine-registry (identity transform); real routing in engine/system7/system7-router. Overlap is intentional (registry exposes id "system7"; implementation in system7).

---

## Safe candidates for merge (NOT delete)

- **Onboarding-flow-router (logic/engines vs logic/orchestration):** Two files with same name; one in logic/engines, one in logic/orchestration. Safe to merge into a single module and re-export from one place after verifying call sites (resolve-onboarding.action, landing-page-resolver).
- **Value comparison + value translation:** Already used together (proof-runs, adapters, hi-engine-runner). Could be exposed as a single "comparison" facade that re-exports translateValue, compareProducts, getDefaultActiveDimensions without changing behavior.
- **Aftermath processors (decision, summary):** Already in AFTERMATH_PROCESSOR_REGISTRY; direct use of processDecisionState in hi-engine-runner. No structural merge needed; optional: single "aftermath" entry that delegates by id.

---

## Summary

- **Active:** Core (json-renderer, registry, screen-loader, palette, layout, behavior, global-scan, scan-scheduler), site-runtime, onboarding, bridge, logic/engines (json-skin, flow-router, Onboarding-flow-router, 25x, calculator, decision, summary, learning, abc, hi-engine-runner, engine-selector, comparison, product-calculator), engine-system (engine-contract, engine-registry), system7 (router, entry).
- **Dormant:** engine-runner.tsx (no imports), theme-loader (no references). ui-loader/ux-loader: confirm usage.
- **Overlapping:** Two Onboarding-flow-router files (logic/engines + logic/orchestration); value-comparison/value-translation used together.
- **Merge candidates:** Consolidate Onboarding-flow-router to one module; optional comparison facade; no deletions.
