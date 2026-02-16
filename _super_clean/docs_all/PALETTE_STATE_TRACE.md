# Palette state full trace — where palette state can die

## 1) Palette "Use" button click handler

- **File:** `src/app/ui/control-dock/RightFloatingSidebar.tsx`
- **Live panel "Use" button:** `onClick={() => handlePaletteChange(name)}` (line ~361)
- **Swatches panel:** same handler on palette button (line ~422)
- **Handler:** `handlePaletteChange(name)` (lines 176–183):
  - Log: `[palette] click` + name
  - Guard: `if (!(name in palettes)) return;`
  - `setValue("paletteName", name)` → `dispatchState("state.update", { key: "paletteName", value: name })`
  - Log: `[palette] state.update dispatched paletteName` + name
  - `setPalette(name)` (palette-store)
  - Log: `[palette] setPalette called` + name

## 2) DEV logs at each layer

| Layer | Log | File |
|-------|-----|------|
| Click handler | `[palette] click`, name | RightFloatingSidebar.tsx |
| State dispatch | `[state-dispatch] state.update`, key, value | state-store.ts |
| State resolver | `[state-resolver] state.update set`, key, value | state-resolver.ts |
| Palette store | `[palette-store] updating`, next | palette-store.ts |
| Root CSS | `[palette-root] applying palette`, name | palette-bridge.tsx (usePaletteCSS) |

All guarded with `process.env.NODE_ENV !== "production"` (or `=== "development"` where applicable).

## 3) How to confirm each step

- **Click fires:** You see `[palette] click <name>`.
- **Handler runs:** You see the two follow-up logs from the handler and `[state-dispatch] state.update paletteName <name>`.
- **Store (state) updates:** You see `[state-resolver] state.update set paletteName <name>`.
- **Palette store updates:** You see `[palette-store] updating <name>` (only when the name actually changes; same name early-returns).
- **Root CSS reapplies:** You see `[palette-root] applying palette <name>`.

## 4) If click fires but store does not update

- If you see `[palette] click` but **no** `[state-dispatch] state.update`: `setValue` is not being called (e.g. guard `!(name in palettes)` returned) or the click is on a different control.
- If you see `[state-dispatch]` but **no** `[state-resolver] state.update set`: intent in state-resolver is different (e.g. typo: `state:update` vs `state.update`) or payload shape is wrong. **Confirmed:** handler uses `"state.update"` (dot); state-resolver only handles `"state.update"`.
- If you see `[state-resolver]` but **no** `[palette-store] updating`: palette-store is correct; problem is only state. If you see `[palette-store]` but **no** `[palette-root] applying palette`: root subscription (usePaletteCSS) is not re-running — e.g. layout not re-subscribed or listeners not the same instance.

## 5) Which state system Layout panel uses vs Palette panel

- **Palette panel:** `RightFloatingSidebar` → `handlePaletteChange` → `setValue("paletteName", name)` (state-store) and `setPalette(name)` (palette-store). Same module imports: `@/state/state-store`, `@/engine/core/palette-store`.
- **Layout panel:** Same sidebar; Layout panel content is `OrganPanel` (section/card/organ overrides). Overrides use `section-layout-preset-store`, `organ-internal-layout-store`, etc. Palette uses **state-store** + **palette-store** only.
- **No extra palette providers:** There is no React context for palette. Both layout and RightFloatingSidebar use the same module-level stores (`state-store.ts`, `palette-store.ts`).

## 6) RightFloatingSidebar and provider tree

- **Where it’s rendered:** `src/app/page.tsx` renders `<RightFloatingSidebar ... />` as a sibling to the main content (inside the same Page component).
- **Portal:** `RightFloatingSidebar` (wrapper) does `createPortal(<RightFloatingSidebarInner />, document.body)`. So the **DOM** is under `document.body`, but the **React tree** is unchanged: `RightFloatingSidebarInner` is still a descendant of Layout → Page. Same React root, same module singletons.
- **Layout:** `RootLayout` (layout.tsx) calls `usePaletteCSS()` and uses `useSyncExternalStore(subscribeState, getState, getState)`. So layout subscribes to the same state-store and (via usePaletteCSS) to palette-store. RightFloatingSidebar lives under layout’s children (Page), so it shares the same store instances.

**Conclusion:** Palette panel and main app (and layout) use the same state/store layer and the same provider tree; the portal only moves DOM, not React context or store identity.

## Expected log order when a palette is clicked (e.g. "playful")

1. `[palette] click playful`
2. `[state-dispatch] state.update paletteName playful`
3. `[state-resolver] state.update set paletteName playful`
4. `[palette-store] updating playful`
5. `[palette] setPalette called playful`
6. `[palette-root] applying palette playful` (once or twice: from subscribeState and subscribePalette)

If **stateChanges = 0** in telemetry but you see the logs above, the telemetry may be counting something other than these updates (e.g. a different intent or a different “change” metric). If one of the log lines is missing, that step is where the chain stops.
