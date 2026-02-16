# 05 — Layout System

**Source:** Compiled from `src/docs/ARCHITECTURE_AUTOGEN/LAYOUT_RESOLUTION_CONTRACT.generated.md`, `LAYOUT_SIGNAL_PRIORITY.generated.md`, `LAYOUT_DECISION_ENGINE.md`, `CONTEXTUAL_LAYOUT_LOGIC.md`, `TRAIT_REGISTRY_SYSTEM.md`, `RUNTIME_AUTHORITY_LADDER.md`.

---

## Layout resolution order (section layout id)

Applied in **applyProfileToNode**, `src/engine/core/json-renderer.tsx`, for section nodes:

1. **Section layout preset override** — sectionLayoutPresetOverrides?.[sectionKey] (from getOverridesForScreen(screenKey)).
2. **Explicit node.layout** — node.layout (string, trimmed). Only if no override.
3. **Template default** — profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId) from page-layout-resolver (templates[templateId].defaultLayout).
4. **Fallback** — undefined. Section compound: when resolveLayout(layout) returns null, render **div wrapper only**; no LayoutMoleculeRenderer; no invented layout ID.

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
| getPageLayoutId, getPageLayoutById, getDefaultSectionLayoutId | layout/page/page-layout-resolver.ts | page-layouts.json, templates.json |
| resolveComponentLayout | layout/component/component-layout-resolver.ts | component-layouts.json |
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
