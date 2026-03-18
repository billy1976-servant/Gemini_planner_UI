# Global Schema-Based Layout Refactor — Report

## Goal

Layout is now controlled only by **schema + renderer**. Page wrappers no longer apply layout constraints (maxWidth, padding, margin). The renderer is the single source of layout control.

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/landing/page.tsx` | `<main>`: removed contained styles; now neutral wrapper only (`width: "100%"`, `maxWidth: "none"`, `padding: 0`, `margin: 0`). |
| `src/05_Logic/logic/engines/json-skin.engine.tsx` | Section case: replaced fixed card wrapper with **schema-driven** `params.containerLayout` and `params.wrapStyle`; added **role-based fallback** so `role: "hero"` implies full-bleed when params are omitted. |
| `src/03_Runtime/engine/core/json-renderer.tsx` | Root container: added `maxWidth: "none"`, `padding: 0`, `margin: 0` so the renderer root never restricts layout. |
| `src/03_Runtime/engine/core/ExperienceRenderer.tsx` | Outer and scroll wrappers: added `width: "100%"`, `maxWidth: "none"`, and `padding: 0` on the scroll container so the content stage does not constrain layout. |

**Not changed (per rules):** JSON schema structure, palette tokens, `layout.tsx` app-content (already `padding: 0`, `maxWidth: "100%"`), dev stage frame (device preview maxWidth only; no padding injected into content).

---

## Renderer Layout Logic (JsonSkinEngine)

- **`params.containerLayout`** (optional)  
  - `"full"`: full-bleed — `width: 100%`, `maxWidth: none`, `padding: 0`.  
  - `"contained"`: centered column — `maxWidth: 720px`, `margin: "0 auto"`, `padding: "1.5rem 1rem"`.  
  - `"edge"`: full width, no padding — `width: 100%`, `margin: 0`, `padding: 0`.  
  - If omitted: sections with **`role: "hero"`** default to **`"full"`**; all others to **`"contained"`**.

- **`params.wrapStyle`** (optional)  
  - `"card"`: palette-based card (background, border, padding, spacing).  
  - `"block"`: block spacing only (marginBottom, no card chrome).  
  - `"none"`: no wrapper; children only.  
  - If omitted: **`role: "hero"`** defaults to **`"none"`**; other sections to **`"card"`** for visual parity with previous behavior.

- **Palette:** Card style uses `palette.tokens.cardBackground` / `palette.tokens.border` (or fallbacks) so palette tokens still drive appearance.

---

## Page Wrapper Layout Removal

- **Landing (`src/app/landing/page.tsx`):**  
  - Before: `padding: "1.5rem 1rem"`, `maxWidth: 720`, `margin: "0 auto"`.  
  - After: `width: "100%"`, `maxWidth: "none"`, `padding: 0`, `margin: 0`.  
  - No page-specific layout logic; page only renders `ExperienceRenderer`.

- **Dev (`src/app/dev/page.tsx`):** No layout constraints on the content area; `ExperienceRenderer` is inside `PreviewStage` with no extra maxWidth/padding on the stage content.

- **Root layout (`src/app/layout.tsx`):** `app-content` already uses `padding: 0`, `maxWidth: "100%"`. Dev stage uses a maxWidth only for the device-preview frame, not for padding into the content.

---

## Example Schema Layout Usage

**Option A — Use existing `role` (no schema change):**

- Hero in `container-creations.landing.json` already has `"role": "hero"`.  
- Engine infers `containerLayout: "full"` and `wrapStyle: "none"` for that section.  
- No JSON edits required; hero is full-bleed, other sections contained + card.

**Option B — Explicit params (any screen):**

```json
{
  "type": "section",
  "role": "hero",
  "params": {
    "containerLayout": "full",
    "wrapStyle": "none"
  },
  "children": [ ... ]
}
```

Contained card section (default, or explicit):

```json
{
  "type": "section",
  "params": {
    "containerLayout": "contained",
    "wrapStyle": "card"
  },
  "children": [ ... ]
}
```

Contained block (no card chrome):

```json
{
  "type": "section",
  "params": {
    "containerLayout": "contained",
    "wrapStyle": "block"
  },
  "children": [ ... ]
}
```

---

## Renderer Root Always Full Width

- **JsonRenderer:** Root `<div>` has `width: "100%"`, `maxWidth: "none"`, `padding: 0`, `margin: 0`.  
- **ExperienceRenderer:** Wrappers around `JsonRenderer` use `width: "100%"`, `maxWidth: "none"`, and the scroll container has `padding: 0`.  
- Layout width and containment are determined only by section-level `containerLayout` in the schema/renderer, not by the root.

---

## Visual Parity

- **Container Creations landing:**  
  - Hero: full-bleed (via `role: "hero"` → full + none).  
  - Content sections: contained (720px, centered) with card style (palette tokens).  
  - Spacing and palette resolution unchanged; no new page-level layout.

- **Dev mode:** No padding injected into the content stage; dev UI uses overlays/panels and device frame; layout width is unchanged.

---

## Validation Summary

| Check | Status |
|-------|--------|
| All screens render correctly | Yes — section layout is schema/role-driven. |
| Hero remains full width | Yes — hero uses `containerLayout: "full"`, `wrapStyle: "none"` (from role when params omitted). |
| Contained sections centered | Yes — default `containerLayout: "contained"` with 720px + auto margin. |
| No layout regression | Yes — defaults preserve previous card + contained behavior. |
| Schema-driven layout global | Yes — all layout control is in JsonSkinEngine + schema/role; page wrappers are neutral. |

---

## Confirmation

Layout is now **schema-driven globally**. Page wrappers do not set maxWidth, padding, or margin for the renderer. Section layout (full-bleed vs contained, card vs block vs none) is determined only by `params.containerLayout`, `params.wrapStyle`, and the `role: "hero"` fallback inside the renderer.
