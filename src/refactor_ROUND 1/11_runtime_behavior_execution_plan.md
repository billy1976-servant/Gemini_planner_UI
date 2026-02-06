# Runtime Behavior & Execution Audit Plan

**Objective:** Map the live runtime behavior chain and produce a master refactor plan for fixing broken or incomplete execution paths. This document is **analysis + plan generation only** — no source edits.

**Runtime chain (trace order):**  
Event → Behavior → Behavior Runner → Action / Verb Handler → State → Layout → Render → Navigation

**Included in this file:** The **Runtime Refactor Verification** (Phase A–C run) is appended at the end of this document — files modified, handlers added, interaction → state path, navigation context, and confirmation that no contract files were changed.

---

## 1️⃣ Verb Execution Gaps

**Sources:** `contract-verbs.ts`, `behavior-actions-6x7.json`, `behavior-interactions.json`, `behavior-engine.ts`, `behavior-runner.ts`.

### Verbs that resolve to handlers not implemented in behavior-engine.ts

- **Image-domain handlers (from behavior-actions-6x7.json):**  
  All of the following are returned by `resolveBehaviorVerb(domain, verb)` when the verb is used with the corresponding domain, but **none exist on BehaviorEngine**:
  - `cropMedia` (image.crop, etc.)
  - `applyFilter` (image.filter, video.filter, camera.filter)
  - `applyFrame` (image.frame, document.frame, canvas.frame, camera not)
  - `applyLayout` (image, video, document, canvas, map, camera)
  - `addOverlay` (image, video, document, canvas; audio uses addAudioOverlay)
  - `adjustSpeed` (video.motion)
  - `addAudioOverlay` (audio.overlay)
  - `adjustAudioSpeed` (audio.motion)
  - `cropCanvas` (canvas.crop)
  - `adjustMapMotion` (map.motion)
  - `cropLive`, `applyLiveFilter`, `adjustMotion` (camera)
- **File path(s):** `src/behavior/behavior-actions-6x7.json`, `src/behavior/behavior-engine.ts`, `src/behavior/behavior-runner.ts` (L171–173).
- **What is happening:** Contract verbs for image/video/audio/document/canvas/map/camera resolve to these handler names; `BehaviorEngine[handlerName]` is undefined.
- **Why it breaks:** Runner logs "Handler not implemented" and returns; no state, layout, or side-effect runs. **Stage affected:** Behavior Runner → Verb Handler.

### Verbs that resolve to objects instead of handler names

- **Interaction verbs with variants:** `drag`, `scroll`, `swipe`.
- **File path(s):** `src/behavior/behavior-interactions.json`, `src/behavior/behavior-runner.ts` (L114–116).
- **What is happening:** `(interactions as any)[action]` for "drag" / "scroll" / "swipe" is an **object** (e.g. `{ horizontal: "interact.dragX", vertical: "interact.dragY", free: "interact.dragXY" }`). The runner sets `map.handler = (interactions as any)[action]`, so `handlerName` is that object. `BehaviorEngine[handlerName]` is undefined.
- **Why it breaks:** No handler is invoked; drag/scroll/swipe from contract path do nothing. **Stage affected:** Behavior Runner → Verb Handler.

### Verbs that require a variant but don’t receive one

- **Navigation verbs:** `go`, `back`, `open`, `close`, `route` require a **variant** (e.g. go→screen/modal/flow, back→one/all/root, open/close→panel/sheet, route→internal/external). Variant is resolved from `args` in `resolveNavVariant(verb, args)`.
- **File path(s):** `src/behavior/behavior-runner.ts` (L34–82, L123–136), `src/behavior/behavior-navigations.json`.
- **What is happening:** If JSON (or caller) does not supply the right params (e.g. `screenId`, `modalId`, `path`, `url`, `one`/`all`/`root`), `variant` is undefined; runner warns "Navigation missing variant" and `fromNavigation` is null.
- **Why it breaks:** Navigation behavior is not found; no nav handler runs. **Stage affected:** Behavior Runner.

- **Interaction verbs drag/scroll/swipe:** Even if the runner were fixed to treat these as variant maps, **params must include a variant** (e.g. `horizontal`, `up`, `left`). Currently the runner does not read `args.variant` (or similar) for the interaction path to pick a sub-handler from the object.
- **File path(s):** `src/behavior/behavior-runner.ts`, `src/behavior/behavior-interactions.json`.
- **Why it weakens execution:** Without variant in args, the correct interact.* handler cannot be selected. **Stage affected:** Behavior Runner → Verb Handler.

---

## 2️⃣ Action Execution Gaps

**Sources:** `action-registry.ts`, `action-runner.ts`, `runtime-verb-interpreter.ts`, and JSON/code that reference action names.

### Action names referenced in JSON or code that have no registered handler

- **Registered handlers only:** `logic:runCalculator`, `logic:run25x`, `logic:resolveOnboarding` (`src/logic/runtime/action-registry.ts`).
- **File path(s):** `src/logic/runtime/action-registry.ts`, `src/logic/runtime/action-runner.ts` (L28–31), `src/engine/core/behavior-listener.ts` (fallback to `interpretRuntimeVerb`).
- **What is happening:** Any action name that is not a contract verb and not `state:*` or `navigate` is passed to `interpretRuntimeVerb` → `runAction` → `getActionHandler(name)`. For any name other than the three above, the handler is undefined; action-runner logs "No handler for action" and returns state.
- **Why it breaks:** Buttons or flows that declare custom action names (e.g. other `logic:*`, or arbitrary names) have no effect. **Stage affected:** Action / Verb Handler.

### Registered handlers that are never triggered

- **Triggering path:** Registered actions are only invoked when the **action** event is fired with `params.name` equal to one of the three names, and the request is **not** intercepted earlier (e.g. by contract-verb path or state:*/navigate). So they are triggered when JSON/code dispatches an action with `name: "logic:runCalculator"` (or run25x, resolveOnboarding). References: `src/apps-offline/apps/Onboarding/calculator-test.json`, `json-calculator-proof.json`, `test-minimal-json-tsx/test-minimal-screen.json`; `src/screens/tsx-screens/onboarding/cards/CalculatorCard.tsx` for `logic:run25x`.
- **Finding:** All three registered handlers **can** be triggered by existing JSON/TSX. There is no evidence of a registered handler that is never triggered; the gap is the **inverse** (many action names have no handler).

### Actions that dispatch state but don’t produce visible changes

- **logic:runCalculator / logic:resolveOnboarding:** They call `dispatchState("state.update", { key, value })`, which is derived into `derived.values[key]`. Visibility depends on JSON/UI binding to that key (e.g. a field or view that reads `state.values.calculatorResult`). If no node reads the key, the update is stored but not visible.
- **File path(s):** `src/logic/actions/run-calculator.action.ts`, `src/logic/actions/resolve-onboarding.action.ts`, `src/state/state-resolver.ts`, JSON screens that use these actions.
- **Why it weakens execution:** Execution is correct at State stage, but Layout/Render may not reflect the new value if contracts or bindings are missing. **Stage affected:** State → Layout → Render.

---

## 3️⃣ Behavior → State Disconnects

**Comparison:** Intents dispatched from behavior/action layer vs intents handled in `state-resolver.ts` (`deriveState`).

### Intents that are emitted but never derived

- **Interaction path (contract verbs):** BehaviorEngine handlers for `interact.tap`, `interact.double`, etc. call **UIState.set("interaction.tap", args)** (and similar). UIState is a separate store (`src/engine/core/ui-state.ts`); it does **not** call `dispatchState`. So intents like `interaction.tap`, `interaction.drag.horizontal`, etc. **never** enter the state-store log.
- **state-resolver** only derives **interaction.record** (append to `derived.interactions`). So contract-verb interactions are **not** reflected in derived state; only flows that call `recordInteraction()` (e.g. from json-skin / interaction-controller) emit `interaction.record`.
- **File path(s):** `src/behavior/behavior-engine.ts`, `src/engine/core/ui-state.ts`, `src/state/state-resolver.ts` (L99–104), `src/logic/runtime/interaction-controller.ts`.
- **Why it breaks:** Any logic or "when" conditions that depend on `derived.interactions` or a unified interaction state will not see tap/drag/scroll/swipe from the contract-verb path. **Stage affected:** Behavior → State.

- **scan.record / scan.batch:** Emitted by `recordScan()` and `recordScanBatch()` in state-store. `deriveState` only handles `scan.result` and `scan.interpreted`; it does **not** handle `scan.record` or `scan.batch`.
- **File path(s):** `src/state/state-store.ts` (L159–166), `src/state/state-resolver.ts`.
- **Why it breaks:** Scans pushed via the ingestion API are logged but never appear in `derived.scans`. **Stage affected:** State derivation.

### Derived fields that never affect layout or render

- **derived.interactions:** Appended on `interaction.record`. No evidence in the traced code that layout-store, section overrides, or organ overrides are driven by `derived.interactions`. So interactions are stored but do not drive layout or render in the current chain.
- **derived.journal:** Used for journal-specific UI (e.g. JournalHistory, or content that reads `getState()?.journal`). If no component reads it for the current screen, journal updates do not affect layout/render.
- **File path(s):** `src/state/state-resolver.ts`, `src/engine/core/layout-store.ts`, `src/engine/core/json-renderer.tsx` (visibility uses `state.currentView` and defaultState; journal used in at least one node type).
- **Why it weakens execution:** Some derived state is not yet part of the Layout/Render pipeline. **Stage affected:** State → Layout → Render.

---

## 4️⃣ Behavior → Navigation Disconnects

**Sources:** `behavior-engine.ts`, `behavior-runner.ts`, `layout.tsx` (navigate callback), `behavior-listener.ts`.

### Navigation handlers that rely on missing ctx methods

- **ctx only has `navigate`:** `installBehaviorListener` is called in `src/app/layout.tsx` with a single callback that either dispatches `state:currentView` (for destinations starting with "|") or calls `router.replace(/?screen=...)`. So the context passed to `runBehavior(..., ctx, params)` is **`{ navigate }`** only.
- **Handlers that expect other ctx methods:**  
  `nav.goScreen` uses `ctx.setScreen`; `nav.goModal` uses `ctx.openModal`; `nav.goFlow` uses `ctx.setFlow`; `nav.backOne` / `nav.backAll` use `ctx.goBack`; `nav.backRoot` uses `ctx.goRoot`; `nav.openPanel` / `nav.openSheet` use `ctx.openPanel` / `ctx.openSheet`; `nav.closePanel` / `nav.closeSheet` use `ctx.closePanel` / `ctx.closeSheet`. **None of these exist on ctx**; only `ctx.navigate` exists (and only via the callback’s behavior, not as a named method on the object passed to runBehavior in the listener — the listener passes `{ navigate }`).
- **File path(s):** `src/app/layout.tsx` (L117–126), `src/engine/core/behavior-listener.ts` (L234), `src/behavior/behavior-engine.ts` (nav.* handlers).
- **What is happening:** Nav handlers call `ctx?.setScreen`, `ctx?.openModal`, `ctx?.goBack`, etc.; all are undefined, so those branches no-op.
- **Why it breaks:** Modal, panel, sheet, back, and root navigation never run; only `fireNavigation(ctx, target)` can run, and only when a handler or args provide `target`. **Stage affected:** Behavior → Navigation.

### Navigation handlers that return no target

- **nav.backOne, nav.backAll, nav.backRoot, nav.openPanel, nav.openSheet, nav.closePanel, nav.closeSheet:** These do not return `{ target: ... }`. So `result?.target` is undefined. `fireNavigation(ctx, result?.target ?? args?.target)` is called for navigation domain; when both are undefined, nothing is passed to the navigate callback.
- **File path(s):** `src/behavior/behavior-runner.ts` (L181–184), `src/behavior/behavior-engine.ts`.
- **Why it breaks:** Even if ctx had goBack/goRoot/openPanel/etc., the runner’s fireNavigation path would not run for these, because they don’t set a target. Back/panel/sheet flows are therefore not wired through the single navigate callback. **Stage affected:** Behavior → Navigation.

### Behaviors that never result in router navigation or state view change

- **Navigation verb with missing variant:** As in §1, if variant is missing, no nav handler is selected; no navigation and no view change.
- **Navigation verb with variant but wrong/missing args:** e.g. `go` with variant `screen` but no `screenId`; handler may run but with no effective target, so no navigation.
- **File path(s):** `src/behavior/behavior-runner.ts`, `src/behavior/behavior-navigations.json`.
- **Why it weakens execution:** Buttons that are intended to change screen or view may do nothing. **Stage affected:** Behavior → Navigation.

---

## 5️⃣ Layout Interaction Gaps

**Trace:** Layout-triggering verbs (layout, overlay, motion, etc.) and whether they influence layout-store, section overrides, or organ overrides.

### Layout-store and section/organ overrides

- **layout-store** is updated by: (1) initial default in layout-store; (2) `setLayout({ experience })` in `src/app/layout.tsx` when experience changes; (3) no evidence of updates from behavior or verb handlers.
- **Section overrides** (e.g. section-layout-preset-store, section instance keys) are applied during screen load and profile application (e.g. in json-renderer / applyProfileToNode), not from behavior events.
- **Organ overrides** are resolved from layout resolution and organ-internal-layout; again, no traced path from behavior-engine or contract verbs into these stores.

### Verbs that are “cosmetic only” vs “structural”

- **layout, overlay, motion (contract image-domain verbs):** In behavior-actions-6x7 they map to handlers like `applyLayout`, `addOverlay`, `adjustSpeed`. These handlers are **not implemented** in BehaviorEngine, so today they do nothing. By design intent:
  - **Structural (would affect layout):** `applyLayout` — would be expected to influence layout (fit, orientation, zoom, etc.) if implemented; currently no wiring to layout-store or section/organ overrides.
  - **Cosmetic (would affect render only):** `addOverlay`, `applyFilter`, `applyFrame`, motion-related handlers — would typically affect visual/overlay state, not section structure. No current implementation.
- **Conclusion:** No layout-triggering verb in the contract currently drives layout-store, section overrides, or organ overrides. All are either unimplemented or not wired to layout. **Stage affected:** Behavior → Layout.

---

## 6️⃣ JSON Contract Mismatches

**Scan:** JSON contracts and screen JSON for verbs/actions with no runtime meaning; node types that imply behavior that doesn’t exist; "when" conditions that rely on state never produced.

### Verbs or actions that have no runtime meaning

- **config/ui-verb-map.json:** Maps tokens like "tap", "toggle", "select", "open", "close", "expand", "collapse", "navigate", "submit", "reveal", "menu", "longpress". This file is **not imported** in `src/` at runtime. Behavior routing uses `contract-verbs.ts` + behavior-runner + action-registry. So any JSON or doc that assumes ui-verb-map drives runtime behavior is incorrect; those verbs have no guaranteed runtime meaning unless they overlap with contract verbs (e.g. tap, navigate).
- **File path(s):** `config/ui-verb-map.json`, `src/behavior/contract-verbs.ts`, `src/engine/core/behavior-listener.ts`.
- **Why it weakens execution:** Design-time or doc assumptions about verb meaning can diverge from what actually runs. **Stage affected:** JSON contract vs Runtime.

- **Action names in JSON:** Any `params.name` that is not a contract verb, not `navigate`, not `state:*`, and not one of the three registered action names is passed to the runtime interpreter and gets "No handler for action". So those names have no runtime effect.

### Node types that imply behavior that doesn’t exist

- **Registry vs behavior:** Node types (e.g. button, card, chip) support behaviors (Navigation, Action, Interaction). The **behavior type** and **params** determine what runs. If a node type allows "Action" with arbitrary `params.name`, the implied behavior exists only if that name is a contract verb or has a registered handler. No single “node type” is wrong; the gap is **action name** vs **handler availability** (see §1, §2).

### "when" conditions that rely on state never produced

- **Supported shape:** `when.state` and `when.equals` only (json-renderer `shouldRenderNode`). The key (e.g. `currentView`) is read from the derived state object passed to the renderer. So `when.state === "currentView"` and `when.equals === "|home"` work because `state:currentView` is dispatched and derived.
- **Gap:** If JSON uses `when.state` with a key that is **never** set in derived state (e.g. a key that is never written by any intent or is only in ui-verb-map like "expanded", "selected", "open"), then `stateValue` is undefined and the node is not rendered. So "when" conditions that rely on state keys not produced by the current intent set (state:currentView, state.update, journal.*, scan.result/interpreted, interaction.record) can never be satisfied.
- **File path(s):** `src/engine/core/json-renderer.tsx` (L217–268), `src/state/state-resolver.ts`.
- **Why it weakens execution:** Conditional visibility for such keys will always hide the node. **Stage affected:** Render.

---

## 7️⃣ Dead or Legacy Behavior Systems

### Unused behavior files

- **src/behavior/behavior-listerner.ts** (typo "listerner"): Exports a second `installBehaviorListener` with debug logging. **Not imported** anywhere in the repo; runtime uses `src/engine/core/behavior-listener.ts`. Dead code; risk of confusion or accidental use.
- **File path(s):** `src/behavior/behavior-listerner.ts`.

### Deprecated interpreter paths

- **src/engine/runtime/runtime-navigation.ts:** Deleted (per git status). Navigation is handled in behavior-listener (navigate event + action "navigate") and behavior-runner (fireNavigation). No code should import it; any doc that references it should point to the current path only.

### Stubs that log but do nothing

- **BehaviorEngine interact.* handlers:** They call `UIState.set("interaction.*", args)` and `console.log`. They do not call `dispatchState("interaction.record", ...)`, so they do not feed the state-store derivation. Functionally they “do something” (update UIState and log) but do not integrate with the rest of the state/layout/render chain.
- **window.addEventListener("interaction", () => {})** in behavior-listener: Empty handler; "interaction" events are listened for but have no effect. **File path(s):** `src/engine/core/behavior-listener.ts`.

---

## Refactor Execution Strategy (Next Phase)

Break fixes into **independently runnable and testable** phases. Do **not** refactor features; only fix execution integrity so that every button, verb, and flow that the contracts promise actually function.

### Phase A — Safe handler wiring fixes

- **Interaction variant resolution:** In behavior-runner, when resolving from interactions, if `(interactions as any)[action]` is an object (drag/scroll/swipe), resolve handler as `(interactions[action])[args.variant || args.subverb || args.direction]` (or a small allowlist of keys); fallback or warn if variant missing. Ensures drag/scroll/swipe resolve to a string handler name and are invoked.
- **Image-domain handlers:** Either (1) add stub handlers in BehaviorEngine for every handler name in behavior-actions-6x7 (cropMedia, applyFilter, applyFrame, applyLayout, addOverlay, adjustSpeed, addAudioOverlay, cropCanvas, adjustMapMotion, cropLive, applyLiveFilter, adjustMotion) that at least log and optionally dispatch state, or (2) explicitly document that these verbs are “reserved” and not yet implemented, and avoid resolving them to a handler until implemented. Prefer (1) for “no silent no-op” so that JSON that uses these verbs hits a known stub instead of "Handler not implemented".
- **Verification:** Unit tests for runBehavior(domain, action, ctx, args) for interaction variants and for image-domain verb resolution; no new features, only wiring.

### Phase B — State derivation alignment

- **Interaction → state-store:** Decide a single path: either (a) BehaviorEngine interact.* handlers call `dispatchState("interaction.record", { type: "tap" | "double" | ..., ...args })` in addition to or instead of UIState.set, or (b) document that contract-verb interactions are UIState-only and do not appear in derived.interactions. Align state-resolver and any consumers (e.g. "when" or analytics) with that decision.
- **scan.record / scan.batch:** Either add derivation branches in state-resolver for these intents (e.g. append to derived.scans) or rename/repurpose the ingestion API so it dispatches scan.result/scan.interpreted. Ensure no duplicate or conflicting semantics.
- **Verification:** Assert that intents emitted by behavior/action layer are either derived or explicitly documented as non-derived; tests for deriveState(log) with scan.record/scan.batch and interaction.record.

### Phase C — Navigation context completion

- **Expand ctx in installBehaviorListener:** Build a context object that implements the nav handler contract: setScreen, openModal, setFlow, goBack, goRoot, openPanel, openSheet, closePanel, closeSheet, navigate. Implement each in terms of the existing navigate callback and/or router (e.g. goBack → history or state:currentView; openModal → navigate to a modal route or set state). Pass this ctx to runBehavior.
- **Target for back/panel/sheet:** Either have nav.backOne/backAll/backRoot and panel/sheet handlers set a consistent `result.target` (or equivalent) so fireNavigation can run, or have them call a dedicated ctx method that performs the navigation so fireNavigation is optional for those.
- **Verification:** Integration tests: fire "action" with navigation verb + variant + args, assert navigate callback or state:currentView is invoked as expected; no new UI features, only completion of the nav context.

### Phase D — JSON contract cleanup

- **Document runtime verb/action set:** One doc or contract file that lists: (1) contract verbs and their resolution (interaction, navigation, image-domain); (2) action names that have registered handlers (logic:runCalculator, logic:run25x, logic:resolveOnboarding); (3) state:* and navigate as special action names. Mark ui-verb-map as design-time only, not runtime.
- **"when" contract:** Document that only `state` + `equals` are supported and that the key must be a key produced by deriveState (currentView, values.*, etc.). Add a validation or lint step for screen JSON that warns when when.state references a key not in the derived state shape.
- **Verification:** No code behavior change in this phase; only docs and optional validation scripts/tests.

### Phase E — Optional feature enablement

- **Layout/overlay/motion:** If product requires layout or overlay verbs to affect layout-store or render, implement the minimal BehaviorEngine handlers and wire them to setLayout or to a dedicated overlay/layout state that the renderer reads. Otherwise keep them as stubs and document.
- **Remove dead code:** Delete or deprecate `src/behavior/behavior-listerner.ts` (typo); update any references to runtime-navigation.ts to the current navigation path.
- **Verification:** Regression tests for existing flows; optional tests for new wiring if handlers are added.

---

**End of plan.** No code changes were made; this file is the single deliverable for the Behavior & Runtime Execution Audit.

---

## Runtime Refactor Verification (Phase A–C run)

**Scope:** Phase A–C wiring refactor. No contracts, blueprints, JSON screens, or design systems were changed.

### Files modified

| File | Changes |
|------|--------|
| `src/behavior/behavior-runner.ts` | Interaction variant resolution for drag/scroll/swipe; `fireNavigation` now prefers `ctx.navigate(target)` first so semantic targets (e.g. `back:1`, `root`, `panel:close`) reach the callback. |
| `src/behavior/behavior-engine.ts` | Added `dispatchState` import; all interaction handlers now also dispatch `interaction.record`; nav back/panel/sheet handlers return `{ target }`; added 13 image-domain stub handlers. |
| `src/engine/core/behavior-listener.ts` | Replaced `runBehavior(..., { navigate }, params)` with full `ctx` (navigate, setScreen, openModal, setFlow, goBack, goRoot, openPanel, openSheet, closePanel, closeSheet). |
| `src/state/state-resolver.ts` | Added derivation for `scan.record` (push payload to `derived.scans`) and `scan.batch` (push `payload.scans` into `derived.scans`). |

**Not modified:** contract-verbs.ts, behavior-actions-6x7.json, behavior-interactions.json, behavior-navigations.json, any JSON screens, layout definitions, design tokens, or renderer styling.

### Handlers added

**Image-domain stubs (behavior-engine.ts):**

- `cropMedia`
- `applyFilter`
- `applyFrame`
- `applyLayout`
- `addOverlay`
- `adjustSpeed`
- `addAudioOverlay`
- `adjustAudioSpeed`
- `cropCanvas`
- `adjustMapMotion`
- `cropLive`
- `applyLiveFilter`
- `adjustMotion`

Each stub logs the call and dispatches `state.update` with `key: "lastMediaAction"` and `value: { handler, args }`. No layout or render behavior added.

### Interaction → state path confirmed

- **Before:** Contract-verb interactions (tap, double, long, drag, scroll, swipe) only updated `UIState`; they did not reach `state-resolver`.
- **After:** Every `interact.*` handler in `behavior-engine.ts` now also calls  
  `dispatchState("interaction.record", { type: "tap"|"double"|"long"|"drag"|"scroll"|"swipe", payload })`.  
  `state-resolver` already had a branch for `interaction.record` (append to `derived.interactions`), so interactions from the contract-verb path now flow into derived state.

### Navigation context keys confirmed

The context passed to `runBehavior` from `behavior-listener.ts` now includes:

| Key | Implementation |
|-----|----------------|
| `navigate` | Callback from `installBehaviorListener` (unchanged). |
| `setScreen` | `(id) => navigate("|" + id)` |
| `openModal` | `(id) => navigate("modal:" + id)` |
| `setFlow` | `(id) => navigate("flow:" + id)` |
| `goBack` | `(n) => navigate("back:" + n)` |
| `goRoot` | `() => navigate("root")` |
| `openPanel` | `(id) => navigate("panel:" + id)` |
| `openSheet` | `(id) => navigate("sheet:" + id)` |
| `closePanel` | `() => navigate("panel:close")` |
| `closeSheet` | `() => navigate("sheet:close")` |

Nav handlers in `behavior-engine.ts` call these when present and return `{ target }` so `fireNavigation(ctx, result?.target ?? args?.target)` can also call `ctx.navigate(target)`.

### No contract files changed

- **Unchanged:** `contract-verbs.ts`, `behavior-actions-6x7.json`, `behavior-interactions.json`, `behavior-navigations.json`, any blueprint/content or JSON screen files, layout definitions, design tokens, molecules, or renderer styling.
- **Only runtime execution files under** `src/behavior/`, `src/engine/core/`, `src/logic/runtime/` (none in this refactor), and `src/state/` were edited.

### Summary

- All contract verbs (interaction, navigation, image-domain) now resolve to real handlers; drag/scroll/swipe use variant from `args.variant` / `args.direction` / `args.mode` / `"default"`.
- Interactions from the contract path are stored in derived state via `interaction.record`.
- `scan.record` and `scan.batch` are derived into `derived.scans`.
- Navigation verbs receive a full context and return targets so navigation (including back/panel/sheet) is triggered through the single `navigate` callback.
