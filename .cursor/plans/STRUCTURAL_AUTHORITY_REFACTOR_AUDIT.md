# SYSTEM-WIDE STRUCTURAL AUTHORITY REFACTOR AUDIT

**MODE:** Analysis only — no file modifications.  
**GOAL:** Single, accurate authority model and staged refactor plan from real runtime behavior.  
**SOURCE:** HiSense codebase + [DEEP_SYSTEM_AUTHORITY_AUDIT.md](DEEP_SYSTEM_AUTHORITY_AUDIT.md).

---

## STEP 1 — SCAN ALL AUTHORITY LAYERS

### Palettes

| Question | Answer |
|----------|--------|
| **Claims to control** | Color, radius, padding, gap, textSize, textWeight, lineHeight, shadow, fontFamily, surface, textRole, elevation, prominence, transition, interaction, focusRing. |
| **Actually controls at runtime** | Color, radius, typography (size/weight/lineHeight/font), shadow, fontFamily, surface semantics, textRole, elevation, prominence, transition, interaction, focusRing. All via palette-bridge CSS vars and/or resolveToken. |
| **Overridden** | Nothing overrides palette for color/type/radius/shadow; palette is the source. |
| **Never reaches DOM** | Token paths `spacing.*`, `gap.*`, `padding.*` when resolved via resolveToken — they return `"0"`. Palette-bridge still writes --spacing-* and --gap-* to the root, but any component param that references those paths gets 0. |
| **Partially used** | Padding/gap/spacing: written as CSS vars (usable by raw CSS) but intentionally suppressed in param resolution so "layout engine is the only vertical spacing authority." |
| **Dead** | Use of spacing/gap/padding as token paths in params (visual presets, template sections, layoutVariants) — all resolve to 0. |

### Template profiles

| Question | Answer |
|----------|--------|
| **Claims to control** | visualPreset, spacingScale, cardPreset, defaultSectionLayoutId, layoutVariants (layoutId, containerWidth, params), sections (role→layout id + type + params including gap/padding), containerWidth, widthByRole, heroMode, sectionBackgroundPattern. |
| **Actually controls** | visualPreset (→ visual preset overlay), cardPreset (→ card overlay), defaultSectionLayoutId (fallback in getSectionLayoutId), layoutVariants.layoutId and layoutVariants.containerWidth (and non-gap params e.g. maxWidth), sections as role→page layout id (getPageLayoutId). |
| **Overridden** | Section gap/padding from node, spacingScale section.layout.gap, and layoutVariants.params.gap are stripped in json-renderer. Final section vertical spacing comes from LayoutMoleculeRenderer only. |
| **Never reaches DOM** | template-profiles.sections.*.params.gap and .padding (never used for section vertical spacing). layoutVariants.*.params.gap and layout.gap. spacingScale section.layout.gap (stripped before merge). heroMode, sectionBackgroundPattern (not traced to DOM in audit). widthByRole (not traced to resolver). |
| **Partially used** | spacingScale: section.surface from scale can merge, but section.layout.gap is stripped. layoutVariants: layoutId and containerWidth and non-gap params used; gap explicitly stripped. |
| **Dead** | Section spacing/gap/padding defined in template or layoutVariants — all stripped. Spacing-scale section gap — stripped. |

### Layout definitions

| Question | Answer |
|----------|--------|
| **Claims to control** | containerWidth, backgroundVariant, container (width, boxSizing, overflowX, contentInsetX), split, splitLayout, contentColumn, mediaColumn, mediaImageWrapper, mediaImage, slots; componentLayouts type + params (gap, padding, align, justify, columns, etc.). |
| **Actually controls** | containerWidth (→ maxWidth mapping), container (width, margin, boxSizing, overflowX, contentInsetX → horizontal padding), split/mediaSlot, splitLayout, contentColumn, mediaColumn, mediaImage*, backgroundVariant (→ surface), moleculeLayout type and non-spacing params (align, justify, columns, minHeight, etc.). |
| **Overridden** | moleculeLayout.params.gap and .padding are overwritten by resolveSectionSpacing in LayoutMoleculeRenderer. |
| **Never reaches DOM** | componentLayouts.params.gap and .padding for sections (replaced by engine spacing). |
| **Partially used** | moleculeLayout: type, preset, align, justify, columns, minHeight, etc. survive; only gap/padding replaced. |
| **Dead** | Gap/padding in layout-definitions for section column/row — overwritten every time. |

### Visual presets / styling system

| Question | Answer |
|----------|--------|
| **Claims to control** | Per-molecule (section, card, button, list, navigation, stepper, chip, field) surface, title, body, layout (gap), collection.gap, etc. via token paths. |
| **Actually controls** | Surface (background, shadow, radius, transition), title/body (textRole, color, fontFamily), button/card elevation and prominence — all non-spacing token paths resolve. |
| **Overridden** | Merged under variant/size/inline in resolveParams; later, section gap/padding overwritten by engine. |
| **Never reaches DOM** | Any preset value that is spacing.*, gap.*, padding.* — resolveToken returns "0". Section vertical spacing from presets is then overwritten by LayoutMoleculeRenderer anyway. |
| **Partially used** | List/collection gap in presets (e.g. spacing.stackGap, gap.xl) — resolve to 0, so list gap from presets is dead. Section/card surface and typography — alive. |
| **Dead** | All spacing/gap/padding token paths in visual-presets.json for section/list/card layout. UI labels "clean", "minimal", "bold", "soft" have no preset id — fall back to default. |

### Experience profiles

| Question | Answer |
|----------|--------|
| **Claims to control** | Defaults (container, maxWidth, navigation, readingFlow) and sections (role→type+params) per experience (website, app, learning, journal). |
| **Actually controls** | getVisualPresetForMolecule uses experience as fallback when presetName is missing: app→compact, website→default, learning→editorial. Template list filtered by experience (getTemplateList). Experience context drives visibility (website/app/learning) in experience-visibility. |
| **Overridden** | Template profile and state.values.stylingPreset override visualPreset; experience is only a fallback. |
| **Never reaches DOM** | presentation-profiles sections (role→params) are not the same as template-profiles; template-profiles drive getPageLayoutId. Presentation profile section params are not traced as direct DOM source. |
| **Partially used** | Experience as selector for preset and template list; not as direct layout/section geometry. |
| **Dead** | Presentation profile section gap/padding would not reach section engine (template + layout-definitions + engine own that). |

### Behavior profiles

| Question | Answer |
|----------|--------|
| **Claims to control** | "default", "calm", "fast", "educational", "interactive" — implied animation/transition pacing and interaction feel. |
| **Actually controls** | Root wrapper only: class `behavior-${profile}`, data-behavior-profile, data-behavior-transition (calm/fast/default). No engine or layout logic reads behavior. |
| **Overridden** | Nothing overrides it; nothing else uses it. |
| **Never reaches DOM** | Only as class and data attrs on root; no CSS or motion engine wired in audit. educational/interactive get same treatment as default (no distinct logic). |
| **Partially used** | calm/fast/default map to data-behavior-transition; could be used by CSS. |
| **Dead** | educational and interactive — no differentiated behavior. Behavior profile does not drive motion-profile-resolver or any animation engine. |

### Renderer logic

| Question | Answer |
|----------|--------|
| **Claims to control** | Applying profile to node, resolving params, merging overlays, passing layout id to section, visibility, behavior attrs. |
| **Actually controls** | Stripping section params (gap, padding, moleculeLayout, layout, containerWidth, etc.). Stripping layout.gap from spacing overlay and from layoutVariants overlay. Merging visual preset, card preset, spacing overlay (with gap stripped), variant params (with gap stripped). Passing sectionIndex/totalSections to Section for engine spacing. Hardcoded override to layout "content-stack" (testing). |
| **Overridden** | N/A (renderer is the one overriding). |
| **Never reaches DOM** | Section gap/padding from JSON or template or scale or layoutVariants — all stripped or overwritten before they reach Section. |
| **Partially used** | resolveParams runs on merged params; then LayoutMoleculeRenderer overwrites gap/padding for section. |
| **Dead** | — |

### Spacing / section engine

| Question | Answer |
|----------|--------|
| **Claims to control** | "Layout engine is the only vertical spacing authority." |
| **Actually controls** | resolveSectionSpacing(context) in LayoutMoleculeRenderer: paddingTop, paddingBottom, gap from sectionIndex, totalSections, layoutDensityMode (tight/normal/airy/none). SPACING_MODE_TOKEN maps mode to CSS var (e.g. normal→--spacing-10). First/middle/last section logic (half vs full padding). |
| **Overridden** | Nothing overrides engine for section vertical spacing. |
| **Never reaches DOM** | N/A — engine output is what reaches DOM for section vertical spacing. |
| **Partially used** | Horizontal padding is not from engine; it comes from layout.container.contentInsetX. |
| **Dead** | — |

### Bridge layers (palette bridge, token resolvers)

| Question | Answer |
|----------|--------|
| **Claims to control** | palette-bridge: apply palette to CSS vars. resolveToken: resolve path to value. resolveParams: merge presets and resolve all values. |
| **Actually controls** | palette-bridge writes all palette keys to CSS vars (including spacing/gap/padding vars). resolveToken returns "0" for spacing./gap./padding. paths. resolveParams calls resolveToken for every merged param value — so spacing/gap/padding in params become 0. |
| **Overridden** | resolveToken overrides palette for spacing/gap/padding (intentional). |
| **Never reaches DOM** | Values that are token paths for spacing/gap/padding — they become "0" before reaching atoms. |
| **Partially used** | Bridge is foundational; token resolver is the gate that makes palette spacing "dead" in param flow. |
| **Dead** | — |

---

## STEP 2 — TRUE AUTHORITY MAP

**Stack order (strongest → weakest) for who wins at runtime:**

1. **Renderer + engine (explicit overrides)** — Section params stripping; spacing overlay gap strip; layoutVariants gap strip; resolveToken → "0" for spacing/gap/padding; LayoutMoleculeRenderer overwriting gap/padding with resolveSectionSpacing.  
2. **Spacing/section engine** — Section vertical spacing (gap, paddingTop, paddingBottom).  
3. **Layout definitions** — Section horizontal padding (contentInsetX), containerWidth, split, contentColumn/mediaColumn, moleculeLayout type and non-spacing params.  
4. **Template profile (selection only)** — layoutId (via getSectionLayoutId), containerWidth (variant), visualPreset id, cardPreset id, defaultSectionLayoutId. Not geometry from template.  
5. **Visual presets** — Surface, typography, elevation, prominence for section/card/button/list (non-spacing tokens only).  
6. **Palette** — Color, radius, typography primitives, shadow, fontFamily, transition, interaction, focusRing.  
7. **Experience** — Fallback preset (app→compact etc.), template list filter, visibility mode.  
8. **Behavior profile** — Root class and data attrs only; no layout or motion engine.

**Per-concern final controller:**

| Concern | Final controller | Where authority can shift |
|---------|------------------|----------------------------|
| **Color** | Palette (CSS vars + resolveToken) | Nowhere; palette is single source. |
| **Background** | Palette (page.background, color.surface) + layout backgroundVariant (hero-accent/alt/dark) | backgroundVariant in layout-definitions overrides which surface token is used. |
| **Typography** | Palette (textSize, textWeight, lineHeight, fontFamily) + visual preset (textRole selection) | Preset chooses role; palette supplies values. |
| **Elevation** | Palette (shadow, elevation) + visual preset (which elevation token) | Preset selects; palette supplies. |
| **Section vertical spacing** | Spacing/section engine only (resolveSectionSpacing) | All other sources (palette, template, scale, layoutVariants, layout-definitions) are stripped or overwritten. |
| **Horizontal spacing** | Layout definitions (container.contentInsetX) | Single authority; no override. |
| **Layout geometry** | Layout definitions (split, contentColumn, mediaColumn, moleculeLayout type, grid columns, align, justify, minHeight) + engine for gap/padding. | Geometry from layout; gap/padding from engine. |
| **Container widths** | Layout definitions (containerWidth → maxWidth mapping) + layoutVariants.containerWidth. | Template can set containerWidth per role via layoutVariants. |
| **Card styling** | Visual preset (card) + cardPreset + palette (tokens) | Merged in resolveParams; no spacing tokens. |
| **Section styling** | Visual preset (section surface/title) + palette + backgroundVariant | Surface/typography from preset+palette; vertical spacing from engine. |
| **Animation pacing** | Palette (transition.*) + motion-profile-resolver (duration token) | Behavior profile (calm/fast) only sets data attrs; no evidence it drives transition values. |
| **Interaction feel** | Palette (interaction.hover/press/disabled) + TriggerAtom | Behavior profile not wired to interaction tokens. |

---

## STEP 3 — REDUNDANCY DETECTION

| Concept | Defined in | Classification | Notes |
|---------|------------|-----------------|--------|
| **Section vertical spacing** | Palette (padding/gap vars), template sections.params, layoutVariants.params, spacing-scales section.layout.gap, layout-definitions componentLayouts.params | **Competing (resolved by override)** | Five sources; only engine wins. Others are stripped or overwritten. |
| **Section gap in template** | template-profiles.sections.*.params.gap | **Dead** | Stripped in applyProfileToNode; never used. |
| **Section gap in layoutVariants** | layoutVariants[role].params.gap | **Dead** | Stripped before merge. |
| **Section gap in spacing-scale** | spacing-scales.json section.layout.gap | **Dead** | Stripped before merge. |
| **Layout gap in layout-definitions** | componentLayouts.params.gap/padding | **Shadowed** | Defined but overwritten by resolveSectionSpacing. |
| **Preset gap/padding tokens** | visual-presets (list.collection.gap, layout.gap, padding.*) | **Dead** | resolveToken returns "0". |
| **Palette spacing/gap/padding** | Palettes JSON + palette-bridge | **Shadowed** | Written to CSS vars; resolveToken blocks use in params. |
| **Typography** | Palette (textSize, textWeight, lineHeight) + textRole in palette + visual preset (textRole.*) | **Active + layered** | Palette = primitives; preset = role selection; good layering. |
| **Container width** | layout-definitions, layoutVariants.containerWidth | **Active + layered** | Layout is source; template can override per role via variant. |
| **Horizontal padding** | layout-definitions container.contentInsetX only | **Active (single source)** | No redundancy. |
| **Behavior profile** | UI list only; no JSON | **Shadowed** | educational/interactive defined in UI but no engine consumes; calm/fast only as data attrs. |
| **Styling preset labels** | UI: default, clean, minimal, bold, soft, apple | **Shadowed** | clean/minimal/bold/soft not in visual-presets.json; resolve to default. |
| **heroMode, sectionBackgroundPattern** | template-profiles.json | **Shadowed** | In schema; not traced to DOM. |
| **widthByRole** | template-profiles | **Shadowed** | In type; not traced to resolver in audit. |
| **Presentation profile sections** | presentation-profiles.json | **Partially used** | Experience drives preset fallback; section params not used as layout source. |

**Summary:**

- **Active + layered:** Typography (palette + preset), container width (layout + layoutVariants).
- **Competing (bad):** Section vertical spacing — many sources, one winner; others are dead/shadowed in practice.
- **Dead (remove candidate):** Section gap/padding in template sections, layoutVariants, spacing-scale section.layout.gap; preset spacing/gap/padding token paths.
- **Shadowed:** Palette spacing vars (written but param path blocked); layout-definitions gap/padding (overwritten); behavior profile (attrs only); UI styling labels clean/minimal/bold/soft; heroMode, sectionBackgroundPattern, widthByRole.

---

## STEP 4 — LAYER PURPOSE MODEL (IDEAL)

| Layer | Intended role | Foundational? | Additive? | Must NOT override | Only select tokens, not define geometry? |
|-------|----------------|---------------|-----------|-------------------|------------------------------------------|
| **Palette** | Single source for color, typography primitives, radius, shadow, font, transition, interaction. Defines token values only. | Yes | No | Should not override layout or section spacing. | Yes — defines values; should not define section gap/padding in a way that competes with engine. |
| **Template** | Selects layout id and container width per role; selects visual preset and card preset; provides default section layout id. Does not define section vertical spacing. | No | Yes (selects) | Must not override engine for section spacing. | Yes — selects layoutId, preset ids, containerWidth; should not supply gap/padding for sections. |
| **Layout** | Defines section structure (split, columns, container), horizontal padding (contentInsetX), containerWidth, moleculeLayout type and non-spacing params. Does not define section vertical spacing (engine does). | Yes (for structure and horizontal) | No | — | No — defines contentInsetX and geometry; gap/padding for section are overwritten by engine by design. |
| **Styling (visual presets)** | Selects which tokens apply per molecule (surface, title, body, elevation, etc.). Additive over palette. Should not supply spacing tokens for section/list that resolve to 0. | No | Yes | Should not override layout engine. | Yes — selects token paths; should avoid spacing/gap/padding for section (or accept they are 0). |
| **Experience** | Filters templates; fallback for visual preset when preset not set. Does not define layout geometry. | No | Yes | Should not override layout or spacing. | Yes. |
| **Behavior** | Intended: animation/transition pacing and interaction feel. Currently: root class + data attrs only; no engine. | No | Yes (when wired) | Should not override layout or palette. | Yes (select pacing, not geometry). |
| **Renderer** | Applies profile; merges overlays; strips section gap/padding from all non-engine sources; passes context to Section. Enforces "engine is sole vertical spacing authority." | N/A (orchestrator) | — | Should not invent spacing; should enforce single authority. | — |
| **Engine (spacing/section)** | Sole authority for section vertical spacing (gap, padding between sections). Uses context (index, total, density mode). | Yes (for vertical spacing) | No | — | No — defines actual spacing values. |

**Principles:**

- **Foundational:** Palette (values), Layout (structure + horizontal padding), Engine (section vertical spacing).
- **Additive / selective only:** Template (layout id, preset ids, containerWidth), Styling (which tokens), Experience (filter + preset fallback), Behavior (when wired: pacing).
- **Must never override others:** Template and styling must not override engine for section spacing; palette must not override layout for horizontal or engine for vertical.
- **Only select tokens, not define geometry:** Palette defines token values; template and styling select which layout/preset/tokens. Layout and engine define geometry (contentInsetX, section gap/padding).

---

## STEP 5 — FUTURE-SCALE CHECK

**Scale targets:** 100+ apps, 1,000+ screens, multiple industries, multiple experiences (app, website, journal, learning).

| Question | Assessment |
|----------|------------|
| **Is the layering model correct long-term?** | Partially. Clear single authority for section vertical spacing (engine) and horizontal (layout) is good. Palette as single source for color/type is good. Template as selector (layout id, preset id) rather than geometry is correct. Redundancy (five sources for section spacing, all but one dead) is confusing for scaling — many places look like they control spacing but don’t. Cleaning dead definitions and documenting "engine only" will scale better. |
| **Is authority too fragmented?** | For section vertical spacing, authority is intentionally consolidated (engine only), but the system still has many layers that *look* like they control it (template, scale, layoutVariants, layout-definitions). So fragmentation is in *surface area*, not in who wins. Risk: new features add spacing in template or preset and are surprised it has no effect. Recommendation: reduce surface area (remove or repurpose dead spacing in template/scale/preset) and document clearly. |
| **Is renderer over-dominant?** | Renderer is the enforcer of the contract (strip/overwrite). That is appropriate. The hardcoded "content-stack" override and multiple strip points are implementation detail; the design (engine = authority) is correct. Renderer could be simplified once dead paths are removed. |
| **Are palettes overpowered or correctly positioned?** | Correctly positioned as source for color/type/radius/shadow. Palette is intentionally *not* allowed to control section spacing via params (resolveToken returns 0). So palettes are not overpowered; they are gated. The only oddity is palette-bridge still writing spacing vars to DOM (usable by raw CSS) while param resolution blocks them — acceptable if documented. |

**Verdict:** Architecture is suitable for scale if: (1) dead spacing definitions are removed or clearly marked as "not used for section spacing," (2) behavior profile is either wired to motion/transition or documented as "attrs only," (3) UI styling labels are aligned with visual-presets.json (or presets added for clean/minimal/bold/soft). Authority is not too fragmented in practice; cleanup of redundant definitions will reduce confusion.

---

## STEP 6 — SAFE REFACTOR STRATEGY

**Principles:** No breaking runtime behavior; incremental; reversible.

### Phase 1 — Authority consolidation map

- **Actions:** Publish a single "authority map" doc (this audit + true authority stack). List for each concern the single final controller and where to change it. Add comments in code at strip/overwrite points: "Section vertical spacing: engine only; this strip enforces that."
- **Risk:** None (doc only).  
- **Reversible:** N/A.

### Phase 2 — Dead token cleanup plan

- **Actions:** (1) Remove or stop writing spacing/gap/padding token paths in visual-presets for section/list layout (or document that they resolve to 0). (2) Remove section.layout.gap from spacing-scales.json for section (already stripped; removing avoids confusion). (3) Optionally: remove gap/padding from template-profiles.sections.*.params and layoutVariants.params in JSON (or mark in schema as "not used for section spacing"). (4) Align UI styling preset list with visual-presets.json: either add presets for clean/minimal/bold/soft or remove those labels.
- **Risk:** Low if only removing unused JSON or aligning UI to existing presets.  
- **Reversible:** Restore JSON and UI list if needed.

### Phase 3 — Layer role corrections

- **Actions:** (1) In template-profiles type/docs: state that sections and layoutVariants must not be used to define section vertical spacing (layoutId and containerWidth only for layoutVariants). (2) In visual-presets: avoid spacing/gap/padding for section; use only for non-section molecules if needed, with caveat that resolveToken returns 0 for those paths. (3) Document behavior profile as "root class + data attrs; future: wire to transition/motion if desired."
- **Risk:** Low (documentation and schema/docs).  
- **Reversible:** Yes.

### Phase 4 — Engine integration alignment

- **Actions:** (1) Ensure spacingMode (tight/normal/airy/none) is consistently sourced (URL vs prop vs state) and documented. (2) Single export for resolveSectionSpacing and SPACING_MODE_TOKEN so all section vertical spacing flows from one module. (3) No new sources of section gap/padding (no new layers writing to section params).
- **Risk:** Low if no behavior change.  
- **Reversible:** Yes.

### Phase 5 — Optional simplification pass

- **Actions:** (1) Remove hardcoded "content-stack" override in json-renderer when no longer needed for testing. (2) Consider one "section spacing config" (e.g. layout-definitions or a dedicated spacing config) that only the engine reads, so layout-definitions.componentLayouts no longer carry gap/padding that get overwritten. (3) Optionally wire behavior profile to motion-profile-resolver (e.g. calm→slow, fast→fast duration).
- **Risk:** Medium for (2)–(3) (design change).  
- **Reversible:** Revert code and config.

---

## STEP 7 — FINAL OUTPUT

### True authority stack diagram

```
Strongest
    │
    ▼  Renderer (strip/overwrite) + resolveToken(spacing|gap|padding → "0")
    │
    ▼  Spacing/section engine (resolveSectionSpacing)  ← SECTION VERTICAL SPACING
    │
    ▼  Layout definitions (contentInsetX, containerWidth, split, moleculeLayout type/params)
    │   ← SECTION HORIZONTAL PADDING, STRUCTURE
    │
    ▼  Template profile (layoutId, containerWidth variant, visualPreset id, cardPreset id)
    │
    ▼  Visual presets (surface, typography, elevation — non-spacing tokens)
    │
    ▼  Palette (color, radius, typography, shadow, font, transition, interaction)
    │
    ▼  Experience (preset fallback, template filter)
    │
    ▼  Behavior profile (root class + data attrs only)
    │
Weakest
```

### Redundancy report

- **Section vertical spacing:** 5 definitions (palette vars, template sections, layoutVariants, spacing-scale, layout-definitions); 1 winner (engine). Others: strip or overwrite → **competing, consolidate by cleanup.**
- **Preset/palette spacing tokens:** In presets and palette; resolve to 0 in params → **dead in param flow; remove from presets or document.**
- **UI styling labels:** clean, minimal, bold, soft not in visual-presets → **shadowed (fallback to default); align UI to JSON or add presets.**
- **Behavior profile:** educational/interactive no distinct logic → **shadowed; wire or document.**

### Dead system list

- Section gap/padding in template-profiles.sections.*.params.
- Section gap/padding in layoutVariants[role].params (and layout.gap in variant).
- spacing-scales.json section.layout.gap (stripped before merge).
- componentLayouts.params.gap and .padding for section (overwritten by engine).
- Any visual-preset value that is a spacing./gap./padding.* token path (resolveToken → "0").
- heroMode, sectionBackgroundPattern (not wired to DOM in audit).
- widthByRole (not traced to resolver).
- Behavior profile beyond root class/attrs (no engine consumption).

### Ideal layer role definitions

- **Palette:** Foundational. Token values only. Does not control section spacing in param path.
- **Template:** Additive. Selects layout id, preset ids, defaultSectionLayoutId, containerWidth per role. Does not define section vertical spacing.
- **Layout:** Foundational. Structure, contentInsetX, containerWidth, moleculeLayout type and non-spacing params. Section gap/padding supplied by engine only.
- **Styling:** Additive. Selects tokens per molecule (surface, typography, elevation). No section spacing tokens (or accept 0).
- **Experience:** Additive. Template filter and preset fallback. No geometry.
- **Behavior:** Additive. Root attrs (and, when wired, pacing). No layout/geometry.
- **Renderer:** Enforces contract (strip/overwrite). Does not define spacing.
- **Engine:** Foundational. Sole authority for section vertical spacing.

### Refactor roadmap

| Phase | Focus | Deliverable |
|-------|--------|-------------|
| **1** | Authority consolidation map | Single doc + code comments at strip/overwrite points. |
| **2** | Dead token cleanup | Remove or document dead spacing in presets/scales/template; align UI styling list to presets. |
| **3** | Layer role corrections | Schema/docs: template and preset must not define section spacing; behavior = attrs (optional future wiring). |
| **4** | Engine integration alignment | Single source for spacingMode; single module for resolveSectionSpacing; no new section spacing sources. |
| **5** | Optional simplification | Remove content-stack override; optional single spacing config for engine; optional behavior→motion wiring. |

---

*Analysis only; no files modified. All conclusions from HiSense codebase and DEEP_SYSTEM_AUTHORITY_AUDIT.md.*
