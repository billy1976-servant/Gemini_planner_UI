# FULL PREVIEW WIDTH ROOT-CAUSE ANALYSIS

## Executive Summary

**ROOT CAUSE IDENTIFIED:** The main preview canvas width is constrained by a CSS class `.site-container-inner` applied to the `<main>` element in `WebsiteShell.tsx`. This class sets `max-width: var(--container-2xl)` (1440px), which prevents layout changes from visually responding because all sections are clamped to this maximum width regardless of their individual `containerWidth` settings.

**HIGHEST-LEVEL CLAMP:** `src/07_Dev_Tools/styles/site-theme.css` line 183: `.site-container-inner { max-width: var(--container-2xl); }`

---

## 1. MAIN PREVIEW RENDER PATH

### Render Chain (Top to Bottom)

```
page.tsx (line 821-826)
  └─> WebsiteShell (content prop)
       └─> <main className="site-container-inner">  ← CONSTRAINT APPLIED HERE
            └─> <div ref={contentRef} style={{ width: "100%", paddingRight: SIDEBAR_TOTAL_WIDTH }}>
                 └─> wrappedContent (experience === "website")
                      └─> <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)", width: "100%" }}>
                           └─> ExperienceRenderer
                                └─> <div data-experience="website" style={websiteWrapperStyle}>
                                     └─> JsonRenderer
                                          └─> SectionCompound (per section)
                                               └─> LayoutMoleculeRenderer
                                                    └─> <div style={{ maxWidth: containerVar }}>  ← SECTION-LEVEL CONSTRAINT
                                                         └─> Actual content
```

### File Locations

1. **Entry Point:** `src/app/page.tsx:821-826`
   - Renders `WebsiteShell` with content prop
   - Content wrapped in `<div>` with `width: "100%"` and `paddingRight: SIDEBAR_TOTAL_WIDTH`

2. **Shell Wrapper:** `src/06_Data/site-skin/shells/WebsiteShell.tsx:42-48`
   - Applies `className="site-container-inner"` to `<main>` element
   - **THIS IS WHERE THE CONSTRAINT IS APPLIED**

3. **Experience Wrapper:** `src/03_Runtime/engine/core/ExperienceRenderer.tsx:227-234`
   - Website experience: `<div style={websiteWrapperStyle}>` where `websiteWrapperStyle = { width: "100%" }`
   - No width constraints here

4. **Section Renderer:** `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx:390-415`
   - Applies section-level `maxWidth` based on `containerWidth` semantic token
   - But this is INSIDE the clamped container, so it cannot exceed the parent constraint

---

## 2. PARENT WRAPPER ANALYSIS

### Wrapper Hierarchy (Outermost to Innermost)

| Level | Component/Element | File | Line | Width Constraints | Notes |
|-------|------------------|------|------|-------------------|-------|
| 1 | `<html>` | `src/app/layout.tsx` | 158 | None | Root HTML element |
| 2 | `<body className="app-body">` | `src/app/layout.tsx` | 167 | None | Body element |
| 3 | `<div className="app-content">` | `src/app/layout.tsx` | 214 | None | Content wrapper |
| 4 | `WebsiteShell` | `src/06_Data/site-skin/shells/WebsiteShell.tsx` | 34-52 | None | Shell component |
| 5 | **`<main className="site-container-inner">`** | **`src/06_Data/site-skin/shells/WebsiteShell.tsx`** | **43** | **`max-width: var(--container-2xl)`** | **🔴 CONSTRAINT #1** |
| 6 | `<div ref={contentRef}>` | `src/app/page.tsx` | 823 | `width: "100%"` | Inline style |
| 7 | `<div>` (wrappedContent) | `src/app/page.tsx` | 754-768 | `width: "100%"` | Inline style |
| 8 | `ExperienceRenderer` wrapper | `src/03_Runtime/engine/core/ExperienceRenderer.tsx` | 231 | `width: "100%"` | Inline style |
| 9 | `JsonRenderer` | `src/03_Runtime/engine/core/json-renderer.tsx` | N/A | None | Renderer component |
| 10 | `SectionCompound` | `src/04_Presentation/components/molecules/section.compound.tsx` | N/A | None | Section wrapper |
| 11 | `LayoutMoleculeRenderer` outer div | `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx` | 390-415 | `maxWidth: containerVar` | Section-level constraint |

---

## 3. CONSTRAINT DETAILS

### Constraint #1: `.site-container-inner` CSS Class (HIGHEST-LEVEL CLAMP)

**File:** `src/07_Dev_Tools/styles/site-theme.css`  
**Lines:** 181-188

```css
.site-container-inner {
  width: 100%;
  max-width: var(--container-2xl);  /* ← THIS IS THE CLAMP */
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-4);
  padding-right: var(--spacing-4);
}
```

**CSS Variable Definition:**  
**File:** `src/07_Dev_Tools/styles/site-theme.css`  
**Line:** 68

```css
--container-2xl: var(--container-full);  /* Which equals 1440px */
--container-full: 1440px;  /* Line 68 */
```

**Applied To:**  
**File:** `src/06_Data/site-skin/shells/WebsiteShell.tsx`  
**Line:** 43

```tsx
<main
  className="site-container-inner"  /* ← CONSTRAINT APPLIED HERE */
  style={{
    paddingTop: "var(--spacing-6)",
    paddingBottom: "var(--spacing-16)",
  }}
>
  {mainContent}
</main>
```

**Impact:**  
- **ALL content** inside the main preview is clamped to a maximum width of **1440px**
- Even if a section's layout specifies `containerWidth: "full"` (which should be `100%`), it cannot exceed 1440px because its parent container is clamped
- Layout changes that should make sections wider (e.g., changing from "narrow" to "wide" or "full") appear to have no visual effect because they're all constrained by this parent clamp

### Constraint #2: Section-Level `maxWidth` (Secondary Constraint)

**File:** `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`  
**Lines:** 390-415

**Logic:**
- Maps `containerWidth` semantic tokens to CSS values:
  - `"contained"` → `var(--container-content)` (960px)
  - `"narrow"` → `var(--container-narrow)` (720px)
  - `"wide"` → `var(--container-wide)` (1200px)
  - `"full"` → `100%`
- Applies `maxWidth` to the outer wrapper div

**Impact:**  
- This constraint is **redundant** when sections are inside `.site-container-inner` because the parent clamp (1440px) is wider than most section constraints
- Only becomes visible when section constraint is narrower than 1440px (e.g., "narrow" = 720px)
- When section constraint is wider (e.g., "full" = 100%), it's still clamped by the parent

---

## 4. RIGHT SIDEBAR PREVIEW PATH (FOR COMPARISON)

### Render Chain

```
RightFloatingSidebar
  └─> RightSidebarDockContent
       └─> <div style={{ width: openPanel ? EXPANDED_PANEL_WIDTH : 0 }}>  /* 380px */
            └─> <div style={{ width: "100%", maxWidth: "100%" }}>
                 └─> OrganPanel
                      └─> PreviewRender (per layout tile)
                           └─> <div style={{ width: "100%", maxWidth: "none", flex: 1 }}>
                                └─> JsonRenderer
                                     └─> LayoutMoleculeRenderer
                                          └─> <div style={{ maxWidth: containerVar }}>
```

### Key Differences

| Aspect | Main Preview | Right Sidebar Preview |
|--------|--------------|----------------------|
| **Parent Container** | `.site-container-inner` (max-width: 1440px) | Panel div (width: 380px, maxWidth: "none") |
| **Width Constraint** | Hard CSS clamp at 1440px | Flexible container (380px panel width) |
| **Section Constraints** | Cannot exceed parent clamp | Can use full panel width (380px) |
| **Visual Response** | No visible change when layout changes | Visible change because panel width is smaller than section constraints |

**Why Right Sidebar Responds:**
- The sidebar preview tiles are in a **380px wide panel**
- Section-level `maxWidth` constraints (720px, 960px, 1200px) are **wider than the panel**
- So the section constraints are **effective** within the 380px container
- When layout changes (e.g., "narrow" → "wide"), the section's `maxWidth` changes, but since both are wider than 380px, the visual difference is minimal but still detectable

**Why Main Preview Doesn't Respond:**
- The main preview is in a **1440px clamped container**
- Section-level `maxWidth` constraints are **narrower than or equal to** 1440px
- So the parent clamp **overrides** the section constraints
- When layout changes (e.g., "narrow" 720px → "wide" 1200px), both are still within the 1440px parent, so the visual difference is minimal
- When layout changes to "full" (100%), it should expand to 1440px, but since it's already at 1440px, there's no visible change

---

## 5. SPECIFIC CONSTRAINT VALUES

### CSS Variables (from `site-theme.css`)

```css
--container-narrow: 720px;      /* Line 65 */
--container-content: 960px;    /* Line 66 */
--container-wide: 1200px;      /* Line 67 */
--container-full: 1440px;      /* Line 68 */
--container-2xl: var(--container-full);  /* Line 74 */
```

### Applied Constraints

| Container | Constraint Type | Value | Source |
|-----------|----------------|-------|--------|
| `.site-container-inner` | `max-width` | `var(--container-2xl)` = **1440px** | CSS class (line 183) |
| Section "narrow" | `max-width` | `var(--container-narrow)` = **720px** | LayoutMoleculeRenderer |
| Section "contained" | `max-width` | `var(--container-content)` = **960px** | LayoutMoleculeRenderer |
| Section "wide" | `max-width` | `var(--container-wide)` = **1200px** | LayoutMoleculeRenderer |
| Section "full" | `max-width` | `100%` (but clamped by parent) | LayoutMoleculeRenderer |

---

## 6. ROOT CAUSE SUMMARY

### The Problem

**The `.site-container-inner` CSS class applies a hard `max-width: 1440px` clamp to the main preview container, preventing section-level layout changes from having visible effects.**

### Why It Happens

1. **WebsiteShell** applies `className="site-container-inner"` to the `<main>` element
2. **CSS rule** sets `max-width: var(--container-2xl)` (1440px)
3. **All sections** inside this container are constrained to a maximum of 1440px
4. **Section-level constraints** (720px, 960px, 1200px, 100%) are narrower than or equal to the parent clamp
5. **Layout changes** that should make sections wider appear to have no effect because they're still within the 1440px limit

### The Fix (Not Implemented - Analysis Only)

To allow layout changes to visually respond:

1. **Remove or override** the `max-width` constraint on `.site-container-inner` for the main preview
2. **OR** make `.site-container-inner` respect section-level `containerWidth` settings dynamically
3. **OR** apply `.site-container-inner` only to specific content types, not the entire preview canvas

---

## 7. EXACT FILE REFERENCES

### Primary Constraint (Root Cause)

- **File:** `src/07_Dev_Tools/styles/site-theme.css`
- **Lines:** 181-188 (`.site-container-inner` rule)
- **Line:** 68 (`--container-full: 1440px` definition)
- **Line:** 74 (`--container-2xl: var(--container-full)` alias)

### Application Point

- **File:** `src/06_Data/site-skin/shells/WebsiteShell.tsx`
- **Line:** 43 (`<main className="site-container-inner">`)

### Secondary Constraints (Section-Level)

- **File:** `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`
- **Lines:** 367-388 (containerWidth token mapping)
- **Lines:** 390-415 (maxWidth application logic)

### Render Path

- **File:** `src/app/page.tsx`
- **Lines:** 821-826 (WebsiteShell usage)
- **Line:** 823 (contentRef div wrapper)

---

## 8. CONCLUSION

**ROOT CAUSE:** The `.site-container-inner` CSS class in `site-theme.css` applies a `max-width: 1440px` constraint to the main preview container, preventing section-level layout changes from having visible effects.

**HIGHEST-LEVEL CLAMP:** `src/07_Dev_Tools/styles/site-theme.css` line 183: `.site-container-inner { max-width: var(--container-2xl); }`

**IMPACT:** All sections are clamped to 1440px maximum width, regardless of their individual `containerWidth` settings. Layout changes that should make sections wider (e.g., "narrow" → "wide" → "full") appear to have no visual effect because they're all constrained by this parent clamp.

**DIFFERENCE FROM SIDEBAR:** The right sidebar preview responds to layout changes because it's in a 380px wide panel, where section constraints (720px+) are effective. The main preview doesn't respond because it's in a 1440px clamped container, where section constraints are redundant.
