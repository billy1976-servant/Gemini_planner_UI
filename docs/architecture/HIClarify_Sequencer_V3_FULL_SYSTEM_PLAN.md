# HIClarify Sequencer V3 — Full System Plan

**Document type:** Planning and design only. No implementation. No changes to runtime code, compiler, contracts, or engines. Analysis + design to prevent half-implemented architecture.

---

## 1. System Goal

**Purpose of the Sequencer Layer**

- **Order defined once:** A single, explicit ordering source (sequence block or map) defines the render order of sibling nodes. Authors do not rely on document order in the blueprint for visual flow.
- **Nodes never need manual reordering:** Adding or removing a section is done by editing the sequence list (or leaving document order as default). No need to cut/paste large blocks of blueprint lines to change order.
- **JSON compiles deterministically:** Same blueprint + content + sequence → same app.json. Sequence is an input to the compiler, not a side effect.
- **Tree structure preserved:** Parent-child relationships still come from blueprint indent. The sequencer only reorders *siblings* within each parent. Depth and hierarchy are unchanged.
- **Arrows remain ID-based:** Navigation and behavior targets resolve by node `id` (or future nodeId). Reordering children does not change any node’s identity; arrows and state bindings continue to reference nodes by id.
- **System becomes more stable, not more complex:** One clear place to control order; fewer merge conflicts from reordering; refactors (add/remove sections) become list edits instead of tree surgery.

The sequencer is a **compile-time ordering layer** that affects only the order of `children[]` in the emitted tree. It does not introduce new runtime concepts or new node types.

---

## 2. Sequencer Placement Decision

**Options analyzed**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Top of blueprint** | SEQUENCE block at start of blueprint.txt (e.g. before or immediately after APP:). | Single file; order lives with structure; no extra files; easy to keep in sync. | Parser must recognize and preserve block; long lists can clutter top of file. |
| **B) External sequence file** | Separate file (e.g. sequence.json or order.txt) in app folder, referenced at compile. | Clear separation of structure vs order; can be tool-generated or locale-specific. | Two sources; must keep in sync; path/config must be defined. |
| **C) Compiler-generated order map** | Compiler infers order from blueprint document order and writes an order map (e.g. to disk) for later runs. | No authoring of sequence. | Order is still tied to document order; no gain unless author then edits the generated map (same maintenance as B). |

**Recommendation: A) Top of blueprint**

- **Safest long-term:** One source of truth (blueprint). No cross-file sync. Version control and diffs show order changes in the same place as structure changes.
- **Backward compatible:** If no SEQUENCE block exists, compiler uses current behavior (document order). Existing blueprints are unchanged.
- **Predictable:** Authors and tools know exactly where to read/write order. No discovery of external files or env-specific paths.
- **Aligns with V2 build plan:** Optional inline blocks (e.g. SEQUENCE) keep the blueprint the single authority; same pattern as optional nodeId in the alias layer.

Placement detail: the SEQUENCE block is at the **top** of the blueprint (after optional `APP:` line if present), so it is visible first and does not interrupt the node list. Format is a single block (e.g. `SEQUENCE:` followed by one or more lines of ordered rawIds or names), not scattered annotations.

---

## 3. Blueprint Creator Impact

**Should blueprint creator ignore sequence?**  
**Yes, by default.** If the creator does not add or edit a SEQUENCE block, behavior stays as today: order = document order. No new mental model required. Existing workflows (write nodes in desired order) continue to work.

**Should blueprint creator read sequence?**  
**Optional.** When present, the creator *may* display the sequence list (e.g. in a sidebar or summary) so the author sees the intended order. Reading is optional; the compiler is the consumer that enforces order.

**Should blueprint creator validate sequence?**  
**Optional and non-blocking.** If the creator validates, it can warn when: (1) sequence lists a rawId/name not in the blueprint (typo or removed node), (2) sequence omits a node (will fall back to document order for that node). Validation should not block saving; the compiler can apply the same rules and warn at compile time.

**Should blueprint creator preserve the sequence block?**  
**Yes.** When editing the blueprint, the creator must not strip or corrupt the SEQUENCE block. If the creator does not understand it, it should treat it as opaque lines (preserve on save). Round-trip: read blueprint → edit nodes → write blueprint; SEQUENCE block must remain unchanged unless the user explicitly edits it.

**How to avoid breaking current blueprint creation flow**

- Do not require the SEQUENCE block. Absence = document order.
- Do not require the author to fill sequence for every node; only for the level(s) where explicit order is desired (e.g. root children, or one section’s children). Unlisted nodes keep relative order (e.g. appended after sequenced ones).
- Keep SEQUENCE syntax minimal (e.g. one header line + one line of comma-separated ids, or one id per line) so simple editors and copy-paste still work.
- Document that “you can ignore SEQUENCE and keep writing nodes in order; use SEQUENCE when you want to change order without moving blocks.”

---

## 4. Compiler Integration (npm run blueprint)

**How the compiler detects the sequence block**

- While parsing blueprint lines (before or during the main node loop), detect a block that starts with a line matching e.g. `SEQUENCE:` (case-insensitive, optional whitespace). Consume lines until a blank line or a line that matches the node pattern `[\d.]+\s*\|`. The consumed lines (after the first) form the sequence list. Parse list into an ordered array of tokens (rawIds like `1.0`, `1.1`, or names like `TrackNav`). Store in a variable `sequenceOrder: string[] | null`; null = no block, use document order.
- Alternative: parse the whole file in two passes — first pass collects SEQUENCE block and node lines; second pass builds tree. This keeps node parsing unchanged and isolates sequence parsing.

**How the compiler preserves tree structure**

- Tree structure is still determined by **indent** (stack-based parent/child). buildTree still iterates nodes, pops stack by indent, assigns each node to parent. Sequence is **not** used to determine parent; it is used only after a node is pushed to `parent.children`. So: build tree as today, then optionally reorder each parent’s `children` array using the sequence list.

**How the compiler orders siblings safely**

- After building the tree (or after finishing each parent’s children in a single pass), for each node that has `children.length > 0`: if a sequence list exists for that level (see below), sort `children` by the index of each child’s id (or rawId) in the sequence list. Nodes not in the list keep relative order (e.g. sort key = index in list, or Infinity; stable sort). If no sequence for that level, leave children as-is (document order).
- “Sequence for that level”: simplest is one global sequence list for the whole tree, applied at every level (only nodes that appear in the list get reordered; siblings are ordered by list order, then unlisted nodes appended). Or: sequence applies only to root children; deeper levels stay in document order. The plan recommends one global list for root-level (and optionally per-section) to avoid complexity. Safe rule: sequence list defines order for the *root* children only; interior nodes keep document order unless a future extension adds per-parent sequence.

**How the compiler outputs sequence into JSON**

- The compiler does **not** emit a separate “sequence” key into app.json. It applies the sequence when building the tree, so the only output is `children: [ ... ]` in the correct order. The runtime does not see “sequence”; it sees an ordered array of children. This minimizes contract surface and keeps every consumer (renderer, navigation, state) unchanged.

**How the compiler remains deterministic**

- Inputs: blueprint text (including optional SEQUENCE block), content.txt, organ index. No timestamps, no env-dependent order. Algorithm: parse SEQUENCE → parse nodes → build tree (indent) → sort each parent’s children by sequence (when present) → emit JSON. Same inputs ⇒ same output. No randomness, no file system order dependence.

---

## 5. JSON Output Contract

**No new JSON key for sequence.** The JSON equivalent of sequence is **the order of elements in each `children` array**. The compiler writes children in the sequence-defined order; the runtime already interprets `children` order as render order. So the “contract” is unchanged: nodes have `id`, `type`, `children`, `content`, and optional fields; `children` is an array; array order = display order.

**Why not add a top-level `sequence: []` or per-parent `childOrder: []`?**

- **Top-level sequence:** Redundant. The same information is already encoded in the order of root’s `children`. Adding a separate key would duplicate data and require the runtime to either ignore it or reorder by it (double source of truth).
- **Per-parent childOrder map:** Would allow the runtime to reorder without the compiler baking order into children. But the current runtime does not reorder; it renders `children` in array order. Adding a reorder step in the runtime would increase complexity and diverge from “compiler emits final shape.” The safer approach is compiler-only ordering and a single source of order (the children array).

**Safest choice:** Compiler applies sequence at compile time; output remains “just a tree with ordered children.” No schema or engine change.

---

## 6. Engine Impact Analysis

| System | Impact | Why nothing breaks |
|--------|--------|--------------------|
| **Navigation engine** | None | Navigation uses `screenId` / `to` (node id). Identity is unchanged; only sibling order in the tree changes. No code path uses “index of node among siblings.” |
| **Arrow routing** | None | Arrows resolve to node id via idMap. Reordering children does not change any node’s id or the resolution of `-> target`. |
| **State engine** | None | State bindings use keys (e.g. `journal.think`, `currentView`). No dependency on tree position. |
| **Renderer** | None | JsonRenderer walks the tree and renders `children` in array order. That order is exactly what the compiler set; no behavioral change. |
| **Molecules** | None | Molecules receive props from the node (id, type, content, etc.). They do not depend on sibling index or parent’s children order. |
| **Slots** | None | Slot content and layout are driven by node data and template; not by sibling order. |
| **Stepper logic** | None | Stepper uses its own `steps` array (content) and state (e.g. currentView). Order of section nodes in the tree does not define step order; steps and state do. |

**Summary:** All references are by **id** or **state key**. The sequencer only changes the order of `children[]`; it does not add, remove, or rename nodes. Therefore no engine behavior changes.

---

## 7. Contract Updates Required (If Implemented)

If the sequencer were implemented, the following would need to be **updated** (listed only; no changes made in this plan):

- **Blueprint format contract** — Document SEQUENCE block: syntax, placement, semantics (order of root children or which levels), and “absent = document order.” Likely file: `src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md` or a dedicated blueprint-format doc.
- **Compiler contract** — State that compiler may accept an optional SEQUENCE block; when present, it orders sibling nodes per the block; output remains deterministic; no new output keys. Likely: same contract area or `BLUEPRINT_TO_RUNTIME_WIRING.md` / `BLUEPRINT_RUNTIME_INTERFACE.generated.md`.
- **app.json schema** — If a formal schema exists for app.json, no change is required (children order is already unspecified beyond “array of nodes”). If the schema explicitly said “order is undefined,” it could be updated to “order is significant and is the render order.”
- **Engine expectations** — Document that children array order is the display order (likely already implicit). Any doc that says “order of children is insignificant” would need to be corrected to “order of children is significant (render order).”

No other contracts (layout, logic, molecules, organs) need changes; they do not depend on sibling order.

---

## 8. Stability + Power Rating

Scores 1–10, BEFORE (current document-order-only) vs AFTER (with sequencer).

| Dimension | BEFORE | AFTER | Explanation |
|-----------|--------|--------|-------------|
| **Stability** | 7 | 9 | Order is explicit and in one place; fewer accidental reorders; merge conflicts reduced; deterministic compile preserved. |
| **Maintainability** | 6 | 8 | Add/remove section = edit sequence list; structure can stay stable; less touching of large blocks. |
| **Refactor safety** | 6 | 8 | Reordering for UX is a list edit, not tree surgery; less risk of breaking indent or arrows. |
| **Authoring speed** | 6 | 8 | Faster order changes; no cut/paste of blocks; optional so existing flows unaffected. |
| **System power** | 6 | 7 | Same runtime capabilities; authoring and maintenance gain; no new runtime features. |

---

## 9. Risk Analysis

| Risk | Mitigation |
|------|------------|
| **Arrow conflicts** | Arrows are ID-based. Reordering does not change ids. No conflict. If an arrow pointed by “position” (it does not in the current design), that would be a bug; the design does not introduce position-based targets. |
| **Misordered children** | Sequence list can reference wrong ids or omit nodes. Mitigation: (1) validation pass (V2) can warn on missing/unknown ids in sequence; (2) unlisted nodes keep relative order (append or stable sort); (3) one global list for root only keeps scope small. |
| **Contract drift** | New SEQUENCE syntax could be documented in one place and missed elsewhere. Mitigation: single blueprint-format contract update; compiler and BLUEPRINT_RUNTIME_INTERFACE explicitly state “optional SEQUENCE; output order = children array order.” |
| **Blueprint confusion** | Authors might think they must fill SEQUENCE or that document order is ignored when SEQUENCE is present. Mitigation: clear docs — “SEQUENCE optional; when absent, document order. When present, only listed nodes are reordered; add new sections to the list to place them.” |

---

## 10. Final Recommendation

**Implement the Sequencer** as described:

- **Placement:** Inline SEQUENCE block at top of blueprint (Option A).
- **Behavior:** Optional; absent = document order. When present, compiler reorders root children (and optionally other levels in a later phase) by the list; unlisted nodes keep relative order.
- **Output:** No new JSON keys; order is encoded in `children[]` order. No runtime or engine changes.
- **Rollout:** Add parsing and reorder step in `blueprint.ts` only; no contract or runtime change required for basic behavior. Then update blueprint format and compiler contracts so the system is fully specified and no half-implemented behavior remains.

This plan is a full-system design so that any future implementation can connect blueprint rules, creator behavior, compiler, JSON shape, and engine expectations in one consistent way.
