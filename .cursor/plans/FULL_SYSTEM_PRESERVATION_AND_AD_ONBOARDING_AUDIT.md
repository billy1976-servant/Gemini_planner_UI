# Full System Preservation + Ad/Onboarding Audit

**Date:** 2026-02-24  
**Scope:** HiSense repo — analysis and architecture plan only. No file modifications, no engine edits, no refactors.

---

## PHASE 1 — Engine & Pipeline Lock

### 1.1 File existence and status

All specified paths exist and are in use:

| Path | Status |
|------|--------|
| `src/05_Logic/logic/business/engines/` | Present — 13 files (11 engine modules + index) |
| `src/05_Logic/logic/business/projections/` | Present — projection-store.ts, projection-snapshot.ts |
| `src/05_Logic/logic/business/business-signal.ts` | Present — core signal type and normalizers |

**Engines (all pure, JSON in/out; no UI or side effects):**

- **ads-aggregation.engine.ts** — Consumes `BusinessSignal[]`, outputs totals, byState, byHour, byCampaign (with roas, cpa, conversionRate). Filters `source === "google-ads"`. No byAd.
- **ads-ranking.engine.ts** — Consumes aggregation byState/byHour; outputs topStates, worstStates, topHours, worstHours (ROAS + volume threshold). Uses `AggregatedMetrics` from aggregation.
- **ads-trend.engine.ts** — Period-over-period delta; inputs current/previous `AggregatedMetrics`; outputs periodOverPeriodDelta, trendDirection, numericSlope.
- **ads-capacity.engine.ts** — Inputs: totals, optional currentBudget, impressionShare, performanceStabilityFactor, lift params. Outputs: projectedSafeBudget, projectedAggressiveBudget, expectedROASAtExpansion, marginalCPARisk. Degrades gracefully when data missing.
- **ads-insights.engine.ts** — Composes executiveSummary, highlights, recommendations, growthOpportunities, projectionConfidenceScore. Orchestrates aggregation, ranking, trend, capacity, projection-compare, saturation, demand, efficiencyHistory, marketDepth, bundleImpact (pass-through; no recompute).
- **ads-projection.engine.ts** — Creates `ProjectionSnapshot` from currentMetrics + capacityOutput; caller persists (e.g. API/store).
- **ads-projection-compare.engine.ts** — Compares projection vs actual AggregatedMetrics; outputs varianceROAS, varianceCPA, accuracyScore, adjustmentRecommendation.
- **Other engines (saturation, demand, efficiency-history, market-depth, bundle-impact)** — Present and exported from index; consume aggregation/capacity/projection types only.

**Projection snapshot + compare:**

- **projection-snapshot.ts** — Defines `ProjectionSnapshot` (id, timestamp, region?, hour?, projectedBudget, projectedROAS, projectedCPA) and `ProjectionSnapshotWithMeta` (adds createdAt).
- **projection-store.ts** — In-memory store for `ProjectionSnapshotWithMeta[]`; append, get, getById, clear; max 500 snapshots.
- **ads-projection.engine** — Creates snapshots; **ads-projection-compare.engine** — Compares snapshot to actuals.

**Indicator-map:**

- **ui/indicator-map.ts** — JSON-driven thresholds (roas, trendSlope, saturationScore, scalingHeadroomPercent, stabilityScore, demandConfidenceScore), DEFAULT_COLORS, DEFAULT_ARROWS. `getIndicator(metricValue, trendSlope, options)` and `getIndicatorForMetric(metric, value)` return `{ color, arrow, severity }`. Consumed by workspace OverviewPage, ProjectionsTab, CpaTrendChart, HeadroomGauge, and (dead) google-ads-dashboard. **No engine imports it** — UI-only.

### 1.2 Dependency and cycle check

- **business-signal.ts** — No imports from business/engines or business/projections. Defines types and `normalizeCampaignsToSignals`; used by csv-to-signals, csv-signals-store, ads-aggregation, and API routes.
- **engines** — Only `ads-aggregation.engine` imports from `../business-signal`. All other engines import only from sibling engines or `../projections/projection-snapshot` (types only). No engine imports from `../ui/indicator-map`.
- **projections** — Import only from `./projection-snapshot` (types). No import of engines or business-signal.
- **Flow:** business-signal → ads-aggregation → (ranking, trend, capacity, projection, projection-compare, insights, etc.). Projections are standalone. **No dependency cycles; no fragile cross-layer imports.** Type-only imports throughout (no runtime circular dependency risk).

**Conclusion:** Phase 1 — All listed files are present, functioning, and dependency-clean. No changes recommended.

---

## PHASE 2 — Onboarding System Audit

### Search coverage

Searched for: onboarding, landing, flow, page sequence, router, JSON configs, screen components.

### 2.1 Where onboarding screens are defined

- **Live (canonical):**
  - **FlowViewer:** `src/01_App/(live) Business/onboarding/FlowViewer.tsx` — Renders a selected flow with engine selector, step navigation, EducationCard, debug panel, next-step reason. Content from `content.ts`.
  - **flows-index:** `src/01_App/(live) Business/onboarding/flows-index.tsx` — Lists flows from `/api/flows/list`, filter by project, "Open Flow" navigates to FlowViewer with flow + engine params.
  - **content:** `src/01_App/(live) Business/onboarding/content.ts` — Copy/strings for flowsIndex and flowViewer (no flow structure).
- **Flow router (logic):** `src/05_Logic/logic/engines/Onboarding-flow-router.tsx` — `resolveOnboardingFlow(context)`, `resolveOnboardingFromAnswers(answers)`; returns FlowDecision: `pricing-jump-flow` | `education-flow` | `calculator-1-flow`. Used for flow selection, not screen layout.
- **Flow loader:** `src/05_Logic/logic/flows/flow-loader.ts` — `getAvailableFlows()` → `/api/flows/list`; `loadFlow(flowId)` → `/api/flows/[flowId]` or Business_Files auto-discovery (`require.context` on `00_Projects/Business_Files` matching `Flows/**/*.json`).
- **Dead/legacy:** Multiple screens under `(dead) screens/tsx-screens/onboarding/` and `(dead) Tsx/tsx-screens/onboarding/` (trial, premium-onboarding, json-skin, integration-flow-engine, legacy variants). Reference `Onboarding/trial.json`, screen-manifest.json, etc.

### 2.2 Static TSX vs config-driven

- **Screens (FlowViewer, flows-index):** TSX is fixed; **content** (labels, paths) is from `content.ts` (code constant object), not JSON.
- **Flow structure:** **Config-driven.** Flow definitions are JSON: loaded via `/api/flows/[flowId]` and/or from `00_Projects/Business_Files/.../Flows/*.json`. FlowLoader + engine-system apply engines (learning, abc, calculator, etc.) to produce step order and presentation.
- So: **Screens = static TSX with local content.ts; flow steps and routing = JSON-driven** (API + file-based).

### 2.3 Versioning

- No explicit **onboarding flow version** field found in flow JSON or API. Flow identity is by `flowId` (and optionally engineId). No version field in `EducationFlow` type or in flows-index/FlowViewer. **Versioning not implemented.**

### 2.4 Onboarding flow in isolation

- **Yes.** FlowViewer can be opened via `/dev?screen=tsx:(live) Business/onboarding/FlowViewer&flow=<flowId>&engine=<engineId>`. It loads one flow, runs one engine, no dependency on dashboard or ads. flows-index lists flows and navigates to FlowViewer. No hard dependency on BusinessSignal or Google Ads.

### 2.5 Tracking tags

- **FlowViewer** keeps local `trackingState: { flowId, engineId }` for UI/debug. No data-layer or analytics tags (e.g. gtag, data-* for analytics, or dedicated tracking payload) found in onboarding components. **No analytics/tracking tags in onboarding UI.**

### 2.6 Connection to BusinessSignal

- **None.** Onboarding does not write to BusinessSignal or to any shared business-signal store. `BusinessSignalSource` in business-signal.ts includes `"onboarding"`, but no code in onboarding screens or flow-loader pushes signals with `source: "onboarding"`. Plan docs (e.g. google_ads_api_manager_breakdown_v2.plan.md) describe the gap and suggest Option A/B (e.g. `business.signal` or `scan.interpreted` with onboarding payload). **Onboarding state does not currently connect to BusinessSignal.**

### 2.7 onboardingFlowId in signal layer

- **Does not exist.** Grep in `src/05_Logic/logic/business` for `onboardingFlowId`, `flowId`, `flow.id` (in business layer) found **no** usage. BusinessSignal has no `onboardingFlowId` (or flowId) field.

---

## PHASE 3 — Ad System Audit

### Search coverage

Searched for: campaign, ad, variant, creative, headline, description, image, schedule, state targeting, Google Ads creation logic, JSON ad definitions.

### 3.1 Ad definitions

- **No** JSON or code definitions for **ad creative** (headlines, descriptions, images, variants) in the business or API layer. The word "headline" appears only in unrelated UI/palette/site-compiler contexts. **No ad-definition files or ad-creation payloads.**

### 3.2 JSON-driven vs hardcoded ads

- **N/A.** There are no ad definitions to drive. Campaign list and metrics come from **get-campaigns-data** (mock data or Google Ads API campaign query). No ad-level or ad-group-level definitions anywhere.

### 3.3 campaignId / adId in BusinessSignal

- **campaignId:** **Yes.** `BusinessSignal` has optional `campaignId`. `normalizeCampaignsToSignals` sets it from campaign id; aggregation has `byCampaign`; CSV-to-signals supports campaignId.
- **adId:** **Yes, in type only.** `BusinessSignal` has optional `adId`. It is **never set** by `normalizeCampaignsToSignals` or by current API (get-campaigns-data returns only campaigns + hourly by campaign). So **adId is supported in the model but unused in the pipeline.**

### 3.4 Hourly breakdown and ad-level grouping

- **Hourly:** Aggregation has **byHour** (0–23). Hourly signals come from `HourlyPerformanceItemInput[]` (hour, optional campaignId, metrics). **byCampaign** is populated; **byAd** does **not** exist in aggregation. So hourly breakdown is **by hour and by campaign**, not by ad.

### 3.5 API layer and ad-level metrics

- **get-campaigns-data.ts:** Returns `CampaignItem[]` and `HourlyPerformanceItem[]`. Hourly items have `campaignId` only; no adId or ad_group_id. Live Google Ads query selects only **campaign** (campaign.id, name, status, etc.) and campaign-level metrics; **hourlyPerformance** is returned as `[]` in live path. Mock path provides hourly data with campaignId only.
- **No API endpoint or query** returns ad-level or ad-group-level metrics. **API does not support ad-level metrics.**

---

## PHASE 4 — Gap Map

### A) What exists

- **Engines:** Full set of ads engines (aggregation, ranking, trend, capacity, insights, projection, projection-compare, saturation, demand, efficiency-history, market-depth, bundle-impact); all pure, typed, no UI.
- **BusinessSignal:** Unified row with source, timestamp, region, hour, campaignId, adId (optional), metrics; normalizers for campaigns + hourly; source includes "onboarding" and "google-ads".
- **Projections:** ProjectionSnapshot type, in-memory store, create + compare engines; API routes for snapshot and compare.
- **Indicator-map:** Thresholds and getIndicator/getIndicatorForMetric used by workspace/dashboard UI.
- **Onboarding:** FlowViewer + flows-index (TSX), content.ts, flow-loader + /api/flows/list + /api/flows/[flowId], JSON flows under Business_Files; Onboarding-flow-router for flow decision; no BusinessSignal write.
- **Ads pipeline:** get-campaigns-data (mock + live campaign query), normalizeCampaignsToSignals, insights API using full engine pipeline; byCampaign and byHour aggregation; campaignId in signals.

### B) What partially exists

- **Ad support in signal:** adId exists on BusinessSignal but is never populated; no byAd in aggregation; no ad-level API.
- **Onboarding ↔ business layer:** BusinessSignalSource includes "onboarding" and plan docs describe integration, but no code writes onboarding outcomes to BusinessSignal or to a shared store consumed by ads.
- **Hourly data:** Implemented in aggregation and in mock data; live get-campaigns-data returns empty hourly array.
- **Flow definition:** Flows are JSON-driven via API and file discovery; screen copy is in content.ts (not JSON).

### C) What does NOT exist

- JSON-driven **ad definitions** (headlines, descriptions, images, variants, creative).
- JSON-driven **onboarding definitions** for **screen sequence / page sequence** (flow content is JSON; copy and navigation strings are in code).
- **Ad ↔ onboarding connection** (no linking of ad creative or campaign to onboarding flow or step).
- **Creative preview panel** (no component or data for ad creative preview).
- **Hour-level ad tracking** (hourly is by campaign only; no byAd or ad-level hourly).
- **Side-by-side ad comparison** (no data or UI for comparing ads).
- **onboardingFlowId** (or equivalent) in BusinessSignal or any signal store.
- **Onboarding tracking tags** (analytics/GTM/data-* or equivalent) in onboarding UI.
- **Versioning** for onboarding flows.
- **Live hourly performance** from Google Ads API (currently mock only in pipeline).

### D) What is needed to implement (reference only; no implementation here)

| Need | Notes |
|------|--------|
| **JSON-driven ad definitions** | New schema + store (e.g. under execute/ or 06_Data); headline, description, image, variant, optional campaign/adGroup mapping. |
| **JSON-driven onboarding definitions** | Extend flow JSON or add separate onboarding config (e.g. screen sequence, version, tracking id) and loader; optional content.ts replacement by JSON. |
| **Ad ↔ onboarding connection** | Link ad or campaign to flowId/stepId (e.g. in JSON or in execute layer); optional BusinessSignal extension (e.g. onboardingFlowId) for correlation. |
| **Creative preview panel** | UI component consuming ad definition JSON; no engine change. |
| **Hour-level ad tracking** | Extend get-campaigns-data (or new endpoint) to return ad-level hourly if API supports it; extend HourlyPerformanceItem with adId; aggregation byAd optional extension. |
| **Side-by-side ad comparison** | Data: byAd or ad-level metrics; UI: comparison component; optional ranking/insights by ad. |

---

## PHASE 5 — Preservation Plan (architecture only; no file changes)

### Principles

- Do **not** modify existing engines.
- Do **not** overwrite existing code.
- Add a **new layer** only; keep current pipeline intact.

### Proposed new layer: `src/05_Logic/logic/business/execute/`

- **Purpose:** Execution and definition loading only. No replacement of engines or business-signal logic.
- **Responsibilities:**
  - Load and validate **ad definitions** from JSON (and optionally onboarding definitions).
  - Expose **read-only** definitions to API/UI (e.g. for creative preview, side-by-side comparison).
  - Optional: map onboarding completion events into a **signal-like payload** that a **separate** adapter (outside engines) can turn into BusinessSignal with `source: "onboarding"` without changing engine input code.

### Folder structure (proposed)

```
src/05_Logic/logic/business/
  engines/           # UNCHANGED
  projections/      # UNCHANGED
  ui/               # UNCHANGED
  business-signal.ts # UNCHANGED
  execute/          # NEW
    index.ts
    ad-definitions.ts    # load ad JSON, types
    onboarding-definitions.ts  # optional: load onboarding config JSON
    definitions-loader.ts # discover JSON from folder (future: auto-detect business folders)
```

- **No** new files under engines/ or projections/. **No** changes to business-signal.ts in this plan.

### Data model (execute layer only)

- **Ad definition (example):** id, campaignId (optional), adGroupId (optional), headlines[], descriptions[], imageUrls[], variantLabel?, schedule (optional), stateTargeting (optional). Stored as JSON; loader returns typed array.
- **Onboarding definition (optional):** flowId, version?, screenSequence?, trackingId?. Separate from EducationFlow so flow-loader remains unchanged; execute layer can merge or expose for UI/analytics.

### Signal extension plan (non-breaking)

- **Option 1 (minimal):** Do not add fields to BusinessSignal. Onboarding and ad correlation live in execute layer or API; dashboard can merge by timestamp/campaignId in API response.
- **Option 2 (additive):** Add optional `onboardingFlowId?: string` and/or `onboardingStepId?: string` to BusinessSignal. Engines **ignore** these; aggregation/ranking/trend/capacity remain unchanged. Only new adapters (e.g. API or execute layer) set them when emitting onboarding-origin signals.
- **No** change to existing engine input/output types.

### Migration strategy

- **None required** for preservation. For future ad/onboarding features: introduce execute layer and JSON files; API routes call execute loaders and optionally inject onboarding signals into the same pipeline (e.g. merge with normalizeCampaignsToSignals output) without touching engines.

### Rollback strategy

- New code lives only under `execute/` and new API routes or UI. **Rollback = remove execute/ and new routes; revert any single optional BusinessSignal field if added.** Engines and projections remain unchanged, so no engine rollback.

### Auto-detect business folders (future-ready)

- definitions-loader can scan a configured root (e.g. `00_Projects/Business_Files` or an env path) for `**/ads/*.json` and `**/onboarding/*.json` (or similar). No manual registry edit; discovery by convention. Flow-loader already uses require.context for flows; execute can use filesystem or API-backed list.

---

## DELIVERABLE SUMMARY

- **Phase 1:** Engines, projections, business-signal, and indicator-map are present, functioning, and free of dependency cycles. No changes.
- **Phase 2:** Onboarding screens are FlowViewer + flows-index (TSX + content.ts); flows are JSON-driven via API and Business_Files. No versioning, no tracking tags, no BusinessSignal connection, no onboardingFlowId in signal layer. Flow can run in isolation.
- **Phase 3:** No ad definitions; campaignId and adId exist on BusinessSignal (adId unused). Hourly breakdown is by hour and campaign only; no byAd; API does not support ad-level metrics.
- **Phase 4:** Gap map recorded: existing, partial, and missing capabilities; needs for JSON ad/onboarding, ad–onboarding link, creative preview, hour-level ad tracking, side-by-side comparison.
- **Phase 5:** Safe preservation architecture: new `execute/` layer only; no engine edits; optional additive BusinessSignal fields; JSON definitions; auto-detect folders; clear rollback.

**No code edits, no deletions, no overwrites were made. This document is analysis and architecture only.**
