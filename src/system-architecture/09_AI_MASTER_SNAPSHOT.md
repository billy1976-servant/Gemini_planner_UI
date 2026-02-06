# 09 — AI Master Snapshot

**Purpose:** Single file for ChatGPT and other AIs (and humans) to understand the entire HiSense system immediately. Compiled from existing docs and system-reports; no regeneration. Use for orientation, refactor stability, and diagnosis.

---

## 1. System purpose

HiSense is a **JSON-driven UI system**. Screens and skins are defined in JSON (blueprint + content), compiled to runtime trees, and rendered by one engine (JsonRenderer + Registry). Logic and behavior use CustomEvents and an **append-only state log**. There is also a site compiler (snapshot → schema) and skin pipeline; the **primary path** is JSON screen → engines → state → layout → renderer → DOM. Refactor direction: ship shippable website/app skins from the existing pipeline without replacing engines, molecules, or renderer; lock docs and contracts first.

---

## 2. Spine (authoritative flow)

**JSON Screen → Engines → State → Layout → Renderer → DOM**

- **JSON Screen:** page.tsx (entry; searchParams screen/flow; loadScreen); API route GET /api/screens/[...path]; screen-loader (loadScreen: TSX descriptor or fetch; dispatchState state:currentView if json.state).
- **Engines:** page.tsx (assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen); palette-bridge (applySkinBindings); behavior-listener (action → state:* | navigate | runBehavior | interpretRuntimeVerb); behavior-runner; engine-bridge.
- **State:** state-store (dispatchState, log, persist/rehydrate, listeners); state-resolver (deriveState: currentView, journal, values, layoutByScreen, scans, interactions).
- **Layout:** layout-resolver (resolveLayout, getDefaultSectionLayoutId); layout index; layout-store; molecule-layout-resolver; section/organ override stores.
- **Renderer:** json-renderer (JsonRenderer, renderNode, applyProfileToNode, Registry); registry.tsx; section.compound → resolveLayout → LayoutMoleculeRenderer or div.
- **DOM:** data-node-id, data-section-id, data-section-layout, data-container-width (proof attributes).

---

## 3. Runtime pipeline (order)

1. **Request** — page.tsx → searchParams screen/flow; resolveLandingPage when no screen.
2. **Screen load** — loadScreen(path): TSX → descriptor; JSON → fetch /api/screens, then dispatchState("state:currentView", …) if json.state?.currentView, return json.
3. **Document prep** — root = json?.root ?? json?.screen ?? json?.node ?? json; assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen → setCurrentScreenTree; optional collapseLayoutNodes (dev).
4. **Layout resolution** — Profile (experience + template); overrides from section/card/organ stores; applyProfileToNode: section layout id = override → node.layout → template default; resolveLayout(layout) → LayoutDefinition | null; Section: null → div only.
5. **Rendering** — renderNode (recursive); shouldRenderNode; Registry[type]; Section uses resolveLayout → LayoutMoleculeRenderer or div.
6. **Behavior** — state:* → dispatchState; navigate → navigate(to); contract verbs → runBehavior; else interpretRuntimeVerb → action-runner → handlers. input-change → dispatchState("state.update", { key, value }).
7. **State update** — dispatchState → log.push; deriveState(log) → DerivedState; persist (except state.update); notify listeners.

---

## 4. Engine model

- **Primary renderer:** JsonRenderer only for main JSON path. Secondary: renderFromSchema, GeneratedSiteViewer, SiteSkin (site/TSX flows).
- **ACTIVE on main path:** JsonSkinEngine, Onboarding-flow-router, engine-bridge, action-runner, action-registry, 25x, resolve-onboarding, run-calculator, layout resolver/compatibility, content-resolver, skinBindings.apply, runtime-verb-interpreter.
- **DISCONNECTED:** Flow/engine-registry path (learning, calculator, decision, summary, flow-router, etc.); Layout Decision Engine, Contextual Layout Logic, Trait Registry (documented, not implemented).
- **Blueprint:** Build-time only; outputs app.json + content.manifest.json; no blueprint script in runtime; no runtime layout IDs from blueprint.
- **Registry:** Single source registry.tsx; type → component; no duplicate maps.

---

## 5. State philosophy

- **Single source of truth:** state-store holds append-only log; state = deriveState(log). Derived: currentView, journal, values, layoutByScreen, scans, interactions.
- **Intents:** state:currentView, state.update, journal.set/add, scan.result/interpreted, interaction.record. New intents require state-resolver branch + contract doc.
- **Persistence:** localStorage (log only); rehydrate on boot; skip persist for state.update (high-frequency).
- **Layout/profile/overrides:** Separate stores (layout-store, section-layout-preset-store, organ-internal-layout-store); they do not read from state-store.

---

## 6. Layout flow

- **Precedence (section):** override (store) → explicit node.layout → template default → undefined. No invented layout ID; when resolveLayout returns null, Section renders div only.
- **Stores:** section-layout-preset-store (section + card overrides), organ-internal-layout-store. Passed to JsonRenderer as overrides.
- **Resolvers:** layout-resolver (resolveLayout, getDefaultSectionLayoutId); page (page-layouts, templates); component (component-layouts); compatibility (evaluateCompatibility, required vs available slots).
- **Planned (not built):** Layout Decision Engine (trait scoring), Contextual Layout Logic (content → traits), Trait Registry (layout ID → traits JSON).

---

## 7. Contracts role

- **State contract:** Observed keys and intents; derived shape (DerivedState). All mutation surfaces in STATE_MUTATION_SURFACE_MAP; intents in STATE_INTENTS.
- **Engine I/O:** Input (path, json, context); output (screenTree, state, dom). Enforced at screen-loader, state-store, json-renderer.
- **Layout:** Precedence and stores; resolveLayout → definition or null; no layout primitives in screen tree (collapse in dev).
- **Blueprint:** Compiler output shape; runtime expects root/screen/node, optional state.currentView; must not generate section layout in params, screen IDs, layout primitive nodes.
- **ENGINE_LAWS:** Wrapper law (child.props.node), preset override order, hero presets, split conditions, param merge non-destructive, content on node, section ≠ card layout, compound responsibility for child-dependent layout.
- **Param key mapping:** Contract ↔ definitions ↔ compounds; layout/visual params from runtime (definitions, palette, Layout Engine), not screen JSON.

---

## 8. System map (orientation)

- **Seed:** page.tsx, layout.tsx, json-renderer, behavior-listener, screen-loader, state-store, layout/index.ts, registry, state-resolver, action-registry, runtime-verb-interpreter.
- **Reachability:** ~110 REACHABLE, ~401 UNREACHABLE from seed. Trunk: page.tsx, API route, screen-loader. Central files: state-store, molecule-layout-resolver, json-renderer, registry, page.tsx, layout-store.
- **Call graph:** App entry → Screen resolution → Layout resolution → Render pipeline → Behavior (see RUNTIME_CALL_GRAPH.generated.md and 07_SYSTEM_MAP.md).

---

## 9. Debug recipe (browser proof)

- **Section identity:** data-section-id on section wrapper (section.compound); data-section-layout, data-container-width on layout wrapper (LayoutMoleculeRenderer).
- **Node identity:** data-node-id on node wrappers (json-renderer). In dev, data-section-debug may show sectionKey, containerWidth.
- **Files:** section.compound.tsx (data-section-id); LayoutMoleculeRenderer.tsx (data-section-layout, data-container-width); json-renderer.tsx (data-node-id).

---

## 10. What this pack is and is not

- **Is:** A consolidation layer. Reads from src/docs/ARCHITECTURE_AUTOGEN, SYSTEM_MAP_AUTOGEN, system-reports/snapshots and summaries, src/contracts. Preserves technical detail; does not summarize away system intelligence.
- **Is not:** A rescan, rebuild, or generator. Does not delete, rename, or modify any existing file. Does not touch generate-reachability-report.ts, system-diagnostics.generator.ts, or runtime/engine/state/layout/compiler/ingest code. Original 60+ docs and system-reports remain untouched; scanners run as before. This pack is Phase 1: Stabilize + Consolidate + Map; refactor happens later.

**Use this snapshot to:** (1) Verify each spine stage in order when diagnosing. (2) Check state and engine I/O contracts for expected shapes and enforcement points. (3) Trace into Renderer and DOM using the debug recipe. (4) Use the system map for central files and trunk entrypoints.

---

## 11. Data flow (one-line)

Blueprint (transform) → API (read) → loadScreen (state init) → page root + assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen → applyProfileToNode (layout id, strip params, merge presets) → renderNode (when, repeater, Registry) → Section/LayoutMoleculeRenderer (display) → Registry components (display). Filtering: shouldRenderNode, repeater, expandOrgans, resolveSlotNode, evaluateCompatibility.

---

## 12. Boundaries and integration APIs

- **Boundaries:** Layout, Logic, State, Behavior, Blueprint, Organs, Registry — distinct; no cross-boundary writes. Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry.
- **Integration only via:** dispatchState (state); runBehavior, interpretRuntimeVerb (behavior → logic/state); applyProfileToNode (layout from profile/override); loadScreen (screen doc → state default). Override writers: UI only (OrganPanel). Logic may read section node, compatible set, override maps, viewport, preference weights (read-only); Logic may write only preference memory (Plan 6) when implemented.

---

## 13. Fallbacks (no silent overwrites)

- **Layout:** resolveLayout null → Section renders div only; getDefaultSectionLayoutId missing → undefined. No invented layout ID.
- **Registry:** Missing type → red div "Missing registry entry"; invalid component type → console.error, null.
- **Behavior:** Missing action name / missing navigate 'to' / runBehavior throw → warn and return; unhandled action → warn.
- **State:** Unknown intent → log only, no derived key; ensureInitialView when !state?.currentView → dispatchState state:currentView. Organ/slot: unknown variant → null or original node; missing slot data → [].

---

## 14. State shape and persistence

- **Derived shape:** journal (track→key→value), rawCount, currentView, scans, interactions, values. Last event wins per key. Default on load from json.state and ensureInitialView.
- **Persisted:** __app_state_log__ (log only); state.update skips persist; rehydrate on bootstrap. Layout and override stores are separate (section-layout-preset-store, organ-internal-layout-store) with their own localStorage keys.

---

## 15. Authority precedence (single reference)

- **Layout:** User override → Explicit node.layout → Logic suggestion [reserved] → Template default → undefined. Implemented in applyProfileToNode. Override writers: OrganPanel only.
- **State:** currentView, journal, values — last event wins. Persistence: full log except state.update.
- **Behavior (listener):** state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn. runBehavior: fromAction → fromInteraction → fromNavigation; first non-null wins.

---

## 16. Disconnected systems (summary)

- **Layout:** Decision Engine, Trait Registry, Suggestion Injection, Contextual Logic, User Preference — documented, not wired; resolver precedence override → explicit → template default.
- **Logic:** engine-registry, learning/calculator/decision/summary/flow — TSX/flow path only; unreachable from seed import graph; run when ?screen=tsx:... or ?flow=....
- **Blueprint/API:** Site compiler, API routes — invoked by HTTP or scripts; not imported by app/engine/state/layout.
- **Screens/TSX:** engine-viewer, FlowRenderer, onboarding — dynamic load; not in seed reachability. State, Behavior, Organs on main path are reachable and wired.
