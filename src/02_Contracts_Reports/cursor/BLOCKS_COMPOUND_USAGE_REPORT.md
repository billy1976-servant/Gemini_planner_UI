# Blocks Compound Usage Report

**Scope:** `src/compounds/ui/`, `src/compounds/ui/12-molecules/`  
**Purpose:** Per-compound usage for registry, json-renderer, layout, screen JSON, and redundancy risk.

---

## Compound TSX files

| Compound | Imported By | Used In Registry? | Used In Screens? | Likely Active? | Redundant Risk |
|----------|-------------|--------------------|------------------|----------------|----------------|
| **section.compound** | engine/core/registry.tsx, BaseCompound.tsx, layout (resolveMoleculeLayout / SectionCompound) | YES | YES (Section in apps-json, organs, content skins) | YES | LOW |
| **button.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (Button in apps-json, organs, skins) | YES | LOW |
| **card.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (Card in apps-json, organs, skins) | YES | LOW |
| **avatar.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (avatar/contracts) | YES | LOW |
| **chip.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (chip in definitions) | YES | LOW |
| **field.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (Field/field in JSON) | YES | LOW |
| **footer.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (Footer in definitions) | YES | LOW |
| **list.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (List in definitions) | YES | LOW |
| **modal.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (modal in contract) | YES | LOW |
| **stepper.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | Possible (stepper in definitions) | YES | LOW |
| **toast.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | Possible | YES | LOW |
| **toolbar.compound** | engine/core/registry.tsx, BaseCompound.tsx | YES | YES (toolbar in contract) | YES | LOW |
| **navigation.compound** | BaseCompound.tsx only (not in registry.tsx) | NO | NO (type "Navigation" not in Registry; no screen JSON uses it as node type) | NO | HIGH |
| **pricing-table.compound** | None | NO | NO | NO | HIGH |
| **BaseCompound.tsx** | ContentCompound.tsx only | NO (JsonRenderer uses Registry, not BaseCompound) | NO | NO | MED |
| **ContentCompound.tsx** | None | NO | NO | NO | HIGH |

---

## Notes

- **json-renderer** uses `definitions` from `@/compounds/ui/index` (compound-definitions.json) for variant/size/param resolution; it uses **Registry** from `engine/core/registry.tsx` for component lookup. So "Used In Registry?" = used by JsonRenderer at runtime.
- **Layout system:** Section compound is used via Registry when JsonRenderer renders a node with `type: "Section"`; `resolveMoleculeLayout` and `LayoutMoleculeRenderer` work with Section output. No direct import of section.compound in layout; flow is json-renderer → Registry → Section.
- **Screen JSON:** apps-json apps (e.g. journal_track, behavior-tests, Layout_Dropdown), organs variants, and content/sites compiled skins reference `type: "Section"`, `"Button"`, `"Card"`, etc. Navigation and pricing-table are not referenced as node types in screen JSON.
- **navigation.compound.tsx** has definitions/navigation.json and is referenced in compound-definitions.json for "navigation" definition, but Registry does not map `navigation`/`Navigation` to a component, so JSON screens cannot render it as a block.
- **pricing-table.compound.tsx** is not imported by registry, BaseCompound, or any other file; safe candidate for future use or removal after confirmation.
- **molecules.json** (registry catalog) references component paths that do not match actual filenames (e.g. AvatarCompound vs avatar.compound.tsx); styler uses that catalog; engine Registry uses direct TSX imports.
