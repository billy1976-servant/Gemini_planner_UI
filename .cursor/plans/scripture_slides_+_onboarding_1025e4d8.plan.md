---
name: Scripture slides + onboarding
overview: hiclarify’s scripture slide pipeline is a **one-way** Journey → Firestore draft → presenter UI with an **implicit** slide object shape, not a formal shared schema. HiSense onboarding is **screens[] / json-skin** with rich content blocks and graph navigation—conceptually similar to a linear “deck” only after normalization. Integration is feasible via embedding, shared API, or a new canonical **deck v4** document that both sides import/export; true round-trip requires defining that contract and (for Journey) an importer hiclarify does not have today.
todos:
  - id: define-v4-schema
    content: Write deck v4 JSON contract (slides[], ids, templateId, media, notes, platformVersion) + TS types in HiSense
    status: pending
  - id: mapper-landing-to-deck
    content: Design landing-2 → v4 mapper; document lossy cases vs layouts/blocks
    status: pending
  - id: integration-path
    content: Choose A (link/embed hiclarify + shared Firestore) vs B (port SlideRenderer); align auth
    status: pending
  - id: optional-round-trip
    content: "If Journey sync required: spec hiclarify importer slides→sections or abandon Journey as SoT for edited decks"
    status: pending
isProject: false
---

# Scripture slides (hiclarify) vs HiSense onboarding — compatibility and integration

## What exists in hiclarify (reference only)

**Slide creation paths**

- **Manual / editor:** `[ScriptureGenerator.jsx](C:/Users/New%20User/Documents/hiclarify/src/components/ScriptureGenerator.jsx)` builds slides as plain objects (`id`, `text`, `templateId`, image fields, etc.) consumed by `SlideRenderer`.
- **From Journey Builder:** `[exportSlidesFromJourney.js](C:/Users/New%20User/Documents/hiclarify/src/lib/exportSlidesFromJourney.js)` maps **TRACK** sections (reflection verse → `quote`; Think/Repent/Ask/Conform/Keep → `list`/`title`) and **SIMPLE** sections from rich HTML to the same implicit shape (documented in file header comments, lines 3–13).

**Bridge from track journal**

- `[NewJourneyBuilder.jsx](C:/Users/New%20User/Documents/hiclarify/src/components/NewJourneyBuilder.jsx)` owns `sections`; **Preview** opens `[PreviewBuilder.jsx](C:/Users/New%20User/Documents/hiclarify/src/components/PreviewBuilder.jsx)`.
- **“Create Slides”** runs `exportSlidesFromJourney([section])`, then `[createSlidesDraft](C:/Users/New%20User/Documents/hiclarify/src/lib/firebaseSlides.js)` → opens `/scripture-generator?draftId=…` (see `exportSection` in PreviewBuilder ~59–84).

**Round-trip reality**

- **Journey → Slides + notes:** implemented (`notesHtml` with `data-slide-id` spans for alignment).
- **Slides → Journey:** **not** implemented; edits live in `sermon_slides` only.

There is **no** checked-in “deck platform v4” schema in hiclarify; the slide shape is **conventional**, enforced by `SlideRenderer` / generator code.

```mermaid
flowchart LR
  subgraph hiclarify [hiclarify today]
    JB[NewJourneyBuilder sections]
    EXP[exportSlidesFromJourney]
    FS[(Firestore sermon_slides)]
    SG[ScriptureGenerator]
    JB --> EXP --> FS
    FS --> SG
  end
  note1[No path SG back to JB]
  SG -.-> note1
```



## What exists in HiSense

**Onboarding / landing**

- **landing-2 style:** JSON fetched via `[/api/container-creations-landing-config](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts)`, rendered by `[ContainerCreationsLandingRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx). Shape is documented in `[docs/1_ONBOARDING JSON - MASTER.md](C:/Users/New%20User/Documents/HiSense-1ea2985/docs/1_ONBOARDING%20JSON%20-%20MASTER.md)`: `screens[]` with `id`, `layout`, `title`, `content[]`, `media[]`, `buttons[]`, `nextScreenId`, tracker rules, etc.
- **json-skin:** separate tree under `[container-creations.landing.json](C:/Users/New%20User/Documents/HiSense-1ea2985/src/05_Logic/logic/content/landing/container-creations.landing.json)` + partial converter `[convert-landing-config-to-json-skin.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts)` (known gaps vs full landing-2 — see master doc).

**“Slide / deck platform — Version 4”**

- Not present as a named artifact in the HiSense repo from search; **json-skin / landing-2** are the closest “JSON source of truth” stories (`[CONTAINER_CREATIONS_LANDING_REFACTOR_REPORT.md](C:/Users/New%20User/Documents/HiSense-1ea2985/CONTAINER_CREATIONS_LANDING_REFACTOR_REPORT.md)`). Your **v4 deck** spec should be treated as the **target contract** to define or import explicitly.

## Compatibility assessment


| Dimension        | hiclarify slides                                   | HiSense onboarding                                     |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------ |
| **Unit of flow** | Ordered slide array + optional notes HTML          | `screens[]` graph or json-skin `when` on `landingStep` |
| **Content**      | Title + list/quote lines (HTML stripped in export) | Many `content` block types + parallel `media[]`        |
| **Persistence**  | Firestore `sermon_slides`                          | Static JSON + API; app state for tracker               |
| **Round-trip**   | One-way from Journey                               | Editor ↔ JSON (landing); not tied to sermon model      |


**Conclusion:** They are **not** directly the same data model. They are **straightforward to connect** if you accept either (a) **one-way generation** (onboarding or journey-like data → deck JSON), or (b) a **new shared canonical document** (your **v4 deck**) that HiSense generates/edits and hiclarify (or a ported presenter) **consumes**.

## Feasible incorporation strategies**A. Thin integration (fastest)**

- After a HiSense onboarding step (or admin tool), call a **small service or edge function** that builds the hiclarify slide array (reuse logic patterned on `exportSlidesFromJourney` / or call hiclarify’s export in a monorepo package).  
- Create Firestore draft via same API shape as `[firebaseSlides.js](C:/Users/New%20User/Documents/hiclarify/src/lib/firebaseSlides.js)` and deep-link users to hiclarify’s `/scripture-generator?draftId=…`, or embed that route in an iframe with shared auth.

**B. Port presenter into HiSense (medium)**  

- Copy or extract **slide shape + `SlideRenderer`** (and theme) into HiSense; feed slides from a **v4 deck** JSON file or CMS.  
- Onboarding **does not** need the full Journey Builder—only a function **LandingScreen → slides[]** (e.g. map `title` + `paragraph`/`checklist` to `text`/`templateId`; **lossy** for complex layouts).

**C. Align onboarding with “deck v4” (structural)**  

- Define `**deck.platformVersion: 4`** (or equivalent) with: ordered `**slides[]`**, stable `**id`s**, `**templateId`**, optional `**media`**, `**notes**` or inline anchors, and **metadata** (title, source).  
- **Single source of truth:** one JSON (or Firestore doc) that:  - **Renders** in a presenter (hiclarify or HiSense).  
  - **Round-trips** through an editor that writes the same ids (hiclarify today only round-trips slides ↔ notes, not ↔ Journey).
- **HiSense landing-2:** either generate **v4 deck** from `screens[]` (export), or add a `**layout: "deck"`** / dedicated flow that **loads v4** instead of free-form blocks (keeps marketing steps and sermon steps clearly separated).

**D. Full parity with hiclarify Journey round-trip**  

- Requires **new work in hiclarify**: importer from slide edits back into `sections` / Firestore journey templates—**out of scope** for HiSense alone and **not** present today.

## Recommendations if you want “more like slides” + v4 + round-trip

1. **Publish the v4 deck JSON schema** (TypeScript types + examples) as the **only** interchange format between “authoring” and “presenting,” whether authoring happens in HiSense, hiclarify, or both.
2. **Implement `landingConfigToDeckV4(screens)`** in HiSense (new module): deterministic mapping for simple screens; flag **unsupported** layouts/blocks rather than silent loss.
3. **Presenter:** either embed hiclarify or port `SlideRenderer`; both should read **the same v4** file.
4. **Round-trip:** store **v4** in Firestore or repo; editor loads/saves **v4** only; avoid maintaining parallel `screens[]` and slide arrays without a codegen/sync step.
5. **If TRACK / Journey remains the sermon source of truth:** add an explicit `**sourceRef`** in v4 (`{ type: 'journeySection', id }`) so you know provenance; accept that **editing slides** without a hiclarify importer will **desync** from Journey until you build that importer.

## Suggested decision- **Compatible for product integration:** **Yes**, via A or B + a defined v4 envelope.

- **Compatible as drop-in JSON:** **No** without a **mapping layer** or **new deck-first** onboarding mode.  
- **“Simple”:** **One-way export** and deep link is simple; **true round-trip** is **not** simple today because hiclarify lacks slide→Journey import and HiSense has no native deck schema.

No edits were made to the hiclarify workspace per your instruction.