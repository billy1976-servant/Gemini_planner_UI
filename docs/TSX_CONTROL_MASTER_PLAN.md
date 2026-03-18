# TSX Control Master Plan — Universal TSX Control Framework

**Mode:** Read-only → plan only. No code modifications.

**Goal:** Design a universal TSX control framework that brings all TSX screens under system governance (layout, palette, behavior, visibility, overlays, engines) without removing TSX flexibility.

---

## 1. TSX System Map

### 1.1 Discovery Summary

TSX entry points were discovered by scanning:

- **apps-tsx/** — All subfolders (require.context in dev/page.tsx)
- **tsx-screens/** — onboarding, flows, calculators, global-scans, control-json, sites, Gibson_Guitars
- **Planner** — HiClarify/JSX_PlannerShell and children (UnifiedPlannerLayout, JSX_DayView, etc.)
- **Onboarding** — tsx-screens/onboarding (david-onboarding, engine-viewer, tscController) + legacy/*
- **Flows** — tsx-screens/flows/flows-index.tsx; flow content loaded via flow-loader (JSON) and rendered by engine-viewer/david-onboarding
- **Shells** — 04_Presentation/shells (BottomNavBar_IconLegacy, OsbMinimalTopBar, GlobalAppSkin); 06_Data/site-skin/shells (WebsiteShell, LearningShell, AppShell, RegionDebugOverlay)
- **Dynamically loaded TSX** — Via `AUTO_TSX_MAP` (require.context over `src/01_App/apps-tsx`, all `.tsx`), keyed by normalized path (e.g. `HiClarify/JSX_PlannerShell`, `tsx-screens/onboarding/david-onboarding`). Resolution: `resolveTsxScreen(screenPath)` in dev/page.tsx; API `src/app/api/screens/[...path]/route.ts` returns `{ __type: "tsx-screen", path }` for JSON-missing paths that resolve to a .tsx under TSX_ROOT (and hardcodes planner_screen → JSX_PlannerShell).

### 1.2 TSX File Classification

| Category | Files / patterns |
|----------|-------------------|
| **Screen root** | HiClarifyOnboarding, JSX_PlannerShell, OsbHomeV2, david-onboarding, engine-viewer, flows-index, Gibson_Landing, SiteIndex, GibsonSiteScreen, CompiledSiteViewer (multiple), OnboardingGeneratedScreen, SiteGeneratedScreen, ScreenDiagnostics, SystemControlCenter, ScanDashboard, GlobalSystemProbe, tsx-proof, calculator-1, Education-flow, pricing-jump-flow, premium-onboarding-*, trial, beautiful-skin, executive-dashboard, guided-story, integration-flow-engine, json-skin, kid-emotion-mode, system-xray, ambiant-assistant, SiteOnboardingScreen, SitesDirectoryScreen, SiteViewerScreen, OnboardingSkinPreviewScreen, SiteSkinPreviewScreen |
| **Tool engine** | JSX_PlannerShell (calendar/structure), UnifiedPlannerLayout, JSX_DayView, JSX_WeekView, JSX_MonthView, ChunkPlannerLayer, JSX_AddTasks, JSX_ConfirmList, usePlannerViewModels; flow/engine-viewer path (FlowRenderer, engine-registry consumers) |
| **Layout owner** | JSX_PlannerShell, UnifiedPlannerLayout, TimelineAxis, JSX_DayView, JSX_WeekView, JSX_MonthView, ViewSwitcherLinks; david-onboarding; legacy onboarding screens; GlobalAppSkin, shells (WebsiteShell, LearningShell, AppShell) |
| **Overlay injector** | JSX_planner_test (slot/folder/continue modals), JSX_MonthView (overlay bar); RegionDebugOverlay; diagnostics (InspectorOverlay, PipelineDiagnosticsRail in layout/dev) |
| **Shell/wrapper** | PreviewStage (dev), GlobalAppSkin, BottomNavBar_IconLegacy, OsbMinimalTopBar, WebsiteShell, LearningShell, AppShell, MobileLayout/MobileShell (layout.tsx) |
| **Standalone visual** | JSX_Palette_Test, TopTextNav, OSBBar, TimelineAxis (also layout owner), EducationCard usage inside flows |

### 1.3 Load Paths and Authority

| Path type | Resolver | Consumed by | Result |
|-----------|----------|-------------|--------|
| `tsx:...` | screen-loader.ts → returns `{ __type: "tsx-screen", path }` | app/page.tsx, dev/page.tsx | No JSON; TSX path only |
| `HiClarify/planner_screen` (or .json, build/planner/...) | API [...path] hardcode | safeImportJson (client) gets API response | `{ __type: "tsx-screen", path: "HiClarify/JSX_PlannerShell" }` |
| Other JSON-missing path | API [...path] → fs under TSX_ROOT | Client loadScreen(screen) → safeImportJson(api) | `{ __type: "tsx-screen", path: "Category/file" }` if .tsx exists |
| Dev `?screen=` | loadScreen(screen) → then resolveTsxScreen(path) from AUTO_TSX_MAP | dev/page.tsx | Dynamic component; render `<PreviewStage><TsxComponent /></PreviewStage>` |
| App `/` TSX branch | loadScreen(effectivePath) → isTsxScreen | app/page.tsx | Always `<HiClarifyOnboarding />` (path ignored) |

---

## 2. Drift Zones

Areas where TSX currently bypasses or weakens system control:

| System | Drift | Where |
|--------|-------|--------|
| **Layout-store** | TSX roots own full layout (flex/grid, minHeight, sticky, dimensions). No `getLayout`, `subscribeLayout`, or template/section/card resolver. | Planner (JSX_PlannerShell, UnifiedPlannerLayout, Day/Week/Month views, TimelineAxis); david-onboarding; legacy onboarding; flows-index; generated sites; shells |
| **Palette-store** | No `usePaletteCSS` or `resolveParams` in most TSX. Use of CSS vars (e.g. `var(--color-bg-primary)`) is passive—if shell sets vars, TSX reflects; TSX does not query palette. Hardcoded colors in david-onboarding and others. | Most apps-tsx; HiClarify planner; onboarding; flows |
| **JsonRenderer** | TSX branch skips JsonRenderer entirely. No section/card/organ tree, no resolveParams, no layout overrides. | Any screen resolved as tsx-screen (dev + app TSX branch) |
| **ExperienceRenderer** | TSX is not a node inside ExperienceRenderer. When TSX is shown, it replaces the JSON tree. | app/page.tsx (isTsxScreen → HiClarifyOnboarding); dev (TsxComponent in PreviewStage) |
| **Behavior engine** | Planner and many TSX use state-store + runAction directly; no `installBehaviorListener` or JSON-driven behavior. | JSX_PlannerShell, UnifiedPlannerLayout, JSX_DayView, ViewSwitcherLinks; david-onboarding |
| **Visibility system** | No experience/depth/role or `when` driven by JSON for TSX roots. Visibility is local (e.g. tab, modal open). | All TSX roots |
| **Registry** | Screens list is additive (API collectTsxScreens + JSON categories). Planner path is special-cased in API; no single JSON “planner_screen” driving it. | API [...path]; apps_categories / screen list |
| **State defaults** | TSX branch gets no screen JSON → no `json?.state` → default state not set from screen file. State comes from state-store and actions only. | screen-loader (tsx branch returns no json); page.tsx (isTsxScreen → no json) |

---

## 3. Control Gaps

- **Single place to attach layout/palette/behavior/visibility for any TSX root** — Today: only JSON branch gets profile + overrides; TSX gets none.
- **Per-TSX config without editing code or a central registry** — Today: planner is hardcoded in API; other TSX are file-based only; no profile binding by path.
- **Overlay and chrome policy** — Modals and overlays are defined inside TSX (e.g. JSX_planner_test, JSX_MonthView). No system-level overlay slots or visibility rules for TSX.
- **Planner-specific** — Time scale, density, axis visibility, view modes live inside planner TSX and constants; not externalized.
- **Main app TSX behavior** — For any tsx-screen path, app/page renders HiClarifyOnboarding only; path is ignored. No generic “render resolved TSX with system envelope.”

---

## 4. TSX Structure Layer Design

### 4.1 Purpose

A **TSX Structure Layer** sits **above** raw TSX:

- **Above:** System provides an envelope (layout zones, palette injection, behavior hooks, visibility rules, feature flags) via a single wrapper or contract.
- **Below:** Raw TSX remains free (internal layout, components, state, events) and does not need to be rewritten.
- **External control:** Driven by JSON/state (e.g. profile keys in state or by path convention), not by editing a manual registry or touching every new screen file.

### 4.2 Principles

- **Zero per-screen registry edits** — New TSX files under apps-tsx are discovered the same way as today (AUTO_TSX_MAP / API collectTsxScreens). Governance is applied by convention (e.g. profile resolved by path or default).
- **Auto-discovered like palettes/layouts** — Profiles (layout, palette, behavior, visibility) live in JSON or in a single config tree; keyed by path pattern or default. No need to register each screen.
- **JSON-first** — Control surfaces are defined in JSON (or state); the layer applies them at mount time.
- **TSX stays powerful** — TSX can still own complex UI and logic; the layer only adds an external envelope and optional injection points.

### 4.3 Control Surfaces the Layer Must Support

**A) Layout envelope controls**

- **Mount zones** — Where the TSX root is placed (e.g. main content, modal, drawer).
- **Size modes** — full-viewport, contained, max-width, responsive breakpoints.
- **Docking areas** — Top/bottom/side chrome reserved by system; TSX content area is the remainder.
- **Responsive modes** — System can switch layout profile by breakpoint without TSX changes.

**B) UI feature toggles**

- **Nav presence** — Show/hide top/bottom nav (system chrome) around this TSX.
- **Toolbars** — System toolbar slot above/below TSX.
- **Overlays** — System overlay slot (e.g. modals, panels) so TSX can request overlay content via contract instead of rendering its own fixed layers.
- **Debug panels** — Visibility of dev/diagnostics panels (already partially layout/dev-controlled).
- **Side panels** — Optional side panel slot (e.g. RightFloatingSidebar) without TSX owning layout.

**C) Behavior attachment points**

- **Action hooks** — System can inject or override actions (e.g. runAction, navigation) at the envelope so TSX still uses runAction but source can be JSON/engine.
- **State bindings** — Default state and state keys (e.g. structure.calendarView) supplied from envelope/config so TSX receives consistent state shape.
- **Engine mounts** — Pluggable engines (e.g. flow, timeline) mounted by system; TSX consumes via props or context.

**D) Palette contract**

- **Token injection method** — Envelope (or layout root) sets CSS variables from active palette so TSX that uses `var(--color-*)` automatically follows. No change required in TSX that already use vars.
- **CSS variable bridge** — Single contract: palette-store (or state) drives vars on a wrapper div; TSX stays var-based.
- **Optional palette wrapper** — A thin wrapper that applies usePaletteCSS or injects vars so TSX that does not call palette APIs still gets themed.

**E) Visibility rules**

- **Role** — Show/hide TSX root by user/role (e.g. from state or capability).
- **Depth** — Experience depth (e.g. which layer in a stack) so system can decide stacking.
- **Experience mode** — website / app / learning; envelope can switch shell or layout by experience.
- **Dev vs prod** — Which screens or overlays are available in dev only (e.g. diagnostics).

---

## 5. Contract Interface Spec (Standard TSX Contract)

Every TSX root **may optionally** accept the following props. The **system** (TSX Structure Layer) provides them; TSX can ignore or use.

**Do not implement.** This is the interface definition only.

```ts
// Optional: TSX roots can accept a "structure" envelope prop.
// The layer passes this when wrapping the component.

interface TSXStructureEnvelope {
  /** Layout: mount zone, size mode, docking, responsive mode. */
  layoutProfile?: string | LayoutProfileSpec;
  /** Palette: token set or CSS var scope id. */
  paletteProfile?: string | PaletteProfileSpec;
  /** Behavior: action hooks, state bindings, engine mounts. */
  behaviorProfile?: string | BehaviorProfileSpec;
  /** Visibility: role, depth, experience, dev-only. */
  visibilityProfile?: string | VisibilityProfileSpec;
  /** Feature flags: nav, toolbars, overlays, debug, side panels. */
  featureFlags?: TSXFeatureFlags;
}

interface LayoutProfileSpec {
  mountZone?: "main" | "modal" | "drawer" | "fullscreen";
  sizeMode?: "full-viewport" | "contained" | "max-width" | "responsive";
  docking?: { top?: number; bottom?: number; left?: number; right?: number };
  responsive?: Record<string, Partial<LayoutProfileSpec>>;
}

interface PaletteProfileSpec {
  tokenSet?: string;
  cssVarScope?: string;
  wrapper?: "none" | "vars" | "full"; // none = parent already set vars; vars = inject vars; full = usePaletteCSS wrapper
}

interface BehaviorProfileSpec {
  actionHooks?: Record<string, (payload: unknown) => void>;
  stateBindings?: Record<string, unknown>;
  engineMounts?: Record<string, React.ComponentType<any>>;
}

interface VisibilityProfileSpec {
  role?: string[];
  depth?: number;
  experience?: "website" | "app" | "learning";
  devOnly?: boolean;
}

interface TSXFeatureFlags {
  nav?: "show" | "hide" | "minimal";
  toolbars?: boolean;
  overlays?: "system" | "local" | "none";
  debugPanels?: boolean;
  sidePanels?: boolean;
}
```

**Resolution rule (design only):**  
Profiles can be resolved by **path pattern** (e.g. `HiClarify/*` → planner layout profile) or **default**. No registry of screen IDs; path or convention drives resolution. JSON or a single config file holds the map (e.g. `tsx-structure-profiles.json` keyed by path glob or default).

---

## 6. Planner-Specific Integration Strategy

### 6.1 How the Planner Owns Layout Today

- **JSX_PlannerShell** is the root when planner is shown (dev with `?screen=HiClarify/planner_screen` or API returning tsx-screen for that path).
- **UnifiedPlannerLayout** owns: sticky header, time axis wrap (sticky left), swipe container, panes (Day, Chunk, Week).
- **planner-timeline-constants.ts** is the single source for DAY_START_MIN, DAY_END_MIN, SLOT_MINUTES, SLOT_HEIGHT, TIMELINE_GRID_HEIGHT, blockToPosition.
- All dimensions and flex/grid are inline in TSX; no layout-store or template resolver.

### 6.2 What Can Be Externalized (Without Rewriting Planner)

- **Time scale** — DAY_START_MIN, DAY_END_MIN, SLOT_MINUTES, SLOT_HEIGHT (and thus TIMELINE_GRID_HEIGHT) could come from a “timeline profile” (JSON or state) so density and day range are system-controlled.
- **Density** — Slot height / total height as a preset (compact / default / spacious) driven by profile.
- **Axis visibility** — Show/hide time axis, or its width, from profile or feature flag.
- **Overlays** — Modals (slot options, folder picker, continue-after) could be moved to “system overlay” slot so planner only requests content; system owns positioning and z-index.
- **View modes** — Day / Week / Month (and Add) could remain TSX-owned; visibility of tabs or which view is default could come from profile.

### 6.3 “Timeline Engine” Concept (System-Controlled Wrapper)

- **Concept:** A **Timeline Engine** is a small system-owned layer that:
  - Reads **timeline profile** (time range, slot size, density, axis visibility) from JSON/state.
  - Renders a **wrapper** that provides: (1) CSS variables or context for grid height and slot scale, (2) optional time-axis slot (system-rendered or delegated to TimelineAxis with props), (3) a content slot where the existing planner TSX (UnifiedPlannerLayout / DayView / ChunkLayer) renders.
- **Not a rewrite:** Existing JSX_PlannerShell and children stay; they receive timeline config (e.g. TIMELINE_GRID_HEIGHT, blockToPosition) from the engine wrapper (props or context) instead of from a hardcoded constants file. Constants become the default when no profile is set.
- **Benefit:** Layout envelope (size, docking) and timeline behavior (scale, density, axis) become system-controlled; TSX remains the rendering and interaction owner.

---

## 7. Migration Strategy (Non-Destructive)

- **Phase 1 — Introduce layer only:** Add the TSX Structure Layer as a wrapper used by dev and (optionally) app when rendering a TSX screen. Resolve profiles by path pattern + default; pass envelope props. TSX that do not accept props are unchanged (wrapper still applies layout/palette at envelope).
- **Phase 2 — Connect palette:** Ensure envelope (or app layout) sets CSS variables from palette-store for the TSX mount point so all TSX that use `var(--color-*)` automatically follow theme. No TSX changes required for var-based screens.
- **Phase 3 — Layout envelope:** Use layoutProfile to set mount zone and size mode so TSX content is laid out inside system chrome (nav, toolbars). TSX can retain internal layout; only the outer envelope is system-controlled.
- **Phase 4 — Planner:** Introduce timeline profile (JSON/state) and optional Timeline Engine wrapper; feed existing planner with config from profile. Default to current constants so behavior is unchanged until profiles are added.
- **Phase 5 — Overlays and behavior:** Add overlay slot and action hooks so new screens can use system overlays and JSON-driven behavior; migrate existing modals/overlays incrementally where desired.

No big-bang rewrite; each phase is additive and backward-compatible.

---

## 8. Enforcement Strategy (Preventing Future Drift)

- **Convention over registration:** New TSX under apps-tsx is automatically wrapped by the TSX Structure Layer when loaded via existing resolution (AUTO_TSX_MAP + dev/app). No new screens need to “opt in” to the layer; the layer is the default mount for any TSX screen.
- **Single mount point:** All TSX screens are rendered through one code path (e.g. “TSXScreenWithEnvelope”) that applies layout profile, palette injection, and feature flags. No second path that renders raw TSX without envelope.
- **Profile defaults:** If no profile is found for a path, a default profile is used (e.g. full-viewport, vars palette, nav show). That keeps new TSX under control without adding config.
- **Lint / docs:** Optional: ESLint or docs rule that flags direct use of layout-store or palette tokens inside apps-tsx in a way that bypasses the envelope (e.g. hardcoded colors in screen roots). Guidance only; not blocking.
- **API contract:** Screen API continues to return tsx-screen marker; resolution of which component to load stays file-based. The only change is that the client always wraps the resolved component in the TSX Structure Layer before rendering.

---

## 9. Auto-Detection Model (How New TSX Files Get Governed Automatically)

- **Discovery:** Unchanged. `require.context("../01_App/apps-tsx", true, /\.tsx$/)` builds AUTO_TSX_MAP. API `collectTsxScreens()` walks TSX_ROOT. New .tsx files are picked up automatically.
- **Resolution:** Unchanged. `resolveTsxScreen(normalizedPath)` and API path-to-tsx resolution stay as today. No registry of “which screens get envelope”; all TSX screens do.
- **Profile resolution:** When mounting a TSX screen, the layer receives the **screen path** (e.g. `HiClarify/JSX_PlannerShell`, `tsx-screens/onboarding/david-onboarding`). Profile is resolved by:
  1. **Exact path** in a single config (e.g. tsx-structure-profiles.json or state-driven map).
  2. **Glob pattern** (e.g. `HiClarify/*` → planner profile, `tsx-screens/onboarding/*` → onboarding profile).
  3. **Default** — e.g. `layoutProfile: "default"`, `paletteProfile: "vars"`, `featureFlags: { nav: "show" }`.
- **No per-file edits:** Adding a new TSX screen is just adding a file under apps-tsx. It is discovered, resolved, and wrapped by the layer with the default profile (or a matching pattern if one is added to the config). No manual registry edit and no change to the new file required.

---

## 10. Summary

| Item | Approach |
|------|----------|
| **TSX system map** | All entry points under apps-tsx (and shells) classified as screen root, tool engine, layout owner, overlay injector, shell, or standalone; load paths (tsx:, API, dev/app) documented. |
| **Drift zones** | Layout-store, palette-store, JsonRenderer, ExperienceRenderer, behavior, visibility, registry, state defaults — each bypass or gap listed. |
| **Control gaps** | Single attachment point for TSX, per-TSX config without registry, overlay/chrome policy, planner externalization, main app TSX path handling. |
| **TSX Structure Layer** | Sits above TSX; provides layout envelope, palette contract, behavior hooks, visibility rules, feature flags; JSON/state driven; zero per-screen registry. |
| **Contract** | Optional props: layoutProfile, paletteProfile, behaviorProfile, visibilityProfile, featureFlags; resolution by path pattern or default. |
| **Planner** | Timeline Engine as system wrapper; externalize time scale, density, axis visibility, overlays; feed existing TSX via props/context; no rewrite. |
| **Migration** | Non-destructive phases: introduce layer → palette → layout envelope → planner timeline profile → overlays/behavior. |
| **Enforcement** | Convention (all TSX through one envelope), single mount point, default profile, optional lint/docs. |
| **Auto-detection** | Existing AUTO_TSX_MAP and API discovery; profile resolution by path/glob/default; new files governed by default. |

**End goal:** One universal governing layer so that TSX stays flexible, the system stays in control, and future screens auto-align without extra work.

---

*Document produced from repo scan and existing audits (PLANNER_RUNTIME_CONTROL_AUDIT.md, CONTROL-RESTORE-PLAN.md, SYSTEM_ALIGNMENT_AUDIT_ARTIFACT.md). No code was modified.*
