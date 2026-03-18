# V3 Architecture Alignment

**Authority:** Clarifies the actual blueprint/organ architecture. No runtime or compiler changes implied.

**Canonical location:** `docs/blueprint_upgrade/`. References: blueprint.ts, BLUEPRINT_CONTRACT_V2.md, BLUEPRINT_CONTRACT_V3.md.

---

## 1) Organs are TSX components, not compile-expanded blueprint trees

- Organs are implemented as TSX components. Each organ (e.g. hero, header) is a React/TSX component that composes molecules.
- The blueprint compiler does not expand an organ into a subtree of molecule nodes. It emits a single node with `type: "organ"` and `organId`, plus content keyed by slot.
- Organ internal structure and layout are defined in TSX, not by a blueprint expansion step.

---

## 2) Organism blueprint references organId → runtime maps to TSX component

- The organism blueprint (blueprint.txt) may contain lines such as `rawId | name | organ:organId [slots]`. The compiler emits these as nodes with `type: "organ"` and `organId`.
- At runtime, the renderer resolves `organId` to a TSX organ component (e.g. via a registry or import map) and renders that component, passing the compiled content and variant.
- There is no intermediate step that turns an organ reference into a molecule tree. organId → TSX component is the only mapping.

---

## 3) Compiler outputs JSON tree including nodes with type: "organ"

- The blueprint compiler (e.g. npm run blueprint) produces app.json (or equivalent) containing a tree of nodes.
- Some nodes have `type` equal to a molecule name (section, button, card, etc.). Some nodes have `type: "organ"` and an `organId` (and optionally `variant`, `content`).
- The compiler does not replace organ nodes with expanded molecule subtrees. Organ nodes remain in the output JSON as organ nodes.

---

## 4) Runtime renders organ components directly

- The runtime (e.g. TSX wrapper / renderer) receives the compiled JSON. For a node with `type: "organ"`, it looks up the corresponding TSX organ component by organId and renders it, passing node props (content, variant, etc.).
- No runtime expansion of organs into molecule trees. Organs are rendered as components. Their internal structure is defined in TSX.

---

## 5) No recursive blueprint expansion layer exists

- There is no layer that compiles an “organ blueprint” into a molecule tree and then injects that tree into the organism output.
- The organ index (e.g. organ-index.json) declares slots and variants per organId only. It does not supply a blueprint that gets compiled. Organ structure is in TSX.
- “Organ blueprint” in the contract sense is development-time structure used when defining or documenting an organ (e.g. which slots it has); it is not a second compilation input.

---

## 6) No double compilation

- There is a single compilation step: organism blueprint + content (+ organ index for validation and manifest) → one JSON tree.
- Organ references in that blueprint become organ nodes in the JSON. They are not compiled again from a separate organ blueprint file. No second compile layer.

---

## 7) Determinism: blueprint + content + organ index → same JSON → same rendered tree

- Same organism blueprint + same content.txt + same organ index → same app.json (or equivalent output). Compile is deterministic.
- Same compiled JSON → same rendered tree at runtime. No runtime inference or structural guessing. organId consistently maps to the same TSX component; content and variant are passed as compiled.
