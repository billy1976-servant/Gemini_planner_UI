# Visual Amplification Proof

**Objective:** Visually amplify the active journal template (focus-writing) using existing systems only. No engine, resolver, renderer, molecule, or atom changes.

**Scope:** Parameter-only changes in `template-profiles.json`, `visual-presets.json`, and `presentation-profiles.json`.

---

## 1. Before vs After Parameter Deltas

### template-profiles.json — template `focus-writing`

| Location | Parameter | Before | After |
|----------|-----------|--------|--------|
| **Template root** | `sectionBackgroundPattern` | _(absent)_ | `"alternate"` |
| **layoutVariants.writing** | `params.gap` | `"0.5rem"` | `"1rem"` |
| **layoutVariants.writing** | `params.padding` | `"2rem 0"` | `"3rem 0"` |
| **layoutVariants.focus** | `params.gap` | `"0.75rem"` | `"1.25rem"` |
| **layoutVariants.focus** | `params.padding` | `"1.5rem 0"` | `"2.5rem 0"` |
| **layoutVariants.track** | `containerWidth` | `"narrow"` | `"contained"` |
| **layoutVariants.track** | `params.gap` | `"0.5rem"` | `"0.75rem"` |
| **sections.writing** | `params.gap` | `"0.5rem"` | `"1rem"` |
| **sections.focus** | `params.gap` | `"0.75rem"` | `"1.25rem"` |
| **sections.track** | `params.gap` | `"0.5rem"` | `"0.75rem"` |

### visual-presets.json — preset `compact`

| Location | Parameter | Before | After |
|----------|-----------|--------|--------|
| **section.surface** | `shadow` | `"elevation.none"` | `"elevation.low"` |
| **section.surface** | `radius` | `"radius.sm"` | `"radius.md"` |
| **section.title** | `size` | `"textRole.label.size"` | `"textRole.title.size"` |
| **section.title** | `weight` | `"textRole.label.weight"` | `"textRole.title.weight"` |
| **section.title** | `lineHeight` | `"textRole.label.lineHeight"` | `"textRole.title.lineHeight"` |
| **card.surface** | `shadow` | `"elevation.low"` | `"elevation.mid"` |
| **card.surface** | `radius` | `"radius.sm"` | `"radius.md"` |
| **button.surface** | `radius` | `"radius.sm"` | `"radius.md"` |
| **list.collection** | `gap` | `"spacing.compactGap"` | `"spacing.stackGap"` |
| **list.layout** | `gap` | `"spacing.compactGap"` | `"spacing.inlineGap"` |
| **_(new)_** | **stepper** | _(absent)_ | Full block: `surface`, `step`, `activeStep` (elevation.mid, radius.pill, color.primary) |

### presentation-profiles.json — experience `journal` (new entry)

| Location | Parameter | Before | After |
|----------|-----------|--------|--------|
| **Root** | `journal` profile | _(absent)_ | New profile added |
| **defaults** | `maxWidth` | — | `"720px"` |
| **sections** | header/focus/writing/track/footer | — | Gaps and padding increased (e.g. writing `gap` 1.5rem, `padding` 2rem 0; focus `padding` 1.5rem 0; track `padding` 1rem 0; header/footer padding 1.5rem 0) |

---

## 2. Roles Changed Visually

- **writing:** Narrow container kept; stronger padding (3rem vertical), larger internal gap (1rem), section gap 1rem. Feels more “spotlighted” and separated.
- **focus:** Narrow container; more top/bottom spacing (2.5rem), gap 1.25rem; section gap 1.25rem. Clearer separation from writing/track.
- **track:** Layout remains stack; container widened to `contained`; gap 0.75rem. Slightly lower visual weight than writing/focus (wider, less elevated).

All changes are driven by **layoutVariants** and **sections** in the **focus-writing** template plus the **compact** visual preset and the new **journal** presentation profile.

---

## 3. Confirmation: Template Is Driving Visuals

- **focus-writing** is the active journal template: it defines `visualPreset: "compact"`, `containerWidth: "narrow"`, `sectionBackgroundPattern: "alternate"`, and per-role `layoutVariants` and `sections`.
- **compact** (visual-presets.json) is amplified only by increasing existing token values (elevation, radius, spacing, title role) and adding the existing **stepper** pattern; no new tokens.
- **journal** (presentation-profiles.json) provides experience-level section padding and rhythm when the experience is `"journal"`; the template still overrides per-role where specified.
- No changes were made to layout-definitions.json, resolvers, engines, renderer, molecules, or atoms.

---

## 4. No Engine / Logic Changes

- **Files touched:**  
  - `src/04_Presentation/lib-layout/template-profiles.json`  
  - `src/04_Presentation/lib-layout/visual-presets.json`  
  - `src/04_Presentation/lib-layout/presentation-profiles.json`  
- **Files not touched:** layout-definitions.json, any resolver, engine, renderer, molecule, or atom.
- **Token set:** Only existing tokens used (e.g. `elevation.low`, `elevation.mid`, `radius.md`, `spacing.stackGap`, `spacing.inlineGap`, `textRole.title.*`, `sectionBackgroundPattern: "alternate"`). No new tokens introduced.

---

## 5. Expected Result on Journal Screen Reload

- Tighter writing column (narrow + 65ch max + stronger padding).
- Stronger center focus (alternate section background, more vertical rhythm).
- Visible surface depth (section/card elevation and radius from compact preset).
- Clearer separation between sections (gaps and padding increases in template + journal profile).
- Feels like a real app: depth, hierarchy (title vs stepper vs input vs action), and breathing room without changing behavior or engines.
