# 03 — Engine Model Spec

**Purpose:** Extract from the master architecture the standard engine inputs, outputs, design rules, stacking concept, and cross-domain reuse model. Use for validation and execution planning.

---

## 1. Standard engine inputs

- **path:** string — screen path or tsx:path (loadScreen argument).
- **json:** object — screen document with root/screen/node, optional state, optional sections. After load: root = json?.root ?? json?.screen ?? json?.node ?? json.
- **context:** layout context — screenKey, sectionKey, profile (experience + template). Includes getOverridesForScreen(screenKey), getCardOverridesForScreen(screenKey), getOrganInternalLayoutOverridesForScreen(screenKey).
- **state snapshot:** getState() or useSyncExternalStore(subscribeState, getState) — DerivedState: currentView, journal, values, layoutByScreen, scans, interactions.
- **Document prep chain:** Output of assignSectionInstanceKeys → input to expandOrgansInDocument → output to applySkinBindings → output to composeOfflineScreen. Each engine receives the previous output.

---

## 2. Standard engine outputs

- **screenTree:** object — composed tree with section keys, layout applied (via applyProfileToNode). Held in current-screen-tree-store; passed to JsonRenderer as node.
- **state:** DerivedState — only via dispatchState(intent, payload); no direct mutation. Engines that need to change state call dispatchState.
- **dom:** React tree with proof attributes — data-node-id, data-section-layout, data-container-width, data-section-id. Produced by JsonRenderer and LayoutMoleculeRenderer/section.compound.
- **layout resolution:** Resolved section layout id and card preset on node (override → node.layout → template default); layout prop to Section; resolveLayout(layout) → LayoutDefinition | null.

---

## 3. Engine design rules

- **Single responsibility:** Each engine does one thing (e.g. expandOrgansInDocument only expands organs; applySkinBindings only resolves slots).
- **No cross-boundary writes:** Layout engine does not write to state-store; Logic does not write layout store or override store or node.layout; State does not mutate layout/registry/blueprint.
- **Read from spine only:** Engines read from getState(), layout/profile and override getters, current-screen-tree-store, or arguments passed by the pipeline.
- **Write through APIs only:** State changes via dispatchState; navigation via navigate(to); layout changes via applyProfileToNode (resolver) or user override (OrganPanel only).
- **Explicit fallbacks:** No silent overwrites; resolveLayout null → div only; missing Registry type → red div "Missing registry entry"; unknown intent → log only, no derived key.

---

## 4. Engine stacking concept

- **Document pipeline (page.tsx):** assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen. Order is fixed; each step consumes the previous output.
- **Render pipeline:** applyProfileToNode (per node) then renderNode (recursive). applyProfileToNode uses layout resolver, compatibility, card presets; renderNode uses JsonSkinEngine for type "json-skin", Registry for others, Section calls resolveLayout and LayoutMoleculeRenderer.
- **Action pipeline:** behavior-listener → state:* (dispatchState) **or** navigate **or** contract verbs (runBehavior) **or** interpretRuntimeVerb → action-runner → getActionHandler → handlers (runCalculator, resolveOnboarding, run25X, etc.). Only one branch runs per action; order is state:* > navigate > contract verbs > runtime verb.
- **Stacking rule:** Engines are stages in the pipeline or handlers invoked by the behavior path; they do not create alternate pipelines or alternate state stores.

---

## 5. Cross-domain reuse model

- **Shared read:** Engines and renderer read state via getState() or useSyncExternalStore(subscribeState, getState). Layout/profile and override stores are read by JsonRenderer and applyProfileToNode but not by state-resolver.
- **Shared write (state only):** Only state-store accepts app state writes, via dispatchState(intent, payload). Behavior-listener, screen-loader, action handlers, interaction-controller, etc. all call dispatchState.
- **No engine writes another engine’s store:** Logic does not write layout or override stores; Layout does not write state; Registry is read-only.
- **Reuse of resolution:** Layout resolver (resolveLayout, getDefaultSectionLayoutId), compatibility (evaluateCompatibility), content-resolver (resolveContent), organ-registry (loadOrganVariant) are used by multiple callers but remain single implementation.
- **Contract verbs and runtime verbs:** Single source for contract verb set (target: JSON or single TS module); single interpretRuntimeVerb (logic/runtime); action-registry provides handlers (runCalculator, resolveOnboarding, run25X, etc.) reused by interpretRuntimeVerb.
