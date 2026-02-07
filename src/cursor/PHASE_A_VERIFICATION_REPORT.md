# Phase A Verification Report — Engine Surface Unification

**Date:** Phase A from FULL_ENGINE_JSON_UNIFICATION_MASTER_PLAN.md  
**Scope:** Migrate flow-loader.ts to engine-contract; remove dynamic engine-registry imports.

---

## 1. Changes Made

### 1.1 flow-loader.ts ([src/logic/flows/flow-loader.ts](src/logic/flows/flow-loader.ts))

- **Added** static import at top of file (after flow JSON imports):
  ```ts
  import { applyEngine } from "@/logic/engine-system/engine-contract";
  ```
- **Removed** all four dynamic imports of engine-registry:
  - Previously: `const { applyEngine } = await import("../engine-system/engine-registry");` before each `applyEngine(...)` call.
  - Now: `applyEngine` is used directly from the static import.
- **Locations updated (runtime behavior unchanged):**
  1. Registered flow branch (FLOWS[flowId]): `applyEngine(registeredFlow, effectiveEngineId as any)`
  2. Override flow branch (overrideFlowMap[flowId]): `applyEngine(overrideFlow, effectiveEngineId as any)`
  3. Base cache branch (flowCache[flowId]): `applyEngine(baseFlow, effectiveEngineId as any)`
  4. Screen-specific flow branch (after fetch): `applyEngine(flow, effectiveEngineId as any)`

No other files were modified. Layout, state, renderer, and behavior-listener were not touched.

---

## 2. Verification Results

### 2.1 All engine entry points now go through engine-contract

| Entry point | Module | Import / usage | Status |
|-------------|--------|----------------|--------|
| Trunk action | action-runner.ts | getActionHandler from engine-contract | OK (already migrated) |
| Flow (applyEngine) | flow-loader.ts | applyEngine from engine-contract | OK (Phase A) |
| Flow (getPresentation) | IntegrationFlowEngine.tsx, OnboardingFlowRenderer.tsx, FlowRenderer.tsx | getPresentation from engine-contract | OK (already migrated) |
| Flow (applyEngine, getPresentation, etc.) | engine-viewer.tsx (screens + logic/ui-bindings) | getAvailableEngines, applyEngine, getPresentation, types from engine-contract | OK (already migrated) |
| Type only | engine-selector.ts | ExecutionEngineId from engine-contract | OK (already migrated) |

All runtime engine invocation (getActionHandler, applyEngine, getPresentation, getExecutionEngine, etc.) is now sourced from `@/logic/engine-system/engine-contract`. No caller imports action-registry or engine-registry directly for execution.

### 2.2 No direct engine-registry imports remain outside engine-contract

Grep for `engine-registry` and `from.*engine-registry` in `*.ts` and `*.tsx`:

| File | Finding | Status |
|------|--------|--------|
| logic/engine-system/engine-contract.ts | Re-exports from "./engine-registry" (facade implementation) | Expected — only place that may import engine-registry |
| logic/controllers/control-registry.ts | Comment: "Follow same pattern as engine-registry" | Comment only; no import |

**Conclusion:** No code outside engine-contract imports engine-registry. The only import of engine-registry is inside engine-contract.ts, which is the intended single public engine entry.

### 2.3 Runtime call chain is unchanged

- **Flow path (loadFlow):**
  - Caller → `loadFlow(flowId, engineId?, screenParam?)` → (same branches as before) → `applyEngine(flow, effectiveEngineId)`.
  - **Before:** `applyEngine` was obtained via `await import("../engine-system/engine-registry")` and is the same function from engine-registry.
  - **After:** `applyEngine` is obtained from engine-contract, which re-exports the same function from engine-registry.
  - **Result:** Same function, same arguments, same return value and error handling. No behavior change.

- **Trunk path:** Unchanged (behavior-listener → interpretRuntimeVerb → action-runner → getActionHandler(engine-contract) → handlers).

- **Other flow UI:** Unchanged (engine-viewer, FlowRenderer, etc. already used engine-contract).

---

## 3. Lint and Build

- **Linter:** No errors reported for flow-loader.ts.
- **Build:** Not run in this pass; existing project tsconfig and build pipeline are unchanged. Type-check: applyEngine signature is unchanged (EducationFlow × EngineId → EducationFlow).

---

## 4. Summary

| Criterion | Result |
|-----------|--------|
| All engine entry points go through engine-contract | Yes |
| No direct engine-registry imports outside engine-contract | Yes |
| Runtime call chain unchanged | Yes |
| Layout / state / renderer / behavior-listener untouched | Yes |

Phase A is complete. The system now has a single engine entry module (engine-contract); flow-loader uses it with a static import and identical runtime behavior.
