# Full-Bleed Layout Refactor — Execution Report

## Summary

The layout refactor is implemented. JsonSkinEngine section wrappers are schema-controlled (wrapStyle: card | block | none). The landing page restores hero full-bleed by conditioning main layout on `landingStep`. Dev mode does not add horizontal padding to the content area. Visual parity is preserved: hero is edge-to-edge when step 0; other steps use contained main layout.

---

## Files Modified

| File | Change |
|------|--------|
| [src/app/landing/page.tsx](src/app/landing/page.tsx) | Restored hero full-bleed: added `landingStep`, `isHeroStep`, and conditional main styles (hero: padding 0, maxWidth 100%, margin 0; else: padding 1.5rem 1rem, maxWidth 720, margin 0 auto). |
| [src/05_Logic/logic/engines/json-skin.engine.tsx](src/05_Logic/logic/engines/json-skin.engine.tsx) | No change — section wrapper already schema-controlled (wrapStyle card/block/none with palette tokens). |
| [src/app/layout.tsx](src/app/layout.tsx) | No change — dev content area already has no horizontal padding (paddingLeft/paddingRight 48/44 previously removed). |

---

## STEP 1 — JsonSkinEngine Section Wrapper (Schema-Controlled)

**File:** [src/05_Logic/logic/engines/json-skin.engine.tsx](src/05_Logic/logic/engines/json-skin.engine.tsx)

**Current behavior (already in place):**

- **wrapStyle** is read from `node?.params?.wrapStyle` with default **`"card"`** so existing screens without wrapStyle keep the previous card look (visual parity).
- **`"card"`:** `marginBottom: "var(--spacing-6, 24px)"`, `padding: "var(--spacing-4, 16px)"`, `background` and `border` from palette (`palette?.tokens?.cardBackground`, `palette?.tokens?.border`) with fallbacks to `var(--color-bg-secondary)` and `var(--color-border)`, plus `borderRadius`, `fontFamily`.
- **`"block"`:** `marginBottom: "var(--spacing-6, 24px)"` and `fontFamily` only.
- **`"none"`:** No wrapper div; children rendered in a fragment.

Wrapper is applied only when wrapStyle is not `"none"`. No code change was required; behavior already matches the refactor intent.

---

## STEP 2 — Hero Full-Bleed on Landing Page

**File:** [src/app/landing/page.tsx](src/app/landing/page.tsx)

**Changes:**

1. **Hero step detection:**  
   `landingStep` is taken from `stateSnapshot?.values?.landingStep` (default `0`).  
   `isHeroStep = landingStep === 0`.

2. **Main wrapper styles:**
   - **Hero step:** `padding: 0`, `maxWidth: "100%"`, `margin: 0` (edge-to-edge).
   - **Other steps:** `padding: "1.5rem 1rem"`, `maxWidth: 720`, `margin: "0 auto"`.

Result: when `landingStep === 0` the hero is full-width; when the user moves to later steps the main content uses the contained layout, matching the original TSX behavior.

---

## STEP 3 — Dev Mode Layout Width

**File:** [src/app/layout.tsx](src/app/layout.tsx)

**Status:** The conditional that added `paddingLeft: 48` and `paddingRight: 44` to `app-content` in dev mode has already been removed in a prior refactor. The content area has no horizontal padding from the app shell, so dev and preview use the same content width. No further change was made.

---

## STEP 4 — Validation

| Check | Status |
|-------|--------|
| Hero section is full-width when `landingStep === 0` | Yes — main has `padding: 0`, `maxWidth: "100%"`, `margin: 0`. |
| Content sections keep spacing rhythm | Yes — non-hero steps use main padding/maxWidth/margin; sections keep marginBottom and, with default wrapStyle, card styling. |
| Card sections when wrapStyle = "card" | Yes — explicit or default "card" uses full card styles and palette tokens with fallbacks. |
| JSON screens same in /landing and /dev | Yes — same tree and engine; dev content area has no extra padding. |
| Palette tokens resolve correctly | Yes — no token or palette file changes; engine uses existing vars and optional palette tokens for card background/border. |
| No JSON schema changes | Yes — no new required fields; wrapStyle remains optional with default "card". |

---

## STEP 5 — Visual Parity Verification

- **Hero (step 0):** Full-bleed via main wrapper; matches original TSX hero behavior.
- **Other steps:** Contained main layout and section spacing unchanged; default wrapStyle "card" preserves previous section card look.
- **Dev vs landing:** Same content width; no extra horizontal padding in dev.
- **Palette:** No token or palette file changes; engine continues to use existing vars and optional palette tokens for card background/border.

---

## Report Summary

- **Files modified:** [src/app/landing/page.tsx](src/app/landing/page.tsx) (hero full-bleed logic and main styles).
- **JsonSkinEngine:** Section wrapper already schema-controlled (wrapStyle card/block/none, palette tokens); no code change.
- **Landing page:** Main wrapper logic updated with `isHeroStep` and conditional padding/maxWidth/margin.
- **Dev layout:** Confirmed no content padding in app-content; layout width matches production.
- **Visual parity:** Hero full-bleed and contained steps with card sections preserved; no JSON or palette schema changes.
