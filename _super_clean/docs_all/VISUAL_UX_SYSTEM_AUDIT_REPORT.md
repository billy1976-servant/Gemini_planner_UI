# Visual Output & UX Expression — Full System Audit Report

**Scope:** JSON → organs → templates → visual presets → palettes → CSS variables → final DOM.  
**Focus:** Where style intent is lost, overridden, or never applied.  
**Date:** 2025-01-31.

---

## 1. Pipeline Overview

| Layer | Source | Consumer | Output |
|-------|--------|----------|--------|
| Palette store | `palettes/*.json` | `palette-bridge.tsx`, `palette-resolve-token.ts` | CSS vars on `document.documentElement`, resolved token values in atoms |
| CSS theme | `site-theme.css` | Global | `:root` defaults; `.site-container`, `.app-chrome`, etc. |
| Template profile | `template-profiles.ts`, experience profiles | `json-renderer` → `applyProfileToNode` | Section `layout` + `params.moleculeLayout`, `visualPreset`, `cardPreset`, `spacingScale` |
| Visual presets | `layout/visual-presets/*.json` | `getVisualPresetForMolecule` in json-renderer | Param overrides per molecule type (section, card, button, list) |
| Card presets | `layout/card-presets/*.json` | `getCardPreset` in json-renderer | Card-only param overrides |
| Spacing scale | `layout/spacing-scales/*.json` | `getSpacingForScale` + `deepMergeParams` | Section surface padding + **layout.gap** merged into `moleculeLayout.params` |
| Organ variants | `organs/<id>/variants/*.json` | `resolve-organs` → expand | Section layout (type + params), structure (children/slots) |
| Molecule layout | `molecule-layout-resolver` | Section/Card/Button compounds | `display`, `direction`, `gap`, `padding` to Sequence/Collection/Surface |
| Definitions | `compounds/ui/definitions/*.json` | Registry + json-renderer | Variant/size presets merged into `params` |
| Atoms | Text, Surface, Media, Sequence, Collection | Compounds | Inline `style` from `resolveToken(params.*)` |

---

## 2. What Styling Layers ARE Working

- **Palette at document root**  
  `usePaletteCSS()` runs in `layout.tsx` and (where used) in `GeneratedSiteViewer` / `SiteSkin`. It maps palette (color, radius, padding, gap, textSize, textWeight, lineHeight, shadow) to CSS custom properties on `document.documentElement`. **Computed styles do change** when the palette dropdown changes (for any component that uses those vars or resolved tokens).

- **Typography tokens (textRole.title, body, etc.)**  
  Palettes define `textRole.title.size` → `textSize.md` (and similar). `resolveToken` resolves these to numeric px (e.g. 16). TextAtom uses `fontSize: resolveToken(params.size)` etc., so **title vs body vs caption do resolve to different font sizes/weights** where definitions and presets pass those params.

- **Section surface + container width + hero mode**  
  Section compound uses `params.surface`, `params.backgroundVariant`, `params.containerWidth`, `params.heroMode`. Template/organ set these; visual preset and spacing scale can override surface. **Background variant, contained/narrow/split, and hero full-screen/overlay/strip all affect the DOM.**

- **Card surface + title/body from presets**  
  Card compound passes `params.surface`, `params.title`, `params.body` (and media) through `resolveParams` into SurfaceAtom and TextAtom. Visual preset + card preset + definition variants merge; **card preset (e.g. elevated, soft) and visual preset (e.g. prominent) do change card look** (colors, shadow, radius) when template/profile set them.

- **Button compound**  
  Button uses `params.surface`, `params.label`, `params.moleculeLayout`; definitions and visual presets (e.g. prominent button surface) feed into resolveParams. **Button styling from tokens/presets applies** for nodes rendered through the main JsonRenderer (Section/Card/Button registry path).

- **Spacing scale → section gap/padding**  
  When profile has `spacingScale`, `getSpacingForScale(profile.spacingScale, "section")` returns e.g. `{ surface: { padding: "var(--spacing-8)" }, layout: { gap: "var(--spacing-6)" } }`. `deepMergeParams` merges **layout** into `moleculeLayout.params`, so **section gap and surface padding from spacing scale do apply**.

- **Template/organ section layout**  
  `applyProfileToNode` merges template section def + organ variant into `node.layout` and `node.params.moleculeLayout` (type, preset, params). Section compound reads only `params.moleculeLayout` and passes it to `resolveMoleculeLayout` → Sequence/Collection. **Column/row/grid and gap/align/justify from template and organ variants are applied** (e.g. header row vs hero column, different gaps).

- **Organ variants (structure)**  
  Header variants (e.g. centered vs minimal) differ by `layout.params` (gap, justify, align). After expansion, the Section receives that layout via profile merge. **Switching header variant does change layout** (e.g. center vs space-between, gap size).

- **Site theme CSS classes**  
  `.site-container`, `.site-card-*`, `.product-*`, grid utilities, and template section patterns (e.g. `.template-section-alternate`) use `var(--color-*)`, `var(--spacing-*)`, etc. **Where those classes are used, palette vars affect the result.**

---

## 3. What Styling Layers EXIST but Are NOT Visually Expressing

- **Visual preset `section.layout` (gap)**  
  Visual presets (e.g. default, spacious) set `section.layout.gap` (e.g. `"gap.md"`). That lands in `params.layout`, but the **Section compound only reads `params.moleculeLayout`**, not `params.layout`. So **visual preset section gap/padding in `layout` are never applied**. Only spacing scale merges its `layout` into `moleculeLayout.params` via `deepMergeParams`; visual preset `section.layout` is effectively NO-OP.

- **`useSectionLayout` hook**  
  `layout-bridge.tsx` exports `useSectionLayout(sectionType, experience, override)` and resolves layout from profile + layout store + molecule-layout-resolver. **No component in the main app or site runtime calls it.** Only `useContainerLayout` is used (in GeneratedSiteViewer). So the section-layout hook is dead for the current tree; section layout comes entirely from json-renderer (template + organ → moleculeLayout).

- **Navigation molecule definition**  
  `compounds/ui/definitions/navigation.json` defines variants/sizes for nav (surface, logo, link, cta, dropdown). **There is no "Navigation" entry in the engine Registry.** Header is a Section with slots (logo, cta); nav styling from that definition is not used by any rendered component in the pipeline.

- **Palette bridge vs site-theme.css defaults**  
  `site-theme.css` sets `:root` fallbacks (e.g. `--color-primary: #2563eb`). Palette bridge overwrites these on the same element. So **theme defaults only show before first palette run or when palette is missing**; once palette is applied, they are overridden. Not “not expressing”—they are intentionally overridden.

---

## 4. What Styling Layers Are Being Overridden

- **Brand palette overrides palette store**  
  In `GeneratedSiteViewer`, a `useEffect` tied to `brandInfo?.palette` overwrites `--color-primary`, `--color-primary-hover`, `--color-bg-primary`, `--color-text-primary`, `--color-border` on `document.documentElement`. So **when brand palette exists, it overrides the palette store** for that viewer. Main app (layout.tsx) does not load brandInfo; only palette store applies.

- **Template section layout overrides organ layout for section role**  
  `applyProfileToNode` does: template section def as base, then `node.layout` (organ) merged on top; for `moleculeLayout.params`, template params are base and organ `justify`/`align` can override. So **template supplies default section layout; organ can override only where explicitly merged** (e.g. justify/align). Template is not “overriding too aggressively” in a bug sense—it’s by design that template = defaults, organ = overrides, but organ’s full layout is not always merged (e.g. gap can come from template only if organ doesn’t set it).

- **Inline styles override CSS classes**  
  Compounds and atoms apply inline `style` from resolved params. Where both a class (e.g. `.site-card`) and inline style set the same property, **inline wins**. So token-driven inline styles override class-based token usage when both apply to the same element.

---

## 5. Component-Level Findings

| Component | Variant + preset styling | Tokenized vs hardcoded | Notes |
|-----------|-------------------------|-------------------------|--------|
| **Section** | Yes (surface, containerWidth, heroMode; layout from template/organ + spacing scale) | Tokenized (SurfaceAtom, layout params) | Visual preset `section.layout` not read → NO-OP. |
| **Card** | Yes (visual + card preset + definition) | Tokenized (Surface, Text, Media) | Working. |
| **Button** | Yes (visual preset + definition) | Tokenized (Surface, Text) | Working in registry path. |
| **Media** | Partially (params.radius, objectFit used) | **Hardcoded:** placeholder/emoji `fontSize: "2rem"` / `"2.5rem"`, caption `fontSize: "0.875rem"`, `color: "#999"`, `"#666"` | Size/placeholder/caption not from tokens. |
| **json-skin.engine (button, section, text, field)** | No | **Fully hardcoded:** section `background: "#0f172a"`, text `color: "#e5e7eb"`, button `background: "#1e293b"`, field inputs same. | Entire json-skin branch ignores palette/presets. |
| **Nav** | N/A | Definition exists; no Registry component | Navigation definition unused. |
| **App chrome** | No | **Hardcoded:** `.app-chrome` `background: #000`, `.app-chrome-save` `#7c3aed`; Save button inline `background: "#222"` | Outside palette/preset system. |

---

## 6. Typography and Spacing

- **Typography tokens**  
  `textRole.title.size` etc. resolve via `resolveToken` to palette values (e.g. numeric px). TextAtom uses them for fontSize, fontWeight, lineHeight, color. **Different roles (title, body, caption) do produce different font sizes/weights** where the tree passes those params (e.g. card title/body, section title).

- **Spacing tokens**  
  Section padding/gap: **spacing scale** (when present) merges `layout.gap` and surface padding into `moleculeLayout.params`, so they apply. **Visual preset section.layout** (e.g. `gap.md`) is in `params.layout` but Section never reads it, so it does not change section padding/gap. Card/button padding from presets and definitions do apply via SurfaceAtom/SequenceAtom.

---

## 7. App Chrome vs Palette/Preset System

- **App chrome (header bar, dropdowns, Save button)**  
  Styled by `site-theme.css` (`.app-chrome`, `.app-chrome-save`, etc.) and inline styles in `layout.tsx`. Uses fixed colors (`#000`, `#7c3aed`, `#222`, white, rgba) and **no `var(--color-*)` or palette/preset**. So **app chrome is outside the palette/preset system** and does not react to palette or template changes.

---

## 8. NO-OP Summary (No Visible Effect)

1. **Visual preset `section.layout`** — Section compound does not read `params.layout`; only `moleculeLayout.params` (and spacing scale merge) drive gap/padding.
2. **`useSectionLayout`** — Not called anywhere; section layout comes from json-renderer only.
3. **Navigation definition** — No Navigation component in Registry; definition unused.
4. **Visual preset section gap** when no spacing scale — Preset sets `params.layout.gap`; without spacing scale, that layout is never merged into `moleculeLayout.params`, and Section doesn’t use `params.layout`.

---

## 9. Top 5 Fixes for Largest Visible Improvement

1. **Wire visual preset `section.layout` into Section**  
   Either: (a) have Section compound use `params.layout` (e.g. gap/padding) when `params.moleculeLayout.params` doesn’t set them, or (b) merge visual preset `section.layout` into `moleculeLayout.params` in json-renderer (same way spacing scale is merged via `deepMergeParams`). That makes “spacious” vs “compact” section gap/padding actually change layout.

2. **Replace json-skin.engine hardcoded styles with tokens**  
   For `node.type === "json-skin"`, section/button/text/field currently use fixed colors and sizes. Resolve section surface, text color/size, and button surface through the same palette + resolveToken (or CSS vars) so json-skin screens respond to palette and feel consistent with the rest of the app.

3. **Put app chrome on palette (and optional preset)**  
   Use `var(--color-primary)`, `var(--color-bg-primary)` (or dedicated chrome tokens) for `.app-chrome` and Save button instead of `#000`, `#7c3aed`, `#222`. Then the navigator bar and save button will follow the selected palette and improve perceived consistency.

4. **Media atom: tokenize placeholder and caption**  
   Replace hardcoded `fontSize: "2rem"` / `"2.5rem"`, `color: "#999"` / `"#666"` in MediaAtom with tokens (e.g. `var(--font-size-2xl)`, `var(--color-text-muted)`) or resolved params so media placeholders and captions respect palette and scale.

5. **Either use or remove `useSectionLayout`**  
   If a wrapper or shell should drive section layout from layout store + profile (e.g. for a different viewer), call `useSectionLayout` there and pass the result into section wrappers. Otherwise remove or document it as “for future use” to avoid confusion and dead code.

---

## 10. Summary Table

| Layer | Working | Exists but not expressing | Overridden |
|-------|---------|----------------------------|------------|
| Palette at root | ✅ | — | By brand palette in GeneratedSiteViewer when present |
| CSS theme :root | ✅ (as fallback) | — | By palette bridge when palette set |
| Template section layout | ✅ | — | Organ overrides only where merged (e.g. justify/align) |
| Visual preset section/card/button | Card/button ✅; section **layout** ❌ | Section `layout` unused | — |
| Card preset | ✅ | — | — |
| Spacing scale | ✅ | — | — |
| Organ variants | ✅ | — | — |
| Typography tokens | ✅ | — | — |
| useSectionLayout | — | ❌ never called | — |
| Navigation definition | — | ❌ no component | — |
| App chrome | — | — | N/A (outside system) |
| json-skin.engine | — | — | N/A (hardcoded) |
| Media atom | Partially | — | — (hardcoded placeholder/caption) |

This audit did not change any code; it only documents current behavior and recommendations.

---

## 11. Step 2 Implementation: json-skin.engine Tokenization (2025-02-02)

**Fix applied:** Replace json-skin.engine hardcoded styles with tokens.

### Changes Made

- **Section:** Added `fontFamily: "var(--font-family-base)"`.
- **Text:** Added `fontFamily: "var(--font-family-base)"`.
- **Field label:** Added `fontFamily: "var(--font-family-base)"`, `fontSize: "var(--font-size-sm)"`.
- **Field input:** Added `fontFamily: "var(--font-family-base)"`, `fontSize: "var(--font-size-base)"`, `outline: "none"`.
- **Button:** Added `fontFamily: "var(--font-family-base)"`, `fontSize: "var(--font-size-base)"`, `transition: "var(--transition-base, 200ms ease)"`.
- **UserInputViewer:** Added `fontFamily: "var(--font-family-mono)"`.

All elements already used `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`, `var(--font-*)`; typography and transition tokens were added for full palette alignment.

### Test Results

| Test | Result | Notes |
|------|--------|-------|
| Lint (json-skin.engine.tsx) | Pass | No linter errors. |
| Build compile | Pass | Next.js compiled successfully; failure is in unrelated `google-ads/client.ts`. |
| Type check (full project) | Fail | `src/app/api/google-ads/client.ts:84` — `access_token` not in `CustomerOptions` (pre-existing). |
| json-skin.engine changes | Valid | No TypeScript or lint issues in modified file. |

### Expected Results (Manual Verification)

When viewing a json-skin screen (e.g., landing page with `type: "json-skin"`):

1. **Palette responsiveness:** Section background, text color, button background, field background/border, and UserInputViewer update when the palette dropdown changes.
2. **Typography:** Font family follows `--font-family-base` (or `--font-family-mono` for UserInputViewer) from the active palette.
3. **Spacing/radius:** Spacing and radius follow `--spacing-*` and `--radius-*` from the palette.
4. **Transitions:** Button uses `--transition-base` for state transitions.

**How to verify:**
- Open the app with no `?screen=` (landing page uses json-skin).
- Open the palette dropdown and switch palettes (default, premium, dark, etc.).
- Confirm section, text, field, and button colors and typography update with the palette.

---

## 12. Step 3 Implementation: App Chrome on Palette (2025-02-02)

**Fix applied:** Put app chrome on palette (and optional preset).

### Changes Made

- **layout.tsx:** Changed `usePaletteCSS(contentRef)` to `usePaletteCSS()` so palette vars apply to `document.documentElement`. Navigator bar and content both inherit palette.
- **palette-bridge.tsx:** Added `--color-surface-dark`, `--color-on-surface-dark`, `--color-on-primary` from palette (surface, onSurface, onPrimary). Chrome bar and Save button now use palette-driven tokens.
- **site-theme.css:** `.app-chrome-save` color changed from `var(--chrome-text)` to `var(--color-on-primary)` for proper contrast on primary-accent button.

### Expected Results

- **Navigator bar:** Background uses `--chrome-bg` → `--color-surface-dark` (palette surface). Text uses `--chrome-text` → `--color-on-surface-dark` (palette onSurface).
- **Save button:** Background uses `--chrome-accent` → `--color-primary`. Text uses `--color-on-primary`.
- **Palette switch:** Changing palette (default, premium, dark, kids, etc.) updates the navigator bar and Save button to match.

---

## 13. Step 4 Implementation: Media Atom Tokenization (2025-02-02)

**Fix applied:** Media atom: tokenize placeholder and caption.

### Changes Made

- **media.tsx:** Switched from ad-hoc token vars to the dedicated `--media-*` tokens from site-theme.css:
  - `placeholderBg`: `var(--media-placeholder-bg)` (→ `var(--color-bg-muted)`)
  - `placeholderText`: `var(--media-placeholder-text)` (→ `var(--color-text-muted)`)
  - `emojiSize`: `var(--media-emoji-size)` (→ `var(--font-size-3xl)`)
  - `captionSize`: `var(--media-caption-size)` (→ `var(--font-size-sm)`)

### Expected Results

- Placeholder background and text color follow palette (`--color-bg-muted`, `--color-text-muted`).
- Emoji/placeholder size and caption size follow typography scale (`--font-size-3xl`, `--font-size-sm`).
- Palette and text-size changes propagate to media placeholders and captions.

---

## 14. Step 5 Implementation: useSectionLayout Documentation (2025-02-02)

**Fix applied:** Document `useSectionLayout` as "for future use" to avoid confusion.

### Changes Made

- **layout-bridge.tsx:** Added comprehensive JSDoc comment to `useSectionLayout` explaining:
  - Why it's currently unused (main app uses JsonRenderer → applyProfileToNode → moleculeLayout path)
  - When it should be used (custom shells, alternative viewers, direct section wrappers)
  - How to use it (call hook to get CSS properties for section containers)

### Analysis

- `useSectionLayout` is **never called** in the codebase (only `useContainerLayout` is used).
- Main section layout flow: `json-renderer` → `applyProfileToNode` (template/profile sections) → `moleculeLayout` → Section compound → `resolveMoleculeLayout`.
- The hook provides valid alternative path for custom implementations that don't use JsonRenderer.

### Decision

**Kept** for future use rather than removed. The hook is well-implemented and could be valuable for:
- Custom site shells needing dynamic layout from layout store
- Alternative viewers outside the JsonRenderer pipeline
- Direct section wrappers requiring layout styles as CSS properties
