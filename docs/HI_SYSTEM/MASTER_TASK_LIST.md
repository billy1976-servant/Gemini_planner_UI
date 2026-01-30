# MASTER TASK LIST

Single master task list for the entire HIcurv/HiSense system build. Aligns with [MAP.md](MAP.md), [SYSTEM_MASTER_PLAN.md](SYSTEM_MASTER_PLAN.md), [ROADMAP.md](ROADMAP.md), [WORKFLOW_RULES.md](WORKFLOW_RULES.md), and [PLAN_ACTIVE.md](PLAN_ACTIVE.md). Before coding: read docs in this folder; update PLAN_ACTIVE before starting a phase; append CHANGELOG and update MAP after major work.

---

## Phase 1 — JSON Molecule UI Foundation

### Goal

Lock the JSON molecule UI as the single foundation for all future JSON-driven screens: 12 molecules + 9 atoms, Registry, definitions, palette, and a clear contract. Ensure every JSON screen is rendered only via JsonRenderer with no TSX duplication of molecule structure.

### Steps

1. [ ] Write contract document: molecule universe (allowed types, variants, sizes, content slots, which molecules may carry behavior). *(JSON schema, Docs)*
2. [ ] Add Button `icon` variant to `src/compounds/ui/definitions/button.json`. *(JSON schema)*
3. [ ] Audit all 12 molecule definition JSONs against contract; fix variants, sizes, and content slots. *(JSON schema)*
4. [ ] Audit Registry (`src/engine/core/registry.tsx`) and compound registry (`src/compounds/ui/index.ts`) for orphan or duplicate type mappings; remove or fix. *(Renderer)*
5. [ ] Implement content.manifest.txt generator (script or blueprint mode): blueprint + molecule contracts → manifest with required keys; empty values for unfilled. *(Compiler/ripper)*
6. [ ] Wire content.manifest (or key list) into blueprint compiler so content keys are validated at compile time; fail or warn on missing or invented keys. *(Compiler/ripper)*
7. [ ] Run pipeline proof (`npm run pipeline:proof`) and fix any regressions; ensure all 12 molecules + 9 atoms render. *(Renderer, Logic/state)*
8. [ ] Update MAP.md "JSON Renderer + Registry" and "What Is Fully Wired" to reflect locked foundation. *(Docs)*

### Depends On

- None

### Step types (reference)

JSON schema: 1, 2, 3. Renderer: 4, 7. Compiler/ripper: 5, 6. Docs: 1, 8.

---

## Phase 2 — Layout & Skin System

### Goal

Complete the layout and skin system so that website, app, and learning experiences are fully driven by JSON (skin documents), composeScreen, region-policy, and shells—with no TSX hardcoding of hero/header/cards. Shells and experience profiles provide all visual differentiation.

### Steps

1. [ ] Define WebsiteShell layout and styling (marketing look): full-bleed or gradient background from palette, sticky header, maxWidth, hero block, content sections, footer; only palette tokens and profile. *(Layout/profile)*
2. [ ] Define AppShell layout and styling (productivity look): optional side nav, compact header, primary + sidebar; distinct from website. *(Layout/profile)*
3. [ ] Define LearningShell layout and styling (linear, reading-focused): header, content, actions, footer; distinct spacing and background. *(Layout/profile)*
4. [ ] Ensure `website.profile.json`, `app.profile.json`, `learning.profile.json` define section-level layout (row/column/grid, gap, align) for all region roles used by composeScreen and region-policy. *(Layout/profile, JSON schema)*
5. [ ] Verify experience dropdown (layout.tsx or equivalent) writes only to layout-store `experience`; no preset or JSON mutation. *(Logic/state)*
6. [ ] Verify composeScreen uses `layoutState.experience` and getRegionOrder so same roleTaggedNodes produce different region orderings per experience. *(Layout/profile)*
7. [ ] Fix section ID flow: preserve original section IDs from normalizeSiteData through compileSiteToSchema (no regeneration); ensure derivedPages.sectionIds match schema sections[].id. *(Compiler/ripper)*
8. [ ] Document skin proof path (skin JSON → loadSiteSkin → applySkinBindings → composeScreen → shells → JsonRenderer) in PROOF_PATH.md or MAP. *(Docs)*
9. [ ] Update MAP.md "Layout Engine", "Shell System", "What Is Fully Wired". *(Docs)*

### Depends On

- Phase 1

### Step types (reference)

Layout/profile: 1, 2, 3, 4, 6. Logic/state: 5. Compiler/ripper: 7. JSON schema: 4. Docs: 8, 9.

---

## Phase 3 — JSON Behavior / Logic Pipeline (Parallel to TSX)

### Goal

Establish a complete JSON-based behavior and logic pipeline that runs in parallel to the existing TSX engine path. All JSON molecule interactions flow through a single contract-aligned path (CustomEvent → behavior-listener → state-store → state-resolver); no duplication of logic in TSX screens for JSON-driven flows. Legacy TSX engines remain unchanged and used only for TSX screens.

### Steps

1. [ ] Define canonical behavior representation (Interaction, Navigation, Action, Mutation) and contract tokens (tap, go, back, append, update, remove). *(JSON schema, Docs)*
2. [ ] Add normalization layer in behavior-listener (or separate module): map legacy `state:*` and `logic.action` to canonical form; optional allowLegacy flag. *(Logic/state)*
3. [ ] Implement behavior validator (compile-time): only actionable molecules may have behavior; Modal only close; fail or warn in blueprint/contract-validate. *(Compiler/ripper, JSON schema)*
4. [ ] Implement behavior validator (runtime, optional): strip or block invalid behavior on non-actionable molecules in JsonRenderer or wrapper. *(Renderer)*
5. [ ] Extend blueprint parser to read slot list `[...]` and behavior token `(...)`; emit canonical behavior and content keys. *(Compiler/ripper)*
6. [ ] Ensure content.manifest and key validation from Phase 1 are used in blueprint compile; link behavior tokens to content slots where applicable. *(Compiler/ripper)*
7. [ ] Verify JSON-origin events flow only through behavior-listener → state-mutate/navigate; TSX-origin through interpretRuntimeVerb; document in MAP. *(Logic/state, Docs)*
8. [ ] Update MAP.md "Engine / Logic System", "What Is Missing Entirely" (behavior validator, contract tokens). *(Docs)*

### Depends On

- Phase 1
- Phase 2 optional for full skin behavior

### Step types (reference)

JSON schema: 1, 3. Logic/state: 2, 7. Compiler/ripper: 3, 5, 6. Renderer: 4. Docs: 1, 7, 8.

---

## Phase 4 — Ripper → Compiler → Skin Output Pipeline

### Goal

A single, reliable pipeline from raw site data (ripper/snapshot) and authoring inputs (blueprint, content) to molecule-driven screens (app.json, skin JSON). No duplicate or divergent compiler paths; section IDs and page derivation are consistent; generated screens are valid against the contract and render correctly via JsonRenderer/SiteSkin.

### Steps

1. [ ] Fix section ID preservation in compileSiteToSchema: use section IDs from normalizer/derivedPages when building schema sections; do not regenerate `block-{slug}-{index}`. *(Compiler/ripper)*
2. [ ] Document single path: raw snapshot → normalizeSiteData → compileSiteToSchema → compiled/schema.json, normalized.json; add to MAP or runbook. *(Docs)*
3. [ ] Implement or wire ripper/product data → skin JSON: one path (e.g. product grid or PDP template) that produces skin JSON from product graph + template. *(Compiler/ripper)*
4. [ ] Ensure blueprint + content + content.manifest → app.json produces contract-compliant output; content.manifest generator from Phase 1 integrated. *(Compiler/ripper)*
5. [ ] Decide legacy siteCompiler (`src/lib/siteCompiler/`): consolidate with site-compiler or mark deprecated with migration date; document. *(Compiler/ripper, Docs)*
6. [ ] Run `npm run website` and `npm run blueprint` for one site and one app; verify schema/section IDs and app.json render correctly. *(Compiler/ripper)*
7. [ ] Update MAP.md "Compilers / Scripts", "What Exists But Is Not Wired", "What Is Missing Entirely". *(Docs)*

### Depends On

- Phase 1
- Phase 2 (skin format)
- Phase 3 (behavior in compiled output)

### Step types (reference)

Compiler/ripper: 1, 3, 4, 5, 6. Docs: 2, 5, 7.

---

## Phase 5 — Journal System (state + UI)

### Goal

The journal experience (think, save, entries, tracks) is built entirely on JSON molecule screens and the JSON state/logic pipeline. No TSX-specific journal UI; journal state (e.g. `state.journal.*`) is produced and consumed only by the state-resolver and JSON-driven screens. Persistence and rehydration work for journal data.

### Steps

1. [ ] Define journal state shape and intents in state-resolver (e.g. journal.add, journal.*); document payload shape (key, fieldKey, value). *(Logic/state, Docs)*
2. [ ] Align button payload (valueFrom: input, fieldKey, key) with state-resolver so writes (e.g. journal.add) land in correct derived state slot (journal[track][key]). *(Logic/state)*
3. [ ] Verify full flow: type in field → input-change → action (journal.add) → state-mutate → dispatchState → deriveState → persistence; rehydrate on load. *(Logic/state)*
4. [ ] Remove or demote any TSX-only journal viewer as primary UX; ensure JSON journal screens are sufficient for think/save/view. *(Renderer, Docs)*
5. [ ] Document journal contract (state keys, action names, payload) and content.manifest for journal screens. *(Docs)*
6. [ ] Update MAP.md and CHANGELOG; add Journal subsection under Engine / Logic System. *(Docs)*

### Depends On

- Phase 1
- Phase 3

### Step types (reference)

Logic/state: 1, 2, 3. Renderer: 4. Docs: 1, 4, 5, 6.

---

## Phase 6 — Planner System (tasks, auto-priority, hierarchy)

### Goal

A planner system with hierarchical tasks and an auto-priority engine, driven by JSON molecules and the JSON state/logic pipeline. Task trees, due dates, completion state, and priority are stored in state and rendered with molecule UI; priority can be computed from rules. Legacy TSX planner (if any) can coexist; new planner is JSON-first.

### Steps

1. [ ] Define planner/tasks state shape and intents (e.g. tasks.add, tasks.complete, tasks.reorder); hierarchical model (parent/child, due date, completion, priority). *(Logic/state, JSON schema)*
2. [ ] Implement auto-priority engine: pure function or module (task tree + rules → ordered list or annotated tree); document rules. *(Logic/state, Docs)*
3. [ ] Add state-resolver handlers for planner intents; persist planner state; rehydrate. *(Logic/state)*
4. [ ] Create at least one planner JSON screen (task list or task detail) with molecule UI and state bindings/actions. *(JSON schema, Compiler/ripper if new app)*
5. [ ] Wire navigation to task detail, mark complete, reschedule, reorder via JSON behavior pipeline. *(Logic/state)*
6. [ ] Update MAP.md with Planner (state shape, auto-priority, screens); CHANGELOG entry. *(Docs)*

### Depends On

- Phase 1
- Phase 3
- Phase 5 useful (state + persistence pattern)

### Step types (reference)

Logic/state: 1, 2, 3, 5. JSON schema: 1, 4. Compiler/ripper: 4. Docs: 2, 6.

---

## Phase 7 — Marketing / Product Page Generator

### Goal

Marketing and product pages (product grids, PDPs, category pages, marketing blocks) are generated and rendered entirely through the new JSON pipeline: product data + templates → skin JSON (or app.json) → SiteSkin/JsonRenderer. No TSX-driven product/marketing layout; optional coexistence with existing GeneratedSiteViewer during migration.

### Steps

1. [ ] Define skin JSON template(s) for at least one type: product grid, PDP, or category page; slots for product data (name, image, url, etc.). *(JSON schema, Layout/profile)*
2. [ ] Implement build step: product graph + template(s) → skin JSON per page; output to compiled/skins/ or equivalent; loadable by SiteSkin. *(Compiler/ripper)*
3. [ ] Wire product-to-molecule mappers (productToMoleculeNodes, siteDataToSlots) to template so product data fills slots. *(Compiler/ripper)*
4. [ ] Verify at least one marketing/product page type (e.g. product grid homepage) renders end-to-end via load skin → SiteSkin → JsonRenderer; no TSX layout. *(Renderer, Layout/profile)*
5. [ ] Ensure product URL and image URL handling match MAP (normalization, slugify); no regression. *(Compiler/ripper)*
6. [ ] Update MAP.md "Skin / Content Pipeline", "Compilers / Scripts", "What Is Fully Wired". *(Docs)*

### Depends On

- Phase 2
- Phase 4

### Step types (reference)

JSON schema: 1. Layout/profile: 1, 4. Compiler/ripper: 2, 3, 5. Renderer: 4. Docs: 6.

---

## Phase 8 — Migration + Coexistence Strategy

### Goal

Document and execute a migration strategy from legacy TSX-driven screens and engines to the JSON pipeline. Legacy system remains intact and usable until each migration step is complete; feature flags or routing allow coexistence. Final state: JSON pipeline is the default for new and migrated screens; TSX path is opt-in or deprecated for specific use cases only.

### Steps

1. [ ] Write migration runbook: ordered list of screen types/features to migrate; for each: legacy entry point, JSON replacement (screen/skin path), routing or feature-flag change, verification steps, rollback. *(Docs)*
2. [ ] Document coexistence rules: how TSX vs JSON screens are selected (URL, query, config); shared state store; no duplicate behavior logic. *(Docs)*
3. [ ] Define deprecation sequence: which TSX screens/engine paths are deprecated when; how users/developers are directed to JSON equivalents. *(Docs)*
4. [ ] Execute at least one migration (e.g. one screen type or flow) per runbook; document result. *(Renderer, Logic/state, Compiler/ripper as needed)*
5. [ ] Update MAP.md: primary path = JSON pipeline; legacy = TSX (opt-in or deprecated); update ROADMAP and PLAN_ACTIVE. *(Docs)*
6. [ ] Optional: add feature flag or config (e.g. PREFER_JSON_SCREENS) and wire to screen loader/layout. *(Logic/state, Docs)*

### Depends On

- Phases 1–7 as needed per migrated screen type

### Step types (reference)

Docs: 1, 2, 3, 5, 6. Renderer: 4. Logic/state: 4, 6. Compiler/ripper: 4.

---

## Summary

- **Total phases:** 8
- **Total steps:** 56
- **Phase safe to start immediately:** **Phase 1 — JSON Molecule UI Foundation** (Depends on: None. Phase A docs lock-in per ROADMAP is already in progress; Phase 1 is the next executable foundation.)

---

*Per [WORKFLOW_RULES.md](WORKFLOW_RULES.md): read docs before coding; update PLAN_ACTIVE before starting a phase; append CHANGELOG and update MAP after completing work.*
