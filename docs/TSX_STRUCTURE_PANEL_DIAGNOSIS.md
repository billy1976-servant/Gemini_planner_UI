# TSX Structure Panel — Runtime Flow Diagnosis

## Summary

**Break point: D) Structure resolving but TSX not using it**

The panel writes overrides, the envelope subscribes and re-resolves, and the resolver receives metadata and returns the new structure. The active TSX screen (e.g. `FocusWorkStudio`) never reads `structureConfig` or `structureType`, so changing structure in the panel has no visible effect.

---

## 1) Panel writing overrides

**File:** `src/lib/tsx-structure/tsx-structure-override-store.ts`

- **Change:** Added temporary log inside `setTsxStructureOverride`:
  ```ts
  console.log("TSX OVERRIDE SET", screenPath, metadata)
  ```
- **How to confirm:** Open the TSX panel, pick a structure type + template, click **Apply**. In the browser console you should see `TSX OVERRIDE SET <screenPath> <metadata>`.
- **Expected:** Log fires when Apply is clicked; panel is writing.

---

## 2) Envelope subscribed and resolving

**File:** `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`

- **Subscription:** The envelope already calls `subscribeTsxStructureOverride(() => setOverrideVersion((n) => n + 1))` in `useEffect`. When the store notifies, `overrideVersion` updates, so the `useMemo` that calls `resolveAppStructure` runs again.
- **Change:** Log before/after resolution:
  - Before: `console.log("ENVELOPE RESOLVING", screenPath, getTsxStructureOverride(screenPath))`
  - After: `console.log("RESOLVED STRUCTURE", resolved.structureType, Object.keys(resolved.template || {}).slice(0, 5))`
- **How to confirm:** After clicking Apply in the TSX panel, you should see `ENVELOPE RESOLVING` and `RESOLVED STRUCTURE` with the new type and template keys.
- **Expected:** Envelope is subscribed and re-resolves with override.

---

## 3) Resolver receiving metadata

**File:** `src/lib/tsx-structure/resolver/index.ts`

- **Change:** At the top of `resolveAppStructure`:
  ```ts
  console.log("RESOLVER INPUT", screenPath, metadata)
  ```
- **How to confirm:** When the envelope re-resolves after Apply, the console should show `RESOLVER INPUT` with the same `screenPath` and the override `metadata` (with `structure.type`, `structure.templateId`, etc.).
- **Expected:** Resolver receives the override; convention uses metadata (step 3 in `resolveByConvention`).

---

## 4) Structure type changing

- **Where:** Logged in the envelope after `resolveAppStructure`: `RESOLVED STRUCTURE <structureType> [template keys]`.
- **Expected:** After applying e.g. "board" + "pipeline", logs show `structureType: "board"` and template keys reflecting the board template. So resolution is correct.

---

## 5) TSX screen consuming structure

**Checked:** All TSX screens under `src/01_App/apps-tsx/`.

- **Finding:** No screen uses `useAutoStructure()` or `useStructureConfig()`.
- **FocusWorkStudio:** Receives props from the envelope as `<Component {...structureProps} />` (i.e. `structureConfig`, `structureType`, `schemaVersion`, `featureFlags`). The component does **not** destructure or use any of these; it only uses local state and fixed layout.
- **Conclusion:** The envelope passes the resolved structure into the screen, but the screen ignores it. So layout/behavior does not change when the panel updates structure.

---

## Flow (verified by logs)

| Step | What happens | Log / check |
|------|----------------|-------------|
| 1 | User clicks Apply in TSX panel | `TSX OVERRIDE SET` with screenPath and metadata |
| 2 | Store notifies listeners | Envelope’s subscription runs → `setOverrideVersion` |
| 3 | Envelope re-renders, useMemo runs | `ENVELOPE RESOLVING` with screenPath and override |
| 4 | resolveAppStructure(screenPath, override) | `RESOLVER INPUT` with screenPath and metadata |
| 5 | Convention uses metadata → loadTemplate | `RESOLVED STRUCTURE` with new structureType and template keys |
| 6 | Envelope passes structureProps to Component | Component does not use them → **no visible change** |

---

## First failure (break point)

**D) Structure resolving but TSX not using it**

- Panel: writes overrides ✅  
- Envelope: subscribes and re-resolves ✅  
- Resolver: receives override and returns new structure ✅  
- Screen: does not read `structureConfig` / `structureType` (or use `useAutoStructure` / `useStructureConfig`) ❌  

So the pipeline works; the only missing piece is the screen actually using the resolved structure (e.g. switch layout by `structureType`, or pass `structureConfig` into a list/board/timeline engine).

---

## Next steps (to make panel changes visible)

1. **Option A — Use structure in the screen:** In `FocusWorkStudio` (or any TSX screen that should react to the panel):
   - Use `useAutoStructure()` from `@/lib/tsx-structure`, or
   - Destructure `structureType` / `structureConfig` from props and branch layout/UI on `structureType` (list vs board vs timeline, etc.).
2. **Option B — Keep diagnostics:** Remove or gate the temporary `console.log` calls once you are done debugging (or leave them behind a dev flag).
