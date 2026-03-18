# Universal Engine Interface — Audit & Design Report

**Mode:** Read-only analysis. No file edits. No refactor in this pass.  
**Objective:** Design a single universal plug system so ALL engines can be added by JSON + registration, not code changes.  
**Output:** Architecture report with engine map, proposed universal JSON format, migration path, risk levels, and complexity estimates.

---

## SECTION 1 — ENGINE INVENTORY

### 1.1 Logic engines (flow transformers / execution)

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **learning** | `logic/engines/learning.engine.ts` | flow-loader → applyEngine(flow, "learning") | EducationFlow | EngineFlow (reordered steps) | **Code-driven**: signal lists, ordering rules in TS |
| **calculator** | `logic/engines/calculator/calculator.engine.ts` | flow-loader → applyEngine(flow, "calculator") | EducationFlow | EngineFlow (numeric-first order) | **Code-driven**: numericSignals, purpose/tags in TS |
| **abc** | `logic/engines/abc.engine.ts` | flow-loader → applyEngine(flow, "abc") | EducationFlow | EngineFlow (cascading-first order) | **Code-driven**: cascadingSignals, branching logic in TS |

### 1.2 Aftermath processors (post-engine; consume EngineState)

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **decision** | `logic/engines/decision/decision.engine.ts` | hi-engine-runner, direct processDecisionState() | EngineState, outcomes?, context | DecisionState | **Code-driven**: aggregate.ts, decision-types |
| **summary** | `logic/engines/summary/summary.engine.ts` | direct processSummaryState() | EngineState | SummaryOutput | **Code-driven**: key points/slices logic in TS |

### 1.3 Action handlers (trunk: action-runner → handler)

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **logic:runCalculator** | `logic/actions/run-calculator.action.ts` | action-runner → getActionHandler("logic:runCalculator") | action: { calculatorId, inputKey, outputKey }, state | state updates via dispatchState | **Hybrid**: action name + keys in JSON; getCalculator + runCalculators in code |
| **logic:run25x** | `logic/engines/25x.engine.ts` | action-runner → getActionHandler("logic:run25x") | action, state (calculatorInput) | state.calculatorResult, scoring | **Code-driven**: formula (hours * wage * 25), intent score in TS |
| **logic:resolveOnboarding** | `logic/actions/resolve-onboarding.action.ts` | action-runner → getActionHandler("logic:resolveOnboarding") | action?.answers, state | writeEngineState(currentFlow, currentView), dispatchState | **Code-driven**: Onboarding-flow-router, flow-resolver in TS |

### 1.4 Calculator subsystem (registry + calcs)

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **calculator.registry** | `logic/registries/calculator.registry.ts` | Re-exports from calc-registry | — | — | **Facade** |
| **calc-registry** | `logic/engines/calculator/calcs/calc-registry.ts` | getCalculator, executeCalc, registerCalc, getCalc | calculatorId / calc id, inputs | CalcResult | **Hybrid**: calculator-types.json for bundle defs; CALCULATOR_REGISTRY + CALC_REGISTRY hardcoded; registerCalc() for cleanup_monthly_cost, intent_score, total_loss_25x, product-cost |
| **runCalculators** | `logic/engines/calculator/calculator.engine.ts` | run-calculator.action | calculators[], state | Record<outputKey, value> | **Code-driven**: type branches (simple-hours, profit, default) in TS; formulas in JSON not used for execution |

### 1.5 Flow / routing

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **flow-loader** | `logic/flows/flow-loader.ts` | loadFlow(flowId, engineId?, screenParam?) | flowId, engineId?, screenParam? | EducationFlow (engine-transformed) | **Hybrid**: flows from JSON; applyEngine from engine-contract |
| **flow-router** | `logic/engines/flow-router.ts` | resolveNextStep(...) | flow, step index, signals, outcomes, presentation, calcOutputs, engineId | { nextStepIndex, engineState } | **Code-driven**: routing rules from flow.routing (JSON); logic in TS |
| **flow-resolver** | `logic/runtime/flow-resolver.ts` | resolveOnboardingAction → resolveView(flowId, derived) | flowId, DerivedState | view id (string) | **Code-driven**: FLOWS from flow-definitions.ts (hardcoded); step completion from interactions |
| **Onboarding-flow-router** | `logic/engines/Onboarding-flow-router.tsx` | resolveOnboardingAction → resolveOnboardingFromAnswers(answers) | answers | FlowDecision | **Code-driven**: run25X adapter, intent thresholds in TS |

### 1.6 Behavior runner touchpoints

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **behavior-runner** | `behavior/behavior-runner.ts` | behavior-listener → runBehavior(domain, action, ctx, args) | domain, action, ctx, args | handler result; fireNavigation(ctx, target) | **JSON-driven**: behavior.json (interactions, navigations) → handler name; BehaviorEngine handlers in TS |
| **BehaviorEngine** | `behavior/behavior-engine.ts` | runBehavior → BehaviorEngine[handlerName](ctx, args) | (ctx, args) | side effects (dispatchState, UIState, navigate) | **Code-driven**: all handlers (interact.*, nav.*, media stubs) in TS |
| **runtime-verb-interpreter** | `logic/runtime/runtime-verb-interpreter.ts` | behavior-listener (when verb type) → interpretRuntimeVerb(verb, state) | verb, state | runAction(verb, state) → state | **Code-driven**: verb shape only; delegates to action-runner |

### 1.7 System7

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **System7** | `engine/system7/system7.tsx` | System7Router.route(channel, action, payload) or direct System7(spec, data) | spec, data (per channel) | { kind: "system7", channels: { identity, media, content, ... } } | **Code-driven**: channels are TS modules; system7.json is stub config only |
| **System7Router** | `engine/system7/system7-router.ts` | Not wired to engine-contract or action-runner | channel, action, payload | System7(...) result | **Not wired**: no registration in engine-registry or action-registry |
| **Channels** | `engine/system7/channels/*.channel.tsx` | System7() aggregates | spec, data | { kind, channel, data, children } | **Code-driven** |

### 1.8 Other engines / processors

| id | Entry file | Invocation | Inputs | Outputs | JSON vs code |
|----|------------|------------|--------|--------|--------------|
| **value-comparison** | `logic/engines/comparison/value-comparison.engine.ts` | compareProducts() — scripts/proof-runs, applyEngineOverlays (engineId ref) | productA, productB, dimensions, includePrice | ComparisonResult | **Code-driven**: no engine-registry; direct import |
| **value-translation** | `logic/engines/comparison/value-translation.engine.ts` | translateValue() — scripts, value-translation-adapter, value-annotation | ValueTranslationInput | ValueTranslationOutput | **Code-driven**: no engine-registry; direct import |
| **hi-engine-runner** | `logic/engines/post-processing/hi-engine-runner.ts` | runHIEngines(engineState, hiEngineId) | EngineState, HIEngineId | EngineState + hi result | **Code-driven**: switch(hiEngineId) calculator/comparison/decision/shared |
| **engine-selector** | `logic/engines/shared/engine-selector.ts` | selectExecutionEngine(engineState, currentEngineId) | EngineState | ExecutionEngineId | **Code-driven**: signal lists and priority in TS |
| **json-skin** | `logic/engines/json-skin.engine.tsx` | Screen gate (TSX) | screen, state | gated children render | **Code-driven**: selectActiveChildren logic in TS |
| **applyEngineOverlays** | `lib/site-engines/applyEngineOverlays.ts` | Build/site compile (no main-path callers) | SiteSchema, siteData, config | SiteSchema with overlay blocks | **Code-driven**: overlay types and placement in TS |

### 1.9 Engine-system (contract + registry)

| id | Entry file | Role |
|----|------------|------|
| **engine-contract** | `logic/engine-system/engine-contract.ts` | Single public API: getActionHandler, getEngine, applyEngine, getPresentation, engine list, types. Re-exports action-registry + engine-registry. |
| **engine-registry** | `logic/engine-system/engine-registry.ts` | EXECUTION_ENGINE_REGISTRY (learning, calculator, abc), AFTERMATH_PROCESSOR_REGISTRY (decision, summary), PRESENTATION_REGISTRY; getEngine, applyEngine, getPresentation. Hardcoded EngineId union and imports. |
| **action-registry** | `logic/runtime/action-registry.ts` | registry[name] → handler. Hardcoded: logic:runCalculator, logic:run25x, logic:resolveOnboarding. |

---

## SECTION 2 — INVOCATION PATTERNS

### 2.1 Action → action-runner → engine

- **Path:** JSON/UI → behavior-listener (optional) → interpretRuntimeVerb(verb, state) → runAction(action, state) → getActionHandler(action.name) from **engine-contract** → action-registry → handler (runCalculator, run25X, resolveOnboardingAction).
- **Shape:** action = { name: string, ...params }; state = Record<string, any>. Handler can mutate state and/or call dispatchState / writeEngineState.
- **Registration:** Add key to `registry` in action-registry.ts and implement handler; engine-contract only re-exports getActionHandler.

### 2.2 Flow-loader → applyEngine

- **Path:** loadFlow(flowId, engineId?, screenParam?) → applyEngine(flow, effectiveEngineId) from **engine-contract** → engine-registry → EXECUTION_ENGINE_REGISTRY[engineId](flow).
- **Shape:** (flow: EducationFlow, engineId: EngineId) → EngineFlow. Aftermath processors (decision, summary) are explicitly not applied here; applyEngine falls back to learning if engineId is aftermath.
- **Registration:** Add to EXECUTION_ENGINE_REGISTRY and PRESENTATION_REGISTRY in engine-registry.ts; extend EngineId/ExecutionEngineId types.

### 2.3 Calc-resolver → calculator.registry (executeCalc)

- **Path:** resolveCalcs(calcRefs, state) → executeCalc(calcRef.id, inputs) from calculator.registry (→ calc-registry). Used by flow/TSX integration; not on main JSON screen path. Main calculator execution: action logic:runCalculator → getCalculator + runCalculators.
- **Shape:** executeCalc(id, inputs) → Promise<CalcResult>. CalcRef from flow JSON (id, inputs[], output).
- **Registration:** registerCalc(definition) in calc-registry; CALCULATOR_REGISTRY entries for JSON bundle (calculator-types.json). runCalculators in calculator.engine.ts uses getCalculator + inline type branches (simple-hours, profit, default), not executeCalc.

### 2.4 System7 (not wired)

- **Path:** System7Router.route(channel, action, payload) or direct System7(spec, data). No integration with engine-contract, action-registry, or flow-loader.
- **Shape:** (spec, data) → { kind: "system7", channels: { ... } }. Channels are identity, media, content, environment, parameters, style, timeline.

### 2.5 Differences summary

| Pattern | Entry | Registry | Input shape | Output shape |
|--------|--------|----------|-------------|--------------|
| Action | action-runner | action-registry (name → handler) | (action, state) | state (or void; handler side effects) |
| Flow | flow-loader | engine-registry (engineId → EngineFunction) | (flow, engineId) | EngineFlow |
| Calculator (action) | run-calculator.action | calculator.registry + runCalculators | (action, state) | state update |
| Calculator (executeCalc) | calc-resolver / direct | calc-registry (id → CalcDefinition) | (id, inputs) | Promise<CalcResult> |
| Behavior | behavior-runner | behavior.json → BehaviorEngine[handler] | (domain, action, ctx, args) | handler return; nav optional |
| System7 | direct / router | none in engine system | (spec, data) | system7 result |

---

## SECTION 3 — UNIVERSAL CONTRACT DESIGN

### 3.1 Proposed single universal interface

**Goal:** New engines added by dropping JSON + registering once; no runtime code edits for new engine definitions.

**Proposed engine.json schema (conceptual):**

```json
{
  "id": "profitCalculator",
  "type": "calculator | flow | system | behavior",
  "version": "1.0",
  "inputs": {
    "schema": { "calculatorId": "string", "inputKey": "string", "outputKey": "string" },
    "defaults": {}
  },
  "steps": [],
  "outputs": {
    "stateKeys": ["outputKey"],
    "metadata": false
  },
  "display": {
    "label": "Profit Calculator",
    "description": ""
  }
}
```

- **flow type:** steps = step ordering / filter rules (or reference to flow JSON). inputs = flow; outputs = transformed flow + optional presentation.
- **calculator type:** steps = formula or calcRef list; inputs = input keys; outputs = output keys + optional metadata.
- **system type:** channel spec (e.g. identity, media); inputs/outputs per channel.
- **behavior type:** verb → handler name; inputs = (domain, action, args); outputs = side effects.

### 3.2 Registration surface (single plug)

- **engines.json (or engine-manifest.json):** Array of engine descriptors (id, type, entry path or inline config).
- **Runtime:** One loader reads engines.json and registers into a **universal registry** that supports:
  - **Action plug:** name → handler; handler can be generated from JSON (e.g. run calculator by id) or point to a TS handler.
  - **Flow plug:** engineId → (flow) => flow; can be code-backed or JSON-driven (e.g. reorder rules from JSON).
  - **Calculator plug:** calc id → inputs/formula/output; execution via generic runner that interprets formula or calls registered fn.
  - **System plug:** channel → (spec, data) => result; optional for System7.
  - **Behavior plug:** (domain, action) → handler name; handler impl can remain in TS until behavior is fully JSON-driven.

### 3.3 Universal adapter (design only)

- Single entry: `applyUniversalEngine({ engineId, type, payload, context })`.
- Dispatcher by type:
  - **calculator:** payload = { calculatorId, inputKey, outputKey, state }; call calculator subsystem; write context.state.
  - **flow:** payload = { flow, engineId }; call applyEngine(flow, engineId); return transformed flow.
  - **system:** payload = { channel, action, data }; call System7Router.route or System7.
  - **behavior:** payload = { domain, action, ctx, args }; call runBehavior.
- New engine = new entry in engines.json with id, type, and config; registry built at startup or lazy-loaded from manifest. No switch statements in core; type drives dispatch.

---

## SECTION 4 — CALCULATOR FULL JSON MODEL

### 4.1 calculator-types.json today

- **Location:** `logic/engines/calculator/calculator-types.json`.
- **Content:** Keyed by bundle id (simpleHours, profit, cleanupLabor, monthlyLosss, testCalculator, wageMultiplier). Each has type "calculator" and calculators[] with id, inputs[], formula (string), output, and optionally type (e.g. "simple-hours").
- **Usage:** calc-registry imports and maps some ids (cleanup_labor_monthly, profit, etc.) to these bundles. runCalculators in calculator.engine.ts does **not** evaluate the formula string; it uses hardcoded branches (calc.type === "simple-hours" || calc.id === "cleanup_labor_monthly", etc.).

### 4.2 Desired calculator-types.json (100% JSON) capabilities

- **Multiple formulas per bundle:** calculators[] with id, inputs[], formula (expression string or reference), output, type (e.g. "simple-hours", "profit", "custom").
- **Scenarios:** Optional scenarios array (e.g. conservative / aggressive) with formula or input overrides.
- **Inputs:** Declarative input keys and optional defaults, units, labels.
- **Outputs:** output key, optional metadata (unit, label), optional secondary outputs.
- **Display metadata:** label, description, category, order for UI.

Example shape:

```json
{
  "calculators": [
    {
      "id": "cleanup_labor_monthly",
      "name": "Cleanup Labor Monthly",
      "inputs": [
        { "key": "crewSize", "default": 0, "unit": "count" },
        { "key": "cleanupMinutesPerDay", "default": 0, "unit": "minutes" },
        { "key": "hourlyWage", "default": 0, "unit": "dollars" }
      ],
      "formula": "(crewSize * (cleanupMinutesPerDay / 60) * (hourlyWage * 1.5)) * 22",
      "outputs": [{ "key": "cleanupLaborMonthly", "unit": "dollars", "label": "Monthly" }],
      "scenarios": [],
      "display": { "label": "Cleanup Labor", "category": "labor" }
    }
  ]
}
```

### 4.3 Logic that should move from TS to JSON

- **Already in JSON:** formula strings, inputs[], output key (underused).
- **Still in TS (candidates to move):**
  - runCalculators: type branches (simple-hours, profit, default) → replace with single expression evaluator or formula runner that reads formula from JSON.
  - CALCULATOR_REGISTRY and CALC_REGISTRY mapping → from calculator-types.json (or calculator-types.json as single source); no duplicate id → bundle map in TS.
  - registerCalc() for cleanup_monthly_cost, intent_score, total_loss_25x, product-cost: product-cost may stay as TS (async, complex); others could become JSON formulas + generic runner if formula language supports conditionals and multipliers.
- **Keep in TS:** Expression evaluator (safe math), validation, product-cost and any async/external calcs until JSON supports “plugin” or “async” type.

---

## SECTION 5 — GAP ANALYSIS

### 5.1 Where engines are still hardcoded

| Location | Nature | Difficulty |
|----------|--------|------------|
| **engine-registry.ts** | EngineId / ExecutionEngineId union; EXECUTION_ENGINE_REGISTRY / AFTERMATH_PROCESSOR_REGISTRY / PRESENTATION_REGISTRY; static imports of learning, calculator, abc, decision, summary | **MEDIUM**: Add manifest loader; keep TS engines as default; allow dynamic registration from JSON. |
| **action-registry.ts** | registry object with logic:runCalculator, logic:run25x, logic:resolveOnboarding | **LOW**: Add registerAction(name, handler); load from JSON manifest for name → handler mapping (handler can remain TS). |
| **calc-registry.ts** | CALCULATOR_REGISTRY map; initializeDefaultCalcs() with registerCalc() for cleanup_monthly_cost, intent_score, total_loss_25x, product-cost | **MEDIUM**: Calculator definitions from JSON; product-cost and complex calcs stay as registered fns; simple calcs from formula. |
| **calculator.engine.ts runCalculators** | if/else on calc.type and calc.id; formulas in JSON not used | **HIGH**: Replace with formula runner or unified executor; respect calculator-types.json formula. |
| **engine-selector.ts** | Signal lists (calculatorSignals, abcSignals, learningSignals); priority (calculator → abc → learning); return "calculator" | "abc" | "learning" | **MEDIUM**: Move signal lists and priority to JSON config; selector reads config. |
| **hi-engine-runner.ts** | switch(hiEngineId) case "calculator" | "comparison" | "decision" | "shared" | **LOW**: Registry of hiEngineId → processor; config from JSON. |
| **FlowRenderer / engine-viewer** | defaultEngineId "learning"; HIEngineId union; mapHIEngineToExecutionEngine | **LOW**: From config or engine list. |
| **Onboarding-flow-router** | resolveOnboardingFlow thresholds (intent >= 80, >= 40); resolveOnboardingFromAnswers calls run25X | **MEDIUM**: Thresholds and flow decisions in JSON; 25x adapter remains callable. |
| **flow-definitions.ts** | FLOWS hardcoded (calculator-1, education-flow, pricing-jump-flow) | **LOW**: Load from JSON. |
| **BehaviorEngine** | All handler implementations (interact.*, nav.*, media stubs) | **HIGH**: Handlers stay TS; mapping (domain, action) → handler name already JSON (behavior.json). |
| **System7** | Not in any registry; channels imported in system7.tsx | **MEDIUM**: Register as system engine; channel list from config. |

### 5.2 Difficulty summary

- **LOW:** action-registry extension, hi-engine-runner switch → registry, flow-definitions from JSON, FlowRenderer/engine-viewer defaults from config.
- **MEDIUM:** engine-registry manifest + dynamic registration, calc-registry JSON-driven defs + keep TS for complex calcs, engine-selector config, Onboarding-flow-router thresholds in JSON, System7 registration.
- **HIGH:** runCalculators formula execution from JSON (remove type branches), full behavior handlers in JSON (optional; keep TS handlers acceptable).

---

## SECTION 6 — UNIVERSAL PLUG ADAPTER (DESIGN)

### 6.1 Single adapter signature

```ts
applyUniversalEngine({
  engineId: string,
  type: "calculator" | "flow" | "system" | "behavior",
  payload: Record<string, any>,
  context: { state?: Record<string, any>, flow?: EducationFlow, ctx?: any }
}): Promise<UniversalEngineResult>
```

### 6.2 Internal dispatch (no code changes in this report)

- **calculator:** Resolve calculator/calc by engineId (or payload.calculatorId); get inputs from context.state or payload; execute via executeCalc or JSON formula runner; write outputs to context.state or return in result.
- **flow:** Apply applyEngine(context.flow, engineId); return { flow: transformedFlow, presentation?: getPresentation(...) }.
- **system:** Call System7Router.route(payload.channel, payload.action, payload.data) or System7(payload.spec, payload.data); return system7 result.
- **behavior:** Call runBehavior(payload.domain, payload.action, context.ctx, payload.args); return handler result.

### 6.3 Registration

- **Universal registry:** Map (engineId, type) → runner. Runners can be:
  - Wrappers around existing applyEngine / getActionHandler / executeCalc / runBehavior / System7Router.
  - New implementations that read engine config from engines.json.
- New engine: add entry to engines.json (id, type, config); loader registers runner (or name → existing handler). No edits to engine-registry.ts or action-registry.ts for that new engine.

---

## SECTION 7 — SAFETY (CONSTRAINTS)

- **Do not** suggest deleting working engines or collapsing core runtime.
- **Do not** modify renderer (e.g. JsonRenderer) or state (state-store, engine-bridge) in this design.
- **Do not** change existing handler/engine behavior; only add a unified registration and adapter layer that delegates to current code paths.
- Migration path is additive: manifest + applyUniversalEngine as a new entry point; existing action-runner, flow-loader, calc-resolver, behavior-runner, and System7 remain callable as today.

---

## SECTION 8 — OUTPUT SUMMARY

### 8.1 Engine map (concise)

| Category | Engines |
|----------|---------|
| Execution (flow) | learning, calculator, abc |
| Aftermath | decision, summary |
| Actions | logic:runCalculator, logic:run25x, logic:resolveOnboarding |
| Calculator | calc-registry (executeCalc), runCalculators, calculator-types.json |
| Flow/routing | flow-loader, flow-router, flow-resolver, Onboarding-flow-router |
| Behavior | behavior-runner, BehaviorEngine, behavior.json |
| System7 | System7, System7Router, channels (not wired) |
| Other | value-comparison, value-translation, hi-engine-runner, engine-selector, json-skin, applyEngineOverlays |

### 8.2 Proposed universal JSON format

- **engines.json:** List of { id, type, config } for calculator | flow | system | behavior.
- **engine instance (e.g. calculator):** id, type, inputs, steps/formulas, outputs, display.
- **Single registration:** Load engines.json → populate universal registry; applyUniversalEngine(engineId, type, payload, context) dispatches by type.

### 8.3 Migration path (phased, no deletions)

1. **Phase 1:** Add engines.json and universal registry; register existing engines by id/type with wrappers (no behavior change).
2. **Phase 2:** Add applyUniversalEngine(); route from new call sites (e.g. optional verb or admin); keep action-runner and flow-loader as primary paths.
3. **Phase 3:** Move action names and flow engine ids to manifest; registry built from JSON; TS handlers unchanged.
4. **Phase 4:** Calculator: formula runner for calculator-types.json; reduce runCalculators branches; keep registerCalc for complex calcs.
5. **Phase 5:** Optional: engine-selector and hi-engine-runner config from JSON; System7 registered as system engine.

### 8.4 Risk levels

- **Low:** Action/flow registration from manifest; flow-definitions from JSON; HI engine id list from config.
- **Medium:** Engine-registry manifest; calc-registry partial JSON; engine-selector config; Onboarding thresholds; System7 wiring.
- **High:** runCalculators replaced by pure formula execution; any change to EngineState/contract shape.

### 8.5 Estimated complexity

- **Universal adapter + manifest:** ~2–3 days (registry, applyUniversalEngine, load engines.json).
- **Calculator 100% JSON (formulas + scenarios):** ~3–5 days (safe expression eval, migrate runCalculators, keep product-cost in TS).
- **Full engine registration from JSON (all existing engines):** ~2–3 days (wrappers, types, tests).
- **System7 integration into universal adapter:** ~1 day (register + route from applyUniversalEngine).

---

*End of report. No files were modified. This document is the single deliverable for the universal engine architecture audit and design.*
