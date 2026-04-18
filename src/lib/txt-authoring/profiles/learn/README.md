# Learn profiles (TXT authoring → Learn runtime)

**TXT** (`blueprint.txt` + `content.txt`) is the **universal authoring source**. This folder is **one target profile**: it compiles into Learn `DeckOutline` → `LandingDeckV1` (`vN.json`). Other future adapters (onboarding, sites, etc.) should live under their own `profiles/<target>/` folders.

- **v1** — [`txt-profile-learn-v1.ts`](./txt-profile-learn-v1.ts): minimal journal-style **teach** slides (Section + first Card + first Field).
- **v2** — [`txt-profile-learn-v2.ts`](./txt-profile-learn-v2.ts): slide kinds, `learn.*` content keys, flow hints, richer bodies.

CLI: `npm run learn:from-txt -- [--profile v1|v2] <folder> [out.json]` (default **v2**).

---

## Profile v1 (subset)

**Blueprint**

- Section anchors: `rawId` is **exactly two numeric segments** with second segment **≥ 2** (e.g. `1.2`; excludes `1.0`, `1.1`).
- Subtree must include a **Card** (first Card body + first Field label become copy).
- **organ:** throws (unless you use v2 with `allowOrgans`).

**Content**

- Per-node scalar lines; deck title: `content["1.0"].title`.

---

## Profile v2 (contract)

### Blueprint

- Same **section anchors** as v1 (`x.y` with y ≥ 2), plus:
  - **SEQUENCE:** block (comma-separated tokens) — reorder section slides by matching **node names** (e.g. `ThinkSection`) or resolvable ids.
  - **`-> target`** line immediately after a node — adds a **flow constraint** (source section → target section). Resolved via node names / ids. Cycles fall back to SEQUENCE/DFS order with a warning.
- **Subtree walk** (all nodes under the section until indent pops): every **Card** `body`, every **Field** `label`, optional **Stepper** `steps` from content (pipe-separated).
- **organ:** throws by default; set `allowOrgans: true` in options to **skip** organs (warning).

### Content: `learn.*` keys (Learn adapter only)

Keys are scoped under `learn.*` so non-Learn profiles can ignore them.

| Key | Purpose |
|-----|---------|
| `learn.kind` | `intro` \| `hero` \| `teach` \| `proof` \| `comparison` \| `quiz` \| `summary` \| `cta` (optional; quiz/proof/comparison can be inferred from other keys) |
| `learn.intro.body` | With `learn.kind: intro` on **`1.0`**, opening intro slide copy |
| `learn.hero.body`, `learn.hero.subtitle` | Optional hero copy (with `learn.kind: hero` on `1.0`) |
| `learn.scripture.text`, `learn.scripture.reference` | **Proof** / scripture block |
| `learn.compare.rows` | `left \|\| right ; left2 \|\| right2` (rows separated by `;`, columns by `\|\|`) |
| `learn.compare.heading`, `learn.compare.columnLeft`, `learn.compare.columnRight` | Comparison block headings |
| `learn.compare.layoutStyle` | `cards` or `table` (comparison layout) |
| `learn.quiz.inputId`, `learn.quiz.options` | **Quiz** (options: pipe-separated labels). Required for quiz slides. |
| `learn.quiz.question`, `learn.quiz.fieldLabel`, `learn.quiz.gateMessage` | Quiz UI copy |
| `learn.quiz.trackerMap` | `value:Label; value2:Label2` (quiz option **values** are `a`, `b`, …) |
| `learn.summary.bullets` | Pipe-separated bullets for **summary** slides |
| `learn.badge` | Badge text |
| `learn.stepLabel` | Tracker step label override |
| `learn.nextLabel` | Primary **Continue** label |
| `learn.reveal` | `none` \| `byBlock` (partial; no custom sequence from TXT in v2) |
| `learn.media.image`, `learn.media.imageAlt`, `learn.media.video`, `learn.media.videoCaption`, `learn.media.key`, `learn.media.fullBleed` | Image/video in `inlineMedia`; `fullBleed: "1"` for edge-to-edge hero-style image; optional `key` registers `outline.media[key]` |
| `learn.trustStrip.items` | Pipe-separated short trust labels → trust-strip block (head) |
| `learn.stats.rows` | `label :: value \| label2 :: value2` → stat rows |
| `learn.proofGrid.rows`, `learn.proofGrid.heading` | Same row syntax as checklist: `Title :: sub \| Title2 :: sub2` + optional heading |
| `learn.iconFeatures.rows` | Same as checklist rows: `Title :: sub \| Title2 :: sub2` → icon feature blocks |
| `learn.testimonial.quote`, `.author`, `.role`, `.rating` | Testimonial block (tail) |
| `learn.rating.value`, `.max`, `.reviewCount`, `.source` | Star-style rating summary (tail) |
| `learn.objectionAnswer.objection`, `.response` | Objection / answer pair |
| `learn.faq.rows`, `learn.faq.heading` | FAQ rows + optional section heading |
| `learn.divider.beforeExpandable`, `learn.divider.afterExpandable` | `"1"` to insert a divider before/after expandable tail |
| `learn.modes` | Pipe-separated `short` / `long` → slide `modes` |
| `learn.visualTone` | `default` \| `soft` \| `bold` → screen visual tone |
| `learn.density` | `comfortable` \| `compact` |
| `learn.lightTheme` | `"1"` for light-theme flag on content merge |
| `steps` | On a section, pipe-separated list → **checklist** block |
| `learn.showResponses`, `learn.responsePlaceholder` | On `1.0`, passed to deck meta when set to `1` / string |
| `learn.logoSrc`, `learn.logoAlt`, `learn.deckPalette`, `learn.stepTrackerTitle`, `learn.stepTrackerDescription` | On `1.0`, merged into `DeckOutline.meta` / compiled deck |
| `learn.slideId` | Override compiled screen `id` (stable ids for a flow) |
| `learn.heading.text`, `learn.heading.level` | **Heading** block (teach / intro / hero sections) before card bodies |
| `learn.expandable.title`, `learn.expandable.body` | **Expandable** block after scripture/comparison |
| `learn.checklist.heading`, `learn.checklist.rows` | On **cta** (and similar): rows as `Title :: subtitle \| Title2 :: sub2` |
| `learn.quiz.values` | Pipe-separated option **values** (parallel to `learn.quiz.options` labels); defaults to `a`, `b`, … |
| `learn.hero.skipLink` | `"1"` on a **hero** section → no primary link button (matches hero screens with empty `buttons`) |

**Deck root (`1.0`)**

- `learn.kind: intro` — prepend **intro** slide (title from `title`, body from `learn.intro.body`).
- `learn.kind: hero` — prepend **hero** slide with link button (`hrefKey: shopUrl`).

### Inferred kinds (when `learn.kind` omitted)

- `learn.quiz.options` → **quiz**
- `learn.scripture.text` / `learn.scripture.reference` → **proof**
- `learn.compare.rows` → **comparison**
- else → **teach**

### Deferred / non-goals

- Old Json **app state** (`state:journal.add`, `UserInputViewer` wiring, multi-button action graphs).
- YAML multiline lists in `content.txt` — use **pipe-separated scalars** (e.g. `steps: "A \| B \| C"`).
- **organ** layouts as Learn screens.
- Full **custom** reveal sequences from TXT.

### Output

Both profiles use **`compileLearnAuthoringToDeck`** after **`DeckOutline`**.
