# 05 — Layout System

**Source:** Compiled from `src/docs/ARCHITECTURE_AUTOGEN/LAYOUT_RESOLUTION_CONTRACT.generated.md`, `LAYOUT_SIGNAL_PRIORITY.generated.md`, `LAYOUT_DECISION_ENGINE.md`, `CONTEXTUAL_LAYOUT_LOGIC.md`, `TRAIT_REGISTRY_SYSTEM.md`, `RUNTIME_AUTHORITY_LADDER.md`.

---

## Layout resolution order (section layout id)

**Single authority:** `layout.getSectionLayoutId` in `src/layout/section-layout-id.ts`. JsonRenderer calls it from applyProfileToNode; no inline override/node/template logic in the renderer.

**Order:** override (store) → node.layout → template role → template default → undefined.

1. **Section layout preset override** — sectionLayoutPresetOverrides?.[sectionKey] (from getOverridesForScreen(screenKey)).
2. **Explicit node.layout** — node.layout (string, trimmed). Only if no override.
3. **Template role-based** — getPageLayoutId(null, { templateId, sectionRole }) when no override and no explicit node.layout.
4. **Template default** — profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId) from layout/page (templates[templateId].defaultLayout).
5. **Fallback** — undefined. Section compound: when resolveLayout(layout) returns null, render **div wrapper only**; no LayoutMoleculeRenderer; no invented layout ID.

Section params are **stripped** of moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split so JSON cannot supply section layout.

---

## Layout signal priority (canonical order)

| Priority | Source | When |
|----------|--------|------|
| 1 (highest) | Explicit node.layout in JSON | Section/card node has non-empty layout string |
| 2 | Profile overrides (applyProfileToNode) | sectionLayoutPresetOverrides[sectionKey]; cardLayoutPresetOverrides[parentSectionKey] |
| 3 | Template role-based | getPageLayoutId(null, { templateId, sectionRole }) when layout ref missing |
| 4 | Template default | profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId) |
| 5 | Card preset | When no override; mediaPosition, contentAlign |
| 6 | Organ internal layout defaults | resolveInternalLayoutId; organ variant moleculeLayout |
| 7 (lowest) | Component fallback | Section: div when resolveLayout returns null; card: default mediaPosition/contentAlign |

No template default overrides explicit JSON — explicit node.layout always wins.

---

## Stores and resolver files

| Store | File | Purpose |
|-------|------|---------|
| Layout (template/experience/mode) | layout-store.ts | getLayout, subscribeLayout, setLayout; experience, templateId, mode, regionPolicy |
| Section layout preset overrides | section-layout-preset-store.ts | getOverridesForScreen, setSectionLayoutPresetOverride |
| Card layout preset overrides | section-layout-preset-store.ts | getCardOverridesForScreen, setCardLayoutPresetOverride |
| Organ internal layout overrides | organ-internal-layout-store.ts | getOrganInternalLayoutOverridesForScreen, setOrganInternalLayoutOverride |

| Resolver | File | Role |
|----------|------|------|
| resolveLayout, getLayout2Ids, getDefaultSectionLayoutId | layout/resolver/layout-resolver.ts | Merges page + component by id |
| getPageLayoutId, getPageLayoutById, getDefaultSectionLayoutId | layout/page/page-layout-resolver.ts | layout/data/layout-definitions.json (pageLayouts, templates) |
| resolveComponentLayout | layout/component/component-layout-resolver.ts | layout/data/layout-definitions.json (componentLayouts) |
| evaluateCompatibility | layout/compatibility/compatibility-evaluator.ts | required slots vs getAvailableSlots (content-capability-extractor) |
| getRequiredSlots, getRequiredSlotsForOrgan | requirement-registry.ts | section/card/organ requirement JSON |

---

## Component layout merging

- resolveLayout(layout, context): getPageLayoutId → layout id; getPageLayoutById(layoutId) → page def; resolveComponentLayout(layoutId) → component def; return { ...pageDef, moleculeLayout: componentDef ?? undefined }.
- Section compound: resolveLayout(layout); when section is organ, organ variant moleculeLayout overrides layoutDef.moleculeLayout.

---

## Card layout preset and organ internal

- **Card:** cardLayoutPresetOverrides?.[parentSectionKey]; getCardLayoutPreset(cardPresetId); merged into card params (mediaPosition, contentAlign).
- **Organ internal:** organInternalLayoutOverrides passed to JsonRenderer and applyProfileToNode; variantId = overrides[instanceKey] ?? overrides[organId] ?? node.variant ?? "default"; resolveInternalLayoutId(organId, layoutId).

---

## Layout Decision Engine (planned)

- **Purpose:** Score compatible layout IDs by traits, user context, preference weights; output one recommended layout ID (or ranked list). Override > explicit > suggestion > default; engine only suggests.
- **Status:** No runtime code; getLayout2Ids, evaluateCompatibility exist; trait registry and context→weights JSON are prerequisites.

---

## Contextual Layout Logic (planned)

- **Purpose:** From section content structure → suggested traits or trait weights (never layout IDs). Feeds Decision Engine for trait-based scoring.
- **Status:** No implementation; getAvailableSlots exists for future use.

---

## Trait Registry System (planned)

- **Purpose:** Single source of truth layout ID → traits (JSON). Read-only at runtime; consumed by Decision Engine, Contextual Logic, User Preference.
- **Status:** No trait-registry.json or layout-traits.json in codebase; no layout→trait mapping in code.

---

## State and override orchestration (layout domain)

- **Precedence (implemented):** (1) User override (2) Explicit node.layout (3) Logic suggestion [slot reserved] (4) Template role (5) Template default (6) Explicit undefined. layout.getSectionLayoutId returns layoutId; JsonRenderer calls it (no inline precedence in renderer).
- **Override writers:** Only page.tsx/OrganPanel call setSectionLayoutPresetOverride, setCardLayoutPresetOverride, setOrganInternalLayoutOverride. No logic or layout engine calls these.
- **Event timing:** Load screen JSON → apply template profile → run compatibility per section (read-only) → optionally Logic suggestion (read-only) → resolver applies precedence → render uses resolved node. Logic runs before or during resolution; does not run after render to "fix" layout.
- **Non-negotiable:** No cross-engine store writes; no silent fallbacks; no hardcoded layout IDs in logic; all layout decisions explainable from inputs.

---

## Suggestion injection point (planned)

- **Single call site:** Resolver (e.g. applyProfileToNode) would call Logic at one point only: after override and explicit node.layout, before template default. Not yet implemented; slot reserved.
- **Inputs (from Layout):** Section node, template ID, compatible layout ID set (evaluateCompatibility(...).sectionValid === true), optional user context. Logic does not discover layout IDs on its own.
- **Outputs:** Recommended layout ID from compatible set, or null; optional explanation object. No side effects on layout store, override store, or node.layout. Resolver remains single writer for resolved layout on node.

---

## User Preference Adaptation (planned)

- **Purpose:** Capture "more like this" / "less like this"; persist preference weights per trait (trait id → number). Decision Engine reads weights when scoring. No layout store or node.layout writes; only preference memory.
- **Translation:** At signal time get current layout ID(s) → look up trait set from trait registry → apply +/- delta to each trait in preference memory. No layout IDs stored in preference memory. Plan 5 accepts optional preference weights; additive to context scoring.
- **Status:** No runtime code; depends on Trait Registry and Layout Decision Engine.

---

## Authority precedence (layout domain)

| Item | Precedence | Conflict resolution | Where |
|------|------------|---------------------|-------|
| Section layout id | User override → Explicit node.layout → Template role → Template default → undefined | First defined wins; no silent fallback | layout/section-layout-id.ts getSectionLayoutId (JsonRenderer calls it) |
| Section override storage | User only (UI) | Only user action writes | section-layout-preset-store; OrganPanel |
| Card layout preset | User override per section | Override wins | same store; applyProfileToNode cardLayoutPresetOverrides[parentSectionKey] |
| Organ internal layout | User override per section | Override wins | organ-internal-layout-store; applyProfileToNode organInternalLayoutOverrides |
| Template default | Template JSON | When no override, no explicit | getDefaultSectionLayoutId(templateId); templates[templateId]["defaultLayout"] |
| Logic suggestion | Future | Reserved slot (3); logic never overwrites 1 or 2 | Not wired in applyProfileToNode yet |

---

## Compatibility filtering

- **When:** Inside applyProfileToNode for section nodes; dev-only (console.debug).
- **Call:** evaluateCompatibility({ sectionNode, sectionLayoutId: next.layout, cardLayoutId: cardLayoutPresetOverrides?.[sectionKey], organId: node.role, organInternalLayoutId: organInternalLayoutOverrides?.[sectionKey] }).
- **Logic:** getAvailableSlots(sectionNode) vs getRequiredSlots("section", sectionLayoutId), getRequiredSlots("card", cardLayoutId), getRequiredSlotsForOrgan(organId, organInternalLayoutId). Returns sectionValid, cardValid, organValid, missing[].
- **Files:** compatibility-evaluator.ts, requirement-registry.ts (section/card/organ requirement JSON), content-capability-extractor.ts.
