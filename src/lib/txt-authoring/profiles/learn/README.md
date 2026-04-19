# Learn profiles (TXT authoring → Learn runtime)

**TXT** (`blueprint.txt` + `content.txt`) is the **universal authoring source**. This folder is **one target profile**: it compiles into Learn `DeckOutline` → `LandingDeckV1` (`vN.json`). Other future adapters (onboarding, sites, etc.) should live under their own `profiles/<target>/` folders.

- **v1** — [`txt-profile-learn-v1.ts`](./txt-profile-learn-v1.ts): minimal journal-style **teach** slides (Section + first Card + first Field).
- **v2** — [`txt-profile-learn-v2.ts`](./txt-profile-learn-v2.ts): slide kinds, `learn.*` content keys, flow hints, richer bodies.

CLI: `npm run learn:from-txt -- [--profile v1|v2] <folder> [out.json]` (default **v2**). The CLI merges optional [`learn.compile-options.json`](#optional-learncompile-optionsjson-next-to-blueprinttxt) from the same folder after baseline defaults.

---

## Responsibility boundaries (Learn target)

These layers exist together; keep each one’s job narrow so authoring stays predictable.

| Layer | Owns | Does **not** own |
|-------|------|------------------|
| **Palette** ([`src/04_Presentation/palettes/*.json`](../../../../04_Presentation/palettes/index.ts)) | Design tokens / theme variables referenced by layouts and CSS | Slide order, copy, quiz wiring, or Learn `learn.*` keys |
| **Deck palette pick** (`learn.deckPalette` on root `1.0`, or [`TxtProfileLearnV2Options.deckPalette`](./txt-profile-learn-v2.ts) / compile-options) | **Which** palette id from `@/palettes` applies to the deck | Token values inside the palette JSON |
| **Profile / compile defaults** ([`TxtProfileLearnV2Options`](./txt-profile-learn-v2.ts), optional `learn.compile-options.json`) | URLs (`shopUrl`), default header/tracker labels, optional **slide presentation defaults** (`slidePresentationDefaults`) when TXT omits `learn.visualTone` / `learn.density` / `learn.lightTheme` | Per-slide story content (paragraphs, scripture text, quiz options) |
| **Template defaults** ([`compileOutlineToLandingDeck`](../../landing-deck/outline/compile-outline-to-deck.ts)) | Layout per `templateId`, default **Continue** button row, quiz → `walkthrough` wiring | Palette contents; arbitrary custom JSON per flow |
| **`blueprint.txt`** | Tree shape, section anchors, **SEQUENCE:** order, **`->`** flow edges | Runtime `screens[]`; prose (that lives in `content.txt`) |
| **`content.txt`** | Per-node scalars: titles, Card `body`, Field `label`, all **`learn.*`** keys for this profile | Compiled `vN.json` structure you hand-maintain outside TXT |
| **Per-slide overrides** (in TXT or split JSON) | Explicit `learn.visualTone`, `learn.reveal`, `learn.slideId`, etc., when they **differ** from defaults | Replacing palette files or changing global shop URL without an override |
| **`vN.learn-structure.json` / `vN.learn-content.json`** | Split persistence for editors/APIs ([cheat sheet](../../landing-deck/translator/STRUCTURE_VS_CONTENT.md)) | Human-readable authoring grammar |
| **`vN.json` (`LandingDeckV1`)** | What [`LandingDeckRenderer`](../../landing-deck/LandingDeckRenderer.tsx) loads — **compiled output only** | Source of truth when TXT or split authoring exists |

**Merge precedence (TXT → outline):** per-slide `content.txt` keys override **`slidePresentationDefaults`** override baseline **`TxtProfileLearnV2Options`** fields. Root `1.0` **`learn.*`** overrides compile-options meta for things like `deckPalette`.

---

## Glossary: “Blueprint” and related terms

| Term | Meaning |
|------|--------|
| **`blueprint.txt`** | The **authoring tree file**: indented nodes (`Section`, `Card`, …), **SEQUENCE:** blocks, flow **`->`** lines. |
| **Slide blueprint / `SlideBlueprint`** | **Different concept**: optional **region mask** on an outline slide (`blueprint.mode`, `blueprint.activeRegions`) used when compiling to pick which content regions render ([`outline/blueprint.ts`](../../landing-deck/outline/blueprint.ts)). Not the same file as `blueprint.txt`. |
| **`DeckOutline`** | Intermediate shape after TXT (or split merge): `meta`, optional `media` catalog, `slides[]` before expansion to `LandingDeckV1`. |
| **Learn profile** | Code in this folder that maps TXT → `DeckOutline` for the Learn runtime only. |

---

## Optional `learn.compile-options.json` (next to `blueprint.txt`)

Machine JSON consumed by **`npm run learn:from-txt`** via [`loadLearnCompileOptions`](../../load-learn-compile-options.ts). It is **not** the human prose authoring format; it centralizes **repeated deck meta and default presentation** so `content.txt` stays override-focused.

Supported keys (all optional): `shopUrl`, `logoSrc`, `logoAlt`, `shopNowLabel`, `heroLinkLabel`, `stepTrackerTitle`, `stepTrackerDescription`, `deckPalette`, `showResponses`, `responsePlaceholder`, `allowOrgans`, and `slidePresentationDefaults`: `{ "visualTone", "density", "lightTheme" }`.

Unknown keys are ignored. Invalid JSON is skipped (empty merge).

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
| `learn.divider.beforeExpandable`, `learn.divider.afterExpandable` | `sm` \| `md` \| `lg` — divider spacing before/after expandable tail |
| `learn.ctaBand.headline`, `learn.ctaBand.sub`, `learn.ctaBand.emphasis` | In-**teach** slides: optional **CTA band** content block (same as editor “CTA band”; emphasis `"1"`). Distinct from **`cta`** slide kind’s compiled band. |
| `learn.audio.src`, `learn.audio.label` | **Audio** content block (`<audio controls>`); placed after expandable/dividers in the compile order. |
| `learn.media.beforeAfter.before`, `.after`, `.altBefore`, `.altAfter` | **beforeAfter** media block (slider): all four required when using this block. |
| `learn.media.imageGrid.images`, `learn.media.imageGrid.columns` | **imageGrid** media: images `src|alt ; src2|alt2` (semicolon between items); `columns` `2` (default) or `3` (at least two image pairs). |
| `learn.modes` | Pipe-separated `short` / `long` → slide `modes` |
| `learn.visualTone` | `default` \| `soft` \| `bold` → screen visual tone |
| `learn.density` | `comfortable` \| `compact` |
| `learn.lightTheme` | `"1"` for light-theme flag on content merge |
| `steps` | On a section, pipe-separated list → **checklist** block |
| `learn.showResponses`, `learn.responsePlaceholder` | On `1.0`, passed to deck meta when set to `1` / string |
| `learn.logoSrc`, `learn.logoAlt`, `learn.deckPalette`, `learn.stepTrackerTitle`, `learn.stepTrackerDescription` | On `1.0`, merged into `DeckOutline.meta` / compiled deck (optional if set via compile-options) |
| `learn.slideId` | Override compiled screen `id` (stable ids for a flow) |
| `learn.layoutOverride` | Optional **`LandingDeckScreen.layout`** for this section — must be one of [`LANDING_LAYOUT_IDS`](../../../landing-layout-catalog.ts) (`hero`, `stamped`, `twoCol`, `twoColImageLeft`, `proofPanel`, `splitProof`, `textOnly`). Stored as **`OutlineSlide.layoutOverride`** and preferred over the template default when compiling (`compile-outline-to-deck`). Invalid values are warned and ignored at TXT compile time; authoring validation also rejects unknown ids when present on outline slides. |
| `learn.heading.text`, `learn.heading.level` | **Heading** block (teach / intro / hero sections) before card bodies |
| `learn.expandable.title`, `learn.expandable.body` | **Expandable** block after scripture/comparison |
| `learn.checklist.heading`, `learn.checklist.rows` | On **cta** (and similar): rows as `Title :: subtitle \| Title2 :: sub2` |
| `learn.quiz.values` | Pipe-separated option **values** (parallel to `learn.quiz.options` labels); defaults to `a`, `b`, … |
| `learn.hero.skipLink` | `"1"` on a **hero** section → no primary link button (matches hero screens with empty `buttons`) |

**Deck root (`1.0`)**

- **`title`** (generic content key) sets the deck title; optional **`learn.title`** aliases the same for intro/hero root handling in code.

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
