# DEEP SYSTEM AUTHORITY AUDIT

Validation and enumeration pass against the HiSense codebase: what each styling layer controls, what reaches DOM/runtime, and what is dead/overridden/redundant.

---

## 1) PALETTES

### 1.1 Union of keys across all palette JSON files

Palette files: `src/04_Presentation/palettes/*.json` (default, apple, crazy, dark, elderly, french, hiclarify, kids, playful, premium, spanish, ui-atom-token).

**Top-level categories and keys (union):**

| Category | Keys | In palette-bridge? | In resolveToken? | Hardcoded bypasses |
|----------|------|-------------------|------------------|---------------------|
| **page** | background, foreground | Yes — `--color-bg-primary` from page.background; fallback from color.surface | No direct path | — |
| **color** | surface, surfaceVariant, surfaceHero, primary, primaryVariant, onPrimary, onSurface, outline, outlineVariant, outlineStrong, secondary, error, errorContainer, onErrorContainer | Yes — all mapped to CSS vars (e.g. --color-primary, --color-bg-secondary, --color-text-primary, --color-border, etc.) | Yes — any `color.*` path | — |
| **radius** | none, sm, md, lg, xl, pill | Yes — --radius-sm/md/lg/xl (px→rem) | Yes | — |
| **padding** | none, xs, sm, md, lg, xl, 2xl, 3xl | Yes — --spacing-xs/sm/md/lg/xl/2xl/3xl + --spacing-1/2/6/8/12 | **No at runtime** — see 1.3 | — |
| **gap** | xs, sm, md, lg, xl, 2xl, 3xl | Yes — --gap-xs/sm/md/lg/xl/2xl/3xl | **No at runtime** — see 1.3 | — |
| **textSize** | xs, sm, md, lg, xl, display, headline, title, bodyLg, body, caption | Yes — --font-size-* | Yes | — |
| **textWeight** | regular, medium, semibold, bold | Yes — --font-weight-normal/medium/semibold/bold | Yes | — |
| **lineHeight** | tight, normal, relaxed | Yes — --line-height-* | Yes | — |
| **shadow** | none, sm, md, lg | Yes — --shadow-sm/md/lg/xl | Yes | — |
| **fontFamily** | base, sans, heading, mono | Yes — --font-family-* | Yes | — |
| **surface** | app, section, card, elevated, base, variant, hero, primary, secondary, raised | Not written as CSS vars by palette-bridge | Yes (e.g. surface.section) | — |
| **text** | primary, muted, strong | Not in bridge | Yes | — |
| **accent** | primary, soft | Not in bridge | Yes | — |
| **border** | soft, strong | Not in bridge | Yes | — |
| **spacing** | sectionPadding, cardPadding, inlinePadding, stackGap, inlineGap, compactGap | Not in bridge | **No** — token paths spacing.* return "0" | — |
| **opacity** | full, dim, low | Not in bridge | Yes if used | — |
| **borderWidth** | none, sm, md | Not in bridge | Yes | — |
| **size** | xs, sm, md, lg | Not in bridge | Yes | — |
| **textRole** | display, headline, title, subtitle, bodyLg, body, label, caption (each: size, weight, lineHeight, letterSpacing, color) | Not in bridge | Yes — used by visual-presets and TextAtom | — |
| **surfaceTier** | base, raised, overlay, floating (background, shadow) | Not in bridge | Yes — in visual-presets | — |
| **elevation** | 0–4, none, low, mid, strong, float, shadowSoft, shadowStrong | Not in bridge | Yes — in visual-presets | — |
| **prominence** | primary, secondary, tertiary (background, color) | Not in bridge | Yes — in visual-presets | — |
| **transition** | fast, base, slow, none | Not in bridge | Yes — SurfaceAtom, TriggerAtom, motion-profile-resolver | — |
| **transform** | hoverLift | Not in bridge | Yes — TriggerAtom | — |
| **interaction** | hover, press, disabled (opacity, scale, lift) | Not in bridge | Yes — TriggerAtom | — |
| **focusRing** | color, width, offset (in some palettes: playful, french, kids, elderly, spanish) | Not in bridge | Yes — [focus-ring.tsx](src/04_Presentation/components/atoms/focus-ring.tsx) | — |

### 1.2 palette-bridge: what is written to CSS vars

Single function: `setPaletteVarsOnElement(root, palette)` in [palette-bridge.tsx](src/06_Data/site-renderer/palette-bridge.tsx). It writes:

- **Page/color:** --color-bg-primary, --color-primary, --color-primary-hover, --color-bg-secondary, --color-surface-1, --color-surfaceVariant, --color-surface-hero-accent, --color-text-primary, --color-text-secondary, --color-border, --color-bg-muted, --color-accent (if error), --color-surface-dark, --color-on-surface-dark, --color-on-primary
- **Radius:** --radius-sm/md/lg/xl (converted to rem)
- **Padding:** --spacing-xs/sm/md/lg/xl/2xl/3xl, --spacing-1/2/6/8/12
- **Gap:** --gap-xs/sm/md/lg/xl/2xl/3xl
- **Text:** --font-size-xs/sm/base/lg/xl/display/headline/title/body-lg/body/caption, --font-weight-normal/medium/semibold/bold, --line-height-tight/normal/relaxed
- **Shadow:** --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
- **Font:** --font-family-base/sans/heading/mono

So palette-bridge does write spacing/gap/padding vars to the root; they are available as CSS variables. But resolveToken still returns "0" for those paths when used in params (see 1.3).

### 1.3 "spacing/gap/padding return '0'" — exact code and callers

**Exact code branch:** [palette-resolve-token.ts](src/03_Runtime/engine/core/palette-resolve-token.ts) lines 24–27:

```ts
if (path.startsWith("spacing.") || path.startsWith("gap.") || path.startsWith("padding.")) {
  return "0";
}
```

**Callers impacted (any use of resolveToken with spacing/gap/padding paths):**

- **palette-resolver.ts** — `resolveParams()` calls `resolveToken(merged[key], 0, paletteOverride)` for every param. So any param value that is a string like `"spacing.md"`, `"gap.lg"`, or `"padding.sm"` becomes `"0"`.
- **sequence.tsx** — `tok(p.gap)` / `tok(p.padding)` → resolveToken; gap/padding from params that are token paths become "0". SequenceAtom also forces gap="0" when `!p?.gap`.
- **collection.tsx** — `toCssGapOrPadding(params.gap)` / `params.padding` → resolveToken; same effect. CollectionAtom forces gap="0" when `!params?.gap`.
- **surface.tsx** — `resolveToken(params.padding)` → "0" if param is e.g. "padding.md".
- **field.tsx** — `resolveToken(params.padding)` → "0" for padding token paths.
- **shell.tsx** — `resolveToken(params.padding)` → "0".
- **grid-layout.tsx, row-layout.tsx, column-layout.tsx** (lib-layout) — pass values through resolveToken; gap/padding token paths become "0".
- **visual-presets.json** — many presets reference `spacing.stackGap`, `spacing.inlineGap`, `gap.xl`, `gap.lg`, `padding.xl`, `padding.md`, etc. Those values are merged into params and then resolved by resolveParams → all become "0" at runtime for vertical/section usage (and layout engine overwrites section gap/padding anyway).

So: palette spacing/gap/padding **keys** are in JSON and written to CSS vars by palette-bridge, but **resolveToken** intentionally returns "0" for those paths so that "layout engine is the only vertical spacing authority."

### 1.4 Files referencing palette keys or resolveToken

**resolveToken import / usage:**

- [src/03_Runtime/engine/core/palette-resolve-token.ts](src/03_Runtime/engine/core/palette-resolve-token.ts) — definition
- [src/03_Runtime/engine/core/palette-resolver.ts](src/03_Runtime/engine/core/palette-resolver.ts) — resolveParams
- [src/04_Presentation/diagnostics/PaletteContractInspector.tsx](src/04_Presentation/diagnostics/PaletteContractInspector.tsx)
- [src/04_Presentation/components/atoms/collection.tsx](src/04_Presentation/components/atoms/collection.tsx)
- [src/04_Presentation/components/atoms/sequence.tsx](src/04_Presentation/components/atoms/sequence.tsx)
- [src/04_Presentation/components/atoms/surface.tsx](src/04_Presentation/components/atoms/surface.tsx)
- [src/04_Presentation/components/atoms/field.tsx](src/04_Presentation/components/atoms/field.tsx)
- [src/04_Presentation/components/atoms/shell.tsx](src/04_Presentation/components/atoms/shell.tsx)
- [src/04_Presentation/components/atoms/text.tsx](src/04_Presentation/components/atoms/text.tsx)
- [src/04_Presentation/components/atoms/spinner.tsx](src/04_Presentation/components/atoms/spinner.tsx)
- [src/04_Presentation/components/atoms/focus-ring.tsx](src/04_Presentation/components/atoms/focus-ring.tsx)
- [src/04_Presentation/components/atoms/skeleton.tsx](src/04_Presentation/components/atoms/skeleton.tsx)
- [src/04_Presentation/components/atoms/trigger.tsx](src/04_Presentation/components/atoms/trigger.tsx)
- [src/04_Presentation/lib-layout/molecules/grid-layout.tsx](src/04_Presentation/lib-layout/molecules/grid-layout.tsx)
- [src/04_Presentation/lib-layout/molecules/row-layout.tsx](src/04_Presentation/lib-layout/molecules/row-layout.tsx)
- [src/04_Presentation/lib-layout/molecules/column-layout.tsx](src/04_Presentation/lib-layout/molecules/column-layout.tsx)
- [src/04_Presentation/engine/motion/motion-profile-resolver.ts](src/04_Presentation/engine/motion/motion-profile-resolver.ts)
- [src/04_Presentation/diagnostics/paletteTokenInspector.ts](src/04_Presentation/diagnostics/paletteTokenInspector.ts)
- [src/07_Dev_Tools/diagnostics/SpacingAuditPanel.tsx](src/07_Dev_Tools/diagnostics/SpacingAuditPanel.tsx)
- [src/02_Contracts_Reports/contracts/param-key-mapping.test.ts](src/02_Contracts_Reports/contracts/param-key-mapping.test.ts)

**Palette structure (page/color/radius/padding/gap/textSize/...):**

- [src/06_Data/site-renderer/palette-bridge.tsx](src/06_Data/site-renderer/palette-bridge.tsx) — reads and writes CSS vars
- [src/07_Dev_Tools/diagnostics/SpacingAuditPanel.tsx](src/07_Dev_Tools/diagnostics/SpacingAuditPanel.tsx) — reads palette.padding
- [src/07_Dev_Tools/diagnostics/pipeline/palette/contract.ts](src/07_Dev_Tools/diagnostics/pipeline/palette/contract.ts) — contract checks for color, radius, padding, textSize, textWeight

---

## 2) TEMPLATE PROFILES

### 2.1 Fields in template-profiles.json and spacing-scales.json

**template-profiles.json** (array of profile objects). Per [template-profiles.ts](src/04_Presentation/lib-layout/template-profiles.ts) and JSON:

- **id** — string
- **label** — string
- **experience** — "website" | "journal" | "app" | "learning" | "dashboard" (optional)
- **visualPreset** — string (id in visual-presets.json)
- **sections** — Record&lt;role, LayoutDef&gt;; LayoutDef: type (row|column|grid|stack), params (gap, columns, align, justify, padding, wrap, width, maxWidth)
- **layoutVariants** — optional Record&lt;role, LayoutVariant&gt;; LayoutVariant: layoutId, containerWidth?, params?
- **defaultSectionLayoutId** — optional string
- **containerWidth** — optional ContainerWidth
- **widthByRole** — optional Record&lt;role, ContainerWidth&gt;
- **spacingScale** — optional "default" | "luxury" | "saas" | "magazine" | "course"
- **cardPreset** — optional CardPresetId
- **heroMode** — optional HeroMode
- **sectionBackgroundPattern** — optional SectionBackgroundPattern

**spacing-scales.json** (keyed by scale id):

- **default, luxury, saas, magazine, course** — each has:
  - **section** — surface ({}), layout.gap (e.g. "var(--spacing-md)")
  - **card** — surface ({})

### 2.2 Consumption: where each field enters runtime and terminates

| Field | Enters runtime | Terminates / effect |
|-------|----------------|---------------------|
| id | page.tsx (getTemplateProfile), layout-store / state.values.templateId | Profile selection; passed to getSectionLayoutId, JsonRenderer |
| label | getTemplateList() → UI (RightFloatingSidebar, ControlDock) | Display only |
| experience | state.values.experience; template filter in getTemplateList | Filters template list; getVisualPresetForMolecule fallback (app→compact, website→default, learning→editorial) |
| visualPreset | profile.visualPreset; overridden by state.values.stylingPreset in page.tsx | getVisualPresetForMolecule → overlay merged into params → resolveParams → atoms |
| sections | getPageLayoutId(templateId, sectionRole) in layout/page | Maps section role → page layout id (hero→hero-split etc.); template-profiles.sections used for role→layout id; section params (gap, padding) in sections are **not** used for section vertical spacing (stripped in applyProfileToNode) |
| layoutVariants | getSectionLayoutId(..., templateProfile) | section-layout-id.ts: layoutVariants[nodeRole] → layoutId, variantParams, variantContainerWidth. variantParams merged in json-renderer but **gap stripped** (see 2.3) |
| defaultSectionLayoutId | getSectionLayoutId fallback chain | When no override, no node.layout, no layoutVariant, no template role → use this |
| containerWidth | layout-definitions (page def); layoutVariants.containerWidth | resolveLayout → pageDef.containerWidth; variantContainerWidth applied to section; LayoutMoleculeRenderer → outerStyle.maxWidth / container |
| widthByRole | Referenced in template-profiles type | Not traced to resolver in audit; likely template/page mapping layer |
| spacingScale | profile.spacingScale → getSpacingForScale(profile.spacingScale, "section") | spacing-scale-resolver returns section.{ surface, layout }. **Section gap from layout is stripped** in json-renderer before merge (2.3) |
| cardPreset | profile.cardPreset → getCardPreset() | Card preset overlay (surface, etc.) merged into card params in json-renderer |
| heroMode, sectionBackgroundPattern | In JSON schema | Not traced to DOM in this audit |

### 2.3 Section gap/padding stripped in json-renderer — exact lines and logic

**CONFIRMED.** Three mechanisms:

**A) Section params stripped in applyProfileToNode**  
[json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx) lines 371–384:

```ts
if (isSection && next.params && typeof next.params === "object") {
  const p = next.params as Record<string, unknown>;
  delete p.moleculeLayout;
  delete p.layoutPreset;
  delete p.layout;
  delete p.containerWidth;
  delete p.backgroundVariant;
  delete p.split;
  delete p.gap;
  delete p.padding;
}
```

So for sections, gap and padding are removed from node.params before any further merge.

**B) Spacing overlay: section gap removed from getSpacingForScale result**  
Lines 548–559: when building spacingOverlay from getSpacingForScale(profile.spacingScale, "section"), if the result has layout.gap, that gap is explicitly stripped:

```ts
const spacingOverlay =
  typeKey === "section" && spacingOverlayRaw?.layout && "gap" in spacingOverlayRaw.layout
    ? (() => {
        const { layout, ...rest } = spacingOverlayRaw;
        const { gap: _sectionGap, ...layoutRest } = layout as Record<string, unknown>;
        return { ...rest, layout: layoutRest };
      })()
    : spacingOverlayRaw;
```

So spacing-scale section layout.gap never reaches section params.

**C) layoutVariants params: gap stripped from variant params**  
Lines 594–608: rawVariantParams from getSectionLayoutId (layoutVariants[nodeRole].params) are merged, but gap (and layout.gap) are stripped:

```ts
const variantParamsOverlay =
  typeKey === "section" && rawVariantParams && (rawVariantParams.gap != null || (rawVariantParams as any).layout?.gap != null)
    ? (() => {
        const { gap: _g, layout, ...rest } = rawVariantParams as Record<string, unknown>;
        const out: Record<string, unknown> = { ...rest };
        if (layout && typeof layout === "object" && layout !== null) {
          const { gap: _lg, ...layoutRest } = layout as Record<string, unknown>;
          out.layout = layoutRest;
        }
        return out;
      })()
    : rawVariantParams;
```

So layoutVariants by role: layoutId and containerWidth are used; params are merged but gap (and layout.gap) are stripped. Other params (e.g. maxWidth) can survive.

### 2.4 layoutVariants usage per role — what is stripped vs preserved

- **Stripped:** gap, layout.gap (and thus any section vertical spacing from template or layoutVariants).
- **Preserved:** layoutId, containerWidth, and other params (e.g. maxWidth) from LayoutVariant. Preserved params are merged via deepMergeParams into section params; then resolveParams runs (and resolveToken still forces spacing/gap/padding paths to "0"). Final section vertical spacing is set only in LayoutMoleculeRenderer by resolveSectionSpacing (engine-owned).

---

## 3) LAYOUT SYSTEM

### 3.1 Fields/params in layout-definitions.json

**Source:** [layout-definitions.json](src/04_Presentation/layout/data/layout-definitions.json).

**pageLayouts** (keys): hero-centered, hero-split, hero-split-image-right, hero-split-image-left, hero-full-bleed-image, content-narrow, content-stack, image-left-text-right, features-grid-3, testimonial-band, cta-centered, test-extensible, none.

**Per page layout entry (union):**

- **containerWidth** — "wide" | "full" | "narrow" | "contained" etc.
- **backgroundVariant** — "hero-accent" | "default"
- **container** — width, boxSizing, overflowX, **contentInsetX** (e.g. "var(--spacing-6)")
- **split** — type "split", mediaSlot "left" | "right"
- **splitLayout** — display, gridTemplateColumns, alignItems, maxWidth, minWidth
- **contentColumn** — display, flexDirection, gap, alignItems, minWidth
- **mediaColumn** — display, minHeight, overflow, alignItems, width, maxWidth
- **mediaImageWrapper** — maxHeight, overflow, width, maxWidth, height, minHeight
- **mediaImage** — width, maxWidth, height, objectFit, display
- **slots** — content, media, footer (content-stack)

**componentLayouts** (same keys as pageLayouts): each has **type** (column|row|grid), **preset** (null), **params** — gap, align, justify, padding, columns (grid), minHeight, etc. Note: componentLayouts.params.gap and .padding are **overwritten** by LayoutMoleculeRenderer with engine spacing (see 3.3).

### 3.2 Which params survive to LayoutMoleculeRenderer outputs

- **From layout (resolveLayout):** containerWidth, split, backgroundVariant, moleculeLayout (type, preset, params), container (width, marginLeft, marginRight, boxSizing, overflowX, contentInsetX), contentColumn, mediaColumn, mediaImageWrapper, mediaImage, splitLayout, slots.
- **Survive to DOM:** container → outerStyle (width, marginLeft, marginRight, boxSizing, overflowX, maxWidth from containerWidth mapping, **contentInsetX → paddingLeft/paddingRight**). Surface (backgroundVariant → surfaceWithVariant). moleculeLayout → resolved (display, direction, etc.) but **gap and padding overwritten** by resolveSectionSpacing. contentColumn/mediaColumn/splitLayout/mediaImageWrapper/mediaImage → applied to inner divs. So horizontal padding comes from layout.container.contentInsetX; vertical section spacing does not come from layout-definitions params, it comes from resolveSectionSpacing.

### 3.3 resolveSectionSpacing overwrites gap/padding — exact code and final values

**CONFIRMED.** [LayoutMoleculeRenderer.tsx](src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx) lines 42–75 define `resolveSectionSpacing(context)`. It returns paddingTop, paddingBottom, gap from context (sectionIndex, totalSections, layoutDensityMode). Lines 318–325:

```ts
const engineSpacing = resolveSectionSpacing({
  index: sectionIndex,
  totalSections: Math.max(1, totalSections),
  hasMultipleSections: totalSections > 1,
  layoutDensityMode: isNoLayoutMode ? "none" : spacingMode,
});
const gap = isNoLayoutMode ? "0" : engineSpacing.gap;
const padding = isNoLayoutMode ? "0" : `${engineSpacing.paddingTop} 0 ${engineSpacing.paddingBottom}`;
if (resolved != null) {
  resolved = { ...resolved, gap, padding };
}
```

So whatever was in moleculeLayout.params (from layout-definitions or merges) for gap/padding is replaced by engine values. Final computed values: from SPACING_MODE_TOKEN (tight→--spacing-6, normal→--spacing-10, airy→--spacing-16, none→0); then first/middle/last section logic (half padding between, full at edges). Horizontal padding is not from resolveSectionSpacing; it comes from container.contentInsetX on the outer wrapper.

---

## 4) STYLING / VISUAL PRESETS

### 4.1 Preset ids and schema in visual-presets.json

**Preset ids:** default, compact, spacious, prominent, editorial, elevated, floating, depth-base, depth-raised, depth-overlay, depth-floating, media-player, apple, apple-floating-journal.

**Schema (per preset):** Keys are molecule types: **section**, **card**, **button**, **list**, **navigation**, **pricingtable**, **stepper**, **chip**, **field**. Each value is an object with nested keys, e.g.:

- **section:** surface (background, shadow, radius, transition, padding?), title (size, weight, lineHeight, letterSpacing, color, fontFamily)
- **card:** surface, title, body
- **button:** surface (radius, transition, background?, color?, shadow?, padding?)
- **list:** collection.gap, layout.gap, surface
- **stepper:** surface, step, activeStep
- **chip:** surface, text
- **field:** field (radius, padding), label

Values are token paths (e.g. "surface.section", "elevation.none", "textRole.title.size", "spacing.stackGap", "gap.xl"). These are resolved by resolveParams → resolveToken. So any path starting with spacing./gap./padding. becomes "0" (dead for spacing).

### 4.2 Which preset fields resolve via resolveToken and which are dead

- **Alive:** color.*, radius.*, shadow.*, elevation.*, surface.*, surfaceTier.*, textRole.*, fontFamily.*, transition.*, borderWidth.*, prominence.* — all resolve to palette values (or refs that resolve).
- **Dead for spacing:** Any preset value that is a token path like spacing.*, gap.*, padding.* → resolveToken returns "0". So list collection.gap, layout.gap, spacious list gap.xl/gap.lg, section layout.padding in presets that use token paths — those values become "0" at runtime. Section vertical spacing is also overwritten by LayoutMoleculeRenderer.

### 4.3 Style labels in UI not backed by JSON

- **Styling preset panel:** [RightFloatingSidebar.tsx](src/app/ui/control-dock/RightFloatingSidebar.tsx) line 66: `STYLING_PRESETS = ["default", "clean", "minimal", "bold", "soft", "apple"]`. [RightSidebarDockContent.tsx](src/app/ui/control-dock/RightSidebarDockContent.tsx) line 14 same. [ControlDock.tsx](src/app/ui/control-dock/ControlDock.tsx) line 366: `["default", "clean", "minimal", "bold", "soft"]` (no "apple").
- **visual-presets.json** has no keys "clean", "minimal", "bold", "soft". So those four (and "apple" only in sidebar) are UI-only labels. When user selects "clean"/"minimal"/"bold"/"soft", state.values.stylingPreset is set; page.tsx sets effectiveProfile.visualPreset = stylingOverride ?? templateProfile.visualPreset. getVisualPresetForMolecule(presetName) then looks up that id in visual-presets.json; missing id falls back to PRESETS.default. So "clean", "minimal", "bold", "soft" all resolve to the **default** visual preset at runtime.

---

## 5) EXPERIENCE + BEHAVIOR LAYERS

### 5.1 presentation-profiles.json schema and effect

**File:** [presentation-profiles.json](src/04_Presentation/lib-layout/presentation-profiles.json). Keys: **website**, **app**, **learning**, **journal**. Each has:

- id, visualPreset, description
- defaults: container, maxWidth, navigation, readingFlow
- sections: role → { type, params } (e.g. header type row, params gap/justify/align)

**Effect:** Used as experience-type defaults (e.g. website vs app). getVisualPresetForMolecule uses experience to choose preset when presetName is not set: app→compact, website→default, learning→editorial. Presentation profile sections are not the same as template-profiles.sections; template-profiles drive getPageLayoutId and section layout id. Presentation profiles are a secondary source for experience-based defaults.

### 5.2 Behavior profile system: where defined, stored, read, consumers

- **Defined (labels):** [RightFloatingSidebar.tsx](src/app/ui/control-dock/RightFloatingSidebar.tsx) line 67: `BEHAVIOR_PROFILES = ["default", "calm", "fast", "educational", "interactive"]`. Same in RightSidebarDockContent and ControlDock. No separate JSON; list is hardcoded in UI.
- **Stored:** state.values.behaviorProfile (set by setValue("behaviorProfile", profile) in control-dock).
- **Read:** [json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx) line 1468: `behaviorProfile = behaviorProfileProp ?? (rawState?.values?.behaviorProfile as string) ?? "default"`. Also page.tsx, ExperienceRenderer, RightFloatingSidebar, RightSidebarDockContent, RightSidebarDock, ControlDock.
- **Consumers:** JsonRenderer applies it only on the root wrapper: `className={rootClassName}` with `behavior-${behaviorProfile}`, and `data-behavior-profile={behaviorProfile}`, `data-behavior-transition={behaviorTransition}`. getBehaviorTransitionHint(profile) returns "calm" | "fast" | "default". So **no other runtime consumer** than root class and data attrs; CSS or analytics can use these. No evidence of educational/interactive changing logic beyond the same class/attrs.

### 5.3 Mode/behavior/experience selectors in UI → state keys and render pipeline

| UI concept | State key | Render pipeline |
|------------|-----------|------------------|
| Experience | state.values.experience | getTemplateList(experience), getVisualPresetForMolecule(,, experience), experience context for visibility (website/app/learning) |
| Template | state.values.templateId | getTemplateProfile → profileOverride → applyProfileToNode, getSectionLayoutId, getSpacingForScale, getVisualPresetForMolecule |
| Styling preset | state.values.stylingPreset | page.tsx overrides profile.visualPreset → getVisualPresetForMolecule → resolveParams |
| Behavior profile | state.values.behaviorProfile | JsonRenderer root: class + data-behavior-profile + data-behavior-transition |
| Palette | state.values.paletteName / palette-store | usePaletteCSS, applyPaletteToElement, resolveToken(paletteOverride) |
| Layout (section/card overrides) | sectionLayoutPresetOverrides, cardLayoutPresetOverrides (from store/snapshot) | applyProfileToNode, renderNode |

---

## 6) RENDERER AUTHORITY OVERRIDES

Places the renderer overrides or strips:

1. **Section params stripping** — [json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx) 371–384: delete moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split, **gap**, **padding** from section params.
2. **Spacing overlay stripping** — 548–559: remove layout.gap from getSpacingForScale result for section.
3. **layoutVariants gap stripping** — 594–608: remove gap and layout.gap from variant params before merge.
4. **resolveToken spacing/gap/padding → "0"** — [palette-resolve-token.ts](src/03_Runtime/engine/core/palette-resolve-token.ts) 25–27.
5. **LayoutMoleculeRenderer overwrite** — [LayoutMoleculeRenderer.tsx](src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx) 318–325: resolved.gap and resolved.padding replaced by resolveSectionSpacing output.
6. **Recovery mode** — LAYOUT_RECOVERY_MODE = true in json-renderer and LayoutMoleculeRenderer: when layout is null, forced fallback layout; requireLayoutValue/getLayoutValueWithSafeDefault supply fallbacks so rendering never blocks.
7. **Hardcoded layout override** — json-renderer 428–429: `next.layout = "content-stack"` and `_effectiveLayoutPreset = "content-stack"` (overrides resolved layoutId for every section for testing).

**Authority ladder (what to change for global polish):**

| Concern | Authority | Where to change |
|---------|-----------|------------------|
| Color | Palette (CSS vars + resolveToken) | Palettes JSON, palette-bridge |
| Page bg | palette.page.background / color.surface → --color-bg-primary | palette-bridge |
| Typography | Palette (textSize, textWeight, lineHeight, fontFamily) + visual preset (textRole) | Palettes, visual-presets, resolveParams |
| Section vertical spacing | Layout engine only | resolveSectionSpacing (LayoutMoleculeRenderer), SPACING_MODE_TOKEN, spacingMode (URL or prop) |
| Section horizontal spacing | layout-definitions container.contentInsetX | layout-definitions.json, LayoutMoleculeRenderer outerStyle |
| Card styling | visual preset (card) + cardPreset + resolveParams | visual-presets, card-preset-resolver, palette |
| Button/field styling | visual preset (button/field) + variant + resolveParams | visual-presets, molecules, palette |

---

## 7) MASTER AUTHORITY TABLE + REDUNDANCY

### 7.1 Layer → Controls → Overrides → Ignored → Dead → Conflicts

| Layer | Controls | Overrides | Ignored | Dead | Conflicts |
|-------|----------|-----------|---------|------|-----------|
| **Palette** | Colors, radius, typography, shadow, font; CSS vars for spacing/gap/padding | — | — | spacing/gap/padding when read via resolveToken (forced "0") | Palette writes spacing vars; resolveToken prevents their use in params |
| **Template profile** | visualPreset, spacingScale, cardPreset, defaultSectionLayoutId, layoutVariants (layoutId, containerWidth), sections (role→layout id) | Section gap/padding from node and from spacing scale and layoutVariants stripped | sections.*.params.gap/padding (not used for section vertical spacing) | layoutVariants.params.gap; spacingScale section.layout.gap | — |
| **Layout definitions** | containerWidth, container.contentInsetX, split, moleculeLayout type/params, contentColumn, mediaColumn, etc. | moleculeLayout.params.gap and padding overwritten by resolveSectionSpacing | — | componentLayouts.params.gap/padding for section (overwritten) | — |
| **Visual presets** | surface, title, body, button, list, etc. token paths | Merged over variant/size/inline in resolveParams | — | Preset values that are spacing./gap./padding.* (resolve to "0") | — |
| **Spacing scales** | section.layout.gap (in JSON) | Section layout.gap stripped before merge | — | section.layout.gap (never reaches section) | — |
| **Behavior profile** | Root class + data attrs | — | — | — | None |
| **Experience** | Template filter, visual preset fallback | — | — | — | None |

### 7.2 Redundancy: concepts in multiple layers, one wins

- **Section vertical spacing:** In palette (padding/gap vars), template-profiles.sections.*.params (gap, padding), layoutVariants.params (gap, padding), spacing-scales section.layout.gap, layout-definitions componentLayouts.params (gap, padding). **Only LayoutMoleculeRenderer.resolveSectionSpacing wins**; all other sources are stripped or overwritten.
- **Section horizontal padding:** Only layout-definitions container.contentInsetX applies (single authority).
- **Card/button/surface look:** Palette + visual preset + card preset + variant; all merged in resolveParams; no single overwrite, but spacing token paths in presets are dead.

### 7.3 "True power order" for global Google-style polish

1. **Palette** — color, type, radius, shadow; ensure palette-bridge and tokens are consistent; avoid relying on spacing/gap/padding tokens for layout (they are suppressed).
2. **Layout definitions** — single source for section horizontal padding (contentInsetX) and layout structure; adjust contentInsetX and containerWidth for polish.
3. **resolveSectionSpacing + spacingMode** — only lever for section vertical rhythm; tune SPACING_MODE_TOKEN and section index logic for tight/normal/airy.
4. **Visual presets** — card/section/button surface, typography roles; keep spacing token paths out of presets or accept they resolve to 0 for section use.
5. **Template profile** — layoutId and containerWidth per role, visualPreset, cardPreset; section gap/padding in template or layoutVariants do not affect section vertical spacing.

---

*End of report. No files were modified; all citations are to the HiSense codebase.*
