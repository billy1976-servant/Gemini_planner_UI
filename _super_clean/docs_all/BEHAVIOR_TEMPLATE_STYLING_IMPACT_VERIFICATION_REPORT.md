# Behavior, Template, Styling Impact Verification (READ-ONLY AUDIT)

**Goal:** Determine why Behavior, Template, and Styling selectors produce little/no visible change.  
**Scope:** Trace and report only — no file changes.

---

## STEP 1 — State change confirmation

### Values traced

| Value | State path | Does it change when toggled? | Where it lives |
|-------|------------|------------------------------|----------------|
| **templateId** | `state.values.templateId` | **Yes** (if UI calls `setValue("templateId", id)`) | Written: `RightFloatingSidebar.tsx` (e.g. L460, L485), `RightSidebarDockContent.tsx` (L196, L212). Read: `page.tsx` L212, L249–250. |
| **paletteName** | `state.values.paletteName` | **Yes** | Written: `RightFloatingSidebar.tsx` L181, `RightSidebarDock.tsx` L48. Read: `page.tsx` L214; `palette-bridge.tsx` L161. |
| **visualPreset / stylingPreset** | `state.values.stylingPreset` | **Yes** | Written: `RightFloatingSidebar.tsx` L520, `RightSidebarDockContent.tsx` L233. Read: `page.tsx` L300, L321. |
| **behaviorMode / behaviorProfile** | `state.values.behaviorProfile` | **Yes** | Written: `RightFloatingSidebar.tsx` L554, `RightSidebarDockContent.tsx` L255. Read: `page.tsx` L762, L773; `json-renderer.tsx` L1476. |

**Exact paths:**

- `state.values.templateId` → `getState()?.values?.templateId`
- `state.values.paletteName` → `getState()?.values?.paletteName` (and `getPaletteName()` from palette-store when sidebar also calls `setPalette(name)`)
- `state.values.stylingPreset` → `stateSnapshot?.values?.stylingPreset` in `page.tsx`
- `state.values.behaviorProfile` → `stateSnapshot?.values?.behaviorProfile` in `page.tsx` and `rawState?.values?.behaviorProfile` in `json-renderer.tsx`

**Note:** ControlDock receives optional `onStylingPresetChange` / `onBehaviorProfileChange`. If the parent does not pass these, the buttons are disabled (“Coming soon”). Only the Right sidebar flows wire these to `setValue(...)`.

---

## STEP 2 — Renderer consumption trace

### Template

- **Where effectiveProfile is built:**  
  `app/page.tsx` L302–324: `effectiveProfile = useMemo(...)` from `templateProfile = getTemplateProfile(effectiveTemplateId)` (L253), with `effectiveTemplateId = stateSnapshot?.values?.templateId ?? layoutSnapshot?.templateId ?? null` (L247–251).  
  `layoutVariants` and `defaultSectionLayoutId` come from `templateProfile` (L308–309).

- **Where templateProfile.layoutVariants is used:**  
  `04_Presentation/layout/section-layout-id.ts` L87–93: `layoutVariant = templateProfile?.layoutVariants?.[nodeRole]`, then `layoutVariantId = layoutVariant?.layoutId`; if set, `layoutId = layoutVariantId` and `ruleApplied = "template layoutVariants"` (L114–117).

- **Where layoutId is applied to sections:**  
  `03_Runtime/engine/core/json-renderer.tsx` L414–424: inside `applyProfileToNode`, `getSectionLayoutId({ ..., templateProfile: profile })` returns `layoutId` and `ruleApplied`.  
  That `layoutId` is passed into section rendering; `LayoutMoleculeRenderer.tsx` uses it to resolve layout definition and container width (e.g. L247, L616–621).  
  Section compound: `section.compound.tsx` L95, L132, L138 receives `templateId` and passes it to `LayoutMoleculeRenderer`.

**Consumption list (template):**

1. `page.tsx`: builds `effectiveProfile` (id, layoutVariants, defaultSectionLayoutId, visualPreset, etc.) from `getTemplateProfile(effectiveTemplateId)`.
2. `page.tsx`: passes `profileOverride={effectiveProfile}` to `ExperienceRenderer` / `JsonRenderer`.
3. `json-renderer.tsx`: `profile = profileOverride ?? layoutSnapshot` (L1398) → uses `effectiveProfile` when provided.
4. `json-renderer.tsx` (applyProfileToNode): calls `getSectionLayoutId(..., templateProfile: profile)` (L414–421).
5. `section-layout-id.ts`: uses `templateProfile.layoutVariants[nodeRole]` and `defaultSectionLayoutIdFromProfile` to resolve `layoutId` and `ruleApplied`.
6. `LayoutMoleculeRenderer.tsx`: uses resolved `layoutId` for layout definition and container width.
7. `section.compound.tsx`: receives `templateId` from engine and passes it down for layout context.

### Styling (visualPreset / stylingPreset)

- **Where visualPreset is read:**  
  `page.tsx` L300: `stylingOverride = stateSnapshot?.values?.stylingPreset`.  
  L321: `base.visualPreset = stylingOverride ?? templateProfile.visualPreset` inside `effectiveProfile` useMemo.  
  So the value that reaches the renderer is “styling panel override or template’s visualPreset”.

- **Which components consume it:**  
  `json-renderer.tsx` L844–847: `getVisualPresetForMolecule(profiledNode.type, profile?.visualPreset, profile?.id)` → returns a preset overlay per molecule type (section, card, etc.).  
  L859: `resolvedParams = resolveParams(visualPresetOverlay, ...)`; L858–864: card preset overlay merged.  
  Params (background, shadow, radius, transition, etc.) flow into molecule `params` and then to atoms.

- **Which props/styles change:**  
  `visual-preset-resolver.ts`: resolves preset name to an entry in `visual-presets.json` (e.g. default, prominent, editorial, compact, spacious).  
  Presets differ (e.g. prominent: `surface.hero`, `prominence.primary.background`; default: `surface.section`, `elevation.none`).  
  `resolveParams` → `palette-resolver.ts` merges presets and calls `resolveToken` per key.  
  `palette-resolve-token.ts`: `resolveToken(path, ..., paletteOverride)` resolves token paths against palette (e.g. `surface.section` → color value).  
  `SurfaceAtom` (`04_Presentation/components/atoms/surface.tsx`): uses `resolveToken(params.background)`, `resolveToken(params.shadow)`, `resolveToken(params.radius)`, `withMotionScale(params.transition)` → real CSS (backgroundColor, boxShadow, borderRadius, transition).

**Consumption list (styling):**

1. `page.tsx`: `effectiveProfile.visualPreset = stylingOverride ?? templateProfile.visualPreset`.
2. `json-renderer.tsx`: `getVisualPresetForMolecule(type, profile?.visualPreset, profile?.id)` (L844–847).
3. `lib-layout/visual-preset-resolver.ts`: maps preset name to `PRESETS[resolvedName]`, returns molecule-type slice (e.g. section, card).
4. `json-renderer.tsx`: `resolveParams(visualPresetOverlay, ...)` (L859); merged into `resolvedNode.params`.
5. `palette-resolver.ts`: `resolveParams` → `resolveToken` for each key.
6. `palette-resolve-token.ts`: token path → palette value (or literal).
7. `SurfaceAtom` (and other atoms): `resolveToken(params.background)` etc. → inline `style` (backgroundColor, boxShadow, etc.).

### Behavior

- **Where behaviorProfile is read:**  
  `page.tsx` L762: `behaviorProfile = (stateSnapshot?.values?.behaviorProfile ?? "default")`; passed as `behaviorProfile={behaviorProfile}` to `ExperienceRenderer` / `JsonRenderer` (L773, L823, L856, L913).  
  `json-renderer.tsx` L1476: `behaviorProfile = behaviorProfileProp ?? (rawState?.values?.behaviorProfile as string) ?? "default"`.

- **Values it affects:**  
  - `getMotionDurationScale(behaviorProfile)`: calm = 1.25, fast = 0.85, default = 1 (L1259–1263).  
  - `getBehaviorTransitionHint(behaviorProfile)`: calm/fast/default string (L1252–1256).  
  - Root wrapper: `className={behavior-${behaviorProfile}}`, `data-behavior-profile`, `data-behavior-transition`, and inline style `--motion-duration-scale: <scale>` (L1512, L1527, L1536).

- **Which components use those values:**  
  - Root div in `json-renderer.tsx`: gets class, attributes, and `--motion-duration-scale` CSS variable.  
  - `motion-scale.ts`: `withMotionScale(transitionString)` rewrites durations in transition strings to `calc(X * var(--motion-duration-scale, 1))`.  
  - Used in: `surface.tsx` (L17–18), `focus-ring.tsx`, `trigger.tsx`. So any atom that passes a transition through `withMotionScale` will scale duration.

**Consumption list (behavior):**

1. `page.tsx`: reads `stateSnapshot?.values?.behaviorProfile`, passes `behaviorProfile` to renderer.
2. `json-renderer.tsx`: resolves `behaviorProfile`, computes `getMotionDurationScale` and `getBehaviorTransitionHint`.
3. Root wrapper: `className`, `data-behavior-profile`, `data-behavior-transition`, `style["--motion-duration-scale"]`.
4. `motion-scale.ts`: `withMotionScale(transitionString)` used by SurfaceAtom, FocusRing, Trigger.
5. Atoms that receive `params.transition` (from visual preset) and use `withMotionScale` produce scaled transition CSS.

---

## STEP 3 — Dead wiring check (per system)

| System | 1) State changes? | 2) Renderer reads value? | 3) Components use resolved values? | 4) Visually different? |
|--------|-------------------|---------------------------|------------------------------------|-------------------------|
| **Template** | Yes | Yes (profileOverride → getSectionLayoutId with templateProfile) | Yes (layoutId → LayoutMoleculeRenderer, container width, layout def) | Depends: layoutIds can differ by template (e.g. hero-centered vs split); if screen roles match template layoutVariants and defaults differ, layout/width change. If many templates share same defaultSectionLayoutId or same layoutVariants for the same roles, change can be small. |
| **Styling** | Yes | Yes (effectiveProfile.visualPreset → getVisualPresetForMolecule) | Yes (resolveParams → resolveToken → SurfaceAtom etc. → real CSS) | Can be subtle: preset tokens (e.g. surface.hero vs surface.section) resolve via palette; if palette tokens are similar or screen has few section/card surfaces, difference may be low contrast. |
| **Behavior** | Yes | Yes (behaviorProfile → root --motion-duration-scale and class) | Partially: only atoms using withMotionScale (surface, focus-ring, trigger) scale transitions; other motion may not use the variable. | Often subtle: 1.25x / 0.85x on transition duration; visible only where transitions exist and use withMotionScale. |

---

## STEP 4 — Layout impact check

- **Per-section data (from code):**  
  `getSectionLayoutId(..., { includeRule: true })` returns `layoutId`, `ruleApplied`, and optionally `variantParams`, `variantContainerWidth`.  
  Logged in dev: `section-layout-id.ts` L211–218 (`SECTION_DECISION`: role, templateLayout, defaultLayout, nodeLayout, chosen); `LayoutMoleculeRenderer.tsx` L633–641 (`FINAL_LAYOUT_INPUT`, containerWidth, etc.).

- **layoutId chosen:** From section-layout-id priority: override → explicit node.layout → template layoutVariants (by role) → template role (getPageLayoutId) → template default → `"content-stack"`.

- **Do layoutIds change between templates?**  
  Yes, when template profiles differ. Example: `template-profiles.json` — “modern-hero-centered” has hero → `hero-centered`; “startup-split-hero” has different layoutVariants/hero layout. So switching template can change layoutId and containerWidth per role.  
  If the screen has no matching role for layoutVariants, or all sections hit the same defaultSectionLayoutId (e.g. many templates use `content-narrow`), then layoutId may not change for those sections.

**Conclusion (layout):** Wiring is complete. Visibility of change depends on (a) template definitions having different layoutVariants/defaultSectionLayoutId, and (b) screen section roles matching those variants.

---

## STEP 5 — Styling impact check

- **Tokens/params that change:**  
  Preset name → `visual-presets.json` (e.g. default, compact, spacious, prominent, editorial). Different presets set different keys for section/card (e.g. background, shadow, radius, transition, title size). Examples: prominent uses `surface.hero`, `prominence.primary.background`; default uses `surface.section`, `elevation.none`.

- **Components that subscribe:**  
  All molecules that get params from applyProfileToNode (section, card, etc.) receive merged params; Section/Card pass surface (and other) params to SurfaceAtom and other atoms. No separate “subscription” — params are computed each render from profile.visualPreset.

- **Mapping to CSS/classes:**  
  Yes. `resolveParams` → `resolveToken` produces concrete values; SurfaceAtom applies them as inline `style` (backgroundColor, boxShadow, borderRadius, transition). Token paths (e.g. `surface.section`) are resolved against the active palette in `resolveToken` (palette from palette-store or paletteOverride).

**Conclusion (styling):** End-to-end wired. Visibility depends on preset definitions differing and palette providing distinct values for those tokens.

---

## STEP 6 — Behavior impact check

- **Numeric values that change:**  
  `--motion-duration-scale`: 1 (default), 1.25 (calm), 0.85 (fast).  
  `getBehaviorTransitionHint`: "default" | "calm" | "fast" (for data attr / class).

- **Components that read them:**  
  Root wrapper sets the CSS variable and class. Only code that uses `withMotionScale(transitionString)` actually multiplies duration by the variable: `surface.tsx`, `focus-ring.tsx`, `trigger.tsx`. Other transitions (e.g. raw CSS or inline styles not going through withMotionScale) do not scale.

- **Besides animation speed:**  
  No. Behavior is intentionally only motion/transition scale and hint; no spacing or scale (e.g. zoom) in the traced code.

**Conclusion (behavior):** Wired at root and in the three atoms that use withMotionScale. Effect is limited to transition duration on those atoms; if the UI has few transitions or they don’t go through withMotionScale, the change will be minimal.

---

## STEP 7 — Root cause classification

- **Template:** Not “state changes but renderer ignores” and not “renderer reads but components don’t use.” Profile and layoutId resolution are connected. Most likely: **C) Components wired but templates contain same or similar values** for the current screen’s roles (e.g. same defaultSectionLayoutId, or same layoutVariants for the sections present), and/or **D) Templates/styling JSON has no meaningful differences** for the roles on screen.

- **Styling:** Full chain from state → effectiveProfile.visualPreset → getVisualPresetForMolecule → resolveParams → resolveToken → SurfaceAtom. So not A or B. Most likely **D) Templates/styling JSON has no meaningful differences** for the presets being toggled on that screen, and/or the palette tokens for different presets (e.g. surface.section vs surface.hero) are similar in value, so the change is subtle.

- **Behavior:** **Partially wired:** only motion duration is affected, and only where withMotionScale is used. So **B) Renderer reads it but (many) components don’t use it** — only surface, focus-ring, trigger use the scale; other motion is unaffected. So the “little visible change” is expected unless the scene is rich in those atoms’ transitions.

---

## STEP 8 — Output report

### BEHAVIOR: **partially wired**

- **Where state enters:**  
  `state.values.behaviorProfile` written in `RightFloatingSidebar` / `RightSidebarDockContent` via `setValue("behaviorProfile", profile)`. Read in `page.tsx` and passed as `behaviorProfile` prop; in `json-renderer.tsx` from prop or `rawState?.values?.behaviorProfile`.

- **Where it stops having effect:**  
  It does not stop — root gets `--motion-duration-scale` and class. Effect is limited because only three atoms use it: **first file where the “signal” is narrow** is `03_Runtime/engine/core/motion-scale.ts` (withMotionScale). Only `surface.tsx`, `focus-ring.tsx`, and `trigger.tsx` call it. Any other component that sets transition without withMotionScale ignores the variable.

---

### TEMPLATE: **working** (visibility depends on data)

- **Where state enters:**  
  `state.values.templateId` → `page.tsx` effectiveTemplateId → getTemplateProfile(effectiveTemplateId) → effectiveProfile (layoutVariants, defaultSectionLayoutId, etc.) → profileOverride to JsonRenderer.

- **Where it stops having effect:**  
  It does not stop; getSectionLayoutId and LayoutMoleculeRenderer consume profile and layoutId. **First place “no visible change” can come from:** template data. If `template-profiles.json` gives the same defaultSectionLayoutId and same or missing layoutVariants for the section roles present on the current screen, layoutId and container width will not change. So the “signal” is fully live; the **data** (template-profiles.json and screen section roles) is the constraint.

---

### STYLING: **working** (visibility depends on data)

- **Where state enters:**  
  `state.values.stylingPreset` → `page.tsx` stylingOverride → effectiveProfile.visualPreset → profileOverride → json-renderer applyProfileToNode → getVisualPresetForMolecule(..., profile?.visualPreset).

- **Where it stops having effect:**  
  It does not stop; resolveParams and resolveToken and SurfaceAtom (and other atoms) apply tokens to real CSS. **First place “little visible change” can come from:** (1) visual-presets.json entries for the toggled presets being similar for section/card, or (2) palette token values (e.g. surface.section vs surface.hero) being similar, so the resolved styles look the same.

---

## Summary table

| System   | Classification   | State → Renderer → Components | Likely reason for “little change” |
|----------|------------------|--------------------------------|------------------------------------|
| BEHAVIOR | Partially wired  | Yes → Yes → Only 3 atoms      | Only motion duration scaled; few components use withMotionScale. |
| TEMPLATE | Working          | Yes → Yes → Yes               | Same layoutIds/defaults for current screen roles across toggled templates. |
| STYLING  | Working          | Yes → Yes → Yes               | Similar preset tokens or palette values; or few section/card surfaces. |

---

*End of read-only audit. No files were modified.*
