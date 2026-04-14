---
name: Slide deck platform V5 (projector + editor shell)
overview: Version 5 adds a rebuilt slide-projector-style authoring and live-preview experience on top of the existing HiSense JSON onboarding engine—inspired by hiclarify’s preview/presenter flow, not a port. JSON remains source of truth; V4 round-trip rules apply; phases are additive and low-risk.
todos:
  - id: v5-baseline-v4
    content: "Prereq: V4 JSON-SOURCE-OF-TRUTH policy + Phase 4a export (gated) if not already shipped."
    status: pending
  - id: v5-docs-projector
    content: docs/onboarding-platform/PROJECTOR-MODEL.md — presentation vs editing vs draft; merge order override on export.
    status: pending
  - id: v5-export-merge-order
    content: Export merges node-order-override into screens[] order before stringify (or documents loss).
    status: pending
  - id: v5-presenter-preview-shell
    content: Dev-only presenter preview (single-slide focus, minimal chrome) — thin wrapper or CSS mode, same renderer.
    status: pending
  - id: v5-extend-inspector
    content: Extend NodeInspector / inline paths for high-value fields (media src, stepLabel) without block renderer rewrite.
    status: pending
  - id: v5-add-slide-recipe
    content: Insert slide from recipe template (duplicate skeleton screen + rewire nextScreenId) — dev-only or scripted first.
    status: pending
isProject: false
---

# Slide / deck platform — Version 5 (projector + live-preview editor shell)

**Supersedes narrative:** Version 4 (same repo plan family) defines **JSON source of truth** and **export as completion** for inline editing. Version 5 **does not replace V4**; it **builds on it** by specifying a **slide-projector-style UX** and **authoring flow** on top of the **existing** `screens[]` engine.

**Reference (inspiration only, not imported):** `[scripture_slides_+_onboarding_1025e4d8.plan.md](scripture_slides_%2B_onboarding_1025e4d8.plan.md)` (same folder) describes hiclarify’s Journey → export → `ScriptureGenerator` / presenter pipeline (implicit slide shape, Firestore drafts, one-way Journey→slides). **V5 intentionally does not merge that codebase or schema.** It reuses **ideas**: sequential preview, clear slide list, draft editing, export to a **single canonical JSON** (here: HiSense `LandingConfig`).

---

## 1. Slide-projector mental model (HiSense-native)


| Term               | HiSense implementation today                                                                                                                                                                             | V5 target behavior                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Slide**          | One `screens[]` element                                                                                                                                                                                  | Same; optionally labeled with **recipe** in docs or future optional `meta` (ignored by engine).                           |
| **Deck**           | Whole landing JSON (`LandingConfig`)                                                                                                                                                                     | Same.                                                                                                                     |
| **Live preview**   | Preview mode: one `currentScreenId`; editor mode: all slides in grid (`[ContainerCreationsLandingRenderer.tsx](src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)) | Add **presenter-style preview**: single-slide focus, minimal chrome, keyboard next/prev **without** changing JSON schema. |
| **Editing mode**   | `editor-mode-store` + `InlineEditableText` + `[DevNodePanel](src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx)` / `[NodeInspector](src/app/ui/control-dock/editor/NodeInspector.tsx)`  | Same stack; **extend** inspector/inline coverage; unify mental model in docs as “projector + edit.”                       |
| **Authoring flow** | JSON file + dev tools + partial inline                                                                                                                                                                   | **Documented + tool-assisted:** pick recipe → add slide → edit → preview sequence → reorder → **export valid JSON** (V4). |


**Practical authoring flow (target):**

1. Load deck (fetch or local).
2. **Edit** copy inline and/or in **Node inspector** (dev).
3. **Preview** as presenter (single-slide, sequential).
4. **Reorder** slides (see § reorder caveat below).
5. **Export** merged JSON; commit as source of truth.

---

## 2. What to rebuild from the old slide-projector / editor *concept* (not the old app)


| Capability (inspiration)      | Rebuild in HiSense as…                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sequential “deck” preview** | Dev-only **presenter preview** mode: same renderer, `currentScreenId` driven by keyboard or UI; optional fullscreen CSS.                                                      |
| **Slide list / outline**      | Existing: tracker rail + **Nodes** list in `[DevNodePanel](src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx)` (`LandingConfigNodes`).                       |
| **Click slide → see it**      | Existing: `setSelectedLandingNodeId`, scroll into view.                                                                                                                       |
| **Edit content in context**   | Existing: `InlineEditableText` on title/subtitle/paragraphs/buttons; `[NodeInspector](src/app/ui/control-dock/editor/NodeInspector.tsx)` patches via `onLandingConfigChange`. |
| **Draft vs saved**            | V4 tiers: in-memory draft → **export** → file is truth.                                                                                                                       |
| **“Create from template”**    | New **additive**: insert new `screens[]` entry from **starter JSON snippet** (recipe) + helper to fix `nextScreenId` / ids — **not** a second runtime format.                 |
| **Notes / secondary channel** | **Defer:** could later be `content` block or `meta.notes` **if** added as optional, engine-ignored field; not required for V5.                                                |


---

## 3. What **not** to bring over

- **hiclarify Firestore** (`sermon_slides`), **Journey Builder** sections, and **implicit slide-only** schema as the HiSense SoT.  
- **Deep link / iframe** to hiclarify app as the *only* authoring path (optional product integration later; out of V5 core).  
- **Replacing** `screens[]` + layouts + `landing-content-blocks` with a minimal `templateId + text` slide array **inside** the onboarding engine (that would be a parallel product; if ever needed, use **one-way export** to a *separate* presenter format, not collapse JSON).  
- **Broad rewrite** of `[ContainerCreationsLandingRenderer.tsx](src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx) layout switch.  
- **Merging** json-skin / `ExperienceRenderer` authoring into this plan (separate pipeline; see V4 doc).

---

## 4. How Version 5 fits Version 4


| V4                                                 | V5 adds                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| JSON is source of truth; draft ≠ done until export | Same; **export must reflect true deck state** including authoring-only overrides (§ reorder).  |
| Tier 1 export required                             | Export may need **merge step** (order override → `screens[]` order) so JSON is self-contained. |
| Dev-gated writeback optional                       | Unchanged; V5 does not require writeback.                                                      |
| Template/recipe docs                               | V5 ties **recipes** to **NodeInspector + insert-slide** workflows.                             |


---

## 5. Inline editing layer — present vs extend

### Already possible (repo-grounded)

- **Title, subtitle** (hero): `[InlineEditableText](src/app/ui/control-dock/editor/InlineEditableText)` + `updateScreenField` in renderer.  
- **Paragraph** blocks: `renderContentBlocks` with `isEditor`, `onParagraphChange` → `updateScreenContentBlock`.  
- **Many button labels**: `updateScreenButtonLabel` / `renderButtons` edit path.  
- **Node-level patches**: `[NodeInspector](src/app/ui/control-dock/editor/NodeInspector.tsx)` → `updateNode` → `onLandingConfigChange` → `setConfig` (via `[registerJsonScreen](src/app/ui/control-dock/editor/registerJsonScreen.ts)`).  
- **Slide reorder (session)**: `[LandingConfigNodes](src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx)` `onReorder` → `[setOverride](src/04_Presentation/components/organs/tsx/website/node-order-override-store.ts)` — affects `[orderedScreens](src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx) **without** mutating JSON file until export merges.

### Needs extension (incremental, not rewrite)

- **Export merge:** When exporting, **reorder `config.screens`** to match effective `landingScreenOrder` (override if any), then clear or document override — otherwise **exported JSON loses dev panel order** (critical for V5 honesty).  
- **More inline fields:** `stepLabel`, `media[].src`, `media[].alt`, checklist items — extend `NodeInspector` and/or narrow `renderContentBlocks` editor options **per block type** (small PRs).  
- **Add slide:** UI or script: append screen from `templates/onboarding/*.json` fragment; regenerate stable `id`s; patch `nextScreenId` chain.  
- **Presenter chrome:** Dev-only toggle “Present this deck” (hide editor grid, single slide, keybindings) — **wrapper or route**, not new engine.

---

## 6. Export / JSON round-trip (draft, preview, export, save)


| State                | Definition                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Draft**            | React `config` + optional **order override** in `[node-order-override-store](src/04_Presentation/components/organs/tsx/website/node-order-override-store.ts)`. |
| **Preview**          | Read-only or single-slide present; **no separate truth**; still draft if edits happened.                                                                       |
| **Export**           | `JSON.stringify(mergeOrderIntoScreens(config, override), null, 2)` → valid `LandingConfig`.                                                                    |
| **Committed truth**  | File in repo (e.g. `landing-2.json`) after review + git.                                                                                                       |
| **Future writeback** | V4 Tier 2/3: dev-only POST or production-gated save — **optional** after export is trusted.                                                                    |


**Minimum acceptable completion (V4 + V5):** Export produces JSON that **loads identically** in preview **without** relying on session-only override.

---

## 7. Slide authoring experience (target checklist)


| Action                  | V5 approach                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Add slide**           | Insert from starter fragment (recipe); new `id`; patch `nextScreenId` / buttons — **tooling** first, full UI second.  |
| **Choose recipe**       | Docs + optional dropdown that picks which **template JSON stub** to insert (no new engine `type` required initially). |
| **Edit content**        | Existing inline + NodeInspector; extend as needed.                                                                    |
| **Preview in sequence** | Presenter preview mode + existing `goNext` / `goBack` / tracker.                                                      |
| **Reorder**             | Nodes panel reorder → **must merge on export** into `screens[]`.                                                      |
| **Tracker / summary**   | Unchanged engine behavior; recipes doc when to set `trackerResponse` / `dynamicSummaryConfig`.                        |


---

## 8. Dual use cases: marketing vs teaching / sermon / discipleship

**Can one engine support both?** **Yes**, cleanly, **if** you treat differences as **deck templates + content**, not as two renderers:

- **Same:** `screens[]`, layouts, blocks, media, buttons, optional `inlineControls` (CC-specific today), tracker rules.  
- **Different:** Copy depth, media choices, fewer CTAs on teaching decks; **sermon-style** decks may use more `textOnly` / `twoCol` + `paragraph` / `heading` / `checklist`; **marketing** uses `hero`, `proofPanel`, `ctaBand`, shop links.

**One system vs separate presentation layer:**  

- **Recommended:** **One engine**, **one JSON schema**, **optional presenter shell** (fullscreen / minimal UI) = **view mode only**, not a second file format.  
- **Separate layer** only if you later add **export to hiclarify-shaped slides** for an external presenter — that is a **one-way adapter**, not a collapse of HiSense JSON.

---

## 9. Version 5 phased roadmap

### Phase V5-0 — Prerequisite (V4)


|              |                                                                      |
| ------------ | -------------------------------------------------------------------- |
| **Goal**     | Policy doc + **working export** (download/copy) for `LandingConfig`. |
| **Risk**     | Low–medium                                                           |
| **Required** | **Yes** before calling projector work “complete”                     |


### Phase V5-1 — Docs: projector model + export merge spec


|              |                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Goal**     | `PROJECTOR-MODEL.md`: editing vs preview vs draft; **export must merge** `node-order-override` into `screens` order. |
| **Files**    | `docs/onboarding-platform/PROJECTOR-MODEL.md`; link from README.                                                     |
| **Frozen**   | Renderer layouts.                                                                                                    |
| **Risk**     | Low                                                                                                                  |
| **Required** | **Yes**                                                                                                              |


### Phase V5-2 — Export v2 (order merge)


|              |                                                                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**     | Single function `mergeLandingScreenOrder(config, orderIds): LandingConfig` used by export button only.                                                                                                      |
| **Files**    | New small module e.g. `src/lib/landing-config-export-merge.ts`; export UI in dev dock; **read** `[getOverride](src/04_Presentation/components/organs/tsx/website/node-order-override-store.ts)` + `config`. |
| **Frozen**   | GET API; visitor preview.                                                                                                                                                                                   |
| **Risk**     | Low–medium                                                                                                                                                                                                  |
| **Required** | **Yes** for honest reorder                                                                                                                                                                                  |


### Phase V5-3 — Presenter preview shell (dev-only)


|              |                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**     | Toggle: single-slide, reduced chrome, arrow keys = `goNext`/`goBack` (or `setCurrentScreenId`).                                                                                                   |
| **Files**    | Possibly `[OnboardingEditorToggle.tsx](src/07_Dev_Tools/dev/OnboardingEditorToggle.tsx)` or new dev-only component colocated with layout; **minimal** changes to renderer (callbacks or context). |
| **Frozen**   | Default production layout tree.                                                                                                                                                                   |
| **Risk**     | Medium if renderer touched; **prefer wrapper route** `/dev/...` that only mounts player.                                                                                                          |
| **Required** | **No** — high UX value, can wait after V5-2                                                                                                                                                       |


### Phase V5-4 — Extend NodeInspector / inline fields


|              |                                                                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**     | `stepLabel`, media URL/alt, high-traffic block fields.                                                                                                                                                |
| **Files**    | `[NodeInspector.tsx](src/app/ui/control-dock/editor/NodeInspector.tsx)`, optionally `[renderContentBlocks.tsx](src/lib/landing-content-blocks/renderContentBlocks.tsx)` for one block type at a time. |
| **Risk**     | Low per field                                                                                                                                                                                         |
| **Required** | **Partially** — prioritize by pain                                                                                                                                                                    |


### Phase V5-5 — Add slide from recipe


|              |                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Goal**     | Insert stub screen; fix ids; optional CLI `scripts/add-landing-slide.ts` before full UI. |
| **Files**    | `templates/onboarding/*.json`, script or DevNodePanel action.                            |
| **Risk**     | Medium (graph consistency)                                                               |
| **Required** | **No** early; **yes** for “platform” feel long-term                                      |


### Phase V5-6 — Dev writeback / future save


|              |                      |
| ------------ | -------------------- |
| **Goal**     | Same as V4 Tier 2/3. |
| **Required** | **No**               |


---

## 10. Simple / low-risk vs ambitious / wait


| Low-risk (do soon)         | Ambitious (defer)                             |
| -------------------------- | --------------------------------------------- |
| V5-1 docs                  | V5-5 full “add slide” UI                      |
| V5-2 export merge          | V5-3 if it requires large renderer edits      |
| Small NodeInspector fields | Production writeback                          |
|                            | Separate hiclarify deck-v4 adapter            |
|                            | Full block-level WYSIWYG for every block type |


---

## 11. Best “usable today” path

1. Ship **V4 export** if missing.
2. Add **export order merge** (V5-2) so reorder is not lost.
3. Authors use **IDE + dev Nodes + inline** + **export → commit**.
4. Presenter chrome (V5-3) when you need **stakeholder walkthroughs**.

---

## 12. Best “powerful long-term platform” path

- Rich **NodeInspector** + optional **recipe-driven insert**.  
- **Presenter mode** + **keyboard** + optional **second display** styling.  
- Optional **one-way export** to a portable deck format for external presenters (only if product requires hiclarify parity).  
- **Authenticated save** + CI validation of JSON.

---

## 13. Exact files / systems likely involved (HiSense)


| Area                        | Files                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Slide player / deck state   | `[ContainerCreationsLandingRenderer.tsx](src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx)                             |
| Config API (read)           | `[container-creations-landing-config/route.ts](src/app/api/container-creations-landing-config/route.ts)`                                                      |
| Blocks                      | `[landing-content-blocks/*](src/lib/landing-content-blocks/)`                                                                                                 |
| Tracker / summary rules     | `[landing-tracker-responses.ts](src/lib/landing-tracker-responses.ts)`                                                                                        |
| Editor registration         | `[registerJsonScreen.ts](src/app/ui/control-dock/editor/registerJsonScreen.ts)`                                                                               |
| Sidebar / landing props     | `[dev-right-sidebar-store.ts](src/app/ui/control-dock/dev-right-sidebar-store.ts)`                                                                            |
| Nodes / reorder / inspector | `[DevNodePanel.tsx](src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx)`, `[NodeInspector](src/app/ui/control-dock/editor/NodeInspector.tsx)` |
| Order override              | `[node-order-override-store.ts](src/04_Presentation/components/organs/tsx/website/node-order-override-store.ts)`                                              |
| Editor mode                 | `[editor-mode-store](src/07_Dev_Tools/editor/editor-mode-store)`                                                                                              |
| Spec reference              | `[docs/1_ONBOARDING JSON - MASTER.md](docs/1_ONBOARDING%20JSON%20-%20MASTER.md)`                                                                              |


---

## 14. Is this worth doing now?

**Yes, selectively:**

- **High ROI now:** V5-1 + **V5-2 (export merge)** — fixes a real gap (reorder vs exported JSON) and aligns with V4 source-of-truth.  
- **Medium ROI:** Presenter preview (V5-3) when you demo decks often.  
- **Lower urgency:** Full add-slide UI (V5-5) until deck volume grows.

**Not worth it now:** Porting hiclarify, collapsing to slide-only schema, or production writeback without export discipline.

---

## 15. Final recommendation — first implementation step

1. **Verify V4 Phase 4a export exists** and is dev-gated.
2. **Implement V5-2 first:** `mergeLandingScreenOrder` + export uses it — **smallest change that makes the “projector” story honest**.
3. **Write V5-1 `PROJECTOR-MODEL.md`** in parallel so authors understand draft vs export.

---

## Relationship to scripture / hiclarify plan

The [scripture slides + onboarding](scripture_slides_%2B_onboarding_1025e4d8.plan.md) doc argues **mapping** or a future **deck v4 interchange** between systems. **V5 does not implement that.** If you later want hiclarify consumption, add a **separate** `landingConfigToExternalDeck()` **after** HiSense JSON is stable—**out of scope** for V5 core.