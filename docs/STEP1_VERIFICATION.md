# Step 1 Verification: Per-Section Layout Preset Engine

Use this checklist to confirm Step 1 works before proceeding to Step 2.

## 1. Contract and backward compatibility

- [ ] **Existing screens without `layoutPreset`**  
  Load a screen that has no `layoutPreset` on any section (e.g. `template/about.json` or `template/contact.json`).  
  **Expect:** Page renders as before; no errors; layout comes from template/organ only.

- [ ] **Screen with `layoutPreset` in JSON**  
  Load `apps/journal_track/app-1.json` (hero section has `layoutPreset: "hero-centered"`).  
  **Expect:** Hero section uses wide container and centered column layout; no errors.

## 2. Right-panel UI

- [ ] **Layout Preset dropdown per section**  
  With `apps/journal_track/app-1.json` (or any website screen with sections), open the right “Organ variants” panel.  
  **Expect:** Each section row (Nav, Header, Hero, Features, etc.) has a “Layout Preset” dropdown **in the same row** as the variant control (or alone when there is no variant). No separate modal or global settings.

- [ ] **Changing preset updates only that section**  
  Change the Hero row’s “Layout Preset” from “(default)” to `hero-full-bleed-image`.  
  **Expect:** Only the hero section changes (e.g. full-width / full-screen feel). Other sections unchanged.

- [ ] **Preset list per section**  
  **Expect:** Hero row shows only hero presets (`hero-centered`, `hero-split-image-right`, `hero-full-bleed-image`). Features/Testimonials rows show content + grid presets (e.g. `feature-grid-3`, `content-narrow`, `cta-centered`, etc.).

## 3. Persistence

- [ ] **Refresh keeps selection**  
  Set a section’s Layout Preset (e.g. Hero → `hero-split-image-right`), then refresh the page (same screen).  
  **Expect:** Same preset still applied (localStorage).

- [ ] **Per-screen overrides**  
  Set presets on screen A, then switch to screen B, then back to screen A.  
  **Expect:** Screen A’s preset choices are still applied; screen B’s are independent.

## 4. Visual (composition-level) change

- [ ] **Hero presets look different**  
  Switch Hero between `hero-centered`, `hero-split-image-right`, and `hero-full-bleed-image`.  
  **Expect:** Obvious differences: container width (wide vs split vs full), layout (column vs row), hero mode (centered vs split vs full-screen). Not just tiny spacing changes.

- [ ] **Feature section → grid**  
  For the Features (or similar) section, set Layout Preset to `feature-grid-3`.  
  **Expect:** Section uses a 3-column grid layout; content/gap clearly different from default.

- [ ] **CTA section**  
  Set a CTA section to `cta-centered`.  
  **Expect:** Content centered; padding/gap from preset visible.

## 5. Debug overlay

- [ ] **Toggle**  
  Add `?layoutDebug=1` to the URL (e.g. `?screen=apps/journal_track/app-1.json&layoutDebug=1`).  
  **Expect:** Each section shows a small overlay (e.g. dark bar at top of section) with: section id, role, current layout preset, container width, and resolved layout (row/column/grid + gap token).

- [ ] **Values match**  
  Change a section’s Layout Preset in the panel.  
  **Expect:** That section’s debug overlay updates to show the new preset id and resulting container/layout.

## 6. Eligibility

- [ ] **Hero: only hero presets**  
  Hero row’s Layout Preset dropdown lists only `hero-centered`, `hero-split-image-right`, `hero-full-bleed-image`.

- [ ] **Content/features: content + grid**  
  Content or Features section row lists content presets and (for features) `feature-grid-3`, etc.

## Quick test path

1. Open `?screen=apps/journal_track/app-1.json` (Experience: Website).
2. In the right panel, find **Hero** and set Layout Preset to `hero-full-bleed-image` → hero should look full-bleed/full-screen.
3. Add `?layoutDebug=1` → each section should show the debug bar with id, role, layoutPreset, containerWidth, layout.
4. Refresh → Hero should still be `hero-full-bleed-image`.
5. Switch Hero to `hero-centered` → hero should look centered/wide again.

When all items above pass, Step 1 is verified. Proceed to Step 2 (global page profile) only after that.
