# Onboarding Engine Audit and Safe Consolidation Plan

**Status:** Report and plan only. No files have been moved, deleted, or modified.

---

## 1. Complete list of onboarding/wizard engines

### 1.1 Universal engines (shared library)

| File path | Schema | Dependents | Status |
|-----------|--------|------------|--------|
| `src/lib/flow-engine/FlowEngine.tsx` | **FlowConfig**: `screens[]` (id, stepLabel, layout, content, media, buttons, nextScreenId, lightTheme). Layouts: hero, stamped, twoCol, twoColImageLeft, textOnly. stepTracker, header, shopUrl. | FlowScreenWrapper → PrayerFlowWrapper → PrayerApp (onboarding). | **Canonical** for screens[]-style wizard flows. |
| `src/lib/flow-engine/FlowScreenWrapper.tsx` | Same (fetches FlowConfig from `/api/flows/[flowId]` or `configUrl`). | PrayerFlowWrapper; any future domain wrapper that uses FlowEngine. | **Canonical** (loader for FlowEngine). |
| `src/lib/flow-engine/flowActionRegistry.ts` | N/A (action dispatch). | PrayerFlowWrapper (registers openPrayerRoom, navigate, showReplay). FlowScreenWrapper calls runFlowAction in onAction. | **Canonical**. |
| `src/lib/flow-engine/types.ts` | FlowConfig, FlowScreen, FlowButtonBlock, FlowMediaBlock, FlowStepTracker, FlowHeader, FlowActionContext. | FlowEngine, FlowScreenWrapper, Prayer flow config API. | **Canonical**. |
| `src/03_Runtime/engine/onboarding/OnboardingFlowRenderer.tsx` | **FlowDefinition**: `cards[]` (FlowNode: id, type, title, content, engineIds). Types: calculator, education, summary, websiteBlock. | (dead) OnboardingGeneratedScreen, (dead) SiteOnboardingScreen, (dead) _template_OnboardingGeneratedScreen. | **Legacy**. Used only by dead/generated onboarding screens. |
| `src/03_Runtime/engine/onboarding/IntegrationFlowEngine.tsx` | **Card-based session**: FlowDecision, CARD_REGISTRY (calculator, education, summary). Not screens[]; orchestration of multiple card types. | No live imports found in 01_App. | **Legacy/experimental**. |

### 1.2 Business/module-local “engines” (duplicated logic)

| File path | Schema | Dependents | Status |
|-----------|--------|------------|--------|
| `src/01_App/Business/Container_Creations/ContainerCreationsLanding-2.tsx` | **LandingConfig** (local type): shopUrl, header, stepTracker, **screens[]**. Same shape as FlowConfig plus: inlineControls[], dynamicSummary. | `/api/container-creations-landing-config` (serves JSON); tsx-structure convention; OnboardingEditorToggle; collectGenericUnderRoot (/api/screens); dev AUTO_TSX_MAP. | **Duplicate engine**. Does not use FlowEngine; implements its own stepper, layouts, and renderContentBlocks. |
| `src/01_App/Business/Container_Creations/ContainerCreationsLanding.tsx` | **JsonSkin document** (root/children from `container-creations.landing.json`). | screen-loader special case `container-creations-landing` (static import from 05_Logic); tsx-screen-resolver; app/dev page EXPLICIT_TSX_MAP; layout.tsx isOnboardingTsx. | **Legacy**. Different pipeline: ExperienceRenderer + composeOfflineScreen + JsonSkin. |
| `src/01_App/Business/Prayer_Stream/PrayerStreamOnboarding.tsx` | **PrayerStreamConfig**: stepTracker?, **screens[]** (welcome, play, reflection, complete). | CONFIG_URL `/api/prayer-stream-config`; /api/screens discovery; dev AUTO_TSX_MAP. | **Duplicate engine**. Own stepper and renderScreen; does not use FlowEngine. |
| `src/01_App/Christian/Discipleship/GospelDiscipleship.tsx` | **LandingConfig** (local type, “same schema as ContainerCreationsLanding-2”): screens[]. | Static import `gospel.json`; registerJsonScreen; tsx-screen-resolver; app/dev page EXPLICIT_TSX_MAP. | **Duplicate engine**. Own stepper and layouts; does not use FlowEngine. |
| `src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx` | Minimal wrapper; useWizardConfig only, no screens[] load. | OsbHomeV2; (dead). | **Legacy**. |

### 1.3 Supporting / non-engine

- `src/lib/tsx-structure/engines/wizard.ts` — useWizardConfig (structure config). Used by FlowEngine, FlowViewer, ContainerCreationsLanding-2, PrayerStreamOnboarding, GospelDiscipleship, HiClarifyOnboarding. Not an onboarding engine; support only.
- `src/01_App/Business/onboarding/FlowViewer.tsx` — Uses flow-loader (EducationFlow), applyEngine, EducationCard; **cards[]**-style flow selection. Different from FlowEngine (screens[]). Uses useWizardConfig for chrome only.
- `src/01_App/Business/onboarding/flows-index.tsx` — Lists flows from `/api/flows/list`; navigates to FlowViewer. Wrapper/orchestration.
- `src/01_App/Business/Container_Creations/FlowsIndex.tsx` — Wrapper that re-exports global flows-index.
- `src/01_App/Business/Container_Creations/FlowViewer.tsx` — Wrapper that re-exports global FlowViewer.

---

## 2. Per-engine report (schema, dependents, legacy/canonical)

### FlowEngine + FlowScreenWrapper (lib/flow-engine)

- **Schema:** FlowConfig with **screens[]**. FlowScreen: id, stepLabel, layout (hero | stamped | twoCol | twoColImageLeft | textOnly), title, subtitle, content (LandingContentBlock[]), media, buttons (link | goto | next | back | action), nextScreenId, lightTheme. FlowConfig also: stepTracker, header, shopUrl.
- **Dependents:** PrayerFlowWrapper → FlowScreenWrapper → FlowEngine. Prayer onboarding uses configUrl `/api/prayer-flow-config` (returns FlowConfig).
- **Status:** **Canonical.** Single reusable wizard engine for screens[] flows; domain wrappers only register actions and pass config URL.

### OnboardingFlowRenderer (03_Runtime/engine/onboarding)

- **Schema:** **cards[]** (FlowDefinition). FlowNode: id, type (calculator | education | summary | websiteBlock), title, content, engineIds.
- **Dependents:** Only (dead) Tsx: OnboardingGeneratedScreen, SiteOnboardingScreen, _template_OnboardingGeneratedScreen.
- **Status:** **Legacy.** No live app route or 01_App module depends on it. Cards-based model is separate from screens[].

### ContainerCreationsLanding-2.tsx

- **Schema:** Local **LandingConfig**: shopUrl, header, stepTracker, **screens[]**. Screen has optional inlineControls (containerLength, roofRibHeight, ventFitVerified, ventCount, orderSizeConfirmed) and dynamicSummary.
- **Dependents:**
  - **Config:** `/api/container-creations-landing-config` (reads `ContainerCreationsLanding-2.json` from Container_Creations folder; variants v1–v3, fallback -2.json).
  - **Discovery:** /api/screens (collectGenericUnderRoot) lists Business/Container_Creations TSX/JSON; path `tsx:Business/Container_Creations/ContainerCreationsLanding-2` resolves via AUTO_TSX_MAP in tsx-screen-resolver and app/dev/page (businessContext).
  - **Dev UI:** OnboardingEditorToggle shows when screen is ContainerCreationsLanding-2; convention.ts marks it as wizard; registerJsonScreen + DevNodePanel for node order/edit.
  - **References:** convert-landing-config-to-json-skin (LandingConfig → json-skin); GospelDiscipleship comment “same schema as ContainerCreationsLanding-2”; DevNavigationPanel step options.
- **Status:** **Duplicate engine.** Implements full wizard (fetch config → currentScreenId, goNext, goBack, layouts, renderContentBlocks, stepTracker, inline controls, dynamic summary) inside a Business module. Does not use FlowEngine.

### ContainerCreationsLanding.tsx

- **Schema:** JsonSkin (root/children from `container-creations.landing.json` in 05_Logic/logic/content/landing). Composed via expandOrgansInDocument, applySkinBindings, composeOfflineScreen → ExperienceRenderer.
- **Dependents:** screen-loader special case `container-creations-landing` (static import); app/dev EXPLICIT_TSX_MAP; tsx-screen-resolver; layout isOnboardingTsx.
- **Status:** **Legacy.** Different pipeline (JsonSkin/ExperienceRenderer). User route `/container-creations` does not use this TSX; it uses loadScreen("container-creations-landing") in container-creations/page.tsx and the same JsonSkin JSON.

### PrayerStreamOnboarding.tsx

- **Schema:** **screens[]** (PrayerStreamConfig); layouts welcome, play, reflection, complete. Fetches from `/api/prayer-stream-config`.
- **Dependents:** /api/screens; dev navigator (AUTO_TSX_MAP).
- **Status:** **Duplicate engine.** Own stepper and renderScreen; does not use FlowEngine.

### GospelDiscipleship.tsx

- **Schema:** **screens[]** (LandingConfig, same as ContainerCreationsLanding-2). Config from static import `gospel.json`.
- **Dependents:** tsx-screen-resolver; app/dev EXPLICIT_TSX_MAP; registerJsonScreen.
- **Status:** **Duplicate engine.** Own stepper and layouts; does not use FlowEngine.

---

## 3. Trace: ContainerCreationsLanding-2

### What engine or pipeline it uses

- **It does not use FlowEngine or FlowScreenWrapper.** It implements its own engine inline:
  - Fetches JSON from `CONFIG_URL = "/api/container-creations-landing-config"` (GET, optional `?variant=...`).
  - API reads from `src/01_App/Business/Container_Creations/ContainerCreationsLanding-2.json` (default) or variant files, returns LandingConfig.
  - Component state: config, currentScreenId, stepInputs (for inlineControls), failedMedia.
  - Navigation: goToScreen(id), goNext(), goBack() over orderedScreens (with node-order override from dev store).
  - Renders: stepTracker aside, current screen only (orderedScreens.map(… currentScreenId === screen.id)); layouts hero, stamped, twoCol, twoColImageLeft, textOnly; all content via renderContentBlocks(screen.content, …); buttons (link, goto, next, back); inline controls (InlineSelect, InlineNumberInput, InlineCheckbox) when screen.inlineControls present; dynamic summary when screen.dynamicSummary.
  - Dev: registerJsonScreen(canonicalKey, config, setConfig); getOverride(canonicalKey) for node order; InlineEditableText in editor mode.

### How it loads JSON

- **Client fetch** to `/api/container-creations-landing-config` (no flowId; variant optional). Server reads from CONFIG_DIR (Container_Creations) and VARIANTS/FALLBACK_FILENAME (default ContainerCreationsLanding-2.json).

### Modules and features that depend on it

- **Config API:** `src/app/api/container-creations-landing-config/route.ts` (serves ContainerCreationsLanding-2.json and variants).
- **Discovery:** /api/screens (collectGenericUnderRoot) so the screen appears under Business → Container_Creations in the navigator.
- **Resolution:** Resolved as TSX via businessContext in tsx-screen-resolver and app/dev/page (path `Business/Container_Creations/ContainerCreationsLanding-2`).
- **Dev tools:** OnboardingEditorToggle (shows for this screen); convention.ts (wizard structure); registerJsonScreen + DevNodePanel (node list and edit).
- **Logic:** convert-landing-config-to-json-skin (LandingConfig → json-skin).
- **Docs/comments:** GospelDiscipleship, DevNavigationPanel, nav-instrumentation.

**User-facing route:** The route `src/app/container-creations/page.tsx` (e.g. learn.ContainerCreations.com) does **not** use ContainerCreationsLanding-2. It uses loadScreen("container-creations-landing") → static `container-creations.landing.json` → ExperienceRenderer (JsonSkin). So ContainerCreationsLanding-2 is **dev/build-time and navigator-only** for the wizard flow; the live site uses the JsonSkin path.

---

## 4. Intended architecture going forward

- **Canonical onboarding/wizard engine for screens[] flows:** `src/lib/flow-engine/FlowEngine.tsx` plus `FlowScreenWrapper.tsx` and `flowActionRegistry.ts`. JSON = FlowConfig (screens[], stepTracker, header, shopUrl). Domain modules must not contain engine logic; they provide:
  - A **wrapper** (e.g. ContainerCreationsFlowWrapper) that registers any domain actions and passes flowId or configUrl to FlowScreenWrapper.
  - **JSON-only** flow definitions (e.g. ContainerCreationsLanding-5.json) served by an API (e.g. `/api/container-creations-landing-config` or `/api/flows/container-creations-landing`) in FlowConfig shape.
- **Legacy:** OnboardingFlowRenderer (cards[]) and IntegrationFlowEngine remain for dead/experimental code only; no new dependents.
- **User route:** Deciding whether the public `/container-creations` page should stay JsonSkin (container-creations.landing.json) or switch to the same FlowConfig (e.g. ContainerCreationsLanding-5.json) rendered by FlowEngine is a product decision; the consolidation plan below assumes moving to one JSON source of truth (ContainerCreationsLanding-5.json) and FlowEngine for both dev and user route where applicable.

---

## 5. Safe refactor plan (no changes yet)

### Phase A: Prepare canonical engine and config

1. **Extend FlowConfig/FlowEngine (if needed) for Container Creations**
   - **Audit:** FlowEngine has hero, stamped, twoCol, twoColImageLeft, textOnly and stepTracker. ContainerCreationsLanding-2 adds **inlineControls** (containerLength, roofRibHeight, ventFitVerified, ventCount, orderSizeConfirmed) and **dynamicSummary** (computed recommendation text).
   - **Options:** (a) Add optional `inlineControls` and `dynamicSummary` to FlowScreen in types.ts and render them in FlowEngine (generic or CC-specific placeholders); or (b) model as flow actions (e.g. “setContainerLength”) and let a wrapper or a small shared “inline control” helper render them. Document decision before code change.
   - **Step:** Implement the chosen option in `src/lib/flow-engine` only. No changes to Business modules yet.

2. **Introduce ContainerCreationsLanding-5.json**
   - **Step:** Add `src/01_App/Business/Container_Creations/ContainerCreationsLanding-5.json` with content equivalent to current ContainerCreationsLanding-2.json, in **FlowConfig** shape (id, stepTracker, header, shopUrl, screens[]). Ensure schema matches lib/flow-engine/types (and any new optional fields from step 1). Do not remove ContainerCreationsLanding-2.json yet.

3. **API to serve FlowConfig for Container Creations**
   - **Option A:** Point `/api/container-creations-landing-config` default/variant to serve ContainerCreationsLanding-5.json (and add variant key for -5 if needed). Response must be valid FlowConfig.
   - **Option B:** Add `/api/flows/container-creations-landing` that reads ContainerCreationsLanding-5.json and returns it. Then Container Creations wrapper uses flowId + this route or configUrl.
   - **Step:** Implement one option so that FlowScreenWrapper (or a wrapper) can load Container Creations flow from JSON only. Verify with a minimal wrapper that renders FlowEngine with this config.

### Phase B: Container_Creations uses only JSON and canonical engine

4. **Add Container Creations domain wrapper (no engine logic)**
   - **Step:** Create `src/01_App/Business/Container_Creations/ContainerCreationsFlowWrapper.tsx` (or equivalent name). It should:
     - Register any Container Creations–specific flow actions (if needed) via flowActionRegistry.
     - Render `<FlowScreenWrapper flowId="container-creations-landing" configUrl="/api/container-creations-landing-config" />` (or use the new /api/flows/... route). Pass actionContext (e.g. basePath for links).
   - Do not copy stepper, layouts, or renderContentBlocks from ContainerCreationsLanding-2 into the wrapper.

5. **Wire navigator and dev to wrapper (or FlowEngine path)**
   - **Step:** Update screen resolution so that the “Container Creations landing” entry in the dev navigator and /api/screens resolves to the new wrapper (or a thin TSX that only mounts the wrapper). Options:
     - Add an explicit TSX screen (e.g. ContainerCreationsLanding) that only mounts ContainerCreationsFlowWrapper and point discovery to it; or
     - Keep a single “Container Creations onboarding” screen key that resolves to the wrapper.
   - Ensure OnboardingEditorToggle and convention still apply if they are keyed by screen path; update path/key if the screen name changes.

6. **Retire ContainerCreationsLanding-2.tsx as engine**
   - **Step:** Remove or redirect all usages of the component ContainerCreationsLanding-2 so that nothing imports or resolves it as the main engine. Options:
     - Delete the file only after step 5 is verified and no remaining references (or replace its export with the new wrapper).
     - Or keep the file as a one-line re-export of the wrapper and deprecate the name.
   - **Step:** Update tsx-structure convention and OnboardingEditorToggle to reference the new screen path if it changed.

7. **Rename/config to single config file**
   - **Step:** In `/api/container-creations-landing-config`, make the default and fallback filename `ContainerCreationsLanding-5.json`. Optionally remove variant keys that pointed to -2.json. Do not delete ContainerCreationsLanding-2.json until all consumers are off it (or archive it in a non-serving location).

### Phase C: Cleanup and legacy

8. **ContainerCreationsLanding.tsx (JsonSkin)**
   - **Step:** Decide whether the user route `/container-creations` should use FlowEngine + ContainerCreationsLanding-5.json or keep JsonSkin. If FlowEngine: change container-creations/page.tsx to render the Container Creations wrapper (or FlowScreenWrapper with configUrl) instead of loadScreen("container-creations-landing") + ExperienceRenderer. If keeping JsonSkin: leave ContainerCreationsLanding.tsx and screen-loader special case as-is for now.
   - If migrating user route to FlowEngine: remove or narrow the screen-loader special case for "container-creations-landing" once the page no longer uses it.

9. **Other duplicate engines (out of scope for this plan but for consistency)**
   - **PrayerStreamOnboarding.tsx:** Later refactor to use FlowScreenWrapper + `/api/prayer-stream-config` (return FlowConfig). Remove local stepper/layouts.
   - **GospelDiscipleship.tsx:** Later refactor to use FlowScreenWrapper + a FlowConfig source (e.g. static import or API). Remove local stepper/layouts.
   - No changes in this consolidation to Prayer or GospelDiscipleship; only document as future work.

10. **Legacy engines**
    - Leave OnboardingFlowRenderer and IntegrationFlowEngine in place; no new dependents. Do not delete (dead code may still be referenced).

### Phase D: Verification

11. **Verification steps**
    - Confirm /api/screens still lists Container_Creations and that selecting the Container Creations onboarding screen loads the wrapper and shows the flow from ContainerCreationsLanding-5.json.
    - Confirm dev tools (OnboardingEditorToggle, node order, registerJsonScreen) work with the new screen path if it changed.
    - Confirm user route (if migrated) serves the same flow from ContainerCreationsLanding-5.json.
    - Confirm no remaining imports of ContainerCreationsLanding-2 as the main engine.

---

## 6. Summary

- **Canonical engine:** `src/lib/flow-engine/FlowEngine.tsx` (and FlowScreenWrapper + flowActionRegistry). Schema: FlowConfig with **screens[]**.
- **ContainerCreationsLanding-2** currently uses **no shared engine**; it is a **duplicate engine** in a Business module (own fetch, state, stepper, layouts, renderContentBlocks, inline controls, dynamic summary).
- **Intended architecture:** One FlowConfig JSON (ContainerCreationsLanding-5.json), served by API; one domain wrapper in Container_Creations that only registers actions and renders FlowScreenWrapper; no engine logic in Business modules.
- **Safe consolidation:** Add ContainerCreationsLanding-5.json and API behavior; extend FlowEngine if needed for inlineControls/dynamicSummary; add ContainerCreationsFlowWrapper; point discovery and resolution to the wrapper; retire ContainerCreationsLanding-2.tsx as engine; optionally migrate /container-creations page to FlowEngine; leave other duplicate engines (PrayerStream, GospelDiscipleship) and legacy engines (OnboardingFlowRenderer, IntegrationFlowEngine) for later or as-is.
