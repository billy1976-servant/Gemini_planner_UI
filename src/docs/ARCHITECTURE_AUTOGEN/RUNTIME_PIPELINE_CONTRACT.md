# RUNTIME_PIPELINE_CONTRACT.md

Deterministic trace: Request → Screen Load → Layout Resolution → Rendering → Behavior → State Update. Derived from source only.

---

## 1. Request → Screen path resolution

| Stage | File path | Function / entry | Input | Output | Next stage receives |
|-------|-----------|------------------|-------|--------|---------------------|
| Next.js route | `src/app/page.tsx` | `Page` (default export) | Request (URL) | — | `useSearchParams()` → `screen` |
| Query read | `src/app/page.tsx` | `searchParams.get("screen")` | — | `string \| null` (e.g. `"apps/websites/demo-blueprint-site/app"` or `"tsx:tsx-screens/onboarding/engine-viewer"`) | Screen load effect |
| Flow param | `src/app/page.tsx` | `searchParams.get("flow")` | — | If present, triggers TSX engine-viewer path | `loadScreen("tsx:tsx-screens/onboarding/engine-viewer")` |
| No screen | `src/app/page.tsx` | `resolveLandingPage()` | — | `{ flow, content }`; if `content`, merged into landing with `root: { type: "json-skin", children }` | `setJson(landingPageContent)` |

---

## 2. Screen load

| Stage | File path | Function name | Input shape | Output shape | Next stage receives |
|-------|-----------|---------------|-------------|--------------|---------------------|
| Load entry | `src/app/page.tsx` | `loadScreen(screen)` (in useEffect) | `path: string` | `Promise<object>` | Resolved data: either `{ __type: "tsx-screen", path }` or raw JSON screen |
| Loader (TSX) | `src/engine/core/screen-loader.ts` | `loadScreen` | `path` (must contain `/` or start with `tsx:`) | If `path.startsWith("tsx:")`: `{ __type: "tsx-screen", path: string }` | page.tsx sets TsxComponent, no fetch |
| Loader (JSON) | `src/engine/core/screen-loader.ts` | `loadScreen` | Normalized path (strips leading `/`, `src/`, `apps-offline/apps/`, `apps/`) | Fetch `GET /api/screens/${normalized}?t=${Date.now()}` | Response body as JSON |
| API handler | `src/app/api/screens/[...path]/route.ts` | `GET` | `params.path: string[]` (e.g. `["websites","demo-blueprint-site","app"]`) | Reads `path.join(process.cwd(), "src", "apps-offline", "apps", ...params.path)` + `.json` if needed; returns `NextResponse.json(json)` or 404 | JSON screen document |
| State init | `src/engine/core/screen-loader.ts` | After `res.json()` | `json.state?.currentView` | If present: `dispatchState("state:currentView", { value: json.state.currentView })` | state-store updated; return `json` |
| Page state | `src/app/page.tsx` | `.then((data) => { ... })` | Load result | TSX: `setTsxComponent(() => C)`, `setJson(null)`; JSON: `setJson(data)`, `setTsxMeta(null)` | `json` = full screen descriptor for JSON branch |

---

## 3. Document preparation (JSON branch only)

| Stage | File path | Function name | Input shape | Output shape | Next stage receives |
|-------|-----------|---------------|-------------|--------------|---------------------|
| Root node | `src/app/page.tsx` | (inline) | `json` | `renderNode = json?.root ?? json?.screen ?? json?.node ?? json` | Root node for expand/compose |
| Instance keys | `src/app/page.tsx` | `assignSectionInstanceKeys(rawChildren)` from `@/organs/resolve-organs` | `renderNode.children` | Children with stable instance keys | `docForOrgans` |
| Organ expand | `src/app/page.tsx` | `expandOrgansInDocument(docForOrgans, loadOrganVariant, organInternalLayoutOverrides)` | Document + variant loader | Expanded nodes | `expandedDoc` |
| Skin bindings | `src/app/page.tsx` | `applySkinBindings(expandedDoc, json?.data ?? {})` from `@/logic/bridges/skinBindings.apply` | Expanded doc + data | Bound document | `finalChildren` → `renderNode.children` |
| Compose | `src/app/page.tsx` | `composeOfflineScreen({ rootNode, experienceProfile, layoutState })` from `@/lib/screens/compose-offline-screen` | Root + experience + layout | `inferRolesFromOfflineTree(rootNode)` (role inference when missing) | `composed` |
| Tree store | `src/app/page.tsx` | `setCurrentScreenTree(composed)` | Composed tree | — | Stored in `src/engine/core/current-screen-tree-store` |
| Layout nodes | `src/app/page.tsx` | `hasLayoutNodeType(composed)`; if dev and true: `collapseLayoutNodes(composed)` | Composed | Content-only tree | `treeForRender` |

---

## 4. Layout resolution (per-section / per-node in renderer)

| Stage | File path | Function name | Input shape | Output shape | Next stage receives |
|-------|-----------|---------------|-------------|--------------|---------------------|
| Profile | `src/app/page.tsx` | `getExperienceProfile(experience)`, `getTemplateProfile(templateId)` | `experience`, `layoutSnapshot.templateId` | Merged `effectiveProfile` (template + experience) | Passed as `profileOverride` to JsonRenderer |
| Overrides | `src/app/page.tsx` | `getOverridesForScreen(screenKey)`, `getCardOverridesForScreen(screenKey)`, `getOrganInternalLayoutOverridesForScreen(screenKey)` | `screenKey` | `sectionLayoutPresetOverrides`, `cardLayoutPresetOverrides`, `organInternalLayoutOverrides` | JsonRenderer props |
| Render root | `src/engine/core/json-renderer.tsx` | `JsonRenderer` (default export) | `node`, `defaultState`, `profileOverride`, `sectionLayoutPresetOverrides`, `cardLayoutPresetOverrides`, `organInternalLayoutOverrides`, `screenId` | React element | — |
| Snapshot | `src/engine/core/json-renderer.tsx` | `useSyncExternalStore(subscribeLayout, getLayout, getLayout)` | — | `layoutSnapshot`; `profile = profileOverride ?? layoutSnapshot` | `renderNode(..., profile, ...)` |
| State snapshot | `src/engine/core/json-renderer.tsx` | `useSyncExternalStore(subscribeState, getState, getState)`; merged with `defaultState.currentView` for initial view | — | `stateSnapshot` (includes `currentView`, `values`, etc.) | `renderNode(..., stateSnapshot, effectiveDefaultState, ...)` |
| Profile apply | `src/engine/core/json-renderer.tsx` | `applyProfileToNode(node, profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, parentSectionKey, organInternalLayoutOverrides)` | Node + profile + overrides | Node with `layout` / `_effectiveLayoutPreset` set; section params stripped of layout keys | `profiledNode` |
| Section layout id | `src/engine/core/json-renderer.tsx` | Inside `applyProfileToNode`: `overrideId ?? existingLayoutId ?? templateDefaultLayoutId ?? undefined`; `getDefaultSectionLayoutId(templateId)` from `@/layout` | Section node, profile, overrides | `next.layout`, `(next as any)._effectiveLayoutPreset` | Section compound receives `layout` prop |
| Compatibility | `src/engine/core/json-renderer.tsx` | `evaluateCompatibility({ sectionNode, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId })` from `@/layout` | Section + layout ids | `CompatibilityResult` (sectionValid, cardValid, organValid, missing) | Dev logging only |

---

## 5. Rendering (per node)

| Stage | File path | Function name | Input shape | Output shape | Next stage receives |
|-------|-----------|---------------|-------------|--------------|---------------------|
| Pure render | `src/engine/core/json-renderer.tsx` | `renderNode(node, profile, stateSnapshot, defaultState, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides)` | Single node + profile + state + overrides | React element or null | Recursive for children; root returns tree |
| Visibility | `src/engine/core/json-renderer.tsx` | `shouldRenderNode(node, stateSnapshot, defaultState)` | Node (checks `node.when`), state, defaultState | boolean | If false, return null |
| Registry lookup | `src/engine/core/json-renderer.tsx` | `(Registry as any)[resolvedNode.type]` | `resolvedNode.type` (string) | React component or undefined | Component for current node |
| Props build | `src/engine/core/json-renderer.tsx` | (inline) | `resolvedNode` (params, content, behavior stripped by `shouldStripBehavior`) | `props`: node spread minus type/key; section keeps `layout` | `<Component {...props}>{renderedChildren}</Component>` |
| Section layout | `src/compounds/ui/12-molecules/section.compound.tsx` | `resolveLayout(layout)` from `@/layout` | `layout` (string or `{ template, slot }`) | `LayoutDefinition \| null` | `LayoutMoleculeRenderer` or fallback |
| Layout render | `src/layout/renderer/LayoutMoleculeRenderer.tsx` | `LayoutMoleculeRenderer` | `layout`, `params`, `content`, `children` | Section structure (surface, split/grid/column) | DOM |

---

## 6. Behavior (user gesture → event → handler)

| Stage | File path | Function name | Input shape | Output shape | Next stage receives |
|-------|-----------|---------------|-------------|--------------|---------------------|
| Install | `src/app/layout.tsx` | `installBehaviorListener(navigate)` | `navigate: (to: string) => void` (router.push) | — | Listener installed once |
| Tap | `src/compounds/ui/12-molecules/button.compound.tsx` | `handleTap` | User click | If `behavior.type === "Navigation"`: `window.dispatchEvent(new CustomEvent("navigate", { detail: { to } }))`; if `"Action"`: `new CustomEvent("action", { detail: behavior })`; if `"Interaction"`: `new CustomEvent("interaction", { detail: behavior })` | Global listeners |
| Navigate | `src/engine/core/behavior-listener.ts` | `window.addEventListener("navigate", ...)` | `e.detail.to \|\| detail.screenId \|\| detail.target` | `navigate(destination)` | Next.js router |
| Action | `src/engine/core/behavior-listener.ts` | `window.addEventListener("action", ...)` | `e.detail` = `{ type, params }` (e.g. `params.name`, `params.to`) | Branch: state:*, navigate, contract verbs → runBehavior, else interpretRuntimeVerb | state-store or runBehavior or runtime-verb-interpreter |
| state:* | `src/engine/core/behavior-listener.ts` | (inline) | `params.name` (e.g. `state:currentView`), `valueFrom`, `value`, `fieldKey` | `dispatchState("state:currentView", { value })` or `dispatchState("state.update", { key, value })` or `dispatchState("journal.add", { track, key, value })` | state-store |
| Contract verbs | `src/engine/core/behavior-listener.ts` | `runBehavior(domain, actionName, { navigate }, params)` from `@/behavior/behavior-runner` | actionName in tap/double/long/drag/scroll/swipe/go/back/open/close/route/crop/filter/frame/layout/motion/overlay | BehaviorEngine handler; nav handlers may set `result.target` → `fireNavigation(ctx, result?.target ?? args?.target)` | Navigation or UIState / side effect |
| Runtime verb | `src/engine/core/behavior-listener.ts` | `require("../../logic/runtime/runtime-verb-interpreter").interpretRuntimeVerb(detail, currentState)` | `{ name, ...params }`, state | Handles `params.name === "state:*"` → `dispatchState(intent, { value, ...rest })`; `params.name === "navigate"` → `navigate(to)` | state-store or navigate |
| input-change | `src/engine/core/behavior-listener.ts` | `window.addEventListener("input-change", ...)` | `e.detail.fieldKey`, `e.detail.value` | `dispatchState("state.update", { key: fieldKey, value })` | state-store |

Note: `interpretRuntimeVerb` in `src/logic/runtime/runtime-verb-interpreter.ts` is invoked via require inside behavior-listener; it is not installed as a separate listener. `installRuntimeVerbInterpreter` in that file exists but is not called in the traced pipeline; the behavior-listener directly calls `interpretRuntimeVerb` on action events.

---

## 7. State update

| Stage | File path | Function name | Input shape | Output shape | Next stage receives |
|-------|-----------|---------------|-------------|--------------|---------------------|
| Dispatch | `src/state/state-store.ts` | `dispatchState(intent, payload)` | `intent: string`, `payload?: any` | — | Pushes `{ intent, payload }` to log |
| Derive | `src/state/state-store.ts` | `deriveState(log)` from `@/state/state-resolver` | `log: StateEvent[]` | `DerivedState` (journal, rawCount, currentView, scans, interactions, values) | `state = deriveState(log)` |
| Resolver | `src/state/state-resolver.ts` | `deriveState` | Log entries | Handles: `state:currentView` → derived.currentView; `journal.set`/`journal.add` → derived.journal; `state.update` → derived.values[key]; `scan.result`/`scan.interpreted` → derived.scans; `interaction.record` → derived.interactions | Returned object |
| Notify | `src/state/state-store.ts` | `listeners.forEach(l => l())` | — | — | Subscribers (e.g. JsonRenderer) re-run |
| Persist | `src/state/state-store.ts` | `persist()` (skipped for `intent === "state.update"`) | — | `localStorage.setItem(KEY, JSON.stringify(log))` | Rehydration on reload |

---

## Summary flow

1. **Request**: Next.js `src/app/page.tsx` → `searchParams.get("screen")` / `searchParams.get("flow")`.
2. **Screen load**: `loadScreen(path)` in `src/engine/core/screen-loader.ts` → TSX returns descriptor; JSON fetches `src/app/api/screens/[...path]/route.ts` (reads `src/apps-offline/apps/` + path + `.json`), then `dispatchState("state:currentView", ...)` if default state present, returns JSON.
3. **Document prep**: page.tsx resolves root, `assignSectionInstanceKeys` → `expandOrgansInDocument` → `applySkinBindings` → `composeOfflineScreen` → `setCurrentScreenTree`; optional `collapseLayoutNodes` in dev.
4. **Layout resolution**: Profile from `getExperienceProfile` + `getTemplateProfile`; overrides from section-layout-preset-store, organ-internal-layout-store; in JsonRenderer `applyProfileToNode` computes section `layout` (override → node.layout → template default); `evaluateCompatibility` for dev.
5. **Rendering**: `JsonRenderer` → `renderNode` (recursive); `shouldRenderNode`; Registry lookup; Section uses `resolveLayout(layout)` → `LayoutMoleculeRenderer`.
6. **Behavior**: Button (etc.) tap → `navigate` or `action` CustomEvent; behavior-listener handles navigate/state:*/contract verbs/runtime verb; state-store `dispatchState`; state-resolver `deriveState`; listeners notified.
