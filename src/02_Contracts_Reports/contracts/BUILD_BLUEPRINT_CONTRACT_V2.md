# BUILD BLUEPRINT CONTRACT V3 — Canonical Authority (LOCKED)

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

---

## Blueprint Grammar (Parser-Exact)

**Authoritative sources:**
- Parser + compiler: `src/07_Dev_Tools/scripts/blueprint.ts` (`parseBlueprint`, `buildTree`)
- Legacy tree mapper (structure-only reference): `src/999_Cleanup/map-old/engine/map-blueprint-parser.ts`
- Example organism outline: `src/08_Modules/legal/master/blueprint.txt`

### 1. Line types and tokens

- **App header (ignored by parser):**
  - Form: `APP: <AppName>`
  - Behavior: skipped by `parseBlueprint` (line starts with `APP:` → `continue`).

- **Sequence block (optional, top-only):**
  - Header: `SEQUENCE:`
  - Body lines until the first node line:
    - Lines that are *not* node lines are parsed as CSV list of ids/names:
      - `sequenceOrder!.push(...line.split(",").map(trim).filter(Boolean))`
  - Node line detection to end the block:
    - `line.trim().match(/^[\d.]+\s*\|/)`
  - Effect:
    - `sequenceOrder: string[] | null` captured in `parseBlueprint`
    - `buildTree` reorders root `children` by `sequenceIds`:
      - `sequenceIds = sequenceOrder.map(t => idMap[targetToRaw[t] ?? t] ?? idMap[t])`
      - `rootChildren.sort` based on index in `sequenceIds`

- **Node lines (contract style – main grammar):**
  - Regex (from `parseBlueprint`):
    - `^([\d.]+)\s*\|\s*(.+?)\s*\|\s*(\w+)(?:\s*\[([^\]]*)\])?(?:\s*\(([^)]+)\))?(?:\s*@id\s*\(([^)]+)\))?(?:\s*@aliases\s*\(([^)]+)\))?`
  - Tokens:
    - `rawId` (column 1): hierarchical numeric id, e.g. `1.0`, `1.0.2.1`
    - `name` (column 2): free-form label, used for content and `journal` defaults
    - `type` (column 3): molecule or structural type, e.g. `Section`, `Button`, `Card`
    - `slots` (optional): `[slotA, slotB]` → `slots?: string[]`
      - Parsing: `slotsRaw.split(",").map(trim).filter(Boolean)`
    - `behaviorToken` (optional): `(tap)`, `(logic.action: state:booking.submit)`, etc.
      - Stored as `behaviorToken?: string` but **not** directly interpreted in `buildTree`
      - Logic-driven actions use the separate `logic` annotation (below)
    - `@id(...)` (optional, inline): stable node id for idMap
    - `@aliases(a,b,...)` (optional, inline): alternative names for target resolution

- **Organ node lines (special case):**
  - Regex:
    - `^([\d.]+)\s*\|\s*(.+?)\s*\|\s*organ:(\w+)(?:\s*\[([^\]]*)\])?$`
  - Tokens:
    - `rawId`: numeric hierarchical id
    - `name`: label
    - `type`: hard-coded `"organ"`
    - `organId`: token after `organ:`
    - `slots`: optional bracket list → `slots?: string[]`
  - `buildTree` behavior:
    - Looks up `organIndex.organs[organId]` (from `organ-index.json`)
      - `slots` from index are the **authoritative slotKeys**
    - `content` for organ nodes is filtered to only include those slotKeys

- **Arrow / navigation lines:**
  - Detection:
    - `if (line.trim().startsWith("->") && last) { last.target = ... }`
  - Grammar:
    - `-> TargetName`
    - `-> 2.0`
    - `-> |Home`
  - Resolution (`buildTree`):
    - `targetToRaw` includes:
      - `rawId`, `name`, `slugifyId(nodeId)`, and `aliasNames`
    - For a given `node.target`:
      - `raw = targetToRaw[node.target] ?? node.target.match(/^([\d.]+)/)?.[1] ?? rawByName[node.target] ?? node.target`
      - `idMap[raw]` used to set:
        - `behavior.type = "Navigation"`
        - `behavior.params = { verb: "go", variant: "screen", screenId: idMap[raw], to: idMap[raw] }`

- **State bind annotation lines:**
  - Matcher:
    - `/state\.bind:\s*([a-zA-Z0-9._]+)/`
  - Behavior:
    - When seen under a node, pushes `{ type: "bind", key }` into `node.state`
  - `buildTree` mapping:
    - For each `s` of type `bind`:
      - `entry.state = { mode: "two-way", key: s.key }`
      - `entry.params.field = { multiline: true, rows: 4, fieldKey: s.key }`

- **Logic annotation lines (behavior actions):**
  - Matcher:
    - `/\(logic\.(\w+):\s*([^)]+)\)/`
  - Stored as:
    - `logic?: { type: string; expr: string }[]`
  - `buildTree` handling (first logic entry only):
    - Special case for `expr === "state:journal.add"`:
      - `track = node.name.replace(/Save$/i, "").toLowerCase()`
      - Emits:
        - `behavior = { type: "Action", params: { name: "state:journal.add", track, key: "entry", valueFrom: "input", fieldKey: "journal.<track>" } }`
    - All other expressions:
      - `behavior = { type: "Action", params: { name: expr } }`

- **Variant lines (for organs, future extension):**
  - Matcher:
    - `^variant:\s*(\S+)$`
  - Behavior:
    - `last.variant = <value>`
  - `buildTree`:
    - For organ nodes, default variant is `"default"` unless overridden here.

- **Alias id lines (next-line annotations):**
  - `@id(...)` and `@aliases(...)` are supported both:
    - Inline in node line
    - On following lines by themselves, matched by:
      - `^@id\s*\(?([^)\s]+)\)?$`
      - `^@aliases\s*\(([^)]+)\)$`
  - `buildIdMaps` uses `nodeId` and `aliasNames` to fill `idMap` and `targetToRaw`.

### 2. Node ID and slug rules

- **Raw node id (`rawId`)**:
  - Format: `^\d+(\.\d+)*$` (e.g. `1.0`, `1.0.3.2`)
  - Used for:
    - Depth calculation (max depth validation)
    - Parent/child hierarchy via indentation (spaces) + stack

- **Display id (`id`) used at runtime:**
  - Computed via `buildIdMaps`:
    - If `nodeId` present: `slugifyId(nodeId) → "|" + nodeId.replace(/[^a-zA-Z0-9]+/g, "")`
    - Else: `slugify(name) → "|" + name.replace(/[^a-zA-Z0-9]+/g, "")`
  - Stored in `idMap[rawId]`
  - Used as:
    - `entry.id` for all nodes
    - Navigation targets:
      - `screenId: idMap[raw]`
      - `to: idMap[raw]`

### 3. Minimal valid examples (from real files)

**Example A — basic structure + navigation (from `src/08_Modules/legal/master/blueprint.txt`):**

```text
1.0 | RootSection | Section [title]
  1.0.1 | NavStepper | Stepper [steps]
  1.0.2 | HeroSection | Section [title]
    1.0.2.1 | HeroCard | Card [body, media]
    1.0.2.2 | HeroCta | Button [label]
      -> ServicesSection
```

Tokens used:
- Node ids: `1.0`, `1.0.2.2`
- Type tokens: `Section`, `Card`, `Button`
- Content slots: `[title]`, `[body, media]`, `[label]`
- Arrow target: `-> ServicesSection` (resolved via `targetToRaw`)

**Example B — state binding and logic action (from same blueprint):**

```text
1.0.5.1 | ContactName | Field [label, input]
  [state.bind: contact.name]
...
1.0.5.4 | ContactSubmit | Button [label] (logic.action: state:contact.submit)
```

Parser behavior:
- `Field` node:
  - `slots = ["label", "input"]`
  - `state` includes `{ type: "bind", key: "contact.name" }`
  - `buildTree` emits `state.mode="two-way"`, `params.field.fieldKey="contact.name"`
- `Button` node:
  - `behaviorToken = "logic.action: state:contact.submit"` (not executed directly)
  - `logic` entry `{ type: "action", expr: "state:contact.submit" }`
  - `buildTree` emits `behavior = { type: "Action", params: { name: "state:contact.submit" } }`

**Example C — organ node grammar (from `parseBlueprint` implementation):**

```text
1.0 | HeroBlock | organ:hero [hero.title, hero.subtitle, hero.cta]
variant: centered
```

Parser behavior:
- Organ line:
  - `rawId = "1.0"`, `name = "HeroBlock"`
  - `type = "organ"`, `organId = "hero"`
  - `slots = ["hero.title", "hero.subtitle", "hero.cta"]`
  - `variant = "default"` initially
- Variant line:
  - Sets `last.variant = "centered"`
- `buildTree`:
  - Looks up `organIndex.organs["hero"]`
  - Filters `contentMap[node.rawId]` by allowed `slots` from index
  - Emits node with:
    - `type: "organ"`, `organId: "hero"`, `variant: "centered"`, `children: []`

No other syntax tokens are recognized by the parser. Anything that does not match the patterns above is ignored (not part of the compiled tree).

---

## Behavior + Action Registry (Authoritative)

**Authoritative sources:**
- Contract verb set: `src/02_Contracts_Reports/contracts/contract-verbs.ts`
- Global listener: `src/03_Runtime/engine/core/behavior-listener.ts`
- Behavior runner + mapping: `src/03_Runtime/behavior/behavior-runner.ts`
- Behavior handlers: `src/03_Runtime/behavior/behavior-engine.ts`
- Runtime verbs (post-behavior): `src/05_Logic/logic/runtime/runtime-verb-interpreter.ts`, `src/05_Logic/logic/runtime/action-runner.ts`, `src/05_Logic/logic/runtime/action-registry.ts`

### 1. Contract verb universe (tokens)

From `contract-verbs.ts`:

- **Interaction verbs (`CONTRACT_VERBS_INTERACTION`):**
  - `"tap"`, `"double"`, `"long"`, `"drag"`, `"scroll"`, `"swipe"`

- **Navigation verbs (`CONTRACT_VERBS_NAVIGATION`):**
  - `"go"`, `"back"`, `"open"`, `"close"`, `"route"`

- **Image-domain verbs (`CONTRACT_VERBS_IMAGE_DOMAIN`):**
  - `"crop"`, `"filter"`, `"frame"`, `"layout"`, `"motion"`, `"overlay"`

- **Contract verb set:**
  - `CONTRACT_VERB_LIST = [...interaction, ...navigation, ...imageDomain]`
  - `CONTRACT_VERBS = new Set(CONTRACT_VERB_LIST)`
  - `inferContractVerbDomain(actionName, paramsDomain?)`:
    - `"image"` if in `CONTRACT_VERBS_IMAGE_DOMAIN`
    - `"interaction"` if in `CONTRACT_VERBS_INTERACTION`
    - `"navigation"` otherwise, unless an explicit `params.domain` is provided

### 2. Behavior listener: event → verb routing

Source: `src/03_Runtime/engine/core/behavior-listener.ts`

- Listens to browser events:
  - `"input-change"`: wires field typing into `dispatchState("state.update", { key: fieldKey, value })`
  - `"navigate"`: calls the `navigate(destination)` callback directly
  - `"action"`: central behavior and verb entrypoint

- **Action event handling (simplified):**
  - Reads:
    - `const behavior = e.detail || {};`
    - `const params = behavior?.params ?? {};`
    - `const actionName = params.name;`
  - Branches:
    1. **State mutations (`state:*` / `state.update`):**
       - `isStateMutation = actionName.startsWith("state:") || actionName === "state.update"`
       - Special cases:
         - `state:currentView` → `dispatchState("state:currentView", { value })`
         - `state.update` → `dispatchState("state.update", { key, value })`
         - `journal.add` (from `"state:journal.add"`) → `dispatchState("journal.add", {...})`
       - Value resolution:
         - `valueFrom === "input"` reads from:
           - `state.values[fieldKey]` (preferred for `journal.add`)
           - Or legacy `inputByFieldKey` / `lastInputValue`
    2. **Navigate action:**
       - `actionName === "navigate"` → `navigate(params.to)`
    3. **Contract verbs path (registry-only):**
       - If `CONTRACT_VERBS.has(actionName)`:
         - `const domain = inferContractVerbDomain(actionName, params.domain)`
         - Builds `ctx` with navigation helpers:
           - `navigate`, `setScreen`, `openModal`, `setFlow`, `goBack`, `goRoot`, `openPanel`, `openSheet`, `closePanel`, `closeSheet`
         - Calls `runBehavior(domain, actionName, ctx, params)`
    4. **Runtime verb interpreter fallback:**
       - For any `actionName` not in contract verbs and not `navigate` / `state:*`:
         - Lazy `require("@/logic/runtime/runtime-verb-interpreter")`
         - Calls `interpretRuntimeVerb({ name: actionName, ...verbParams }, currentState)`

**Registry-only enforcement (for contract verbs):**
- All contract-verb-based behaviors are forced through:
  - `behavior-listener` → `runBehavior` → `BehaviorEngine[...]`
- There is **no inlined switch** on `"tap"`, `"go"`, etc. outside this path.
- Non-contract verbs (e.g. `"structure:addFromText"`) intentionally go through `runtime-verb-interpreter` + `action-registry` instead of BehaviorEngine.

### 3. Behavior runner registry shape

Source: `src/03_Runtime/behavior/behavior-runner.ts`

- Imports `behavior.json`:
  - `const interactions = behaviorData.interactions;`
  - `const navigations = behaviorData.navigations;`
- Resolves handler name via three maps:
  1. **From action-domain mapping (`resolveBehaviorVerb(domain, action)`):**
     - Returns `{ handler: string } | null` per domain+action pair (implementation in `behavior-verb-resolver.ts`).
  2. **From `interactions` flat or variant map:**
     - `interactionEntry = interactions[action]`
     - If string: `{ handler: interactionEntry }`
     - If object: uses `variant = args.variant || args.direction || args.mode || "default"` to index into map.
  3. **From `navigations` map (nested verb + variant):**
     - Only when `domain === "navigation" || domain === "navigate"`
     - `variant = resolveNavVariant(verb, args)` where:
       - `go` → `"screen" | "modal" | "flow"` inferred from param keys
       - `open`/`close` → `"panel" | "sheet"`
       - `route` → `"internal" | "external"`
       - `back` → `"one" | "all" | "root"` (based on flags / `count`)

- Final dispatch:
  - Chooses `map = fromAction || fromInteraction || fromNavigation`
  - `handlerName = map.handler`
  - Looks up `BehaviorEngine[handlerName]`
  - Invokes:
    - If handler arity ≥ 2: `fn(ctx, args)`
    - Else: `fn(args, ctx)`
  - For navigation domain:
    - Uses `result?.target ?? args?.target`
    - Calls `fireNavigation(ctx, target)` which prefers `ctx.navigate`

**Registry key format:**
- `behavior.json` (not shown here) and `behavior-verb-resolver` map:
  - Contract verb tokens → handler names like:
    - `"tap"` → `"interact.tap"`
    - `"go"` (with variant `"screen"`) → `"nav.goScreen"`
    - `"back"` → `"nav.backOne"`, `"nav.backAll"`, `"nav.backRoot"`
  - BehaviorEngine then implements these handler names as object keys.

**Registry entry shape (BehaviorEngine):**

From `src/03_Runtime/behavior/behavior-engine.ts`:
- Object literal:
  - Keys: string handler ids, e.g. `"interact.tap"`, `"nav.goScreen"`, `"cropMedia"`, `"applyFilter"`, ...
  - Values: functions with signatures:
    - Interaction-only handlers:
      - `(args: any) => { ...; dispatchState("interaction.record", {...}) }`
    - Navigation handlers:
      - `(ctx, args) => { ctx.setScreen(args.screenId); return { target: args.screenId }; }`
    - Image-domain stubs:
      - `(args: any) => { dispatchState("state.update", { key: "lastMediaAction", value: { handler, args } }) }`

### 4. Runtime action registry (post-behavior verbs)

**Runtime verbs:**
- `interpretRuntimeVerb(verb, state)` (`src/05_Logic/logic/runtime/runtime-verb-interpreter.ts`):
  - If `verb.type === "Action"` → normalizes into `{ name: verb.params.name, ...verb.params }`
  - If `typeof verb.name === "string"` → forwards directly
  - Always calls `runAction(action, state)`; never mutates state itself.

**Action registry location and shape:**

Source: `src/05_Logic/logic/runtime/action-registry.ts`

- Type:
  - `type ActionHandler = (action: any, state: Record<string, any>) => any;`
- Registry:
  - `const registry: Record<string, ActionHandler> = { ... }`
  - Keys:
    - `"logic:runCalculator"`, `"logic:run25x"`, `"logic:resolveOnboarding"`
    - Diagnostics: `"diagnostics:capabilityDomain"`, `"diagnostics:sensorRead"`, etc.
    - Structure: `"structure:addItem"`, `"structure:addItems"`, `"structure:updateItem"`, `"structure:deleteItem"`, `"structure:setBlocksForDate"`, `"structure:setActivePlanner"`, `"structure:cancelDay"`, `"structure:addFromText"`, `"structure:addJourney"`, `"structure:setParserStaging"`, `"structure:updateStagingRow"`, `"structure:confirmStaging"`, `"structure:setTaskFolderTemplate"`, `"structure:setTaskTemplateRows"`, `"structure:setParserConfig"`, `"structure:loadRuleset"`, `"structure:ensureTaskTemplateRows"`, `"structure:setScheduledSection"`, `"structure:parseToStaging"`
    - Calendar: `"calendar.today"`, `"calendar.week"`, `"calendar.month"`, `"calendar:setDay"`, `"calendar:setWeek"`, `"calendar:setMonth"`, `"calendar:setDate"`
- Public API:
  - `getActionHandler(name: string)` → `registry[name]`
  - `getActionNames(): string[]` → all keys

**Action runner:**

Source: `src/05_Logic/logic/runtime/action-runner.ts`

- `runAction(action, state)`:
  - Validates `action.name` is a string
  - Capability gating via `CAPABILITY_ACTION_MAP` / `CAPABILITY_ACTION_PREFIXES`
  - Looks up handler via `getActionHandler(action.name)`
  - Calls handler with `(action, state)`
  - Always returns `state` (no direct mutation here).

### 5. No inline handlers rule (scope of enforcement)

- **Registry-only (enforced for JSON action names):**
  - For **contract verbs**:
    - `behavior-listener` enforces that they always go through:
      - `CONTRACT_VERBS` → `runBehavior` → `BehaviorEngine[...]`
  - For **runtime verbs**:
    - `interpretRuntimeVerb` is the only path from `"action"` events that are not contract verbs / `navigate` / `state:*`.
    - All such names must be present in `action-registry.ts` (or no-op with a logged error).

- **Not enforced for TSX internals:**
  - TSX components may still use local React handlers on atoms/molecules; those are outside this JSON-driven registry path.
  - This contract only governs **JSON behavior events and runtime verbs**, not low-level TSX event props.

### 6. Concrete binding example (from real runtime)

From `src/03_Runtime/engine/core/json-renderer.tsx`:

- List-generated item mapping:
  - For `List` with `itemsFromState`:
    - Items are mapped to:
      - `{ label: ..., behavior: { type: "Action", params: { name: "structure:updateItem", id: item.id } } }`
  - Behavior pipeline:
    1. JSON tree contains `behavior.type = "Action"`, `behavior.params.name = "structure:updateItem"`.
    2. `ExperienceRenderer` / JsonRenderer emits an `"action"` CustomEvent with `detail.params.name = "structure:updateItem"`.
    3. `behavior-listener` receives it:
       - Not `state:*`, not `"navigate"`, not in `CONTRACT_VERBS`.
       - Falls through to `interpretRuntimeVerb({ name: "structure:updateItem", id: item.id }, state)`.
    4. `interpretRuntimeVerb` calls `runAction`.
    5. `runAction`:
       - Looks up `"structure:updateItem"` in `action-registry.ts`.
       - Executes the `structureUpdateItem` handler.
    6. The handler mutates state (via `dispatchState`) according to the structure engine contract.

This is the canonical example of **JSON behavior → action registry → state mutation**.

---

## Engine Registry + Engine I/O (Authoritative)

**Authoritative sources:**
- Engine registry (education/flow engines): `src/05_Logic/logic/engine-system/engine-registry.ts`
- Engine contract types: `src/02_Contracts_Reports/contracts/SystemContract.ts`
- Generic engine discovery registry: `src/system/registry/engineRegistry.ts`
- Engine usage in layout/runtime:
  - `src/05_Logic/logic/engines/*`
  - `src/05_Logic/logic/runtime/FlowRenderer.tsx`
  - `src/05_Logic/logic/engines/json-skin.engine.tsx`

### 1. Engine ID format (flow engine registry)

From `engine-registry.ts`:

- EngineId union:
  - `type EngineId = "learning" | "calculator" | "abc" | "decision" | "summary" | "system7";`
- ExecutionEngineId:
  - `"learning" | "calculator" | "abc"`
- AftermathProcessorId:
  - `"decision" | "summary"`

These string literals are the **closed set** for the flow engines used by the education/decision stack.

### 2. Engine descriptor and function shape

From `engine-registry.ts` and `SystemContract.ts`:

- Execution engine contract:
  - `interface ExecutionEngineContract { engineId: "learning" | "calculator" | "abc"; transformFlow(flow: any): any; getPresentation(flow: any): PresentationModelContract; }`
- Presentation model contract:
  - `interface PresentationModelContract { engineId: string; title: string; stepOrder: string[]; groups?: PresentationGroupContract[]; badges?: Record<string, string[]>; notes?: string[]; }`
- Flow engine registry types:
  - `type EngineFunction = (flow: EducationFlow) => EngineFlow;`
  - `type PresentationFunction = (flow: EducationFlow) => PresentationModel;`
- Registries:
  - `EXECUTION_ENGINE_REGISTRY: Record<ExecutionEngineId, EngineFunction>`
  - `AFTERMATH_PROCESSOR_REGISTRY: Record<AftermathProcessorId, EngineFunction>`
  - `ENGINE_REGISTRY: Record<EngineId, EngineFunction>`
  - `PRESENTATION_REGISTRY: Record<EngineId, PresentationFunction>`

### 3. Engine input and output schema expectations

- **Input (`EducationFlow`):**
  - Flow object from `@/logic/flows/flow-loader` (not expanded here); engines expect:
    - `flow.id`
    - `flow.steps[]`, each with `id` and metadata
  - `applyEngine(flow, engineId)` logs:
    - `flow.id`, `flow.steps.length`

- **Output (`EngineFlow` / EngineStateContract):**
  - Engine transforms the flow into an engine-specific state; `system7EngineStub` returns the flow unchanged.
  - EngineStateContract (from `SystemContract.ts`) describes the canonical engine output shape when persisted:
    - `orderedStepIds`, `currentStepIndex`, `totalSteps`
    - `completedStepIds`, accumulators (`signals`, `blockers`, `opportunities`)
    - `severityDensity`, `weightSum`, `calcOutputs`, `engineId`, `exportSlices`

### 4. Engine registry behavior and binding

`applyEngine(flow, engineId: EngineId)`:
- Special handling:
  - `"system7"` → returns `flow` unchanged (dormant identity engine).
- Guards:
  - If engineId is an aftermath processor, logs a warning and falls back to `learning`.
  - Uses `getExecutionEngine(engineId as ExecutionEngineId)` to get the function.
- Logs before/after:
  - `originalSteps` vs `transformedSteps`
  - Whether step order changed

`getPresentation(flow, engineId: EngineId)`:
- Looks up `presentationFn = PRESENTATION_REGISTRY[engineId]`
- Falls back to `learning` if not found.

### 5. Generic engine discovery registry

Source: `src/system/registry/engineRegistry.ts`

- `type EngineDefinition = { name: string; integratesWith?: string[]; description?: string; tags?: string[]; file?: string; };`
- Internal store:
  - `const engines = new Map<string, EngineDefinition>();`
- API:
  - `registerEngine(def: EngineDefinition)`:
    - Requires `def.name`
    - Deduplicates by name
  - `getEngines(): EngineDefinition[]`
  - `getEngine(name: string): EngineDefinition | undefined`

This registry is **discovery/metadata-only**; it does not participate directly in Flow engine execution, but it is the authoritative shape for engine metadata (id/name, state integration surface via `integratesWith`, etc.).

### 6. Blueprint → engine binding mechanism

- **Blueprint output (app.json)**:
  - Contains only **screen structure + behavior + content**; no direct flow-engine IDs.
  - From `BLUEPRINT_RUNTIME_INTERFACE.generated.md` and compiler:
    - Tree nodes: `id`, `type`, `children`, `content`, optional `role`, `state`, `params`, `behavior`.
    - **No engine IDs** are emitted by `compileApp`.

- **Engine binding at runtime:**
  - Engines bind to:
    - Flow/education inputs via `flow-loader` and `engine-registry`.
    - Screen state via **action-registry** handlers and **state.update** events.
  - JSON actions like `"logic:runCalculator"`:
    - Are routed via `interpretRuntimeVerb` → `runAction` → `runCalculator`.
    - Handlers write into `state.values[...]` and/or other intent streams as per their own contracts.

**Conclusion:**
- There is **no direct blueprint syntax** that selects an engine by ID.
- Engine IDs are string literals in `engine-registry.ts` and handler names in `action-registry.ts`.
- Engine input/output shapes are governed by `SystemContract.ts` and the Flow engines themselves.

---

## State Model + Mutation Layer (Authoritative)

**Authoritative sources:**
- State store + resolver:
  - `src/03_Runtime/state/state-store.ts`
  - `src/03_Runtime/state/state-resolver.ts`
  - `src/state/state.ts` (types)
- State mutation surface map:
  - `src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/STATE_MUTATION_SURFACE_MAP.md`
- Behavior listener + runtime verbs:
  - `src/03_Runtime/engine/core/behavior-listener.ts`
  - `src/05_Logic/logic/runtime/runtime-verb-interpreter.ts`
  - `src/05_Logic/logic/runtime/action-registry.ts`

### 1. State namespaces / slices

From `state-resolver.ts`:

- `DerivedState` fields:
  - `journal: Record<string, Record<string, string>>`
  - `rawCount: number` (length of event log)
  - `currentView?: string`
  - `scans?: any[]`
  - `interactions?: any[]`
  - `values?: Record<string, any>` (generic key/value surface)
  - `layoutByScreen?: Record<string, { section: Record<string, string>; card: Record<string, string>; organ: Record<string, string> }>`

Other files (via STATE_MUTATION_SURFACE_MAP) confirm that **all state changes** must go through `dispatchState(intent, payload)`.

### 2. Supported mutation intents (verbs at state-store level)

From `state-resolver.ts` and STATE_MUTATION_SURFACE_MAP:

- **Core intents interpreted by `deriveState`:**
  - `state:currentView` → view routing
  - `journal.set` → sets `journal[track][key]`
  - `journal.add` → appends/sets `journal[track][key]`
  - `state.update` → sets `values[key] = value`
  - `layout.override` → sets `layoutByScreen[screenKey][type][sectionId] = presetId`
  - `scan.result`, `scan.interpreted`, `scan.record`, `scan.batch` → append to `scans[]`
  - `interaction.record` → append to `interactions[]`

- **Additional intents recognized by `dispatchState` callers:**
  - From `state-store.ts`:
    - `journal.set` (dev/test helper `TEST_STATE`)
    - `scan.record`, `scan.batch` (via `recordScan` / `recordScanBatch`)
  - From higher-level code and STATE_MUTATION_SURFACE_MAP:
    - `scan.result`, `scan.interpreted` (global scan engine)

These intents form the **state mutation verb surface**. Structure and calendar actions (e.g. `"structure:addItem"`, `"calendar:setDate"`) call `dispatchState` inside their handlers; they are **higher-level mutation verbs** implemented in TypeScript but not new `intent` strings.

### 3. Validation gates before mutation

- Behavior listener:
  - Validates presence of `actionName`:
    - Logs and returns early if missing.
  - For `state:*`:
    - `valueFrom === "input"`:
      - Ensures there is a resolved value (state-backed for `journal.add`, well-defined fallbacks for others).
      - Logs `"🚨 INPUT PIPELINE BROKEN"` if resolution fails.
    - `state.update`:
      - Requires `key` to be a non-empty string.
  - For `navigate`:
    - Warns and exits if `params.to` is missing.
  - For contract verbs:
    - Wraps the call in `try/catch` with diagnostics.

- State resolver:
  - Ignores journal events where `payload.key` is not a string.
  - Ignores `layout.override` events where any of `screenKey`, `type`, `sectionId`, `presetId` are not strings.

- State store:
  - Re-derivation guard:
    - `if (isDeriving) return;` → disallows re-entrant `dispatchState` during derivation.
  - Development checks:
    - Compares expected vs stored values for `state.update`, records `state` pass/fail stages.

There is **no general schema validation** for `values[...]`; keys and shapes are determined by callers (e.g. structure engine, calculators, UI bindings).

### 4. Undo / redo

- The current implementation is **append-only**:
  - `log: StateEvent[]` stores the full history.
  - `deriveState(log)` replays from scratch on every `dispatchState`.
- There is **no implemented** `undo` / `redo` intent or handler in:
  - `state-resolver.ts`
  - `action-registry.ts`
  - Behavior listener

**DECLARATION REQUIRED (undo/redo):**
- Missing authority surface:
  - A dedicated undo/redo layer that:
    - Defines `intent` names (e.g. `state.undo`, `state.redo`)
    - Declares how they transform the event log vs derived state.
- Expected location:
  - `src/03_Runtime/state/state-resolver.ts` (for `deriveState` branch)
  - and/or `src/03_Runtime/state/state-store.ts` (for log manipulation).

### 5. Scope rules (local / screen / global)

- Explicit scopes are **not encoded** in state intents:
  - There is no `"local:"` / `"screen:"` / `"global:"` prefix on intents.
- Effective scoping is emergent:
  - `layoutByScreen[screenKey]` is **screen-scoped** override state.
  - `values` is **global** across screens (subject to consumers).
  - `journal[track]` is **named-track scoped**.

No explicit **scope model** type is present in code; scoping is inferred from key choice, not enforced by a separate registry.

---

## Layout / Structure / Template Declaration

**Authoritative sources:**
- Template registry and structure types: `src/system/registry/templateRegistry.ts`
- Layout resolvers:
  - Section + card layout and compatibility:
    - `src/04_Presentation/lib-layout/screen-layout-resolver.ts`
    - `src/layout/index.ts` and downstream layout modules (page/component/organ)
  - Runtime renderer integration:
    - `src/03_Runtime/engine/core/json-renderer.tsx`
- Profile/template resolution:
  - `src/lib/layout/profile-resolver.ts`
  - `src/lib/layout/template-profiles.ts`
- Screen composition:
  - `src/06_Data/screens/compose-offline-screen.ts`
  - `src/app/page.tsx`

### 1. Structure type (closed set) and template definition

From `templateRegistry.ts`:

- `export type StructureType = "list" | "board" | "dashboard" | "editor" | "timeline" | "detail" | "wizard" | "gallery";`
- `export type TemplateDefinition = { name: string; structureType: StructureType; requiredStateKeys?: string[]; supportedEngines?: string[]; description?: string; tags?: string[]; file?: string; };`
- Registry API:
  - `registerTemplate(def: TemplateDefinition)`
  - `getTemplates(): TemplateDefinition[]`
  - `getTemplate(name: string): TemplateDefinition | undefined`

**Enforcement:**
- The union type on `StructureType` is the **compile-time closed set** of structure types.
- Any template must choose one of these 8 strings; no other structureType is valid in this registry.

### 2. TemplateId and resolver strategy

From `app/page.tsx`:

- Template id resolution:
  - `effectiveTemplateId = state.values.templateId ?? layoutSnapshot.templateId ?? null`
- Template profile:
  - `templateProfile = getTemplateProfile(effectiveTemplateId ?? "")`
  - `effectiveProfile` merges:
    - Experience profile (`getExperienceProfile(experience)`)
    - Template profile fields:
      - `id`, `sections`, `defaultSectionLayoutId`, `layoutVariants`, `visualPreset`, `containerWidth`, `widthByRole`, `spacingScale`, `cardPreset`, `heroMode`, `sectionBackgroundPattern`
    - `mode` (template vs custom) from state/layout store.

From `json-renderer.tsx`:

- Section layout resolution:
  - `getSectionLayoutId({ sectionKey, node, templateId, sectionLayoutPresetOverrides, defaultSectionLayoutIdFromProfile, templateProfile }, { includeRule: true })`
  - Chooses a **single** layout id with rule info:
    - Sources, in authority order:
      1. Per-section layout override (from `sectionLayoutPresetOverrides`)
      2. Explicit `node.layout`
      3. Template role-based defaults
      4. Template defaultSectionLayoutId
  - `applyProfileToNode` then:
    - Sets `next.layout = finalLayoutId`
    - Stores `_effectiveLayoutPreset` on node for diagnostics.

- Card layout and organ internal layout:
  - Per-section card overrides via `cardLayoutPresetOverrides`
  - Organ internal layout overrides via `organInternalLayoutOverrides`
  - `getDefaultCardPresetForSectionPreset` and `getCardLayoutPreset` determine per-card layout ids.

From `screen-layout-resolver.ts`:

- Screen layouts are resolved from a **fixed registry**:
  - `SCREEN_LAYOUT_DEFINITIONS` from `screen-definitions.json`
  - `resolveScreenLayout(type, preset, params)` merges:
    - `defaults` → preset params → explicit params.

### 3. Evidence for “8 structure types” and mapping

- The **only closed set** of structure types in runtime code is:
  - `StructureType` union in `templateRegistry.ts`.
- Mapping from structure type to actual templates is handled by:
  - Template-creation code that calls `registerTemplate({ name, structureType, ... })`.
  - Template profiles in `template-profiles.ts` (IDs, roles, layout defaults).

**Authority:**
- For **structureType**:
  - `src/system/registry/templateRegistry.ts` is authoritative.
- For **templateId** and profiles:
  - `src/lib/layout/template-profiles.ts` is authoritative.
- For **layout id resolution**:
  - `src/layout` modules (especially `layout/index.ts` and `getSectionLayoutId`) are authoritative.

---

## Organ vs Organism Boundary (Compile + Runtime)

**Authoritative sources:**
- Blueprint compiler:
  - `src/07_Dev_Tools/scripts/blueprint.ts`
- Organ index:
  - `src/07_Dev_Tools/scripts/organ-index.json` (data file, not shown here)
- Organ expansion + runtime composition:
  - `src/app/page.tsx`
  - `src/lib/screens/compose-offline-screen.ts`
  - `src/components/organs` (organ TSX, `expandOrgansInDocument`, `loadOrganVariant`)

### 1. Organs as TSX composed of molecules

- This remains true:
  - Organs are implemented as TSX components composed of molecules.
  - Organ slots and variants are defined in TSX + the `organ-index.json` data.
  - Blueprint only ever sees an **opaque organ node** with:
    - `type: "organ"`, `organId`, `variant`, and `content` keyed by slotKeys.

### 2. Organism blueprint composes organ nodes

- Blueprint-level composition:
  - `blueprint.txt` is a hierarchical outline:
    - Node lines for organs: `... | Name | organ:hero [hero.title, hero.subtitle, hero.cta]`
  - Compiler `buildTree`:
    - Emits organ nodes as:
      - `{ id, type: "organ", organId, variant, content, children: [] }`
    - Does **not** expand organ internals.

### 3. Organ expansion layer at runtime (present in code)

From `app/page.tsx`:

- After loading `json` (app.json) and computing `renderNode`:
  - `const children = assignSectionInstanceKeys(rawChildren);`
  - `const docForOrgans = { meta: ..., nodes: children };`
  - `const expandedDoc = expandOrgansInDocument(docForOrgans, loadOrganVariant, organInternalLayoutOverrides);`
  - `const boundDoc = applySkinBindings(expandedDoc, skinData);`
  - `const finalChildren = boundDoc.nodes ?? children;`
  - `renderNode = { ...renderNode, children: finalChildren };`

This is a **document-level organ expansion** step:
- Uses `expandOrgansInDocument` + `loadOrganVariant` to replace organ nodes with trees defined by TSX organ variants.
- Occurs **before** role inference (`composeOfflineScreen`) and before JsonRenderer.

**Updated boundary statement:**
- There **is** a compile-time blueprint compiler that emits organ nodes.
- There **is** a runtime expansion step (`expandOrgansInDocument`) that:
  - Reads organId+variant
  - Injects TSX-defined structure into the JSON tree.
- Organs’ internal structure is still defined in TSX, but an expansion layer applies that structure into the JSON tree before render.

### 4. Final artifact shape consumed at runtime

From `BLUEPRINT_RUNTIME_INTERFACE.generated.md` and `json-renderer.tsx`:

- Runtime render path:
  1. `blueprint.ts` → `app.json` (+ `content.manifest.json`)
  2. `screen-loader` fetches JSON via `/api/screens/...`.
  3. `page.tsx`:
     - Assigns section instance keys.
     - Runs `expandOrgansInDocument`.
     - Runs `applySkinBindings`.
     - Runs `composeOfflineScreen` (role inference).
     - Runs `collapseLayoutNodes` (dev collapse of layout primitives).
  4. `ExperienceRenderer` / `JsonRenderer` render the final tree.

- Final JSON **screen tree** consumed by renderer:
  - Root:
    - `type: "section"` or equivalent wrapper
    - `children: [...]` (sections and molecules)
  - Nodes:
    - `id`, `type`, `role?`, `layout?`, `content`, `params`, `state?`, `behavior?`, `children?`

Blueprint V3 must treat this final **expanded + composed JSON tree** as the runtime artifact that organs feed into, rather than assuming no expansion exists.

---

## Compliance Checklist (HARD FAILS)

This section lists **conditions that must fail validation** or emit hard errors according to existing code. Where enforcement is warning-only, that is noted explicitly.

1. **Unknown arrow target (navigation):**
   - Enforcement:
     - `runValidation` in `blueprint.ts`:
       - If `node.target` cannot be resolved via `targetToRaw` / `idMap`, pushes error:
         - `code: "MISSING_ARROW_TARGET"`
         - `safeToContinue = false` when any errors exist.
     - `compileApp(..., { strict: true })` will **throw** on such errors.

2. **Duplicate display ids:**
   - Enforcement:
     - `runValidation`:
       - Detects `idMap` collisions and pushes `code: "DUPLICATE_ID"`.
       - `safeToContinue = false`.
     - `strict` mode prevents writing `app.json` when duplicates are present.

3. **Unknown organId:**
   - Enforcement:
     - `validateOrganNodes`:
       - Logs `console.error` for any `node.organId` not found in `organIndex.organs`.
       - Does **not** currently stop compilation.
   - **DECLARATION REQUIRED:**
     - A strict mode that treats unknown `organId` as a fatal error should live in:
       - `validateOrganNodes` in `src/07_Dev_Tools/scripts/blueprint.ts`.

4. **Orphan content keys (content drift):**
   - Enforcement:
     - `runValidation`:
       - `UNUSED_CONTENT` warnings for content blocks with no matching blueprint node.
     - `validateContentKeys`:
       - Warns on invented keys not in manifest.
   - Behavior:
     - Warnings only; build continues (unless strict mode is extended).

5. **Unknown behavior verb (contract verb path):**
   - Enforcement:
     - `behavior-runner`:
       - If no map from action/interactions/navigations is found:
         - Logs `"⚠️ No behavior found"`, records diagnostic decision.
     - `behavior-listener`:
       - Falls through to `interpretRuntimeVerb` only for non-contract verbs.
   - For contract verbs:
     - Any missing mapping in `behavior.json` or `BehaviorEngine` results in logged errors and no behavior execution, but not a runtime crash.

6. **Behavior on non-actionable molecule (renderer contract):**
   - Enforcement:
     - `json-renderer.tsx` uses:
       - `NON_ACTIONABLE_TYPES` from `@/contracts/renderer-contract`
       - `shouldStripBehavior(nodeType, behavior)`:
         - Strips behavior from:
           - Non-actionable types
           - `modal` when behavior is not a close-only behavior.
   - Effect:
     - Behavior is removed at render time; no click handling is attached.

7. **Engine binding to unknown engine/action:**
   - For flow engines:
     - `applyEngine`:
       - Throws if `getExecutionEngine(engineId)` cannot find an engine.
   - For runtime actions:
     - `action-runner`:
       - Logs `"No handler for action"` if `getActionHandler(name)` returns undefined.
       - Returns state unchanged.

8. **Mutation verb not supported (runtime actions):**
   - If a JSON `Action` uses `params.name` that is:
     - Not a contract verb.
     - Not `"navigate"`, not `state:*`.
     - Not present in `action-registry.ts`.
   - Behavior:
     - `interpretRuntimeVerb` calls `runAction`.
     - `runAction` logs error and returns state unchanged.
   - There is **no central list** of mutation verbs beyond:
     - `state:*` intents.
     - Action names in `action-registry.ts`.

9. **StructureType/template not declared:**
   - StructureType:
     - Enforced by TypeScript union in `templateRegistry.ts`.
   - TemplateId:
     - If `getTemplateProfile(effectiveTemplateId)` cannot find a template:
       - `templateProfile` is `null`.
       - `effectiveProfile` falls back to `experienceProfile` only.
   - There is **no runtime error** for unknown templateId; layout falls back to experience defaults.

---

## DECLARATION REQUIRED (Not found in implementation)

The following authority surfaces are referenced conceptually in earlier contracts but are **not** implemented as explicit, single-source registries in the current code:

1. **Global mutation verb registry:**
   - Missing:
     - A single file enumerating all mutation verbs (append, update, remove, clear, replace, merge, reorder, toggle, increment, decrement, undo, redo, etc.) and their mapping to:
       - State intents.
       - Action names.
   - Expected location:
     - `src/02_Contracts_Reports/contracts/state-verbs.ts` (new) or
     - Augmenting `src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/STATE_MUTATION_SURFACE_MAP.md` with a generated TS companion.

2. **Central behavior/action capability registry for non-contract verbs:**
   - Today:
     - Contract verbs are centralized in `contract-verbs.ts`.
     - Non-contract verbs live in `action-registry.ts` (names only).
   - Missing:
     - A contract file declaring:
       - For each `action.name`, its:
         - State slice(s) affected.
         - Expected payload shape.
         - Idempotency and scope.
   - Expected location:
     - `src/02_Contracts_Reports/contracts/ACTION_VERB_CONTRACT.ts`.

3. **Hard-fail organ validation contract:**
   - Today:
     - `validateOrganNodes` logs errors for unknown organIds/slots/variants but does not stop the build.
   - Missing:
     - A contract that:
       - Requires `compileApp(..., { strict: true })` for CI.
       - Treats any organ validation error as a hard failure.
   - Expected location:
     - `src/07_Dev_Tools/scripts/organ-index.json` (data) + an accompanying contract file:
       - `src/02_Contracts_Reports/contracts/ORGAN_INDEX_CONTRACT.ts`.

4. **Explicit state scope model (local/screen/global) as a type:**
   - Today:
     - Scoping is implied by keys (`layoutByScreen`, `values`, `journal`).
   - Missing:
     - A typed declaration enumerating scopes and mapping intents/keys to scopes.
   - Expected location:
     - `src/02_Contracts_Reports/contracts/STATE_SCOPE_CONTRACT.ts`.

---

## Evidence Index

**Blueprint grammar and compiler:**
- `src/07_Dev_Tools/scripts/blueprint.ts`
- `src/08_Modules/legal/master/blueprint.txt`
- `src/999_Cleanup/map-old/engine/map-blueprint-parser.ts`
- `src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/BLUEPRINT_RUNTIME_INTERFACE.generated.md`

**Behavior + action registry:**
- `src/03_Runtime/engine/core/behavior-listener.ts`
- `src/02_Contracts_Reports/contracts/contract-verbs.ts`
- `src/03_Runtime/behavior/behavior-runner.ts`
- `src/03_Runtime/behavior/behavior-engine.ts`
- `src/05_Logic/logic/runtime/runtime-verb-interpreter.ts`
- `src/05_Logic/logic/runtime/action-runner.ts`
- `src/05_Logic/logic/runtime/action-registry.ts`

**Engine registry + I/O:**
- `src/05_Logic/logic/engine-system/engine-registry.ts`
- `src/02_Contracts_Reports/contracts/SystemContract.ts`
- `src/system/registry/engineRegistry.ts`
- `src/05_Logic/logic/engines/*.engine.ts` (engine-specific input/output)

**State model + mutation layer:**
- `src/03_Runtime/state/state-store.ts`
- `src/03_Runtime/state/state-resolver.ts`
- `src/state/state.ts`
- `src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/STATE_MUTATION_SURFACE_MAP.md`
- `src/03_Runtime/engine/core/behavior-listener.ts`
- `src/05_Logic/logic/runtime/action-registry.ts`

**Layout / structure / templates:**
- `src/system/registry/templateRegistry.ts`
- `src/lib/layout/template-profiles.ts`
- `src/lib/layout/profile-resolver.ts`
- `src/layout/index.ts` and downstream layout modules
- `src/04_Presentation/lib-layout/screen-layout-resolver.ts`
- `src/03_Runtime/engine/core/json-renderer.tsx`

**Organ vs organism boundary:**
- `src/07_Dev_Tools/scripts/blueprint.ts`
- `src/07_Dev_Tools/scripts/organ-index.json`
- `src/app/page.tsx`
- `src/06_Data/screens/compose-offline-screen.ts`
- `src/components/organs/*`

**Palette / style authority:**
- `src/03_Runtime/engine/core/palette-store.ts`
- `src/03_Runtime/engine/core/styler.tsx`
- `src/07_Dev_Tools/diagnostics/pipeline/palette/contract.ts`
- `src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/ENGINE_RUNTIME_VISIBILITY_MAP.md`

These paths are the implementation surfaces this V3 contract concretely reflects. Any future change to those files that affects grammar, behavior routing, engine IDs, state shape, layout resolution, or organ expansion must be mirrored here.
