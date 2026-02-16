# PHASE I — Template vs Layout Gap Authority Audit

**Goal:** Find every place template-profiles.json still influences section gap, layout params.gap, contentColumn gap, and section spacing tokens. Compare with layout-definitions.json and report duplicate ownership plus merge path so layout-definitions becomes single authority.

**No file modifications in this audit; report only.**

---

## 1. Trace: Where template-profiles.json feeds gap and layout

### 1.1 Entry point

- **page.tsx** (line 253): `const templateProfile = getTemplateProfile(effectiveTemplateId);`
- **page.tsx** (lines 302–318): Builds `effectiveProfile` from `templateProfile`, including:
  - `sections: templateProfile.sections`
  - `defaultSectionLayoutId: templateProfile.defaultSectionLayoutId`
  - `visualPreset`, `containerWidth`, `widthByRole`, **`spacingScale`**, `cardPreset`, `heroMode`, `sectionBackgroundPattern`
- **page.tsx** (747, 807, 814, 864, 871): Passes `profileOverride={effectiveProfile}` into ExperienceRenderer / JsonRenderer.

So the **template profile** (from [template-profiles.json](src/04_Presentation/lib-layout/template-profiles.json)) is the source of: `sections`, `defaultSectionLayoutId`, `spacingScale`, and (when present) `layoutVariants`. All of these are passed to the renderer as part of `profileOverride`.

### 1.2 Section layout id and variant params (json-renderer + section-layout-id)

- **json-renderer.tsx** (applyProfileToNode, ~387–397): For each section, calls **getSectionLayoutId** with `templateProfile: profile`.
- **section-layout-id.ts** (getSectionLayoutId):
  - Uses **templateProfile.layoutVariants?.[nodeRole]** when no override and no explicit node.layout. When present, returns **layoutId** = `layoutVariant.layoutId` and **variantParams** = `layoutVariant.params` (which can include `gap`).
  - Otherwise uses **getPageLayoutId(null, { templateId, sectionRole: nodeRole })**, which reads **layout-definitions.json** `templates[templateId][sectionRole]` → layout id (e.g. "hero-split", "content-stack").
  - Fallback: **profile.defaultSectionLayoutId** or **getDefaultSectionLayoutId(templateId)** (layout-definitions `templates[templateId].defaultLayout`) or `"content-stack"`.
- **json-renderer.tsx** (453–456): Sets `(next as any)._variantParams = variantParams` (and merges in variantContainerWidth). So when the rule is **"template layoutVariants"**, **template-profiles.layoutVariants[role].params** (including `gap`) is stored on the section node.

**Conclusion:** **template-profiles.layoutVariants[role].params.gap** influences section gap when that resolution rule wins. It does **not** use **template-profiles.sections[role]** for layout id or params; layout id for "template role" comes from layout-definitions.templates only.

### 1.3 Merge of section params (renderNode)

- **json-renderer.tsx** (820–826): `resolvedParams` = resolveParams(visualPresetOverlay, …, profiledNode.params, …). Visual preset overlay no longer has section.layout.gap (Phase H removed it).
- **json-renderer.tsx** (829–836): **sectionPresetLayoutOverlay** = section + visualPresetOverlay.layout (now empty for gap after Phase H).
- **json-renderer.tsx** (839–846): **spacingOverlay** = when `profile?.spacingScale` and typeKey === "section", **getSpacingForScale(profile.spacingScale, "section")**. That reads [spacing-scales.json](src/04_Presentation/lib-layout/spacing-scales.json), which has **section.layout.gap** per scale (default, luxury, saas, magazine, course). So **template-profiles.spacingScale** → spacing-scales.json → **section gap** is merged into params.
- **json-renderer.tsx** (849–856): **variantParamsOverlay** = section + `profiledNode._variantParams` (from template-profiles.layoutVariants[role].params). Merged via deepMergeParams into final section params.

**Merge order:** resolvedParams → sectionPresetLayoutOverlay → **spacingOverlay** (template spacingScale) → **variantParamsOverlay** (template layoutVariants.params). So both **spacingScale** and **layoutVariants.params** can add or override gap.

### 1.4 Where layout-definitions gap is applied

- Section **layout id** (e.g. "content-narrow") is resolved by getSectionLayoutId; then **resolveLayout(layoutId)** is called (layout-resolver.ts), which uses **layout-definitions** only: getPageLayoutById + resolveComponentLayout → pageLayouts[layoutId] + componentLayouts[layoutId].
- **LayoutMoleculeRenderer** receives that merged layout (containerWidth, contentColumn, moleculeLayout with params.gap, etc.). So **layout-definitions.componentLayouts[layoutId].params.gap** and **contentColumn.gap** are the layout-owned gap. They are applied in LayoutMoleculeRenderer; the **params** passed to the section component are the result of the json-renderer merge above, which can already contain gap from spacingOverlay and variantParamsOverlay. So the **section’s final params** (including moleculeLayout.params) are built in json-renderer and then used by Section compound and LayoutMoleculeRenderer. If the Section passes these params into layout, then gap from template (spacingScale + layoutVariants) is competing with layout-definitions.

(Detailed flow: resolvedNode.params in json-renderer includes merged gap from spacing + variant; Section compound and LayoutMoleculeRenderer receive resolved layout from resolveLayout(layoutId) and also section params. LayoutMoleculeRenderer uses layout from resolveLayout for containerWidth, contentColumn, moleculeLayout; when section params are merged with layout elsewhere, duplicate gap sources apply.)

### 1.5 template-profiles.sections[role]

- **profile.sections** is passed on the profile but **is not read** in getSectionLayoutId or in the json-renderer section path for layout or gap. **template-profiles.sections[role].params.gap** is therefore **not** a current runtime source of section gap in the main JsonRenderer path. It is a parallel definition set only (e.g. for validation or future use). Note: profile-resolver.ts resolveProfileLayout(profileId, role) returns profile.sections[role], but that resolver uses **presentation-profiles.json**, not template-profiles.json.

### 1.6 Summary table — template-profiles influence on section gap

| Source | Consumer | When applied |
|--------|----------|--------------|
| template-profiles.**layoutVariants**[role].params.gap | getSectionLayoutId → _variantParams → variantParamsOverlay → deepMergeParams in renderNode | When ruleApplied === "template layoutVariants" |
| template-profiles.**spacingScale** | getSpacingForScale(profile.spacingScale, "section") → spacing-scales.json section.layout.gap → spacingOverlay → deepMergeParams | When profile.spacingScale is set and typeKey === "section" |
| template-profiles.**sections**[role].params.gap | None in main path | Unused |
| template-profiles.**defaultSectionLayoutId** | getSectionLayoutId (template default path) | Layout selection only; gap then from layout-definitions.componentLayouts |

---

## 2. Compare: template-profiles.json vs layout-definitions.json gap definitions

### 2.1 layout-definitions.json

| Location | Values | Consumer |
|----------|--------|----------|
| **pageLayouts.*.contentColumn.gap** | `"var(--spacing-6)"` (hero-split, hero-split-image-right, hero-split-image-left) | LayoutMoleculeRenderer → contentColumnStyle.gap (split layouts only) |
| **componentLayouts.*.params.gap** | e.g. `var(--spacing-10)`, `var(--spacing-12)`, `var(--spacing-6)`, `var(--spacing-8)` per layout id | resolveLayout → moleculeLayout.params → LayoutMoleculeRenderer (splitLayoutStyle.gap or Sequence/Collection) |
| **templates** | Maps templateId + sectionRole → layoutId (e.g. startup-template: hero, features, content). Optional defaultLayout. | getPageLayoutId, getDefaultSectionLayoutId (page-layout-resolver) |

All layout-definitions gap values use **CSS variables** (`var(--spacing-*)`).

### 2.2 template-profiles.json

| Location | Values | Consumer |
|----------|--------|----------|
| **sections[role].params.gap** | ~308 occurrences; **rem** (e.g. "1rem", "1.25rem", "2rem", "2.5rem", "3rem", "0.5rem", "0.75rem") | None in main render path |
| **layoutVariants[role].params.gap** | When present, any value (token or literal) | _variantParams → variantParamsOverlay → section params |
| **spacingScale** | Id only (default, luxury, saas, magazine, course) | Feeds spacing-scales.json (see below) |

### 2.3 spacing-scales.json (driven by template-profiles.spacingScale)

| Scale | section.layout.gap |
|-------|---------------------|
| default | var(--spacing-md) |
| luxury | var(--spacing-xl) |
| saas | var(--spacing-md) |
| magazine | var(--spacing-lg) |
| course | var(--spacing-md) |

Consumer: getSpacingForScale(profile.spacingScale, "section") in json-renderer → spacingOverlay → deepMergeParams into section params.

### 2.4 Duplicate ownership

- **Section gap** can be set by:
  1. **layout-definitions**: componentLayouts[layoutId].params.gap (and contentColumn.gap for split) when resolveLayout + LayoutMoleculeRenderer apply layout.
  2. **template-profiles.layoutVariants[role].params.gap** when that rule wins, merged into section params before render.
  3. **template-profiles.spacingScale** → spacing-scales.json section.layout.gap, merged into section params.

So there are **up to three** sources that can influence section gap; when both layoutVariants and spacingScale are used, they merge on top of layout-derived params and can override layout-definitions gap.

---

## 3. Report: Duplicate ownership points

- **Layout id** is already hybrid: layout-definitions.templates (template + role), template-profiles.defaultSectionLayoutId, template-profiles.layoutVariants[role].layoutId, override, node.layout, fallback "content-stack".
- **Section params (including gap)** are built by merging, in order: resolvedParams (visual preset, etc.) → sectionPresetLayoutOverlay (visual section layout, gap removed in Phase H) → **spacingOverlay** (template spacingScale → spacing-scales) → **variantParamsOverlay** (template layoutVariants.params). So template-profiles contributes gap via **spacingScale** and **layoutVariants.params**.
- **contentColumn.gap** is only in layout-definitions (pageLayouts.*.contentColumn); no template-profiles equivalent.
- **Duplicate ownership:** Section inner gap (moleculeLayout.params.gap) can come from layout-definitions **and** from template (spacingOverlay + variantParamsOverlay). The merge order means template can override layout-definitions.

---

## 4. Merge path so layout-definitions becomes single authority

1. **Stop merging spacingScale section gap**
   - Option A: In json-renderer, when building spacingOverlay for section, exclude `layout.gap` (e.g. pass a filtered overlay or remove gap from the object returned by getSpacingForScale for section).
   - Option B: Remove **section.layout.gap** from spacing-scales.json so getSpacingForScale(scaleId, "section") no longer returns gap; keep other section spacing (e.g. surface padding) if needed.
   - Result: template-profiles.spacingScale no longer supplies section gap.

2. **Stop merging layoutVariants.params.gap for section**
   - When applying _variantParams in json-renderer (variantParamsOverlay), strip the key `gap` (and optionally other layout-affecting keys like padding if they should be layout-only) so that layoutVariants only supplies non-gap overrides (e.g. containerWidth) or do not merge layoutVariants.params into moleculeLayout.params at all for gap.
   - Result: template-profiles.layoutVariants[role].params.gap no longer overrides layout-definitions.

3. **Keep layout-definitions as the only source of section gap**
   - resolveLayout(layoutId) already provides moleculeLayout.params from layout-definitions.componentLayouts. Ensure that the section’s final moleculeLayout.params.gap used by LayoutMoleculeRenderer comes only from that resolved layout, not from section params merged from template (e.g. ensure Section compound / layout resolution does not overwrite layout-definitions gap with merged section params that include template gap).

4. **template-profiles.sections**
   - Leave as-is (metadata / validation). Do not add a code path that merges sections[role].params.gap into the render path. Optionally document or deprecate sections[role].params for gap so that layout-definitions (and optionally layout-definitions.templates extended per template) is the single authority.

5. **Optional: extend layout-definitions.templates**
   - So that every (templateId, sectionRole) used in practice maps to a layout id in layout-definitions; then template-profiles only supplies defaultSectionLayoutId and layoutVariants.layoutId (no params.gap). Gap for every section then comes only from componentLayouts[layoutId].params.gap.

---

## 5. Estimated stack depth reduction

- **Before:** Section gap can be set by (1) layout-definitions (componentLayouts + contentColumn), (2) variantParamsOverlay (template layoutVariants.params.gap), (3) spacingOverlay (template spacingScale → spacing-scales section.layout.gap). Effective depth: up to **3** sources; merge order can let template override layout.
- **After:** Section gap only from layout-definitions (resolveLayout → componentLayouts.params.gap and contentColumn.gap). Depth: **1** source.
- **Reduction:** **2** layers removed when both layoutVariants and spacingScale were contributing; **1** layer removed when only one of them was. Layout-definitions becomes the single authority for section gap; template-profiles no longer injects gap into section params.

---

End of audit. No code or JSON was modified.
