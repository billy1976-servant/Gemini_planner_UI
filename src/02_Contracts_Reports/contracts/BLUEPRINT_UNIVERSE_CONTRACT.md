# HIcurv EXHAUSTIVE BLUEPRINT UNIVERSE v1.0 (LOCKED)

This file enumerates ALL POSSIBLE BLUEPRINT ELEMENTS.
Nothing here executes. Nothing here implies logic.
This is the allowed universe only.

---

## 1️⃣ MOLECULE UNIVERSE (ALL MOLECULES × VARIANTS × SIZES × CONTENT SLOTS)

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

---

## MOLECULE → ALLOWED BEHAVIOR VERBS (EXPLICIT)

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

📌 Key lock: Only actionable molecules may execute behavior verbs.

**Edge / Interactive Molecules**

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

## CONTENT

### 1️⃣ TEXT CONTENT (LANGUAGE ONLY — STRING-BASED)

**Rule:** Human language only. No structure. No rendering logic. Output is always a string.

```
TEXT
├─ label     │ format: string │ schema: plain text       │ output: "string"
├─ title     │ format: string │ schema: plain text       │ output: "string"
├─ subtitle  │ format: string │ schema: plain text       │ output: "string"
├─ heading   │ format: string │ schema: plain text       │ output: "string"
├─ body      │ format: string │ schema: paragraphs       │ output: "string"
├─ caption   │ format: string │ schema: short text       │ output: "string"
├─ hint      │ format: string │ schema: helper text      │ output: "string"
├─ success   │ format: string │ schema: feedback text    │ output: "string"
├─ error     │ format: string │ schema: feedback text    │ output: "string"
├─ button    │ format: string │ schema: UI label         │ output: "string"
└─ markdown  │ format: string │ schema: markdown         │ output: "markdown string"
```

📌 Key lock: TEXT = string only. No objects. No arrays. No inference.

---

### 2️⃣ MEDIA CONTENT (SOURCE-ONLY, NO RENDER LOGIC)

**Rule:** Media is a reference, not a decision. Generator never sets layout, autoplay, fit, etc.

```
MEDIA
├─ image           │ format: source │ schema: URL | assetId              │ output: "string"
├─ icon            │ format: source │ schema: iconName | assetId      │ output: "string"
├─ video           │ format: source │ schema: URL                       │ output: "string"
├─ audio           │ format: source │ schema: URL                       │ output: "string"
├─ gif             │ format: source │ schema: URL                       │ output: "string"
├─ pdf             │ format: source │ schema: URL                       │ output: "string"
├─ stream          │ format: source │ schema: "@device.camera.stream"   │ output: "string"
├─ screen          │ format: source │ schema: "@device.screen.capture"  │ output: "string"
├─ logo            │ format: source │ schema: URL                       │ output: "string"
├─ badge           │ format: source │ schema: URL                       │ output: "string"
├─ avatar          │ format: source │ schema: URL                        │ output: "string"
└─ backgroundMedia │ format: source │ schema: URL                       │ output: "string"
```

📌 Key lock: MEDIA = reference only. Never behavior. Never layout.

---

### 3️⃣ DATA CONTENT

**Rule:** Data is not language. Structure is mandatory. Generator must obey schema exactly.

```
DATA
├─ json          │ format: object │ schema: any                    │ output: {}
├─ table          │ format: array  │ schema: columns, rows         │ output: { columns, rows }
├─ profile        │ format: object │ schema: name, email, avatar?   │ output: object
├─ settings       │ format: object │ schema: { key: boolean|string|number } │ output: object
├─ coords         │ format: geo    │ schema: lat, lng               │ output: object
├─ timeline       │ format: array  │ schema: time, label            │ output: array
├─ feed           │ format: array  │ schema: id, title, body        │ output: array
├─ checklist      │ format: array  │ schema: label, checked        │ output: array
├─ conversation   │ format: array  │ schema: role, message         │ output: array
├─ mesh           │ format: object │ schema: vertices, faces        │ output: object
└─ pointcloud     │ format: array  │ schema: { x, y, z }           │ output: array
```

---

## 3️⃣ INTERACTION BEHAVIOR UNIVERSE (ALL INTERACTIONS)

```
INTERACTION
├─ tap    └─ variant: none
├─ double └─ variant: none
├─ long   └─ variant: none
├─ drag   ├─ horizontal ├─ vertical └─ free
├─ scroll ├─ up └─ down
└─ swipe  ├─ left ├─ right ├─ up └─ down
```

---

## 4️⃣ NAVIGATION BEHAVIOR UNIVERSE (ALL NAVIGATION)

```
NAVIGATION
├─ go    ├─ screen → { screenId } ├─ modal → { modalId } └─ flow → { flowId }
├─ back  ├─ one ├─ all └─ root
├─ open  ├─ panel → { panelId } └─ sheet → { sheetId }
├─ close ├─ panel → { panelId } └─ sheet → { sheetId }
└─ route ├─ internal → { path } └─ external → { url }
```

---

## 5️⃣ ACTION BEHAVIOR UNIVERSE (ALL ACTIONS × DOMAINS)

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

---

## 6️⃣ LAYOUT PRIMITIVE UNIVERSE (STRUCTURE ONLY)

```
LAYOUT
├─ flow        ├─ row ├─ column ├─ grid ├─ stack └─ page
├─ alignment   ├─ align ├─ justify ├─ wrap └─ gap
└─ containment ├─ maxWidth ├─ padding └─ bounds
```

---

## 6️⃣+ ORGAN UNIVERSE (STRUCTURAL LAYOUT UNITS)

**Rule:** Organs are structural layout units. They expand to Section (and optionally Grid/layout) with slot placeholders. Slots are filled from the content file by slotKey. Nothing here executes.

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

📌 Key lock: Organ outline line declares organId + variant. Content file supplies slot values by slotKey. Compiler merges slot content into expanded tree.

---

## 7️⃣ WHAT THIS FILE IS

- A complete universe
- Generator-facing
- Deterministic
- Exhaustive
- Zero logic
- Zero defaults
- Zero omissions

---

## 8️⃣ WHAT THIS FILE IS NOT

- Not a renderer
- Not an engine
- Not a behavior executor
- Not JSON
- Not opinionated
- Not missing anything

---

## 🔒 LOCK STATEMENT

Yes. This blueprint universe contains every molecule, every content type, every interaction, every navigation, every action, every layout primitive, and every organ you have defined — nothing more, nothing less.

---

## 9️⃣ STATEFUL BEHAVIOR EXTENSION (DECLARATIVE — NO EXECUTION)

```
STATEFUL-BEHAVIOR
├─ appliesTo    ├─ Button ├─ Chip ├─ List (item-level) ├─ Toolbar (action-level) └─ Footer (item-level)
├─ excludedFrom ├─ Card ├─ Section └─ Modal (except close)
├─ scope        ├─ local ├─ screen ├─ flow └─ global
├─ lifetime     ├─ transient ├─ session └─ persistent
└─ dataShape    ├─ scalar ├─ object └─ collection
```

📌 Key lock: State is never declared directly in the tree. State exists only as the target of a behavior verb.

---

## 🔟 STATE MUTATION VERBS (BEHAVIOR-LEVEL)

```
MUTATION-VERBS
├─ append ├─ update ├─ remove ├─ clear ├─ replace ├─ merge
├─ reorder ├─ toggle ├─ increment ├─ decrement ├─ undo └─ redo
```

📌 Key lock: Mutation verbs are behaviors. Mutation verbs require an existing state target. Mutation verbs never create UI.

---

## 1️⃣1️⃣ SEMANTIC ALIAS VERBS (BEHAVIOR-LEVEL)

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

📌 Key lock: Semantic verbs are human-facing aliases. They always resolve to mutation or navigation internally.

---

## 1️⃣2️⃣ VALIDATION GUARDS (PRE-MUTATION)

```
VALIDATION
├─ required ├─ minLength ├─ maxLength ├─ pattern ├─ numeric
├─ email ├─ url ├─ enum ├─ unique ├─ range └─ custom
```

📌 Key lock: Validation blocks mutation only. Validation never blocks interaction or navigation.

---

## 1️⃣3️⃣ BINDING RULES (HARD)

```
RULES
├─ Field           ├─ produces candidate data only ├─ never executes verbs └─ never mutates state
├─ Actionable molecules ├─ execute behavior verbs └─ may target state
├─ Interaction verbs    └─ never mutate data
├─ Navigation verbs     └─ never mutate data
├─ Mutation verbs       └─ execute only via actionable molecules
└─ Omitted behavior    └─ implies no mutation
```

📌 Key lock: State exists only as the target of a behavior verb.

---

## 1️⃣4️⃣ CANONICAL STATEFUL PATTERN (REFERENCE ONLY)

```
PATTERN
├─ Input produces candidate data
├─ Button triggers semantic verb
├─ Semantic verb resolves to mutation
├─ Mutation targets state
├─ Validation gates mutation
└─ Undo / Redo replay mutation log
```

📌 Reference only. No syntax. No execution. No new molecules.

---

## 🔒 FINAL LOCK

- No new universes
- No new syntax
- No new molecules
- No engine assumptions
- Fully generator-safe
- Fully deterministic
- Fully exhaustive

---

## HUMAN OUTLINE — HIERARCHICAL (STRUCTURE + FLOW)

**Rule:** Indentation = hierarchy. Arrows include target ID + target NAME (no lookup required).

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
  2.3 | Submit | Button [label] (long)        -> 7.0 Review
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
  5.3 | Share | Toolbar [actions] (open)     -> 9.0 ShareSheet

6.0 | MediaDemo | Section [none]
  6.1 | Gallery | Card [media]
  6.1 | Gallery | Card [media] (swipe)       -> 6.2 NextMedia
  6.1 | Gallery | Card [media] (drag)        -> 10.0 Canvas
  6.2 | CloseDemo | Button [label] (close)   -> 1.0 Home

7.0 | Review | Section [none]
  7.1 | Steps | Stepper [steps] (swipe)      -> 7.2 Confirm
  7.2 | Confirm | Button [label] (tap)      -> 5.0 Success

8.0 | Details | Section [none]
  8.1 | InfoList | List [items] (select)     -> 3.0 Info
  8.2 | Back | Button [label] (back)         -> 3.0 Info

9.0 | ShareSheet | Modal [title, body]
  9.1 | ShareNow | Button [label] (tap)      -> route
  9.2 | Dismiss | Button [label] (close)    -> 5.0 Success

10.0 | Canvas | Card [media]
  10.1 | CropImage | Card [media] (crop)
  10.2 | ApplyFilter | Card [media] (filter)
  10.3 | Done | Button [label] (back)        -> 6.0 MediaDemo
```

No other syntax is allowed.

---

## OUTLINE BEHAVIOR ANNOTATION (ONE-WORD TOKENS ONLY)

**Purpose:** Defines how behaviors appear in the Human Outline using only the already-defined one-word verbs.

**Rule (additive):** Behaviors are optional annotations on outline lines. Behaviors use exact verb tokens already defined below. No prefixes (no "Navigation", no "Interaction", no namespaces). Order is fixed when present: `[content] (behavior)`.

**✅ Allowed behavior tokens in outline** (from existing universes only):

```
tap | double | long | drag | scroll | swipe | go | back | open | close | route | crop | filter | frame | layout | motion | overlay
```

If a token is not in this list, it is invalid.

---

## ACTION VERBS IN OUTLINE (WHEN APPLICABLE)

When an Action is used, it appears the same way — one word:

```
6.1 | Photo | Card [media] (crop)
```

The domain (image, video, etc.) is inferred from content type, per your existing contract. No extra words are added.

---

## HARD VALIDATION RULE (ADDITIVE)

- If a behavior token appears: it must exist in Sections 3–5 (Interaction / Navigation / Action); it must be allowed for that molecule.
- If omitted → behavior is none.
- If duplicated → invalid.
- If invented → invalid.

Omitted behavior = implicit tap. Multiple behaviors are expressed by parallel outline lines for the same element. Content slots listed on the molecule define exactly how many and which content types may appear (no more, no less).

---

## ORGAN OUTLINE ANNOTATION (ADDITIVE)

**Rule:** When the blueprint uses an organ, the outline line declares organId and optional variant. Slot keys are fixed per organ (see ORGAN UNIVERSE). Example:

```
1.0 | HeroBlock | organ:hero [hero.title, hero.subtitle, hero.cta]
     variant: centered

2.0 | SiteHeader | organ:header [header.logo, header.cta]
     variant: default
```

Content file supplies values keyed by the same slotKeys. Compiler injects them into the expanded organ tree. No other organ syntax is allowed.
