# Container Creations Landing — Deliverables

## Container Creations design tokens

Use these so the onboarding page and any future Container Creations pages stay aligned with the landing.

| Token / element | Value / location |
|-----------------|------------------|
| **CSS file** | `src/app/landing/landing-theme.css` |
| **Page wrapper** | `.landing-container-creations` |
| **Content (narrow)** | `max-width: 720px`, `margin: 0 auto`, padding e.g. `1.5rem 1rem` or `48px 24px 56px` |
| **Content (wide, e.g. measure)** | `max-width: 900px`, padding `24px` |
| **Typography base** | `--landing-font-base: "DM Sans", system-ui, sans-serif` |
| **Typography heading** | `--landing-font-heading: "Poppins", "DM Sans", system-ui, sans-serif` |
| **Hero title** | `.hero-title` — 40px, 700 |
| **Hero subtitle** | `.hero-subtitle` — 18px, opacity 0.9 |
| **Section heading** | `.stamped-section h2` — 32px, 700; or `clamp(1.75rem, 4vw, 2.5rem)` |
| **Primary CTA** | `.hero-cta` — 14px 30px padding, 18px font, 8px radius, `#2b7cff` |
| **Steel palette** | `--landing-steel-bg: #1a1d23`, `--landing-steel-fg: #e2e8f0`, `--landing-steel-border: #2d3239`, `--landing-steel-muted: #64748b` |
| **White steps** | Classes `.landing-step-hero`, `.landing-step-stamped`, `.measure-step-active` |

**Layout classes:** `.landing-content-block`, `.stamped-section`, `.measure-roof-section`, `.vent-section`, `.hero-intro`, `.hero-container`, `.hero-video`.

---

## Final JSON structure

**File:** `src/05_Logic/logic/content/landing/container-creations.landing.json`

- **Root:** `{ id, state, root }`
- **state:** `landingStep` (0–5), `intent`, `ribHeight`, `containerLength`, `recommendation`
- **root:** `{ type: "json-skin", id, children }`
- **children:** Six gated sections; each has `when: { state: "landingStep", equals: N }` and `children` (text, button, image, video, select, etc.).

**Step 0 (Hero):** headline, subheadline, video block, primary CTA (advance to step 1).  
**Step 1 (Intent):** text + four buttons (condensation, lighting, both, upgrade) → set intent, advance to 2.  
**Step 2 (Authority):** text, side-by-side image, text, CTA → advance to 3.  
**Step 3 (Fit check):** text, two selects (rib height, container length), button `submitFitCheck: true` → resolver runs, recommendation set, advance to 4.  
**Step 4 (Upgrade):** slider image, text, CTA → advance to 5.  
**Step 5 (Industry):** text, Shop Now button (openUrl).

**Button behavior params:** `landingStep`, `intent`, `submitFitCheck`, `openUrl`.

---

## New components list

| Component | Path | Purpose |
|-----------|------|--------|
| **BeforeAfterSlider** | `src/04_Presentation/components/molecules/BeforeAfterSlider.tsx` | Before/after image slider; drag or touch to reveal; used when `type: "image"` and `params.layout: "slider"`. |
| **JsonSkinEngine extensions** | `src/05_Logic/logic/engines/json-skin.engine.tsx` | New node types: `image` (full, side-by-side, slider), `video`, `select`; button handler for landing state (landingStep, intent, submitFitCheck, openUrl). |

No new global TSX screens; all scoped to landing + JsonSkinEngine.

---

## File tree summary

```
src/
  app/
    landing/
      layout.tsx            # Imports landing-theme.css; passes children
      page.tsx              # Loads landing JSON, pipeline, ExperienceRenderer, Shop Now bar
      landing-theme.css     # Industrial steel palette (CSS vars)
      DELIVERABLES.md       # This file
  app/
    layout.tsx              # pathname === "/landing" | "/flow" | "/onboarding" → render children only (no chrome)
  app/
    onboarding/
      page.tsx              # 6-step instructional onboarding; uses landing-theme.css only
  05_Logic/
    logic/
      content/landing/
        container-creations.landing.json   # Canonical landing JSON
      landing/
        container-creations-fit.ts         # resolveContainerCreationsFit → recommendation
      engines/
        json-skin.engine.tsx               # + image, video, select, landing button behavior
  04_Presentation/
    components/molecules/
      BeforeAfterSlider.tsx                # Before/after slider component
```

Root layout change: `src/app/layout.tsx` — when `pathname === "/landing"` render only `children` (no UserLayoutChrome).

---

## Asset placeholder list

Replace empty `src` / URLs in the JSON and params with final assets.

| Asset | Where used | JSON / params |
|-------|------------|---------------|
| **Install video (60s)** | Step 0 Hero | `root.children[0].children` → `type: "video"`, `src: ""` |
| **Rib measurement guide** | Optional near Step 3 | Add `type: "image"`, `layout: "full"` if desired |
| **Adapter comparison (side-by-side)** | Step 2 Authority | `type: "image"`, `layout: "side-by-side"`, `src: ["", ""]` — two URLs |
| **Before/after interior** | Step 4 Upgrade | `type: "image"`, `layout: "slider"`, `params.beforeSrc`, `params.afterSrc` |
| **Condensation example** | Optional | Add image block if needed |

Placeholders in JSON today: video `src: ""`; side-by-side `src: ["", ""]`; slider `beforeSrc: "", afterSrc: ""`.
