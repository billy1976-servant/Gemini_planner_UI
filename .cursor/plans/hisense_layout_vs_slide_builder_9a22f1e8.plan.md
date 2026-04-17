---
name: HiSense layout vs slide builder
overview: Primary target is REAL live preview for slide layout picking—same pattern as OrganPanel’s PreviewRender (isolated tree + scaled render of actual structure/content), adapted to Container Creations via a landing-render adapter. SVG/static tiles are optional fallback only, not the main solution. No full json-skin vs landing engine merge.
todos:
  - id: extract-landing-slide-render
    content: Extract or parameterize ContainerCreationsLandingRenderer slide body so one screen can render with layoutOverride + readOnly preview context (minimum adapter)
    status: pending
  - id: landing-slide-live-preview
    content: Add LandingSlideLayoutPreview (scale + isolation + applyPaletteToElement) and wire LayoutTilePicker thumbnails to real preview nodes
    status: pending
  - id: layout-catalog-picker
    content: Centralize LANDING_LAYOUT_OPTIONS + pass deckPalette into inspector preview scope
    status: pending
  - id: optional-svg-fallback
    content: "(Optional) SVG or placeholder only when preview fails / perf guard—not primary UX"
    status: pending
isProject: false
---

# Slide builder: real live layout preview (planning only)

## A. Fake/static vs real live preview (explicit separation)

| Approach | What it is | Fidelity | Matches proven HiSense “layout picker” behavior? |
|----------|------------|----------|--------------------------------------------------|
| **A. Fake/static** | Semantic SVG sketches (`layoutThumbnails.tsx`), gray boxes, icons | Shows **silhouette only**; not user text/media/layout placement | **Partially** — OrganPanel uses this when `layoutViewMode` is **not** live, or as tile chrome |
| **B. Real live preview (strong)** | **[`PreviewRender.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/layout/PreviewRender.tsx)**: `structuredClone(screenModel)` → **`JsonRenderer`** with `sectionLayoutPresetOverrides` / `cardLayoutPresetOverrides` | **Actual screen JSON**, real nodes/content; only the **chosen layout dimension** is swapped | **Yes** — this is the **highest-fidelity** pattern in-repo for “what will it look like” |
| **C. Real layout / placeholder content** | **[`LayoutLivePreview.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/layout/LayoutLivePreview.tsx)**: `resolveLayout` + **`LayoutMoleculeRenderer`** + hard-coded “Sample heading/body” + placehold image | **Real** section *geometry* (molecule engine), **fake** copy/media | **Secondary** — useful for section ids, **not** a substitute for **user slide content** |

**Which one should be implemented for the slide builder (primary)?**

- **Target: B-class behavior**, **adapted to landing**: preview = **scaled render of the current slide’s real data** (`title`, `subtitle`, `content`, `media`, `buttons`, …) with **`layout` temporarily set to each option** — same *intent* as `PreviewRender` (isolate, override one axis, render real output), **different renderer** (`ContainerCreationsLandingRenderer`’s `renderScreen` path, not `JsonRenderer`).

- **Do not** implement **A** as the primary solution. **A** may remain **optional fallback** (slow devices, broken media, loading state).

**Where OrganPanel wires real vs fake**

- [`OrganPanel.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/04_Presentation/components/organs/OrganPanel.tsx) (~398–447): when `layoutViewMode === "live"` and `screenModel != null`, section tiles use **`PreviewRender`** (real). Otherwise tiles use **`LayoutLivePreview`** or **`getSectionLayoutThumbnail`** (SVG).

---

## B. Why the earlier plan drifted to SVG-first

- The slide builder’s `layout` values (`hero`, `twoCol`, …) **do not** map to `resolveLayout` / `pageLayouts` ids, so **`LayoutLivePreview`** cannot be dropped in without a **different** adapter.
- **`PreviewRender`** is bound to **json-skin** `screenModel` + `JsonRenderer`, while wizard decks are **`screens[]`** rendered by **[`ContainerCreationsLandingRenderer.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)** — so **`PreviewRender` is not directly reusable** for landing slides.
- To avoid a “big merge,” the earlier write-up **over-corrected** toward **low-coupling SVG tiles** instead of stating the correct non-merge path: **reuse the PreviewRender *pattern* (clone + override + scale) on the landing renderer**.

---

## C. Can real preview be adapted without a full engine merge?

**Yes.**

- **No** requirement to unify json-skin and landing **pipelines**.
- **Yes** requirement for a **minimum viable adapter**: a way to render **one** landing slide with **`layout` overridden** and **read-only / non-interactive** preview semantics, inside a **scaled viewport**, with optional **palette-scoped** root (`applyPaletteToElement` — [`palette-bridge.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/06_Data/site-renderer/palette-bridge.tsx)).

**What is missing today (the bridge)**

- Landing slide output is produced by **`renderScreen(screen)`** inside `ContainerCreationsLandingRenderer` (~1716+), which **closes over** component state (`canEdit`, `cfg`, `updateScreen*`, `renderMediaItem`, selection handlers, etc.). There is **no exported, override-friendly** “render this `Screen` with this `layout` for preview” API.

**Minimum viable adapter (smallest safe surface)**

1. **Extract** (or add a parallel internal function) **`renderLandingSlideForPreview(props)`** that takes:
   - `screen: Screen` (or `EditableNode`-shaped slide),
   - `layoutOverride: string`,
   - `cfg: LandingConfig` (for `shopUrl`, header, etc.),
   - `preview: true` → **forces** `canEdit`-like **false** for inline editors / click-to-select inside the tile; **no** `setSelectedLandingNodeId` from preview clicks,
   - shared helpers already used by `renderScreen` (`renderContentBlocks` options without mutations, `renderMediaItem` read-only).
2. Wrap each tile in the same **scaling mechanics** as [`PreviewRender`](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/layout/PreviewRender.tsx): fixed logical width (~1200), `ResizeObserver`, `transform: scale(containerWidth/BASE_WIDTH)`, height from content — **proven** in HiSense.
3. **Isolation**: `key={previewLayout}` + deep clone of `screen` if any child mutates props (prefer read-only code path to avoid clone cost).

This is **not** an engine merge; it is a **controlled extraction** from one large component file (or a `previewMode` branch inside `renderScreen`).

---

## D. Safest implementation plan — real preview path

### Phase 0 — Contract + inventory

- Freeze list of layout ids (existing `LANDING_LAYOUT_OPTIONS` in [`NodeInspector.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/editor/NodeInspector.tsx)) into one module for picker + preview loops.
- Document: preview tiles use **same** `screen` object as selected slide with **`{ ...screen, layout: optionId }`**.

**Risk:** Low  

**Tests:** Picker lists match renderer-supported `switch` cases; unknown layout still handled (existing append behavior).

### Phase 1 — Extract preview-capable render path (the adapter)

- Introduce **`renderScreenPreview`** (name flexible) used **only** for inspector tiles:
  - **Read-only** `LandingContentBlocksOptions` (no `onParagraphChange`, etc., or no-ops).
  - **No** selection outline / `setSelectedLandingNodeId` on preview root.
  - Accept **`layoutOverride`** applied **before** the existing `switch (screen.layout)` (or switch on `effectiveLayout`).
- Keep **one** source of truth for layout markup: **same** `switch` branches as production (move body into shared function if needed).

**Risk:** Medium (touches hot file — minimize diff, no behavior change for main canvas).  

**Tests:**

- [ ] Main deck: every layout still renders identically when not in preview.
- [ ] Preview: each option shows **user** headline/body/media where that layout supports them.
- [ ] No edits inside preview mutate deck state (type in preview if any field slips through).

### Phase 2 — `LandingSlideLayoutPreview` shell

New client component (suggested location under `Container_Creations/` or `app/ui/control-dock/layout/`):
  - `ref` + `applyPaletteToElement` using **`deckPalette`** from props (same resolution as landing root).
  - Copy **scale + ResizeObserver** pattern from `PreviewRender` (~`BASE_RENDER_WIDTH`, scaled height).
  - Renders **`renderScreenPreview({ ...node, layout: optionId }, …)`** per tile.

**Risk:** Low–medium (CSS vars, overflow).  

**Tests:**

- [ ] Changing **Deck theme** updates preview tiles.
- [ ] Tiles don’t blow inspector width; scroll works.

### Phase 3 — Wire `LayoutTilePicker` to real previews

- Pass **`thumbnail: <LandingSlideLayoutPreview … />`** for each option (not SVG).
- `onChange` still commits `layout` to JSON (unchanged).

**Risk:** Medium **performance** (N layouts × heavy render). **Mitigations:** lazy render off-screen tiles, `memo`, limit to visible row, or virtualize — plan to measure with ~8 layouts.

**Tests:**

- [ ] Clicking option updates selection + main canvas + export JSON.
- [ ] No React key warnings; no infinite update loops.

### Phase 4 (optional) — Fallback only

- If media fails or perf budget exceeded: show compact **error stub** or **degraded** SVG for that tile only — **not** default UX.

---

## E. What NOT to do (constraints restated)

- **Do not** treat **`LayoutLivePreview`** as the primary slide preview — it uses **sample** content and **section** `resolveLayout`, not wizard `renderScreen`.
- **Do not** bolt **`PreviewRender` + JsonRenderer** onto `landing-2.json` without converting the whole deck to json-skin — that **is** a different engine path (out of scope).
- **Do not** merge template profiles / `layout-definitions.json` into landing **in this phase**.

---

## F. Palette (unchanged facts, preview-relevant)

- Deck theme: `deckPalette` + `applyPaletteToElement` on landing root — [`ContainerCreationsLandingRenderer.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer.tsx).
- Preview tiles should use the **same** API on a **scoped** element so tokens match the main slide.

---

## G. Risk summary

| Phase | Risk |
|-------|------|
| 0 | Low |
| 1 | Medium (refactor of `renderScreen`) |
| 2 | Low–medium |
| 3 | Medium (perf — needs profiling) |
| 4 | Low |

---

## H. Reference: json-skin live preview (for comparison only)

- **[`PreviewRender.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/layout/PreviewRender.tsx)** — gold-standard **pattern** (clone + override + `JsonRenderer` + scale).
- **[`LayoutLivePreview.tsx`](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/layout/LayoutLivePreview.tsx)** — real molecules, **not** user slide content.

Slide builder implementation should **mirror PreviewRender’s shell**, **swap inner renderer** to **landing `renderScreen` preview adapter**.
