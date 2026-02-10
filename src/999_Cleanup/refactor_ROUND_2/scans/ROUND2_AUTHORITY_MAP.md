# ROUND 2 — Authority Collapse Map

**Purpose:** Identify where multiple modules own the same responsibility. Planning only — no code changes.

**Domains:** layout | contracts | registries | engines | config

---

## 1. Layout authority

| Responsibility | Current owner(s) | Duplication / split |
|----------------|------------------|----------------------|
| Page layout id | layout/page/page-layout-resolver.ts (getPageLayoutId, getDefaultSectionLayoutId) | Single; consumed by layout/resolver. |
| Section layout **id** (override ?? node ?? template) | engine/core/json-renderer.tsx (applyProfileToNode inline) | **Split:** id decided in engine; definition from layout. |
| Section layout **definition** | layout/resolver/layout-resolver.ts (resolveLayout) | Single public API. |
| Default section layout from template | layout/page (getDefaultSectionLayoutId) + lib/layout/profile-resolver (getTemplateProfile) | **Split:** page + profile; JsonRenderer applies. |
| Component layout | layout/component/component-layout-resolver.ts | Internal to layout; no duplicate. |
| Molecule layout | lib/layout/molecule-layout-resolver.ts | Used by LayoutMoleculeRenderer; single. |
| Organ internal layout | layout-organ/organ-layout-resolver.ts | Single; separate domain. |

**Collapse target:** Section layout **id** resolution (override ?? node.layout ?? templateDefault) lives in JsonRenderer. Move to layout/ as `getSectionLayoutId(screenKey, sectionKey, node, templateId, overrides)` so layout is single authority for both "which id" and "which definition."

---

## 2. Contracts authority

| Responsibility | Current owner(s) | Duplication / split |
|----------------|------------------|----------------------|
| Screen JSON contract | contracts/ (JSON_SCREEN_CONTRACT.json, SystemContract.ts) | Also referenced in src/system/contracts/SystemContract.ts. |
| Layout node types | contracts/layout-node-types.ts, src/layout/layout-node-types.ts, engine/types/ui-node.ts | **Multiple:** contracts/, layout/, engine/types. |
| Contract verbs | behavior/contract-verbs.ts, contracts/contract-verbs.ts | **Duplicate:** two contract-verbs surfaces. |
| UI node type | contracts/ui-node.ts, engine/types/ui-node.ts | **Duplicate:** two ui-node definitions. |

**Collapse target (document only in R2):** Single contract type source (contracts/ or engine/types); document which is canonical. No schema change.

---

## 3. Registries authority

| Registry | Location | Responsibility | Duplication |
|----------|----------|----------------|-------------|
| Component (type → React) | engine/core/registry.tsx | JsonRenderer node type → component | Single. |
| Calculator definitions (id → JSON) | logic/registries/calculator.registry.ts | getCalculator, listCalculators | **Split:** calculator.registry = JSON; calc-registry = functions. |
| Calc registration (id → fn) | logic/engines/calculator/calcs/calc-registry.ts | registerCalc, getCalc, executeCalc | **Split:** two registration surfaces for "calculator" domain. |
| Organ variants | organs/organ-registry.ts | getOrganLabel, loadOrganVariant | Single. |
| Action handlers | logic/runtime/action-registry.ts | Action name → handler | Single. |
| Engine (flow) | logic/engine-system/engine-registry.ts | Engine id → engine + presentation | Single (secondary path). |
| Requirement (layout) | layout/compatibility/requirement-registry.ts | Layout requirements | Single. |
| Control | logic/controllers/control-registry.ts | Control registry | Single (secondary). |
| Compound definitions (type → JSON) | compounds/ui/definitions/registry.ts | Type → JSON definition | Single. |

**Collapse target:** Calculator: one public API for "calc" registration (either logic/registries/calculator.ts or logic/engines/calculator/calcs/calc-registry.ts); migrate both calculator.registry (JSON lookup) and calc-registry (fn registration) into single module or clear split (JSON vs runtime registration).

---

## 4. Engines authority

| Responsibility | Current owner(s) | Duplication / split |
|----------------|------------------|----------------------|
| Micro-engines (learning, calculator, abc, summary) | logic/engines/*.engine.ts | Used by engine-registry; single. |
| Same-named engines | logic/onboarding-engines/*.engine.ts | **Duplicate:** abc, calculator, learning, summary; engine-registry imports from logic/engines only. |
| Engine execution (main path) | action-registry → runCalculator, resolveOnboarding, etc. | Single. |
| Engine execution (flow path) | engine-registry, flow-router, FlowRenderer | Secondary; single. |

**Collapse target (R3, not R2):** onboarding-engines removed or re-exported from logic/engines. R2: document only; do not remove.

---

## 5. Config authority

| Responsibility | Current owner(s) | Duplication / split |
|----------------|------------------|----------------------|
| Renderer contract (build-time) | config/renderer-contract.json | Single. |
| State defaults | config/state-defaults.json | Single. |
| UI verb map | config/* (if present) | Single. |

No duplication in config. Optional R2: plan merge to single config.json (keys: rendererContract, stateDefaults, ...). Do not merge yet.

---

## 6. Summary: authority collapse targets (ROUND 2)

| # | Domain | Current split | Single authority target |
|---|--------|----------------|-------------------------|
| 1 | Layout section id | JsonRenderer inline + page + profile | layout.getSectionLayoutId(...); JsonRenderer calls it. |
| 2 | Content resolution | content/content-resolver.ts (legacy) + logic/content | logic/content/content-resolver only. |
| 3 | Calculator registration | calculator.registry + calcs/calc-registry | One module: registerCalc/getCalc + getCalculator (or unified API). |
| 4 | Contract types | contracts/ vs engine/types (layout-node-types, ui-node) | Document single source; no code merge in R2. |

---

*End of ROUND2_AUTHORITY_MAP.md — scan only; no changes.*
