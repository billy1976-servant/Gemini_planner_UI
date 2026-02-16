# Layout Dropdown System — Audit + Reduction Plan (NO CHANGES)

**Classification:** Analysis only. No code changes, no refactor, no file creation beyond this report.  
**Date:** 2025-02-10  
**Scope:** Full scan of layout-related sources → diagnosis + optimization blueprint.

---

## 1) DROPDOWN RESPONSIBILITY MODEL

### Intended Responsibilities

| Dropdown | Should control | Current source of options | Where used |
|----------|----------------|---------------------------|------------|
| **Screen layout** | Page framing (shell: Website / App / Learning) | Hardcoded `EXPERIENCES` in RightSidebarDockContent + RightFloatingSidebar | Experience pill, not in Layout dock |
| **Section layout** | Structure of a section (container width, split, hero vs content vs grid) | `getSectionLayoutIds()` → keys of `layout-definitions.json` → `pageLayouts` | OrganPanel (LayoutDock), SectionLayoutDropdown (dev) |
| **Card layout** | Arrangement of components/cards within a section | `getAllowedCardPresetsForSectionPreset(sectionLayoutId)` from capabilities.ts, then compatibility filter | OrganPanel (LayoutDock) |
| **Organ layout** | Internal layout of a *compound organ* (hero, header, nav, footer, gallery, etc.) | `getInternalLayoutIds(organId)` from organ-layout-profiles.json, then compatibility filter | OrganPanel (LayoutDock), only when `organIdBySectionKey[sectionKey]` is set |

### Where Boundaries Are Blurred

- **Screen vs section:** “Screen layout” in the UI is the **Experience** (Website/App/Learning) — it selects shell (WebsiteShell, AppShell, LearningShell), not section layout. The real “page framing” is thus the shell, not a layout registry. Section layout is per-section and lives in OrganPanel; there is no separate “screen-level layout” dropdown that picks from a small set of page frames.
- **Section vs organ:** A section can be a “section” (generic) or an “organ” (hero, header, nav, features-grid, content-section, etc.). When it’s an organ, the UI shows **both** Section Layout and (if organ has >1 internal layout) “Internal layout (organ).” So one row has: Section Layout + Card Layout + Organ Internal Layout. The boundary is clear in data (section layout = page layout id; organ internal = organ’s internal layout id) but in UX both appear under “Layout” and can feel like two section-level controls.
- **Card layout scope:** Card layout applies to “component layout” within a section. It is gated by section layout (capabilities: which card presets are allowed for this section layout). So card is correctly “within section,” but the label “Card Layout” may be unclear when the section is an organ (e.g. features-grid) — users may not distinguish “section layout” (features-grid-3) from “how cards in that grid look” (card layout).
- **Organ detection vs section type:** Organ internal dropdown appears only when `organIdBySectionKey[sectionKey]` is set. That is derived from `section.role` mapped via a small `roleToOrganId` map (e.g. `features` → `features-grid`, `content` → `content-section`) and then filtered by `getOrganLayoutOrganIds()`. So header/nav/footer/gallery/etc. only get organ internal layout if the section’s `role` matches an organ id in the registry. Any section whose role is not in that list never sees the organ internal dropdown — even if the section is visually a header/nav. So “organ” is effectively “section role ∈ organ registry,” and the boundary is “section layout (page-level) vs organ internal (organ-level).”

**Summary:**  
- Screen layout = Experience (shell); not part of the layout JSON registries.  
- Section layout = page/section structure (single registry: pageLayouts).  
- Card layout = component arrangement, gated by section layout (capabilities + compatibility).  
- Organ layout = internal layout of organs, gated by organ id (organ-layout-profiles + compatibility).  
Blur: same panel shows section + card + organ for every section row; organ vs “plain section” is determined by role only.

---

## 2) REDUNDANCY DETECTION

### Section layouts (pageLayouts in layout-definitions.json)

| Layout ID | Notes | Recommendation |
|-----------|--------|----------------|
| hero-centered | Single column hero | KEEP |
| hero-split | Split, media right | KEEP |
| hero-split-image-right | Same as hero-split (same componentLayout) | **MERGE** into hero-split (or treat as alias) |
| hero-split-image-left | Split, media left | KEEP (or merge with hero-split + param) |
| hero-full-bleed-image | Full-bleed hero | KEEP |
| content-narrow | Narrow column | KEEP |
| content-stack | Stacked bands | KEEP |
| image-left-text-right | Image left, text right | KEEP |
| features-grid-3 | 3-col grid | KEEP |
| feature-grid-3 | Typo/variant of features-grid-3; same componentLayout shape | **MERGE** into features-grid-3 (DELETE alias) |
| testimonial-band | Testimonial row | KEEP |
| cta-centered | CTA block | KEEP |
| test-extensible | Test layout | **DELETE** or UNCLEAR (dev-only?) |

**Group summary:**  
- **KEEP:** hero-centered, hero-split (with image side), hero-split-image-left, hero-full-bleed-image, content-narrow, content-stack, image-left-text-right, features-grid-3, testimonial-band, cta-centered.  
- **MERGE:** hero-split-image-right → hero-split; feature-grid-3 → features-grid-3.  
- **DELETE:** test-extensible (or move to dev-only).  
- **UNCLEAR:** test-extensible purpose.

### Card layouts (capabilities + layout-requirements)

- **IDs in use:** image-top, image-left, image-right, image-bottom, centered-card, centered-image-left, centered-image-right (7).  
- **Redundancy:** layoutThumbnailRegistry maps “centered” to cta-centered.svg; capabilities use “centered-card”. No duplicate card IDs; possible visual similarity between centered-card and centered-image-* (thumbnail reuse).  
- **Recommendation:** **KEEP** all 7; consider **MERGE** only if centered-card and centered-image-left/right are deemed redundant by design.

### Organ internal layouts (organ-layout-profiles.json)

- **Counts per organ:** hero 9, header 12, nav 4, footer 5, content-section 4, features-grid 4, gallery 4, testimonials 4, pricing 5, faq 3, cta 4.  
- **Redundancy:** Many organ internal IDs are semantically similar (e.g. header: default, minimal, centered, logo-center; nav: default, dropdown, mobile-collapse, centered-links).  
- **Recommendation:** Group by **KEEP** (primary), **MERGE** (visual/behavior duplicates), **DELETE** (unused or redundant). Full matrix would require design input; for reduction, propose cutting to 2–4 options per organ where possible.

### Layout JSON / registry overlap

- **layout-definitions.json:** pageLayouts + templates + componentLayouts (single file).  
- **layout-requirements.json:** section + card + organ requirement (required slots).  
- **organ-layout-profiles.json:** organ capabilities + internalLayoutIds.  
- **capabilities.ts (TS):** SECTION_TO_CARD_CAPABILITIES (section → card allow-list). Documented gap: not JSON; unknown section id returns ALL_CARD_PRESETS.  
- **Overlap:** Section layout IDs appear in layout-definitions (pageLayouts), layout-requirements (section.layoutRequirements), and capabilities (keys). feature-grid-3 vs feature-grid-3 appears in both definitions and requirements — reinforces MERGE.

---

## 3) OPTION OVERLOAD ANALYSIS

### Why too many options appear

1. **All section layouts shown per section**  
   - `sectionPresetOptions[k] = sectionLayoutIds` for every section (page.tsx). So every row gets the full list (13 section layout IDs).  
   - Filtering: `sectionOptionsFiltered = presetOptions.filter(evaluateCompatibility(..., sectionLayoutId).sectionValid)`. So the list is only reduced when `sectionNode` is present and compatibility is evaluated.  
   - **If sectionNodesByKey is always passed and compatibility works:** only compatible section layouts show. **If sectionNodesByKey is missing or empty:** presetOptions is the full 13 (or 12 after merge). So overload can come from (a) missing section node for a row, or (b) many layouts having empty `requires` (always valid).

2. **Compatibility “always valid”**  
   - layout-requirements: section layouts with `requires: []` (e.g. content-narrow, content-stack, test-extensible) are always valid. So for any section, those show up.  
   - So even with filtering, 3+ section layouts can be always valid, and the rest depend on slots (heading, body, image, card_list). If the extractor is permissive or slots are often present, most of the 13 can appear.

3. **Card options**  
   - `allowedCardPresets = getAllowedCardPresetsForSectionPreset(currentSectionPreset)`. For section layouts not in SECTION_TO_CARD_CAPABILITIES, fallback is **ALL_CARD_PRESETS** (7). So unknown or unlisted section (e.g. content-stack not in capabilities) gets all 7 card options.  
   - Then cardOptionsFiltered filters by cardValid. So card overload = section→card allow-list is too broad (or fallback gives all 7) + many card layouts have no or few required slots.

4. **Organ internal options**  
   - `internalLayoutIds = getInternalLayoutIds(organId)` — e.g. header gets 12, hero gets 9. No further “recommended” or “primary” subset; all are shown.  
   - Organ dropdown only shows when `organId` is set and `organTileOptions.length > 1`. So overload = too many internal layout IDs per organ in organ-layout-profiles.json.

5. **Automatic detection / over-generation**  
   - Section keys come from `collectSectionKeysAndNodes(treeForRender?.children)` — every top-level section gets a row. So “automatic” = one row per section; no over-generation of rows.  
   - Over-generation is in **option counts per row:** full section list (before compatibility), full card list (fallback + compatibility), full organ internal list. There is no “recommended” or “primary” shortlist; no component-count-based further reduction (e.g. “only show 2-col if items ≥ 2”).

**Summary:**  
- Filtering **is** in place (evaluateCompatibility for section/card/organ).  
- Overload comes from: (1) full section list when compatibility is permissive or section node missing, (2) section→card fallback returning all card presets for unknown section, (3) no shortening of organ internal list, (4) redundant/duplicate section layout IDs (hero-split vs hero-split-image-right, feature-grid-3 vs feature-grid-3) increasing list size and confusion.

---

## 4) SIMPLIFICATION PLAN (PROPOSED TARGETS)

- **Screen layouts:** Not from layout registry; keep as-is (Website/App/Learning = 3). No change to count.  
- **Section layouts:** **4–6 recommended visible per context.**  
  - Reduce registry: merge hero-split-image-right into hero-split; merge feature-grid-3 and feature-grid-3; remove test-extensible (or dev-only).  
  - Then ~10–11 section layout IDs. Use compatibility so only 4–6 are valid per section (tighten requirements or slot detection so not every layout is valid). Optionally add a “recommended” or “primary” subset in JSON (e.g. 4–6 section layout IDs marked primary) and show those first or only in a compact UI.  
- **Card layouts:** **4–8 max.**  
  - Keep 7; move section→card to JSON and for unknown section return [] or a small default set (e.g. [centered-card]) instead of ALL_CARD_PRESETS. That prevents “all 7 always” for unknown sections. Optionally restrict to 4–5 “primary” card layouts per section in JSON.  
- **Organ layouts:** **Context-driven only.**  
  - Keep organ internal options only when section is an organ (`organId` set). Per organ, reduce to 2–4 “primary” internal layouts in data or in UI (e.g. “default” + 1–3 variants), or keep full list but in a “More…” secondary UI to avoid clutter.

**Concrete steps (proposal only):**  
1. Merge/remove redundant section layout IDs (hero-split-image-right, feature-grid-3, test-extensible).  
2. Move SECTION_TO_CARD_CAPABILITIES to JSON; unknown section → [] or small default.  
3. Add optional “primary” or “recommended” flags in JSON for section and organ internal layouts; UI shows primary first or only in compact mode.  
4. Tighten section layout requirements where too many are valid (e.g. require at least one slot where possible).  
Do not implement in this pass; only propose.

---

## 5) NAVBAR SPECIAL CASE ANALYSIS

- **Navbar / header in data:**  
  - **header** organ: internalLayoutIds = default, sticky-split, transparent, minimal, centered, full-width, mega-ready, shrink-on-scroll, with-announcement, compact, logo-center, nav-left (12).  
  - **nav** organ: internalLayoutIds = default, dropdown, mobile-collapse, centered-links (4).  
  - layout-requirements organ.organLayoutRequirements.header / nav define required slots (e.g. logo, cta, primary).

- **What dropdowns control today:**  
  - **Section layout:** For a section with role “header” or “nav,” the section layout dropdown still shows all compatible *section* layouts (pageLayouts). So the same “hero-split, content-narrow, …” appear. That is likely wrong for header/nav: they are not “hero” or “content-narrow”; they are chrome.  
  - **Organ internal layout:** When organId is header or nav, the organ internal dropdown shows the 12 or 4 options. That is the right level for “how the navbar/header looks.”

- **What belongs in layout vs style vs behavior:**  
  - **Layout (dropdown):** Structure — logo left/center/right, nav links inline vs dropdown vs mobile collapse, sticky vs static, with/without announcement bar. That is “organ internal layout” (already in organ-layout-profiles).  
  - **Style (styling layer):** Colors, typography, spacing, border — not layout IDs. Palette/skin.  
  - **Behavior:** Sticky scroll, dropdown open/close, mobile menu toggle — behavior/UX, not layout dropdown.  
  - **Slot rules:** Header needs logo (and optionally cta); nav needs primary (links). Requirement registry already encodes this; compatibility filters by slots.

- **Recommendation:**  
  - For sections that are **header** or **nav:** either (a) restrict section layout dropdown to a single “chrome” or “navbar” section layout (so section layout for header/nav is not the same list as hero/content), or (b) hide section layout dropdown for header/nav and only show organ internal layout.  
  - Keep navbar/header styling in palette/styling layer; keep behavior in behavior layer.  
  - Slot rules: keep as-is (required slots in layout-requirements); ensure content-capability-extractor maps header/nav slots (logo, cta, primary) so compatibility works.

---

## 6) PREVIEW IMAGE QUALITY

- **Where thumbnails come from:**  
  - **Section:** OrganPanel uses `getSectionLayoutThumbnail(id)` from `layout/layoutThumbnails.tsx`, which returns `<LayoutThumbnail layoutId={id} />`. LayoutThumbnail uses **inline LAYOUT_BLUEPRINTS** (LayoutThumbnail.tsx) for 14 section layout IDs; unknown id falls back to `default`. There is also `layoutThumbnailRegistry.ts` (SECTION_LAYOUT_THUMBNAILS) mapping ids to `/layout-thumbnails/*.svg`; that registry is used elsewhere (e.g. LayoutTilePicker fallback when thumbnail is string). OrganPanel uses the React component (layoutThumbnails.tsx → LayoutThumbnail), not the registry SVGs for section.  
  - **Card:** getCardLayoutThumbnail(id) → DiagramSvgCard(id) in layoutThumbnails.tsx (inline wireframes by id pattern: top/bottom, left/right, else centered).  
  - **Organ:** getOrganLayoutThumbnail(id) → DiagramSvgOrgan(id) in layoutThumbnails.tsx (large switch on id for header, nav, footer, hero, content-section, features-grid, gallery, testimonials, pricing, faq, cta).  
  - **Static SVGs:** public/layout-thumbnails/*.svg (12 files). Used by layoutThumbnailRegistry and as fallback in LayoutTilePicker when thumbnail is missing (default.svg).

- **Why they can look generic/dated:**  
  - Inline DiagramSvg* and LayoutThumbnail blueprints are wireframes (rects, bands, simple shapes). Consistent but minimal.  
  - Static SVGs in public/ are semantic but still diagrammatic; not real screenshots.  
  - Multiple section layout IDs share the same blueprint or SVG (e.g. hero-split and hero-split-image-right same blueprint; hero-split-image-left uses content-left). So variety is low.  
  - Card/organ thumbnails are one diagram per “pattern” (e.g. left/right/top/bottom), not per layout id, so many ids look the same.

- **Auto-generated?**  
  - No. All are hand-authored: LAYOUT_BLUEPRINTS in LayoutThumbnail.tsx, DiagramSvg* in layoutThumbnails.tsx, and static SVGs in public/.

- **Better preview strategy:**  
  - Option A: Per-layout-id semantic SVGs (or blueprint entries) so each id has a distinct thumbnail.  
  - Option B: “Live” preview (already present: LayoutLivePreview in OrganPanel for section when mode is “live”) — render a tiny instance of the layout. Improves accuracy but costlier.  
  - Option C: Consolidate to one approach (either registry SVGs or inline blueprints) and ensure every layout id has an entry; remove duplicate mappings so id→preview is 1:1 and recognizable.

---

## 7) CONTEXT-AWARE FILTERING CHECK

- **Is the system counting components / detecting organ types / gating layout choices?**  
  **Yes.**

- **Component/slot counting:**  
  - content-capability-extractor.getAvailableSlots(sectionNode) derives slots from section content and children (heading, body, image, card_list, plus organ slots from organ profile).  
  - evaluateCompatibility compares getRequiredSlots(section|card|organ) to getAvailableSlots(sectionNode). So layout options are gated by “required slots ⊆ available slots.”

- **Organ detection:**  
  - organIdBySectionKey is built from section.role and getOrganLayoutOrganIds(). So only sections whose role is in the organ registry get organ internal layout options.  
  - Organ internal dropdown is only shown when organId is set and organTileOptions.length > 1.

- **Is it working?**  
  - **Section:** Works when sectionNodesByKey is passed. Then sectionOptionsFiltered = presetOptions.filter(evaluateCompatibility(...).sectionValid). So invalid section layouts (e.g. hero-split when no image) can be hidden. If sectionNodesByKey is missing, no filtering (full list).  
  - **Card:** allowedCardPresets from capabilities then filtered by cardValid. So card options are gated by section layout and by slot compatibility.  
  - **Organ:** internalLayoutIds from getInternalLayoutIds(organId), then organOptionsFiltered by organValid !== false. So organ internal options are gated by organ and slots.

- **Where it can break:**  
  1. sectionNodesByKey not passed or wrong key → section dropdown shows full list.  
  2. Empty or permissive requirements (requires: []) → many layouts always valid.  
  3. Fallback getAllowedCardPresetsForSectionPreset(unknown) → ALL_CARD_PRESETS → all card options for that section.  
  4. Slot normalization: content keys or child types must map to canonical slots (heading, body, image, card_list); if extractor misses a slot, compatibility can wrongly invalidate or wrongly allow a layout.

---

## 8) FINAL OUTPUT — STRUCTURED SYNOPSIS

### What is working

- Single source of truth for **section** layout IDs (getSectionLayoutIds from layout-definitions pageLayouts).  
- **Card** options gated by section layout (capabilities) and by compatibility (slots).  
- **Organ internal** options gated by organ id (organ-layout-profiles) and compatibility.  
- **Filtering** is implemented in OrganPanel and SectionLayoutDropdown (evaluateCompatibility).  
- **Slot extraction** from section node (content + children + organ slots) and requirement registry (section/card/organ) are wired.  
- **Organ detection** (role → organId) limits organ internal dropdown to relevant sections.  
- **Live preview** mode exists for section layout thumbnails.

### What is overbuilt

- **Organ internal layout counts** per organ (e.g. header 12, hero 9) with no “primary” subset.  
- **Section layout list** includes redundant/alias IDs (hero-split-image-right, feature-grid-3, test-extensible).  
- **Two thumbnail systems** (inline LayoutThumbnail blueprints + layoutThumbnailRegistry + static SVGs) with overlapping coverage and fallbacks.  
- **Section layout dropdown** shown for every section including header/nav, where a single “chrome” option or organ-only control would suffice.

### What is redundant

- **hero-split** and **hero-split-image-right** (same componentLayout).  
- **features-grid-3** and **feature-grid-3** (typo duplicate).  
- **Section→card allow-list** in TypeScript (capabilities.ts) with fallback to all card presets; should be JSON with explicit default.  
- **Multiple thumbnail sources** for the same layout id (blueprint vs registry vs default.svg).

### What is missing

- **Screen layout** as a small, explicit “page frame” set (beyond Experience Website/App/Learning); if desired, a separate 4–6 option “page layout” could be added.  
- **Primary/recommended** subset for section and organ internal layouts to reduce visible options.  
- **Section layout restriction** for header/nav (chrome-only or hide section layout for those rows).  
- **JSON section→card allow-list** and no fallback to all presets for unknown section.  
- **1:1 layout-id → thumbnail** for every id (no duplicate mappings, no missing thumbnails).

### What should be simplified

- **Section layouts:** Merge duplicates; remove test-extensible or limit to dev; aim 4–6 relevant options per section via compatibility and/or primary flags.  
- **Card layouts:** Keep 7; move allow-list to JSON; unknown section → [] or small default.  
- **Organ internal:** Show 2–4 primary options per organ or move “More” to secondary UI.  
- **Navbar/header:** Restrict or hide section layout for header/nav; rely on organ internal layout + styling layer.  
- **Thumbnails:** Single strategy (e.g. LayoutThumbnail blueprints for all, or registry + static SVGs for all); full coverage; no duplicate ids sharing same preview.  
- **Option overload:** Ensure sectionNodesByKey is always passed; tighten requirements where too many layouts are valid; add primary/recommended in data or UI.

---

**End of report. No code or file changes performed.**
