---
name: landing_deck_status_action_analysis
overview: Full implementation plan for a generic 01_App-owned, multi-version deck/onboarding/learning platform with public routing and in-app versioned flows.
todos:
  - id: platform-model
    content: Define and lock one generic deck identity model (app/flow/version/schema) under src/01_App.
    status: completed
  - id: generic-loader
    content: Replace container-specific deck loading with a generic deck resolver and API.
    status: completed
  - id: catalog-flow-picker
    content: Phase 2.5 — Auto-discovered app/flow picker on landing-2 via loadCatalog (no manual registry, no CC-only wiring).
    status: completed
  - id: governance
    content: Phase 3 — Multi-version + schema governance (manifest validation, duplicates, explicit versions).
    status: completed
  - id: public-routing
    content: Phase 4 — Public learn routes + host mapping (rewrites, /learn/...).
    status: completed
  - id: deck-authoring-apis
    content: Phase 5 — In-app save-draft + create-version APIs (dev-gated).
    status: completed
  - id: migration-and-validation
    content: Phase 6 — Legacy API bridge/cutover + migrated flows validation.
    status: completed
isProject: false
---

# Generic Deck/Onboarding/Learning Platform Plan

## 1. CURRENT POSITION

- Already done:
  - Generic renderer extraction is effectively in place via `[src/lib/landing-deck/LandingDeckRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/landing-deck/LandingDeckRenderer.tsx)`.
  - Builder/presenter/walkthrough behaviors and JSON `screens[]` model are implemented in one runtime.
  - `src/01_App` scanning exists at screen level via `[src/app/api/screens/route.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/api/screens/route.ts)`.
- Not done:
  - Deck resolution is still hardwired to Container Creations in `[src/app/api/container-creations-landing-config/route.ts](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/api/container-creations-landing-config/route.ts)`.
  - Real multi-app deck identity (`app + flow + version + schema`) is not implemented.
  - Public host/path ownership model for `learn.*` is not implemented.
- Actual platform gap:
  - The renderer is generic enough, but deck ownership, version ownership, and route ownership are not yet modeled as first-class platform primitives.

## 2. TARGET PLATFORM MODEL

- One recommended model (single source of truth):
  - App ownership: each app/ministry/business owns its deck namespace under `src/01_App/<section>/<appKey>/decks`.
  - Flow ownership: each app owns many flow families (e.g. `onboarding`, `track-1`, `discipleship-basics`).
  - Deck ownership: one flow has multiple versions, each version is a real file.
  - Version ownership: versions are explicit (`v1`, `v2`, `v3`, ...), not aliases or fallback labels.
  - Route ownership: route resolves by `(host, path)` -> `(appKey, flowKey, versionKey, schemaKey?)` -> deck file.
- Canonical identity key:
  - `deckRef = { appKey, flowKey, versionKey, schemaKey? }`
- Canonical resolution order:
  - host/path mapping chooses app+flow+version defaults
  - URL params may override version/schema where allowed
  - resolver returns one concrete deck file path in `src/01_App`

## 3. RECOMMENDED FOLDER STRUCTURE

- Platform convention under `src/01_App`:
  - `src/01_App/(live) Business/<AppKey>/decks/<flowKey>/manifest.json`
  - `src/01_App/(live) Business/<AppKey>/decks/<flowKey>/versions/v1.deck.json`
  - `src/01_App/(live) Business/<AppKey>/decks/<flowKey>/versions/v2.deck.json`
  - `src/01_App/(live) Business/<AppKey>/decks/<flowKey>/schemas/schema-a.json` (optional)
  - `src/01_App/(live) Business/<AppKey>/decks/<flowKey>/assets/*`
- Container Creations example:
  - `src/01_App/(live) Business/Container_Creations/decks/vent-onboarding/manifest.json`
  - `src/01_App/(live) Business/Container_Creations/decks/vent-onboarding/versions/v1.deck.json`
  - `src/01_App/(live) Business/Container_Creations/decks/vent-onboarding/versions/v2.deck.json`
  - `src/01_App/(live) Business/Container_Creations/decks/vent-onboarding/assets/`
- HiClarify / Gospel / Discipleship examples:
  - `src/01_App/(live) Gospel/Discipleship/decks/track-1/manifest.json`
  - `src/01_App/(live) Gospel/Discipleship/decks/track-1/versions/v1.deck.json`
  - `src/01_App/(live) Gospel/Discipleship/decks/track-2/versions/v1.deck.json`
  - `src/01_App/(live) Gospel/Prayer/decks/prayer-onboarding/versions/v1.deck.json`
- Manifest minimum fields:
  - `appKey`, `flowKey`, `title`, `defaultVersion`, `availableVersions`, `defaultSchema?`, `allowedSchemas?`, `publicRoutes[]`

## 4. RECOMMENDED VERSION MODEL

- NOW model (recommended):
  - Use separate full deck files per version (`vN.deck.json`) inside one flow family.
  - Keep JSON schema stable as `screens[]` + existing walkthrough/presenter/builder fields.
  - Support schema families by explicit schema key in path (`schemas/schema-a.json`) and reference in manifest.
- LATER model (recommended):
  - Keep full version files as source of truth, then optionally add overlays/patches for edit efficiency.
  - Overlay generation must compile to a fully resolved deck at load time for runtime simplicity.
- How to represent changes:
  - Major test branch: new `vN.deck.json`.
  - Minor edits inside same campaign window: next version number, not hidden fallback/alias.
  - Schema A/B/C: explicit `schemaKey` attached to version in manifest, not inferred from filename hacks.

## 5. RECOMMENDED ROUTE MODEL

- One practical route strategy:
  - Local app route (owned by app code): `/learn/[appKey]/[flowKey]/[versionKey]`
  - Optional schema query: `?schema=schema-a`
  - Generic API resolver: `/api/decks/resolve?app=...&flow=...&version=...&schema=...`
- Public route strategy (owned by host rewrite + app route):
  - Host rewrite maps public host/path to canonical local route:
    - `learn.containercreations.com/version-1` -> `/learn/container-creations/vent-onboarding/v1`
    - `learn.hiclarify.com/track-1` -> `/learn/hiclarify/track-1/v1` (default version policy in manifest)
  - Host/domain mapping lives in Vercel/Next rewrite layer.
  - Deck loading and behavior lives in app code via generic resolver.
- Ownership split:
  - App code owns deck resolution/rendering and behavior.
  - Host/domain layer owns external URL shape and host-specific mapping.

## 6. FULL IMPLEMENTATION ROADMAP

### Phase 1 — Platform Identity + Registry

- Goal:
  - Introduce first-class generic deck identity and file discovery under `src/01_App`.
- Likely files/systems:
  - `src/lib/deck-platform/types.ts` (new)
  - `src/lib/deck-platform/registry.ts` (new)
  - `src/app/api/decks/catalog/route.ts` (new)
  - `src/app/api/decks/resolve/route.ts` (new)
  - `src/app/api/screens/route.ts` (read-only compatibility check only)
- What remains frozen:
  - `LandingDeckRenderer` behavior and UI.
  - Existing builder/presenter/walkthrough semantics.
- Risk level:
  - Medium (new resolver surface).
- Done means:
  - resolver returns concrete deck path + manifest metadata for any valid `(app, flow, version, schema)` under `src/01_App`.
- Exact test checklist:
  - resolve known CC flow/version
  - resolve known Gospel/Discipleship flow/version
  - 404 on unknown app/flow/version
  - schema selection accepted/rejected per manifest rules
- What counts as regression:
  - existing `/landing-2` runtime fails or resolves wrong config.

### Phase 2 — Generic Runtime Wiring

- Goal:
  - Replace container-specific config loading with generic deck resolver while keeping all current modes.
- Likely files/systems:
  - `src/lib/landing-deck/LandingDeckRenderer.tsx`
  - `src/app/landing-2/page.tsx` (or promote to generic learn route host)
  - `src/lib/slide-builder-query.ts`
  - `src/app/api/container-creations-landing-config/route.ts` (deprecate/bridge)
- What remains frozen:
  - Layout catalog and slide recipes.
  - Tracker/walkthrough validation behavior.
- Risk level:
  - Medium-high (runtime integration).
- Done means:
  - renderer loads by `deckRef` from generic API and still supports builder/presenter/walkthrough unchanged.
- Exact test checklist:
  - builder mode works with resolved deck
  - presenter mode works with reveal logic
  - walkthrough gating works with schema inputs and legacy controls
  - export still generates correct merged order JSON
- What counts as regression:
  - any current mode no longer functional or mode switching semantics change.

### Phase 2.5 — Catalog Flow Picker (landing-2)

- Goal:
  - Expose every flow discovered by the existing manifest walk (`discoverDeckManifestPaths` / `loadCatalog`) in the slide-builder UI so authors can switch **app + flow** without hardcoded Container Creations IDs.
- Rules:
  - **No** manual registry file; **no** Container-Creations-specific branching; **no** change to `deckRef`, `GET /api/decks/resolve`, or merge semantics.
  - **Versions and schemas remain manifest-governed** (`availableVersions`, `allowedSchemas`, etc.); the picker only changes which manifest row is active.
  - URL is the source of truth: `?app=&flow=` (optional; default = first catalog entry after stable sort). Changing the picker updates the URL and resets version/schema to server-derived defaults for the new flow.
- Likely files/systems:
  - `[src/app/landing-2/page.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/app/landing-2/page.tsx)`
  - `[src/lib/landing-deck/LandingDeckRenderer.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/lib/landing-deck/LandingDeckRenderer.tsx)`
  - `[src/01_App/(live) Business/Container_Creations/LandingSlideBuilderPanel.tsx](C:/Users/New%20User/Documents/HiSense-1ea2985/src/01_App/(live)%20Business/Container_Creations/LandingSlideBuilderPanel.tsx)`
- Done means:
  - `/landing-2` lists all catalog flows; switching loads the correct deck via the existing resolver; walkthrough / slide-order keys are namespaced by app+flow to avoid collisions.
- Checkpoint:
  - Manual: catalog N≥2 flows; switch flows; builder + resolve network point at new `app`/`flow`; no legacy-only assumptions on this page.

### Phase 3 — Multi-Version + Schema Governance

- Goal:
  - Formalize real versions and schema options per flow in manifests.
- Likely files/systems:
  - `src/01_App/**/decks/**/manifest.json` (new per flow)
  - `src/lib/deck-platform/manifest-schema.ts` (new)
  - `src/app/api/decks/catalog/route.ts`
  - `src/01_App/**/decks/**/versions/*.deck.json`
- What remains frozen:
  - Public routing.
  - Host rewrite mapping.
- Risk level:
  - Medium.
- Done means:
  - each flow has explicit `availableVersions`; no fallback alias model remains.
  - optional schema A/B/C is declared and validated.
- Exact test checklist:
  - switching v1/v2/v3 loads distinct real files
  - missing version returns explicit error (not silent fallback)
  - schema not allowed returns validation error
  - schema allowed loads correct resolved deck
- What counts as regression:
  - version switch silently serving wrong deck or fallback deck.

### Phase 4 — Public Learn Route + Host Mapping

- Goal:
  - Enable stable public URL model for `learn.*` domains and path variants.
- Likely files/systems:
  - `src/app/learn/[appKey]/[flowKey]/[versionKey]/page.tsx` (new)
  - `next.config.js` rewrites/redirects
  - optional `vercel.json` for host-based rewrites
  - `src/lib/deck-platform/host-route-map.ts` (new)
- What remains frozen:
  - Core deck schema.
  - Builder editing model.
- Risk level:
  - Medium-high (routing correctness).
- Done means:
  - local canonical route and public host/path routes resolve to same deckRef.
- Exact test checklist:
  - local canonical route renders correct version
  - host-mapped paths render intended app/flow/version
  - cache headers do not pin stale versions
  - unknown path returns controlled 404
- What counts as regression:
  - host route maps to wrong app/flow/version or breaks existing internal routes.

### Phase 5 — Builder + In-App Version Operations

- Goal:
  - Make versioned flow operations usable inside builder without breaking runtime parity.
- Likely files/systems:
  - `src/01_App/(live) Business/Container_Creations/LandingSlideBuilderPanel.tsx`
  - `src/lib/landing-deck/LandingDeckRenderer.tsx`
  - `src/app/api/decks/save-draft/route.ts` (new)
  - `src/app/api/decks/create-version/route.ts` (new)
- What remains frozen:
  - Public route contracts from Phase 4.
  - Deck identity model from Phase 1.
- Risk level:
  - High (write path + authoring UX).
- Done means:
  - builder can save draft, create new version, and load selected version using generic model.
- Exact test checklist:
  - create v4 from v3 works and writes correct file
  - switching versions preserves expected fields and order
  - walkthrough/presenter parity across versions
  - race conditions handled on concurrent saves
- What counts as regression:
  - file corruption, version overwrite, broken JSON, or mismatch between preview and persisted deck.

### Phase 6 — Migration + Hard Cutover

- Goal:
  - Move current CC and target HiClarify/Gospel flows into unified decks structure and remove CC-only loader dependency.
- Likely files/systems:
  - `src/01_App/(live) Business/Container_Creations/*` (deck relocation)
  - `src/01_App/(live) Gospel/**/decks/*` (new)
  - `src/app/api/container-creations-landing-config/route.ts` (sunset/deprecate)
  - migration notes under `docs/` (if needed)
- What remains frozen:
  - core resolver contract.
  - route contract from Phase 4.
- Risk level:
  - Medium.
- Done means:
  - no production dependency on container-specific resolver remains.
- Exact test checklist:
  - all migrated flows resolve through generic API
  - legacy entrypoints either redirect or explicitly deprecated
  - public URLs remain stable post-cutover
- What counts as regression:
  - any migrated flow only works through old CC-specific path.

## 7. WHAT GETS IMPLEMENTED FIRST

- Exact first implementation slice:
  - Build Phase 1 (Platform Identity + Registry) end-to-end, including `deckRef` types, manifest contract, `catalog` and `resolve` APIs, and at least two real sample flows (Container Creations + one Gospel/Discipleship flow) under the new `decks/<flow>/versions` structure.
- Why first:
  - It starts the real platform immediately and unblocks all four required goals without locking into a one-off path.

## 8. FINAL EXECUTION COMMAND

- Completed:
  - Phases 1–2 (identity, registry, generic runtime).
- Then:
  - **Phase 2.5** (catalog flow picker on `/landing-2`, no resolver contract change).
  - **Phase 3** (governance: explicit versions/schemas, validation, duplicate manifest detection).
  - **Phase 4** (public `/learn/...` + host rewrites).
  - **Phase 5** (authoring APIs; dev-gated writes).
  - **Phase 6** (legacy landing-config bridge / cutover).
- Checkpoints:
  - After 2.5: flow picker + URL `app`/`flow` + no cross-flow walkthrough bleed.
  - After 3: invalid version/schema returns explicit API errors; catalog rejects duplicate `(appKey, flowKey)` where applicable.
  - After 4: canonical `/learn/...` matches rewrite targets from `publicRoutes`.
  - After 5: save-draft / create-version succeed locally with gates on.
  - After 6: primary authoring paths use generic resolver; legacy route documented or bridged.
- Do not touch yet (still in force for overlays):
  - Do not introduce overlay/patch complexity before full-file version model is stable.

