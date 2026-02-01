# CONTENT DERIVATION SYSTEM v1.0 (LOCKED)

---

## PURPOSE (NON-NEGOTIABLE)

The blueprint is the only source of structure and flow.
The content file is derived from the blueprint, not invented, not interpreted, not inferred.
If content is missing or malformed, the UI renders blank — exactly what you are seeing now.

---

## THE CORE RULE (THIS IS THE FIX)

Every renderable molecule must receive a content object whose keys exactly match its molecule contract.
Your new compiler currently emits empty `{}` content, so the renderer has nothing to draw.

---

## LAYER SEPARATION (FINAL)

There are three files, each with one job:

| File                  | Role                              |
|-----------------------|-----------------------------------|
| blueprint.txt         | structure + navigation (LOCKED)  |
| content.manifest.txt  | human-editable values (GENERATED, THEN FILLED) |
| app.json              | compiled output (STRUCTURE + CONTENT MERGED)   |

Nothing else decides UI.

---

## STEP 1 — GENERATE THE CONTENT MANIFEST (AUTOMATIC)

This step was present in the old system and is missing now.

**INPUT**

- blueprint.txt
- molecule contracts (Button, Field, Card, etc.)

**OUTPUT**

- content.manifest.txt (keys only, empty values allowed)

**RULES**

- One content block per blueprint node
- Content slots come only from the molecule contract
- No extra keys
- No missing keys

**EXAMPLE (GENERATED — NOT WRITTEN BY HAND)**

```
APP: MoleculeValidationApp

1.0 Home (Section)
- title: ""

1.1 GetStarted (Button)
- label: ""

2.1 Email (Field)
- label: ""
- placeholder: ""

3.0 Info (Card)
- title: ""
- body: ""

7.0 ToastDemo (Toast)
- message: ""
```

This file is what ChatGPT edits. This file is what humans understand. This file is what was silently removed.

---

## STEP 2 — HUMAN FILLS CONTENT (ONLY VALUES)

Humans / GPT may ONLY edit values.

**ALLOWED**

- `label: "Get Started"`

**FORBIDDEN**

- Adding keys
- Removing keys
- Changing hierarchy
- Adding behavior
- Adding layout

Violations are ignored or fail build.

---

## STEP 3 — COMPILER MERGES CONTENT (RESTORED BEHAVIOR)

Your old compiler already did this correctly.

**REQUIRED MERGE LOGIC (LOCKED)**

For each blueprint node:

```
entry.content = contentMap[node.rawId] || {}
```

This is the single most important line.

- If this map is empty → UI is blank
- If this map is missing → UI is blank
- If keys mismatch → UI is blank

Nothing else is wrong.

---

## STEP 4 — FINAL OUTPUT (WHAT THE RENDERER EXPECTS)

Every renderable node must look like this:

```json
{
  "id": "|getstarted",
  "type": "button",
  "content": {
    "label": "Get Started"
  },
  "params": {},
  "layout": {},
  "children": [],
  "behavior": { ... }
}
```

Your current output has:

```json
"content": {}
```

That is why everything disappeared.

---

## HUMAN OUTLINE → CONTENT BINDING RULES (GENERATOR-CRITICAL, LOCKED)

**Purpose:** Eliminate generator inference by defining a deterministic mapping between Human Outline content tokens and molecule content keys.

This section adds no new syntax and changes no existing rules. It only binds what already exists.

---

### PRECEDENCE RULE (HARD)

Content keys MUST be derived from the intersection of:

1. Outline tokens `[ … ]` (what the human declares), and
2. The molecule's declared content contract (what the renderer can accept).

**Rules:**

- The outline selects which content keys are active.
- The molecule contract defines which content keys are valid.
- A content key is allowed only if it exists in both.

**The generator MUST:**

- Emit all outline-declared keys that are valid for the molecule.
- Emit empty string `""` for any declared-but-unfilled key.

**The generator MUST NOT:**

- Invent keys not present in the molecule contract.
- Emit keys not listed in the outline.

- If the outline declares a key not supported by the molecule contract → generation MUST fail.
- If the molecule contract defines a key not listed in the outline → that key is ignored (not an error).

This preserves: Determinism. Zero inference. Renderer safety. Working molecules.

---

### 1️⃣ GENERAL BINDING RULE (GLOBAL)

Content tokens listed in the Human Outline (inside `[ … ]`) MUST map 1:1 to keys in the molecule's content object.

No inference, renaming, collapsing, or expansion is allowed.

- If a listed content key is missing → value is `""` (empty string).
- If a molecule receives an empty content object → UI renders blank (valid state).

---

### 2️⃣ MOLECULE-SPECIFIC CONTENT BINDINGS (EXPLICIT)

**Button**

- Outline: `Button [label]`
- Content object: `{ "label": "string" }`

**Avatar**

- Outline: `Avatar [media]` or `Avatar [media, text]`
- Content object: `{ "media": "string", "text": "string?" }`

**Card**

- Outline: `Card [title, body]` | `Card [media]` | `Card [media, title, body]`
- Content object: `{ "media": "string?", "title": "string?", "body": "string?" }`

**Chip**

- Outline: `Chip [title]` | `Chip [title, body]` | `Chip [title, body, media]`
- Content object: `{ "title": "string", "body": "string?", "media": "string?" }`

**Field**

- Outline: `Field [label]` | `Field [label, error]`
- Content object: `{ "label": "string", "error": "string?" }`
- Note: input / value are state-driven, not outline-driven.

**List**

- Outline: `List [items]`
- Content object: `{ "items": [ { "label": "string", "behavior": "object?" } ] }`

**Footer**

- Outline: `Footer [left, right]`
- Content object: `{ "left": { "label": "string", "behavior": "object?" }, "right": { "label": "string", "behavior": "object?" } }`

**Stepper**

- Outline: `Stepper [steps]`
- Content object: `{ "steps": [ { "label": "string" } ] }`

**Toast**

- Outline: `Toast [message]`
- Content object: `{ "message": "string" }`

**Toolbar**

- Outline: `Toolbar [actions]`
- Content object: `{ "actions": [ { "label": "string", "behavior": "object?" } ] }`

**Modal**

- Outline: `Modal [title, body]`
- Content object: `{ "title": "string", "body": "string" }`

**Section**

- Outline: `Section [title]` | `Section [none]`
- Content object: `{ "title": "string?" }`

---

### 2️⃣+ ORGAN CONTENT BINDINGS (SLOTKEY → VALUE)

**Rule:** Organs expand to Section (and optionally Grid) with slot placeholders. The content file supplies one block per organ instance, keyed by node id or by slotKeys. Each slotKey receives a value of the shape below.

**header**

- SlotKeys: `header.logo`, `header.cta`
- Content shape:
  - `header.logo`: string (URL or assetId)
  - `header.cta`: string or object (e.g. label; or { label, behavior } for a button)

**hero**

- SlotKeys: `hero.title`, `hero.subtitle`, `hero.cta`
- Content shape:
  - `hero.title`: string (text)
  - `hero.subtitle`: string (text)
  - `hero.cta`: string or object (label; or { label, behavior } for a button)

**nav**

- SlotKeys: variant-defined (e.g. nav.links, nav.logo)
- Content shape: per variant; values are string or list of { label, behavior? }.

**footer**

- SlotKeys: variant-defined (e.g. footer.columns, footer.copyright)
- Content shape: per variant; values are string or object/list as per Footer molecule.

**content-section**

- SlotKeys: variant-defined (e.g. content.title, content.body, content.media)
- Content shape: title (string), body (string), media (string URL) as applicable.

**features-grid**

- SlotKeys: `features.title`, `features.items`
- Content shape:
  - `features.title`: string (text)
  - `features.items`: array of { title?, body?, media?, behavior? } (one per feature card)

**gallery**

- SlotKeys: variant-defined (e.g. gallery.items)
- Content shape: items = array of media strings (URLs).

**testimonials**

- SlotKeys: variant-defined (e.g. testimonials.items)
- Content shape: items = array of { quote, author?, media? }.

**pricing**

- SlotKeys: variant-defined (e.g. pricing.tiers)
- Content shape: tiers = array of tier objects per PricingTable contract.

**faq**

- SlotKeys: variant-defined (e.g. faq.items)
- Content shape: items = array of { question, answer }.

**cta**

- SlotKeys: variant-defined (e.g. cta.title, cta.button)
- Content shape: title (string), button label (string), optional behavior.

**Binding rule:** The generator MUST emit content blocks for organ nodes with keys exactly matching the slotKeys declared in the blueprint for that organ. Values MUST match the content shape above. No extra keys. No missing slotKeys that the blueprint declares.

---

### 3️⃣ OUTLINE TOKEN RESOLUTION RULE (HARD)

- Tokens inside `[ … ]` define content keys only.
- Behavior tokens inside `( … )` never affect content.
- Repeated outline lines for the same node share the same content object.

**Example:**

```
1.1 | Welcome | Button [label] (tap)
1.1 | Welcome | Button [label] (double)
```

→ one content object: `{ "label": "Welcome" }`

---

### 4️⃣ GENERATOR FAILURE CONDITIONS (INTENTIONAL)

Generation MUST fail (or render blank) if:

- A content key is invented
- A required content key is omitted
- Content keys do not match the molecule contract
- Content is inferred without outline tokens

This behavior is correct and required.

---

## HARD LOCK RULES (NO FUTURE DRIFT)

| Rule | Statement |
|------|-----------|
| RULE 1 | Blueprint NEVER changes to fix content |
| RULE 2 | Content NEVER invents structure |
| RULE 3 | Compiler NEVER deletes content |
| RULE 4 | Renderer NEVER guesses defaults |

If content is empty, the UI must be empty — that is correct behavior.
