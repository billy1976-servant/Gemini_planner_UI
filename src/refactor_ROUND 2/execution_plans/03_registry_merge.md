# ROUND 2 — Phase 03: Registry Merge

**Goal:** Single calculator registration surface; document Registry vs catalogs.

---

## Objectives

1. **Calculator:** One module that owns "register calc" and "get calc by id." Consolidate `logic/registries/calculator.registry.ts` and `logic/engines/calculator/calcs/calc-registry.ts` (and any other calc registration) into a single registration surface.
2. **Documentation:** Document that "Registry" (engine/core/registry.tsx) is the single type→component map; definitions (compounds), organs (organ-registry), and layout IDs are "catalogs" (data only). No code change for catalogs.

---

## Acceptance criteria

- [x] Single module (e.g. logic/engines/calculator/calc-registry.ts or logic/registries/calculator.registry.ts) is the only place that registers calculator calcs; action-runner / run-calculator use that module.
- [x] No duplicate registration of the same calc in two files.
- [x] Docs (system-architecture or refactor_ROUND 2/architecture) state: Registry = component map; catalogs = definitions, organs, layout IDs.

---

## Files to touch (planning)

- logic/registries/calculator.registry.ts
- logic/engines/calculator/calcs/calc-registry.ts
- logic/engines/calculator/calculator.module.ts (or consumers of both)
- logic/actions/run-calculator.action.ts
- refactor_ROUND 2/architecture/ or system-architecture (doc)

---

## Risks

- Both registries might be used by different call paths; ensure all callers use the single surface after merge.

---

---

## Execution Record

**Summary of changes made**

- **Single calculator surface:** logic/registries/calculator.registry.ts is the single public API for all calculator/calc usage. It now re-exports getCalculator, listCalculators, hasCalculator, registerCalc, getCalc, executeCalc, and listCalcs from logic/engines/calculator/calcs/calc-registry (canon). Registration and execution both go through this surface; run-calculator and calculator.module already used it; calc-resolver now imports executeCalc from calculator.registry.
- **No duplicate registration:** All registration remains in calc-registry.ts only (CALCULATOR_REGISTRY + initializeDefaultCalcs); calculator.registry is re-export only.
- **Documentation:** Added "Registry vs catalogs" to system-architecture/06_CONTRACTS_MASTER.md: Registry = component map (registry.tsx); catalogs = definitions, organs, layout IDs, calculator.registry (data only).

**Files modified**

- src/logic/registries/calculator.registry.ts — re-export registerCalc, getCalc, executeCalc, listCalcs from calc-registry.
- src/logic/runtime/calc-resolver.ts — import executeCalc from @/logic/registries/calculator.registry.
- src/system-architecture/06_CONTRACTS_MASTER.md — new section "Registry vs catalogs."

**Tests run**

- npx playwright test tests/runtime-pipeline-contract.spec.ts — **1 passed**.

**Confirmation acceptance criteria met**

- Single module: calculator.registry.ts is the only import path for calculator calcs; action-runner/run-calculator and calc-resolver use it; implementation (registration) remains in calc-registry.ts.
- No duplicate registration: only calc-registry.ts registers calcs.
- Docs: 06_CONTRACTS_MASTER.md states Registry = component map; catalogs = definitions, organs, layout IDs, calculator.registry.

**Execution Record (short)** — **Files touched:** `src/logic/registries/calculator.registry.ts`, `src/logic/runtime/calc-resolver.ts`, `src/system-architecture/06_CONTRACTS_MASTER.md`. **Tests run:** `npx playwright test tests/runtime-pipeline-contract.spec.ts` — 1 passed. **Confirmation:** Single calculator surface (calculator.registry); no duplicate registration; Registry vs catalogs documented; acceptance criteria met.
