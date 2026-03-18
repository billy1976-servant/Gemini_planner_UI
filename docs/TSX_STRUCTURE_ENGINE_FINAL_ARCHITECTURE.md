# TSX Structure Engine — Final Architecture (Source of Truth)

Single source of truth for the Universal TSX Structure Engine Family. JSON is the control plane; TSX is the renderer. No per-screen registry; convention-based discovery.

---

## 1. Shared architecture

- **JSON control plane:** Structure type, template id, layout params, feature flags, and interaction policy come from JSON (templates + overrides). No scattered constants in TSX.
- **TSX renderer layer:** Components, animations, data fetching, and implementation of drag/resize/select live in TSX. Screens receive `structureConfig`, `structureType`, `schemaVersion`, `featureFlags` from the envelope.
- **Single resolver:** One entry point `resolveAppStructure(screenPath, metadata?)` returns `ResolvedAppStructure`. No manual screen index; adding a new app = (1) create TSX renderer, (2) create or reuse JSON template, (3) optionally co-located `.structure.json` or one glob in resolver config.
- **No registries:** Discovery is by file presence (co-located) or glob (single resolver config file).

---

## 2. Eight structure types

| Type      | Purpose                          | Config surface (one-line)                                                                 | Schema | Templates |
|-----------|-----------------------------------|-------------------------------------------------------------------------------------------|--------|-----------|
| list      | Ordered scrollable items          | density, sort, filter, pagination, selection, orientation                                | list.json | default, compact, dense, minimal |
| board     | Columns/lanes, cards, drag       | columns source/minWidth, cards minHeight/showPreview, drag, swimlanes, density         | board.json | default, minimal, pipeline, swimlanes |
| dashboard | Grid of widgets/panels           | grid columns/gap/rowHeight, widgets resizable/draggable/minW/minH, preset               | dashboard.json | default, compact, single-column, wide |
| editor    | Single-focus content, toolbars   | toolbar placement/sticky, sidebars left/right, dirtyState, contentArea                   | editor.json | default, minimal, sidebar-left, fullscreen |
| timeline  | Calendar/slots, views, interaction| slotMinutes, dayStart/dayEnd, density, zoom, axis, overlayPolicy, viewModes, interaction, dataBinding | timeline.json | default, compact, day-only, week-month |
| detail    | Master–detail split               | split orientation/masterRatio/resizable, master position/listDensity, detail emptyState | detail.json | default, minimal, detail-right, detail-bottom |
| wizard    | Steps, progress, next/back        | steps source/showProgress/progressStyle, navigation, branching, linear                   | wizard.json | default, minimal, linear, branched |
| gallery   | Grid of items, lightbox          | layout, grid columns/gap/aspectRatio, lightbox enabled/swipe, density                    | gallery.json | default, minimal, masonry, uniform |

Schemas live in `docs/TSX_APP_STRUCTURE_SCHEMAS/`. Template variants live in `docs/TSX_APP_STRUCTURE_TEMPLATES/{type}/`.

---

## 3. Timeline spec (full)

Defined in `docs/TSX_APP_STRUCTURE_SCHEMAS/timeline.json`; documented here for visibility.

- **slotMinutes:** `5 | 10 | 15 | 30 | 60` — time slot granularity (default 15).
- **dayStart / dayEnd:** Minutes from midnight (0–1439). Defaults 360 (6:00), 1320 (22:00).
- **density:** `compact | default | spacious` — row/slot density.
- **zoom:** Optional `{ preset?: "tight" | "default" | "wide"; slotHeight?: number (20–120) }`.
- **axis:** `{ show: boolean; width?: number (0–120); position?: "left" | "right" }` — show/hide, width, position.
- **overlayPolicy:** `system | local` — who controls overlays.
- **viewModes:** Array of `"day" | "week" | "month"`; **defaultView** one of same.
- **interaction:** `{ drag: boolean; resize: boolean; select: boolean }` — policy for drag, resize, select.
- **dataBinding:** Contract keys only; UI decoupled from data shape: `eventsKey`, `tasksKey`, `chunksKey`, `adapter`.

---

## 4. Resolver convention (order)

Resolution order in `resolveByConvention(screenPath, metadata?, resolverConfig?)`:

1. **Co-located:** `{path}.structure.json` or `{dir}/structure.json` next to TSX path. Implemented as a build-time map (stub); no dynamic file read in browser.
2. **Path-pattern config:** Resolver config (e.g. `tsx-structure-resolver.json` or bundled). Match `screenPath` against `patterns[].glob`; use first match’s `structureType` + `templateId`. Overrides from metadata merged when applicable.
3. **Screen metadata:** `metadata?.structure?.type`, `templateId`, `overrides` (e.g. from apps-json).
4. **Default:** `{ structureType: "list", templateId: "default", overrides: {} }` (or `resolverConfig.default` if provided).

No per-screen registry; discovery is by file presence or glob.

---

## 5. Per-structure renderer boundary

- **List:** JSON controls density, sort, filter, pagination, selection, orientation. TSX controls item components, animations, data fetching, and actual sort/filter implementation.
- **Board:** JSON controls columns source/minWidth, cards minHeight/showPreview, drag enabled/betweenColumnsOnly, swimlanes, density. TSX controls column/card components, drag implementation, data fetching.
- **Dashboard:** JSON controls grid columns/gap/rowHeight, widgets resizable/draggable/minW/minH, preset. TSX controls widget components, layout engine, data fetching.
- **Editor:** JSON controls toolbar placement/sticky, sidebars left/right config, dirtyState indicator/confirmOnLeave, contentArea maxWidth/padding. TSX controls toolbar/sidebar components, editor content, save/load implementation.
- **Timeline:** JSON controls slotMinutes, dayStart/dayEnd, density, zoom, axis show/width/position, overlayPolicy, viewModes, defaultView, interaction (drag/resize/select), dataBinding keys. TSX controls slot/event components, drag/resize/select implementation, data fetching.
- **Detail:** JSON controls split orientation/masterRatio/resizable, master position/listDensity, detail emptyState/persistSelection. TSX controls master list and detail panel components, selection sync, data fetching.
- **Wizard:** JSON controls steps source/showProgress/progressStyle, navigation back/next/skip/placement, branching enabled/decisionKey, linear. TSX controls step content components, validation, submit flow.
- **Gallery:** JSON controls layout (grid/masonry/uniform), grid columns/gap/aspectRatio, lightbox enabled/swipe, density. TSX controls item components, lightbox UI, data fetching.

---

## 6. Universal Control Hub

- **Entry point:** Resolver is the only entry point: `resolveAppStructure(screenPath, metadata?)` → `ResolvedAppStructure` (`structureType`, merged `template`, `schemaVersion`, `featureFlags`).
- **Template loader:** `loadTemplate(structureType, templateId, overrides?)` returns merged template from in-memory built-in map (sourced from existing template JSON). No manual index.
- **Adding a new app:** (1) Create TSX renderer. (2) Create or reuse JSON template. (3) Optionally add co-located `.structure.json` or one glob in resolver config.

---

## 7. High-level flow (diagram)

```
Screen path + optional metadata
         │
         ▼
   ┌─────────────┐
   │  Resolver   │  resolveByConvention → structureType, templateId, overrides
   │ (convention)│  loadTemplate → base template
   └──────┬──────┘  deep-merge overrides → merged template
          │
          ▼
   ResolvedAppStructure { structureType, template, schemaVersion, featureFlags }
          │
          ▼
   ┌─────────────┐
   │  Envelope   │  StructureConfigProvider(value=resolved)
   │             │  Component receives structureProps
   └──────┬──────┘
          │
          ▼
   TSX screen (structureConfig + context)
```

---

## 8. File layout

- **docs/**  
  - `TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md` (this file)  
  - `TSX_APP_STRUCTURE_SCHEMAS/*.json`  
  - `TSX_APP_STRUCTURE_TEMPLATES/{type}/*.json`

- **src/lib/tsx-structure/**  
  - `types.ts` — StructureType, ResolvedAppStructure, ScreenMetadata, all config types, ResolverConfig  
  - `resolver.ts` — re-export from resolver/index  
  - `resolver/index.ts` — resolveAppStructure  
  - `resolver/convention.ts` — resolveByConvention (co-located, path-pattern, metadata, default)  
  - `resolver/templateLoader.ts` — loadTemplate from builtin map  
  - `resolver/builtinTemplates.ts` — BUILTIN_TEMPLATES map  
  - `contracts/*.ts` — config type, renderer props, boundary per structure  
  - `engines/*.ts` — normalizer + useXConfig hook per structure; getEngine(type)  
  - `useAutoStructure.ts` — Phase 2: single hook that dispatches to correct engine; TSX authors call this only  
  - `StructureConfigContext.tsx`, `TSXScreenWithEnvelope.tsx`, `getDefaultTsxEnvelopeProfile.ts`, `ProofStructureConsumer.tsx`, `index.ts`

---

## PHASE 2 — AUTOMATION LAYER

Phase 2 makes the TSX Structure Engine operate automatically so no manual thinking is required when creating or maintaining TSX screens.

### useAutoStructure

- **Purpose:** One hook for all structure types. TSX authors call `const config = useAutoStructure()` and receive a discriminated result: `config.structureType` and `config.config` (typed by structure type). No need to choose or import a specific engine hook (useListConfig, useTimelineConfig, etc.).
- **Behavior:** Reads `useStructureConfig()` (envelope context), then uses `getEngine(structureType).toConfig(template)` internally. Returns `{ structureType, config, template, schemaVersion, featureFlags }` or `null` when outside the envelope.
- **Effect:** TSX never touches raw templates or engine selection; the hook hides resolution and normalization. Reduces cognitive load to near zero for new screens.

### Automatic template selection

- **Resolver** already supports four sources in order: (1) co-located stub, (2) path-pattern config, (3) metadata.structure, (4) default. No registry.
- **Template loader** pulls from BUILTIN_TEMPLATES for all 8 types; deep merge of overrides is stable. Template choice is fully driven by resolution; TSX does not specify template IDs.

### Generation behavior (Cursor rules)

- **.cursor/rules** (TSX_BUILD_SYSTEM.md, TSX_CREATION_CHECKLIST.md) require:
  - New TSX must assume envelope exists and consume structure via **useAutoStructure()** or **structureProps**.
  - Must NOT hardcode layout dimensions, slot sizes, board columns, density, or zoom.
  - Must treat TSX as renderer only; no registry edits; no layout constants in TSX.
- **TSX Creation Flow (Phase 2 Standard):** Pick structure type → Create TSX renderer → Create or reuse JSON template → Optional metadata or pattern → No registry edits → No layout constants in TSX.

### How this removes cognitive load

- Authors no longer need to: pick the right engine hook, import useListConfig vs useTimelineConfig, or remember which config shape goes with which type.
- One call `useAutoStructure()` gives typed config for the current screen; structure type and template selection are fully automatic from path and metadata.
- JSON remains the control plane; TSX remains the renderer. Convention + auto-discovery replace manual wiring and registries.
