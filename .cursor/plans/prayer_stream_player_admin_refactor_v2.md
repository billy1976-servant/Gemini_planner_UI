# Prayer Stream Player Admin Refactor v2 — TSX Screen Type Analysis

**Goal:** Determine which existing TSX screen type/pattern in this repo is the correct base for the Prayer Stream app. No implementation or file changes in this document.

---

## 1. TSX Screen Types/Patterns Found in This Repo

Search covered `src/01_App` (live and dead), structure engine contracts, and dev/test organisms. Below are the **seven concrete TSX screen architectures** in use.

| # | Type name | File path | What it is used for |
|---|-----------|-----------|----------------------|
| 1 | **Single-view minimal (immediate-use)** | `src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx` | One screen: centered stack, title + short copy + one CTA. No steps, no config fetch, no step tracker. Documented as "Google-style onboarding: single view, 5 clean lines, centered stack. No icons, no tabs, minimal style." Used as HiClarify entry/welcome. |
| 2 | **Config-driven multi-screen landing (wizard/step flow)** | `src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding-2.tsx` | Fetches config from API; `screens[]`, `currentScreenId`, step tracker aside, next/back/goto, `renderContentBlocks` + media. Used for marketing/onboarding flow with multiple steps and layouts (hero, stamped, twoCol, etc.). |
| 3 | **Config-driven multi-screen (same pattern as #2)** | `src/01_App/(live) Business/Prayer_Stream/PrayerStreamOnboarding.tsx` | Same as #2: config from `/api/prayer-stream-config`, 4 screens, step tracker, content blocks, "I prayed" on last screen. Current Prayer Stream implementation. |
| 4 | **Contract-driven website shell** | `src/01_App/(live) Business/Container_Creations/ContainerCreationsWebsite.tsx` | Fetches a website contract from API, validates it, passes to `WebsiteTemplate`. Multi-section website driven by contract; no step flow, no wizard. |
| 5 | **Education flow viewer** | `src/01_App/(live) Business/onboarding/FlowViewer.tsx` | Loads education flows, applies engine, shows step/card sequence with engine state, "Why this next?", flow/engine selectors. Used for business onboarding flows with engines. |
| 6 | **Dashboard / tabbed workspace** | `src/01_App/(live) Business/workspace/WorkspaceLayout.tsx` | Tab bar (Command, Data, Reports, Ads, Decision, etc.), shared business/date state, no steps. Renders different tab content (DataTab, AdsTab, etc.). |
| 7 | **JSON-skinned landing (ExperienceRenderer)** | `src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding.tsx` | Static landing JSON + `ExperienceRenderer` + section-based composition (expandOrgansInDocument, applySkinBindings). State-driven sections (e.g. `landingStep`); not a TSX step tracker, but still multi-section flow. |

The TSX structure engine also defines **eight structure types** (list, board, dashboard, editor, timeline, detail, wizard, gallery) in `src/lib/tsx-structure/contracts/` and `builtinTemplates.ts`. Those are config types for *how* a screen behaves (e.g. wizard = steps, progress, next/back). The **concrete screen implementations** above are what you copy or adapt; the only one that is a single-view, no-step, immediate-use screen is **#1 HiClarifyOnboarding**.

---

## 2. Best Fit for Prayer Stream

**Prayer Stream should use: single-view minimal (immediate-use)** — pattern **#1**.

- **File to use as the base:** `src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx`
- **Why:** The app must be a **direct player screen**, **immediate-use**, **media-first**, and **minimal interaction**. HiClarifyOnboarding is the only TSX in the repo that is a single view, no steps, no flow, no config fetch for screens, centered content, and one primary action. Swap title/copy for "Daily Prayer", add `<audio controls src="/prayers/today.mp3">` (and optional loop), add "Mark prayed" plus optional "You have prayed X times" from localStorage. No step tracker, no next/back, no screens[].

---

## 3. Why the Current Wizard/Onboarding Type Is the Wrong Fit

- **Current implementation:** Prayer Stream uses the same pattern as ContainerCreationsLanding-2: **config-driven multi-screen landing** with `screens[]`, `currentScreenId`, step tracker, next/back/goto, and `renderContentBlocks` (pattern #2/#3).
- **Why that is wrong:**
  - **Goal:** "Open directly to a prayer player" and "immediate-use." The wizard forces users through Welcome → Join Today's Prayer → Reflection → Mark Complete before they can play. That is the opposite of immediate-use.
  - **Friction:** Step flow and progress are for guided onboarding or multi-step forms, not for "play today’s prayer and optionally mark prayed."
  - **Architecture mismatch:** Prayer Stream should be **media-first** (one player, one primary action). The wizard pattern is **sequence-first** (multiple screens, navigation, progress). Using the wizard type for Prayer Stream ties the app to the wrong mental model and adds unnecessary state (currentScreenId, step tracker, config fetch) for a single screen.

---

## 4. Exact TSX File to Use as Base for PrayerPlayer.tsx

**Base file:** `src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx`

- **Reason:** Single view, centered layout, minimal dependencies (no config API, no step state), one CTA. Adapt by: replacing title/copy with prayer title and short description; adding native `<audio controls src="/prayers/today.mp3">` (and optional loop); replacing "Enter System" with "Mark prayed" and optional localStorage count display. Structure (full-height centered column, maxWidth, single primary action) stays; only content and one interaction change.

---

## 5. Replace vs Preserve the Current Wizard

- **Replace** the **default** experience: The main route (`/prayer-stream`) should render the new **PrayerPlayer** (single-view, base from HiClarifyOnboarding). No onboarding steps by default.
- **Preserve** the current wizard as a **secondary devotional flow**: Rename `PrayerStreamOnboarding.tsx` to `PrayerDevotionalFlow.tsx` (or similar), keep it in the codebase and in the dev navigator so it can still be opened from the dev menu or a dedicated link. Do **not** load it by default on `/prayer-stream`. So: **replace** for the primary app; **preserve** as an optional, non-default flow.

---

## 6. Summary

| Question | Answer |
|----------|--------|
| **~7 TSX patterns found** | (1) Single-view minimal — HiClarifyOnboarding; (2) Config-driven multi-screen landing — ContainerCreationsLanding-2; (3) Same — PrayerStreamOnboarding; (4) Contract-driven website — ContainerCreationsWebsite; (5) Education flow viewer — FlowViewer; (6) Dashboard/tabbed workspace — WorkspaceLayout; (7) JSON-skinned landing — ContainerCreationsLanding. |
| **Which one Prayer Stream should use** | Single-view minimal (immediate-use). |
| **Exact file path to use as base** | `src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx`. |
| **Current wizard: replace or preserve?** | Replace as the default; preserve the wizard as a secondary devotional flow (renamed, not loaded by default). |
