# ROUND 2 — JSON Compression Map

**Purpose:** Identify JSON clusters that can be merged, redundant schema surfaces, and unused structures. Planning only.

---

## 1. Clusters that can be merged

### 1.1 Layout definitions

| Current | Files | Merge option |
|---------|-------|--------------|
| Page layouts | layout/page/page-layouts.json | Single layout-definitions.json with top-level keys: |
| Templates | layout/page/templates.json | pageLayouts, templates, defaultLayoutByTemplate. |
| Component layouts | layout/component/component-layouts.json | Or keep page + component separate but under one layout/data/ dir. |
| **Recommendation** | 3 files | One merged layout-definitions.json (or layout/page.json + layout/component.json) to reduce loader surface. |

### 1.2 Layout molecule + presets

| Current | Location | Merge option |
|---------|----------|--------------|
| definitions-molecule | lib/layout/definitions-molecule/*.json (4) | Single molecule-layouts.json with keys: column, row, stacked, grid. |
| spacing-scales | lib/layout/spacing-scales/*.json (5) | Single spacing-scales.json or keep as-is (small). |
| visual-presets | lib/layout/visual-presets/default.json | Keep or fold into layout-definitions. |
| card-presets | lib/layout/card-presets/*.json (6) | Single card-presets.json. |
| hero-presets | lib/layout/hero-presets.json | Keep. |

### 1.3 Presentation profiles

| Current | Location | Merge option |
|---------|----------|--------------|
| website, app, learning | lib/layout/presentation/*.profile.json (3) | Single presentation-profiles.json with keys website, app, learning. |

### 1.4 Organ variants

| Current | Location | Merge option |
|---------|----------|--------------|
| Per-organ variants | organs/header/variants/*.json (13), hero (10), etc. | Option A: Keep file-per-variant; Option B: One organs-manifest.json listing paths; Option C: Build-time bundle organs.json (all variants). R2: document; R3: optional bundle. |

### 1.5 Compound definitions

| Current | Location | Merge option |
|---------|----------|--------------|
| avatar, button, card, … | compounds/ui/definitions/*.json (13) | Single compound-definitions.json; registry.ts imports one file. |

### 1.6 Config

| Current | Location | Merge option |
|---------|----------|--------------|
| renderer-contract, state-defaults, ui-verb-map | config/*.json (3) | Optional: single config.json with keys; or keep separate for clarity. |

---

## 2. Redundant schema surfaces

| Surface | Redundancy | Action |
|---------|------------|--------|
| Page layout def vs Component layout def | Different shapes (containerWidth/split vs type/preset/params); consumed together by resolveLayout. | No schema redundancy; merge only for loader count. |
| Compound definitions vs Registry (component map) | Definitions = param/defaults; Registry = React component. Not redundant. | Optional: single compound manifest for definitions. |
| Layout requirements (section, card, organ-internal) | Three requirement files; similar structure. | Optional: single requirements.json with keys section, card, organInternal. |
| contracts/JSON_SCREEN_CONTRACT.json | Single contract schema. | Keep. |

---

## 3. Unused structures

| File / path | Status | Action |
|-------------|--------|--------|
| content/text.content.json, media.content.json, data.content.json | Used by content/content-resolver.ts (legacy). | If removing content/content-resolver, these become dead; document or remove. |
| logic/content/education.flow.ts, flows/*.json | Education/flow content. | Keep (used by education-resolver, flow-loader). |
| logic/engines/calculator/calculator-types/*.json | Calculator type definitions. | Keep. |
| map (old)/* | Legacy. | Do not migrate; document as legacy. |
| diagnostics/diagnostics.json | Diagnostics config. | Keep. |

---

## 4. File count reduction (ROUND 3 target)

| Cluster | Current (approx) | After compression (target) |
|---------|------------------|----------------------------|
| Layout (page, component, templates) | 3 | 1–2 |
| Layout molecule + presets | 15+ | 3–5 |
| Presentation profiles | 3 | 1 |
| Organ variants | 60+ | 60 (no change in R2) or 1 bundle (R3) |
| Compound definitions | 13 | 1 (optional) |
| Config | 3 | 3 or 1 |
| **Total JSON (core pipeline)** | **~100+** | **~10–20** (aggressive) or ~30 (conservative) |

---

## 5. Summary: compression priorities

| Priority | Cluster | Action (planning) |
|----------|---------|-------------------|
| P1 | Layout page + component + templates | Merge to one or two JSON files under layout/. |
| P2 | Layout molecule definitions | Merge 4 files to one molecule-layouts.json. |
| P2 | Card presets | Merge 6 to one card-presets.json. |
| P2 | Presentation profiles | Merge 3 to one presentation-profiles.json. |
| P3 | Compound definitions | Optional single compound-definitions.json. |
| P3 | Layout requirements | Optional single requirements.json. |
| P4 | Organs | R2: no change; R3: optional build-time bundle. |
| P4 | Config | Optional single config.json. |

---

*End of JSON_COMPRESSION_MAP.md*
