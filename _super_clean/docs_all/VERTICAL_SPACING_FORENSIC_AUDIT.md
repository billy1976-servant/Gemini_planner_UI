# Vertical Spacing Forensic Audit — Phone Stage (NO CHANGES)

**Goal:** Map every source of vertical padding, margin, gap, and line-height inside the phone stage. No fixes, no refactors — inspection and report only.

**Token reference (site-theme.css):**  
`--spacing-1` = 4px, `--spacing-2` = 8px, `--spacing-3` = 12px, `--spacing-4` = 16px, `--spacing-6` = 24px, `--spacing-8` = 32px, `--spacing-10` = 40px, `--spacing-12` = 48px, `--spacing-16` = 64px, `--spacing-20` = 80px.

---

## 1) Stage / phone frame wrapper

**Source:** `src/app/layout.tsx` (when `phoneFrameEnabled` is true)

| Source | Value | Notes |
|--------|--------|--------|
| **data-phone-frame** | `padding: "12px"` (all sides) | +12px top, +12px bottom from the black device bezel wrapper. |
| **data-phone-frame-inner** | No padding/margin in style | Flex column, no vertical spacing. |
| **Scrollable content div** (sibling above nav) | `paddingBottom: NAV_STRIP_HEIGHT` | **+64px** bottom (reserve for bottom nav). |
| **Safe-area** | None | No `env(safe-area-inset-*)` or safe-area handling in layout or global CSS. |

**Summary:** Stage wrapper adds **+12px top**, **+12px bottom**, and **+64px bottom** (padding-bottom on scroll container).

---

## 2) Screen root container

**Source:** `layout.tsx` → `page.tsx` → `PreviewStage` (website) → `WebsiteShell` → content.

| Source | Value | Notes |
|--------|--------|--------|
| **app-content** (layout.tsx) | `style={{ padding: 0, overflow: "visible" }}` | No vertical padding. |
| **PreviewStage** (website branch) | `padding: 0`, `margin: 0` on outer/frame | No extra vertical space. |
| **WebsiteShell** `main.site-container-inner` | `paddingTop: "var(--spacing-6)"`, `paddingBottom: "var(--spacing-16)"` | **+24px top**, **+64px bottom** on the main content wrapper (only when experience === "website" and content is routed through WebsiteShell). |
| **ExperienceRenderer** (website) | `websiteWrapperStyle`: flex column, no padding | No vertical padding. |
| **ExperienceRenderer** (app) | `appWrapperStyle`: `paddingTop: "var(--spacing-4)"`, `paddingBottom: "var(--spacing-4)"` | **+16px top**, **+16px bottom**. |
| **ExperienceRenderer** (learning) | `learningWrapperStyle`: `paddingTop: "var(--spacing-8)"`, `paddingBottom: "var(--spacing-8)"` | **+32px top**, **+32px bottom**. |
| **ExperienceRenderer** inner scroll | `flex: 1, minHeight: 0, overflow: "auto"` | No padding. |
| **Section wrapper** (page.tsx wrappedContent) | `display: "flex", flexDirection: "column"` | No gap; sections stack with no extra space between them from this wrapper. |

**Summary:** Screen root adds **+24px top / +64px bottom** (WebsiteShell main) in website flow; app adds **+16px top/bottom**; learning adds **+32px top/bottom**. No flex column gap at screen root.

---

## 3) Section / layout system

**Source:** `layout-definitions.json` (componentLayouts) → Section → `LayoutMoleculeRenderer` → `SequenceAtom` / `CollectionAtom`.

| Source | Value | Notes |
|--------|--------|--------|
| **Section outer container** (LayoutMoleculeRenderer) | `paddingTop: 0`, `paddingBottom: 0` (explicit in combinedOuterStyle) | No vertical padding on section wrapper. |
| **Section inner layout** (moleculeLayout.params) | **gap** and **padding** from layout-definitions | **Gap** = vertical space between slot content and children inside section (e.g. `var(--spacing-6)` = 24px, `var(--spacing-12)` = 48px). **Padding** = applied to the flex/grid container via SequenceAtom/CollectionAtom (e.g. `"var(--spacing-16) 0"` = 64px top+bottom). |
| **layout-definitions.json** (componentLayouts) — vertical padding examples | hero-centered: `padding: "var(--spacing-16) 0"` (64px); hero-split*: `padding: "var(--spacing-20) 0"` (80px); content-narrow/stack: `padding: "var(--spacing-10) 0"` (40px); features-grid-3: `padding: "var(--spacing-12) 0"` (48px); cta-centered: `padding: "var(--spacing-12) 0"` (48px); testimonial-band: `padding: "var(--spacing-10) 0"` (40px) | Each section layout contributes **top + bottom** padding from these values (per section). |
| **layout-definitions.json** — gap (between section inner items) | e.g. `var(--spacing-6)`, `var(--spacing-8)`, `var(--spacing-10)`, `var(--spacing-12)` | Vertical gap between slot content and children inside the section column/row. |
| **Spacing scale** (spacing-scales.json) | section.layout.gap: default `var(--spacing-md)` (20px), luxury `var(--spacing-xl)` (48px), saas/magazine/course per scale | Template spacingScale can overlay section gap; in current code path section gap is from layout-definitions (spacing scale section gap is stripped in json-renderer PHASE I). |
| **LAYOUT_RECOVERY_MODE** fallback (LayoutMoleculeRenderer) | `gap: "var(--spacing-2)"` when layout missing | +8px gap if layout resolution fails. |

**Summary:** Section vertical space comes from **moleculeLayout.params.padding** (large: up to 80px top+bottom per section) and **moleculeLayout.params.gap** (24px–48px typical) inside the section. No gap between sections themselves except where two sections’ paddings meet (effectively double padding at section boundaries).

---

## 4) Cards / containers

**Source:** `molecules.json` (card variants/sizes), card compound → SurfaceAtom.

| Source | Value | Notes |
|--------|--------|--------|
| **Card surface** (molecules.json) | Default/elevated/outlined/soft/floating: `padding: "var(--spacing-6) 0"` | **+24px** vertical padding per card. |
| **Card sizes** | sm: `var(--spacing-4) 0` (16px), md: `var(--spacing-6) 0` (24px), lg: `var(--spacing-lg) 0` (32px) | Override vertical padding by size. |
| **Collapsed section** (app experience, json-renderer) | `padding: "var(--spacing-3)"` (12px all sides) | +12px top/bottom when section is collapsed. |
| **Footer** (molecules.json) | `padding: "4rem 0 2rem 0"` | +64px top, +32px bottom. |
| **__uiScaffold** | `padding: "var(--spacing-6) 0"` (24px) | Same as card default. |

**Summary:** Cards add **+24px vertical** (default) or 16px/32px by size; no margin-bottom token applied automatically in molecules.json.

---

## 5) Text system

**Source:** `site-theme.css`, molecules.json (title/body lineHeight tokens).

| Source | Value | Notes |
|--------|--------|--------|
| **:root** | `--line-height-tight: 1.25`, `--line-height-normal: 1.5`, `--line-height-relaxed: 1.75` | Global line-height tokens. |
| **.site-container** | `line-height: var(--line-height-normal)` | 1.5 → for 16px font ~8px extra vertical per line vs cap height. |
| **.experience-learning h1** | `line-height: var(--line-height-tight)` | 1.25. |
| **Card title/body** (molecules.json) | `lineHeight: "textRole.title.lineHeight"` / `"textRole.body.lineHeight"` | Resolved via palette; typically 1.25–1.5 range. |
| **List item** | `lineHeight: "textRole.body.lineHeight"` | Same. |

**Summary:** Line-height adds roughly **~4–8px extra visual height per line** (e.g. 1.5 on 16px ≈ 8px line box). No heading margin defaults in theme that add vertical space in the phone stage (diagnostics-compact has `margin: 2px 0` for h1/h2/h3; main content headings use component/layout spacing).

---

## 6) Buttons / inputs

**Source:** `molecules.json` (button, field), atoms (SurfaceAtom, FieldAtom).

| Source | Value | Notes |
|--------|--------|--------|
| **Button surface** (molecules.json) | filled/tonal/outlined: `padding: "var(--spacing-md) var(--spacing-lg)"` (20px vertical, 32px horizontal) | **+20px** vertical per button. |
| **Button sizes** | sm: `padding: "var(--spacing-sm) 0"` (12px), md: `padding: "var(--spacing-md) 0"` (20px), lg: `padding: "var(--spacing-lg) 0"` (32px) | Vertical padding by size. |
| **Button text/icon** | text: `padding: "var(--spacing-xs) 0"` (6px), icon: `padding: "var(--spacing-xs) 0"` (6px) | Smaller vertical. |
| **Field** (outlined/filled) | `padding: "var(--spacing-md) 0"` (20px) | **+20px** vertical for input area. |
| **Field sizes** | sm: `padding: "var(--spacing-sm) 0"` (12px), md: `padding: "var(--spacing-md) 0"` (20px) | Vertical padding by size. |
| **Min-height** | No explicit min-height in molecules.json for button/field | No fixed min-height (e.g. 48px) in definitions; height comes from padding + content. |

**Summary:** Buttons add **~12–32px** vertical padding by variant/size; fields **~12–20px**. No global button min-height (e.g. 48px) in this audit.

---

## 7) Global CSS

**Source:** `src/07_Dev_Tools/styles/site-theme.css`.

| Source | Value | Notes |
|--------|--------|--------|
| **body** | Not explicitly styled for padding/margin in audit; `.app-body` used on body | `.app-body`: `margin: 0`; no body padding. |
| **.app-body** | `margin: 0` | No vertical margin. |
| **.app-content** | `margin-top: 0`, `padding: 0 !important` | No vertical padding/margin. |
| **.site-container** | `padding: 0 !important`, `margin: 0 !important` | Overridden to zero. |
| **.site-container-inner** | Padding/margin overridden to 0 in theme | WebsiteShell overrides with inline styles (paddingTop/Bottom). |
| **.experience-website** | `--experience-gap: var(--spacing-8)` | Token defined (32px); not found as consumer of vertical gap in layout in this audit. |
| **.experience-app.experience-dashboard** | `--experience-gap: var(--spacing-4)` | 16px; same — variable set, consumer not identified in audit. |
| **.experience-learning main** | `max-width: var(--experience-content-max-width, 820px)` | No vertical padding from this rule. |

**Summary:** Global CSS keeps body/app-content/site-container at 0 vertical margin/padding; experience wrappers set `--experience-gap` but do not add vertical spacing in the mapped layout path. WebsiteShell adds the only main-level vertical padding (inline) when used.

---

## Clean list (summary)

- **Stage wrapper (data-phone-frame):** +12px top padding, +12px bottom padding (all sides 12px).
- **Scroll container (phone):** +64px bottom padding (NAV_STRIP_HEIGHT).
- **Screen root (WebsiteShell main, website):** +24px top padding, +64px bottom padding.
- **Screen root (ExperienceRenderer app):** +16px top padding, +16px bottom padding.
- **Screen root (ExperienceRenderer learning):** +32px top padding, +32px bottom padding.
- **Section (per layout from layout-definitions):** Vertical padding from `moleculeLayout.params.padding` (e.g. +64px or +80px top+bottom per section), plus inner **gap** (e.g. +24–48px between items).
- **Section outer (LayoutMoleculeRenderer):** 0 vertical padding (explicit paddingTop/paddingBottom: 0).
- **Card padding:** +24px vertical default (`var(--spacing-6) 0`); sm +16px, lg +32px.
- **Button vertical padding:** +12–32px by size/variant (e.g. md +20px).
- **Field vertical padding:** +12–20px by size.
- **Text line-height:** 1.25–1.75 → adds ~4–8px visual height per line (no extra block margin from theme).
- **Global CSS (body / app / main):** 0 vertical padding/margin; experience-gap tokens set but not applied as vertical spacing in mapped layout.

---

## Main offender (biggest contributor to vertical height)

**Section layout padding from `layout-definitions.json` (moleculeLayout.params.padding)** is the largest single source of vertical space inside the phone stage.

- Each section uses a component layout (e.g. hero-split, content-narrow, features-grid-3) whose **padding** is applied to the section’s inner flex/grid via `SequenceAtom`/`CollectionAtom`.
- Values like `"var(--spacing-20) 0"` (80px top + 80px bottom) or `"var(--spacing-16) 0"` (64px top + 64px bottom) add **128–160px per section**.
- With multiple sections, this adds hundreds of pixels of vertical space before any content or cards.
- Next largest: **WebsiteShell** main (`+24px top`, `+64px bottom`) and the **scroll container** `paddingBottom: 64px`, then **card** and **button/field** padding and **line-height** as smaller, repeated contributions.

No layout or spacing was modified; only sources were mapped.
