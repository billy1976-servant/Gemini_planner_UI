# Structural Unification — Aggressive (~120 Files)

**Direction:** Middle model. One spine, one contract, no duplicate pipelines.  
**Target:** ~250 (core) → **~120 files**.  
**Out of scope:** Ultra 12-file collapse; deleting major architecture; rewriting runtime core; changing screen contract.

---

## 1. FILE REDUCTION MODEL

### Current count (core pipeline scope)

| Scope | Count | Notes |
|-------|--------|------|
| **TS/TSX (all src)** | **479** | [refactor_MASTER_SIZE_REPORT.md](../refactor_MASTER_SIZE_REPORT.md) |
| **JSON (pipeline/config/layout)** | **~100+** | Layout, config, compounds, presets, presentation, organs manifests (excl. content/apps-offline bulk) |
| **Core "system" files** | **~250–280** | TS/TSX in app, engine, layout, logic, state, contracts, behavior, organs, lib (layout/site-*), components/compounds (code), diagnostics, devtools, scans, scripts (excluding docs, cursor, refactor_*, system-reports) |

*Interpretation:* "~250 files" in your intent = core system (code that runs the pipeline). Target **~120** = aggressive merge of that core.

### Realistic target count (~120)

| Category | Current (approx) | Target | Main levers |
|----------|------------------|--------|-------------|
| Layout (resolvers + JSON) | ~35 | ~12 | Merge layout resolvers under one API; merge layout JSON clusters (see §4). |
| Logic (engines + runtime + content) | ~80 | ~35 | One engine contract; merge onboarding-engines into engines; remove dead (calc-resolver, content/content-resolver); merge calculator registries. |
| Contracts / types | ~16 | ~8 | Single contract spine (contracts/); remove system/contracts re-export; collapse layout-node-types/contract-verbs re-exports. |
| Lib (layout + site-skin + site-*) | ~45 | ~22 | Layout: merge resolvers + JSON. Site-*: merge adapters/compiler surfaces where safe. |
| Engine core + behavior + state | ~35 | ~25 | Minimal; remove EngineRunner dead path, collapse palette into one resolver surface. |
| Organs + compounds + components | ~90 | ~45 | Registry consolidation; compound definitions → one JSON; organs stay file-per-variant but resolve-organs + organ-registry single entry. |
| App, screens, devtools, scripts | ~40 | ~25 | Remove dead (ScreenRenderer); merge API routes or screens where logical. |

**Biggest consolidation wins (by impact):**

1. **Layout:** One layout authority (layout/resolver + lib/layout) → single public API + merged JSON (page + component + templates → 1; molecule 4→1; presets 15+ → 3–5; presentation 3→1). **~20–25 file reduction.**
2. **Logic engines + runtime:** One execution contract; engine-registry + action-registry as single action/engine surface; remove logic/onboarding-engines (re-export or delete); remove calc-resolver and content/content-resolver; merge calculator.registry + calc-registry. **~15–20 file reduction.**
3. **Registries:** Document "Registry" = engine/core (component map); consolidate compound definitions (13→1 JSON); single calc registration; organ-registry + resolve-organs as single organ surface. **~10–12 file reduction.**
4. **Contracts/authority:** One contract spine under contracts/; system/contracts re-exports from contracts; collapse behavior contract-verbs + layout layout-node-types to direct imports from contracts. **~5–8 file reduction.**
5. **Resolvers:** Profile into layout (or single "layout + profile" module); remove 2 dead resolvers; preset resolvers behind one facade. **~5–8 file reduction.**

---

## 2. TOP 20 HIGH-IMPACT MERGES

| # | Merge | Folders / files | Expected reduction |
|---|--------|------------------|--------------------|
| 1 | Layout definitions | layout/page (page-layouts, templates) + layout/component (component-layouts) → one `layout-definitions.json` (or layout/data/) | 3 → 1; loader surface -2 |
| 2 | Layout molecule definitions | lib/layout/definitions-molecule (4 JSON) → one `molecule-layouts.json` | 4 → 1 |
| 3 | Layout presets (card) | lib/layout/card-presets (6 JSON) → one `card-presets.json` | 6 → 1 |
| 4 | Layout presets (spacing/visual) | lib/layout/spacing-scales, visual-presets → one or two preset files | ~10 → 2 |
| 5 | Presentation profiles | lib/layout/presentation (3 .profile.json) → one `presentation-profiles.json` | 3 → 1 |
| 6 | Layout resolver surface | layout/resolver, layout/page, layout/component, lib/layout/profile-resolver → single public API in layout/ (resolveLayout + getDefaultSectionLayoutId from profile); keep impls but one entrypoint | 4 modules → 1 public API; -3 surface files |
| 7 | Compound definitions | compounds/ui/definitions (13 JSON + registry) → one `compound-definitions.json` + single registry import | 13 → 1 JSON; registry stays 1 file |
| 8 | Config | config (3 JSON) → optional single `config.json` | 3 → 1 (optional) |
| 9 | Calculator registries | logic/registries/calculator.registry, logic/engines/calculator/calcs/calc-registry → one calc registration module | 2 → 1 |
| 10 | Logic onboarding-engines | logic/onboarding-engines (4 files) → delete or re-export from logic/engines; no current imports | 4 → 0 (or 0 new files) |
| 11 | Dead resolvers | content/content-resolver (legacy), logic/runtime/calc-resolver (no callers) → remove or stub | 2 → 0 |
| 12 | Contract spine | system/contracts/SystemContract → re-export only from contracts/SystemContract; all imports from @/contracts | 1 duplicate surface → 0 |
| 13 | Layout requirements | layout/requirements (3 JSON + SLOT_NAMES) → one `requirements.json` (optional) | 4 → 1 |
| 14 | Engine contract surface | logic/engine-system + action-registry + engine-registry → one "engine contract" entry: registerEngine, getActionHandler; engines remain separate impls | No file cut; single contract entry |
| 15 | decision.engine duplicate | logic/engines/decision-engine.ts vs logic/engines/decision/decision.engine.ts → single entry (decision/); re-export or remove | 1 → 0 |
| 16 | Preset resolvers | lib/layout card-preset-resolver, spacing-scale-resolver, visual-preset-resolver → one preset-resolver (or behind layout/resolver) | 3 → 1 |
| 17 | Organ resolution surface | organs/organ-registry, organs/resolve-organs → single public API (e.g. organs/organ-api.ts) | 2 → 1 surface (impl can stay 2) |
| 18 | Palettes | palettes (10 JSON + index) → one palettes.json or single loader | 10 → 1 (optional) |
| 19 | Layout compatibility | layout/compatibility (requirement-registry, compatibility-evaluator, content-capability-extractor, index) → one compatibility module (index + one impl file) | 4 → 2 |
| 20 | TSX onboarding engines | screens/tsx-screens/onboarding (multiple engine views) → consolidate to 1–2 flow entries using logic/engines + engine-registry | ~5–8 → 2 |

**Cumulative:** These 20 merges directly remove or collapse **~50–70** files/surfaces; rest of reduction from glue removal and "single entry per domain" (fewer index/re-export files).

---

## 3. ENGINE STRUCTURE CHECK

### Single execution contract

- **Spine (unchanged):** `page → screen-loader → doc prep → JsonRenderer → layout → behavior → state` (system-architecture/02_RUNTIME_PIPELINE.md).
- **Contract:** All engines that run on the trunk are invoked via:
  - **Actions:** logic/runtime/action-registry → getActionHandler(name) → runCalculator, run25X, resolveOnboarding, etc.
  - **Behavior:** behavior-listener → interpretRuntimeVerb → action-runner → action-registry.
  - **Landing:** landing-page-resolver → readEngineState, resolveOnboardingFromAnswers, resolveContent.

No second pipeline: flow-loader, GeneratedSiteViewer, SiteSkin remain secondary; they do not define an alternate runtime.

### Engines that already follow the contract

| Engine | Entry | Contract compliance |
|--------|--------|---------------------|
| JsonSkinEngine | json-renderer → renderNode | Yes (component map) |
| action-registry (runCalculator, run25x, resolveOnboarding) | behavior-listener → interpretRuntimeVerb | Yes |
| 25x.engine, resolve-onboarding.action, run-calculator.action | action-registry | Yes |
| Layout resolver / compatibility | json-renderer → layout | Yes |
| content-resolver (logic/content) | landing-page-resolver | Yes |
| skinBindings.apply | page.tsx | Yes |
| runtime-verb-interpreter | behavior-listener | Yes |

### Outliers (not on main path; keep but document)

| Item | Location | Status | Action |
|------|----------|--------|--------|
| engine-registry | logic/engine-system/engine-registry.ts | DISCONNECTED (flow/TSX path) | Keep; ensure all flow/onboarding flows use same "run via action or engine-registry" contract. No second pipeline. |
| FlowRenderer / flow-loader | logic/flow-runtime, logic/flows | Secondary (TSX/flow) | Keep; document as secondary. |
| GeneratedSiteViewer / renderFromSchema | engine/site-runtime, lib/site-renderer | Secondary | Keep. |
| SiteSkin | lib/site-skin | Secondary | Keep. |
| EngineRunner | engine/runners/engine-runner.tsx | DEAD (event-only, not on page tree) | Document; no removal in this pass. |
| ScreenRenderer | screens/core/ScreenRenderer.tsx | DEAD | Document; remove from build or stub. |
| logic/engines (learning, abc, decision, summary, calculator, comparison, etc.) | logic/engines/* | Used by flow-router, engine-viewer, onboarding | Standardize: all invoked via action-registry or engine-registry only; no ad-hoc "engine" entrypoints. |

### Standardization checklist

- [ ] All trunk actions go through action-registry (no direct runCalculator from outside).
- [ ] engine-registry (flow path) and action-registry (trunk) share the same ExecutionEngineContract (from contracts/SystemContract or single system contract).
- [ ] logic/onboarding-engines removed or re-exported from logic/engines so there is one engine set.
- [ ] decision-engine.ts vs decision/decision.engine.ts → single entry.

---

## 4. JSON CONSOLIDATION MAP (STAGE 2)

### Clusters to merge (priority order)

| Priority | Cluster | Current | After merge | Est. file reduction |
|----------|---------|---------|-------------|----------------------|
| P1 | Layout page + component + templates | 3 (page-layouts, templates, component-layouts) | 1 `layout-definitions.json` under layout/ | 2 |
| P1 | Layout molecule definitions | 4 (column, row, stacked, grid) | 1 `molecule-layouts.json` (lib/layout or layout/) | 3 |
| P2 | Card presets | 6 in card-presets/ | 1 `card-presets.json` | 5 |
| P2 | Presentation profiles | 3 (.profile.json) | 1 `presentation-profiles.json` | 2 |
| P2 | Spacing scales | 5 in spacing-scales/ | 1 `spacing-scales.json` | 4 |
| P2 | Visual presets | 5 in visual-presets/ | 1 `visual-presets.json` | 4 |
| P3 | Compound definitions | 13 in compounds/ui/definitions | 1 `compound-definitions.json` | 12 |
| P3 | Config | 3 in config/ | 1 config.json (optional) | 2 |
| P3 | Layout requirements | 3 (section, card, organ-internal) | 1 requirements.json (optional) | 2 |
| P4 | Palettes | 10 + index | 1 palettes.json or single loader | 9 |

### Clusters to leave as-is (this stage)

- **Organs:** Per-organ variants (60+); optional later build-time bundle; no change in Stage 2.
- **Apps-offline / content:** Bulk content; out of scope for pipeline reduction.
- **Contracts:** JSON_SCREEN_CONTRACT.json — keep single file.

### Estimated JSON file reduction (Stage 2)

| Before | After | Reduction |
|--------|--------|-----------|
| ~35 (layout + config + compounds + presentation + palettes in pipeline) | ~10–15 | **~20–25 JSON files** |

---

## 5. RUNTIME SPINE (UNCHANGED)

- **Spine:** page → screen-loader → doc prep → JsonRenderer → layout → behavior → state.
- No duplicate pipelines; no alternate runtimes.
- All engines under one execution contract (action-registry + engine-registry same contract).
- JSON authority: merged layout, config, and presets; single contract spine.

---

## 6. EXECUTION ORDER (RECOMMENDED)

1. **Authority + dead code:** Contract spine to contracts/ only; remove content/content-resolver and calc-resolver; merge calculator registries; remove or re-export logic/onboarding-engines; decision.engine single entry.
2. **Layout unification:** Single layout public API; merge layout JSON (definitions, molecule, presets, presentation); merge preset resolvers.
3. **Registry consolidation:** Compound definitions → one JSON; document Registry vs catalogs; organ single surface.
4. **JSON Stage 2:** Compound-definitions, config, requirements, palettes as above.
5. **Glue reduction:** Remove adapter layers that only connect two legacy pieces; collapse re-exports (behavior contract-verbs, layout layout-node-types → contracts).
6. **Engine contract seal:** All engines via action-registry/engine-registry; same ExecutionEngineContract; document outliers.

---

## 7. FILES TO REFERENCE

- [scans/ROUND2_SYSTEM_SCAN.md](scans/ROUND2_SYSTEM_SCAN.md) — duplicate authorities, resolvers, registries.
- [scans/JSON_COMPRESSION_MAP.md](scans/JSON_COMPRESSION_MAP.md) — JSON merge options.
- [scans/AUTHORITY_COLLAPSE_MAP.md](scans/AUTHORITY_COLLAPSE_MAP.md) — layout and resolver collapse.
- [scans/PARALLEL_SYSTEMS_REPORT.md](scans/PARALLEL_SYSTEMS_REPORT.md) — primary vs secondary paths.
- [../system-architecture/02_RUNTIME_PIPELINE.md](../system-architecture/02_RUNTIME_PIPELINE.md) — spine definition.
- [../system-architecture/03_ENGINE_SYSTEM.md](../system-architecture/03_ENGINE_SYSTEM.md) — ACTIVE vs DISCONNECTED engines.
