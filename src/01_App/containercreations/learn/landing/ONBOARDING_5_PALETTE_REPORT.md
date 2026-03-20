# Onboarding-5 (container-creations-landing-5) — Why Palettes and Styles Weren’t Working + Fixes

## What you’re seeing

- **Palette selection has no effect** — Choosing "Container-Creations" (or any palette) in the sidebar doesn’t change the main content; buttons and checklist stay grey.
- **“Palette Contract: FAIL”** in the Palette sidebar.
- **Grey blocks instead of styled buttons** — Step tracker and CTAs look like generic grey rectangles instead of the intended themed look.

This is **not** a limitation of using the JSON flow to drive the TSX. The flow (FlowRuntimeScreen → FlowScreenWrapper → FlowEngine) and the JSON (ContainerCreationsLanding-5.json) are fine. The problems are **palette application timing** and **missing theme class** on the flow root.

---

## 1. Palette not applied to the envelope (ref timing)

**What was wrong**

- In `TSXScreenWithEnvelope`, palette was applied in a `useEffect` that ran once after mount.
- Refs are set **after** commit, so on first run `wrapperRef.current` was often still `null`, so `applyPaletteToElement` was skipped.
- Subscriptions only re-ran when palette/state changed, not when the ref became available, so the envelope div could **never** get palette CSS variables on first paint.

**Fix (already in place)**

- **File:** `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`
- **Callback ref on the wrapper div:** When the div mounts, the ref callback runs with the real DOM node. There we:
  - set `wrapperRef.current = el`
  - call `applyPaletteToElement(el, paletteName)` when `applyPalette` is true
  - log `"PALETTE FORCED APPLY"` for debugging
- **Effect:** Simplified to also call `applyPaletteToElement(wrapperRef.current, paletteName)` when `applyPalette` or `paletteName` (or ref) change, so palette updates when the user picks a different palette.

So: palette is applied as soon as the envelope div exists, and again when the selected palette changes. No ref-timing bypass.

---

## 2. FlowEngine root missing theme class (grey buttons)

**What was wrong**

- `landing-theme.css` styles **all** hero CTAs and step tracker under the class **`.landing-container-creations`** (e.g. `.landing-container-creations .hero-cta`, `.landing-container-creations .stepTracker`).
- FlowEngine’s root div only had `flow-engine`, `landing-step-hero`, etc. It did **not** have `landing-container-creations`.
- So those theme rules never matched → no accent colors, no proper button/step styling → grey blocks.

**Fix applied**

- **File:** `src/03_Runtime/engine/onboarding/flow-engine/FlowEngine.tsx`
- **Change:** Add `landing-container-creations` to the root `className` so the flow engine is inside the same scope as the existing theme:
  - `rootClassName = "landing-container-creations flow-engine" + ...`

Now the same CSS that styles the original Container Creations landing applies to the JSON-driven flow.

---

## 3. “Palette Contract: FAIL”

**What it is**

- The Palette sidebar uses `PaletteContractInspector`, which calls `validatePaletteContract(palette)`.
- The contract (e.g. in `src/07_Dev_Tools/diagnostics/pipeline/palette/contract.ts`) requires the palette object to have certain keys: `color`, `surface`, `radius`, `padding`, `textSize`, `textWeight`, `textRole`. If any are missing, it reports FAIL.

**Why it can show FAIL**

- The **selected** palette (e.g. "Container-Creations") may not match the contract shape (e.g. missing `surface` or `textRole`), so the inspector shows FAIL regardless of whether palette is applied to the canvas.
- So “Palette Contract: FAIL” is about **palette object shape**, not about whether the envelope or flow engine are applying it.

**What to do**

- Ensure the palette JSON used for "Container-Creations" (and any other palettes) includes the contract-required keys so the inspector can show PASS. That’s separate from the two fixes above.

---

## Summary

| Issue | Cause | Fix |
|-------|--------|-----|
| Palette selection has no effect | Envelope’s palette effect ran with `wrapperRef.current === null` and never ran again when ref was set | Callback ref + simplified effect in `TSXScreenWithEnvelope.tsx` (already present) |
| Grey blocks / unstyled buttons | FlowEngine root had no `landing-container-creations` class, so theme CSS didn’t match | Add `landing-container-creations` to FlowEngine root in `FlowEngine.tsx` (done) |
| Palette Contract: FAIL | Palette object missing one or more required keys for the contract | Add missing keys to palette JSON so contract validates |

The JSON-driven flow is **repairable** and not limited by “using JSON to drive TSX.” The fixes above address the ref-timing and theme-class issues; after a refresh you should see palette and themed buttons/step tracker. If “Palette Contract: FAIL” remains, update the palette definition to satisfy the contract.
