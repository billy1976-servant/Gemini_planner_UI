# Navigation system – root-cause instrumentation report

## 1. Runtime logs (save and click)

Every **save** and **click** is logged with the same shape:

- **SAVE** (from `DevNavigationPanel.tsx` → `handleNavTargetChange`):
  - `[NavInstrument] SAVE (panel screenKey)` → `{ screenKey, elementId, navTargetsMap, resolvedNavTarget }`
- **CLICK** (from `dev/page.tsx` → `TsxNavCapture`):
  - `[NavInstrument] CLICK (TsxNavCapture screenKey)` → `{ screenKey, elementId, navTargetsMap, resolvedNavTarget, eventPath }`

**Files:** `src/07_Dev_Tools/nav/nav-instrumentation.ts` (loggers), `DevNavigationPanel.tsx` (save), `dev/page.tsx` (click).

---

## 2. Panel vs click: same screenKey

- **Panel:** receives `screenKey` from `DevLayoutPanelContentForTsx` (dev/page.tsx L40–41): `getCanonicalNavScreenKey(searchParams.get("screen"), {})`.
- **TsxNavCapture:** receives `screenKey` from DevPage TSX branch (dev/page.tsx L712): `getCanonicalNavScreenKey(screen, {})` where `screen = searchParams.get("screen")` (L245).

Both use the same URL param and the same function. If they ever differ at runtime, the instrumentation logs a warning:

- `[NavInstrument] SCREENKEY MISMATCH: panel save used X click used Y`

**Fix if mismatch:** Ensure both call sites get `screen` from the same source (e.g. same `searchParams.get("screen")`) and pass it through `getCanonicalNavScreenKey(screen, {})`. No code path should derive screenKey from a different URL or a stale closure.

---

## 3. Full state table after each save

After every **save**, on the next tick:

- `[NavInstrument] STATE TABLE after save` → `{ screenKey, entries }` where `entries = Object.entries(state.layoutByScreen[screenKey].navTargets)`.
- A `console.table` of `{ elementId, toScreenId, toAnchor }` is printed.

**File:** `src/07_Dev_Tools/nav/nav-instrumentation.ts` → `logNavStateTableAfterSave`; invoked from `DevNavigationPanel.tsx` in `handleNavTargetChange` via `setTimeout(..., 0)`.

---

## 4. DOM scan: every [data-node-id] and duplicates

When the Navigation panel has navigable elements (TSX screens, no tree), a DOM scan runs:

- `document.querySelectorAll("[data-node-id]")` → list of elements.
- For each, `id = element.getAttribute("data-node-id")`.
- Duplicates: any `id` that appears more than once is reported.
- Log: `[NavInstrument] DOM [data-node-id] scan` → `{ total, duplicateIds, all }`.
- If `duplicateIds.length > 0`: `[NavInstrument] DUPLICATE data-node-id in DOM: <ids>`.

**File:** `src/07_Dev_Tools/nav/nav-instrumentation.ts` → `scanDomForNodeIds`, `logDomNodeIdScan`; triggered from `DevNavigationPanel.tsx` in a `useEffect` when `!hasTree && navigableElements.length > 0`.

**Fix if duplicates:** In the TSX screen (e.g. `ContainerCreationsLanding-2.tsx`), ensure every interactive element has a unique `data-node-id`. If the same id is used in a list or repeated block, make it unique (e.g. suffix with index or key).

---

## 5. React reconciliation (IDs unique)

If the DOM scan shows **no duplicate ids**, the “multiple elements → same target” bug is not from duplicate `data-node-id`. Next checks:

- **Reconciliation:** Ensure no list/map reuses the same `key` or `data-node-id` for different logical elements, so React doesn’t reuse a DOM node and make two logical buttons share one id.
- Instrumentation does not trace React reconciliation; use React DevTools or a custom hook to verify that each button/card instance has a distinct DOM node and a distinct `data-node-id` at runtime.

---

## 6. Full event path of the click

On each click, the instrumented handler logs:

- **eventPath:** `{ targetTag, targetId, closestNodeId }`:
  - `targetTag`: `e.target.tagName`.
  - `targetId`: `e.target.id` (if any).
  - `closestNodeId`: `data-node-id` of `e.target.closest("[data-node-id]")` (the id used for lookup).

Lookup is done with that `closestNodeId`:

- `navTargetsMap = getState()?.layoutByScreen?.[screenKey]?.navTargets`
- `resolvedNavTarget = navTargetsMap?.[closestNodeId]`

So the **exact file and line where the resolved target is read and used** are:

- **File:** `src/app/dev/page.tsx`
- **Lookup:** L201–202: `navTargetsMap = getState()?.layoutByScreen?.[screenKey]?.navTargets`, `nav = navTargetsMap?.[id]`.
- **Use of nav:** L223–228 (same-page scroll), L233–239 (navigate event).

If the **wrong value** appears:

1. Confirm in the CLICK log that `elementId` (same as `eventPath.closestNodeId`) is the id of the element the user clicked.
2. Confirm `navTargetsMap` contains that key and the value matches what you expect for that element.
3. If `navTargetsMap` is correct but behavior is wrong, the bug is in the **use** of `nav` (scroll vs navigate, or wrong target). Fix: `src/app/dev/page.tsx` in `TsxNavCapture`’s `handleClickCapture` (lines 223–239).
4. If `navTargetsMap` is wrong (e.g. missing key or wrong value), the bug is either:
   - **State:** `layoutByScreen[screenKey].navTargets` was written or merged incorrectly → check `state-resolver.ts` (merge) and `DevNavigationPanel.tsx` (payload: `screenKey` and `selectedElementId`).
   - **screenKey:** Panel and click used different keys → fix as in section 2.

---

## 7. Where the wrong value first appears – fix location

- **If the resolved target is wrong and the CLICK log shows the correct `elementId` but wrong `resolvedNavTarget`:**
  - The map `layoutByScreen[screenKey].navTargets` is wrong for that `elementId`. Check:
    - **Writes:** `src/07_Dev_Tools/nav/DevNavigationPanel.tsx` L145–163: `selectedElementId` and `screenKey` in the dispatch.
    - **Merge:** `src/03_Runtime/state/state-resolver.ts` L157–168: no other code path should overwrite `navTargets`; only merge.
  - Fix: Ensure every save uses the correct `screenKey` and `selectedElementId`; ensure no other writer replaces `navTargets`.

- **If the CLICK log shows the wrong `elementId` (e.g. always the same id):**
  - **DOM:** Duplicate or incorrect `data-node-id` (see section 4) or wrong `closest()` result (e.g. nested elements with same id).
  - **Event target:** `e.target` might be a child; we use `closest("[data-node-id]")`, which is correct. If the **wrong** element has that id (e.g. two elements with same id), fix the TSX so each interactive element has a unique `data-node-id` at the exact file where the duplicate is set (e.g. `ContainerCreationsLanding-2.tsx`).

- **If screenKey differs between SAVE and CLICK:**
  - Fix: Ensure both panel and `TsxNavCapture` receive `screenKey` from the same canonical source (`getCanonicalNavScreenKey(screen, {})` with the same `screen` from the current URL). See section 2.

---

## Runtime trace: render → save → state → click

Instrumentation now logs:

1. **RENDER** — On every relevant render: `[NavInstrument] RENDER` with `{ screenKey, navTargetsMap, source: "panel" | "tsx-capture" }`.
2. **SAVE** — Same shape as before; also stores `__NAV_LAST_SAVE__` for mismatch check.
3. **STATE TABLE** — After each save (next tick).
4. **CLICK** — Full event path: `{ targetTag, closestNodeId, navTargetsMapEntryUsed }` plus full map and resolved target.
5. **MutationObserver** — When any `[data-node-id]` is added, removed, or duplicated in the DOM: `[NavInstrument] MutationObserver [data-node-id] change` with `{ added, removed, duplicateIds }`.
6. **ContainerCreationsLanding-2** — After each render: `[NavInstrument] RENDER` with `source: "ContainerCreationsLanding-2"` and `dataNodeIds` (every element’s `data-node-id` in the container).

When the same element is saved and then clicked, the tracer compares **expected** (from save) vs **got** (resolved at click). On first mismatch it logs:

- `[NavInstrument] FIRST MISMATCH — wrong navigation target at click`
- **Exact location:** Lookup happens at **`src/app/dev/page.tsx`** around **lines 201–202**: `nav = navTargetsMap?.[id]`. The incorrect value is either (1) the value stored in state for that `id`, or (2) the `id` used (wrong element / duplicate `data-node-id`).

**Proposed fix (by cause):**

| Cause | File and line | Fix |
|-------|----------------|-----|
| State has wrong value for this `elementId` | `src/03_Runtime/state/state-resolver.ts` L157–168 (merge), `src/07_Dev_Tools/nav/DevNavigationPanel.tsx` L152 (payload) | Ensure merge never overwrites other keys; ensure panel sends correct `screenKey` and `selectedElementId`. |
| Wrong `elementId` at click (duplicate or wrong node) | `src/app/dev/page.tsx` L197–199 (`closest`, `getAttribute`) | Ensure each interactive element has a unique `data-node-id` in the TSX (e.g. `ContainerCreationsLanding-2.tsx`). Fix duplicate ids at the source. |
| `screenKey` differs between save and click | Panel: `dev/page.tsx` L40–41; Click: L712 | Ensure both use `getCanonicalNavScreenKey(screen, {})` with the same `screen` from the current URL. |

---

## Enabling / disabling

- Instrumentation runs when `process.env.NODE_ENV === "development"` and `window.__NAV_INSTRUMENT__ !== false` (on by default in dev).
- Set `window.__NAV_INSTRUMENT__ = false` in the console to turn it off.
