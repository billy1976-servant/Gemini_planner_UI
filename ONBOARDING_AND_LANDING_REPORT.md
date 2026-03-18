# Onboarding & Landing System Report — Google Ads Readiness

**Date:** Feb 26, 2025  
**Purpose:** Assess current onboarding/landing state, gaps, and how to finalize the landing system for your Google Ad campaign.

---

## 1. Executive Summary

| Area | Status | Notes |
|------|--------|------|
| **Onboarding flow logic** | ✅ Working | Flow router (calculator-1 → education-flow → pricing-jump-flow) + 25× intent scoring |
| **Landing content** | ✅ Exists | `construction-cleanup` (questions, calculator, CTA) in logic/content |
| **Landing on production** | ❌ Not wired | Root `/` always shows HiClarifyOnboarding; `resolveLandingPage()` is only used on `/dev` |
| **Dedicated landing URL** | ❌ Missing | No `/landing` (or similar) route; sample ad uses `finalUrl: https://example.com/landing` |
| **Ad → flow connection** | ❌ Not connected | `onboardingFlowId` in ads is only used to open FlowViewer on `/dev`, not for landing |
| **UTM / campaign params** | ❌ Not used | No reading of `utm_*` or `flow=` to choose landing flow |

**Bottom line:** Logic and content for a flow-based landing exist, but production traffic (including ad clicks) never sees them. To run the campaign you need to either wire the root page to the landing resolver or add a dedicated landing route and point ad final URLs there.

---

## 2. What’s in Place (Working)

### 2.1 Onboarding flow router

- **Files:** `src/05_Logic/logic/engines/Onboarding-flow-router.tsx`, `src/05_Logic/logic/actions/resolve-onboarding.action.ts`
- **Behavior:** `resolveOnboardingFromAnswers(answers)` runs the 25× engine for intent, then picks:
  - **pricing-jump-flow** — intent ≥ 80 or `wantsPricing`
  - **education-flow** — intent ≥ 40
  - **calculator-1** — default
- **Flow definitions:** `src/05_Logic/logic/flows/flow-definitions.ts` (start/complete views for each flow).

### 2.2 Landing page resolver

- **File:** `src/05_Logic/logic/runtime/landing-page-resolver.ts`
- **Behavior:** Uses `getState()` and `readEngineState()` for answers → `resolveOnboardingFromAnswers(answers)` → flow; content is always `resolveContent("construction-cleanup")`.
- **Used only on:** `/dev` when there is no `screen` param (dev/page.tsx builds JSON from `resolveLandingPage()` and renders it).

### 2.3 Landing content

- **Key:** `construction-cleanup` (from `logic/content/content-map.ts` → `cleanup.logic.json`).
- **Contains:** Questions (cleanup time, messy sites), calculator (25×), summary, CTA (“Try 2 Pros Once”, “Send Me My Numbers”).
- **Flow content:** `education-flow` and others available via content-resolver.

### 2.4 Domain onboarding API (for generated sites)

- **Route:** `GET /api/sites/[domain]/onboarding`
- **Behavior:** Serves `src/content/sites/{domain}/exports/onboarding.flow.json` (from `npm run website`).
- **Use case:** Per-domain onboarding flows (e.g. Container Creations), not the main app root.

### 2.5 Google Ads surface

- **AdsTab:** Create/edit ads with `finalUrl`, `onboardingFlowId`; link to FlowViewer on `/dev` by `onboardingFlowId`.
- **APIs:** `/api/google-ads/insights`, ad definitions; sample ad has `finalUrl: "https://example.com/landing"`, `onboardingFlowId: "container-direct-buy"`.
- **Gap:** `finalUrl` and `onboardingFlowId` are not used to drive what the user sees when they land on your site.

---

## 3. What’s Missing (Gaps)

### 3.1 Production root does not use the landing system

- **Current:** `src/app/page.tsx` uses `rawPath = searchParams.get("screen") || currentView || DEFAULT_SCREEN_PATH` and never calls `resolveLandingPage()`.
- **Default:** `DEFAULT_SCREEN_PATH = "tsx:HiClarify/HiClarifyOnboarding"`.
- **Effect:** All traffic to `/` (including from ads) sees HiClarifyOnboarding (brand splash + “Enter System”), not the flow-based calculator/education/pricing landing.

### 3.2 No dedicated landing route

- There is no `src/app/landing/page.tsx` (or `/lp`, `/go`, etc.).
- The sample ad’s `finalUrl: "https://example.com/landing"` would 404 on your app unless you add a `/landing` route or point final URLs to `/`.

### 3.3 Ad final URL and onboarding flow not wired to experience

- `onboardingFlowId` (e.g. `container-direct-buy`) is only used in the AdsTab UI to open FlowViewer on `/dev`.
- There is no logic that:
  - Redirects or renders based on `onboardingFlowId`, or
  - Reads `flow=` (or similar) from the URL and pre-selects that flow for the landing.

### 3.4 No UTM / campaign handling

- No reading of `utm_source`, `utm_medium`, `utm_campaign`, or `flow=` to:
  - Choose which flow to show, or
  - Persist campaign context for the session.

### 3.5 “Enter System” destination may not resolve

- HiClarifyOnboarding “Enter System” dispatches `currentView = "HiClarify/home/home_screen"` (no `tsx:`).
- `page.tsx` then calls `loadScreen("HiClarify/home/home_screen")`, which is treated as a JSON path (`/api/screens/...`).
- If that JSON screen does not exist, the user gets a fallback/error. Worth confirming that `HiClarify/home/home_screen` is a valid JSON screen or switching to a path that exists (e.g. `tsx:...`).

---

## 4. How to Implement (Recommendations)

### Option A — Use root `/` as the ad landing (minimal change)

**Goal:** When there is no `screen` (and optionally no `flow`) in the URL, show the flow-based landing instead of HiClarifyOnboarding.

1. **In `src/app/page.tsx`:**
   - If `!searchParams.get("screen")` and `!currentView` (or a dedicated “use landing” condition), call `resolveLandingPage()`.
   - Use the same pattern as dev: build a landing JSON from `content` + `flow` (e.g. `root: { type: "json-skin", children: content.blocks }`), then render via the existing JSON pipeline (ExperienceRenderer, etc.) instead of loading a TSX screen.
2. **Optional:** If query has `flow=...`, pass that into the resolver (e.g. override default flow) so ad links like `/?flow=container-direct-buy` show the right flow.

**Pros:** Single URL for home and ads; no new route.  
**Cons:** Root behavior changes; you may still want a distinct “brand” experience for non-ad traffic (then use Option B or C).

### Option B — Add a dedicated `/landing` route (recommended for ads)

**Goal:** Keep `/` as-is (or minimal change) and point ad `finalUrl` to `https://yourdomain.com/landing`.

1. **Add `src/app/landing/page.tsx`:**
   - Read `searchParams`: `flow`, `utm_source`, `utm_medium`, `utm_campaign` (optional for analytics).
   - If `flow` is present, map it to your flow ID (e.g. `container-direct-buy` → `pricing-jump-flow` or a dedicated flow). Otherwise call `resolveLandingPage()` (or a server-safe variant that doesn’t depend on client state).
   - Fetch or compute landing content (e.g. same `construction-cleanup` or flow-specific content).
   - Render the same JSON/structure you use on dev (json-skin with blocks) so one code path serves both dev and production landing.
2. **Point Google Ads final URLs** to `https://yourdomain.com/landing` (and optionally `?flow=container-direct-buy` for the flow you want).
3. **Optional:** Store `utm_*` or `flow` in state/session so the rest of the onboarding can use it.

**Pros:** Clear separation; root unchanged; easy to add UTM and A/B later.  
**Cons:** Requires a landing page component and possibly a small server-side or client-side resolver for flow/content.

### Option C — Hybrid: root stays brand, `/landing` for ads

- Leave `/` as HiClarifyOnboarding (or a generic brand entry).
- Use `/landing` (Option B) for all ad traffic and set ad final URLs to `/landing` (with optional `?flow=...`).
- No change to root logic; only new route and wiring.

### Connecting `onboardingFlowId` to the experience

- **In AdsTab / campaign setup:** When creating ads, set `finalUrl` to your real landing URL (e.g. `https://yourdomain.com/landing?flow=container-direct-buy`).
- **In landing page:** In `/landing` (or wherever you resolve landing), read `flow=` from the URL; if it matches a known flow ID (e.g. from `FLOWS` or a map from `onboardingFlowId`), use that as the initial flow instead of `resolveLandingPage()` when there are no answers yet.
- **Mapping:** Add a small map, e.g. `onboardingFlowId → flowId` (`container-direct-buy` → `pricing-jump-flow` or a dedicated flow), and use it when `flow=` is present.

### Content and flows

- **Today:** Landing content is always `construction-cleanup`; flow is chosen by 25× + answers. No campaign-specific content.
- **Later:** You can add content keys per campaign/variant (e.g. in content-map) and choose content by `utm_campaign` or `flow=` in addition to flow.

### “Enter System” and home screen

- Verify that `HiClarify/home/home_screen` is a valid screen path (JSON or TSX). If not, either:
  - Add the JSON screen under the path the API expects, or
  - Change the button to navigate to a path that exists (e.g. `tsx:HiClarify/...` if you have a TSX home).

---

## 5. Quick checklist to run the campaign

- [ ] **Landing URL:** Add `/landing` route (Option B) or wire root to `resolveLandingPage()` (Option A).
- [ ] **finalUrl:** Set all ad final URLs to that landing (e.g. `https://yourdomain.com/landing`).
- [ ] **flow param:** Support `?flow=...` on landing and map `onboardingFlowId` (e.g. `container-direct-buy`) to a flow.
- [ ] **Rendering:** Reuse the same JSON landing structure as dev (content.blocks → json-skin) so the experience is consistent.
- [ ] **Enter System:** Confirm `HiClarify/home/home_screen` resolves, or update HiClarifyOnboarding to a valid path.
- [ ] **Optional:** Persist UTM/campaign for analytics and future flow variants.

---

## 6. File reference

| Concern | File(s) |
|--------|--------|
| Flow routing | `src/05_Logic/logic/engines/Onboarding-flow-router.tsx` |
| Resolve onboarding action | `src/05_Logic/logic/actions/resolve-onboarding.action.ts` |
| Landing resolver | `src/05_Logic/logic/runtime/landing-page-resolver.ts` |
| Flow definitions | `src/05_Logic/logic/flows/flow-definitions.ts` |
| Landing content | `src/05_Logic/logic/content/cleanup.logic.json`, `content-map.ts` |
| Root page (no landing today) | `src/app/page.tsx` |
| Dev landing usage | `src/app/dev/page.tsx` (resolveLandingPage when no screen) |
| HiClarify onboarding | `src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx` |
| Ads + finalUrl / onboardingFlowId | `src/01_App/(live) Business/workspace/AdsTab.tsx` |
| Domain onboarding API | `src/app/api/sites/[domain]/onboarding/route.ts` |
