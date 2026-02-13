# Level-10 Visual System Assessment (JSON-Only + Style Switching)

## Verdict: It Is Possible, and You Are Close

Your architecture already supports **JSON-only style authority**: palette + visual preset + template profile drive look and feel. Changing to "another style" is **select a different palette + visual preset (and optionally template)** — no code. The gap to Level 10 is mostly **using the tokens you have** and **filling a few missing tokens/hooks** so every "premium" choice is expressible in JSON.

---

## What You Have Today (JSON-Driven)

| Layer | What's there | Where |
|-------|----------------|-------|
| **Palette** | Colors, surfaces, radius, padding, gap, spacing (semantic), textSize, textWeight, lineHeight, letterSpacing, **textRole** (display/headline/title/body/label/caption), shadow, **elevation**, **transition**, fontFamily, surfaceTier, borderWidth, **interaction** (hover: opacity/scale/lift, press, disabled) | `src/04_Presentation/palettes/apple.json`, `default.json` |
| **Visual preset** | Per-molecule overrides: section, card, button, stepper, field, list, toolbar. Merge order: preset then variant then node.params | `src/04_Presentation/lib-layout/visual-presets.json` |
| **Template profile** | layoutVariants (layoutId + params.gap, params.padding), sections (type + params). Drives section layout and spacing | `src/04_Presentation/lib-layout/template-profiles.json` |
| **Layout definitions** | componentLayouts with gap/padding as `var(--spacing-8)`, `var(--spacing-10)` | `src/04_Presentation/layout/data/layout-definitions.json` |
| **Molecules** | Card/Section/Stepper/Field variants (surface, title, body, field, step, etc.). Card has "floating" variant; Section has "floating"; Stepper has tab-segment, tab-underline | `src/04_Presentation/components/molecules/molecules.json` |
| **Runtime** | Palette → CSS vars via `src/06_Data/site-renderer/palette-bridge.tsx` (--spacing-*, --radius-*, --shadow-*, --font-*, etc.). resolveParams merges preset + variant + params and resolves token refs. SurfaceAtom uses transition, shadow, radius. TriggerAtom uses interaction.hover and transition | json-renderer, atoms (surface, trigger, field) |

So: **depth (shadow/elevation), space (padding/gap), typography (textRole), motion (transition), and material (surface/radius)** are all tokenized and can be switched by changing palette + preset.

---

## What's Holding You Back (and How to Fix It)

### 1. Spatial rhythm feels random

**Issue:** Layout uses `var(--spacing-8)` / `var(--spacing-10)`; template layoutVariants use raw `"1rem"`, `"1.25rem"`. `--spacing-10` is not set from palette (only 6, 8, 12 are in palette-bridge), so rhythm isn't fully palette-driven.

**JSON-possible:**
- Add a **rhythm** scale to the palette (e.g. `rhythm: { titleToTabs: 24, tabsToPrompt: 28, promptToInput: 24, inputToAction: 24 }` in px or refs like `padding.lg`).
- Extend **palette-bridge** to set CSS vars from that (e.g. `--rhythm-1`, `--rhythm-2`) — **one-time small code**.
- In **layout-definitions** or **template layoutVariants**, use those vars for content-narrow / content-stack gap and padding (e.g. `gap: "var(--rhythm-2)"`). Then "Apple rhythm" = values in apple.json; "compact" = values in default.json.

**Conclusion:** Mostly JSON + one-time bridge extension to expose rhythm tokens.

---

### 2. Journal doesn't feel like a floating panel

**Issue:** Card should feel like a floating, touchable object (soft shadow, larger radius).

**JSON-possible:** Already possible.
- Use a preset that gives **card** `elevation.float` (or `elevation.strong`) and `radius.xl` (apple already has card with `elevation.low`, `radius.lg`; "floating" preset has `elevation.float`, `radius.xl`).
- Either switch journal template to a preset that uses the **floating** card style, or add a **journal-floating** preset in `visual-presets.json` that copies apple and sets `card.surface.shadow` to `elevation.float` and `card.surface.radius` to `radius.xl`.
- Section background = warm gray already from palette (`surface.section` / `surface.app`).

**Conclusion:** JSON only; no code.

---

### 3. Tabs feel like text, not controls

**Issue:** Tabs should look like a segmented control: soft capsule track, selected step "pops" (fill + elevation).

**JSON-possible:** Already there.
- Stepper variant **tab-segment** in molecules.json + **apple** preset in visual-presets.json: `surface.variant` track, `surface.card` + `elevation.low` for active step.
- If you're on tab-underline, switching to **tab-segment** in the journal app JSON and using the **apple** (or similar) preset gives the desired look.
- To make "selected pops" stronger: in the preset, set `stepper.activeStep.shadow` to `elevation.mid` and ensure padding/radius are pill — JSON only.

**Conclusion:** JSON only.

---

### 4. Typography hierarchy is flat

**Issue:** Need clear scale: screen title (strong) → section tabs (secondary) → prompt (friendly) → input label (quiet).

**JSON-possible:** Largely possible.
- **textRole** in palette already has display, headline, title, body, label, caption.
- Visual preset has **section.title** and **card.title** / **card.body**. Today both section and card often use the same role (e.g. title).
- Add **semantic roles** in palette (e.g. `textRole.screenTitle` = headline, `textRole.prompt` = body or subtitle) and reference them in the preset: e.g. section.title → `textRole.screenTitle` or `textRole.headline`, card.title → `textRole.title`, card.body → `textRole.prompt` or `textRole.body`, and field label from **field.label** → `textRole.label` (already small/quiet).
- No new components needed; just new keys in palette + preset overrides.

**Conclusion:** JSON only (palette + visual preset).

---

### 5. Prompt bubble should feel like "Siri" (softer, rounded, shadow)

**Issue:** Prompt cards need softer background, more padding, more rounded, slight shadow.

**JSON-possible:** Yes.
- Option A: Give the journal **Card** a variant (e.g. **prompt**) in molecules.json: surface = `surface.variant`, radius = `radius.xl`, padding = `padding.lg`, shadow = `elevation.low`. Then in app JSON set prompt cards to `variant: "prompt"`.
- Option B: In the **visual preset**, override **card** so that when used in a "prompt" context it gets those tokens. Context is harder without a variant; so Option A (variant) is the clean JSON-only approach.

**Conclusion:** JSON only (new card variant + app JSON).

---

### 6. Input should feel premium (focus glow, soft background, rounded)

**Issue:** Field needs rounded corners, soft background, and focus state (glow / slight expand).

**JSON-possible:** Partially.
- **Radius and padding:** Already in preset; apple has `field.field.radius: radius.lg`, padding.
- **Focus:** FocusRingAtom exists and reads `focusRing.color`, `focusRing.width`, `focusRing.offset` from palette. Apple palette doesn't define `focusRing`; some other palettes do. So add **focusRing** to apple.json and, if desired, **field.focus** (e.g. `focusShadow`, `focusTransition`) in preset.
- **Applying focus to Field:** Field compound/atom does not currently use FocusRingAtom or apply focus-state boxShadow. So: **tokens = JSON**; **using them on focus = one-time code** in Field (e.g. wrap input in a div that gets focus ring or apply a focus style from params).

**Conclusion:** Tokens and preset = JSON; one-time code to apply focus style to Field.

---

### 7. Sticky tabs

**Issue:** TRACK tabs should stay at top when scrolling.

**JSON-possible:** Only if the layout engine or Section compound can apply `position: sticky` from params. Today, section layout comes from layout-definitions and section compound; there's no generic "sticky" section param in the journal path. So either:
- Add a **section layout** (or layout param) that sets sticky on the section wrapper and use it for the TRACK section, or
- Add a **params** flag (e.g. `sticky: true`) that the Section compound passes to the wrapper style — **one-time small code**. Then in template or app JSON you set that param for the TRACK section.

**Conclusion:** JSON-driven once a small code path exists for sticky section.

---

### 8. Tab slide / view transition

**Issue:** When switching Think → Repent → etc., a short slide or fade would add polish.

**JSON-possible:** Behavior is in the engine (when-conditioned children swap). To animate: either use the View Transitions API in the renderer when `currentView` changes (code), or add a preset/layout option like `viewTransition: "slide"` that the engine respects (code that reads the option). Tokens (e.g. transition duration) can stay in palette; the "when to animate" and "how" need a small code path.

**Conclusion:** Optional; requires a small amount of code; duration/easing can stay in palette.

---

## Summary: Is It Possible Right Now?

| Goal | Possible now? | How |
|------|----------------|-----|
| Switch to another style by JSON | Yes | Change palette + visualPreset (and optionally template). No code. |
| Depth (shadows, floating card) | Yes | Preset: card.surface.shadow = elevation.float, radius.xl. |
| Space (rhythm) | Mostly | Add rhythm tokens to palette; bridge exports them; layout uses vars. One-time bridge + JSON. |
| Typography hierarchy | Yes | Add screenTitle/prompt roles in palette; preset maps section.title / card.title and card.body to them. |
| Tabs as segment control | Yes | Stepper variant tab-segment + apple (or custom) preset. |
| Prompt bubble (softer, rounded) | Yes | Card variant "prompt" in molecules + app JSON. |
| Input premium (rounded, padding) | Yes | Already in apple preset (field.field). |
| Input focus glow | Tokens yes, application no | Add focusRing + field.focus in palette/preset; Field component applies them (one-time code). |
| Sticky tabs | Not yet | One-time code: section respects a sticky param; then set in template/app JSON. |
| Tab transition | Not yet | Optional; small code to run view transition when currentView changes; duration in palette. |

So: **most of Level 10 is achievable with JSON only or JSON + a few one-time, generic code additions** (rhythm vars, field focus, optional sticky, optional view transition). Nothing requires a second "parallel" design system.

---

## Recommended Order (JSON-First)

1. **Preset for "floating journal"**  
   In visual-presets.json: duplicate **apple** (or add **apple-floating**), set `card.surface.shadow` to `elevation.float`, `card.surface.radius` to `radius.xl`. Use this preset for the journal template so the main content card feels like a floating panel.

2. **Typography roles**  
   In apple.json (and any other palette you care about): add `textRole.screenTitle` (e.g. = headline) and `textRole.prompt` (e.g. = body or subtitle). In the same preset, set **section.title** to use `textRole.screenTitle` and **card.body** (and optionally card.title) to use `textRole.prompt` so the prompt feels friendlier and the screen title is the strong anchor.

3. **Prompt card variant**  
   In molecules.json: add card variant **prompt** (surface.variant, radius.xl, padding.lg, elevation.low). In journal app JSON, set the prompt Cards to `variant: "prompt"`.

4. **Rhythm tokens**  
   In palette: add e.g. `rhythm: { titleTabs: "padding.lg", tabsPrompt: "padding.xl", promptInput: "padding.lg" }` (or numeric px). In palette-bridge.tsx: map these to `--rhythm-*` CSS vars. In layout-definitions.json or in template layoutVariants for the journal, use `var(--rhythm-*)` for gap/padding so spacing follows the palette (24px / 28px feel for Apple).

5. **Stepper**  
   Ensure journal uses **tab-segment** and the chosen preset (e.g. apple or apple-floating) so tabs look like a segmented control with a clear selected state.

6. **Field focus (code + JSON)**  
   Add **focusRing** (and optionally **field.focus**) to apple palette; in Field compound/atom, apply focus ring or focus shadow from params so focus state is visible and feels premium.

7. **Sticky / transition (optional)**  
   If you want sticky TRACK and tab transition, add the small code paths above and drive behavior from template or preset (e.g. section.params.sticky, viewTransition in preset or layout).

---

## Changing Style by JSON Only

- **Palette:** Swap `paletteName` (e.g. default → apple). Palette drives colors, type scale, radius, spacing, elevation, transition, interaction.
- **Visual preset:** Template profile's `visualPreset` (e.g. default → apple → apple-floating) controls section/card/button/stepper/field/list overrides.
- **Template:** Different template can use different layoutVariants (e.g. more spacing, different layoutId) and a different visualPreset.

So: **a "Level-10 Apple" style = palette apple + preset apple-floating (or tuned apple) + template focus-writing-apple. A "compact" or "bold" style = other palette + other preset + same or other template.** All configurable in JSON; no code changes required for style switching.

Your system is capable of Level-10 polish; the main work is **defining the right tokens and preset overrides** and **adding a few generic hooks** (rhythm vars, field focus, optional sticky/transition) so every decision stays in JSON.

---

## Compatibility: LEVEL-10 JOURNAL VISUAL UPGRADE (JSON-ONLY) Command

**Is it a good upgrade?** Yes. The intent (floating panel, stronger depth, segment tabs, prompt bubble, tuned palette) matches your Level-10 assessment and is compatible with your pipeline.

**No hardcoding?** Yes. The command only touches:
- `src/04_Presentation/lib-layout/visual-presets.json`
- `src/04_Presentation/components/molecules/molecules.json`
- `src/04_Presentation/palettes/apple.json`
- `src/04_Presentation/lib-layout/template-profiles.json`
- Journal app JSON (e.g. `src/01_App/apps-json/apps/journal_track/app.json`)

No TypeScript, renderer, atoms, behavior engines, layout resolver, or state system changes.

**Schema corrections required:** Your resolver and compounds expect specific shapes. The command as written has a few mismatches; use the corrected shapes below so the upgrade works.

### 1. "extends" is not supported

The visual preset resolver does a single lookup: `PRESETS[presetName]`. It does **not** merge an `"extends": "apple"` base. So:

- **Do not** add `"extends": "apple"` to a new preset.
- **Do** add a **full** preset that repeats all keys you need (copy the existing `"apple"` block and then override the parts you want).

### 2. Preset: use token keys your system understands

Your presets use **token references** that resolve via the palette, not the word `"variant"` as a value:

| Command says | Use instead (compatible shape) |
|--------------|--------------------------------|
| `section.surface.variant: "section"` | `section.surface.background: "surface.section"` (and optional `padding: "padding.xl"`) |
| `section.title.textRole: "headline"` | `section.title.size: "textRole.headline.size"`, `weight: "textRole.headline.weight"`, `lineHeight: "textRole.headline.lineHeight"`, `color: "color.onSurface"`, `fontFamily: "fontFamily.heading"` |
| `card.surface.variant: "card"` | `card.surface.background: "surface.card"` (and `radius`, `shadow`, `padding` as in apple) |
| `card.title.textRole: "title"` | Keep full keys: `size: "textRole.title.size"`, etc. (as in existing apple preset) |
| `stepper.surface.variant: "variant"` | `stepper.surface.background: "surface.variant"` |
| `stepper.activeStep.surface: "card"` | `stepper.activeStep.background: "surface.card"` (and `shadow: "elevation.mid"`, `color: "color.primary"`). **No nested `surface`** — your stepper uses top-level `activeStep.background`, `activeStep.shadow`, `activeStep.color`. |
| `field.label.textRole: "label"` | `field.label.size: "textRole.label.size"`, `weight: "textRole.label.weight"`, `lineHeight: "textRole.label.lineHeight"`, `color: "color.outlineStrong"` (or `color.secondary`) so the label slot gets resolved typography |

### 3. Corrected preset: `apple-floating-journal` (no extends, full shape)

Add this as a **full** preset (copy apple and override). Example:

```json
"apple-floating-journal": {
  "section": {
    "surface": {
      "background": "surface.section",
      "shadow": "elevation.none",
      "radius": "radius.lg",
      "transition": "transition.slow",
      "padding": "padding.xl"
    },
    "title": {
      "size": "textRole.headline.size",
      "weight": "textRole.headline.weight",
      "lineHeight": "textRole.headline.lineHeight",
      "letterSpacing": "textRole.headline.letterSpacing",
      "color": "color.onSurface",
      "fontFamily": "fontFamily.heading"
    }
  },
  "card": {
    "surface": {
      "background": "surface.card",
      "radius": "radius.xl",
      "shadow": "elevation.float",
      "transition": "transition.base",
      "padding": "padding.lg"
    },
    "title": {
      "size": "textRole.title.size",
      "weight": "textRole.title.weight",
      "lineHeight": "textRole.title.lineHeight",
      "color": "color.onSurface",
      "fontFamily": "fontFamily.heading"
    },
    "body": {
      "size": "textRole.body.size",
      "weight": "textRole.body.weight",
      "lineHeight": "textRole.body.lineHeight",
      "color": "color.onSurface",
      "fontFamily": "fontFamily.sans"
    }
  },
  "button": {
    "surface": {
      "radius": "radius.pill",
      "padding": "padding.md padding.xl",
      "shadow": "elevation.low",
      "transition": "transition.base"
    }
  },
  "stepper": {
    "surface": {
      "background": "surface.variant",
      "radius": "radius.pill",
      "shadow": "elevation.none",
      "transition": "transition.base",
      "padding": "padding.xs"
    },
    "step": { "radius": "radius.pill", "transition": "transition.base" },
    "activeStep": {
      "background": "surface.card",
      "color": "color.primary",
      "shadow": "elevation.mid"
    }
  },
  "chip": {
    "surface": { "background": "surface.variant", "radius": "radius.pill" },
    "text": { "size": "textSize.sm", "weight": "textWeight.semibold", "color": "color.onSurface" }
  },
  "field": {
    "field": { "radius": "radius.lg", "padding": "padding.md" },
    "label": {
      "size": "textRole.label.size",
      "weight": "textRole.label.weight",
      "lineHeight": "textRole.label.lineHeight",
      "color": "color.outlineStrong"
    }
  },
  "list": {
    "collection": { "gap": "spacing.stackGap" },
    "layout": { "gap": "spacing.inlineGap" },
    "surface": {}
  }
}
```

### 4. Card variant `prompt` in molecules.json

Use **background** (and standard keys), not `variant` as a value:

```json
"prompt": {
  "surface": {
    "background": "surface.variant",
    "radius": "radius.xl",
    "padding": "padding.lg",
    "shadow": "elevation.low"
  },
  "title": {
    "size": "textRole.body.size",
    "weight": "textRole.body.weight",
    "lineHeight": "textRole.body.lineHeight",
    "color": "color.onSurface"
  },
  "body": {
    "size": "textRole.body.size",
    "weight": "textRole.body.weight",
    "lineHeight": "textRole.body.lineHeight",
    "color": "color.onSurface"
  }
}
```

### 5. Palette (apple.json) and template / app JSON

- **Palette:** Tuning only `radius`, `elevation`, `padding` with the numeric/string values from the command is compatible. Keep all existing keys; only change the values you want (e.g. `radius.lg`, `radius.xl`, `elevation.low`, `elevation.mid`, `elevation.float`, `padding.md`, `padding.lg`, `padding.xl`).
- **Template:** In `template-profiles.json`, set the journal template’s `visualPreset` to `"apple-floating-journal"` (e.g. for `focus-writing-apple` or whichever profile the journal uses).
- **Stepper:** In the journal app JSON, set the Stepper’s `params.variant` (or top-level `variant`) to `"tab-segment"`.
- **Prompt cards:** Set `"variant": "prompt"` on **all five** prompt Cards (Think, Repent, Ask, Conform, Keep), not only the first one, so every step has the same bubble look.

### 6. File note

There is no single `palettes.json`; palettes live in **`src/04_Presentation/palettes/*.json`** (e.g. `apple.json`). The rest of the command’s file list is correct.

---

**Summary:** The upgrade is good and compatible, and it stays JSON-only with no hardcoding. Apply the schema corrections above (no `extends`; use `background` and full textRole keys; flat `activeStep`; prompt card with `background: "surface.variant"` and full title/body keys) and the command will align with your system and produce the intended Level-10 look.
