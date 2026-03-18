# Cursor TSX Generation Rules

**This file is the instruction set Cursor follows when generating new TSX screens.**  
TSX screens are never mounted directly; they always run inside the universal envelope.

---

## 1. TSX screens NEVER mount directly

- Every TSX screen is rendered **only** as the `Component` prop of `TSXScreenWithEnvelope`.
- The app entry points (`app/page.tsx`, `app/dev/page.tsx`) are the only places that mount TSX screens, and they **must** use:
  ```tsx
  <TSXScreenWithEnvelope screenPath={screenPath} Component={ResolvedTsxComponent} />
  ```
- **Do not** render a TSX screen component directly (e.g. `<SomeScreen />` as the root of a route). Always wrap with `TSXScreenWithEnvelope`.

---

## 2. TSX screens assume they are wrapped by TSXScreenWithEnvelope

- The envelope provides:
  - **Structure config** via `resolveAppStructure(screenPath)` and `StructureConfigProvider` / `useStructureConfig()`.
  - **Profile-driven layout** (full-viewport, contained, max-width, scroll-region), **nav mode**, **chrome slots**, **palette scope**, and **app class** via `getDefaultTsxEnvelopeProfile(screenPath)`.
  - **Palette CSS variables** applied at the wrapper when profile says `vars-only` or `full-scope`.
  - **Data attributes** on the wrapper: `data-structure-type`, `data-structure-template`, `data-tsx-envelope-*`, `data-tsx-chrome-*`.
- Screens receive `structureConfig`, `structureType`, `schemaVersion`, `featureFlags` as props and can read context from `useStructureConfig()`.

---

## 3. TSX screens must

- **Avoid hardcoding full-page layout**  
  Do not set `minHeight: "100vh"`, `width: "100%"`, or full-viewport styles at the root of the screen. The envelope controls the layout container; the screen fills the envelope.
- **Avoid global nav mounting**  
  Do not render app chrome (top bar, bottom bar, side panel) inside the screen. The envelope declares chrome slots via profile; future wiring will place chrome outside the screen. Use `data-tsx-chrome-*` on the envelope for identification only.
- **Use palette vars**  
  Use CSS variables from the palette (e.g. `var(--color-primary)`) rather than hardcoded colors. The envelope scopes palette to the wrapper when profile.palette is `vars-only` or `full-scope`.
- **Respect structureConfig when provided**  
  If the screen is structure-aware (list, board, timeline, etc.), read `structureConfig` from props or `useStructureConfig()` and use it for density, layout options, and feature flags. Do not ignore it.

---

## 4. Future TSX creation flow

When creating a **new** TSX screen:

1. **Create the TSX renderer**  
   - Default export React component.  
   - Accept optional props: `structureConfig`, `structureType`, `schemaVersion`, `featureFlags`.  
   - Do not implement full-page layout at root; do not mount chrome.

2. **Create structure template JSON** (if the screen is structure-driven)  
   - Co-locate or register by convention so `resolveAppStructure(screenPath)` can resolve type/template.  
   - Use types from `@/lib/tsx-structure/types` (e.g. `StructureType`, `ResolvedAppStructure`).

3. **Do NOT create layout logic at root level**  
   - No `minHeight: "100vh"`, no global flex container that assumes it’s the page root.  
   - Layout is controlled by the envelope’s `layoutMode` (full-viewport, contained, max-width, scroll-region).

4. **Do NOT mount chrome**  
   - No top bar, bottom nav, or side panel inside the screen component.  
   - Chrome is declared by the envelope profile (`chromeSlots`) and will be wired by the shell later.

5. **Mount path**  
   - The new screen is mounted only via existing entry points that use `TSXScreenWithEnvelope` (e.g. dev page picker, or app routing that passes `screenPath` and the dynamic component).  
   - Add the screen to the list/picker used by the dev page or app route if it should be reachable; do not add a new raw `<TsxComponent />` mount.

---

## Summary

| Rule | Meaning |
|------|--------|
| Never mount TSX directly | Always use `TSXScreenWithEnvelope` with `screenPath` and `Component`. |
| Assume envelope exists | Use structure config and palette vars; don’t reimplement envelope behavior. |
| No root layout | No full-viewport or page-level layout in the screen; envelope owns the container. |
| No chrome in screen | No nav/chrome inside the screen; envelope declares slots. |
| Use palette vars | Rely on CSS variables provided by the envelope. |
| Respect structureConfig | Use it when the screen is structure-aware. |

This is the **law for TSX generation**: new TSX screens are created as renderers that run inside the envelope, with structure template JSON where needed, and no layout or chrome at the screen root.
