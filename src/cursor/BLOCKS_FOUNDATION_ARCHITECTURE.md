# Blocks Foundation Architecture

**Purpose:** Define a unified "blocks" foundation layer concept only. No moves or renames in this document.

---

## Concept: foundation layer

Unify **atoms**, **compounds**, and **schema** under a single **blocks foundation** so that:

- **Atoms** = primitives (smallest UI building blocks; param definitions in one manifest).
- **Compounds** = blocks (molecules composed of atoms; definitions + runtime TSX).
- **Schema** = contracts (content/media/surface shapes; validation and tooling).
- **Registry** = binding layer (type string → component; connects JSON screen tree to React).

---

## Target structure (conceptual)

```
foundation/
  blocks/
    atoms.manifest.json     <- single manifest (created in this pass)
    compounds.manifest.json <- future: single compound definition authority
    schema.manifest.json    <- future: content/media/surface contract index
  runtime/
    registry mapping       <- current: engine/core/registry.tsx (type → component)
    renderer bridges       <- current: json-renderer uses Registry + definitions
```

- **blocks/** holds manifest JSON only (data). No TSX here.
- **runtime/** is the conceptual home for the code that binds manifests to React: registry (type → component) and renderer (tree → DOM). Today that code lives in `engine/core/`; the foundation concept does not require moving it yet.

---

## Atoms = primitives

- **Definition:** Smallest UI units (text, media, surface, field, trigger, condition, collection, sequence, shell).
- **Source:** `src/components/9-atoms/definitions/*.json` (unchanged).
- **Mirror:** `src/foundation/blocks/atoms.manifest.json` — single consolidated manifest for future use. Keys and parameters copied exactly; no behavior change.
- **Runtime:** Primitives live in `src/components/9-atoms/primitives/*.tsx`; Registry maps type → these components.

---

## Compounds = blocks

- **Definition:** Molecules built from atoms (section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar; plus navigation, pricing-table as optional).
- **Data:** `compound-definitions.json` (variants, sizes, params) and optional per-compound definitions (e.g. navigation.json).
- **Runtime:** `src/compounds/ui/12-molecules/*.compound.tsx` and BaseCompound/ContentCompound.
- **Future:** Single `compounds.manifest.json` under `foundation/blocks/` could reference or absorb compound-definitions for one authority.

---

## Schema = contracts

- **Definition:** Data shapes for content, media, surface (e.g. content.schema.json, media.schema.json, surface.schema.json).
- **Current:** `src/compounds/schema/*.schema.json` — not imported by runtime; used for tooling/diagnostics/contracts.
- **Future:** `schema.manifest.json` in `foundation/blocks/` could index these for validation and codegen.

---

## Registry = binding layer

- **Role:** Maps JSON `type` (string) to React component. Single source of truth: `engine/core/registry.tsx`.
- **Consumers:** json-renderer (renderNode uses Registry[type]); no competing type→component maps.
- **Inputs:** Atom primitives and compound TSX; definitions (compound-definitions.json) used by json-renderer for variant/size/param resolution, not for component lookup.

---

## Renderer bridges

- **json-renderer:** Takes screen tree + profile; applies definitions for variant/size/params; looks up component in Registry; renders tree. Bridge between JSON and React.
- **Layout:** Section compound uses resolveMoleculeLayout / LayoutMoleculeRenderer; layout system works on already-resolved Section output.

---

## No moves yet

- No folder renames.
- No import path changes.
- No changes to registry.tsx, json-renderer.tsx, or engine runtime.
- This document describes the target concept and where current pieces logically fit.
