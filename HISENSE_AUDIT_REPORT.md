# HiSense Workspace — Structured Audit Report

**Scope:** dispatchState/state updates, event log, verb system/behavior bridge, JSON screen trees, palette-store/token resolution, hard-coded literals in UI.  
**Rule:** No files were modified; findings only.

---

## 1. dispatchState and state updates

### 1.1 dispatchState — definition and call sites

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/state/state-store.ts` | L49 `export function dispatchState(intent, payload?)` | Compliant | Canonical definition; appends to log, calls deriveState, persist(), notifies listeners. |
| `src/app/dev/page.tsx` | L17 import; L723, L730, L738, L742 | Compliant | Dispatches `layout.override` for section/card/organ presets. |
| `src/03_Runtime/engine/core/ExperienceRenderer.tsx` | L6 import; L58, L63, L67 | Compliant | Dispatches `state.update` for activeSectionKey, currentStepIndex. |
| `src/03_Runtime/engine/core/screen-loader.ts` | L19 import; L129 | Compliant | Dispatches `state:currentView` with loaded JSON state. |
| `src/app/ui/control-dock/RightFloatingSidebar.tsx` | L15 import; L195 | Compliant | Dispatches `state.update` for generic key/value. |
| `src/01_App/(live) Business/Container_Creations/ContainerCreationsWebsite.tsx` | L14 import; L40 | Compliant | Dispatches `state.update` for paletteName. |
| `src/app/layout.tsx` | L48 import; L176, L187, L196, L457, L461 | Violation (typo) | L176 uses `state:update` (colon) vs L196/L461 `state.update` (dot); inconsistent intent name. |
| `src/04_Presentation/ui/molecules/cards/EducationCard.tsx` | L6 import; L337 | Compliant | Dispatches `state.update` for education flow state. |
| `src/05_Logic/logic/actions/diagnostics.actions.ts` | L6 import; L42 | Compliant | Dispatches `state.update` for diagnostics. |
| `src/05_Logic/logic/actions/structure.actions.ts` | L5 import; L84, L311, L353, L370 | Compliant | Dispatches `state.update` for structure slice and structure_draftText. |
| `src/03_Runtime/engine/core/behavior-listener.ts` | L11 import; L63, L215, L223, L244 | Compliant | Dispatches state.update, state:currentView, journal.add. |
| `src/app/ui/control-dock/RightSidebarDock.tsx` | L15 import; L43 | Compliant | Dispatches `state.update` for key/value. |
| `src/app/components/OSBCaptureModal.tsx` | (ref in grep) | Compliant | Dispatches `journal.add` with track/key/value. |
| `src/03_Runtime/state/state-store.ts` | L134, L153, L202, L210, L215 | Compliant | Legacy bridge (state-mutate), ensureInitialView, TEST_STATE, recordScan/recordScanBatch. |

### 1.2 State updates (setState, useState setters, direct mutation)

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| Multiple (see grep) | Various | Compliant | Local React state via `useState` in UI (e.g. dev/page.tsx, layout.tsx, RightFloatingSidebar.tsx, FlowViewer.tsx, CascadingScreenMenu.tsx, etc.) — local component state only. |
| `src/03_Runtime/state/state-store.ts` | L56 `log.push`, L61 `state = deriveState(log)` | Compliant | Single write path for global state; no direct mutation of `state` other than derivation. |
| `src/03_Runtime/engine/core/current-screen-tree-store.ts` | L12–13 `setCurrentScreenTree` | Compliant | Module-level mutable store for “Save Current Layout”; separate from event log. |
| `src/03_Runtime/engine/core/palette-store.ts` | L29–34 `setPalette` mutates `activePaletteName` | Compliant | Legacy palette name store; state.values.paletteName is source of truth when set via dispatchState. |
| `src/app/layout.tsx` | L176 | Violation | Uses intent `state:update` (colon) instead of `state.update` (dot); may not be handled by state-resolver if only dot form is implemented. |

---

## 2. Event log implementation — writes and reads

### 2.1 Event log definition and writes

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/state/state-store.ts` | L14–18 (EVENT LOG comment), L21–22 `let log: StateEvent[]`, L56 `log.push({ intent, payload })` | Compliant | Single append-only log; all writes go through dispatchState. |
| `src/03_Runtime/state/state-store.ts` | L164–169 `persist()` | Compliant | Writes full log to localStorage (KEY `__app_state_log__`); skips when intent === "state.update" (L68–70). |
| `src/03_Runtime/state/persistence-adapter.ts` | L40 `saveLog(log)` | Compliant | Canonical save API; state-store currently inlines same logic (does not call saveLog). |

### 2.2 Event log reads

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/state/state-resolver.ts` | L38 `export function deriveState(log: StateEvent[])` | Compliant | Single reader: replays log to produce DerivedState (currentView, journal, values, layoutByScreen, scans, interactions). |
| `src/03_Runtime/state/state-store.ts` | L59–64 (inside dispatchState), L184–186 (inside rehydrate) | Compliant | state = deriveState(log) after each dispatch and on rehydrate. |
| `src/03_Runtime/state/state-store.ts` | L172–189 `rehydrate()` | Compliant | Reads localStorage (KEY), parses log, then deriveState(log). |
| `src/03_Runtime/state/persistence-adapter.ts` | L54 `loadLog()`, L79–81 `loadState()` | Compliant | Canonical load API; state-store rehydrate uses its own localStorage read (same key), not loadLog. |

### 2.3 Other references (documentation / dev tools)

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/07_Dev_Tools/devtools/InteractionTracerPanel.tsx` | L1894 "EVENT LOG" | Compliant | UI label only. |
| Docs (OSB_V2, PLANNER_*, 04_STATE_SYSTEM, etc.) | Various | Compliant | Describe event log and persist/rehydrate. |

---

## 3. Runtime verb system and behavior bridge

### 3.1 Where verbs are defined

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/02_Contracts_Reports/contracts/contract-verbs.ts` | L8–43 (CONTRACT_VERBS_*, CONTRACT_VERB_LIST, CONTRACT_VERBS Set) | Compliant | Single source for contract verb tokens (tap, go, back, crop, etc.) and domain inference. |
| `src/03_Runtime/behavior/behavior-verb-resolver.ts` | L5–21 `resolveBehaviorVerb(domain, verb)` | Compliant | Resolves verb against behavior-actions-6x7.json (image/video/audio/etc. domains). |
| `src/05_Logic/logic/engines/structure/parser-v4.engine.ts` | L15 DEFAULT_MODIFIER_VERBS, L43–94 (verb tokenization) | Compliant | Natural-language “verb” for structure parser; separate from UI/behavior verbs. |
| `_super_clean/configs/config/ui-verb-map.json` | (config) | Compliant | Config mapping for verbs. |

### 3.2 Where verbs are dispatched (behavior bridge)

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/engine/core/behavior-listener.ts` | L69–78 installBehaviorListener; L87–100 navigate; L283–288 CONTRACT_VERBS path; L332–369 interpretRuntimeVerb handoff | Compliant | Global behavior listener: routes navigate → navigate(); contract verbs → runBehavior; else → interpretRuntimeVerb. |
| `src/05_Logic/logic/runtime/runtime-verb-interpreter.ts` | L22–48 `interpretRuntimeVerb(verb, state)` | Compliant | Normalizes Action-style verbs and forwards to runAction. |
| `src/05_Logic/logic/runtime/action-runner.ts` | L78 (comment: verb pipeline never breaks) | Compliant | Runs registered action handlers; returns state. |
| `src/03_Runtime/engine/core/json-renderer.tsx` | L230 `behavior?.params?.verb === "close"` | Compliant | Navigation behavior close check. |
| `src/05_Logic/logic/engines/json-skin.engine.tsx` | L245 `verb: normalizeVerb(node.behavior)`, L300 `normalizeVerb` | Compliant | Normalizes behavior to verb for engine. |

### 3.3 Where components call behavior/actions

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/engine/core/behavior-listener.ts` | installBehaviorListener(navigate) called from layout/page | Compliant | Layout installs listener; JSON and TSX emit action events that this listener handles. |
| `src/03_Runtime/engine/core/json-renderer.tsx` | (emits action events for JSON buttons/behaviors) | Compliant | JSON UI triggers actions that behavior-listener receives. |
| `src/01_App/(dead) Json/apps/behavior-tests/Layout_Dropdown-2.json` | Multiple `"verb": "go"` | Compliant | JSON-defined verbs consumed by behavior bridge. |

---

## 4. JSON screen trees — definition and consumption

### 4.1 Where screens/layouts are defined as JSON

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/engine/core/safe-screen-registry.ts` | L15–39 JSON_SCREEN_PATHS | Compliant | Registry of JSON screen paths (e.g. journal_track/app.json, behavior-tests/*.json, diagnostics/*.json, generated/*). |
| `src/03_Runtime/engine/core/safe-json-import.ts` | L2–3, L39 (comment: load screen JSON by path) | Compliant | Safe loader for screen JSON (fetch /api/screens/* or fs in Node). |
| `src/03_Runtime/runtime/loaders/safe-json-loader.ts` | L11–14 loadScreenJson | Compliant | No-op at runtime (JSON screens not loaded from filesystem here). |
| `src/04_Presentation/lib-layout/presentation-profiles.json` | Full file | Compliant | Profile definitions with sections (header, hero, content, track, etc.) as layout config. |
| `src/04_Presentation/lib-layout/template-profiles.json` | Many "hero", "content", "track" section keys | Compliant | Template section layout definitions. |
| `src/03_Runtime/engine/core/fallback-screen.ts` | L2 (comment) | Compliant | Fallback screen tree when load fails. |
| Apps under `01_App/(dead) Json/apps/` (e.g. journal_track/app.json) | Various | Compliant | JSON screen definitions. |

### 4.2 Where JSON screen trees are consumed for rendering

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/engine/core/screen-loader.ts` | L23 `loadScreen(path)` | Compliant | Loads JSON (or TSX) screen; returns tree or descriptor. |
| `src/app/page.tsx` | L70 loadScreen(effectivePath); L214 node={treeForRender} | Compliant | Main page: loadScreen → treeForRender → JsonRenderer. |
| `src/app/dev/page.tsx` | L383, L477 loadScreen; L919–920 JsonRenderer node={treeForRender} | Compliant | Dev page: loadScreen → treeForRender → JsonRenderer. |
| `src/app/ui/control-dock/layout/PreviewRender.tsx` | L160–162 JsonRenderer node={previewRoot} | Compliant | Preview panel consumes screen tree. |
| `src/03_Runtime/engine/runners/engine-runner.tsx` | L34 JsonRenderer node={screen} | Compliant | Engine runner passes screen tree to JsonRenderer. |
| `src/03_Runtime/engine/core/current-screen-tree-store.ts` | L8–13 getCurrentScreenTree, setCurrentScreenTree | Compliant | Store for “Save Current Layout”; tree set by page after load. |
| `src/03_Runtime/engine/core/json-renderer.tsx` | Root receives node (tree), renders recursively | Compliant | Primary consumer of screen tree; uses layoutByScreen, state, etc. |

---

## 5. Palette-store and token resolution for styling

### 5.1 Palette-store

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/engine/core/palette-store.ts` | Full file | Compliant | activePaletteName, setPalette, getPalette, getPaletteName, subscribePalette; single module, no duplicate stores. |
| `src/app/dev/page.tsx` | L16, L221, L231 | Compliant | subscribePalette, getPaletteName; paletteName from state then palette-store fallback. |
| `src/app/layout.tsx` | L28, L130 | Compliant | getPaletteName for layout. |
| `src/app/ui/control-dock/RightFloatingSidebar.tsx` | L16–17, L182, L187, L197–202 | Compliant | setPalette, getPaletteName, subscribePalette; syncs paletteName to state and palette-store. |
| `src/app/ui/control-dock/RightSidebarDock.tsx` | L16, L31, L36 | Compliant | getPaletteName, subscribePalette. |
| `src/app/ui/control-dock/PipelineDiagnosticsRail.tsx` | L14, L110 | Compliant | getPaletteName. |
| `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx` | L20, L86–99, L122 | Compliant | getPaletteName, subscribePalette; applies palette to envelope. |
| `src/06_Data/site-renderer/palette-bridge.tsx` | L11, L150, L161–163 | Compliant | getPalette, getPaletteName, subscribePalette; applies palette CSS vars to DOM. |
| `src/03_Runtime/engine/core/ExperienceRenderer.tsx` | L20–21 paletteOverride; L94 | Compliant | Optional paletteOverride for token resolution in preview. |
| `src/03_Runtime/engine/core/json-renderer.tsx` | L8, L1564, L1658 | Compliant | getPaletteName and palette from state for context. |

### 5.2 Token resolution

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/03_Runtime/engine/core/palette-resolve-token.ts` | L22 `resolveToken(path?, depth?, paletteOverride?)` | Compliant | Resolves token path (e.g. color.primary) from getPalette() or paletteOverride; handles spacing/gap/padding → "0". |
| `src/04_Presentation/lib-layout/molecules/row-layout.tsx` | L3, L16 | Compliant | resolveToken(v) for layout params. |
| `src/04_Presentation/lib-layout/molecules/column-layout.tsx` | L3, L15 | Compliant | resolveToken(v). |
| `src/04_Presentation/lib-layout/molecules/grid-layout.tsx` | L3, L16 | Compliant | resolveToken(v). |
| `src/04_Presentation/components/atoms/focus-ring.tsx` | L5, L60–62, L71 | Compliant | resolveToken for focusRing and transition. |
| `src/04_Presentation/components/atoms/shell.tsx` | L4, L15–16 | Compliant | resolveToken(background, padding). |
| `src/04_Presentation/components/atoms/field.tsx` | L5, L71–76 | Compliant | resolveToken for background, border, radius, padding. |
| `src/04_Presentation/components/atoms/spinner.tsx` | L4, L18–30 | Compliant | resolveToken for color, size, thickness. |
| `src/04_Presentation/components/atoms/skeleton.tsx` | L4, L19–25 | Compliant | resolveToken for background, radius, width, height. |
| `src/04_Presentation/components/atoms/surface.tsx` | L2, L16–21 | Compliant | resolveToken for transition, background, borderColor. |
| `src/04_Presentation/components/atoms/collection.tsx` | L4, L23 | Compliant | resolveToken(v). |
| `src/04_Presentation/components/atoms/sequence.tsx` | L2, L22 | Compliant | resolveToken(v). |
| `src/04_Presentation/engine/motion/motion-profile-resolver.ts` | L9, L48 | Compliant | resolveToken for duration. |
| `src/04_Presentation/diagnostics/PaletteContractInspector.tsx` | L11, L58 | Compliant | resolveToken(path, 0, pal). |
| `src/04_Presentation/diagnostics/paletteTokenInspector.ts` | L7, L82 | Compliant | Wraps resolveToken for trace/probe. |
| `src/07_Dev_Tools/diagnostics/SpacingAuditPanel.tsx` | L10, L12, L42, L91 | Compliant | getPaletteName, resolveToken. |

---

## 6. Hard-coded strings: "TRACK", fixed section types, feature literals in UI

### 6.1 Literal "TRACK" (exact)

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| (None) | — | N/A | No exact string "TRACK" or 'TRACK' found in codebase. |

### 6.2 Track-related and journal literals (UI / routing)

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/app/components/OSBCaptureModal.tsx` | L26 `track: "Track"`, L64 `route === "track"`, L65 track "think" | Violation | Hard-coded label "Track" and route "track"; track hint "think" for journal.add. |
| `src/05_Logic/logic/osb/osb-routing.ts` | L10 OSBRoute "track", L20 TRACK_KEYS ["think","repent","ask","conform","keep"] | Violation | Fixed route and track key list in code. |
| `src/04_Presentation/lib-layout/journal-roles.json` | L3 "track" in optionalRoles; L9, L19 "track" | Compliant | Config/data; track as section role. |
| `src/04_Presentation/lib-layout/presentation-profiles.json` | "track" section in journal profile | Compliant | Section id in JSON profile. |
| `src/04_Presentation/lib-layout/template-profiles.json` | Many "track" section keys | Compliant | Template config. |

### 6.3 Fixed section types in code (switch / comparisons)

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/06_Data/site-renderer/renderSection.tsx` | L23 `switch (section.type)` and L80 productIds | Violation | Hard-coded section.type branching (hero, heading, text, image, list, productGrid, etc.) in renderer. |
| `src/06_Data/site-normalizer/derivePages.ts` | L50 section.type === "productGrid", L112 "hero", L134 | Violation | Fixed section type strings for page derivation. |
| `src/06_Data/site-compiler/normalizeSiteData.ts` | Multiple section.type === "heading"|"text"|"image"|"productGrid"|"list" | Violation | Section type literals in compiler. |
| `src/06_Data/site-compiler/compileSiteToScreenModel.ts` | L129 switch (section.type) | Violation | Section type mapping in compiler. |
| `src/06_Data/site-compiler/compileSiteToSchema.ts` | L272, L412, L431, L437, L565, L689 | Violation | section.type checks (heading, image, text, list). |
| `src/07_Dev_Tools/scripts/websites/build-site.ts` | L127 s.type === "hero" \|\| s.role === "hero" | Violation | Hero section detection. |
| `src/04_Presentation/lib-layout/layout-engine/region-policy.ts` | L19–20 "hero"\|"content", L46–49, L74–75, L81 | Violation | Fixed region names in policy. |
| `src/03_Runtime/state/state-resolver.ts` | L107 (layout.override type check) | Compliant | Validates type as "section"\|"card"\|"organ". |

### 6.4 Feature-specific literals in UI components

| File | Location | Compliant / Violation | Description |
|------|----------|------------------------|-------------|
| `src/04_Presentation/lib-layout/template-roles.json` | L3 "hero", "features", "pricing", "testimonials", "gallery", "faq", "cta" | Compliant | Config list of roles. |
| `src/04_Presentation/layout/data/layout-definitions.json` | L173 "content", L235 "hero", L237 "content" | Compliant | Layout mapping config. |
| `src/04_Presentation/palettes/*.json` | "hero", "heading" as color/font keys | Compliant | Palette token names (design system). |
| `src/app/ui/control-dock/RightFloatingSidebar.tsx` | L94 `id: "palette", label: "Palette"` | Violation | Hard-coded panel id/label. |
| `src/app/ui/control-dock/RightFloatingSidebar.tsx` | L419–420 (linear-gradient, GOOGLE.surfaceHover) | Violation | Inline style literals for palette view mode. |
| `src/03_Runtime/engine/core/json-renderer.tsx` | L1129–1131 journal track from params; L1530 "NO_SECTIONS_FOUND_IN_TREE" | Violation | Journal track from props (data-driven) is OK; console message is fixed string. |
| `src/03_Runtime/engine/core/behavior-listener.ts` | L244 journal.add with track from action params | Compliant | Track comes from action params. |

---

## Summary

- **dispatchState:** Single definition in state-store; ~14 call sites; one **violation**: `layout.tsx` L176 uses `state:update` (colon) instead of `state.update` (dot).
- **Event log:** Single write path (dispatchState → log.push); single read path (deriveState(log)); persist/rehydrate in state-store (rehydrate on bootstrap); persistence-adapter provides canonical saveLog/loadLog but state-store does not use them (duplicate logic).
- **Verbs:** Contract verbs in contract-verbs.ts; behavior-listener routes to runBehavior or interpretRuntimeVerb; runtime-verb-interpreter forwards to action-runner. **Compliant** single pipeline.
- **JSON screen trees:** Defined in safe-screen-registry paths and JSON files under apps; consumed by loadScreen → page/dev → JsonRenderer and PreviewRender/engine-runner. **Compliant**.
- **Palette-store / token resolution:** palette-store.ts is single store; resolveToken in palette-resolve-token.ts used by layout molecules, atoms, diagnostics. **Compliant**.
- **Hard-coded literals:** No literal `"TRACK"`. **Violations**: OSBCaptureModal and osb-routing (track/route literals); renderSection, derivePages, normalizeSiteData, compileSiteToScreenModel, compileSiteToSchema, build-site, region-policy (section type literals); RightFloatingSidebar (panel label, inline styles); json-renderer (console message).

End of report.
