# Unified JSON Screen Refactor — Report

## Summary

Container Creations onboarding screens that previously used the landing-2 config (screens[] format) and custom TSX renderer now run through the same pipeline as container-creations.landing.json: **ExperienceRenderer → JsonRenderer → JsonSkinEngine**. Layout, palette, wrappers, and nodes are controlled only by JsonSkinEngine and the unified json-skin schema.

---

## PHASE 1 — Discovered onboarding JSON files

| File | Format | Renders via |
|------|--------|-------------|
| [src/05_Logic/logic/content/landing/container-creations.landing.json](src/05_Logic/logic/content/landing/container-creations.landing.json) | json-skin (root.type, sections with when.landingStep) | ExperienceRenderer (landing page, ContainerCreationsLanding.tsx) |
| [src/01_App/(live) Business/Container_Creations/landing-2.json](src/01_App/(live) Business/Container_Creations/landing-2.json) | screens[] (id, layout, title, content[], media[], buttons[]) | **Now** ExperienceRenderer after conversion |
| [src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding-3.json](src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding-3.json) | Flow config (steps[], navigation) | Separate flow pipeline; not converted in this refactor |

---

## PHASE 2 — Custom renderers (documented, not deleted)

| File | Role |
|------|------|
| [src/01_App/(live) Business/Container_Creations/landing-2.tsx](src/01_App/(live) Business/Container_Creations/landing-2.tsx) | Previously rendered -2.json via custom TSX (fetch config, map screens to JSX, step navigation). **No longer used** by /container-creations or dev; can be removed after validation. |
| [src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding.tsx](src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding.tsx) | Uses container-creations.landing.json (05_Logic) and ExperienceRenderer; unchanged. |
| [src/app/flow/page.tsx](src/app/flow/page.tsx) | Uses ContainerCreationsLanding (TSX) with URL step → landingStep; unchanged. |
| [src/app/api/container-creations-landing-config/route.ts](src/app/api/container-creations-landing-config/route.ts) | Serves -2.json (and variants v1, v2, v3); still used to feed the converter. |

---

## PHASE 3 — JSON schema conversion

- **Converter added:** [src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts](src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts)
- **Input:** LandingConfig (screens[] with id, layout, title, subtitle, content[], media[], buttons[], nextScreenId, etc.).
- **Output:** json-skin document:
  - `id`, `palette: "container-creations"`, `state: { currentScreenId: firstScreenId }`
  - `root: { type: "json-skin", id, children: sections }`
- **Section mapping:** Each screen → one section with:
  - `id`, `type: "section"`, `when: { state: "currentScreenId", equals: screen.id }`
  - `params.containerLayout`: `"full"` when layout === "hero", else `"contained"`
  - `params.wrapStyle`: `"none"` when layout === "hero", else `"card"`
  - `children`: title (text headline), subtitle (text subheadline), content blocks (paragraph → text, badge → text, checklist → multiple text), media (video → video, image → image, beforeAfter → image slider), buttons (link → button openUrl, goto/back/next → button gotoScreenId).

Content is preserved; only structure is adapted to JsonSkinEngine node types (text, button, image, video).

---

## PHASE 4 — Layout system

- **containerLayout** and **wrapStyle** are set per section in the converter (hero → full/none, others → contained/card).
- JsonSkinEngine already applies:
  - `containerLayout`: "full" | "contained" | "edge" (default "contained")
  - `wrapStyle`: "card" | "block" | "none" (default "card")
- No page or TSX controls layout; it is driven only by section params and JsonSkinEngine.

---

## PHASE 5 — Palette

- Converted doc uses `palette: "container-creations"`; JsonSkinEngine receives `screen.palette` and uses `getPaletteForResolution(screen.palette)` for tokens.
- No inline color logic was added in the converter; colors come from palette/tokens in the engine.

---

## PHASE 6 — Hard-coding removed from flow

- **Screen loader:** [src/03_Runtime/engine/core/screen-loader.ts](src/03_Runtime/engine/core/screen-loader.ts) — For `container-creations-landing`, the loader no longer returns a TSX screen descriptor. It fetches `/api/container-creations-landing-config`, converts with `convertLandingConfigToJsonSkin`, and returns the json-skin document so the dev page renders via the JSON branch (ExperienceRenderer).
- **Container-creations page:** [src/app/container-creations/page.tsx](src/app/container-creations/page.tsx) — No longer uses ContainerCreationsLanding2. It fetches config, converts to json-skin, runs the same pipeline as the landing page (assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen, collectSectionKeysAndNodes), and renders ExperienceRenderer. No maxWidth, margin auto, or step-based layout in the page; layout is engine-only.

---

## PHASE 7 — Routing through the engine

| Entry | Before | After |
|-------|--------|--------|
| **Dev:** screen = `container-creations-landing` | loadScreen returned tsx-screen → landing-2.tsx | loadScreen returns converted json-skin doc → JSON branch → ExperienceRenderer → JsonRenderer → JsonSkinEngine |
| **Route /container-creations** | Rendered `<ContainerCreationsLanding2 />` | Fetches config, converts to json-skin, builds tree, renders `<ExperienceRenderer node={treeForRender} … />` |
| **Route /landing** | Unchanged; still uses container-creations.landing.json (05_Logic) and ExperienceRenderer. | Unchanged. |

All onboarding screens that use the -2 config now render through ExperienceRenderer → JsonRenderer → JsonSkinEngine.

---

## PHASE 8 — Validation

- **Pipeline:** Dev and /container-creations use the same doc shape (root.type "json-skin", children = sections with when.state "currentScreenId") and the same ExperienceRenderer path.
- **Hero:** First screen (layout "hero") has containerLayout "full" and wrapStyle "none" → full-bleed.
- **Cards:** Other sections have wrapStyle "card" → padding, background, border.
- **Contained:** Non-hero sections have containerLayout "contained" → maxWidth 720px, margin auto, padding 1.5rem 1rem.
- **Navigation:** Buttons use behavior.params.gotoScreenId; JsonSkinEngine updates state.currentScreenId and engine state so the correct section is shown.
- **Phone/desktop:** Same tree and engine; only viewport differs.

---

## PHASE 9 — Cleanup (recommended after validation)

- **Remove or deprecate:** [landing-2.tsx](src/01_App/(live) Business/Container_Creations/landing-2.tsx) — No longer referenced by /container-creations or by dev for `container-creations-landing`. Can be deleted or kept as reference.
- **EXPLICIT_TSX_MAP** in dev page still has an entry for `container-creations-landing` pointing to -2; it is unused because loadScreen no longer returns tsx-screen for that path. The entry can be removed for clarity.

---

## PHASE 10 — Files changed

| File | Change |
|------|--------|
| [src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts](src/05_Logic/logic/landing/convert-landing-config-to-json-skin.ts) | **New.** Converts LandingConfig (screens[]) to json-skin document. |
| [src/05_Logic/logic/engines/json-skin.engine.tsx](src/05_Logic/logic/engines/json-skin.engine.tsx) | Button handler: added support for `params.gotoScreenId` (updates currentScreenId in state and engine). |
| [src/03_Runtime/engine/core/screen-loader.ts](src/03_Runtime/engine/core/screen-loader.ts) | For path `container-creations-landing`, fetch config from API, convert via convertLandingConfigToJsonSkin, return doc (no tsx-screen). |
| [src/app/container-creations/page.tsx](src/app/container-creations/page.tsx) | Replaced ContainerCreationsLanding2 with: fetch config → convert → same pipeline as landing page → ExperienceRenderer. |

---

## Schema compatibility

- **container-creations.landing.json** (05_Logic): Already json-skin; uses landingStep and section params (containerLayout, wrapStyle on hero). Unchanged.
- **landing-2.json**: Not edited. Converted at runtime (screen-loader, container-creations page) to json-skin; sections get containerLayout/wrapStyle from layout (hero vs others).
- **ContainerCreationsLanding-3.json**: Different flow schema; not part of this refactor.

---

## Validation results

| Check | Status |
|-------|--------|
| All onboarding screens (using -2 config) render through JsonSkinEngine | Yes — dev and /container-creations use converted doc and ExperienceRenderer. |
| Hero sections can be full bleed | Yes — hero layout → containerLayout "full", wrapStyle "none". |
| Card sections render correctly | Yes — non-hero → wrapStyle "card". |
| Contained sections center correctly | Yes — containerLayout "contained" in engine. |
| Phone and desktop preview use same layout rules | Yes — same tree and engine. |

---

## Rule

JsonSkinEngine is the only authority for layout and palette for these screens. No page-specific render pipelines are used for the Container Creations onboarding screens that are driven by the -2 config; they all go through ExperienceRenderer → JsonRenderer → JsonSkinEngine.
