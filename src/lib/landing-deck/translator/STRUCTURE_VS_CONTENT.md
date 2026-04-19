# Learn split: structure vs content vs runtime (cheat sheet)

Authoritative field split for catalog Learn flows that persist **split SSOT** next to **`vN.json`**.

**Universal TXT authoring:** human source can be **`blueprint.txt` + `content.txt`**; the **Learn profile** (`src/lib/txt-authoring/profiles/learn/`) compiles that through **`DeckOutline`** into this split + **`vN.json`**. When present, treat split JSON as **derived** from TXT unless you explicitly maintain JSON-only flows.

Optional **`learn.compile-options.json`** next to **`blueprint.txt`** supplies **compile-only defaults** (URLs, tracker labels, palette id, slide presentation defaults). It merges into CLI compile options (`npm run learn:from-txt`). It is **not** a Learn runtime artifact — see [`profiles/learn/README.md`](../../txt-authoring/profiles/learn/README.md).

**Reference flow:** [`learn-system-showcase`](../../../01_App/(live)%20Gospel/hiclarify/learn/learn-system-showcase/README.md) — canonical TXT → Learn duplication template with full slide-kind coverage (intro through CTA), optional `learn.layoutOverride`, and keyed vs inline media examples.

## Layers (how palette / profile / authoring / runtime relate)

| Concern | Where it lives |
|---------|----------------|
| **Palette (tokens)** | Files under `@/04_Presentation/palettes`; deck picks one via **`deckPalette`** on compiled **`LandingDeckV1`**. |
| **Profile / compile defaults** | **`TxtProfileLearnV2Options`** + optional **`learn.compile-options.json`** + CLI baseline in [`scripts/compile-txt-to-learn.ts`](../../../../scripts/compile-txt-to-learn.ts). Reduces repetition in **`content.txt`**. |
| **Human structure** | **`blueprint.txt`** — tree + ordering constraints (**not** slide “blueprint regions”; see glossary in profiles README). |
| **Human copy + `learn.*`** | **`content.txt`**. |
| **Machine split + compiled deck** | This doc’s three artifacts below. |

## Three artifacts

| | **vN.learn-structure.json** | **vN.learn-content.json** | **vN.json** |
|---|-----------------------------|---------------------------|-------------|
| **Stores** | Deck **`meta`**, optional shared **`media`** catalog (keys/refs only), ordered **`slides[]`**: each row has **`id`**, **`kind`**, optional **`presentation`**, **`modes`**, **`blueprint`**. Order = slide order. | **`Record<slideId, { …fields }>`** — per-slide copy and content-only props (see examples below). | **`LandingDeckV1`**: `screens[]`, `header`, `stepTracker`, `deckPalette`, etc. Full runtime contract. |
| **Treat as** | **Structural SSOT** — what the deck *is* (shape, type per step, filters, reveal defaults). Edit when adding/removing/reordering slides or changing step *kind* / pacing. | **Content SSOT** — what each step *says* (text, options, media references, blocks). Edit for copy, quiz labels, `richContent` where allowed. | **Compiled artifact only.** Never hand-author for normal workflow. |
| **Compiler / runtime** | **`mergeStructureAndContent`** reads this + content → **`DeckOutline`** → **`compileOutlineToLandingDeck`** → validates. | Same merge input. | **Output** of that pipeline (what the app loads to render). |

## Examples (non-exhaustive)

**Structure**

- Slide **`id`** (identity), implicit **order** (`slides[]` sequence)
- **`kind`** (Learn slide type; drives **`templateId`** in merge)
- **`modes`** (short / long path visibility)
- **`presentation`** (e.g. reveal defaults)
- **`blueprint`** (region mask for compile)

**Content**

- **`title`**, **`subtitle`**, **`paragraphs`**, **`bullets`**, **`badge`**
- **`stepLabel`**, **`nextButtonLabel`**, **`layoutOverride`**
- **`quizSelect`**, **`trackerValueLabels`**, **`trackerEnabled`**
- **`mediaKeys`**, **`inlineMedia`**, **`buttons`**, **`richContent`** (where kind rules allow)

**Runtime JSON**

- Compiled **`screens`** (layout, merged content, walkthrough, etc.) — derived from outline compile, not maintained as source.

Exact allowlists evolve in **`merge-structure-and-content.ts`** / **`kind-rules.ts`**; this table is the mental model.

## Save flow

1. Editors work in **structure** + **content** (or the in-app outline that projects to both).
2. **`mergeStructureAndContent`** → **`DeckOutline`**, then **`compileOutlineToLandingDeck`** (+ validation).
3. **`vN.json`** is **rewritten** from that compile. Drift = re-run save / compile from split.

## Migration note

**`vN.learn-authoring.json`** (monolith outline) is **removed/deprecated** for migrated flows. **Split files** (**`vN.learn-structure.json`** + **`vN.learn-content.json`**) are the **only** on-disk authoring SSOT beside the compiled deck. Repo-wide one-off: `npm run learn:migrate-authoring`.
