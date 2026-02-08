# Global Remount Trace Report

## Phase 1 — Mount/Unmount Instrumentation

### Components instrumented

- **RootLayout** — `src/app/layout.tsx` — `[MOUNT]` / `[UNMOUNT]` RootLayout
- **Page** — `src/app/page.tsx` — `[MOUNT]` / `[UNMOUNT]` Page
- **WebsiteShell** — `src/lib/site-skin/shells/WebsiteShell.tsx`
- **AppShell** — `src/lib/site-skin/shells/AppShell.tsx`
- **LearningShell** — `src/lib/site-skin/shells/LearningShell.tsx`
- **JsonRenderer** — `src/engine/core/json-renderer.tsx`

### How to use

1. Open app; load a JSON screen (e.g. any app from Navigator).
2. Open devtools console. Note initial `[MOUNT]` order (RootLayout → Page → Shell → JsonRenderer).
3. Change **only** the Palette dropdown (e.g. default → crazy).
4. If any `[UNMOUNT]` appears, the **highest** component that unmounts is the remount source (its parent recreated it).

### Phase 1 finding (to be filled after run)

| Trigger       | Highest component that logged UNMOUNT |
|---------------|----------------------------------------|
| Palette change| _(run and record)_                     |
| Template change | _(optional)_                        |
| Screen change | _(optional)_                           |

---

## Phase 2 — Identity breaker locations (inspection)

### Keys above JsonRenderer

| Location | Key / identity | Depends on palette/state? |
|----------|----------------|----------------------------|
| `layout.tsx` | No key on `{children}` (Page) | No |
| `page.tsx` | `key={screenContainerKey}` on JsonRenderer only | No — `screenContainerKey = screen-${screenKey}-${currentTemplateId \|\| "default"}` (structure only) |
| Shells (Website/App/Learning) | No key on shells | No |

No other `key=` in the layout chain above JsonRenderer. The only mount-controlling key is on JsonRenderer and is structure-only.

### Object spreads / new refs each render (stabilized in Phase 3)

- **effectiveProfile** — Recomputed every render with object spread; now memoized with deps `[experience, effectiveTemplateId, effectiveLayoutMode]`.
- **layoutFromState** — `getLayoutOverridesFromState(screenKey)` returned new object every time; now memoized with deps `[screenKey, stateSnapshot?.layoutByScreen?.[screenKey]]` so palette-only state updates do not create new refs when layout overrides are unchanged.
- **sectionLayoutPresetOverrides / cardLayoutPresetOverrides** — Now memoized with deps `[screenKey, sectionLayoutPresetFromState]` and `[screenKey, cardLayoutPresetFromState]` so refs are stable when layout state for this screen is unchanged.

### Conditional rendering

- Page returns different **shells** by `experience` (website → WebsiteShell, app → AppShell, learning → LearningShell). Changing experience intentionally swaps the tree; not triggered by palette.
- No conditional that swaps trees on palette or on `state.values` other than experience/template/screen.

### Store subscriptions

- RootLayout and Page use `useSyncExternalStore(subscribeState, ...)` and `subscribePalette`/`subscribeLayout`. Subscriptions cause **re-render** only; they do not change any component key. Remount would only occur if a parent passed a key that changed — none do.

---

## Phase 3 — Stabilization applied

1. **Keys** — No key above JsonRenderer depends on palette/state/layout mode/profile. JsonRenderer key remains `screenContainerKey` (screen + templateId only).
2. **Memoization in page.tsx**  
   - `layoutFromState` — `useMemo(() => getLayoutOverridesFromState(screenKey), [screenKey, stateSnapshot?.layoutByScreen?.[screenKey]])`.  
   - `effectiveProfile` — `useMemo(..., [experience, effectiveTemplateId, effectiveLayoutMode])`.  
   - `sectionLayoutPresetOverrides` / `cardLayoutPresetOverrides` — `useMemo(..., [screenKey, sectionLayoutPresetFromState])` and same for card.  
   So palette (or other non-layout state) change causes re-render but does not create new override/profile refs when layout data is unchanged.

---

## Phase 4 — Scope validation (expected behavior)

| Trigger | Expected | Rationale |
|--------|----------|-----------|
| **Palette change** | Re-render only; no UNMOUNT | Key is structure-only; override/profile refs memoized. |
| **Template change** | Remount allowed | `screenContainerKey` includes templateId; new template → new key → remount. |
| **Screen change** | Remount allowed | screenKey changes → new key → remount. |
| **Experience change** | Different shell (Website/App/Learning) | Different component tree by design; not a bug. |

After stabilization: switch palette multiple times and confirm no `[UNMOUNT]` in console. Switch template/screen and confirm remount occurs as intended.

---

## Phase 5 — Final report (root cause and fix)

### Root cause component

**If** instrumentation shows an UNMOUNT on palette change, the **highest** component that logs UNMOUNT is the remount source (its parent recreated it). From code inspection, the only key that could have forced remount was already corrected earlier: JsonRenderer’s key was changed from including palette to structure-only (`screenContainerKey`). No other key in the tree (layout, page, shells) depends on palette or visual state.

### Why it would remount (if it did)

- **If JsonRenderer unmounted on palette change (before key fix):** Its parent (Page) passes `key={screenContainerKey}`. If that key had previously included palette, changing palette would change the key and force React to unmount the old JsonRenderer and mount a new one.
- **If Page or RootLayout unmounted:** That would require the Next.js App Router or layout to pass a changing key to `children`; inspection shows no key on `{children}`.

### Identity signal

- The only mount-controlling identity signal in the chain is **`screenContainerKey`** on JsonRenderer: `screen-${screenKey}-${currentTemplateId || "default"}`. It is derived from screen path (or json hash) and templateId only.

### What was stabilized

1. **Key** — Confirmed and documented: JsonRenderer key is structure-only (no palette/theme/state in key).
2. **Memoization** — In page.tsx: `layoutFromState`, `effectiveProfile`, `sectionLayoutPresetOverrides`, `cardLayoutPresetOverrides` are memoized so that when only palette (or other non-structural state) changes, the object references passed to JsonRenderer do not change when the underlying layout data is unchanged. This reduces unnecessary reconciliation and avoids any downstream identity confusion from new refs every render.

### Confidence level

- **High** that the only remount trigger in this chain is the JsonRenderer key, and that it is now structure-only.
- **High** that no other key above JsonRenderer (layout, page, shells) causes remount on palette change.
- **Medium-high** that memoization of profile and overrides prevents any remaining “identity breaker” from new object refs; if instrumentation still shows UNMOUNT on palette change after this pass, the next step is to run the app, trigger palette change, and record which component logs UNMOUNT to identify any remaining parent (e.g. framework or provider) recreating the tree.
