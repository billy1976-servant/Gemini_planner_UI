Last refreshed: 2026-01-30T15:14:39.548Z

# SYSTEM_MASTER_MAP

**Purpose:** Single authoritative map of the HiSense system—ingested from prior analysis artifacts and verified against the current codebase. No redesign; map reality only.

**Generated:** 2026-01-30

---

## PHASE 0 — ARTIFACT INGESTION (FINDINGS FROM REPORTS)

### APPS_OFFLINE_SYSTEM_MAP.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Offline JSON screens live under `src/apps-offline/` (per-app: blueprint.txt, content.txt, app.json). Served via `/api/screens/*`. Navigator in `src/app/layout.tsx` sets `/?screen=<category>/<folder>/<file>`. `page.tsx` calls `loadScreen(screen)` from `src/engine/core/screen-loader.ts`; loader fetches `/api/screens/<normalizedPath>` and applies JSON default state via `dispatchState("state:currentView", ...)`. |
| **Renderer pipeline** | Renderer: `src/engine/core/json-renderer.tsx`. Registry: `src/engine/core/registry.tsx` (JSON `type` → React component). Per-node flow: `shouldRenderNode` → `applyProfileToNode` → definitions from `src/compounds/ui` → `resolveParams` → `resolveMoleculeLayout` → `Registry[node.type]` → recursive children; optional `Registry[node.layout.type]` wrapper. |
| **JSON vs TSX flow** | JSON: blueprint/content → blueprint.ts → app.json → loadScreen → JsonRenderer. TSX: separate path; "engine" screens use `recordInteraction` / `interpretRuntimeVerb` (logic/runtime), not the CustomEvent behavior bridge. |
| **Layout engine** | Molecule layout: `src/layout/molecule-layout-resolver.ts`. Screen layout: `src/layout/screen-layout-resolver.ts`. Structural layout components registered in `src/engine/core/registry.tsx`. |
| **Compiler status** | `npm run blueprint` → `ts-node src/scripts/blueprint.ts`. Reads blueprint.txt + content.txt per app; writes app.json. |
| **Registry structure** | Canonical runtime map in `src/engine/core/registry.tsx`; molecule definitions in `src/compounds/ui/definitions/*.json`; compound registry in `src/compounds/ui/index.ts`. |
| **Broken vs working** | CustomEvent → behavior-listener → state-store → JsonRenderer re-render is working. Separate runtime verb pipeline (TSX engine screens) exists; typo file `behavior-listerner.ts` is debug-only; app uses `src/engine/core/behavior-listener.ts`. |

### CONTRACT_GAP_REPORT.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Not primary focus. |
| **Renderer pipeline** | Runtime allows behavior on non-actionable molecules (e.g. Card dispatches navigate/action/interaction); no behavior validator. |
| **JSON vs TSX flow** | Compiler uses non-contract syntax: `(logic.action: ...)`, `state.bind`, no slot list `[...]` or behavior token `(...)`; state declared in tree (contract forbids). |
| **Layout engine** | Not primary focus. |
| **Compiler status** | Blueprint parser does not read contract outline (slots, behavior tokens); no content.manifest.txt generation; no hard validation (invented keys, missing keys, invalid behavior). |
| **Registry structure** | Button definition missing `icon` variant; molecule universe drift. |
| **Broken vs working** | Contract violations: non-actionable molecules execute behaviors; Action on molecules that contract allows only Navigation/Interaction; Card executes behavior; content.manifest missing; validation missing. |

### CONTRACT_VALIDATION_REPORT.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Scope: `src/apps-offline`. 53 files scanned, 25 with violations, 0 parse failures. |
| **Renderer pipeline** | Not detailed. |
| **JSON vs TSX flow** | Violation counts: NON_CONTRACT_ACTION_NAME: 62, STATE_DECLARED_IN_TREE: 47, EMPTY_CONTENT_OBJECT: 20, MISSING_REQUIRED_CONTENT_KEY: 17, INVALID_ACTION_VERB: 3, FORBIDDEN_BEHAVIOR_ON_MOLECULE: 1. Top offenders include track-blueprint/app.json, journal_track/app.json, state-logic-test/app.json. |
| **Layout engine** | Not primary focus. |
| **Compiler status** | Validator runs (warn-only); violations reported but do not fail pipeline. |
| **Registry structure** | Not primary focus. |
| **Broken vs working** | Validation is advisory; pipeline proof still passes. |

### NAVIGATION_PAGES_DIAGNOSTIC_REPORT.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Not primary focus. |
| **Renderer pipeline** | Site renderer uses derivedPages; Pages dropdown in GeneratedSiteViewer. |
| **JSON vs TSX flow** | Not primary focus. |
| **Layout engine** | Not primary focus. |
| **Compiler status** | `derivePagesFromNav` expected `navItem.href` but normalizeSiteData used `navItem.path`; fixed to support both. `compileSiteToSchema` uses `site.derivedPages`; schema.pages mirrors derivedPages. |
| **Registry structure** | Not primary focus. |
| **Broken vs working** | Nav/pages fix applied: derivePagesFromNav supports href/path; page type detection and logging added. |

### NORMALIZATION_DIFF.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Not primary focus. |
| **Renderer pipeline** | SiteRenderer (`src/components/siteRenderer/SiteRenderer.tsx`) normalizes model before render: `normalizeSiteModel` → product-grid section product fill, image URL rewrite (https → local asset path), product URL rewrite (slugify name). |
| **JSON vs TSX flow** | Not primary focus. |
| **Layout engine** | Not primary focus. |
| **Compiler status** | Not primary focus. |
| **Registry structure** | Not primary focus. |
| **Broken vs working** | Normalization layer added to SiteRenderer; engine logic unchanged. |

### PIPELINE_PROOF_REPORT.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Diagnostic app + linked screen load; JSON path works. |
| **Renderer pipeline** | All 12 molecules present in JSON; registry keys found for all; input-change, state update, journal write, navigation, persistence, refresh rehydrate observed; no console error during proof. |
| **JSON vs TSX flow** | Proof uses existing CustomEvent → behavior-listener → state-store wiring. |
| **Layout engine** | Not primary focus. |
| **Compiler status** | Contract validator runs (scoped); violations reported but do not fail proof. |
| **Registry structure** | All 12 molecule registry keys confirmed. |
| **Broken vs working** | Pipeline (load → render → input → state → journal → navigate → persist → rehydrate) is working for diagnostics app. |

### PRODUCT_URL_MUTATION_REPORT.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Not primary focus. |
| **Renderer pipeline** | Product URL/image normalization in SiteRenderer and compileSiteToSchema. |
| **JSON vs TSX flow** | Not primary focus. |
| **Layout engine** | Not primary focus. |
| **Compiler status** | Scan: product URL built in scan-adapter.ts (`${origin}/products/${handle}`); website build: compileSiteToSchema replaces product.url with `/product/${slugify(product.name)}`. Legacy siteCompiler/normalize.ts builds `path: /products/${product.id}`. |
| **Registry structure** | Not primary focus. |
| **Broken vs working** | URL construction/mutation points documented; slug vs handle can diverge. |

### SECTION_ID_TRACE_REPORT.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Not primary focus. |
| **Renderer pipeline** | GeneratedSiteViewer filters sections by `page.sectionIds`; section IDs come from compiler. |
| **JSON vs TSX flow** | Not primary focus. |
| **Layout engine** | Section IDs assigned in normalizeSiteData (`block-${pageSlugSafe}-${index}`); derivePagesFromNav fills page.sectionIds; compileSiteToSchema **regenerates** section IDs (same pattern but from derived pages/layout blocks), causing possible index/slug divergence; viewer filter can then miss sections. |
| **Compiler status** | ID divergence: normalizeSiteData assigns IDs → derivedPages.sectionIds; compileSiteToSchema regenerates IDs → mismatch if layout blocks filtered/transformed. |
| **Registry structure** | Not primary focus. |
| **Broken vs working** | Page→section ID mapping broken when compiler regenerates IDs; onboarding is separate (never mounts in compiled site viewer). |

### SITE_COMPILER_DIAGNOSTIC_REPORT.md

| Topic | What the report established |
|-------|-----------------------------|
| **Screen system** | Not primary focus. |
| **Renderer pipeline** | Render path: raw → normalizeSiteData → compileSiteToSchema → compiled/*.json. report.final/research not used for schema/normalized; viewer uses compiled/schema.json + compiled/normalized.json. |
| **JSON vs TSX flow** | Not primary focus. |
| **Layout engine** | Section mapping: normalizer assigns block IDs and derivedPages.sectionIds; compiler emits schema sections with same ID pattern; risks from category pages (empty sectionIds), viewer fallback, domain mismatch. |
| **Compiler status** | `npm run compile` produces report.final etc.; `npm run website` (build-site) requires report.final to exist but reads only raw for schema/normalized; writes compiled/schema.json, compiled/normalized.json. |
| **Registry structure** | Not primary focus. |
| **Broken vs working** | Nav page titles wrong in raw (ripper stores "American Express" in v2 page title); slug-based derivation fixes titles in derivedPages. Category pages mixed with nav in dropdown; section ID regeneration can break dropdown. |

### SRC_EXPORT.json

| Topic | What the report established |
|-------|-----------------------------|
| **Structure** | Tree of `src/`: app (layout, page, morph); behavior (binding, content, interpreter, modules, progression, semantics, sequences, timecore); components (9-atoms, definitions); compounds (3-molecules, definitions, schema); content; diagnostics; engine (core, maps, runners); lib; screens; scripts; system; ui; ux. Note: export shows some legacy/non-current names (e.g. compounds 3-molecules vs actual compounds/ui/12-molecules); engine core lists registry.ts vs actual registry.tsx; screen-loader not in export snippet. Used for high-level structure only. |

---

## PHASE 1 — CODEBASE INDEX (CONFIRMED PATHS & CURRENT STATE)

- **Screen roots**
  - JSON: `src/apps-offline/apps/` (category/folder/file). API: `src/app/api/screens/[...path]/route.ts` → `SCREENS_ROOT = path.join(cwd, "src", "apps-offline", "apps")`.
  - TSX: `src/screens/` (all subfolders). API same route; `TSX_ROOT = path.join(cwd, "src", "screens")`; TSX screens via `tsx:` prefix, no JSON fetch.
- **Engine core**
  - `src/engine/core/`: behavior-listener.ts, json-renderer.tsx, registry.tsx, screen-loader.ts, layout-store.ts, palette-store.ts, palette-resolve-token.ts, palette-resolver.ts, handlers.json, styler.tsx, ui-state.ts, useUIState.ts, global-scan.engine.ts.
- **Layout engine**
  - `src/layout/layout-engine/composeScreen.ts`, `region-policy.ts`; `src/layout/molecule-layout-resolver.ts`, `screen-layout-resolver.ts`; `src/layout/profile-resolver.ts`; presentation: `app.profile.json`, `learning.profile.json`, `website.profile.json`; molecules: column, grid, page, row, stack.
- **Shells / skin**
  - `src/lib/site-skin/SiteSkin.tsx`, `loadSiteSkin.ts`, `compileSkinFromBlueprint.ts`, types in `siteSkin.types.ts`; shells: `WebsiteShell.tsx`, `AppShell.tsx`, `LearningShell.tsx`, `RegionDebugOverlay.tsx` under `src/lib/site-skin/shells/`.
- **Compounds**
  - `src/compounds/ui/12-molecules/` (avatar, button, card, chip, field, footer, list, modal, section, stepper, toast, toolbar). Definitions: `src/compounds/ui/definitions/*.json` + `registry.ts`. Base: BaseCompound.tsx, ContentCompound.tsx; index.ts.
- **Site compiler / normalizer**
  - New path: `src/lib/site-compiler/` (compileSiteToSchema.ts, normalizeSiteData.ts, compileSiteToScreenModel.ts); `src/lib/site-normalizer/` (derivePagesFromNav.ts, derivePages.ts). Legacy: `src/lib/siteCompiler/` (compileSite.ts, normalize.ts, loaders.ts).
- **Scripts**
  - `src/scripts/blueprint.ts`, contract-validate.ts, contract-report.ts, pipeline-proof.ts; `src/scripts/websites/build-site.ts`, compile.ts, compile-website.ts; adapters under `src/scripts/websites/adapters/`; onboarding under `src/scripts/onboarding/`. Product-screen adapter: `src/lib/product-screen-adapter/`, script `src/scripts/compile-product-screen.ts` (`npm run product-screen -- <domain>`); see ADAPTERS.md.
- **API**
  - Screens: `src/app/api/screens/route.ts`, `src/app/api/screens/[...path]/route.ts`. Sites: `src/app/api/sites/[domain]/schema/route.ts`, normalized, brand, onboarding, screen, skins, etc.; `src/app/api/local-screens/[...path]/route.ts`.
- **App entry**
  - `src/app/layout.tsx`: palette, layout, state, installBehaviorListener, experience profiles (website/app/learning), screen index state, SectionLayoutDropdown. `src/app/page.tsx`: loadScreen, TSX map from `@/screens`, resolveLandingPage, JsonRenderer for JSON screens; TSX branch uses dynamic import from screens.

---

## PHASE 2 — STRUCTURED SYSTEM MAP

### 1. Screen System (TSX + JSON)

| Layer | Location | Role |
|-------|----------|------|
| **JSON screen source** | `src/apps-offline/apps/<category>/<folder>/` | blueprint.txt, content.txt, app.json (after blueprint run). Optional: content.json, linked.json. |
| **JSON screen API** | `src/app/api/screens/[...path]/route.ts` | Serves files under `src/apps-offline/apps/`. Normalizes path; returns JSON. |
| **TSX screen source** | `src/screens/` (all subfolders) | .tsx files; auto-discovered by page.tsx require.context. |
| **Screen loader** | `src/engine/core/screen-loader.ts` | `loadScreen(path)`: path with `/` → fetch `/api/screens/<path>`; `tsx:` prefix → returns `{ __type: "tsx-screen", path }`. Applies default state from JSON when state empty. Forbids bare IDs. |
| **Navigator / selector** | `src/app/layout.tsx` | Builds screen index (from API or local list); sets `/?screen=<path>`; palette, layout, experience (website/app/learning), installBehaviorListener. |
| **Page router** | `src/app/page.tsx` | resolveLandingPage; loadScreen for JSON; for TSX resolves from AUTO_TSX_MAP and dynamic import; SectionLayoutDropdown; JsonRenderer for JSON branch. |

**Flow:** User picks screen → router/searchParams → loadScreen(path) → (JSON) fetch → apply default state → pass node + defaultState to JsonRenderer; (TSX) resolve component → render TSX.

---

### 2. JSON Renderer + Registry

| Component | Location | Role |
|-----------|----------|------|
| **JsonRenderer** | `src/engine/core/json-renderer.tsx` | Renders node tree: shouldRenderNode (when), applyProfileToNode (layout profile), load definition (compounds/ui), resolveParams (variant/size + palette tokens), resolveMoleculeLayout, Registry[node.type], recursive children, optional Registry[node.layout.type] wrapper. Subscribes to palette, layout profile, state (useSyncExternalStore). |
| **Registry** | `src/engine/core/registry.tsx` | Map: JSON `type` → React component. Atoms + molecules (including layout molecules). |
| **Molecule definitions** | `src/compounds/ui/definitions/*.json` | variants/sizes presets per type. |
| **Definition registry** | `src/compounds/ui/definitions/registry.ts`, `src/compounds/ui/index.ts` | Lookup by type. |
| **Palette** | `src/engine/core/palette-store.ts`, `palette-resolve-token.ts`, `palette-resolver.ts` | resolveParams uses resolveToken(getPalette()). |
| **Molecule layout** | `src/layout/molecule-layout-resolver.ts` | resolveMoleculeLayout for params.moleculeLayout. |

**Contract (from artifacts):** Node shape: id, type, children, content, params, variant, size, layout, params.moleculeLayout, behavior, state, when. Registry and definitions must stay in sync with JSON types.

**Foundation (Phase 1 locked):** 12 molecules (avatar, button, card, chip, field, footer, list, modal, section, stepper, toast, toolbar) + 9 atoms (text, media, surface, sequence, trigger, collection, condition, shell, field). Contract doc: `docs/HI_SYSTEM/MOLECULE_CONTRACT.md`. Button includes `icon` variant. content.manifest generator in `src/scripts/blueprint.ts`; manifest written per app (`content.manifest.json`); content keys validated (warn on missing/invented).

---

### 3. Layout Engine (composeScreen, region-policy)

| Component | Location | Role |
|-----------|----------|------|
| **composeScreen** | `src/layout/layout-engine/composeScreen.ts` | Pure function: role-tagged nodes + layoutState + experienceProfile → composed tree (screen root, region sections, nodes in regions). Uses region-policy for order and placement. |
| **region-policy** | `src/layout/layout-engine/region-policy.ts` | getRegionOrder, isRegionEnabled, resolveRegionForRole, getNavPlacement; LayoutExperience, RegionKey, RegionPolicyState. |
| **Profile resolver** | `src/layout/profile-resolver.ts` | getExperienceProfile(experience). |
| **Presentation profiles** | `src/layout/presentation/app.profile.json`, `learning.profile.json`, `website.profile.json` | Section/region role overrides per experience. |
| **Screen layout resolver** | `src/layout/screen-layout-resolver.ts` | Screen-level layout resolution. |
| **Molecule layout resolver** | `src/layout/molecule-layout-resolver.ts` | Used by JsonRenderer for params.moleculeLayout. |
| **Layout molecules** | `src/layout/molecules/*.tsx` | column, grid, page, row, stack. |
| **Layout store** | `src/engine/core/layout-store.ts` | setLayout, getLayout, subscribeLayout (experience/profile). |

Used by SiteSkin: role-tagged nodes → composeScreen → regions → shells render regions. **Skin proof path:** skin JSON → loadSiteSkin → applySkinBindings → composeScreen → shells → JsonRenderer (see `src/lib/site-skin/PROOF_PATH.md`).

---

### 4. Shell System (WebsiteShell, AppShell, LearningShell)

| Component | Location | Role |
|-----------|----------|------|
| **SiteSkin** | `src/lib/site-skin/SiteSkin.tsx` | Loads skin (loadSiteSkin or preloaded), applySkinBindings, siteSkinToRoleTaggedNodes, composeScreen, collectRegionSections; picks shell by experience (website/app/learning); renders regions via shell; each region uses JsonRenderer for nodes. |
| **WebsiteShell** | `src/lib/site-skin/shells/WebsiteShell.tsx` | Layout container for experience "website". |
| **AppShell** | `src/lib/site-skin/shells/AppShell.tsx` | Layout container for experience "app". |
| **LearningShell** | `src/lib/site-skin/shells/LearningShell.tsx` | Layout container for experience "learning". |
| **RegionDebugOverlay** | `src/lib/site-skin/shells/RegionDebugOverlay.tsx` | Debug overlay for region structure. |

Shells receive region key and children (already-composed nodes); they do not implement JSON→DOM; JsonRenderer does. Experience set in app layout; SiteSkin used for site/skin pages (domain, pageId). **Proof path:** skin JSON → loadSiteSkin → applySkinBindings → composeScreen → shells → JsonRenderer.

---

### 5. Skin / Content Pipeline

| Stage | Location | Role |
|-------|----------|------|
| **Skin load** | `src/lib/site-skin/loadSiteSkin.ts` | Fetches or accepts preloaded skin JSON (e.g. /api/sites/:domain/skins/:pageId). |
| **Skin compile** | `src/lib/site-skin/compileSkinFromBlueprint.ts` | Compatibility adapter from blueprint compiler output to skin shape. |
| **Skin bindings** | `src/logic/bridges/skinBindings.apply.ts` | applySkinBindings(doc, data). |
| **Skin types** | `src/lib/site-skin/siteSkin.types.ts` | SiteSkinDocument, SiteSkinExperience, SiteSkinNode. |
| **Mappers** | `src/lib/site-skin/mappers/productToMoleculeNodes.ts`, `siteDataToSlots.ts` | Map site/product data to molecule nodes/slots. |
| **Site schema / screen model** | `src/lib/site-compiler/compileSiteToSchema.ts`, `compileSiteToScreenModel.ts` | Compile normalized site to schema or screen model for viewer/skin. |

Skin JSON can have `nodes` or `regions`; SiteSkin flattens to role-tagged nodes, then composeScreen, then regions rendered per shell with JsonRenderer.

---

### 6. Engine / Logic System

| Component | Location | Role |
|-----------|----------|------|
| **Behavior listener** | `src/engine/core/behavior-listener.ts` | installBehaviorListener (in layout). Listens for CustomEvents: input-change, action, navigate, interaction. Resolves "valueFrom: input" from ephemeral buffer; dispatches state-mutate; calls router for navigate. |
| **State store** | `src/state/state-store.ts` | dispatchState, getState, subscribe; listens for state-mutate; append-only log. |
| **State resolver** | `src/state/state-resolver.ts` | deriveState(log) → snapshot (e.g. journal, values). |
| **Runtime verb interpreter** | `src/engine/runtime/runtime-verb-interpreter.ts` | interpretRuntimeVerb; used by TSX/engine screens (separate from CustomEvent bridge). |
| **Interaction controller** | `src/logic/runtime/interaction-controller.ts` | recordInteraction; routes to verb interpreter. |
| **Behavior (verb) runner** | `src/behavior/behavior-runner.ts`, behavior-engine.ts | Verb/action handling; navigations/interactions maps. |
| **Landing page resolver** | `src/logic/runtime/landing-page-resolver.ts` | resolveLandingPage (page.tsx). |

Two paths: (1) JSON molecules → CustomEvent → behavior-listener → state-mutate → state-store → deriveState → JsonRenderer re-render; (2) TSX engine → recordInteraction / interpretRuntimeVerb → action runner.

---

### 7. Compilers / Scripts

| Script / entry | Location | Role |
|----------------|----------|------|
| **Blueprint** | `src/scripts/blueprint.ts` | `npm run blueprint`. Parses blueprint.txt + content.txt per app under apps-offline; buildTree; writes app.json. Calls warnBlueprintViolations (contract validator). |
| **Contract validate** | `src/scripts/contract-validate.ts`, contract-report.ts | Validate app JSON against contract; report violations. |
| **Pipeline proof** | `src/scripts/pipeline-proof.ts` | Runs diagnostic pipeline: load JSON, validator, molecules, input/state/journal/nav/persistence/rehydrate. |
| **Website build** | `src/scripts/websites/build-site.ts` | `npm run website`. Requires report.final; runs normalizeSiteData(siteKey), compileSiteToSchema(siteKey); writes compiled/schema.json, compiled/normalized.json. |
| **Compile (sites)** | `src/scripts/websites/compile.ts` | `npm run compile`. Produces normalized, report.final, etc. |
| **Adapters** | `src/scripts/websites/adapters/` | scan-adapter.ts, normalize-adapter.ts, research-adapter.ts, value-translation-adapter.ts. |
| **Site normalizer** | `src/lib/site-compiler/normalizeSiteData.ts` | Normalizes raw snapshot; calls derivePagesFromNav. |
| **Derive pages** | `src/lib/site-normalizer/derivePagesFromNav.ts` | Navigation + products → derivedPages (sectionIds, slug, title). |
| **Onboarding** | `src/scripts/onboarding/build-onboarding.ts`, logic.ts | Onboarding build/logic; separate from main site render path. |

---

### 8. What Is Fully Wired

- **Foundation (Phase 1 locked):** 12 molecules + 9 atoms; contract doc `docs/HI_SYSTEM/MOLECULE_CONTRACT.md`; button `icon` variant; content.manifest generator in blueprint (writes `content.manifest.json` per app, validates content keys with warn).
- **JSON screen load → render:** Navigator → loadScreen(path) → /api/screens → default state applied → JsonRenderer(node) → Registry, definitions, palette, molecule layout → DOM.
- **Behavior loop (JSON):** Input/button/stepper → CustomEvent → behavior-listener → state-mutate → state-store → deriveState → JsonRenderer re-render; navigate → router.
- **Pipeline proof:** Diagnostics app + linked screen: load, contract (warn), all 12 molecules, input-change, state/journal, navigation, persistence, rehydrate, no console error.
- **Layout engine:** composeScreen + region-policy used by SiteSkin; experience profile → shell (Website/App/Learning) → regions → JsonRenderer per region.
- **Site skin (proof path):** skin JSON → loadSiteSkin → applySkinBindings → composeScreen → shells → JsonRenderer; documented in `src/lib/site-skin/PROOF_PATH.md`.
- **Palette + layout store:** layout.tsx sets palette and layout/experience; JsonRenderer and SiteSkin subscribe.
- **Blueprint compile:** blueprint.txt + content.txt → app.json under apps-offline/apps.

---

### 9. What Exists But Is Not Wired

- **Contract enforcement:** Validator runs (warn-only); no hard fail on invalid behavior, missing content keys, or non-actionable molecule behavior. Content.manifest.txt not generated; slot/behavior token parsing not in blueprint.
- **Section ID consistency:** Section IDs assigned in normalizeSiteData and stored in derivedPages.sectionIds; compileSiteToSchema regenerates IDs → possible mismatch; GeneratedSiteViewer filter can miss sections. Fix proposed (preserve original IDs / map layout blocks to sections) not applied.
- **Onboarding in site viewer:** Onboarding flow lives in engine/onboarding and API; never mounted inside GeneratedSiteViewer; separate route and renderer.
- **report.final vs render:** build-site requires report.final to exist but schema/normalized are built only from raw; report.final used elsewhere (e.g. brand, onboarding), not for page/section list in viewer.
- **Legacy siteCompiler:** `src/lib/siteCompiler/` (normalize.ts, compileSite.ts) exists alongside `src/lib/site-compiler/`; product path uses `/products/${product.id}`; may diverge from site-compiler path.
- **TSX screen list in API:** TSX_ROOT exists in api/screens route; listing/integration with main screen index in layout may be partial (page.tsx has AUTO_TSX_MAP from require.context).

---

### 10. What Is Missing Entirely

- **content.manifest.txt:** No generator; no key enforcement (required keys, no invented keys) at compile or runtime.
- **Contract behavior tokens in blueprint:** Parser does not read `[slots]` or `(tap|go|...)`; no compilation to canonical behavior representation from contract tokens.
- **Behavior validator (blocking):** No render-time or compile-time block on behavior on non-actionable molecules or non-close on Modal.
- **Button `icon` variant:** Missing in `src/compounds/ui/definitions/button.json` per contract.
- **Single validator module:** No shared validator used at both compile-time (block write) and runtime (strip/placeholder) for contract rules.
- **Nav/root pages from ripper:** Raw snapshot has wrong page titles (e.g. "American Express"); fix is slug-based in derivation; no dedicated headerNav/rootPages from scraper.

---

## QUICK REFERENCE — KEY PATHS

| Concern | Path(s) |
|---------|--------|
| JSON screen source | `src/apps-offline/apps/<category>/<folder>/` |
| Screen API | `src/app/api/screens/route.ts`, `src/app/api/screens/[...path]/route.ts` |
| Screen loader | `src/engine/core/screen-loader.ts` |
| JsonRenderer | `src/engine/core/json-renderer.tsx` |
| Registry | `src/engine/core/registry.tsx` |
| Molecules | `src/compounds/ui/12-molecules/*.compound.tsx` |
| Definitions | `src/compounds/ui/definitions/*.json` |
| Layout engine | `src/layout/layout-engine/composeScreen.ts`, `region-policy.ts` |
| Shells | `src/lib/site-skin/shells/WebsiteShell.tsx`, AppShell.tsx, LearningShell.tsx |
| SiteSkin | `src/lib/site-skin/SiteSkin.tsx`, loadSiteSkin.ts |
| Behavior listener | `src/engine/core/behavior-listener.ts` |
| State | `src/state/state-store.ts`, state-resolver.ts |
| Blueprint script | `src/scripts/blueprint.ts` |
| Site compile | `src/lib/site-compiler/normalizeSiteData.ts`, compileSiteToSchema.ts |
| Site normalizer | `src/lib/site-normalizer/derivePagesFromNav.ts` |
| Website build | `src/scripts/websites/build-site.ts` |
