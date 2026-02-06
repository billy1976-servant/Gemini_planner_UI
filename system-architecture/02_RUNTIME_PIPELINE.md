# 02 — Runtime Pipeline

**Source:** Compiled from `src/docs/ARCHITECTURE_AUTOGEN/RUNTIME_PIPELINE_CONTRACT.md`, `PIPELINE_AND_BOUNDARIES_REFERENCE.md`, `RUNTIME_AUTHORITY_LADDER.md`. Deterministic trace: Request → Screen Load → Layout Resolution → Rendering → Behavior → State Update.

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
- **JsonRenderer:** useSyncExternalStore(subscribeLayout, getLayout); useSyncExternalStore(subscribeState, getState). applyProfileToNode: overrideId ?? existingLayoutId ?? templateDefaultLayoutId ?? undefined; getDefaultSectionLayoutId(templateId) from @/layout. Section params stripped of layout keys (moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split).
- **Section layout id:** In applyProfileToNode: override → node.layout → template default. Section compound receives layout prop; resolveLayout(layout) → LayoutDefinition | null; when null, render div wrapper only (no LayoutMoleculeRenderer).

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
