# Blueprint Species Definition

**Authority:** This document defines two contractually distinct blueprint types. No runtime or compiler changes implied.

**Canonical location:** `docs/blueprint_upgrade/`. References: blueprint.ts, BLUEPRINT_UNIVERSE_CONTRACT.md, organ-index.

---

## A) ORGAN BLUEPRINT

- **Definition:** Structural unit that emits only molecule trees. No organ calls allowed inside an organ blueprint.
- **Purpose:** Reusable layout/structure unit; defined by organ index (slots, variants). When used by an organism, it is referenced by `organ:organId` and expanded at compile-time.

### Allowed syntax (full grammar)

- **Node line:** `rawId | name | type [slot, ...] (verb)` with optional inline `@id(...)` and `@aliases(...)`.
- **Continuation lines:** `-> target` (arrow), `state.bind: key`, `(logic.<type>: expr)`, `variant: <name>`, `@id(...)`, `@aliases(...)`.
- **No** `organ:organId` line allowed inside an organ blueprint.
- **SEQUENCE:** block allowed at top (ordering of root-level nodes).
- **APP:** line allowed as header (skipped by parser).

### Must emit molecules only

- Every node in an organ blueprint is either a molecule type (from the closed set) or structural (e.g. section). No `type === "organ"` node may appear in an organ blueprint’s own definition.

### Must declare slot contract

- Slots are declared per organ in the organ index (e.g. organ-index.json): `slots: string[]`, `variants: string[]`.
- Organ blueprint authority: slot keys and variant set are fixed by the index; content is supplied by the caller via content.txt keyed by rawId and slotKey.

### Must declare allowed behaviors

- Behaviors allowed on molecules within the organ follow BLUEPRINT_UNIVERSE_CONTRACT (Interaction / Navigation / Action verbs per molecule). Organ itself has no behavior; expanded molecules may.

### Content ingestion rules (content.txt scope)

- Content for an organ instance is scoped by the node rawId in the organism’s content.txt. Keys must match the organ’s declared slot keys. No content key may be invented outside the slot contract.

### Deterministic compile guarantee

- Same organ definition (index) + same content block (rawId + slot keys) → same expanded molecule tree. No hidden state or non-determinism.

---

## B) ORGANISM BLUEPRINT

- **Definition:** Application-level blueprint. Composes organs and molecules into one tree. One organism blueprint per app/screen (e.g. one blueprint.txt per app folder).

### Allowed syntax (same grammar)

- **Node line:** `rawId | name | type [slot, ...] (verb)` or `rawId | name | organ:organId [slot, ...]`.
- **Continuation lines:** `-> target`, `state.bind: key`, `(logic.<type>: expr)`, `variant: <name>`, `@id(...)`, `@aliases(...)`.
- **SEQUENCE:** block allowed at top.
- **APP:** line allowed as header.

### May call organ:organId

- Organism blueprint may contain lines of the form `rawId | name | organ:organId [slot, ...]`. organId must exist in the organ index.

### May not define new molecule layout patterns unless explicitly allowed

- Molecule types are from the contract closed set. Layout/structure for molecules is defined by layout contract and engines, not by organism blueprint. No ad-hoc layout invention.

### May not override organ internal structure

- Organism supplies content via declared slot keys only. It may not change the organ’s internal tree (slots, variant set, or expansion shape); that is fixed by the organ index.

### Must pass content via declared slot keys

- Content for an organ node is keyed by rawId in content.txt. Keys must be slot keys from the organ index for that organId. Validation: keys not in the organ’s slots are invalid.

### Compile rule: organ references expand into molecule trees at compile-time

- At compile-time, each `organ:organId` node is resolved against the organ index. Slot content from content.txt (for that rawId) is injected. The result is a molecule tree (or equivalent structure). Expansion is deterministic; no runtime inference of organ structure.

---

## Summary

| Species        | organ: allowed? | Emits              | Content scope      |
|----------------|-----------------|--------------------|--------------------|
| Organ blueprint| No              | Molecules only     | Slot contract only |
| Organism blueprint | Yes         | Organs + molecules | rawId + slot keys  |
