# RUNTIME_PIPELINE.md — Runtime call chain (with citations)

**Purpose:** Request → load screen → resolve layout → render nodes → behavior dispatch → state update. Every step cites entry file and function.

---

## 1. Entry

- **Next.js app entry:** `src/app/layout.tsx` (root layout), `src/app/page.tsx` (main page).
- **Screen selection:** `src/app/page.tsx` reads `useSearchParams().get("screen")`. If no `screen`, either `resolveLandingPage()` (landing content) or flow param → TSX engine-viewer.

**Citation:** `src/app/page.tsx` lines 121–122, 208–272 (useEffect with `screen`).

---

## 2. Load screen

- **Function:** `loadScreen(path)` in `src/engine/core/screen-loader.ts`.
- **Import:** `src/app/page.tsx` line 8: `import { loadScreen } from "@/engine/core/screen-loader";`.

Flow:

1. **TSX branch:** If `path.startsWith("tsx:")` → return `{ __type: "tsx-screen", path: path.replace(/^tsx:/, "") }`. No network.
2. **JSON branch:** Normalize path, then `fetch(\`/api/screens/${normalized}?t=...\`)` (no-store). On response:
   - If `json.state.currentView` exists, `dispatchState("state:currentView", { value: json.state.currentView })` (from `@/state/state-store`).
   - Return parsed JSON.

**Citation:** `src/engine/core/screen-loader.ts` lines 27–151 (export async function loadScreen).

**API that serves JSON:** `src/app/api/screens/[...path]/route.ts` GET:
- JSON: resolve file under `SCREENS_ROOT = path.join(process.cwd(), "src", "apps-offline", "apps")`; optional `.json` suffix.
- TSX: resolve `TSX_ROOT = path.join(process.cwd(), "src", "screens")` + `params.path` + `.screen.tsx`; if exists, return `{ __tsx__: true, screen: requestedPath }`.

**Citation:** `src/app/api/screens/[...path]/route.ts` lines 34–141.

---

## 3. Page: from loaded data to render root

In `src/app/page.tsx` (JSON branch, after setJson(data)):

1. **Resolve render root:**  
   `renderNode = json?.root ?? json?.screen ?? json?.node ?? json`  
   (lines 368–372).

2. **Assign section instance keys:**  
   `children = assignSectionInstanceKeys(rawChildren)`  
   Import: `import { expandOrgansInDocument, assignSectionInstanceKeys } from "@/organs/resolve-organs";`  
   **Citation:** `src/organs/resolve-organs.ts` (assignSectionInstanceKeys), `src/app/page.tsx` 376.

3. **Expand organs:**  
   `expandedDoc = expandOrgansInDocument(docForOrgans, loadOrganVariant, organInternalLayoutOverrides)`  
   **Citation:** `src/organs/resolve-organs.ts` (expandOrgansInDocument), `src/app/page.tsx` 377–378.

4. **Skin bindings:**  
   `boundDoc = applySkinBindings(expandedDoc, data)`  
   Import: `import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";`  
   **Citation:** `src/app/page.tsx` 379–381.

5. **Compose offline screen (role inference):**  
   `composed = composeOfflineScreen({ rootNode: renderNode, experienceProfile, layoutState: layoutSnapshot })`  
   Import: `import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";`  
   **Citation:** `src/lib/screens/compose-offline-screen.ts` (composeOfflineScreen, inferRolesFromOfflineTree), `src/app/page.tsx` 404–408.

6. **Store current tree:**  
   `setCurrentScreenTree(composed)`  
   Import: `import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";`  
   **Citation:** `src/app/page.tsx` 409.

7. **Optional layout-node collapse (dev):**  
   If `hasLayoutNodeType(composed)`, `treeForRender = collapseLayoutNodes(composed)`.  
   Import: `import { hasLayoutNodeType, collapseLayoutNodes } from "@/engine/core/collapse-layout-nodes";`  
   **Citation:** `src/app/page.tsx` 412–418.

8. **Layout resolution (per node):**  
   Not done in page; done inside JsonRenderer via profile (template + experience). Section layout comes from `getDefaultSectionLayoutId`, overrides from section-layout-preset-store and organ-internal-layout-store.  
   **Citation:** `src/engine/core/json-renderer.tsx` (applyProfileToNode, getDefaultSectionLayoutId, evaluateCompatibility from `@/layout`), `src/layout/resolver/layout-resolver.ts` (resolveLayout).

---

## 4. Resolve layout (per section/card)

- **Unified resolver:** `resolveLayout(layoutId, context)` in `src/layout/resolver/layout-resolver.ts`.  
  Uses `getPageLayoutId` / `getPageLayoutById` (page) and `resolveComponentLayout` (component); returns merged `LayoutDefinition` (containerWidth, moleculeLayout, etc.).  
  **Citation:** `src/layout/resolver/layout-resolver.ts` lines 28–41.

- **Used by:** Section compound and LayoutMoleculeRenderer get layout id from profile/overrides, then resolve definition. JsonRenderer uses `getDefaultSectionLayoutId`, `evaluateCompatibility` from `@/layout` and applies profile to node (section layout, card preset).  
  **Citation:** `src/engine/core/json-renderer.tsx` (applyProfileToNode, section layout id), `src/layout/index.ts` (exports resolveLayout, getDefaultSectionLayoutId, evaluateCompatibility).

---

## 5. Render nodes

- **Component:** `JsonRenderer` in `src/engine/core/json-renderer.tsx`.  
  **Import in page:** `import JsonRenderer from "@/engine/core/json-renderer";`  
  **Citation:** `src/app/page.tsx` line 7, 465–474 (usage with node={treeForRender}, defaultState, profileOverride, section/card/organ overrides).

- **Default export:** `export default function JsonRenderer({ node, defaultState, profileOverride, ... })` (lines 682+). Uses `useSyncExternalStore(subscribeState, getState, getState)` and `subscribeLayout`, `subscribePalette`; passes state snapshot and profile into `renderNode`.

- **Core render function:** `export function renderNode(node, profile, stateSnapshot, defaultState, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides)` (lines 397+):
  1. If `node.type === "json-skin"` → render `JsonSkinEngine` (from `@/logic/engines/json-skin.engine`).
  2. If `!shouldRenderNode(node, stateSnapshot, defaultState)` → return null (when/state/equals).
  3. `profiledNode = applyProfileToNode(node, profile, ...)` (layout, visual preset, spacing).
  4. Resolve component: `definitions[type]` from `@/compounds/ui/index`, `Registry[type]` from `./registry`.
  5. If no Registry entry → red “Missing registry entry: &lt;type&gt;”.
  6. If `node.items` array → repeater: map to Card nodes, call `renderNode` per item.
  7. Else if `node.children` → map children and call `renderNode` for each.
  8. Return `<Component {...resolvedNode} />` (with behavior, params, etc.).

**Citation:** `src/engine/core/json-renderer.tsx` lines 397–580 (renderNode), 682+ (JsonRenderer default).

**Registry:** `src/engine/core/registry.tsx` — type string → React component.  
**Citation:** `src/engine/core/json-renderer.tsx` line 3: `import Registry from "./registry";`.

---

## 6. Behavior dispatch

- **Installation:** In `src/app/layout.tsx`, `installBehaviorListener(navigate)` is called (navigate from useRouter).  
  **Citation:** `src/app/layout.tsx` line 37: `import { installBehaviorListener } from "@/engine/core/behavior-listener";` (and usage in layout effect).

- **Listener:** `src/engine/core/behavior-listener.ts`:
  - **navigate:** Listens `window.addEventListener("navigate", ...)`; uses `e.detail.to` or `screenId` or `target`; calls `navigate(destination)`.
  - **action:** Listens `window.addEventListener("action", ...)`; `behavior = e.detail`, `actionName = behavior.params?.name`.
    - If `actionName.startsWith("state:")`: resolve value (input/journal), then `dispatchState(...)` for currentView, update, journal.add (import from `@/state/state-store`).
    - If `actionName === "navigate"`: `navigate(params.to)`.
    - If action is contract verb (tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay): `runBehavior(domain, actionName, { navigate }, params)` from `@/behavior/behavior-runner`.
    - Else: lazy `require("../../logic/runtime/runtime-verb-interpreter")` → `interpretRuntimeVerb({ name: actionName, ...params }, getState())`.

**Citation:** `src/engine/core/behavior-listener.ts` lines 67–347 (installBehaviorListener, navigate, action handlers); line 12: `import runBehavior from "@/behavior/behavior-runner";`.

- **Behavior runner:** `src/behavior/behavior-runner.ts` — `runBehavior(domain, action, ctx, args)`:
  - Resolves handler via `resolveBehaviorVerb(domain, action)` and interactions/navigations JSON.
  - Looks up `BehaviorEngine[handlerName]`, calls with `(ctx, args)` or `(args, ctx)`; if navigation domain, `fireNavigation(ctx, result?.target ?? args?.target)`.

**Citation:** `src/behavior/behavior-runner.ts` lines 102–168.

---

## 7. State update

- **Dispatch:** `dispatchState(intent, payload)` in `src/state/state-store.ts`.  
  **Citation:** `src/state/state-store.ts` lines 43–64: append to `log`, set `state = deriveState(log)`, notify listeners; skip persist for `state.update`.

- **Derivation:** `deriveState(log)` in `src/state/state-resolver.ts`. Handled intents: `state:currentView`, `journal.set` / `journal.add`, `state.update`, `scan.result` / `scan.interpreted`, `interaction.record`.  
  **Citation:** `src/state/state-resolver.ts` lines 28–106.

- **Persistence:** In state-store, `persist()` writes `log` to `localStorage.__app_state_log__` on dispatch (except for `state.update`). On load, `rehydrate()` reads and re-runs `deriveState`.  
  **Citation:** `src/state/state-store.ts` KEY, persist, rehydrate, bootstrap.

---

## Summary chain (file → function)

| Step | File | Function / flow |
|------|------|------------------|
| Entry | `src/app/page.tsx` | searchParams.get("screen") → loadScreen(screen) or resolveLandingPage() |
| Load screen | `src/engine/core/screen-loader.ts` | loadScreen(path) → TSX descriptor or fetch /api/screens → dispatchState state:currentView → return json |
| API | `src/app/api/screens/[...path]/route.ts` | GET → read from apps-offline/apps or screens (TSX marker) |
| Prepare tree | `src/app/page.tsx` | assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen → setCurrentScreenTree |
| Compose | `src/lib/screens/compose-offline-screen.ts` | composeOfflineScreen → inferRolesFromOfflineTree |
| Resolve layout | `src/layout/resolver/layout-resolver.ts` | resolveLayout(layoutId, context) (page + component) |
| Render | `src/engine/core/json-renderer.tsx` | JsonRenderer → renderNode (Registry, profile, when, items/children) |
| Behavior | `src/engine/core/behavior-listener.ts` | installBehaviorListener → "action" → state:* | navigate | runBehavior | interpretRuntimeVerb |
| Run behavior | `src/behavior/behavior-runner.ts` | runBehavior(domain, action, ctx, args) |
| State | `src/state/state-store.ts` | dispatchState(intent, payload) → log → deriveState → listeners |
| Derive | `src/state/state-resolver.ts` | deriveState(log) |

All paths relative to repo root.
