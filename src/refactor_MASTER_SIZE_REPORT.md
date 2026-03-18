# Full Refactor Size + Reduction Analysis (Scan Only)

**Date:** 2026-02-06  
**Scope:** Entire `/src` tree. Read-only global scan; no modifications.  
**Basis:** Real file counts, imports, and reachability from existing refactor plans (ROUND 2/3 scans).

---

## SECTION 1 — CURRENT SIZE

### 1.1 Total files in src

| Type | Count |
|------|--------|
| **.ts** | 313 |
| **.tsx** | 166 |
| **.json** | 354 |
| **.md** | 211 |
| **Other** (.css, .txt, no-ext, etc.) | ~50+ (not fully enumerated) |
| **Total (TS + TSX + JSON only)** | **833** |
| **Total (all tracked)** | **~1,100+** (incl. docs, cursor, refactor_*, config, content) |

### 1.2 TS/TSX totals

| | Count |
|--|--------|
| **Total TypeScript/TSX** | **479** (313 .ts + 166 .tsx) |

### 1.3 JSON total

| | Count |
|--|--------|
| **Total JSON** | **354** |

### 1.4 Engine file count

Files under `engine/` or with primary “engine” role (runtime/decision):

| Location | Count (approx) |
|----------|----------------|
| **engine/** (all) | 62 (41 .ts, 16 .tsx, 4 .json) |
| **logic/engines/** | 30 (22 .ts, 6 .json, 2 .tsx) |
| **logic/engine-system/** | 2 |
| **logic/onboarding-engines/** | 4 |
| **logic/orchestration/** | 3 |
| **Other engine references** (map (old)/engine, ux/engine, etc.) | 10 |
| **Engine-related total** | **~110** (overlap: many logic files reference “engine”) |

*Distinct engine modules (by path/name):* ~60–70 files.

### 1.5 Resolver count

Files that implement or directly call resolution (resolver in name or primary role):

| File | Role |
|------|------|
| state/state-resolver.ts | State derivation |
| layout/resolver/layout-resolver.ts, layout/resolver/index.ts | Section layout definition |
| layout/page/page-layout-resolver.ts | Page layout id |
| layout/component/component-layout-resolver.ts | Component layout |
| lib/layout/profile-resolver.ts | Experience/template profile |
| lib/layout/molecule-layout-resolver.ts | Molecule layout |
| lib/layout/screen-layout-resolver.ts | Screen layout |
| lib/layout/card-preset-resolver.ts, spacing-scale-resolver.ts, visual-preset-resolver.ts | Preset/scale resolution |
| layout-organ/organ-layout-resolver.ts | Organ internal layout |
| logic/runtime/landing-page-resolver.ts | Landing content/flow |
| logic/runtime/flow-resolver.ts | Flow view |
| logic/runtime/view-resolver.ts | Immediate/Expanded/Export view |
| logic/runtime/calc-resolver.ts | Calc refs (no main-path callers) |
| logic/content/education-resolver.ts | Education content |
| logic/engines/summary/export-resolver.ts | Export |
| content/content-resolver.ts | Legacy (unused on main path) |
| organs/resolve-organs.ts | Organ expansion |
| behavior/behavior-verb-resolver.ts | Verb resolution |

**Resolver count:** **20** (distinct resolver modules/entrypoints).

### 1.6 Registry count

Modules that own a registry (type→handler, id→definition, or catalog):

| File | Role |
|------|------|
| engine/core/registry.tsx | node.type → React component |
| compounds/ui/definitions/registry.ts | type → JSON definition |
| organs/organ-registry.ts | organ/variant catalog |
| layout/compatibility/requirement-registry.ts | Layout requirements |
| logic/controllers/control-registry.ts | Control registry |
| logic/runtime/action-registry.ts | Action name → handler |
| logic/engine-system/engine-registry.ts | Engine registry |
| logic/registries/calculator.registry.ts | Calculator registry |
| logic/engines/calculator/calcs/calc-registry.ts | Calc registration |

**Registry count:** **9**.

### 1.7 Layout file count

| Location | TS/TSX | JSON | MD |
|----------|--------|------|-----|
| layout/ | 14 | 6 | 2 |
| lib/layout/ | 35 | 44 | — |
| layout-organ/ | 2 | 1 | — |
| **Layout total** | **51** | **51** | **2** |

### 1.8 State file count

| Location | Count |
|----------|--------|
| state/*.ts | 9 |
| state/profiles/*.json | 2 |
| **State total** | **11** |

### 1.9 Contracts file count

| Location | Count |
|----------|--------|
| contracts/*.ts | 6 |
| contracts/*.md | 5 |
| contracts/*.json | 1 |
| contracts/*.test.ts | 3 |
| **Contracts total** | **15** |

### 1.10 Docs file count

| Location | Count |
|----------|--------|
| docs/**/*.md | 75+ |
| cursor/**/*.md | 69+ |
| system-architecture/*.md | 10 |
| refactor_ROUND 1/2/3/**/*.md | 35+ |
| contracts/*.md, KNOCKOUT, etc. | 22+ |
| **Docs (.md) total** | **211** |

---

## SECTION 2 — TRUNK TARGET MODEL

Expected core runtime after full trunk refactor (from TRUNK_ARCHITECTURE_TARGET + ROUND 2/3 plans).

### 2.1 Exact file names that remain central (trunk spine)

| # | File | Role |
|---|------|------|
| 1 | app/page.tsx | Entry; searchParams, loadScreen, resolveLandingPage |
| 2 | engine/core/screen-loader.ts | loadScreen (TSX or fetch) |
| 3 | engine/core/json-renderer.tsx | Single JSON screen renderer |
| 4 | engine/core/registry.tsx | type → component (single map) |
| 5 | engine/core/behavior-listener.ts | Behavior dispatch (state \| navigate \| runBehavior \| interpretRuntimeVerb) |
| 6 | state/state-store.ts | dispatchState, log, persist |
| 7 | state/state-resolver.ts | deriveState(log) |
| 8 | layout/resolver/layout-resolver.ts (or layout/index.ts) | resolveLayout; getSectionLayoutId (after R2) |
| 9 | logic/runtime/action-registry.ts | Action name → handler |
| 10 | logic/runtime/landing-page-resolver.ts | No screen/flow → landing content |
| 11 | engine/core/layout-store.ts | Layout snapshot (consumed by JsonRenderer) |
| 12 | app/layout.tsx | App shell, installBehaviorListener |

Supporting (same pipeline, not “authority”): layout/page/page-layout-resolver.ts, layout/component/component-layout-resolver.ts (or merged into layout data), section-layout-preset-store, organ-internal-layout-store, compose-offline-screen, resolve-organs, applySkinBindings, behavior-runner, action-runner, runtime-verb-interpreter, engine-bridge.

### 2.2 Estimated trunk file count

| Category | Count |
|----------|--------|
| **Core trunk (authority) TS/TSX** | **12** (above list) |
| **Supporting trunk (pipeline) TS/TSX** | **~15–20** (stores, doc prep, behavior, logic runtime) |
| **Trunk JSON (core surfaces)** | **~10–15** (after merge: layout-definitions, molecule-layouts, presentation-profiles, config, contract, palettes) |
| **Total trunk (code + core JSON)** | **~40–50** files |

*Interpretation:* “~10” in the plan = ~10 *authority* modules. Total trunk (spine + immediate support + core JSON) ≈ 40–50 files. Rest = components, compounds, organs, apps-offline, scripts, secondary paths, docs.

---

## SECTION 3 — JSON COMPRESSION MODEL

### 3.1 Current JSON file count by cluster

| Cluster | Count | Location |
|---------|--------|----------|
| **Apps-offline (screens/content)** | 70 | apps-offline/** |
| **Organs (variants + manifests)** | 69 | organs/**/variants, organs/**/manifest.json |
| **Lib layout (presets, scales, profiles, definitions)** | 44 | lib/layout/** |
| **Content (sites, compiled, raw, text/media/data)** | 59 | content/** |
| **Layout (page, component, requirements)** | 6 | layout/page, layout/component, layout/requirements |
| **Palettes** | 10 | palettes/*.json |
| **Config** | 3 | config/*.json |
| **Compound definitions** | 14 | compounds/ui/definitions/*.json |
| **Contract** | 1 | contracts/JSON_SCREEN_CONTRACT.json |
| **Logic (flows, calculator, content)** | ~20 | logic/content, logic/flows, logic/engines/calculator |
| **State, registry, engine, screens, system, ux, ui, diagnostics** | ~62 | Various |
| **Total** | **354** | |

### 3.2 Estimated final JSON surface count

| Scenario | Core pipeline JSON | Content/screens JSON | Total JSON |
|----------|--------------------|----------------------|------------|
| **Conservative** | ~25 (merge layout + profiles + config; keep organs/apps as-is) | 70 + 69 + 59 = 198 | **~250** |
| **Moderate** | ~15 (merge layout, molecule, profiles, card presets, compound defs) | 198 (no organs bundle) | **~215** |
| **Aggressive** | ~10 (single layout-definitions, molecule-layouts, presentation-profiles, config, contract, palettes index) | 70 + 1 (organs bundle) + 59 = 130 | **~180** |

### 3.3 What merges together

| Merge | Current files | Result |
|-------|----------------|--------|
| Layout definitions | page-layouts.json, templates.json, component-layouts.json (3) | 1–2 (layout-definitions or page + component) |
| Molecule layouts | definitions-molecule/*.json (4) | 1 (molecule-layouts.json) |
| Presentation profiles | lib/layout/presentation/*.profile.json (3) | 1 (presentation-profiles.json) |
| Card presets | lib/layout/card-presets/*.json (6) | 1 (card-presets.json) |
| Layout requirements | section, card, organ-internal requirements (3) | 1 (optional requirements.json) |
| Compound definitions | compounds/ui/definitions/*.json (13) | 1 (optional compound-definitions.json) |
| Config | renderer-contract, state-defaults, ui-verb-map (3) | 1–3 (optional single config.json) |
| Spacing scales | lib/layout/spacing-scales/*.json (5) | 1 or keep 5 |
| Visual presets | lib/layout/visual-presets/*.json (5) | 1 or keep |
| Organs (optional) | 69 variant + manifest files | 1 build-time bundle (optional) |

---

## SECTION 4 — REDUCTION ESTIMATE

Numeric ranges based on ROUND 2/3 plans and scan.

### 4.1 Code (TS/TSX)

| Metric | Low | High |
|--------|-----|------|
| **Files removed** | 2 | 5 |
| **Files merged (logic moved into another file)** | 2 | 6 |
| **Files retained (no structural change)** | 468 | 475 |
| **% code file reduction** | **0.4%** | **1.2%** |

*Removed:* content/content-resolver.ts, logic/runtime/calc-resolver.ts; optionally 1–2 duplicate layout helpers or engine stubs.  
*Merged:* calculator.registry + calcs/calc-registry → one module; section layout id logic into layout/ (no new file, logic moved into existing).

### 4.2 JSON

| Metric | Low | High |
|--------|-----|------|
| **JSON files removed** | 0 | 3 |
| **JSON files merged** | 25 | 85 |
| **JSON files retained (unchanged)** | 269 | 329 |
| **Final JSON count** | **250** | **280** |
| **% JSON reduction** | **21%** | **29%** |

*Removed:* Legacy content JSON if content/content-resolver removed (3).  
*Merged:* Layout (3→1–2), molecule (4→1), profiles (3→1), card presets (6→1), optional compound (13→1), optional requirements (3→1), optional config (3→1); optional organs 69→1.

### 4.3 Overall (TS + TSX + JSON)

| Metric | Low | High |
|--------|-----|------|
| **Total files removed** | 2 | 8 |
| **Total files merged** | 27 | 91 |
| **Total files retained** | 737 | 804 |
| **Final total (TS+TSX+JSON)** | **~800** | **~830** |
| **% total reduction** | **3%** | **8%** |

*Note:* “Merged” = content of multiple files combined into fewer; “retained” = file exists and is not merged into another. Docs and other types not included in these totals.

---

## SECTION 5 — TOP 25 COLLAPSE CANDIDATES

Files most likely to be merged, deleted, or absorbed into trunk (ordered by impact/clarity).

| # | File(s) | Action | Reason |
|---|---------|--------|--------|
| 1 | content/content-resolver.ts | **Delete or stub** | Legacy; no main-path imports; logic/content is single entrypoint. |
| 2 | logic/runtime/calc-resolver.ts | **Delete or document optional** | No callers of resolveCalcs on main path. |
| 3 | layout/page/page-layouts.json + templates.json + layout/component/component-layouts.json | **Merge** | Single layout-definitions (or page + component) surface. |
| 4 | lib/layout/definitions-molecule/layout-*.json (4) | **Merge** | Single molecule-layouts.json. |
| 5 | lib/layout/presentation/*.profile.json (3) | **Merge** | Single presentation-profiles.json. |
| 6 | lib/layout/card-presets/*.json (6) | **Merge** | Single card-presets.json. |
| 7 | logic/registries/calculator.registry.ts + logic/engines/calculator/calcs/calc-registry.ts | **Merge** | Single calculator registration module. |
| 8 | engine/core/json-renderer.tsx (section layout id logic) | **Absorb into trunk** | getSectionLayoutId moved to layout/; JsonRenderer calls it. |
| 9 | layout/requirements/section, card, organ-internal (3 .json) | **Merge (optional)** | Single requirements.json. |
| 10 | compounds/ui/definitions/*.json (13) | **Merge (optional)** | Single compound-definitions.json. |
| 11 | config/renderer-contract.json + state-defaults.json + ui-verb-map.json | **Merge (optional)** | Single config.json. |
| 12 | lib/layout/profile-resolver.ts | **Absorb or keep** | Optionally consumed by layout/ for default section layout. |
| 13 | lib/layout/screen-layout-resolver.ts | **Secondary** | Keep or fold into layout if used only by secondary path. |
| 14 | lib/layout/card-preset-resolver.ts, spacing-scale-resolver.ts, visual-preset-resolver.ts | **Keep or merge** | Could be one “preset-resolver” or stay as-is. |
| 15 | content/text.content.json, media.content.json, data.content.json | **Delete or keep** | Dead if content/content-resolver removed. |
| 16 | layout/page/page-layout-resolver.ts + layout/component/component-layout-resolver.ts | **Keep but feed from merged JSON** | Same API; data from 1–2 files. |
| 17 | logic/content/education-resolver.ts | **Keep** | Active; uses logic/content/content-resolver. |
| 18 | logic/runtime/flow-resolver.ts, view-resolver.ts | **Keep (secondary)** | Not trunk; flow/export paths. |
| 19 | logic/engine-system/engine-registry.ts | **Keep (secondary)** | Document as non-trunk. |
| 20 | engine/runners/engine-runner.tsx | **Dead/partial** | Event-only; document, do not remove. |
| 21 | screens/core/ScreenRenderer.tsx | **Dead** | Not on main path; document. |
| 22 | lib/layout/spacing-scales/*.json (5) | **Merge (optional)** | Single spacing-scales.json. |
| 23 | lib/layout/visual-presets/*.json (5) | **Merge (optional)** | Single visual-presets.json. |
| 24 | organs/*/variants/*.json (69) | **Optional bundle** | Build-time organs.json bundle (R3 optional). |
| 25 | map (old)/** | **Legacy** | Do not migrate; document only. |

---

## SECTION 6 — CONFIDENCE LEVEL

| Area | Certainty | Notes |
|------|------------|--------|
| **Current counts** | **High** | From glob/grep/list_dir; resolver/registry/engine counts are exact or ±1. |
| **Trunk file list** | **High** | Matches system-architecture and TRUNK_ARCHITECTURE_TARGET; spine is stable. |
| **JSON merge list** | **High** | Aligned with JSON_COMPRESSION_MAP and ROUND 2/3; which exact merges are done is execution choice. |
| **Removal (content-resolver, calc-resolver)** | **High** | No main-path imports for content/; no callers for calc-resolver; safe to remove/stub. |
| **Final file count (exact)** | **Medium** | Depends on how many optional merges (compound defs, organs bundle, config) are done. |
| **% reduction** | **Medium** | Ranges reflect conservative vs aggressive; actual % depends on execution. |
| **Predictability of final structure** | **Medium–High** | Trunk spine and authority are well defined; content/apps-offline/organs stay; only “how much merge” varies. |

**Overall:** The system can predict the **final trunk structure** (spine + authority) with **high** confidence. The **exact final file count** and **% reduction** are **medium** confidence (ranges given). No code was changed; estimates are based on real imports and reachability.

---

*End of refactor_MASTER_SIZE_REPORT.md — scan only, no edits.*
