# Phase 1 — Structure Engine Activation — Implementation Report

**Date:** 2025-03-11  
**Scope:** Phase 1 only (envelope wrapping). No resolver patterns, no screen logic changes.

---

## 1. Screens now wrapped with TSXScreenWithEnvelope

All TSX screens that are mounted from routes or the dev screen selector now render **inside** `TSXScreenWithEnvelope`, so `resolveAppStructure(screenPath)` runs for every TSX screen.

| Screen (path / entry) | Where wrapped | screenPath passed to envelope |
|------------------------|---------------|-------------------------------|
| **Dev page (any TSX)** | `src/app/dev/page.tsx` | `resolvedPathForEnvelope` = `screenPath.replace(/^tsx:/, "").trim()` (e.g. `(live) Business/Prayer_Stream/PrayerStreamOnboarding`) |
| **Root app (default/TSX)** | `src/app/page.tsx` | `resolvedPathForEnvelope` = `tsxScreenPath.replace(/^tsx:/, "").trim()` (e.g. `HiClarify/HiClarifyOnboarding`) |
| **Prayer Stream** | `src/app/prayer-stream/page.tsx` | `(live) Business/Prayer_Stream/PrayerStreamOnboarding` |
| **Flow (Container Creations)** | `src/app/flow/page.tsx` | `(live) Business/Container_Creations/ContainerCreationsLanding` |
| **Gospel** | `src/app/gospel/page.tsx` | `(live) Gospel/Discipleship/GospelDiscipleship` |

**Dev page:** Every TSX screen selected in the dev screen selector (including FlowViewer, ContainerCreationsLanding-2, WorkspaceLayout, HiClarifyOnboarding, etc.) is now rendered as `EnvelopeWrapped` → `TSXScreenWithEnvelope(screenPath, TsxComponent)`.

**Root app:** When the loaded screen is TSX (`data.__type === "tsx-screen"`), the component returned by `resolveTsxScreen(tsxScreenPath)` is wrapped in `TSXScreenWithEnvelope` with the same path (without `tsx:` prefix).

---

## 2. Routes modified

| File | Change |
|------|--------|
| `src/app/dev/page.tsx` | Import `TSXScreenWithEnvelope`. In the `if (TsxComponent)` block: compute `resolvedPathForEnvelope`, create `EnvelopeWrapped` that renders `<TSXScreenWithEnvelope screenPath={resolvedPathForEnvelope} Component={TsxComponent} />`, and pass `EnvelopeWrapped` to `tsxEmbedValue.getComponent` instead of `TsxComponent`. |
| `src/app/page.tsx` | Import `TSXScreenWithEnvelope`. In the `if (isTsxScreen)` block: compute `resolvedPathForEnvelope`, create `EnvelopeWrapped` that renders the envelope with `TsxComponent`, and pass `EnvelopeWrapped` to `tsxEmbedValue.getComponent` instead of `TsxComponent`. |
| `src/app/prayer-stream/page.tsx` | Import `TSXScreenWithEnvelope` and constant `SCREEN_PATH`. Replace `<PrayerStreamOnboarding />` with `<TSXScreenWithEnvelope screenPath={SCREEN_PATH} Component={PrayerStreamOnboarding} />`. |
| `src/app/flow/page.tsx` | Import `TSXScreenWithEnvelope` and constant `SCREEN_PATH`. Replace `<ContainerCreationsLanding />` with `<TSXScreenWithEnvelope screenPath={SCREEN_PATH} Component={ContainerCreationsLanding} />`. |
| `src/app/gospel/page.tsx` | Import `TSXScreenWithEnvelope` and constant `SCREEN_PATH`. Replace `<GospelDiscipleship />` with `<TSXScreenWithEnvelope screenPath={SCREEN_PATH} Component={GospelDiscipleship} />`. |

**No route URLs or dev navigation entries were changed.** Same `/prayer-stream`, `/flow`, `/gospel`, and `/dev?screen=...` behavior.

---

## 3. resolveAppStructure is now executing

- **Envelope:** `TSXScreenWithEnvelope` (in `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`) calls `resolveAppStructure(screenPath, override)` in a `useMemo` and provides the result via `StructureConfigProvider`.
- **Usage:** Every TSX screen mounted from the five places above is now a child of `TSXScreenWithEnvelope`, so for each such mount the resolver runs with the correct `screenPath` (without `tsx:`).
- **Resolver behavior:** With no resolver patterns or co-located map yet, `resolveByConvention` falls back to default (`list`, `default`, `{}`). Phase 2 will add patterns so each screen path maps to the intended structure type (e.g. wizard, dashboard).

---

## 4. No screen logic changed

- **No edits** were made under `src/01_App/` (PrayerStreamOnboarding, ContainerCreationsLanding, GospelDiscipleship, FlowViewer, WorkspaceLayout, HiClarifyOnboarding, etc.).
- **No config or JSON** was removed or altered (LandingConfig, PrayerStreamConfig, etc.).
- Screens may now receive extra props from the envelope (`structureConfig`, `structureType`, `screenPath`, `experience`, `layoutStyle`); React ignores unknown props, so existing screens are unchanged.

---

## 5. Build status

- **Lint:** No new linter errors in the modified files.
- **Build:** `npm run build` **fails** with an **existing** type error in a file not modified in Phase 1:
  - `src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx:374` — `Argument of type 'Partial<EditableNode>' is not assignable to parameter of type 'Partial<LandingFlowScreen> & Record<string, unknown>'`.
- This error is **unrelated** to the Phase 1 envelope changes. Phase 1 only adds imports and wraps the component in `TSXScreenWithEnvelope` at the mount sites above.

**Recommendation:** Fix the DevNodePanel type error separately so the project builds; then re-run build to confirm Phase 1 does not introduce regressions.

---

## 6. Confirmation checklist

| Item | Status |
|------|--------|
| Dev screen selector still loads TSX screens | Yes — same flow; component passed to embed is now envelope-wrapped. |
| Routes `/prayer-stream`, `/flow`, `/gospel` still load their screens | Yes — only the root component is wrapped; route and layout unchanged. |
| No rendering regressions from envelope | Yes — envelope adds a wrapper div and context; screen content is unchanged. |
| Existing onboarding/landing screens still function | Yes — no screen logic or config changed; they render as children of the envelope. |
| resolveAppStructure runs for every TSX screen | Yes — via `TSXScreenWithEnvelope` at all five mount points. |

---

## 7. Next step (Phase 2 — wait for approval)

Phase 2 will **only** add resolver patterns (e.g. in `convention.ts` or resolver config) so that:

- `PrayerStreamOnboarding` → wizard  
- `ContainerCreationsLanding-2` → wizard  
- `GospelDiscipleship` → wizard  
- `FlowViewer` → wizard  
- `HiClarifyOnboarding` → wizard  
- `WorkspaceLayout` → dashboard  

No screen behavior or UI changes in Phase 2.

**Do not proceed to Phase 2 until user confirms Phase 1 is acceptable.**

---

## Phase 2 — Structure resolver configuration (completed)

**Date:** 2025-03-11

Resolver patterns were added so that each app screen path resolves to the intended structure type. **No screen logic or behavior was changed.**

**File modified:** `src/lib/tsx-structure/resolver/convention.ts`

**CO_LOCATED_MAP entries added:**

| screenPath | structureType | templateId |
|------------|--------------|------------|
| `(live) Business/Prayer_Stream/PrayerStreamOnboarding` | wizard | default |
| `(live) Business/Container_Creations/ContainerCreationsLanding` | wizard | default |
| `(live) Business/Container_Creations/ContainerCreationsLanding-2` | wizard | default |
| `(live) Gospel/Discipleship/GospelDiscipleship` | wizard | default |
| `(live) Business/onboarding/FlowViewer` | wizard | default |
| `HiClarify/HiClarifyOnboarding` | wizard | minimal |
| `(live) Business/workspace/WorkspaceLayout` | dashboard | default |

When any of these screens is mounted via `TSXScreenWithEnvelope`, `resolveAppStructure(screenPath)` now returns the correct `structureType` and template (from `BUILTIN_TEMPLATES`) instead of falling back to list/default. Screens still render the same; they now receive the appropriate structure config from context for future use (e.g. Phase 3 hooks).

---

## Phase 3 — Screen normalization (completed)

**Date:** 2025-03-11

Screens were refactored to consume the structure engine via hooks. Behavior is unchanged: step content still comes from existing config/JSON; only structure chrome (progress visibility, data attributes) is driven by the engine.

**Files modified:**

| Screen | File | Changes |
|--------|------|--------|
| Prayer Stream | `(live) Business/Prayer_Stream/PrayerStreamOnboarding.tsx` | `useWizardConfig()`. `showStepProgress` from `wizardConfig.steps.showProgress` (default true). Root + step aside get `data-structure-type`, `data-wizard-progress-style`, `data-wizard-nav-placement`, `data-wizard-linear`. Step tracker aside only rendered when `showStepProgress`. |
| Container Creations Landing-2 | `(live) Business/Container_Creations/ContainerCreationsLanding-2.tsx` | Same: `useWizardConfig()`, `showStepProgress`, wizard data attributes on root; step tracker conditional on `showStepProgress`. |
| Gospel Discipleship | `(live) Gospel/Discipleship/GospelDiscipleship.tsx` | Same: `useWizardConfig()`, `showStepProgress`, wizard data attributes, conditional step tracker. |
| FlowViewer | `(live) Business/onboarding/FlowViewer.tsx` | `useWizardConfig()`. Root div gets wizard data attributes. Engine-driven step UI unchanged. |
| HiClarify Onboarding | `(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx` | `useWizardConfig()`. Root div gets wizard data attributes (progress-style default "minimal"). |
| WorkspaceLayout | `(live) Business/workspace/WorkspaceLayout.tsx` | `useDashboardConfig()`. Root div gets `data-structure-type="dashboard"`, `data-dashboard-grid-*`, `data-dashboard-widgets-*`. Layout/UI unchanged. |

**Summary:**

- **Wizard screens** use `useWizardConfig()` and expose `data-wizard-*` on the root (and optionally the step aside). Step progress is shown only when `wizardConfig.steps.showProgress` is true (default: true, so no visible change with default template).
- **Dashboard screen** uses `useDashboardConfig()` and exposes `data-dashboard-*` for grid/widget hints; no layout or behavior change.
- No existing configs or step content loading were removed. When a screen is not under the envelope or the hook returns null, defaults keep current behavior (e.g. `showStepProgress ?? true`).

---

## Follow-up: Build fixes and docs (completed)

**Build:** Two existing type errors were fixed so `npm run build` succeeds:

1. **DevNodePanel.tsx** — `onChange` from NodeInspector passes `Partial<EditableNode>`; `updateNode` expects `Partial<LandingFlowScreen> & Record<string, unknown>`. Fixed by casting at call site: `patch as Partial<LandingFlowScreen> & Record<string, unknown>`.
2. **getDevScreenKey.ts** — `ReadonlyURLSearchParams` was not resolved by the compiler. Replaced with `URLSearchParams | { get: (k: string) => string | null }` so both URLSearchParams and Next’s readonly params are accepted.

**Docs:** `.cursor/rules/TSX_BUILD_SYSTEM.md` — Section 3 now states the **eight** canonical structure types and adds the application module → structure mapping (wizard/dashboard) from Phase 2.

---

## Shared content-block renderer (completed)

**Goal:** Single implementation of `renderContentBlocks` for wizard/landing screens so layout and block types stay in one place.

**Added:** `src/lib/landing-content-blocks/`
- **types.ts** — `LandingContentBlock` (badge, paragraph, heading, checklist, audio) and `LandingContentBlocksOptions` (prayerCount/lastPrayed, isEditor/screenId/onParagraphChange, checklistHeadingClassName/checklistListClassName).
- **renderContentBlocks.tsx** — Renders all block types; supports optional inline edit (InlineEditableText) and optional checklist CSS classes for CC-2/Gospel.
- **index.ts** — Re-exports types and `renderContentBlocks`.

**Updated screens:**
- **PrayerStreamOnboarding** — Uses `renderContentBlocks` and `LandingContentBlock` from `@/lib/landing-content-blocks`; removed local renderer and content block type.
- **ContainerCreationsLanding-2** — Uses shared renderer and `LandingContentBlock`; passes editor options and `cc-stamped-checklist-heading` / `cc-stamped-checklist` when rendering content.
- **GospelDiscipleship** — Same as CC-2; uses shared renderer with editor and checklist class options.

**Result:** One place to add or change content block types (e.g. video, image) for all three screens; layout behavior unchanged; build passes.
