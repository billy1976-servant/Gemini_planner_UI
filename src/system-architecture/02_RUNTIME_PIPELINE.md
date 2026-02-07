# 02 — Runtime Pipeline

**Source:** Compiled from `src/docs/ARCHITECTURE_AUTOGEN/RUNTIME_PIPELINE_CONTRACT.md`, `PIPELINE_AND_BOUNDARIES_REFERENCE.md`, `RUNTIME_AUTHORITY_LADDER.md`. Deterministic trace: Request → Screen Load → Layout Resolution → Rendering → Behavior → State Update.

**Single runtime entry spine:** One path for JSON screens: page.tsx → loadScreen → document prep (assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen) → setCurrentScreenTree → JsonRenderer → layout.getSectionLayoutId + resolveLayout (layout module) → Section / LayoutMoleculeRenderer → behavior-listener → state-resolver. No second renderer or layout-application entrypoint; JsonRenderer is the only renderer on the main JSON path and delegates section layout id to the layout module.

**Trunk vs secondary (non-trunk):** The trunk is the path above. The following are explicitly **not trunk** and must not be used as a second main pipeline: GeneratedSiteViewer, SiteSkin, flow-loader, applyEngineOverlays. They may reuse JsonRenderer or a separate tree for secondary flows (e.g. TSX/flow screens). No alternate screen-load entry competes with page → loadScreen → JsonRenderer for primary JSON.

---

## 1. Request → Screen path resolution

| Stage | File | Function / entry | Input | Output / next |
|-------|------|------------------|-------|--------------|
| Next.js route | `src/app/page.tsx` | Page (default export) | Request (URL) | useSearchParams() → screen |
| Query read | `src/app/page.tsx` | searchParams.get("screen"), searchParams.get("flow") | — | screen string or flow; flow → loadScreen("tsx:tsx-screens/onboarding/engine-viewer") |
| No screen | `src/app/page.tsx` | resolveLandingPage() | — | { flow, content }; if content, merged into landing with root: { type: "json-skin", children } |

---

## 2. Screen load

| Stage | File | Function | Input | Output / next |
|-------|------|----------|-------|---------------|
| Load entry | `src/app/page.tsx` | loadScreen(screen) (useEffect) | path: string | Promise: { __type: "tsx-screen", path } or raw JSON screen |
| Loader TSX | `src/engine/core/screen-loader.ts` | loadScreen | path (contains "/" or starts with "tsx:") | If tsx: return descriptor; page sets TsxComponent, setJson(null) |
| Loader JSON | `src/engine/core/screen-loader.ts` | loadScreen | Normalized path (strip leading /, src/, apps-offline/apps/, apps/) | Fetch GET /api/screens/${normalized}?t=... |
| API handler | `src/app/api/screens/[...path]/route.ts` | GET | params.path | Reads src/apps-offline/apps/... + .json; NextResponse.json(json) or 404 |
| State init | `src/engine/core/screen-loader.ts` | After res.json() | json.state?.currentView | dispatchState("state:currentView", { value }) if present; return json |
| Page state | `src/app/page.tsx` | .then((data) => { ... }) | Load result | JSON: setJson(data); TSX: setTsxComponent, setJson(null) |

---

## 3. Document preparation (JSON branch only)

Order in page.tsx:

1. **assignSectionInstanceKeys** (from @/organs/resolve-organs) — stable instance keys on children.
2. **expandOrgansInDocument** (docForOrgans, loadOrganVariant, organInternalLayoutOverrides).
3. **applySkinBindings** (expandedDoc, json?.data ?? {}) from @/logic/bridges/skinBindings.apply.
4. **composeOfflineScreen** ({ rootNode, experienceProfile, layoutState }) from @/lib/screens/compose-offline-screen.

Then setCurrentScreenTree(composed); optional collapseLayoutNodes in dev (hasLayoutNodeType).

---

## 4. Layout resolution (per-section / per-node in renderer)

- **Profile:** getExperienceProfile(experience), getTemplateProfile(templateId) → effectiveProfile; passed as profileOverride to JsonRenderer.
- **Overrides:** getOverridesForScreen(screenKey), getCardOverridesForScreen(screenKey), getOrganInternalLayoutOverridesForScreen(screenKey) → sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides.
- **JsonRenderer:** useSyncExternalStore(subscribeLayout, getLayout); useSyncExternalStore(subscribeState, getState). applyProfileToNode calls **layout.getSectionLayoutId** (sectionKey, node, templateId, overrides) for section layout id; no inline override/node/template logic. Section params stripped of layout keys (moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split).
- **Section layout id:** Authority in layout module (getSectionLayoutId): override → node.layout → template role → template default. Section compound receives layout prop; **resolveLayout(layout)** from @/layout → LayoutDefinition | null; when null, render div wrapper only (no LayoutMoleculeRenderer).

---

## 5. Rendering (per node)

- **renderNode** (recursive): shouldRenderNode (node.when, state); Registry[resolvedNode.type]; props = node minus type/key; section keeps layout.
- **Section:** resolveLayout(layout) from @/layout → LayoutMoleculeRenderer or div wrapper when layoutDef == null.
- **LayoutMoleculeRenderer:** layout, params, content, children → section structure (surface, split/grid/column); data-section-layout, data-container-width.

---

## 6. Behavior (user gesture → event → handler)

**Branch order (single reference):** state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn.

| Stage | File | Trigger | Effect |
|-------|------|---------|--------|
| Install | `src/app/layout.tsx` | installBehaviorListener(navigate) | Listener installed once |
| Tap / action | Button etc. | handleTap | CustomEvent "navigate" or "action" (detail: { to } or behavior) |
| navigate | behavior-listener | window "navigate" | navigate(destination) |
| action | behavior-listener | window "action" | state:* → dispatchState; navigate → navigate(to); contract verbs → runBehavior(domain, actionName, …); else interpretRuntimeVerb |
| input-change | behavior-listener | window "input-change" | dispatchState("state.update", { key: fieldKey, value }) |

Contract verbs: tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay.

---

## 7. State update

- **dispatchState(intent, payload)** → log.push({ intent, payload }).
- **deriveState(log)** (state-resolver) → DerivedState: currentView, journal, values, layoutByScreen, scans, interactions.
- **persist()** — localStorage (skip when intent === "state.update"); rehydrate on boot.
- **listeners.forEach(l => l())** → subscribers (e.g. JsonRenderer) re-run.

---

## Renderer classification (single table)

| Renderer | Role | File |
|----------|------|------|
| JsonRenderer | PRIMARY | src/engine/core/json-renderer.tsx — main runtime renderer for JSON screens |
| renderFromSchema | SECONDARY | src/lib/site-renderer/renderFromSchema.tsx — site/website flows |
| GeneratedSiteViewer | SECONDARY | src/engine/site-runtime/GeneratedSiteViewer.tsx — generated-websites screens |
| ScreenRenderer | DEAD | Not on main path |
| SiteSkin | SECONDARY | Shells; preview/alternate flows |
| EngineRunner | DEAD / PARTIAL | hicurv.app.load; not on page → loadScreen → JsonRenderer path |

---

## Override stores (one table)

| Store | File | Purpose |
|-------|------|---------|
| section-layout-preset-store | src/state/section-layout-preset-store.ts | Per-screen, per-section: section layout id; getOverridesForScreen, setSectionLayoutPresetOverride |
| Card overrides | same store | getCardOverridesForScreen, setCardLayoutPresetOverride |
| organ-internal-layout-store | src/state/organ-internal-layout-store.ts | getOrganInternalLayoutOverridesForScreen, setOrganInternalLayoutOverride |

Passed from page to JsonRenderer as sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides.

---

## Data flow stages (transform vs display)

| Stage | File(s) | Transform or display | In → out |
|-------|---------|----------------------|----------|
| Blueprint compile | blueprint.ts | Transform | blueprint + content → app.json (id, type, children, content, role, params, behavior) |
| API serve screen | api/screens/[...path]/route.ts | Read | Reads apps-offline/apps/...path.json; returns JSON |
| loadScreen | screen-loader.ts | Transform (state init) | Fetch JSON; if json.state?.currentView, dispatchState; return json |
| Root resolution | page.tsx | Transform | renderNode = json?.root ?? json?.screen ?? json?.node ?? json |
| assignSectionInstanceKeys | resolve-organs.ts | Transform | children get id = node.id ?? \`section-${i}\` |
| expandOrgansInDocument | resolve-organs.ts | Transform | type "organ" → variant tree; params.internalLayoutId = variantId |
| applySkinBindings | skinBindings.apply.ts | Transform | type "slot" → data[slotKey] (array of nodes or []) |
| composeOfflineScreen | compose-offline-screen.ts | Transform | inferRolesFromOfflineTree (role for sections without role) |
| applyProfileToNode | json-renderer.tsx | Transform | Section layout id; strip layout keys; card preset merged; spacing/profile |
| renderNode | json-renderer.tsx | Transform + display | shouldRenderNode; repeater → items; Registry[type]; Section → resolveLayout → LayoutMoleculeRenderer or div |
| Section / LayoutMoleculeRenderer | section.compound, LayoutMoleculeRenderer | Display | Layout structure and children |

---

## Behavior event wiring (DOM → listener → routing)

- **Stage 1 (DOM):** field.tsx → CustomEvent("input-change", { detail: { value, fieldKey } }). button/card/chip/list/avatar/footer/stepper/toolbar/toast → handleTap → CustomEvent("navigate", { detail: { to } }) or CustomEvent("action", { detail: behavior }) or CustomEvent("interaction", { detail: behavior }).
- **Stage 2 (listener):** input-change → dispatchState("state.update", { key: fieldKey, value }). navigate → navigate(destination). action → branch by actionName (Stage 3).
- **Stage 3 (action routing):** state:* → dispatchState. navigate → navigate(params.to). Contract verb set → runBehavior(domain, actionName, { navigate }, params). visual-proof → DOM proof. Else → interpretRuntimeVerb(verb, getState()).
- **Stage 4 (runBehavior):** resolveBehaviorVerb(domain, verb); BehaviorEngine[handlerName](ctx, args); if navigation → fireNavigation(ctx, result?.target ?? args?.target).
- **Stage 5 (runtime verb):** interpretRuntimeVerb → runAction(action, state) → getActionHandler(action.name) → handler (runCalculator, run25X, resolveOnboardingAction, etc.). JsonSkinEngine → recordInteraction → interaction-controller → dispatchState("interaction.record") and optionally interpretRuntimeVerb.

---

## Runtime fallbacks (hardcoded; no override layer)

| Location | Condition | Fallback | File |
|----------|-----------|----------|------|
| getPageLayoutById | id not in pageLayouts | null | page-layout-resolver.ts |
| resolveLayout | !layoutId or !pageDef | null | layout-resolver.ts |
| Section compound | layoutDef == null | Render div only (no LayoutMoleculeRenderer) | section.compound.tsx |
| getDefaultSectionLayoutId | No template or no defaultLayout | undefined | page-layout-resolver.ts |
| renderNode | Registry[type] falsy | Red div: "Missing registry entry: &lt;type&gt;" | json-renderer.tsx |
| renderNode | !isValidReactComponentType(Component) | console.error; return null | json-renderer.tsx |
| behavior-listener | !actionName | console.warn("[action] Missing action name"); return | behavior-listener.ts |
| behavior-listener | navigate without params.to | console.warn("[action:navigate] Missing 'to'"); return | behavior-listener.ts |
| behavior-listener | runBehavior throws | console.warn("[behavior-runner] failed"); return | behavior-listener.ts |
| behavior-listener | Unhandled action | console.warn("[action] Unhandled action:", actionName) | behavior-listener.ts |
| deriveState | intent not in handled set | No derived key; intent in log only | state-resolver.ts |
| shouldRenderNode | state[key] and defaultState[key] undefined | stateValue = undefined; render if equals === undefined | json-renderer.tsx |
| ensureInitialView | !state?.currentView | dispatchState("state:currentView", { value: defaultView }) | state-store.ts |
| loadOrganVariant | unknown organ/variant | Return null | organ-registry.ts |
| expandOrgans | variant null | Push original node (organ not replaced) | resolve-organs.ts |
| resolveSlotNode | data path missing or not array | Return [] | skinBindings.apply.ts |

---

## Config and error reporting

- **config/ui-verb-map.json:** Design-time only; used for verb-to-behavior mapping in tooling. Runtime behavior uses behavior-runner + behavior-listener; no runtime dependency on ui-verb-map for main action path.
- **Error reporting:** Throws and console.warn in behavior-listener (missing action name, missing destination, behavior-runner failed, unhandled action). State/store surface via return/log. Screen-loader and API return 404 or throw. No silent swallows on primary path.
