# Universal Engine Alignment Report

**Scope:** Structural alignment pass only. No runtime changes. No deletions. No registry rewrites. No breaking imports.

---

## 1. Engine map

| Category | Engines | Entry |
|----------|---------|--------|
| **Flow (execution)** | learning, calculator, abc | engine-registry → applyEngine(flow, engineId) |
| **Aftermath** | decision, summary | processDecisionState / processSummaryState (EngineState) |
| **Actions** | logic:runCalculator, logic:run25x, logic:resolveOnboarding | action-registry → runAction(action, state) |
| **Calculator** | calc-registry, runCalculators, calculator-types.json | getCalculator, executeCalc, run-calculator.action |
| **Flow/routing** | flow-loader, flow-router, flow-resolver, Onboarding-flow-router | loadFlow, resolveNextStep, resolveView, resolveOnboardingFromAnswers |
| **Behavior** | behavior-runner, BehaviorEngine, behavior.json | runBehavior(domain, action, ctx, args) |
| **System7** | System7, System7Router, channels | System7Router.route(channel, action, payload) |
| **Other** | value-comparison, value-translation, hi-engine-runner, engine-selector, json-skin, applyEngineOverlays | Direct imports or build-time |

---

## 2. JSON-ready vs code-driven

**Already JSON-ready (definition or data drives behavior):**

- **behavior.json** — Maps (domain, action) and (verb, variant) to handler names; adding new mappings requires JSON only (handler impl still in TS).
- **Flow JSON** — Steps, choices, outcomes, routing rules, calcRefs; flow-loader and flow-router consume these.
- **calculator-types.json** — Bundle structure (id, inputs, formula, output) exists; runtime does not yet evaluate formula strings (runCalculators uses type branches in TS).
- **engines.manifest.json** — New; list of engine id + type (data only; not yet wired).
- **engine-definitions/*.engine.json** — New; placeholders for future definition-driven engines.
- **calculators.manifest.json** — New; mirrors calculator-types.json structure for future formula-driven execution.

**Code-driven (logic in TS):**

- **Flow engines (learning, calculator, abc)** — Signal lists, filter/order logic in each engine file.
- **Aftermath (decision, summary)** — processDecisionState / processSummaryState and aggregate logic in TS.
- **Actions** — runCalculator, run25X, resolveOnboardingAction; formulas and flow routing in TS.
- **runCalculators** — Type/id branches (simple-hours, profit, default); formulas in JSON unused at execution.
- **calc-registry** — CALCULATOR_REGISTRY map and initializeDefaultCalcs (registerCalc for cleanup_monthly_cost, intent_score, total_loss_25x, product-cost).
- **engine-registry** — EngineId union, EXECUTION_ENGINE_REGISTRY, AFTERMATH_PROCESSOR_REGISTRY, PRESENTATION_REGISTRY; static imports.
- **action-registry** — registry object with three action names.
- **engine-selector** — Signal lists and priority (calculator → abc → learning) in TS.
- **Onboarding-flow-router** — Intent thresholds (80, 40) and run25X adapter in TS.
- **BehaviorEngine** — All handler implementations (interact.*, nav.*, media stubs) in TS.
- **System7** — Channel modules and route() in TS.

---

## 3. Conversion difficulty

| Area | Difficulty | Notes |
|------|------------|--------|
| action-registry extension (manifest-driven names) | LOW | Add registerAction or load from JSON; handlers stay TS. |
| flow-definitions from JSON, FlowRenderer/engine-viewer defaults | LOW | Load FLOWS and defaults from config. |
| hi-engine-runner switch → registry | LOW | HIEngineId → processor from config. |
| engine-registry manifest + dynamic registration | MEDIUM | Keep TS engines; allow manifest to drive id/type list. |
| Flow engines (learning, calculator, abc) signals/order from JSON | MEDIUM | Move signal lists and ordering rules to engine-definitions. |
| calc-registry JSON-driven defs (keep product-cost in TS) | MEDIUM | Source bundle list from calculators.manifest; complex calcs stay registerCalc. |
| engine-selector config | MEDIUM | Signal lists and priority in JSON. |
| Onboarding-flow-router thresholds | MEDIUM | Thresholds and flow decisions in JSON. |
| System7 registration / channel list from config | MEDIUM | Register as system engine; channel list in manifest. |
| runCalculators formula execution from JSON | HIGH | Formula runner; remove type branches; use formula string from manifest. |
| Full behavior handlers in JSON | HIGH | Optional; keep TS handlers acceptable; mapping already JSON. |

---

## 4. % already universal

- **Invocation surface:** Flow execution (learning, calculator, abc) and presentation go through a single contract (engine-contract → applyEngine, getPresentation). Actions go through action-registry. So “one contract per category” is in place.
- **Count (rough):** Engines invokable via a single contract or JSON config:
  - Flow: 3 (learning, calculator, abc) via engine-contract.
  - Actions: 3 (logic:runCalculator, logic:run25x, logic:resolveOnboarding) via action-registry.
  - Behavior: 1 mapping layer (behavior.json) drives handler name; handlers in TS.
  - System7: 1 (System7Router) but not in engine-contract.
- **Definition-driven:** Today only behavior mapping and flow/routing data are definition-driven. Flow engine behavior (signals, order) and calculator execution are code-driven. So by “universal” (id + type + payload → delegate): 6 engines in engines.manifest; 1 adapter (applyUniversalEngine) can route all four types. Existing call sites do not use the adapter yet; they remain unchanged.
- **Summary:** Roughly 6 engines are listed in the new manifest and can be invoked via applyUniversalEngine. The rest of the system (registries, flow-loader, behavior-runner, etc.) is unchanged. “Already universal” in the sense of “can be routed by a single adapter”: 6/6 manifest engines. “Already definition-driven” (behavior from JSON only, no TS change): behavior mapping and flow/routing structure; flow engine logic and calculator execution still code-driven (~30% definition-driven by surface area).

---

## 5. Effort estimates

| Target | Estimate | Notes |
|--------|----------|--------|
| **50 engines** | Low (1–2 days) | Add entries to engines.manifest and engine-definitions; extend adapter if new types; existing registries can stay or be extended. No need to move existing engine files. |
| **100 engines** | Low–medium (2–3 days) | Same as 50; possible tooling (codegen or validation) for manifest and definitions. Registry and adapter scale by id/type. |
| **100% JSON-driven calculators** | High (3–5 days) | Safe expression evaluator for formula strings; runCalculators rewritten to use calculators.manifest (or calculator-types) and formula runner; remove type/id branches. Keep product-cost and other async/complex calcs in TS as registered fns. |

---

## 6. Deliverables (this pass)

| Deliverable | Status |
|-------------|--------|
| src/cursor/UNIVERSAL_ENGINE_BASELINE.md | Created (inventory from architecture report) |
| src/logic/engine-system/engines.manifest.json | Created (6 engines; not imported) |
| src/logic/engine-system/universal-engine-adapter.ts | Created (delegation only: flow, calculator, system, behavior) |
| src/logic/engine-definitions/*.engine.json | Created (6 placeholders; not wired) |
| src/logic/engine-definitions/calculators.manifest.json | Created (mirrors calculator-types.json) |
| src/cursor/UNIVERSAL_ENGINE_ALIGNMENT_REPORT.md | This document |

No changes to engine-registry, action-registry, flow-loader, behavior-runner, or renderer. System compiles and behaves identically; additive only.
