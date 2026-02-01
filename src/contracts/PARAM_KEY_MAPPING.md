# Param Key Mapping — Definition ↔ Compound ↔ Contract

This document defines the canonical mapping between:
- **JSON_SCREEN_CONTRACT** `allowedParams`
- **Definition** variant/size keys (in `src/compounds/ui/definitions/*.json`)
- **Compound** prop names (in `src/compounds/ui/12-molecules/*.compound.tsx`)

All three must align. Definitions and compounds must use the **exact** param keys listed here.

---

## Molecule Param Key Mapping

| Molecule | Param Key | Contract | Definition Key | Compound Prop | Notes |
|----------|-----------|----------|----------------|---------------|-------|
| **button** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | label | ✓ | label | params.label | TextAtom (label); fallback: params.text |
| | trigger | ✓ | trigger | params.trigger | TriggerAtom |
| | supportingText | ✓ | — | params.supportingText | TextAtom (optional) |
| **card** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | media | ✓ | media | params.media | MediaAtom |
| | title | ✓ | title | params.title | TextAtom |
| | body | ✓ | body | params.body | TextAtom |
| **section** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | title | ✓ | title | params.title | TextAtom |
| | layout | ✓ | layout | — | moleculeLayout merge |
| **chip** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | text | ✓ | text | params.text | TextAtom (title slot) |
| | body | ✓ | body | params.body | TextAtom |
| | media | ✓ | media | params.media | MediaAtom |
| **avatar** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | media | ✓ | media | params.media | MediaAtom |
| | text | ✓ | text | params.text | TextAtom |
| **field** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | label | ✓ | label | params.label | TextAtom |
| | field | ✓ | field | params.field | FieldAtom (pass-through) |
| | error | ✓ | error | params.error | TextAtom; fallback: params.errorStyle |
| **toast** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | text | ✓ | text | params.text | TextAtom (message slot) |
| **footer** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | item | ✓ | item | params.item | TextAtom (left/right) |
| **list** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | item | ✓ | item | params.item | TextAtom per item |
| **modal** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | title | ✓ | title | params.title | TextAtom |
| | body | ✓ | body | params.body | TextAtom |
| **toolbar** | surface | ✓ | surface | params.surface | SurfaceAtom |
| | item | ✓ | item | params.item | TextAtom per action |

---

## Content Key Mapping

| Molecule | Content Key | Contract | Compound |
|----------|-------------|----------|----------|
| button | label | ✓ | content.label |
| button | supportingText | ✓ | content.supportingText |
| chip | title | ✓ | content.title → params.text |
| chip | body | ✓ | content.body |
| chip | media | ✓ | content.media |
| avatar | media | ✓ | content.media |
| avatar | text | ✓ | content.text |
| field | label | ✓ | content.label |
| field | error | ✓ | content.error |
| toast | message | ✓ | content.message → params.text |

---

## Validation Rules

1. **Definition keys** in variants and sizes MUST match the "Definition Key" column.
2. **Compound props** MUST read `params.<key>` using the "Compound Prop" column.
3. When adding a new molecule, update this file and ensure definition + compound align.
4. Compounds MAY implement fallbacks (e.g. `params.label ?? params.text`) for backward compatibility.
