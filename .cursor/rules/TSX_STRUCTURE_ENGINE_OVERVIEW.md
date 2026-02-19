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
4. **Mount as usual:** The app already wraps all TSX screens in `TSXScreenWithEnvelope` on `/dev` and at TSX entry points. No extra registration; the envelope resolves structure by path and optional metadata.
5. **Optional:** Add screen metadata (e.g. in apps-json) with `structure: { type: "timeline", templateId: "default", overrides: { ... } }` so the resolver returns the right config for that screen.

No refactor of existing Planner or Onboarding is required; the engine applies to **new** TSX screens, which are structure-driven by default.

---

*See `TSX_BUILD_SYSTEM.md` for the full build law and `TSX_CREATION_CHECKLIST.md` for the step-by-step checklist.*
