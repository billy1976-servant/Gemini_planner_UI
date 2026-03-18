# BUILD BLUEPRINT CONTRACT V2 — Canonical Authority (LOCKED)

This file is the single canonical contract merging: BLUEPRINT_UNIVERSE_CONTRACT, BLUEPRINT CONTRACT_V1, BUILD_PROTOCOL (ORGAN)_V1, BUILD_PROTOCOL (ORGANISM)_V1, ENGINE_LAWS, CONTENT_DERIVATION_CONTRACT, and allowed-molecules.ts. Nothing here executes. This is the allowed universe and authority only.

**Canonical locations:** `src/02_Contracts_Reports/contracts/`. Related: V6_AUTHORITY_DECLARATION.md, LAYOUT_SYSTEM_CONTRACT.md, RENDERING_PURITY_CONTRACT.md.

---

## I. AUTHORITY + LOCK STATEMENT

**Authority:** This contract formalizes TSX organ architecture: molecules = primitive TSX, organs = TSX composed of molecules, organisms = TXT composition. No double-compile, no organ expansion at runtime. No runtime or compiler changes implied beyond what is declared here.

**Lock:** This blueprint universe contains every molecule, every content type, every interaction, every navigation, every action, every layout primitive, and every organ defined — nothing more, nothing less. No new universes, no new syntax, no new molecules, no engine assumptions. Fully generator-safe, fully deterministic, fully exhaustive.

**Molecule authority validation:** The closed set of 12 molecule types is defined in `allowed-molecules.ts`. Any molecule type outside this set = HARD VIOLATION. The set is: `section`, `button`, `card`, `avatar`, `chip`, `field`, `footer`, `list`, `modal`, `stepper`, `toast`, `toolbar`.

---

## II. LAYER MODEL (MOLECULES / ORGANS / ORGANISMS)

- **Molecules:** Primitive TSX components. Closed set per contract (section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar). Render primitives only.
- **Organs:** TSX components composed of molecules. Each organ is implemented as a TSX file/component. Organ index declares slots and variants; internal structure is in TSX, not in blueprint expansion.
- **Organisms:** TXT blueprint (e.g. blueprint.txt) that composes organs and molecules. One organism blueprint per app/screen. References organs via `organ:organId`. No second compilation layer.

---

## III. MOLECULE UNIVERSE (EXHAUSTIVE)

```
MOLECULES
├─ Button
│  ├─ Variants: filled | tonal | outlined | text | icon
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  └─ label (text)
│  └─ Behavior: Navigation | Interaction
│
├─ Avatar
│  ├─ Variants: circle | square
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  ├─ media (image | avatar)
│  │  └─ text (optional)
│  └─ Behavior: Navigation | Interaction
│
├─ Card
│  ├─ Variants: elevated | outlined
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  ├─ body (text | markdown)
│  │  └─ media (image | video)
│  └─ Behavior: none
│
├─ Chip
│  ├─ Variants: elevated | outlined
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  ├─ body (text)
│  │  └─ media (icon | image)
│  └─ Behavior: Navigation | Interaction
│
├─ Field
│  ├─ Variants: outlined | filled
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  ├─ label (text)
│  │  ├─ input (text)
│  │  └─ error (text)
│  └─ Behavior: none
│
├─ List
│  ├─ Variants: plain | padded | dropdown
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  └─ items (data:list)
│  └─ Behavior: Navigation | Interaction
│
├─ Modal
│  ├─ Variants: centered | bottomSheet
│  ├─ Sizes: md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  └─ body (text | markdown)
│  └─ Behavior: Navigation (close)
│
├─ Section
│  ├─ Variants: standard | subtle
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  └─ children (nodes)
│  └─ Behavior: none
│
├─ Footer
│  ├─ Variants: standard | dense
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  ├─ text (text)
│  │  └─ children (nodes)
│  └─ Behavior: Navigation | Interaction
│
├─ Stepper
│  ├─ Variants: primary | line
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  └─ steps (data:timeline)
│  └─ Behavior: Navigation | Interaction
│
├─ Toast
│  ├─ Variants: info | error
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  └─ text (text)
│  └─ Behavior: Navigation | Interaction
│
└─ Toolbar
   ├─ Variants: info | error
   ├─ Sizes: sm | md
   ├─ Content
   │  ├─ text (text)
   │  └─ actions (nodes)
   └─ Behavior: Navigation | Interaction
```

### ACTIONABLE MOLECULE DEFINITION (HARD)

```
ACTIONABLE
├─ Definition
│  └─ Any molecule that allows Interaction or Navigation verbs
├─ Includes
│  ├─ Button
│  ├─ Chip
│  ├─ List (item-level)
│  ├─ Toolbar (action-level)
│  ├─ Footer (item-level)
│  ├─ Stepper
│  ├─ Toast
│  └─ Avatar
└─ Excludes
   ├─ Field
   ├─ Card
   ├─ Section
   └─ Modal (except close)
```

Only actionable molecules may execute behavior verbs.

**Edge / Interactive Molecules — Allowed verbs**

| Molecule | Allowed verbs |
|----------|----------------|
| Button   | tap \| double \| long \| go \| back \| open \| close \| route |
| Chip     | tap \| double \| long \| go \| back \| route |
| List     | (per item) tap \| select \| go \| route |
| Stepper  | tap \| swipe \| go \| back |
| Toolbar  | (actions) tap \| go \| back \| open \| close |
| Footer   | (items) tap \| go \| route |
| Avatar   | tap \| double \| go \| route |
| Toast    | tap \| close \| go |

**Non-Interactive / Structural Molecules**

| Molecule | Behavior |
|----------|----------|
| Section  | (no behaviors) |
| Card     | (no behaviors) |
| Field    | (no behaviors) |
| Modal    | close *(only) |

If a behavior appears on a molecule not listed above → invalid.

---

## IV. CONTENT UNIVERSE (TEXT / MEDIA / DATA — UNCHANGED)

### 1. TEXT CONTENT (LANGUAGE ONLY — STRING-BASED)

**Rule:** Human language only. No structure. No rendering logic. Output is always a string.

```
TEXT
├─ label     │ format: string │ schema: plain text       │ output: "string"
├─ title     │ format: string │ schema: plain text       │ output: "string"
├─ subtitle  │ format: string │ schema: plain text       │ output: "string"
├─ heading   │ format: string │ schema: plain text       │ output: "string"
├─ body      │ format: string │ schema: paragraphs      │ output: "string"
├─ caption   │ format: string │ schema: short text       │ output: "string"
├─ hint      │ format: string │ schema: helper text      │ output: "string"
├─ success   │ format: string │ schema: feedback text    │ output: "string"
├─ error     │ format: string │ schema: feedback text    │ output: "string"
├─ button    │ format: string │ schema: UI label         │ output: "string"
└─ markdown  │ format: string │ schema: markdown         │ output: "markdown string"
```

TEXT = string only. No objects. No arrays. No inference.

### 2. MEDIA CONTENT (SOURCE-ONLY, NO RENDER LOGIC)

**Rule:** Media is a reference, not a decision. Generator never sets layout, autoplay, fit, etc.

```
MEDIA
├─ image           │ format: source │ schema: URL | assetId              │ output: "string"
├─ icon            │ format: source │ schema: iconName | assetId         │ output: "string"
├─ video           │ format: source │ schema: URL                        │ output: "string"
├─ audio           │ format: source │ schema: URL                        │ output: "string"
├─ gif             │ format: source │ schema: URL                        │ output: "string"
├─ pdf             │ format: source │ schema: URL                        │ output: "string"
├─ stream          │ format: source │ schema: "@device.camera.stream"    │ output: "string"
├─ screen          │ format: source │ schema: "@device.screen.capture"    │ output: "string"
├─ logo            │ format: source │ schema: URL                       │ output: "string"
├─ badge           │ format: source │ schema: URL                       │ output: "string"
├─ avatar          │ format: source │ schema: URL                        │ output: "string"
└─ backgroundMedia │ format: source │ schema: URL                       │ output: "string"
```

MEDIA = reference only. Never behavior. Never layout.

### 3. DATA CONTENT

**Rule:** Data is not language. Structure is mandatory. Generator must obey schema exactly.

```
DATA
├─ json          │ format: object │ schema: any                    │ output: {}
├─ table         │ format: array  │ schema: columns, rows          │ output: { columns, rows }
├─ profile       │ format: object │ schema: name, email, avatar?   │ output: object
├─ settings      │ format: object │ schema: { key: boolean|string|number } │ output: object
├─ coords        │ format: geo    │ schema: lat, lng               │ output: object
├─ timeline      │ format: array  │ schema: time, label             │ output: array
├─ feed          │ format: array  │ schema: id, title, body         │ output: array
├─ checklist     │ format: array  │ schema: label, checked         │ output: array
├─ conversation  │ format: array  │ schema: role, message          │ output: array
├─ mesh          │ format: object │ schema: vertices, faces        │ output: object
└─ pointcloud    │ format: array  │ schema: { x, y, z }            │ output: array
```

### CONTENT DERIVATION (LAYER SEPARATION)

| File                  | Role                              |
|-----------------------|-----------------------------------|
| blueprint.txt         | structure + navigation (LOCKED)   |
| content.manifest.txt  | human-editable values (GENERATED, THEN FILLED) |
| app.json              | compiled output (STRUCTURE + CONTENT MERGED)   |

Nothing else decides UI. Blueprint is the only source of structure and flow. Content file is derived from the blueprint. If content is missing or malformed, the UI renders blank.

**Content key binding:** Content keys MUST be derived from the intersection of (1) outline tokens `[ … ]` and (2) the molecule's declared content contract. The generator MUST emit all outline-declared keys that are valid for the molecule; emit empty string `""` for any declared-but-unfilled key. The generator MUST NOT invent keys not present in the molecule contract or emit keys not listed in the outline.

**Required merge logic:** For each blueprint node: `entry.content = contentMap[node.rawId] || {}`. If this map is empty or missing, UI is blank.

**Molecule-specific content bindings (explicit):**

- **Button:** Outline: `Button [label]`. Content: `{ "label": "string" }`
- **Avatar:** Outline: `Avatar [media]` or `Avatar [media, text]`. Content: `{ "media": "string", "text": "string?" }`
- **Card:** Outline: `Card [title, body]` \| `Card [media]` \| `Card [media, title, body]`. Content: `{ "media": "string?", "title": "string?", "body": "string?" }`
- **Chip:** Outline: `Chip [title]` \| `Chip [title, body]` \| `Chip [title, body, media]`. Content: `{ "title": "string", "body": "string?", "media": "string?" }`
- **Field:** Outline: `Field [label]` \| `Field [label, error]`. Content: `{ "label": "string", "error": "string?" }`. Input/value are state-driven, not outline-driven.
- **List:** Outline: `List [items]`. Content: `{ "items": [ { "label": "string", "behavior": "object?" } ] }`
- **Footer:** Outline: `Footer [left, right]`. Content: `{ "left": { "label": "string", "behavior": "object?" }, "right": { "label": "string", "behavior": "object?" } }`
- **Stepper:** Outline: `Stepper [steps]`. Content: `{ "steps": [ { "label": "string" } ] }`
- **Toast:** Outline: `Toast [message]`. Content: `{ "message": "string" }`
- **Toolbar:** Outline: `Toolbar [actions]`. Content: `{ "actions": [ { "label": "string", "behavior": "object?" } ] }`
- **Modal:** Outline: `Modal [title, body]`. Content: `{ "title": "string", "body": "string" }`
- **Section:** Outline: `Section [title]` \| `Section [none]`. Content: `{ "title": "string?" }`

**Hard lock rules (content):** Blueprint NEVER changes to fix content. Content NEVER invents structure. Compiler NEVER deletes content. Renderer NEVER guesses defaults.

---

## V. INTERACTION / NAVIGATION / ACTION UNIVERSES (UNCHANGED)

### INTERACTION BEHAVIOR UNIVERSE

```
INTERACTION
├─ tap    └─ variant: none
├─ double └─ variant: none
├─ long   └─ variant: none
├─ drag   ├─ horizontal ├─ vertical └─ free
├─ scroll ├─ up └─ down
└─ swipe  ├─ left ├─ right ├─ up └─ down
```

### NAVIGATION BEHAVIOR UNIVERSE

```
NAVIGATION
├─ go    ├─ screen → { screenId } ├─ modal → { modalId } └─ flow → { flowId }
├─ back  ├─ one ├─ all └─ root
├─ open  ├─ panel → { panelId } └─ sheet → { sheetId }
├─ close ├─ panel → { panelId } └─ sheet → { sheetId }
└─ route ├─ internal → { path } └─ external → { url }
```

### ACTION BEHAVIOR UNIVERSE

```
ACTION
├─ image    ├─ crop ├─ filter ├─ frame ├─ layout └─ overlay
├─ video    ├─ filter ├─ layout ├─ motion └─ overlay
├─ audio    ├─ motion └─ overlay
├─ document ├─ frame ├─ layout └─ overlay
├─ canvas   ├─ crop ├─ frame ├─ layout └─ overlay
├─ map      ├─ layout └─ motion
└─ camera   ├─ crop ├─ filter ├─ layout └─ motion
```

**Outline behavior annotation:** Behaviors are optional annotations on outline lines. Allowed one-word tokens: `tap | double | long | drag | scroll | swipe | go | back | open | close | route | crop | filter | frame | layout | motion | overlay`. If a token is not in this list, it is invalid. If a behavior token appears: it must exist in Interaction/Navigation/Action universes and must be allowed for that molecule. If omitted → behavior is none. If duplicated or invented → invalid.

---

## VI. LAYOUT PRIMITIVE UNIVERSE (UNCHANGED)

```
LAYOUT
├─ flow        ├─ row ├─ column ├─ grid ├─ stack └─ page
├─ alignment   ├─ align ├─ justify ├─ wrap └─ gap
└─ containment ├─ maxWidth ├─ padding └─ bounds
```

Layout selection is external to blueprint structure definition. Templates define section type and layout structure. Presets define visual styling and special behaviors.

---

## VII. ORGAN UNIVERSE (ALIGNED TO TSX ORGAN ARCHITECTURE)

**Rule:** Organs are structural layout units implemented as TSX files. They are composed of molecules. Organ index declares slots and variants only; internal structure is in TSX, not in blueprint expansion. Blueprint compiler does not expand organ internals; it emits nodes with `type: "organ"`, `organId`, `variant`, and `content`. No organ-expansion compile step.

```
ORGANS
├─ header
│  ├─ Variants: default | sticky-split | transparent | minimal | centered | full-width | mega-ready | shrink-on-scroll | with-announcement | compact | logo-center | nav-left
│  ├─ Slots: header.logo | header.cta
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ hero
│  ├─ Variants: centered | image-bg | split-left | split-right | full-screen | short | with-cta | video-ready | right-aligned
│  ├─ Slots: hero.title | hero.subtitle | hero.cta
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ nav
│  ├─ Variants: default | dropdown | mobile-collapse | centered-links
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ footer
│  ├─ Variants: multi-column | minimal | with-newsletter | centered | dense
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section | Footer
│  └─ Behavior: none
│
├─ content-section
│  ├─ Variants: text-only | media-left | media-right | zigzag
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ features-grid
│  ├─ Variants: 2-col | 3-col | 4-col | repeater
│  ├─ Slots: features.title | features.items
│  ├─ Emits: Section | Grid
│  └─ Behavior: none
│
├─ gallery
│  ├─ Variants: grid-2 | grid-3 | grid-4 | carousel-ready
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ testimonials
│  ├─ Variants: grid-2 | grid-3 | single-featured | carousel-ready
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ pricing
│  ├─ Variants: 2-tier | 3-tier | 4-tier | highlighted | minimal
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ faq
│  ├─ Variants: accordion | list | two-column
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
└─ cta
   ├─ Variants: banner | strip | split | full-width
   ├─ Slots: (variant-defined)
   ├─ Emits: Section
   └─ Behavior: none
```

Organ outline declares organId + variant. Content file supplies slot values by slotKey. Organism may reference `organ:organId`; organism may not redefine organ internal structure. Organism supplies content via declared slot keys only. Runtime maps organId to TSX component; content and variant are passed as compiled.

**Organ content keys (dotted slotKeys):** For organ nodes, content keys use dotted slotKeys (e.g. `hero.title`, `header.logo`, `hero.cta`). Keys MUST match the slotKeys defined for that organ. Binding rule: generator MUST emit content blocks for organ nodes with keys exactly matching the slotKeys declared for that organ.

**Structure types (from build protocol):** `list`, `board`, `dashboard`, `editor`, `timeline`, `detail`, `wizard`, `gallery`. Template selection per structure type is from the layout contract; selection must be declared, not inferred.

---

## VIII. ENGINE & STATE AUTHORITY LAYER

### Engine binding rules

- Engine logic lives outside TSX. No logic inside TSX organs. No engine logic inside Compiled TSX Organ Component or wrapper.
- Behaviors bind from the action/behavior registry only. No one-off handlers. No business logic in TSX. Events delegate to registry or engine.
- Register or extend engines; define JSON input/output shape. Use only engines from the engine capability/registry. Engine behavior is the authority for actions and flow.
- Engine execution layer is defined as external authority. Runtime consumes compiled JSON only; it does not infer structure, slots, or organ internals.

### State mutation rules

- State is never declared directly in the tree. State exists only as the target of a behavior verb.
- Mutation verbs are behaviors. Mutation verbs require an existing state target. Mutation verbs never create UI.
- All state lives behind behavior verbs only.

**Stateful behavior extension (declarative — no execution):**

```
STATEFUL-BEHAVIOR
├─ appliesTo    ├─ Button ├─ Chip ├─ List (item-level) ├─ Toolbar (action-level) └─ Footer (item-level)
├─ excludedFrom ├─ Card ├─ Section └─ Modal (except close)
├─ scope        ├─ local ├─ screen ├─ flow └─ global
├─ lifetime     ├─ transient ├─ session └─ persistent
└─ dataShape    ├─ scalar ├─ object └─ collection
```

### Validation gates

```
VALIDATION
├─ required ├─ minLength ├─ maxLength ├─ pattern ├─ numeric
├─ email ├─ url ├─ enum ├─ unique ├─ range └─ custom
```

Validation blocks mutation only. Validation never blocks interaction or navigation.

### Semantic verb resolution

```
MUTATION-VERBS
├─ append ├─ update ├─ remove ├─ clear ├─ replace ├─ merge
├─ reorder ├─ toggle ├─ increment ├─ decrement ├─ undo └─ redo
```

```
SEMANTIC-VERBS
├─ save      → append | update
├─ submit    → append
├─ reset     → clear
├─ cancel    → undo
├─ confirm   → commit (engine-defined)
├─ dismiss   → no-op
├─ complete  → update
├─ acknowledge → update
└─ exit      → navigation
```

Semantic verbs are human-facing aliases. They always resolve to mutation or navigation internally.

### No engine logic inside TSX organs

- No logic inside TSX. No structure invention in wrapper; structure comes from Compiled TSX Organ Component only.
- Wrapper provides only: state, palette context, layout context. Wrapper contains no business logic, no structure invention, no engine logic, no inline behaviors.
- Palette and layout from system/context only. No palette selection in Compiled TSX Organ Component or wrapper.

### Engine laws (execution-layer authority)

1. **Wrapper law (child inspection):** When inspecting child nodes inside compounds, always read from `child.props.node`, not `child.props`. Applies to: split layouts, media-left/right detection, any compound that analyzes child content. When detecting properties of a rendered child (media, role, type, etc.), the engine must check both `child.props` and `child.props.node` (components may be wrapped).

2. **Preset override law:** Section/Card presets must be merged after templates and must win in conflicts. Order of authority: Base → Template → Experience → Preset → Node Overrides.

3. **Hero is not a normal section law:** Hero sections require explicit hero presets for container width, vertical padding, alignment, media behavior. Never rely on default section styling for heroes.

4. **Split layout requires 3 conditions:** Split will not activate unless ALL are true: `params.split` exists; `moleculeLayout.type === "row"`; media child detected via wrapper law.

5. **Templates define structure, presets define style:** Templates define section type and layout structure. Presets define visual styling and special behaviors.

6. **Param merge must be non-destructive:** Param merging must always be deep-merge, never replace entire objects. Especially for: moleculeLayout, split, spacing, containerWidth.

7. **Content lives on node, not component:** Engine logic should treat the resolved node as source of truth, not React props.

8. **Engine logs tell truth, UI does not:** Trust renderer console logs over UI panels when debugging.

9. **Section layout ≠ Card layout:** Section layout controls split/grid behavior. Card layout only affects internal card content flow.

10. **If a layout depends on child type, it is a compound responsibility:** Never solve child-analysis problems in the renderer — fix them in the compound.

---

## IX. DETERMINISM + SINGLE COMPILE CLAUSE

- **Compile once.** Single compilation: organism blueprint + content + organ index (for validation/manifest) → one JSON tree. No second compile for organs. No double compile.
- **No organ expansion.** There is no step (compile or runtime) that expands organ references into molecule trees. Organs are rendered as TSX components. Blueprint compiler does not expand organ internals.
- **No runtime inference.** Runtime consumes the compiled JSON only. It does not infer structure, slots, or organ internals. organId maps to TSX component; content and variant are passed as compiled.
- **No structural mutation.** Organ structure (which molecules, which layout) is fixed by TSX. Runtime and blueprint cannot mutate it. Only content and variant are variable per instance.
- **No secondary expansion layer.** Organism blueprint composes organs and molecules; one organism blueprint per app/screen. References organs via `organ:organId`. No second compilation layer.

---

## X. FORBIDDEN RESPONSIBILITIES (COMPILER, RUNTIME, WRAPPER)

- **No organ expansion compiler.** No tool or step that compiles an "organ blueprint" into a molecule tree and injects it into organism output. Organs are TSX; structure is in code.
- **No dynamic organ structure mutation.** Organ structure is fixed by TSX. Runtime and blueprint cannot mutate it.
- **No runtime structural guessing.** Runtime must not infer or guess structure, slots, or composition beyond what is in the compiled JSON and the fixed TSX organ implementation.
- **No hardcoded styles** in TSX Organ Component or wrapper. No inline behavior logic in TSX Organ Component or wrapper; all behavior via registry.
- **No engine logic** in wrapper or in Compiled TSX Organ Component; all engine logic external.
- **No layout logic invention.** Layout and structure come from layout contract and engines. Organism blueprint does not invent new layout patterns or molecule arrangements.
- **No wrapper defaults.** No feature may require wrapper modification to enable. Palette system-driven only.

---

## XI. BINDING RULES (FIELD, ACTIONABLE MOLECULES, STATE TARGETS)

```
RULES
├─ Field           ├─ produces candidate data only ├─ never executes verbs └─ never mutates state
├─ Actionable molecules ├─ execute behavior verbs └─ may target state
├─ Interaction verbs    └─ never mutate data
├─ Navigation verbs     └─ never mutate data
├─ Mutation verbs       └─ execute only via actionable molecules
└─ Omitted behavior    └─ implies no mutation
```

State exists only as the target of a behavior verb. Only actionable molecules may execute behavior verbs.

**Build binding (Organ protocol):** Input: blueprint + content (authority). Output: one Compiled TSX Organ Component. Deterministic structure from blueprint+content only. Only 12 allowed molecules. Engine bindings declared; no engine logic inside TSX Organ Component. Behavior bindings registry-only; no inline handlers. No inline styles. No palette selection. No layout inference. Wrapper consumes the Compiled TSX Organ Component only.

---

## XII. CANONICAL STATEFUL PATTERN

```
PATTERN
├─ Input produces candidate data
├─ Button triggers semantic verb
├─ Semantic verb resolves to mutation
├─ Mutation targets state
├─ Validation gates mutation
└─ Undo / Redo replay mutation log
```

Reference only. No syntax. No execution. No new molecules.

---

## XIII. FINAL GLOBAL LOCK

- No new universes.
- No new syntax.
- No new molecules.
- No engine assumptions.
- Fully generator-safe.
- Fully deterministic.
- Fully exhaustive.
- All universes remain exhaustive.
- Organs are TSX.
- Organisms compile once.
- No double compile.
- No expansion of organ internals.
- Engines execute behavior.
- Blueprint is declarative only.
- Runtime consumes compiled JSON only.
- No ambiguity between universe and execution layer.
- All state lives behind behavior verbs only.
- Layout selection is external to blueprint structure definition.

---

## HUMAN OUTLINE — HIERARCHICAL (STRUCTURE + FLOW)

**Rule:** Indentation = hierarchy. Arrows include target ID + target NAME (no lookup required). Type may be a molecule/section name or an organ declaration `organ:organId`.

```
APP: ExampleApp

1.0 | Home | Section [none]
  1.1 | Welcome | Button [label] (tap)       -> 2.0 Signup
  1.1 | Welcome | Button [label] (double)    -> 3.0 Info
  1.2 | LearnMore | Button [label] (long)    -> 6.0 MediaDemo
  1.3 | Exit | Button [label] (double)       -> 4.0 Goodbye

2.0 | Signup | Section [none]
  2.1 | Email | Field [label, placeholder]
  2.2 | Password | Field [label, placeholder]
  2.3 | Submit | Button [label] (tap)         -> 5.0 Success
  2.3 | Submit | Button [label] (long)       -> 7.0 Review
  2.4 | BackHome | Button [label] (back)     -> 1.0 Home

3.0 | Info | Card [title, body]
  3.1 | InfoText | Section [body]
  3.2 | BackHome | Button [label] (back)      -> 1.0 Home
  3.3 | Details | Chip [title] (tap)          -> 8.0 Details

4.0 | Goodbye | Card [title, body]
  4.1 | ExitRoute | Button [label] (route)    -> external

5.0 | Success | Card [title, body]
  5.1 | SuccessText | Section [body]
  5.2 | Finish | Button [label] (tap)         -> 1.0 Home
  5.3 | Share | Toolbar [actions] (open)      -> 9.0 ShareSheet

6.0 | MediaDemo | Section [none]
  6.1 | Gallery | Card [media]
  6.1 | Gallery | Card [media] (swipe)        -> 6.2 NextMedia
  6.1 | Gallery | Card [media] (drag)        -> 10.0 Canvas
  6.2 | CloseDemo | Button [label] (close)   -> 1.0 Home

7.0 | Review | Section [none]
  7.1 | Steps | Stepper [steps] (swipe)       -> 7.2 Confirm
  7.2 | Confirm | Button [label] (tap)       -> 5.0 Success

8.0 | Details | Section [none]
  8.1 | InfoList | List [items] (select)      -> 3.0 Info
  8.2 | Back | Button [label] (back)          -> 3.0 Info

9.0 | ShareSheet | Modal [title, body]
  9.1 | ShareNow | Button [label] (tap)      -> route
  9.2 | Dismiss | Button [label] (close)     -> 5.0 Success

10.0 | Canvas | Card [media]
  10.1 | CropImage | Card [media] (crop)
  10.2 | ApplyFilter | Card [media] (filter)
  10.3 | Done | Button [label] (back)        -> 6.0 MediaDemo
```

No other syntax is allowed.

### ORGAN OUTLINE ANNOTATION

When the blueprint uses an organ, the outline line declares organId and optional variant. Slot keys are fixed per organ.

```
1.0 | HeroBlock | organ:hero [hero.title, hero.subtitle, hero.cta]
     variant: centered

2.0 | SiteHeader | organ:header [header.logo, header.cta]
     variant: default
```

Content file supplies values keyed by the same slotKeys. Compiler injects them into the expanded organ tree. No other organ syntax is allowed.

### OUTLINE TOKEN RESOLUTION

- Tokens inside `[ … ]` define content keys only. Behavior tokens inside `( … )` never affect content.
- Repeated outline lines for the same node share the same content object.
- Omitted behavior = implicit tap. Multiple behaviors are expressed by parallel outline lines for the same element. Content slots listed on the molecule define exactly how many and which content types may appear.

---

## WHAT THIS CONTRACT IS

- A complete universe.
- Generator-facing.
- Deterministic.
- Exhaustive.
- Zero logic in blueprint.
- Zero defaults invented.
- Zero omissions of defined elements.

## WHAT THIS CONTRACT IS NOT

- Not a renderer.
- Not an engine.
- Not a behavior executor.
- Not JSON.
- Not opinionated.
- Not missing any defined molecule, verb, state rule, or universe.
