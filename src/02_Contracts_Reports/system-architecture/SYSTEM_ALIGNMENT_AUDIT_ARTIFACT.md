# System Alignment Audit Artifact

**Source:** Full System Alignment Audit (read-only). No code changes.

This document contains: (1) Structured system map, (2) TSX drift report, (3) TSX classification, (4) Uncontrolled surfaces report, (5) Control expansion plan.

---

## 1. Structured System Map

### 1.1 Control Systems Summary

| System | File location | Who uses it | Who controls it | Global or local |
|--------|---------------|-------------|-----------------|-----------------|
| Layout (root) | src/app/layout.tsx | Next.js | state-store, layout-store | Global |
| Layout (section/card) | layout-store, lib-layout, LayoutMoleculeRenderer | json-renderer, page | template + overrides | Global |
| Palette | palette-store, palette-resolver, palette-bridge, palettes/*.json | layout, json-renderer, molecules | state-store (paletteName) | Global |
| Behavior | behavior-listener, behavior-engine, behavior-runner | layout | JSON intents | Global |
| Registry | src/03_Runtime/engine/core/registry.tsx | json-renderer | Code only | Global |
| Experience visibility | experience-visibility.ts | json-renderer | experience + depth/role | Global |
| Screen load | screen-loader, API screens | page, dev/page | Path string | Global |
| Flow/engine registry | src/05_Logic/logic/engine-system/engine-registry.ts | flow-loader, FlowRenderer (dynamic) | — | Local (disconnected) |
| Shells (Mobile, GlobalAppSkin, site shells) | mobile/MobileShell, shells/, site-skin/shells/ | layout, dev, site renderer | Layout or dev only | Mixed |
| Engine overlays | site-engines/applyEngineOverlays.ts | None (build-time) | Config | Local |

### 1.2 Full Per-System Map

| System type | File location | What controls it | What can override it | Where used | Globally governed or freeform |
|-------------|---------------|------------------|----------------------|------------|------------------------------|
| **Atoms (9+)** | src/04_Presentation/components/atoms/: collection, condition, field, focus-ring, media, sequence, shell, skeleton, spinner, surface, text, trigger (+ index.ts) | Registry, json-renderer | node.params, resolveParams (palette) | json-renderer → Registry | Global (Registry + palette) |
| **Molecules (12)** | src/04_Presentation/components/molecules/: section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar | Registry, getCompoundComponent, layout resolver | node.params, section/card overrides | json-renderer | Global |
| **Organs** | src/04_Presentation/components/organs/: organ-registry.ts, resolve-organs, hero/header/nav/footer/features-grid/gallery/pricing/faq/cta/testimonials/content-section variants | organ-registry VARIANTS, loadOrganVariant, expandOrgansInDocument | organInternalLayoutOverrides, node.variant | page.tsx (JSON branch) | Global (JSON path) |
| **Behavior engines** | behavior-listener, behavior-engine, behavior-runner, contract-verbs | installBehaviorListener (layout), JSON behavior | state-store, action-registry | layout, json-renderer (trigger) | Global |
| **Palette engines** | palette-store, palette-resolver, palette-resolve-token, palette-bridge, palettes/*.json | state-store paletteName, usePaletteCSS | paletteOverride (ExperienceRenderer) | layout, json-renderer, LayoutMoleculeRenderer | Global |
| **Layout engines** | layout-store, lib-layout (template-profiles, composeScreen, region-policy), layout resolver, LayoutMoleculeRenderer | templateId, experience, overrides | sectionLayoutPresetOverrides, cardLayoutPresetOverrides | page, json-renderer, section compound | Global |
| **Wrappers/shells** | GlobalAppSkin, BottomNavBar_IconLegacy, MobileShell, WebsiteShell, AppShell, LearningShell, OsbMinimalTopBar | layout.tsx (MobileShell only global); dev for others | — | layout, dev page | Mixed (MobileShell global; others local) |
| **Overlay injectors** | applyEngineOverlays (build-time), InspectorOverlay, RegionDebugOverlay | Config / dev tools | — | Site compile, diagnostics | Local |
| **Visibility logic** | experience-visibility.ts (getExperienceVisibility), shouldRenderNode (when) | experience, depth, node.when, state | — | json-renderer | Global |
| **Conditional rendering** | shouldRenderNode (node.when + state/defaultState) | JSON when clause | — | json-renderer | Global |
| **Engine injection (JSON)** | JsonSkinEngine (type json-skin), Registry | node.type | — | json-renderer renderNode | Global |
| **Engine injection (flow)** | engine-registry, flow-loader, FlowRenderer | Dynamic TSX path | — | engine-viewer, david-onboarding, etc. | Local (disconnected) |
| **State coupling** | state-store (subscribeState, getState, dispatchState) | layout, page, behavior-listener, ExperienceRenderer | state:update, state:currentView, etc. | Everywhere | Global |
| **Inlay systems** | Organs (expandOrgansInDocument), slots (applySkinBindings) | page.tsx pipeline | organ overrides, slot data | page.tsx → JsonRenderer | Global |

---

## 2. TSX Drift Report

### 2.1 TSX that ignores palettes

- Most TSX under `src/01_App/apps-tsx/` do not call `usePaletteCSS` or `resolveParams`; they use inline styles or local CSS.
- Examples: `tsx-screens/onboarding/david-onboarding.tsx`, `HiClarify/JSX_planner_test.tsx`, `HiClarify/JSX_MonthView.tsx`.
- `HiClarify/JSX_Palette_Test.tsx` is palette-aware by name only; others are not.

### 2.2 TSX that creates its own layout logic

- **HiClarify planner:** JSX_PlannerShell, JSX_DayView, JSX_WeekView, JSX_MonthView, UnifiedPlannerLayout, ChunkPlannerLayer, TimelineAxis — custom flex/grid and dimensions.
- **Onboarding/flows:** david-onboarding, legacy onboarding screens — custom layout and modals.
- **Generated sites:** SiteGeneratedScreen, CompiledSiteViewer — own structure.

### 2.3 TSX that mounts wrappers

- GlobalAppSkin, BottomNavBar_IconLegacy use createPortal; not mounted from layout.tsx (only MobileShell is).
- Dev page can render different chrome (WebsiteShell, LearningShell) for preview.

### 2.4 Wrappers that inject engines automatically

- ExperienceRenderer wraps JsonRenderer and applies experience visibility; it does not inject engine-registry engines.
- Flow/engine-viewer path loads FlowRenderer/engine-viewer dynamically and they use engine-registry.

### 2.5 Where overlays originate

- **layout.tsx:** PipelineDiagnosticsRail (dev), OSBCaptureModal, MobileShell.
- **dev/page.tsx:** overlay slot (currently null).
- **JSX_planner_test / JSX_MonthView:** local modal/overlay UI.
- **InspectorOverlay:** diagnostics.
- **applyEngineOverlays:** build-time schema injection (no runtime UI).

### 2.6 Mounting outside layout.tsx content tree

- DevHome is rendered inside RootLayoutBody (first child of fragment).
- PipelineDiagnosticsRail, OSBCaptureModal, MobileShell are siblings to app-content in layout.tsx (inside layout.tsx but outside the main content div).
- User mode: OsbMinimalTopBar, MobileLayout, OSBCaptureModal only.

### 2.7 Divergence summary

- TSX screens (except those that explicitly use palette/layout tokens) **bypass** palette and layout engines.
- User-mode page.tsx **does not** resolve TSX by path: it always renders HiClarifyOnboarding when `__type === "tsx-screen"`, so currentView for other TSX paths never shows that screen in user mode.
- Flow/engine-registry is used only on dynamic TSX path (e.g. engine-viewer, FlowRenderer), not from JSON trunk.

---

## 3. TSX Classification

### A) Tool engines (planner, timeline, visual systems)

- **HiClarify:** JSX_PlannerShell, JSX_DayView, JSX_WeekView, JSX_MonthView, UnifiedPlannerLayout, ChunkPlannerLayer, TimelineAxis, JSX_AddTasks, JSX_ConfirmList, ViewSwitcherLinks, JSX_planner_test, JSX_Palette_Test.
- **Dev/diagnostics:** ScreenDiagnostics, SystemControlCenter, PipelineDiagnosticsRail, etc.

### B) App screens (onboarding, dashboards, flows)

- **HiClarify:** HiClarifyOnboarding, OsbHomeV2, AppsListV2, TopTextNav, OSBBar.
- **tsx-screens/onboarding:** engine-viewer, david-onboarding, legacy/* (trial, premium-onboarding, json-skin, integration-flow-engine, OnboardingSkin, OnboardingEngine, etc.).
- **tsx-screens/flows,** flows-cleanup-CO, calculators, global-scans (ScanDashboard, GlobalSystemProbe, 25x-Onboarding.Test), google-ads, generated-websites, Gibson_Guitars, control-json.

### C) Shell/wrapper layers

- GlobalAppSkin, GlobalAppSkin-test, BottomNavBar_IconLegacy (shell strip).
- MobileShell, MobileLayout, OsbMinimalTopBar (in layout/shells).

### D) Overlay systems

- InspectorOverlay, RegionDebugOverlay.
- In-component overlays: JSX_planner_test modals, JSX_MonthView overlay bar (UI only, not global).

---

## 4. Uncontrolled Surfaces Report

- **Not governed by palette:** Most TSX screens under apps-tsx (david-onboarding, planner views, legacy onboarding, calculators, ScanDashboard, etc.); ad-hoc inline styles or local CSS.
- **Not governed by layout:** All TSX screens that do not use LayoutMoleculeRenderer or section/card resolver (planner, onboarding, flows, generated sites).
- **Not governed by JSON:** Any TSX screen (structure and content are code-defined); engine-registry and flow-loader are not driven by JSON screen tree.
- **Mounted outside layout.tsx content tree:** DevHome, PipelineDiagnosticsRail, OSBCaptureModal, MobileShell are siblings to the main content div but still inside layout.tsx; no component mounts a full-screen UI root outside layout.tsx except via layout.tsx itself.
- **TSX that bypasses architecture:** User-mode TSX branch always renders HiClarifyOnboarding (ignores currentView path); TSX screens that use inline styles and custom layout bypass palette and layout; flow/engine-registry path bypasses action-registry/trunk.
- **Duplicate injection layers:** Shell quick icons (GlobalAppSkin, BottomNavBar_IconLegacy) vs OSBBar/TopTextNav in layout; two concepts for "shell strip" (only one is mounted in layout.tsx).
- **Visibility conflicts:** Experience visibility (website/app/learning/focus/presentation/kids) is centralized; TSX screens manage their own visibility (e.g. modals) with no shared contract.
- **Wrapper stacking risks:** Multiple shells (MobileShell, GlobalAppSkin, WebsiteShell, LearningShell) and overlays (InspectorOverlay, RegionDebugOverlay); only MobileShell is always mounted in layout; others are conditional (dev/preview) — risk of stacking if more are mounted without a single shell policy.

---

## 5. Control Expansion Plan (Proposals Only)

### 5.1 New global control points

- **TSX screen registry:** Single map (path → loader or component) for TSX screens, used by both user and dev so user mode can resolve currentView to the correct TSX screen instead of always HiClarifyOnboarding.
- **Palette opt-in contract:** Document which TSX screens must use palette (e.g. any screen in "themed app" list); optionally a HOC or wrapper that injects palette CSS for TSX routes.
- **Shell registry:** Single list of "global UI" (MobileShell, PipelineDiagnosticsRail, OSBCaptureModal, DevHome) in layout.tsx with one place to enable/disable per route or mode.

### 5.2 Bring missing systems under control

- **Flow/engine-registry:** Either (a) add a thin static import from a seed to a "flow entry" so reachability is explicit, or (b) formally document as "dynamic path only" and keep behavior as-is.
- **TSX palette:** Add optional usePaletteCSS or token props to a shared TSX layout wrapper so new screens can opt in without each implementing token resolution.
- **Slot/registry lists:** Replace hardcoded slot maps in json-renderer and blueprint with a small JSON or generated list (see JSON_DRIVEN_VIOLATIONS).

### 5.3 Keep TSX flexible but bounded

- Allow tool engines (A) and app screens (B) to own layout and styling; require only that they do not mount global chrome or override layout.tsx children.
- Require new JSON node types to be added to Registry and, if needed, to layout definitions; no ad-hoc type strings in JSON that have no Registry entry.

### 5.4 Prevent drift without over-constraining

- Add a "TSX alignment checklist" to the draft: (1) Renders inside layout shell, (2) Uses palette tokens if in themed app list, (3) Does not mount global overlays, (4) Documents if it is a tool engine.
- Run existing autogen reports (JSON_DRIVEN_VIOLATIONS, DISCONNECTED_SYSTEMS) periodically; no new hardcoded layout ID arrays or silent fallbacks.
