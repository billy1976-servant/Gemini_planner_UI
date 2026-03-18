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
- **Registry map (key types):** screen/Screen → fragment; text/Text, media/Media, surface/Surface, sequence/Sequence, trigger/Trigger, collection/Collection, condition/Condition, shell/Shell, fieldatom/FieldAtom, textarea/Textarea → primitives (9-atoms); section/Section, button/Button, card/Card, avatar/Avatar, chip/Chip, field/Field, footer/Footer, list/List, modal/Modal, stepper/Stepper, toast/Toast, toolbar/Toolbar → 12-molecules; row/Row, column/Column, grid/Grid, stack/Stack, page/Page → layout molecules; UserInputViewer, JournalHistory variants. Lookup: (Registry as any)[resolvedNode.type]; missing → red div "Missing registry entry"; invalid component type → console.error, return null.

---

## Organ expansion contract

- **Entry:** page.tsx (JSON branch) → assignSectionInstanceKeys(rawChildren) → docForOrgans → expandOrgansInDocument(docForOrgans, loadOrganVariant, organInternalLayoutOverrides) → finalChildren.
- **Organ detection:** type lowercase trimmed === "organ"; organId = node.organId ?? ""; instanceKey = node.id ?? ""; variantId = overrides[instanceKey] ?? overrides[organId] ?? node.variant ?? "default".
- **loadOrganVariant(organId, variantId):** organ-registry.ts; VARIANTS[normalizedOrgan][normalizedVariant] ?? VARIANTS[normalizedOrgan]["default"]; returns variant root node or null. Variants from src/organs/{header,hero,nav,footer,...}/variants/*.json.
- **Merge order:** variant (layout, params, content) then node (layout, params, content) deep-merged; merged.id = n.id ?? merged.id; merged.params.internalLayoutId = variantId; children recursively expandOrgans.
- **Organ vs section layout:** Section layout id from applyProfileToNode (override → node.layout → template default). Organ internal layout: Section compound when role in getOrganLayoutOrganIds() uses resolveInternalLayoutId(role, params.internalLayoutId); organ variant moleculeLayout overrides layoutDef.moleculeLayout. Overrides passed from page (getOrganInternalLayoutOverridesForScreen) into expandOrgansInDocument and applyProfileToNode.

---

## Skin application contract- **applySkinBindings(doc, data):** src/logic/bridges/skinBindings.apply.ts. Resolves type "slot" nodes via slotKey into data; getByPath(data, slot.slotKey); if value is array of nodes, use as replacement; else []. Returns doc with only renderable nodes (no slot nodes). No CSS/token injection here; visual tokens from profile, template, applyProfileToNode (visualPreset, spacingScale, cardPreset).
- **Slot node contract:** type === "slot", slotKey string (dot path e.g. "products.featured", "nav.items"). Used in page.tsx: applySkinBindings(expandedDoc, json?.data ?? {}). SiteSkin and engineToSkin.bridge also call applySkinBindings.
- **Theme / visual preset:** getExperienceProfile, getTemplateProfile; layout-store (templateId, experience, mode); applyProfileToNode merges profile, getVisualPresetForMolecule, getSpacingForScale, getCardPreset. Palette from palette-store/palette-resolver, not skinBindings.
- **json-skin type:** Rendered by JsonSkinEngine; selectActiveChildren (when.state/equals); no separate skin resolver for json-skin.

---

## Structural Unification (Round 2) — Engine contract seal

- **Single execution contract:** All trunk engines are invoked via action-registry (getActionHandler) or landing-page-resolver / behavior-listener. engine-registry (flow/TSX path) and action-registry (trunk) both use types from @/contracts/SystemContract (ExecutionEngineContract). No second pipeline.
- **Trunk actions:** All actions (runCalculator, run25x, resolveOnboarding, etc.) go through action-registry; no direct runCalculator from outside.
- **Single engine set:** logic/engines is the single micro-engine set; logic/onboarding-engines re-exports from logic/engines only.
- **Secondary paths (documented, not trunk):** GeneratedSiteViewer, SiteSkin, flow-loader, FlowRenderer — they do not define an alternate runtime; they may reuse JsonRenderer or a separate tree.
- **Dead paths (documented):** EngineRunner (engine/runners/engine-runner.tsx) — event-only, not on page tree. ScreenRenderer (screens/core/ScreenRenderer.tsx) — DEAD; remove from build or stub if needed.
