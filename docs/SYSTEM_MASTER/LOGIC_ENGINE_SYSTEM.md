# Logic Engine System

**Primary Architecture Reference:** docs/SYSTEM_MASTER/

---

## Two behavior paths

| Path | Origin | Entry | State / navigation |
|------|--------|-------|--------------------|
| **JSON** | JSON molecule screens | CustomEvents: `input-change`, `action`, `navigate` | `behavior-listener.ts` → dispatchState or navigate() |
| **TSX** | TSX engine screens | recordInteraction, interpretRuntimeVerb | logic/runtime, engine/runtime; separate from CustomEvent bridge |

JSON path: molecules fire events; `installBehaviorListener(navigate)` in app layout subscribes; routes to `state-store` (state-mutate) or router. TSX path does not go through behavior-listener.

---

## State orchestration

- **State store** (`src/state/state-store.ts`): Append-only event log. `dispatchState(intent, payload)` appends; `deriveState(log)` recomputes snapshot. Subscribers notified; JsonRenderer subscribes via useSyncExternalStore.
- **State resolver** (`src/state/state-resolver.ts`): Pure `deriveState(log)` → derived snapshot (e.g. journal, values). No layout or override logic.
- **Persistence:** Optional persist of log (e.g. high-frequency `state.update` may be excluded from persist). Rehydration on load.

---

## Layout override precedence (no logic in layout store)

Per-section layout is **not** stored in layout-store. It comes from:

1. **User overrides** — Section/card/organ layout choices from OrganPanel; stored in `section-layout-preset-store.ts` and `organ-internal-layout-store.ts` by screenId + sectionKey. Passed into JsonRenderer as `sectionLayoutPresetOverrides`, `cardLayoutPresetOverrides`, `organInternalLayoutOverrides`.
2. **Explicit node.layout** — Value on the section node in JSON (if any).
3. **Template default** — profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId).

Layout store holds only: experience, templateId, mode (template | custom), regionPolicy. Logic engines do **not** write to layout store or to override stores. Layout resolver applies the precedence above inside `applyProfileToNode`.

---

## Logic–layout boundary

- **Logic** may (in future) produce **suggestions** (e.g. trait weights, recommended layout id from a decision engine). It does not write to layout store or to node.layout.
- **Layout** exposes read-only APIs: getAvailableSlots(sectionNode), evaluateCompatibility(...), getLayout2Ids(), getRequiredSlots, etc. Layout never calls logic store setters.
- **Rule:** Logic suggests; layout resolves. Final section layout id is chosen only by: override → explicit → template default (and optionally suggestion when no override/explicit). No cross-store writes.

---

## Behavior contract (runtime)

- **Kinds:** Interaction, Navigation, Action, Mutation. Contract tokens (tap, go, back, append, update, remove, etc.) defined in `src/contracts/behavior-intent.ts`.
- **Normalization:** `src/contracts/behavior-normalize.ts` maps legacy `state:*` / `logic.action` to canonical form. behavior-listener uses normalizer where applicable.
- **Runtime:** behavior-listener routes action/navigate events; state-mutate → dispatchState. See [CONTRACTS.md](CONTRACTS.md).
