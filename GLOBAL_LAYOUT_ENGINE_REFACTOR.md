# Global Layout Engine Refactor — Report

## Summary

Layout for JSON screens is now controlled **only** by JsonSkinEngine and section params in the JSON schema. Page-level layout logic (e.g. `landingStep`, `isHeroStep`, main `maxWidth`/padding) has been removed from the landing page so that width and padding are never determined by the page.

---

## Files Changed

| File | Change |
|------|--------|
| [src/app/landing/page.tsx](src/app/landing/page.tsx) | Removed `landingStep`, `isHeroStep`, and all conditional main styling. Main is a neutral container (flex + minHeight only). |
| [src/05_Logic/logic/engines/json-skin.engine.tsx](src/05_Logic/logic/engines/json-skin.engine.tsx) | Section rendering uses `params.layout` / `params.containerLayout` for container width/padding and existing `params.wrapStyle` for card/block/none. |
| [src/05_Logic/logic/content/landing/container-creations.landing.json](src/05_Logic/logic/content/landing/container-creations.landing.json) | Hero section (step-0-hero) given `containerLayout: "full"` and `wrapStyle: "none"` for full-bleed. |

---

## Removed Page-Specific Layout Logic

### src/app/landing/page.tsx

- **Removed:** `const landingStep = (stateSnapshot?.values?.landingStep ...) ?? 0`
- **Removed:** `const isHeroStep = landingStep === 0`
- **Removed:** Conditional main styles:
  - `...(isHeroStep ? { padding: 0, maxWidth: "100%", margin: 0 } : { padding: "1.5rem 1rem", maxWidth: 720, margin: "0 auto" })`
- **Result:** `<main>` only has `flex: 1` and `minHeight: "calc(100vh - 52px)"`. No width, padding, or margin. Layout is fully driven by JsonSkinEngine from section params.

---

## New JSON Layout Schema (Section Params)

Layout and wrapper behavior are controlled by section `params` only.

### Container layout: `params.layout` or `params.containerLayout`

Used for the **outer section container** (width, maxWidth, padding, margin). Only these values are honored; any other value (e.g. `"hero-split"`) is ignored and the default is used.

| Value | Effect |
|-------|--------|
| `"full"` | `width: 100%`, `maxWidth: none`, `padding: 0` |
| `"contained"` | `maxWidth: 720px`, `margin: 0 auto`, `padding: 1.5rem 1rem` (default) |
| `"edge"` | `width: 100%`, `margin: 0`, `padding: 0` |

- **Default:** `"contained"` when param is missing or not one of the above.
- **Param name:** Prefer `containerLayout` for the outer container so `layout` can stay for section-internal semantics (e.g. `"hero-split"`). JsonSkinEngine accepts either `params.layout` or `params.containerLayout` for these three values.

### Wrapper style: `params.wrapStyle`

Controls the **inner** wrapper (card vs block vs no wrapper).

| Value | Effect |
|-------|--------|
| `"card"` | Padding, background, border, borderRadius, marginBottom (default) |
| `"block"` | marginBottom only |
| `"none"` | No wrapper div; children in a fragment |

---

## JsonSkinEngine Behavior

1. **Container (layout):** For each section, a wrapper div gets styles from `layout` / `containerLayout` (full | contained | edge), default `"contained"`.
2. **Inner (wrapStyle):** Inside that, content is wrapped per `wrapStyle` (card | block | none), default `"card"`.
3. **Order:** `[layout container] > [wrapStyle wrapper or fragment] > children`.

So: **layout** = outer width/padding; **wrapStyle** = inner card/block/none. Both are schema-driven; no page or step logic.

---

## Usage Examples

### Full-bleed hero (no card, full width)

```json
{
  "id": "step-0-hero",
  "type": "section",
  "role": "hero",
  "params": {
    "containerLayout": "full",
    "wrapStyle": "none",
    "layout": "hero-split"
  },
  "children": [ ... ]
}
```

### Contained content section with card (default)

Omit `containerLayout` and `wrapStyle`; defaults are `"contained"` and `"card"`.

```json
{
  "id": "step-1-proof",
  "type": "section",
  "params": {},
  "children": [ ... ]
}
```

### Edge-to-edge section, block spacing only

```json
{
  "type": "section",
  "params": {
    "layout": "edge",
    "wrapStyle": "block"
  },
  "children": [ ... ]
}
```

### Contained section without card

```json
{
  "type": "section",
  "params": {
    "wrapStyle": "none"
  },
  "children": [ ... ]
}
```

---

## Scope and What Was Not Changed

- **Container Creations TSX** ([ContainerCreationsLanding.tsx](src/01_App/(live)%20Business/Container_Creations/ContainerCreationsLanding.tsx)): Still uses its own step-based layout; not using JsonSkinEngine, so unchanged.
- **Onboarding page** ([src/app/onboarding/page.tsx](src/app/onboarding/page.tsx)): Step-based layout and maxWidth/padding remain; that flow does not use JsonSkinEngine for layout.
- **JSON state:** `landingStep` and `when: { state: "landingStep", equals: N }` are unchanged; they control **which** section is visible, not layout width. Only **page-level** layout (main width/padding) was removed.

---

## Validation

- **Hero full-bleed:** Hero section has `containerLayout: "full"` and `wrapStyle: "none"` in JSON; JsonSkinEngine applies full-width, no-padding container and no card.
- **Contained sections:** Other sections default to `"contained"` and `"card"`; centered maxWidth and card style unchanged.
- **All JSON screens:** Any screen rendered via JsonSkinEngine uses the same section params; no page-specific layout.
- **Dev preview:** Same tree and engine; layout is identical in `/landing` and `/dev`.
- **Phone preview:** Unchanged; no edits to phone frame or stage maxWidth in this refactor.
