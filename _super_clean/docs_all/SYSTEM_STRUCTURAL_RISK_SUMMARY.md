# System Structural Risk Summary

**Purpose:** Summarize the four structural audits: rank systems by risk level and override complexity, flag non-deterministic rendering, recommend what must be centralized long-term, and list what is already safe. Read-only; no code changes.

---

## 1. Systems Ranked by Risk Level

| System | Risk level | Justification |
|--------|------------|---------------|
| **Layout choice / section layout id** | **Medium** | Single authority (getSectionLayoutId) and clear ladder (override → node → layoutVariants → template role → template default → "content-stack"). Two competing sources for "template default" (layout-definitions templates.defaultLayout absent; template-profiles defaultSectionLayoutId used). DISABLE_ENGINE_LAYOUT kill switch can change which layout id is applied (finalLayoutId vs layoutId). Section layout preset overrides (state/store) can diverge on rehydration. |
| **Spacing and padding** | **High** | Many competing sources: layout-definitions (pageLayouts contentColumn.gap, componentLayouts params), template-profiles sections[role].params (rem), spacing-scales, visual-presets layout.gap, molecule-layouts defaults/presets, _variantParams (gap stripped for section), shells (raw px), page.tsx, ExperienceRenderer. Section gap is deliberately reserved to layout-definitions but other spacing (card, list, vertical rhythm) has no single authority. Horizontal padding controlled by 6+ layers (layout.tsx, Shells, ExperienceRenderer, LayoutMoleculeRenderer contentInsetX, section params, SurfaceAtom). |
| **Typography and surface tokens** | **Medium** | resolveParams merge order is well defined (visualPreset → variant → size → inline). Multiple sources (visual-presets, palette, node params, size/variant presets); no single typography authority across all components. Surface: LayoutMoleculeRenderer backgroundVariant overlay competes with palette/visual preset surface; otherwise palette + visual preset. |
| **Token resolution and CSS vars** | **Medium** | Two parallel systems: CSS vars (site-theme.css) and palette dot-paths (resolveToken). Duplicate naming (elevation.* vs shadow.*, spacing.stackGap vs var(--spacing-*), radius.sm in CSS vs palette). Raw px/rem in shells and template-profiles bypass tokens. Palette is single resolver for dot-paths when palette is set; CSS vars are single source for var() literals. |
| **Wrapper depth and duplicate dimension control** | **Medium** | Max depth 19 (split section + repeater card to leaf). Horizontal padding and vertical padding each controlled by 5–6+ layers; no single owner. LayoutMoleculeRenderer, Shells, and page all inject layout-related styles. Risk: overlapping padding/gap makes visual debugging and "single owner" refactors hard. |

---

## 2. Systems Ranked by Override Complexity

Count of **distinct sources** that can affect the same visual outcome (from Audits 1–4):

| Outcome | Source count | Competing sources (abbreviated) |
|---------|--------------|----------------------------------|
| **Section inner gap** | 6+ | layout-definitions componentLayouts.params, template-profiles sections.params, spacing-scales, visual-presets layout.gap, molecule-layouts params, _variantParams (stripped for section so layout-definitions wins) |
| **Section/card padding** | 6+ | layout-definitions params, template-profiles params, spacing-scales, visual-presets, LayoutMoleculeRenderer contentInsetX, Shell padding, ExperienceRenderer padding, page content padding, SurfaceAtom params |
| **Section layout id** | 6 | override, node.layout, layoutVariants, template role, template default, fallback "content-stack" |
| **Surface background / shadow** | 4+ | visual-presets surface, palette color/surface, LayoutMoleculeRenderer backgroundVariant, node params.surface |
| **Horizontal padding (page to atom)** | 6+ | layout.tsx, Shell main/aside, ExperienceRenderer, LayoutMoleculeRenderer container contentInsetX, section moleculeLayout.params, SurfaceAtom params |

**Top 5 most complex override chains:**

1. **Section/card padding and gap** — layout-definitions, template-profiles, spacing-scales, visual-presets, molecule-layouts, variant params, shells, page, ExperienceRenderer, LayoutMoleculeRenderer, atoms.
2. **Section layout id** — override store, node.layout, template layoutVariants, layout-definitions templates[role], template-profiles defaultSectionLayoutId, getDefaultSectionLayoutId(templateId), fallback.
3. **Typography (size, weight, lineHeight)** — visual-presets (per molecule type), palette textSize/textWeight/lineHeight/textRole, size preset, variant preset, node params.
4. **Token resolution path** — CSS var literal vs palette dot-path vs raw px/rem; elevation.* vs shadow.*; spacing.stackGap vs var(--spacing-*) vs spacingScale.
5. **Wrapper-controlled dimensions** — horizontal padding, vertical padding, gap, max-width each set by multiple structural layers (page, Shell, ExperienceRenderer, LayoutMoleculeRenderer, section params, atoms).

---

## 3. Non-Deterministic Rendering

Conditions that can make rendering differ run-to-run or by environment:

| Condition | Where | Effect |
|-----------|--------|--------|
| **DISABLE_ENGINE_LAYOUT** | json-renderer.tsx (e.g. line 46, 443) | When true, finalLayoutId = existingLayoutId \|\| templateDefaultLayoutId \|\| layoutId instead of layoutId. So override/template resolution can be bypassed and layout id can differ from getSectionLayoutId result. |
| **Optional layoutId / null layout** | resolveLayout, Section, LayoutMoleculeRenderer | When layoutId is null or resolveLayout returns null, Section passes null to LayoutMoleculeRenderer which renders children without layout wrapper. Different tree shape and styles. |
| **Responsive breakpoint** | molecule-layout-resolver.ts (resolveResponsive) | Uses window.innerWidth; layout flow and params can change by viewport. SSR vs client can differ if breakpoint is used. |
| **Section key empty / anonymous** | section-layout-id.ts, applyProfileToNode | When sectionKey is empty, fallback is used immediately; when missing id/role, anonymous_section_${nodeHash} is generated (json-renderer). Hash is deterministic from node structure but sectionKey affects override lookup; empty vs non-empty changes override applicability. |
| **Palette override vs store** | resolveParams(…, paletteOverride) | When paletteOverride is passed (e.g. palette preview tile), token resolution uses that palette instead of getPalette(). Same node can render different colors/sizes in preview vs main view. |
| **Template default source** | getSectionLayoutId | templateDefaultLayoutId = defaultSectionLayoutIdFromProfile \|\| getDefaultSectionLayoutId(templateId). If profile is missing or template has no defaultSectionLayoutId and layout-definitions has no defaultLayout, fallback "content-stack" is used. Profile vs layout-definitions default can diverge if only one is set. |

---

## 4. Must Be Centralized Long-Term

| System | Recommendation | Suggested single authority / location |
|--------|----------------|--------------------------------------|
| **Layout id resolution** | Already single (getSectionLayoutId). Clarify template default: either layout-definitions templates[templateId].defaultLayout or template-profiles defaultSectionLayoutId as the only source; document and remove dual read. | Keep authority in section-layout-id.ts; feed template default from one source only (e.g. template-profiles only). |
| **Layout definition merge** | Already single (resolveLayout). No change. | layout/resolver + layout-definitions.json. |
| **Token resolution** | Single resolver (resolveToken) but two naming systems (CSS vars vs palette). Document when to use which; consider mapping palette tokens to CSS var names in one layer so one system is canonical. | palette-resolve-token.ts + single palette/theme layer that can emit CSS vars or be consumed by components. |
| **Spacing scale application** | getSpacingForScale is single function but section gap is intentionally not overridden by spacing scale (gap stripped). Document section gap as layout-definitions-only; other spacing (card, list) as visual preset + spacing scale. | lib-layout spacing-scale-resolver + layout-definitions for section gap; visual-presets + spacing-scales for non-section spacing. |
| **Wrapper padding / gap** | Multiple layers set horizontal and vertical padding. Assign one owner per dimension per experience (e.g. "horizontal inset = LayoutMoleculeRenderer contentInsetX only" or "Shell main padding only") and remove or make passive the others. | Designate one layer per dimension (e.g. LayoutMoleculeRenderer for content inset; Shell for chrome padding) and document; remove competing inline padding from other wrappers or make them conditional. |

---

## 5. Already Safe

| System | Why it is safe |
|--------|----------------|
| **Section layout id choice** | getSectionLayoutId is the single authority; one place (section-layout-id.ts); clear priority ladder; fallback "content-stack" is deterministic. |
| **Layout definition (page + component) merge** | resolveLayout(layoutId, context) is the only function that merges pageLayouts and componentLayouts; no duplicate merge logic elsewhere. |
| **Palette token resolution (dot-path)** | resolveToken(path, depth, paletteOverride) is the only resolver for palette dot-paths; single code path; recursion for chained tokens is bounded (MAX_RESOLVE_DEPTH). |
| **Section inner type (column/row/grid)** | Comes only from layout-definitions componentLayouts[layoutId].type; no override after resolution. |
| **Params merge order in JsonRenderer** | Explicit order: visualPreset + cardPreset → resolveParams → sectionPresetLayoutOverlay → spacingOverlay → variantParamsOverlay; section gap stripping is explicit so layout-definitions remains authority for section gap. |
| **LayoutMoleculeRenderer contract** | Only applies values when present (requireLayoutValue / getLayoutValueWithSafeDefault); no invented layout structure; backgroundVariant overlay is explicit. |

---

## 6. Summary Table

| Audit | High-risk areas | Centralization needed | Safe areas |
|-------|-----------------|------------------------|------------|
| State override stack | Spacing (many sources), alignment (many sources) | Spacing: one authority for section gap (done); one for wrapper padding | Layout id ladder, resolveLayout, resolveParams order |
| Token resolution | Duplicate naming (elevation/shadow, spacing/gap), raw bypass | Single token system or clear mapping CSS vars ↔ palette | resolveToken single path, palette as source for dot-paths |
| Layout selection | Template default dual source | Template default from one source only | getSectionLayoutId, componentLayouts.type, resolveLayout |
| Wrapper depth | Horizontal/vertical padding (6+ layers) | One owner per dimension per experience | Depth is deterministic; no random wrappers |
