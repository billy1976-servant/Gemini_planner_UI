# ROUND 2 — Parallel Systems Report

**Purpose:** Catalog secondary pipelines, legacy flows still referenced, and overlapping interpreters. Planning only.

---

## 1. Render pipelines

| Pipeline | Entry | Consumes | Status |
|----------|--------|----------|--------|
| **Primary** | app/page.tsx → loadScreen(path) or resolveLandingPage() | JSON screen or landing content; doc prep → JsonRenderer | PRIMARY |
| **TSX screen** | loadScreen("tsx:...") → TsxComponent set | TSX from screens/; no JsonRenderer | PRIMARY (branch) |
| **Generated site** | loadScreen("tsx:...") → SiteGeneratedScreen → GeneratedSiteViewer | renderFromSchema(layoutBlocks); content/sites, compiled | SECONDARY |
| **Site skin** | loadSiteSkin(domain, pageId) → SiteSkin | Skin JSON; collectRegionSections → JsonRenderer per region | SECONDARY |
| **EngineRunner** | hicurv.app.load event → mount JsonRenderer | Not on page.tsx load path | DEAD / PARTIAL |
| **ScreenRenderer** | screens/core/ScreenRenderer.tsx | loadScreenConfig(); alternate screen path | DEAD |

### Overlap

- JsonRenderer is shared by primary (page → JSON), SiteSkin (shells), and some TSX screens (e.g. json-skin.tsx, premium-onboarding). No overlapping *interpreters*; same renderer, different data source.
- renderFromSchema is a different render path (blocks → React); used only by GeneratedSiteViewer. No overlap with JsonRenderer node tree.

---

## 2. Legacy flows still referenced

| Flow | Location | Referenced by | Action |
|------|----------|---------------|--------|
| content/content-resolver | content/content-resolver.ts | Docs; no runtime import on main path | Remove or keep as @deprecated stub. |
| calc-resolver | logic/runtime/calc-resolver.ts | No callers | Remove or document optional. |
| EngineRunner | engine/runners/engine-runner.tsx | Event hicurv.app.load; not in page tree | Document DEAD/PARTIAL; no removal in R2. |
| ScreenRenderer | screens/core/ScreenRenderer.tsx | Possibly dev or legacy route | Document DEAD. |
| getLayout2Ids | Alias for getSectionLayoutIds (ROUND 1) | Deprecated alias | Already resolved in R1. |
| flow-loader / FlowRenderer | logic/flows, logic/flow-runtime | TSX/flow path | SECONDARY; keep. |

---

## 3. Overlapping interpreters

| Domain | Interpreters | Overlap? |
|--------|--------------|----------|
| **Screen tree** | JsonRenderer (node.type → Registry); renderFromSchema (block type → component) | No overlap; different trees and entrypoints. |
| **Layout** | resolveLayout (section); resolveMoleculeLayout (molecule); resolveInternalLayoutId (organ) | Three resolvers for different scopes (section vs molecule vs organ internal). Not overlapping; could be under one "layout" API surface. |
| **Behavior** | behavior-listener (state:* \| navigate \| runBehavior \| interpretRuntimeVerb); runBehavior → BehaviorEngine; interpretRuntimeVerb → action-runner | Single chain; no overlap. |
| **State** | deriveState (state-resolver); only one. | No overlap. |
| **Content** | logic/content/content-resolver (resolveContent); content/content-resolver (legacy, unused) | Two files; one dead. Remove legacy. |

---

## 4. Secondary path summary

| Path | Use case | Keep? |
|------|----------|--------|
| GeneratedSiteViewer + renderFromSchema | Generated-websites screens | Yes |
| SiteSkin | Shells, preview | Yes |
| Flow-loader + FlowRenderer | Flow JSON screens (TSX path) | Yes |
| engine-registry | Engine lookup (disconnected from main path) | Document; keep or isolate |
| view-resolver | Immediate/Expanded/Export view | Yes (secondary) |
| landing-page-resolver | No screen/flow landing | Yes |

---

## 5. Dead path removal (candidates for ROUND 2)

| Item | Action |
|------|--------|
| content/content-resolver.ts | Remove from build or stub; ensure no imports. |
| logic/runtime/calc-resolver.ts | Remove or document "optional; no main-path callers". |
| EngineRunner | No removal; document as event-only / partial. |
| ScreenRenderer | No removal; document as DEAD. |

---

## 6. Single trunk (ROUND 3 direction)

- **Single runtime pipeline:** page.tsx → loadScreen (JSON or TSX) → (if JSON) doc prep → JsonRenderer → behavior-listener → state.
- **Secondary paths** remain but are explicitly "not trunk": GeneratedSiteViewer, SiteSkin, flow-loader. No second "main" pipeline.
- **Single decision authority ladder:** State (state-resolver), Layout (layout/resolver + optional getSectionLayoutId), Behavior (behavior-listener → action-registry), Screen (loadScreen / resolveLandingPage).

---

*End of PARALLEL_SYSTEMS_REPORT.md*
