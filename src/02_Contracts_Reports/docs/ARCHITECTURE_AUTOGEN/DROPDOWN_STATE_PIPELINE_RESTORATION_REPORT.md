# Dropdown → State Pipeline Restoration Report

## 1. Dropdowns that were only using local state

| Location | Dropdown | Previous behavior | Keys now updated via action |
|----------|----------|-------------------|-----------------------------|
| **src/app/layout.tsx** | Experience (Website/App/Learning) | `setExperience` + `setLayout({ experience })` only | `experience` |
| **src/app/layout.tsx** | Layout mode (Template/Custom) | `setLayout({ mode })` only | `layoutMode` |
| **src/app/layout.tsx** | Template (section layout list) | `setLayout({ templateId })` only | `templateId` |
| **src/app/layout.tsx** | Palette | `onPaletteChange` → setPalette + setPaletteName only | `paletteName` |
| **src/organs/OrganPanel.tsx** | Section layout preset (per section) | `onSectionLayoutPresetOverride(sectionKey, value)` only | `sectionLayoutPreset.{sectionKey}` |
| **src/organs/OrganPanel.tsx** | Card layout preset (per section) | `onCardLayoutPresetOverride(sectionKey, value)` only | `cardLayoutPreset.{sectionKey}` |
| **src/organs/OrganPanel.tsx** | Organ internal layout (per section) | `onOrganInternalLayoutOverride(sectionKey, value)` only | `organInternalLayout.{sectionKey}` |
| **src/dev/section-layout-dropdown.tsx** | Section layout (per section, dev panel) | `setSectionLayout(sectionId, value)` → `onChange(clone(screenJson))` only | `devSectionLayout.{sectionId}` |

**Not changed (navigator only):** Category, Folder, and File selects in layout.tsx still only update local state and router; they control which screen is loaded, not layout/view rendering.

---

## 2. Keys they should update (and what consumes them)

- **experience, layoutMode, templateId, paletteName** — Written to **state-store** via `state:update`. **Consumed for rendering:** page.tsx and json-renderer get experience/templateId/mode from **layout-store** (getLayout()) and palette from **palette-store**, not from state. So visual updates still come from the existing `setLayout` / `onPaletteChange` calls; the new actions add a state-store mirror and restore the behavior trace.
- **sectionLayoutPreset.{sectionKey}, cardLayoutPreset.{sectionKey}, organInternalLayout.{sectionKey}** — Written to state-store. **Consumed for rendering:** JsonRenderer receives section/card/organ overrides as props from **section-layout-preset-store** and **organ-internal-layout-store** (via page.tsx). So layout still reacts to the existing callbacks; state is updated in parallel for trace and future use.
- **devSectionLayout.{sectionId}** — Written to state-store. **Consumed:** Dev-only; the visible update is still the parent’s `onChange(clone(screenJson))`. State key is for trace/consistency.

---

## 3. Confirmation: CustomEvent("action") added

- **layout.tsx:** Experience, layout mode, template, and palette dropdowns now dispatch `window.dispatchEvent(new CustomEvent("action", { detail: { type: "Action", params: { name: "state:update", key: "...", value } } }))` before calling the existing setter (setExperience, setLayout, onPaletteChange).
- **OrganPanel.tsx:** All three select types (section layout, card layout, organ internal layout) dispatch the same `"action"` event with `name: "state:update"` and the appropriate key/value before calling the existing override callbacks.
- **section-layout-dropdown.tsx:** The section layout select dispatches `"action"` with `name: "state:update"` and key `devSectionLayout.{sectionId}` before calling `setSectionLayout`.

No new event names were introduced; all use `CustomEvent("action")` with `params.name: "state:update"`.

---

## 4. Confirmation: no duplicate event systems

- **No new listeners** — Only the existing `"action"` listener in behavior-listener.ts is used.
- **No new event types** — No "select-change", "dropdown-change", or similar; only `"action"` with `params.name: "state:update"`.
- **behavior-listener, state-store, layout-resolver** — Unchanged. The listener already maps `state:update` to `dispatchState("state.update", { key, value })`; that path is now used by these dropdowns.

---

## 5. State binding verification (json-renderer)

- **State snapshot** is passed into `renderNode` as `stateSnapshot` (currentView + values from state-store).
- **Visibility** uses `stateSnapshot` in `shouldRenderNode(node, stateSnapshot, defaultState)` for `when` rules (e.g. state key vs equals).
- **Field/Select** controlled values are bound from `stateSnapshot.values[key]` / `stateSnapshot[key]` in the existing Phase B blocks.
- **Layout/experience/template/palette** are still driven by layout-store and palette-store (and preset stores for section/card/organ overrides). The new state keys (`experience`, `templateId`, `layoutMode`, `paletteName`, `sectionLayoutPreset.*`, etc.) are written for trace and potential future consumers; current rendering does not read these keys from state for layout or palette.

---

## 6. Expected result after fix

When any reconnected dropdown changes:

1. **Interaction trace** can show the interaction.
2. **Behavior** — listener receives `"action"`, `actionName === "state:update"`, and runs the state:* branch.
3. **State** — `dispatchState("state.update", { key, value })` runs; state-store and state-resolver update.
4. **Render** — Subscribers (including JsonRenderer) re-render. Visual change for experience/template/palette/section/card/organ layout still comes from the existing stores and callbacks; state-store now mirrors the update and the pipeline is restored for tracing and future use.
