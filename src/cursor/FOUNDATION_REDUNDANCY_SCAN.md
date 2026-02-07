# Foundation Redundancy Scan

**Purpose:** Detect and list compounds never used, atom primitives never imported, schema never referenced, engines never called, and registry entries pointing to missing files. No deletions or changes.

---

## 1) Compounds never used (runtime)

| Compound | Evidence |
|----------|----------|
| **ContentCompound.tsx** | No file imports ContentCompound. Only references are ContentCompound importing BaseCompound and doc/reachability. |
| **pricing-table.compound.tsx** | Not imported by engine/core/registry.tsx or BaseCompound.tsx. No screen JSON uses type "pricing-table" or "PricingTable". Only imports are palette-resolver (shared). |
| **navigation.compound.tsx** | Not in engine/core/registry.tsx (Registry has no navigation/Navigation key). BaseCompound REGISTRY does not include navigation. definitions/navigation.json exists but no component is bound for type "navigation" in JsonRenderer. |

**Note:** BaseCompound.tsx is only imported by ContentCompound.tsx; JsonRenderer uses Registry (direct molecule imports), not BaseCompound. So BaseCompound is an alternate path, not used by the main JSON screen pipeline.

---

## 2) Atom primitives never imported

**Result:** All atom primitives are imported.

- **collection, condition, field, media, sequence, shell, surface, text, trigger** — Imported by engine/core/registry.tsx and/or by compounds (12-molecules) and layout/LayoutMoleculeRenderer.
- **select** — Imported only by engine/core/registry.tsx (not re-exported from components/9-atoms/index.ts).

No atom primitive is completely unused.

---

## 3) Schema files never referenced

| File | Evidence |
|------|----------|
| **src/compounds/schema/content.schema.json** | No import or require in codebase. diagnostics.json lists "src/compounds/schema" as a directory only. |
| **src/compounds/schema/media.schema.json** | Same. |
| **src/compounds/schema/surface.schema.json** | Same. |

Schema files are not referenced by runtime or build; only the directory appears in diagnostics config. Likely for tooling or future validation.

---

## 4) Engines never called

| Entry | Evidence |
|-------|----------|
| **engine/runners/engine-runner.tsx** | No static import. Only a comment in app-loader and SRC_EXPORT.json. Documented as event-only / not mounted. |
| **engine/loaders/theme-loader.ts** | No imports from @/engine/loaders/theme-loader anywhere. ui-loader and ux-loader are referenced; theme-loader is not. |
| **engine/core/styler.tsx** (default Styler export) | No file imports styler or StyleProvider. Styler provides StyleContext; no consumer found in codebase (reachability marks styler as break). |

---

## 5) Registry entries pointing to missing files

**A) src/registry/molecules.json (catalog used by engine/core/styler.tsx)**

| Key | component path in JSON | Actual file | Match? |
|-----|-------------------------|-------------|--------|
| avatar | @/compounds/ui/12-molecules/AvatarCompound | avatar.compound.tsx | NO (name + no extension) |
| button | @/compounds/ui/12-molecules/ButtonCompound.tsx | button.compound.tsx | NO (name + extension) |
| card | @/compounds/ui/12-molecules/CardCompound | card.compound.tsx | NO |
| chip | @/compounds/ui/12-molecules/ChipCompound | chip.compound.tsx | NO |
| field | @/compounds/ui/12-molecules/FieldCompound | field.compound.tsx | NO |
| footer | @/compounds/ui/12-molecules/FooterCompound | footer.compound.tsx | NO |
| list | @/compounds/ui/12-molecules/ListCompound | list.compound.tsx | NO |
| modal | @/compounds/ui/12-molecules/ModalCompound | modal.compound.tsx | NO |
| section | @/compounds/ui/12-molecules/SectionCompound | section.compound.tsx | NO |
| stepper | @/compounds/ui/12-molecules/StepperCompound | stepper.compound.tsx | NO |
| toast | @/compounds/ui/12-molecules/ToastCompound | toast.compound.tsx | NO |
| toolbar | @/compounds/ui/12-molecules/ToolbarCompound | toolbar.compound.tsx | NO |

**defs paths in molecules.json:** e.g. `@/compounds/ui/12-molecules/definitions/avatar.json`. The folder **src/compounds/ui/12-molecules/definitions/** does not exist. Compound definitions live in **compound-definitions.json** (single file at compounds/ui/). So every **defs** entry in molecules.json points to a missing file.

**B) src/engine/core/registry.tsx (code)**

Registry.tsx uses direct TS imports (e.g. `import Section from "@/compounds/ui/12-molecules/section.compound"`). Those paths match actual files. No missing files for the runtime Registry.

**Summary:** The **data** registry (registry/atoms.json, registry/molecules.json) used by styler contains path strings that do not match actual filenames and, for molecules, point to a non-existent definitions folder. The **code** registry (engine/core/registry.tsx) is correct.
