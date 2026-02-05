# Master Engine Completion Roadmap

**Classification:** FOUNDATIONAL — 9-phase layout→adaptive roadmap; primary architecture reference: docs/SYSTEM_MASTER/

**Purpose:** Single source of truth for evolving the system from **Stable Deterministic Layout Engine** to **Fully Adaptive Intelligent UI Engine**.  
**Scope:** Planning document only — no runtime code changes.

---

## PHASE 1 — Layout Engine Stabilization (Completed Baseline)

**Status: COMPLETE**

Current state of the layout engine as the baseline for all future phases.

### Documented Current State

- **Compatibility engine exists and runs**
  - [x] Layout requirement registries (JSON): `src/layout/requirements/section-layout-requirements.json`, `card-layout-requirements.json`, `organ-internal-layout-requirements.json`
  - [x] Content capability extractor: `src/layout/compatibility/content-capability-extractor.ts` — `getAvailableSlots(sectionNode, options?)`
  - [x] Requirement registry loader: `src/layout/compatibility/requirement-registry.ts` — `getRequiredSlots(layoutType, layoutId, organId?)`, `getRequiredSlotsForOrgan(organId, internalLayoutId)`
  - [x] Compatibility evaluator: `src/layout/compatibility/compatibility-evaluator.ts` — `evaluateCompatibility(args)` → `{ sectionValid, cardValid, organValid?, missing }` (pure, no store access)
  - [x] Public API: `src/layout/compatibility/index.ts` and `@/layout` exports

- **Dropdown filtering works**
  - [x] OrganPanel: Section, card, and organ internal layout options filtered by `evaluateCompatibility` (sectionValid, cardValid, organValid)
  - [x] SectionLayoutDropdown (dev): Section layout options filtered by `sectionValid` per section
  - [x] No auto-change of selection when current value is invalid; only option lists are filtered

- **No hardcoded layout defaults**
  - [x] Section layout default: `getDefaultSectionLayoutId(templateId)` reads from template JSON only (`templates[templateId].defaultLayout`); returns `undefined` when no template — no code-level fallback ID
  - [x] Template profiles (e.g. `src/lib/layout/template-profiles.ts`) hold `defaultSectionLayoutId` in data, not as a universal code constant

- **Layout JSON extensibility confirmed**
  - [x] Section layouts: `src/layout/page/page-layouts.json`; IDs consumed by resolver and compatibility engine
  - [x] Card layouts: `src/lib/layout/card-layout-presets.ts` / card presets JSON; requirements in `src/layout/requirements/card-layout-requirements.json`
  - [x] Organ internal layouts: `src/layout-organ/organ-layout-profiles.json`; requirements in `src/layout/requirements/organ-internal-layout-requirements.json`
  - [x] New layouts added via JSON/registry; compatibility engine reads from requirement registries only

- **Renderer awareness in place**
  - [x] JsonRenderer calls `evaluateCompatibility` in `applyProfileToNode` for sections; result stored locally; optional dev `console.debug`; no branching on result (non-blocking awareness)

### Phase 1 Completion Criteria

- [x] Compatibility engine is read-only and does not write to stores or override user choices
- [x] Dropdowns show only structurally compatible options
- [x] Default section layout comes from template/profile data only
- [x] Layout expansion path is JSON/registry-driven

---

## PHASE 2 — Layout System Expansion

**Goal:** Layout library grows without TypeScript edits. All new layouts plug in automatically.

### Section layouts

- [ ] Add more section layout definitions to `src/layout/page/page-layouts.json` (or equivalent JSON source)
- [ ] Add corresponding entries to `src/layout/requirements/section-layout-requirements.json` for each new layout ID (required slots)
- [ ] Confirm new IDs appear in section layout dropdown and compatibility evaluation without code changes (driven by `getLayout2Ids()` / page layout resolver and requirement registry)

### Card layouts

- [ ] Add more card layout presets (JSON or registry used by card preset resolver)
- [ ] Add entries to `src/layout/requirements/card-layout-requirements.json` for each new card layout ID
- [ ] Confirm new presets are available in OrganPanel card dropdown and compatibility filtering without TS logic changes

### Organ internal layouts

- [ ] Add more organ internal layout IDs and profiles in `src/layout-organ/organ-layout-profiles.json` (or equivalent)
- [ ] Add/update entries in `src/layout/requirements/organ-internal-layout-requirements.json`
- [ ] Confirm new internal layouts appear in organ internal layout dropdown and compatibility evaluation without TS edits

### JSON requirement registry coverage

- [ ] Audit all section layout IDs in use; ensure every ID has a requirement entry (or explicit "no required slots")
- [ ] Audit all card layout IDs; ensure full registry coverage
- [ ] Audit all organ internal layout IDs per organ; ensure full registry coverage
- [ ] Document process for adding a new layout (JSON steps only, no resolver/TS changes for ID discovery)

### Automatic plug-in behavior

- [ ] Document that section/card/organ option builders source IDs from layout JSON and registries only
- [ ] Verify that adding a new layout + requirement entry is sufficient for it to be offered and compatibility-checked
- [ ] No new layout type requires edits to compatibility-evaluator or dropdown filtering logic (only data)

---

## PHASE 3 — Layout Intelligence Layer (Non-Behavioral)

**Goal:** Make layout observable and debuggable. Analysis only — no behavior changes.

### Renderer usage tracking (dev only)

- [ ] Renderer (or a dev-only wrapper) tracks which section/card/organ layout IDs are used per screen or per section
- [ ] Emit or log layout usage patterns (e.g. counts per layout ID) in development
- [ ] No production impact; no state changes to layout selection

### Compatibility mismatch logging (dev only)

- [ ] When `evaluateCompatibility` returns invalid (sectionValid/cardValid/organValid false), log or collect mismatch details (section key, layout IDs, missing slots)
- [ ] Optional dev panel or console summary of mismatches for current screen
- [ ] No auto-fix or fallback; logging/visibility only

### Layout diagnostic tools

- [ ] Create layout diagnostic utility or dev screen: list all sections with current layout IDs, required slots, available slots, and compatibility result
- [ ] Optional: export compatibility report (e.g. JSON) for a given screen tree
- [ ] Document how to run diagnostics (e.g. dev-only route or tool)

### Layout debug visualization mode

- [ ] Add a dev-only "layout debug" mode: overlay or sidebar showing per-section layout ID, compatibility status, and optionally required vs available slots
- [ ] Toggle via env or dev flag; no impact on production rendering or layout choice

---

## PHASE 4 — Logic Engine Integration

**Goal:** Logic influences layout choice via suggestions only; no hardcoding of layout structure.

### Logic → section layout

- [ ] Define API or contract: logic engine can suggest section layout IDs per section (e.g. by section key or role)
- [ ] Renderer or layout resolution layer accepts "suggested" section layout ID; user override and explicit node.layout still win
- [ ] No hardcoded mapping from business logic to layout ID in layout engine; logic passes suggestion, engine applies if allowed by rules

### Logic → card layout

- [ ] Define API: logic engine can suggest card layout preset per section or per card
- [ ] Suggestions integrated so they do not overwrite user overrides or explicit node layout
- [ ] Layout engine remains structure-agnostic; logic only suggests, does not define structure

### Logic → organ internal layout

- [ ] Define API: logic engine can suggest organ internal layout per section/organ
- [ ] Same rules: suggestion only; user override and explicit config take precedence
- [ ] No hardcoding of organ → internal layout in engine; logic provides optional hint

### Rules and boundaries

- [ ] Document: logic engine never writes layout state directly; it provides suggestions that the layout layer may use when no override exists
- [ ] Layout engine never overwrites user overrides or explicit node.layout/organ internal overrides
- [ ] All layout selection remains explainable (override > explicit > suggestion > template default)

---

## PHASE 5 — Adaptive Layout Preference Engine

**Goal:** UI evolves based on user feedback ("more like this" / "less like this") without changing core structure.

### Preference signals

- [ ] Capture "more like this" and "less like this" signals (UI and/or API)
- [ ] Map signal to current layout context (section/card/organ layout IDs in use for that view)
- [ ] Store or forward signals for preference layer; no direct layout state mutation

### Trait vectors

- [ ] Introduce layout trait registry (e.g. `trait-registry.json`): each layout ID maps to a set of trait identifiers (e.g. media-prominent, split, dense, grid)
- [ ] Convert selected layout(s) to trait vectors when recording feedback
- [ ] Traits and mappings live in JSON/config; no layout IDs hardcoded in scoring logic

### Preference memory and scoring

- [ ] Persist preference weights per trait (e.g. per user or session): positive = prefer, negative = avoid
- [ ] Score candidate layouts by summing preference weights for their traits
- [ ] Use scores to rank or choose among compatible layouts when multiple are valid; do not override user choice or explicit layout

### Integration with layout selection

- [ ] When layout resolver has multiple compatible options (or when logic suggests multiple), preference engine can rank them
- [ ] Single "chosen" layout still flows through existing pipeline (override > explicit > suggestion > default); preference only influences which suggestion or default is used when applicable
- [ ] Document that preference engine is additive; deterministic and non-adaptive path remains available

---

## PHASE 6 — Automated Layout Composition

**Goal:** System designs page structure intelligently (higher-order automation).

### Content-density–driven stacks

- [ ] Define rules or heuristics: content density (e.g. word count, media count) influences suggested section layout stack (e.g. when to use narrow vs wide sections)
- [ ] Auto-generate layout stack (ordered list of section layout IDs) based on content analysis; output is suggestion only, not forced override
- [ ] Integrate with logic/layout pipeline so automation can be toggled or scoped (e.g. by template or experience)

### Section ordering and pacing

- [ ] Intelligent section ordering: e.g. alternate media-heavy and text-heavy sections, or follow "hero → features → social proof" patterns
- [ ] Dynamic layout pacing: e.g. wide → narrow → wide rhythm driven by rules or content
- [ ] Output: suggested section order and/or layout IDs per section; applied only when no explicit structure exists and feature is enabled

### Context-aware composition

- [ ] Define contexts (e.g. learning, business, home) and allow different composition rules or templates per context
- [ ] Auto-composition uses context to choose among layout stacks or pacing rules
- [ ] All outputs remain suggestions; user and explicit config override automated suggestions

### Boundaries

- [ ] Automated composition never overwrites user-defined section order or section layout overrides
- [ ] Composition layer is optional and explainable (e.g. "suggested by content-density rule X")

---

## PHASE 7 — Safety & Determinism Layer

**Goal:** Lock architecture integrity with permanent system rules.

### No layout hardcoding

- [ ] Audit codebase: no layout IDs or layout structure hardcoded in resolvers or engine logic (only in JSON/config and requirement registries)
- [ ] Document and enforce: new layouts are added via JSON/registry only
- [ ] CI or lint rule: no new hardcoded layout ID constants in layout engine/resolver code

### No silent fallbacks

- [ ] When no layout can be resolved (e.g. missing template default), behavior is explicit: undefined or explicit "no layout" path; no silent fallback to a different layout ID
- [ ] Log or surface missing layout in dev when result is undefined
- [ ] Document expected behavior when template has no defaultLayout or section has no override

### Engine never overwrites user overrides

- [ ] Enforce precedence: user override > explicit node layout > logic suggestion / template default
- [ ] No code path in layout engine or renderer that overwrites user-set section/card/organ layout
- [ ] Document and test: once user sets override, only user action can change it

### Compatibility engine stays read-only

- [ ] Compatibility engine never writes to layout store or node; it only evaluates and returns results
- [ ] All consumers (dropdowns, renderer, diagnostics) use result for display or guard only; no auto-selection or auto-fix in engine
- [ ] Re-audit compatibility-evaluator and requirement-registry for any side effects; remove if present

### Layout selection explainable

- [ ] Every resolved layout (section, card, organ internal) can be explained: "override from OrganPanel", "from node.layout", "suggested by logic", "template default", or "none"
- [ ] Optional: attach source metadata (e.g. `_layoutSource: "override"`) for debug and diagnostics
- [ ] Document resolution order and semantics in one place (e.g. layout resolver or MASTER_ENGINE_COMPLETION_ROADMAP)

---

## PHASE 8 — Performance Optimization

**Goal:** Scale engine without slowdown. Apply after features stabilize.

### Memoize compatibility evaluations

- [ ] Memoize `evaluateCompatibility` by (sectionNode ref or key, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId) where safe (e.g. section tree slice stable during a render)
- [ ] Avoid recomputing when same section and same layout IDs; consider React useMemo or a small cache keyed by section key + layout IDs
- [ ] Ensure cache invalidation when section content or layout IDs change

### Cache layout trait scores

- [ ] When Phase 5 trait scoring is active: cache score per (layoutId set, preference weights) or per section when inputs unchanged
- [ ] Invalidate when preference memory or layout set changes
- [ ] Keep cache size bounded (e.g. LRU or per-screen)

### Optimize dropdown filtering

- [ ] Avoid re-filtering full layout ID lists on every render when section content and layout state are unchanged
- [ ] Consider precomputed compatibility per (sectionKey, layoutId) or stable filtered lists with useMemo keyed by section + content signature
- [ ] Ensure OrganPanel and SectionLayoutDropdown do not thrash on parent re-renders

### Avoid unnecessary re-renders

- [ ] Ensure layout resolution and compatibility are not in render paths that cause broad subtree re-renders unless layout or content actually changed
- [ ] Use stable references for layout state and callbacks where passed to children
- [ ] Profile layout-heavy screens and fix hotspots (e.g. context, props, or state that trigger full tree updates)

---

## PHASE 9 — Future Experimental Systems (Optional)

**Document only; do not build in core engine.** These are candidate extensions for later.

### Layout A/B testing engine

- [ ] Concept: serve different layout variants (e.g. hero-split vs hero-centered) to segments; measure engagement or success metric; choose winning variant.
- [ ] Requirements: variant assignment, metric collection, no impact on deterministic layout path when A/B is disabled.
- [ ] Status: Document only; no implementation in roadmap.

### AI-assisted layout suggestion layer

- [ ] Concept: use ML/NLP to suggest section or card layouts from content (e.g. "this section has long text + image → suggest image-right card").
- [ ] Requirements: suggestions only; no override of user or explicit layout; explainability.
- [ ] Status: Document only; no implementation in roadmap.

### Heatmap-driven layout adjustment

- [ ] Concept: use interaction/attention heatmaps to suggest layout changes (e.g. move CTA higher, widen hero).
- [ ] Requirements: suggestions only; no automatic overwrite of user layout; privacy and performance considered.
- [ ] Status: Document only; no implementation in roadmap.

### Emotional tone layout matching

- [ ] Concept: map content or brand tone (e.g. calm, urgent) to layout traits and suggest layouts that match.
- [ ] Requirements: trait registry and tone → trait mapping; suggestion only.
- [ ] Status: Document only; no implementation in roadmap.

---

## Completion Criteria (End of All Phases)

When Phases 1–8 (and any chosen Phase 9 items) are done, the system will:

- **Dynamically determine layout compatibility** — Compatibility engine evaluates section/card/organ layouts against content; dropdowns and diagnostics use results; no silent fallbacks.
- **Allow infinite JSON layout expansion** — New section, card, and organ internal layouts added via JSON and requirement registries only; no TS changes for new IDs.
- **Support logic-driven layout suggestions** — Logic engine can suggest section, card, and organ internal layouts; suggestions integrated without overwriting user or explicit layout.
- **Adapt layouts based on user preference** — Preference engine records "more/less like this," maps layouts to traits, scores candidates; influences choice when multiple options exist.
- **Remain deterministic and non-hardcoded** — Resolution order is override > explicit > suggestion > template default; no layout IDs hardcoded in engine; no silent fallbacks.
- **Be fully observable and debuggable** — Layout usage tracking, compatibility mismatch logging, diagnostic tools, and layout debug visualization available in dev.

---

## Constraints (This Document)

- **Planning only** — This roadmap does not require or imply runtime code changes by itself.
- **No defaults or fallbacks introduced** — New work must not add hardcoded layout defaults or silent fallbacks; preserve "template/default from JSON only" and explicit undefined behavior.
- **No layout behavior change from this doc** — Implementation of phases will change behavior per phase goals; this document only defines the plan.

---

## Change Log

- [2025-02-03] Plan created.
- [2025-02-03] Moved to planned (layout domain).

---

*Last updated: 2025-02-03. Update this file when phases are completed or scope is revised.*
