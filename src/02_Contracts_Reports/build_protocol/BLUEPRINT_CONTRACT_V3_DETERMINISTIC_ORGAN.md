## 1. Authority

Organs in Blueprint Contract V3 are governed by the following authority statements:

- **Organs are reusable structural components.**
  - An organ represents a reusable structural unit that can be instantiated in many organisms (blueprint documents).
  - An organ’s identity and capabilities are defined once and reused consistently.

- **Organs are TSX implementations.**
  - Every organ is implemented as a TSX component.
  - The internal structure of an organ (which molecules it uses and how they are arranged) lives entirely in TSX.
  - Blueprint never defines or mutates the internal TSX structure of an organ.

- **Blueprint declares wiring only.**
  - Blueprint declares which organ is used (`organId`), which slots are filled, and which behaviors and state bindings are attached to that instance.
  - Blueprint does not define implementation details, rendering details, or engine details.

- **No engine logic lives inside an organ.**
  - Engine behavior (calculation, decision, flow routing, etc.) lives in engine modules and engine registries.
  - Organs may emit actions, but they must not contain engine algorithms, decision trees, or flow control logic.

- **No state schema lives inside an organ.**
  - State shape (namespaces, fields, and types) is defined outside organs.
  - Organs may reference state keys, but they do not declare or own the schema for those keys.

- **No reducer logic lives inside an organ.**
  - Reducers, mutation logic, and state replay rules are defined in state systems, not in organ components.
  - Organs must not contain logic that mutates state directly; they may only emit actions or bindings that are interpreted elsewhere.

This contract is a human deterministic build specification. It does not reference runtime, JSON, or npm. It constrains how blueprints declare organs and how organs must be implemented and wired.

---

## 2. Organ Definition Rules

An organ instance in a blueprint is defined by a single authoritative line plus optional adjacent annotation lines. The following fields are allowed and required.

### 2.1 Required declarations

An organ instance in blueprint **MUST** declare:

- **`rawId`**
  - A hierarchical numeric id (e.g. `1.0`, `1.1`, `1.1.2`).
  - Used for structural hierarchy and stable reference during compilation.

- **`name`**
  - A human-readable label for the node.
  - Used for identification in the blueprint and content mapping.

- **`organ:organId`**
  - The organ declaration token.
  - Format: `organ:<organId>` where `<organId>` is an existing organ identifier.
  - The `organId` must match a known organ definition in the organ index.

### 2.2 Optional declarations

An organ instance in blueprint **MAY** additionally declare the following, and **only** the following:

- **Slot keys (if applicable)**
  - Declared in brackets after the organ declaration.
  - Format: `[slotKeyA, slotKeyB, ...]`
  - Each `slotKey` must correspond to a declared slot in the organ’s definition.
  - Slot keys define which content fields will be provided for that organ instance.

- **Variant**
  - Declared as a separate line associated with the last node.
  - Format: `variant: <variantName>`
  - `<variantName>` must correspond to a declared variant for that organ.

- **`state.bind` declarations**
  - Declared on a separate indented line associated with the last node.
  - Format: `state.bind: <stateKey>`
  - `stateKey` is a string identifying an external state key.
  - Multiple `state.bind` lines may be present; each adds a binding for that node.

- **Logic expressions**
  - Declared inline in parentheses after the type or organ declaration.
  - Format: `(logic.<type>: <expression>)`
  - `<type>` is an opaque logic type token (e.g. `action`).
  - `<expression>` is an opaque string that will be emitted as an action name.

- **Navigation target**
  - Declared as a separate indented line starting with an arrow.
  - Format: `-> <target>`
  - `<target>` is an opaque target identifier (e.g. `2.0`, `Home`, `|Home`).

- **Stable identifier (`@id`)**
  - Declared either inline or on a separate line associated with the last node.
  - Format (inline): `... @id(<stableId>)`
  - Format (separate line): `@id(<stableId>)`
  - `<stableId>` is an opaque identifier that will be mapped to a stable node id.

- **Alias identifiers (`@aliases`)**
  - Declared either inline or on a separate line associated with the last node.
  - Format (inline): `... @aliases(a, b, c)`
  - Format (separate line): `@aliases(a, b, c)`
  - Each alias is a string that may be used as an alternative reference to this node.

### 2.3 Nothing else

An organ instance in blueprint **MUST NOT** declare any of the following:

- No additional fields beyond:
  - `rawId`
  - `name`
  - `organ:organId`
  - `[slot keys]`
  - `variant: ...`
  - `state.bind: ...`
  - `(logic.<type>: <expression>)`
  - `-> <target>`
  - `@id(...)`
  - `@aliases(...)`
- No ad-hoc metadata keys.
- No inline state, reducers, or schemas.
- No engine identifiers.
- No layout identifiers.
- No template identifiers.

Any additional tokens are outside this contract and must be treated as invalid for deterministic organ builds.

---

## 3. Deterministic Wiring Rules

This section defines how logic expressions and navigation annotations must map deterministically from blueprint to the engine layer.

### 3.1 Logic expressions

- A logic expression in blueprint has the canonical form:
  - `(logic.<type>: <expression>)`
- The `<expression>` part is treated as a **literal action name**.
- The deterministic mapping rule is:
  - **Action name = `<expression>`**
  - No transformation.
  - No rewriting.
  - No expansion.

### 3.2 No engine inference

- Blueprint **never infers an engine** from:
  - Action names.
  - Organ ids.
  - Slot keys.
  - State bindings.
- The engine layer is responsible for:
  - Choosing which engine handles which action name.
  - Interpreting action names and payloads.

### 3.3 No expression rewriting

- Blueprint **never rewrites** logic expressions.
- Examples of forbidden behavior:
  - Mapping `board.card.update` to any other name.
  - Adding prefixes or suffixes.
  - Converting `state:journal.add` into another verb.
- Whatever literal text appears as `<expression>` is passed unchanged to the next layer.

### 3.4 No derived track, reducer, or schema

- Blueprint **never derives**:
  - Track identifiers.
  - Reducer names.
  - State schema shapes.
- If a later layer chooses to derive or interpret such concepts from action names or state keys, that behavior is out of scope for this contract.
- From the perspective of this deterministic build spec:
  - Blueprint emits **literal strings only**.
  - All interpretation happens elsewhere.

---

## 4. State Binding Rules

This section defines how `state.bind` behaves and what is allowed regarding state.

### 4.1 Binding semantics

- The canonical binding declaration is:
  - `state.bind: <stateKey>`
- Semantics:
  - `<stateKey>` is an opaque identifier for an external state location.
  - The binding expresses that this node is connected to that state key for reading and/or writing.
  - The exact behavior (read, write, two-way, etc.) is decided outside this contract.

### 4.2 No state shape in blueprint

- Blueprint **does not declare state shape**.
  - No type definitions.
  - No field lists.
  - No required/optional markers.
  - No nested schema descriptions.
- All information about:
  - What keys exist.
  - What types they hold.
  - How they are derived.
  - Lives outside this document and outside blueprint.

### 4.3 No defaults in blueprint

- Blueprint **does not declare default state**.
  - No initial values.
  - No reset values.
  - No fallback values.
- If a system applies default state, it must do so based on configuration outside blueprint.

### 4.4 Blueprint never creates state

- Blueprint **never creates** new state locations.
- All state keys referenced via `state.bind` **must already exist** in the external state system’s contract.
- Blueprint is only allowed to:
  - Refer to existing state keys.
  - Attach bindings to those keys.

---

## 5. Forbidden Responsibilities

To maintain determinism and a clean separation of concerns, blueprint organ declarations have an explicit list of forbidden responsibilities.

An organ declaration in blueprint **MUST NOT** do any of the following:

1. **Engine declaration**
   - No engine ids.
   - No engine names.
   - No engine selection flags.

2. **Reducer declaration**
   - No reducer names.
   - No reducer logic.
   - No reducer configuration.

3. **State schema declaration**
   - No type definitions.
   - No field schemas.
   - No validation schemas.

4. **Template selection**
   - No template identifiers.
   - No template modes.
   - No template overrides.

5. **Layout invention**
   - No layout ids.
   - No layout presets.
   - No ad-hoc layout parameters.

6. **Structure mutation**
   - No commands that change the structural hierarchy of the blueprint.
   - No dynamic addition or removal of nodes expressed directly in blueprint.

7. **Runtime inference**
   - No markers that instruct runtime to infer or guess behavior beyond literal strings.
   - No “auto” or “smart” hints that change behavior non-deterministically.

8. **Behavior auto-generation**
   - No implicit behavior derived from names, slots, or positions.
   - All action expressions must be explicitly written as literal strings.

If any of the above responsibilities appear in a blueprint organ declaration, that blueprint is considered non-compliant with this deterministic contract.

---

## 6. Organ Independence Clause

This clause defines the independence and replaceability requirements for organs.

An organ that complies with this contract **MUST** satisfy all of the following:

- **Stateless internally**
  - The organ’s TSX implementation does not own durable application state.
  - Any internal UI state (such as local React state) is strictly presentational and not part of the application domain model.

- **Deterministic**
  - Given the same:
    - Slot content.
    - Props.
    - State bindings.
    - Action expressions.
  - The organ must produce the same observable behavior and structure.

- **Fully controlled by parent organism**
  - All structural placement and orchestration are determined by the organism blueprint.
  - The organ does not add or remove siblings.
  - The organ does not reorder sections or nodes outside its own TSX-defined internals.

- **Replaceable without modifying engine system**
  - An organ can be swapped for another organ (with compatible slots and actions) without changing:
    - Engine modules.
    - Engine registries.
    - State resolver contracts.

- **Reusable across all eight app types**
  - The organ must not hardcode assumptions about a single app type.
  - The same organ can be used in any context where:
    - Its slots are provided.
    - Its actions and bindings are respected.

These rules ensure that organs remain portable building blocks that do not leak engine or state-system concerns.

---

## 7. Deterministic Build Checklist

This checklist is for developers authoring or reviewing organs under Blueprint Contract V3. Every item **MUST** be satisfied.

- **[ ] organId exists in organ-index**
  - The `organId` used in blueprint is present in the organ index.
  - The organ implementation and its slot definitions are registered.

- **[ ] slots match organ definition**
  - Every slot key declared in `[slotKeyA, slotKeyB, ...]` is defined in the organ’s slot list.
  - No extra or unknown slot keys are present.

- **[ ] variant exists**
  - If a `variant: <variantName>` line is present, `<variantName>` is a known variant for that organ.
  - If no variant is declared, the organ’s default variant will be used (as defined in the organ index or implementation).

- **[ ] no internal business logic**
  - The TSX implementation of the organ does not contain domain-specific business logic.
  - Business logic lives in engines, actions, or state systems, not inside organ components.

- **[ ] no state schema**
  - The organ’s TSX implementation does not define or embed state schemas.
  - Any knowledge of state keys is limited to bindings and action payloads, not schema definitions.

- **[ ] no engine inference**
  - The organ does not infer or select engines.
  - The organ does not contain logic that chooses engines based on props, slots, or state.

- **[ ] all logic expressions are literal strings**
  - Every `(logic.<type>: <expression>)` uses a static `<expression>` string.
  - No computed, dynamic, or inferred expression names.

- **[ ] no hardcoded behavior payloads**
  - Behavior payloads (such as action parameters) are derived from:
    - Slot content.
    - State bindings.
    - Explicit literal values.
  - There are no hidden or implicit payloads that change per environment or app type.

A blueprint or organ implementation that fails any checklist item does not comply with this deterministic build specification.

---

## 8. Example — Canonical Organ Blueprint

The following example illustrates a canonical organ instance using the allowed hieroglyphic DSL. It introduces **no new syntax** beyond what is already permitted by this contract.

```text
1.0 | CardRoot | organ:cardItem [card.title, card.body, card.actions]
    variant: draggable
    @id(cardRoot)


    1.1 | Title | field
        state.bind: board.cards.title


    1.2 | Save | button (logic.action: board.card.update)


    1.3 | Archive | button (logic.action: board.card.archive)
```

Interpretation under this contract:

- `1.0 | CardRoot | organ:cardItem [card.title, card.body, card.actions]`
  - `rawId = "1.0"`
  - `name = "CardRoot"`
  - `organId = "cardItem"`
  - Slot keys: `card.title`, `card.body`, `card.actions`

- `variant: draggable`
  - Declares the organ variant `draggable` for this instance.

- `@id(cardRoot)`
  - Declares a stable id `cardRoot` for this organ node.

- `1.1 | Title | field`
  - A child node (not itself declared as an organ in this example).

- `state.bind: board.cards.title`
  - Binds this child node to existing state key `board.cards.title`.

- `1.2 | Save | button (logic.action: board.card.update)`
  - Declares a button with a logic expression:
    - Type: `action`
    - Expression: `board.card.update`
    - Action name emitted to the engine layer: `board.card.update`

- `1.3 | Archive | button (logic.action: board.card.archive)`
  - Declares another button with a logic expression:
    - Type: `action`
    - Expression: `board.card.archive`
    - Action name emitted to the engine layer: `board.card.archive`

This example satisfies all rules in this document:
- Only allowed tokens are used.
- All logic expressions are literal strings.
- State is referenced but not defined.
- No engine, reducer, or template is declared.
- The organ is deterministic and fully specified by wiring only.
---

## 9. Conflict & Precedence Rules

This section defines deterministic conflict and precedence rules for all allowed tokens and annotations listed in Section 2.

### 9.1 Annotation ordering

- Annotation lines include, but are not limited to:
  - `variant: <variantName>`
  - `state.bind: <stateKey>`
  - `-> <target>`
  - `@id(<stableId>)`
  - `@aliases(a, b, c)`
- The order of annotation lines **does not affect meaning**.
- All annotation lines apply to the **most recently declared node line**, defined as the last line that declared:
  - `rawId`
  - `name`
  - And, if present, `organ:organId` and `[slot keys]`
- Reordering annotation lines attached to the same node **must not** change the compiled result.

### 9.2 Duplicate `rawId`

- Each `rawId` in a blueprint **MUST** be unique.
- If the same `rawId` appears on more than one node line, the blueprint is **non-compliant** with this contract.

### 9.3 Multiple logic expressions on the same node

- A node may contain at most **one** logic expression of the form:
  - `(logic.<type>: <expression>)`
- If multiple logic expressions are attached to the same node (either inline or via additional annotation lines), that node is **invalid**, and the blueprint is **non-compliant** with this contract.

### 9.4 Logic and navigation on the same node

- A node **may** declare both:
  - A logic expression `(logic.<type>: <expression>)`, and
  - A navigation target `-> <target>`
- When both are present on the same node:
  - The logic expression and the navigation target are **emitted independently**.
  - Neither overrides, cancels, or takes precedence over the other.
  - There is **no conditional behavior** based on their combination.

### 9.5 Multiple `state.bind`

- A node **may** declare multiple bindings using:
  - `state.bind: <stateKey>`
- Each `state.bind` line produces an **independent binding reference** for that node.
- The order of multiple `state.bind` lines **does not affect meaning**.

### 9.6 Multiple `@id`

- A node **MUST NOT** declare more than one `@id(<stableId>)`.
- If a node has multiple `@id` annotations (either inline or on separate lines), that node is **invalid**, and the blueprint is **non-compliant** with this contract.

### 9.7 Multiple `@aliases`

- A node **MAY** declare multiple alias lists using:
  - `@aliases(a, b, c)`
- All aliases declared for the same node are **merged into a single alias set**.
- Duplicate alias strings within that merged set are allowed but have **no additional meaning** beyond a single occurrence.

### 9.8 Slot duplication

- Slot keys are declared in brackets after the organ declaration:
  - `[slotKeyA, slotKeyB, ...]`
- Within a single bracket list:
  - Each slot key **MUST** be unique.
  - If the same slot key appears more than once, that organ declaration is **invalid**, and the blueprint is **non-compliant** with this contract.

### 9.9 Variant placement

- `variant: <variantName>` is only valid when attached to a node whose declaration line includes:
  - `organ:organId`
- A `variant:` line attached to a node that is not an organ node (for example, a non-organ child node with no `organ:organId`) is **invalid**, and the blueprint is **non-compliant** with this contract.

### 9.10 Unknown annotations and tokens

- The only allowed fields and annotations for an organ instance are those listed in Section 2.2.
- Any additional field, annotation, or token that is not explicitly listed in Section 2.2 is **invalid**.
- Encountering such an unknown or out-of-contract token makes the blueprint **non-compliant** with this deterministic organ contract.

---

## 10. Grammar Determinism Guarantee

This section defines the determinism guarantees for the blueprint DSL described in this contract.

- This DSL has **no implicit defaults** beyond what is written in this document.
- There is **no behavior inference** beyond the literal tokens declared in:
  - Node lines.
  - Annotation lines.
  - Logic expressions.
- There is **no token overloading**:
  - Each allowed token has a single meaning as defined in this contract.
  - Tokens do not change meaning based on context or surrounding tokens.
- There is **no context-based interpretation**:
  - The same token sequence must always be interpreted in the same way, regardless of where it appears in a compliant blueprint.
- A compliant parser **MUST** treat this document as a **strict grammar**, not a set of suggestions:
  - All allowed tokens and combinations are defined explicitly.
  - All forbidden or out-of-contract tokens must be rejected.
- Any token that is not explicitly allowed in Section 2.2 (including unknown annotations, fields, or symbols) **invalidates the blueprint**:
  - The blueprint must be treated as **non-compliant**.
  - A compliant parser **MUST** surface this as a deterministic error, not a warning or best-effort interpretation.

---

## 11. Canonical Full-Spectrum Blueprint Example

```text
1.0 | BoardRoot | organ:boardShell [board.header, board.columns, board.footer] @id(boardRoot) @aliases(root, mainBoard)
    variant: interactive


    1.1 | HeaderBar | organ:headerBar [header.title, header.actions]
        variant: sticky
        @id(headerBar)


        1.1.1 | Title | field
            state.bind: board.meta.title
            state.bind: board.meta.subtitle


        1.1.2 | SaveBoard | button (logic.action: board.save)
            -> 2.0


        1.1.3 | ArchiveBoard | button (logic.action: board.archive)


    1.2 | ColumnsSection | organ:columnsWrapper [columns.list]
        @id(columnsSection)


        1.2.1 | ColumnA | organ:columnUnit [column.title, column.cards]
            variant: draggable
            @aliases(colA)


            1.2.1.1 | ColumnTitle | field
                state.bind: board.columns.a.title


            1.2.1.2 | CardList | list
                state.bind: board.columns.a.cards


            1.2.1.3 | AddCard | button (logic.action: board.card.create)
                -> 3.0


        1.2.2 | ColumnB | organ:columnUnit [column.title, column.cards]
            variant: draggable
            @aliases(colB)


            1.2.2.1 | ColumnTitle | field
                state.bind: board.columns.b.title


            1.2.2.2 | CardList | list
                state.bind: board.columns.b.cards


            1.2.2.3 | AddCard | button (logic.action: board.card.create)


    1.3 | FooterBar | organ:footerBar [footer.left, footer.right]
        variant: minimal


        1.3.1 | Stats | chip
            state.bind: board.meta.cardCount


        1.3.2 | DeleteBoard | button (logic.action: board.delete)
            -> |Home
```

Demonstrated DSL Coverage
- rawId hierarchy
- organ declaration
- slot keys
- variant usage
- @id
- @aliases
- multiple state.bind
- logic expression
- navigation arrow
- logic + navigation coexistence
- nested organ structure
- non-organ child nodes
- deterministic wiring only