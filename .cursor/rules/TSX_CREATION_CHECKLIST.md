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

---

*Use with `TSX_BUILD_SYSTEM.md` (full law) and `TSX_STRUCTURE_ENGINE_OVERVIEW.md` (engine overview).*
