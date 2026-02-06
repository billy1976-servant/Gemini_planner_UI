# ROUND 2 — Registry Consolidation Map

**Purpose:** Find all registries; mark duplicates or split responsibilities. Planning only.

---

## 1. Registry inventory

| Registry | File | Responsibility | Duplicate / split? |
|----------|------|----------------|---------------------|
| **Engine (component)** | engine/core/registry.tsx | node.type → React component (JsonRenderer) | Single. No change. |
| **Calculator (JSON)** | logic/registries/calculator.registry.ts | calculatorId → JSON (getCalculator, listCalculators) | **Split:** JSON lookup here; fn registration in calc-registry. |
| **Calc (functions)** | logic/engines/calculator/calcs/calc-registry.ts | calc id → CalcDefinition (registerCalc, getCalc, executeCalc) | **Split:** runtime registration; calculator.registry is JSON. |
| **Organs** | organs/organ-registry.ts | organ/variant catalog (getOrganLabel, loadOrganVariant) | Single. No change. |
| **Compounds** | compounds/ui/definitions/registry.ts | type → JSON definition (compound UI definitions) | Single. No change. |
| **Behavior** | behavior/ (verb resolution; no central "registry" file) | Verb → execution via behavior-verb-resolver | No duplicate registry. |
| **Contracts** | contracts/index.ts, SystemContract.ts | Contract types/exports | Not a runtime registry; document only. |
| **Action** | logic/runtime/action-registry.ts | Action name → handler | Single. No change. |
| **Engine (flow)** | logic/engine-system/engine-registry.ts | Engine id → engine + presentation (TSX/flow path) | Single; secondary. No change. |
| **Requirement (layout)** | layout/compatibility/requirement-registry.ts | Layout requirements (section, card, organ-internal) | Single. No change. |
| **Control** | logic/controllers/control-registry.ts | Control registry | Single; secondary. No change. |
| **Data (atoms/molecules/palettes)** | registry/atoms.json, molecules.json, palettes.json | Static data catalogs | Naming only: "registry" folder is data; not same as engine registry. |

---

## 2. Duplicates and split responsibilities

### 2.1 Calculator + calc-registry (CONSOLIDATE)

| Module | Role | Consolidation |
|--------|------|---------------|
| logic/registries/calculator.registry.ts | Maps calculatorId → JSON definition (cleanup_labor_monthly, profit, etc.); getCalculator, listCalculators | Merge into single calculator module: either (a) one file that holds both JSON lookup and calc fn registration, or (b) calculator.registry stays for JSON; calc-registry is the only "registration" API and imports/uses calculator.registry for JSON. |
| logic/engines/calculator/calcs/calc-registry.ts | registerCalc, getCalc, executeCalc; pure function registry | Single registration surface: all callers use one module for "get calc" / "run calc"; calculator.registry becomes internal or merged. |

**Target:** One public API for calculator/calc: e.g. logic/engines/calculator/calcs/calc-registry.ts (or logic/registries/calculator.ts) exports getCalculator, getCalc, registerCalc, executeCalc; calculator.registry.ts data folded in or imported internally. No two separate "registry" modules for calc.

### 2.2 Engine registry vs component registry

- **engine/core/registry.tsx:** type → React component. Single; no duplicate.
- **logic/engine-system/engine-registry.ts:** engine id → flow engine. Different concern (flow execution). No merge.

### 2.3 Organ registry vs compound definitions

- **organs/organ-registry.ts:** organ/variant catalog. Single.
- **compounds/ui/definitions/registry.ts:** type → JSON definition. Single. No overlap.

---

## 3. Registry consolidation checklist

| Registry | Action in R2 |
|----------|--------------|
| engine/core/registry.tsx | Keep; single component map. |
| logic/registries/calculator.registry.ts | Merge with calc-registry into one module (one public entry). |
| logic/engines/calculator/calcs/calc-registry.ts | Merge with calculator.registry; single registration surface. |
| organs/organ-registry.ts | No change. |
| compounds/ui/definitions/registry.ts | No change. |
| logic/runtime/action-registry.ts | No change. |
| logic/engine-system/engine-registry.ts | No change (secondary). |
| layout/compatibility/requirement-registry.ts | No change. |
| logic/controllers/control-registry.ts | No change. |
| registry/*.json (atoms, molecules, palettes) | Document as data catalogs; not "registries" in code. |

---

## 4. Summary

- **Single consolidation in R2:** Calculator + calc-registry → one module (one public API: getCalc/getCalculator, registerCalc, executeCalc).
- **All other registries:** Single owner; no duplicate. Document "Registry" (engine component map) vs "catalogs" (definitions, organs, layout IDs) to avoid confusion.

---

*End of ROUND2_REGISTRY_MAP.md — scan only; no changes.*
