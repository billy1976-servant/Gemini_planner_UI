---
name: Template V2 TSX Refactor
overview: "Refactor all live TSX screens under `src/01_App/(live) Business` to Template V2: dumb templates with local `content.ts`, no hardcoded strings, no router.push/dispatchState, Director/envelope-driven layout and experience. Container_Creations is the canonical example; WebsiteTemplate loses EXPERIENCE_LAYOUT in favor of envelope/profile. .cursor rules are updated to enforce these laws."
todos: []
isProject: false
---

# Plan V2 — TSX Template Discipline Refactor

## Scope (what is and is not changed)

**In scope (live TSX only):**

- [Container_Creations/ContainerCreationsWebsite.tsx](src/01_App/(live) Business/Container_Creations/ContainerCreationsWebsite.tsx)
- [shopify/Shopify_Intelligence.tsx](src/01_App/(live) Business/shopify/Shopify_Intelligence.tsx)
- [onboarding/flows-index.tsx](src/01_App/(live) Business/onboarding/flows-index.tsx)
- [onboarding/FlowViewer.tsx](src/01_App/(live) Business/onboarding/FlowViewer.tsx)
- [WebsiteTemplate.tsx](src/04_Presentation/components/organs/tsx/website/WebsiteTemplate.tsx) (remove EXPERIENCE_LAYOUT; layout from envelope)

**Out of scope:** Container_Creations/FlowsIndex.tsx and FlowViewer.tsx are thin wrappers that re-export onboarding screens; no new content file for wrappers. No changes to state engine, behavior bridge, layout engine, blueprint/content contracts, or schema/verbs/molecules.

**Unchanged systems:** [behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts) (navigate contract: `detail.to`), [getDefaultTsxEnvelopeProfile.ts](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts), [TSXScreenWithEnvelope.tsx](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx).

---

## 1. File and folder plan


| Action     | Path                                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Create** | `src/01_App/(live) Business/Container_Creations/content.ts`                                                                                                      |
| **Create** | `src/01_App/(live) Business/shopify/content.ts`                                                                                                                  |
| **Create** | `src/01_App/(live) Business/onboarding/content.ts` (exports for both flows-index and FlowViewer)                                                                 |
| **Edit**   | `Container_Creations/ContainerCreationsWebsite.tsx`                                                                                                              |
| **Edit**   | `shopify/Shopify_Intelligence.tsx`                                                                                                                               |
| **Edit**   | `onboarding/flows-index.tsx`                                                                                                                                     |
| **Edit**   | `onboarding/FlowViewer.tsx`                                                                                                                                      |
| **Edit**   | `04_Presentation/components/organs/tsx/website/WebsiteTemplate.tsx`                                                                                              |
| **Edit**   | `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx` (optional: pass `screenPath`, `experience` in structureProps so templates do not use useSearchParams/getState) |


No file moves; only new content files and edits.

---

## 2. Per-screen diff preview and content shape

### 2.1 Container_Creations (canonical)

**New `content.ts`:**

- `defaultScreenPath`: default TSX path (e.g. `tsx:(live) Business/Container_Creations/ContainerCreationsWebsite`).
- `apiContractPath`: `/api/sites/containercreations/contract`.
- `labels`: `{ loading: "Loading…", error: "Error" }` (and any other UI strings used in the template).

**ContainerCreationsWebsite.tsx changes:**

- **Remove:** `getState`, `subscribeState`, `dispatchState`; `useSearchParams` for default screen path; direct palette sync after fetch.
- **Add:** Import content from `./content`. Accept `screenPath`, `experience`, and optionally `contract` from props (envelope passes them via extended structureProps).
- **Logic:** If contract is passed in from envelope, render `WebsiteTemplate` only. If not, keep a single fetch in a minimal wrapper that (1) fetches from `content.apiContractPath`, (2) applies palette via a callback or side-channel provided by envelope (not dispatchState), and (3) passes contract + screenPath + experience to the presentational component. Palette sync: move to envelope or a small hook used only by the wrapper (e.g. envelope subscribes to “website contract” screens and calls an allowed setState for palette when contract is loaded).
- **Result:** Default export can remain a thin wrapper that fetches and passes props; the “template” is the presentational component that receives contract, screenPath, experience and uses content for any remaining strings.

**WebsiteTemplate (Container_Creations canonical):**

- **Remove:** `EXPERIENCE_LAYOUT` map and any experience-based layout branching inside the component.
- **Consume:** Layout style (maxWidth, padding, margin) from props: e.g. `layoutStyle?: React.CSSProperties` provided by envelope. Envelope already has `getLayoutStyles(profile.layout)`; that drives outer containment. For the inner content area, profile or [getDefaultTsxEnvelopeProfile](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts) can expose an optional `contentAreaStyle` per layout mode (or we derive from existing layout modes). WebsiteTemplate then uses `layoutStyle ?? defaultContentStyle` and no longer reads `experience` to pick layout.
- **Experience:** Still receive `experience` as prop for `data-tsx-experience` and class only; layout decisions come from envelope/profile, not from a local EXPERIENCE_LAYOUT map.

---

### 2.2 Shopify_Intelligence

**New `content.ts`:**

- `title`: `"Shopify Intelligence"`.
- `apiPath`: `/api/shopify-intelligence`.
- `fallbackShop`: `"hiclarify-dev.myshopify.com"`.
- `labels`: `loading`, `error`, `installAuthorize`, `totalRevenue`, `revenueVelocity`, `topSKUs`, `sku`, `revenue`, `units`, `noSkuData`, `healthScore`, `suggestedAction`.

**TSX changes:**

- Replace every literal string with `content.*` (or `content.labels.*`).
- Use Director primitives where applicable: e.g. `useDirector()` and `layoutDensity`, `variant` for section/card density and variant; keep styling via `var(--color-*)`, `var(--spacing-*)`.
- No router or dispatchState; no new navigation in this screen.

---

### 2.3 onboarding/flows-index

**New `onboarding/content.ts`** (shared with FlowViewer):

- `flowsIndex`: `{ title, loadingFlows, noFlowsFound, openFlow, returnToMain, selectFlowAria, viewerScreenPath, projectFilterKey }`.
- `flowViewer`: `{ returnToMain, returnPath, loadingFlows, noFlowsFound, ... }` (see below).

**flows-index.tsx changes:**

- **Remove:** `useRouter`; all `router.push(...)` calls; literal `"Container_Creations"`; literal `ENGINE_VIEWER_SCREEN_PATH`.
- **Add:** `import content from "./content"` (or `content.flowsIndex`). Use `content.flowsIndex.viewerScreenPath`, `content.flowsIndex.projectFilterKey`, etc.
- **Navigation:** Replace `router.push(\`/dev?${params})`with:`window.dispatchEvent(new CustomEvent("navigate", { detail: { to: /dev?${params.toString()} } }));`The dev layout’s [installBehaviorListener](src/app/layout.tsx) currently does`router.replace(/dev?screen=${encodeURIComponent(to)})`. So if` to`is the full URL`/dev?screen=...&flow=...`, the listener must treat full URLs: e.g. if` to.startsWith("/")`then`router.replace(to)`, else` router.replace(/dev?screen=${encodeURIComponent(to)})`. **Small contract extension** in layout’s navigate callback to support` to` as full path when needed.
- **Return:** Replace `router.push("/")` with `CustomEvent("navigate", { detail: { to: content.flowsIndex.homePath ?? "/" } })`. If home is always `/`, same; if later configurable, it lives in content.

---

### 2.4 onboarding/FlowViewer

**Content (in same `onboarding/content.ts`):**

- `flowViewer`: `returnPath` (e.g. `tsx:(live) Business/onboarding/flows-index`), `returnToMain`, `loadingFlows`, `noFlowsFound`, `selectFlow`, `selectEngine`, and all other UI strings (e.g. “Why this next step?”, “Copy Debug JSON”, “Ordered Steps (from EngineState)”, status labels, etc.).

**FlowViewer.tsx changes:**

- **Remove:** `useRouter`; all `router.push(...)` (flow/engine query updates and return to flows-index).
- **Add:** Import content from `./content`; replace every user-facing string with `content.flowViewer.*`.
- **Navigation:** For flow/engine changes: build `?flow=...&engine=...` and dispatch `CustomEvent("navigate", { detail: { to: \`/dev?screen=...&flow=...&engine=... } })`(or pass screen path + query and let listener build URL if we extend it). For “Return to main screen”:`CustomEvent("navigate", { detail: { to: content.flowViewer.returnPath } })`(listener will do`/dev?screen=...` for that path).
- **Keep:** Engine bridge (`setEngineFlow`, `subscribeEngineState`, `setCurrentEngine`), EducationCard, and all debug/explain panels; only navigation and literals change.

---

## 3. Envelope and layout wiring (Container_Creations + WebsiteTemplate)

- **TSXScreenWithEnvelope:** Optionally extend `structureProps` with `screenPath` and `experience` (already available inside the envelope) so that screens that need them do not use `useSearchParams` or `getState`. Component signature becomes `(props) => { screenPath, experience } = props; ... }`.
- **Palette sync:** Remove `dispatchState("state.update", { key: "paletteName", value })` from ContainerCreationsWebsite. Options: (1) Envelope, when it detects a “website contract” screen (e.g. by structureConfig or screenPath), fetches the contract and applies palette via existing `applyPaletteToElement` + palette-store setter used only by envelope; or (2) a small non-template hook used by the wrapper that calls a dedicated “set palette from contract” API that the envelope provides. Template itself must not call dispatchState.
- **WebsiteTemplate:** Receive `layoutStyle?: React.CSSProperties` from parent (envelope or ContainerCreationsWebsite wrapper). Parent gets layout from profile (e.g. map `profile.layout` to content-area style: full-viewport → no maxWidth; max-width → min(800px, 100%); contained → padding). Remove EXPERIENCE_LAYOUT from [WebsiteTemplate.tsx](src/04_Presentation/components/organs/tsx/website/WebsiteTemplate.tsx); use `layoutStyle` from props with a safe default.

---

## 4. Behavior listener and “navigate” contract

- **Current:** [behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts) listens for `navigate` with `detail.to` (or `screenId`/`target`) and calls `navigate(destination)`.
- **Layout:** [layout.tsx](src/app/layout.tsx) installs `navigate((to) => router.replace(\`/dev?screen=${encodeURIComponent(to)}))`.
- **Change:** In the same layout callback, support full paths: if `to.startsWith("/")` then `router.replace(to)`, else keep `router.replace(\`/dev?screen=${encodeURIComponent(to)})`. This allows flows-index “return home” and FlowViewer “return to flows-index” to use a single CustomEvent("navigate") contract.

---

## 5. .cursor rule additions

Add and reference the following (aligned with [FULL_SYSTEM_ANALYSIS_TSX_TEMPLATES.md](FULL_SYSTEM_ANALYSIS_TSX_TEMPLATES.md) §G).

**5.1 New file: `.cursor/rules/CONTENT_AND_PRESENTATION.md`**

- Website = presentation of structured content only; no separate website subsystem.
- Blueprint and content contracts are truth; TSX consumes them, does not define schema.
- TSX is template only: no router.push, no dispatchState; use behavior bridge (CustomEvent `navigate` or action `navigate`).
- No hardcoded content in TSX: titles, labels, API paths, screen paths from config/structure/content.
- One state engine, one behavior bridge, one layout engine.

**5.2 Edits to [.cursor/rules/TSX_BUILD_SYSTEM.md](.cursor/rules/TSX_BUILD_SYSTEM.md)**

- After “1. CORE PRINCIPLE” table: add bullet “Website = presentation” and “No direct router/state in TSX” (use behavior bridge).
- Under “TSX must NOT”: add “Call router.push, dispatchState, or any mutating state/navigate API; use behavior bridge.”
- Under “TSX must”: add “No hardcoded content: titles, labels, API paths, screen paths from structureConfig/config/content.”

**5.3 Edits to [.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md](.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md)**

- After “What the engine is”: add “Compiled structure / blueprint-content is truth”; TSX consumes; no router.push; no hardcoded content.
- In “How new screens plug in”: add “Navigation: behavior bridge only. Content: from config/structure.”

**5.4 Edits to [.cursor/rules/TSX_CREATION_CHECKLIST.md](.cursor/rules/TSX_CREATION_CHECKLIST.md)**

- In “5. Avoid layout hardcoding”: add checkbox “No router.push or dispatchState; no hardcoded screen paths, feature names, or content; use config/structure.”
- In Quick reference table: add rows for “Navigation / state” and “Content” (behavior bridge only; no hardcoded content).
- Add reference to CONTENT_AND_PRESENTATION.md.

---

## 6. Compliance checklist (confirmation)

After implementation, each live TSX screen will satisfy:


| Rule                                                     | ContainerCreationsWebsite | Shopify_Intelligence | flows-index                 | FlowViewer |
| -------------------------------------------------------- | ------------------------- | -------------------- | --------------------------- | ---------- |
| Dumb template (or thin wrapper + template)               | Yes                       | Yes                  | Yes                         | Yes        |
| Local content.ts (or shared in same folder)              | Yes                       | Yes                  | Yes (onboarding/content.ts) | Yes        |
| No hardcoded strings                                     | Yes                       | Yes                  | Yes                         | Yes        |
| No router.push                                           | Yes                       | Yes                  | Yes                         | Yes        |
| No dispatchState                                         | Yes                       | N/A                  | Yes                         | Yes        |
| Director primitives / envelope for layout and experience | Yes                       | Yes                  | Yes                         | Yes        |
| Experience/layout from envelope or props only            | Yes                       | Yes                  | Yes                         | Yes        |


WebsiteTemplate: no EXPERIENCE_LAYOUT; layout from envelope/profile via props.

---

## 7. Implementation order (recommended)

1. Add `.cursor/rules/CONTENT_AND_PRESENTATION.md` and patch existing TSX rules (so all future edits follow the laws).
2. Extend layout’s navigate callback to support full-path `to` (optional but needed for flows-index/FlowViewer).
3. Create the three `content.ts` files and define all keys.
4. Refactor Container_Creations: content.ts, remove state/router/palette from template, move palette sync to envelope or wrapper hook; then refactor WebsiteTemplate (remove EXPERIENCE_LAYOUT, accept layoutStyle from props; optionally extend envelope to pass screenPath/experience and content-area layoutStyle).
5. Refactor Shopify_Intelligence: content.ts, replace literals, add Director usage where applicable.
6. Refactor flows-index: content import, replace literals and router with content + CustomEvent("navigate").
7. Refactor FlowViewer: content import, replace literals and router with content + CustomEvent("navigate").
8. Run a quick smoke test (Container Creations website, Shopify Intelligence, flows index, FlowViewer navigation and return).

No changes to state engine, behavior bridge internals, layout engine, blueprint.txt/content.txt formats, or schema/verbs/molecules beyond the TSX and envelope/content discipline above.