---
name: Learn fast authoring execution
overview: "Concrete, repo-grounded execution plan to make Learn deck authoring fast and discoverable: exhaustive inventory of layouts/blocks/media/presenter/editor/recipes, pain points, hybrid authoring architecture (outline + template UI + compiled JSON), and prioritized tiny→medium work that builds on LandingDeckRenderer without replacing it."
todos:
  - id: inspector-presentation-modes
    content: Add NodeInspector UI for screen.presentation (reveal + revealSequence) and screen.modes (short/long); validate block:n keys
    status: pending
  - id: presenter-ux-fixes
    content: Fix presenter Next disabled on last slide when reveal steps remain; document or adjust initial presenterRevealStep vs visible blocks
    status: pending
  - id: recipe-staged-toggle
    content: Optional applySlideRecipe / LandingSlideBuilderInspector toggle to set presentation.reveal byBlock for teaching patterns
    status: pending
  - id: outline-presentation-templates
    content: Extend OutlineSlide + compileOutlineToLandingDeck for presentation and more templateIds (twoCol, comparison, recap)
    status: pending
  - id: deck-compile-cli
    content: Add npm script to compile DeckOutline file to flow v1.json + run validateLandingDeck
    status: pending
  - id: consumer-stepped-optional
    content: "If product needs: optional non-presenter stepped content using existing filter logic"
    status: pending
  - id: authoring-discoverability
    content: In-app or doc-linked capability sheet (layouts, blocks, button matrix, URLs)
    status: pending
isProject: false
---

# Learn deck: fast real-world authoring — execution plan

## 1. Plain-English feature inventory

The **runtime** (`[LandingDeckRenderer.tsx](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/LandingDeckRenderer.tsx)`) is capable: seven layouts, rich content blocks, media, navigation buttons, walkthrough gating, tracker/summary rules, deck length modes, optional schema overlays, presenter-mode block reveal, and a slide builder with live preview. The **gap** is **authoring velocity and discoverability**: many features exist only in JSON or TypeScript types; the outline compiler and recipes cover a **subset** of what the renderer accepts; presenter reveal is **powerful but isolated** behind `runtimeMode=presenter` and is **not** wired into recipes, outline, or a first-class inspector field today.

---

## 2. Exact lists (repo sources cited)

### A. Layout options (exact)

From `[landing-layout-catalog.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-layout-catalog.ts)`:

- `hero`
- `stamped`
- `twoCol`
- `twoColImageLeft`
- `proofPanel`
- `splitProof`
- `textOnly`

**Unknown `layout`** still yields a non-rendering path in the renderer switch (documented in `[docs/1_ONBOARDING JSON - MASTER.md](C:/Users/New User/Documents/HiSense-1ea2985/docs/1_ONBOARDING%20JSON%20-%20MASTER.md)`).

### B. Content / card / block types (exact)

From `[landing-content-blocks/types.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/types.ts)`, rendered in `[renderContentBlocks.tsx](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-content-blocks/renderContentBlocks.tsx)`:

- `badge`, `paragraph` (optional `className`), `heading` (optional `level`)
- `checklist` (optional `heading`, `items` as strings or `{ title, sub }`)
- `audio`, `rating`, `testimonial`, `trustStrip`, `stats`, `iconFeatures`, `comparison`, `ctaBand`, `divider` (`spacing`: `sm` | `md` | `lg`)

### C. Media types and placement / display options (exact)

**Types:** `video`, `image`, `beforeAfter`, `imageGrid` (same file).

**Shared tuning** (`LandingMediaTuning` on video/image; subset on before/after): `poster`, `aspectRatio`, `objectFit` (`cover` | `contain`), `loading` (`lazy` | `eager`), `decorative`, `fullBleed`, `maxHeight`; video also `caption`. **imageGrid:** `columns` 2|3, `gap`.

**Placement:** Determined by **layout** in `LandingDeckRenderer` (hero uses first video specially; twoCol vs proofPanel vs splitProof frame media differently — see doc §3). There is **no** separate JSON “slot” beyond `layout` + order in `media[]`.

### D. Buttons (exact)

From `[schema.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/schema.ts)`: `link` (`hrefKey`), `goto` (`target`), `next`, `back`; optional `nodeId`.

**Layout × button matrix** (what actually renders): documented in onboarding doc §6 — `hero` and `textOnly` **restrict** which button types appear.

### E. Walkthrough inputs and gating (exact)

From `[landing-walkthrough.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-walkthrough.ts)`:

- Input types: `**select`** (with `options`), `**number`**, `**boolean**`, `**text**`
- `gate.required` (ids), `gate.message`

**Legacy:** `inlineControls` on screens (`LandingDeckInlineControlId` in schema) — vent-style hardcoded fields in renderer.

### F. Presenter / reveal / staged content (exact)

From `[schema.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/schema.ts)` + `[LandingDeckRenderer.tsx](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/LandingDeckRenderer.tsx)`:

- **Activation:** URL `runtimeMode=presenter` (`[slide-builder-query.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/slide-builder-query.ts)`).
- `**presentation.reveal`:** `none` | `byBlock` | `custom`.
- `**byBlock`:** sequence = one step per index in `screen.content` → keys `block:0`, `block:1`, …
- `**custom`:** `revealSequence` entries must match `^block:\d+$` (invalid entries filtered out).
- **Navigation:** `goNext` / `goBack` advance reveal steps before changing slides; keyboard Space/ArrowRight/ArrowLeft in presenter/walkthrough flows.

**Critical runtime facts (already audited in repo):**

- **Consumer / walkthrough / builder** paths call `renderScreen(screen)` with **full** content — **no** reveal filtering.
- **Presenter** path uses `getPresenterScreen` which filters `content` by `presenterRevealStep`; initial step 0 shows **no blocks** until first advance (slice semantics).
- **Walkthrough gating** is **off** in presenter mode (`isInteractiveGatedFlow` false when presenter).

**Staged bullets:** A **single** `checklist` block renders **all** items at once. Staging requires **multiple top-level `content` blocks** + presenter `byBlock`, or multiple slides.

### G. Deck modes (exact)

From `[deck-slide-modes.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/deck-platform/deck-slide-modes.ts)`: per-screen `modes?: ("short" | "long")[]`; URL `?deckMode=short|long` filters screens.

### H. Tracker / summary (exact)

From `[landing-tracker-responses.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-tracker-responses.ts)`: rules `valueLabel`, `boolean`, `numberTemplate`, `range`, `compoundTemplate`; deck `stepTracker` options `showResponses`, `responsePlaceholder`, `completedOnly`; screen `dynamicSummary` + `dynamicSummaryConfig` on `textOnly`.

### I. Slide recipes / builder templates (exact)

From `[slide-builder-recipes.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/slide-builder-recipes.ts)`:

- **Slide types:** `hook`, `teaching`, `proof`, `comparison`, `inputDecision`, `summary`, `action`, `custom` — each maps to default `layout`, `lightTheme`, `visualTone`, `density`, `content`, `media`, `buttons`.
- **Style presets:** `cleanLight`, `boldProof`, `darkImmersive`, `compactInfo`, `actionCta`, `custom`.
- **APIs:** `applySlideRecipe`, `applyStylePreset`, `inferSlideTypeFromNode`, `inferStylePresetFromNode`.
- `**builderMeta`:** stored on screen JSON but **ignored at render** (comment in file).

`[LandingSlideBuilderInspector.tsx](C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/LandingSlideBuilderInspector.tsx) exposes slide **type** dropdown and calls `applySlideRecipe` — it does **not** today expose `presentation` or deck modes.

### J. Outline compiler templates (exact)

From `[outline/types.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/outline/types.ts)`: `introStamped`, `teachingStamped`, `heroHook`, `quizSelectStamped`, `ctaStamped`, `summaryTextOnly`, `proofStamped`. Compiler: `[compile-outline-to-deck.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/outline/compile-outline-to-deck.ts)` — **does not** emit `presentation`, `dynamicSummary`, or full tracker rule variety.

### K. Editor / sidebar preview capabilities (exact)

- `[NodeInspector.tsx](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/editor/NodeInspector.tsx)`: title, subtitle, step label, light theme, visual tone, density, layout (list + optional `[LayoutTilePicker](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/layout/LayoutTilePicker.tsx)` live previews via `[LandingSlideLayoutPreview](C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/LandingSlideLayoutPreview.tsx)), next screen id, multi-button row (advanced), first-media tuning (src, alt, poster, caption, aspect ratio, object fit, full bleed, before/after fields), `[SlideContentBlocksEditor](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/editor/SlideContentBlocksEditor.tsx)`, `[WalkthroughTrackerInspector](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/editor/WalkthroughTrackerInspector.tsx)` (quiz-style select + valueLabel tracker map).
- **Content block types addable in editor** (from `ADD_TYPES` in SlideContentBlocksEditor): paragraph, heading, checklist, badge, divider, ctaBand, testimonial, comparison, iconFeatures, stats, trustStrip, rating, audio — **matches** renderer block set.
- **Slide builder canvas:** `[LandingDeckRenderer](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/LandingDeckRenderer.tsx)` slide-builder branch + `[LandingSlideBuilderPanel](C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/LandingSlideBuilderPanel.tsx) (versions, schema, palette, save draft, device modes).

### L. Validation / contract (exact)

- `[schema.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/schema.ts)` — `LandingDeckV1` / `LandingDeckScreen`.
- `[validate-landing-deck.ts](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/validate-landing-deck.ts)` + `npm run deck:check` (`[scripts/deck-check.ts](C:/Users/New User/Documents/HiSense-1ea2985/scripts/deck-check.ts)`).

---

## 3. Hidden / under-surfaced but already available

- `**presentation.reveal`** in JSON — works in **presenter** mode only; **not** in slide builder inspector UI yet; **not** in outline compiler.
- `**extraLinkKeys`** + `link` `hrefKey` — works in renderer; easy to miss vs hand-pasting URLs.
- `**deckPalette`** — deck-wide theming; surfaced in slide builder panel, not always obvious in doc-driven authoring.
- `**modes` + `?deckMode=**` — short/long paths without duplicating decks.
- `**dynamicSummary` / `dynamicSummaryConfig**` — strong for recap slides; editor support partial (inspector does not fully specialize summary authoring).
- **Presenter reveal stepping** — high leverage for teaching, but **disconnected** from recipes and from default learner UX.
- `**applySlideRecipe`** — fast layout+content seed from `[LandingSlideBuilderInspector](C:/Users/New User/Documents/HiSense-1ea2985/src/01_App/(live)`%20Business/Container_Creations/LandingSlideBuilderInspector.tsx); many authors may still start from raw JSON.

---

## 4. Top 10 authoring pain points (today)

1. **Mental model split:** “What the renderer can do” vs “what the editor/outline/recipes expose” is uneven.
2. **Giant JSON:** Gospel-scale decks repeat quiz screens; no high-level “N questions” generator in UI.
3. **Presenter reveal** is **off by default** and **not discoverable**; staged teaching feels “missing” in normal mode.
4. **Checklist vs staged bullets:** One checklist ≠ progressive bullets without multiple blocks or presenter.
5. **No single “deck authoring” entry** that says: use outline compile → open Learn → polish in inspector.
6. `**presentation` not in inspector** — forces hand JSON for the one built-in staging mechanism.
7. **Outline templates are few** — `outline/*` doesn’t cover comparison, twoCol teaching, dynamic summary, multi-quiz loops.
8. **Tracker rules beyond valueLabel** — inspector only helps quiz + valueLabel map; `range`, `compoundTemplate`, etc. stay raw.
9. **Media authoring** — first-media panel is good; multiple media / imageGrid editing is heavier than single hero image.
10. **Layout × button rules** — easy to author invalid combos (e.g. `textOnly` + `next`); `deck:check` warns but UX could prevent.

---

## 5. Top 10 highest-leverage upgrades

1. **Inspector: `presentation.reveal` + `revealSequence` + short help** — surfaces existing presenter staging without new runtime.
2. **Inspector: per-screen `modes` (short/long)** — surfaces existing deck mode feature.
3. **Recipe / “Apply pattern” enhancement:** one-click “Teaching + staged (sets `byBlock` + suggests splitting checklist into blocks)” or post-apply helper — ties recipes to reveal.
4. **Outline compiler:** emit `presentation` + more `OutlineTemplateId`s (twoCol, comparison, recap/summary) + optional “quiz batch” input.
5. **CLI `deck:compile`** — `outline.json` → write `v1.json` in flow folder (dev workflow).
6. **Fix presenter footguns** — Next disabled on last slide while reveals remain; clarify initial reveal step (0 vs 1 visible blocks).
7. **Optional consumer stepped mode** — reuse `getPresenterScreen` logic behind a deck or screen flag so teaching works without `runtimeMode=presenter` (if product requires).
8. **In-app “capability cheat sheet”** — link to condensed doc or collapsible panel listing layouts/blocks/button matrix.
9. **Tracker inspector phase 2** — rule type picker (`range`, `boolean`, …) for non-quiz flows.
10. **Template pack** — folder of `DeckOutline` JSON files (gospel, onboarding, business) as copy-paste starting points.

---

## 6. Recommended easy-authoring architecture

**Hybrid (recommended):**


| Layer                                                                                                            | Role                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Outline** (`[DeckOutline](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/outline/types.ts)`) | Fast bulk structure: slides as `templateId` + short fields + `media` map + quiz blobs; **compile** to `LandingDeckV1`. |
| **Compiled JSON** (`v1.json`)                                                                                    | **Source of truth** for Learn runtime, git, `deck:check`, APIs.                                                        |
| **Slide builder + inspector**                                                                                    | Visual polish: layouts, media tuning, block editor, walkthrough/tracker forms.                                         |
| **Raw JSON**                                                                                                     | Escape hatch for edge cases.                                                                                           |
| **Optional text/Markdown front-end (later)**                                                                     | Parse to `DeckOutline` or directly to screens — same compiler target.                                                  |


**Do not** replace `[LandingDeckRenderer](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/LandingDeckRenderer.tsx)`. **Do** make every new feature **emit or edit** the existing `LandingDeckV1` shape.

---

## 7. Answers K–L (decision)

**K. Authoring source?** **Hybrid:** outline (or future Markdown) for **speed**, **template-driven forms** in the inspector for **discovery**, **compiled JSON** for **truth**, raw JSON for **escape**.

**L. Plan to robust fast generator without replacing runtime?** **Compiler + richer templates + surfaced inspector fields + CLI + optional consumer reveal** — all listed in §8 execution order.

---

## 8. Step-by-step execution plan (prioritized)

**Phase 0 — Surface existing power (tiny–small)**

1. Add **inspector controls** for `presentation.reveal`, `revealSequence` (with validation hint: `block:0` format), and `**modes`** array (short/long chips or multi-select).
2. **Presenter UX fixes:** Next button enablement on last slide when reveals remain; document or fix initial reveal step behavior.
3. **Deck builder help:** Collapsible “Available layouts & blocks” or deep link to a short in-repo doc section.

**Phase 1 — Recipes ↔ reveal (small)**

1. Extend `**applySlideRecipe`** or inspector “Apply teaching pattern” to optionally set `presentation: { reveal: "byBlock" }` for teaching slides (and/or split default checklist into multiple paragraphs for staging).
2. **LandingSlideBuilderInspector:** optional checkbox “Staged content (presenter)” that patches `presentation`.

**Phase 2 — Outline as fast path (small–medium)**

1. Extend `[OutlineSlide](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/outline/types.ts)` with `reveal?: "none"|"byBlock"|"custom"` and optional `revealSequence`; compiler copies to `LandingDeckScreen.presentation`.
2. Add outline templates: `twoColTeaching`, `comparisonSlide`, `recapSummary` (textOnly + dynamicSummary flags).
3. `**npm run deck:compile`** (or `outline:compile`) — read outline file, validate with `validateLandingDeck`, write target `v1.json` (dev-only path under `learn/`).

**Phase 3 — Consumer experience (medium, optional)**

1. If required: **screen- or deck-level flag** to apply block filtering in non-presenter mode with explicit “Tap to continue” (reuse `getPresenterScreen` logic; avoid duplicating a second engine).

**Phase 4 — Scale authoring (medium)**

1. **Tracker rule builder** beyond valueLabel.
2. **Quiz generator** input (CSV or mini-DSL) → outline slides loop.
3. **Template pack** repo folder + docs index.

---

## 9. Effort by tier


| Tier       | Examples                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Tiny**   | Inspector `modes`; presenter Next/disabled fix; doc links; reveal dropdown                                                   |
| **Small**  | Full `presentation` + `revealSequence` UI; recipe flag for `byBlock`; outline `presentation` emission; `deck:compile` script |
| **Medium** | Consumer stepped content; expanded outline templates; tracker rule picker; quiz batch generator                              |
| **Large**  | WYSIWYG outline editor; Markdown round-trip; CMS integration                                                                 |


---

## 10. Recommended order of execution

1. Inspector: `**presentation` + `modes`** (immediate discovery win).
2. Presenter **bugfix + documented reveal step-0 behavior**.
3. Recipe / inspector **“staged teaching”** toggle (`byBlock`).
4. Outline compiler `**presentation` + more templates**.
5. `**deck:compile` CLI**.
6. Optional **consumer stepped** mode (product-dependent).
7. **Tracker** + **quiz scale** tools.

This sequence maximizes **leverage on code that already exists** (`[LandingDeckRenderer](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/LandingDeckRenderer.tsx)`, `[slide-builder-recipes](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/slide-builder-recipes.ts)`, `[outline](C:/Users/New User/Documents/HiSense-1ea2985/src/lib/landing-deck/outline)`, `[NodeInspector](C:/Users/New User/Documents/HiSense-1ea2985/src/app/ui/control-dock/editor/NodeInspector.tsx)`) before any large new subsystem.