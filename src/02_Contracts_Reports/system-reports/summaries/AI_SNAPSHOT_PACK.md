# AI Snapshot Pack — System X-Ray

**Generated:** 2026-02-06T15:43:43.920Z
**Git commit:** `722a85d6905c2041a047da777ce3c12d25163ca9`
**Repo root:** HiSense

---

## System Spine (authoritative)

Flow: **JSON Screen → Engines → State → Layout → Renderer → DOM**

### JSON Screen

- **`src/app/page.tsx`** — Entry; searchParams.get('screen')/('flow'); loadScreen(path); resolveLandingPage()
- **`src/app/api/screens/[...path]/route.ts`** — GET handler; serves JSON from apps-offline/apps or TSX marker from screens
- **`src/engine/core/screen-loader.ts`** — loadScreen(path): TSX descriptor or fetch /api/screens; dispatchState state:currentView if json.state

### Engines

- **`src/app/page.tsx`** — assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen, setCurrentScreenTree
- **`src/lib/site-renderer/palette-bridge.tsx`** — applySkinBindings / skin application
- **`src/engine/core/behavior-listener.ts`** — installBehaviorListener; action → state:* | navigate | runBehavior | interpretRuntimeVerb
- **`src/behavior/behavior-runner.ts`** — runBehavior(domain, action, ctx, args)
- **`src/logic/runtime/engine-bridge.ts`** — Engine I/O bridge for logic engines

### State

- **`src/state/state-store.ts`** — dispatchState(intent, payload); log; persist/rehydrate; listeners
- **`src/state/state-resolver.ts`** — deriveState(log): currentView, journal, values, layoutByScreen, scans, interactions

### Layout

- **`src/layout/resolver/layout-resolver.ts`** — resolveLayout(layoutId, context); getDefaultSectionLayoutId
- **`src/layout/index.ts`** — Layout module entry; resolveLayout, getExperienceProfile, getTemplateProfile
- **`src/engine/core/layout-store.ts`** — Section/card/organ layout override store (section-layout-preset-store, organ-internal)
- **`src/lib/layout/molecule-layout-resolver.ts`** — resolveMoleculeLayout; molecule layout from definition

### Renderer

- **`src/engine/core/json-renderer.tsx`** — JsonRenderer; renderNode; applyProfileToNode; Registry lookup; section layout override → Section
- **`src/engine/core/registry.tsx`** — Registry: type → component; Section, primitives
- **`src/compounds/ui/12-molecules/section.compound.tsx`** — Section compound; resolveLayout(layout); LayoutMoleculeRenderer
- **`src/layout/renderer/LayoutMoleculeRenderer.tsx`** — Renders section structure; containerWidth, split, data-section-layout, data-container-width

### DOM

- **`src/engine/core/json-renderer.tsx`** — data-node-id, data-section-debug; sectionKey, containerWidth in dev
- **`src/layout/renderer/LayoutMoleculeRenderer.tsx`** — data-section-layout={layoutPresetId}; data-container-width={rawWidth}
- **`src/compounds/ui/12-molecules/section.compound.tsx`** — data-section-id={id}

---

## Contracts

### STATE CONTRACT

Observed keys and where they are written/read (inferred from codebase; if exact types cannot be inferred, treat as observed keys only):

| Key | Written in | Read in |
|-----|------------|--------|
| currentView | C:/Users/New User/Documents/HiSense/src/state/state-resolver.ts | state-resolver (derived) |
| journal | C:/Users/New User/Documents/HiSense/src/state/state-resolver.ts | state-resolver (derived) |
| values | C:/Users/New User/Documents/HiSense/src/state/state-resolver.ts | state-resolver (derived) |
| layoutByScreen | C:/Users/New User/Documents/HiSense/src/state/state-resolver.ts | state-resolver (derived) |
| values.<key> (generic) | C:/Users/New User/Documents/HiSense/src/state/state-store.ts, src/engine/core/behavior-listener.ts, src/engine/core/screen-loader.ts | src/state/state-resolver.ts, getState() consumers |

- **Intents:** `state:currentView`, `journal.set`/`journal.add`, `state.update`, `layout.override`, `scan.result`/`scan.interpreted`, `interaction.record`.
- **Derived shape:** `DerivedState` in `src/state/state-resolver.ts` (journal, rawCount, currentView, values, layoutByScreen, scans, interactions).

### ENGINE I/O CONTRACT

- **Standard engine input envelope:** path: string (screen path or tsx:path); json: object (screen document with root/screen/node, state?, sections?); context: layout context (screenKey, sectionKey, profile).
- **Standard engine output envelope:** screenTree: object (composed tree with section keys, layout applied); state: DerivedState (currentView, journal, values, layoutByScreen); dom: React tree → data-node-id, data-section-layout, data-container-width.
- **Where enforced (or should be):** src/engine/core/screen-loader.ts, src/state/state-store.ts, src/engine/core/json-renderer.tsx.

---

## Critical integration map

### Top 25 central files (with role tags)

| Path | in | out | score | role |
|------|-----|-----|-------|------|
| `src/state/state-store.ts` | 25 | 4 | 27.0 | state |
| `src/lib/layout/molecule-layout-resolver.ts` | 15 | 4 | 17.0 | - |
| `src/logic/flows/flow-loader.ts` | 14 | 6 | 17.0 | - |
| `src/components/9-atoms/primitives/surface.tsx` | 15 | 1 | 15.5 | primitives |
| `src/engine/core/palette-resolver.ts` | 15 | 1 | 15.5 | engines |
| `src/engine/core/json-renderer.tsx` | 6 | 18 | 15.0 | engines |
| `src/lib/site-compiler/normalizeSiteData.ts` | 12 | 6 | 15.0 | - |
| `src/logic/runtime/engine-bridge.ts` | 15 | 0 | 15.0 | - |
| `src/engine/core/registry.tsx` | 0 | 29 | 14.5 | engines |
| `src/components/9-atoms/primitives/collection.tsx` | 13 | 1 | 13.5 | primitives |
| `src/components/9-atoms/primitives/sequence.tsx` | 13 | 1 | 13.5 | primitives |
| `src/components/9-atoms/primitives/text.tsx` | 13 | 1 | 13.5 | primitives |
| `src/app/page.tsx` | 0 | 25 | 12.5 | runtime_core |
| `src/lib/site-renderer/renderFromSchema.tsx` | 2 | 18 | 11.0 | - |
| `src/components/9-atoms/primitives/trigger.tsx` | 10 | 1 | 10.5 | primitives |
| `src/engine/core/layout-store.ts` | 9 | 3 | 10.5 | engines |
| `src/engine/core/palette-resolve-token.ts` | 10 | 1 | 10.5 | engines |
| `src/devtools/pipeline-debug-store.ts` | 9 | 2 | 10.0 | - |
| `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` | 5 | 9 | 9.5 | - |
| `src/engine/debug/pipelineStageTrace.ts` | 9 | 0 | 9.0 | engines |
| `src/lib/siteCompiler/types.ts` | 9 | 0 | 9.0 | - |
| `src/lib/site-skin/SiteSkin.tsx` | 2 | 13 | 8.5 | - |
| `src/logic/products/product-types.ts` | 7 | 1 | 7.5 | - |
| `src/engine/onboarding/OnboardingFlowRenderer.tsx` | 3 | 8 | 7.0 | engines |
| `src/engine/site-runtime/GeneratedSiteViewer.tsx` | 3 | 8 | 7.0 | engines |

### Top 15 export hubs

- `src/state/state-store.ts` (exports: 0, inDegree: 25)
- `src/components/9-atoms/primitives/surface.tsx` (exports: 0, inDegree: 15)
- `src/engine/core/palette-resolver.ts` (exports: 0, inDegree: 15)
- `src/lib/layout/molecule-layout-resolver.ts` (exports: 0, inDegree: 15)
- `src/logic/runtime/engine-bridge.ts` (exports: 0, inDegree: 15)
- `src/logic/flows/flow-loader.ts` (exports: 0, inDegree: 14)
- `src/components/9-atoms/primitives/collection.tsx` (exports: 0, inDegree: 13)
- `src/components/9-atoms/primitives/sequence.tsx` (exports: 0, inDegree: 13)
- `src/components/9-atoms/primitives/text.tsx` (exports: 0, inDegree: 13)
- `src/lib/site-compiler/normalizeSiteData.ts` (exports: 0, inDegree: 12)
- `src/components/9-atoms/primitives/trigger.tsx` (exports: 0, inDegree: 10)
- `src/engine/core/palette-resolve-token.ts` (exports: 0, inDegree: 10)
- `src/devtools/pipeline-debug-store.ts` (exports: 0, inDegree: 9)
- `src/engine/core/layout-store.ts` (exports: 0, inDegree: 9)
- `src/engine/debug/pipelineStageTrace.ts` (exports: 0, inDegree: 9)

### Trunk entry points (pipeline start)

- `src/app/page.tsx`
- `src/app/api/screens/[...path]/route.ts`
- `src/engine/core/screen-loader.ts`

---
## Debug recipe (browser + CSS proof)

## Browser + CSS proof (layout/state)

1. **Section identity**: Inspect `data-section-id` on section wrapper (from section.compound.tsx). `data-section-layout` and `data-container-width` on the layout wrapper (LayoutMoleculeRenderer.tsx) show applied preset and container width.
2. **Node identity**: `data-node-id` on node wrappers (json-renderer.tsx). In dev, `data-section-debug` may show sectionKey and containerWidth.
3. **Files**: `src/compounds/ui/12-molecules/section.compound.tsx` (data-section-id), `src/layout/renderer/LayoutMoleculeRenderer.tsx` (data-section-layout, data-container-width), `src/engine/core/json-renderer.tsx` (data-node-id).

## Playwright optional proof (snippet — not executed)

```ts
// Capture screenshot
await page.screenshot({ path: "section-proof.png" });
// Computed style of section wrapper
const wrapper = page.locator("[data-section-id]").first();
const style = await wrapper.evaluate((el) => window.getComputedStyle(el));
// DOM attributes for section key
const sectionKey = await wrapper.getAttribute("data-section-id");
const layoutPreset = await page.locator("[data-section-layout]").first().getAttribute("data-section-layout");
const containerWidth = await page.locator("[data-container-width]").first().getAttribute("data-container-width");
```


---
## AI PROMPT FOOTER

Use this pack to diagnose issues: (1) Start from **System Spine** and verify each stage in order. (2) Check **STATE CONTRACT** and **ENGINE I/O CONTRACT** for expected shapes and where they are enforced. (3) Trace into **Renderer** and **DOM**; use **Debug recipe** to confirm layout/state in the browser. (4) Use **Critical integration map** to find central files and trunk entry points.
