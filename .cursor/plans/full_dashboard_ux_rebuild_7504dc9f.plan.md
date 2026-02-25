---
name: Full Dashboard UX Rebuild
overview: Upgrade the Workspace dashboard into a high-end analytics cockpit with an 8-item left nav, expansion panels, Recharts-based charts, narrative flow, and full API feature visibility—without modifying any engine logic, projection math, or projection-store.
todos: []
isProject: false
---

# Full Dashboard UX Rebuild (No Engine Changes)

## Phase 1 — System Discovery (Documentation Only)

### 1.1 Feature Visibility Map


| Route                                        | File                                                                                                                                                        | Return shape                                                                                                                                                                                                                                            | Exposed in UI today                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **GET /api/google-ads/insights**             | [src/app/api/google-ads/insights/route.ts](src/app/api/google-ads/insights/route.ts)                                                                        | `noData`, `executiveSummary`, `highlights`, `ranking`, `trends`, `capacity`, `recommendations`, `growthOpportunities`, `projectionConfidenceScore`, `saturation`, `demand`, `efficiencyHistory`, `marketDepth`, `bundleImpact`. Optional `?businessId`. | Yes — DashboardTab                                 |
| **GET /api/google-ads/projection-snapshots** | [src/app/api/google-ads/projection-snapshots/route.ts](src/app/api/google-ads/projection-snapshots/route.ts)                                                | `{ snapshots: ProjectionSnapshotWithMeta[] }`. No businessId (global store).                                                                                                                                                                            | Yes — ProjectionsTab                               |
| **GET /api/google-ads/projection-compare**   | [src/app/api/google-ads/projection-compare/route.ts](src/app/api/google-ads/projection-compare/route.ts)                                                    | `{ projectionId, comparison: { varianceROAS, varianceCPA, accuracyScore, adjustmentRecommendation } }`. Query `?id=snapshotId`. Uses getCampaignsData (Google only).                                                                                    | **No** — not in Workspace                          |
| **GET /api/reports/google-ads-summary**      | [src/app/api/reports/google-ads-summary/route.ts](src/app/api/reports/google-ads-summary/route.ts)                                                          | HTML document (inline; print-to-PDF via browser). Uses getCampaignsData only (no businessId).                                                                                                                                                           | No — legacy dashboard has "Generate PDF" link only |
| **POST /api/business/csv/ingest**            | [src/app/api/business/csv/ingest/route.ts](src/app/api/business/csv/ingest/route.ts)                                                                        | `{ ok, rowCount }`. Body: `{ csv, businessId }`.                                                                                                                                                                                                        | Yes — DataTab                                      |
| **POST /api/google-ads/projection-snapshot** | [src/app/api/google-ads/projection-snapshot/route.ts](src/app/api/google-ads/projection-snapshot/route.ts)                                                  | `{ ok, snapshot }`. Creates snapshot from current Google Ads data.                                                                                                                                                                                      | **No** — not in Workspace                          |
| **Business registry**                        | No API. Client uses [src/05_Logic/logic/business/business-model.ts](src/05_Logic/logic/business/business-model.ts) `listBusinesses()`, `getBusinessById()`. | N/A                                                                                                                                                                                                                                                     | Yes — Workspace header dropdown                    |


### 1.2 Workspace UI Components (Current)

- **[WorkspaceLayout.tsx](src/01_App/(live) Business/workspace/WorkspaceLayout.tsx)** — Shell: header (business dropdown, Clarity Mode), collapsible icon sidebar (3 items), main content.
- **DashboardTab.tsx** — KPI tile grid (Revenue, Spend, ROAS, CPA, Projection confidence, Growth headroom, Top state, Top hour), Health badge, collapsible Details / Recommendations / Trend Breakdown, empty state.
- **DataTab.tsx** — Source type, CSV upload, Refresh button.
- **ProjectionsTab.tsx** — Snapshot list (ROAS, budget, date; accuracy/adjustment shown as "—"), simple bar chart of projected ROAS over time.

No hidden or unreachable screens beyond the legacy [(dead) Tsx google-ads-dashboard](src/01_App/(dead) Tsx/tsx-screens/google-ads/google-ads-dashboard.tsx) (linked from Workspace).

### 1.3 Functionality Not Reachable from Workspace Nav

- **Projection compare** — GET `/api/google-ads/projection-compare?id=...` (accuracyScore, adjustmentRecommendation) is never called from UI.
- **HTML/PDF report** — GET `/api/reports/google-ads-summary` is only linked from legacy dashboard; no Reports entry in Workspace.
- **Create projection snapshot** — POST `/api/google-ads/projection-snapshot` has no UI trigger in Workspace.

---

## Phase 2 — Navigation and Structure Upgrade

- **Replace** the current 3-tab sidebar with an **8-item left nav**: Overview | Performance | Growth | Recommendations | Projections | Reports | Data | Settings.
- **Top bar**: Keep Business dropdown and Clarity Mode toggle; **add** Date Range selector (UI-only state for now; no API wiring).
- **Routing**: Single main content area; nav item selects which "view" (Overview = combined dashboard flow; Performance / Growth / etc. can map to sections or dedicated panels). Ensure:
  - **Reports** view exposes "Open HTML Report" and "Print to PDF" (open report in new tab; user prints to PDF).
  - **Projections** view exposes snapshot list + compare selector (call projection-compare when user picks a snapshot).
  - **Settings** can be a placeholder (e.g. "Date range and preferences — coming soon").

**Files to change**: [WorkspaceLayout.tsx](src/01_App/(live) Business/workspace/WorkspaceLayout.tsx) (nav items, top bar date range, view routing). No engine or projection-store changes.

---

## Phase 3 — Remove KPI Tile Grid; Structured Expansion Sections

- **Delete** the current Revenue/Spend/ROAS/CPA tile grid and the ad-hoc collapsible blocks in [DashboardTab.tsx](src/01_App/(live) Business/workspace/DashboardTab.tsx).
- **Replace** with seven structured sections, each an **expandable panel** (see Phase 5):


| Section                  | Collapsed summary                                     | Expanded content                                                                                                                                   |
| ------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Business Health**   | Health status, Projection confidence, Growth headroom | Mini ROAS-over-time (from projection snapshots or efficiency context), Trend breakdown, "Why this status", Contributing signals (from insights)    |
| **2. Performance Flow**  | Revenue trend arrow, Spend trend arrow                | Revenue vs Spend (chart), ROAS trend, CPA trend, Conversion trend (all from insights + trend)                                                      |
| **3. Market Insights**   | Top state, Top hour                                   | Ranked state table, Ranked hour table, Efficiency indicators, Trend arrows via [indicator-map.ts](src/05_Logic/logic/business/ui/indicator-map.ts) |
| **4. Growth & Capacity** | Safe budget, Aggressive budget                        | Headroom visualization, Saturation/demand explanation, Capacity model summary (from insights capacity, saturation, demand)                         |
| **5. Recommendations**   | "X opportunities detected"                            | Full recommendation list, Expected impact, Risk level, Confidence (from insights recommendations)                                                  |
| **6. Projections**       | Snapshot count                                        | Snapshot list, Accuracy chart (from projection-compare per snapshot), Variance over time, Compare snapshot selector                                |
| **7. Reports**           | "Generate report"                                     | Button: Open HTML Report, Button: Print to PDF, Optional snapshot-based report selector                                                            |


Data source for all: **GET /api/google-ads/insights** (and projection-snapshots / projection-compare where noted). No new aggregation or engine logic in UI.

---

## Phase 4 — Chart Implementation

- **Add** a lightweight chart library: **Recharts** (recommended; add dependency in [package.json](package.json)).
- **Charts to implement** (data from existing APIs only):
  - **ROAS over time** — X: snapshot date (createdAt), Y: projectedROAS (from GET projection-snapshots).
  - **Revenue vs Spend** — Single-period comparison (e.g. bar or line with two points from insights executiveSummary).
  - **CPA trend** — Single value + trend arrow from insights; or line with current + previous if API exposed (currently trend is period-over-period delta; can show one bar + arrow).
  - **Projection variance over time** — For each snapshot, call GET projection-compare?id=... (or batch if added); plot accuracyScore or varianceROAS/varianceCPA over snapshot date.
  - **Optional**: Headroom gauge — single value from demand.scalingHeadroomPercent / marketDepth, simple SVG or Recharts radial.
- **Chart style**: Minimal, white background, subtle gridlines, no business math in UI (all values from API).

**New file**: e.g. `workspace/charts/` with small components (RoasOverTimeChart, RevenueVsSpendChart, etc.) that accept props from parent (insights or snapshots response).

---

## Phase 5 — Expansion Panel System

- **Implement** a reusable **Accordion** component:
  - Smooth expand/collapse (CSS transition or React state).
  - Allow **multiple panels open** at once.
  - **"Expand All" / "Collapse All"** button in top-right of dashboard/content area.
  - Optional **"Show Advanced Signals"** toggle inside each section to reveal deeper metrics (e.g. efficiencyHistory, saturation detail, marketDepth fields).

**New file**: e.g. [workspace/Accordion.tsx](src/01_App/(live) Business/workspace/Accordion.tsx) (or Accordion.tsx + AccordionSection.tsx), used by the single dashboard/overview content component that renders sections 1–7.

---

## Phase 6 — Visual Design Upgrade

- **Apply**:
  - Soft shadow cards for each section.
  - Consistent section spacing (e.g. 1–1.5rem gap).
  - Strong typographic hierarchy (section titles, labels, values).
  - Subtle gradient header for Business Health section.
  - All colors/arrows from [indicator-map.ts](src/05_Logic/logic/business/ui/indicator-map.ts) mapped to CSS classes in [workspace-indicators.module.css](src/01_App/(live) Business/workspace/workspace-indicators.module.css); **no inline red/green** or conditional color logic in JSX.
- **Remove** the boxed KPI tile look entirely.
- **Target feel**: Stripe Dashboard + Plausible Analytics + Linear (clean, minimal, professional).

**Files**: [WorkspaceLayout.module.css](src/01_App/(live) Business/workspace/WorkspaceLayout.module.css), new section/chart CSS, possibly a shared workspace theme file.

---

## Phase 7 — Empty State Handling

- When **noData === true** (from GET insights):
  - Show a **centered panel** with message: "Upload data or connect Google Ads to begin analysis."
  - Include a **button** that links to or switches to the **Data** tab/view.
- Reuse or extend current empty state in DashboardTab/Overview; ensure it appears when the selected business has no data.

---

## Phase 8 — Multi-Business Readiness

- **Business selector**: Already exists in [WorkspaceLayout.tsx](src/01_App/(live) Business/workspace/WorkspaceLayout.tsx); keep and ensure it remains prominent in top bar.
- **businessId in APIs**: Insights already accepts `?businessId`. **Optional API surfacing (no engine change)**:
  - **Reports**: Add optional `?businessId` to GET [reports/google-ads-summary/route.ts](src/app/api/reports/google-ads-summary/route.ts); when businessId is CSV, derive signals from CSV store and run same report pipeline (reuse same pattern as insights route).
  - **projection-compare / projection-snapshots**: Currently global (no businessId). Leave as-is unless product requests per-business snapshots; if needed later, only route/store wiring, no projection math change.
- **UI**: Pass `businessId` into all views that fetch insights or reports; refetch when business changes (already done for DashboardTab).

---

## Deliverables Summary

1. **Feature Visibility Map** — Markdown table above (Phase 1.1); can be saved as `docs/FEATURE_VISIBILITY_MAP.md` or similar.
2. **Before/After structure**:
  - **Before**: 3 tabs (Dashboard, Data, Projections); KPI tile grid; simple collapsibles; no Reports/Compare in nav; no date range.
  - **After**: 8-item left nav (Overview, Performance, Growth, Recommendations, Projections, Reports, Data, Settings); top bar with Business, Clarity Mode, Date Range; 7 expansion sections with charts and narrative; Accordion with Expand/Collapse All; Reports and Projection Compare reachable.
3. **New components** (suggested list):
  - `Accordion.tsx` (reusable expansion panel)
  - `WorkspaceNav.tsx` (optional: extract 8-item nav)
  - Chart components: `RoasOverTimeChart`, `RevenueVsSpendChart`, `CpaTrendChart`, `ProjectionVarianceChart`, optional `HeadroomGauge`
  - Section components: `BusinessHealthSection`, `PerformanceFlowSection`, `MarketInsightsSection`, `GrowthCapacitySection`, `RecommendationsSection`, `ProjectionsSection`, `ReportsSection`
  - `EmptyStatePanel.tsx` (centered, with Data tab link)
4. **Confirmation**: No changes under `src/05_Logic/logic/business/engines/`. No changes to projection-store or projection math. All new logic is UI and API surfacing (optional report/projection-compare businessId and report HTML by business).

---

## Implementation Order

1. Phase 1 — Document only (no code).
2. Phase 5 — Build Accordion and section shell (so Phase 3 content can sit inside).
3. Phase 2 — Update WorkspaceLayout nav and top bar.
4. Phase 3 — Replace dashboard content with seven sections (data from insights; placeholders for charts).
5. Phase 4 — Add Recharts and implement charts; plug into sections.
6. Phase 6 — Apply visual design (CSS, indicator classes, gradients, shadows).
7. Phase 7 — Empty state panel with Data link.
8. Phase 8 — Verify businessId flow; optionally add businessId to report route.

