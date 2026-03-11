# Verify and Enforce Global Schema-Driven Layout — Report

## STEP 1 — Renderer root is neutral ✓

**File:** `src/03_Runtime/engine/core/json-renderer.tsx`

Root container (lines 1721–1728) has:
- `width: "100%"`
- `maxWidth: "none"`
- `padding: 0`
- `margin: 0`

**Status:** Verified; no changes.

---

## STEP 2 — ExperienceRenderer is neutral ✓

**File:** `src/03_Runtime/engine/core/ExperienceRenderer.tsx`

- **Outer container** (line 71): `width: "100%"`, `maxWidth: "none"`. No padding (none needed for outer).
- **Scroll container** (line 72): `width: "100%"`, `maxWidth: "none"`, `padding: 0`.

**Status:** Verified; no changes.

---

## STEP 3 — Page wrappers are neutral ✓

**File:** `src/app/landing/page.tsx`  
`<main>` (lines 135–144) has only: `width: "100%"`, `maxWidth: "none"`, `padding: 0`, `margin: 0` (plus `flex: 1`, `minHeight` for stretch). No `maxWidth: 720`, no `padding: "1.5rem 1rem"`, no `margin: "0 auto"`.

**File:** `src/app/dev/page.tsx`  
- Main content uses `ExperienceRenderer` (jsonContent). The wrapper div for `wrappedContent` (website) has `width: "100%"`, no maxWidth, no padding on the content axis.
- Pure-JSON path uses a div with `width: "100%"`, `maxWidth: "none"`, `padding: 0`.

**Status:** Verified; no changes.

---

## STEP 4 — Layout is renderer-controlled ✓

**File:** `src/05_Logic/logic/engines/json-skin.engine.tsx`

- Layout is driven only by **schema params**:
  - `params.containerLayout`: `"full"` | `"contained"` | `"edge"`.
  - `params.wrapStyle`: `"card"` | `"block"` | `"none"`.
- Defaults when params are omitted: `containerLayout` → `"contained"`, `wrapStyle` → `"card"` (no page/screen logic).

**Status:** Verified; no changes to supported values.

---

## STEP 5 — Hidden layout rules removed ✓

**File:** `src/05_Logic/logic/engines/json-skin.engine.tsx`

- **Removed:** Layout derived from `role === "hero"` (`isHero`). The renderer no longer sets layout or wrapStyle based on role.
- Layout is determined only by `params.containerLayout` and `params.wrapStyle`.

**File:** `src/05_Logic/logic/content/landing/container-creations.landing.json`

- **Added:** Hero section now has explicit schema params so it stays full-bleed without role-based logic:
  - `"containerLayout": "full"`
  - `"wrapStyle": "none"`

**Note:** `landingStep` in the engine remains only as **state update** (button behavior), not layout. No layout branches on `screen === landing` or `landingStep` in the renderer.

**Status:** Implemented.

---

## STEP 6 — Dev mode uses same pipeline ✓

- **Landing:** Renders `ExperienceRenderer` with the same tree (from `container-creations.landing.json`).
- **Dev:** Renders `ExperienceRenderer` (jsonContent) with the same tree for the selected screen.
- Both use: **ExperienceRenderer → JsonRenderer → JsonSkinEngine** (for json-skin roots). No alternate layout or converters; layout comes from schema in both routes.

**Status:** Verified.

---

## STEP 7 — Dev / preview parity ✓

- `/landing` and `/dev` (with the same screen, e.g. container-creations-landing) both use `ExperienceRenderer` with the same node and experience.
- DOM tree for the screen is the same; only the surrounding chrome (header on landing, dev panels on dev) differs.
- Palette switching flows through the same state and props; both routes receive the same palette.
- No wrapper adds `maxWidth: 720` or `padding: "1.5rem 1rem"` to the renderer output; layout is schema-driven in both.

**Status:** Verified.

---

## Summary

| Item | Result |
|------|--------|
| **Files verified** | `json-renderer.tsx`, `ExperienceRenderer.tsx`, `landing/page.tsx`, `dev/page.tsx`, `json-skin.engine.tsx` |
| **Files modified** | `json-skin.engine.tsx` (removed role-based layout), `container-creations.landing.json` (explicit hero params) |
| **Layout constraints removed** | Layout no longer inferred from `role === "hero"`; hero layout comes only from `params.containerLayout` and `params.wrapStyle`. |
| **Confirmation** | Layout is globally schema-driven: only `params.containerLayout` and `params.wrapStyle` control section layout; renderer roots and page wrappers are neutral. |
