# Runtime Systems Audit (Generated)

**Scope:** Read-only audit of the runtime signal chain across `src/`: Event → Behavior → State → Layout → Render → Navigation. All findings cite real code paths; no assumptions.

---

## 1. Verb wiring gaps

- **Interaction verbs drag/scroll/swipe — handler is object, not string**
  - **Paths:** [src/behavior/behavior-runner.ts](src/behavior/behavior-runner.ts) (L114–116), [src/behavior/behavior-interactions.json](src/behavior/behavior-interactions.json)
  - **What:** For `drag`, `scroll`, `swipe`, `(interactions as any)[action]` is an object (e.g. `{ horizontal: "interact.dragX", vertical: "interact.dragY", ... }`). The code sets `map.handler = (interactions as any)[action]`, so `handlerName` is that object. `BehaviorEngine[handlerName]` is then undefined.
  - **Why:** These contract verbs reach the runner but no handler is invoked; runtime logs "Handler not implemented" and the interaction has no effect.
- **Image-domain contract verbs — no BehaviorEngine handlers**
  - **Paths:** [src/behavior/behavior-actions-6x7.json](src/behavior/behavior-actions-6x7.json), [src/behavior/behavior-engine.ts](src/behavior/behavior-engine.ts), [src/behavior/behavior-runner.ts](src/behavior/behavior-runner.ts) (L171–173)
  - **What:** Contract verbs from the image domain (crop, filter, frame, layout, overlay) resolve via `resolveBehaviorVerb` to handler names like `cropMedia`, `applyFilter`, `applyFrame`, `applyLayout`, `addOverlay`. `BehaviorEngine` only implements `interact.*` and `nav.*`; it has no `cropMedia`, `applyFilter`, etc.
  - **Why:** JSON that fires these verbs gets "Handler not implemented"; the behavior leg of the chain stops at the engine.
- **Unregistered action names — no handler in action-registry**
  - **Paths:** [src/logic/runtime/action-registry.ts](src/logic/runtime/action-registry.ts), [src/logic/runtime/action-runner.ts](src/logic/runtime/action-runner.ts) (L28–31)
  - **What:** Only three actions are registered: `logic:runCalculator`, `logic:run25x`, `logic:resolveOnboarding`. Any other non-contract action name (e.g. unknown `logic:*` or custom names) is passed to the action-runner; `getActionHandler(name)` returns undefined.
  - **Why:** Such actions are logged as "No handler for action" and have no state or side-effect; the Behavior → State path is broken for those names.

---

## 2. State intent gaps

- **scan.record and scan.batch dispatched but not derived**
  - **Paths:** [src/state/state-store.ts](src/state/state-store.ts) (L161, L166), [src/state/state-resolver.ts](src/state/state-resolver.ts)
  - **What:** `recordScan()` and `recordScanBatch()` dispatch `scan.record` and `scan.batch`. `deriveState()` in state-resolver only handles `scan.result` and `scan.interpreted`; it does not handle `scan.record` or `scan.batch`.
  - **Why:** Those intents are appended to the event log but never update derived state; scans pushed via this API do not appear in `state.scans`.
- **state-mutate bridge allows arbitrary intents**
  - **Paths:** [src/state/state-store.ts](src/state/state-store.ts) (L79–86)
  - **What:** The legacy `state-mutate` listener forwards any `detail.name` to `dispatchState(name, payload)`. Intents that are not one of the handled set in state-resolver (state:currentView, journal.set/add, state.update, scan.result/interpreted, interaction.record) are never applied in `deriveState`.
  - **Why:** Misused or legacy intents accumulate in the log without changing derived state; weakens the State leg for anything outside the documented intent set.

---

## 3. Layout signal failures

- **Section layout id can be undefined when no default exists**
  - **Paths:** [src/engine/core/json-renderer.tsx](src/engine/core/json-renderer.tsx) (L359–364), [src/layout/page/page-layout-resolver.ts](src/layout/page/page-layout-resolver.ts) (L73–79), [src/layout/page/templates.json](src/layout/page/templates.json)
  - **What:** In `applyProfileToNode`, section layout id is `overrideId || existingLayoutId || templateDefaultLayoutId || undefined`. `getDefaultSectionLayoutId(templateId)` reads `templates[templateId]["defaultLayout"]`; templates.json has no `defaultLayout` key (only role slots). So for sections without override or explicit layout, `layoutId` becomes undefined.
  - **Why:** Sections can get `layout: undefined`; downstream resolution then fails and layout-driven rendering is skipped.
- **resolveLayout returns null when layout id is missing or unknown**
  - **Paths:** [src/layout/resolver/layout-resolver.ts](src/layout/resolver/layout-resolver.ts) (L30–45), [src/compounds/ui/12-molecules/section.compound.tsx](src/compounds/ui/12-molecules/section.compound.tsx) (L80, L100–116)
  - **What:** `resolveLayout(layout)` uses `getPageLayoutId(layout, context)`; when layout is null/undefined or not resolvable, it returns null. So `resolveLayout` returns null. Section compound uses `layoutDef = resolveLayout(layout)`; when `effectiveDef` is null it skips `LayoutMoleculeRenderer` and renders only a plain `<div>` with children.
  - **Why:** Layout signal is dropped; section structure and container/split/background from layout definitions are not applied.

---

## 4. JSON-to-render mismatches

- **Registry vs definitions — types in Registry but not in definitions**
  - **Paths:** [src/engine/core/json-renderer.tsx](src/engine/core/json-renderer.tsx) (L465–468, L550), [src/compounds/ui/index.ts](src/compounds/ui/index.ts), [src/engine/core/registry.tsx](src/engine/core/registry.tsx)
  - **What:** Variant/size presets come from `definitions` (compounds/ui); the component comes from `Registry`. Definitions only export a subset of types (button, text, card, chip, field, footer, list, modal, section, stepper, toast, toolbar, avatar). Registry has more (screen, sequence, trigger, layout molecules, UserInputViewer, JournalHistory, etc.). For types not in definitions, `def.variants` / `def.sizes` are empty.
  - **Why:** No crash, but those node types get no preset-based variant/size styling; JSON-driven look may not match design expectations.
- **Missing registry entry for unknown node type**
  - **Paths:** [src/engine/core/json-renderer.tsx](src/engine/core/json-renderer.tsx) (L551–562), [src/engine/core/registry.tsx](src/engine/core/registry.tsx)
  - **What:** `Component = (Registry as any)[resolvedNode.type]`. If JSON uses a `type` not present in Registry, Component is undefined and the renderer outputs a "Missing registry entry: **type**" message in the UI.
  - **Why:** Hard render failure for that node; the Render leg of the chain does not produce the intended component.
- **node.when only supports { state, equals }**
  - **Paths:** [src/engine/core/json-renderer.tsx](src/engine/core/json-renderer.tsx) (L217–268), [src/logic/engines/json-skin.engine.tsx](src/logic/engines/json-skin.engine.tsx) (L81, L104–105)
  - **What:** Visibility gating uses only `node.when.state` and `node.when.equals`. Any other shape (e.g. min/max, multiple keys) is not interpreted; missing or wrong key can make `stateValue` undefined or comparison wrong.
  - **Why:** Conditional visibility can fail or mis-render when JSON or json-skin uses a different when contract.
- **EXPECTED_PARAMS does not cover all JSON-facing types**
  - **Paths:** [src/contracts/expected-params.ts](src/contracts/expected-params.ts), [src/engine/core/registry.tsx](src/engine/core/registry.tsx)
  - **What:** EXPECTED_PARAMS lists params for button, section, card, toolbar, list, footer, chip, avatar, field, toast, modal. Registry includes screen, atoms, layout molecules, UserInputViewer, JournalHistory, etc., which are not in EXPECTED_PARAMS.
  - **Why:** Param diagnostics and contract tests may not cover all types that receive JSON params; mismatches can go undetected.

---

## 5. Flow/navigation breaks

- **Navigation ctx has only navigate — no modal/panel/sheet/back hooks**
  - **Paths:** [src/app/layout.tsx](src/app/layout.tsx) (L118–125), [src/engine/core/behavior-listener.ts](src/engine/core/behavior-listener.ts) (L234), [src/behavior/behavior-engine.ts](src/behavior/behavior-engine.ts) (e.g. nav.goModal, nav.openPanel, nav.closePanel, nav.backOne, nav.backRoot)
  - **What:** `installBehaviorListener` is called with a single callback that either dispatches `state:currentView` or calls `router.replace(...)`. So the context passed to `runBehavior(..., { navigate }, params)` has only `navigate`. Handlers like `nav.goModal`, `nav.openPanel`, `nav.backOne` check `ctx?.openModal`, `ctx?.goBack`, etc.; those are undefined.
  - **Why:** Modal/panel/sheet and back/root behaviors do not run their intended UX; only `fireNavigation(ctx, target)` runs, so everything is reduced to navigate(target). Intended flows (open modal, go back) are broken.
- **fireNavigation with no target when handler doesn’t return target**
  - **Paths:** [src/behavior/behavior-runner.ts](src/behavior/behavior-runner.ts) (L86–99, L181–184)
  - **What:** For navigation domain, `fireNavigation(ctx, result?.target ?? args?.target)` is called. Handlers like `nav.backOne` only call `ctx?.goBack?.(1)` (undefined) and do not set `result.target`. So target is undefined and fireNavigation does nothing.
  - **Why:** Back/root and other non-URL navigation flows never trigger a navigation when ctx hooks are missing.

---

## 6. Dead or unused systems

- **behavior-listerner.ts (typo) — never imported**
  - **Paths:** [src/behavior/behavior-listerner.ts](src/behavior/behavior-listerner.ts)
  - **What:** File exists with typo "listerner"; it exports a duplicate `installBehaviorListener` with different (debug) behavior. No import of this file found in the repo; runtime uses [src/engine/core/behavior-listener.ts](src/engine/core/behavior-listener.ts).
  - **Why:** Dead code; can cause confusion or accidental use; duplicates the real listener contract.
- **runtime-navigation.ts — removed**
  - **Paths:** Referenced in docs and git status as deleted (`src/engine/runtime/runtime-navigation.ts`).
  - **What:** File was part of the old engine runtime; navigation is now handled in behavior-listener (navigate event + action "navigate") and behavior-runner (fireNavigation). No code imports it.
  - **Why:** No runtime impact; doc/graph references to it should point to the current path only.
- **config/ui-verb-map.json — not used at runtime**
  - **Paths:** [config/ui-verb-map.json](config/ui-verb-map.json), docs (e.g. [src/docs/ARCHITECTURE_AUTOGEN/PIPELINE_AND_BOUNDARIES_REFERENCE.md](src/docs/ARCHITECTURE_AUTOGEN/PIPELINE_AND_BOUNDARIES_REFERENCE.md))
  - **What:** No import or require of ui-verb-map.json in src/. Runtime behavior uses contract-verbs + behavior-runner + action-registry; docs describe this file as design-time only.
  - **Why:** Not part of the Event → Behavior chain; relying on it for runtime behavior would be incorrect.

---

## Verification checklist

- **Only this file was created/modified:** Yes — only `src/docs/ARCHITECTURE_AUTOGEN/RUNTIME_SYSTEMS_AUDIT.generated.md` was created; no other files were changed.
- **No runtime code changed:** No edits to behavior-listener, behavior-runner, state-store, state-resolver, layout-resolver, json-renderer, registry, or any other runtime source.
- **All six sections present:** 1. Verb wiring gaps; 2. State intent gaps; 3. Layout signal failures; 4. JSON-to-render mismatches; 5. Flow/navigation breaks; 6. Dead or unused systems.
- **Findings are based on src code paths:** All findings cite specific files and line references under `src/`; no assumptions beyond what grep/read of the codebase show.

