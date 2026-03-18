---
name: Kirsha Architecture Verify Audit
overview: "Read-only audit confirming the onboarding refactor to a single FlowEngine + JSON configs: engine inventory, Container Creations execution path, Business folder purity, duplicate engine detection, safety of moving wrappers, and final verdict with recommended structure."
todos: []
isProject: false
---

# Kirsha Verify Architecture — Audit Report (No Modifications)

## 1. Current architecture diagram

```mermaid
flowchart LR
  subgraph json [JSON configs]
    J5[ContainerCreationsLanding-5.json]
    J2[ContainerCreationsLanding-2.json]
  end
  subgraph api [API]
    API[/api/container-creations-landing-config]
  end
  subgraph runtime [Runtime / lib]
    FSW[FlowScreenWrapper]
    FE[FlowEngine]
  end
  subgraph business [Business Container_Creations]
    W[ContainerCreationsFlowWrapper]
    R[ContainerCreationsLanding-2.tsx re-export]
  end
  J5 --> API
  API --> FSW
  FSW --> FE
  W --> FSW
  R --> W
```



**Canonical path (navigator / dev):**  
Navigator selects `tsx:Business/Container_Creations/ContainerCreationsLanding-2` → [ContainerCreationsLanding-2.tsx](src/01_App/Business/Container_Creations/ContainerCreationsLanding-2.tsx) (re-export) → [ContainerCreationsFlowWrapper.tsx](src/01_App/Business/Container_Creations/ContainerCreationsFlowWrapper.tsx) → [FlowScreenWrapper](src/lib/flow-engine/FlowScreenWrapper.tsx) (fetches [API](src/app/api/container-creations-landing-config/route.ts)) → [FlowEngine](src/lib/flow-engine/FlowEngine.tsx) → UI.

**Note:** The user route [app/container-creations/page.tsx](src/app/container-creations/page.tsx) does **not** use FlowEngine. It uses `loadScreen("container-creations-landing")` → static `container-creations.landing.json` (JsonSkin) → ExperienceRenderer. So the **onboarding** flow (FlowEngine) is used when opening the screen via the dev navigator; the **public** `/container-creations` page is still the legacy JsonSkin path.

---

## 2. Engine verification

### Every onboarding / flow engine found


| Location                                                                                                                                       | Schema                          | Used by                                                                       | Status                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [src/lib/flow-engine/FlowEngine.tsx](src/lib/flow-engine/FlowEngine.tsx)                                                                       | FlowConfig `screens[]`          | FlowScreenWrapper → PrayerFlowWrapper (Prayer), ContainerCreationsFlowWrapper | **Canonical**                                                                   |
| [src/lib/flow-engine/FlowScreenWrapper.tsx](src/lib/flow-engine/FlowScreenWrapper.tsx)                                                         | Loads FlowConfig via API        | PrayerFlowWrapper, ContainerCreationsFlowWrapper                              | **Canonical** (loader)                                                          |
| [src/03_Runtime/engine/onboarding/OnboardingFlowRenderer.tsx](src/03_Runtime/engine/onboarding/OnboardingFlowRenderer.tsx)                     | `cards[]` (FlowDefinition)      | Only (dead) Tsx: OnboardingGeneratedScreen, SiteOnboardingScreen              | **Legacy**                                                                      |
| [src/03_Runtime/engine/onboarding/IntegrationFlowEngine.tsx](src/03_Runtime/engine/onboarding/IntegrationFlowEngine.tsx)                       | Card orchestration              | No live 01_App imports                                                        | **Legacy**                                                                      |
| [src/01_App/Business/Container_Creations/ContainerCreationsLanding.tsx](src/01_App/Business/Container_Creations/ContainerCreationsLanding.tsx) | JsonSkin (root/children)        | tsx-screen-resolver, dev page (explicit), screen-loader not used by this TSX  | **Legacy engine** (ExperienceRenderer pipeline)                                 |
| [src/01_App/Christian/Discipleship/GospelDiscipleship.tsx](src/01_App/Christian/Discipleship/GospelDiscipleship.tsx)                           | Local LandingConfig `screens[]` | tsx-screen-resolver, dev page                                                 | **Duplicate engine** (own currentScreenId, goNext, goBack, renderContentBlocks) |
| [src/01_App/Business/Prayer_Stream/PrayerStreamOnboarding.tsx](src/01_App/Business/Prayer_Stream/PrayerStreamOnboarding.tsx)                   | PrayerStreamConfig `screens[]`  | /api/screens discovery, dev                                                   | **Duplicate engine** (own stepper + renderScreen)                               |


**Support (not engines):** [src/lib/tsx-structure/engines/wizard.ts](src/lib/tsx-structure/engines/wizard.ts) (`useWizardConfig`) is a config normalizer used by FlowEngine and others; [src/01_App/Business/onboarding/FlowViewer.tsx](src/01_App/Business/onboarding/FlowViewer.tsx) uses flow-loader + EducationCard (different cards[] flow), not the screens[] FlowEngine.

**Confirmation:** The **canonical** onboarding engine for screens[] flows is [src/lib/flow-engine/FlowEngine.tsx](src/lib/flow-engine/FlowEngine.tsx). Container Creations onboarding **does** route through FlowScreenWrapper → FlowEngine. **But:** GospelDiscipleship and PrayerStreamOnboarding do **not** use FlowEngine; they implement their own stepper/layout logic. So “all onboarding flows” do **not** yet route through FlowScreenWrapper → FlowEngine; only Prayer (via PrayerFlowWrapper) and Container Creations (via ContainerCreationsFlowWrapper) do.

---

## 3. Container Creations flow — execution path

**Expected path:**  
JSON (ContainerCreationsLanding-5.json) → API (/api/container-creations-landing-config) → FlowScreenWrapper → FlowEngine → UI.

**Verified:**

- **ContainerCreationsLanding-2.tsx** — Contains **no** engine logic. It only re-exports the wrapper: `export { default } from "./ContainerCreationsFlowWrapper";` (9 lines). No stepper, no layout, no state.
- **ContainerCreationsFlowWrapper.tsx** — Renders only `<FlowScreenWrapper flowId="container-creations-landing-5" configUrl={CONFIG_URL} ... />`. No engine logic.
- **API** — [route.ts](src/app/api/container-creations-landing-config/route.ts) uses `default: "ContainerCreationsLanding-5.json"` and `FALLBACK_FILENAME = "ContainerCreationsLanding-5.json"`. CONFIG_DIR is `src/01_App/Business/Container_Creations`. So the **active default config** returned is ContainerCreationsLanding-5.json.

**Conclusion:** For the path that goes through the wrapper (navigator → ContainerCreationsLanding-2 → ContainerCreationsFlowWrapper), the runtime path is correct and JSON-driven via FlowEngine. The **user route** `/container-creations` is a separate path (JsonSkin + ExperienceRenderer) and is unchanged by this refactor.

---

## 4. Business folder purity — Container_Creations

**All TSX files in** [src/01_App/Business/Container_Creations](src/01_App/Business/Container_Creations):


| File                              | Role                                      | Wrapper vs engine                              | Safe to remove for “JSON-only business”?                                                            |
| --------------------------------- | ----------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ContainerCreationsFlowWrapper.tsx | Mounts FlowScreenWrapper with configUrl   | **Wrapper**                                    | No — needed so navigator has a TSX to resolve; could be moved to runtime and re-exported from here. |
| ContainerCreationsLanding-2.tsx   | Re-exports FlowWrapper                    | **Thin re-export**                             | No — needed for path `ContainerCreationsLanding-2`; could become re-export from runtime.            |
| ContainerCreationsWebsite.tsx     | Fetches contract, renders WebsiteTemplate | **Wrapper** (website contract, not onboarding) | No — different product (website screen); not onboarding.                                            |
| ContainerCreationsLanding.tsx     | JsonSkin + ExperienceRenderer             | **Engine** (legacy)                            | **Yes, if** retiring JsonSkin path and migrating /container-creations to FlowEngine.                |
| FlowViewer.tsx                    | Re-exports GlobalFlowViewer               | **Wrapper**                                    | Could move to shared onboarding layer; then this becomes re-export.                                 |
| FlowsIndex.tsx                    | Re-exports GlobalFlowsIndex               | **Wrapper**                                    | Same as above.                                                                                      |


**Ideal architecture:**  
Business module = **JSON only** (e.g. ContainerCreationsLanding-5.json, other configs).  
Runtime layer = **TSX wrappers + FlowEngine** (wrappers live in a shared runtime/onboarding or lib path; Business only holds JSON and optionally thin re-exports that point at the runtime wrapper so existing screen paths still resolve).

---

## 5. Duplicate engine detection

**Custom stepper / onboarding renderers / wizard components outside FlowEngine:**

- **GospelDiscipleship.tsx** — Own `currentScreenId`, `goNext`, `goBack`, `orderedScreens`, layout switch, `renderContentBlocks`. Same schema as FlowConfig screens[] but does not use FlowEngine. **Duplicate.**
- **PrayerStreamOnboarding.tsx** — Own config fetch, `currentScreenId`, `goNext`, `goBack`, `renderScreen`, `renderButtons`. **Duplicate.**
- **ContainerCreationsLanding.tsx** — JsonSkin pipeline (ExperienceRenderer, composeOfflineScreen, expandOrgansInDocument, etc.). **Legacy engine** (different schema; not FlowConfig).
- **OnboardingFlowRenderer.tsx** (03_Runtime) — cards[] schema; only used by (dead) screens. **Legacy**, not duplicate for screens[].
- **IntegrationFlowEngine.tsx** (03_Runtime + dead copies) — Card orchestration; no live Business usage. **Legacy.**

**Verdict:** Two **live duplicate onboarding engines** remain: GospelDiscipleship and PrayerStreamOnboarding. Container Creations no longer contains a duplicate; it uses FlowEngine.

---

## 6. Safety analysis — moving all Container_Creations TSX wrappers to a shared runtime/onboarding layer

**If we moved** ContainerCreationsFlowWrapper, ContainerCreationsLanding-2 (re-export), FlowViewer, FlowsIndex, and ContainerCreationsWebsite **to a shared path** (e.g. `src/lib/onboarding-wrappers/` or `src/03_Runtime/onboarding/`) **and** updated all references:


| Risk                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Screen resolution**    | **Would break** unless updated. Resolver and dev page use **paths under** `01_App/Business/Container_Creations/` (e.g. `Business/Container_Creations/ContainerCreationsLanding-2`). Those are filled by **require.context** (businessContext) and EXPLICIT_TSX_MAP. Moving files would remove them from businessContext; EXPLICIT_TSX_MAP and any AUTO_TSX_MAP keys would need to point to the new paths.                          |
| **Navigator discovery**  | **Would break** unless discovery is updated. [/api/screens](src/app/api/screens/route.ts) uses `collectGenericUnderRoot` on `01_App/Business` (and other roots). If TSX files leave `Container_Creations`, they no longer appear under Business in the index; either discovery must also scan the new runtime folder and emit the same path names, or path names change and all callers (layout, dev page) must use the new paths. |
| **API routes**           | **No break.** [/api/container-creations-landing-config](src/app/api/container-creations-landing-config/route.ts) only reads JSON from CONFIG_DIR (`src/01_App/Business/Container_Creations`). It does not import any TSX. Moving TSX does not affect the API.                                                                                                                                                                      |
| **FlowEngine execution** | **No break.** FlowEngine is invoked by FlowScreenWrapper; the wrapper’s **physical file location** does not affect execution. As long as the component that mounts FlowScreenWrapper is still rendered (at whatever path), FlowEngine runs the same.                                                                                                                                                                               |


**Safe approach to “wrappers in runtime”:** Keep **thin re-export files** in `Container_Creations` that only re-export from the shared layer (e.g. `export { default } from "@/lib/onboarding-wrappers/ContainerCreationsFlowWrapper"`). Then resolution and discovery stay unchanged; only the implementation moves.

---

## 7. Final verdict

- **Is the FlowEngine + JSON architecture correct?**  
**Yes.** For Container Creations onboarding, the design is correct: one canonical engine (FlowEngine), config from ContainerCreationsLanding-5.json via the API, and the Business module only has a thin wrapper and re-export—no engine logic in Business.
- **Is it safe to move all TSX wrappers out of Business modules?**  
**Yes, if** you keep thin re-exports in the Business folder so that existing screen paths (e.g. `Business/Container_Creations/ContainerCreationsLanding-2`) still resolve. Moving the **implementation** to a shared runtime/onboarding layer and re-exporting from Business does not break resolution, discovery, API, or FlowEngine.
- **Would that make the system more stable and duplicable for new businesses?**  
**Yes.** New businesses would add JSON (and optionally a one-line re-export in their folder pointing at the shared wrapper). All onboarding behavior stays in one place (FlowEngine + shared wrappers), and Business folders stay JSON-only plus minimal re-exports.

---

## 8. Recommended final folder structure (target state; no changes made in this audit)

- **JSON only in Business:**  
`src/01_App/Business/Container_Creations/` — Keep only JSON configs (e.g. ContainerCreationsLanding-5.json) and, if desired, content.ts or other data. No engine logic.
- **Thin re-exports in Business (for resolution):**  
Keep minimal TSX that only re-export from the runtime layer, e.g.  
`ContainerCreationsLanding-2.tsx` → `export { default } from "@/lib/onboarding-wrappers/ContainerCreationsFlowWrapper";`  
so that `Business/Container_Creations/ContainerCreationsLanding-2` continues to resolve without changing resolver or discovery.
- **Shared runtime layer:**  
e.g. `src/lib/onboarding-wrappers/` or `src/03_Runtime/onboarding/wrappers/` — ContainerCreationsFlowWrapper, and optionally other domain wrappers (PrayerFlowWrapper stays in Prayer). FlowEngine remains in [src/lib/flow-engine/](src/lib/flow-engine/).
- **API and discovery:**  
Keep API reading JSON from Business (or a dedicated config root). Discovery can keep scanning 01_App so that re-export TSX files still appear under Business; no need to scan the shared layer for path names if re-exports are used.

This report is audit-only; no files were moved, deleted, or modified.