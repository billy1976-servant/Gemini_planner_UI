# Contracts

**Primary Architecture Reference:** docs/SYSTEM_MASTER/

---

## Molecule universe

- **Doc:** `docs/HI_SYSTEM/MOLECULE_CONTRACT.md`
- **Scope:** 12 molecules (avatar, button, card, chip, field, footer, list, modal, section, stepper, toast, toolbar) and 9 atoms. Allowed variants, sizes, and content slots per type; which molecules may carry behavior (Modal only close; Section, Avatar, Field no behavior except state.bind for Field).
- **Enforcement:** Definition JSONs in `src/compounds/ui/definitions/*.json` must conform. Registry and compounds are the runtime implementation.

---

## Behavior contract

- **Doc:** `docs/HI_SYSTEM/BEHAVIOR_CONTRACT.md`
- **Kinds:** Interaction, Navigation, Action, Mutation. Tokens: tap, go, back, append, update, remove, etc.
- **Source of truth:** `src/contracts/behavior-intent.ts`. Normalization: `src/contracts/behavior-normalize.ts`. Runtime: `src/engine/core/behavior-listener.ts` routes events; legacy `state:*` mapped to state-store dispatch.

---

## Blueprint universe

- **Doc:** `src/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md`
- **Scope:** Exhaustive allowed blueprint elements (molecules × variants × sizes × content slots, behavior rules). Used for validation and compiler alignment.

---

## Slot naming (layout compatibility)

- **Doc:** `src/layout/requirements/SLOT_NAMES.md`
- **Section/card slots:** heading, body, image, card_list. Content capability extractor normalizes child types and content keys to these names. Requirement JSONs (section-layout-requirements.json, card-layout-requirements.json) use the same names.
- **Organ slots:** Per organ in `organ-layout-profiles.json` under capabilities.slots (e.g. title, items, primary, logo, cta). Extractor uses organ profile when section has matching role.

---

## Logic–layout boundary

- **Rule:** Logic suggests (traits, weights, or recommended layout id from scoring); layout resolves. Logic does not write to layout store or to node.layout. Layout does not write to logic stores. Override precedence: user override → explicit node.layout → template default (and optionally logic suggestion when integrated).
- **Layout APIs used by UI:** getAvailableSlots(sectionNode), evaluateCompatibility(args), getLayout2Ids(), getRequiredSlots, getRequiredSlotsForOrgan. All read-only.
