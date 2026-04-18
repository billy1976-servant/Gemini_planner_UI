# Landing / Learn deck JSON — reference

**Scope:** This document describes the **landing-2 style** JSON consumed by **`LandingDeckRenderer`** (`src/lib/landing-deck/LandingDeckRenderer.tsx`). The canonical TypeScript contract is **`LandingDeckV1`** in `src/lib/landing-deck/schema.ts`.

**Legacy Container Creations:** The same shape is still loaded via `GET /api/container-creations-landing-config` with the defaults below.

**Learn platform:** Decks live under `src/01_App/**/learn/<flowKey>/<version>.json` and are resolved with `GET /api/learn/resolve` (see [Learn routes](#learn-routes-url-query-params)).

**Not in scope:** The **json-skin** pipeline (`convertLandingConfigToJsonSkin` in `src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts`) is a **lossy, partial** mapping: it only converts a subset of content blocks (paragraph, badge, checklist) and does not preserve walkthrough, tracker rules, presenter reveal, or full media options. Use it only when you accept that reduced output.

---

## How config is loaded

| Mechanism | Behavior |
|-----------|----------|
| **URL (Container Creations)** | Client fetches `GET /api/container-creations-landing-config` with query params (see below). |
| **Default file** | `landing-2.json` under `src/01_App/(live) Business/Container_Creations/`. |
| **`variant`** | `?variant=default|v1|v2|v3` selects a filename from the route’s map; invalid/missing falls through. |
| **`version`** | `?version=2` loads `landing-2.json` (digits only; prevents path traversal). |
| **Learn** | Flow JSON from disk via `/learn/...` pages or `GET /api/learn/resolve?app=&flow=&version=&schema=&includeBody=1`. |
| **Cache** | API returns `Cache-Control: no-store`. Client adds `t=<timestamp>` to bust cache. |
| **Validation** | **None** at runtime: the client treats JSON as `LandingDeckV1`. Missing fields can cause runtime errors or blank UI. Use `npm run deck:check` to validate repo decks. |

### Learn routes (URL query params)

On `/learn/...`, `LandingDeckRenderer` also reads:

| Param | Purpose |
|-------|---------|
| `slideBuilder` | When truthy (`1`, `true`, …), enables slide builder UI. Learn defaults to **off** unless set. |
| `runtimeMode` | `builder` \| `presenter` \| `walkthrough` — presenter mode enables per-block **reveal** stepping; walkthrough mode persists gated inputs. |
| `deckMode` | `short` \| `long` (default `long`) — filters screens that declare `screen.modes`; screens with no `modes` show in both. |
| `screen` | Initial screen id override from the server page. |

---

## 1. Top-level JSON structure

| Field | Required | Type | Purpose |
|-------|----------|------|---------|
| `shopUrl` | **Yes** (for stable behavior) | `string` | Used for header logo/CTA links and `link` buttons with `hrefKey: "shopUrl"`. |
| `header` | **Yes** | `object` | Top bar: logo + “Shop” CTA. |
| `header.logoSrc` | **Yes** | `string` | Image URL/path for logo. |
| `header.logoAlt` | **Yes** | `string` | Alt text. |
| `header.shopNowLabel` | **Yes** | `string` | Header button label. |
| `stepTracker` | **Yes** | `object` | Sidebar step tracker title/description and optional **live response** settings. |
| `stepTracker.title` | **Yes** | `string` | Tracker heading (`aria-label` on `<aside>`). |
| `stepTracker.description` | **Yes** | `string` | Tracker subcopy. |
| `stepTracker.showResponses` | No | `boolean` | If **`true`**, tracker rows can show per-step response text (see §8). Default: responses **off** if omitted. |
| `stepTracker.responsePlaceholder` | No | `string` | Shown in tracker when a rule yields no value and no `fallbackText` (and in summary “unanswered” lines). |
| `stepTracker.completedOnly` | No | `boolean` | If **`true`**, response text is hidden for steps with status `todo` (not yet reached). |
| `screens` | **Yes** | `array` | Ordered list of steps. First screen’s `id` becomes initial `currentScreenId` after load. |
| `extraLinkKeys` | No | `object` | Map of string → URL. For `link` buttons, `hrefKey` may reference a key here; if missing, URL falls back to `shopUrl`. |
| `deckPalette` | No | `string` | Id from `@/palettes`; applies deck-wide CSS variables in the renderer. |

**Dev-only (not JSON):** Screen order can be overridden in the editor via `node-order-override-store` when a canonical key exists; tracker and navigation use `orderedScreens`, not always raw JSON order.

---

## 2. Screen structure

All screens share the following **as used by** `LandingDeckRenderer`:

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| `id` | **Yes** | `string` | Unique; used for `currentScreenId`, DOM `id`/`data-screen-id`, tracker navigation, `goto` / `nextScreenId` targets. |
| `stepLabel` | **Yes** | `string` | Label in sidebar tracker (and editor step headings). |
| `layout` | **Yes** | `string` | One of the supported layout ids (§3). **Unknown `layout` renders nothing** (`default` branch returns `null`). |
| `title` | **Yes** | `string` | Primary heading for the step (layout-specific element, e.g. `h1`/`h2`). |
| `subtitle` | No | `string` | **Only used when `layout === "hero"`** (hero intro). Ignored on other layouts. |
| `content` | **Yes** | `array` | Content blocks; must be rendered **only** through `renderContentBlocks` (§4). |
| `media` | **Yes** | `array` | Media items (§5). May be `[]`. Hero uses the **first `video`** specially (§3). |
| `buttons` | **Yes** | `array` | Button blocks (§6). What actually renders depends on **layout** (§3 limitations). |
| `nextScreenId` | No | `string` | Target for **`next`** buttons and `goNext()` when set; else next index in `orderedScreens`. |
| `inlineControls` | No | `string[]` | Ids of inline controls (§7). |
| `dynamicSummary` | No | `boolean` | **Only on `layout: "textOnly"`:** if `true`, body is a generated summary paragraph instead of `content`. |
| `dynamicSummaryConfig` | No | `object` | When present on that **same** `textOnly` screen, steers summary text (§9). If omitted, legacy paragraph is used. |
| `trackerResponse` | No | `object` | Per-step rule for sidebar text (§8). |
| `lightTheme` | No | `boolean` | Affects header theme on **current** screen, card/section classes, and inline control styling. |
| `visualTone` | No | `"default"` \| `"soft"` \| `"bold"` | Passed as `data-visual-tone` on wrapper (CSS only). |
| `density` | No | `"comfortable"` \| `"compact"` | Passed as `data-density` on wrapper (CSS only). |
| `nodePosition` | No | `{ x: number, y: number }` | For **dev graph editor** positioning; no effect on end-user flow. |
| `builderMeta` | No | `object` | Slide builder only: `slideType` / `stylePreset` (`slide-builder-recipes.ts`); ignored at render. |
| `presentation` | No | `object` | Presenter mode: `reveal`: `none` \| `byBlock` \| `custom`; `revealSequence`: `block:0`, `block:1`, … for `custom`. |
| `walkthrough` | No | `object` | `inputs[]` (`select`, `number`, `boolean`, `text`) and optional `gate.required[]` / `gate.message` (`landing-walkthrough.ts`). |
| `modes` | No | `string[]` | Subset of `short`, `long`. When set, screen is shown only in those deck modes (`?deckMode=`). Omitted = all modes. |

---

## 3. Supported layout types

Implementation: `renderScreen` switch in `LandingDeckRenderer.tsx`.

| `layout` | Purpose / structure | Best content & media | Limitations |
|----------|---------------------|----------------------|-------------|
| **`hero`** | Full-width **hero video** band + intro column (`hero-intro`): title, subtitle, `content`, **`goto`** buttons. | **Video** in `media` (first `video` wins). Supporting blocks: `badge`, `trustStrip`, short `paragraph`s. | **`next` / `back` are not rendered** in this layout (no `renderButtons` call). Only **`link`** (first is overlaid on video as shop link) and **`goto`** (in intro) are wired. Extra `link` buttons after the first are **not** rendered in the hero path. |
| **`stamped`** | “Stamped” section: title, `content`, then **all** `media` stacked, then **inline** controls (always **light** inline styling), then **buttons**. | Video/image in `media`; proof copy in `content`. | Inline UI forced to `isLight: true`. |
| **`twoCol`** | Two columns: **media card** left, **text** right (title, `content`, inline, buttons). | One strong image or video; `stats`, `comparison`, `ctaBand` in `content`. | If `lightTheme: true`, buttons move **below** the grid; non-light uses steel outline style for back. |
| **`twoColImageLeft`** | Same two-column pattern as `twoCol` but fixed image-left structure; inline uses **dark** styling. | Product/lifestyle image + bullets. | Buttons use steel style. |
| **`proofPanel`** | Wide **proof band** media + body (title, stacked `content`, inline, CTA row). | Video or image with `surface: proofBand` framing; comparison + trust blocks. | Media uses `proofBand` surface (cover-by-default). |
| **`splitProof`** | Split grid: framed media + copy stack + CTA. | Before/after or image in split frame. | Media uses `splitFrame` surface (cover-by-default). |
| **`textOnly`** | Simple column: title + **either** `content` **or** dynamic summary paragraph + **`link` buttons only**. | Short recap, legal note, single CTA. | **`next` / `back` / `goto` are not rendered** in the button loop—only **`link`**. Use another layout if you need in-flow navigation. |

**Presentation:** `visualTone` and `density` only set `data-*` attributes for CSS (`landingScreenPresentationAttrs`).

---

## 4. Content block types (`screen.content[]`)

All blocks are typed in `src/lib/landing-content-blocks/types.ts` and rendered in `renderContentBlocks.tsx`.

**Global rules:**

- **Every** supported `type` is rendered; unknown `type` returns `null` and logs a dev warning.
- **Editor mode** (Container Creations): only **`paragraph`** blocks get inline editing via `onParagraphChange`; other blocks are read-only in JSON.
- **Checklist / heading styling:** Container Creations passes `checklistHeadingClassName` and `checklistListClassName` for stamped-style lists.

### `badge`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"badge"` |
| `text` | Yes | `string` |

```json
{ "type": "badge", "text": "60-Minute DIY Install" }
```

### `paragraph`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"paragraph"` |
| `text` | Yes | `string` |
| `className` | No | `string` |

**Special `className` values** (inline styles in renderer): `"stars"`, `"testimonial"`, `"testimonial-attribution"`.

```json
{ "type": "paragraph", "text": "Measure corrugation height for a correct adapter fit." }
```

### `heading`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"heading"` |
| `text` | Yes | `string` |
| `level` | No | `number` (1,2, or 3; default **2**) |

```json
{ "type": "heading", "level": 3, "text": "Before you cut" }
```

### `checklist`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"checklist"` |
| `heading` | No | `string` |
| `items` | Yes | Array of **string** or `{ "title": string, "sub": string }` |

```json
{
  "type": "checklist",
  "heading": "Prep",
  "items": [
    "Tape measure",
    { "title": "Safety", "sub": "Eye protection recommended" }
  ]
}
```

### `audio`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"audio"` |
| `src` | Yes | `string` |
| `label` | No | `string` |

```json
{ "type": "audio", "src": "/audio/briefing.mp3", "label": "Listen (optional)" }
```

### `rating`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"rating"` |
| `value` | Yes | `number` |
| `max` | No | `number` (default **5**) |
| `reviewCount` | No | `number` |
| `source` | No | `string` |

```json
{ "type": "rating", "value": 5, "max": 5, "reviewCount": 300, "source": "Verified buyers" }
```

### `testimonial`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"testimonial"` |
| `quote` | Yes | `string` |
| `author` | Yes | `string` |
| `location` | No | `string` |
| `role` | No | `string` |
| `rating` | No | `number` (0–5, renders stars) |

```json
{
  "type": "testimonial",
  "quote": "Ordered a second set immediately.",
  "author": "David S.",
  "location": "Payson, AZ",
  "rating": 5
}
```

### `trustStrip`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"trustStrip"` |
| `items` | Yes | `{ "icon"?: string, "label": string }[]` |

**`icon` values** mapped to emoji in renderer: `shield`, `check`, `tool`, `truck`, `star`, `bolt`, `leaf`, `award`. Other strings pass through as-is (e.g. you may put an emoji directly in JSON).

```json
{
  "type": "trustStrip",
  "items": [
    { "icon": "shield", "label": "Patented design" },
    { "icon": "check", "label": "DIY-friendly" }
  ]
}
```

### `stats`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"stats"` |
| `items` | Yes | `{ "label": string, "value": string, "hint"?: string }[]` |

```json
{
  "type": "stats",
  "items": [
    { "label": "Goal", "value": "Correct fit", "hint": "Fewer leaks" }
  ]
}
```

### `iconFeatures`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"iconFeatures"` |
| `items` | Yes | `{ "icon"?: string, "title": string, "sub"?: string }[]` |

If `icon` is omitted, the renderer uses `item.icon ?? "\u2713"` in `renderContentBlocks.tsx` (Unicode check mark).

```json
{
  "type": "iconFeatures",
  "items": [
    { "title": "Single-piece base", "sub": "Less field assembly" }
  ]
}
```

### `comparison`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"comparison"` |
| `heading` | No | `string` |
| `columnLabels` | No | `{ "left"?: string, "right"?: string }` |
| `rows` | Yes | `{ "left": string, "right": string, "highlight"?: "left" \| "right" \| "none" }[]` |

```json
{
  "type": "comparison",
  "heading": "Why it fits better",
  "columnLabels": { "left": "Container Creations", "right": "Generic parts" },
  "rows": [
    { "left": "Stamped steel base", "right": "Welded stacks", "highlight": "left" }
  ]
}
```

### `ctaBand`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"ctaBand"` |
| `headline` | Yes | `string` |
| `sub` | No | `string` |
| `emphasis` | No | `boolean` |

```json
{
  "type": "ctaBand",
  "headline": "Cut once. Upgrade fully.",
  "sub": "Vent + daylight in one project.",
  "emphasis": true
}
```

### `divider`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"divider"` |
| `spacing` | No | `"sm"` \| `"md"` \| `"lg"` (default **`md`**) |

```json
{ "type": "divider", "spacing": "lg" }
```

---

## 5. Media types (`screen.media[]`)

Typed as `MediaBlock` in `types.ts`; rendered in `renderMediaItem` in `LandingDeckRenderer.tsx`.

### Shared tuning (`LandingMediaTuning`)

Applies to **`video`** and **`image`**; **`beforeAfter`** only supports `aspectRatio`, `objectFit`, `fullBleed` from that set.

| Field | Applies to | Purpose |
|-------|------------|---------|
| `poster` | `video` | `poster` attribute. |
| `aspectRatio` | `video`, `image`, `beforeAfter` | CSS `aspect-ratio` on frame; when set, media fills frame height. |
| `objectFit` | `video`, `image`, `beforeAfter` | `"cover"` \| `"contain"`; defaults depend on placement/surface (card defaults **cover**; hero/stamped video/image default **contain** unless overridden). |
| `loading` | `image` | `"lazy"` (default) or `"eager"`. |
| `decorative` | `image` | If `true`, `alt` forced empty and `role="presentation"`. |
| `fullBleed` | `video`, `image`, `beforeAfter` | Wraps in `cc-media-fullbleed`. |
| `maxHeight` | `video`, `image` | CSS max-height on element. |
| `caption` | `video` only | Caption paragraph under/below video. |

### `video`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"video"` |
| `src` | Yes | `string` |
| `caption` | No | `string` |
| + tuning | | |

**Behavior:** `autoPlay`, `muted`, `loop`, `playsInline`. On load error, slot shows placeholder and src is tracked in `failedMedia`.

```json
{
  "type": "video",
  "src": "/Videos/hero.mp4",
  "poster": "/images/poster.jpg",
  "aspectRatio": "16/9",
  "objectFit": "cover",
  "caption": "Install overview",
  "fullBleed": false
}
```

### `image`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"image"` |
| `src` | Yes | `string` |
| `alt` | Yes | `string` (ignored if `decorative: true`) |
| + tuning | | |

```json
{
  "type": "image",
  "src": "/images/roof.jpg",
  "alt": "Measure roof",
  "aspectRatio": "4/3",
  "objectFit": "cover",
  "loading": "lazy"
}
```

### `beforeAfter`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"beforeAfter"` |
| `before` | Yes | `string` (URL) |
| `after` | Yes | `string` (URL) |
| `altBefore` | Yes | `string` |
| `altAfter` | Yes | `string` |
| `aspectRatio` | No | `string` |
| `objectFit` | No | `"cover"` \| `"contain"` |
| `fullBleed` | No | `boolean` |

Uses `BeforeAfterSlider` with `darkenBefore` enabled in code.

```json
{
  "type": "beforeAfter",
  "before": "/images/before.jpg",
  "after": "/images/after.jpg",
  "altBefore": "Before",
  "altAfter": "After",
  "aspectRatio": "16/9"
}
```

### `imageGrid`

| Field | Required | Type |
|-------|----------|------|
| `type` | Yes | `"imageGrid"` |
| `images` | Yes | `{ "src": string, "alt": string }[]` |
| `columns` | No | `2` or `3` (default **2**) |
| `gap` | No | `string` (CSS gap) |

Grid images always load with `loading="lazy"`.

```json
{
  "type": "imageGrid",
  "columns": 2,
  "gap": "12px",
  "images": [
    { "src": "/images/a.jpg", "alt": "Detail A" },
    { "src": "/images/b.jpg", "alt": "Detail B" }
  ]
}
```

---

## 6. Button types (`screen.buttons[]`)

| `type` | Required fields | Behavior |
|--------|-----------------|----------|
| **`next`** | `label` | `goNext()`: uses `nextScreenId` if set, else next screen in `orderedScreens`. |
| **`back`** | `label` | `goBack()`: previous index in `orderedScreens` (**ignores** `nextScreenId` graph). |
| **`goto`** | `label`, `target` | `setCurrentScreenId(target)`. |
| **`link`** | `label`, `hrefKey` | Resolves URL via `resolveHref` (see below). Renders `<a target="_blank">`. |

Optional on all: **`nodeId`** (`string`) — exposed as `data-node-id` for dev tooling.

### URL resolution for `link`

`resolveHref` in `LandingDeckRenderer.tsx`:

1. If `hrefKey === "shopUrl"` → `cfg.shopUrl`.
2. Else if `cfg.extraLinkKeys?.[hrefKey]` is a non-empty string → that URL.
3. Else → fallback `cfg.shopUrl`.

Define named URLs on the deck root, for example:

```json
{
  "extraLinkKeys": {
    "helpCenter": "https://example.com/help"
  }
}
```

```json
{ "type": "link", "label": "Shop Now", "hrefKey": "shopUrl", "nodeId": "shop-cta" }
```

### Layout × button matrix (what actually renders)

| Layout | `next` | `back` | `goto` | `link` |
|--------|--------|--------|--------|--------|
| `hero` | No | No | Yes (intro) | First `link` only (video overlay); others not rendered |
| `stamped`, `twoCol`, `twoColImageLeft`, `proofPanel`, `splitProof` | Yes | Yes | Yes | Yes |
| `textOnly` | No | No | No | Yes |

---

## 7. Inline controls (`screen.inlineControls[]`)

**Storage:** React state `stepInputs` in `LandingDeckRenderer` (not persisted, not sent to API). **Field names** in tracker/summary rules must match these keys.

| `inlineControls` id | UI | Stored value | Notes |
|---------------------|----|--------------|--------|
| `containerLength` | Select | `"20ft"` \| `"40ft"` \| `null` | Labels in UI fixed in TSX. |
| `roofRibHeight` | Number | `number` \| `null` (inches) | Validates “typical range” **1.5–2.5** in UI messaging. |
| `ventFitVerified` | Checkbox | `boolean` | Default `false`. |
| `ventCount` | Number | `number` \| `null` | Clamped messaging for 1–10. |
| `orderSizeConfirmed` | Checkbox | `boolean` | Default `false`. |

**Where values surface:**

- **Tracker:** If `stepTracker.showResponses === true` and the screen has a `trackerResponse.rule` whose `field` matches a key above, formatted text shows under the step label.
- **Final summary (`textOnly` + `dynamicSummary`):** If `dynamicSummaryConfig` is set, `buildSummaryFromConfig` formats the same fields; otherwise the **legacy** paragraph is used (container line, rib height line, `ventCount ?? 1` for vent line, optional “Vent fit verified.” / “Order size confirmed.”).

**Example pairing (conceptual):** A screen that collects `roofRibHeight` should use a `trackerResponse.rule` with `"field": "roofRibHeight"` if you want that step’s tracker line to live-update.

---

## 8. Tracker response system

Implemented in `src/lib/landing-tracker-responses.ts` and wired in the sidebar list in `LandingDeckRenderer`.

### Global (`stepTracker`)

| Field | Effect |
|-------|--------|
| `showResponses: true` | Master switch; if not true, **no** per-step response text is shown. |
| `responsePlaceholder` | Fallback string when rule returns empty and `trackerResponse.fallbackText` not set. |
| `completedOnly: true` | Hide response text for future steps (`status === "todo"`). |

### Per screen (`trackerResponse`)

| Field | Effect |
|-------|--------|
| `enabled: false` | Suppresses responses for this step even if global switch is on. |
| `rule` | Formatter rule (below). |
| `fallbackText` | Shown when rule does not produce text. |

### Rule types (`rule.type`)

All rules read from **`stepInputs`** keyed by `field` (string).

1. **`valueLabel`** — map raw value to label; unmapped falls back to `String(raw)`.

```json
{
  "type": "valueLabel",
  "field": "containerLength",
  "map": { "20ft": "20 ft container", "40ft": "40 ft container" }
}
```

2. **`boolean`** — `true` → `trueText`; `false` → `falseText` or null.

```json
{
  "type": "boolean",
  "field": "ventFitVerified",
  "trueText": "Confirmed",
  "falseText": "Not confirmed"
}
```

3. **`numberTemplate`** — substitutes `{value}`.

```json
{
  "type": "numberTemplate",
  "field": "ventCount",
  "template": "{value} x 12-inch vents"
}
```

4. **`range`** — first matching `{ min, max }` wins; optional `defaultText`.

```json
{
  "type": "range",
  "field": "roofRibHeight",
  "ranges": [{ "min": 1.5, "max": 2.5, "text": "Within spec" }],
  "defaultText": "Outside typical range"
}
```

5. **`compoundTemplate`** — all listed fields must be non-null; placeholders `{fieldName}` in template.

```json
{
  "type": "compoundTemplate",
  "fields": ["ventCount"],
  "template": "{ventCount} x 12-inch vents"
}
```

### Connection to final summary

- Tracker text and summary formatting share **`formatResponse`** / the same rule definitions on each screen.
- **Summary** only uses JSON-driven rules when the **`textOnly`** screen includes `dynamicSummaryConfig` (§9). Without it, the legacy TSX string is used.

---

## 9. Final summary system

### `dynamicSummary` (`textOnly` only)

- If **`true`**: the main body is a single `<p>` produced by `getFinalRecommendationSummary(screen)`.
- If **`false`**: body is `renderContentBlocks(screen.content, …)` as usual.

### `dynamicSummaryConfig` (optional; same screen)

| Field | Type | Purpose |
|-------|------|---------|
| `mode` | `"autoFromTrackerRules"` \| `"lines"` | Default **`autoFromTrackerRules`**. |
| `heading` | `string` | If set, prefixed: `"<heading> <joined lines>"`. |
| `includeUnanswered` | `boolean` | If true, includes placeholder lines when rule yields no value. |
| `lines` | array | **Only when `mode === "lines"`** — explicit lines. |

**`autoFromTrackerRules`:** Iterates **all** `orderedScreens`; for each with a `trackerResponse.rule` (and not `enabled: false`), emits `"<stepLabel>: <formatted>"`.

**`lines` mode:** Each line has:

| Field | Purpose |
|-------|---------|
| `sourceStepId` | Optional; pull `rule` from that screen’s `trackerResponse` if `rule` omitted. |
| `rule` | Optional explicit rule. |
| `prefix` | Optional text before formatted value. |

If **`lines` ends up empty**, implementation **falls back to legacy** summary.

### Legacy fallback (always available)

When `dynamicSummaryConfig` is **absent** or produces **no lines**, the renderer uses the hardcoded paragraph built from `stepInputs` (container, rib height, `ventCount ?? 1` vent line, optional verification lines, or “Complete the steps…”).

### Recommended JSON pattern for a takeaway page

1. Use `layout: "textOnly"`, `dynamicSummary: true`.
2. Add `dynamicSummaryConfig` with `mode: "autoFromTrackerRules"` and a short `heading`.
3. Ensure every important prior step has `trackerResponse.rule` with `field` matching `stepInputs` keys.
4. Use `includeUnanswered: true` if you want explicit “not answered” placeholders (uses `responsePlaceholder` or `"Not answered"`).

---

## 10. Required vs optional cheat sheets

### Top-level

| Field | Required |
|-------|----------|
| `shopUrl` | Yes |
| `header.*` | Yes |
| `stepTracker.title` | Yes |
| `stepTracker.description` | Yes |
| `stepTracker.showResponses` | No |
| `stepTracker.responsePlaceholder` | No |
| `stepTracker.completedOnly` | No |
| `screens` | Yes |

### Screen

| Field | Required |
|-------|----------|
| `id`, `stepLabel`, `layout`, `title`, `content`, `media`, `buttons` | Yes |
| `subtitle` | No (hero only) |
| `nextScreenId` | No |
| `inlineControls` | No |
| `dynamicSummary`, `dynamicSummaryConfig` | No (`textOnly`) |
| `trackerResponse` | No |
| `lightTheme`, `visualTone`, `density`, `nodePosition` | No |

### Blocks / media / buttons

| Kind | Required keys |
|------|----------------|
| Content blocks | `type` + per-type required fields (§4) |
| Media | `type` + per-type required fields (§5) |
| Buttons | `type`, `label`, plus `target` (`goto`), `hrefKey` (`link`) |

---

## 11. Best-practice guidance

- **One job per screen:** Pair one primary decision (measurement, verification, count) with one media asset and short copy.
- **Avoid hero for step navigation:** Use `goto` to enter the flow; use `next`/`back` on interior layouts.
- **Use `proofPanel` / `splitProof` for evidence** (video, before/after, comparison table).
- **Use `textOnly` + `dynamicSummary` for recap** and Shopify CTAs (`link` only there).
- **Shopify / container sales:** Keep `shopUrl` canonical; use `link` + `hrefKey: "shopUrl"` until `resolveHref` supports more keys.

---

## 12. Minimal valid example

```json
{
  "shopUrl": "https://example.com",
  "header": {
    "logoSrc": "/images/logo.webp",
    "logoAlt": "Brand",
    "shopNowLabel": "Shop"
  },
  "stepTracker": {
    "title": "Steps",
    "description": "Walkthrough."
  },
  "screens": [
    {
      "id": "step-1",
      "stepLabel": "Start",
      "layout": "twoCol",
      "title": "Hello",
      "content": [{ "type": "paragraph", "text": "Short intro." }],
      "media": [],
      "buttons": [{ "type": "next", "label": "Next" }],
      "nextScreenId": "step-2"
    },
    {
      "id": "step-2",
      "stepLabel": "Done",
      "layout": "textOnly",
      "title": "Thanks",
      "content": [],
      "media": [],
      "buttons": [{ "type": "link", "label": "Shop", "hrefKey": "shopUrl" }]
    }
  ]
}
```

## 13. Advanced example (tracker + summary)

```json
{
  "shopUrl": "https://containercreations.com",
  "header": {
    "logoSrc": "/images/logo.webp",
    "logoAlt": "Container Creations",
    "shopNowLabel": "Shop Now"
  },
  "stepTracker": {
    "title": "Checklist",
    "description": "Track your answers.",
    "showResponses": true,
    "responsePlaceholder": "Not answered yet",
    "completedOnly": false
  },
  "screens": [
    {
      "id": "fit",
      "stepLabel": "Container type",
      "layout": "proofPanel",
      "title": "Verify container type",
      "content": [{ "type": "paragraph", "text": "Select length." }],
      "media": [],
      "buttons": [
        { "type": "back", "label": "Back" },
        { "type": "next", "label": "Continue" }
      ],
      "nextScreenId": "measure",
      "inlineControls": ["containerLength"],
      "lightTheme": true,
      "trackerResponse": {
        "rule": {
          "type": "valueLabel",
          "field": "containerLength",
          "map": { "20ft": "20 ft container", "40ft": "40 ft container" }
        }
      }
    },
    {
      "id": "measure",
      "stepLabel": "Roof rib",
      "layout": "twoCol",
      "title": "Measure rib height",
      "content": [],
      "media": [],
      "buttons": [{ "type": "next", "label": "Continue" }],
      "nextScreenId": "summary",
      "inlineControls": ["roofRibHeight"],
      "lightTheme": true,
      "trackerResponse": {
        "rule": {
          "type": "range",
          "field": "roofRibHeight",
          "ranges": [{ "min": 1.5, "max": 2.5, "text": "Within spec" }],
          "defaultText": "Outside typical range"
        }
      }
    },
    {
      "id": "summary",
      "stepLabel": "Summary",
      "layout": "textOnly",
      "title": "Your setup",
      "content": [],
      "media": [],
      "buttons": [{ "type": "link", "label": "Build on Shopify", "hrefKey": "shopUrl" }],
      "dynamicSummary": true,
      "dynamicSummaryConfig": {
        "mode": "autoFromTrackerRules",
        "heading": "Your responses:",
        "includeUnanswered": true
      }
    }
  ]
}
```

---

## Sources (repo files)

| Topic | Path |
|-------|------|
| Canonical deck types | `src/lib/landing-deck/schema.ts` |
| Renderer, layouts, media, buttons, inline controls, walkthrough, modes | `src/lib/landing-deck/LandingDeckRenderer.tsx` |
| Layout id list | `src/lib/landing-layout-catalog.ts` |
| Content block types | `src/lib/landing-content-blocks/types.ts` |
| Content rendering | `src/lib/landing-content-blocks/renderContentBlocks.tsx` |
| Tracker + summary rules | `src/lib/landing-tracker-responses.ts` |
| Walkthrough inputs + gates | `src/lib/landing-walkthrough.ts` |
| Deck length modes | `src/lib/deck-platform/deck-slide-modes.ts` |
| Presentation `data-*` | `src/lib/landing-screen-presentation.ts` |
| Learn resolve / catalog | `src/lib/deck-platform/registry.ts`, `src/app/api/learn/resolve/route.ts` |
| Config API (legacy path) | `src/app/api/container-creations-landing-config/route.ts` |
| Wizard shell attributes hook | `src/lib/tsx-structure/engines/wizard.ts` |

---

## Partially wired / limitations (honest list)

| Item | Status |
|------|--------|
| **`hero` + `next`/`back`** | Not rendered; use `goto` / first `link`. |
| **`textOnly` + `next`/`back`/`goto`** | Not rendered; only `link`. |
| **`link.hrefKey` other than `shopUrl`** | Uses `extraLinkKeys[key]` if set; otherwise falls back to `shopUrl`. |
| **Unknown `layout`** | Renders **nothing** for that screen. |
| **Unknown content `type`** | Renders **null** (dev warning). |
| **`stepInputs` persistence** | In-memory only; refresh loses answers. |
| **`convertLandingConfigToJsonSkin`** | Separate mapping; does not duplicate full block/media support or tracker responses. |
