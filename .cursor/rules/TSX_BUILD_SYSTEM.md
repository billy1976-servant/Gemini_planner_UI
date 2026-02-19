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

- **TSX must:**
  - **Consume structure** via **useAutoStructure()** or **structureProps** (envelope); treat TSX as **renderer only**. New screens must not bypass the structure system.
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

*This file is the single source of truth for Cursor when generating or reviewing new TSX screens. Reference: `src/lib/tsx-structure/`, `docs/TSX_APP_STRUCTURE_ENGINE_MASTER_PLAN.md`, `docs/TSX_CONTROL_MASTER_PLAN.md`.*
