# Style System Wiring Audit — Complete Report

**Objective:** Trace how Palette, Styling Templates, Layout Tokens, Experience, Template, and Behavior are wired end-to-end. Analysis only — no fixes, no code, no patches.

---

## Part A — Palette + Style + Layout

### 1. Palette wiring map

**Full path:** palette JSON → palette-bridge → CSS vars → renderer → section → components

- **Palette JSON source:** `src/04_Presentation/palettes/*.json`. Loaded via palettes index; `src/03_Runtime/engine/core/palette-store.ts` holds `activePaletteName`; state.values.paletteName is source of truth with palette-store fallback.
- **Bridge:** `src/06_Data/site-renderer/palette-bridge.tsx` — setPaletteVarsOnElement(root, palette); usePaletteCSS() in `src/app/layout.tsx` applies to document.documentElement.
- **palette.page.background:** Sets --color-bg-primary when present; else color.surface. Consumed by site-theme.css, AppShell, WebsiteShell, LearningShell, ExperienceRenderer, field.tsx, json-skin.engine, GeneratedSiteViewer, PageContainer, NavBar.
- **Fallback greys / bypass:** site-theme.css uses hex fallbacks (no named greys). Hardcoded colors in ExportButton.tsx, PaletteContractInspector.tsx, json-renderer.tsx, layout.tsx, LayoutTilePicker.tsx, SitesDirectoryScreen.tsx. GeneratedSiteViewer overwrites vars when brandInfo.palette exists.

### 2. Style template flow

- **Stored:** state.values.templateId; state.values.stylingPreset (overrides template.visualPreset in effectiveProfile).
- **Template profile:** `src/04_Presentation/lib-layout/template-profiles.json` + template-profiles.ts (layoutVariants, defaultSectionLayoutId, spacingScale, cardPreset, visualPreset, heroMode, sectionBackgroundPattern, widthByRole).
- **Where it stops:** Section gap from spacingScale and layoutVariants stripped in json-renderer; section inner gap/padding overwritten by resolveSectionSpacing in LayoutMoleculeRenderer.

### 3. Layout token flow

- **Source:** `src/04_Presentation/layout/data/layout-definitions.json` (pageLayouts, componentLayouts, templates). Resolved via page-layout-resolver, component-layout-resolver, layout-resolver, section-layout-id.
- **Applied:** containerWidth, contentInsetX, split, backgroundVariant, contentColumn/mediaColumn. **Overwritten:** componentLayouts.params.gap and params.padding by resolveSectionSpacing in LayoutMoleculeRenderer.

### 4. Visual layers stack order

1. Global CSS 2. Palette 3. Style template (gap stripped) 4. Layout (gap/padding overwritten for section) 5. Component defaults 6. Hardcoded overrides. Engine wins for section gap/padding; palette-resolve-token returns "0" for spacing/gap/padding.

### 5–9. Disconnects, propagation, injection points, global vs local, blockers

- Palette: global except GeneratedSiteViewer and separate roots. Template/layout: global but section vertical spacing engine-owned. Broken bridges: palette surface.app/section/card not CSS vars; section gap/padding from layout-definitions and template stripped or overwritten; palette-resolve-token zeros spacing.

---

## Part B — Experience / Template / Styling / Behavior (Layer Expansion)

### EXPERIENCE WIRING MAP

- **Stored:** state.values.experience (primary); layout-store.experience (fallback).
- **Read:** page.tsx, layout.tsx, SiteSkin.tsx, JsonRenderer, diagnostics panels.
- **Controls:** Section visibility (getExperienceVisibility: website=all render, app=collapse panels, learning=step); base profile from presentation-profiles.json (sections, defaults, visualPreset). Does not override templateId, layoutVariants, spacingScale.
- **Injects:** page.tsx → getExperienceProfile(experience) → experienceProfile merged under template in effectiveProfile; experience prop to JsonRenderer for experienceContext and getExperienceVisibility.

### STYLING PROFILE INJECTION PATH

- **Stored:** state.values.stylingPreset only. STYLING_PRESETS = ["default", "clean", "minimal", "bold", "soft", "apple"] in RightFloatingSidebar, RightSidebarDockContent.
- **Defined:** visual-presets.json (default, compact, spacious, prominent, editorial, elevated, floating, depth-*, apple). "clean"/"minimal"/"bold"/"soft" not keys — fall back to default.
- **Changes:** visualPreset only (surface, radius, shadow, transition, typography refs via palette). No palette swap; no card preset (that’s template).
- **Injects:** page.tsx base.visualPreset = stylingOverride ?? templateProfile.visualPreset → effectiveProfile → JsonRenderer applyProfileToNode → getVisualPresetForMolecule.

### TEMPLATE AUTHORITY DEPTH

- **templateId:** state.values.templateId → layoutSnapshot.templateId → forcedTemplateId "focus-writing-apple" (page.tsx 248).
- **Beyond layout:** heroMode (in profile, not structural in LayoutMoleculeRenderer); sectionBackgroundPattern (reaches DOM: data-section-background-pattern, className); widthByRole (variantContainerWidth from layoutVariants); cardPreset, visualPreset.
- **Never reach DOM:** spacingScale section gap (stripped); layoutVariants gap for section (stripped); heroMode not used for structure.

### BEHAVIOR CONTROL PLANE

- **Stored:** state.values.behaviorProfile only. BEHAVIOR_PROFILES = ["default", "calm", "fast", "educational", "interactive"].
- **Affects:** Only data-behavior-transition and data-behavior-profile and class behavior-{profile} on JsonRenderer root. getBehaviorTransitionHint: calm→"calm", fast→"fast", else "default". No CSS or engine consumes these for animation/transition. educational/interactive get "default".
- **Injects:** page.tsx → JsonRenderer/ExperienceRenderer; applied at root wrapper only. behavior-engine.ts / behavior-listener.ts handle actions (tap, navigate), not behaviorProfile.

### FULL STACK AUTHORITY LADDER (FINAL)

1. Global CSS 2. Palette 3. Experience 4. Styling (visualPreset) 5. Template 6. Layout definitions 7. Renderer engines 8. Component defaults 9. Hardcoded overrides. Styling wins over template.visualPreset; template wins over experience; engine wins for section gap/padding.

### GLOBAL vs LOCAL PROPAGATION MATRIX

Global: Global CSS, Palette, Experience, Styling, Template, Layout definitions, behaviorProfile (root only), resolveSectionSpacing. Local: section/card/organ overrides (state.layoutByScreen), hardcoded colors. Isolated: Brand palette (GeneratedSiteViewer).

### SYSTEM CONTROL BLOCKERS

LayoutMoleculeRenderer.tsx (439–451), json-renderer.tsx (877–910), palette-resolve-token.ts (25–27), palette-bridge (no surface.app/section/card), GeneratedSiteViewer.tsx (94), page.tsx forcedTemplateId (248), visual-preset-resolver (clean/minimal/bold/soft missing), getBehaviorTransitionHint (no consumer), heroMode/widthByRole not fully applied, hardcoded styles in listed components, site-theme.css fixed container widths.

---

## Part C — System-Level Experience / Template / Behavior (Detailed)

### 1) EXPERIENCE SYSTEM DISCOVERY

**Exact file paths**

- Template: `src/04_Presentation/lib-layout/template-profiles.json`, `template-profiles.ts`.
- Experience profiles: `src/04_Presentation/lib-layout/presentation-profiles.json`, `profile-resolver.ts`.
- Behavior profiles: No JSON; UI constants in RightFloatingSidebar.tsx, RightSidebarDockContent.tsx, ControlDock.tsx; getBehaviorTransitionHint in json-renderer.tsx.
- Behavior (actions): `src/03_Runtime/behavior/behavior-engine.ts`, `behavior-listener.ts`, behavior-runner.ts, behavior-verb-resolver.ts, behavior.json, behavior-actions-6x7.json.
- Styling: `src/04_Presentation/lib-layout/visual-presets.json`, `visual-preset-resolver.ts`.
- Experience visibility: `src/03_Runtime/engine/core/experience-visibility.ts`, `ExperienceRenderer.tsx`.

**Not found:** experience-engine, animation-engine, pacing system, interactionMode, engagementMode, contentMode.

**Files referencing experience / templateId / visualPreset / behaviorProfile:** Listed in full in plan (json-renderer, page, layout, SiteSkin, RightFloatingSidebar, RightSidebarDock, profile-resolver, section-layout-id, layout-resolver, ExperienceRenderer, etc.).

### 2) EXPERIENCE → RENDER PIPELINE TRACE

UI → state (experience, templateId, behaviorProfile, stylingPreset) → page.tsx (effectiveProfile, experience, behaviorProfile) → JsonRenderer/ExperienceRenderer → applyProfileToNode, getExperienceVisibility, behavior root attrs. Stops: experience at visibility; template section gap stripped; layout-definitions section gap/padding overwritten; behaviorProfile at root only.

### 3) WHAT EXPERIENCE ACTUALLY CONTROLS

- **Experience (website/app/learning):** Section visibility (render/collapse/hide/step); base profile (sections, defaults, visualPreset); SiteSkin region order. Does not control spacing, animation speed, layout density, typography, or pacing directly.
- **Behavior profiles (calm/fast/educational/interactive):** Only transition hint string on root; no tokens applied; no consumer. calm/fast get hint; educational/interactive get "default"; none affect spacing, animation, or typography.

### 4) TEMPLATE vs EXPERIENCE AUTHORITY

Override ladder: Hardcoded > Renderer defaults > Layout definitions > Template > Styling > Experience > Palette > Global CSS. Template wins over experience; styling wins over template.visualPreset; behavior engine does not participate (handles actions only).

### 5) DEAD / UNUSED EXPERIENCE TOKENS

Experience: heroMode, widthByRole partially/unused. Behavior: behaviorProfile not read by renderer; educational/interactive unmapped. Template: spacingScale section gap, layoutVariants section gap, componentLayouts section gap/padding. Animation: data-behavior-transition unused. ui-config.json (Later) "calm" theme unused.

### 6) GLOBAL PROPAGATION CHECK

Experience/templateId/behaviorProfile: affect all apps, all screens; experience affects all sections (visibility); template affects all sections/molecules (layout/visual); behaviorProfile only on root. Injection: page.tsx → profile + experience + behaviorProfile → JsonRenderer; behaviorProfile at root only.

### 7) DISCONNECTS BLOCKING FULL SYSTEM CONTROL

json-renderer (strip section gap), LayoutMoleculeRenderer (overwrite gap/padding), getBehaviorTransitionHint (no consumer), behavior-engine/behavior-listener (no behaviorProfile), visual-preset-resolver (missing presets), page forcedTemplateId, experience-visibility (visibility only), presentation-profiles (template overrides), ui-config.json (Later) unwired.

### 8) FINAL STACK MAP

Overrides (LOCAL, DOMINANT) → Components (PARTIAL) → Renderer (DOMINANT section spacing) → Layout (GLOBAL, PARTIAL) → Template (GLOBAL, PARTIAL) → Styling (GLOBAL) → Experience (GLOBAL, base) → Palette (GLOBAL) → Global CSS (GLOBAL). behaviorProfile = GLOBAL but DEAD.

---

**End of complete report. Analysis only; no code or file changes.**
