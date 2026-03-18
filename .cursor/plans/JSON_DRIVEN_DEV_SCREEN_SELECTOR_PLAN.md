# JSON-Driven Dev Screen Selector — Analysis and Migration Plan

**Goal:** The development screen selector (dropdown) should be driven entirely by JSON flow files. If there are 10 JSON flow files, the dropdown shows 10 flows. Selecting any flow runs the **same** universal runtime screen (FlowRuntimeScreen → FlowScreenWrapper → FlowEngine). No one TSX per business, no duplicated wrappers; one TSX runtime + many JSON configs.

**Constraints for this document:** Analysis and plan only. Do NOT implement yet. Do NOT delete any files.

---

## 1. Analysis of current architecture limitations

### 1.1 How the selector works today

- **Data source:** [app/layout.tsx](src/app/layout.tsx) fetches **GET /api/screens**. The response is a **ScreensIndex**: array of `{ category, directFiles, folders, rootSection, displayName }`.
- **Scan logic:** [app/api/screens/route.ts](src/app/api/screens/route.ts) scans `src/01_App` by root (Business, Christian, etc.). For Business it uses `collectGenericUnderRoot`, which collects **both** `.tsx` and `.json` files and strips the extension. So the same folder can contribute both `ContainerCreationsLanding-5` (from .json) and `ContainerCreationsLanding-2` (from .tsx) as **file names**.
- **Path building:** [CascadingScreenMenu.tsx](src/app/components/CascadingScreenMenu.tsx) builds the **screen path** from structure: for Business/Christian it uses a `tsx:` prefix and builds `tsx:Business/Container_Creations/<fileName>`. So the path is always a **TSX path** (one component per entry). There is no notion of “this entry is a flow JSON; open FlowRuntimeScreen with flowId.”
- **Resolution:** Dev page calls `loadScreen(screen)`. For `tsx:...` paths, [screen-loader.ts](src/03_Runtime/engine/core/screen-loader.ts) returns `{ __type: "tsx-screen", path }`. The dev page then **resolveTsxScreen(path)** and renders that component. So the **path must resolve to a TSX component**. A path like `tsx:Business/Container_Creations/ContainerCreationsLanding-5` would try to load a TSX file; there is no `ContainerCreationsLanding-5.tsx`, so the flow would fail if the user selected the JSON “file” from the menu.

### 1.2 Limitations (why goal is not met today)

| Limitation | Detail |
|------------|--------|
| **Selector is file-structure-driven, not flow-driven** | The dropdown lists whatever .tsx and .json files exist under 01_App. It does not distinguish “flow configs” from other JSON/TSX. So you get mixed entries (TSX screens, JSON configs, other JSON) and no single “flows only” list. |
| **One path = one TSX** | Selecting an item sets `screen=<path>`. That path is resolved to a **single TSX component**. There is no built-in way to say “this selection is a flow; use FlowRuntimeScreen and pass flowId.” So today you need one TSX (or re-export) per flow for the resolver (e.g. ContainerCreationsLanding-2.tsx) to get one menu entry that works. |
| **Flow JSONs not used as selector source of truth** | Flow configs (e.g. ContainerCreationsLanding-5.json) exist in 01_App/Business/..., but the selector does not “drive” from a dedicated list of flow JSONs. It drives from the generic file tree. So “10 JSON files → 10 dropdown items” is not guaranteed; and selecting a JSON name can produce an invalid TSX path. |
| **No single “flow id” in URL for flows** | FlowRuntimeScreen already exists and reads `flowId` (and optional `configUrl`) from search params. But the **navigator never sets** `screen=tsx:Runtime/FlowRuntimeScreen&flowId=...`. It only sets `screen=tsx:Business/.../SomeFile`. So the universal flow runtime is not wired into the selector. |

### 1.3 What already works

- **FlowRuntimeScreen** exists and works: it reads `flowId` and `configUrl` from the URL and renders FlowScreenWrapper. So “one TSX + many JSONs” is already implemented at the component level.
- **FlowScreenWrapper** accepts `flowId` and optional `configUrl`; it fetches config and renders FlowEngine. So the runtime chain (FlowRuntimeScreen → FlowScreenWrapper → FlowEngine → JSON) is in place.
- **FlowEngine** is generic: it only needs a FlowConfig (id, screens[], stepTracker, etc.). No change needed for multiple flows.
- **Resolver and dev page** already have an explicit entry for `Runtime/FlowRuntimeScreen`. So loading `screen=tsx:Runtime/FlowRuntimeScreen&flowId=container-creations-landing-5&configUrl=...` works if the URL is set; the missing piece is the **selector** setting that URL when the user picks a flow.

---

## 2. Is a JSON-driven selector a good idea?

**Yes**, for these reasons:

- **Single source of truth:** Flow behavior lives in JSON. The dropdown should reflect “what flows exist,” not “what TSX files exist.” Adding a new business flow = add a JSON file and have it appear in the list; no new TSX or wrapper.
- **Aligns with “one TSX + many JSONs”:** You already have FlowRuntimeScreen. The selector should feed it (flowId), not duplicate entry points per flow.
- **Scalability:** 10, 50, 100 flows = same one runtime screen; no resolver bloat or per-business TSX.
- **Consistency:** Same UX for every flow (select by name → same engine). No special cases in the menu for “this one is TSX, that one is flow.”

**Caveats:**

- **Mixed menus:** You may still want some dev entries to be “other” TSX screens (e.g. PrayerApp, ContainerCreationsWebsite). So the plan should allow either (a) a **dedicated “Flows” section** that lists only flow JSONs and uses FlowRuntimeScreen, or (b) a **unified list** where “flow” entries are tagged and navigate to FlowRuntimeScreen + flowId, while other entries keep current TSX path behavior. Both are feasible; (a) is simpler and clearer.
- **Discovery of flow JSONs:** You need a defined place and shape for “flow config” (e.g. FlowConfig: has `screens` array and `id`). The selector’s data source must list only those (or merge them into one section), not every random JSON in 01_App.

---

## 3. Migration plan (safe, incremental)

### Phase A — Flow list API (new or extended)

**Option 1 (recommended): New endpoint GET /api/flows/index**

- **Purpose:** Returns a list of **flow entries** suitable for the dev selector: e.g. `{ flows: [{ id, title, configPath, configUrl? }] }`.
- **Discovery:** Scan one or more roots (e.g. `01_App/Business`, optionally `01_App/Christian`) for `.json` files. For each file, optionally read and parse; include it only if it looks like FlowConfig (has top-level `screens` array). Derive `id` from `json.id` or filename (e.g. `ContainerCreationsLanding-5.json` → id `container-creations-landing-5` or keep filename stem). `configPath` can be the relative path for a generic loader; `configUrl` can be a dedicated API path if that flow is served by a specific route (e.g. `/api/container-creations-landing-config`).
- **Why new API:** Keeps “list of flows” separate from “list of all screens (TSX + JSON).” No risk of breaking existing /api/screens behavior. Clear contract: “this list is for FlowRuntimeScreen.”

**Option 2: Extend GET /api/screens**

- Add a dedicated **root or category** (e.g. “Flows”) whose entries are **only** flow JSONs (same discovery as above). In `flattenIndexToPaths` (or in the client), treat “Flows” section specially: path = `tsx:Runtime/FlowRuntimeScreen` and store flowId (and optional configUrl) in a way the navigator can use (see below). Downside: mixes two concepts (file tree vs flow list) in one API and one menu structure; path encoding for “FlowRuntimeScreen + flowId” is trickier.

Recommendation: **Phase A = new GET /api/flows/index** that returns flow-only list. No changes to /api/screens or screen-registry in this phase.

### Phase B — Navigator: “Flows” section and URL shape

- **Layout / CascadingScreenMenu:** Either:
  - **B1:** Fetch `/api/flows/index` in addition to `/api/screens`. Add a **“Flows”** root section to the menu (or a separate dropdown). When the user selects a flow, navigate to:
    - `screen=tsx:Runtime/FlowRuntimeScreen`
    - `flowId=<flow.id>`
    - `configUrl=<flow.configUrl>` if present (else FlowScreenWrapper will use `/api/flows/<flowId>`).
  - **B2:** Or merge flow list into the same index: add a synthetic category “Flows” with one “folder” per flow (or a flat list). When building the path for a flow item, set `screen=tsx:Runtime/FlowRuntimeScreen` and append `&flowId=...&configUrl=...` to the dev URL.

- **URL shape:** For dev, use query params:
  - `screen=tsx:Runtime/FlowRuntimeScreen`
  - `flowId=container-creations-landing-5` (required for FlowRuntimeScreen)
  - `configUrl=/api/container-creations-landing-config` (optional; if omitted, FlowScreenWrapper uses `/api/flows/<flowId>`)

- **CascadingScreenMenu** (or a small wrapper) must be able to:
  - Differentiate “flow” items from “TSX file” items.
  - For flow items: call `navigate` (or equivalent) with a **compound target**: same path `tsx:Runtime/FlowRuntimeScreen` plus flowId (and configUrl) in the same URL. So the menu’s `navigate` function (or the code that builds the dev URL) must support setting multiple query params, not only `screen`.

### Phase C — Resolver and dev page (minimal)

- **Resolver:** No change required for FlowRuntimeScreen; it’s already registered. The only requirement is that the **screen** param be `tsx:Runtime/FlowRuntimeScreen` and flowId/configUrl come from the same URL (already the case with FlowRuntimeScreen’s useSearchParams).
- **Dev page:** When it receives `screen=tsx:Runtime/FlowRuntimeScreen`, it already loads FlowRuntimeScreen; FlowRuntimeScreen reads flowId and configUrl from search params. So **no change** to the dev page’s loader or resolver logic. The only change is **how the selector sets the URL** (see Phase B).

### Phase D — Serving flow JSON by flowId (optional but recommended)

- Today Container Creations is served by a **dedicated** API (`/api/container-creations-landing-config`). For a generic “select any flow” experience, either:
  - **D1:** Extend **GET /api/flows/[flowId]** so it can resolve `flowId` to JSON under `01_App/Business` (and elsewhere), e.g. by scanning for a file whose `id` or filename matches flowId. Then FlowRuntimeScreen can use only `flowId` and no per-flow configUrl.
  - **D2:** Or keep per-flow configUrl in the flow index and pass it when opening the flow. Then no change to /api/flows/[flowId] is required for existing flows.

Recommendation: Implement **D1** so that adding a new JSON file (with correct `id` or filename) is enough for it to be listed and loadable via `flowId` only.

---

## 4. What parts of the resolver / dev page need to change

| Component | Change required |
|-----------|------------------|
| **Resolver (tsx-screen-resolver.tsx)** | **None.** FlowRuntimeScreen is already registered. |
| **Dev page (app/dev/page.tsx)** | **None** for loading FlowRuntimeScreen. It already resolves `tsx:Runtime/FlowRuntimeScreen` and renders the component; flowId and configUrl are read inside FlowRuntimeScreen from useSearchParams. |
| **Layout (app/layout.tsx)** | **Optional:** Fetch `/api/flows/index` in addition to `/api/screens`. Pass flow list to the navigator (e.g. to CascadingScreenMenu or a sibling “Flow selector”) so the UI can show a “Flows” section. |
| **CascadingScreenMenu (or new component)** | **Yes.** Either: (1) Add a “Flows” root that lists items from `/api/flows/index`; on item click, navigate to `/dev?screen=tsx:Runtime/FlowRuntimeScreen&flowId=<id>&configUrl=<url>` (configUrl optional). Or (2) Extend the existing menu so that for “flow” entries it builds this compound URL instead of `tsx:Business/.../File`. The critical change is: **navigate() (or equivalent) must set both `screen` and `flowId` (and optionally `configUrl`) when the selected item is a flow.** |
| **screen-registry / flattenIndexToPaths** | **Optional.** Only if you merge flow list into the same index: then you need a convention so that “flow” paths expand to `tsx:Runtime/FlowRuntimeScreen` + flowId in the URL, not to a path under Business. That’s more invasive; cleaner is a separate “Flows” section and a dedicated handler that sets the compound URL. |

Summary: the **resolver and dev page do not need changes** for FlowRuntimeScreen to run. The **only** required change for the JSON-driven selector is: **the navigator (CascadingScreenMenu or a new flow selector) must list flow JSONs and, when one is selected, set URL to FlowRuntimeScreen + flowId (and optional configUrl).**

---

## 5. Do FlowEngine and FlowScreenWrapper already support this?

**Yes.**

- **FlowScreenWrapper** ([FlowScreenWrapper.tsx](src/03_Runtime/engine/onboarding/flow-engine/FlowScreenWrapper.tsx)): Accepts `flowId` and optional `configUrl`. If `configUrl` is provided it fetches that; otherwise it fetches `/api/flows/${flowId}`. So one component can render any flow as long as flowId (and optional configUrl) are passed.
- **FlowEngine** ([FlowEngine.tsx](src/03_Runtime/engine/onboarding/flow-engine/FlowEngine.tsx)): Accepts `config: FlowConfig` and `onAction` / `actionContext`. It does not care which business or file the config came from. So many JSONs → many configs → same engine.

The only missing link is **data source and navigator**: the dev selector must be fed by a **flow-only list** (from a new or extended API) and must **navigate to FlowRuntimeScreen with flowId** (and optional configUrl) instead of to a per-flow TSX path.

---

## 6. Recommended implementation order (when you implement)

1. **Add GET /api/flows/index**  
   Scan 01_App (e.g. Business, optionally Christian) for JSON files that have FlowConfig shape (`screens` array, optionally `id`). Return `{ flows: [{ id, title?, configPath?, configUrl? }] }`. Use `id` from JSON or from filename stem.

2. **Extend GET /api/flows/[flowId]** (optional)  
   Resolve flowId to JSON under 01_App/Business (and agreed roots) by filename or `id` so that FlowRuntimeScreen can rely only on flowId.

3. **Add “Flows” to the navigator**  
   In layout, fetch `/api/flows/index`. Pass flows to CascadingScreenMenu (or a dedicated Flow dropdown). When user selects a flow, navigate to `/dev?screen=tsx:Runtime/FlowRuntimeScreen&flowId=<id>` (and `&configUrl=<url>` if needed).

4. **CascadingScreenMenu (or new component)**  
   For “Flows” section items, build URL with `screen=tsx:Runtime/FlowRuntimeScreen` and `flowId` (+ optional `configUrl`). Do not use `tsx:Business/.../FileName` for these items.

5. **No deletions**  
   Keep existing TSX entries (ContainerCreationsLanding-2, PrayerApp, etc.) and existing /api/screens behavior so current workflows keep working. The new “Flows” section is additive.

---

## 7. Summary

| Question | Answer |
|----------|--------|
| **Current limitation** | Selector is file-tree-driven (TSX + JSON mixed); path is always a TSX path; no “flow” concept in the menu. |
| **JSON-driven selector a good idea?** | Yes: one source of truth (flow JSONs), scales without new TSX, aligns with one runtime screen. |
| **FlowEngine / FlowScreenWrapper** | Already support any flow via flowId + optional configUrl; no code change. |
| **Resolver / dev page** | No change for FlowRuntimeScreen. Only the **navigator** must list flows and set `screen=tsx:Runtime/FlowRuntimeScreen&flowId=...`. |
| **Safest approach** | New GET /api/flows/index for flow list; add “Flows” section in navigator that sets compound URL; optionally extend /api/flows/[flowId] to serve from 01_App; leave existing screens and APIs unchanged. |

This plan gives you a JSON-driven dev screen selector (dropdown shows N flow JSONs; selecting one runs the same FlowRuntimeScreen) while preserving all existing behavior and avoiding deletions or risky refactors.
