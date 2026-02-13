# Apple Theme — Full Execution Plan (Real Product Level)

**Role:** Senior Apple-level product designer + UI systems engineer  
**Goal:** Transform app from developer prototype → premium product using **JSON only**.  
**No file changes in this document** — architecture, JSON plan, token structure, preset definition only.

---

## PHASE 1 — Identify Weaknesses (Ruthless)

### Stepper appearance

- **Underline tabs** (current: `tab-underline`) read as browser chrome, not product UI. No containment, no clear “one of five” affordance.
- **No track container**: Steps float on section background; no single pill or bar that reads “segmented control.”
- **Active state** is a 2px bottom border in primary — cheap, not tactile. No filled segment, no soft shadow.
- **Result:** Feels **unsafe** (unfamiliar pattern) and **prototype** (like a quick web tab bar).

### Button proportions

- **Padding-only** sizing (`var(--spacing-md) 0`) with no min-height. Touch targets can fall below 44px; proportions feel arbitrary.
- **Radius** from preset (radius.md = 12px) is fine but not “pill” for primary actions; no clear pill vs. rounded-rect rule.
- **Weight** of primary vs. secondary is similar; hierarchy is weak.
- **Result:** Feels **unrefined** and **cheap** — not “tap me with confidence.”

### Input field design

- **Minimal styling**: Border + radius from variant; no inner padding token hierarchy. FieldAtom uses params but journal doesn’t pass a variant, so first variant (outlined) applies with default palette.
- **Label/input relationship**: No defined gap (e.g. 8px) in tokens; spacing is layout-driven only.
- **No fill hierarchy**: Outlined is one border; no “resting vs. focused” elevation or border weight change in tokens.
- **Result:** Feels **prototype** — functional but not premium or safe.

### Typography feel

- **Inter + system fallback**: Generic, “dashboard” feel. No SF-style clarity or warmth.
- **Scale**: 32px title, 16px body, 14px label — not the 28/17/13 rhythm that reads “Apple.”
- **Weights**: Semibold title, regular body, medium label — no “quiet label, clear body, confident title” hierarchy.
- **Line height**: Adequate but not tuned for calm reading (e.g. 1.41 for body).
- **Result:** Feels **non-trustworthy** — doesn’t signal “we care about readability.”

### Spacing rhythm

- **No strict grid**: padding/gap use 6, 12, 20, 32, 48 — not 8px-based. Inconsistent vertical rhythm.
- **Section vs. block**: layoutVariants use 1rem, 1.25rem, 0.75rem — mixed units and no “section = 24–32px, block = 16px” rule.
- **Result:** Feels **unrefined** — layout works but doesn’t breathe.

### Surface contrast

- **Cool grays**: #F2F2F4, #E6E6E8 — sterile. No warm neutral that says “premium” or “safe.”
- **Card on section**: Contrast exists but is subtle; no “clear floor, clear card” story.
- **Shadows**: elevation.low/mid are visible and a bit heavy — not “ultra soft.”
- **Result:** Feels **cheap** and **prototype** — not calm or confident.

### Alignment precision

- **contentInsetX** = `var(--spacing-6)` (layout-definitions) — not 8px multiple everywhere.
- **Card padding** = padding.md (20px in default) — not 16 or 24 on 8px grid.
- **Result:** Feels **non-trustworthy** — details don’t add up to “crafted.”

---

## PHASE 2 — Apple Theme Tokens (`palettes/apple.json`)

Complete visual language. Structure mirrors [default.json](src/04_Presentation/palettes/default.json) so resolver and palette-bridge work unchanged.

### Typography — SF-style hierarchy

```json
"textSize": {
  "xs": 11,
  "sm": 13,
  "md": 15,
  "lg": 17,
  "xl": 20,
  "display": 56,
  "headline": 34,
  "title": 28,
  "bodyLg": 19,
  "body": 17,
  "caption": 13
},
"textWeight": {
  "regular": 400,
  "medium": 500,
  "semibold": 600,
  "bold": 700
},
"lineHeight": {
  "display": 1.07,
  "headline": 1.12,
  "title": 1.22,
  "tight": 1.25,
  "normal": 1.47,
  "relaxed": 1.59
},
"letterSpacing": {
  "tight": -0.4,
  "normal": 0,
  "loose": 0.35
},
"textRole": {
  "display": { "size": "textSize.display", "weight": "textWeight.bold", "lineHeight": "lineHeight.display", "letterSpacing": "letterSpacing.tight" },
  "headline": { "size": "textSize.headline", "weight": "textWeight.bold", "lineHeight": "lineHeight.headline", "letterSpacing": "letterSpacing.tight" },
  "title": { "size": "textSize.title", "weight": "textWeight.semibold", "lineHeight": "lineHeight.title" },
  "subtitle": { "size": "textSize.lg", "weight": "textWeight.medium", "lineHeight": "lineHeight.normal", "color": "color.secondary" },
  "bodyLg": { "size": "textSize.bodyLg", "weight": "textWeight.regular", "lineHeight": "lineHeight.relaxed" },
  "body": { "size": "textSize.body", "weight": "textWeight.regular", "lineHeight": "lineHeight.relaxed" },
  "label": { "size": "textSize.sm", "weight": "textWeight.medium", "lineHeight": "lineHeight.normal", "letterSpacing": "letterSpacing.loose", "color": "color.outlineStrong" },
  "caption": { "size": "textSize.caption", "weight": "textWeight.regular", "lineHeight": "lineHeight.normal", "color": "color.secondary" }
},
"fontFamily": {
  "base": "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif",
  "sans": "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
  "heading": "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
  "mono": "ui-monospace, 'SF Mono', Menlo, monospace"
}
```

- **17px body**, **28px title**, **13px label**; balanced line heights (1.22 title, 1.47 normal, 1.59 relaxed).

### Spacing — strict 8px grid, calmer padding

```json
"padding": {
  "none": 0,
  "xs": 8,
  "sm": 12,
  "md": 16,
  "lg": 24,
  "xl": 40,
  "2xl": 64,
  "3xl": 96
},
"gap": {
  "xs": 8,
  "sm": 12,
  "md": 16,
  "lg": 24,
  "xl": 40,
  "2xl": 64,
  "3xl": 96
},
"spacing": {
  "sectionPadding": "padding.lg",
  "cardPadding": "padding.lg",
  "inlinePadding": "padding.sm",
  "stackGap": "gap.md",
  "inlineGap": "gap.sm",
  "compactGap": "gap.xs"
}
```

- All values 8px multiples; **larger vertical rhythm** (cardPadding = 24px, sectionPadding = 24px).

### Surfaces — warm neutral base, white cards, ultra-soft shadows

```json
"color": {
  "surface": "#FFFFFF",
  "surfaceVariant": "#E5E5EA",
  "surfaceHero": "#F5F5F7",
  "primary": "#007AFF",
  "primaryVariant": "#0051D5",
  "onPrimary": "#FFFFFF",
  "onSurface": "#1C1C1E",
  "outline": "#C6C6C8",
  "outlineVariant": "#AEAEB2",
  "outlineStrong": "#636366",
  "secondary": "#48484A",
  "error": "#FF3B30",
  "errorContainer": "#FFE5E5",
  "onErrorContainer": "#1C1C1E"
},
"surface": {
  "app": "#F5F5F7",
  "section": "#F5F5F7",
  "card": "#FFFFFF",
  "elevated": "#FFFFFF",
  "base": "#FFFFFF",
  "variant": "#E5E5EA",
  "hero": "#F5F5F7"
},
"shadow": {
  "none": "none",
  "sm": "0 1px 3px rgba(0,0,0,0.04)",
  "md": "0 2px 6px rgba(0,0,0,0.05)",
  "lg": "0 4px 12px rgba(0,0,0,0.06)"
},
"elevation": {
  "0": "none",
  "1": "0 1px 3px rgba(0,0,0,0.04)",
  "2": "0 2px 8px rgba(0,0,0,0.06)",
  "3": "0 8px 24px rgba(0,0,0,0.08)",
  "4": "0 12px 40px rgba(0,0,0,0.10)",
  "none": "none",
  "low": "0 1px 3px rgba(0,0,0,0.04)",
  "mid": "0 2px 8px rgba(0,0,0,0.06)",
  "strong": "0 8px 24px rgba(0,0,0,0.08)",
  "float": "0 12px 40px rgba(0,0,0,0.10)"
},
"surfaceTier": {
  "base": { "background": "color.surface", "shadow": "shadow.none" },
  "raised": { "background": "color.surface", "shadow": "shadow.sm" },
  "overlay": { "background": "color.surface", "shadow": "shadow.md" },
  "floating": { "background": "color.surface", "shadow": "shadow.lg" }
}
```

- **Warm neutral gray** base: #F5F5F7 (app/section); **white** cards; **ultra-soft** shadows (low opacity, small blur).

### Components — radii and transitions

```json
"radius": {
  "none": 0,
  "sm": 8,
  "md": 10,
  "lg": 12,
  "xl": 16,
  "pill": 9999
},
"transition": {
  "fast": "180ms ease",
  "base": "220ms ease",
  "slow": "320ms ease",
  "none": "none"
}
```

- **Pill buttons**: use `radius.pill` in preset for primary actions.
- **Refined inputs**: radius.lg (12px) in field variant; palette drives border/background.
- **Segment stepper**: track and segment use radius.pill; preset defines container + active segment.

### Remainder (unchanged structure, Apple values)

- **borderWidth**: same keys (none, sm, md).
- **opacity**, **size**, **prominence**: same structure; prominence.primary = color.primary / onPrimary.
- **interaction**: same keys; optional slightly softer hover (e.g. opacity 0.94).

---

## PHASE 3 — Apple Visual Preset (`visualPreset: "apple"`)

New preset in [visual-presets.json](src/04_Presentation/lib-layout/visual-presets.json). Key: `"apple"`.

### Section

- **surface**: background `surface.section`, shadow `elevation.none`, radius `radius.lg`, transition `transition.slow`.
- **title**: textRole.title, color onSurface, fontFamily heading.
- **layout** (if needed): gap from spacing.stackGap so section spacing feel is calmer.

### Card

- **surface**: background `surface.card`, shadow `elevation.low`, radius `radius.lg`, transition `transition.base`.
- **title** / **body**: textRole.title, textRole.body; color onSurface.

### Button

- **surface**: radius `radius.pill`, transition `transition.base`. (Pill buttons.)
- Optional: padding from palette so min effective height ~44px when combined with label (e.g. padding 12px 20px).

### Stepper (critical for Phase 4)

- **surface**: background `surface.variant` (track container), radius `radius.pill`, shadow `elevation.none`, transition `transition.base`.
- **step**: radius `radius.pill`, transition `transition.base`.
- **activeStep**: background `surface.card`, color `color.onSurface` (not primary fill — iOS segment is white segment on gray track), shadow `elevation.low`.

This preset **overlays** the molecule variant. For true iOS segment behavior the **variant** must be **tab-segment** (sequence has `background: "surface.section"`, `radius: "radius.pill"`; step surface transparent; surfaceActive surface.card + shadow). Apple preset then refines: track = surface.variant, active = surface.card + elevation.low, no primary fill.

### Chip (if used)

- **surface**: background `surface.variant`, radius `radius.pill`, padding from spacing.
- **text**: textSize.sm, weight semibold, color onSurface.

### List / navigation

- Reuse same philosophy: radius.lg, elevation.low, transition.base.

### Full preset object (structure only)

```json
"apple": {
  "section": {
    "surface": { "background": "surface.section", "shadow": "elevation.none", "radius": "radius.lg", "transition": "transition.slow" },
    "title": { "size": "textRole.title.size", "weight": "textRole.title.weight", "lineHeight": "textRole.title.lineHeight", "color": "color.onSurface", "fontFamily": "fontFamily.heading" }
  },
  "card": {
    "surface": { "background": "surface.card", "shadow": "elevation.low", "radius": "radius.lg", "transition": "transition.base" },
    "title": { "size": "textRole.title.size", "weight": "textRole.title.weight", "lineHeight": "textRole.title.lineHeight", "color": "color.onSurface", "fontFamily": "fontFamily.heading" },
    "body": { "size": "textRole.body.size", "weight": "textRole.body.weight", "lineHeight": "textRole.body.lineHeight", "color": "color.onSurface", "fontFamily": "fontFamily.sans" }
  },
  "button": {
    "surface": { "radius": "radius.pill", "transition": "transition.base" }
  },
  "stepper": {
    "surface": { "background": "surface.variant", "radius": "radius.pill", "shadow": "elevation.none", "transition": "transition.base" },
    "step": { "radius": "radius.pill", "transition": "transition.base" },
    "activeStep": { "background": "surface.card", "color": "color.onSurface", "shadow": "elevation.low" }
  },
  "chip": {
    "surface": { "background": "surface.variant", "radius": "radius.pill" },
    "text": { "size": "textSize.sm", "weight": "textWeight.semibold", "color": "color.onSurface" }
  },
  "list": { "collection": { "gap": "spacing.stackGap" }, "layout": { "gap": "spacing.inlineGap" }, "surface": {} }
}
```

**Resolver:** Add `apple: presetsBundle.apple` in [visual-preset-resolver.ts](src/04_Presentation/lib-layout/visual-preset-resolver.ts) PRESETS map (implementation step; not a JSON-only change, but required for preset to apply).

---

## PHASE 4 — Stepper Fix (Critical): iOS-Style Segment Control

**Target:** Think | Repent | Ask | Conform | Keep — one control, one track, one selected segment.  
**No underline tabs. No white boxes. No floaty chips.**

### Design

- **One track**: Single pill-shaped container, background = `surface.variant` (warm gray #E5E5EA in Apple palette).
- **Segments**: No gap between segments; each segment is a tap target; **inactive** = transparent (shows track); **active** = `surface.card` (white) + `elevation.low` (ultra-soft shadow), so the active segment appears “inset” or “selected” on the track.
- **Text**: Inactive = `color.onSurface` or secondary, medium weight; active = `color.primary` (or onSurface with semibold). Prefer active = primary for clarity.

### JSON strategy (no new variant required)

- **molecules.json** already has **tab-segment**:
  - `sequence`: direction row, gap compact, **background** surface.section, **radius** radius.pill.
  - `surface`: transparent, radius pill, padding.
  - `surfaceActive`: surface.card, radius pill, padding, shadow elevation.low.
  - `text` / `textActive`: size, weight, color.

- **Apple preset** (above) sets stepper overlay: track = surface.variant, activeStep = surface.card + elevation.low. Merge order: preset (base) then variant. Variant’s **sequence.background** is surface.section; preset has no sequence, so variant wins for sequence. For **apple** we need the **track** to be surface.variant. So either:
  - **Option A:** Apple preset adds `stepper.sequence`: `{ "background": "surface.variant", "radius": "radius.pill" }` so overlay provides track styling. Resolver merge: preset.stepper.sequence would merge with variant.sequence → track becomes surface.variant. Then step/surfaceActive from variant (transparent / surface.card + shadow) plus preset activeStep (surface.card, color onSurface, shadow) — consistent.
  - **Option B:** In Apple palette, surface.section = surface.variant color so that tab-segment’s sequence.background “surface.section” resolves to the same warm gray. Then no preset sequence override needed; only step/activeStep in preset to ensure shadow and surface.card.

Recommendation: **Option A** — add to apple preset:

```json
"stepper": {
  "sequence": { "background": "surface.variant", "radius": "radius.pill", "gap": "gap.none" },
  "surface": { "background": "transparent", "radius": "radius.pill", "padding": "var(--spacing-sm) var(--spacing-md)", "transition": "transition.base" },
  "step": { "radius": "radius.pill", "transition": "transition.base" },
  "activeStep": { "background": "surface.card", "color": "color.primary", "shadow": "elevation.low" }
}
```

So: **track** = surface.variant, **active segment** = white + soft shadow, **active text** = primary. Variant tab-segment still supplies surface/surfaceActive/text/textActive; preset overlays sequence + step/activeStep. If variant has sequence.gap, preset’s sequence.gap can override to gap.none for seamless segments.

### Journal screen: use segment, not underline

- **Today:** [app.json](src/01_App/apps-json/apps/journal_track/app.json) Stepper has `params.variant: "tab-underline"`.
- **For Apple theme:** Stepper must use **variant `tab-segment`** when theme is apple. Options:
  1. **Theme-driven override:** When `theme === "apple"`, profile or renderer injects stepper variant `tab-segment` for that node (single place in code).
  2. **Template-driven:** Apple journal template (e.g. focus-writing-apple) uses layoutVariants or a content patch that sets stepper variant to tab-segment in the resolved tree.
  3. **Screen variant:** Duplicate journal screen JSON for “apple” with variant tab-segment and use that screen when theme=apple.

Cleanest: **(1) theme-driven override** — when applying profile for theme=apple, if experience is journal and node type is Stepper, set `params.variant` to `"tab-segment"` (or merge into node.params so JSON can still override). Then one JSON preset + one palette; stepper fix is automatic when theme=apple.

---

## PHASE 5 — Activation Strategy: `theme = "apple"` → palette + visualPreset

### Intended behavior

When **theme** = `"apple"`:

1. **Palette** = `apple` (so `state.values.paletteName` = `"apple"`).
2. **Visual preset** = `apple` (so effective profile has `visualPreset: "apple"`).

So one switch (theme name) applies both.

### Where theme can live

- **state.values.themeName** = `"apple"` (or `"default"`, `"google"` later).
- **Resolver rule:** If `themeName === "apple"`: set `paletteName = "apple"` and use `visualPreset = "apple"` when building the effective profile (template + presentation). So template’s visualPreset can be overridden by theme (theme wins over template when theme is set).

### Implementation options (no file changes here — plan only)

1. **Single theme selector in UI** (e.g. control dock): On change, dispatch:
   - `state.update` → `paletteName: "apple"` and (if supported) `themeName: "apple"`.
   - Profile resolution (e.g. in [page.tsx](src/app/page.tsx) or profile-resolver): if `state.values.themeName === "apple"`, set `effectiveProfile.visualPreset = "apple"` and ensure `paletteName` is `"apple"`.
2. **Palette picker only today:** User picks “Apple” palette → only palette switches. To get preset “apple” as well, either:
   - Add a separate “Style preset” dropdown (apple / default / …) that sets visualPreset in profile, or
   - Treat palette name “apple” specially: when paletteName === "apple", force visualPreset = "apple" in the profile used by JsonRenderer (one if-block in profile resolution).
3. **Template as carrier:** New template id e.g. `focus-writing-apple` with visualPreset `"apple"` and same layout as focus-writing; user picks that template and palette “apple”. Then theme = template + palette; no new state key.

**Recommended for “theme = apple” in one switch:** Option 2 (palette "apple" → also set visualPreset "apple" in profile). Then “Apple” in palette picker = full Apple theme. No new state key; minimal code in profile resolution.

### Stepper variant when theme = apple

- In the same profile-resolution path, when `visualPreset === "apple"` (or paletteName === "apple"), for journal experience: when resolving the tree or before passing to JsonRenderer, set Stepper nodes’ `params.variant` to `"tab-segment"` if not already set (or merge so node.params.variant = "tab-segment" when theme is apple). That yields iOS segment without changing app.json.

---

## PHASE 6 — Impact Projection

| Metric | Before | After (Apple theme) | Driver |
|--------|--------|---------------------|--------|
| **Trust** | Low–medium (generic, prototype) | **High** | Warm neutrals, clear hierarchy, segment control, 17/28/13 type, calm spacing. Reads “shipped product.” |
| **Clarity** | Medium (competing elements) | **High** | One track for steps, clear title/body/label scale, 8px grid and section rhythm. One focus per block. |
| **Perceived product maturity** | Prototype / MVP | **Premium / 1.0** | SF-style type, pill buttons, ultra-soft shadows, iOS segment, refined fields. No “developer UI” cues. |

**Risks:** (1) Adding `apple` to PRESETS in visual-preset-resolver is a one-line code change. (2) Theme activation (palette + preset + stepper variant) needs a single profile-resolution path. (3) Field “refined” look is mostly palette (radius, outline, padding); Field compound already token-driven.

---

## Deliverables Summary (No File Changes Yet)

1. **Apple theme architecture:** Palette `apple` + visual preset `apple`; activation = set paletteName + visualPreset (and optionally stepper variant) when theme = apple.
2. **JSON plan:** New file `palettes/apple.json` (full token set above); new key `"apple"` in `visual-presets.json`; register `apple` in `palettes/index.ts` and in visual-preset-resolver PRESETS.
3. **Token structure:** Same keys as default (color, surface, radius, padding, gap, spacing, textSize, textWeight, lineHeight, letterSpacing, textRole, fontFamily, shadow, elevation, surfaceTier, transition, etc.) with Apple values (17/28/13 type, 8px grid, warm gray base, white cards, ultra-soft shadows, pill radius, SF font stack).
4. **Preset definition:** `apple` preset with section, card, button (pill), stepper (segment track + white active + soft shadow), chip, list; stepper.sequence + step + activeStep for iOS-like segment.

Next step: implement `palettes/apple.json`, add `apple` to visual-presets.json and resolver, then add activation logic (palette + preset + stepper variant) in profile resolution.
