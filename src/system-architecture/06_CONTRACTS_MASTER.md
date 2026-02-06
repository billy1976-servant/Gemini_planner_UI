# 06 — Contracts Master

**Source:** Compiled from `src/contracts/`, `src/docs/ARCHITECTURE_AUTOGEN/` contract-related docs, STATE_FLOW_CONTRACT, RUNTIME_PIPELINE_CONTRACT, LAYOUT_RESOLUTION_CONTRACT. This is the anchor definition layer.

---

## State contract

- **Observed keys (written/read):** currentView, journal, values, layoutByScreen, scans, interactions (derived in state-resolver). values.<key> written in state-store, behavior-listener, screen-loader; read in state-resolver, getState() consumers.
- **Intents:** state:currentView, journal.set / journal.add, state.update, layout.override, scan.result / scan.interpreted, interaction.record.
- **Derived shape:** DerivedState in state-resolver (journal, rawCount, currentView, values, layoutByScreen, scans, interactions).

---

## Engine I/O contract

- **Standard engine input envelope:** path: string (screen path or tsx:path); json: object (screen document with root/screen/node, state?, sections?); context: layout context (screenKey, sectionKey, profile).
- **Standard engine output envelope:** screenTree: object (composed tree, section keys, layout applied); state: DerivedState; dom: React tree → data-node-id, data-section-layout, data-container-width.
- **Where enforced (or should be):** screen-loader.ts, state-store.ts, json-renderer.tsx.

---

## Layout resolution contract

- **Precedence (section):** override (store) → node.layout → template defaultSectionLayoutId → undefined.
- **Section params:** layout-related keys stripped; layout id passed as layout prop to Section.
- **resolveLayout(layout)** → LayoutDefinition | null; Section when null renders div only (no fallback layout ID).
- **Stores:** section-layout-preset-store, card (same store), organ-internal-layout-store; passed as overrides to JsonRenderer.

---

## Blueprint / runtime interface

- **Compiler output:** app.json, content.manifest.json under apps-offline/apps/<appPath>/; tree: id, type, children, content, optional role/behavior/params; no section layout keys in params; no screen IDs; no layout primitive nodes (or collapsed in dev).
- **Runtime expects:** root/screen/node or self; optional state.currentView; optional data; section layout from store/template/node.layout only.
- **Must NOT generate:** section layout in params; screen IDs for load; layout primitive nodes as content nodes.
- **Contract 9.2:** Screen tree must not contain layout primitive node types (Grid, Row, Column, Stack) as content nodes; hasLayoutNodeType / collapseLayoutNodes in dev.

---

## ENGINE_LAWS (src/contracts/ENGINE_LAWS.md)

1. **WRAPPER LAW** — When inspecting child nodes in compounds, read from child.props.node, not child.props (MaybeDebugWrapper). Applies to split layouts, media detection.
2. **PRESET OVERRIDE LAW** — Section/Card presets merged after templates and win in conflicts. Order: Base → Template → Experience → Preset → Node Overrides.
3. **HERO IS NOT A NORMAL SECTION LAW** — Hero requires explicit hero presets for container width, padding, alignment, media; never default section styling.
4. **WRAPPER RULE** — Check both child.props and child.props.node for wrapped components.
5. **SPLIT LAYOUT REQUIRES 3 CONDITIONS** — params.split, moleculeLayout.type === "row", media child detected via WRAPPER LAW.
6. **TEMPLATES DEFINE STRUCTURE, PRESETS DEFINE STYLE**
7. **PARAM MERGE MUST BE NON-DESTRUCTIVE** — Deep-merge; never replace entire objects (moleculeLayout, split, spacing, containerWidth).
8. **CONTENT LIVES ON NODE, NOT COMPONENT** — Resolved node is source of truth.
9. **ENGINE LOGS TELL TRUTH, UI DOES NOT** — Trust renderer console logs when debugging.
10. **SECTION LAYOUT ≠ CARD LAYOUT** — Section layout = split/grid; card layout = internal card content flow.
11. **IF A LAYOUT DEPENDS ON CHILD TYPE, IT IS A COMPOUND RESPONSIBILITY** — Fix in compound, not renderer.

---

## Param key mapping (src/contracts/PARAM_KEY_MAPPING.md)

- **Canonical mapping:** JSON_SCREEN_CONTRACT allowedParams ↔ definitions (src/compounds/ui/definitions/*.json) ↔ compound props (12-molecules/*.compound.tsx). Layout and visual params (moleculeLayout, gap, padding, surface, etc.) come from definitions, palette, Layout Engine, Preset System at runtime — not screen JSON.
- **Molecules:** button (surface, label, trigger, supportingText); card (surface, media, title, body); section (title, role); chip, avatar, field, toast, footer, list, modal, toolbar — surface + content keys per contract.
- **Validation:** Definition keys must match; compounds read params.<key>; screen JSON must not contain layout/visual param keys.

---

## Pipeline and boundaries (reference)

- **Behavior branch order:** state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn.
- **loadScreen:** path must contain "/" or start with "tsx:"; TSX no fetch; JSON fetch /api/screens/${normalized}; state init if json.state?.currentView.
- **Override stores:** section-layout-preset-store, card (same), organ-internal-layout-store — one table; passed to JsonRenderer.
- **State persistence:** localStorage key in state-store; append-only log; deriveState; rehydration; no new persistence without contract update.
- **Component Registry:** Single source registry.tsx; no duplicate type→component maps; new types require Registry + contract update.
- **Scripts boundary:** No script under src/scripts/ imported by app/engine/state/layout at runtime.

---

## Data flow contract (transform vs display)

- **Pipeline stages:** Blueprint (transform) → API (read) → loadScreen (state init) → root resolution → assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen → setCurrentScreenTree / collapseLayoutNodes → applyProfileToNode → renderNode (transform + display) → Section / LayoutMoleculeRenderer (display) → Registry components (display).
- **Filtering/mapping:** shouldRenderNode (when/state); repeater (items → Card nodes); expandOrgans (organ → variant); resolveSlotNode (slot → data[slotKey]); JsonSkinEngine selectActiveChildren (when/state); evaluateCompatibility (required vs available slots).

---

## Organ expansion contract

- **Entry:** expandOrgansInDocument(doc, loadOrganVariant, overrides); doc.nodes and/or doc.regions. assignSectionInstanceKeys before expand (stable id = node.id ?? \`section-${index}\`).
- **Variant selection:** variantId = overrides[instanceKey] ?? overrides[organId] ?? node.variant ?? "default"; loadOrganVariant(organId, variantId) from organ-registry (VARIANTS).
- **Merge:** variant then node (layout, params, content) deep-merged; merged.params.internalLayoutId = variantId; children recursively expandOrgans. Organ node replaced by merged variant root or original node if variant null.
- **Organ layout vs section:** Section layout id from applyProfileToNode; organ internal from resolveInternalLayoutId(role, params.internalLayoutId); organ variant moleculeLayout overrides layoutDef.moleculeLayout in Section compound.

---

## Skin application contract

- **applySkinBindings(doc, data):** Resolves type "slot" (slotKey) into data; array of nodes or []. No theme tokens; theme from profile, template, applyProfileToNode (visualPreset, spacingScale, cardPreset). Slot contract: type "slot", slotKey string.
- **Consumers:** JsonRenderer (tree after applySkinBindings); JsonSkinEngine (type "json-skin", when/state); SiteSkin (data prop, data-skin-* attributes). Palette from palette-store/palette-resolver.

---

## Runtime fallbacks (anchor)

- **Layout:** getPageLayoutById id not in pageLayouts → null; resolveLayout !layoutId or !pageDef → null; Section layoutDef == null → div only; getDefaultSectionLayoutId no template/defaultLayout → undefined.
- **Registry:** Registry[type] falsy → red div "Missing registry entry"; !isValidReactComponentType → console.error, null.
- **Behavior:** !actionName → warn return; navigate !params.to → warn return; runBehavior throws → warn return; unhandled → warn.
- **State:** deriveState unknown intent → no derived key; ensureInitialView !state?.currentView → dispatchState state:currentView. Organ/slot: loadOrganVariant unknown → null; expandOrgans variant null → original node; resolveSlotNode missing → [].

---

## State shape contract (derived)

- **Derived keys:** journal (track→key→value), rawCount, currentView, scans, interactions, values. Intent → key: state:currentView → currentView; journal.set/add → journal; state.update → values[key]; scan.result/interpreted → scans; interaction.record → interactions.
- **Default on load:** loadScreen json.state.currentView → dispatchState; ensureInitialView if !state?.currentView; JsonRenderer defaultState = json?.state.
- **Persisted:** __app_state_log__ (log only); state.update skips persist; rehydrate on bootstrap.

---

## Authority precedence (cross-domain)

- **Layout:** User override → Explicit node.layout → Logic suggestion [reserved] → Template default → undefined. Override writers: UI only (OrganPanel). Implemented in applyProfileToNode.
- **State:** currentView/journal/values — last event wins; screen load applies default then event log. Persistence: full log except state.update.
- **Behavior:** Action routing state:* > navigate > contract verbs > runtime verb. runBehavior: fromAction → fromInteraction → fromNavigation; first non-null wins. Hard fallbacks: getPageLayoutById/resolveLayout/Section/ensureInitialView/getDefaultSectionLayoutId as above.

---

## Boundary separation (contract)

- **No cross-boundary writes:** Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry. Layout must not write state/behavior/logic; Logic must not write layout/override/node.layout (only preference memory via Plan 6); State must not mutate layout/registry/blueprint; Behavior must not resolve layout/organs; Blueprint build-time only; Registry read-only.
- **Integration surfaces:** dispatchState (state); runBehavior, interpretRuntimeVerb (behavior → logic/state); applyProfileToNode (layout from profile/override); loadScreen (screen → state default). Checklist: any new cross-boundary write must use documented integration point or update BOUNDARY_SEPARATION_CHECKLIST and PIPELINE_AND_BOUNDARIES_REFERENCE / STATE_MUTATION_SURFACE_MAP.
