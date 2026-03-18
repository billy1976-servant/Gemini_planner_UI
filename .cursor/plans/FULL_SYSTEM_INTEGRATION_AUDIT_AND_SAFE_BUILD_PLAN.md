# Full System Integration Audit + Safe Build Plan

**Date:** 2026-02-24  
**Scope:** Integration of Google Ads Builder, Ad Variant Manager, Creative Preview, Schedule Viewer, Onboarding Flow Link, Performance Tracker, Side-by-Side Comparison, Google API Connector Preparation into existing HiSense architecture.  
**Constraint:** Analysis + structured build plan only. No implementation, no file changes, no refactor, no parallel systems.

---

## PHASE 1 — System Scan

### 1.1 UI architecture map

#### Layout wrappers

- **Screen-level:** `src/04_Presentation/lib-layout/molecules/` — `page-layout.tsx`, `row-layout.tsx`, `column-layout.tsx`, `grid-layout.tsx`, `stack-layout.tsx`. Used by registry and JSON-driven screens via `LayoutMoleculeRenderer` and `resolveMoleculeLayout`.
- **Workspace:** No layout molecules; direct flex layout in `WorkspaceLayout.tsx` (root, header, body, sidebar, main) with CSS module `WorkspaceLayout.module.css`.
- **Onboarding:** FlowViewer and flows-index use inline styles and content.ts; no shared layout wrapper. FlowViewer is a single-column step view with debug panel.
- **Dev page:** Resolves TSX via `AUTO_TSX_MAP` (require.context on `(live) Business` and `(dead) Tsx`). Workspace and onboarding are under `(live) Business` and loaded by path (e.g. `(live) Business/workspace/WorkspaceLayout`, `(live) Business/onboarding/FlowViewer`).

#### Molecules / components

- **Contract molecules (12):** `src/04_Presentation/components/molecules/` — section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar. Exported via `getCompoundComponent(id)` from `index.ts`; definitions in `molecules.json`. Used by JSON-renderer and registry for screen JSON.
- **UI molecules (cards etc.):** `src/04_Presentation/ui/molecules/` — EducationCard, CalculatorCard, SummaryCard, ComparisonCard, ProductCard, etc.; layout molecules (row, column, grid, stack, page). Registry imports EducationCard, CalculatorCard, SummaryCard and layout molecules.
- **Workspace usage:** Workspace tabs use **native HTML + CSS modules** (section, button, div, className={styles.*}). Only **flows-index** uses `ButtonCompound` from `@/components/molecules/button.compound`; **FlowViewer** uses `EducationCard` from `@/ui/molecules/cards`. So workspace is mostly direct TSX + CSS; molecules are used where a shared card/button fits (onboarding, flows-index).
- **Paths:** `@/components/molecules` (contract compounds), `@/ui/molecules` (cards, JournalHistory, panels, charts), `@/lib/layout/molecules` (layout primitives).

#### Styling system

- **CSS modules:** Workspace uses `WorkspaceLayout.module.css`, `Accordion.module.css`, `workspace-indicators.module.css`. Classes: `.root`, `.header`, `.section`, `.sidebar`, `.main`, `.reportButton`, `.uploadButton`, `.emptyStateButton`, `.dashboard`, `.chartTitle`, `.recommendationList`, etc. No global design tokens in workspace; hex/shadows in module.
- **Indicator tokens:** `workspace-indicators.module.css` maps indicator-map color tokens (green, light-green, gray, light-red, red / strongPositive … strongNegative) to classes. Tabs use `indicatorClass(colorToken)` → CSS class.
- **Palette system (elsewhere):** `palette-store`, `palette-resolver`, `palettes/*.json`, `palette-bridge` — used by JSON-renderer and layout; workspace does not use palette by default.
- **Convention:** Same CSS module file-per-component pattern; shared classes live in workspace CSS files.

#### Color system

- **Workspace:** Local in CSS modules — e.g. `#f8fafc`, `#fff`, `#e5e7eb`, `#6b7280`, borders, backgrounds. Indicator colors come from **indicator-map** (green, light-green, gray, light-red, red) and are applied via `workspace-indicators.module.css`.
- **Indicator-map:** `DEFAULT_COLORS` (strongPositive … strongNegative); no hex in logic — UI maps tokens to CSS classes.

#### Chart system

- **Location:** `src/01_App/(live) Business/workspace/charts/` — RoasOverTimeChart, RevenueVsSpendChart, CpaTrendChart, ProjectionVarianceChart, HeadroomGauge. Exported from `charts/index.ts`.
- **Data source:** All consume insights/aggregation shape (from `/api/google-ads/insights` or equivalent). Use `getIndicator` / `getIndicatorForMetric` for color/arrow (CpaTrendChart, HeadroomGauge).
- **Usage:** CommandCenterTab (via OverviewPage), CompareTab, ProjectionsTab, TimelineTab. Charts are workspace-specific components, not from a global chart library.

#### Indicator usage

- **Source:** `src/05_Logic/logic/business/ui/indicator-map.ts` — `getIndicator(metricValue, trendSlope, options?)`, `getIndicatorForMetric(metricName, value)`. Options: metric `"roas" | "cpa" | "generic"`, optional thresholds/colors/arrows. Returns `{ color, arrow, severity }`.
- **Consumers:** OverviewPage, CommandCenterTab, CompareTab, ProjectionsTab, CpaTrendChart, HeadroomGauge; (dead) google-ads-dashboard. Pattern: `const ind = getIndicator(roas, slope, { metric: "roas" });` then `indicatorClass(ind.color)` for className.
- **CSS bridge:** `workspace-indicators.module.css` defines `.indicatorGreen`, `.indicatorLightGreen`, etc., used by `indicatorClass()`.

#### Workspace tab pattern

- **Component:** `WorkspaceLayout.tsx` — state: `businessId`, `dateRange`, `activeView` (ViewId), `sidebarExpanded`. ViewId = `"command" | "compare" | "timeline" | "data" | "reports"`.
- **NAV_ITEMS:** Array of `{ id, label, icon }`; sidebar buttons set `setActiveView(item.id)`. Main content: `{activeView === "command" && <CommandCenterTab ... />}` etc. No URL routing; in-memory only. Tabs receive `businessId`, `onNavigateToData` (optional).
- **Data:** `useBusinesses()` from `business-model.ts` (listBusinesses, getBusinessById). APIs: `/api/google-ads/insights?businessId=`, `/api/google-ads/projection-snapshots`, etc. Types in `workspace/types.ts` (InsightsResponse, AggregatedMetrics, ProjectionSnapshot, ProjectionCompareResult).

---

### 1.2 Business logic architecture map

#### Engine boundaries

- **Location:** `src/05_Logic/logic/business/engines/` — aggregation, ranking, trend, capacity, insights, projection, projection-compare, saturation, demand, efficiency-history, market-depth, bundle-impact. All **pure**, typed input/output; no UI, no I/O. Only **ads-aggregation** imports `BusinessSignal`; others use aggregation/projection types.
- **Boundary:** Engines consume `BusinessSignal[]` or engine outputs; they do not call API or flow-loader. No engine must be modified for Ads Builder, Variant Manager, Creative Preview, Schedule, Onboarding Link, Performance Tracker, or Comparison.

#### Signal flow

- **Ingestion:** Campaigns + hourly → `normalizeCampaignsToSignals()` in `business-signal.ts` → `BusinessSignal[]`. CSV → `csv-to-signals.ts` → BusinessSignal[]. API routes (`/api/google-ads/insights`, reports) use `getCampaignsData()` then `normalizeCampaignsToSignals()`.
- **Pipeline:** signals → runAdsAggregation → (totals, byState, byHour, byCampaign) → ranking, trend, capacity, insights (orchestrator). Projection: createProjectionSnapshot / runProjectionCompare; store in projection-store (API persists).
- **BusinessSignal:** source, timestamp, region?, hour?, campaignId?, adId?, metrics. adId exists but is never set by current pipeline. Onboarding does not write signals.

#### API routes (relevant)

- **Google Ads:** `/api/google-ads/insights`, `/api/google-ads/campaigns`, `/api/google-ads/projection-snapshot`, `/api/google-ads/projection-snapshots`, `/api/google-ads/projection-compare`, `/api/google-ads/validate`, `/api/google-ads/route`. All use `get-campaigns-data.ts` and/or business engines.
- **Business:** `/api/business/csv/ingest`; `/api/reports/google-ads-summary`.
- **Flows:** `/api/flows/list`, `/api/flows/[flowId]` — list flows from Business_Files + flows dir; serve flow JSON.
- **Sites/onboarding:** `/api/sites/[domain]/onboarding` — returns onboarding.flow.json for domain.

#### Flow loader system

- **flow-loader.ts:** `getAvailableFlows()` → fetch `/api/flows/list`. `loadFlow(flowId)` → fetch `/api/flows/[flowId]` or registered FLOWS (from require.context Business_Files Flows/*.json). Engine application via engine-contract (learning, abc, calculator, etc.). EducationFlow type: id, title, steps, routing, calcRefs, etc.
- **Onboarding-flow-router:** Resolves FlowDecision (pricing-jump-flow, education-flow, calculator-1-flow) from context/answers. Used for flow selection, not screen layout.

#### Business folder discovery

- **Flows:** `/api/flows/list` scans `src/00_Projects/Business_Files` for directories named `Flows` or `flows`, then all JSON files therein; also `src/05_Logic/logic/flows`. flow-loader has require.context on `00_Projects/Business_Files` with `(Flows|flows)/.*\.json`. **No manual registry** — discovery by convention.
- **Business list (workspace):** `business-model.ts` exports `listBusinesses()` / `getBusinessById()` — currently static DEFAULT_BUSINESSES (e.g. "Google Ads", "CSV Upload"). Documented as "can be replaced with folder/registry source later."

---

### 1.3 Extension points

| Feature | Where it belongs | How it attaches |
|--------|-------------------|------------------|
| **Google Ads Builder** | New workspace tab or sub-view under Command/Data | Add ViewId (e.g. `"ads-builder"`) and tab component in WorkspaceLayout; use same styles, indicator-map, fetch from new API (e.g. `/api/google-ads/...`). Optionally use section/card/button molecules for form blocks. |
| **Ad Variant Manager** | Same shell as Ads Builder or Compare | New tab or panel within workspace; list/detail of variants; data from execute layer or API returning variant list; UI reuses workspace CSS and indicators. |
| **Creative Preview** | Panel inside Ads Builder or Variant Manager | Component that receives ad definition (headlines, descriptions, image URLs); render preview in a card/section; no engine change. Data from execute layer (ad definitions JSON). |
| **Schedule Viewer** | Workspace tab or section in Command Center | New tab or Accordion section; display schedule (e.g. active/paused, time windows); data from control state or new API; reuse charts/indicators if showing time-series. |
| **Onboarding Flow Link** | Bridge between FlowViewer and BusinessSignal / workspace | **Plug-in:** On flow complete (or step), write event to API or client store that maps to BusinessSignal `source: "onboarding"` (optional onboardingFlowId). Workspace or API merges onboarding events with ads data. FlowViewer and flow-loader unchanged; add adapter only. |
| **Performance Tracker** | Existing Command Center + Timeline + Compare | Extend existing tabs with ad-level or variant-level metrics when available; reuse byCampaign/byHour/byState and add byAd when pipeline supports it. No new shell; extend data and table/chart components. |
| **Side-by-Side Comparison** | CompareTab extension | CompareTab already has campaign/hour/state comparison; extend with second dimension (e.g. ad A vs ad B, or variant A vs B) when byAd or variant metrics exist. Reuse CompareTab layout and indicatorClass. |
| **Google API Connector** | API layer only | **Lives in:** `src/app/api/google-ads/` (client, get-campaigns-data, validate, etc.). New routes or params for OAuth, token refresh, optional ad-level queries. No UI in connector; UI calls existing or new API routes. |

| Layer | Where execute / definitions attach |
|--------|------------------------------------|
| **Execute layer** | New folder `src/05_Logic/logic/business/execute/` — load ad definitions (and optionally onboarding config) from JSON; auto-discover paths under Business_Files or configured root. Called by API routes or workspace; **never** by engines. |
| **Onboarding linkage** | Adapter in API or client: on onboarding event (flow complete/step), POST to e.g. `/api/business/onboarding-event` or append to a store that insights API can merge; or client-side merge before render. FlowViewer stays unchanged; optional `onboardingFlowId` on BusinessSignal (additive only). |
| **Google API connector** | Purely in `app/api/google-ads/` (and env): client creation, token handling, query builders. Preparation = new route handlers or query options (e.g. ad_group_ad metrics) when Google approves; get-campaigns-data remains the single entry for campaign data until then. |

---

## PHASE 2 — Gap Analysis

### 2.1 CURRENT SYSTEM vs REQUIRED SYSTEM

#### What exists

- Workspace shell: WorkspaceLayout, 5 tabs (command, compare, timeline, data, reports), business selector, date range, sidebar nav. CSS modules, indicator-map, types from insights API.
- Engines: Full pipeline (aggregation, ranking, trend, capacity, insights, projection, compare, etc.); byCampaign, byHour, byState; no byAd.
- BusinessSignal: campaignId, adId (optional, unused), source (google-ads | shopify | onboarding); normalizers for campaigns + hourly.
- API: google-ads/insights, campaigns, projection-snapshot(s), projection-compare, reports/google-ads-summary; get-campaigns-data (campaign + hourly mock; live returns empty hourly).
- Flow system: FlowViewer, flows-index, content.ts, flow-loader, /api/flows/list, /api/flows/[flowId], Business_Files Flows discovery; Onboarding-flow-router.
- Molecules: 12 contract compounds + UI molecules (EducationCard, etc.); workspace uses native HTML + CSS plus ButtonCompound (flows-index), EducationCard (FlowViewer).
- Charts: RoasOverTime, RevenueVsSpend, CpaTrend, ProjectionVariance, HeadroomGauge; all use indicator-map where applicable.
- Business list: business-model (static list); useBusinesses() in workspace.

#### What partially exists

- **Ad-level:** BusinessSignal.adId and campaignId exist; adId never set. No byAd in aggregation; no ad-level API. **Required:** Ad definitions (execute layer), optional byAd aggregation extension, API to return ad-level metrics when available.
- **Onboarding ↔ business:** source "onboarding" exists; no writer. **Required:** Adapter (event → BusinessSignal or merged view) and optional onboardingFlowId.
- **Hour-level:** byHour and hourly signals exist; live hourly is empty. **Required:** Keep as-is; when Google API supports hourly/ad-level, extend get-campaigns-data and optional byAd.
- **Schedule:** Control state in (dead) google-ads-dashboard has schedule (active/paused); no schedule viewer in live workspace. **Required:** Schedule viewer component + data from API or control state.
- **Creative / variant definitions:** None. **Required:** JSON definitions + execute loader + Creative Preview UI.

#### What must be extended

- **Workspace:** Add new tab(s) or sections for Ads Builder, Variant Manager, Creative Preview, Schedule Viewer; extend CompareTab for side-by-side ad/variant comparison when data exists. Reuse ViewId pattern, same CSS, same indicator pattern.
- **API:** New routes (or existing extended) for: ad definitions list, single ad/variant, onboarding-event (if chosen), schedule (if from API). get-campaigns-data extended only when Google provides ad-level/hourly in live mode.
- **Types (workspace/types.ts or equivalent):** Add types for ad definition, variant, schedule payload; keep InsightsResponse and engine types unchanged.
- **Business list:** Optionally extend business-model or discovery (e.g. from folder) per existing doc; not required for first increment.
- **Indicator-map:** No change required; add new metric keys only if new metrics (e.g. ad-level ROAS) need threshold rules; optional.

#### What must be added

- **Execute layer:** `src/05_Logic/logic/business/execute/` — ad-definitions loader, optional onboarding-definitions loader, definitions-loader (auto-discover JSON under Business_Files or config). No engine changes.
- **Ad definitions JSON:** Schema + files (e.g. under 00_Projects/Business_Files or execute config path); headline, description, image, variant, optional campaign/adGroup refs.
- **Workspace UI:** New tab components (or panels): Ads Builder tab, Ad Variant Manager (or combined), Creative Preview panel, Schedule Viewer tab. Use WorkspaceLayout.module.css and workspace-indicators; optional use of section/card/button molecules.
- **Onboarding adapter:** Mechanism to emit or persist onboarding events and optionally attach onboardingFlowId to signals or merged view (API or client); FlowViewer unchanged.
- **Google API connector preparation:** New or extended route(s) in app/api/google-ads for token/refresh and, when available, ad-level query; keep get-campaigns-data as main entry, extend response shape when needed.
- **Performance Tracker:** Can be implemented as extension of Command Center + Timeline (same data + optional byAd when present); no separate "tracker" app.
- **Side-by-side comparison:** Extend CompareTab with second entity (ad or variant) when byAd or variant API exists; same layout and indicators.

#### What must NOT be touched

- **Engines:** No changes to files under `src/05_Logic/logic/business/engines/`. No new engine dependencies on execute or ad definitions.
- **Projection system:** projection-snapshot.ts, projection-store.ts, ads-projection.engine, ads-projection-compare.engine — unchanged.
- **business-signal.ts:** Only additive, optional fields allowed (e.g. onboardingFlowId); no removal or breaking change to existing fields or normalizers.
- **Flow loader / FlowViewer:** No change to flow-loader.ts, FlowViewer.tsx, flows-index.tsx, Onboarding-flow-router logic. Onboarding linkage is adapter only.
- **Registry / JSON-renderer / molecule contract:** No change to getCompoundComponent, molecules.json, or registry.tsx for this integration. New workspace tabs do not require new molecule types unless we choose to use existing section/card/button.
- **Dev page TSX resolver:** Auto-discovery of `(live) Business` already includes workspace and onboarding; new tabs are inside WorkspaceLayout, so no new screen path required for "workspace." Optional new screen path only if we add a standalone Ads Builder screen (then add under (live) Business and it will be auto-discovered).
- **Indicator-map:** No breaking change; additive thresholds/metrics only if needed.
- **Existing workspace tabs:** CommandCenterTab, CompareTab, TimelineTab, DataTab, ReportsTab — extend only (e.g. pass new props or data); no rewrite or removal.

---

### 2.2 Specific compatibility checks

| Requirement | Status |
|-------------|--------|
| **Molecule compatibility** | New UI uses same pattern as workspace: CSS modules + optional molecules (ButtonCompound, card, section) where it fits. No new molecule types; no bypass of getCompoundComponent for JSON screens. |
| **Workspace compatibility** | New features are new tab(s) or panels inside WorkspaceLayout; same ViewId pattern, same businessId/dateRange, same styles and EmptyStatePanel pattern. |
| **Indicator-map reuse** | All new metric displays use getIndicator / getIndicatorForMetric and indicatorClass → workspace-indicators.module.css. No new color system. |
| **Chart reuse** | New time-series or gauges use existing chart components (RoasOverTime, CpaTrend, HeadroomGauge, etc.) or same pattern (props from insights/aggregation shape). |
| **FlowViewer reuse** | Unchanged. Onboarding link is adapter (event → signal or API); no change to FlowViewer or flow-loader. |
| **BusinessSignal extension** | Additive only: e.g. optional `onboardingFlowId?: string` (and optionally `onboardingStepId?).` Engines ignore it. Normalizers unchanged; only new adapters set it. |
| **Ad-level signal feasibility** | BusinessSignal already has adId. When API provides ad-level rows, normalizeCampaignsToSignals (or a new normalizer in same file) can set adId; aggregation can be extended with byAd in a separate, additive change (or execute layer can aggregate by ad for UI only). |
| **Hour-level tracking feasibility** | Already supported: byHour in aggregation, hourly in signals. Live hourly is empty due to current API; when Google returns hourly (and optionally ad-level), extend get-campaigns-data and optionally normalizer. No engine signature change required for byAd if we add it as optional output. |

---

## PHASE 3 — Safe Integration Plan (staged, modular, reversible)

### Principles

- Build on existing components; reuse molecules, styling, workspace routing, engines, projections, business-signal (additive only).
- No duplication of pipeline or design language; no parallel system; no registry edits; auto-discovery only.
- Modular: each stage deliverable and testable. Reversible: new code in new files or new routes; feature flags or route guards if needed.
- Google Ads API: extend existing client and routes; no replacement of get-campaigns-data until ad-level/hourly are available.

### Staged build plan

**Stage 1 — Execute layer + ad definitions (no UI)**  
- Add `src/05_Logic/logic/business/execute/` with ad-definitions loader (types + load from JSON path).  
- Add optional definitions-loader that scans a configured root (e.g. Business_Files) for `**/ads/*.json` or similar.  
- No changes to engines, projections, business-signal.  
- **Reversible:** Remove execute folder and any imports.

**Stage 2 — API for definitions and schedule**  
- Add GET routes e.g. `/api/google-ads/ad-definitions`, `/api/google-ads/schedule` (or extend existing route with query).  
- Routes call execute layer for definitions; schedule from control state or mock.  
- **Reversible:** Remove routes only.

**Stage 3 — Workspace: new tabs (shell only)**  
- Extend ViewId with e.g. `"ads-builder"`, `"schedule"` (or combined).  
- Add tab components that render placeholder or “No data” using EmptyStatePanel pattern and existing styles.  
- No new screen path; tabs inside WorkspaceLayout.  
- **Reversible:** Remove ViewId and tab components; revert NAV_ITEMS.

**Stage 4 — Creative Preview + Ads Builder UI**  
- Creative Preview: component that takes ad definition (headlines, descriptions, image URLs) and renders preview; use section/card and workspace CSS.  
- Ads Builder tab: form or list that loads from `/api/google-ads/ad-definitions`, selects ad, shows Creative Preview panel.  
- **Reversible:** Remove components and tab content.

**Stage 5 — Ad Variant Manager + Schedule Viewer**  
- Variant Manager: list/detail of variants (from definitions or API); same styles and optional molecules.  
- Schedule Viewer: display schedule (active/paused, windows); data from schedule API or control state.  
- **Reversible:** Remove components.

**Stage 6 — Onboarding link (adapter only)**  
- Add optional `onboardingFlowId` (and stepId) to BusinessSignal; engines ignore.  
- Add adapter: FlowViewer completion/step → POST to `/api/business/onboarding-event` or client store; API or merge layer appends to signals for display.  
- FlowViewer and flow-loader unchanged.  
- **Reversible:** Remove adapter and optional fields; no engine change.

**Stage 7 — Performance Tracker + side-by-side comparison**  
- Performance Tracker: extend Command Center / Timeline with ad-level or variant-level blocks when byAd or variant data exists; reuse charts and indicators.  
- CompareTab: add second dimension (ad A vs B or variant A vs B) when data available; reuse existing comparison layout and indicatorClass.  
- **Reversible:** Remove extended blocks; CompareTab falls back to current behavior.

**Stage 8 — Google API connector preparation**  
- New or extended routes in app/api/google-ads for OAuth/token refresh and, when approved, ad-level/hourly query params.  
- get-campaigns-data remains main entry; extend response when Google provides new fields.  
- **Reversible:** Remove new routes or params.

Order is dependency-safe: execute → API → shell → UI → adapter → extensions → connector. Each stage avoids breaking changes and avoids registry edits; discovery is by convention (folder/JSON path).

---

## PHASE 4 — Risk Report

### Potential destructive operations

- **None** if plan is followed: no engine edits, no projection edits, no removal of existing BusinessSignal fields, no refactor of flow-loader or FlowViewer.  
- **Risk if deviated:** Editing engines or projection types would be destructive. Adding required fields to engine input/output would be breaking.  
- **Mitigation:** Strict rule — engines and projections are read-only for this integration; BusinessSignal additive only.

### Circular dependency risks

- **Execute layer:** Must not import engines or projections. It may import business-signal (types only) if we add optional fields. API and workspace import execute and business. **Risk:** Low if execute only loads JSON and exports types/functions; no import of API or UI.
- **Workspace importing execute:** Allowed; execute has no UI. **Risk:** None.
- **Engines importing execute or ad definitions:** Forbidden. **Risk:** None if rule is kept.

### Risk to engines

- **None** if no file under `engines/` is modified and no engine input/output contract is changed. Optional byAd in aggregation could be added as **additive** output (new key); existing callers ignore it. **Risk:** Low if byAd is optional and added in a single, scoped change.

### Risk to projection system

- **None** if projection-snapshot, projection-store, ads-projection.engine, ads-projection-compare.engine are untouched. **Risk:** None.

### Risk to existing onboarding

- **Low.** Adapter only: event out from FlowViewer (or flow completion) to API or store. FlowViewer, flows-index, flow-loader, Onboarding-flow-router unchanged. **Risk:** Bug in adapter could miss events; no risk to flow rendering or routing.

### Risk to TSX builder system

- **Low.** New tabs are inside existing WorkspaceLayout; dev page already resolves `(live) Business/*` by context. No change to TSX map or resolver unless we add a standalone Ads Builder screen (then one new path under (live) Business, auto-discovered). **Risk:** None for workspace tabs; low for one new screen.

### Summary of risks

- **Destructive:** None, provided engines, projections, and existing BusinessSignal contracts are not changed.  
- **Circular:** None if execute does not import engines/API/UI.  
- **Engines / projections / onboarding / TSX:** No or low risk when following the plan and non-touch rules.

---

## FINAL OUTPUT

### Architecture summary

- **UI:** Workspace = WorkspaceLayout + 5 tabs, CSS modules, indicator-map, workspace types; onboarding = FlowViewer + flows-index, EducationCard, flow-loader, /api/flows. Molecules = 12 contract + UI cards/layout; workspace uses them sparingly (button, EducationCard). Charts = workspace/charts/*, fed by insights API.
- **Business logic:** Engines (pure), BusinessSignal (normalizers), projections (snapshot + store + compare). API: google-ads/*, flows/list|[flowId], business/csv, reports. Flow discovery: Business_Files Flows/*.json + api/flows/list. Business list: business-model (static).
- **Integration:** New features sit in new workspace tab(s) and panels, execute layer (definitions), new/expanded API routes, and optional BusinessSignal/onboarding adapter. No parallel system; no new design language; no bypass of molecules for JSON-driven screens.

### Integration map

| Capability | Layer | Attachment point |
|------------|--------|-------------------|
| Google Ads Builder | UI | New tab in WorkspaceLayout; API: ad-definitions, campaigns. |
| Ad Variant Manager | UI | New tab or panel; data from execute or API. |
| Creative Preview | UI | Panel in Ads Builder/Variant tab; data from ad definition. |
| Schedule Viewer | UI | New tab or section; data from schedule API/control state. |
| Onboarding Flow Link | Adapter | Event from FlowViewer → API/store; optional onboardingFlowId on signal. |
| Performance Tracker | UI | Extension of Command + Timeline; reuse charts/indicators; optional byAd. |
| Side-by-Side Comparison | UI | Extension of CompareTab; second dimension when ad/variant data exists. |
| Google API Connector | API | app/api/google-ads: client, routes, optional ad-level when available. |
| Ad definitions | Data | execute layer + JSON; API serves; UI consumes. |

### Required additions (checklist)

- [ ] Execute layer: `execute/` with ad-definitions loader and optional discovery.
- [ ] Ad definitions JSON schema and sample files (path by convention).
- [ ] API: ad-definitions (and optionally schedule, onboarding-event).
- [ ] Workspace: new ViewId(s) and tab components (Ads Builder, Variant Manager, Schedule Viewer); Creative Preview panel; extend CompareTab for side-by-side ad/variant.
- [ ] Onboarding adapter: event → BusinessSignal or merged view; optional onboardingFlowId/onboardingStepId.
- [ ] Optional: byAd in aggregation (additive) and ad-level in get-campaigns-data when Google supports it.
- [ ] Google API connector: token/refresh and future ad-level query preparation.

### Non-touch guarantee

- **Do not modify:** engines (any file under business/engines/), projection-snapshot, projection-store, ads-projection.engine, ads-projection-compare.engine, flow-loader, FlowViewer, flows-index, Onboarding-flow-router, registry getCompoundComponent/molecules.json, dev page resolver logic for existing paths.
- **Do not remove or break:** Any existing BusinessSignal field or normalizer; any existing workspace tab; any existing API route contract.
- **Additive only:** BusinessSignal (optional fields), aggregation (optional byAd), new routes, new tabs, new execute module.

### Safe implementation phases (ordered)

1. Execute layer + ad definitions (no UI).  
2. API for definitions and schedule.  
3. Workspace new tabs (shell only).  
4. Creative Preview + Ads Builder UI.  
5. Ad Variant Manager + Schedule Viewer.  
6. Onboarding link (adapter only).  
7. Performance Tracker + side-by-side comparison.  
8. Google API connector preparation.

### Confidence level: **8/10**

- **Reasoning:** Architecture and extension points are clear; workspace and API patterns are consistent; engines and projections can stay untouched. Confidence reduced slightly by: (1) live Google Ads hourly/ad-level not yet available, (2) optional byAd in aggregation needs to stay additive and tested, (3) onboarding adapter design (event shape, storage) may need one product decision.

---

**No implementation was performed. No files were created or modified. This document is analysis and plan only.**
