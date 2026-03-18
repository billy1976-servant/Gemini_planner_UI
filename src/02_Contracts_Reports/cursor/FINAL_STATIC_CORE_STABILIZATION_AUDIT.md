# FINAL STATIC-CORE STABILIZATION AUDIT

**Mode:** READ-ONLY ANALYSIS. No refactors, no file edits, no file moves.  
**Objective:** Verify system has reached a "static code / data-driven runtime" state and identify last structural gaps before permanent freeze of core code.

---

## SECTION 1 — IMPORT SURFACE PURITY

### 1.1 Facade / deep-import context

- **layout:** `@/layout` (layout/index.ts) is the facade. It re-exports from `../lib/layout` for: `getVisualPresetForMolecule`, `getSpacingForScale`, `getCardPreset`, `resolveMoleculeLayout`, `getCardLayoutPreset`. Any consumer outside `lib/layout` that needs these should use `@/layout`, not `@/lib/layout/*`.
- **logic (engine/action):** `@/logic/engine-system/engine-contract` is the single public engine/action surface. No facade for all of `@/logic`; other logic imports are domain-internal or cross-domain.
- **state / lib:** No top-level `state/index` or `lib/index`; no single facade for these roots.

### 1.2 Top 20 most common import paths (by path prefix / pattern)

| Rank | Import path / pattern | Approx. count | Classification |
|------|------------------------|---------------|----------------|
| 1 | `@/engine/core/*` | 25+ | Acceptable (engine core) |
| 2 | `@/state/state-store` | 12+ | Acceptable (no state facade) |
| 3 | `@/logic/engine-system/engine-contract` | 8+ | Correct (facade) |
| 4 | `@/logic/flows/flow-loader` | 5+ | Acceptable internal |
| 5 | `@/logic/runtime/*` (engine-bridge, engine-state, flow-resolver, etc.) | 20+ | Acceptable internal / cross-domain |
| 6 | `@/logic/engines/*` (presentation-types, next-step-reason, engine-selector, calculator, etc.) | 25+ | Mixed: internal vs cross-domain |
| 7 | `@/lib/layout/*` | 18+ | Mixed: see violations |
| 8 | `@/lib/site-*` (site-compiler, site-renderer, site-skin, site-schema) | 15+ | Acceptable (no lib facade) |
| 9 | `@/contracts/*` | 10+ | Correct (contracts as boundary) |
| 10 | `@/components/*` | 8+ | Acceptable |
| 11 | `@/layout` (facade) | 2 | Correct (json-renderer, section-layout-id) |
| 12 | `@/devtools/*` | 5+ | Acceptable |
| 13 | `@/compounds/ui/index` | 3 | Acceptable |
| 14 | `@/config/config.json` | 2 | Acceptable |
| 15 | `@/palettes` | 1 | Acceptable |
| 16 | `@/logic/registries/calculator.registry` | 3 | Acceptable (single calc surface) |
| 17 | `@/logic/actions/*` | 4+ | Internal (action-registry uses; run-calculator) |
| 18 | `@/screens/tsx-screens/*` | 10+ | Acceptable (UI) |
| 19 | `@/layout/page` | 4 | Acceptable (layout internal) |
| 20 | `@/logic/engine-system/engine-explain` | 2 | Acceptable internal |

### 1.3 Violations by file

**A) Correct (facade use)**  
- `engine/core/json-renderer.tsx` — imports from `@/layout`.  
- `logic/runtime/action-runner.ts` — imports `getActionHandler` from `@/logic/engine-system/engine-contract`.  
- `logic/flows/flow-loader.ts`, `logic/ui-bindings/engine-viewer.tsx`, `screens/tsx-screens/onboarding/engine-viewer.tsx`, `logic/flow-runtime/FlowRenderer.tsx`, `engine/onboarding/OnboardingFlowRenderer.tsx`, `engine/onboarding/IntegrationFlowEngine.tsx` — engine entry via `engine-contract`.  
- `layout/section-layout-id.ts`, `layout/resolver/layout-resolver.ts` — import from `@/layout/page` (same domain).

**B) Acceptable internal (same domain)**  
- Files under `logic/*` importing other `logic/*` (e.g. engine-registry importing engines, action-registry importing actions, flow-loader importing flows, engine-viewer importing flow-loader + engine-contract + runtime).  
- Files under `layout/*` importing `@/layout/page` or `../lib/layout` from layout/index.  
- `lib/*` importing other `lib/*`.

**C) Boundary violation (cross-domain deep import when facade exists)**  
- **Layout boundary:** `@/layout` re-exports `resolveMoleculeLayout` from `../lib/layout/molecule-layout-resolver`, but the following import `@/lib/layout/molecule-layout-resolver` directly instead of `@/layout`:
  - `compounds/ui/12-molecules/stepper.compound.tsx`
  - `compounds/ui/12-molecules/footer.compound.tsx`
  - `compounds/ui/12-molecules/avatar.compound.tsx`
  - `layout/renderer/LayoutMoleculeRenderer.tsx`
- **Engine boundary:** No direct imports of `action-registry` or `engine-registry` outside `engine-contract.ts`. Only `engine-contract` imports them.

**Summary:** 4 files violate layout facade by using `@/lib/layout/molecule-layout-resolver` instead of `@/layout`. No engine/action-registry boundary violations.

---

## SECTION 2 — ENGINE PLUG CONSISTENCY

### Expected

- **Behavior path:** behavior → action-runner → engine-contract (getActionHandler).  
- **Flow path:** flow-loader, TSX engines → engine-contract (applyEngine, getPresentation).  
- **Calculator execution:** Trunk: action-runner → run-calculator.action → calculator.registry / calculator.engine. Flow: calc-resolver → calculator.registry.executeCalc.

### Verification

- **action-registry:** Imported only by `logic/engine-system/engine-contract.ts`. All runtime action lookup goes through `getActionHandler` from engine-contract. **OK.**
- **engine-registry:** Imported only by `logic/engine-system/engine-contract.ts`. flow-loader uses static `import { applyEngine } from "@/logic/engine-system/engine-contract"`. No dynamic `engine-registry` imports remain. **OK.**
- **action-runner:** Imports `getActionHandler` from `@/logic/engine-system/engine-contract`. **OK.**

### Exceptions (not through single “engine plug”)

1. **Calculator helpers (bypass for UI/type only):**  
   - `screens/tsx-screens/onboarding/cards/ProductCalculatorCard.tsx` — imports `calculateProductCosts` from `@/logic/engines/calculator/calcs/product-calculator` and uses engine-bridge directly.  
   - `screens/tsx-screens/onboarding/cards/ExportButton.tsx` — imports type `ProductCalculatorResult` and `readEngineState` from engine-bridge; type from product-calculator.  
   So: execution of “run calculator” still goes through action or calc-resolver; these files reach into engine impl for a specific helper and types.

2. **Test only:**  
   - `screens/tsx-screens/global-scans/25x-Onboarding.Test.tsx` — imports `run25X` from `@/logic/engines/25x.engine` directly. Test-only; not trunk.

3. **calc-resolver:** Uses `@/logic/registries/calculator.registry` (executeCalc). That is the intended single calculator execution surface; calc-registry is only used by calculator.registry. **OK.**

### Conclusion

- **Single global engine plug:** Yes for runtime: behavior → action-runner → engine-contract; flow-loader and TSX flow UIs → engine-contract.  
- **No direct action-registry / engine-registry use** outside engine-contract.  
- **Minor gaps:** ProductCalculatorCard/ExportButton use product-calculator and engine-bridge for UI/helpers; one test imports 25x.engine directly. These do not break the “one surface” for normal execution.

---

## SECTION 3 — JSON-DRIVEN RUNTIME COVERAGE

| Domain | % JSON-driven (approx.) | Notes |
|--------|--------------------------|--------|
| **layout** | ~75% | screen-definitions.json, presentation-profiles.json, molecule-layouts.json, spacing-scales.json, visual-presets.json, layout-requirements.json, template-roles.json, layout-schema.json, layout-allowed-types.json, card-presets.json, hero-presets.json. **Gap:** template-profiles.ts has large hardcoded `TEMPLATES` array (~66+); lib/layout/layout-engine/region-policy.ts and composeScreen.ts have switch/if trees on experience/region (could be JSON-driven). molecule-layout-resolver.ts has switch(flow) for column/row/stacked/grid. |
| **behavior** | ~70% | behavior.json (interactions, navigations). **Gap:** behavior-runner.ts has switch(action) for go/open/close/route/back and nav variant resolution; handler resolution from JSON but nav semantics hardcoded. |
| **calculators** | ~85% | calculator-types.json; calc-registry + calculator.registry are data-driven registration. **Gap:** product-calculator.ts switch(scenarioType) (conservative/moderate/aggressive); individual calc logic in TS. |
| **presentation** | ~80% | presentation-profiles.json, visual-presets.json, spacing-scales.json, template-roles.json. **Gap:** visual-preset-resolver.ts has small EXPERIENCE_TO_PRESET map hardcoded. |
| **screen definitions** | ~90% | screen-definitions.json; screen-loader + compose-offline-screen use JSON. Some TSX screens loaded by id. |
| **requirements** | ~95% | layout-requirements.json; requirement-registry imports it. |
| **config** | ~95% | config.json; renderer-contract and state defaults use it. |
| **compounds** | ~60% | compound-definitions.json, definitions/navigation.json. Molecule layout still resolved via TS (molecule-layout-resolver + JSON). |

### Files with hardcoded switch/if trees that could be data-driven

- `lib/layout/molecule-layout-resolver.ts` — switch(flow) for column/row/stacked/grid.  
- `lib/layout/layout-engine/region-policy.ts` — switch(experience), many if (r === …) for region mapping.  
- `lib/layout/layout-engine/composeScreen.ts` — if (experience === "website"), region/content branching.  
- `lib/layout/template-profiles.ts` — entire TEMPLATES array hardcoded; prime candidate for template-profiles.json.  
- `behavior/behavior-runner.ts` — switch(action) for go/open/close/route/back; nav variant inference.  
- `logic/engines/calculator/calcs/product-calculator.ts` — switch(scenarioType) for conservative/moderate/aggressive.  
- `lib/layout/visual-preset-resolver.ts` — EXPERIENCE_TO_PRESET map (app/website/learning → preset).

---

## SECTION 4 — GLUE LAYER DETECTION

### Files that only re-export, translate shapes, or forward

| File | Classification | Notes |
|------|----------------|-------|
| `layout/index.ts` | **A) Core boundary** | Layout facade; re-exports page, component, resolver, section-layout-id, compatibility, and lib/layout presets/molecule/card. Must exist. |
| `logic/engine-system/engine-contract.ts` | **A) Core boundary** | Single engine/action surface; re-exports action-registry + engine-registry. Must exist. |
| `logic/onboarding-engines/abc.engine.ts` | **B) Absorbable** | Re-exports from logic/engines/abc.engine; engine-registry could import from engines/ directly. |
| `logic/onboarding-engines/calculator.engine.ts` | **B) Absorbable** | Same; re-export only. |
| `logic/onboarding-engines/learning.engine.ts` | **B) Absorbable** | Same. |
| `logic/onboarding-engines/summary.engine.ts` | **B) Absorbable** | Same. |
| `layout/layout-node-types.ts` | **B) Absorbable** | Re-exports from @/contracts/layout-node-types. Callers could use @/contracts. |
| `behavior/contract-verbs.ts` | **B) Absorbable** | Re-exports from @/contracts/contract-verbs. |
| `engine/types/ui-node.ts` | **B) Absorbable** | Re-exports from @/contracts/ui-node. |
| `system/contracts/SystemContract.ts` | **B) Absorbable** | Re-exports from @/contracts/SystemContract. |
| `layout/resolver/layout-resolver.ts` (getSectionLayoutId export) | **A) Core boundary** | Re-exports section-layout-id for resolver API; part of layout API. |
| `lib/layout/preset-resolver.ts` | **A) Core boundary** | Single preset facade; re-exports card, spacing, visual. Needed for layout/index. |
| `logic/registries/calculator.registry.ts` | **A) Core boundary** | Single calculator surface; re-exports from calc-registry. Must exist. |
| `engine/core/collapse-layout-nodes.ts` | **B) Absorbable** | Re-exports LAYOUT_NODE_TYPES from contracts; also contains logic. |

### Top 10 candidates for future removal (glue minimization)

1. **logic/onboarding-engines/abc.engine.ts** — Pure re-export; engine-registry can import from logic/engines/abc.engine.  
2. **logic/onboarding-engines/calculator.engine.ts** — Same.  
3. **logic/onboarding-engines/learning.engine.ts** — Same.  
4. **logic/onboarding-engines/summary.engine.ts** — Same.  
5. **layout/layout-node-types.ts** — Re-export only; migrate callers to @/contracts/layout-node-types.  
6. **behavior/contract-verbs.ts** — Re-export only; migrate to @/contracts/contract-verbs.  
7. **engine/types/ui-node.ts** — Re-export only; migrate to @/contracts/ui-node.  
8. **system/contracts/SystemContract.ts** — Re-export only; migrate to @/contracts/SystemContract.  
9. **engine/core/collapse-layout-nodes.ts** — Re-export of LAYOUT_NODE_TYPES could move to contracts or layout; file also has collapse logic.  
10. **lib/product-screen-adapter/index.ts** — Thin wrapper; could be inlined if only one consumer.

---

## SECTION 5 — STATIC CORE READINESS SCORE

| Criterion | Score (1–10) | Rationale |
|-----------|--------------|------------|
| **Import purity** | 7 | Layout facade exists and is used in json-renderer; 4 files still import @/lib/layout/molecule-layout-resolver. No engine/action-registry leaks. |
| **Single engine plug** | 9 | All runtime engine/action entry through engine-contract; flow-loader fixed. Minor: ProductCalculatorCard/ExportButton and one test touch engine impl directly. |
| **JSON centralization** | 7 | Layout, behavior, calculators, presentation, config, requirements largely JSON-driven. Gaps: template-profiles hardcoded, region-policy/composeScreen/behavior-runner/product-calculator switch/if trees. |
| **Glue minimization** | 6 | Several re-export-only modules (onboarding-engines, layout-node-types, contract-verbs, ui-node, SystemContract); can be absorbed later. |
| **Stability of trunk** | 8 | Trunk (screen-loader, json-renderer, behavior-listener, action-runner, layout, state-store) is clear; engine-contract and layout/index are stable boundaries. |

**Overall (rounded):** ~7.4 → **7/10**.

### “Can core code now remain frozen while the system evolves primarily through JSON?”

**Answer: MOSTLY**

- **Yes for:** Screen trees, flows, behavior interactions/navigations, layout requirements, presentation profiles, spacing/visual presets, calculator types, config, and organ/variant definitions. New engines/actions are added by registering in engine-registry/action-registry and wiring JSON; no need to change trunk renderer or behavior dispatch.
- **Mostly because:** (1) Template set is still hardcoded in template-profiles.ts — new templates require code change. (2) Region/experience policy and some molecule layout branches are in code; extending new experiences or regions may require TS changes. (3) A few call sites still reach into lib/layout or engine impl (molecule resolver, product-calculator); freezing “core” is still consistent if those are treated as allowed UI/helper boundaries.

---

## SECTION 6 — NEXT 3 HIGHEST-IMPACT REFACTORS

**Structural, safe, non-behavioral only.**

1. **Route all molecule layout resolution through layout facade**  
   Change the 4 boundary violations (three compounds + LayoutMoleculeRenderer) to import `resolveMoleculeLayout` from `@/layout` instead of `@/lib/layout/molecule-layout-resolver`. No behavior change; improves import purity and makes layout the single layout authority for consumers outside lib.

2. **Move template set to JSON**  
   Replace the hardcoded `TEMPLATES` array in `lib/layout/template-profiles.ts` with a single `template-profiles.json` (or equivalent) and have template-profiles.ts load and optionally type it. Enables new templates without code edits and raises JSON-driven layout coverage.

3. **Absorb onboarding-engines re-exports into engine-registry**  
   Have `engine-registry.ts` import learning, calculator, abc, summary directly from `logic/engines/*` (and calculator.engine/summary.engine/etc.) and remove the four files under `logic/onboarding-engines/` that only re-export. Reduces glue and keeps a single engine registration site; no runtime behavior change if imports are updated.

---

**END OF AUDIT**
