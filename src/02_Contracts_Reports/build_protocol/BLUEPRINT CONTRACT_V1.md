# Blueprint Contract V3

**Authority:** Formalizes TSX organ architecture: molecules = primitive TSX, organs = TSX composed of molecules, organisms = TXT composition. No double-compile, no organ expansion at runtime. No runtime or compiler changes implied by this contract.

**Canonical location:** `src/02_Contracts_Reports/contracts/`. Related: BLUEPRINT_UNIVERSE_CONTRACT.md, BLUEPRINT_CONTRACT_V2.md, V3_ARCHITECTURE_ALIGNMENT.md, APP_BUILD_PROTOCOL_V6.md.

---

## 1) Layer Model

- **Molecules:** Primitive TSX components. Closed set per contract (e.g. section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar). Render primitives only.
- **Organs:** TSX components composed of molecules. Each organ is implemented as a TSX file/component. Organ index declares slots and variants; internal structure is in TSX, not in blueprint expansion.
- **Organisms:** TXT blueprint (e.g. blueprint.txt) that composes organs and molecules. One organism blueprint per app/screen. References organs via `organ:organId`. No second compilation layer.

---

## 2) Organ Definition Model

- **Organs are implemented as TSX files.** Structure and layout of an organ are defined in code (TSX), not by compiling an “organ blueprint” into a tree.
- **Organ index declares slots + variants only.** Index (e.g. organ-index.json) is the authority for which slot keys and variant names an organId accepts. Used for manifest generation and content validation. Does not define internal tree.
- **Blueprint compiler does not expand organ internals.** Compiler emits nodes with `type: "organ"`, `organId`, `variant`, and `content`. It does not replace organ nodes with molecule subtrees. No organ-expansion compile step.

---

## 3) Organism Blueprint Rules

- **May reference organ:organId.** Organism blueprint may contain lines of the form `rawId | name | organ:organId [slot, ...]`. organId must exist in the organ index.
- **May not redefine organ internal structure.** Organism supplies content via declared slot keys only. It cannot change how the organ is implemented or what molecules it contains; that is fixed in TSX.
- **May emit molecules directly only if allowed by contract.** When organism uses molecule types (section, button, etc.), only the contract-defined closed set is allowed. Explicit contract decision required for any new molecule type.
- **No layout logic invention.** Layout and structure come from layout contract and engines. Organism blueprint does not invent new layout patterns or molecule arrangements.

---

## 4) Determinism Clause

- **Compile once.** Single compilation: organism blueprint + content + organ index (for validation/manifest) → one JSON tree. No second compile for organs.
- **No runtime inference.** Runtime consumes the compiled JSON only. It does not infer structure, slots, or organ internals. organId maps to TSX component; content and variant are passed as compiled.
- **No secondary expansion layer.** There is no step (compile or runtime) that expands organ references into molecule trees. Organs are rendered as TSX components.

---

## 5) Forbidden Responsibilities

- **No organ expansion compiler.** No tool or step that compiles an “organ blueprint” into a molecule tree and injects it into organism output. Organs are TSX; structure is in code.
- **No dynamic organ structure mutation.** Organ structure (which molecules, which layout) is fixed by TSX. Runtime and blueprint cannot mutate it. Only content and variant are variable per instance.
- **No runtime structural guessing.** Runtime must not infer or guess structure, slots, or composition beyond what is in the compiled JSON and the fixed TSX organ implementation.
