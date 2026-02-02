# Layout Preset Trace Report

**Goal:** Determine precisely which visual properties change when a section’s `layoutPreset` changes.

**Date:** 2025-02-01

---

## 1. Full Data Path (layoutPreset → SectionCompound)

### 1.1 OrganPanel → Store

- **OrganPanel** (`src/organs/OrganPanel.tsx`):
  - Receives `sectionLayoutPresetOverrides` (sectionKey → presetId) and `onSectionLayoutPresetOverride(sectionKey, presetId)`.
  - Layout Preset dropdown: `onChange={(e) => onSectionLayoutPresetOverride(sectionKey, e.target.value)}`.
- **Page** (`src/app/page.tsx`):
  - `sectionLayoutPresetOverrides = getOverridesForScreen(screenKey)` (from `section-layout-preset-store`).
  - `onSectionLayoutPresetOverride={(sectionKey, presetId) => setSectionLayoutPresetOverride(screenKey, sectionKey, presetId)}`.
- **section-layout-preset-store** (`src/state/section-layout-preset-store.ts`):
  - `setSectionLayoutPresetOverride(screenId, sectionKey, presetId)` updates in-memory map and localStorage, then notifies listeners.
  - `getOverridesForScreen(screenId)` returns `Record<string, string>` (sectionKey → presetId) for that screen.
  - Page uses `useSyncExternalStore(subscribeSectionLayoutPresetOverrides, getSectionLayoutPresetOverrides, …)` so re-renders when overrides change.

### 1.2 JsonRenderer

- **JsonRenderer** receives `sectionLayoutPresetOverrides` (and `screenId`) and passes them into `applyProfileToNode` and `renderNode` on every render.
- **applyProfileToNode** (`src/engine/core/json-renderer.tsx`, ~359–382):
  - For each node with `type === "section"`:
    - `sectionKey = node.id ?? node.role ?? ""`.
    - `effectivePreset = sectionLayoutPresetOverrides?.[sectionKey] ?? node.layoutPreset ?? null`.
    - `(next as any)._effectiveLayoutPreset = effectivePreset` (string or null).
    - If `effectiveLayoutPresetId` is set, `preset = getSectionLayoutPreset(effectiveLayoutPresetId)` from `section-layout-presets.ts`.
    - If `preset` exists, **merge preset into `next.params`** (preset wins):
      - `next.params = { ...(next.params ?? {}), ...preset }`
      - `moleculeLayout` is merged deeply: `moleculeLayout: { ...(next.params?.moleculeLayout ?? {}), ...(preset.moleculeLayout ?? {}) }`.
    - `(next as any)._sectionPresetApplied = true` when a preset was applied.
- **renderNode** uses the profiled node (with merged params) and passes `resolvedNode.params` (and content, children) into the Section component. So **SectionCompound receives the merged `params`** (including `containerWidth`, `heroMode`, `moleculeLayout`, `backgroundVariant` from the preset).

### 1.3 SectionCompound

- **SectionCompound** (`src/compounds/ui/12-molecules/section.compound.tsx`) receives:
  - `id`, `params`, `content`, `children`.
- It **does not** receive `layoutPreset` or `_effectiveLayoutPreset`; those exist only on the node inside JsonRenderer. Only the **result** of the preset (merged into `params`) is visible in SectionCompound.
- A **console.log** was added to log the final params received by SectionCompound when they change (see §3). In the browser console, look for `[SectionCompound] final params` with `id`, `params` snapshot, and `fullParams`.

---

## 2. Where "layoutPreset" and "_effectiveLayoutPreset" Are Used

| Location | Usage |
|----------|--------|
| `json-renderer.tsx` (applyProfileToNode) | Resolves `effectivePreset = sectionLayoutPresetOverrides?.[sectionKey] ?? node.layoutPreset`, sets `(next as any)._effectiveLayoutPreset`, merges preset into `next.params`. |
| `json-renderer.tsx` (SectionLayoutDebugOverlay) | Reads `(node as any)?._effectiveLayoutPreset ?? node?.layoutPreset` for debug UI label. |
| `json-renderer.tsx` (renderNode) | Uses `profiledNode` (which has `_effectiveLayoutPreset` and merged params); does not pass `_effectiveLayoutPreset` to Section component. |
| `app-1.json` (journal_track) | Section node has `"layoutPreset": "hero-centered"`. |
| `JSON_SCREEN_CONTRACT.json` | `layoutPreset` listed in allowedParams and optionalKeysPerNode. |

---

## 3. Logging Added

In **SectionCompound**:

- On the client, when `params` (or the extracted snapshot) change, a single **console.log** runs:  
  `[SectionCompound] final params` with:
  - `id`
  - `params`: snapshot of `containerWidth`, `heroMode`, `moleculeLayout`, `layout`, `backgroundVariant`, alignment (from moleculeLayout.params.align), spacing (from moleculeLayout.params.gap or layout.gap)
  - `fullParams`: full `params` object
- Deduplication is by `section-params:${id}` so each section logs when its params actually change (e.g. when user picks a different layout preset).

---

## 4. Params That Change Between Presets

Presets are defined in **section-layout-presets.ts** (`SECTION_LAYOUT_PRESETS`). Each preset can set:

| Param | Meaning | Example values / notes |
|-------|---------|------------------------|
| **containerWidth** | Section outer width / containment | `"contained"`, `"edge-to-edge"`, `"narrow"`, `"wide"`, `"full"`, `"split"`, or CSS (e.g. `"var(--container-narrow)"`, `"600px"`, `"100vw"`) |
| **heroMode** | Hero wrapper style | `"centered"`, `"split"`, `"full-screen"`, `"overlay"`, `"strip"` |
| **backgroundVariant** | Surface background token | `"default"`, `"hero-accent"`, `"alt"`, `"dark"` |
| **moleculeLayout** | Layout of the section’s **internal slot** (title) | `{ type: "column"|"row"|"grid"|"stacked", preset?, params: { gap, align, justify, padding, columns, gridTemplateColumns, ... } }` |

**layout**: SectionCompound merges `params.layout` with `moleculeLayout.params` to build `layoutParams`; preset provides values via `moleculeLayout.params` (gap, padding, align, justify, etc.), so **layout** (as used for slot layout) effectively changes with the preset.

**alignment / spacing**: These are not top-level params. They come from:
- **alignment**: `params.moleculeLayout?.params?.align`
- **spacing**: `params.moleculeLayout?.params?.gap` (or `params.layout?.gap`)

So when the preset changes, the **exact params that change** are:

- **containerWidth**
- **heroMode**
- **backgroundVariant** (when preset defines it)
- **moleculeLayout** (type + params: gap, align, justify, padding, columns, etc.)
- **layout**: only insofar as SectionCompound merges `params.layout` with `moleculeLayout.params`; the preset does not set `params.layout` directly, but it sets `moleculeLayout.params`, which drives the same layout.

---

## 5. Are These Params Passed Down to Child Molecules?

**No.** SectionCompound does not pass `containerWidth`, `heroMode`, `moleculeLayout`, `layout`, or `backgroundVariant` to its children.

- Children are **pre-rendered** by JsonRenderer: each child is rendered via `renderNode(child, ...)` and becomes a React node. SectionCompound receives them as `children` and only places them in the tree (e.g. `{laidOutSlots}{children}` or, in split mode, in the second column).
- Card, MediaAtom, etc. receive their own `params` from their **own** node in the JSON tree, not from the section. So **layoutPreset does not change any props on Card, MediaAtom, or other child molecules**.

---

## 6. What layoutPreset Actually Controls

### A. Summary

| Question | Answer |
|----------|--------|
| Section width only? | **No.** It also affects hero wrapper, background, and internal slot layout. |
| Section grid arrangement? | **Partially.** Only the **section’s internal slot** (title) can be row/column/grid via `moleculeLayout`. The **section’s children** (e.g. list of Cards) are **not** laid out by this grid; they are just rendered in order after the slot. |
| Child molecule layout? | **No.** Child molecules get their own node params; section preset is not passed down. |
| Internal content positioning (image left/right, overlay, etc.)? | **Partly.** `heroMode` (e.g. full-screen, overlay, strip) and `containerWidth === "split"` affect the **section** (wrapper and two-column split). The split mode puts **slot content** in one column and **children** in the other; it does not set “image left/right” on individual Cards. |

### B. Exact Visual Differences Caused by layoutPreset

1. **Section width**
   - **containerWidth** drives the section’s outer `maxWidth` (or full width for edge-to-edge/full).
   - Values: contained, narrow, wide, full, split, edge-to-edge, or custom CSS (e.g. `var(--container-narrow)`, `600px`, `100vw`).

2. **Hero wrapper**
   - **heroMode** adds a wrapper div with styles:
     - `full-screen`: minHeight 100vh, flex center.
     - `strip`: vertical padding.
     - `overlay`: relative, minHeight 60vh, flex center.
     - `centered` / `split`: no extra wrapper in current code; heroMode is still in params for future use.

3. **Two-column split**
   - When **containerWidth === "split"**, SectionCompound renders a 2-column grid: first column = laidOutSlots (section title/slot), second column = children. So “image left/right” at section level is this split, not per-Card.

4. **Section background**
   - **backgroundVariant** maps to Surface tokens: hero-accent, alt, dark (or default). This is the section’s SurfaceAtom background.

5. **Section internal slot layout (title only)**
   - **moleculeLayout** (type + params) is used only for **slotContent** (the section’s title), wrapped in SequenceAtom or CollectionAtom (column/row/grid). Gap, padding, align, justify, columns, etc. apply to that slot content only, **not** to the list of child components (Cards, etc.).

6. **What does not change**
   - Child molecule layout (Card, MediaAtom, etc.).
   - Per-child image position, overlay, or alignment; those come from each child’s own node/params.

---

## 7. Files Touched (Trace Only)

- **src/compounds/ui/12-molecules/section.compound.tsx**: Added a client-only console.log when the section’s params change, to inspect final params received for different layoutPreset choices. No logic change.

---

## 8. How to Verify in UI

1. Open an app that has a section with a layout preset dropdown (e.g. journal_track with a hero section).
2. Open devtools → Console.
3. Change the “Layout Preset” dropdown (e.g. hero-centered → hero-full-bleed-image → content-narrow).
4. Look for `[SectionCompound] final params` and compare `params` and `fullParams` across selections to confirm which of `containerWidth`, `heroMode`, `moleculeLayout`, `backgroundVariant`, and derived alignment/spacing change.
