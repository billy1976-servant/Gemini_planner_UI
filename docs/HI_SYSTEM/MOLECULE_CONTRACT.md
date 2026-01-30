# Molecule Universe Contract

**Purpose:** Lock the UI molecule/atom universe. All definition JSONs in `src/compounds/ui/definitions/*.json` must conform.

---

## Allowed types

- **12 molecules:** avatar, button, card, chip, field, footer, list, modal, section, stepper, toast, toolbar.
- **9 atoms:** text, media, surface, sequence, trigger, collection, condition, shell, field (FieldAtom).

---

## Allowed variants and sizes per type

| Type   | Variants | Sizes |
|--------|----------|-------|
| avatar | circle, square | sm, md |
| button | filled, tonal, outlined, text | sm, md, lg |
| card   | elevated, outlined | sm, md, lg |
| chip   | filled, outlined | sm, md |
| field  | outlined, filled | sm, md |
| footer | standard, dense | sm, md |
| list   | plain, padded, dropdown | sm, md |
| modal  | centered, bottomSheet | sm, md, lg |
| section| standard, subtle | sm, md, lg |
| stepper| primary, line | sm, md |
| toast  | info, error | sm, md |
| toolbar| default, info, error | sm, md, lg |

---

## Content slots (per type)

Slots are the keys used in `content` for each molecule (from blueprint/content). Definition JSONs define styling for variant/size only; slots are contract for what content keys are allowed.

| Type   | Content slots |
|--------|----------------|
| avatar | media, text (optional) |
| button | label |
| card   | title, body, media, actions |
| chip   | title, body, media |
| field  | label, input, error |
| footer | left, right |
| list   | items |
| modal  | title, body, actions |
| section| title |
| stepper| steps |
| toast  | message |
| toolbar| actions |

---

## Molecules that may carry behavior

- **Button, Card, Chip, Footer (children), List (items), Stepper (steps), Toast, Toolbar (children):** May have `behavior` (Action, Navigation, Interaction).
- **Modal:** Only close/dismiss behavior allowed; no custom Action.
- **Section, Avatar, Field:** No behavior except state.bind for Field. Non-actionable molecules must not execute behaviors.

---

## Definition audit checklist

Each `src/compounds/ui/definitions/<type>.json` must have `variants` and `sizes` (or sizes optional where contract says —) and must not list variant/size keys that are not in this contract.

| # | File | Has `variants` | Has `sizes` | Conforms |
|---|------|----------------|-------------|----------|
| 1 | avatar.json | ✓ | ✓ | |
| 2 | button.json | ✓ | ✓ | |
| 3 | card.json | ✓ | ✓ | |
| 4 | chip.json | ✓ | ✓ | |
| 5 | field.json | ✓ | ✓ | |
| 6 | footer.json | ✓ | ✓ | |
| 7 | list.json | ✓ | ✓ | |
| 8 | modal.json | ✓ | ✓ | |
| 9 | section.json | ✓ | ✓ | |
| 10 | stepper.json | ✓ | ✓ | |
| 11 | toast.json | ✓ | ✓ | |
| 12 | toolbar.json | ✓ | ✓ | |

**Validation:** Grep for `variants` and `sizes` in each definition; all 12 files must match. Contract checklist above in doc.

---

*Added per ACTION_PLAN_CURSOR.md Packet 01.*
