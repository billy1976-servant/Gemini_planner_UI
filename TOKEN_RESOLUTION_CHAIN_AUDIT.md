# Audit 2 — Token Resolution Chain

**Purpose:** Map all token sources and resolution paths: CSS vars, palette tokens, elevation vs shadow, spacing tokens vs raw values, and where raw values bypass tokens. Read-only analysis.

---

## 1. CSS Variables (Design Tokens)

**Source of truth:** `src/07_Dev_Tools/styles/site-theme.css`, `:root` (lines 12–137).

**Defined families:**

| Family | Examples | Notes |
|--------|----------|--------|
| Typography | --font-family-base, --font-size-xs through --font-size-5xl, --font-weight-*, --line-height-*, --font-size-caption, etc. | Static; no palette injection in this file. |
| Spacing | --spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl, --spacing-2xl, --spacing-3xl; legacy --spacing-1 through --spacing-24 (some alias to semantic, e.g. --spacing-8: var(--spacing-lg)) | Two naming systems: semantic (xs/sm/md/…) and numeric (1–24). |
| Container | --container-narrow, --container-content, --container-wide, --container-full; legacy --container-sm, --container-md, … | |
| Color | --color-surface, --color-surface-variant, --color-surface-hero-accent, --color-surface-alt, --color-surface-dark, --color-on-surface-dark; --color-text-primary, --color-bg-primary, --color-primary, --color-border, etc. | |
| Shadow | --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl | |
| Radius | --radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-2xl | |
| Transition | --transition-fast, --transition-base, --transition-slow | |
| Chrome / app | --chrome-bg, --app-bg, --app-chrome-height, etc. | |

**Where converted to CSS:** Consumed directly in CSS rules and in inline styles as literal strings (e.g. `gap: "var(--spacing-6)"` in layout-definitions or template-profiles). No runtime “conversion”; browser resolves var() when the stylesheet or inline style is applied.

**Raw values bypassing tokens:** Many places use raw px/rem (see Section 6).

---

## 2. Palette Tokens (Dot-Path)

**Source of truth:** Palette JSON files under `src/04_Presentation/palettes/`: default.json, dark.json, hiclarify.json, ui-atom-token.json, etc. Palette is selected by palette-store (or paletteOverride in resolveParams).

**Key namespaces:**

| Namespace | Examples | Resolved to |
|-----------|----------|-------------|
| color.* | color.primary, color.onSurface, color.surface | Hex / color string |
| surface.* | surface.section, surface.card, surface.elevated | Hex (from palette) |
| radius.* | radius.sm, radius.md, radius.pill | Number or string (px) |
| padding.* | padding.xs, padding.lg | Number (px) or token ref |
| gap.* | gap.xs, gap.md, gap.xl | Number (px) |
| spacing.* | spacing.stackGap, spacing.inlineGap, spacing.compactGap | Token refs (e.g. "gap.md") — resolveToken follows chain |
| textSize.* | textSize.xs, textSize.display | Number (px) |
| textWeight.* | textWeight.regular, textWeight.semibold | Number |
| lineHeight.* | lineHeight.tight, lineHeight.normal | Number |
| textRole.* | textRole.title.size, textRole.body.lineHeight | Chained (e.g. textSize.title) |
| shadow.* | shadow.none, shadow.sm, shadow.lg | CSS shadow string |
| elevation.* | elevation.none, elevation.low, elevation.mid, elevation.strong, elevation.float | CSS shadow string (in palette; see Section 4) |
| transition.* | transition.base, transition.fast | CSS transition string |
| borderWidth.* | borderWidth.sm, borderWidth.md | Number |
| fontFamily.* | fontFamily.heading, fontFamily.sans | Font stack string |
| prominence.* | prominence.primary.background, prominence.primary.color | From palette color.* |
| surfaceTier.* | surfaceTier.base.background, surfaceTier.raised.shadow | Chained to color/shadow |

**Where converted to CSS:** `src/03_Runtime/engine/core/palette-resolve-token.ts`: resolveToken(path, depth, paletteOverride) looks up path in palette (getPalette() or override), supports recursive resolution for chained tokens. Used by resolveParams in palette-resolver.ts (every key in merged params is resolved). Atoms (SurfaceAtom, CollectionAtom, SequenceAtom, etc.) and compounds call resolveParams(params) and pass result to style; LayoutMoleculeRenderer uses resolveParams(params.surface) and applies result (and sometimes literal "var(--color-surface-hero-accent)" for backgroundVariant).

**Raw values bypassing tokens:** Inline styles in TSX that use "12px", "1rem", var() literals without going through resolveToken; layout-definitions and template-profiles that use "1rem", "2.5rem", "3rem 0" instead of token paths.

---

## 3. Where Tokens Become CSS

| Location | Mechanism | Token types |
|----------|------------|-------------|
| SurfaceAtom (src/04_Presentation/components/atoms/surface.tsx) | style = { backgroundColor: resolveToken(params.background), borderRadius: resolveToken(params.radius), boxShadow: resolveToken(params.shadow), padding: resolveToken(params.padding), … } | Palette dot-path (background, radius, shadow, padding, borderColor, borderWidth, transition) |
| CollectionAtom (collection.tsx) | toCssGapOrPadding(resolveToken(v)); style = { display, gridTemplateColumns, gap, padding, alignItems, justifyContent } | Palette + raw; gap/padding can be token or number |
| SequenceAtom (sequence.tsx) | Same pattern: resolveToken for gap/padding; style for flex/grid | Palette + raw |
| LayoutMoleculeRenderer | resolveParams(params.surface) → surfaceWithVariant (backgroundVariant overwrites with "var(--color-surface-hero-accent)" etc.); inline styles for contentColumn, mediaColumn, splitLayout, moleculeLayout (gap, padding from layout-definitions) | Mix: palette tokens via resolveParams; CSS var literals for backgroundVariant; layout-definitions use var(--spacing-*) in JSON |
| Compounds (card, button, list, …) | resolveParams(params.surface), resolveParams(params.title), etc. → pass to SurfaceAtom, TextAtom, MediaAtom | Palette only (atoms do resolveToken) |
| JsonRenderer | resolveParams(visualPresetOverlay, variantPreset, sizePreset, profiledNode.params, paletteOverride) | Palette; output merged into node params and passed to components |

Values that are already CSS (e.g. "var(--spacing-6)") are passed through as strings; resolveToken only resolves dot-path strings against palette. So: palette tokens → resolveToken → hex/px/string; literal var() in JSON or TSX → remain var() and resolve in browser.

---

## 4. elevation.* vs shadow.*

**elevation.*** — Used in visual-presets.json (e.g. "elevation.none", "elevation.low", "elevation.mid", "elevation.strong", "elevation.float"). Resolved by resolveToken against the active palette. **Mapping lives in palette JSON:** e.g. default.json lines 159–170 define elevation.none, elevation.low, elevation.mid, elevation.strong, elevation.float as CSS shadow strings. No mapping in site-theme.css.

**shadow.*** — Also in palette (e.g. default.json shadow.none, shadow.sm, shadow.md, shadow.lg). visual-presets and surfaceTier sometimes use shadow.* (e.g. surfaceTier.base.shadow: "shadow.none"). So palette has both elevation.* (semantic “depth”) and shadow.* (concrete values); visual-presets prefer elevation.* for surface shadow.

**site-theme.css** — Defines only --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl. No elevation.* or shadow.* dot-path in CSS. So: CSS vars are one system (--shadow-*); palette dot-paths (elevation.*, shadow.*) are another; conversion to CSS happens when resolveToken returns a string that is then assigned to boxShadow in atoms.

---

## 5. Spacing Tokens vs rem/px

**When value stays as var():** layout-definitions.json and template-profiles (and spacing-scales.json) often use literal "var(--spacing-6)", "var(--spacing-8)", "var(--spacing-10) 0" in gap/padding. These are not passed through resolveToken for those keys in the layout path; they are applied as strings to style. So they stay as var() and resolve in the browser from site-theme.css.

**When value goes through palette (resolveToken) and becomes rem/px:** visual-presets use token paths like "spacing.stackGap", "gap.xl", "gap.md". default.json defines spacing.stackGap = "padding.lg" or "gap.md", gap.xl = 48 (number). resolveToken returns the number; atoms like CollectionAtom use toCssGapOrPadding which turns number into "${val}px". So palette spacing/gap tokens become px (or string if palette stores "1rem"). molecule-layouts.json uses "gap.md" (palette token); when passed through resolveMoleculeLayout the value is not resolved there—it’s passed through to CollectionAtom/SequenceAtom params; if those components resolveToken on gap, then gap.md → palette → 20 → "20px".

**Summary:** Layout-definitions and template-profiles frequently use **var(--spacing-*)** (CSS var). Visual-presets and molecule-layouts use **palette dot-paths** (gap.xl, spacing.stackGap); those are resolved in resolveParams/resolveToken and become numbers or strings (px/rem). Template-profiles also use **raw rem** ("1rem", "2.5rem", "3rem 0") in sections[role].params, bypassing both CSS vars and palette for those keys.

---

## 6. Inline Raw Values (Bypass Tokens)

Places that use raw px/rem or literal strings without token path or CSS var:

| File | Approx. lines / context | Example |
|------|--------------------------|---------|
| src/app/layout.tsx | 242 (phone frame) | padding: "12px" |
| src/06_Data/site-skin/shells/AppShell.tsx | 37, 55, 66, 78 | padding: 12, "8px 16px", 16, 12 |
| src/06_Data/site-skin/shells/LearningShell.tsx | 32, 35, 51 | "16px 16px", "32px 16px 40px", "16px 16px" |
| src/06_Data/site-skin/shells/WebsiteShell.tsx | 49–50 | var(--spacing-6), var(--spacing-16) (tokens) |
| src/04_Presentation/shells/GlobalAppSkin.tsx | Tailwind px-2, py-1, gap-2.5, etc. | 8px, 4px, 10px equivalent |
| src/03_Runtime/engine/core/ExperienceRenderer.tsx | 103, 110, 113, 124, 201 | var(--spacing-4), var(--spacing-8) (tokens) |
| src/app/page.tsx | 769, 786, 833, 843 | gap: "var(--spacing-8)"; paddingRight: contentPaddingRight |
| src/07_Dev_Tools/styles/site-theme.css | 677–678 (diagnostics) | 2px 6px |
| template-profiles.json | Throughout sections[role].params | "1rem", "2.5rem", "3rem 0", "2rem" (gap, padding) |
| layout-definitions.json | componentLayouts params | minHeight: "min(60vh, 560px)" (raw) |

So: shells and some app layout use raw px/rem; template-profiles use raw rem in section params; layout-definitions mix var(--spacing-*) and raw values.

---

## 7. Token Namespace Collisions

| Name | CSS (site-theme) | Palette (dot-path) | layout-definitions / JSON |
|------|-------------------|--------------------|----------------------------|
| radius | --radius-sm, --radius-md, … | radius.sm, radius.md, radius.pill | Not used as key; componentLayouts don’t set radius |
| shadow | --shadow-sm, --shadow-md, … | shadow.*, elevation.* | Not used directly |
| spacing | --spacing-1 … --spacing-24, --spacing-xs … | spacing.stackGap, gap.xl, padding.lg | var(--spacing-*) in gap/padding |
| color | --color-* | color.primary, surface.section, etc. | backgroundVariant → var(--color-surface-*) in TSX |

**Collision note:** Same semantic idea (e.g. “small radius”) exists in two forms: CSS --radius-sm and palette radius.sm. They are not automatically linked; palette radius.sm is a number (e.g. 8), CSS --radius-sm is 0.5rem. So duplicate naming systems with different units/semantics.

---

## 8. Duplicate Naming Systems

| Concept | System A | System B | Authority / context |
|---------|----------|----------|----------------------|
| Section/card gap | spacing.stackGap, spacing.compactGap (visual-presets → palette) | var(--spacing-md), var(--spacing-8) (spacing-scales, layout-definitions) | Section inner gap: layout-definitions componentLayouts; visual preset layout.gap for non-section or when merged |
| Inline gap | spacing.inlineGap, gap.xl (visual-presets) | var(--spacing-*) (layout-definitions contentColumn.gap) | layout-definitions for section contentColumn; visual preset for list/toolbar etc. |
| Spacing scale id | spacingScale "default" (template-profiles) → spacing-scales.json | spacing-scales.json keys: default, luxury, saas, magazine, course | spacing-scales.json is source; template profile only references scale id |
| Numeric spacing | --spacing-1 … --spacing-24 (CSS) | palette gap.xs … gap.3xl, padding.xs … (numbers) | CSS for layout-definitions/template-profiles when they use var(); palette for visual-presets and atoms |

**Which system is authoritative for which context:** Section layout gap/padding: layout-definitions (and template-profiles for rem) and spacing-scales (non-gap section keys). Card/list/button surface and layout: visual-presets + palette. Atoms always resolve via resolveToken (palette) when given a dot-path; when given a literal like "var(--spacing-6)" they pass it through (resolveToken returns non-string as-is or path if not in palette).

---

## 9. Summary Table

| Token type | Source of truth | Where converted to CSS | Raw bypass locations | Namespace collision / duplicate |
|------------|-----------------|-------------------------|----------------------|----------------------------------|
| --spacing-* | site-theme.css :root | Browser when var() used in style | Shells, template-profiles rem, layout-definitions raw | CSS vs palette spacing.* / gap.* |
| --color-* | site-theme.css :root | Browser; LayoutMoleculeRenderer uses literal var() for backgroundVariant | — | Palette color.* / surface.* |
| --radius-*, --shadow-* | site-theme.css :root | Browser | — | Palette radius.*, shadow.*, elevation.* |
| Palette color, surface, radius, shadow, elevation | Palettes (default.json etc.) | resolveToken → style in atoms / resolveParams output | — | elevation vs shadow (both in palette) |
| spacing.stackGap, gap.xl | Palette + visual-presets | resolveParams → resolveToken → atoms | template-profiles rem | spacing-scales var() vs palette token paths |
