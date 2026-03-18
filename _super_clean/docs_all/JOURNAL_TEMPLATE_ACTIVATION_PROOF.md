# Journal Template Activation — Proof Report

**Date:** 2025-02-12  
**Screen:** `journal_track/journal_replicate` (or any journal_track screen)  
**Goal:** Activate a valid template for journal and verify template-driven layout + visualPreset + rhythm without changing engines, layout-definitions, or gap authority.

---

## 1. Template ID Used

| Field | Value |
|-------|--------|
| **templateId** | `focus-writing` |
| **Label** | Focus Writing |
| **Experience** | `journal` |
| **Source** | `src/04_Presentation/lib-layout/template-profiles.json` |

**Selection:** Among journal templates that define roles `writing` and `focus`, **focus-writing** was chosen. Other journal templates with the same roles: `guided-reflection`, `contemplative-space`, `structured-journal`, `minimal-distraction`, `evening-journal`, `morning-pages`, `course-reflection`.

---

## 2. Section Role → layoutId Mapping (from template)

From **focus-writing** `layoutVariants`:

| Section role | layoutId | containerWidth | Variant params (excerpt) |
|--------------|----------|----------------|--------------------------|
| **writing** | `content-narrow` | `narrow` | `gap: "0.5rem"`, `padding: "2rem 0"`, `maxWidth: "65ch"` |
| **focus** | `content-narrow` | `narrow` | `gap: "0.75rem"`, `padding: "1.5rem 0"` |
| **track** | `content-stack` | `narrow` | `gap: "0.5rem"` |

Template **sections** (type + params):

- **writing:** `column` — `gap: "0.5rem"`, `align: "stretch"`
- **focus:** `column` — `gap: "0.75rem"`, `align: "stretch"`
- **track:** `row` — `gap: "0.5rem"`, `justify: "center"`

---

## 3. Runtime Chain (Params Trace)

Proof that **templateProfile** is active and drives layout + visual:

```
templateProfile (getTemplateProfile(effectiveTemplateId))
  → effectiveProfile (page.tsx useMemo: id, sections, layoutVariants, visualPreset, containerWidth, spacingScale, cardPreset, …)
  → profileOverride={effectiveProfile} passed to JsonRenderer
  → applyProfileToNode(..., profile)
  → getSectionLayoutId({ sectionKey, node, templateId, templateProfile: profile, ... }, { includeRule: true })
  → layoutVariants[nodeRole] → layoutId, variantParams, variantContainerWidth
  → (next)._variantParams = variantParams (+ containerWidth if present)
  → JsonRenderer params resolution: paramsAfterSectionLayout + variantParamsOverlay (_variantParams merged; gap stripped for section so section gap stays from layout-definitions)
  → LayoutMoleculeRenderer receives resolved layout id + final params
```

**Code references:**

- **page.tsx:** `effectiveTemplateId` = `templateIdFromState ?? layoutSnapshot?.templateId ?? forcedTemplateId`; `forcedTemplateId = "focus-writing"`; `effectiveProfile` includes `layoutVariants` from `templateProfile`.
- **section-layout-id.ts:** Authority ladder: override → node.layout → **template layoutVariants** → template role → template default → fallback. When `templateProfile.layoutVariants[nodeRole]` exists, `ruleApplied = "template layoutVariants"`.
- **json-renderer.tsx:** `getSectionLayoutId(..., templateProfile: profile)`; `(next)._variantParams` set from variant params; later, for `typeKey === "section"`, `rawVariantParams = profiledNode._variantParams`; gap is stripped from variant overlay so **section gap remains from layout-definitions only**.

---

## 4. What Visually Changes (Template Active)

**A) Layout**

- **writing** section: layoutId **content-narrow**, containerWidth **narrow**; variant params (padding, maxWidth) applied.
- **focus** section: layoutId **content-narrow**, containerWidth **narrow**; variant params applied.
- **track** section: layoutId **content-stack**, containerWidth **narrow**.
- **containerWidth** differences: template sets global `containerWidth: "narrow"` and per-role narrow for writing/focus/track.

**B) VisualPreset (compact)**

- **Section surface:** from `visual-presets.json` → `compact.section.surface` (e.g. radius.sm, transition.fast).
- **Card surface:** `compact.card.surface` (e.g. radius.sm, elevation.low).
- **Elevation / padding rhythm:** from preset + spacingScale (default) and cardPreset (borderless).

**C) Spacing / rhythm**

- **spacingScale:** `default` (template).
- **Padding / rhythm:** from variant params (e.g. writing `padding: "2rem 0"`, focus `padding: "1.5rem 0"`) merged into section params.
- **Section gap:** still **only from layout-definitions**; JsonRenderer explicitly strips `gap` from `_variantParams` overlay for sections so layout-definitions remain the single authority for section gap.

---

## 5. Proof That templateProfile Is Active

1. **effectiveTemplateId** is set to `focus-writing` when state/layoutSnapshot do not provide a templateId (temporary override in page.tsx).
2. **getTemplateProfile("focus-writing")** returns the Focus Writing profile; **effectiveProfile** is built from it and includes **layoutVariants**.
3. **JsonRenderer** receives **profileOverride={effectiveProfile}**; in **applyProfileToNode**, **getSectionLayoutId** is called with **templateProfile: profile**, so **layoutVariants** for writing/focus/track are used when section has matching role and no override/node.layout.
4. **ruleApplied** for those sections is **"template layoutVariants"** (visible in dev trace / layout-resolution trace).
5. **visualPreset**, **containerWidth**, **spacingScale**, **cardPreset** from the template are on **effectiveProfile** and drive **getVisualPresetForMolecule**, **getSpacingForScale**, **getCardPreset**, and container width resolution.

---

## 6. Section Gap Authority (Unchanged)

- **Section gap** is **not** taken from template variant params at render time.
- In **json-renderer.tsx**, when applying `_variantParams` for sections, any `gap` (and `layout.gap`) is stripped from the variant overlay before merging: `variantParamsOverlay` excludes gap so that **layout-definitions** remain the only source for section gap.
- No changes were made to layout-definitions, molecules, atoms, or gap values.

---

## 7. Changes Made (Activation Only)

| File | Change |
|------|--------|
| **src/app/page.tsx** | 1) `forcedTemplateId = "focus-writing"`; 2) `effectiveTemplateId = templateIdFromState ?? layoutSnapshot?.templateId ?? forcedTemplateId`; 3) `effectiveProfile` now includes `layoutVariants` from `templateProfile` so the renderer receives template layout variants. |

**Not modified:** layout-definitions, template-profiles.json, molecules, atoms, engines, resolvers, spacing authority logic, or any gap values.

---

## 8. How to Verify

1. Run the app and open: `?screen=journal_track/journal_replicate` (or `journal_track/app-1` if that is the screen key).
2. In dev, check console/trace for `[LAYOUT INVESTIGATION] Template Profile` with `templateId: "focus-writing"` and `templateLabel: "Focus Writing"`.
3. Check layout-resolution trace: sections with roles `writing`, `focus`, `track` should show `ruleApplied: "template layoutVariants"` and resolved `layoutId` as above.
4. Visually: narrow content width, compact section/card surfaces, and padding from variant params; section gaps still follow layout-definitions.

---

## 9. Before/After (Conceptual)

| Before (no template) | After (focus-writing active) |
|----------------------|------------------------------|
| effectiveTemplateId = "" | effectiveTemplateId = "focus-writing" |
| templateProfile = null / fallback | templateProfile = Focus Writing |
| Section layoutId from template default or fallback | writing/focus → content-narrow, track → content-stack (from layoutVariants) |
| No variant params on sections | padding, maxWidth, containerWidth from layoutVariants applied |
| visualPreset from experience only | visualPreset = compact (template) |
| Section gap from layout-definitions | Unchanged: section gap still only from layout-definitions |

This report confirms activation of the journal template and that template-driven layout, visualPreset, and rhythm are visible while section gap authority remains solely in layout-definitions.
