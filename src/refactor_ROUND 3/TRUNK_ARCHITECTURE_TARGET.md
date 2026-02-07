# ROUND 3 — Trunk Architecture Target

**Goal:** Final trunk-line architecture + JSON consolidation.  
**Prerequisite:** ROUND 2 complete. This document defines the target state; execution in a later session.

---

## 0. NON-NEGOTIABLE ARCHITECTURE RULES (HARD)

### 0.1 JsonRenderer boundary (hard rule)

- **JsonRenderer is a coordinator ONLY.** It may not own layout, preset, or config resolution logic.
- **Allowed imports only:**
  - `@/layout` (section layout id, resolveLayout — via layout public API only)
  - `@/state` (subscribeState, getState, dispatchState contract)
  - Component registry (engine/core/registry)
  - Behavior listener contract (install / event contract; no direct action-registry)
- **Forbidden imports:**
  - `@/lib/layout`
  - Molecule-layout resolvers
  - Preset resolvers (card, spacing, visual)
  - Config readers (renderer-contract, ui-verb-map, etc.)

**Freeze renderer scope:** JsonRenderer may coordinate, map node types to components, and call authorities. It may NOT: resolve layout definitions, resolve presets, or interpret config. All layout resolution flows through `@/layout` only.

### 0.2 Layout authority (hard rule)

- **ALL layout resolution must flow through `@/layout`.**
- If `lib/layout` holds data or resolvers: **layout/** is the ONLY public API; **lib/layout** is internal implementation.
- No direct imports to `lib/layout` from renderer or app. Only layout/ may import from lib/layout.

### 0.3 Single authority verification (checklist)

- Only one module may export: **deriveState** (state/state-resolver.ts).
- Only one module may export: **getSectionLayoutId** (layout/).
- Only one module may export: **resolveLayout** (layout/).
- Only one module may export the **component registry map** (engine/core/registry.tsx).
- **Contracts** must exist ONLY in **/contracts**. `system/contracts` must be re-export-only or removed.

### 0.4 Engine entry facade (structural)

- A single **engine contract facade** re-exports: action-registry and engine-registry.
- No direct imports from app layer to both action-registry and engine-registry separately. Callers use the facade for "run engine" / "get action handler" semantics.

---

## 1. Single runtime pipeline

One path from request to DOM:

```
Request (URL)
  → page.tsx (searchParams: screen | flow)
  → loadScreen(screen) | resolveLandingPage()
  → [If JSON] document prep (instance keys, expandOrgans, applySkinBindings, composeOfflineScreen)
  → JsonRenderer (single renderer for JSON screen tree)
  → layout.getSectionLayoutId + resolveLayout (section layout id + definition)
  → Section / LayoutMoleculeRenderer / Registry components
  → DOM
  → Behavior: behavior-listener → state:* | navigate | runBehavior | interpretRuntimeVerb
  → State: dispatchState → log → deriveState → subscribers
```

- **No second main pipeline.** Secondary paths (GeneratedSiteViewer, SiteSkin, flow-loader) are explicitly "not trunk"; they may reuse JsonRenderer or a different tree.
- **Single screen load entry:** loadScreen (TSX descriptor or fetch) and resolveLandingPage when no screen/flow.
- **Single renderer for JSON:** JsonRenderer only; no competing node-type→component map.

---

## 2. Single decision authority ladder

| Domain | Single authority | Location (target) |
|--------|------------------|-------------------|
| **State derivation** | deriveState(log) | state/state-resolver.ts |
| **State write** | dispatchState | state/state-store.ts |
| **Section layout id** | getSectionLayoutId(...) | layout/ (after R2) |
| **Layout definition** | resolveLayout(layoutId, context) | layout/resolver/layout-resolver.ts |
| **Component type → React** | Registry | engine/core/registry.tsx |
| **Behavior dispatch** | behavior-listener → state \| navigate \| runBehavior \| interpretRuntimeVerb | engine/core/behavior-listener.ts |
| **Action execution** | action-registry → handler | logic/runtime/action-registry.ts |
| **Screen/content** | loadScreen, resolveLandingPage | app/page.tsx, engine/core/screen-loader.ts, logic/runtime/landing-page-resolver.ts |

No duplicate authority in any domain. Layout "id" and "definition" are both under layout/; state under state/; behavior under behavior-listener + action-registry.

---

## 3. Minimal JSON surface model

Target: reduce core pipeline JSON to a small, named set.

| Surface | Purpose | Target count |
|---------|---------|--------------|
| **Layout definitions** | Page + component layout (containerWidth, moleculeLayout) | 1–2 files |
| **Layout molecule** | Column/row/grid/stacked definitions | 1 file |
| **Presentation profiles** | Experience/template section defaults | 1 file |
| **Config** | state-defaults, renderer-contract, ui-verb-map | 1–3 files (or 1 config.json) |
| **Contract schema** | JSON_SCREEN_CONTRACT.json | 1 file |
| **Palettes** | Theme tokens | 1 index or 1 bundle |
| **Compound definitions** | Param/defaults per molecule (optional single manifest) | 1 or 13 |
| **Organs** | Variants (optional build-time bundle) | 60+ files or 1 bundle |

Core "trunk" JSON: layout-definitions, molecule-layouts, presentation-profiles, config, contract schema, palettes. Optional: single compound-definitions.json, single organs bundle.

---

## 4. Final structure target

### 4.1 Directory layout (conceptual)

- **app/** — page.tsx, layout.tsx, api (unchanged).
- **engine/core/** — screen-loader, json-renderer, registry, behavior-listener, layout-store, palette (unchanged roles).
- **state/** — state-store, state-resolver, section-layout-preset-store, organ-internal-layout-store (unchanged).
- **layout/** — Single module: resolveLayout, getSectionLayoutId; data from layout-definitions (and optionally molecule-layouts, presentation-profiles under layout/data or lib/layout).
- **logic/runtime/** — action-registry, action-runner, landing-page-resolver, flow-resolver, engine-bridge, runtime-verb-interpreter (unchanged roles).
- **logic/content/** — content-resolver only (content/ legacy removed in R2).
- **contracts/** — Narrative + JSON_SCREEN_CONTRACT.json; no sprawl.
- **config/** — state-defaults, renderer-contract, ui-verb-map (or single config).

### 4.2 File count reduction strategy (100 → ~10)

- **"~10"** refers to *core trunk files* that define the pipeline and authority, not total project files.
- **Trunk files (conceptual):** page.tsx, screen-loader, json-renderer, registry, behavior-listener, state-store, state-resolver, layout-resolver (or layout index), action-registry, landing-page-resolver. Plus a small set of JSON "surfaces" (layout-definitions, config, contract).
- **Reduction:** (1) Merge JSON so that layout, config, and contract are 3–5 files total. (2) Keep organs/ and apps-offline as content; optional bundle for organs. (3) No new files; collapse duplicates and dead paths so that the *authority* is in ~10 core modules and ~10 core JSON/data files.

Interpretation: **~10 core TypeScript modules** (entry + engine + state + layout + behavior + logic entrypoints) + **~10 core JSON/data files** (layout, config, contract, palettes, profiles). Total "trunk" ~20 files; rest are components, compounds, organs content, apps-offline, scripts.

---

## 5. Out of scope for ROUND 3 (explicit)

- No removal of secondary pipelines (GeneratedSiteViewer, SiteSkin, flow-loader).
- No change to Next.js or app router structure.
- No migration of apps-offline or content/sites beyond optional organs bundle.
- No new features; structure and consolidation only.

---

*End of TRUNK_ARCHITECTURE_TARGET.md*
