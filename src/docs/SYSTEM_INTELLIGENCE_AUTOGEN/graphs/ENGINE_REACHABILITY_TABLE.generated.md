# Engine Reachability Table (Generated)

Engine-level reachability from seed. **Reachable** = module reachable from seed set; **Invoked** = called on main JSON/behavior path; **Docs only** = documented, no implementation.

**Seed:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/engine/core/json-renderer.tsx`, `src/engine/core/behavior-listener.ts`, `src/engine/core/screen-loader.ts`, `src/state/state-store.ts`, `src/layout/index.ts`, `src/logic/runtime/runtime-verb-interpreter.ts`.

---

## Summary

| Status | Count | Meaning |
|--------|-------|---------|
| Reachable + Invoked | 12 | On main path from seed |
| Reachable, not invoked | 0 | Dormant |
| Unreachable (code exists) | 20+ | TSX/flow/API/script only |
| Docs only | 5+ | No implementation |

---

## Reachable and Invoked

| Engine / Module | File | Entry call site | Status |
|-----------------|------|------------------|--------|
| JsonSkinEngine | `src/logic/engines/json-skin.engine.tsx` | json-renderer.tsx → renderNode → JsonSkinEngine | ✅ Reachable, Invoked |
| Onboarding-flow-router | `src/logic/engines/Onboarding-flow-router.tsx` | landing-page-resolver.ts → resolveOnboardingFromAnswers | ✅ Reachable, Invoked |
| engine-bridge | `src/logic/runtime/engine-bridge.ts` | landing-page-resolver, behavior path (readEngineState/writeEngineState) | ✅ Reachable, Invoked |
| action-runner | `src/logic/runtime/action-runner.ts` | behavior-listener → interpretRuntimeVerb → runAction | ✅ Reachable, Invoked |
| action-registry | `src/logic/runtime/action-registry.ts` | action-runner → getActionHandler | ✅ Reachable, Invoked |
| 25x.engine | `src/logic/engines/25x.engine.ts` | action-registry → run25X | ✅ Reachable, Invoked |
| resolve-onboarding.action | `src/logic/actions/resolve-onboarding.action.ts` | action-registry → resolveOnboardingAction | ✅ Reachable, Invoked |
| run-calculator.action | `src/logic/actions/run-calculator.action.ts` | action-registry → runCalculator | ✅ Reachable, Invoked |
| Layout resolver / compatibility | `src/layout/index.ts` (re-exports) | json-renderer → getDefaultSectionLayoutId, evaluateCompatibility | ✅ Reachable, Invoked |
| content-resolver | `src/logic/content/content-resolver.ts` | landing-page-resolver → resolveContent | ✅ Reachable, Invoked |
| skinBindings.apply | `src/logic/bridges/skinBindings.apply.ts` | page.tsx → applySkinBindings | ✅ Reachable, Invoked |
| runtime-verb-interpreter | `src/logic/runtime/runtime-verb-interpreter.ts` | behavior-listener → interpretRuntimeVerb | ✅ Reachable, Invoked |

---

## Unreachable (code exists)

| Engine / Module | File | Why unreachable |
|-----------------|------|------------------|
| engine-registry | `src/logic/engine-system/engine-registry.ts` | Only imported by flow-loader, engine-viewer, FlowRenderer — all unreachable from seed |
| learning.engine | `src/logic/engines/learning.engine.ts` | Used by engine-registry; flow path not in seed |
| calculator.engine | `src/logic/engines/calculator/calculator.engine.ts` | Same |
| abc.engine | `src/logic/engines/abc.engine.ts` | Same |
| decision.engine | `src/logic/engines/decision/decision.engine.ts` | Same |
| summary.engine | `src/logic/engines/summary/summary.engine.ts` | Same |
| flow-router | `src/logic/engines/flow-router.ts` | Flow path only |
| next-step-reason | `src/logic/engines/next-step-reason.ts` | Flow/orchestration only |
| decision-engine | `src/logic/engines/decision-engine.ts` | Decision flow only |
| value-comparison.engine | `src/logic/engines/comparison/value-comparison.engine.ts` | No import from seed |
| value-translation.engine | `src/logic/engines/comparison/value-translation.engine.ts` | Same |
| value-dimensions | `src/logic/engines/comparison/value-dimensions.ts` | Comparison path only |
| hi-engine-runner | `src/logic/engines/post-processing/hi-engine-runner.ts` | Post-processing; not on main path |
| export-resolver | `src/logic/engines/summary/export-resolver.ts` | Summary flow only |
| engine-selector | `src/logic/engines/shared/engine-selector.ts` | Flow/orchestration only |
| calculator.module | `src/logic/engines/calculator/calculator.module.ts` | Calculator engine path only |
| FlowRenderer | `src/logic/flow-runtime/FlowRenderer.tsx` | TSX screens only |
| flow-loader | `src/logic/flows/flow-loader.ts` | Flow screens / engine-viewer |
| integration-flow-engine | `src/logic/orchestration/integration-flow-engine.tsx` | TSX/orchestration only |
| engine-explain | `src/logic/engine-system/engine-explain.ts` | EducationCard / engine-viewer |

---

## Docs only (no implementation)

| Concept | Purpose | Evidence not in code |
|---------|---------|----------------------|
| Layout Decision Engine | Score/rank layout IDs by traits | No call from resolver or applyProfileToNode |
| User Preference Adaptation | Persist trait weights "more/less like this" | No preference memory or wiring |
| Suggestion Injection Point | Resolver calls Logic for suggested layout ID | Resolver never calls Logic; override → explicit → template only |
| Contextual Layout Logic | Map content to trait suggestions | No rules or engine in code |
| Trait Registry System | layout ID → traits lookup | No trait-registry.json loader in runtime |

---

## Verification

| Check | Result |
|-------|--------|
| All engines under src/logic/engines and engine-like enumerated | PASS |
| Status (Reachable+Invoked / Unreachable / Docs only) | PASS |
| File paths and entry call sites | PASS |
| Line ranges | PASS_WITH_GAPS (see ENGINE_WIRING_STATUS for refs) |

---

*Generated. Deterministic. See REACHABILITY_REPORT.generated.md for module-level reachability.*
