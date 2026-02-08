# Universal Engine Baseline — Inventory

**Source:** UNIVERSAL_ENGINE_ARCHITECTURE_REPORT.md Section 1–2 (read-only extraction).  
**Purpose:** Single reference for engine id, entry file, invocation path, input/output shape, hardcoded vs JSON-driven areas, and conversion difficulty. No code edits.

---

## 1. Flow engines (execution)

| id | Entry file | Invocation path | Input shape | Output shape | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------------------|-------------|-------------|------------------------|-------------------|------------|
| learning | `src/logic/engines/learning.engine.ts` | flow-loader → applyEngine(flow, "learning") from engine-contract → engine-registry → learningEngine(flow) | EducationFlow | EngineFlow (reordered steps) | learningSignals list, filter/order steps by learning/educational purpose | Flow JSON (steps, choices, outcomes) | MEDIUM |
| calculator | `src/logic/engines/calculator/calculator.engine.ts` | flow-loader → applyEngine(flow, "calculator") from engine-contract → engine-registry → calculatorEngine(flow) | EducationFlow | EngineFlow (numeric-first order) | numericSignals list, purpose/tags filtering, calcRefs handling | Flow JSON, flow.calcRefs | MEDIUM |
| abc | `src/logic/engines/abc.engine.ts` | flow-loader → applyEngine(flow, "abc") from engine-contract → engine-registry → abcEngine(flow) | EducationFlow | EngineFlow (cascading-first order) | cascadingSignals list, branching/decision step logic, sort order | Flow JSON | MEDIUM |

---

## 2. Aftermath processors

| id | Entry file | Invocation path | Input shape | Output shape | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------------------|-------------|-------------|------------------------|-------------------|------------|
| decision | `src/logic/engines/decision/decision.engine.ts` | hi-engine-runner, direct processDecisionState(engineState, outcomes?, context) | EngineState, outcomes?, context | DecisionState | aggregate.ts, decision-types, recommendation logic | — | MEDIUM |
| summary | `src/logic/engines/summary/summary.engine.ts` | direct processSummaryState(engineState) | EngineState | SummaryOutput | key points/slices scoring, top N logic | — | MEDIUM |

---

## 3. Action handlers (trunk)

| id | Entry file | Invocation path | Input shape | Output shape | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------------------|-------------|-------------|------------------------|-------------------|------------|
| logic:runCalculator | `src/logic/actions/run-calculator.action.ts` | behavior-listener / interpretRuntimeVerb → runAction → getActionHandler("logic:runCalculator") → runCalculator(action, state) | action: { calculatorId, inputKey, outputKey }, state | state updates via dispatchState | getCalculator + runCalculators usage, dispatchState keys | Action name and keys in JSON/verb | LOW |
| logic:run25x | `src/logic/engines/25x.engine.ts` | action-runner → getActionHandler("logic:run25x") → run25X(action, state) | action, state (calculatorInput) | state.calculatorResult, scoring object | Formula (hours * wage * 25), intent score calculation | — | MEDIUM |
| logic:resolveOnboarding | `src/logic/actions/resolve-onboarding.action.ts` | action-runner → getActionHandler("logic:resolveOnboarding") → resolveOnboardingAction(action, state) | action?.answers, state | writeEngineState, dispatchState (currentView, currentFlow) | Onboarding-flow-router, flow-resolver, threshold logic | — | MEDIUM |

---

## 4. Calculator subsystem

| id | Entry file | Invocation path | Input shape | Output shape | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------------------|-------------|-------------|------------------------|-------------------|------------|
| calculator.registry | `src/logic/registries/calculator.registry.ts` | Re-exports from calc-registry | — | — | — | — | — |
| calc-registry | `src/logic/engines/calculator/calcs/calc-registry.ts` | getCalculator(id), executeCalc(id, inputs), registerCalc(def) | calculatorId / calc id, inputs | CalcResult (value, metadata) | CALCULATOR_REGISTRY map, initializeDefaultCalcs (cleanup_monthly_cost, intent_score, total_loss_25x, product-cost) | calculator-types.json keyed bundles (structure only; execution uses TS) | MEDIUM |
| runCalculators | `src/logic/engines/calculator/calculator.engine.ts` | run-calculator.action → getCalculator + runCalculators([calculator], inputState) | calculators[], state | Record<outputKey, value> | Type branches (simple-hours, profit, default); formulas in JSON not evaluated | calculator-types.json (inputs/output keys; formulas unused at runtime) | HIGH |

---

## 5. Flow / routing

| id | Entry file | Invocation path | Input shape | Output shape | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------------------|-------------|-------------|------------------------|-------------------|------------|
| flow-loader | `src/logic/flows/flow-loader.ts` | loadFlow(flowId, engineId?, screenParam?) | flowId, engineId?, screenParam? | EducationFlow (engine-transformed) | applyEngine calls, cache, currentEngineId | Flow JSON files, FLOWS registry | LOW |
| flow-router | `src/logic/engines/flow-router.ts` | resolveNextStep(flow, stepIndex, signals, ...) | flow, currentStepIndex, signals, outcomes, presentation, calcOutputs, engineId | { nextStepIndex, engineState } | Linear vs signal-based routing logic | flow.routing rules (JSON) | MEDIUM |
| flow-resolver | `src/logic/runtime/flow-resolver.ts` | resolveOnboardingAction → resolveView(flowId, derived) | flowId, DerivedState | view id (string) | FLOWS from flow-definitions.ts, step completion logic | — | LOW |
| Onboarding-flow-router | `src/logic/engines/Onboarding-flow-router.tsx` | resolveOnboardingAction → resolveOnboardingFromAnswers(answers) | answers | FlowDecision | run25X adapter, intent thresholds (80, 40), wantsPricing | — | MEDIUM |

---

## 6. Behavior system

| id | Entry file | Invocation path | Input shape | Output shape | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------------------|-------------|-------------|------------------------|-------------------|------------|
| behavior-runner | `src/behavior/behavior-runner.ts` | behavior-listener → runBehavior(domain, action, ctx, args) | domain, action, ctx, args | handler result; fireNavigation(ctx, target) | resolveNavVariant, resolveBehaviorVerb, handler lookup from BehaviorEngine | behavior.json (interactions, navigations → handler name) | LOW |
| BehaviorEngine | `src/behavior/behavior-engine.ts` | runBehavior → BehaviorEngine[handlerName](ctx, args) | (ctx, args) | side effects (dispatchState, UIState, navigate) | All handlers (interact.*, nav.*, media stubs) | — | HIGH |
| runtime-verb-interpreter | `src/logic/runtime/runtime-verb-interpreter.ts` | behavior-listener (verb) → interpretRuntimeVerb(verb, state) | verb, state | runAction(verb, state) → state | Verb shape normalization | Verb payload from JSON | LOW |

---

## 7. System7

| id | Entry file | Invocation path | Input shape | Output shape | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------------------|-------------|-------------|------------------------|-------------------|------------|
| System7 | `src/engine/system7/system7.tsx` | System7Router.route(channel, action, payload) or direct System7(spec, data) | spec, data (per channel) | { kind: "system7", channels: { identity, media, content, ... } } | Channel imports (identity, media, content, environment, parameters, style, timeline) | system7.json (stub only) | MEDIUM |
| System7Router | `src/engine/system7/system7-router.ts` | Direct call; not wired to engine-contract or action-registry | channel, action, payload | System7Output | route() implementation | — | MEDIUM |

---

## 8. Engine-system (contract + registry)

| id | Entry file | Role | Hardcoded logic areas | JSON-driven areas | Difficulty |
|----|------------|------|------------------------|-------------------|------------|
| engine-contract | `src/logic/engine-system/engine-contract.ts` | Single public API: getActionHandler, applyEngine, getPresentation, engine list, types. Re-exports action-registry + engine-registry. | Re-export only | — | — |
| engine-registry | `src/logic/engine-system/engine-registry.ts` | EXECUTION_ENGINE_REGISTRY, AFTERMATH_PROCESSOR_REGISTRY, PRESENTATION_REGISTRY; getEngine, applyEngine, getPresentation | EngineId union, static imports of learning/calculator/abc/decision/summary | — | MEDIUM |
| action-registry | `src/logic/runtime/action-registry.ts` | registry[name] → handler | registry object: logic:runCalculator, logic:run25x, logic:resolveOnboarding | — | LOW |

---

## Invocation pattern summary (Section 2)

- **Action:** JSON/UI → behavior-listener (optional) → interpretRuntimeVerb(verb, state) → runAction(action, state) → getActionHandler(action.name) from engine-contract → action-registry → handler. Shape: action = { name, ...params }; state = Record<string, any>.
- **Flow:** loadFlow(flowId, engineId?, screenParam?) → applyEngine(flow, effectiveEngineId) from engine-contract → engine-registry → EXECUTION_ENGINE_REGISTRY[engineId](flow). Shape: (EducationFlow, EngineId) → EngineFlow.
- **Calculator (action):** runCalculator(action, state) uses getCalculator(calculatorId) + runCalculators([calculator], state[inputKey]). Shape: (action, state) → state updates via dispatchState.
- **Calculator (executeCalc):** resolveCalcs(calcRefs, state) or direct executeCalc(id, inputs) from calculator.registry. Shape: (id, inputs) → Promise<CalcResult>.
- **Behavior:** runBehavior(domain, action, ctx, args); behavior.json maps to handler name; BehaviorEngine[handlerName](ctx, args). Shape: (domain, action, ctx, args) → handler return; nav optional.
- **System7:** System7Router.route(channel, action, payload). Not wired to engine-contract or action-registry. Shape: (channel, action, payload) → System7Output.
