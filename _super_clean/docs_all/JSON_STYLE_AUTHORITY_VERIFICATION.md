# JSON Style Authority Verification

Style authority lives only in JSON. TypeScript does not list themes, map palette to preset, or hardcode theme names.

---

## Runtime style flow

1. **template-profiles.json** — Per-template `visualPreset`, `spacingScale`, `cardPreset`, `layoutVariants`, `sections`, `containerWidth`, etc. Template is selected by state (e.g. `templateId`); profile is merged in page and passed to renderer.
2. **presentation-profiles.json** — Per-experience defaults (e.g. journal: `visualPreset`, sections, maxWidth). Experience comes from state; profile is read by profile-resolver.
3. **visual-presets.json** — Per-preset overrides per molecule type (section, card, button, stepper, chip, list, …). Preset name comes from template (and optional state override); resolver looks up by name from the full bundle (no hardcoded map in TS).
4. **palettes/*.json** — Colors, surfaces, radius, padding, gap, spacing, textSize, textRole, elevation, fontFamily, transition, etc. Palette is selected by `paletteName` from state or palette-store; palettes object is built from all `.json` files in the palettes folder (no manual list in TS).
5. **molecules.json** — Variants and sizes per molecule type (stepper, card, button, field, …). Variant/size come from node params or defaults.
6. **Renderer** — `resolveParams(visualPresetOverlay, cardPresetOverlay, variantPreset, sizePreset, node.params, paletteOverride)`. Tokens resolved via palette; no theme branches in renderer.

---

## Which JSON files control what

| Concern | JSON source |
|--------|-------------|
| **Spacing** | template-profiles.json (layoutVariants, sections params), presentation-profiles.json (sections), palettes (spacing, padding, gap), layout-definitions.json (contentInsetX, container) |
| **Typography** | palettes (textSize, textWeight, lineHeight, letterSpacing, textRole, fontFamily); visual-presets (section/card title and body refs to textRole) |
| **Surfaces** | palettes (surface.*, color.*); visual-presets (section/card/stepper surface background, shadow, radius) |
| **Elevation** | palettes (elevation.*, shadow.*); visual-presets (shadow on section, card, button, stepper) |
| **Component feel** | visual-presets (button radius, stepper track/activeStep, chip surface); molecules.json (variants: surface, surfaceActive, text, textActive, padding, radius) |

---

## Confirmation: renderer is token-driven only

- Profile (including `visualPreset`) comes from template + experience + optional state override; no theme name in renderer.
- Palette name comes from state or palette-store; renderer receives `paletteOverride` when needed (e.g. preview). Token resolution uses the chosen palette object; no if-palette or if-theme logic in json-renderer.

---

## Confirmation: TS is neutral

- **palettes/index.ts** — Builds `palettes` from `require.context(".", false, /\.json$/)`; no manual palette names. New palette = new file in folder.
- **visual-preset-resolver.ts** — `PRESETS = presetsBundle`; no manual preset map. New preset = new key in visual-presets.json.
- **template-profiles.ts** — Reads template-profiles.json; `visualPreset` typed as `string` so any preset name from JSON is valid.
- **palette-store.ts** — Uses `palettes[name]`; no theme names. Comment states palette set is derived from JSON.
- **page.tsx / profile-resolver** — Read profile from JSON and state; no palette→preset mapping or theme branches.

---

## Summary

Styling is controlled only by:

- Which **template** and **experience** are selected (state / URL).
- Which **palette** is selected (state or store).
- Which **visual preset** is on the template (or overridden by state).
- **Token values** in the chosen palette and preset (and molecule variant) resolved at render time.

No TS/TSX edits are required to add a new theme: add palette JSON, add preset key in visual-presets.json, and optionally add or point a template to that preset.
