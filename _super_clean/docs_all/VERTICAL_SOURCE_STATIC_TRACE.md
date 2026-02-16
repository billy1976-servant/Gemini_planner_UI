# [VERTICAL SOURCE TRACE] — Static Source-Level Analysis

**Scope:** JSON → layout-definitions → renderer → atoms → molecules → CSS → tokens.  
**No DOM. No runtime. Read-only.**

---

## 1) JSON ENTRY POINTS

**Files scanned:**  
- `src/01_App/apps-json/apps/journal_track/journal_replicate-2.json`  
- (journal_replicate.json not enumerated; journal_replicate-2 is the primary journal screen)

**Findings:**

| Item | Value |
|------|--------|
| **Explicit `layout` in JSON** | None. No `"layout": "..."` key on any section node. |
| **Section layout source** | Template profile (`focus-writing-apple`) + engine override. json-renderer hard-forces `layout = "content-stack"` for every section (proof binding). Template maps role `focus` → `content-stack`. |
| **Layouts effectively used** | **content-stack** (sections: writing, focus). |
| **Spacing params in JSON** | None. No `params.layout`, `params.gap`, or spacing tokens in screen JSON. |
| **Slot definitions** | Section children are Stepper, card, field, button; no slot spacing in JSON. |

**Spacing tokens referenced in JSON:** None.

**Vertical impact:** LOW (JSON does not define vertical space; layout comes from template + layout-definitions).

---

## 2) LAYOUT DEFINITIONS

**Files scanned:**  
- `src/04_Presentation/layout/data/layout-definitions.json`  
- `src/04_Presentation/lib-layout/spacing-scales.json`

### layout-definitions.json — componentLayouts (section layout)

| Layout ID | padding | gap | margin | Vertical padding > 0 |
|-----------|---------|-----|--------|----------------------|
| hero-centered | `var(--spacing-16) 0` | `var(--spacing-10)` | — | **YES** (64px equiv) |
| hero-split* | `var(--spacing-20) 0` | `var(--spacing-12)` | — | **YES** (80px equiv) |
| hero-full-bleed-image | `var(--spacing-16) 0` | `var(--spacing-6)` | — | **YES** (64px equiv) |
| **content-narrow** | `var(--spacing-10) 0` | `var(--spacing-8)` | — | **YES** (40px equiv) |
| **content-stack** | `var(--spacing-10) 0` | `var(--spacing-8)` | — | **YES** (40px equiv) |
| image-left-text-right | `var(--spacing-8) 0` | `var(--spacing-8)` | — | **YES** (32px equiv) |
| features-grid-3 | `var(--spacing-12) 0` | `var(--spacing-8)` | — | **YES** (48px equiv) |
| testimonial-band | `var(--spacing-10) 0` | `var(--spacing-8)` | — | **YES** (40px equiv) |
| cta-centered | `var(--spacing-12) 0` | `var(--spacing-8)` | — | **YES** (48px equiv) |

**Journal screen uses:** **content-stack** → `padding: "var(--spacing-10) 0"` (40px top+bottom), `gap: "var(--spacing-8)"` (32px between items).

**pageLayouts:** Only horizontal `contentInsetX` (e.g. `var(--spacing-6)`); no vertical padding in pageLayouts.

### spacing-scales.json

| Scale | section.layout.gap | card |
|-------|---------------------|------|
| default | `var(--spacing-md)` (20px) | (empty) |
| luxury | `var(--spacing-xl)` (48px) | (empty) |
| saas | `var(--spacing-md)` | (empty) |
| magazine | `var(--spacing-lg)` (32px) | (empty) |
| course | `var(--spacing-md)` | (empty) |

**Note:** Section gap in layout-definitions is the authority (spacing scale section gap is stripped in json-renderer PHASE I). So for journal, section vertical space is from **layout-definitions content-stack only**.

**Vertical impact:** **HIGH** — layout-definitions.componentLayouts is the single largest source of section vertical padding and gap.

---

## 3) RENDER PIPELINE

**Files scanned:**  
- `src/03_Runtime/engine/core/ExperienceRenderer.tsx`  
- `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`  
- `src/app/page.tsx`  
- `src/04_Presentation/components/stage/PreviewStage.tsx`  
- `src/06_Data/site-skin/shells/WebsiteShell.tsx`  
- `src/app/layout.tsx` (scroll container / app-content)

### ExperienceRenderer.tsx

| Layer | Injects padding? | margin? | gap? | Value |
|-------|-------------------|---------|------|--------|
| appWrapperStyle | No (set to 0) | No (0) | — | `padding: 0`, `margin: 0` |
| learningWrapperStyle | No | No | — | `padding: 0`, `margin: 0` |
| websiteWrapperStyle | No | No | — | (no padding/margin) |
| Learning step bar | Horizontal only | — | — | `padding: "0 var(--spacing-6)"` |
| Prev/Next buttons | Horizontal only | — | — | `padding: "0 var(--spacing-4)"` |

**Vertical impact:** LOW (all wrapper vertical padding removed).

### LayoutMoleculeRenderer.tsx

| Source | Property | Value | Vertical? |
|--------|----------|--------|-----------|
| moleculeLayout.params | gap | From layout-definitions (e.g. `var(--spacing-8)`) | YES |
| moleculeLayout.params | padding | From layout-definitions (e.g. `var(--spacing-10) 0`) | YES — **passed to SequenceAtom** |
| Section outer (combinedOuterStyle) | paddingTop/Bottom | 0 (explicit) | No |
| contentColumn (split) | gap | contentColumnLayout.gap | YES (column) |
| splitLayoutStyle | padding | Only paddingLeft/Right applied | No |
| nonSplitWrapperBase / split wrappers | padding, margin | 0 | No |
| Recovery fallback gap | gap | `"0"` | No |

**Vertical impact:** **HIGH** — does not inject its own vertical space; **forwards** layout-definitions `padding` and `gap` to SequenceAtom/CollectionAtom. Section outer adds 0 vertical.

### page.tsx

- No inline padding/margin on screen root. Wrapped content uses flex column; no gap set on wrapper.  
**Vertical impact:** LOW.

### PreviewStage.tsx

- All modes: `padding: 0`, `margin: 0` on outer and frame divs.  
**Vertical impact:** LOW.

### WebsiteShell.tsx

- `main.site-container-inner`: `padding: 0`, `margin: 0`.  
**Vertical impact:** LOW.

### layout.tsx (scroll container / app-content)

| Element | padding | margin |
|---------|---------|--------|
| app-content | 0 | — |
| Scroll container (phone) | 0 | 0 |
| data-phone-frame | **12px** (all sides) | — |

**Vertical impact:** **MED** — phone frame 12px top/bottom is the only wrapper-level vertical padding.

---

## 4) MOLECULE DEFINITIONS

**File:** `src/04_Presentation/components/molecules/molecules.json`

### Card

| Variant / size | padding | Vertical? |
|----------------|---------|-----------|
| default, elevated, outlined, soft, floating, prompt | `"0"` | No |
| sizes sm, md, lg | `"0"` | No |

**Vertical impact:** LOW (no vertical padding).

### Button

| Variant | padding | Vertical? |
|---------|---------|-----------|
| filled, tonal, outlined | `"0 var(--spacing-lg)"` | No |
| text, icon | `"0"` | No |
| sizes sm, md, lg surface | `"0"` | No |

**Vertical impact:** LOW.

### Field

| Variant / size | padding (field) | Vertical? |
|----------------|------------------|-----------|
| outlined, filled field | `"0"` | No |
| sizes sm, md field | `"0"` | No |

**Vertical impact:** LOW.

### Stepper / tab (journal uses variant tab-segment)

| Variant | surface padding | sequence gap | Vertical? |
|---------|------------------|--------------|-----------|
| primary | `var(--spacing-4) 0` | spacing.inlineGap | **YES** (16px) |
| tab-underline | `var(--spacing-md) 0` | gap.none | **YES** (20px) |
| tab-pill | `var(--spacing-4) 0` | spacing.inlineGap | **YES** (16px) |
| **tab-segment** | **`var(--spacing-md) 0`** | spacing.compactGap | **YES** (20px) |
| tab-segment-mobile | `"0"` | gap.xs | No |

**Vertical impact:** **MED** — tab-segment surface adds vertical padding (`var(--spacing-md) 0` = 20px) unless overridden by size/mobile.

### Other molecules with vertical padding (reference only)

- **chip:** `var(--spacing-sm) 0` (variants), `"0"` (sizes) — MED.
- **footer:** `4rem 0 2rem 0` — HIGH (not in journal).
- **modal:** `var(--spacing-lg) 0` / `var(--spacing-md) 0` — MED.
- **toast:** `var(--spacing-md) 0` — MED.
- **__uiScaffold** sm: `var(--spacing-4) 0` — MED.

**Token reference:** All use `var(--spacing-*)` or `"0"`. No new tokens introduced.

---

## 5) ATOMS

**Files:**  
- `src/04_Presentation/components/atoms/surface.tsx`  
- `src/04_Presentation/components/atoms/sequence.tsx`  
- `src/04_Presentation/components/atoms/collection.tsx`  
- (FieldAtom, TextAtom, TriggerAtom — no standalone padding/margin injection in atoms)

### SurfaceAtom

- **Injects:** `params.padding` when present (via `resolveToken`). No default padding.  
- **Source of params:** Molecule definitions (card, button, stepper, etc.) or layout (section surface).  
**Vertical impact:** Depends on params; no intrinsic vertical space.

### SequenceAtom

- **Injects:** `p.gap` (flex/grid gap), `p.padding` when present.  
- **Source:** `params` from LayoutMoleculeRenderer (layout-definitions moleculeLayout.params) or from card/stepper layout.  
- **Default:** No default gap/padding in component; STRICT_JSON_MODE warns. LayoutMoleculeRenderer passes resolved `resolved` with gap and padding from layout-definitions.  
**Vertical impact:** **HIGH** — when used for section inner layout, applies **layout-definitions padding and gap** (e.g. content-stack: padding `var(--spacing-10) 0`, gap `var(--spacing-8)`).

### CollectionAtom

- **Injects:** `params.gap`, `params.padding` when present.  
- Same pass-through from layout-definitions when used for section grid.  
**Vertical impact:** **HIGH** when used for section (grid layout with padding/gap from layout-definitions).

**Summary:** Atoms do not define their own vertical spacing; they apply **params** from layout-definitions (section) or molecules.json (card, button, stepper).

---

## 6) GLOBAL CSS + TOKENS

**File:** `src/07_Dev_Tools/styles/site-theme.css`

### Tokens (:root)

| Token | Value | Vertical impact |
|-------|--------|------------------|
| --line-height-tight | 1.25 | TEXT (adds ~4px per line at 16px font) |
| --line-height-normal | 1.5 | TEXT (~8px per line at 16px) |
| --line-height-relaxed | 1.75 | TEXT |
| --spacing-1 … --spacing-24 | 4px … 96px | Used by layout-definitions, molecules, CSS |

### Selectors with vertical spacing

| Selector | Property | Value | Impact |
|----------|----------|--------|--------|
| .site-container | line-height | var(--line-height-normal) | MED (text) |
| .site-container | padding, margin | 0 !important | — |
| .site-container-inner | padding-left/right | 0 !important | — (no vertical) |
| .app-body | margin | 0 | — |
| .app-content | margin-top, padding | 0 !important | — |
| .experience-website | --experience-gap | var(--spacing-8) | Variable set (consumer not in trace) |
| .experience-app.experience-dashboard | --experience-gap | var(--spacing-4) | Variable set |
| .experience-learning h1 | line-height | var(--line-height-tight) | LOW |
| .product-grid-container | padding-left/right | var(--spacing-8) | Horizontal only |
| .app-section-layout-panel | padding | var(--spacing-3) | MED (dev panel) |
| .app-chrome * (buttons, select) | padding | var(--spacing-2) var(--spacing-3) | Horizontal + vertical (chrome only) |
| .diagnostics-compact h1/h2/h3 | margin | 2px 0 !important | LOW |
| .site-mt-*, .site-mb-* | margin-top, margin-bottom | var(--spacing-*) | MED if used |

**Container / main wrapper:** .site-container-inner and .app-content have no vertical padding in theme (overridden to 0). WebsiteShell sets main to padding: 0, margin: 0 inline.

**Vertical impact:** **MED** for line-height and any utility/section classes that use margin-top/bottom; **LOW** for app-content/site-container (zeroed).

---

## 7) FINAL REPORT — LAYER SUMMARY

| Layer | File(s) | Property | Value / token | Vertical impact |
|-------|---------|----------|----------------|------------------|
| **1) JSON** | journal_replicate-2.json | (none) | Layout from template | LOW |
| **2) Layout definitions** | layout-definitions.json | componentLayouts.*.params.padding | e.g. `var(--spacing-10) 0`, `var(--spacing-20) 0` | **HIGH** |
| | layout-definitions.json | componentLayouts.*.params.gap | e.g. `var(--spacing-8)`, `var(--spacing-12)` | **HIGH** |
| | spacing-scales.json | section.layout.gap | var(--spacing-md/xl/lg) | MED (overridden by layout-definitions for section) |
| **3) Renderer wrappers** | layout.tsx | data-phone-frame padding | 12px | **MED** |
| | layout.tsx | scroll container | padding: 0, margin: 0 | — |
| | ExperienceRenderer.tsx | app/learning/website wrappers | padding: 0, margin: 0 | — |
| | LayoutMoleculeRenderer.tsx | section outer | paddingTop/Bottom: 0 | — |
| | LayoutMoleculeRenderer.tsx | moleculeLayout.params | Pass-through to SequenceAtom | **HIGH** (source: layout-definitions) |
| | WebsiteShell.tsx | main | padding: 0, margin: 0 | — |
| | PreviewStage.tsx | all | padding: 0, margin: 0 | — |
| **4) Molecules** | molecules.json | card surface | "0" | LOW |
| | molecules.json | button surface | "0 var(--spacing-lg)" | LOW |
| | molecules.json | field field | "0" | LOW |
| | molecules.json | stepper tab-segment surface | var(--spacing-md) 0 | **MED** |
| | molecules.json | chip, modal, toast, footer | var(--spacing-*) 0 | MED/HIGH (context-dependent) |
| **5) Atoms** | SequenceAtom / CollectionAtom | gap, padding | From params (layout-definitions) | **HIGH** (conduit) |
| | SurfaceAtom | padding | From params (molecules/layout) | Depends on params |
| **6) Global CSS** | site-theme.css | --line-height-* | 1.25, 1.5, 1.75 | MED (text) |
| | site-theme.css | .site-container line-height | var(--line-height-normal) | MED |
| | site-theme.css | .app-content, .app-body | 0 | — |
| | site-theme.css | .experience-* --experience-gap | var(--spacing-4/8) | LOW (variable only) |

---

## TOP 5 ROOT SOURCES OF VERTICAL SPACE

Ranked by total potential contribution (static analysis; actual pixels depend on token values and number of sections/items).

1. **layout-definitions.json — componentLayouts padding**  
   - **File:** `src/04_Presentation/layout/data/layout-definitions.json`  
   - **Property:** `params.padding` (e.g. `"var(--spacing-16) 0"`, `"var(--spacing-20) 0"`, `"var(--spacing-10) 0"`).  
   - **Effect:** Section inner column gets top+bottom padding per section (40px–80px per section in token terms).  
   - **Impact:** **HIGH**

2. **layout-definitions.json — componentLayouts gap**  
   - **File:** `src/04_Presentation/layout/data/layout-definitions.json`  
   - **Property:** `params.gap` (e.g. `var(--spacing-8)`, `var(--spacing-12)`).  
   - **Effect:** Vertical gap between section inner items (SequenceAtom/CollectionAtom).  
   - **Impact:** **HIGH**

3. **LayoutMoleculeRenderer → SequenceAtom/CollectionAtom (pass-through)**  
   - **Files:** `LayoutMoleculeRenderer.tsx`, `sequence.tsx`, `collection.tsx`  
   - **Property:** `params.padding`, `params.gap` forwarded from layout-definitions.  
   - **Effect:** Same as (1) and (2); atoms are the conduit.  
   - **Impact:** **HIGH** (conduit only; source is layout-definitions)

4. **Phone frame bezel**  
   - **File:** `src/app/layout.tsx`  
   - **Property:** `data-phone-frame` style `padding: "12px"`.  
   - **Effect:** 12px top + 12px bottom.  
   - **Impact:** **MED**

5. **Stepper/tab molecules + line-height (tie)**  
   - **Files:** `molecules.json` (stepper variants), `site-theme.css` (line-height).  
   - **Property:** Stepper surface `padding: "var(--spacing-md) 0"` (tab-segment etc.); CSS `--line-height-normal` (1.5) on .site-container.  
   - **Effect:** ~20px vertical per tab row; line-height adds ~8px per line of text.  
   - **Impact:** **MED**

---

**End of static trace. No code or DOM was modified.**
