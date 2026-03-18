# 0. NON-NEGOTIABLE DOCTRINE (Read First)

- **1) Current State system** — no schema; state is system-driven.
- **2) Palette system** — multi-part modular, chosen by system dropdown; never hardcoded.
- **3) Layout system** — layout-definitions; chosen by system runtime, never hardcoded into TSX.
- **4) Behavior system** — actions/engines/hooks must remain system-driven; no hardcoded flows.
- **5) Molecule contracts** — content keys + params; TSX must not invent structure.
- **6) Organ contracts** — variants + slots; blueprint-driven.
- **7) Strict BLUEPRINT.txt + CONTENT.txt adherence** — no deviation.
- **8) TSX files are dumb wrappers only** — JSON-driven; no structure/styling/content in TSX.
- **9) Compatibility across web/app/learning render layers**.
- **10) No mutation guarantee** — compileApp, runtime, registries, json-screen untouched.

**npm run apps does not validate, score, decide, infer, or choose anything.** It only scans surfaces and emits this template.
**Cursor must not ask questions; if ambiguous, suggest a change set.**

# 1. Requested System Description

- New action? YES / NO
(scan+verify+report only; non-interactive)

# 2. Building Blocks Cursor May Use (CHOOSABLE)

## 2.1 Molecules (id + allowed content keys + expected params)
- **avatar**: content keys: [media, text]; expected params: [surface, media, text]
- **button**: content keys: [label]; expected params: [surface, label, trigger]
- **card**: content keys: [title, body, media, actions]; expected params: [surface, title, body, media]
- **chip**: content keys: [title, body, media]; expected params: [surface, text, body, media]
- **field**: content keys: [label, input, error]; expected params: [surface, label, field, error]
- **footer**: content keys: [left, right]; expected params: [surface, item]
- **list**: content keys: [items]; expected params: [surface, item]
- **modal**: content keys: [title, body, actions]; expected params: [surface, title, body]
- **section**: content keys: [title]; expected params: [surface, title]
- **stepper**: content keys: [steps]
- **toast**: content keys: [message]; expected params: [surface, text]
- **toolbar**: content keys: [actions]; expected params: [surface, item]

## 2.2 Organs (id + variants + slots)
- **hero**: variants: [centered, image-bg, split-left, split-right, full-screen, short, with-cta, video-ready, right-aligned]; slots: [hero.title, hero.subtitle, hero.media, hero.cta]
- **header**: variants: [default, sticky-split, transparent, minimal, centered, full-width, mega-ready, shrink-on-scroll, with-announcement, compact, logo-center, nav-left]; slots: [header.logo, header.cta]
- **nav**: variants: [default, dropdown, mobile-collapse, centered-links]; slots: [nav.primary, nav.logo, nav.links, nav.cta]
- **footer**: variants: [multi-column, minimal, with-newsletter, centered, dense]; slots: [footer.primary, footer.columns, footer.newsletter, footer.copyright]
- **content-section**: variants: [text-only, media-left, media-right, zigzag]; slots: [content.title, content.body, content.media, content.block1, content.block2]
- **features-grid**: variants: [2-col, 3-col, 4-col, repeater]; slots: [features.items, features.title, features.cards]
- **gallery**: variants: [grid-2, grid-3, grid-4, carousel-ready]; slots: [gallery.items, gallery.title, gallery.images]
- **testimonials**: variants: [grid-3, grid-2, single-featured, carousel-ready]; slots: [testimonials.items, testimonials.title, testimonials.featured]
- **pricing**: variants: [2-tier, 3-tier, 4-tier, highlighted, minimal]; slots: [pricing.primary, pricing.title, pricing.tiers]
- **faq**: variants: [accordion, list, two-column]; slots: [faq.primary, faq.title, faq.items]
- **cta**: variants: [banner, strip, split, full-width]; slots: [cta.primary, cta.title, cta.body, cta.button]

## 2.3 Structure Types (allowed TSX wrapper families)
list, board, dashboard, editor, timeline, detail, wizard, gallery

## 2.4 Blueprint Node Grammar (allowed node types)
Choice, Flow, Section, Step, System, avatar, button, card, chip, content-section, cta, faq, features-grid, field, footer, gallery, header, hero, list, modal, nav, organ, pricing, screen, section, stepper, testimonials, toast, toolbar

# 3. System-Driven References (NOT chosen per app)

- **Palettes** (system dropdown chooses; DO NOT hardcode): apple, crazy, dark, default, elderly, french, hiclarify, kids, playful, premium, spanish, ui-atom-token
- **Layout IDs** (layout resolver chooses; DO NOT hardcode): pageLayouts: hero-centered, hero-split, hero-split-image-right, hero-split-image-left, hero-full-bleed-image, content-narrow, content-stack, image-left-text-right, features-grid-3, testimonial-band, cta-centered, test-extensible, none, organ-toolbar, organ-sidebar, organ-filterbar, organ-paginationbar, organ-selectionbar, organ-modal, organ-splitpane, organ-listcontent, organ-columnstrip, organ-boardcolumn, organ-gridlayout, organ-widgetcell, organ-editorcontent, organ-timelineruler, organ-timelinelanestrip, organ-timelinelane, organ-detailcontent, organ-wizardstepstrip, organ-wizardstepcontent, organ-gallerygrid, organ-lightbox, organism-root, organism-modal-overlay, organ-panel; componentLayouts: hero-centered, hero-split, hero-split-image-right, hero-split-image-left, hero-full-bleed-image, content-narrow, content-stack, image-left-text-right, features-grid-3, testimonial-band, cta-centered, none, organ-toolbar, organ-sidebar, organ-filterbar, organ-paginationbar, organ-selectionbar, organ-modal, organ-splitpane, organ-listcontent, organ-columnstrip, organ-boardcolumn, organ-gridlayout, organ-widgetcell, organ-editorcontent, organ-timelineruler, organ-timelinelanestrip, organ-timelinelane, organ-detailcontent, organ-wizardstepstrip, organ-wizardstepcontent, organ-gallerygrid, organ-lightbox, organism-root, organism-modal-overlay, organ-panel
- **Behaviors** (actions/engines exist; DO NOT hardcode flows): actions: logic:runCalculator, logic:run25x, logic:resolveOnboarding, diagnostics:capabilityDomain, diagnostics:sensorRead, diagnostics:system7Route, diagnostics:actionGating, diagnostics:resolveProfile, diagnostics:mediaPayloadHook, diagnostics:exportPdf, diagnostics:exportSummary, diagnostics:setCapabilityLevel, diagnostics:inputLogSnapshot, diagnostics:systemSnapshot, diagnostics:systemSignalsReadAll, diagnostics:plannerParserPipeline, diagnostics:plannerFullParseTrace, structure:addItem, structure:addItems, structure:updateItem, structure:deleteItem, structure:setBlocksForDate, structure:setActivePlanner, structure:cancelDay, structure:addFromText, structure:addJourney, structure:setParserStaging, structure:updateStagingRow, structure:confirmStaging, structure:setTaskFolderTemplate, structure:setTaskTemplateRows, structure:setParserConfig, structure:loadRuleset, structure:ensureTaskTemplateRows, structure:setScheduledSection, structure:parseToStaging, structure:reorderItems, structure:moveItem, structure:addTreeNode, structure:removeTreeNode, structure:reorderTreeChildren, dashboard:setLayout, dashboard:addWidget, dashboard:removeWidget, wizard:next, wizard:prev, wizard:goTo, calendar.today, calendar.week, calendar.month, calendar:setDay, calendar:setWeek, calendar:setMonth, calendar:setDate; engines: 25x, abc, calculator, value-comparison, value-translation, decision, flow-router, json-skin, learning, next-step-reason, onboarding-flow-router, hi-engine-runner, aggregation, parser-v4, prioritization, progression, recurrence, rule-evaluator, scheduling, structure-mapper, summary

# 4. How to Build (Cursor must generate these outputs)

## 4.1 blueprint.txt rules (strict)
- One node per line; hierarchy by indentation; type from blueprint node grammar only.
- Sections and organs use allowed node types; arrows for flow where applicable.
- **DO NOT hardcode palette, layout, or behavior in blueprint.**

## 4.2 content.txt rules (strict)
- One content block per blueprint node; keys must match molecule/organ contract (allowed content keys only).
- **DO NOT hardcode palette, layout, or behavior in content.**

## 4.3 wrapper config JSON rules (strict; TSX is dumb)
- Wrapper config comes from structure type and system; TSX consumes JSON only.
- **DO NOT hardcode palette, layout, or behavior in TSX or wrapper config.**

# 5. Cursor Fill-Out Enforcement Template (Cursor must complete)

## 5.1 TSX Wrapper Declaration
Wrapper type: ___________
Explain selection: ___________

## 5.2 Blueprint Plan
(Cursor fills)

## 5.3 Content Plan
(Cursor fills)

## 5.4 Behavior Compatibility Plan (system-driven)
Describe how you used existing behaviors WITHOUT creating new ones: ___________

## 5.5 Registry Impact Check (STOP if YES)
- New molecule? YES / NO
- New organ? YES / NO
- New layout? YES / NO
- New behavior/action? YES / NO
- New engine? YES / NO
If YES → STOP and request approval.

# 6. Full Compliance Rules (INLINED FOR REVIEW)

## .cursor/rules/TSX_BUILD_SYSTEM.md

```
# TSX Build System — Permanent Law for Building TSX Screens

This rule is the **permanent law** for how all new TSX screens must be built. It is derived from the TSX App Structure Engine (`src/lib/tsx-structure/`) and supporting docs. Existing screens (Planner, Onboarding) are **not** refactored; this governs **new** TSX only.

---

## 1. CORE PRINCIPLE

| Principle | Meaning |
|-----------|--------|
| **JSON = control plane** | Structure type, layout params, feature flags, interaction policy, and configurable behavior come from JSON (templates, screen metadata, overrides). TSX reads config and renders. |
| **TSX = renderer** | TSX owns pixels, events, and local UI state. It does **not** own *which* structure or *what* is configurable; that is JSON. |
| **Structures drive app behavior** | A small set of structure types (list, board, dashboard, timeline, editor, detail, wizard, gallery) defines how the screen behaves. Resolution is by convention, not registry. |
| **Wrapper/envelope always applies** | Every TSX screen is mounted inside `TSXScreenWithEnvelope`, which applies palette (CSS vars), layout containment, and structure config. TSX must not re-implement global layout or palette injection. |

- **Website = presentation:** Website is one presentation mode of structured content, not a separate build. Same content/structure can be presented as website, learning, app, etc. Do not hardcode experience or create a separate website pipeline.
- **No direct router/state in TSX:** TSX must not call router.push, dispatchState, or Next.js navigate. Use the behavior bridge: CustomEvent "navigate" with detail.to, or action "navigate". See installBehaviorListener in src/03_Runtime/engine/core/behavior-listener.ts.

---

## 1.1. DEFAULT FOR NEW TSX (MANDATORY)

**All newly generated TSX screens are structure-driven by default.** There is no opt-out for new screens.

- Every new TSX screen **MUST** be mounted via `TSXScreenWithEnvelope` (the app already does this on `/dev` and TSX entry points).
- Every new TSX screen **MUST** consume the resolved structure: use **`useAutoStructure()`** (default) or envelope props `structureConfig`, `structureType`, `schemaVersion`, `featureFlags`. Do not create new screens that ignore the structure system.
- The architecture in `src/lib/tsx-structure/` (resolver → envelope → `StructureConfigProvider` → `useAutoStructure()`) is the **only** supported path for new TSX. Follow `docs/TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md`.
- Exceptions: **Planner** and **Onboarding** (and other existing screens) are not refactored; this rule applies to **new** TSX only.

---

## 2. HOW ALL FUTURE TSX FILES MUST BE BUILT

- **Client components by default:** All new TSX screens must be generated as **client components** — include `"use client"` at the top of the file. This ensures consistent rendering inside the envelope and avoids hydration mismatches.

- **TSX must accept and use structure (mandatory for new screens):**
  - Structure via **`useAutoStructure()`** (default) or `useStructureConfig()` from `@/lib/tsx-structure`, or envelope props: `structureConfig`, `structureType`, `schemaVersion`, `featureFlags` (passed by the envelope from `resolveAppStructure`).
  - **Default pattern:** `const config = useAutoStructure()` — no manual engine selection; config is typed by `structureType`. Use this for all new TSX.
  - Palette via **CSS variables only**: e.g. `var(--color-bg-primary)`, `var(--color-text-primary)`, `var(--spacing-md)`. No hardcoded hex/rgb for themeable tokens.

- **TSX must NOT:**
  - Hardcode layout dimensions, slot sizes, board columns, density, or zoom in code; these come from structure config (JSON/template).
  - Assume a fixed structure (e.g. "we are day view only"); read from `useAutoStructure()` or `structureConfig` / `useStructureConfig()`.
  - Own global layout, nav, or chrome; the envelope provides layout containment and chrome slots (data attributes). TSX renders **inside** the envelope.
  - Touch raw templates or engine internals; consume structure via `useAutoStructure()` or `structureProps` only.
  - Call router.push, dispatchState, or any mutating state/navigate API; use the behavior bridge for navigation and read-only state/envelope for palette.

- **TSX must:**
  - **Consume structure** via **useAutoStructure()** or **structureProps** (envelope); treat TSX as **renderer only**. New screens must not bypass the structure system.
  - **No hardcoded content:** Titles, labels, API paths, and screen paths must come from structureConfig, config, or props — not literals in code.
  - Read config when present and use it for layout scale, view modes, interaction policy, and density.
  - Remain a **pure renderer** for structure: implement behavior (drag, resize, select) when policy says so; do not invent policy in code.
  - Rely on the existing system: resolver (`resolveAppStructure`), envelope (`TSXScreenWithEnvelope`), context (`StructureConfigProvider`), and hook (`useAutoStructure`) — no custom wiring or duplicate resolution logic in TSX.

---

## 3. STRUCTURE TYPES (DOCUMENTED)

### list
- **What it is:** Ordered, scrollable list of items; sort, filter, density, selection.
- **JSON controls:** `density`, `sort` (enabled, defaultOrder), `filter` (enabled, placement), `pagination` (mode, pageSize), `selection` (mode), `orientation` (vertical | horizontal).
- **TSX controls:** How items look, animations, local UX, data fetching; actual sort/filter/pagination implementation driven by config.

### board
- **What it is:** Columns/lanes with cards; drag-between; optional swimlanes (Kanban, pipeline).
- **JSON controls:** `columns` (source, minWidth), `cards` (minHeight, showPreview), `drag` (enabled, betweenColumnsOnly), `swimlanes` (enabled, orientation), `density`.
- **TSX controls:** Card rendering, drag/resize implementation, column headers; policy (drag on/off, swimlanes on/off) from JSON.

### dashboard
- **What it is:** Grid of widgets/panels; responsive breakpoints; layout presets.
- **JSON controls:** `grid` (columns, gap, rowHeight), `breakpoints`, `widgets` (resizable, draggable, minW, minH), `preset`.
- **TSX controls:** Widget content, drag/resize implementation, responsive behavior; grid dimensions and preset from JSON.

### timeline
- **What it is:** Time axis + slots; day/week/month views; density, overlays, interaction policy (calendars, schedulers, Gantt).
- **JSON controls:** `slotMinutes` (5|10|15|30|60), `dayStart`/`dayEnd` (minutes from midnight), `density`, `zoom`, `axis` (show, width, position), `overlayPolicy`, `viewModes`, `defaultView`, `interaction` (drag, resize, select), `dataBinding` (contract keys).
- **TSX controls:** How slots/events look, animations, tooltips, actual drag/resize/select implementation; scale, range, views, and policy from JSON.

### editor
- **What it is:** Single-focus content; toolbars, sidebars, dirty state (rich text, forms, config editors).
- **JSON controls:** `toolbar` (placement, sticky), `sidebars` (left/right: enabled, width, collapsible), `dirtyState` (indicator, confirmOnLeave), `contentArea` (maxWidth, padding).
- **TSX controls:** Toolbar/content components, sidebar content, dirty-state UI; placement and policy from JSON.

### detail
- **What it is:** Master list + detail panel; split ratio; selection sync (settings, contacts, item detail).
- **JSON controls:** `split` (orientation, masterRatio, resizable, minMaster, minDetail), `master` (position, listDensity), `detail` (emptyState, persistSelection).
- **TSX controls:** List and detail content, selection sync logic; split dimensions and behavior from JSON.

### wizard
- **What it is:** Linear or branched steps; progress; next/back (onboarding, checkout, flows).
- **JSON controls:** `steps` (source, showProgress, progressStyle), `navigation` (back, next, skip, placement), `branching` (enabled, decisionKey), `linear`.
- **TSX controls:** Step content, navigation handlers, progress UI; step source and navigation policy from JSON.

### gallery
- **What it is:** Grid of items; aspect ratio; lightbox; masonry or uniform grid (media, catalogs).
- **JSON controls:** `layout` (grid|masonry|uniform), `grid` (columns, gap, aspectRatio), `lightbox` (enabled, swipe), `density`.
- **TSX controls:** Item rendering, lightbox behavior; layout and density from JSON.

---

## 4. RESOLVER CONTRACT

- **Convention-based detection:** Structure is resolved by `resolveAppStructure(screenPath, metadata?)`. No per-screen registry. Order of resolution (as designed): (1) co-located `*.structure.json` or path pattern, (2) screen metadata `structure: { type, templateId, overrides }`, (3) default: `list` + default template.
- **Template merging:** Base template for the chosen `structureType` is merged with `overrides` from metadata (deep merge). Result is `ResolvedAppStructure.template` passed to the screen.
- **Metadata-based structure selection:** When screen JSON (e.g. from apps-json) includes `structure: { type: "timeline", templateId: "default", overrides: { slotMinutes: 30 } }`, the resolver uses that. No code change needed to add a new screen.
- **Default fallback:** If nothing matches, resolver returns `{ structureType: "list", template: defaultListTemplate, schemaVersion }`. Every TSX screen always has a structure.

---

## 5. ENVELOPE CONTRACT

- **Palette CSS var injection:** The envelope (`TSXScreenWithEnvelope`) applies palette to the wrapper div via `applyPaletteToElement(el, paletteName)`. TSX that uses `var(--color-*)`, `var(--spacing-*)`, etc. automatically follows theme. TSX must **not** call palette-store or set global palette; it consumes vars.
- **Layout containment:** Envelope sets layout mode (`full-viewport` | `contained` | `max-width` | `scroll-region`) via `getDefaultTsxEnvelopeProfile(screenPath)`. The wrapper div gets the correct minHeight, maxWidth, overflow. TSX content is **inside** this div; TSX must not replicate viewport-level layout.
- **Chrome slots (identification):** Envelope sets data attributes for nav, topBar, bottomBar, sidePanel, overlayHost. Future feature flags can drive which chrome is shown. TSX does not own global nav/chrome.
- **Why TSX files must NOT manage global layout:** Global layout, palette scope, and chrome are system concerns. Duplicating them in each TSX leads to drift and inconsistent behavior. One envelope, one contract.

---

## 6. HOW CURSOR MUST CREATE NEW TSX FILES

When the user says **"create a TSX screen"** (or equivalent), **the new screen is structure-driven by default.** No manual instruction is needed to "use the structure system" — it is the default.

1. **Client component:** Put `"use client"` at the top of the file so the screen renders consistently inside the envelope and avoids hydration mismatches.
2. **Choose structure type** from: list, board, dashboard, editor, timeline, detail, wizard, gallery. Match the user’s intent (e.g. "kanban" → board, "calendar" → timeline, "wizard flow" → wizard).
3. **Generate TSX that consumes the structure system:** Use `const config = useAutoStructure()` (default) so the correct engine and typed config are used automatically. The screen will be mounted in `TSXScreenWithEnvelope`, which provides context; the component must consume it. Alternatively accept `structureConfig`, `structureType`, etc. from the envelope. Use the resolved config for any layout scale, view modes, or interaction policy.
4. **Use palette vars only:** Style with `var(--color-bg-primary)`, `var(--color-text-primary)`, `var(--spacing-md)`, etc. No hardcoded theme colors.
5. **Do NOT hardcode:** No layout dimensions, slot sizes, board columns, density, or zoom in TSX; read from config (with safe defaults when config is absent for backward compatibility).
6. **Treat TSX as renderer only:** Implement behavior from config; do not define policy or layout constants in code. For a "calendar screen," use timeline structure and read `config.config.slotMinutes`, `config.config.dayStart`, etc. when `config.structureType === "timeline"`.

---

## 7. TIMELINE/CALENDAR SPECIAL RULES

For any TSX that implements a timeline/calendar, config-driven controls are **authoritative**:

| Control | Source | Notes |
|--------|--------|--------|
| **slotMinutes** | `structureConfig.slotMinutes` | 5 \| 10 \| 15 \| 30 \| 60. Grid grain. |
| **dayStart / dayEnd** | `structureConfig.dayStart`, `structureConfig.dayEnd` | Minutes from midnight (e.g. 360–1320 = 6:00–22:00). |
| **density / zoom** | `structureConfig.density`, `structureConfig.zoom` | compact \| default \| spacious; optional slotHeight/preset. |
| **axis mode** | `structureConfig.axis` | show, width, position (left \| right). |
| **overlays** | `structureConfig.overlayPolicy` | "system" \| "local" — who owns modals/overlays. |
| **interaction policies** | `structureConfig.interaction` | drag, resize, select (boolean policy; TSX implements behavior). |
| **view modes** | `structureConfig.viewModes`, `structureConfig.defaultView` | e.g. ["day","week","month"], defaultView "day". |

TSX must not hardcode these; it must read from `structureConfig` (typed as `TimelineStructureConfig` when structureType is `timeline`). Defaults can mirror `resolver.ts` DEFAULT_TEMPLATES.timeline only when config is missing.

---

## 8. TSX Creation Flow (Phase 2 Standard)

When generating a new TSX screen, follow this flow. No manual thinking about engines or templates.

1. **Pick structure type** — list, board, dashboard, editor, timeline, detail, wizard, or gallery.
2. **Create TSX renderer** — Component uses `useAutoStructure()` or accepts `structureProps` from the envelope. Do not hardcode layout dimensions, slot sizes, board columns, density, or zoom.
3. **Create or reuse JSON template** — Optional: add screen metadata or a path pattern so the resolver returns the right structure. Templates live in built-ins; overrides come from metadata.
4. **Optional metadata or pattern** — In apps-json: `structure: { type, templateId, overrides }`. Or resolver config path pattern. No registry.
5. **No registry edits** — Resolution is by convention (co-located stub, path pattern, metadata, default). Do not add the screen to any central index.
6. **No layout constants in TSX** — All layout/structure knobs come from resolved config. TSX is renderer only.

---

## 9. DO NOT TOUCH EXISTING SCREENS RULE

- **Planner** (e.g. `JSX_PlannerShell`, `UnifiedPlannerLayout`, `JSX_DayView`, timeline views, `planner-timeline-constants`) stays **intact**. No refactor to satisfy this rule; new timeline screens should follow the rule.
- **Onboarding** (e.g. `david-onboarding`, `engine-viewer`, legacy onboarding TSX) stays **intact**. No refactor.
- **New system applies to NEW TSX only.** Existing screens are not modified to consume `useAutoStructure()` or envelope props unless the user explicitly asks for that migration.

---

*This file is the single source of truth for Cursor when generating or reviewing new TSX screens. Reference: `src/lib/tsx-structure/`, `docs/TSX_APP_STRUCTURE_ENGINE_MASTER_PLAN.md`, `docs/TSX_CONTROL_MASTER_PLAN.md`. See also `.cursor/rules/CONTENT_AND_PRESENTATION.md` for content/presentation and template-only laws.*

```

## .cursor/rules/CONTENT_AND_PRESENTATION.md

```
# Content and Presentation — Permanent Law

- **Website is a presentation, not a separate product.** A "website" is one possible presentation of structured content. The same content (blueprint + content contract) must be morphable into website, learning flow, dashboard, presenter, planner, journal. Do not create a website subsystem. Use existing contracts and config only.
- **Blueprint and content contracts are truth.** Structure and content keys are defined in BLUEPRINT_UNIVERSE_CONTRACT.md and CONTENT_DERIVATION_CONTRACT.md. Node shape: id, type, content, behavior, children. TSX templates consume data that conforms to these contracts; they do not define new schema or content format.
- **TSX is template only.** TSX screens are dumb templates: they consume existing blueprint/content contracts, schema definitions, behavior verbs, layout/molecule system, and Director primitives. They render; they do not own routing, global state, or layout/chrome. No direct router or state in screens; use the behavior bridge (navigate action or CustomEvent "navigate").
- **No hardcoded content in TSX.** Titles, labels, API paths, and screen paths must come from config, structureConfig, or resolver. Do not hardcode feature names or route literals.
- **One state engine, one behavior bridge, one layout engine.** Do not use router.push or dispatchState inside TSX screens. Use the existing behavior listener and navigate contract.

```

## .cursor/rules/TSX_CREATION_CHECKLIST.md

```
# TSX Creation Checklist — Step-by-Step for New TSX Screens (Phase 2)

Cursor must follow this checklist every time it generates a new TSX screen. This ensures all new screens align with the TSX App Structure Engine and stay structure-driven. **Phase 2:** Prefer `useAutoStructure()`; no manual engine selection; no layout constants in TSX. See TSX_BUILD_SYSTEM.md §8 "TSX Creation Flow (Phase 2 Standard)" for the canonical flow.

**Default assumption:** All newly generated TSX screens are **structure-driven by default**. They MUST be wrapped by `TSXScreenWithEnvelope` (the app does this at mount time) and MUST consume the resolved structure via `useAutoStructure()` or envelope props (`structureConfig`, `structureType`, etc.). There is no opt-out for new screens. Planner and Onboarding are not refactored; this applies to **new** TSX only.

---

## 1. Pick structure type

- [ ] Determine the correct **structure type** from user intent:
  - **list** — feeds, inbox, search results, nav menus (ordered scrollable items).
  - **board** — Kanban, pipelines, status boards (columns + cards, drag-between).
  - **dashboard** — analytics, control panels, home (grid of widgets).
  - **editor** — rich text, forms, config editors (toolbar, sidebars, dirty state).
  - **timeline** — calendars, schedulers, Gantt (time axis, slots, day/week/month).
  - **detail** — settings, contacts, item detail (master list + detail panel).
  - **wizard** — onboarding, checkout, flows (steps, progress, next/back).
  - **gallery** — media, catalogs (grid, lightbox, masonry).
- [ ] If the screen is a mix, choose the **dominant** pattern and use that type (e.g. list with a detail panel → detail; calendar → timeline).

---

## 2. Apply template contract (mandatory for new screens)

- [ ] The component **MUST** consume structure via **`useAutoStructure()`** (default) or envelope props: `structureConfig`, `structureType`, `schemaVersion`, `featureFlags`. New screens do not bypass the structure system.
- [ ] Use **`const config = useAutoStructure()`** from `@/lib/tsx-structure` by default — no manual engine selection; config is typed by `structureType`. For deep trees, children can use the same hook or receive structureProps.
- [ ] Typed config: when `config.structureType === "timeline"`, use `config.config` as `TimelineStructureConfig`. Same for list, board, etc. Do **not** hardcode layout dimensions, slot sizes, board columns, density, or zoom; treat TSX as **renderer only**.

---

## 3. Accept appStructure / use structureConfig

- [ ] Assume the screen runs inside the envelope: config is provided by `StructureConfigProvider` (envelope). Support safe defaults when config is absent only for backward compatibility or standalone use.
- [ ] Read layout/behavior knobs from **structureConfig** (via `useAutoStructure().config` or envelope props): density, view modes, interaction policy, slot size, day range, etc. Do not hardcode these in the TSX.
- [ ] Keep the component a **pure renderer** for structure: implement behavior (e.g. drag, resize) when `structureConfig.interaction` (or equivalent) says so. Follow the architecture in `src/lib/tsx-structure/` and `docs/TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md`.

---

## 4. Use CSS vars only for theme

- [ ] Use **CSS variables** for colors and spacing: `var(--color-bg-primary)`, `var(--color-text-primary)`, `var(--spacing-md)`, `var(--font-size-sm)`, etc.
- [ ] **Do not** hardcode hex/rgb for themeable tokens. The envelope injects palette into the wrapper; TSX consumes vars.
- [ ] Exception: truly fixed branding (e.g. logo color) may use constants, but prefer vars when in doubt.

---

## 5. Avoid layout hardcoding

- [ ] **No** hardcoded layout dimensions, slot sizes, board columns, density, or zoom in TSX. These come from **useAutoStructure()** / **structureConfig** or template.
- [ ] **No** assumption that "this screen is day view only" or "we always have 12 columns"; read from config (with defaults).
- [ ] Layout **inside** the screen (e.g. flex for a toolbar) is fine; **structure-level** layout (timeline grid height, dashboard grid columns) must be config-driven. **No** registry edits; resolution is by convention.
- [ ] **No** router.push or dispatchState; use behavior bridge for navigation. No hardcoded screen paths, feature names, or content (titles, labels, API paths); use config/structure.

---

## 6. Keep UI a pure renderer

- [ ] TSX renders what **structureConfig** describes: view modes, density, interaction policy. It does **not** define policy in code (e.g. "drag is always on").
- [ ] Callbacks (e.g. onSlotClick, onViewChange) are implemented by TSX; **whether** they are enabled (e.g. drag on/off) can come from config.
- [ ] Data fetching and local state are TSX-owned; **data binding keys** (e.g. eventsKey, tasksKey) can come from config for decoupling.

---

## 7. Optional: Document metadata for this screen

- [ ] If the screen is backed by screen JSON (e.g. apps-json), consider adding `structure: { type, templateId, overrides }` so the resolver returns the right config without code changes.
- [ ] No central registry edit: resolution is by path or metadata, not by adding the screen to an index.

---

## 8. Do not touch existing screens

- [ ] **Planner** and **Onboarding** (and any other existing TSX screens) are **not** refactored as part of "creating a new TSX screen." This checklist applies to **new** TSX only.
- [ ] If the user asks to "add structure support" to an existing screen, that is a separate, explicit task — not the default when generating a new screen.

---

## Quick reference (Phase 2 standard)

| Step              | Action                                                              |
|-------------------|----------------------------------------------------------------------|
| Default           | New TSX = structure-driven by default; MUST consume via envelope + `useAutoStructure()` or structureProps |
| Pick structure    | list \| board \| dashboard \| editor \| timeline \| detail \| wizard \| gallery |
| Props/context     | **MUST** use `useAutoStructure()` or accept `structureConfig` / structureProps (no bypass) |
| Theming           | `var(--color-*)`, `var(--spacing-*)` only                           |
| Layout constants  | From config only; no hardcoded dimensions, slots, columns, density  |
| Behavior policy   | From config (e.g. interaction.drag); TSX implements                  |
| Registry          | None; resolution by convention (metadata, path pattern, default)   |
| Existing screens  | Leave Planner and Onboarding unchanged                               |
| Navigation / state | Behavior bridge only; no router.push or dispatchState in TSX        |
| Content           | No hardcoded titles, labels, API paths, or screen paths; use config/structure |

---

*Use with `TSX_BUILD_SYSTEM.md` (full law) and `TSX_STRUCTURE_ENGINE_OVERVIEW.md` (engine overview). See also `.cursor/rules/CONTENT_AND_PRESENTATION.md` for content/presentation and template-only laws.*

```

## .cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md

```
# TSX Structure Engine — Overview for AI

Short, high-clarity explanation of the TSX App Structure Engine: what it is, how it works, and how new screens plug in.

---

## What the engine is

The **TSX App Structure Engine** is a small library (`src/lib/tsx-structure/`) that makes **JSON the control plane** and **TSX the renderer** for app screens. It provides:

- **Types:** Eight structure types (list, board, dashboard, editor, timeline, detail, wizard, gallery) and shared interfaces (`ResolvedAppStructure`, `ScreenMetadata`, `TimelineStructureConfig`, etc.).
- **Resolver:** `resolveAppStructure(screenPath, metadata?)` — returns structure type, merged template config, and schema version. No per-screen registry; resolution by convention (metadata first, then default).
- **Envelope:** `TSXScreenWithEnvelope` — the required wrapper for every TSX screen. It resolves structure, applies palette (CSS vars) and layout containment, and passes `structureConfig` / `structureType` / etc. into the screen component.
- **Context:** `StructureConfigProvider` and `useStructureConfig()` so any descendant can read the resolved structure without prop drilling.
- **Single consumption hook:** `useAutoStructure()` — one hook for all structure types; returns typed config by `structureType`. TSX authors use this by default; no need to pick a specific engine (useListConfig, useTimelineConfig, etc.).
- **Profile:** `getDefaultTsxEnvelopeProfile(screenPath)` — returns layout mode, palette mode, nav, chrome slots, and app class by **path pattern** (e.g. `HiClarify/*`, `focus/*`, `onboarding`). No hardcoded screen IDs.
- **Compiled structure / blueprint-content is truth:** TSX consumes ResolvedAppStructure and (when wired) Director context. It does not define structure or feature names; those come from config and resolver. Data fed to TSX should conform to existing blueprint/content contracts (node shape: id, type, content, behavior).

---

## Default for new screens

**All newly generated TSX screens are structure-driven by default.** When generating a new TSX screen, Cursor must:

- Assume the screen will be mounted via `TSXScreenWithEnvelope` (the app does this at TSX entry points).
- Generate the component to **consume** the resolved structure via **`useAutoStructure()`** (preferred) or envelope props / `useStructureConfig()`. No new screen should be created without using the structure system.
- Follow the architecture in `src/lib/tsx-structure/` and `docs/TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md`. No custom resolution or duplicate wiring in TSX.

Planner and Onboarding (and other existing screens) are not refactored; this default applies to **new** TSX only.

---

## How it works

1. **Mount:** When a TSX screen is shown (e.g. on `/dev`), the app renders `<TSXScreenWithEnvelope screenPath={path} Component={TsxComponent} />`.
2. **Resolve:** The envelope calls `resolveAppStructure(screenPath)` (and in future can pass metadata from screen JSON). Resolver returns `structureType` + merged `template` + `schemaVersion`.
3. **Profile:** `getDefaultTsxEnvelopeProfile(screenPath)` picks layout (full-viewport, contained, max-width, scroll-region), palette (vars-only, full-scope, inherit), nav, chrome, appClass by path.
4. **Inject:** Envelope applies palette to the wrapper div (CSS variables) and layout styles. It wraps the component in `StructureConfigProvider` and passes `structureConfig`, `structureType`, `schemaVersion`, `featureFlags` as props to the Component.
5. **Render:** The TSX screen receives config as props (and can use `useStructureConfig()`) and renders using that config. No layout constants in code; behavior and scale come from JSON/template.

---

## Why it exists

- **Single control plane:** Layout, density, view modes, and interaction policy live in JSON/templates, not scattered across TSX files.
- **Zero-registry scaling:** Adding a new screen = add TSX file + (optionally) JSON or metadata. No "add this screen to index.ts" or central registry.
- **Clear boundaries:** JSON owns *what* is configurable; TSX owns *how* it’s rendered and interacted with. Reduces drift and duplicate logic.

---

## How it reduces chaos

- **One resolver** decides structure type and template for any path; one envelope applies layout and palette for any TSX.
- **Convention over registration:** Path patterns and optional metadata drive resolution. New files are picked up without editing a central list.
- **Palette and layout** are applied at the envelope; TSX only consumes CSS vars and stays inside the envelope. No competing layout or theme logic in each screen.

---

## How new screens plug into it

New screens **must** consume the structure system; it is the default. No manual instruction to "add structure support" is needed.

1. **Create a TSX component** that uses **`useAutoStructure()`** (default) or accepts `structureConfig`, `structureType`, `schemaVersion`, `featureFlags` from the envelope. All new TSX screens consume the resolved structure — do not generate screens that ignore it.
2. **Use CSS variables** for colors and spacing (`var(--color-bg-primary)`, etc.); no hardcoded theme values.
3. **Read structure config** from `useAutoStructure().config` (or envelope props) for anything configurable: slot size, day range, view modes, density, interaction policy. Do not hardcode those values.
4. **Mount as usual:** The app already wraps all TSX screens in `TSXScreenWithEnvelope` on `/dev` and at TSX entry points. No extra registration; the envelope resolves structure by path and optional metadata. **Navigation:** Do not use router.push. Use the behavior bridge (CustomEvent "navigate" or action "navigate"). **Content:** Do not hardcode titles, labels, or screen paths; use config/structure.
5. **Optional:** Add screen metadata (e.g. in apps-json) with `structure: { type: "timeline", templateId: "default", overrides: { ... } }` so the resolver returns the right config for that screen.

No refactor of existing Planner or Onboarding is required; the engine applies to **new** TSX screens, which are structure-driven by default.

---

*See `TSX_BUILD_SYSTEM.md` for the full build law and `TSX_CREATION_CHECKLIST.md` for the step-by-step checklist.*

```

## src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md

```
# HIcurv EXHAUSTIVE BLUEPRINT UNIVERSE v1.0 (LOCKED)

This file enumerates ALL POSSIBLE BLUEPRINT ELEMENTS.
Nothing here executes. Nothing here implies logic.
This is the allowed universe only.

---

## 1️⃣ MOLECULE UNIVERSE (ALL MOLECULES × VARIANTS × SIZES × CONTENT SLOTS)

```
MOLECULES
├─ Button
│  ├─ Variants: filled | tonal | outlined | text | icon
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  └─ label (text)
│  └─ Behavior: Navigation | Interaction
│
├─ Avatar
│  ├─ Variants: circle | square
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  ├─ media (image | avatar)
│  │  └─ text (optional)
│  └─ Behavior: Navigation | Interaction
│
├─ Card
│  ├─ Variants: elevated | outlined
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  ├─ body (text | markdown)
│  │  └─ media (image | video)
│  └─ Behavior: none
│
├─ Chip
│  ├─ Variants: elevated | outlined
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  ├─ body (text)
│  │  └─ media (icon | image)
│  └─ Behavior: Navigation | Interaction
│
├─ Field
│  ├─ Variants: outlined | filled
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  ├─ label (text)
│  │  ├─ input (text)
│  │  └─ error (text)
│  └─ Behavior: none
│
├─ List
│  ├─ Variants: plain | padded | dropdown
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  └─ items (data:list)
│  └─ Behavior: Navigation | Interaction
│
├─ Modal
│  ├─ Variants: centered | bottomSheet
│  ├─ Sizes: md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  └─ body (text | markdown)
│  └─ Behavior: Navigation (close)
│
├─ Section
│  ├─ Variants: standard | subtle
│  ├─ Sizes: sm | md | lg
│  ├─ Content
│  │  ├─ title (text)
│  │  └─ children (nodes)
│  └─ Behavior: none
│
├─ Footer
│  ├─ Variants: standard | dense
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  ├─ text (text)
│  │  └─ children (nodes)
│  └─ Behavior: Navigation | Interaction
│
├─ Stepper
│  ├─ Variants: primary | line
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  └─ steps (data:timeline)
│  └─ Behavior: Navigation | Interaction
│
├─ Toast
│  ├─ Variants: info | error
│  ├─ Sizes: sm | md
│  ├─ Content
│  │  └─ text (text)
│  └─ Behavior: Navigation | Interaction
│
└─ Toolbar
   ├─ Variants: info | error
   ├─ Sizes: sm | md
   ├─ Content
   │  ├─ text (text)
   │  └─ actions (nodes)
   └─ Behavior: Navigation | Interaction
```

---

## MOLECULE → ALLOWED BEHAVIOR VERBS (EXPLICIT)

### ACTIONABLE MOLECULE DEFINITION (HARD)

```
ACTIONABLE
├─ Definition
│  └─ Any molecule that allows Interaction or Navigation verbs
├─ Includes
│  ├─ Button
│  ├─ Chip
│  ├─ List (item-level)
│  ├─ Toolbar (action-level)
│  ├─ Footer (item-level)
│  ├─ Stepper
│  ├─ Toast
│  └─ Avatar
└─ Excludes
   ├─ Field
   ├─ Card
   ├─ Section
   └─ Modal (except close)
```

📌 Key lock: Only actionable molecules may execute behavior verbs.

**Edge / Interactive Molecules**

| Molecule | Allowed verbs |
|----------|----------------|
| Button   | tap \| double \| long \| go \| back \| open \| close \| route |
| Chip     | tap \| double \| long \| go \| back \| route |
| List     | (per item) tap \| select \| go \| route |
| Stepper  | tap \| swipe \| go \| back |
| Toolbar  | (actions) tap \| go \| back \| open \| close |
| Footer   | (items) tap \| go \| route |
| Avatar   | tap \| double \| go \| route |
| Toast    | tap \| close \| go |

**Non-Interactive / Structural Molecules**

| Molecule | Behavior |
|----------|----------|
| Section  | (no behaviors) |
| Card     | (no behaviors) |
| Field    | (no behaviors) |
| Modal    | close *(only) |

If a behavior appears on a molecule not listed above → invalid.

---

## CONTENT

### 1️⃣ TEXT CONTENT (LANGUAGE ONLY — STRING-BASED)

**Rule:** Human language only. No structure. No rendering logic. Output is always a string.

```
TEXT
├─ label     │ format: string │ schema: plain text       │ output: "string"
├─ title     │ format: string │ schema: plain text       │ output: "string"
├─ subtitle  │ format: string │ schema: plain text       │ output: "string"
├─ heading   │ format: string │ schema: plain text       │ output: "string"
├─ body      │ format: string │ schema: paragraphs       │ output: "string"
├─ caption   │ format: string │ schema: short text       │ output: "string"
├─ hint      │ format: string │ schema: helper text      │ output: "string"
├─ success   │ format: string │ schema: feedback text    │ output: "string"
├─ error     │ format: string │ schema: feedback text    │ output: "string"
├─ button    │ format: string │ schema: UI label         │ output: "string"
└─ markdown  │ format: string │ schema: markdown         │ output: "markdown string"
```

📌 Key lock: TEXT = string only. No objects. No arrays. No inference.

---

### 2️⃣ MEDIA CONTENT (SOURCE-ONLY, NO RENDER LOGIC)

**Rule:** Media is a reference, not a decision. Generator never sets layout, autoplay, fit, etc.

```
MEDIA
├─ image           │ format: source │ schema: URL | assetId              │ output: "string"
├─ icon            │ format: source │ schema: iconName | assetId      │ output: "string"
├─ video           │ format: source │ schema: URL                       │ output: "string"
├─ audio           │ format: source │ schema: URL                       │ output: "string"
├─ gif             │ format: source │ schema: URL                       │ output: "string"
├─ pdf             │ format: source │ schema: URL                       │ output: "string"
├─ stream          │ format: source │ schema: "@device.camera.stream"   │ output: "string"
├─ screen          │ format: source │ schema: "@device.screen.capture"  │ output: "string"
├─ logo            │ format: source │ schema: URL                       │ output: "string"
├─ badge           │ format: source │ schema: URL                       │ output: "string"
├─ avatar          │ format: source │ schema: URL                        │ output: "string"
└─ backgroundMedia │ format: source │ schema: URL                       │ output: "string"
```

📌 Key lock: MEDIA = reference only. Never behavior. Never layout.

---

### 3️⃣ DATA CONTENT

**Rule:** Data is not language. Structure is mandatory. Generator must obey schema exactly.

```
DATA
├─ json          │ format: object │ schema: any                    │ output: {}
├─ table          │ format: array  │ schema: columns, rows         │ output: { columns, rows }
├─ profile        │ format: object │ schema: name, email, avatar?   │ output: object
├─ settings       │ format: object │ schema: { key: boolean|string|number } │ output: object
├─ coords         │ format: geo    │ schema: lat, lng               │ output: object
├─ timeline       │ format: array  │ schema: time, label            │ output: array
├─ feed           │ format: array  │ schema: id, title, body        │ output: array
├─ checklist      │ format: array  │ schema: label, checked        │ output: array
├─ conversation   │ format: array  │ schema: role, message         │ output: array
├─ mesh           │ format: object │ schema: vertices, faces        │ output: object
└─ pointcloud     │ format: array  │ schema: { x, y, z }           │ output: array
```

---

## 3️⃣ INTERACTION BEHAVIOR UNIVERSE (ALL INTERACTIONS)

```
INTERACTION
├─ tap    └─ variant: none
├─ double └─ variant: none
├─ long   └─ variant: none
├─ drag   ├─ horizontal ├─ vertical └─ free
├─ scroll ├─ up └─ down
└─ swipe  ├─ left ├─ right ├─ up └─ down
```

---

## 4️⃣ NAVIGATION BEHAVIOR UNIVERSE (ALL NAVIGATION)

```
NAVIGATION
├─ go    ├─ screen → { screenId } ├─ modal → { modalId } └─ flow → { flowId }
├─ back  ├─ one ├─ all └─ root
├─ open  ├─ panel → { panelId } └─ sheet → { sheetId }
├─ close ├─ panel → { panelId } └─ sheet → { sheetId }
└─ route ├─ internal → { path } └─ external → { url }
```

---

## 5️⃣ ACTION BEHAVIOR UNIVERSE (ALL ACTIONS × DOMAINS)

```
ACTION
├─ image    ├─ crop ├─ filter ├─ frame ├─ layout └─ overlay
├─ video    ├─ filter ├─ layout ├─ motion └─ overlay
├─ audio    ├─ motion └─ overlay
├─ document ├─ frame ├─ layout └─ overlay
├─ canvas   ├─ crop ├─ frame ├─ layout └─ overlay
├─ map      ├─ layout └─ motion
└─ camera   ├─ crop ├─ filter ├─ layout └─ motion
```

---

## 6️⃣ LAYOUT PRIMITIVE UNIVERSE (STRUCTURE ONLY)

```
LAYOUT
├─ flow        ├─ row ├─ column ├─ grid ├─ stack └─ page
├─ alignment   ├─ align ├─ justify ├─ wrap └─ gap
└─ containment ├─ maxWidth ├─ padding └─ bounds
```

---

## 6️⃣+ ORGAN UNIVERSE (STRUCTURAL LAYOUT UNITS)

**Rule:** Organs are structural layout units. They expand to Section (and optionally Grid/layout) with slot placeholders. Slots are filled from the content file by slotKey. Nothing here executes.

```
ORGANS
├─ header
│  ├─ Variants: default | sticky-split | transparent | minimal | centered | full-width | mega-ready | shrink-on-scroll | with-announcement | compact | logo-center | nav-left
│  ├─ Slots: header.logo | header.cta
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ hero
│  ├─ Variants: centered | image-bg | split-left | split-right | full-screen | short | with-cta | video-ready | right-aligned
│  ├─ Slots: hero.title | hero.subtitle | hero.cta
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ nav
│  ├─ Variants: default | dropdown | mobile-collapse | centered-links
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ footer
│  ├─ Variants: multi-column | minimal | with-newsletter | centered | dense
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section | Footer
│  └─ Behavior: none
│
├─ content-section
│  ├─ Variants: text-only | media-left | media-right | zigzag
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ features-grid
│  ├─ Variants: 2-col | 3-col | 4-col | repeater
│  ├─ Slots: features.title | features.items
│  ├─ Emits: Section | Grid
│  └─ Behavior: none
│
├─ gallery
│  ├─ Variants: grid-2 | grid-3 | grid-4 | carousel-ready
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ testimonials
│  ├─ Variants: grid-2 | grid-3 | single-featured | carousel-ready
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ pricing
│  ├─ Variants: 2-tier | 3-tier | 4-tier | highlighted | minimal
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
├─ faq
│  ├─ Variants: accordion | list | two-column
│  ├─ Slots: (variant-defined)
│  ├─ Emits: Section
│  └─ Behavior: none
│
└─ cta
   ├─ Variants: banner | strip | split | full-width
   ├─ Slots: (variant-defined)
   ├─ Emits: Section
   └─ Behavior: none
```

📌 Key lock: Organ outline line declares organId + variant. Content file supplies slot values by slotKey. Compiler merges slot content into expanded tree.

---

## 7️⃣ WHAT THIS FILE IS

- A complete universe
- Generator-facing
- Deterministic
- Exhaustive
- Zero logic
- Zero defaults
- Zero omissions

---

## 8️⃣ WHAT THIS FILE IS NOT

- Not a renderer
- Not an engine
- Not a behavior executor
- Not JSON
- Not opinionated
- Not missing anything

---

## 🔒 LOCK STATEMENT

Yes. This blueprint universe contains every molecule, every content type, every interaction, every navigation, every action, every layout primitive, and every organ you have defined — nothing more, nothing less.

---

## 9️⃣ STATEFUL BEHAVIOR EXTENSION (DECLARATIVE — NO EXECUTION)

```
STATEFUL-BEHAVIOR
├─ appliesTo    ├─ Button ├─ Chip ├─ List (item-level) ├─ Toolbar (action-level) └─ Footer (item-level)
├─ excludedFrom ├─ Card ├─ Section └─ Modal (except close)
├─ scope        ├─ local ├─ screen ├─ flow └─ global
├─ lifetime     ├─ transient ├─ session └─ persistent
└─ dataShape    ├─ scalar ├─ object └─ collection
```

📌 Key lock: State is never declared directly in the tree. State exists only as the target of a behavior verb.

---

## 🔟 STATE MUTATION VERBS (BEHAVIOR-LEVEL)

```
MUTATION-VERBS
├─ append ├─ update ├─ remove ├─ clear ├─ replace ├─ merge
├─ reorder ├─ toggle ├─ increment ├─ decrement ├─ undo └─ redo
```

📌 Key lock: Mutation verbs are behaviors. Mutation verbs require an existing state target. Mutation verbs never create UI.

---

## 1️⃣1️⃣ SEMANTIC ALIAS VERBS (BEHAVIOR-LEVEL)

```
SEMANTIC-VERBS
├─ save      → append | update
├─ submit    → append
├─ reset     → clear
├─ cancel    → undo
├─ confirm   → commit (engine-defined)
├─ dismiss   → no-op
├─ complete  → update
├─ acknowledge → update
└─ exit      → navigation
```

📌 Key lock: Semantic verbs are human-facing aliases. They always resolve to mutation or navigation internally.

---

## 1️⃣2️⃣ VALIDATION GUARDS (PRE-MUTATION)

```
VALIDATION
├─ required ├─ minLength ├─ maxLength ├─ pattern ├─ numeric
├─ email ├─ url ├─ enum ├─ unique ├─ range └─ custom
```

📌 Key lock: Validation blocks mutation only. Validation never blocks interaction or navigation.

---

## 1️⃣3️⃣ BINDING RULES (HARD)

```
RULES
├─ Field           ├─ produces candidate data only ├─ never executes verbs └─ never mutates state
├─ Actionable molecules ├─ execute behavior verbs └─ may target state
├─ Interaction verbs    └─ never mutate data
├─ Navigation verbs     └─ never mutate data
├─ Mutation verbs       └─ execute only via actionable molecules
└─ Omitted behavior    └─ implies no mutation
```

📌 Key lock: State exists only as the target of a behavior verb.

---

## 1️⃣4️⃣ CANONICAL STATEFUL PATTERN (REFERENCE ONLY)

```
PATTERN
├─ Input produces candidate data
├─ Button triggers semantic verb
├─ Semantic verb resolves to mutation
├─ Mutation targets state
├─ Validation gates mutation
└─ Undo / Redo replay mutation log
```

📌 Reference only. No syntax. No execution. No new molecules.

---

## 🔒 FINAL LOCK

- No new universes
- No new syntax
- No new molecules
- No engine assumptions
- Fully generator-safe
- Fully deterministic
- Fully exhaustive

---

## HUMAN OUTLINE — HIERARCHICAL (STRUCTURE + FLOW)

**Rule:** Indentation = hierarchy. Arrows include target ID + target NAME (no lookup required).

Type may be a molecule/section name or an organ declaration `organ:organId` (see ORGAN OUTLINE ANNOTATION).

```
APP: ExampleApp

1.0 | Home | Section [none]
  1.1 | Welcome | Button [label] (tap)       -> 2.0 Signup
  1.1 | Welcome | Button [label] (double)    -> 3.0 Info
  1.2 | LearnMore | Button [label] (long)    -> 6.0 MediaDemo
  1.3 | Exit | Button [label] (double)       -> 4.0 Goodbye

2.0 | Signup | Section [none]
  2.1 | Email | Field [label, placeholder]
  2.2 | Password | Field [label, placeholder]
  2.3 | Submit | Button [label] (tap)         -> 5.0 Success
  2.3 | Submit | Button [label] (long)        -> 7.0 Review
  2.4 | BackHome | Button [label] (back)     -> 1.0 Home

3.0 | Info | Card [title, body]
  3.1 | InfoText | Section [body]
  3.2 | BackHome | Button [label] (back)      -> 1.0 Home
  3.3 | Details | Chip [title] (tap)          -> 8.0 Details

4.0 | Goodbye | Card [title, body]
  4.1 | ExitRoute | Button [label] (route)    -> external

5.0 | Success | Card [title, body]
  5.1 | SuccessText | Section [body]
  5.2 | Finish | Button [label] (tap)         -> 1.0 Home
  5.3 | Share | Toolbar [actions] (open)     -> 9.0 ShareSheet

6.0 | MediaDemo | Section [none]
  6.1 | Gallery | Card [media]
  6.1 | Gallery | Card [media] (swipe)       -> 6.2 NextMedia
  6.1 | Gallery | Card [media] (drag)        -> 10.0 Canvas
  6.2 | CloseDemo | Button [label] (close)   -> 1.0 Home

7.0 | Review | Section [none]
  7.1 | Steps | Stepper [steps] (swipe)      -> 7.2 Confirm
  7.2 | Confirm | Button [label] (tap)      -> 5.0 Success

8.0 | Details | Section [none]
  8.1 | InfoList | List [items] (select)     -> 3.0 Info
  8.2 | Back | Button [label] (back)         -> 3.0 Info

9.0 | ShareSheet | Modal [title, body]
  9.1 | ShareNow | Button [label] (tap)      -> route
  9.2 | Dismiss | Button [label] (close)    -> 5.0 Success

10.0 | Canvas | Card [media]
  10.1 | CropImage | Card [media] (crop)
  10.2 | ApplyFilter | Card [media] (filter)
  10.3 | Done | Button [label] (back)        -> 6.0 MediaDemo
```

No other syntax is allowed.

---

## OUTLINE BEHAVIOR ANNOTATION (ONE-WORD TOKENS ONLY)

**Purpose:** Defines how behaviors appear in the Human Outline using only the already-defined one-word verbs.

**Rule (additive):** Behaviors are optional annotations on outline lines. Behaviors use exact verb tokens already defined below. No prefixes (no "Navigation", no "Interaction", no namespaces). Order is fixed when present: `[content] (behavior)`.

**✅ Allowed behavior tokens in outline** (from existing universes only):

```
tap | double | long | drag | scroll | swipe | go | back | open | close | route | crop | filter | frame | layout | motion | overlay
```

If a token is not in this list, it is invalid.

---

## ACTION VERBS IN OUTLINE (WHEN APPLICABLE)

When an Action is used, it appears the same way — one word:

```
6.1 | Photo | Card [media] (crop)
```

The domain (image, video, etc.) is inferred from content type, per your existing contract. No extra words are added.

---

## HARD VALIDATION RULE (ADDITIVE)

- If a behavior token appears: it must exist in Sections 3–5 (Interaction / Navigation / Action); it must be allowed for that molecule.
- If omitted → behavior is none.
- If duplicated → invalid.
- If invented → invalid.

Omitted behavior = implicit tap. Multiple behaviors are expressed by parallel outline lines for the same element. Content slots listed on the molecule define exactly how many and which content types may appear (no more, no less).

---

## ORGAN OUTLINE ANNOTATION (ADDITIVE)

**Rule:** When the blueprint uses an organ, the outline line declares organId and optional variant. Slot keys are fixed per organ (see ORGAN UNIVERSE). Example:

```
1.0 | HeroBlock | organ:hero [hero.title, hero.subtitle, hero.cta]
     variant: centered

2.0 | SiteHeader | organ:header [header.logo, header.cta]
     variant: default
```

Content file supplies values keyed by the same slotKeys. Compiler injects them into the expanded organ tree. No other organ syntax is allowed.

```

## src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md

```
(MISSING FILE) src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md
```

# 7. Strict Non-Mutation Guarantee (must be present)

- compileApp untouched
- runtime untouched
- registries untouched
- renderer/json-screen untouched
- only run-apps.ts changed (for this export behavior)
