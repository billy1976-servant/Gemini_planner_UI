# Contract Consolidation Report

**Date:** 2026-02-06  
**Purpose:** Phase-ready organization; Scan 1–5 can read all contracts from `src/contracts/`.

**Runtime contract frozen as of ROUND 3.** Screen shape, layout API (getSectionLayoutId, resolveLayout), and state intents are additive-only; no breaking changes.

---

## 1) Files moved into `src/contracts/`

| File | From |
|------|------|
| `SystemContract.ts` | `src/system/contracts/` |
| `contract-verbs.ts` | `src/behavior/` |
| `layout-node-types.ts` | `src/layout/` |
| `ui-node.ts` | `src/engine/types/` |

Re-exports remain at the original paths so runtime imports are unchanged.

---

## 2) Files moved into `src/contracts/legacy/`

- *(None)*

---

## 3) Files that looked like contracts but were left in place (with reason)

| File | Reason |
|------|--------|
| `src/debug/pipelineContractTester.ts` | Defines pipeline contract types but file is primarily tester implementation (~400+ lines of logic). |
| `src/devtools/pipeline-debug-store.ts` | Defines `ContractTestStepResult` / `ContractTestResult` but file is primarily debug store implementation. |
| `src/config/renderer-contract.json` | Renderer interface; left in place to avoid changing runtime imports. |
| `src/config/state-defaults.json` | State defaults; left in place to avoid changing runtime imports. |
| `src/lib/layout/layout-allowed-types.json` | Layout schema; left in place to avoid changing runtime imports. |
| `src/lib/layout/template-roles.json` | Template roles; left in place to avoid changing runtime imports. |
| `src/logic/engines/presentation-types.ts` | Re-exports `SystemContract` only; canonical source is `SystemContract`. |
| `src/logic/products/product-types.ts` | Aliases to `SystemContract` types only. |
| `src/logic/runtime/engine-state.ts` | Type aliases to `SystemContract` only. |

---

**Outcome:** Single contract root at `src/contracts/`; all moved contracts re-exported from `src/contracts/index.ts`; existing imports resolve via re-exports at old paths.
