# Phase B — Low-Risk Consolidation — Diff Summary

**Scope:** Layout requirements merge, behavior JSON merge, dead stub removal. No layout authority, renderer, state, or behavior order changes.

---

## 1. Diff Summary

### Layout requirements

- **Added:** `layout/requirements/layout-requirements.json` — single file with top-level keys `section`, `card`, `organ`. Each key holds the same structure as the original files (`section`/`card`: `description` + `layoutRequirements`; `organ`: `description` + `organLayoutRequirements`). No keys renamed; schema preserved.
- **Updated:** `layout/compatibility/requirement-registry.ts` — now imports `layout-requirements.json` once and indexes `requirementsData.section`, `requirementsData.card`, `requirementsData.organ`. Exports and behavior unchanged: `getRequiredSlots(layoutType, layoutId, organId?)`, `getRequiredSlotsForOrgan(organId, internalLayoutId)`.
- **Removed:** `layout/requirements/section-layout-requirements.json`, `card-layout-requirements.json`, `organ-internal-layout-requirements.json`.

### Behavior JSON

- **Added:** `behavior/behavior.json` — single file with top-level keys `interactions` and `navigations`. Content is the same as the former behavior-interactions and behavior-navigations files; no key renames.
- **Updated:** `behavior/behavior-runner.ts` — imports `behavior.json` once; assigns `interactions = behaviorData.interactions`, `navigations = behaviorData.navigations`. All usages of `interactions` and `navigations` unchanged (`(interactions as any)?.[action]`, `(navigations as any)?.[verb]?.[variant]`). No behavior logic changes.
- **Removed:** `behavior/behavior-interactions.json`, `behavior/behavior-navigations.json`.

### Dead stub

- **Removed:** `content/content-resolver.ts` — confirmed no imports (landing-page-resolver and education-resolver use `@/logic/content/content-resolver` only). File was a throw-only stub.
- **Unchanged:** `logic/runtime/calc-resolver.ts` — left in place; already has `@deprecated` and comment directing to action-registry / calc-registry.

---

## 2. Files Touched

| Action | Path |
|--------|------|
| Created | `src/layout/requirements/layout-requirements.json` |
| Modified | `src/layout/compatibility/requirement-registry.ts` |
| Deleted | `src/layout/requirements/section-layout-requirements.json` |
| Deleted | `src/layout/requirements/card-layout-requirements.json` |
| Deleted | `src/layout/requirements/organ-internal-layout-requirements.json` |
| Created | `src/behavior/behavior.json` |
| Modified | `src/behavior/behavior-runner.ts` |
| Deleted | `src/behavior/behavior-interactions.json` |
| Deleted | `src/behavior/behavior-navigations.json` |
| Deleted | `src/content/content-resolver.ts` |
| Modified (comment only) | `src/layout/compatibility/requirement-registry.ts` (doc string for organ structure) |

**Not touched:** layout authority, renderer, state, behavior-listener, engine behavior, calc-resolver (only already-present deprecation retained).

---

## 3. API and Behavior Confirmation

### Requirement registry (public API)

- **Exports:** `LayoutType`, `getRequiredSlots(layoutType, layoutId, organId?)`, `getRequiredSlotsForOrgan(organId, internalLayoutId)` — unchanged.
- **Behavior:** Same normalization and lookup logic; data source is now one JSON file keyed by `section` / `card` / `organ`. Output for given inputs is identical to before.

### Behavior runner

- **Exports:** `runBehavior(domain, action, ctx, args)` — unchanged.
- **Behavior:** Same resolution order (fromAction → fromInteraction → fromNavigation); same use of `interactions` and `navigations`; data now loaded from `behavior.json`. Runtime behavior unchanged.

### Content resolution

- **Before:** `content/content-resolver.ts` existed as a stub that threw on use; no callers.
- **After:** File removed. All content resolution continues via `@/logic/content/content-resolver` (unchanged).

### Calc-resolver

- **Status:** Left in place; already `@deprecated`; no callers on main path. No code or comment changes in this phase.

---

## 4. Rules Compliance

- No schema changes (same keys and shapes in merged JSON).
- No renaming of keys.
- No moving of layout resolution (still in layout/compatibility; layout/ remains authority).
- No engine behavior changes.
- No refactor of renderer or state.
- Runtime output preserved (same getRequiredSlots results, same runBehavior resolution).

Phase B low-risk consolidation is complete.
