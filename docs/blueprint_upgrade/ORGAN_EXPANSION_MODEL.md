# Organ Expansion Model

**Authority:** Defines how content and organ references are resolved at compile-time. No runtime or compiler logic changes implied.

**Canonical location:** `docs/blueprint_upgrade/`. References: BLUEPRINT_SPECIES_DEFINITION.md, organ-index, blueprint.ts.

---

## 1) Content Universality

- **Content files are structure-agnostic.** content.txt (or equivalent) is keyed by rawId and slot/key names. It does not encode hierarchy, layout, or organ vs molecule distinction. Same content format applies to molecule nodes and organ nodes.
- **SlotKeys define compatibility.** A content block for a node is valid only if every key is a declared slot for that node type (molecule content keys per molecule contract, or organ slot keys per organ index). No key may be supplied that is not in the slot contract.
- **No runtime overlay merging.** Content is bound at compile-time. Runtime does not merge, overlay, or infer content from other sources. What is compiled is what is rendered.

---

## 2) Compile-Time Expansion

- **Organ call in organism blueprint resolves to organ definition.** When the compiler encounters a node with `type === "organ"` and an organId, it resolves organId against the organ index. The organ’s definition (slots, variants) is the authority. There is no “organ blueprint file” lookup in the current design—the index is the definition.
- **Slot content injected deterministically.** Content for that organ node (keyed by rawId in content.txt) is mapped onto the organ’s slot keys. Only keys present in the organ’s slot list are applied. Order and presence are deterministic from blueprint + content + index.
- **No runtime inference.** Expansion and content binding are compile-time only. Runtime receives a fully resolved tree (or organ node with content filled). Runtime must not infer slots, variants, or structure beyond what is in the compiled output.

---

## 3) Collision Rules

- **No overlapping slotKeys across organs unless namespaced.** Organ slot keys are defined per organ in the index (e.g. hero.title, header.logo). Different organs use different key names (typically organId.key). Overlap would make content ambiguous; namespacing (e.g. hero.*, header.*) avoids collision.
- **No duplicate rawIds across expanded trees.** Within one organism blueprint, every node has a unique rawId. When organs are expanded, the expanded subtree must not introduce duplicate rawIds. If an organ’s internal structure uses rawIds, they must be scoped (e.g. prefixed by the calling node’s rawId) so that the final tree has no duplicates.
- **Deterministic ID resolution.** Node ids (e.g. |name or |nodeId) are derived from rawId, name, and optional @id. Arrow targets resolve via rawId, name, or @id. Resolution order and rules are fixed so that the same blueprint produces the same idMap and targetToRaw every time.
