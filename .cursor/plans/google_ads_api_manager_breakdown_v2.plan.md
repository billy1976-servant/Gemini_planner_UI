---
name: ""
overview: ""
todos: []
isProject: false
---

# Google Ads API Manager — Full Breakdown v2

**Scope:** Connection between the updated Google Ads API manager (waiting for Google approval), a ready-to-run **offline** version, onboarding engines/systems integration, path to CSV-based dashboard, hour-by-hour visibility + live onboarding data, Shopify integration, and full implementation proposal.

---

## 1. Current component locations and roles

### 1.1 Google Ads API manager (live when approved)


| Component          | Location                                                                                                                                         | Role                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| API client         | [src/app/api/google-ads/client.ts](src/app/api/google-ads/client.ts)                                                                             | OAuth2 refresh, `createGoogleAdsClient()`, Customer + GAQL     |
| Diagnostics        | [src/app/api/google-ads/route.ts](src/app/api/google-ads/route.ts)                                                                               | GET: env check, no secrets                                     |
| Campaigns list     | [src/app/api/google-ads/campaigns/route.ts](src/app/api/google-ads/campaigns/route.ts)                                                           | GET: campaigns + budget + metrics                              |
| Validate (dry-run) | [src/app/api/google-ads/validate/route.ts](src/app/api/google-ads/validate/route.ts)                                                             | POST: validate_only budget/schedule                            |
| OAuth onboarding   | [src/app/api/google-auth/route.ts](src/app/api/google-auth/route.ts), [oauth2callback/route.ts](src/app/api/oauth2callback/route.ts)             | Get refresh_token (manual)                                     |
| Controller         | [src/05_Logic/logic/controllers/google-ads.controller.ts](src/05_Logic/logic/controllers/google-ads.controller.ts)                               | ScanEvent[] → AdControlState (budget/bid/schedule)             |
| Executor           | [src/05_Logic/logic/executors/google-ads.executor.ts](src/05_Logic/logic/executors/google-ads.executor.ts)                                       | Dry-run log only; live mode TODO                               |
| Control flow       | [src/05_Logic/logic/controllers/control-flow.ts](src/05_Logic/logic/controllers/control-flow.ts)                                                 | runControlFlow: scan → controller → executor                   |
| Scan provider      | [src/07_Dev_Tools/scans/global-scans/providers/google-ads.provider.ts](src/07_Dev_Tools/scans/global-scans/providers/google-ads.provider.ts)     | Placeholder ScanEvent when configured                          |
| Dashboard UI       | [src/01_App/(dead) Tsx/tsx-screens/google-ads/google-ads-dashboard.tsx](src/01_App/(dead)%20Tsx/tsx-screens/google-ads/google-ads-dashboard.tsx) | Campaigns, control state, Validate button; **not in live app** |


**Missing today:** Apply/mutate route, executor live mode, real Ads → ScanEvent mapping, dashboard in live shell, env-based OAuth redirect, bid mutation in API.

### 1.2 Onboarding engines and systems


| Component              | Location                                                                                                             | Role                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| FlowViewer             | [src/01_App/(live) Business/onboarding/FlowViewer.tsx](src/01_App/(live)%20Business/onboarding/FlowViewer.tsx)       | Canonical onboarding UI; flow + engine selectors, EducationCard                                                        |
| flows-index            | [src/01_App/(live) Business/onboarding/flows-index.tsx](src/01_App/(live)%20Business/onboarding/flows-index.tsx)     | Entry to flows; content from [content.ts](src/01_App/(live)%20Business/onboarding/content.ts)                          |
| Flow loader            | [src/05_Logic/logic/flows/flow-loader.ts](src/05_Logic/logic/flows/flow-loader.ts)                                   | loadFlow, getAvailableFlows, setEngineFlow                                                                             |
| Onboarding flow router | [src/05_Logic/logic/engines/Onboarding-flow-router.tsx](src/05_Logic/logic/engines/Onboarding-flow-router.tsx)       | resolveOnboardingFlow(context), resolveOnboardingFromAnswers(answers); uses 25x engine for intentScore                 |
| Flow router (step)     | [src/05_Logic/logic/engines/flow-router.ts](src/05_Logic/logic/engines/flow-router.ts)                               | resolveNextStep: signals/blockers/opportunities → next step; linear or rule-based                                      |
| Engine registry        | [src/05_Logic/logic/engine-system/engine-registry.ts](src/05_Logic/logic/engine-system/engine-registry.ts)           | Execution: learning, calculator, abc; Aftermath: decision, summary                                                     |
| EducationCard          | [src/04_Presentation/ui/molecules/cards/EducationCard.tsx](src/04_Presentation/ui/molecules/cards/EducationCard.tsx) | Renders steps; handleChoice → outcomes (stepId, choiceId, outcome: signals/blockers/opportunities); feeds engine-state |
| Engine state           | [src/05_Logic/logic/runtime/engine-state.ts](src/05_Logic/logic/runtime/engine-state.ts)                             | deriveEngineState(flow, presentation, stepIndex, outcomes, calcOutputs); accumulatedSignals/Blockers/Opportunities     |
| Engine bridge          | [src/05_Logic/logic/runtime/engine-bridge.ts](src/05_Logic/logic/runtime/engine-bridge.ts)                           | readEngineState, subscribeEngineState (ENGINE_STATE_KEY)                                                               |
| Behavior listener      | [src/03_Runtime/engine/core/behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts)                   | input-change → state.update; navigate; no direct “click” analytics (clicks are choice events in EducationCard)         |
| Experience visibility  | [src/03_Runtime/engine/core/experience-visibility.ts](src/03_Runtime/engine/core/experience-visibility.ts)           | Config-driven: renderAll, dashboard, step, maxDepth; per-experience strategy                                           |


**Current integration with Google Ads:** None. Onboarding does not call Google Ads APIs, does not push outcomes to the control flow, and does not appear in the Google Ads dashboard. Scans (and thus Google Ads placeholder) are written via `scan.interpreted` into `state.scans` and consumed by the dashboard when it reads `getState().scans` filtered by `source === "google-ads"`.

### 1.3 State and scans


| Piece              | Location                                                                                             | Role                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| State store        | [src/03_Runtime/state/state-store.ts](src/03_Runtime/state/state-store.ts)                           | getState, subscribeState, dispatchState(intent, payload)                                                         |
| State resolver     | [src/03_Runtime/state/state-resolver.ts](src/03_Runtime/state/state-resolver.ts)                     | deriveState(log): scans from scan.result / scan.interpreted / scan.record / scan.batch; values from state.update |
| Global scan bridge | [src/03_Runtime/state/global-scan.state-bridge.ts](src/03_Runtime/state/global-scan.state-bridge.ts) | executeGlobalScan → runGlobalScan → analyzeScan → dispatchState("scan.interpreted", payload)                     |


So: **onboarding “tracks” choices** as outcomes (signals/blockers/opportunities) in engine state and in EducationCard local state; it does **not** today write those into `state.scans` or a dedicated “onboarding events” store that the Google Ads controller could consume.

### 1.4 Shopify Intelligence


| Component  | Location                                                                                                                                                                              | Role                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Types      | [src/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/types.ts](src/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/types.ts)                  | ShopifySignal (totalRevenue, revenueVelocity, topSKUs), ShopifyControlState (healthScore, trend, suggestedAction) |
| Provider   | [src/00_Projects/.../Shopify_Intelligence/provider/shopify.provider.ts](src/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/provider/shopify.provider.ts)         | fetchShopifySignal (last 30 days orders)                                                                          |
| Controller | [src/00_Projects/.../Shopify_Intelligence/controller/shopify.controller.ts](src/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/controller/shopify.controller.ts) | computeShopifyControlState(signal)                                                                                |
| Executor   | [src/00_Projects/.../Shopify_Intelligence/executor/shopify.executor.ts](src/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/executor/shopify.executor.ts)         | executeShopifyControlState (dry-run)                                                                              |
| API        | [src/app/api/shopify-intelligence/route.ts](src/app/api/shopify-intelligence/route.ts)                                                                                                | Fetches signal, computes control state, runs executor                                                             |
| UI         | [src/01_App/(live) Business/shopify/Shopify_Intelligence.tsx](src/01_App/(live)%20Business/shopify/Shopify_Intelligence.tsx)                                                          | Displays signal + control state                                                                                   |


**Gap:** Shopify signal/control state are not fed into the Google Ads controller or dashboard. No shared “business metrics” layer that merges Shopify + onboarding + Google Ads.

---

## 2. Connection: API manager (pending approval) vs offline-ready version

- **Online (when approved):** Existing routes and client use live Google Ads API: diagnostics, campaigns list, validate. Control loop runs with placeholder (or future real) scan events; executor remains dry-run until an apply route exists.
- **Offline-ready version:** Means the app can still be useful without API approval:
  - **CSV as data source:** Upload Google Ads reports (e.g. hourly/daily campaign/keyword stats). Parse columns, infer metrics (impressions, clicks, cost, conversions), apply same visibility and aggregation rules as the future live pipeline.
  - **Same control stack:** Controller and control flow consume a unified “scan-like” input (from CSV or from API). So offline = CSV → parsed rows → normalized “ScanEvent”-like structures → same controller → suggestions only (no apply).
  - **Dashboard:** Works in two modes: (1) **Manual/offline:** CSV upload, column mapping, visibility constraints, suggestions and A/B cutoff recommendations. (2) **Live (when API approved):** Same UI + live campaigns fetch + validate + optional apply.

So the “connection” is: **one data abstraction** (e.g. `AdSignal` or enriched `ScanEvent`) produced either by CSV parsing (offline) or by Google Ads API (online). Same controller, same dashboard, different data source.

---

## 3. Onboarding engines and integration with Google Ads manager

### 3.1 How onboarding “tracks” and morphs beyond simple if/then

- **Choice = click in context:** In [EducationCard](src/04_Presentation/ui/molecules/cards/EducationCard.tsx), each step has choices. `handleChoice(choiceId)` records an outcome: `stepId`, `choiceId`, `choice.outcome` (signals, blockers, opportunities, severity). These accumulate in `outcomes` and are passed to `resolveNextStep` and `deriveEngineState`.
- **Flow router is rule-based but stateful:** [flow-router.ts](src/05_Logic/logic/engines/flow-router.ts) uses `RoutingRule`: `when: { signals, blockers, opportunities }` → `then: skip | goto | repeat`. So next step depends on **accumulated** signals/blockers/opportunities, not a single if/then. That’s already “morphing” direction (skip, goto, repeat) from many small decisions.
- **25x and onboarding flow router:** [Onboarding-flow-router.tsx](src/05_Logic/logic/engines/Onboarding-flow-router.tsx) uses `run25X({}, answers)` to get `intentScore` and `wantsPricing`, then picks flow: pricing-jump, education, or calculator-1. So high-level path is driven by aggregated answers, not one question.
- **Engine state is the “live” output:** `EngineState` (step order, completed steps, accumulatedSignals/Blockers/Opportunities, exportSlices) is the structured result of the session. It’s available via `readEngineState()` / `subscribeEngineState()` but is **not** currently:
  - Written into `state.scans` or a dedicated store for “onboarding events,” or
  - Fed into the Google Ads controller as an input.

So onboarding already supports **direction beyond simple if/then** (signals/blockers/opportunities, routing rules, 25x intent). To integrate with the Google Ads manager you need a **bridge**: map EngineState (and optionally raw outcomes) into a format the Ads controller or a new “unified business signal” layer can consume (e.g. “intent up,” “pricing interest,” “blocker: budget”) and optionally merge with scan events.

### 3.2 Proposed integration points

- **Option A — EngineState → state.scans (onboarding events):** On flow complete (or on each step), dispatch `scan.interpreted` (or a new intent like `onboarding.outcome`) with a payload that includes flowId, stepId, choiceId, signals, blockers, opportunities, timestamp. Resolver appends to `scans` (or a dedicated `onboardingScans`). Google Ads dashboard and controller can then filter `source === "onboarding"` and combine with `source === "google-ads"` in the same control flow.
- **Option B — Unified “business signal” store:** New intent e.g. `business.signal` with payload `{ source: "onboarding" | "shopify" | "google-ads", ... }.` Controller input type extended to accept `businessSignals[]` in addition to `scanEvents[]`. Onboarding and Shopify write there; Google Ads controller reads all.
- **Option C — Direct engine-state reader in control flow:** `runControlFlow` accepts optional `onboardingState: EngineState | null`. Controller maps it to a synthetic score/momentum/trend (e.g. from severity and opportunities) and merges with scan events. No new state intent; tighter coupling to engine-state shape.

Recommendation: **Option A or B** so that onboarding (and later Shopify) are first-class signal sources in the same pipeline as Google Ads, with one place (state or a small adapter) defining the schema.

---

## 4. Path: Google Ads dashboard v2 — CSV upload, column analysis, visibility, suggestions

### 4.1 CSV upload and column analysis

- **New API route:** e.g. `POST /api/google-ads/upload-csv` (or `/api/google-ads/import/csv`). Accept multipart file or base64 body. Parse CSV (e.g. Papa Parse or Node `csv-parse`).
- **Column detection:** First row = headers. Map known names (case-insensitive) to canonical fields, e.g.:
  - Campaign ID, Campaign name, Hour, Day, Impressions, Clicks, Cost, Conversions, CTR, CPC, etc.
- **Visibility constraints:** Same concept as [experience-visibility.ts](src/03_Runtime/engine/core/experience-visibility.ts): config-driven rules for which dimensions to “show” or aggregate. For ads CSV:
  - **Time:** Support hour-level granularity (column “Hour” or “Date + Hour”). If present, enable “hour-by-hour” visibility; otherwise daily.
  - **Entity:** Campaign, Ad group, Keyword (or custom). Constraint: e.g. “only show campaign-level” or “show keyword but collapse by ad group.”
- **Output:** Normalized rows (e.g. `{ campaignId, campaignName, timeKey, impressions, clicks, cost, conversions, ... }`) and a **column report** (which columns were found, which were used, which are missing). Store in memory or short-lived store (or user session) for the dashboard to consume.

### 4.2 Visibility constraints (reuse pattern)

- **Config:** e.g. `google-ads-visibility.json` or a slice in existing config: strategies like “byCampaign,” “byHour,” “byAdGroup,” “maxDepth: 2.” Dashboard and CSV parser both read it. Rows are filtered/aggregated according to this so the UI and suggestions respect the same visibility (e.g. hour-by-hour when data has an hour column).
- **Hour-by-hour:** If CSV (or later API) has hourly data, store `timeKey` as date+hour (e.g. `2026-02-23T14`) and expose it in the dashboard. “Hour-by-hour visibility from Google” = this dimension available and configurable (show/hide, default on for CSV hourly reports).

### 4.3 Suggestions from current and proposed engines

- **Current engines that can drive suggestions:**
  - **google-ads.controller:** Already outputs budget/bid/schedule recommendations and reasons from score/momentum/trend. Use the same logic on CSV-derived “scan” events (each row or aggregated window → a ScanEvent-like object).
  - **decision / summary (aftermath):** Operate on EngineState. If EngineState is fed into the same pipeline (Option A/B above), they could contribute “decision” and “summary” text for the dashboard (e.g. “Recommendation: increase budget; reason: …”).
- **Proposed engines for CSV + A/B and cutoff:**
  - **Stats/aggregation engine:** Input = normalized CSV rows. Output = per-campaign (or per-ad-group) aggregates by time window, plus variance and sample size. Used to suggest “enough data for A/B decision.”
  - **A/B cutoff engine:** Input = two series (e.g. variant A vs B by hour). Output = suggested cutoff (e.g. “after 48 hours, variant B is ahead with 95% confidence”) and a short recommendation (continue/pause/declare winner). This “dictates” the ad manager’s decision in a structured way.
  - **Suggestion formatter engine:** Input = raw controller output + A/B cutoff result + visibility config. Output = human-readable suggestions and optional “apply” checklist (when API is connected).

So the **path** is: CSV upload → parse → column report + normalized rows → visibility config → aggregation (with hour if present) → feed into controller (as ScanEvent-like stream) → current controller + new A/B/cutoff engines → suggestion output. Dashboard shows tables, charts (hour-by-hour when available), and a “Suggestions” panel (and later “Apply” when API is live).

---

## 5. Final system: hour-by-hour visibility + live onboarding data

- **Hour-by-hour from Google:** From CSV today (hour column); from API when approved (e.g. segment by hour in GAQL or use reporting that returns hourly buckets). Single “time series” model: `timeKey` (e.g. date+hour), dimensions (campaign, ad group, keyword), metrics (impressions, clicks, cost, conversions). Visibility config controls which dimensions and granularity are shown.
- **Live data from onboarding:** Implement Option A or B above so that each meaningful outcome (or flow completion) is written as a business signal with timestamp. Dashboard can show:
  - “Onboarding events” timeline (e.g. “Flow X completed at 14:32; signals: [pricing-interest]”).
  - Merged view: Google Ads time series (hour-by-hour) + onboarding events over the same time axis. That gives “meaningful data” by correlating ad spend/performance with user journey events (e.g. more conversions after “pricing jump” flow).
- **Unified store:** Either extend `state.scans` with `source: "onboarding"` and a standard shape, or introduce `businessSignals` and have the dashboard and controller read from one place.

---

## 6. Shopify business: immediate implementation and live data → meaningful data with Google Ads

- **Already there:** Shopify Intelligence (signal + control state) is live; it can run in the same app as onboarding and (when wired) Google Ads.
- **Immediate implementation:** Add a **unified business API** or extend state so that:
  - Shopify Intelligence page (or a background job) dispatches `business.signal` (or `scan.interpreted` with `source: "shopify"`) with `totalRevenue`, `revenueVelocity`, `healthScore`, `trend`, `suggestedAction`, timestamp.
  - Same payload is stored and exposed to the Google Ads dashboard and controller.
- **Meaningful data with Google Ads:** Controller (or a new “unified controller”) can take:
  - **Google Ads:** scan events (from API or CSV) — performance by time/campaign.
  - **Shopify:** revenue and velocity — outcome of ads + site.
  - **Onboarding:** signals/blockers/opportunities — intent and friction.
  Logic: e.g. “If Shopify trend up and onboarding signals show pricing interest, recommend increase ads; if Shopify trend down and blockers include budget, recommend reduce or pause.” So live Shopify + onboarding data translate into **recommendations** that align with Google Ads levers (budget, bid, schedule). When API is connected, the same recommendations can drive apply (with user confirmation or automation rules).

---

## 7. Dashboard: suggest cutoff, A/B scenarios, dictate decisions, control when API connected

- **Suggest cutoff per ad / A/B:** Implement the **A/B cutoff engine** above: input = time series for two variants (e.g. two ad creatives or two campaigns). Output = “run for at least X hours,” “current leader,” “suggested action: declare winner / continue / pause losing variant.” Dashboard shows this per experiment.
- **Dictate ad manager decisions:** Dashboard shows a **Decision panel:** “Recommended actions” (from controller + A/B engine): e.g. “Pause campaign X,” “Increase budget for Y by 10%,” “Declare variant B winner.” When API is **not** connected: copy-paste or manual apply in Google Ads UI. When API **is** connected: “Apply” button that calls the new apply route (with confirmations).
- **When connected, control actual ads:** Add `POST /api/google-ads/apply` that takes the same `AdControlState` (or a minimal mutation list), calls `customer.mutateResources(operations)` **without** `validate_only`, and returns success/errors. Executor’s live branch calls this (or the dashboard calls apply after user confirms). So: same dashboard, same suggestions; offline = suggestions only; online = suggest + validate + apply.

---

## 8. Strengths and weaknesses

### 8.1 Strengths

- **Clear separation:** Controller (pure), executor (dry-run/live), API routes (diagnostics, campaigns, validate). Easy to add CSV path and apply route without breaking existing flow.
- **Onboarding is rich:** Outcomes (signals/blockers/opportunities), flow router rules, 25x intent. Ready to be exposed as a signal source.
- **Shopify pattern exists:** Provider → controller → executor; same pattern as Google Ads. Unification is mostly wiring and one shared “business signal” shape.
- **State and scans:** Already support multiple intents (scan.interpreted, etc.); extending to onboarding/Shopify is consistent.
- **Visibility:** Experience-visibility is config-driven; same idea applies to ads CSV (time, entity, depth).

### 8.2 Weaknesses

- **No apply route:** Cannot change ads from the app yet.
- **Executor live mode:** Not implemented.
- **Google Ads dashboard in (dead) Tsx:** Not in live app shell; no navigation from onboarding or main app.
- **Onboarding not wired to Ads:** Outcomes and engine state are not pushed into any store the Ads controller reads.
- **Shopify and Ads separate:** No shared “business signal” or unified control input.
- **No CSV path:** No upload, column mapping, or offline data source.
- **No A/B or cutoff logic:** Suggestions are only from the current controller (score/momentum/trend); no experiment-level cutoff or “declare winner.”
- **OAuth redirect:** Hardcoded localhost; not production-ready.

---

## 9. Proposal: update all parts for manual control + automation with onboarding

### 9.1 Offline / CSV (immediate manual control)

1. **CSV import API:** `POST /api/google-ads/import/csv` — parse CSV, detect columns, return column report + normalized rows (with optional hour). Optional: persist in session or in-memory store keyed by session.
2. **Visibility config:** Add `google-ads-visibility.json` (or section in config): time granularity (hour/day), entity level (campaign/ad group/keyword), max depth. Parser and dashboard both use it.
3. **Dashboard (live app):** Move or clone [google-ads-dashboard.tsx](src/01_App/(dead)%20Tsx/tsx-screens/google-ads/google-ads-dashboard.tsx) into a live route (e.g. under `(live) Business` or a dedicated `/google-ads`). Add:
  - **CSV upload:** File input → call import API → show column report and “Use this data” to load into dashboard state.
  - **Tables/charts:** Campaign (and optional ad group/keyword) by time; when hour column exists, show hour-by-hour.
  - **Suggestions panel:** From controller fed by CSV-derived events (and later onboarding/Shopify). Show budget/bid/schedule recommendations and reasons.
4. **A/B cutoff engine (new):** Input: two time series + optional confidence threshold. Output: suggested cutoff time, leader, action. Wire into dashboard for “A/B experiments” section.

### 9.2 Onboarding integration

1. **Bridge onboarding → signals:** On step completion or flow complete, dispatch a business signal (e.g. `scan.interpreted` with `source: "onboarding"` and payload: flowId, stepId, choiceId, signals, blockers, opportunities, timestamp). Resolver appends to `scans` or to a dedicated `businessSignals` array (new intent + resolver branch).
2. **Controller input:** Extend `ControlDecisionInput` (or add a second input type) to accept “onboarding events” or “business signals.” Controller merges them with `source === "google-ads"` events (e.g. map onboarding signals to a synthetic score/trend) so recommendations can respond to both ad metrics and journey.
3. **Dashboard:** Show “Onboarding” feed or timeline next to Google Ads data (same time axis when timestamps available).

### 9.3 Shopify + Google Ads

1. **Unified business signal:** Define a minimal `BusinessSignal` type (source, timestamp, metrics: revenue/velocity/health/trend for Shopify; score/momentum/trend for onboarding; same for Ads). Shopify Intelligence (and any cron or post-load hook) dispatches this; onboarding bridge does too; Google Ads provider (or CSV path) produces it.
2. **Unified controller (optional):** One controller that takes `BusinessSignal[]` and outputs both “Shopify suggested action” and “Google Ads control state,” or keep separate controllers and a small “aggregator” that merges recommendations for the dashboard.
3. **Dashboard:** One place to see Shopify health, onboarding events, and Google Ads suggestions (and apply when API connected).

### 9.4 When API is approved (automation)

1. **Apply route:** `POST /api/google-ads/apply` — body: AdControlState or list of mutations; call `mutateResources` without validate_only; return result.
2. **Executor live mode:** In `executeAdControlState(..., false)`, call apply API (or inlined mutate). Add safety: e.g. require a “live” flag and/or user confirmation token.
3. **OAuth redirect:** Read redirect_uri from env (e.g. `GOOGLE_ADS_REDIRECT_URI`) with fallback to localhost for dev.
4. **Real Ads → ScanEvent:** Replace placeholder in google-ads.provider with real GAQL (e.g. campaign performance by day/hour) and map to ScanEvent (score, momentum, trend) so control loop runs on live data.

### 9.5 Suggested engine list (current + proposed)

- **Current:** google-ads (controller), learning, calculator, abc, decision, summary, onboarding-flow-router, flow-router, 25x.
- **Proposed for dashboard/CSV:**  
  - **csv-parser:** CSV → normalized rows + column report.  
  - **ads-aggregation:** Rows + visibility config → time series (hour/day, by campaign/ad group).  
  - **ab-cutoff:** Two series + confidence → cutoff suggestion, leader, action.  
  - **suggestion-formatter:** Controller + A/B output → human-readable suggestions and apply checklist.
- **Proposed for unification:**  
  - **business-signal-adapter:** EngineState / Shopify response → BusinessSignal.  
  - **unified-controller (optional):** BusinessSignal[] → combined recommendations for Ads + Shopify.

---

## 10. Summary

- **Connection API vs offline:** One data abstraction (ScanEvent-like or BusinessSignal) from either CSV (offline) or Google Ads API (online); same controller and dashboard.
- **Onboarding:** Already tracks choices as outcomes (signals/blockers/opportunities) and routes by rules; it does not yet push these into a store the Ads manager reads. Bridge via new intent and resolver (and optional adapter) so onboarding becomes a first-class signal source.
- **Path for dashboard:** CSV upload → column analysis + visibility constraints → normalized rows (hour-by-hour when column present) → controller + new A/B/cutoff engines → suggestions; when API connected, add apply and live executor.
- **Shopify:** Implement unified business signal and wire Shopify Intelligence into the same state/API so live revenue/velocity/health drive recommendations alongside Ads and onboarding; dashboard shows one view.
- **Final system:** Hour-by-hour visibility from Google (CSV now, API later) + live onboarding (and Shopify) data in one place, with suggestions that dictate ad manager decisions and, when connected, control the actual ads via apply route and executor live mode.

