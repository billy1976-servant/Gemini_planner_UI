# ROUND 2 — Execution Master Plan

**Authoritative plan:** [../MASTER_ROUND2_PLAN.md](../MASTER_ROUND2_PLAN.md) (Structural Unification — ~120 files). This doc is the phase index; scope and order follow MASTER_ROUND2_PLAN.md.

**Goal:** Structural consolidation only. Reduce duplication and surface area **without** changing runtime behavior. Prepares for ROUND 3; does not unify engines or rewrite pipeline.

**Scope:** Authority consolidation, resolver surface reduction, registry consolidation, JSON Stage 1 plan, dead path removal, single public entry per domain.

**DO NOT:** Change runtime pipeline; change screen JSON contract; rewrite engine/core; create second pipeline; touch apps-offline/content bulk systems.

---

## 1. What gets merged

| Merge | From | To |
|-------|------|-----|
| Section layout id resolution | applyProfileToNode (JsonRenderer) + getDefaultSectionLayoutId (page) + template/profile | layout.getSectionLayoutId(screenKey, sectionKey, node, templateId, overrides) in layout/ |
| Calculator registration | logic/registries/calculator.registry.ts + logic/engines/calculator/calcs/calc-registry.ts | One module: single public API (getCalculator, getCalc, registerCalc, executeCalc) |
| Layout definitions (JSON) | layout/page/page-layouts.json, templates.json, layout/component/component-layouts.json | One or two files: layout-definitions.json (or page.json + component.json) |
| Molecule layouts (JSON) | lib/layout/definitions-molecule/*.json (4) | One molecule-layouts.json |
| Card presets (JSON) | lib/layout/card-presets/*.json (6) | One card-presets.json |
| Presentation profiles (JSON) | lib/layout/presentation/*.profile.json (3) | One presentation-profiles.json |

---

## 2. What gets removed (or stubbed)

| Item | Action |
|------|--------|
| content/content-resolver.ts | Remove or stub with @deprecated; ensure zero runtime imports. |
| logic/runtime/calc-resolver.ts | Remove or document "optional; not on main JSON screen path." |
| content/*.content.json (if content-resolver removed) | Document as legacy or remove if unused. |

**Not removed in R2:** ScreenRenderer (document DEAD); logic/onboarding-engines (document duplicate; remove in R3).

---

## 3. Single authority per domain (after R2)

| Domain | Single authority | Location |
|--------|-------------------|----------|
| Layout (section id + definition) | layout/resolver | getSectionLayoutId + resolveLayout in layout/; JsonRenderer calls layout API only. |
| Content | logic/content/content-resolver | Single entrypoint; content/ removed or stubbed. |
| State | state-resolver | No change. |
| Behavior | behavior-listener + action-registry | No change. |
| Component map (type → React) | engine/core/registry.tsx | No change. |
| Calculator/calc | One module | Single registration + lookup (merged from calculator.registry + calc-registry). |
| Organs | organs/organ-registry.ts | No change. |
| Actions | logic/runtime/action-registry.ts | No change. |

---

## 4. Estimated file reduction

| Area | Before | After (est.) | Change |
|------|--------|--------------|--------|
| content/ | content-resolver.ts + 3 content JSON | Stub or 0 TS + 0–3 JSON | −1 TS; optional −3 JSON |
| logic/runtime | calc-resolver.ts | Removed or doc-only | −1 file |
| layout/ | 3 layout JSON (page, component, templates) | 1–2 JSON | −1 to −2 files |
| lib/layout | 4 molecule + 6 card + 3 profile | 1 + 1 + 1 | −10 JSON files (merge) |
| logic/registries + calculator/calcs | 2 registry modules | 1 module | −1 file (merge) |
| **Total (conservative)** | — | **~5–10 files** removed/merged | Net reduction ~5–10 |
| **Trunk authority** | — | +1 (getSectionLayoutId) | One new function in layout |

---

## 5. Risk level per change

| Change | Risk | Mitigation |
|--------|------|------------|
| getSectionLayoutId in layout/ | **Low** | Pure move of logic; JsonRenderer calls layout API; same behavior; test applyProfileToNode. |
| Remove/stub content/content-resolver | **Low** | Grep all imports; remove or stub only when zero imports. |
| Remove/document calc-resolver | **Low** | No main-path callers; grep; document or delete. |
| Calculator registry merge | **Medium** | Single registration surface; migrate both call sites; run calculator tests. |
| JSON layout-definitions merge | **Low** | Loader reads new shape; same data; test layout resolution. |
| JSON molecule/card/profile merge | **Low** | Resolvers read from new files; test presets and profiles. |
| Override aggregation (optional getLayoutOverrides) | **Low** | Optional; can wrap existing getters. |

---

## 6. Execution order

| Phase | Name | Content |
|-------|------|---------|
| 1 | **01_authority_collapse** | Add getSectionLayoutId in layout/; layout owns section layout id resolution; JsonRenderer calls it. |
| 2 | **02_resolver_unification** | Content: remove or stub content/content-resolver; ensure logic/content only. Calc: remove or document calc-resolver. |
| 3 | **03_registry_merge** | Calculator + calc-registry → one module; single public API. |
| 4 | **04_runtime_entry_simplification** | JsonRenderer uses layout.getSectionLayoutId; no new entrypoints. |
| 5 | **05_layout_decision_consolidation** | Document authority ladder (override → node → template → undefined); optional profile consumed by layout. |
| 6 | **06_json_cluster_reduction** | Merge layout-definitions (page+component+templates); molecule-layouts; card-presets; presentation-profiles. |
| 7 | **07_dead_path_removal** | content/content-resolver stub/remove; calc-resolver remove or optional. |
| 8 | **08_contract_reseal** | Update contracts/docs: single layout authority, single content entrypoint, registry/catalog distinction. |
| 9 | **09_validation** | Reachability + critical path tests; boundary checklist. |
| 10 | **10_integrity_pass** | Full test run; sign-off. |

---

## 7. Out of scope (ROUND 2)

- Do **not** unify engines (logic/engines vs onboarding-engines → R3).
- Do **not** rewrite pipeline or move to single-engine architecture.
- Do **not** change screen JSON contract schema.
- Do **not** touch apps-offline or content bulk systems.
- Do **not** remove ScreenRenderer or secondary paths (document only).

---

## 8. Inputs (scans)

- scans/ROUND2_AUTHORITY_MAP.md
- scans/ROUND2_RESOLVER_SURFACE.md
- scans/ROUND2_REGISTRY_MAP.md
- scans/ROUND2_DEAD_PATH_REPORT.md
- scans/ROUND2_JSON_STAGE1_PLAN.md

---

*End of ROUND2_EXECUTION_MASTER_PLAN.md — full ROUND 2 master execution plan; no code changes in this deliverable.*

---

## Execution Record

Execution records (files touched, tests run, confirmation) are at the bottom of each phase doc: 01_authority_collapse.md through 10_integrity_pass.md. Phases 01–07 completed with records filled; phases 08–10 have placeholder records to fill at execution.
