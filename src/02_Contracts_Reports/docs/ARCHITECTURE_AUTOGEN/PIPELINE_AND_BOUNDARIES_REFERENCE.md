# Pipeline and Boundaries Reference

Single source of truth for pipeline order, renderer classification, boundaries, and dev-only surfaces. Aligned with Phase 1 (Documentation + Contract Alignment).

---

## 1. Renderer classification (single table)

| Renderer | Role | File / note |
|----------|------|-------------|
| **JsonRenderer** | PRIMARY | `src/engine/core/json-renderer.tsx` — main runtime renderer for JSON screens; applyProfileToNode, renderNode, Registry. |
| **renderFromSchema** | SECONDARY | `src/lib/site-renderer/renderFromSchema.tsx` — layout blocks from schema; used by site/website flows, not main JSON screen path. |
| **GeneratedSiteViewer** | SECONDARY | `src/engine/site-runtime/GeneratedSiteViewer.tsx` — fetches compiled SiteSchema; renders via site-renderer; used by generated-websites screens (e.g. SiteGeneratedScreen, SiteViewerScreen). Not on main JSON screen path. |
| **ScreenRenderer** | DEAD | `src/screens/core/ScreenRenderer.tsx` — not on main path; TSX/flow screens only when loaded. Decision: document as DEAD unless explicitly wired. |
| **SiteSkin** | SECONDARY | `src/lib/site-skin/SiteSkin.tsx` — composes screen from schema; shells (AppShell, LearningShell, WebsiteShell); preview/alternate flows. |
| **EngineRunner** | DEAD / PARTIAL | Listens for `hicurv.app.load`; may mount JsonRenderer elsewhere; not on main page → loadScreen → JsonRenderer path. |

---

## 1b. Secondary paths (TSX / flow / site)

- **Site/generated path:** GeneratedSiteViewer and renderFromSchema are SECONDARY; they are used only when a route loads a generated-websites or site screen (e.g. SiteGeneratedScreen, SiteViewerScreen), not on the primary page → loadScreen → JsonRenderer path.
- **ScreenRenderer / Gibson path:** DEAD. ScreenRenderer is not mounted on the main app path; generated-websites and similar routes use GeneratedSiteViewer, not ScreenRenderer. Decision: document as DEAD; remove or wire only if explicitly planned.
- **Engine-registry, flow-loader, FlowRenderer:** SECONDARY — only on TSX/flow path. Reached when a TSX screen or flow is loaded (e.g. engine-viewer, OnboardingFlowRenderer, flow routes). Not reachable from the main JSON screen seed (page.tsx → loadScreen → JsonRenderer). Do not depend on them for the primary JSON path.

---

## 2. API routes

API routes are invoked by Next.js/fetch (e.g. `GET /api/screens/[...path]`). They are not part of the module graph. **Exclude from module reachability seed** or document when listing runtime entrypoints. See REACHABILITY_REPORT.generated.md for seed list.

---

## 3. Blueprint compiler boundary

- **Compiler output only:** Blueprint script produces `app.json`, `content.manifest.json` under `src/apps-offline/apps/<appPath>/`.
- **No runtime layout IDs:** Blueprint does not emit layout ids for sections at build time; layout comes from runtime (template, overrides, node.layout).
- **No blueprint script in runtime:** No script under `src/scripts/` is imported by app/engine/state/layout at runtime. Blueprint is build-time or one-off CLI.

See BLUEPRINT_RUNTIME_INTERFACE.generated.md for compiler output shape and runtime load path.

---

## 4. Behavior listener branch order

Order in `src/engine/core/behavior-listener.ts` for `window "action"`:

1. **state:\*** — dispatchState (state:currentView, state.update, journal.add, etc.); return.
2. **navigate** — navigate(to); return.
3. **Contract verbs** — tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay → runBehavior(domain, actionName, …); return.
4. **visual-proof** — dev-only DOM proof; return.
5. **interpretRuntimeVerb** — require("../../logic/runtime/runtime-verb-interpreter").interpretRuntimeVerb(detail, currentState); return.
6. **warn** — console.warn("[action] Unhandled action:", actionName).

---

## 5. loadScreen — single reference

| Aspect | Rule |
|--------|------|
| **Path rules** | `path` must contain `/` or start with `tsx:`. TSX: `loadScreen("tsx:tsx-screens/...")` returns `{ __type: "tsx-screen", path }`; no fetch. JSON: path normalized (strip leading `/`, `src/`, `apps-offline/apps/`, `apps/`), then fetch. |
| **TSX vs JSON** | TSX: screen-loader returns descriptor; page sets TsxComponent, setJson(null). JSON: fetch `GET /api/screens/${normalized}?t=...`; page setJson(data). |
| **State init** | After JSON fetch, if `json.state?.currentView` then `dispatchState("state:currentView", { value: json.state.currentView })` in screen-loader. |
| **API route location** | `src/app/api/screens/[...path]/route.ts` — GET handler; reads `path.join(process.cwd(), "src", "apps-offline", "apps", ...params.path)` + `.json`; returns NextResponse.json(json) or 404. |

See RUNTIME_PIPELINE_CONTRACT.md §1–2 for full table.

---

## 6. Layout resolution order — single reference

1. **Page** — page-layout-resolver (getPageLayoutId, getDefaultSectionLayoutId from templates.json).
2. **Component** — component-layout-resolver (resolveComponentLayout, component-layouts.json).
3. **Organ internal** — organ-layout-resolver (organ-internal-layout-profiles, internal layout id per section/organ).

Applied in JsonRenderer `applyProfileToNode`: override → node.layout → template default. See LAYOUT_RESOLUTION_CONTRACT.generated.md.

---

## 7. Document preparation pipeline order — single reference

Order in `src/app/page.tsx` for JSON branch:

1. **assignSectionInstanceKeys** — from `@/organs/resolve-organs`; stable instance keys on children.
2. **expandOrgansInDocument** — expandOrgansInDocument(docForOrgans, loadOrganVariant, organInternalLayoutOverrides).
3. **applySkinBindings** — applySkinBindings(expandedDoc, json?.data ?? {}) from `@/logic/bridges/skinBindings.apply`.
4. **composeOfflineScreen** — composeOfflineScreen({ rootNode, experienceProfile, layoutState }) from `@/lib/screens/compose-offline-screen`.

Then setCurrentScreenTree(composed); optional collapseLayoutNodes in dev.

---

## 8. Override stores — one table

| Store | File | Purpose |
|-------|------|---------|
| section-layout-preset-store | `src/state/section-layout-preset-store.ts` | Per-screen, per-section: section container layout id; getOverridesForScreen(screenId), setSectionLayoutPresetOverride. |
| Card overrides | same store | getCardOverridesForScreen(screenId), setCardLayoutPresetOverride — card layout preset id per section. |
| organ-internal-layout-store | `src/state/organ-internal-layout-store.ts` | Per-screen, per-section: organ internal layout id; getOrganInternalLayoutOverridesForScreen(screenId), setOrganInternalLayoutOverride. |

Passed from page to JsonRenderer as sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides. See LAYOUT_RESOLUTION_CONTRACT.generated.md.

---

## 9. config/ui-verb-map.json

- **Design-time:** config/ui-verb-map.json is used at design time / tooling for verb-to-behavior mapping.
- **Runtime:** Runtime behavior uses behavior-runner + behavior-listener (contract verbs → runBehavior; other actions → interpretRuntimeVerb). No runtime dependency on ui-verb-map.json for the main action path.

---

## 10. Scripts boundary

Scripts under `src/scripts/` (e.g. blueprint, docs generators, reachability) are **build-time or one-off**. **No script is imported by app/engine/state/layout at runtime.** Do not add runtime imports from scripts into the app/engine/state/layout module graph.

---

## 11. State persistence

| Aspect | Contract |
|--------|----------|
| **localStorage key** | Defined in state-store; used by persist() and rehydration. |
| **Event log shape** | Append-only log of { intent, payload }; deriveState(log) produces derived state. |
| **Rehydration** | On init, state-store reads from localStorage and replays log to deriveState. |
| **No new persistence** | Do not add new persistence mechanisms without updating this contract and state-store. |

See STATE_FLOW_CONTRACT.md, RUNTIME_PIPELINE_CONTRACT.md §7.

---

## 12. Site compiler (build-time or secondary)

- **normalizeSiteData** — build-time/secondary; normalizes raw site snapshot.
- **compileSiteToSchema** — build-time/secondary; compiles to schema used by renderFromSchema/site flows.
- **applyEngineOverlays** — build-time/secondary; applies engine overlays to schema/site data. No callers on main path; intended for site compile pipeline when using schema path.

Site compiler and applyEngineOverlays are **not on the main JSON screen path** (page → loadScreen → JsonRenderer). They are used for generated-websites/site schema path only. See ENGINE_RUNTIME_VISIBILITY_MAP.md for connection status.

---

## 13. Error reporting

- **Where errors are reported:** Throws and console.warn in behavior-listener (e.g. "[action] Missing action name", "[navigate] Missing destination", "[behavior-runner] failed", "[action] Unhandled action"). State-store and resolvers surface errors via return/log. Screen-loader and API route return 404 or throw as appropriate.
- **No silent swallows in primary path:** Primary path (request → loadScreen → document prep → layout → JsonRenderer → behavior → state) does not silently swallow errors; either throw, warn, or return with documented behavior.

---

## 14. Dev-only surfaces

The following do **not** change production paths:

- **runtime-decision-trace** — Dev tooling for decision trace; not on production code path.
- **Diagnostics** — Dev logging (e.g. evaluateCompatibility console.debug, behavior-listener console.log/groupCollapsed) and any dev-only panels; gated by dev/build flags or not invoked in production.

Production behavior and state flow are unchanged by these surfaces.

---

## 15. Component Registry (single source)

- **Single source:** `src/engine/core/registry.tsx` is the only type→component map. JsonRenderer resolves `node.type` via `Registry[node.type]` only; no competing maps.
- **No duplicate registries:** Do not maintain a separate type→component map elsewhere; add new JSON node types in Registry (or derive from a JSON manifest if a future contract requires it).
- **Contract alignment:** Registry keys align with JSON_SCREEN_CONTRACT / allowed types; new molecules or atoms require a Registry entry and contract update.
