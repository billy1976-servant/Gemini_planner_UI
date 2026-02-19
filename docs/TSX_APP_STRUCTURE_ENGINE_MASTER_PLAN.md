# TSX App Structure Engine — Universal Library Master Plan

**Mode:** Design + schemas + templates + resolver only. No refactor of existing planner/onboarding.

**Goal:** A universal TSX governance system where **JSON is the control plane** (templates, presets, profiles) and **TSX is the renderer/interaction layer**. Any complex TSX UI (calendar, dashboard, list, board, editor, etc.) becomes configurable by JSON templates. **Auto-discoverable by convention** — no per-screen registry.

---

## 1. Design Principles

| Principle | Meaning |
|-----------|--------|
| **JSON = control plane** | Structure type, layout params, feature flags, interaction policy come from JSON. TSX reads config and renders. |
| **TSX = renderer** | TSX owns pixels, events, and local state. It does not own *which* structure or *what* is configurable; that is JSON. |
| **Convention over registry** | Resolution by path pattern, file co-location, or metadata — never "add this screen to index.ts". |
| **Finite primitives** | A small set of structure types (6–10) covers most apps. New apps map to a type + template + overrides. |
| **One resolver** | A single control hub resolves: structure type + template + feature flags from convention (path/metadata/state). |

---

## 2. Universal App Structure Primitives (8 Types)

These are **general UI patterns**, not derived from the current repo. Each has a clear purpose and a bounded config surface.

| # | Type | Purpose | Typical use |
|---|------|--------|-------------|
| 1 | **List** | Ordered scrollable items; sort, filter, density, selection. | Feeds, inbox, search results, nav menus. |
| 2 | **Board** | Columns/lanes with cards; drag-between; optional swimlanes. | Kanban, pipelines, status boards. |
| 3 | **Dashboard** | Grid of widgets/panels; responsive breakpoints; layout presets. | Analytics, control panels, home. |
| 4 | **Editor** | Single-focus content; toolbars, sidebars, dirty state. | Rich text, forms, config editors. |
| 5 | **Timeline** | Time axis + slots; day/week/month; density, overlays, interaction policy. | Calendars, schedulers, Gantt. |
| 6 | **Detail** | Master list + detail panel; split ratio; selection sync. | Settings, contacts, item detail. |
| 7 | **Wizard** | Linear or branched steps; progress; next/back. | Onboarding, checkout, flows. |
| 8 | **Gallery** | Grid of items; aspect ratio; lightbox; masonry or uniform grid. | Media, cards, catalogs. |

**Why 8:** Covers list-like, board-like, time-based, form-like, and composite UIs without overlap. Table can be a List variant (density=table); Form can be Editor or Wizard. No more than 10 keeps the system learnable.

---

## 3. Per–Structure-Type Definition (Summary)

For **each** structure type the library defines:

- **(a) JSON schema** — Config surface (required/optional fields, enums, bounds). One file per type under `docs/TSX_APP_STRUCTURE_SCHEMAS/`.
- **(b) Templates** — Default + 3 variants (JSON). Under `docs/TSX_APP_STRUCTURE_TEMPLATES/{type}/`.
- **(c) TSX contract** — Props and/or context hooks the screen receives. What is **in** (from engine) vs **out** (callbacks). Renderer boundary: what TSX can do freely vs what JSON controls.
- **(d) Renderer boundary** — JSON controls: structure choice, layout params, feature flags, interaction policy. TSX controls: exact components, animations, local UX, data fetching (unless bound by contract).

---

## 4. Timeline/Calendar Structure (Full Spec)

Timeline is one of the eight types, with a dedicated config surface.

### 4.1 JSON config surface

- **slotMinutes** — `5 | 10 | 15 | 30 | 60` (grid grain).
- **dayStart** / **dayEnd** — Minutes from midnight (e.g. 360–1320 = 6:00–22:00).
- **density** — `"compact" | "default" | "spacious"` (slot height / total height).
- **zoom** — Optional scale factor or named preset for slot height.
- **axis** — `{ show: boolean, width?: number, position?: "left" | "right" }`.
- **overlayPolicy** — `"system" | "local"` (system = envelope owns modals/overlays; local = TSX owns).
- **viewModes** — `["day"] | ["day","week"] | ["day","week","month"]`; which are available; **defaultView** — `"day" | "week" | "month"`.
- **interaction** — `{ drag: boolean, resize: boolean, select: boolean }` (policy, not implementation).
- **dataBinding** — Contract only: `{ eventsKey?: string, tasksKey?: string, chunksKey?: string }` or adapter interface name; UI stays decoupled from data shape.

### 4.2 TSX contract (Timeline)

- **Input (from engine):** `TimelineStructureConfig` (parsed from JSON: slotMinutes, dayStart, dayEnd, density, axis, viewModes, defaultView, interaction, overlayPolicy).
- **Output (to engine):** Optional callbacks: `onSlotClick`, `onEventClick`, `onRangeSelect`, `onViewChange`. Data is supplied by app (props/context); engine does not own event/task/chunk data.

### 4.3 Renderer boundary (Timeline)

- **JSON controls:** Slot scale, day range, axis visibility/width, which views exist, default view, drag/resize/select policy, overlay policy.
- **TSX controls:** How slots/events look, animations, local tooltips, actual drag/resize implementation, data loading.

---

## 5. Universal Control Hub (Resolver)

### 5.1 Responsibility

One JSON-driven resolver chooses:

- **Structure type** (list | board | dashboard | editor | timeline | detail | wizard | gallery).
- **Template** (e.g. default, compact, dense, minimal).
- **Feature flags** (overlays, axis, etc. as per type).

### 5.2 Selection by convention (no manual registry)

Resolution order:

1. **Co-located file** — `{screenPath}.structure.json` or `{screenDir}/structure.json` next to the TSX file. Example: `HiClarify/JSX_PlannerShell.tsx` → `HiClarify/JSX_PlannerShell.structure.json` or `HiClarify/structure.json`.
2. **Path pattern** — Config file (e.g. `tsx-structure-resolver.json`) maps globs to structure type + template. Example: `**/planner*.tsx` → timeline + `timeline/default.json`.
3. **Screen metadata** — If screen JSON exists (e.g. from apps-json), a top-level `structure: { type, template, overrides }` can drive resolution.
4. **Default** — If nothing matches: `{ type: "list", template: "default" }` or a safe fallback so every TSX has a structure.

**No API:** No "register screen X as timeline". Adding a new app = (1) create TSX renderer, (2) create JSON template (or use existing), and optionally (3) add a co-located `.structure.json` or a single glob in resolver config.

### 5.3 Resolver output

```ts
interface ResolvedAppStructure {
  structureType: "list" | "board" | "dashboard" | "editor" | "timeline" | "detail" | "wizard" | "gallery";
  template: Record<string, unknown>;  // merged default + variant + overrides
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
}
```

Resolver is pure: `resolveAppStructure(screenPath: string, metadata?: ScreenMetadata): ResolvedAppStructure`.

---

## 6. Folder Layout

```
docs/
  TSX_APP_STRUCTURE_ENGINE_MASTER_PLAN.md   (this file)
  TSX_APP_STRUCTURE_SCHEMAS/
    list.json
    board.json
    dashboard.json
    editor.json
    timeline.json
    detail.json
    wizard.json
    gallery.json
  TSX_APP_STRUCTURE_TEMPLATES/
    list/       default.json, compact.json, dense.json, minimal.json
    board/      default.json, minimal.json, swimlanes.json, pipeline.json
    dashboard/  default.json, compact.json, single-column.json, wide.json
    editor/     default.json, minimal.json, sidebar-left.json, fullscreen.json
    timeline/   default.json, compact.json, day-only.json, week-month.json
    detail/     default.json, detail-right.json, detail-bottom.json, minimal.json
    wizard/     default.json, minimal.json, branched.json, linear.json
    gallery/    default.json, masonry.json, uniform.json, minimal.json

src/lib/tsx-structure/   (future implementation)
  resolver.ts            resolveAppStructure()
  types.ts               shared types
  schemas/               runtime schema validation (optional)
  (no per-screen index)
```

---

## 7. TSX Plug-In Contract (Universal)

Every structure type exposes a contract so a screen can plug in.

### 7.1 Props from engine

- **structureConfig** — The merged config for this structure type (from template + overrides). Typed per structure (e.g. `TimelineStructureConfig`).
- **featureFlags** — Resolved flags (e.g. `overlays: "system"`).
- **schemaVersion** — For compatibility/validation.

### 7.2 Context (optional)

- **useStructureConfig()** — Returns `structureConfig` for the current type.
- **useStructureActions()** — Returns callbacks the engine expects (e.g. report view change, request overlay). TSX can no-op if not needed.

### 7.3 What TSX must not assume

- TSX must not assume a fixed slot size or day range; it reads from config.
- TSX must not hardcode "we are day view only"; it reads viewModes/defaultView.
- Overlay policy comes from config; TSX requests overlay content, system may render it.

### 7.4 What TSX remains free to do

- Internal components, state, animations, styling (within palette/layout envelope if present).
- Data fetching and caching (data binding contract is key names or adapter, not implementation).
- Actual implementation of drag/resize/select (policy is JSON, behavior is TSX).

---

## 8. "Law" for Cursor Going Forward

1. **New TSX app** — Implement one of the 8 structure types; accept `structureConfig` (and optional `featureFlags`) as props or via `useStructureConfig()`. Do not hardcode layout/scale/policy that belongs in JSON.
2. **New structure need** — If a new app does not fit, first try to map to an existing type with a new template or overrides. If truly new, extend the library: add one structure type + schema + default + 3 variants + document contract; do not add a new registry.
3. **Config authority** — Anything that should differ by deployment, tenant, or feature (slot size, day range, which views, overlay policy) lives in JSON templates or resolver config, not in TSX constants.
4. **Discovery** — Prefer co-located `*.structure.json` or path-pattern in a single resolver config. Never add a manual "screen index" that must be edited for each new app.

---

## 9. Phase 1 Implementation Plan

**Objective:** Implement the smallest slice that proves the engine: resolver + one structure type (Timeline) + one TSX consumer contract.

**Files to create (in order):**

1. **`src/lib/tsx-structure/types.ts`**  
   - Shared types: `StructureType`, `ResolvedAppStructure`, `ResolverOptions`.  
   - Timeline-specific: `TimelineStructureConfig` (slotMinutes, dayStart, dayEnd, density, axis, viewModes, defaultView, interaction, overlayPolicy, dataBinding).

2. **`src/lib/tsx-structure/resolver.ts`**  
   - `resolveAppStructure(screenPath: string, metadata?: ScreenMetadata): ResolvedAppStructure`.  
   - Convention: (1) load co-located `*.structure.json` by path; (2) if not found, load resolver config (e.g. `tsx-structure-resolver.json`) and match path globs; (3) else default to list + default template.  
   - Merge: base template (from template id) + overrides from metadata or file → return merged config + structureType + schemaVersion.

3. **`docs/TSX_APP_STRUCTURE_SCHEMAS/timeline.json`** (and other 7 schemas)**  
   - JSON Schema for validation/IDE. Used by resolver to validate merged config (optional in Phase 1).

4. **`docs/TSX_APP_STRUCTURE_TEMPLATES/timeline/default.json`** (and variants)**  
   - Default + 3 variants. Resolver loads by template id from `TEMPLATES_BASE` path.

5. **`src/lib/tsx-structure/context.tsx`** (optional for Phase 1)**  
   - React context: `StructureConfigProvider` with `structureConfig` and `featureFlags`; `useStructureConfig()`, `useStructureActions()`.  
   - Enables any child TSX to consume config without prop drilling.

6. **Proof skeleton (stub)**  
   - **`src/lib/tsx-structure/ProofStructureConsumer.tsx`** — A minimal TSX component that:  
     - Calls `resolveAppStructure("ProofStructureConsumer")` (or a test path).  
     - Renders a tiny timeline-like placeholder (e.g. "Timeline: slotMinutes=30, dayStart=360").  
     - Proves that JSON config drives display and that no registry was edited.

**Dependencies:** None beyond existing React/TS. No refactor of planner or onboarding in Phase 1.

---

## 10. Minimum Viable Implementation (MVP)

**Smallest slice to prove it works:**

1. **Resolver only**  
   - `resolveAppStructure(screenPath)` with convention: read `{screenPath}.structure.json` from a fixed base path (e.g. `public/structures/` or `docs/TSX_APP_STRUCTURE_TEMPLATES/` keyed by path). If file missing, return `{ structureType: "list", template: {} }`.  
   - No glob config yet; no schema validation.

2. **One structure type: Timeline**  
   - `TimelineStructureConfig` type in `types.ts`.  
   - One template file: `timeline/default.json` with slotMinutes, dayStart, dayEnd, density, axis, viewModes, defaultView, interaction, overlayPolicy.

3. **One consumer**  
   - `ProofStructureConsumer.tsx`: resolve for a test path that has a co-located or known `timeline` structure JSON; render a single line of text with slotMinutes and dayStart.  
   - Proves: JSON → resolver → TSX display. No registry.

**Done when:** Changing `timeline/default.json` (e.g. slotMinutes 15 → 60) and re-running the proof consumer shows the new value on screen.

---

## 11. How This Reduces Chaos

- **Single control plane** — Layout, density, view modes, and interaction policy for any structure (including timeline) come from JSON. No more magic constants scattered across TSX files; one place per app (template + optional overrides) controls behavior.

- **Zero-registry scaling** — Adding a new TSX app is “add TSX file + add or reuse JSON template.” No central index, no “add to planner_screen,” no touching five files. Convention (co-located file or one glob in resolver) keeps discovery automatic.

- **Clear boundaries** — JSON owns *what* is configurable (slot size, day range, which views, overlay policy); TSX owns *how* it’s rendered and interacted with. New features (e.g. month view) are added by extending schema + template and implementing in one renderer, not by ad hoc flags in multiple screens.

---

*End of TSX App Structure Engine Master Plan. Schemas and templates live in `docs/TSX_APP_STRUCTURE_SCHEMAS/` and `docs/TSX_APP_STRUCTURE_TEMPLATES/`.*
