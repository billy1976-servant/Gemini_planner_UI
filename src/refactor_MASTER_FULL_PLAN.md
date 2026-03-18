# FULL SYSTEM REFACTOR — MASTER PLAN (RADICAL MODEL)

**Date:** 2026-02-06  
**Scope:** Entire `/src` excluding `refactor_ROUND 1`, `docs`, `cursor`, and `*.md` architecture docs.  
**Objective:** Deep unification refactor toward one trunk runtime spine, one core execution engine style, micro-engines as plugins, massive JSON consolidation, removal of redundant glue/interpreters/adapters.  
**ROUND 1:** Complete; not re-evaluated.

---

## 1. TARGET MODEL (NON-NEGOTIABLE)

| Principle | Target |
|-----------|--------|
| **Trunk** | One runtime spine: request → page → loadScreen/resolveLandingPage → doc prep → JsonRenderer → behavior-listener → state. No second main pipeline. |
| **Engine style** | One core execution engine style. Small micro-engines (layout, content, state, behavior) feed the same core; no duplicate domain engines. |
| **Modules** | Layout / content / state / behavior become modules feeding the same engine. |
| **JSON** | Massive consolidation: layout-definitions, config, contract, profiles, palettes; optional compound/organ bundle. |
| **Glue** | Remove glue/interpreters/adapters where redundant. Systems share engine logic, not duplicate engines. |

---

## 2. CURRENT STATE (FULL SCAN)

### 2.1 Engine clusters discovered

| # | Cluster | Location | Role | Merge into core? |
|---|---------|----------|------|------------------|
| 1 | **Core trunk** | engine/core (screen-loader, json-renderer, behavior-listener, layout-store, palette-*, global-scan.engine) | Primary pipeline | **Is** the core |
| 2 | **Layout resolvers** | layout/resolver, layout/page, layout/component, layout-organ; lib/layout/*-resolver | Section/molecule/organ layout | Unify under layout/ as one module |
| 3 | **Logic engines** | logic/engines (learning, calculator, abc, decision, summary, flow-router, 25x, comparison, json-skin, hi-engine-runner) | Step execution, aftermath, overlays | Plug into core; single registry |
| 4 | **Onboarding engines (duplicate)** | logic/onboarding-engines (abc, calculator, learning, summary) | Same names as logic/engines | **Remove**; use logic/engines only |
| 5 | **Engine system** | logic/engine-system (engine-registry, engine-explain) | Registry + explainability | Keep as single registry for micro-engines |
| 6 | **Runtime** | logic/runtime (action-runner, engine-bridge, interaction-controller, view/flow/landing/calc resolvers) | Actions, state bridge, resolvers | Thin to trunk; remove calc-resolver |
| 7 | **Behavior** | behavior/ (behavior-engine, behavior-runner, behavior-verb-resolver) | Intent → execution | Single behavior module; already called by core |
| 8 | **Lib layout-engine** | lib/layout/layout-engine (composeScreen, region-policy) | Screen composition (secondary) | Document as secondary or fold into layout module |
| 9 | **Engine onboarding TSX** | engine/onboarding (IntegrationFlowEngine, OnboardingFlowRenderer) | Flow UI | Secondary; consume logic/engines |
| 10 | **Engine runners** | engine/runners (engine-runner.tsx) | Event hicurv.app.load | DEAD/PARTIAL; document only |
| 11 | **System7** | engine/system7 (router, channels, sensors) | Separate system | Isolate; not trunk |
| 12 | **Site runtime** | engine/site-runtime (GeneratedSiteViewer) | Generated sites | Secondary pipeline |
| 13 | **Site compilers/skins** | lib/site-compiler, lib/site-skin, lib/site-engines | Build-time / skin application | Secondary; keep as build/runtime overlay |
| 14 | **TSX onboarding screens** | screens/tsx-screens/onboarding (OnboardingEngine*, integration-flow-engine) | Multiple TSX engines | Consolidate to single flow entry; use logic/engines |
| 15 | **Map (old)** | map (old)/engine | Legacy | No merge; document legacy |
| 16 | **UI global** | components/9-atoms/engine (ui-global-engine) | UI atom engine | Keep as component; not duplicate engine |

**Summary:** **16** engine clusters. **1** is core. **4–5** (layout, behavior, logic/runtime, logic/engines, engine-system) unify into one trunk + one micro-engine plug-in surface. **2** duplicate/legacy (onboarding-engines, calc-resolver) remove. **3** secondary (site-runtime, system7, lib layout-engine) stay but documented as non-trunk. **2** dead/legacy (engine-runner, map (old)) document only.

### 2.2 How many merge into core

| Merge | Count | Description |
|-------|-------|-------------|
| **Authority into trunk** | 1 | Single layout authority (getSectionLayoutId + resolveLayout) in layout/; single content entry (logic/content); state/behavior already single. |
| **Resolvers** | 6+ → 1 ladder | Layout: one public API. Content: one entry (logic/content). Calc: remove. Flow/view/landing: keep as secondary entrypoints. |
| **Registries** | 8 → 4 | Component (engine/core); action (logic/runtime); engine (logic/engine-system); calculator + calc-registry → one. |
| **Engine execution** | 2 sets → 1 | logic/engines only; logic/onboarding-engines removed or re-exported from logic/engines. |
| **Glue/adapters** | ~10 → minimal | engine-bridge (keep), runtime-verb-interpreter (keep), persistence-adapter (keep); remove or fold: redundant content resolver, calc-resolver; document bridge roles. |

### 2.3 JSON cluster counts (before / after)

| Cluster | Before (approx) | After (target) | Round |
|---------|------------------|----------------|-------|
| Layout page/component/templates | 3 | 1–2 | R2 |
| Layout molecule definitions | 4 | 1 | R2 |
| Layout presets (spacing, visual, card, hero) | 15+ | 3–5 | R2–R3 |
| Layout requirements | 4 | 1 (optional) | R3 |
| Presentation profiles | 3 | 1 | R2 |
| Compounds definitions | 13 | 1 (optional) | R3 |
| Config | 3 | 1–3 | R3 |
| Palettes | 10 | 1 index or bundle | R3 |
| Contract schema | 1 | 1 | — |
| Organs variants | 60+ | 60 or 1 bundle | R3 optional |
| Logic (flows, calculator-types) | 20+ | unchanged or bundle | R3 |
| Apps-offline / content | 70+ | no structural change | Out of scope |
| **Core pipeline JSON (total)** | **~100+** | **~10–20** | R2+R3 |

### 2.4 Estimated file count impact

| Area | Current (approx) | After R2 | After R3 | Notes |
|------|-------------------|-----------|----------|--------|
| layout/ (ts + json) | ~25 | ~20 | ~12 | getSectionLayoutId; merge JSON |
| logic/runtime + resolvers | ~15 | ~12 | ~10 | Remove calc-resolver; document optional |
| logic/engines + registries | ~35 | ~33 | ~30 | Remove onboarding-engines duplicate; single calc registration |
| engine/core | ~18 | ~18 | ~18 | No reduction; trunk |
| Registries (all) | 8 | 6 | 4 | Calculator merge; naming |
| JSON (core pipeline) | ~100+ | ~50 | ~10–20 | Aggressive merge |
| **Total src (key surfaces, excl. apps-offline)** | **~250+** | **~230** | **~200** | Trunk “core” files ~10 TS + ~10 JSON |

### 2.5 Risk level per round

| Round | Risk level | Main risks |
|-------|------------|------------|
| **R2** | **Medium** | Layout authority move (getSectionLayoutId) can break JsonRenderer; content/ calc removal can break unknown imports; calculator registry merge can break flows. |
| **R3** | **High** | Core engine unification touches execution path; JSON compression can break loaders; glue removal can break secondary paths (site skin, flow). |

---

## 3. REMAINING ROUNDS OVERVIEW

| Round | Purpose | Unifies | Collapses into trunk | Engine clusters merged | JSON stage | Risk |
|-------|---------|---------|------------------------|-------------------------|------------|------|
| **R2** | Authority collapse, resolver/registry consolidation, spine tightening | Layout section id; content/calc; calculator registration | getSectionLayoutId in layout/; single content entry; single calc registration | Layout authority; resolver count | JSON cluster merge stage 1 (layout-definitions, presentation, optional presets) | Medium |
| **R3** | Core engine unification, shared execution pipeline, duplicate engines removal, major JSON compression, glue reduction | Single execution style; one engine registry; layout/content/state/behavior as modules | Trunk spine documented and enforced; duplicate engines removed; glue documented or removed | logic/engines only; onboarding-engines removed or re-export; single engine plug-in surface | JSON compression stage 2 (molecule, presets, compounds, config, palettes); optional organ bundle | High |

---

## 4. ROUND 2 SUMMARY

- **Purpose:** Authority collapse; resolver unification; registry consolidation; runtime spine tightening; JSON cluster merge stage 1.
- **Key deliverables:** getSectionLayoutId in layout/; content/content-resolver removed or stubbed; calc-resolver removed or optional; calculator + calc-registry → one registration; layout-definitions (page+component+templates) merged; presentation-profiles merged.
- **File impact:** layout +2–3 files; content −1; logic/runtime −1; calculator 2–4 files consolidated; JSON −5 to −10.
- **Detail:** See `refactor_ROUND 2/MASTER_ROUND2_PLAN.md`.

---

## 5. ROUND 3 SUMMARY

- **Purpose:** Core engine unification; shared execution pipeline; duplicate domain engines removal; major JSON compression stage 2; glue layer removal.
- **Key deliverables:** Single runtime pipeline documented and enforced; single authority per domain; logic/onboarding-engines removed or re-exported from logic/engines; minimal JSON surface (layout-definitions, molecule, config, contract, palettes, optional compound/organ bundle); redundant glue removed or documented.
- **File impact:** logic/engines consolidated; ~10 core trunk TS files + ~10 core JSON; total key surfaces reduced to ~200.
- **Detail:** See `refactor_ROUND 3/MASTER_PLAN.md`.

---

## 6. DEPENDENCIES

- **R2** depends on: R1 complete (done). No code dependency on R1 deliverables; R2 builds on current trunk.
- **R3** depends on: R2 complete (getSectionLayoutId, content/calc cleanup, calculator registry merged, JSON stage 1). R3 pipeline unification locks R2 authority; JSON stage 2 completes merge.

---

## 7. OUT OF SCOPE (ALL ROUNDS)

- Re-evaluation of ROUND 1.
- Removal of secondary pipelines (GeneratedSiteViewer, SiteSkin, flow-loader); only document and isolate.
- Structural migration of apps-offline or content/sites beyond optional organ bundle.
- New features; structure and consolidation only.

---

*End of refactor_MASTER_FULL_PLAN.md*
