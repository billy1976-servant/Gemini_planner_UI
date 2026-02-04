Primary Architecture Reference: docs/SYSTEM_MASTER/

# System Master Build Plan

**Classification:** FOUNDATIONAL — Phased build plan; primary architecture reference: docs/SYSTEM_MASTER/

**Purpose:** Complete phased plan for building a parallel JSON-driven UI and logic pipeline that will eventually replace most TSX-driven rendering and behavior, while keeping the legacy system intact during migration.

**Source of truth:** [MAP.md](MAP.md), [ROADMAP.md](ROADMAP.md), [PLAN_ACTIVE.md](PLAN_ACTIVE.md). No code changes in this document; plan only.

---

## Principles

- **Parallel pipeline:** New JSON-driven rendering and behavior run alongside existing TSX/engine paths; legacy remains functional until migration completes.
- **Single render path for JSON:** All JSON screens/skins are rendered by JsonRenderer + Registry; no ad-hoc TSX that duplicates molecule UI.
- **Contract-first:** Molecule universe, behavior tokens, and state shape are defined and validated before scaling the pipeline.
- **Docs-first:** Per [WORKFLOW_RULES.md](WORKFLOW_RULES.md), update PLAN_ACTIVE and MAP when starting or finishing phases.

---

## Phase 1 — JSON Molecule UI Foundation

**Objective:** Lock the JSON molecule UI as the single foundation for all future JSON-driven screens: 12 molecules + 9 atoms, Registry, definitions, palette, and a clear contract. Ensure every JSON screen is rendered only via JsonRenderer with no TSX duplication of molecule structure.

**Systems touched:**
- **Renderer:** JsonRenderer, Registry (`src/engine/core/json-renderer.tsx`, `registry.tsx`)
- **Compounds:** 12 molecules, definitions (`src/compounds/ui/12-molecules/`, `definitions/*.json`), compound registry (`src/compounds/ui/index.ts`)
- **Atoms:** 9 atoms and definitions (`src/components/9-atoms/`, `definitions/`)
- **Palette:** palette-store, palette-resolve-token, palette-resolver (`src/engine/core/`)
- **Contract:** blueprint-universe validator (`src/contracts/`)

**Key deliverables:**
- Contract document: molecule universe (allowed types, variants, sizes, content slots, which molecules may carry behavior).
- All molecule definition JSONs complete and aligned with contract (including e.g. Button `icon` variant).
- Registry is the single map from JSON `type` to React component; no orphan or duplicate mappings.
- content.manifest.txt generation (or equivalent) so content keys are enforced at compile time.
- Proof: any app.json under apps-offline renders correctly via JsonRenderer with no TSX screen providing the same structure.

**Dependencies:**
- None (foundation phase).

**Done when:**
- Contract is written and validator (compile-time and optionally runtime) enforces it.
- All 12 molecules + 9 atoms are in Registry with definitions; pipeline proof passes.
- Changing only JSON (blueprint/content → app.json) changes the screen; no TSX change required for content or structure.
- MAP.md section "JSON Renderer + Registry" and "What Is Fully Wired" updated to reflect locked foundation.

---

## Phase 2 — Layout & Skin System Completion

**Objective:** Complete the layout and skin system so that website, app, and learning experiences are fully driven by JSON (skin documents), composeScreen, region-policy, and shells—with no TSX hardcoding of hero/header/cards. Shells and experience profiles provide all visual differentiation.

**Systems touched:**
- **Layout engine:** composeScreen, region-policy (`src/layout/layout-engine/`)
- **Profile resolver and presentation profiles:** `src/layout/profile-resolver.ts`, `src/layout/presentation/*.profile.json`
- **Shells:** WebsiteShell, AppShell, LearningShell (`src/lib/site-skin/shells/`)
- **SiteSkin:** loadSiteSkin, applySkinBindings, siteSkinToRoleTaggedNodes, collectRegionSections (`src/lib/site-skin/`)
- **Layout store:** experience and profile selection (`src/engine/core/layout-store.ts`)
- **JsonRenderer:** applyProfileToNode for section/region layout from profile only

**Key deliverables:**
- WebsiteShell, AppShell, LearningShell are visually distinct (marketing vs productivity vs learning) using only palette tokens and profile-driven layout.
- Experience dropdown drives only layout-store `experience`; same skin JSON reflows via composeScreen + getRegionOrder per experience.
- Skin JSON (nodes or regions) → loadSiteSkin / applySkinBindings → composeScreen → shells → JsonRenderer; proof path documented and reproducible.
- Section IDs and page→section mapping fixed (normalizeSiteData vs compileSiteToSchema) so dropdowns and viewer show correct sections per page.

**Dependencies:**
- Phase 1 (JSON molecule UI foundation) so all skin content is molecule/atom nodes only.

**Done when:**
- Switching experience (Website / App / Learning) on the same URL shows the same content in clearly different layouts; all styling from palette + profiles.
- One content edit in skin JSON updates the visible screen without any TSX edit.
- MAP.md "Layout Engine" and "Shell System" and "What Is Fully Wired" updated; any remaining "What Exists But Is Not Wired" for layout/shells resolved or documented.

---

## Phase 3 — New JSON-Based Behavior / Logic Pipeline (Parallel to TSX Engines)

**Objective:** Establish a complete JSON-based behavior and logic pipeline that runs in parallel to the existing TSX engine path. All JSON molecule interactions (tap, navigate, action, state mutation) flow through a single contract-aligned path (CustomEvent → behavior-listener → state-store → state-resolver); no duplication of logic in TSX screens for JSON-driven flows. Legacy TSX engines remain unchanged and used only for TSX screens.

**Systems touched:**
- **Behavior listener:** `src/engine/core/behavior-listener.ts` (JSON path only for JSON-origin events)
- **State store and resolver:** `src/state/state-store.ts`, `src/state/state-resolver.ts` (append-only log, deriveState)
- **Behavior runner / engine:** `src/behavior/behavior-runner.ts`, behavior-engine.ts, verb resolver, interaction/navigation maps
- **Contract:** behavior tokens (tap, go, back, etc.), mutation verbs (append, update, remove), normalization from legacy `state:*` / `logic.action` to canonical form
- **Blueprint compiler:** emit contract behavior tokens and mutation verbs where applicable

**Key deliverables:**
- Canonical behavior representation: Interaction, Navigation, Action, Mutation (contract tokens); legacy `state:*` and `logic.action` normalized or gated behind a compatibility flag.
- Behavior validator: only actionable molecules may execute behaviors; Modal only close; enforced at compile-time and optionally at render-time.
- Single JSON behavior path: molecule events → behavior-listener → state-mutate or navigate; state-store → deriveState → JsonRenderer re-render. TSX engine path (recordInteraction, interpretRuntimeVerb) used only when the event originated from a TSX screen.
- Blueprint parser extended to read behavior tokens and slot lists; content.manifest and key validation in place.

**Dependencies:**
- Phase 1 (contract and molecule foundation).
- Phase 2 optional for full skin behavior; can start in parallel with Phase 2 for apps-offline screens only.

**Done when:**
- All JSON-origin interactions are handled by the JSON behavior pipeline; no behavior logic duplicated in TSX for JSON screens.
- Contract validator passes (or fails explicitly) on behavior and content keys; pipeline proof still passes with contract-aligned app.json.
- MAP.md "Engine / Logic System" updated to describe JSON vs TSX behavior paths clearly; "What Is Missing Entirely" for behavior validator and contract tokens addressed.

---

## Phase 4 — Ripper + Compiler Pipeline for Molecule-Driven Screens

**Objective:** A single, reliable pipeline from raw site data (ripper/snapshot) and authoring inputs (blueprint, content) to molecule-driven screens (app.json, skin JSON). No duplicate or divergent compiler paths; section IDs and page derivation are consistent; generated screens are valid against the contract and render correctly via JsonRenderer/SiteSkin.

**Systems touched:**
- **Ripper / scan:** `src/scripts/websites/adapters/scan-adapter.ts` (product URL discovery, HTML snapshot)
- **Normalizer:** normalizeSiteData, derivePagesFromNav (`src/lib/site-compiler/`, `src/lib/site-normalizer/`)
- **Schema compiler:** compileSiteToSchema, compileSiteToScreenModel (`src/lib/site-compiler/`)
- **Blueprint compiler:** `src/scripts/blueprint.ts` (blueprint.txt, content.txt → app.json)
- **Skin compile:** compileSkinFromBlueprint, mappers (`src/lib/site-skin/`)
- **Website build:** build-site.ts (`npm run website`); compile.ts (`npm run compile`)
- **Legacy:** `src/lib/siteCompiler/` (normalize, compileSite)—decide consolidate or deprecate

**Key deliverables:**
- Raw snapshot → normalizeSiteData → compileSiteToSchema → compiled/schema.json, normalized.json; section IDs preserved from normalizer through schema (no regeneration that breaks viewer).
- Ripper output (or equivalent) can feed skin JSON generation: product data + template → skin JSON for product/marketing pages.
- Blueprint + content (+ content.manifest) → app.json with contract-compliant behavior and content keys; content.manifest.txt generated and keys enforced.
- Single documented path: "ripper → normalized → schema" and "blueprint/content → app.json" and "site data + template → skin JSON"; legacy siteCompiler path either removed or clearly marked legacy with migration date.

**Dependencies:**
- Phase 1 (contract, definitions).
- Phase 2 for skin output format; Phase 3 for behavior in compiled output.

**Done when:**
- `npm run website` and `npm run blueprint` produce artifact sets that render correctly in JsonRenderer/SiteSkin; section IDs match between normalized and schema; dropdowns show correct pages/sections.
- At least one "ripper → skin JSON" path exists and is documented (e.g. product grid or PDP skin from product graph).
- MAP.md "Compilers / Scripts" and "What Exists But Is Not Wired" / "What Is Missing Entirely" updated; section ID and content.manifest gaps closed.

---

## Phase 5 — Journal System on JSON Molecules + State Logic

**Objective:** The journal experience (think, save, entries, tracks) is built entirely on JSON molecule screens and the JSON state/logic pipeline. No TSX-specific journal UI; journal state (e.g. `state.journal.*`) is produced and consumed only by the state-resolver and JSON-driven screens. Persistence and rehydration work for journal data.

**Systems touched:**
- **State resolver:** journal.* intents and derived state (`src/state/state-resolver.ts`)
- **State store:** dispatchState, persistence, rehydration (`src/state/state-store.ts`)
- **JSON screens:** apps-offline apps that implement journal (e.g. journal_track); app.json nodes with state bindings and actions
- **Behavior listener:** input-change, action with valueFrom: input, state-mutate for journal.add etc.
- **Persistence:** __app_state_log__ or equivalent; rehydrate on load

**Key deliverables:**
- Journal state shape and intents (e.g. journal.add, journal.*) defined in state-resolver; schema alignment between button payload (key, fieldKey) and resolver so writes and reads match.
- Full journal flow (type in field → save → state update → persistence → refresh → rehydrate) works with only JSON screens and the JSON behavior pipeline.
- No TSX screen required to view or edit journal; optional TSX viewer can remain for debug but is not the primary UX.
- Documented journal contract: state keys, action names, payload shape; content.manifest or equivalent for journal screens.

**Dependencies:**
- Phase 1 (molecules, Registry).
- Phase 3 (JSON behavior pipeline, state-mutate, deriveState).

**Done when:**
- A user can complete "think → type → save → see entry persisted → refresh and see entry" using only JSON-driven journal screens and the JSON pipeline.
- MAP.md and CHANGELOG updated; journal described under "Engine / Logic System" or a dedicated "Journal" subsection.

---

## Phase 6 — Planner System (Hierarchical Tasks + Auto-Priority Engine)

**Objective:** A planner system with hierarchical tasks and an auto-priority engine, driven by JSON molecules and the JSON state/logic pipeline. Task trees, due dates, completion state, and priority are stored in state and rendered with molecule UI; priority can be computed from rules (e.g. due date, dependency, manual override). Legacy TSX planner (if any) can coexist; new planner is JSON-first.

**Systems touched:**
- **State resolver:** planner.* or tasks.* intents and derived state (e.g. task tree, completion, due date, priority).
- **State store:** persistence for planner state.
- **JSON screens:** planner/task screens built from app.json or skin JSON (lists, sections, buttons, fields).
- **Logic:** auto-priority engine (pure function or small module: task tree + rules → priority order); may live in state-resolver or a dedicated planner module.
- **Behavior:** navigation to task detail, mark complete, reschedule, reorder; all via JSON behavior pipeline.

**Key deliverables:**
- Data model: hierarchical tasks (parent/child, optional due date, completion, manual priority); stored in derived state and persisted.
- Auto-priority engine: inputs = task tree + rules; output = ordered list or annotated tree for display; rules documented.
- At least one planner screen (e.g. task list, task detail) implemented as JSON molecule screen(s) with state bindings and actions.
- No requirement to migrate existing TSX planner yet; this phase adds the JSON-driven planner capability.

**Dependencies:**
- Phase 1 (molecules, Registry).
- Phase 3 (JSON behavior pipeline, state).
- Phase 5 useful but not strictly required (journal proves state + persistence pattern).

**Done when:**
- Hierarchical tasks can be created/updated/completed via JSON screens and state intents; auto-priority engine runs and influences display order.
- Planner state persists and rehydrates; one or more planner screens are molecule-driven and documented.
- MAP.md updated with "Planner" (state shape, auto-priority, screens); CHANGELOG entry.

---

## Phase 7 — Marketing / Product Page Generation via New Pipeline

**Objective:** Marketing and product pages (product grids, PDPs, category pages, marketing blocks) are generated and rendered entirely through the new JSON pipeline: product data + templates → skin JSON (or app.json) → SiteSkin/JsonRenderer. No TSX-driven product/marketing layout; optional coexistence with existing GeneratedSiteViewer during migration.

**Systems touched:**
- **Ripper / product graph:** product data, categories, images, URLs (`raw/product.graph.json`, scan-adapter, normalize)
- **Site compiler:** compileSiteToSchema, normalizeSiteData; product-to-molecule mappers (`src/lib/site-skin/mappers/productToMoleculeNodes.ts`, `siteDataToSlots.ts`)
- **Skin compile:** template + product data → skin JSON per page or per type (e.g. PDP template → product page skin).
- **SiteSkin / JsonRenderer:** render product grids, hero, CTAs, product cards as molecules.
- **Site renderer (legacy):** GeneratedSiteViewer, SiteRenderer—may remain for legacy routes until migration (Phase 8).

**Key deliverables:**
- Template(s) that define skin JSON structure for product grid, PDP, category page, or marketing block; slots filled from product data and site data.
- Build step: product graph + template(s) → skin JSON (or equivalent molecule tree) per page; written to compiled/skins/ or equivalent and loadable by SiteSkin.
- At least one marketing or product page type (e.g. product grid homepage, or PDP) is viewable end-to-end via the new pipeline (load skin → SiteSkin → JsonRenderer).
- Product URL and image URL handling consistent with MAP (normalization, slugify); no regression from existing reports.

**Dependencies:**
- Phase 2 (layout/skin completion) so shells and profiles are final.
- Phase 4 (ripper + compiler pipeline) so product data and schema are available and section/page IDs are stable.

**Done when:**
- One or more marketing/product page types are generated from templates + data and rendered via the new pipeline; no TSX layout for those pages.
- MAP.md "Skin / Content Pipeline" and "Compilers / Scripts" updated; "Marketing/product page generation" added to "What Is Fully Wired" when done.

---

## Phase 8 — Migration Strategy (Legacy TSX → JSON Pipeline)

**Objective:** Document and execute a migration strategy from legacy TSX-driven screens and engines to the JSON pipeline. Legacy system remains intact and usable until each migration step is complete; feature flags or routing allow coexistence. Final state: JSON pipeline is the default for new and migrated screens; TSX path is opt-in or deprecated for specific use cases only.

**Systems touched:**
- **App entry and routing:** `src/app/page.tsx`, `src/app/layout.tsx` (screen selector, TSX vs JSON branch, experience dropdown)
- **Screen loader:** loadScreen, TSX vs JSON path (`src/engine/core/screen-loader.ts`)
- **API:** `/api/screens/*`, `/api/sites/*` (which screens/skins are served)
- **Engines:** TSX-only runtime (interpretRuntimeVerb, interaction-controller) vs JSON behavior-listener; state store shared.
- **Documentation:** MAP.md, ROADMAP.md, PLAN_ACTIVE.md, START_HERE.md; migration runbook

**Key deliverables:**
- **Migration runbook:** Ordered list of screen types or features to migrate; for each: legacy entry point, JSON replacement (screen/skin path), routing or feature-flag change, verification steps, rollback.
- **Coexistence rules:** How TSX and JSON screens are selected (URL, query, or config); no duplicate behavior logic; shared state store and persistence.
- **Deprecation sequence:** Which TSX screens or engine paths are deprecated when, and how users/developers are directed to JSON equivalents.
- **MAP.md post-migration:** "What Is Fully Wired" and "What Exists But Is Not Wired" updated; legacy paths clearly marked as legacy/deprecated; JSON pipeline is the primary path for screens and behavior.
- Optional: feature flag or config (e.g. `PREFER_JSON_SCREENS`) to switch default to JSON when ready.

**Dependencies:**
- Phases 1–7 as needed for the screens being migrated (e.g. journal migrated in Phase 5; planner in Phase 6; marketing pages in Phase 7).
- No single dependency; migration can be incremental per screen type.

**Done when:**
- Migration runbook is written and agreed; at least one major screen type or flow has been migrated from TSX to JSON and documented.
- MAP.md reflects "primary path = JSON pipeline" and "legacy = TSX (opt-in or deprecated)"; ROADMAP/PLAN_ACTIVE updated.
- CHANGELOG and WORKFLOW_RULES followed (MAP and docs updated after structural changes).

---

## Phase Summary Table

| Phase | Name | Primary outcome |
|-------|------|------------------|
| 1 | JSON Molecule UI Foundation | Contract + Registry + definitions locked; JsonRenderer is the only render path for JSON. |
| 2 | Layout & Skin Completion | Shells + profiles + composeScreen; shippable skins from JSON; section ID fix. |
| 3 | JSON Behavior/Logic Pipeline | Parallel JSON behavior path; contract tokens; no duplication with TSX engines. |
| 4 | Ripper + Compiler Pipeline | Single path from raw/blueprint to app.json and skin JSON; content.manifest; section ID consistency. |
| 5 | Journal on JSON + State | Journal flows (think/save/persist/rehydrate) on molecule screens and state only. |
| 6 | Planner (Tasks + Auto-Priority) | Hierarchical tasks, auto-priority engine, JSON-driven planner screens. |
| 7 | Marketing/Product Page Generation | Product/marketing pages generated and rendered via new pipeline only. |
| 8 | Migration Strategy | Runbook, coexistence, deprecation; MAP updated; JSON pipeline is primary. |

---

*This plan is the master build plan for the JSON pipeline. Align ROADMAP.md and PLAN_ACTIVE.md with these phases as work proceeds. Per WORKFLOW_RULES: update PLAN_ACTIVE before starting a phase; append CHANGELOG after completing work; reflect major structural changes in MAP.md.*
