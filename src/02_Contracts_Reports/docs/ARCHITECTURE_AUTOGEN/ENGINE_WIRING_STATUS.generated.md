# Engine Wiring Status (Generated)

Enumerates engines under `src/logic/engines/**` and engine-like modules (layout intelligence, decision, skin). For each: purpose, entry call sites, and status: **ACTIVE** (reachable + invoked), **DORMANT** (reachable but never invoked on main path), **DISCONNECTED** (unreachable from seed).

**Reachability seed:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/engine/core/json-renderer.tsx`, `src/engine/core/behavior-listener.ts`, `src/engine/core/screen-loader.ts`, `src/state/state-store.ts`, `src/layout/index.ts`, `src/logic/runtime/runtime-verb-interpreter.ts`.

**Generated:** See [REACHABILITY_REPORT.generated.md](../SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md) for module-level reachability.

---

## Summary

| Status       | Count | Meaning |
|-------------|-------|---------|
| ACTIVE      | 12    | Reachable and invoked on main JSON/behavior path |
| DORMANT     | 0     | Reachable but not invoked on main path |
| DISCONNECTED| 20+   | Unreachable from seed (TSX/flow-only or script-only) |

---

## ACTIVE — Reachable and invoked

### 1. JsonSkinEngine (`src/logic/engines/json-skin.engine.tsx`)

- **Purpose:** Renders `type === "json-skin"` nodes (e.g. landing page blocks).
- **Entry call site:** `src/engine/core/json-renderer.tsx` → `renderNode()` → `<JsonSkinEngine screen={node} />` (when `node.type === "json-skin"`).
- **Call chain:** `page.tsx` → `JsonRenderer` → `renderNode` → `JsonSkinEngine` (file refs: `json-renderer.tsx` ~L23–24, ~159–160).

---

### 2. Onboarding-flow-router (`src/logic/engines/Onboarding-flow-router.tsx`)

- **Purpose:** Resolves onboarding flow from answers; used for landing page content/flow.
- **Entry call site:** `src/logic/runtime/landing-page-resolver.ts` → `resolveOnboardingFromAnswers(answers)`.
- **Call chain:** `page.tsx` → `resolveLandingPage()` → `landing-page-resolver.ts` → `Onboarding-flow-router` (landing-page-resolver.ts ~64–65).

---

### 3. engine-bridge (`src/logic/runtime/engine-bridge.ts`)

- **Purpose:** Read/write/subscribe engine state (calculator input, etc.).
- **Entry call sites:** `landing-page-resolver.ts` (`readEngineState`), `behavior-listener` path via interaction-controller; json-skin and flow UIs.
- **Call chain:** `landing-page-resolver.ts` → `readEngineState()`; `behavior-listener` → `interpretRuntimeVerb` → `runAction` → handlers that use `readEngineState`/`writeEngineState`.

---

### 4. action-runner (`src/logic/runtime/action-runner.ts`)

- **Purpose:** Routes actions to handlers from action-registry; preserves pipeline continuity.
- **Entry call site:** `src/engine/core/behavior-listener.ts` → `interpretRuntimeVerb` (required) → `runAction(action, state)`.
- **Call chain:** `layout.tsx` → `installBehaviorListener` → `behavior-listener.ts` → `runtime-verb-interpreter.ts` → `action-runner.ts` → `getActionHandler(name)` (action-runner.ts ~19–36).

---

### 5. action-registry (`src/logic/runtime/action-registry.ts`)

- **Purpose:** Maps action names to handlers (logic:runCalculator, logic:run25x, logic:resolveOnboarding).
- **Entry call site:** `src/logic/runtime/action-runner.ts` → `getActionHandler(action.name)`.
- **Call chain:** `action-runner.ts` → `getActionHandler` (action-registry.ts ~45–47).

---

### 6. 25x.engine (`src/logic/engines/25x.engine.ts`)

- **Purpose:** Handles `logic:run25x` action (25x flow execution).
- **Entry call site:** `src/logic/runtime/action-registry.ts` → `"logic:run25x": run25X`.
- **Call chain:** `behavior-listener` → `interpretRuntimeVerb` → `runAction` → `run25X` (25x.engine.ts ~16+).

---

### 7. resolve-onboarding.action (`src/logic/actions/resolve-onboarding.action.ts`)

- **Purpose:** Handles `logic:resolveOnboarding`; resolves onboarding from state.
- **Entry call site:** `src/logic/runtime/action-registry.ts` → `"logic:resolveOnboarding": resolveOnboardingAction`.
- **Call chain:** `action-runner` → `resolveOnboardingAction` (action-registry.ts ~38).

---

### 8. run-calculator.action (`src/logic/actions/run-calculator.action.ts`)

- **Purpose:** Handles `logic:runCalculator` action.
- **Entry call site:** `src/logic/runtime/action-registry.ts` → `"logic:runCalculator": runCalculator`.
- **Call chain:** `action-runner` → `runCalculator` (action-registry.ts ~30).

---

### 9. Layout resolver / compatibility (re-exported via `src/layout/index.ts`)

- **Purpose:** Resolve section/card layout IDs; evaluate compatibility (slots, requirements).
- **Entry call sites:** `src/engine/core/json-renderer.tsx` → `applyProfileToNode` → `getDefaultSectionLayoutId`, `evaluateCompatibility` from `@/layout`.
- **Call chain:** `json-renderer.tsx` → `applyProfileToNode` → `getDefaultSectionLayoutId` (layout-resolver.ts), `evaluateCompatibility` (compatibility-evaluator.ts). File refs: layout/resolver/layout-resolver.ts, layout/compatibility/compatibility-evaluator.ts.

---

### 10. content-resolver (`src/logic/content/content-resolver.ts`)

- **Purpose:** Resolves content (e.g. construction-cleanup) for landing page.
- **Entry call site:** `src/logic/runtime/landing-page-resolver.ts` → `resolveContent("construction-cleanup")`.
- **Call chain:** `landing-page-resolver.ts` → `resolveContent` (landing-page-resolver.ts ~66).

---

### 11. skinBindings.apply (`src/logic/bridges/skinBindings.apply.ts`)

- **Purpose:** Applies skin bindings to document/screen.
- **Entry call site:** `src/app/page.tsx` → `applySkinBindings(document, ...)`.
- **Call chain:** `page.tsx` → `applySkinBindings` (page.tsx ~42–43).

---

### 12. runtime-verb-interpreter (`src/logic/runtime/runtime-verb-interpreter.ts`)

- **Purpose:** Normalizes and forwards verbs to action-runner; no decision/mutation.
- **Entry call site:** `src/engine/core/behavior-listener.ts` → `interpretRuntimeVerb(verb, getState())` (required dynamically).
- **Call chain:** `behavior-listener.ts` ~321 → `interpretRuntimeVerb` → `runAction` (runtime-verb-interpreter.ts ~23–45).

---

## DORMANT — Reachable but not invoked on main path

*(None in current seed-based run. All reachable engine-like modules on the main path are invoked.)*

---

## DISCONNECTED — Unreachable from seed

These are only reachable via TSX screens, API routes, or scripts (not via the eight seed entrypoints).

### logic/engines (execution + aftermath)

| Module | Purpose | Why disconnected |
|--------|---------|-------------------|
| `src/logic/engine-system/engine-registry.ts` | getEngine, applyEngine, getPresentation; execution + aftermath registry | Only imported by flow-loader, engine-viewer, FlowRenderer, OnboardingFlowRenderer — all unreachable from seed |
| `src/logic/engines/learning.engine.ts` | learningEngine, learningPresentation | Used by engine-registry; flow path not in seed |
| `src/logic/engines/calculator/calculator.engine.ts` | calculatorEngine, calculatorPresentation, runCalculators | Same |
| `src/logic/engines/abc.engine.ts` | abcEngine, abcPresentation | Same |
| `src/logic/engines/decision/decision.engine.ts` | decisionEngine, decisionPresentation, processDecisionState | Same |
| `src/logic/engines/summary/summary.engine.ts` | summaryEngine, summaryPresentation, processSummaryState | Same |
| `src/logic/engines/flow-router.ts` | resolveNextStep | Flow routing; used by flow-loader / flow UIs |
| `src/logic/engines/next-step-reason.ts` | createNextStepReason, formatNextStepReasonAsJSON | Used by flow/orchestration |
| `src/logic/engines/decision-engine.ts` | aggregateDecisionState | Decision aggregation; used by decision flow |
| `src/logic/engines/comparison/value-comparison.engine.ts` | compareProducts | Value comparison; no import from seed path |
| `src/logic/engines/comparison/value-translation.engine.ts` | translateValue | Value translation; no import from seed path |
| `src/logic/engines/comparison/value-dimensions.ts` | VALUE_DIMENSION_REGISTRY, getValueDimension | Dimension registry; comparison path |
| `src/logic/engines/post-processing/hi-engine-runner.ts` | runHIEngines | Post-processing; not on main path |
| `src/logic/engines/summary/export-resolver.ts` | resolveImmediateView, resolveExportView, generateChecklist, etc. | Export/summary; used by summary flow |
| `src/logic/engines/shared/engine-selector.ts` | selectExecutionEngine, getSelectionReason | Used by flow/orchestration |
| `src/logic/engines/calculator/calculator.module.ts` | runCalculatorModule | Calculator module; used by calculator engine |
| `src/logic/engines/calculator/calcs/*` | calc-registry, product-calculator, long-term-exposure | Used by calculator engine path |

### logic/flow-runtime and orchestration

| Module | Purpose | Why disconnected |
|--------|---------|-------------------|
| `src/logic/flow-runtime/FlowRenderer.tsx` | Renders flow UI | Only used by TSX screens (unreachable from seed) |
| `src/logic/flows/flow-loader.ts` | Loads/transforms flows; applyEngine | Used by flow screens / engine-viewer |
| `src/logic/orchestration/integration-flow-engine.tsx` | Integration flow engine | TSX/orchestration only |
| `src/logic/engine-system/engine-explain.ts` | explainNextStep | Used by EducationCard / engine-viewer |

### Layout “intelligence” (documented, not wired)

| Module / concept | Purpose | Why disconnected |
|------------------|---------|-------------------|
| Layout Decision Engine | Score/rank layout IDs by traits | Documented in ARCHITECTURE_AUTOGEN; no implementation in resolver |
| User Preference Adaptation | Persist trait weights from “more/less like this” | No implementation |
| Suggestion Injection Point | Resolver calls Logic for suggested layout ID | Resolver never calls Logic; precedence is override → explicit → template default |
| Contextual Layout Logic | Map content to trait suggestions | No implementation |
| Trait Registry System | layout ID → traits lookup | No trait-registry loader in runtime |

---

## Call chain reference (ACTIVE path)

Abbreviated chain from seed to engines:

1. `src/app/layout.tsx` (RootLayout) → `installBehaviorListener`  
2. `src/app/page.tsx` (Page) → `loadScreen`, `resolveLandingPage`, `JsonRenderer`, `applySkinBindings`  
3. `src/engine/core/behavior-listener.ts` → `interpretRuntimeVerb` (require), `runBehavior`, `dispatchState`  
4. `src/logic/runtime/runtime-verb-interpreter.ts` → `runAction`  
5. `src/logic/runtime/action-runner.ts` → `getActionHandler`  
6. `src/logic/runtime/action-registry.ts` → handlers: run25X, resolveOnboardingAction, runCalculator  
7. `src/engine/core/json-renderer.tsx` (renderNode) → `JsonSkinEngine`, `getDefaultSectionLayoutId`, `evaluateCompatibility`  
8. `src/logic/runtime/landing-page-resolver.ts` → `readEngineState`, `resolveOnboardingFromAnswers`, `resolveContent`  
9. `src/logic/engines/Onboarding-flow-router.tsx`, `src/logic/engines/json-skin.engine.tsx`, `src/layout/index.ts` (resolver, compatibility)

For full hop-by-hop detail see [RUNTIME_CALL_GRAPH.generated.md](../SYSTEM_MAP_AUTOGEN/RUNTIME_CALL_GRAPH.generated.md).

---

*Autogenerated. Re-run reachability script and update this doc when seed or wiring changes.*
