# 03 — Engine System

**Source:** Compiled from `src/docs/ARCHITECTURE_AUTOGEN/ENGINE_WIRING_STATUS.generated.md`, `BLUEPRINT_RUNTIME_INTERFACE.generated.md`, `PIPELINE_AND_BOUNDARIES_REFERENCE.md`.

---

## Engine wiring summary

| Status | Count | Meaning |
|--------|-------|---------|
| ACTIVE | 12 | Reachable and invoked on main JSON/behavior path |
| DORMANT | 0 | Reachable but not invoked on main path |
| DISCONNECTED | 20+ | Unreachable from seed (TSX/flow-only or script-only) |

**Reachability seed:** page.tsx, layout.tsx, json-renderer.tsx, behavior-listener.ts, screen-loader.ts, state-store.ts, layout/index.ts, runtime-verb-interpreter.ts (and registry.tsx, state-resolver.ts, action-registry.ts).

---

## ACTIVE engines (main path)

1. **JsonSkinEngine** — Renders type === "json-skin" nodes; entry: json-renderer → renderNode → JsonSkinEngine.
2. **Onboarding-flow-router** — resolveOnboardingFromAnswers; entry: landing-page-resolver.
3. **engine-bridge** — readEngineState, writeEngineState; entry: landing-page-resolver, behavior-listener → interpretRuntimeVerb → handlers.
4. **action-runner** — runAction(action, state); entry: behavior-listener → interpretRuntimeVerb → runAction.
5. **action-registry** — getActionHandler(name); handlers: logic:runCalculator, logic:run25x, logic:resolveOnboarding.
6. **25x.engine** — logic:run25x.
7. **resolve-onboarding.action** — logic:resolveOnboarding.
8. **run-calculator.action** — logic:runCalculator.
9. **Layout resolver / compatibility** — getDefaultSectionLayoutId, evaluateCompatibility; entry: json-renderer applyProfileToNode → @/layout.
10. **content-resolver** — resolveContent (e.g. "construction-cleanup"); entry: landing-page-resolver.
11. **skinBindings.apply** — applySkinBindings(document, …); entry: page.tsx.
12. **runtime-verb-interpreter** — interpretRuntimeVerb(verb, getState()); entry: behavior-listener (required dynamically).

---

## Call chain reference (ACTIVE path)

1. layout.tsx → installBehaviorListener  
2. page.tsx → loadScreen, resolveLandingPage, JsonRenderer, applySkinBindings  
3. behavior-listener → interpretRuntimeVerb, runBehavior, dispatchState  
4. runtime-verb-interpreter → runAction  
5. action-runner → getActionHandler  
6. action-registry → run25X, resolveOnboardingAction, runCalculator  
7. json-renderer (renderNode) → JsonSkinEngine, getDefaultSectionLayoutId, evaluateCompatibility  
8. landing-page-resolver → readEngineState, resolveOnboardingFromAnswers, resolveContent  
9. layout index (resolver, compatibility)

---

## DISCONNECTED (not on main path)

- **logic/engines:** engine-registry, learning.engine, calculator.engine, abc.engine, decision.engine, summary.engine, flow-router, next-step-reason, decision-engine, value-comparison/value-translation/value-dimensions, hi-engine-runner, export-resolver, engine-selector, calculator module/calcs — used by flow-loader, engine-viewer, FlowRenderer, OnboardingFlowRenderer (TSX/flow path).
- **Flow/orchestration:** FlowRenderer, flow-loader, integration-flow-engine, engine-explain.
- **Layout “intelligence” (documented, not wired):** Layout Decision Engine, User Preference Adaptation, Suggestion Injection Point, Contextual Layout Logic, Trait Registry System — no implementation in resolver; precedence remains override → explicit → template default.

---

## Blueprint compiler (build-time only)

- **Script:** src/scripts/blueprint.ts — CLI; parses blueprint + content; writes app.json, content.manifest.json under src/apps-offline/apps/<appPath>/.
- **Tree shape:** Node: id, type, children, content; optional role, state, params, behavior. No layout ids for sections from blueprint; no screen IDs.
- **Runtime:** Load path = loadScreen → API GET /api/screens/{path} → state init if json.state?.currentView; page.tsx root = json?.root ?? json?.screen ?? json?.node ?? json; then assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen → JsonRenderer.
- **Boundary:** No blueprint script imported by app/engine/state/layout at runtime. No runtime layout IDs from blueprint.

---

## Site compiler (build-time or secondary)

- normalizeSiteData, compileSiteToSchema — build-time/secondary.
- applyEngineOverlays — build-time/secondary; no callers on main path. Used for site compile pipeline when using schema path only.

---

## Component Registry (single source)

- **Single source:** src/engine/core/registry.tsx — type → component map. JsonRenderer resolves node.type via Registry[node.type] only; no competing maps.
- **Contract alignment:** Registry keys align with JSON_SCREEN_CONTRACT / allowed types; new molecules or atoms require Registry entry and contract update.
