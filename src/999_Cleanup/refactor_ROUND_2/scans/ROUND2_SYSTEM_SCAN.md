# ROUND 2 — Full System Scan

**Date:** 2026-02-06  
**Scope:** Entire `/src` except `/src/refactor_ROUND 1` and `/src/docs` (no re-evaluation of existing contracts).  
**Purpose:** Planning only; no runtime edits, no deletions, no migrations.

---

## 1. Scan boundaries

| In scope | Out of scope |
|----------|--------------|
| app, behavior, compiler, components, compounds, config, content, contracts, engine, layout, layout-organ, lib, logic, organs, palettes, registry, scans, scripts, state, system, system-architecture, system-reports, types, ui, ux, web2extractor, diagnostics, dev, devtools | refactor_ROUND 1, docs |

---

## 2. Duplicate authorities (summary)

### 2.1 Layout decisions

| Authority | Location | Role |
|-----------|----------|------|
| **Unified layout resolver** | `layout/resolver/layout-resolver.ts` | resolveLayout(layout, context) → LayoutDefinition; calls page + component. |
| **Page layout** | `layout/page/page-layout-resolver.ts` | getPageLayoutId, getPageLayoutById, getDefaultSectionLayoutId; page-layouts.json, templates.json. |
| **Component layout** | `layout/component/component-layout-resolver.ts` | resolveComponentLayout(layoutId); component-layouts.json. |
| **Profile layout** | `lib/layout/profile-resolver.ts` | getExperienceProfile, resolveProfileLayout(profileId, role); presentation/*.profile.json. |
| **Molecule layout** | `lib/layout/molecule-layout-resolver.ts` | resolveMoleculeLayout; LAYOUT_DEFINITIONS from definitions-molecule/*.json. |
| **Organ internal layout** | `layout-organ/organ-layout-resolver.ts` | getOrganLayoutProfile, resolveInternalLayoutId; organ-layout-profiles.json. |
| **Override application** | `engine/core/json-renderer.tsx` (applyProfileToNode) | overrideId ?? node.layout ?? templateDefaultLayoutId; reads sectionLayoutPresetOverrides, etc. |

**Finding:** Multiple layout decision points. Unified resolver is the single call site for section layout (page + component merge), but profile, molecule, and organ layout are separate chains. Override application lives in JsonRenderer.

### 2.2 Resolver chains

| Resolver | File(s) | Consumed by |
|----------|---------|-------------|
| **State** | `state/state-resolver.ts` | deriveState(log) → DerivedState; getState() consumers. |
| **Layout** | `layout/resolver/layout-resolver.ts` | Section compound, LayoutMoleculeRenderer. |
| **Profile** | `lib/layout/profile-resolver.ts` | page.tsx (getExperienceProfile, getTemplateProfile) → JsonRenderer profileOverride. |
| **Content** | `logic/content/content-resolver.ts` (active) | landing-page-resolver, education-resolver. |
| **Content (legacy)** | `content/content-resolver.ts` | Unused; @deprecated; logic/content is single entrypoint. |
| **Flow** | `logic/runtime/flow-resolver.ts` | resolveView(flowId, derived). |
| **Landing page** | `logic/runtime/landing-page-resolver.ts` | page.tsx when no screen/flow. |
| **View** | `logic/runtime/view-resolver.ts` | resolveImmediateView, resolveExpandedView, resolveExportView. |
| **Organ** | `organs/resolve-organs.ts` | expandOrgansInDocument (page.tsx doc prep). |
| **Palette/token** | `engine/core/palette-resolver.ts`, `palette-resolve-token.ts` | Compound params resolution. |
| **Calc** | `logic/runtime/calc-resolver.ts` | No callers on main path; legacy/unused. |

**Finding:** Resolver chains are numerous; content has two files (one dead). Calc-resolver is unused. Profile and layout are separate; layout-resolver does not use profile-resolver (page uses profile for template/experience, then passes to JsonRenderer).

### 2.3 Registry ownership

| Registry | Location | Purpose |
|----------|----------|---------|
| **Component (UI)** | `engine/core/registry.tsx` | node.type → React component; JsonRenderer only. |
| **Compound definitions** | `compounds/ui/definitions/registry.ts` | type → JSON definition (avatar, button, card, …). |
| **Organ variants** | `organs/organ-registry.ts` | VARIANTS map; getOrganIds, getVariantIds, loadOrganVariant. |
| **Layout compatibility** | `layout/compatibility/requirement-registry.ts` | Requirement registry for compatibility. |
| **Logic control** | `logic/controllers/control-registry.ts` | Control registry. |
| **Logic action** | `logic/runtime/action-registry.ts` | Action name → handler (runCalculator, resolveOnboarding, etc.). |
| **Logic engine** | `logic/engine-system/engine-registry.ts` | Engine registry (secondary/disconnected paths). |
| **Calculator** | `logic/registries/calculator.registry.ts`, `logic/engines/calculator/calcs/calc-registry.ts` | Calc registration. |

**Finding:** Multiple registries; engine/core/registry.tsx is the single type→component map for JSON. Compound definitions and organ variants are data catalogs. Logic has action-registry (main path), engine-registry (secondary), and calc registries.

### 2.4 Runtime decision points

| Point | Location | Decision |
|-------|----------|----------|
| **Screen load** | `app/page.tsx` | loadScreen(screen) vs resolveLandingPage(); TSX vs JSON. |
| **Section layout id** | `engine/core/json-renderer.tsx` (applyProfileToNode) | overrideId ?? node.layout ?? templateDefaultLayoutId. |
| **Layout definition** | `layout/resolver/layout-resolver.ts` | getPageLayoutId → getPageLayoutById + resolveComponentLayout. |
| **Behavior branch** | `engine/core/behavior-listener.ts` | state:* → dispatchState; navigate → navigate(); contract verbs → runBehavior; else interpretRuntimeVerb. |
| **Action** | `logic/runtime/action-registry.ts` | getActionHandler(action.name). |
| **State derivation** | `state/state-resolver.ts` | deriveState(log) → currentView, journal, values, layoutByScreen, scans, interactions. |

**Finding:** Section layout id is decided in JsonRenderer (applyProfileToNode); layout definition is decided in layout-resolver. Two-step decision (id → definition) is clear; authority for "which id" is split between override stores, node, template default.

---

## 3. Parallel systems (summary)

| System | Role | Entry | Status |
|--------|------|-------|--------|
| **JsonRenderer** | Primary JSON screen renderer | page.tsx → loadScreen → doc prep → JsonRenderer | PRIMARY |
| **renderFromSchema** | Site/website block rendering | GeneratedSiteViewer, applyEngineOverlays | SECONDARY |
| **GeneratedSiteViewer** | Generated-websites screens | loadScreen("tsx:...") → SiteGeneratedScreen → GeneratedSiteViewer | SECONDARY |
| **SiteSkin** | Shells; collectRegionSections → JsonRenderer per region | Skin flows, preview | SECONDARY |
| **EngineRunner** | Event-only; hicurv.app.load → mount JsonRenderer | Not on page → loadScreen path | DEAD / PARTIAL |
| **ScreenRenderer** | loadScreenConfig, alternate screen path | screens/core/ScreenRenderer.tsx | DEAD |
| **content/content-resolver** | Legacy resolveContent(kind, key, valueOverride) | Unused | LEGACY |
| **calc-resolver** | resolveCalcs(flow) | No callers | UNUSED |
| **FlowRenderer / flow-loader** | Flow JSON rendering | TSX/flow path only | SECONDARY |

**Finding:** Single primary path (page → loadScreen → JsonRenderer). Secondary paths (GeneratedSiteViewer, SiteSkin, renderFromSchema) share JsonRenderer or a different render tree. Dead/legacy: ScreenRenderer, content/content-resolver, calc-resolver.

---

## 4. JSON sprawl (summary)

### 4.1 Clusters

| Cluster | Root(s) | Count (approx) | Notes |
|---------|---------|----------------|--------|
| **Layout page/component** | layout/page, layout/component | 3 (page-layouts, templates, component-layouts) | Could merge to single layout-definitions surface. |
| **Layout requirements** | layout/requirements | 4 (section, card, organ-internal, SLOT_NAMES) | Compatibility; keep or merge. |
| **Layout molecule definitions** | lib/layout/definitions-molecule | 4 (column, row, stacked, grid) | Used by molecule-layout-resolver. |
| **Layout presets** | lib/layout (spacing-scales, visual-presets, card-presets, hero-presets) | 15+ | Multiple small JSONs. |
| **Layout presentation** | lib/layout/presentation | 3 (website, app, learning .profile.json) | Profile resolver. |
| **Organs** | organs/*/variants, organs/*/manifest | 60+ | Per-organ variants; manifest.json per organ. |
| **Compounds** | compounds/ui/definitions | 13 (avatar, button, card, …) | registry.ts re-exports. |
| **Config** | config | 3 (renderer-contract, state-defaults, ui-verb-map) | Small. |
| **Palettes** | palettes | 10 | index.ts re-exports. |
| **Apps-offline** | apps-offline/apps, apps-offline/sites | 70+ | App/site JSON; content. |
| **Contracts** | contracts | 1 (JSON_SCREEN_CONTRACT.json) | Schema surface. |
| **Logic** | logic/content, logic/flows, logic/engines/calculator | 20+ | Flows, calculator types, content. |

### 4.2 Redundant schema surfaces

- **Layout:** page vs component layout are separate files; both feed one resolveLayout. Single merged "layout definitions" could reduce surfaces.
- **Compound definitions vs Registry:** definitions/*.json are data; Registry (registry.tsx) is component map. No redundancy; definitions could be single manifest.
- **Organ variants:** Each organ has multiple variant JSONs; organ-registry imports each. Manifest-driven single bundle would reduce file count.

### 4.3 Unused or legacy structures

- `content/content-resolver.ts` — legacy; logic/content used.
- `logic/runtime/calc-resolver.ts` — no callers.
- Flow JSON under logic/flows — used by flow-loader (secondary); not main screen path.
- `map (old)` directory — legacy map code.

---

## 5. Trunk candidates

### 5.1 Single authority paths (current)

| Domain | Single authority | File(s) |
|--------|------------------|---------|
| **State** | deriveState | state/state-resolver.ts |
| **State write** | dispatchState | state/state-store.ts |
| **Component type → React** | Registry | engine/core/registry.tsx |
| **Section layout definition** | resolveLayout (page + component merge) | layout/resolver/layout-resolver.ts |

### 5.2 Single runtime flow (current)

1. page.tsx (searchParams, loadScreen / resolveLandingPage)
2. loadScreen → screen-loader (TSX descriptor or fetch)
3. Document prep: assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen
4. JsonRenderer (applyProfileToNode → override/node/template; renderNode → Registry; Section → resolveLayout → LayoutMoleculeRenderer)
5. Behavior: behavior-listener → state:* | navigate | runBehavior | interpretRuntimeVerb
6. State: dispatchState → log → deriveState → subscribers

### 5.3 Compression opportunities

- **Layout:** One layout "authority" module that owns page + component + (optionally) profile; single JSON surface or two (page vs component) with one resolver API.
- **Registries:** Document "component registry" (engine) vs "catalogs" (definitions, organs, layout IDs); no code merge required for R2, but naming and ownership clarity.
- **Resolvers:** Content: remove or stub content/content-resolver; calc-resolver: remove or document as optional. Flow/view resolvers stay for secondary paths.
- **Override application:** Already single place (applyProfileToNode); override *sources* (section-layout-preset-store, organ-internal-layout-store) could be one "layout overrides" API.

---

## 6. File count (approx, for ROUND 3 target)

| Area | Current (approx) | Notes |
|------|------------------|--------|
| layout/*.ts + layout/**/*.json | ~25 | Merge resolvers; reduce JSON. |
| organs/*.json | 60+ | Manifest-driven bundle. |
| lib/layout/*.json | 30+ | Presets/scales into fewer files. |
| contracts + config JSON | ~5 | Keep minimal. |
| logic registries + resolvers | ~15 | Collapse to fewer entrypoints. |
| **Total src (excl. apps-offline, content/sites)** | **~100+** (key surfaces) | R3 target: ~10 "trunk" files for core pipeline. |

---

*End of ROUND2_SYSTEM_SCAN.md*
