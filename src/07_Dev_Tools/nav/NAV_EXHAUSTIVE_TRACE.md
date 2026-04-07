# Exhaustive end-to-end runtime trace — navigation system

## Lifecycle (in order)

1. **RENDER** — Panel and TsxNavCapture log when they render with `screenKey`, `navTargetsMap`, `resolvedNavTarget` (where applicable).
2. **DOM_SCAN** — Full list of `[data-node-id]` elements; duplicates and mutations (added/removed ids) flagged.
3. **PANEL_SELECTION** — When user selects an element in the Navigation panel dropdown; logs `screenKey`, `elementId`, `navTargetsMap`, `resolvedNavTarget` for that element.
4. **STATE_WRITE** — When user saves a nav target; logs payload and stores `__NAV_LAST_SAVE__` for comparison.
5. **STATE_MERGE** — Inside `state-resolver.ts` after `cast.navTargets = { ...existing, ...incomingNavTargets }`; logs `screenKey`, `existingKeysBefore`, `incomingKeys`, `mergedNavTargets`.
6. **STATE_READ** — At click: the read of `getState()?.layoutByScreen?.[screenKey]?.navTargets` and `navTargetsMap?.[id]`; logged with same shape.
7. **CLICK_CAPTURE** — Same click; logs `eventPath` (targetTag, closestNodeId) and `navTargetsMapEntryUsed`.
8. **NAV_EXECUTION** — When we actually scroll or dispatch the navigate event; logs `screenKey`, `elementId`, `resolvedNavTarget` used.

Every stage logs `[NavTrace]` with: `{ stage, screenKey?, elementId?, dataNodeId?, navTargetsMap?, resolvedNavTarget?, ... }`.

## When expected (from SAVE) !== actual (at CLICK)

The tracer compares `__NAV_LAST_SAVE__` with the click payload for the same `screenKey` and `elementId`. On first divergence it:

1. Stops (reports once).
2. Prints **EXACT FAILING LINE** and **MINIMAL FIX PATCH**.

### Exact failing line (where the wrong value is first used)

- **FILE:** `src/app/dev/page.tsx`
- **LINE:** 208
- **CODE:** `const nav = navTargetsMapAtClick?.[id];`

This is where the value used for navigation is read from state. If the value is wrong, it was either (1) written/merged incorrectly into state, or (2) the `id` used for lookup is wrong (e.g. duplicate `data-node-id` or wrong element).

### Minimal fix patch

**If state has the wrong value for this elementId:**

```diff
--- src/03_Runtime/state/state-resolver.ts
  Ensure merge never replaces entire map:
  cast.navTargets = { ...existing, ...incomingNavTargets };

--- src/07_Dev_Tools/nav/DevNavigationPanel.tsx
  Ensure single entry per save:
  const singleEntry = { [selectedElementId]: nav };
  dispatchState("layout.setNavTargets", { screenKey, navTargets: singleEntry });
```

**If wrong elementId / duplicate data-node-id:**

```diff
--- TSX screen (e.g. landing-2.tsx)
  Ensure every interactive element has a unique data-node-id attribute.
  No two elements must share the same data-node-id.
```

## DOM and MutationObserver

- **DOM_SCAN** runs on panel navigable-element updates and on landing-2 after each render; logs full list and `duplicateIds` / `mutation: { added, removed }`.
- **MutationObserver** (body) logs whenever any `[data-node-id]` is added, removed, or duplicated.

## React reconciliation

We do not instrument React internals. Use React DevTools to confirm that no DOM node is reused for a different logical element (e.g. same `data-node-id` on two instances). The DOM_SCAN duplicate warning identifies duplicate ids at render time.
