# ROUND 2 — Authority Collapse Map

**Purpose:** Identify collapse targets for "single authority" per domain. Planning only.

---

## 1. Layout authority

### Current

| Authority | File | Output |
|-----------|------|--------|
| Page layout id | layout/page/page-layout-resolver.ts | getPageLayoutId, getPageLayoutById, getDefaultSectionLayoutId |
| Component layout | layout/component/component-layout-resolver.ts | resolveComponentLayout(layoutId) |
| Unified | layout/resolver/layout-resolver.ts | resolveLayout(layout, context) → page + component merged |
| Profile | lib/layout/profile-resolver.ts | getExperienceProfile, resolveProfileLayout |
| Molecule | lib/layout/molecule-layout-resolver.ts | resolveMoleculeLayout (flow, params) |
| Organ internal | layout-organ/organ-layout-resolver.ts | resolveInternalLayoutId(organId, layoutId) |
| Override application | engine/core/json-renderer.tsx | applyProfileToNode: overrideId ?? node.layout ?? templateDefault |

### Collapse targets

| Target | Action | Result |
|--------|--------|--------|
| **Layout resolution** | Keep unified resolver as sole public API; page + component remain internal. Option: move profile default selection into layout (single "get section layout id from profile + overrides + node"). | Single call site: resolveLayout(layout, context). |
| **Profile** | Either (a) layout/resolver consumes profile for "default when no node.layout", or (b) page.tsx remains caller of getTemplateProfile/getExperienceProfile and passes to JsonRenderer. Collapse (a) reduces decision points. | One authority for "default section layout from template". |
| **Molecule layout** | Used by LayoutMoleculeRenderer; already called with resolved moleculeLayout from resolveLayout. No collapse with page/component; could co-locate molecule definitions under layout/ if desired. | Optional: layout/ owns all layout JSON. |
| **Organ internal** | Stays separate (organ-internal layout, not section layout). Single authority already (layout-organ). | No change. |
| **Override application** | Keep in JsonRenderer; overrides are "input" to layout. Single authority for "which override map" could be one getLayoutOverrides(screenKey) from state + stores. | Optional: one override aggregator. |

### Risk

- Moving profile into layout/resolver adds layout → lib/layout/presentation dependency (or move presentation into layout). Low risk if profile is read-only data.

---

## 2. Resolver chains

### Current

| Resolver | Single entry? | Collapse? |
|----------|----------------|-----------|
| state-resolver | Yes (deriveState) | No. |
| layout-resolver | Yes (resolveLayout) | See §1. |
| profile-resolver | Yes; called from page + layout index (getExperienceProfile, getTemplateProfile) | Merge into layout or keep as data layer. |
| content (logic) | Yes (resolveContent) | No. |
| content (content/) | No (legacy, unused) | Remove or stub. |
| flow-resolver | Yes | Keep (secondary path). |
| landing-page-resolver | Yes | Keep. |
| view-resolver | Yes | Keep (secondary). |
| resolve-organs | Yes (expandOrgansInDocument) | No. |
| palette / token | Yes | No. |
| calc-resolver | No callers | Remove or mark optional. |

### Collapse targets

| Target | Action |
|--------|--------|
| **content/content-resolver** | Remove from runtime imports; delete or keep as legacy stub with @deprecated. |
| **calc-resolver** | Remove or document "optional flow integration"; no main-path callers. |
| **Profile + layout** | Option: layout/resolver accepts optional "profileId/templateId" and resolves default section layout id; page passes templateId only. |

---

## 3. Registry ownership

### Current

| Registry | Owner | Collapse? |
|----------|--------|-----------|
| Component (type → React) | engine/core/registry.tsx | No; single source. |
| Compound definitions (type → JSON) | compounds/ui/definitions/registry.ts | Could be one manifest.json; optional. |
| Organ variants | organs/organ-registry.ts | Single source; optional: manifest-driven load. |
| requirement-registry | layout/compatibility | Keep. |
| control-registry | logic/controllers | Secondary. |
| action-registry | logic/runtime | Single for actions; keep. |
| engine-registry | logic/engine-system | Secondary; keep or document as optional. |
| calculator / calc-registry | logic/engines/calculator, logic/registries | Consolidate to one calc registration if both used. |

### Collapse targets

| Target | Action |
|--------|--------|
| **Calculator registries** | Single calc registration surface (one module exporting registerCalc / getCalc). |
| **Registry naming** | Document: "Registry" = engine/core (component map); "catalogs" = definitions, organs, layout IDs. No code merge. |

---

## 4. Runtime decision points

### Current

| Decision | Where | Collapse? |
|----------|--------|-----------|
| Screen load | page.tsx | No. |
| Section layout id | applyProfileToNode (JsonRenderer) | Option: delegate to layout module "resolveSectionLayoutId(screenKey, sectionKey, node, templateId, overrides)". |
| Layout definition | layout-resolver | No. |
| Behavior branch | behavior-listener | No. |
| Action dispatch | action-registry | No. |
| State derivation | state-resolver | No. |

### Collapse target

- **Section layout id:** Move "override ?? node.layout ?? templateDefault" into layout/ (e.g. getSectionLayoutId(...)) so JsonRenderer only calls layout API; single authority for "which layout id" lives in layout. Low risk; improves testability.

---

## 5. Summary: authority merges (ROUND 2)

| # | Merge | From | To | Risk |
|---|-------|------|-----|------|
| 1 | Layout default from template | getTemplateProfile + getDefaultSectionLayoutId (page) + applyProfileToNode | layout/resolver (or new getSectionLayoutId in layout) | Low |
| 2 | Section layout id resolution | applyProfileToNode inline logic | layout.getSectionLayoutId(screenKey, sectionKey, node, templateId, overrides) | Low |
| 3 | Content resolver | content/content-resolver.ts | Remove or stub; logic/content only | Low |
| 4 | Calc resolver | logic/runtime/calc-resolver.ts | Remove or document optional | Low |
| 5 | Calculator registration | calculator.registry + calcs/calc-registry | Single calc registration module | Medium |
| 6 | Override aggregation | section-layout-preset-store + organ-internal (separate getters) | One getLayoutOverrides(screenKey) returning all override maps | Low |

---

*End of AUTHORITY_COLLAPSE_MAP.md*
