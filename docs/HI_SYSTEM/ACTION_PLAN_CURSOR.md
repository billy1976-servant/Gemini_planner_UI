# Action Plan (Cursor copy-paste)

Paste this as a single command to Cursor:
Use ACTION_PLAN_CURSOR.md as the only specification. Execute Packets 11–15 sequentially. For each packet: (1) open and read every file listed under “Files to inspect”, (2) perform only the “Exact edits to make” for that packet, (3) run the packet’s Validation steps, (4) STOP and summarize what changed and whether validation passed, then WAIT for my approval before continuing to the next packet. Do not skip packets, do not combine steps, and do not modify anything not explicitly listed in the current packet.


Single executable plan derived from [MASTER_TASK_LIST.md](MASTER_TASK_LIST.md).
One packet = one atomic, testable unit. Use Covers to trace back to original steps.

---

## Phase Map

| Phase | Name | Packets |
|-------|------|---------|
| 1 | JSON Molecule UI Foundation | 01–05 |
| 2 | Layout & Skin System | 06–09 |
| 3 | JSON Behavior / Logic Pipeline | 10–13 |
| 4 | Ripper → Compiler → Skin Output | 14–18 |
| 5 | Journal System | 19–22 |
| 6 | Planner System | 23–26 |
| 7 | Marketing / Product Page Generator | 27–30 |
| 8 | Migration + Coexistence | 31–34 |

---

## Inventory

**Phase 1**
- `src/contracts/` (blueprint-universe.validator.ts, behavior-intent.ts). No molecule-universe doc yet.
- `src/compounds/ui/definitions/button.json` (no icon variant).
- `src/compounds/ui/definitions/*.json` (12 molecules) + definitions/registry.ts.
- `src/engine/core/registry.tsx`, `src/compounds/ui/index.ts`.
- content.manifest: MISSING; add generator + wire into blueprint.
- `src/scripts/blueprint.ts`, `src/scripts/pipeline-proof.ts`, `docs/HI_SYSTEM/MAP.md`.

**Phase 2**
- `src/lib/site-skin/shells/` (WebsiteShell, AppShell, LearningShell).
- `src/layout/presentation/app.profile.json`, website.profile.json, learning.profile.json.
- `src/layout/layout-engine/composeScreen.ts`, region-policy.ts; profile-resolver.ts.
- `src/app/layout.tsx`, `src/engine/core/layout-store.ts`.
- `src/lib/site-compiler/normalizeSiteData.ts`, compileSiteToSchema.ts (section IDs regenerated; use derivedPages.sectionIds).
- `src/lib/site-skin/PROOF_PATH.md`, MAP.md.

**Phase 3**
- `src/engine/core/behavior-listener.ts`, `src/state/state-store.ts`, state-resolver.ts.
- `src/contracts/behavior-normalize.ts`, behavior-intent.ts; blueprint-universe.validator.ts.
- Blueprint parser already reads `[slots]` and `(verb)` in blueprint.ts; ensure canonical emit.
- `src/engine/core/json-renderer.tsx` (runtime behavior strip).

**Phase 4**
- `src/lib/site-compiler/` (normalizeSiteData, compileSiteToSchema, compileSiteToScreenModel).
- `src/lib/site-normalizer/derivePagesFromNav.ts`, derivePages.ts.
- Legacy: `src/lib/siteCompiler/` (normalize.ts, compileSite.ts). USE: site-compiler as canonical.
- `src/scripts/websites/build-site.ts`, blueprint.ts; content.manifest from Phase 1.

**Phase 5**
- `src/state/state-resolver.ts`, state-store.ts; `src/engine/core/behavior-listener.ts`.
- `src/apps-offline/apps/journal_track/` (blueprint, content, app.json).

**Phase 6**
- State resolver/store; `src/apps-offline/apps/planner_priority/` (existing app.json, blueprint, content).

**Phase 7**
- `src/lib/site-skin/mappers/productToMoleculeNodes.ts`, siteDataToSlots.ts.
- `src/lib/site-skin/compileSkinFromBlueprint.ts`; product graph under content/compiled/sites/.

**Phase 8**
- `src/app/layout.tsx`, page.tsx; screen loader; API routes. Docs-only for runbook/coexistence/deprecation.

---

## Action Packets

### Packet 01 — Contract document + molecule definitions audit

- **Goal:** Lock molecule universe (types, variants, sizes, slots, which may carry behavior) and align all 12 definition JSONs.
- **Covers:** P1.1, P1.3.
- **Files to inspect:** `docs/HI_SYSTEM/` or `src/contracts/`, `src/compounds/ui/definitions/*.json`.
- **Exact edits to make:**
  - Add contract doc (e.g. `docs/HI_SYSTEM/MOLECULE_CONTRACT.md` or `src/contracts/molecule-universe.md`): allowed types (12 molecules + 9 atoms), allowed variants/sizes per type, content slots, molecules that may carry behavior (e.g. Button, Card; Modal only close).
  - Audit each of `avatar.json`, `button.json`, `card.json`, `chip.json`, `field.json`, `footer.json`, `list.json`, `modal.json`, `section.json`, `stepper.json`, `toast.json`, `toolbar.json`: ensure variants/sizes/slots match contract; fix mismatches.
- **Validation:** Grep for `variants` and `sizes` in each definition; contract checklist in doc.
- **Done when:** Contract exists and all 12 definition files conform.
- **Risks:** None.

---

### Packet 02 — Button icon variant

- **Goal:** Add `icon` variant to button definition per contract.
- **Covers:** P1.2.
- **Files to inspect:** `src/compounds/ui/definitions/button.json`.
- **Exact edits to make:**
  - Under `variants`, add `"icon": { ... }` with surface/text/trigger consistent with existing variants (e.g. minimal padding, no label slot, or document icon slot).
- **Validation:** Open button.json; confirm `variants.icon` exists; run pipeline proof.
- **Done when:** Pipeline proof still passes; button can render with variant `icon`.
- **Risks:** JSON pipeline must not break TSX pipeline.

---

### Packet 03 — Registry and compound registry audit

- **Goal:** No orphan or duplicate type mappings; Registry and compound registry in sync with definitions.
- **Covers:** P1.4.
- **Files to inspect:** `src/engine/core/registry.tsx`, `src/compounds/ui/index.ts`, `src/compounds/ui/definitions/registry.ts`.
- **Exact edits to make:**
  - List every JSON `type` used in apps-offline app.json files; ensure each has entry in registry.tsx and compound lookup.
  - Remove or fix orphan/duplicate mappings; ensure 12 molecules + 9 atoms all present.
- **Validation:** Grep `type:` in apps-offline; cross-check with Registry keys and definitions/registry.
- **Done when:** Every molecule/atom type used in JSON has exactly one mapping; no duplicates.
- **Risks:** None.

---

### Packet 04 — content.manifest generator + blueprint compiler wiring

- **Goal:** Generate content.manifest (required keys, empty when unfilled); validate keys at compile time.
- **Covers:** P1.5, P1.6.
- **Files to inspect:** `src/scripts/blueprint.ts`, blueprint parser output shape; new or existing script under `src/scripts/` or blueprint mode.
- **Exact edits to make:**
  - Implement content.manifest generator: blueprint + molecule contracts → manifest (required keys per node/slot; empty values for unfilled). Output e.g. `src/apps-offline/apps/<category>/<app>/content.manifest.txt` (or .json).
  - In blueprint compile path: read content.manifest or derived key list; validate content keys (warn or fail on missing or invented keys). Integrate into `src/scripts/blueprint.ts` or called validator.
- **Validation:** Run blueprint for one app; confirm manifest exists; remove a required key and confirm warn/fail.
- **Done when:** Manifest generated per app; blueprint compile validates keys.
- **Risks:** Do not break existing blueprint output shape for apps without manifest yet.

---

### Packet 05 — Pipeline proof + MAP (Phase 1)

- **Goal:** All 12 molecules + 9 atoms render; MAP reflects locked foundation.
- **Covers:** P1.7, P1.8.
- **Files to inspect:** `src/scripts/pipeline-proof.ts`, `docs/HI_SYSTEM/MAP.md`.
- **Exact edits to make:**
  - Run `npm run pipeline:proof`; fix any regressions (registry, definitions, or proof script).
  - In MAP.md, update "JSON Renderer + Registry" and "What Is Fully Wired" to state foundation is locked (12 molecules, 9 atoms, contract, content.manifest wired).
- **Validation:** `npm run pipeline:proof` passes; MAP diff shows updated sections.
- **Done when:** Proof passes; MAP accurately describes foundation.
- **Risks:** None.

---

### Packet 06 — Shells + profiles (layout and styling)

- **Goal:** WebsiteShell, AppShell, LearningShell visually distinct; profiles define section-level layout for all region roles.
- **Covers:** P2.1, P2.2, P2.3, P2.4.
- **Files to inspect:** `src/lib/site-skin/shells/WebsiteShell.tsx`, AppShell.tsx, LearningShell.tsx; `src/layout/presentation/website.profile.json`, app.profile.json, learning.profile.json.
- **Exact edits to make:**
  - WebsiteShell: full-bleed or gradient from palette, sticky header, maxWidth, hero, content sections, footer; palette tokens + profile only.
  - AppShell: optional side nav, compact header, primary + sidebar; distinct from website.
  - LearningShell: header, content, actions, footer; distinct spacing/background.
  - In each profile JSON, define section-level layout (row/column/grid, gap, align) for every region role used by composeScreen and region-policy.
- **Validation:** Switch experience in UI; same URL shows different layout; no TSX hardcoding of hero/header/cards.
- **Done when:** Three shells and three profiles are distinct and profile-driven.
- **Risks:** JSON pipeline must not break TSX pipeline.

---

### Packet 07 — Experience dropdown and composeScreen

- **Goal:** Experience drives only layout-store; composeScreen uses getRegionOrder for roleTaggedNodes per experience.
- **Covers:** P2.5, P2.6.
- **Files to inspect:** `src/app/layout.tsx`, `src/engine/core/layout-store.ts`, `src/layout/layout-engine/composeScreen.ts`, region-policy.ts.
- **Exact edits to make:**
  - Confirm experience dropdown (or equivalent in layout.tsx) writes only to layout-store `experience`; no preset or direct JSON mutation.
  - Confirm composeScreen reads layoutState.experience and getRegionOrder so same roleTaggedNodes produce different region orderings per experience.
- **Validation:** Toggle experience; inspect layout store; verify region order changes.
- **Done when:** Behavior matches spec; no stray mutations.
- **Risks:** None.

---

### Packet 08 — Section ID preservation (normalizer → schema)

- **Goal:** Section IDs from normalizeSiteData/derivedPages used in compileSiteToSchema; no regeneration.
- **Covers:** P2.7, P4.1.
- **Files to inspect:** `src/lib/site-compiler/normalizeSiteData.ts`, `src/lib/site-compiler/compileSiteToSchema.ts`.
- **Exact edits to make:**
  - In compileSiteToSchema (compilePagesToSchema): when building sections, use `derivedPage.sectionIds[index]` when available instead of `block-${pageSlugSafe}-${index}`. Ensure schema sections[].id matches derivedPages.sectionIds.
  - In homepage path, use existing section IDs from normalized/homepage structure if present; avoid regenerating IDs that normalizer already set.
- **Validation:** Run `npm run website`; grep schema output for section ids; compare to derivedPages.sectionIds from normalizer.
- **Done when:** derivedPages.sectionIds match schema sections[].id; viewer filter finds sections.
- **Risks:** JSON pipeline must not break TSX pipeline.

---

### Packet 09 — Skin proof path + MAP (Phase 2)

- **Goal:** Document skin proof path; update MAP for layout/shells.
- **Covers:** P2.8, P2.9.
- **Files to inspect:** `src/lib/site-skin/PROOF_PATH.md`, `docs/HI_SYSTEM/MAP.md`.
- **Exact edits to make:**
  - In PROOF_PATH.md or MAP: document path skin JSON → loadSiteSkin → applySkinBindings → composeScreen → shells → JsonRenderer.
  - Update MAP.md sections "Layout Engine", "Shell System", "What Is Fully Wired".
- **Validation:** Read PROOF_PATH and MAP; path is reproducible.
- **Done when:** Docs accurate and complete.
- **Risks:** None.

---

### Packet 10 — Behavior contract + normalization layer

- **Goal:** Canonical behavior representation and contract tokens; legacy state/logic normalized.
- **Covers:** P3.1, P3.2.
- **Files to inspect:** `src/contracts/behavior-intent.ts`, behavior-normalize.ts; `src/engine/core/behavior-listener.ts`.
- **Exact edits to make:**
  - Define (in contract doc or behavior-intent): Interaction, Navigation, Action, Mutation; tokens tap, go, back, append, update, remove.
  - In behavior-listener or separate module: map legacy `state:*` and `logic.action` to canonical form; optional allowLegacy flag.
- **Validation:** Trigger legacy and canonical events; both resolve to same canonical intent where applicable.
- **Done when:** Contract documented; normalization layer in place and testable.
- **Risks:** Do not break TSX interpretRuntimeVerb path.

---

### Packet 11 — Behavior validators (compile + runtime)

- **Goal:** Only actionable molecules may have behavior; Modal only close; enforce at compile and optionally at runtime.
- **Covers:** P3.3, P3.4.
- **Files to inspect:** `src/contracts/blueprint-universe.validator.ts`, `src/scripts/contract-validate.ts`; `src/engine/core/json-renderer.tsx` or wrapper.
- **Exact edits to make:**
  - Compile-time: in blueprint/contract-validate, add behavior rules (actionable molecules only; Modal only close); fail or warn.
  - Runtime (optional): in JsonRenderer or wrapper, strip or block invalid behavior on non-actionable molecules.
- **Validation:** Add behavior to non-actionable molecule in app.json; compile warns/fails; runtime strips if implemented.
- **Done when:** Violations caught at compile and optionally at render.
- **Risks:** JSON pipeline must not break TSX pipeline.

---

### Packet 12 — Blueprint emit canonical behavior + content.manifest link

- **Goal:** Blueprint emits canonical behavior and content keys; content.manifest used in compile.
- **Covers:** P3.5, P3.6.
- **Files to inspect:** `src/scripts/blueprint.ts` (buildTree, emit behavior and slots).
- **Exact edits to make:**
  - Ensure parser output for `[slots]` and `(verb)` is emitted as canonical behavior in app.json (not legacy logic.action/state.bind only). Link behavior tokens to content slots where applicable.
  - Use content.manifest / key validation from Phase 1 in blueprint compile.
- **Validation:** Blueprint with contract-style lines; app.json has canonical behavior; key validation runs.
- **Done when:** Emitted JSON is contract-aligned; manifest keys enforced.
- **Risks:** Do not break existing apps that use legacy syntax (normalize or allowLegacy).

---

### Packet 13 — JSON vs TSX event flow + MAP (Phase 3)

- **Goal:** Document and verify JSON path (behavior-listener → state-mutate/navigate) vs TSX path (interpretRuntimeVerb).
- **Covers:** P3.7, P3.8.
- **Files to inspect:** `src/engine/core/behavior-listener.ts`, state-store; `src/engine/runtime/` (interpretRuntimeVerb); `docs/HI_SYSTEM/MAP.md`.
- **Exact edits to make:**
  - Verify JSON-origin events flow only through behavior-listener → state-mutate/navigate; TSX-origin through interpretRuntimeVerb.
  - Update MAP.md "Engine / Logic System", "What Is Missing Entirely" (behavior validator, contract tokens).
- **Validation:** Trace one JSON and one TSX event; confirm paths; MAP updated.
- **Done when:** Flow verified and documented.
- **Risks:** None.

---

### Packet 14 — Document single compiler path

- **Goal:** Single path doc: raw → normalizeSiteData → compileSiteToSchema → compiled outputs.
- **Covers:** P4.2.
- **Files to inspect:** `docs/HI_SYSTEM/MAP.md` or new runbook in docs/HI_SYSTEM/.
- **Exact edits to make:**
  - Document: raw snapshot → normalizeSiteData → compileSiteToSchema → compiled/schema.json, normalized.json; add to MAP or runbook.
- **Validation:** Follow doc; reproduce outputs.
- **Done when:** Path is documented and accurate.
- **Risks:** None.

---

### Packet 15 — Ripper/product data → skin JSON (one path)

- **Goal:** One path from product graph + template to skin JSON (e.g. product grid or PDP).
- **Covers:** P4.3.
- **Files to inspect:** `src/lib/site-skin/`, `src/lib/site-compiler/`, content/compiled/sites/, product graph location.
- **Exact edits to make:**
  - Implement or wire: product graph + template → skin JSON; output loadable by SiteSkin (e.g. compiled/skins/ or equivalent). At least one type (product grid or PDP).
- **Validation:** Run build; load resulting skin; render in SiteSkin.
- **Done when:** One end-to-end path produces and loads skin JSON from product data.
- **Risks:** May be BLOCKED if product graph source/ownership unclear; then document and stub.

---

### Packet 16 — Blueprint + content.manifest → app.json contract-compliant

- **Goal:** Blueprint + content + content.manifest produce contract-compliant app.json; Phase 1 generator integrated.
- **Covers:** P4.4.
- **Files to inspect:** `src/scripts/blueprint.ts`, content.manifest generator from Packet 04.
- **Exact edits to make:**
  - Ensure full chain: blueprint + content + content.manifest → app.json is contract-compliant; content.manifest generator from Phase 1 integrated in build or blueprint run.
- **Validation:** Run blueprint for app with manifest; run contract-validate; no violations (or only documented exceptions).
- **Done when:** Output passes contract validation.
- **Risks:** None.

---

### Packet 17 — Legacy siteCompiler decision + doc

- **Goal:** Decide consolidate vs deprecate; document.
- **Covers:** P4.5.
- **Files to inspect:** `src/lib/siteCompiler/` (normalize.ts, compileSite.ts), `src/lib/site-compiler/`, MAP.md.
- **Exact edits to make:**
  - Decide: consolidate into site-compiler or mark siteCompiler deprecated with migration date. Document in MAP and optionally in code comments.
- **Validation:** MAP and/or README state decision; no duplicate behavior.
- **Done when:** Decision recorded; callers directed to canonical path.
- **Risks:** Do not delete existing systems unless step explicitly says migration.

---

### Packet 18 — Run website + blueprint + MAP (Phase 4)

- **Goal:** Verify npm run website and npm run blueprint; update MAP.
- **Covers:** P4.6, P4.7.
- **Files to inspect:** `src/scripts/websites/build-site.ts`, blueprint; `docs/HI_SYSTEM/MAP.md`.
- **Exact edits to make:**
  - Run `npm run website` and `npm run blueprint` for one site and one app; fix any failures; verify schema/section IDs and app.json render.
  - Update MAP.md "Compilers / Scripts", "What Exists But Is Not Wired", "What Is Missing Entirely".
- **Validation:** Both commands succeed; MAP reflects current state.
- **Done when:** Commands pass; MAP updated.
- **Risks:** None.

---

### Packet 19 — Journal state shape + resolver + payload alignment

- **Goal:** Journal state and intents in state-resolver; button payload lands in journal[track][key].
- **Covers:** P5.1, P5.2.
- **Files to inspect:** `src/state/state-resolver.ts`, state-store.ts; `src/engine/core/behavior-listener.ts`.
- **Exact edits to make:**
  - Define journal state shape and intents (e.g. journal.add) in state-resolver; document payload (key, fieldKey, value).
  - Align button payload (valueFrom: input, fieldKey, key) so writes land in correct derived state slot (journal[track][key]).
- **Validation:** Dispatch journal.add; inspect derived state; persistence if wired.
- **Done when:** Journal intents and payload alignment working.
- **Risks:** None.

---

### Packet 20 — Journal full flow + persistence/rehydrate

- **Goal:** Type → input-change → journal.add → state-mutate → deriveState → persistence; rehydrate on load.
- **Covers:** P5.3.
- **Files to inspect:** `src/state/state-store.ts`, persistence-adapter or equivalent; journal_track app.
- **Exact edits to make:**
  - Verify full flow; ensure persistence and rehydration for journal data.
- **Validation:** Type, save, refresh; entry persists and rehydrates.
- **Done when:** End-to-end journal flow works.
- **Risks:** None.

---

### Packet 21 — Journal TSX demote + contract doc

- **Goal:** JSON journal screens sufficient; TSX viewer demoted; journal contract and content.manifest doc.
- **Covers:** P5.4, P5.5.
- **Files to inspect:** Any TSX journal viewer; `docs/HI_SYSTEM/` or state docs.
- **Exact edits to make:**
  - Remove or demote TSX-only journal viewer as primary UX; ensure JSON journal screens are sufficient for think/save/view.
  - Document journal contract (state keys, action names, payload) and content.manifest for journal screens.
- **Validation:** Use only JSON screens for journal; doc exists.
- **Done when:** JSON is primary; contract documented.
- **Risks:** None.

---

### Packet 22 — MAP + CHANGELOG (Phase 5)

- **Goal:** MAP and CHANGELOG updated; Journal subsection in MAP.
- **Covers:** P5.6.
- **Files to inspect:** `docs/HI_SYSTEM/MAP.md`, CHANGELOG.md.
- **Exact edits to make:**
  - Add Journal subsection under Engine / Logic System in MAP.md; append CHANGELOG entry for Phase 5 work.
- **Validation:** MAP and CHANGELOG reflect journal system.
- **Done when:** Docs updated.
- **Risks:** None.

---

### Packet 23 — Planner state shape + auto-priority engine

- **Goal:** Tasks state shape and intents; hierarchical model; auto-priority (task tree + rules → ordered list).
- **Covers:** P6.1, P6.2.
- **Files to inspect:** `src/state/state-resolver.ts`; new or existing planner/priority module.
- **Exact edits to make:**
  - Define planner/tasks state shape and intents (tasks.add, tasks.complete, tasks.reorder); hierarchical (parent/child, due date, completion, priority).
  - Implement auto-priority: pure function or module (task tree + rules → ordered list or annotated tree); document rules.
- **Validation:** Add tasks; run priority; order changes per rules.
- **Done when:** State shape and auto-priority implemented and documented.
- **Risks:** None.

---

### Packet 24 — Planner resolver + persistence + screen

- **Goal:** State-resolver handlers for planner; persist and rehydrate; one planner JSON screen.
- **Covers:** P6.3, P6.4.
- **Files to inspect:** `src/state/state-resolver.ts`, state-store; `src/apps-offline/apps/planner_priority/`.
- **Exact edits to make:**
  - Add state-resolver handlers for planner intents; persist planner state; rehydrate.
  - Create or refine at least one planner JSON screen (task list or task detail) with molecule UI and state bindings/actions.
- **Validation:** Create/complete/reorder task; state persists; screen renders.
- **Done when:** Planner state and one screen work end-to-end.
- **Risks:** None.

---

### Packet 25 — Planner navigation + behavior wiring

- **Goal:** Navigation to task detail, mark complete, reschedule, reorder via JSON behavior pipeline.
- **Covers:** P6.5.
- **Files to inspect:** `src/engine/core/behavior-listener.ts`, planner screens.
- **Exact edits to make:**
  - Wire navigation to task detail, mark complete, reschedule, reorder via JSON behavior pipeline.
- **Validation:** All actions work from JSON screens.
- **Done when:** Planner actions work via behavior pipeline.
- **Risks:** None.

---

### Packet 26 — MAP + CHANGELOG (Phase 6)

- **Goal:** MAP and CHANGELOG updated with Planner.
- **Covers:** P6.6.
- **Files to inspect:** `docs/HI_SYSTEM/MAP.md`, CHANGELOG.md.
- **Exact edits to make:**
  - Update MAP with Planner (state shape, auto-priority, screens); append CHANGELOG entry.
- **Validation:** Docs reflect planner system.
- **Done when:** MAP and CHANGELOG updated.
- **Risks:** None.

---

### Packet 27 — Skin JSON templates for product/marketing

- **Goal:** Template(s) for at least one type (product grid, PDP, or category); slots for product data.
- **Covers:** P7.1.
- **Files to inspect:** `src/lib/site-skin/`, schema or types for skin.
- **Exact edits to make:**
  - Define skin JSON template(s) for at least one type: product grid, PDP, or category page; slots (name, image, url, etc.).
- **Validation:** Template validates; slots documented.
- **Done when:** At least one template exists and is loadable.
- **Risks:** None.

---

### Packet 28 — Build step: product graph + template → skin JSON

- **Goal:** Build step produces skin JSON per page; output loadable by SiteSkin.
- **Covers:** P7.2.
- **Files to inspect:** `src/scripts/websites/` or site-skin compile; content/compiled/sites/.
- **Exact edits to make:**
  - Implement build step: product graph + template(s) → skin JSON per page; output to compiled/skins/ or equivalent; loadable by SiteSkin.
- **Validation:** Run build; load skin; SiteSkin renders.
- **Done when:** One or more pages generated and loadable.
- **Risks:** JSON pipeline must not break TSX pipeline.

---

### Packet 29 — Mappers + product URL/image handling

- **Goal:** productToMoleculeNodes and siteDataToSlots wired to template; URL handling per MAP.
- **Covers:** P7.3, P7.5.
- **Files to inspect:** `src/lib/site-skin/mappers/productToMoleculeNodes.ts`, siteDataToSlots.ts; URL normalization (MAP: slugify, etc.).
- **Exact edits to make:**
  - Wire product-to-molecule mappers to template so product data fills slots.
  - Ensure product URL and image URL handling match MAP (normalization, slugify); no regression.
- **Validation:** Product data fills slots; URLs correct in output.
- **Done when:** Mappers wired; URL handling correct.
- **Risks:** None.

---

### Packet 30 — E2E product page + MAP (Phase 7)

- **Goal:** At least one marketing/product page type renders E2E via skin → SiteSkin → JsonRenderer; update MAP.
- **Covers:** P7.4, P7.6.
- **Files to inspect:** SiteSkin, JsonRenderer; `docs/HI_SYSTEM/MAP.md`.
- **Exact edits to make:**
  - Verify at least one type (e.g. product grid homepage) renders end-to-end via load skin → SiteSkin → JsonRenderer; no TSX layout for that path.
  - Update MAP.md "Skin / Content Pipeline", "Compilers / Scripts", "What Is Fully Wired".
- **Validation:** Load product page; verify JSON path only; MAP updated.
- **Done when:** E2E verified; MAP accurate.
- **Risks:** None.

---

### Packet 31 — Migration runbook + coexistence + deprecation docs

- **Goal:** Runbook, coexistence rules, deprecation sequence documented.
- **Covers:** P8.1, P8.2, P8.3.
- **Files to inspect:** `docs/HI_SYSTEM/` (new runbook or MAP).
- **Exact edits to make:**
  - Write migration runbook: ordered list of screen types/features; for each: legacy entry point, JSON replacement, routing/feature-flag, verification, rollback.
  - Document coexistence: how TSX vs JSON screens are selected (URL, query, config); shared state; no duplicate behavior logic.
  - Define deprecation sequence: which TSX screens/paths deprecated when; how users/developers directed to JSON.
- **Validation:** Read runbook; follow for one example.
- **Done when:** Three docs (or three sections) complete.
- **Risks:** None.

---

### Packet 32 — Execute one migration + MAP/ROADMAP/PLAN_ACTIVE

- **Goal:** Execute at least one migration per runbook; update MAP, ROADMAP, PLAN_ACTIVE.
- **Covers:** P8.4, P8.5.
- **Files to inspect:** Runbook; `src/app/page.tsx` or layout; `docs/HI_SYSTEM/MAP.md`, ROADMAP.md, PLAN_ACTIVE.md.
- **Exact edits to make:**
  - Execute at least one migration (one screen type or flow) per runbook; document result.
  - Update MAP.md: primary path = JSON pipeline; legacy = TSX (opt-in or deprecated). Update ROADMAP and PLAN_ACTIVE.
- **Validation:** Migrated screen works via JSON path; MAP/ROADMAP/PLAN_ACTIVE updated.
- **Done when:** One migration done; docs reflect primary = JSON.
- **Risks:** Do not delete legacy until runbook says so.

---

### Packet 33 — Optional: feature flag PREFER_JSON_SCREENS

- **Goal:** Optional config/flag to prefer JSON screens; wire to screen loader/layout.
- **Covers:** P8.6.
- **Files to inspect:** `src/app/layout.tsx`, screen-loader.ts, config or env.
- **Exact edits to make:**
  - Add optional feature flag or config (e.g. PREFER_JSON_SCREENS); wire to screen loader or layout so JSON is chosen when set.
- **Validation:** Set flag; verify JSON path used where expected.
- **Done when:** Flag works and documented.
- **Risks:** Default behavior unchanged when flag unset.

---

### Packet 34 — Quick Recheck (global)

- **Goal:** Final checklist after all packets.
- **Covers:** —
- **Files to inspect:** Whole repo.
- **Exact edits to make:**
  - Run Quick Recheck section below; fix any regressions.
- **Validation:** All items in Quick Recheck pass.
- **Done when:** Build and proof pass; no unintended regressions.
- **Risks:** None.

---

## Quick Recheck

Run after each packet (or after each phase):

1. **Build:** `npm run build` or `npx tsc --noEmit`.
2. **Pipeline proof:** `npm run pipeline:proof` (after Phase 1+).
3. **Lint:** Project lint command if configured.
4. **Section IDs:** After Packet 08, grep compiled schema for section ids; compare to normalizer derivedPages.sectionIds.
5. **Registry:** Grep `type:` in apps-offline app.json files; confirm each type in registry and definitions.
6. **JSON vs TSX:** No duplicate behavior logic; TSX path unchanged unless migration packet.

---

## Source docs

- docs/HI_SYSTEM/MASTER_TASK_LIST.md
- docs/HI_SYSTEM/MAP.md
- docs/HI_SYSTEM/SYSTEM_MASTER_PLAN.md
- docs/HI_SYSTEM/WORKFLOW_RULES.md
- docs/HI_SYSTEM/ROADMAP.md
- docs/HI_SYSTEM/PLAN_ACTIVE.md
- docs/HI_SYSTEM/CHANGELOG.md
