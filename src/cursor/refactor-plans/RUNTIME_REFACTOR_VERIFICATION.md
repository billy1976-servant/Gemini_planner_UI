# Runtime Refactor Verification

**Scope:** Phase A–C wiring refactor. No contracts, blueprints, JSON screens, or design systems were changed.

---

## Files modified


| File                                   | Changes                                                                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/behavior/behavior-runner.ts`      | Interaction variant resolution for drag/scroll/swipe; `fireNavigation` now prefers `ctx.navigate(target)` first so semantic targets (e.g. `back:1`, `root`, `panel:close`) reach the callback. |
| `src/behavior/behavior-engine.ts`      | Added `dispatchState` import; all interaction handlers now also dispatch `interaction.record`; nav back/panel/sheet handlers return `{ target }`; added 13 image-domain stub handlers.         |
| `src/engine/core/behavior-listener.ts` | Replaced `runBehavior(..., { navigate }, params)` with full `ctx` (navigate, setScreen, openModal, setFlow, goBack, goRoot, openPanel, openSheet, closePanel, closeSheet).                     |
| `src/state/state-resolver.ts`          | Added derivation for `scan.record` (push payload to `derived.scans`) and `scan.batch` (push `payload.scans` into `derived.scans`).                                                             |


**Not modified:** contract-verbs.ts, behavior-actions-6x7.json, behavior-interactions.json, behavior-navigations.json, any JSON screens, layout definitions, design tokens, or renderer styling.

---

## Handlers added

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

---

## Interaction → state path confirmed

- **Before:** Contract-verb interactions (tap, double, long, drag, scroll, swipe) only updated `UIState`; they did not reach `state-resolver`.
- **After:** Every `interact.*` handler in `behavior-engine.ts` now also calls  
`dispatchState("interaction.record", { type: "tap"|"double"|"long"|"drag"|"scroll"|"swipe", payload })`.  
`state-resolver` already had a branch for `interaction.record` (append to `derived.interactions`), so interactions from the contract-verb path now flow into derived state.

---

## Navigation context keys confirmed

The context passed to `runBehavior` from `behavior-listener.ts` now includes:


| Key          | Implementation                                       |
| ------------ | ---------------------------------------------------- |
| `navigate`   | Callback from `installBehaviorListener` (unchanged). |
| `setScreen`  | `(id) => navigate("                                  |
| `openModal`  | `(id) => navigate("modal:" + id)`                    |
| `setFlow`    | `(id) => navigate("flow:" + id)`                     |
| `goBack`     | `(n) => navigate("back:" + n)`                       |
| `goRoot`     | `() => navigate("root")`                             |
| `openPanel`  | `(id) => navigate("panel:" + id)`                    |
| `openSheet`  | `(id) => navigate("sheet:" + id)`                    |
| `closePanel` | `() => navigate("panel:close")`                      |
| `closeSheet` | `() => navigate("sheet:close")`                      |


Nav handlers in `behavior-engine.ts` call these when present and return `{ target }` so `fireNavigation(ctx, result?.target ?? args?.target)` can also call `ctx.navigate(target)`.

---

## No contract files changed

- **Unchanged:** `contract-verbs.ts`, `behavior-actions-6x7.json`, `behavior-interactions.json`, `behavior-navigations.json`, any blueprint/content or JSON screen files, layout definitions, design tokens, molecules, or renderer styling.
- **Only runtime execution files under** `src/behavior/`, `src/engine/core/`, `src/logic/runtime/` (none in this refactor), and `src/state/` were edited.

---

## Summary

- All contract verbs (interaction, navigation, image-domain) now resolve to real handlers; drag/scroll/swipe use variant from `args.variant` / `args.direction` / `args.mode` / `"default"`.
- Interactions from the contract path are stored in derived state via `interaction.record`.
- `scan.record` and `scan.batch` are derived into `derived.scans`.
- Navigation verbs receive a full context and return targets so navigation (including back/panel/sheet) is triggered through the single `navigate` callback.

