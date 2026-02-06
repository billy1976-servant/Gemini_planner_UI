# MASTER REFACTOR PLAN + REFRACTOR EXECUTION MASTER ROADMAP (COMBINED)

**Single document:** Executive refactor plan (current truth, gaps, acceptance tests, do-first) and staged execution roadmap (phases, stages, global order) including the all-inclusive update.

**Architecture boundaries (inviolable):**  
Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry

---

# PART I — MASTER REFACTOR PLAN

## A) CURRENT TRUTH (1–2 pages)

### What actually runs (runtime pipeline)

- **Entry:** [src/app/layout.tsx](src/app/layout.tsx) → `RootLayout`: `usePaletteCSS`, layout-store (`setLayout`, `getLayout`, `subscribeLayout`), `getCurrentScreenTree`, `dispatchState`, `installBehaviorListener(navigate)`, `ensureInitialView("|home")` (bootstrap). Renders `{children}` → Page.
- **Page:** [src/app/page.tsx](src/app/page.tsx) → `Page`: `useSearchParams().get("screen")` / `get("flow")`; when no screen → `resolveLandingPage()`; when screen → `loadScreen(screen)` from [src/engine/core/screen-loader.ts](src/engine/core/screen-loader.ts). TSX branch: `resolveTsxScreen(path)` (AUTO_TSX_MAP from `require.context("@/screens", true, /\.tsx$/)`), no JsonRenderer. JSON branch: load result → root = `json?.root ?? json?.screen ?? json?.node ?? json` → `assignSectionInstanceKeys` → `expandOrgansInDocument` → `applySkinBindings` → `composeOfflineScreen` → `setCurrentScreenTree` → optional `collapseLayoutNodes`; then `<JsonRenderer node={treeForRender} ... />` with profile from `getExperienceProfile` / `getTemplateProfile` and overrides from section-layout-preset-store, organ-internal-layout-store.
- **Screen load (JSON):** [src/engine/core/screen-loader.ts](src/engine/core/screen-loader.ts) `loadScreen(path)` normalizes path, fetches `GET /api/screens/${normalized}`; [src/app/api/screens/[...path]/route.ts](src/app/api/screens/[...path]/route.ts) reads `src/apps-offline/apps` + path + `.json`. If `json.state?.currentView`, `dispatchState("state:currentView", { value })`. Returns JSON.
- **Layout resolution:** [src/engine/core/json-renderer.tsx](src/engine/core/json-renderer.tsx) `applyProfileToNode`: section layout = overrideId ?? node.layout ?? templateDefaultLayoutId (from `getDefaultSectionLayoutId(templateId)`) ?? undefined. [src/layout/resolver/layout-resolver.ts](src/layout/resolver/layout-resolver.ts) `resolveLayout(layout)` → `getPageLayoutId` → `getPageLayoutById` + `resolveComponentLayout`. [src/compounds/ui/12-molecules/section.compound.tsx](src/compounds/ui/12-molecules/section.compound.tsx) calls `resolveLayout(layout)`; if organ role, `resolveInternalLayoutId`, `loadOrganVariant`; else `LayoutMoleculeRenderer`.
- **Render:** JsonRenderer → `renderNode` (Registry lookup `(Registry as any)[resolvedNode.type]` from [src/engine/core/registry.tsx](src/engine/core/registry.tsx)); section → Section compound → resolveLayout → LayoutMoleculeRenderer or div fallback.
- **Behavior:** [src/engine/core/behavior-listener.ts](src/engine/core/behavior-listener.ts) listens navigate, input-change, action. Action branch: `state:*` → dispatchState; `navigate` → navigate(to); contract verbs (tap, double, long, …) → `runBehavior(domain, actionName, { navigate }, params)` from [src/behavior/behavior-runner.ts](src/behavior/behavior-runner.ts); else `require("../../logic/runtime/runtime-verb-interpreter").interpretRuntimeVerb(...)` → [src/logic/runtime/action-runner.ts](src/logic/runtime/action-runner.ts) → [src/logic/runtime/action-registry.ts](src/logic/runtime/action-registry.ts) handlers.
- **State:** [src/state/state-store.ts](src/state/state-store.ts) `dispatchState` appends to log; [src/state/state-resolver.ts](src/state/state-resolver.ts) `deriveState(log)` replays intents; listeners notified; persist (except state.update).

### What is documented but not wired

- Layout Decision Engine, User Preference Adaptation, Suggestion Injection Point, Contextual Layout Logic, Trait Registry System, Explainability/Trace — documented, no implementation or not called. View Resolver, Calc Resolver, Apply Engine Overlays — no callers.
- Engine Registry / Flow path — only reached when TSX screen or flow is loaded; not on main JSON screen path.
- Reachability report has false negatives (registry, state-resolver, layout resolver, action-registry are imported but marked UNREACHABLE).

### Where duplication exists

- Two runtime-verb-interpreters (engine/runtime vs logic/runtime; only logic used).
- Two content-resolvers (logic/content vs content; one dead).
- Multiple render paths: JsonRenderer PRIMARY; renderFromSchema SECONDARY; ScreenRenderer DEAD; SiteSkin SECONDARY; EngineRunner DEAD/PARTIAL.
- getLayout2Ids is legacy naming (wrapper around getPageLayoutIds).

---

## B) GAPS + BREAKS (EXHAUSTIVE LIST)

1. Layout type allow-list in TS — layout-store.ts L99. HARDCODE. MED.
2. Contract verb set hardcoded in behavior-listener — L231–247. HARDCODE. MED.
3. NON_ACTIONABLE_TYPES hardcoded — json-renderer.tsx L190. HARDCODE. LOW.
4. LAYOUT_NODE_TYPES hardcoded — collapse-layout-nodes.ts L8. HARDCODE. LOW.
5. EXPECTED_PARAMS / slot names hardcoded — json-renderer.tsx L150–157. HARDCODE. LOW.
6. Template criticalRoles/optionalRoles hardcoded — template-profiles.ts L558, L566. HARDCODE. MED.
7. ensureInitialView("|home") invented default — state-store.ts L144. HARDCODE. MED.
8. input-change missing fieldKey fallback — behavior-listener L56–59. SILENT FALLBACK. LOW.
9. Legacy state:* fallback in behavior-listener — L140. SILENT FALLBACK. LOW.
10. Duplicate runtime-verb-interpreter — engine vs logic. DUPLICATION. MED.
11. Duplicate content-resolver — logic/content vs content. DUPLICATION. MED.
12. getLayout2Ids legacy naming. SCHEMA DRIFT. LOW.
13. Blueprint script not in runtime — CLI only. WIRING. LOW.
14. API routes unreachable in static reachability. WIRING. LOW.
15. Layout Decision Engine / Suggestion / Trait / Explainability / Contextual Layout Logic not implemented. WIRING. MED.
16. State write surfaces unbounded list. STATE LEAK. MED.
17. Engine registry only on TSX/flow path. WIRING. LOW.
18. Doc says interpretRuntimeVerb in engine/runtime. SCHEMA DRIFT. LOW.
19. Section compound layoutDef null → div fallback. FALLBACK. LOW.
20. Reachability report false negatives. REGISTRY DRIFT. LOW.

---

## C) MASTER REFACTOR ROADMAP (CHECKLIST)

See Part II for the staged execution breakdown. High-level: fix docs, remove hardcodes, resolve duplication, align registry/layout, state governance, behavior normalization, engine isolation, authority audit, validation, final integrity pass.

---

## D) ACCEPTANCE TESTS (PROOF IT WORKS)

- Reachability: fewer unreachable or clear SECONDARY/DEAD isolation.
- No hardcoded options: dropdowns and allow-lists from JSON or registry.
- State write surfaces bounded; ensureInitialView no invented IDs.
- Authority ladder: override → explicit → suggestion → default.
- Blueprint boundary: no layout in params, no screen IDs, no layout primitives.
- Single primary render path: JsonRenderer.
- Single runtime-verb-interpreter: logic/runtime only.
- Single content resolution.
- Organ registry single source or documented; Registry source of truth; palette from JSON or documented; state persistence contract; scripts boundary; site compiler secondary.

### Extended acceptance list (Phase 10.3)

| Criterion | Ref |
|-----------|-----|
| Organ registry single source or documented | organs/README.md, organ-registry.ts |
| Registry (JSON → component) source of truth | registry.tsx; PIPELINE_AND_BOUNDARIES_REFERENCE.md §1 |
| Palette from JSON or documented | palette-store; documented in Phase 2 |
| State persistence contract | state-store persist/rehydrate; STATE_MUTATION_SURFACE_MAP, STATE_INTENTS |
| Scripts boundary (no script in runtime) | No import of src/scripts in app/engine/state/layout |
| Site compiler secondary | PIPELINE_AND_BOUNDARIES_REFERENCE.md §12; not on main JSON path |

### Phase 10 integrity run (2025-02-05)

| Check | Result |
|-------|--------|
| Reachability seed includes registry, state-resolver, action-registry | PASS — report regenerated; 110 REACHABLE |
| No layout in state (layout does not import state-store/dispatchState) | PASS — grep src/layout: no matches |
| No behavior in layout (layout does not import behavior-listener/runBehavior) | PASS — grep src/layout: no matches |
| No blueprint in runtime (app/engine/state do not import blueprint/scripts) | PASS — grep: no matches |
| JsonRenderer primary | PASS — page.tsx JSON branch uses JsonRenderer; PIPELINE_AND_BOUNDARIES_REFERENCE §1 |
| Separation checklist | PASS — BOUNDARY_SEPARATION_CHECKLIST.md; Phase 10 sign-off below |
| Critical-path smoke test | PASS — deriveState, loadScreen, installBehaviorListener |

---

## E) "DO FIRST" (TOP 5)

1. Fix doc: interpretRuntimeVerb path (logic/runtime)
2. Single source for contract verb set
3. Remove/deprecate engine/runtime runtime-verb-interpreter
4. Resolve content-resolver duplication
5. Layout allowedTypes from registry or JSON

---

## RENDERER CLASSIFICATION

| Renderer / Path | Classification | Notes |
|-----------------|----------------|-------|
| JsonRenderer (page.tsx) | PRIMARY | Main JSON screen path. |
| renderFromSchema + layout-bridge (GeneratedSiteViewer) | SECONDARY | Site compile path; isolate. |
| ScreenRenderer (GibsonSiteScreen, etc.) | DEAD | Unreachable; plan removal or wire. |
| SiteSkin (uses JsonRenderer) | SECONDARY | Wraps JsonRenderer. |
| EngineRunner (event-driven JsonRenderer) | DEAD / PARTIAL | Not mounted in app; event-only. |

---

# PART II — REFRACTOR EXECUTION MASTER ROADMAP

**Scope:** Staged execution from current state to architecture-aligned state. Execute in the global order below.

---

## 1. SYSTEM PHASES (HIGH LEVEL)

| Phase | Name | Purpose |
|-------|------|---------|
| **Phase 1** | Documentation + Contract Alignment | Fix doc drift; establish single source of truth for pipeline, boundaries, and renderer classification. |
| **Phase 2** | Hardcoded Surface Removal | Remove or source all hardcoded option lists and invented defaults from JSON/registry. |
| **Phase 3** | Duplication & Dead System Resolution | Remove duplicate interpreters/resolvers; resolve or document dead/secondary paths. |
| **Phase 4** | Registry & Layout Authority Alignment | Layout types and IDs from registry; rename getLayout2Ids; clarify planned vs implemented layout engines. |
| **Phase 5** | State Governance & Intent Boundaries | Bound state write surfaces; single state intents reference; ensureInitialView from config. |
| **Phase 6** | Behavior Surface Normalization | Contract verbs from config; document/remove silent fallbacks; lock behavior branch order in doc. |
| **Phase 7** | Engine / Flow / Secondary Path Isolation | Classify and document PRIMARY/SECONDARY/DEAD render paths; isolate flow/TSX from main JSON path. |
| **Phase 8** | Runtime Authority + Explainability | Authority ladder audit; document planned engines. |
| **Phase 9** | Validation Layer & Contract Enforcement | Reachability tooling fix; optional schema validation; blueprint contract; separation checklist. |
| **Phase 10** | Final System Integrity Pass | Run acceptance tests; confirm no boundary violations. |

---

## 2. STAGE BREAKDOWN WITHIN EACH PHASE

### Phase 1 — Documentation + Contract Alignment

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 1.1 | All docs reference logic/runtime for interpretRuntimeVerb | src/docs/ARCHITECTURE_AUTOGEN/*.md, src/docs/RUNTIME/*.md | Replace any "engine/runtime/runtime-verb-interpreter" as active path with "logic/runtime/runtime-verb-interpreter". | Runtime code; behavior-listener require path. | Grep finds no doc stating engine path is the active interpreter. | LOW | None |
| 1.2 | Document API route boundary (Next.js) | src/docs/SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md or ARCHITECTURE_AUTOGEN | Add note: API routes invoked by Next.js/fetch; exclude from module reachability seed or document. | Reachability script until Phase 9. | Document exists. | LOW | None |
| 1.3 | Renderer classification table | This doc or src/docs/ARCHITECTURE_AUTOGEN | Add/update table: JsonRenderer PRIMARY; renderFromSchema SECONDARY; ScreenRenderer DEAD; SiteSkin SECONDARY; EngineRunner DEAD/PARTIAL. | Runtime render paths. | Table in single doc. | LOW | None |
| 1.4 | Blueprint compiler boundary doc | src/docs/ARCHITECTURE_AUTOGEN/BLUEPRINT_RUNTIME_INTERFACE.generated.md or src/cursor plan | Explicit: compiler output only; no runtime layout IDs; no blueprint script in runtime. | blueprint.ts; runtime screen load. | Single authoritative sentence. | LOW | None |
| 1.5 | Behavior listener branch order doc | BEHAVIOR_EVENT_WIRING.generated.md or RUNTIME_PIPELINE_CONTRACT | Document exact order: state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn. | behavior-listener.ts branch order. | Doc matches code. | LOW | None |
| 1.6 | Screen load + API contract doc | New or existing under src/docs | Single reference: loadScreen path rules, TSX vs JSON, state init, API route location. | screen-loader.ts; API route. | Single doc. | LOW | None |
| 1.7 | Layout resolution order doc | Layout doc | Single reference: page → component → organ internal; file roles. | Resolver implementations. | Single doc. | LOW | None |
| 1.8 | Organ expand + skin bindings order doc | Page-level or ARCHITECTURE doc | Single reference: assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen. | page.tsx order. | Documented. | LOW | None |
| 1.9 | config/ui-verb-map.json vs runtime | config/ui-verb-map.json, docs | Clarify: config design-time; runtime uses behavior-runner + listener. | behavior-runner; listener. | Doc states relationship. | LOW | None |
| 1.10 | Section/card/organ override stores single surface doc | STATE_MUTATION_SURFACE_MAP or layout override doc | One table: section-layout-preset-store, card overrides, organ-internal-layout-store. | Store implementations. | Single table. | LOW | None |
| 1.11 | Scripts boundary doc | src/scripts/*, src/docs or src/cursor | Document: which scripts are build-time or one-off; no script imported by app/engine/state/layout at runtime. | Script implementations. | Document exists; grep confirms no runtime import. | LOW | None |
| 1.12 | State persistence contract doc | src/state/state-store.ts, docs | Document: localStorage key, stored shape (event log), rehydration; no new persistence surfaces without contract. | persist/rehydrate logic. | Single doc. | LOW | None |
| 1.13 | Site compiler pipeline doc | src/lib/site-compiler, src/lib/site-engines, docs | Document: normalizeSiteData, compileSiteToSchema, applyEngineOverlays are build-time/secondary; not on main JSON screen path. | renderFromSchema; GeneratedSiteViewer. | Documented. | LOW | None |
| 1.14 | Error/reporting contract doc | screen-loader, json-renderer, behavior-listener, docs | Document where errors are reported; no silent swallows in primary path. | Existing throw/warn. | Document exists. | LOW | None |
| 1.15 | Diagnostics (dev-only) doc | src/engine/devtools/runtime-decision-trace.ts, src/diagnostics, docs | Document: dev-only surfaces; they do not change production code paths. | Production branches. | Documented. | LOW | None |

### Phase 2 — Hardcoded Surface Removal

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 2.1 | Contract verb set from JSON or single TS module | behavior-listener.ts, config/ or src/behavior/*.ts | Move verb list to JSON or one constant; behavior-listener reads from it. | Branch order; runBehavior; interpretRuntimeVerb fallback. | No inline array of verbs. | MED | None |
| 2.2 | Layout allowedTypes from registry or JSON | layout-store.ts, page-layouts.json or layout-types.json | setLayout type from data; no hardcoded Set in layout-store. | Layout store subscribe/notify. | allowedTypes derived from data. | MED | None |
| 2.3 | NON_ACTIONABLE_TYPES from contract/JSON | json-renderer.tsx, contract or config | Types that strip behavior from JSON or contract. | shouldStripBehavior; Registry lookup. | No hardcoded Set. | LOW | None |
| 2.4 | LAYOUT_NODE_TYPES from layout/registry | collapse-layout-nodes.ts, component-layouts.json or defs | Collapse list from single source. | hasLayoutNodeType/collapseLayoutNodes. | Single source. | LOW | None |
| 2.5 | EXPECTED_PARAMS from definitions/contract | json-renderer.tsx, compounds/ui or contract | Params/slots from definitions or contract. | logParamsDiagnostic; renderNode. | No hardcoded map. | LOW | None |
| 2.6 | Template criticalRoles/optionalRoles from data | template-profiles.ts, template or profile JSON | criticalRoles and optionalRoles from data. | Template merge logic. | No inline arrays. | MED | None |
| 2.7 | ensureInitialView default from config | state-store.ts, config or landing resolver | defaultView from config/JSON or omit; no invented "|home". | dispatchState; deriveState; persist. | No hardcoded "|home". | MED | None |
| 2.8 | Organ registry: source or document | src/organs/organ-registry.ts, organ variant JSON | Organ list and variant map from manifest/JSON or document extend-only. | loadOrganVariant; resolve-organs. | Single source or documented. | MED | None |
| 2.9 | Palette/theme from JSON or document | palette-store.ts, palette-resolver.ts, src/palettes, docs | Palette list and resolution from JSON or document. | usePaletteCSS; resolveParams. | Palettes from data or documented. | LOW | None |

### Phase 3 — Duplication & Dead System Resolution

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 3.1 | Remove or deprecate engine/runtime runtime-verb-interpreter | engine/runtime/runtime-verb-interpreter.ts, runtime-navigation.ts | Delete or deprecate engine copy; no import from engine/runtime in behavior path. | logic/runtime; behavior-listener require. | No import from engine/runtime. | MED | 1.1 |
| 3.2 | Single content resolution entrypoint | content/content-resolver.ts, logic/content/content-resolver.ts, landing-page-resolver | Remove or rename unused; single content-resolver import. | landing-page-resolver; resolveContent. | Single import. | MED | None |
| 3.3 | getLayout2Ids → getSectionLayoutIds (or alias) | layout/resolver, layout/index, page.tsx, OrganPanel, section-layout-dropdown | Export getSectionLayoutIds or keep alias; update call sites or document. | getPageLayoutIds(); resolveLayout. | Public API clear. | LOW | None |
| 3.4 | View Resolver: wire or mark legacy | view-resolver.ts, summary/export-resolver.ts | Add callers or document legacy. | summary/export-resolver. | Callers or marked legacy. | MED | None |
| 3.5 | Calc Resolver: wire or mark legacy | calc-resolver.ts, flow/step logic | resolveCalcs called or document legacy. | action-runner; run-calculator. | Callers or marked legacy. | MED | None |
| 3.6 | Apply Engine Overlays: wire or mark unused | applyEngineOverlays.ts, build-site or compile | Call from site compile or document unused. | renderFromSchema; compileSiteToSchema. | Callers or marked unused. | LOW | None |
| 3.7 | EngineRunner: mount or document | engine-runner.tsx, layout or app-loader | Mount or document "event-only, not mounted". | JsonRenderer; event contract. | Documented or mounted. | LOW | None |

### Phase 4 — Registry & Layout Authority Alignment

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 4.1 | Layout types (already in 2.2) | — | Covered in Phase 2. | — | — | — | — |
| 4.2 | getSectionLayoutIds (already in 3.3) | — | Covered in Phase 3. | — | — | — | — |
| 4.3 | Layout Decision Engine: implement or mark planned | ARCHITECTURE_AUTOGEN, cursor logic plan | Docs state "planned" or stub. | applyProfileToNode; getLayout2Ids/compatibility. | Status clear. | MED | 1.4 |
| 4.4 | Suggestion Injection Point: implement or mark planned | SUGGESTION_INJECTION_POINT.md | Same. | Resolver. | Status clear. | MED | 1.4 |
| 4.5 | Trait Registry System: implement or mark planned | TRAIT_REGISTRY_SYSTEM.md | Same. | Layout compatibility. | Status clear. | MED | 1.4 |
| 4.6 | User Preference Adaptation: implement or mark planned | Docs | Same. | State; override stores. | Status clear. | LOW | 1.4 |
| 4.7 | Explainability/Trace: implement or mark planned | Docs; layout trace | Same. | resolveLayout; applyProfileToNode. | Status clear. | LOW | 1.4 |
| 4.8 | Contextual Layout Logic: implement or mark planned | CONTEXTUAL_LAYOUT_LOGIC.md, CONTRACT_IMPLEMENTATION_DIFF | Same: planned or stub. | Resolver; layout decision. | Status clear. | MED | 1.4 |
| 4.9 | Component Registry source of truth | src/engine/core/registry.tsx, docs or manifest | Document registry.tsx as single type→component map or derive from JSON; no competing maps. | JsonRenderer Registry lookup. | Single source documented. | LOW | None |

### Phase 5 — State Governance & Intent Boundaries

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 5.1 | State mutation surface audit | STATE_MUTATION_SURFACE_MAP.md, state-store.ts | Bounded list of every dispatchState call site. | dispatchState signature; deriveState. | List complete. | LOW | None |
| 5.2 | State intents single reference | state-resolver.ts, STATE_INTENTS.md or contract | One list of all intents; call sites use only listed. | deriveState handling. | Single doc. | LOW | None |
| 5.3 | ensureInitialView (already in 2.7) | — | Covered in Phase 2. | — | — | — | — |
| 5.4 | No new state surfaces without contract | STATE_MUTATION_SURFACE_MAP; contribution rules | Document rule: new dispatchState must be listed. | Existing call sites. | Rule in doc. | LOW | 5.1 |

### Phase 6 — Behavior Surface Normalization

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 6.1 | Contract verbs (already in 2.1) | — | Covered in Phase 2. | — | — | — | — |
| 6.2 | input-change fieldKey: explicit no-op or fail | behavior-listener.ts | When fieldKey missing: explicit no-op or early return; document. | state.update when present. | No "falling back" with invented value. | LOW | None |
| 6.3 | Legacy state:* fallback: document or remove | behavior-listener.ts | Document or remove. | state:* valueFrom input. | Documented or removed. | LOW | None |
| 6.4 | state-mutate legacy: document or remove | state-store.ts (installStateMutateBridge) | Document or remove. | dispatchState; listeners. | Documented or removed. | LOW | None |

### Phase 7 — Engine / Flow / Secondary Path Isolation

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 7.1 | Renderer table (already in 1.3) | — | Covered in Phase 1. | — | — | — | — |
| 7.2 | renderFromSchema marked SECONDARY | ARCHITECTURE_AUTOGEN or this doc | Document: GeneratedSiteViewer + renderFromSchema secondary. | renderFromSchema; layout-bridge. | Doc states SECONDARY. | LOW | 1.3 |
| 7.3 | ScreenRenderer / Gibson path: DEAD or wire | ScreenRenderer.tsx, generated-websites, app/sites | Decision: remove or wire; document DEAD. | JsonRenderer. | Decision documented. | LOW | None |
| 7.4 | Engine Runner (already in 3.7) | — | Covered in Phase 3. | — | — | — | — |
| 7.5 | Engine registry only on TSX/flow path doc | RUNTIME_CALL_GRAPH.generated.md, ARCHITECTURE_AUTOGEN | Document: engine-registry, flow-loader, FlowRenderer secondary. | page.tsx JSON branch; loadScreen. | Doc states secondary. | LOW | None |
| 7.6 | Site compiler pipeline: build-time/secondary doc | src/lib/site-compiler, src/lib/site-engines, docs | Document: site compiler and applyEngineOverlays build-time or secondary. | renderFromSchema; compile scripts. | Documented. | LOW | 1.13 |

### Phase 8 — Runtime Authority + Explainability

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 8.1 | Authority ladder audit | RUNTIME_AUTHORITY_LADDER.md, json-renderer applyProfileToNode | Confirm override → explicit → template default → undefined. | Precedence in code. | Doc and code match. | LOW | None |
| 8.2 | Planned engines (already in 4.3–4.8) | — | Covered in Phase 4. | — | — | — | — |
| 8.3 | Section layoutDef null fallback documented | RUNTIME_AUTHORITY_LADDER | Confirm: resolveLayout null → section div; no invented layout ID. | section.compound.tsx. | Documented. | LOW | None |

### Phase 9 — Validation Layer & Contract Enforcement

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 9.1 | Reachability seed fix | generate-reachability-report.ts or equivalent | Include layout/index, registry, state-resolver, action-registry in seed or fix alias. | Module graph. | Fewer false unreachable. | LOW | None |
| 9.2 | Blueprint: no layout primitives in screen tree | blueprint.ts, BLUEPRINT_RUNTIME_INTERFACE | Blueprint does not emit Grid/Row/Column/Stack as screen tree nodes. | Runtime collapseLayoutNodes. | Contract enforced. | LOW | 1.4 |
| 9.3 | Optional: runtime schema validation | compose-offline-screen.ts or screen-loader.ts | If added: single place. | Screen shape; loadScreen. | At most one validation call site. | MED | 1.6 |
| 9.4 | Optional: JSON_SCREEN_CONTRACT import | JSON_SCREEN_CONTRACT.json, one validator | If runtime validation uses contract, single import. | Contract schema. | Single import. | LOW | 9.3 |
| 9.5 | Separation checklist | src/cursor or src/docs | Checklist: Layout≠State≠Behavior≠Blueprint≠Organs≠Registry; no cross-boundary writes. | All boundaries. | Checklist in doc. | MED | None |
| 9.6 | Test coverage for critical path | Tests; Part I acceptance | Ensure loadScreen, applyProfileToNode, behavior-listener, deriveState have tests; update when refactor changes behavior. | Runtime behavior. | Critical path covered. | LOW | Phases 1–9 |

### Phase 10 — Final System Integrity Pass

| Stage | Goal | Exact files involved | What changes (conceptually) | What must NOT change | Success proof | Risk | Dependencies |
|-------|------|----------------------|-----------------------------|----------------------|----------------|------|--------------|
| 10.1 | Run acceptance tests | Part I section D; this doc | Execute all acceptance criteria. | Runtime behavior. | All pass. | LOW | Phases 1–9 |
| 10.2 | Confirm no boundary violations | Separation checklist; codebase | Final check: no layout in state; no behavior in layout; no blueprint in runtime; JSON authority; JsonRenderer primary. | Architecture. | Checklist signed off. | LOW | 9.5, 10.1 |
| 10.3 | Acceptance criteria include new items | Part I section D; this doc | Extend acceptance list: organ registry source; Registry source of truth; palette; state persistence; scripts boundary; site compiler secondary. | Existing criteria. | All criteria (including new) pass. | LOW | 10.1, 10.2 |

---

## 3. GLOBAL ORDER OF EXECUTION (MASTER EXECUTION ORDER)

Execute in this exact order. No stages skipped; no new stages inserted mid-run.

1. **1.1** — Fix doc: interpretRuntimeVerb path (logic/runtime)
2. **1.2** — Document API route boundary
3. **1.3** — Renderer classification table
4. **1.4** — Blueprint compiler boundary doc
5. **1.5** — Behavior listener branch order doc
6. **1.6** — Screen load + API contract doc
7. **1.7** — Layout resolution order doc
8. **1.8** — Organ expand + skin bindings order doc
9. **1.9** — config/ui-verb-map.json vs runtime doc
10. **1.10** — Section/card/organ override stores single surface doc
11. **1.11** — Scripts boundary doc
12. **1.12** — State persistence contract doc
13. **1.13** — Site compiler pipeline doc
14. **1.14** — Error/reporting contract doc
15. **1.15** — Diagnostics (dev-only) doc
16. **2.1** — Contract verb set from JSON or single module
17. **2.2** — Layout allowedTypes from registry or JSON
18. **2.3** — NON_ACTIONABLE_TYPES from contract/JSON
19. **2.4** — LAYOUT_NODE_TYPES from layout/registry
20. **2.5** — EXPECTED_PARAMS from definitions/contract
21. **2.6** — Template criticalRoles/optionalRoles from data
22. **2.7** — ensureInitialView default from config
23. **2.8** — Organ registry: source or document
24. **2.9** — Palette/theme from JSON or document
25. **3.1** — Remove or deprecate engine/runtime runtime-verb-interpreter
26. **3.2** — Single content resolution entrypoint
27. **3.3** — getLayout2Ids → getSectionLayoutIds (or alias)
28. **3.4** — View Resolver: wire or mark legacy
29. **3.5** — Calc Resolver: wire or mark legacy
30. **3.6** — Apply Engine Overlays: wire or mark unused
31. **3.7** — EngineRunner: mount or document
32. **4.3** — Layout Decision Engine: implement or mark planned
33. **4.4** — Suggestion Injection Point: implement or mark planned
34. **4.5** — Trait Registry System: implement or mark planned
35. **4.6** — User Preference Adaptation: implement or mark planned
36. **4.7** — Explainability/Trace: implement or mark planned
37. **4.8** — Contextual Layout Logic: implement or mark planned
38. **4.9** — Component Registry source of truth
39. **5.1** — State mutation surface audit
40. **5.2** — State intents single reference
41. **5.4** — No new state surfaces without contract (doc)
42. **6.2** — input-change fieldKey: explicit no-op or fail
43. **6.3** — Legacy state:* fallback: document or remove
44. **6.4** — state-mutate legacy: document or remove
45. **7.2** — renderFromSchema marked SECONDARY (doc)
46. **7.3** — ScreenRenderer / Gibson path: DEAD or wire
47. **7.5** — Engine registry only on TSX/flow path doc
48. **7.6** — Site compiler pipeline: build-time/secondary doc
49. **8.1** — Authority ladder audit
50. **8.3** — Section layoutDef null fallback documented
51. **9.1** — Reachability seed fix
52. **9.2** — Blueprint: no layout primitives in screen tree
53. **9.3** — Optional: runtime schema validation (if doing)
54. **9.4** — Optional: JSON_SCREEN_CONTRACT import (if 9.3)
55. **9.5** — Separation checklist (Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry)
56. **9.6** — Test coverage for critical path
57. **10.1** — Run acceptance tests
58. **10.2** — Confirm no boundary violations
59. **10.3** — Acceptance criteria include new items

---

## 4. ARCHITECTURE SAFETY CHECK

Before and after execution, confirm:

| Check | Requirement |
|-------|-------------|
| **No layout logic in state** | Layout resolver, override stores, and profile apply do not write to state-store (dispatchState). Layout stores remain separate from state-store. |
| **No behavior logic in layout** | Layout module does not install behavior listeners, call runBehavior, or interpretRuntimeVerb. |
| **No blueprint logic in runtime** | blueprint.ts is never imported by app, engine, state, or layout. Runtime screen load uses API + screen-loader only. |
| **No new hardcoded runtime decisions** | All option lists and allow-lists sourced from JSON or registry; no new inline arrays/sets. |
| **JSON authority preserved** | Screen JSON drives root, state.currentView init, and node layout; overrides supplement, do not replace. |
| **Primary render path remains JsonRenderer** | page.tsx → loadScreen (JSON) → compose → JsonRenderer is primary; renderFromSchema, ScreenRenderer, EngineRunner secondary or dead. |
| **Organs/Registry single source** | Organ variant map and component Registry have a single source or documented extend-only contract; no ad-hoc duplicate maps. |

---

ROADMAP LOCKED — READY FOR STAGED EXECUTION
