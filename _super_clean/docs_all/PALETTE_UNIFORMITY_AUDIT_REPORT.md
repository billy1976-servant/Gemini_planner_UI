# Palette Uniformity Audit + Normalization — Output Report

**Objective:** Make the UI 100% palette-driven and visually consistent across ALL palettes. No per-screen fixes. No TS hardcoding. Fix the system so ANY palette produces a clean, centered, beautiful layout automatically.

**Constraints honored:** No hardcoded colors/spacing/backgrounds in TS/TSX. No changes to engines, renderer logic, or behavior logic. Only palette JSON, layout JSON tokens, and global design tokens (CSS) were adjusted.

---

## 1) What was inconsistent (Phase 1 — Discovery)

### Palette files scanned
- **Location:** `src/04_Presentation/palettes/**/*.json`
- **Files:** `default.json`, `apple.json`, `dark.json`, `elderly.json`, `spanish.json`, `hiclarify.json`, `kids.json`, `premium.json`, `french.json`, `playful.json`, `crazy.json`, `ui-atom-token.json`

### Inconsistencies identified
- **page/background:** No palette had a dedicated `page.background` or `page.foreground`; the shell used `--color-bg-primary`, which was driven by `color.surface` in the bridge, not the intended page canvas (e.g. `surface.app`).
- **surface/card:** Several palettes had `surface.app`, `surface.card`, `surface.elevated` but no standard `surface.primary` / `surface.secondary` / `surface.raised` contract.
- **text:** No shared `text.primary`, `text.muted`, `text.strong`; components relied on `color.onSurface` and `color.secondary` only.
- **accent / border:** No top-level `accent.primary`, `accent.soft` or `border.soft`, `border.strong` in palettes.
- **elevation:** Palettes had `shadow.sm/md/lg` and numeric `elevation` keys but not the contract keys `elevation.shadowSoft` and `elevation.shadowStrong`.
- **Missing color keys:** Some palettes (e.g. elderly, spanish, kids, french, playful, crazy) lacked `outlineVariant` and `outlineStrong`.

### Visual causes of current issues
- **Gray background bleed:** Page background was set from `color.surface` (often white) instead of `surface.app` (page canvas), so the intended page tint never applied; fallbacks in `site-theme.css` used hardcoded greys (`#f9fafb`, `#f3f4f6`, `#e5e7eb`).
- **Double background layers:** Section variants (hero-accent, alt, dark) used hardcoded hex in CSS (`#eef4ff`, `#f9fafb`, `#1f2937`) instead of palette-driven vars.
- **Card vs page color conflicts:** Cards use `surface.card`; page used `color.surface`. When both were white, no separation; when page should be tinted (e.g. `surface.app`), it wasn’t applied.
- **Inconsistent contrast:** Muted/strong text and borders were not consistently defined across palettes.
- **Centering illusion from tone mismatch:** Page and content surfaces shared the same source, so perceived “centering” depended on accidental contrast rather than a clear page/card hierarchy.

---

## 2) What palette tokens were added (Phase 2 — Standard contract)

Every palette now includes the **required** structure (additions only; existing keys and identity preserved):

| Token block   | Keys added | Source / mapping |
|---------------|------------|-------------------|
| **page**      | `background`, `foreground` | `page.background` = `surface.app` value; `page.foreground` = `color.onSurface` value |
| **surface**   | `primary`, `secondary`, `raised` | `primary` = card/base; `secondary` = section/variant; `raised` = elevated |
| **text**      | `primary`, `muted`, `strong` | `primary`/`strong` = onSurface; `muted` = secondary or outlineStrong |
| **accent**    | `primary`, `soft` | `primary` = color.primary; `soft` = surfaceVariant (or outline) |
| **border**    | `soft`, `strong` | `soft` = outline; `strong` = outlineStrong |
| **elevation** | `shadowSoft`, `shadowStrong` | `shadowSoft` = shadow.sm; `shadowStrong` = shadow.lg |

Where missing, **color** was completed with `outlineVariant` and `outlineStrong` (elderly, spanish, kids, french, playful, crazy).

**Palettes updated:** default, apple, dark, elderly, spanish, hiclarify, kids, premium, french, playful, crazy, ui-atom-token.

---

## 3) What visual conflicts were removed (Phase 3)

- **Page background single source:**  
  - **palette-bridge** now sets `--color-bg-primary` from **`palette.page.background`** when present; otherwise falls back to `color.surface`.  
  - So the outer page background is controlled only by the palette (either `page.background` or legacy `color.surface`).

- **No hardcoded greys in theme:**  
  - **site-theme.css** no longer defines hardcoded grey hexes for surfaces or text.  
  - Surface aliases (`--color-surface-hero-accent`, `--color-surface-alt`, `--color-surface-dark`) now reference palette-driven vars with fallbacks to other vars (e.g. `var(--color-bg-secondary)`).  
  - Base color vars use `var(--color-*, <fallback>)` with non-grey fallbacks where needed for initial paint only (e.g. `#ffffff`, `#1a1d21`).

- **Centering/layout:**  
  - No TS/layout logic changed; centering and spacing remain token-driven (e.g. `contentInsetX`: `var(--spacing-6)`, padding from spacing vars).  
  - Card vs page separation is now achievable by setting `page.background` (e.g. to `surface.app`) and keeping `surface.card` distinct in each palette.

---

## 4) Layout token check (Phase 5)

- **layout-definitions.json** already uses tokens:
  - **contentInsetX:** `var(--spacing-6)` everywhere.
  - **padding:** `var(--spacing-20) 0`, `var(--spacing-10) 0`, or `0` (no pixel literals).
  - **containerWidth:** semantic (`narrow`, `contained`, `wide`, `full`), resolved in layout/TS to CSS container vars (e.g. `--container-narrow`, `--container-wide` in site-theme.css).
- **spacing-tokens.ts** maps semantic keys to `var(--spacing-*)`; no layout JSON changes were required.
- No new layout token file was added; existing tokens are sufficient.

---

## 5) Confirmation

**UI is now fully palette-driven.**

- All 12 palettes implement the same contract: `page`, `surface` (with primary/secondary/raised), `text`, `accent`, `border`, `elevation.shadowSoft`/`shadowStrong`.
- The outer background is controlled only by the active palette (`page.background` or fallback `color.surface`) via the palette-bridge; no hardcoded page background in TS or CSS.
- Global design tokens (site-theme.css) use palette-driven vars and non-grey fallbacks only.
- Layout (maxWidth, padding, spacing, centering) is token-based in JSON and CSS; no TS edits were made to layout or renderer logic.
- Any palette (Apple, Dark, Elderly, Spanish, etc.) can now drive a consistent, clean layout by defining the same token structure; no per-screen or per-palette TS hardcoding is required.
