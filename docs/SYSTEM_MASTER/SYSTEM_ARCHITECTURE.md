# System Architecture

**Primary Architecture Reference:** This folder (`docs/SYSTEM_MASTER/`) represents the authoritative architecture of the system as of the latest refresh. Implementation code is the ultimate source of truth.

---

## End-to-end pipeline

1. **Authoring** — `blueprint.txt` + `content.txt` per app under `src/apps-offline/apps/<category>/<folder>/`.
2. **Compilation** — `npm run blueprint` runs `src/scripts/blueprint.ts`; reads blueprint + content; writes `app.json` (and optionally `content.manifest.json`). Contract validation runs warn-only.
3. **Serving** — JSON screens are served by `/api/screens/*` (files under `src/apps-offline/apps/`).
4. **Selection** — App layout/navigator sets `?screen=<path>`. `src/app/page.tsx` resolves screen path and loads via `loadScreen(path)` from `src/engine/core/screen-loader.ts`.
5. **Load** — For JSON: fetch `/api/screens/<path>`; apply default state from JSON when state is empty; return node tree. For TSX: path with `tsx:` prefix returns `{ __type: "tsx-screen", path }`; no fetch.
6. **Render (JSON path)** — Node tree + default state + profile + layout overrides are passed to `JsonRenderer` (`src/engine/core/json-renderer.tsx`). Renderer: `applyProfileToNode` (sets section layout id, card/organ overrides, compatibility); then per-node: load definition, resolve params (palette), resolve molecule layout, card preset for Card; `Registry[node.type]` → React component; recursive children. Section nodes use `resolveLayout(layout)` from `@/layout` and `LayoutMoleculeRenderer`.
7. **Render (TSX path)** — Screen component resolved from `tsx:` path; dynamic import; no JsonRenderer.
8. **Behavior (JSON)** — Molecules dispatch CustomEvents (`input-change`, `action`, `navigate`). `behavior-listener.ts` (installed in app layout) listens; routes to `dispatchState` (state-store) or `navigate()`. State store append-only log; `state-resolver` derives snapshot; JsonRenderer subscribes and re-renders.
9. **Behavior (TSX)** — TSX screens use `recordInteraction` / `interpretRuntimeVerb` (`src/logic/runtime`, `src/engine/runtime`); separate path from JSON behavior.

## Subsystem boundaries

| Subsystem | Location | Role |
|-----------|----------|------|
| **Screen source** | `src/apps-offline/apps/` | Per-app: blueprint.txt, content.txt, app.json. |
| **Screen API** | `src/app/api/screens/` | Serves files under apps-offline. |
| **Screen loader** | `src/engine/core/screen-loader.ts` | loadScreen(path); JSON fetch or tsx return; applies default state. |
| **Renderer** | `src/engine/core/json-renderer.tsx` | applyProfileToNode → resolveParams, resolveMoleculeLayout, Registry; Section → resolveLayout, LayoutMoleculeRenderer. |
| **Registry** | `src/engine/core/registry.tsx` | JSON `type` → React component (atoms, molecules, layout molecules). |
| **Layout (section)** | `src/layout/` | Page layout (section placement), component layout (inner arrangement), resolver, compatibility, LayoutMoleculeRenderer. |
| **Layout (skin)** | `src/lib/layout/` | composeScreen, region-policy, profile-resolver, template-profiles, molecule-layout-resolver, card presets, presentation profiles. |
| **Organ layout** | `src/layout-organ/` | Organ internal layout profiles and resolver; used when section has organ role. |
| **State** | `src/state/state-store.ts`, `state-resolver.ts` | Append-only log; deriveState; dispatchState; subscribe. |
| **Behavior bridge** | `src/engine/core/behavior-listener.ts` | CustomEvent → state-mutate / navigate. |
| **Blueprint** | `src/scripts/blueprint.ts` | blueprint + content → app.json. |

## Layout override flow

Overrides are **per-screen, per-section** and stored outside the layout store:

- **Section layout:** `section-layout-preset-store.ts` → `getOverridesForScreen(screenId)` → `sectionLayoutPresetOverrides`.
- **Card layout:** same store → `getCardOverridesForScreen(screenId)` → `cardLayoutPresetOverrides`.
- **Organ internal:** `organ-internal-layout-store.ts` → `getOrganInternalLayoutOverridesForScreen(screenId)` → `organInternalLayoutOverrides`.

`page.tsx` reads these and passes them into `JsonRenderer`. Inside `applyProfileToNode`, section layout id is chosen in order: **override** → **explicit node.layout** → **template default** (profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId)). Card and organ overrides are keyed by section key and applied to Card children or organ internal layout.

## Profile and template

- **Layout store** (`src/engine/core/layout-store.ts`): holds `experience` (website | app | learning), `templateId`, `mode` (template | custom), `regionPolicy`. No per-section overrides.
- **Effective profile** (in page.tsx): `getExperienceProfile(experience)` merged with `getTemplateProfile(templateId)` when template is selected; includes `defaultSectionLayoutId`, `sections`, `visualPreset`, etc. Passed as `profileOverride` to JsonRenderer.
- **Template profiles** (`src/lib/layout/template-profiles.ts`): define defaultSectionLayoutId, sections (role → layout def), visualPreset, containerWidth, etc.

See [LAYOUT_SYSTEM.md](LAYOUT_SYSTEM.md) and [LOGIC_ENGINE_SYSTEM.md](LOGIC_ENGINE_SYSTEM.md) for detail.
