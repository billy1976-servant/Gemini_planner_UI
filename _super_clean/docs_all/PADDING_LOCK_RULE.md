# Vertical Padding Lock Rule (Post–Global Padding Collapse Refactor)

## Allowed vertical padding sources (ONLY these two)

1. **Phone frame bezel** — `src/app/layout.tsx`  
   - `data-phone-frame` element: `padding: "12px"` (all sides).  
   - This is the only wrapper-level vertical padding allowed.

2. **Section layout container padding** — `src/04_Presentation/layout/data/layout-definitions.json`  
   - `componentLayouts` → each layout’s `moleculeLayout.params.padding` (e.g. `"var(--spacing-16) 0"`).  
   - Applied by `LayoutMoleculeRenderer` → `SequenceAtom` / `CollectionAtom` via `params.padding`.  
   - This is the single source of truth for section vertical rhythm. **Do not change layout-definitions.json values.**

## What must NOT add vertical space

- **WebsiteShell** — main: `padding: 0`, `margin: 0`.
- **ExperienceRenderer** — all modes: no vertical padding/margin on wrappers.
- **PreviewStage** — all frames: `padding: 0`, `margin: 0`.
- **Scroll container** (layout.tsx) — `padding: 0`, `margin: 0` (no NAV_STRIP_HEIGHT bottom padding).
- **app-content** — `padding: 0`.
- **LayoutMoleculeRenderer** — section outer: `paddingTop: 0`, `paddingBottom: 0`. Recovery/fallback gap: `0`.
- **Cards, buttons, fields** (molecules.json) — no vertical padding (card/button/field surface padding set to `0` or horizontal-only).
- **GlobalAppSkin** — content wrapper: `paddingBottom: 0`.
- **Section debug overlay** (json-renderer) — `padding: 0`, `margin: 0` on content wrapper.
- **Collapsed section** (json-renderer) — `padding: 0`, `margin: 0`.

## Height may only come from

- Content (text, media, blocks).
- Font line-height.
- **Section layout container padding** from `layout-definitions.json` (via moleculeLayout.params.padding).
- **Phone frame** 12px bezel.

No other layer may add vertical space.
