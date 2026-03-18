# CONTRACTS_EXTRACTED.md — Contracts from code (with source citations)

**Purpose:** Screen JSON schema (actual keys), layout resolution order, slot/requirements, behavior intent tokens and mapping, state architecture. Every claim cites the source file(s).

---

## 1. Screen JSON schema (actual keys used)

**Authoritative contract (declared):** `src/contracts/JSON_SCREEN_CONTRACT.json`.

**Keys actually used by renderer and loader:**

- **Per-node (renderNode):**  
  **Source:** `src/engine/core/json-renderer.tsx` (renderNode, applyProfileToNode, shouldRenderNode).
  - **Required:** `type` (string). Used to look up Registry and definitions.  
    **Citation:** json-renderer.tsx line 423: `const typeKey = profiledNode.type?.toLowerCase?.() ?? ""`, line 509: `(Registry as any)[resolvedNode.type]`; JSON_SCREEN_CONTRACT.json rendererExpectations.requiredKeysPerNode: `["type"]`.
  - **Optional:** `id`, `params`, `content`, `behavior`, `onTap`, `children`, `items`, `when`, `role`, `variant`, `size`.  
    **Citation:** JSON_SCREEN_CONTRACT.json rendererExpectations.optionalKeysPerNode; json-renderer uses node.id, node.params, node.children, node.items, node.when (state/equals), node.role, node.variant, node.type.
  - **Conditional render:** `when.state`, `when.equals` — render only when `state[node.when.state] === node.when.equals`.  
    **Citation:** json-renderer.tsx (shouldRenderNode) line 225: `const { state: key, equals } = node.when`; JSON_SCREEN_CONTRACT stateModel.conditionalVisibility.
  - **Repeater:** `items` (array) → each item rendered as Card (content from item.title, item.body, item.icon|item.image).  
    **Citation:** json-renderer.tsx lines 535–571; JSON_SCREEN_CONTRACT rendererExpectations.repeaterMode.
  - **Special types:** `json-skin` → JsonSkinEngine; stepper uses `steps[]`; JournalHistory uses `params.track` and state.journal.  
    **Citation:** json-renderer.tsx 408–414 (json-skin), 535–571 (items); JSON_SCREEN_CONTRACT rendererExpectations.specialTypes.

- **Screen root / descriptor (loader + page):**  
  **Source:** `src/engine/core/screen-loader.ts`, `src/app/page.tsx`.
  - Loader applies default state from `json.state.currentView` and dispatches `state:currentView`.  
    **Citation:** screen-loader.ts lines 114–147.
  - Page uses `json?.root ?? json?.screen ?? json?.node ?? json` as render root; then `json?.state` as defaultState; `json?.data` for skin bindings.  
    **Citation:** page.tsx 368–372, 379, 467–468.

- **Atoms/molecules/organ contracts (allowed props, content, behaviors):**  
  **Source:** `src/contracts/JSON_SCREEN_CONTRACT.json` (atoms, molecules, organs, behaviorVerbs, stateModel, rendererExpectations).

**Citation:** `src/contracts/JSON_SCREEN_CONTRACT.json` (full file); `src/engine/core/json-renderer.tsx` renderNode and helpers.

---

## 2. Layout resolution order

1. **Page layout id:** From profile (template + experience) and overrides.  
   - Template + experience: `getTemplateProfile(templateId)`, `getExperienceProfile(experience)` merged in page.tsx into `effectiveProfile`.  
   **Citation:** `src/app/page.tsx` 385–403, 386: `getTemplateProfile`, 384: `getExperienceProfile` from `@/lib/layout/profile-resolver` and `@/lib/layout/template-profiles`.
2. **Per-section layout:** Section’s layout id comes from: node.layout / profile (role → section config) / section-layout-preset overrides (per-screen, per-section).  
   **Citation:** json-renderer applyProfileToNode (section layout); page.tsx sectionLayoutPresetOverrides from `getOverridesForScreen(screenKey)` (`src/state/section-layout-preset-store.ts`).
3. **Unified resolve:** `resolveLayout(layoutId, context)` returns merged page + component definition.  
   **Citation:** `src/layout/resolver/layout-resolver.ts` lines 28–41: `getPageLayoutId` → `getPageLayoutById` (page) + `resolveComponentLayout` (component) → merged LayoutDefinition.
4. **Order of resolution in resolver:**  
   - getPageLayoutId(layout, context) → page layout id;  
   - getPageLayoutById(id) → page definition;  
   - resolveComponentLayout(id) → component (molecule) layout;  
   - merge: { ...pageDef, moleculeLayout: componentDef }.  
   **Citation:** `src/layout/resolver/layout-resolver.ts`; page layout from `src/layout/page/page-layout-resolver.ts`, component from `src/layout/component/component-layout-resolver.ts`.

---

## 3. Slot / requirements system

- **Slot names (section/card):** `heading`, `body`, `image`, `card_list`. Organ internal layouts use organ profile slots (e.g. title, items, primary, logo, cta).  
  **Citation:** `src/layout/requirements/SLOT_NAMES.md`.

- **Requirement registry:** Reads JSON requirement files; returns required slots for a layout id.  
  **Source:** `src/layout/compatibility/requirement-registry.ts`.  
  - `getRequiredSlots(layoutType, layoutId, organId?)` for section | card | organ.  
  - `getRequiredSlotsForOrgan(organId, internalLayoutId)`.  
  - Data: `section-layout-requirements.json`, `card-layout-requirements.json`, `organ-internal-layout-requirements.json`.  
  **Citation:** requirement-registry.ts lines 1–78; imports from `@/layout/requirements/*.json`.

- **Content capability extractor:** Normalizes child/content to slot names (e.g. title → heading, body → body, image → image, cards → card_list).  
  **Citation:** `src/layout/compatibility/content-capability-extractor.ts` (used by compatibility-evaluator).

- **Compatibility evaluator:** Compares required slots (from requirement-registry) with available slots (from content-capability-extractor); used to filter valid layouts for dropdowns.  
  **Citation:** `src/layout/compatibility/compatibility-evaluator.ts`; exports `evaluateCompatibility`, `getAvailableSlots`, `getRequiredSlots`, `getRequiredSlotsForOrgan` from `src/layout/index.ts`.

---

## 4. Behavior intent tokens + mapping

- **State mutation intents (state-store):**  
  `state:currentView`, `state.update`, `journal.add`, `journal.set`, `scan.result`, `scan.interpreted`, `interaction.record`.  
  **Citation:** `src/state/state-resolver.ts` (deriveState): intents 45–101; JSON_SCREEN_CONTRACT stateModel.mutationIntents.

- **Action names that are state: (behavior-listener):**  
  Any `actionName.startsWith("state:")` → mutation = actionName.replace("state:", ""). Then:  
  - `currentView` → dispatchState("state:currentView", { value }).  
  - `update` → dispatchState("state.update", { key, value }).  
  - `journal.add` → dispatchState("journal.add", { track, key, value }).  
  **Citation:** `src/engine/core/behavior-listener.ts` lines 116–212.

- **Contract verb tokens (behavior-listener → behavior-runner):**  
  tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay.  
  **Citation:** `src/engine/core/behavior-listener.ts` lines 231–248.

- **Verb → handler mapping:**  
  - **Interactions:** `src/behavior/behavior-interactions.json` — tap → interact.tap, double → interact.double, long → interact.long; drag/scroll/swipe with sub-keys.  
  - **Navigations:** `src/behavior/behavior-navigations.json` — go.screen → nav.goScreen, go.modal → nav.goModal, back.one → nav.backOne, open.panel → nav.openPanel, etc.  
  - **Resolver:** `resolveBehaviorVerb(domain, action)` in `src/behavior/behavior-verb-resolver.ts`; BehaviorEngine implements handler names (e.g. nav.goScreen, interact.tap).  
  **Citation:** `src/behavior/behavior-runner.ts` (runBehavior uses interactions, navigations, resolveBehaviorVerb, BehaviorEngine); behavior-interactions.json; behavior-navigations.json.

- **UI verb map (config):** `config/ui-verb-map.json` — tap, toggle, select, open, close, expand, collapse, navigate, submit, reveal, menu, longpress with appliesTo and output. Used for documentation/config; runtime behavior uses behavior-runner + listener above.  
  **Citation:** `config/ui-verb-map.json`.

---

## 5. State architecture (append log / derive / dispatch)

- **Append-only log:** State is not mutated directly. `dispatchState(intent, payload)` appends `{ intent, payload }` to a log array.  
  **Citation:** `src/state/state-store.ts` lines 16–17 (log array), 48 (log.push).

- **Derive:** Current state is always `deriveState(log)`. No in-place mutation of state.  
  **Citation:** `src/state/state-store.ts` lines 17, 52–54 (state = deriveState(log)); `src/state/state-resolver.ts` export function deriveState(log).

- **Dispatch:** `dispatchState(intent, payload)` — push to log, set state = deriveState(log), then call all listeners. Re-entrancy guard: do not dispatch during derivation.  
  **Citation:** `src/state/state-store.ts` lines 43–64, 26 (isDeriving guard).

- **Derived state shape:** journal (Record&lt;track, Record&lt;key, string&gt;&gt;), rawCount, currentView?, scans?, interactions?, values? (generic key/value for inputs and engines).  
  **Citation:** `src/state/state-resolver.ts` DerivedState type and deriveState implementation (lines 8–106).

- **Persistence:** Log is persisted to `localStorage.__app_state_log__` on dispatch except when intent === "state.update". On bootstrap, rehydrate() reads log and re-runs deriveState.  
  **Citation:** `src/state/state-store.ts` KEY, persist(), rehydrate(), bootstrap block.

- **Event bridge:** Legacy `state-mutate` custom event is forwarded to dispatchState(name, payload).  
  **Citation:** `src/state/state-store.ts` installStateMutateBridge.

All paths relative to repo root.
