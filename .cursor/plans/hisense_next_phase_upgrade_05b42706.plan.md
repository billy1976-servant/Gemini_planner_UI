---
name: hisense_next_phase_upgrade
overview: Version 3 execution roadmap for evolving HiSense into builder + presenter + walkthrough modes on one JSON-first engine with strict phase safety gates.
todos:
  - id: phase-1-runtime-presenter-foundation
    content: Deliver explicit runtimeMode architecture and presenter baseline without changing builder behavior.
    status: pending
  - id: phase-2-reveal-deck-picker
    content: Add deterministic presenter reveal stepping and stable deck/file picker switching.
    status: pending
  - id: phase-3-walkthrough-engine
    content: Add JSON-driven walkthrough input schema plus gating/progression/summary engine.
    status: pending
  - id: phase-4-production-parity
    content: Complete mode parity hardening and rollout gate for landing-2 local vs production.
    status: pending
isProject: false
---

# HiSense Slide Builder Version 3 Execution Plan

## Guardrails

- Keep one engine.
- Keep JSON as source of truth.
- Preserve current working builder behavior while adding capabilities.
- Use old HI Clarify only as UX/feature benchmark; no direct architecture/code revival.

## 1) Reorganized Version 3 Phased Roadmap

### Phase 1 - Runtime Modes + Presenter Foundation

- **Goal**
  - Establish explicit runtime modes and ship a safe presenter baseline in one meaningful phase.
- **Features included**
  - Add explicit `runtimeMode` (`builder|presenter|walkthrough`) parsing.
  - Keep current builder shell as mode `builder`.
  - Add presenter mode shell with keyboard slide navigation and clean viewing surface.
  - Maintain backward compatibility with existing `slideBuilder` behavior.
- **Exact files/systems likely involved**
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/lib/slide-builder-query.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/slide-builder-query.ts)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/app/landing-2/page.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/landing-2/page.tsx)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/app/landing/landing-theme.css](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/landing/landing-theme.css)`
- **What remains frozen**
  - Walkthrough schema/gating logic.
  - Reveal stepping logic.
  - Deck picker behavior.
  - Block schema changes.
- **Risk level**
  - Medium.
- **What done means**
  - Mode routing is explicit and stable.
  - Presenter mode works for basic prev/next slide operation.
  - Builder remains fully intact.
- **Exact local test URL(s)**
  - `/landing-2`
  - `/landing-2?runtimeMode=builder`
  - `/landing-2?runtimeMode=presenter`
  - `/landing-2?slideBuilder=1`
- **Exact test checklist**
  - Open each URL and verify no runtime error.
  - In builder mode: edit slide text inline, use inspector, add/duplicate/delete/move, export JSON.
  - In presenter mode: navigate with keyboard (`ArrowRight`, `ArrowLeft`, `Space` if mapped) and click controls.
  - Switch modes by URL and verify state does not corrupt.
- **Regression if**
  - Existing builder tools stop working.
  - `slideBuilder` URL behavior breaks.
  - Editable field interactions are hijacked by presenter keyboard handlers.

### Phase 2 - Presenter Reveal Engine + Deck/File Picker

- **Goal**
  - Add the old projector pacing strength and practical deck switching in one contained phase.
- **Features included**
  - Reveal sequencing contract (`none|byBlock|custom`) for presenter mode.
  - Reveal-first stepping (advance reveal before next slide).
  - Reverse-step reveal rewind behavior.
  - Builder deck/file picker supporting `version/variant` switching.
- **Exact files/systems likely involved**
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/renderContentBlocks.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/renderContentBlocks.tsx)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/types.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/types.ts)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/LandingSlideBuilderPanel.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/LandingSlideBuilderPanel.tsx)
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck-mutations.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/landing-deck-mutations.ts)`
- **What remains frozen**
  - Walkthrough schema and flow engine.
  - Inspector architecture changes.
- **Risk level**
  - Medium-high.
- **What done means**
  - Presenter stepping is deterministic with reveal-first behavior.
  - Deck switching is reliable with no stale state leakage.
- **Exact local test URL(s)**
  - `/landing-2?runtimeMode=presenter`
  - `/landing-2?runtimeMode=builder`
  - `/landing-2?runtimeMode=builder&version=2`
  - `/landing-2?runtimeMode=builder&variant=<knownVariant>`
- **Exact test checklist**
  - In presenter mode, step forward through reveal-enabled slides; reveal must complete before slide changes.
  - Step backward and confirm reveal rewinds before previous slide.
  - Verify slides without reveal config still navigate normally.
  - In builder mode, switch versions/variants repeatedly; confirm IDs/order reset safely per deck.
  - Export JSON after a deck switch; confirm export aligns with active deck.
- **Regression if**
  - Reveal gets stuck/skips.
  - Deck switching leaks previous deck selection/order.
  - Builder editing/export breaks after switch.

### Phase 3 - Walkthrough Input Schema + Flow/Gating/Summary Engine

- **Goal**
  - Deliver real walkthrough mode with schema-defined inputs and reliable progression logic.
- **Features included**
  - JSON-driven input schema (`number|select|boolean|text`) for walkthrough steps.
  - Validation and required checks (container length, roof rib height, fit checks, counts).
  - Gate enforcement before progression.
  - Summary/end-state logic derived from validated values.
  - Session-safe progression persistence behavior for walkthrough.
- **Exact files/systems likely involved**
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/landing-2.json](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/landing-2.json)
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-tracker-responses.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/landing-tracker-responses.ts)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/types.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/types.ts)`
- **What remains frozen**
  - Presenter controls and reveal semantics from Phase 2.
  - Deck picker behavior from Phase 2.
- **Risk level**
  - High.
- **What done means**
  - Walkthrough mode is configurable via deck JSON, enforces gating, and generates coherent summary outputs.
- **Exact local test URL(s)**
  - `/landing-2?runtimeMode=walkthrough`
  - `/landing-2?runtimeMode=walkthrough&version=2`
- **Exact test checklist**
  - Attempt to proceed with missing required inputs; progression must block.
  - Enter valid inputs; progression must unlock.
  - Validate tracker response text and summary reflect entered values.
  - Navigate backward and forward; values persist correctly during session.
  - Refresh and confirm expected resume behavior for current scope.
- **Regression if**
  - Required checks are bypassed.
  - Summary ignores/miscomputes captured inputs.
  - Builder/presenter behavior changes unexpectedly.

### Phase 4 - Production/Live Parity Gate

- **Goal**
  - Lock local and deployed `landing-2` behavior to same mode semantics using same deck JSON.
- **Features included**
  - Config loading hardening for version/variant.
  - Mode parity verification across builder/presenter/walkthrough.
  - Final rollout checklist with regression smoke matrix.
- **Exact files/systems likely involved**
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/app/landing-2/page.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/landing-2/page.tsx)`
  - `[C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)
- **What remains frozen**
  - New feature additions not required for parity.
- **Risk level**
  - Medium.
- **What done means**
  - Same deck produces equivalent behavior locally and in deployed environment in all three modes.
- **Exact local test URL(s)**
  - `/landing-2?runtimeMode=builder`
  - `/landing-2?runtimeMode=presenter`
  - `/landing-2?runtimeMode=walkthrough`
  - Equivalent deployed/staging URLs for the same deck and params
- **Exact test checklist**
  - Run smoke matrix in all three modes for one fixed deck version.
  - Repeat with at least one variant switch.
  - Verify export still works in builder mode.
  - Confirm no mode-specific crash or data loss in any path.
- **Regression if**
  - Local/deployed behavior diverges.
  - Any mode crashes on standard navigation.
  - Config load/export reliability drops.

## 2) Best Execution Order

1. **Phase 1 - Runtime Modes + Presenter Foundation**
2. **Phase 2 - Presenter Reveal Engine + Deck/File Picker**
3. **Phase 3 - Walkthrough Input Schema + Flow/Gating/Summary Engine**
4. **Phase 4 - Production/Live Parity Gate**

### Why this order

- Phase 1 creates the control structure and keeps builder safe.
- Phase 2 captures high-impact presenter value and deck operability before touching walkthrough complexity.
- Phase 3 isolates highest-risk logic (validation/gating/state) after presenter behavior is stable.
- Phase 4 enforces rollout discipline and prevents environment-specific surprises.

## 3) What Should Be Deferred

- Multi-window presenter/audience synchronization.
- Full presenter notes authoring/jump UI parity with old projector.
- Large inspector redesign unrelated to core mode delivery.
- Generic branching DSL beyond constrained, practical walkthrough gating.
- Advanced analytics/reporting pipeline.

## 4) Safest First Implementation Command

Implement now: **Phase 1 - Runtime Modes + Presenter Foundation**.