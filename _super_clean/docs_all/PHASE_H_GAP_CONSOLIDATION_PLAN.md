# PHASE H — GAP CONSOLIDATION PLAN (ANALYSIS ONLY)

**Goal:** Make layout the single authority for gap, exactly like padding + width.

**No file modifications. Report only.**

---

## 1) layout-definitions.json

**contentColumn.gap**
- **Location:** `pageLayouts` entries that use split layout: `contentColumn.gap`.
- **Values:** `"var(--spacing-6)"` on hero-split, hero-split-image-right, hero-split-image-left (lines 22, 61, 100).
- **Consumer:** [LayoutMoleculeRenderer.tsx](src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx) lines 188, 194: `contentColumnGap = requireLayoutValue("contentColumn.gap", contentColumnLayout.gap, layoutId)` → `contentColumnStyle.gap`. Applied only to the content column div in **split** layouts.

**componentLayouts.params.gap**
- **Location:** `componentLayouts` (lines 211–314): each entry has `params.gap`.
- **Values:** e.g. `"var(--spacing-10)"` (hero-centered), `"var(--spacing-12)"` (hero-split variants), `"var(--spacing-6)"` (hero-full-bleed-image), `"var(--spacing-8)"` (content-narrow, content-stack, image-left-text-right, features-grid-3, testimonial-band, cta-centered).
- **Consumer:** LayoutMoleculeRenderer: `mlParams.gap` → `requireLayoutValue("moleculeLayout.params.gap", mlParams.gap, layoutId)` (line 284). Used as: (1) `splitLayoutStyle.gap` when split (line 316), (2) passed into `resolveMoleculeLayout(..., moleculeLayout.params)` → `resolved` → **SequenceAtom** / **CollectionAtom** when non-split (lines 337–349).

**Summary:** layout-definitions is the **runtime** source for section-level gap in the main render path (resolveLayout merges pageLayouts + componentLayouts from this file only).

---

## 2) template-profiles.json

**Section spacing + layout gap usage**
- **Location:** Each template object has `sections` key; each section (e.g. `nav`, `header`, `hero`, `content`, `features`, `footer`) has `type` and `params`; `params.gap` appears in **rem** (e.g. `"1rem"`, `"1.25rem"`, `"2rem"`, `"2.5rem"`, `"3rem"`, `"0.5rem"`, `"0.75rem"`).
- **Approx. count:** 80+ gap entries across the file (many section roles per template, many templates).
- **Consumer:** Not fed into the main resolveLayout → LayoutMoleculeRenderer path. [layout-resolver.ts](src/04_Presentation/layout/resolver/layout-resolver.ts) uses `getPageLayoutById(layoutId)` and `resolveComponentLayout(layoutId)` from layout-definitions only. Template-profiles are used for template metadata (defaultSectionLayoutId, visualPreset, spacingScale, etc.) and for **section role → layout id** and possibly other pipelines (e.g. export, save-current-as-template). So template-profiles gap is a **parallel / alternate** definition set; if any other code path merges `sections[role].params` into the section layout, that would be a second source of gap for that path.

**Summary:** template-profiles defines gap per template per section role; currently not the source for the main render path, but a large duplicate definition set that could conflict if merged later.

---

## 3) visual-presets.json

**layout.gap usage**
- **Location:** Per-preset (default, compact, spacious, editorial, elevated, floating, etc.) under `section`, `list`, `toolbar`.
- **Values:** Tokens: `"spacing.stackGap"`, `"spacing.compactGap"`, `"gap.xl"`, `"gap.2xl"`, `"spacing.inlineGap"`.
- **Examples:**
  - `section.layout.gap`: spacing.stackGap, spacing.compactGap, gap.xl, gap.2xl.
  - `list.collection.gap` and `list.layout.gap`: spacing.stackGap, spacing.inlineGap, spacing.compactGap, gap.xl, gap.lg.
  - `toolbar.layout.gap`: spacing.inlineGap.
- **Consumer:** Applied when **resolveParams** (palette-resolver) merges visual preset into section/card/list params. That affects **surface/title/body** and any **layout** params passed down to molecules/cards/lists. So for a section rendered with a visual preset, **section.layout.gap** from the preset can be merged into the section’s params. If that merged result is then used to drive the section’s inner layout (e.g. the div that gets SequenceAtom/CollectionAtom), visual-presets would be a **second source** of gap alongside layout-definitions. If the section’s layout definition is taken purely from resolveLayout (layout-definitions) and visual-presets only style surface/typography, then gap in LayoutMoleculeRenderer comes only from layout-definitions. **Conclusion:** visual-presets **section.layout.gap** and **list/toolbar** gap are used for list/card/toolbar internals and potentially section layout when preset is merged; they compete with or duplicate layout-definitions for gap.

**Summary:** visual-presets is a second authority for gap at section/list/toolbar level when presets are applied (token-based values).

---

## 4) molecules.json

**Gap usage**
- **Location:** Presets for list, card, toolbar, chip, footer, etc.: `collection.gap`, `layout.gap`, `sequence.gap`.
- **Values:** Tokens: `"spacing.inlineGap"`, `"spacing.stackGap"`, `"spacing.compactGap"`, `"gap.none"`, `"gap.xs"`, `"gap.lg"`.
- **Examples:** List presets (collection + layout gap); card layout.gap (sm/md/lg); toolbar sequence.gap; chip sequence gap; footer sequence gap.
- **Consumer:** Molecules (list, card, toolbar, chip, footer compounds) read these presets and pass `params.gap` (or nested layout/collection/sequence.gap) to **SequenceAtom** / **CollectionAtom**. So gap is set at **molecule/card/list** level, not from layout-definitions.

**Summary:** molecules.json is a **third** authority for gap for lists, cards, toolbars, chips, footers (component-internal gap).

---

## 5) lib-layout molecules (column-layout, row-layout, grid-layout)

**column-layout.tsx**
- **Default:** `gap = "1rem"` (line 14) when `params.gap` is missing.
- **Usage:** `gap` applied to flex container (line 24).

**row-layout.tsx**
- **Default:** `gap = "1rem"` (line 15) when `params.gap` is missing.
- **Usage:** `gap` applied to flex container (line 26).

**grid-layout.tsx**
- **Default:** `gap = "1rem"` (line 16) when `params.gap` is missing.
- **Usage:** `gap` applied to grid container (line 26).

**Consumer:** These components are used when the layout system renders a column/row/grid **from molecule-layouts.json** (or equivalent) with a preset; resolveMoleculeLayout returns params that are passed to **SequenceAtom** / **CollectionAtom**, not to these TSX layout components in the main LayoutMoleculeRenderer path. LayoutMoleculeRenderer uses SequenceAtom/CollectionAtom with `resolved` from resolveMoleculeLayout(layout-definitions componentLayouts). So the **default "1rem"** in column/row/grid layout TSX applies only where those components are actually used (e.g. legacy or alternate render paths). If they are never used in the main section render path, the only hardcoded gap default in the main path is not in atoms (atoms have no gap default; see below).

**Summary:** All three lib-layout molecules have **hardcoded default `gap = "1rem"`**. They compete with layout-supplied gap when those components are used.

---

## 6) ExperienceRenderer + page.tsx

**ExperienceRenderer.tsx**
- **Line 103:** App (website) wrapper: `gap: "var(--spacing-8)"` (flex column).
- **Line 110:** Learning wrapper: `gap: "var(--spacing-4)"` (flex column).
- **Line 203:** Header bar (space-between row): `gap: "var(--spacing-4)"`.
- **Consumer:** Top-level wrappers around the whole experience; gap between **sections** or between header and content.

**page.tsx**
- **Line 769:** Website content wrapper (flex column): `gap: "var(--spacing-8)"` — vertical gap between sections.
- **Consumer:** Page-level wrapper; gap between section blocks.

**Summary:** **Two** wrapper layers set gap above the section tree: page.tsx and ExperienceRenderer both add **section-to-section** gap (spacing-8 or spacing-4). Layout-definitions does not control this; it’s hardcoded in TSX.

---

## 7) SequenceAtom / CollectionAtom

**SequenceAtom** ([sequence.tsx](src/04_Presentation/components/atoms/sequence.tsx))
- **Gap:** `const gap = tok(p.gap);` (line 36). Used in style as `gap` (lines 53, 75).
- **Default:** None. `tok(undefined)` → `resolveToken(undefined) ?? undefined` → `undefined`. So if `p.gap` is missing, `gap` is undefined and the style has `gap: undefined` (no CSS property set).
- **Conclusion:** Pass-through only; no intrinsic gap default.

**CollectionAtom** ([collection.tsx](src/04_Presentation/components/atoms/collection.tsx))
- **Gap:** `gap: toCssGapOrPadding(params.gap)` (lines 37, 54).
- **Default:** `toCssGapOrPadding(undefined)` returns `undefined` (resolveToken(undefined) → null/undefined, then early return undefined). So no gap set when params.gap is missing.
- **Conclusion:** Pass-through only; no intrinsic gap default.

**Summary:** SequenceAtom and CollectionAtom **only pass params.gap**; they do **not** add any default gap.

---

## 8) site-theme.css

- **Line 223:** `.site-grid { gap: var(--spacing-6); }`.
- **Lines 506, 563, 609:** Other classes with `gap: var(--spacing-*)`.
- **Lines 707, 732:** `--experience-gap: var(--spacing-4)` and `var(--spacing-8)` (CSS vars; usage may vary).
- **Summary:** Global CSS sets gap on specific class names; not driven by layout-definitions.

---

# REPORT

## A) Where gap is set more than once

1. **Section-level (same section):**
   - **Split layouts:** Both `contentColumn.gap` (layout-definitions pageLayouts) and `moleculeLayout.params.gap` (componentLayouts) can apply: one on the content column div, one on the split container (splitLayoutStyle.gap). So **two** gap values for the same section in split mode (content column inner gap + split row gap).
   - **Non-split:** One source in main path: componentLayouts.params.gap → resolved → Sequence/Collection. If visual-presets section.layout.gap is merged into section params and used for the same section inner layout, that would be a second source.

2. **Between sections (vertical rhythm):**
   - **page.tsx** sets `gap: "var(--spacing-8)"` on the content wrapper.
   - **ExperienceRenderer** sets `gap: "var(--spacing-8)"` or `"var(--spacing-4)"` on its wrapper.
   - So **two** layers control gap **between** sections (page + ExperienceRenderer).

3. **Inside molecules (lists, cards, toolbars):**
   - **molecules.json** sets collection.gap, layout.gap, sequence.gap per preset.
   - **visual-presets.json** sets list.collection.gap, list.layout.gap, section.layout.gap, toolbar.layout.gap.
   - So **two** JSON sources (molecules.json + visual-presets) can set gap for the same list/card/toolbar, depending on merge order.

4. **Layout definitions vs template-profiles:**
   - **layout-definitions.json** componentLayouts.params.gap is the runtime source for section inner gap in the main resolver.
   - **template-profiles.json** sections.*.params.gap is a parallel set (80+ entries) not currently merged into that path but a duplicate definition set.

---

## B) Every hardcoded gap default

| Location | Default | When applied |
|----------|---------|--------------|
| **column-layout.tsx** (line 14) | `gap = "1rem"` | When params.gap is undefined |
| **row-layout.tsx** (line 15) | `gap = "1rem"` | When params.gap is undefined |
| **grid-layout.tsx** (line 16) | `gap = "1rem"` | When params.gap is undefined |
| **ExperienceRenderer.tsx** (103, 110, 203) | `"var(--spacing-8)"`, `"var(--spacing-4)"` | Always on wrappers (not conditional) |
| **page.tsx** (769) | `"var(--spacing-8)"` | Always on website content wrapper |
| **site-theme.css** (223, 506, 563, 609) | `var(--spacing-6)`, `var(--spacing-3)`, `var(--spacing-2)` | Always for matching class names |

**Atoms:** SequenceAtom and CollectionAtom have **no** gap default (pass-through only).

---

## C) Total stack depth for gap

**Worst-case (section + between-section + molecule):**

1. **page.tsx** — wrapper gap (between sections).
2. **ExperienceRenderer** — wrapper gap (between sections / header).
3. **LayoutMoleculeRenderer** — for split: contentColumn.gap (content column) + moleculeLayout.params.gap (split container); for non-split: moleculeLayout.params.gap via resolved → Sequence/Collection.
4. **visual-presets** — section.layout.gap (if merged into section params) or list/card/toolbar layout/collection gap.
5. **molecules.json** — list/card/toolbar collection.gap, layout.gap, sequence.gap.
6. **lib-layout molecules** — if used: column/row/grid default "1rem" when params.gap missing.
7. **site-theme.css** — .site-grid and other classes.

**Section-only path (non-split):** layout-definitions componentLayouts.params.gap → resolveMoleculeLayout → SequenceAtom/CollectionAtom → **depth 1** from layout-definitions (atoms add no depth).

**With wrappers:** page + ExperienceRenderer add **2** layers above sections.

**With molecules (card/list):** layout-definitions (section) + visual-presets (section/list) + molecules.json (list/card) = **3** JSON sources; plus wrapper gap = **total depth 5–6** depending on whether template-profiles or lib-layout components are in the path.

---

## D) Exact plan to make layout the only owner

**Principle:** Layout (layout-definitions.json +, if desired, a single merge from template-profiles or a layout API) is the **single** authority for gap. No defaults in code; no gap in visual-presets or molecules.json for layout-driven sections; wrapper gap (between sections) either removed or supplied by layout/page contract.

**Steps (implementation order for a future phase):**

1. **Layout as single source for section gap**
   - Keep: layout-definitions.json **componentLayouts.*.params.gap** and **pageLayouts.*.contentColumn.gap** as the only source for section-level gap in LayoutMoleculeRenderer.
   - Ensure: resolveLayout (and any caller that passes layout to LayoutMoleculeRenderer) does not merge in gap from visual-presets or template-profiles for section inner layout. If merge exists, remove gap from the merged preset/template so layout-definitions wins.
   - Result: For every section, gap comes only from layout-definitions (contentColumn for split, moleculeLayout.params for split container and for non-split).

2. **Remove wrapper gap from TSX (or drive from layout)**
   - **Option A:** Remove hardcoded `gap` from page.tsx and ExperienceRenderer.tsx; define “gap between sections” in layout (e.g. page-level layout or a single token consumed by a single wrapper). One place sets section-to-section gap.
   - **Option B:** Keep one wrapper that sets section-to-section gap but feed its value from layout/page contract (e.g. one token from layout-definitions or template profile), not hardcoded var(--spacing-8).
   - Result: At most one layer controls “gap between sections,” and that layer is layout-driven.

3. **Strip gap from visual-presets for layout-driven sections**
   - In visual-presets.json: Remove or stop applying **section.layout.gap** for section inner layout (so layout-definitions is the only source for section gap).
   - Keep or refactor list/toolbar/card gap in presets only if those components are considered “component-internal” and will later get their gap from layout (e.g. list layout id → layout-definitions). Otherwise, treat list/card/toolbar gap as layout-owned and remove from visual-presets (and molecules.json) in a later step.

4. **Strip gap from molecules.json for layout-owned components**
   - Remove **collection.gap**, **layout.gap**, **sequence.gap** from molecules.json for list, card, toolbar, chip, footer where those components are rendered in a layout-driven tree. Gap for them should come from layout (section params or a future “molecule layout” from layout-definitions).
   - If some molecules are not layout-driven (e.g. control-dock only), keep gap there or document as non-layout.

5. **Remove default gap in lib-layout molecules**
   - In column-layout.tsx, row-layout.tsx, grid-layout.tsx: remove default `gap = "1rem"`. Use `params.gap` only; when missing, do not set `gap` (or set to undefined so no style is applied). Layout must supply gap when these components are used.

6. **Template-profiles**
   - Either: (a) Treat template-profiles as the source of truth for section params (including gap) and merge sections[role].params into the layout for each section, then make layout-definitions the canonical shape and have template-profiles feed it; or (b) Stop storing gap in template-profiles and use only layout-definitions componentLayouts + pageLayouts for gap. Choose one authority (layout-definitions vs template-profiles) and document it.

7. **CSS**
   - site-theme.css: Either remove or confine `.site-grid` (and similar) gap to non–layout-driven areas, or make them use a CSS variable that is set from layout (single source). Avoid duplicate gap authority for the same content.

8. **Atoms**
   - No change: SequenceAtom and CollectionAtom already pass params.gap only with no default. Keep that behavior.

**Outcome:** Layout (layout-definitions.json plus a single optional merge from template or page contract) is the only owner of gap for section-level and section-to-section spacing; molecules and presets do not set gap for layout-driven content; wrappers do not add hardcoded gap unless it comes from that single authority.

---

End of report. No code was modified.
