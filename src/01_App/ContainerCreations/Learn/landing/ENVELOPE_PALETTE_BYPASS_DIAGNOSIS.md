# Envelope / Palette Bypass — Diagnosis (Analysis Only, No Fix)

## Runtime path for `Business/Container_Creations/ContainerCreationsLanding-5` (and flow URL)

1. **Dev page** (`src/app/dev/page.tsx`): For the flow URL, `loadScreen` returns `path: "Runtime/FlowRuntimeScreen"`. The synthetic tree is built with `params: { path: screenPath }` where `screenPath = "tsx:Runtime/FlowRuntimeScreen"` (line 772–778). So the **requested path** in the tree is `"tsx:Runtime/FlowRuntimeScreen"` (not `Business/Container_Creations/ContainerCreationsLanding-5` unless the menu/nav sends that).

2. **Registry** (`src/lib/tsx-screen-registry.ts`): `getComponent(path)` is called with that path. `normalizePath(path)` → `"Runtime/FlowRuntimeScreen"`. `getLoader(path)` finds the loader (line 106–114). Registry returns `options.wrapInEnvelope(screenPath, Inner)` (line 162–163), i.e. a **wrapped** component.

3. **Dev page `wrapInEnvelope`** (lines 787–792): Called with `(screenPathForEnvelope, Component)`. Returns `Wrapped` = `() => <TSXScreenWithEnvelope screenPath={...} Component={Component} />`. So the value returned to JsonSkinEngine is **always envelope-wrapped** when the registry has a loader.

4. **JsonSkinEngine** (`src/05_Logic/logic/engines/json-skin.engine.tsx` lines 125–135): Gets `Component = tsxEmbed?.getComponent(path)`. Renders `<Component />`. So it renders whatever the dev page’s `getComponent` returned — which is the **wrapped** component (envelope + Inner). No second path; no raw component rendered here.

5. **TSXScreenWithEnvelope** (`src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`): Mounts the outer div with `ref={wrapperRef}` (line 142). In `useEffect` (lines 109–124), when `applyPalette` is true it runs `apply()` which calls `applyPaletteToElement(el, paletteName)` only when `el = wrapperRef.current` is truthy. Refs are set **after** the commit phase; on first mount the effect can run with `wrapperRef.current === null`, so `if (!el) return` (line 118) **skips** palette application. It runs again only on `subscribePalette` / `subscribeState` updates, not when the ref becomes non-null.

6. **Palette** (`src/06_Data/site-renderer/palette-bridge.tsx`): `applyPaletteToElement` is used from TSXScreenWithEnvelope (and layout’s `usePaletteCSS`). If the envelope’s effect never passes a non-null `el`, palette is never applied for that envelope.

---

## Temporary console logs added (for validation)

- **Registry** `getComponent`: logs `REQUESTED`, `AVAILABLE`, and `component found: yes` or `component found: no`.
- **Dev page** `wrapInEnvelope`: logs `[dev/page] ENVELOPE WRAP APPLIED` with `screenPath`.
- **TSXScreenWithEnvelope**: logs `[TSXScreenWithEnvelope] ENVELOPE MOUNTED` with `screenPath`; and before `applyPaletteToElement`, logs `[TSXScreenWithEnvelope] PALETTE APPLIED` with `paletteName`, `target`, `screenPath`.
- **palette-bridge** `applyPaletteToElement`: logs `[palette-bridge] PALETTE APPLIED` with `paletteName`, `target`, `id`.
- **JsonSkinEngine** `tsx-embed`: logs `[JsonSkinEngine] tsx-embed render` with `path`, `hasComponent`, `componentSource`.

---

## Answers

| Question | Answer |
|----------|--------|
| **Is the component bypassing TSXScreenWithEnvelope?** | **No.** The only return from the dev page’s `getComponent` is `getComponentFromRegistry(path, { wrapInEnvelope: ... })`, which returns a component that renders `TSXScreenWithEnvelope`. JsonSkinEngine renders that returned component; there is no branch that renders the raw screen without the envelope. |
| **Is palette application being skipped?** | **Yes (timing).** In TSXScreenWithEnvelope, the effect that applies palette runs once on mount; at that time `wrapperRef.current` can still be `null`, so `if (!el) return` skips the call. Nothing re-runs apply when the ref is attached, so the envelope’s palette can never be applied on first paint. |
| **Exact file and line where the bypass/skip happens** | **`src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`**: the early return when `!el` (line 118 in the `apply()` callback). That is where palette application is skipped (no envelope “bypass” in code; the envelope is always used). |
| **Exact file and line that must be changed to force envelope + palette every time** | **`src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`**: the same place. To fix the palette skip, ensure palette is applied when `wrapperRef.current` becomes available (e.g. callback ref that invokes the apply logic, or run apply when the ref is set / in a layout effect), not only once in the initial effect with a possibly null ref. No change needed for “forcing the envelope” — it is already the only path. |

---

## Summary

- **Envelope:** Not bypassed. Single render path: registry → wrapInEnvelope → JsonSkinEngine → `<Component />` = envelope-wrapped component.
- **Palette:** Can be skipped on first load because the envelope’s palette effect runs with `wrapperRef.current === null` and never runs again when the ref is set. The single fix point is **`src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`** (the apply/ref logic).
