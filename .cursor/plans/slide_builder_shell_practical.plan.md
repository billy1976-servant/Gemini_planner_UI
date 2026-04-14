---
name: Slide builder shell (practical)
overview: A dev-first, three-pane slide builder UX on top of the existing landing engine—reuse Nodes/inspector/inline editing, add single-slide projector preview, deck mutations, export—without a docs maze or engine rewrite. JSON stays the saved shape; users never have to see it.
todos:
  - id: builder-single-slide-preview
    content: "Editor + slideBuilder mode: center shows only selected slide (sync with selectedLandingNodeId); optional hide stacked grid."
    status: pending
  - id: builder-outline-left
    content: "In-page left rail: outline list + add/duplicate/delete/reorder wired to config state (or merge DevNodePanel list into layout)."
    status: pending
  - id: builder-mutations
    content: "Pure helpers: reorderScreens, duplicateScreen, deleteScreen, addScreenFromStub (small TS module)."
    status: pending
  - id: builder-export
    content: One obvious Export JSON button; merge node-order override into screens[] before download (V5-2).
    status: pending
  - id: builder-media-presets
    content: "Optional: inspector toggles map to existing JSON (fullBleed, aspectRatio, lightTheme)—no new engine concepts."
    status: pending
isProject: false
---

# Slide builder shell — practical implementation plan

**Goal:** Rebuild the *feel* of a simple slide projector/editor (outline + big preview + obvious edits) on **top of** the current HiSense onboarding engine. **Not** a documentation platform. **Not** a template manual maze. **Not** replacing `[ContainerCreationsLandingRenderer.tsx](src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx) internals.

**Hard rules:** JSON remains what gets saved/exported. Users should not need to read a big doc or understand JSON. **Dev-only is fine** for v1.

---

## 1. Simplest architecture (blunt)

```
+------------------------------------------------------------------+
|  SlideBuilderShell (dev route or ?slideBuilder=1)               |
| +-------------+---------------------------+---------------------+ |
|  | Outline     | Live slide (ONE screen) | Inspector           | |
|  | (list)      | = existing renderScreen | NodeInspector       | |
|  |             |   + inline editors      | + toggles later     | |
|  +-------------+---------------------------+---------------------+ |
|  Toolbar: [Add] [Dup] [Del] [Up] [Down] [Export JSON]            |
+------------------------------------------------------------------+
         |
         +-- Single React state: LandingConfig (same as today)
             fetch once -> setState -> all panes share it
```

- **No second schema.** No “deck v4” in the UI path.
- **No codegen builder.** Mutations = plain array edits on `screens[]`.
- **Center cell** = whatever **one slide** already looks like in the engine (layouts, blocks, media) — **one** `screen` object passed through existing rendering path.

**The only “risky” structural choice:** either (A) **branch inside** the existing renderer when `slideBuilder` mode is on, or (B) **extract** `renderScreen` (+ media helpers) to a shared module so the shell can call it without mounting the full page chrome twice.

**Recommendation:** Start with **(A)** — a few conditionals in the renderer you already ship — *smaller diff than a new parallel preview*. Extract later if the file hurts.

---

## 2. What HiSense already gives you (reuse)


| Need                                     | Already there                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deck data in memory                      | `useState` + `setConfig` in `[ContainerCreationsLandingRenderer.tsx](src/01_App/(live)`%20Business/Container_Creations/ContainerCreationsLandingRenderer.tsx) |
| Register + sidebar                       | `[registerJsonScreen](src/app/ui/control-dock/editor/registerJsonScreen.ts)`, `[setDevLandingProps](src/app/ui/control-dock/dev-right-sidebar-store.ts)`      |
| Left-list / reorder pattern              | `[DevNodePanel.tsx](src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx)` — `LandingConfigNodes`, `onReorder`, `setOverride`                   |
| Selected slide                           | `[setSelectedLandingNodeId](src/app/ui/control-dock/dev-right-sidebar-store.ts)`, sync with canvas                                                            |
| Right inspector                          | `[NodeInspector](src/app/ui/control-dock/editor/NodeInspector.tsx)` when editor mode + node selected                                                          |
| Inline title/subtitle/paragraphs/buttons | `InlineEditableText` + `renderContentBlocks` editor options in renderer                                                                                       |
| Live slide content                       | `renderScreen` / layouts / blocks / media — **the engine**                                                                                                    |
| Export stringify                         | Not productized everywhere — **add one button** calling `JSON.stringify` after optional order-merge                                                           |


**Blunt truth:** You are **~60% there** for “projector + edit.” What’s wrong today is **UX shape**: editor mode shows **all slides stacked** (good for QA, bad for “I’m editing *this* slide”). The old projector felt like **one big stage + outline**.

---

## 3. What UI is actually missing


| Missing piece                            | What it is                                                                                                                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single-slide center stage**            | In editor mode, render **only** `selectedLandingNodeId` (or `currentScreenId` locked to selection) in the main column — not the full `orderedScreens.map`.                                                                                    |
| **Obvious outline attached to the page** | Dev dock is easy to miss. Put a **dedicated left rail** (or top strip) listing slides with **Add / Duplicate / Delete / Up / Down** — can **reuse** row UI from `LandingConfigNodes` or extract `SlideOutline.tsx`.                           |
| **Deck mutations**                       | Add / duplicate / delete / insert are **not** one-click in the happy path; implement **5 small pure functions** mutating `screens[]` + fix `nextScreenId` naively (linear deck) or leave graph to user — **start linear**.                    |
| **Export that doesn’t lie**              | If reorder used `[node-order-override-store](src/04_Presentation/components/organs/tsx/website/node-order-override-store.ts)`, **merge order into `screens[]`** before download — otherwise JSON doesn’t match what you saw.                  |
| **“Big / wide / fullscreen feel”**       | Mostly **existing JSON**: `fullBleed`, `aspectRatio`, `lightTheme`, layout choice (`hero`, `proofPanel`). **Missing:** **inspector toggles** that flip those fields without opening JSON — add **chips** in `NodeInspector` (not new engine). |
| **One entry point**                      | Query `?slideBuilder=1` or route `/dev/slide-builder` so people **discover** the mode.                                                                                                                                                        |


---

## 4. Smallest phased path


| Phase | Deliverable                                                                   | Touch                                             |
| ----- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| **0** | `?slideBuilder=1` (or dev route) turns on builder chrome                      | 1 page / renderer branch                          |
| **1** | **Single-slide center** in builder mode + selection sync                      | `ContainerCreationsLandingRenderer` conditional   |
| **2** | **Left outline** + Add / Duplicate / Delete / Reorder + wiring to `setConfig` | New small component + `landing-deck-mutations.ts` |
| **3** | **Export JSON** button (merge order → `screens`)                              | Small util + button in toolbar                    |
| **4** | **Inspector presets** (fullBleed, layout picker from allowed set, lightTheme) | `NodeInspector` only                              |
| **5** | Polish: keyboard next/prev slide, fullscreen preview CSS                      | Optional                                          |


**No phase** called “write 10 markdown manuals.” At most **one** `README.md` in `src/07_Dev_Tools/slide-builder/README.md` (~30 lines): “Open this URL, outline left, edit center, export right.”

---

## 5. Build first

1. **Single-slide preview in builder mode** tied to **selected node id** (sync `currentScreenId` when selection changes). This alone makes it feel 50% like the old projector.
2. **Export with order merge** — so nobody loses trust in “JSON underneath.”

---

## 6. Postpone

- Full “recipe catalog” / template docs system as **primary** UX (keep stubs in repo if you want, not the main path).
- Production writeback / Firestore / hiclarify merge.
- WYSIWYG for **every** block type on canvas.
- Extracting `renderScreen` to a new package **until** the builder mode stabilizes.

---

## 7. Stay frozen

- **Layout switch** semantics inside `renderScreen` (hero / twoCol / …) — don’t “simplify” layouts.
- `[landing-content-blocks](src/lib/landing-content-blocks/)` contract.
- **GET** `[container-creations-landing-config](src/app/api/container-creations-landing-config/route.ts)` for real users.
- **Live** `[landing-2.json](src/01_App/(live)`%20Business/Container_Creations/landing-2.json) — don’t auto-write in v1.

---

## 8. How it feels like the old projector (UX rules)

- **One big slide** in the middle — not a scrolling stack.
- **Outline always visible** — click = instant stage change.
- **Edit where you look** — keep `InlineEditableText` on the stage; put **structure** (layout, ids, media flags) in inspector.
- **Boring obvious buttons** — Add / Duplicate / Delete / Move / Export — no wizard vocabulary.
- **Interface teaches** — tooltips on icons only; no required reading.

---

## 9. JSON power without JSON in the face

- **Save = Export** downloads `deck.json` (or copies to clipboard). User drops into repo / replaces file — **git** is the review layer.
- **Advanced users** can still open the file — same schema as today.
- **Never** show raw JSON in the default path; optional “View JSON” collapsed panel if you want power users.

---

## 10. Can this be done cleanly and safely **now**?

**Yes.**

- **Risk is low** if: builder is **dev-gated**, export **never** auto-overwrites prod files, and mutations are **local state** until export.
- **Risk rises** if you try to **rewrite** renderer architecture or **add** production save in the same pass — don’t.

---

## Relation to other plans

- [slide_deck_platform_v5.plan.md](slide_deck_platform_v5.plan.md) (order merge, projector docs) — **this plan is the minimal product expression** of that idea: **UI first, almost no doc burden**.
- Keep V5’s **export merge** rule — it’s non-negotiable for trust.

---

## Summary sentence

**Ship a dev-only three-pane shell: outline + single-slide stage + inspector, reuse existing render/edit paths, add dumb array mutations + honest export — no manual, no new schema, no engine rewrite.**