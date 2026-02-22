# TSX Compatibility Audit Report (No Edits — Analysis Only)

**Scope:** TSX screens under `src/01_App/(live)` and any TSX screens rendered via `TSXScreenWithEnvelope`.  
**Date:** 2025-02-22  
**Rules:** No file edits, no refactors, Director contract compliance analysis only.

---

## Screen inventory (in scope)

| # | File path | Rendered via envelope | Notes |
|---|-----------|------------------------|-------|
| 1 | `src/01_App/(live) Business/Container_Creations/ContainerCreationsWebsite.tsx` | Yes (dev + when loaded by path) | Main website TSX screen |
| 2 | `src/01_App/(live) Business/shopify/Shopify_Intelligence.tsx` | Yes (dev) | Shopify Intelligence dashboard |
| 3 | `src/01_App/(live) Business/onboarding/flows-index.tsx` | Yes (dev) | Flow list; also exported as FlowsIndex |
| 4 | `src/01_App/(live) Business/onboarding/FlowViewer.tsx` | Yes (dev) | Flow + engine viewer, EducationCard |
| 5 | `src/01_App/(live) Business/Container_Creations/FlowsIndex.tsx` | Yes (dev) | Wrapper only → re-exports flows-index |
| 6 | `src/01_App/(live) Business/Container_Creations/FlowViewer.tsx` | Yes (dev) | Wrapper only → re-exports onboarding/FlowViewer |

**Also rendered via TSXScreenWithEnvelope (not under (live)):**  
- `HiClarifyOnboarding` (`src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx`) on main app page — included in Phase 3 envelope check only.

---

## Phase 1 — Inventory (per-screen tables)

### 1. ContainerCreationsWebsite.tsx

| Category | Findings |
|----------|----------|
| **useState** | `contract`, `error` |
| **dispatchState** | Yes — `dispatchState("state.update", { key: "paletteName", value: validation.resolvedPaletteName })` after contract fetch |
| **navigate** | None |
| **Direct getState()** | Yes — via `useSyncExternalStore(subscribeState, getState, getState)`; reads `stateSnapshot?.values?.experience` |
| **Direct palette** | No direct palette-store; syncs palette to state for envelope |
| **Path-based logic** | Yes — `screenPath = searchParams.get("screen") ?? "tsx:(live) Business/Container_Creations/ContainerCreationsWebsite"` (default path literal) |
| **Feature-name literals** | Implicit: "containercreations" via API path `/api/sites/containercreations/contract`; screen path string |
| **Profile branching** | No |
| **Hardcoded experience branching** | No in this file; delegated to `WebsiteTemplate` (experience prop) |
| **Layout assumptions** | Relies on envelope; delegates layout to `WebsiteTemplate` (experience-based styles) |

---

### 2. Shopify_Intelligence.tsx

| Category | Findings |
|----------|----------|
| **useState** | `shop` (useShopParam), `signal`, `controlState`, `loading`, `error`, `installUrl` |
| **dispatchState** | None |
| **navigate** | None |
| **Direct getState()** | None |
| **Direct palette** | None; inline styles only |
| **Path-based logic** | None |
| **Feature-name literals** | "Shopify Intelligence" (title), `/api/shopify-intelligence`, `hiclarify-dev.myshopify.com` fallback |
| **Profile branching** | No |
| **Hardcoded experience branching** | No |
| **Layout assumptions** | Inline `maxWidth: 720`, `padding: "2rem"`, no envelope layout dependency |

---

### 3. flows-index.tsx (FlowsIndex)

| Category | Findings |
|----------|----------|
| **useState** | `flows`, `flowItems`, `selectedFlow`, `loading`, `error` |
| **dispatchState** | None |
| **navigate** | Yes — `router.push(\`/dev?${params.toString()}\`)` (Open Flow), `router.push("/")` (Return) |
| **Direct getState()** | None |
| **Direct palette** | Uses CSS vars: `var(--color-bg-primary, #1a1a1a)`, etc. |
| **Path-based logic** | Yes — `ENGINE_VIEWER_SCREEN_PATH = "tsx:(live) Business/onboarding/FlowViewer"` (hardcoded screen path) |
| **Feature-name literals** | Yes — `project === "Container_Creations"` (filter logic); "Flow Tester" title; path literal above |
| **Profile branching** | No |
| **Hardcoded experience branching** | No |
| **Layout assumptions** | Own layout: `minHeight: "100vh"`, centered flex, card-style panel |

---

### 4. FlowViewer.tsx (onboarding)

| Category | Findings |
|----------|----------|
| **useState** | Many: `selectedEngineId`, `availableFlows`, `availableEngines`, `loading`, `selectedFlowId`, `trackingState`, `explain`, `nextStepReason`, `presentation`, `currentFlow`, `engineState`, `selectionReason`, `cardState` |
| **dispatchState** | None |
| **navigate** | Yes — `router.push(\`?${params.toString()}\`)` (flow/engine change), `router.push("/dev?screen=" + encodeURIComponent("tsx:(live) Business/onboarding/flows-index"))` (return) |
| **Direct getState()** | None |
| **Direct palette** | Inline styles / object constants only |
| **Path-based logic** | Yes — hardcoded `"tsx:(live) Business/onboarding/flows-index"` for return |
| **Feature-name literals** | Engine IDs (e.g. "learning"), flow IDs from API; "Return to main screen", "Why this next step?" |
| **Profile branching** | No |
| **Hardcoded experience branching** | No; `clientMode` from search params (view/client) is UI toggle only |
| **Layout assumptions** | Own layout: `containerStyle`, `returnToMainBar` (fixed bottom), selectors, card wrapper, debug panels |

---

### 5. FlowsIndex.tsx (Container_Creations wrapper)

| Category | Findings |
|----------|----------|
| **useState** | None (wrapper only) |
| **dispatchState** | None |
| **navigate** | None |
| **Direct getState()** | None |
| **Direct palette** | None |
| **Path-based logic** | None |
| **Feature-name literals** | None |
| **Profile branching** | No |
| **Hardcoded experience branching** | No |
| **Layout assumptions** | None; delegates to GlobalFlowsIndex |

---

### 6. FlowViewer.tsx (Container_Creations wrapper)

| Category | Findings |
|----------|----------|
| Same as FlowViewer (onboarding) | Wrapper only; re-exports `GlobalFlowViewer` (onboarding/FlowViewer). No additional logic. |

---

## Phase 2 — Director compliance check

Director contract (from `DIRECTOR_CONTRACT.md`): stateless, read-only (no dispatchState/navigate), config-driven, single output (25 primitives), no feature names, one state/behavior/layout engine.

**Interpretation for screens:** Screens are not the Director; they are *consumers*. Compliance here means: *Can this screen be made to behave as a render-only, primitive-driven view that receives directorProps and does not violate the single-engine / no-feature-name / no-envelope-duplication principles?*

| Screen | Render-only | No hardcoded feature names | No business logic | No profile branching | No experience branching | No envelope duplication | Uses primitives correctly | Compatible with archetype model |
|--------|-------------|----------------------------|-------------------|------------------------|---------------------------|----------------------------|-----------------------------|--------------------------------|
| **ContainerCreationsWebsite** | Needs Refactor | Needs Refactor | Needs Refactor | Pass | Needs Refactor | Pass | Needs Refactor | Pass |
| **Shopify_Intelligence** | Needs Refactor | Needs Refactor | Needs Refactor | Pass | Pass | Pass | Needs Refactor | Pass |
| **flows-index** | Needs Refactor | Needs Refactor | Needs Refactor | Pass | Pass | Pass | Needs Refactor | Pass |
| **FlowViewer (onboarding)** | Needs Refactor | Needs Refactor | Needs Refactor | Pass | Pass | Pass | Needs Refactor | Pass |
| **FlowsIndex (wrapper)** | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| **FlowViewer (wrapper)** | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |

**Why (summary):**

- **ContainerCreationsWebsite:** Not render-only (fetch + dispatchState for palette); feature name in API path and default screen path; business logic (fetch contract, validate, sync palette); experience branching lives in child `WebsiteTemplate` (EXPERIENCE_LAYOUT). No envelope duplication. Does not consume directorProps/primitives; uses contract + WebsiteTemplate.
- **Shopify_Intelligence:** Not render-only (fetch, loading/error state); feature names in title and API; business logic (fetch, map response to UI). No envelope duplication. Inline styles only; no use of Director primitives.
- **flows-index:** Not render-only (fetch list, router.push); feature literal "Container_Creations" and hardcoded screen path; business logic (filter by project, navigate to FlowViewer). No envelope duplication. Uses ButtonCompound; no Director primitives.
- **FlowViewer (onboarding):** Not render-only (heavy state, engine bridge, router.push); feature literals (path strings, engine IDs); business logic (flow load, engine selection, EducationCard, engine state subscription). No envelope duplication. Does not use Director primitives; custom layout and debug panels.
- **Wrappers:** Render-only pass-through; no logic, no feature names, no envelope duplication; compatible.

---

## Phase 3 — Envelope duplication check

### TSXScreenWithEnvelope

- **Location:** `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`
- **Responsibilities:** Resolves profile via `getDefaultTsxEnvelopeProfile(screenPath, experience, profileName)`, applies layout (getLayoutStyles), subscribes to palette/state and applies palette to wrapper ref, provides `StructureConfigProvider` with resolved structure. Passes `structureProps` (structureConfig, structureType, schemaVersion, featureFlags) to `Component`.
- **Profile logic:** Not duplicated; profile comes from a single function. Layout decisions (full-viewport, contained, max-width, scroll-region) live only in envelope.
- **Palette:** Envelope applies palette to wrapper div via `applyPaletteToElement(el, paletteName)`; palette name from getState()/getPaletteName(). Screens do not apply their own root palette in envelope flow (ContainerCreationsWebsite syncs palette name to state for envelope/Inspector, which is coordination, not duplication).

### getDefaultTsxEnvelopeProfile

- **Location:** `src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts`
- **Path/experience logic:** Path pattern conventions (e.g. `Container_Creations/*`, `learning/*`, `admin/*`, `kid/*`, `focus/*`, onboarding, HiClarify/*, wizard/flow) and experience (`website` | `app` | `learning`) for Container_Creations only. Profile name can override via mode-profiles.json.
- **Duplication:** Profile and layout decisions are centralized here. No duplication of this logic inside TSX screens.

### Custom wrappers inside TSX screens

- **ContainerCreationsWebsite:** No extra wrapper; uses `WebsiteTemplate` which has its own layout (EXPERIENCE_LAYOUT by experience). That is **layout/experience branching inside screen tree** (WebsiteTemplate), not in envelope — acceptable if experience is passed from state/envelope context; could be seen as minor duplication of “experience → layout” if envelope already drives experience.
- **Shopify_Intelligence:** No custom wrapper; root div with inline styles.
- **flows-index:** No custom wrapper; root div with inline layout (centered, card).
- **FlowViewer:** No custom wrapper; root div with internal layout (selectors, panels, card, fixed bar).

### Screen doing its own wrapper logic

- **ContainerCreationsWebsite:** Does not wrap itself in another envelope; it does sync palette to state and pass experience to WebsiteTemplate. WebsiteTemplate applies experience-based layout — that is layout decision inside screen, not envelope duplication.
- **Conclusion:** No screen duplicates the envelope’s profile or palette application. WebsiteTemplate’s EXPERIENCE_LAYOUT is the only “layout decision inside screen” and is experience-driven (could be refactored to come from envelope/context later).

---

## Phase 4 — Primitive coverage gaps

**25 Director primitives (from `primitive-registry.ts`):**  
visibility, disabled, variant, layoutDensity, buttonMode, sliderEnable, numericInputMode, modalEnable, tooltipEnable, stepSequenceMode, collectionMode, cardMode, presentationMode, dragEnable, inlineEditEnable, readOnlyMode, compactMode, advancedToggle, roleBasedAccess, animationLevel, feedbackLevel, paletteOverride, typographyOverride, interactionStrictness, loggingVerbosity.

| Screen | UI behaviors not represented by primitives | New primitive required? | Justification |
|--------|--------------------------------------------|--------------------------|---------------|
| **ContainerCreationsWebsite** | Node order override (dev), experience-based max-width/padding | No | Node order is dev tooling; experience layout can map to existing layoutDensity/variant or stay as envelope/profile. |
| **Shopify_Intelligence** | Loading/error states, table for SKUs, install CTA | No | Loading/error are presentational; table = collectionMode list; CTA = buttonMode. |
| **flows-index** | Flow list, project filter (Container_Creations), “Open Flow” / “Return” navigation | No | List + select = collectionMode + variant; navigation is routing, not a new primitive. |
| **FlowViewer** | Flow/engine selectors, step list, “Why this next?” panel, EducationCard, return bar, client view toggle | No | stepSequenceMode covers step UX; selectors = existing controls; debug panel could use advancedToggle; client view = visibility or variant. EducationCard is a composed component; no new primitive needed. |

**Conclusion:** No new primitives are required. Existing 25 primitives (plus routing and engine bridge as non-primitive concerns) are sufficient for Director compatibility once screens are refactored to consume directorProps.

---

## Phase 5 — Archetype mapping

| Screen | Archetype | Notes |
|--------|-----------|--------|
| **ContainerCreationsWebsite** | Hybrid (Collection + Presenter) | Presents website nodes (sections/content) in order; collection of nodes. |
| **Shopify_Intelligence** | Dashboard | Summary metrics, health score, suggested action, table; single-view dashboard. |
| **flows-index** | Collection + Form | List of flows, select one, button actions (Open, Return); small form. |
| **FlowViewer** | Sequence + Editor hybrid | Step sequence (EducationCard), flow/engine selection, debug/explain panels; wizard/sequence with editor-like controls. |
| **FlowsIndex (wrapper)** | N/A | Pass-through. |
| **FlowViewer (wrapper)** | N/A | Pass-through. |

**Clean fit:** Dashboard (Shopify), Collection (flows-index list). **Hybrid:** ContainerCreationsWebsite (collection + presenter), FlowViewer (sequence + editor-like). All classifiable without new archetypes.

---

## Phase 6 — Risk scan

| Risk | Location | Finding |
|------|----------|---------|
| **Hidden mini-engines** | FlowViewer | Flow loader + engine transformation + setEngineFlow/setCurrentEngine + subscribeEngineState. This is the **intended** engine bridge usage (flow/engine system), not a hidden duplicate engine. |
| **Direct state mutations** | ContainerCreationsWebsite | `dispatchState("state.update", { key: "paletteName", value: ... })` — screen mutates global state. |
| **UI-level reducers** | FlowViewer | Local state only (useState); no custom useReducer. Card state is local. |
| **Shadow routing** | flows-index, FlowViewer | `router.push("/dev?screen=...")` and `router.push("?flow=...")` — Next.js router used directly; not the behavior-bridge navigate. |
| **Custom behavior bypassing behavior bridge** | HiClarifyOnboarding (envelope-rendered) | `window.dispatchEvent(new CustomEvent("navigate", { detail: { to: "HiClarify/home/home_screen" } }))` — custom navigate event; not via behavior bridge. |
| **Dev-only stores** | ContainerCreationsWebsite | `setDevWebsiteNodeOrder(screenPath, contract.nodeOrder)` — dev sidebar state; acceptable for dev tooling. |

**Summary:** One direct state mutation (paletteName in ContainerCreationsWebsite). Shadow routing via Next router in flows-index and FlowViewer. HiClarifyOnboarding uses custom navigate event (not in (live) but envelope-rendered). No hidden mini-engines beyond the designed flow/engine bridge usage in FlowViewer.

---

## Phase 7 — Final output

### Screen inventory list

1. `src/01_App/(live) Business/Container_Creations/ContainerCreationsWebsite.tsx`
2. `src/01_App/(live) Business/shopify/Shopify_Intelligence.tsx`
3. `src/01_App/(live) Business/onboarding/flows-index.tsx`
4. `src/01_App/(live) Business/onboarding/FlowViewer.tsx`
5. `src/01_App/(live) Business/Container_Creations/FlowsIndex.tsx` (wrapper)
6. `src/01_App/(live) Business/Container_Creations/FlowViewer.tsx` (wrapper)

### Refactor priority ranking

| Priority | Screen | Reason |
|----------|--------|--------|
| **High** | ContainerCreationsWebsite | dispatchState (paletteName); experience branching in child; API/feature coupling. |
| **High** | FlowViewer (onboarding) | Heavy business logic, engine bridge usage, router.push, hardcoded paths; largest surface. |
| **Medium** | flows-index | Feature literal "Container_Creations", hardcoded screen path, router.push. |
| **Medium** | Shopify_Intelligence | Feature names in API/title; fetch + loading/error; no primitives. |
| **Low** | FlowsIndex (wrapper), FlowViewer (Container wrapper) | No logic; already compliant. |

### Primitive gaps

- **None.** No new primitives required. Existing 25 cover the needed behaviors once screens are refactored to receive and use directorProps.

### Contract violations (summary)

- **Director (for screen consumers):** Screens that call dispatchState, navigate (router.push or custom event), or hardcode feature names/paths violate the “read-only, config-driven, no feature names” spirit. That applies to: ContainerCreationsWebsite (dispatchState), flows-index and FlowViewer (router.push + literals), HiClarifyOnboarding (custom navigate). Shopify_Intelligence does not touch state/navigate but has feature names and business logic.
- **Envelope:** No envelope duplication. getDefaultTsxEnvelopeProfile is the single place for path/experience → profile; screens do not re-implement profile or palette application.

### Confirmation

**All TSX screens under `src/01_App/(live)` can be made Director-compatible without new engines.**

- Wrappers are already compliant.
- ContainerCreationsWebsite: move palette sync to a non-screen layer or to Director/config; pass experience from context; keep render in WebsiteTemplate primitive-driven.
- Shopify_Intelligence, flows-index, FlowViewer: refactor to receive directorProps (and routing/navigation via behavior bridge or a single navigation primitive); replace feature literals with config or props; keep flow/engine bridge as the single engine for FlowViewer.
- No new engines are required; the existing state store, behavior bridge, and layout (envelope + structure) are sufficient. No new Director primitives are required.

---

*End of audit. No file edits were made.*
