---
name: Container tracker response architecture
overview: Read-only analysis of current onboarding tracker wiring in Container Creations landing renderer, plus a backward-compatible JSON-first architecture to show live per-step responses and generate final summary text.
todos:
  - id: schema-additions
    content: Add backward-compatible optional JSON/type fields for tracker responses and summary config.
    status: completed
  - id: shared-response-engine
    content: Create pure response formatter utilities used by tracker and summary.
    status: completed
  - id: tracker-secondary-text
    content: Render optional per-step response text beside/under step label.
    status: completed
  - id: summary-from-rules
    content: Support summary generation from JSON-configured rules with fallback to existing behavior.
    status: completed
  - id: landing2-rule-sample
    content: Add sample `trackerResponse` rules to `landing-2.json` for existing controls.
    status: completed
  - id: compat-validation
    content: Verify behavior remains unchanged when new fields are omitted.
    status: completed
isProject: false
---

# Container Creations Tracker/Response Architecture

## How It Works Now

- `screens[]` is loaded from `landing-2.json` through the API route and held in local renderer state.
- The visible step tracker uses `orderedScreens.map((s) => s.stepLabel)` and only renders label + status icon (`done/current/todo`).
- Inline control answers are stored in local React state `stepInputs` in the renderer.
- Navigation is driven by `currentScreenId`:
  - `next` button uses `currentScreen.nextScreenId` if present, else next index in `orderedScreens`.
  - `back` button always goes to previous index in `orderedScreens`.
  - clicking tracker rows sets `currentScreenId` to that row’s screen id.
- Final recommendation text is currently hardcoded in TSX (`getFinalRecommendationSummary`) and shown only on screens with `dynamicSummary: true`.

## Exact Files/Functions Controlling This

- `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)
  - `type Screen` (`stepLabel`, `inlineControls`, `nextScreenId`, `dynamicSummary`)
  - `type StepInputs` + `INITIAL_STEP_INPUTS`
  - `renderInlineControl()` (hardcoded per control id)
  - `renderInlineUI()` (JSON `inlineControls[]` -> control components)
  - `goNext()`, `goBack()`, tracker click handler (`setCurrentScreenId`)
  - tracker render in `<aside className="stepTracker">`
  - `getFinalRecommendationSummary()`
- `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/landing-2.json](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/landing-2.json)
  - `stepTracker`, `screens[].stepLabel`, `screens[].inlineControls`, `screens[].nextScreenId`, `screens[].dynamicSummary`
- `[C:/Users/New User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts)`
  - API source for config payload (supports version/variant fallback)
- `[C:/Users/New User/Documents/HiSense-1ea2985/src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts)`
  - mirrors `nextScreenId` fallback and step config shape, but does not implement tracker response text logic.

## What Is Missing Right Now

- No schema to associate a tracker row with a response formatter.
- Tracker has no response text slot/UI.
- Response formatting rules are hardcoded in `getFinalRecommendationSummary`, not screen-configurable.
- No per-step “show/hide response” toggle in JSON.
- No reusable response-computation layer shared between tracker and final summary.

## JSON-First Recommended Shape (Backward-Compatible)

Add only optional fields so existing JSON remains valid.

- **Top-level tracker config**
  - `stepTracker.showResponses?: boolean` (global default false)
  - `stepTracker.responsePlaceholder?: string` (e.g., `"Not answered"`)
  - `stepTracker.completedOnly?: boolean` (show response only when step is done/current)
- **Per-screen response config**
  - `screens[].trackerResponse?: {   enabled?: boolean,   rule?: ResponseRule,   fallbackText?: string }`
  - `ResponseRule` options (start simple, extendable):
    - `{ type: "valueLabel", field: "containerLength", map: { "20ft": "20 ft container", "40ft": "40 ft container" } }`
    - `{ type: "boolean", field: "ventFitVerified", trueText: "Confirmed", falseText?: "Not confirmed" }`
    - `{ type: "numberTemplate", field: "ventCount", template: "{value} x 12-inch vents" }`
    - `{ type: "range", field: "roofRibHeight", ranges: [{ min: 1.5, max: 2.5, text: "Within spec" }], defaultText: "Outside typical range" }`
    - `{ type: "compoundTemplate", fields: ["ventCount"], template: "{ventCount} x 12-inch vents" }`
- **Final summary config**
  - `screens[].dynamicSummaryConfig?: {   mode?: "autoFromTrackerRules" | "lines",   heading?: string,   includeUnanswered?: boolean,   lines?: Array<{ sourceStepId?: string; rule?: ResponseRule; prefix?: string }> }`
  - `dynamicSummary: true` still works unchanged; if `dynamicSummaryConfig` absent, keep current hardcoded behavior.

## TSX Changes Needed (Minimal/Safest)

- Extend `Screen` and `LandingConfig` types with optional fields above.
- Add a pure helper module (recommended new file) for response resolution:
  - `resolveFieldValue(stepInputs, field)`
  - `formatResponse(rule, stepInputs)`
  - `getScreenTrackerResponse(screen, stepInputs, trackerDefaults)`
  - `buildSummaryFromConfig(screens, stepInputs, config)`
- Update tracker row render to include optional secondary text span for response.
- Keep all existing control rendering and navigation intact.
- Use same computed response functions for both tracker and final summary to avoid divergence.

## JSON vs TSX Responsibilities

- **JSON-driven**
  - Which steps show responses
  - How to label/format responses
  - Summary composition mode and line templates
  - Defaults/placeholders and toggles
- **TSX/runtime logic (must remain code)**
  - Control component rendering and input validation behavior
  - Runtime state updates (`stepInputs`) and navigation state transitions
  - Rule interpreter/formatter execution and safe fallbacks

## Difficulty / Risk

- **Difficulty**: Medium
- **Risk**: Low-to-medium if implemented additively
- **Primary risks**
  - malformed JSON rules causing blank/incorrect response text
  - divergence between tracker text and summary text if computed in separate paths
- **Mitigations**
  - strict runtime guards/defaults in formatter
  - single shared formatter used by tracker + summary
  - preserve existing behavior when new fields are absent

## Phased Implementation Plan

1. Add optional schema/types for tracker response + summary config (no behavior change).
2. Implement pure response-rule formatter helpers with safe defaults.
3. Wire tracker to render response text when enabled/configured.
4. Wire final summary to optionally build from same response rules; keep current hardcoded fallback.
5. Add/adjust `landing-2.json` with example rules for key steps (`containerLength`, `roofRibHeight`, `ventFitVerified`, `ventCount`, `orderSizeConfirmed`).
6. Validate backward compatibility by running existing config with no new fields.

## Data Flow (Current vs Proposed)

```mermaid
flowchart LR
  jsonConfig[landing-2.json screens[]] --> renderer[ContainerCreationsLandingRenderer]
  renderer -->|inlineControls| controls[Inline control components]
  controls --> stepInputs[stepInputs state]
  renderer -->|stepLabel only| trackerNow[Step tracker UI]
  stepInputs --> summaryNow[getFinalRecommendationSummary hardcoded]

  jsonConfig -->|trackerResponse rules| responseEngine[Shared response formatter]
  stepInputs --> responseEngine
  responseEngine --> trackerFuture[Tracker label + live response]
  responseEngine --> summaryFuture[Final summary from same rules]
```



