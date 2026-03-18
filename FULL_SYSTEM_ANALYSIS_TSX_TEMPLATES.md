# Full System Analysis — TSX as Dumb Templates (No Edits, No Implementation)

**Context:** Abandoning JSON screen export files. Using TSX templates. No compiler change. No changes to blueprint.txt or content.txt. No new schema, content format, subsystem, or architecture. Schema, verbs, molecules, atoms, layout engine, state engine remain authoritative. Website = presentation mode of structured content. One system, one runtime, one contract.

**Scope:** TSX under `src/01_App/(live)` must become dumb templates consuming: existing blueprint/content contracts, schema definitions, behavior verbs, layout/molecule system, Director primitives.

---

## A) Current system truth model (paths + files)

### Blueprint + content (authoritative, unchanged)

| Artifact | Path | Role |
|----------|------|------|
| **Blueprint contract** | [src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md](src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md) | LOCKED. Molecule universe (Button, Card, Section, etc.), content slots per molecule, behavior verbs, organs. Structure + navigation. |
| **Content derivation contract** | [src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md](src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md) | LOCKED. blueprint.txt = structure+navigation; content (content.txt / content.manifest) = values only. Content keys match molecule contract. Merge: entry.content = contentMap[node.rawId]. |
| **Blueprint runtime interface** | [src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/BLUEPRINT_RUNTIME_INTERFACE.generated.md](src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/BLUEPRINT_RUNTIME_INTERFACE.generated.md) | Compiler output shape (when used): app.json tree with id, type, children, content; no layout primitives in tree; no screen IDs. |
| **Sample blueprint** | [src/08_Modules/_samples/doctor/blueprint.txt](src/08_Modules/_samples/doctor/blueprint.txt) | APP: name; lines like `1.0 | Home | Section [title]`. |
| **Sample content** | [src/08_Modules/_samples/doctor/content.txt](src/08_Modules/_samples/doctor/content.txt) | APP: name; lines like `1.0 Home (Section)` then `- title: "..."`. Keys match molecule/organ slots. |
| **Content map (logic)** | [src/05_Logic/logic/content/content-map.ts](src/05_Logic/logic/content/content-map.ts) | CONTENT_MAP keyed by content key; resolveContent(key). |
| **Content map (data)** | [src/06_Data/content/content-map.ts](src/06_Data/content/content-map.ts) | getContent(key). Simple lookup. |
| **Blueprint → skin adapter** | [src/06_Data/site-skin/compileSkinFromBlueprint.ts](src/06_Data/site-skin/compileSkinFromBlueprint.ts) | BlueprintScreen → SiteSkinDocument (nodes with roles). Content-only nodes. |

### Schema, verbs, molecules, atoms, layout, state (unchanged)

| System | Location | Role |
|--------|----------|------|
| **Schema / contracts** | [src/02_Contracts_Reports/contracts/](src/02_Contracts_Reports/contracts/), JSON_SCREEN_CONTRACT (if present) | Authoritative definitions. |
| **Behavior verbs** | BLUEPRINT_UNIVERSE (Interaction, Navigation, Action); [behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts) (navigate, setScreen, openModal, etc.) | One behavior bridge. |
| **Molecules** | BLUEPRINT_UNIVERSE molecule list; components under [src/04_Presentation/components/](src/04_Presentation/components/) | Button, Card, Section, etc. |
| **Atoms** | [src/04_Presentation/components/atoms/](src/04_Presentation/components/atoms/) | Core primitives. |
| **Layout engine** | [src/04_Presentation/lib-layout/](src/04_Presentation/lib-layout/), section-layout-id, template-profiles, composeOfflineScreen | Section layout, template, experience profile. |
| **State engine** | [src/state/state-store](src/state/state-store), getState, subscribeState, dispatchState | Single state store. |

### Runtime entry (TSX path)

| File | Role |
|------|------|
| [src/03_Runtime/engine/core/screen-loader.ts](src/03_Runtime/engine/core/screen-loader.ts) | loadScreen(path): tsx: → { __type: "tsx-screen", path }; else fetch JSON. |
| [src/app/page.tsx](src/app/page.tsx) | effectivePath → loadScreen; if tsx-screen → TSXScreenWithEnvelope + Component (app currently hardcodes HiClarifyOnboarding). |
| [src/app/dev/page.tsx](src/app/dev/page.tsx) | resolveTsxScreen(path) from AUTO_TSX_MAP / (live) Business; TSXScreenWithEnvelope + TsxComponent. |
| [src/lib/tsx-structure/TSXScreenWithEnvelope.tsx](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx) | Envelope: profile, layout, palette, StructureConfigProvider; passes structureProps to Component. |
| [src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts) | Path + experience (Container_Creations only) + profileName → layout, palette, nav, appClass, chrome. |
| [src/lib/director/AppShellDirector.tsx](src/lib/director/AppShellDirector.tsx) | Merges default + profile + schema → directorProps; DirectorContext (experience, profileName, archetype). |

### Config supporting morphability

| Config | Path | Role |
|--------|------|------|
| experience-visibility | [src/config/experience-visibility.json](src/config/experience-visibility.json) | Per-experience strategy: renderAll, dashboard, step, maxDepth. |
| presentation-profiles | [src/04_Presentation/lib-layout/presentation-profiles.json](src/04_Presentation/lib-layout/presentation-profiles.json) | website, app, learning, journal: visualPreset, defaults, sections. |
| template-profiles | [src/04_Presentation/lib-layout/template-profiles.json](src/04_Presentation/lib-layout/template-profiles.json) | Template section layouts, layoutVariants, experience. |
| mode-profiles | [src/config/mode-profiles.json](src/config/mode-profiles.json) | google, child, adult, business → envelope + visual/interaction/behavior/density/safety. |
| Director primitives | [src/lib/director/primitive-registry.ts](src/lib/director/primitive-registry.ts) | 25 primitives (visibility, variant, layoutDensity, etc.). |

---

## B) Blueprint + content contract audit — contracts remain intact

### Locations

- **blueprint.txt:** Multiple locations; canonical contract and format described in BLUEPRINT_UNIVERSE_CONTRACT.md. Sample: [src/08_Modules/_samples/doctor/blueprint.txt](src/08_Modules/_samples/doctor/blueprint.txt). Format: `APP: Name` then outline lines (e.g. `1.0 | Home | Section [title]` or `1.0 Home (Section)`).
- **content.txt:** Paired with blueprint; sample [src/08_Modules/_samples/doctor/content.txt](src/08_Modules/_samples/doctor/content.txt). Format: `APP: Name` then `nodeId NodeName (Type)` and `- slotKey: "value"`.

### Contract definitions (existing, unchanged)

- **BLUEPRINT_UNIVERSE_CONTRACT.md:** Molecule universe (Button, Avatar, Card, Chip, Field, List, Modal, Section, Footer, Stepper, Toast, Toolbar); content slots per molecule; actionable molecules and allowed behavior verbs; organs (header, hero, content-section, etc.); outline rules; no new molecules.
- **CONTENT_DERIVATION_CONTRACT.md:** blueprint.txt = structure + navigation (LOCKED); content = human-editable values; content keys from molecule contract; merge rule entry.content = contentMap[node.rawId]; final node shape: id, type, content {}, params, layout, children, behavior.
- **BLUEPRINT_RUNTIME_INTERFACE.generated.md:** Tree shape (id, type, children, content, optional role/behavior/params); no layout primitives in screen tree; no screen IDs; section layout from template/override at runtime.

### Mapping to sections/nodes/molecules

- Blueprint outline → nodes: each line = node (id from name, type from molecule or organ:organId). Sections are nodes of type Section; organs expand to Section + slots (BLUEPRINT_UNIVERSE).
- Content file → contentMap keyed by node identifier; keys are molecule/organ content slots (e.g. button: [label], card: [title, body, media]).
- Runtime node shape (CONTENT_DERIVATION): id, type, content { slotKey: value }, children, behavior, etc. Section layout resolved by layout engine (template, section-layout-id), not by blueprint.

### Authoritative fields (cannot change)

- Molecule set and content slots per molecule (BLUEPRINT_UNIVERSE).
- Rule: content keys = intersection of outline tokens and molecule contract (CONTENT_DERIVATION).
- No layout primitives in screen tree; no screen IDs for routing (BLUEPRINT_RUNTIME_INTERFACE).
- Single merge rule: entry.content = contentMap[node.rawId].

**Confirmation:** Blueprint and content contracts remain intact. No new schema or content format. TSX templates must consume data that conforms to these contracts (nodes with id, type, content, behavior as defined).

---

## C) Runtime + TSX alignment audit

### TSX screen entry points and wrappers

| Entry | Path | How it renders |
|-------|------|----------------|
| TSXScreenWithEnvelope | [src/lib/tsx-structure/TSXScreenWithEnvelope.tsx](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx) | Resolves profile, layout, palette; StructureConfigProvider; passes structureProps to Component. |
| getDefaultTsxEnvelopeProfile | [src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts) | Path/experience/profileName → TsxEnvelopeProfile. |
| resolveAppStructure | [src/lib/tsx-structure/resolver/index.ts](src/lib/tsx-structure/resolver/index.ts) | screenPath → structureType, template, schemaVersion. |
| StructureConfigProvider / useAutoStructure | [src/lib/tsx-structure/StructureConfigContext.tsx](src/lib/tsx-structure/StructureConfigContext.tsx), [useAutoStructure.ts](src/lib/tsx-structure/useAutoStructure.ts) | Context + hook for structure config. |
| (live) screens | ContainerCreationsWebsite, Shopify_Intelligence, flows-index, FlowViewer (onboarding), FlowsIndex wrapper, FlowViewer wrapper | Mounted via envelope on dev; app page uses envelope only for HiClarifyOnboarding. |

### Hardcoded content

| File | Hardcoded content |
|------|--------------------|
| ContainerCreationsWebsite | Default screen path string; API path `/api/sites/containercreations/contract`. |
| Shopify_Intelligence | Title "Shopify Intelligence"; API `/api/shopify-intelligence`; fallback shop `hiclarify-dev.myshopify.com`; labels "Total Revenue", "Health Score", etc. |
| flows-index | "Flow Tester" title; literal "Container_Creations"; ENGINE_VIEWER_SCREEN_PATH string. |
| FlowViewer (onboarding) | "Return to main screen", "Why this next step?", "Loading flows...", "No flows found..."; return path `tsx:(live) Business/onboarding/flows-index`. |
| WebsiteTemplate | EXPERIENCE_LAYOUT (website/app/learning styles). |

### Direct routing/state usage

| File | Violation |
|------|-----------|
| ContainerCreationsWebsite | getState (experience); dispatchState("state.update", paletteName); useSearchParams (screen). |
| flows-index | useRouter; router.push(`/dev?...`); router.push("/"). |
| FlowViewer (onboarding) | useRouter; router.push(`?${params}`); router.push("/dev?screen=..."). |

### Dumb-template violations

- **ContainerCreationsWebsite:** Owns fetch and palette sync; reads experience from state; default path literal. Should receive contract (or node tree conforming to blueprint/content) and experience from envelope/Director only; no dispatchState.
- **Shopify_Intelligence:** Own content (titles, labels); no structure/config consumption; no Director primitives. Should receive labels and API source from structure/config; use CSS vars and primitives.
- **flows-index:** Own navigation (router.push); feature literal "Container_Creations"; hardcoded screen path. Should use behavior bridge for navigation; project/screen path from config.
- **FlowViewer (onboarding):** Own navigation; hardcoded return path; engine bridge usage is intentional (single engine). Should use behavior bridge for navigation and return path from config.
- **WebsiteTemplate:** Experience-based layout (EXPERIENCE_LAYOUT) inside screen; should receive experience from context and layout from envelope/profile, not branch in component.

---

## D) TSX violation table (file → problem → minimal fix)

| File | Problem | Minimal fix |
|------|---------|-------------|
| [ContainerCreationsWebsite.tsx](src/01_App/(live) Business/Container_Creations/ContainerCreationsWebsite.tsx) | dispatchState(paletteName); getState(experience); default path literal; API path literal | Move palette sync to envelope or API layer. Receive experience via DirectorContext/envelope. Receive screenPath from envelope props only. Drive API path from config/resolver (e.g. structureConfig or env), not literal. |
| [Shopify_Intelligence.tsx](src/01_App/(live) Business/shopify/Shopify_Intelligence.tsx) | Hardcoded title, API path, labels; no structure/Director | Receive title, API path, and labels from structureConfig or props (config-driven). Use Director primitives (e.g. layoutDensity, variant) and CSS vars only. |
| [flows-index.tsx](src/01_App/(live) Business/onboarding/flows-index.tsx) | router.push; "Container_Creations" literal; ENGINE_VIEWER_SCREEN_PATH literal | Use behavior bridge: CustomEvent "navigate" or action "navigate" with detail.to. Project filter from URL param or config key, not literal "Container_Creations". Viewer screen path from config/resolver. |
| [FlowViewer.tsx](src/01_App/(live) Business/onboarding/FlowViewer.tsx) | router.push for flow/engine/return; hardcoded return path | Use behavior bridge for all navigation (navigate/setScreen). Return path from config. Keep setEngineFlow/subscribeEngineState (single engine). |
| [WebsiteTemplate.tsx](src/04_Presentation/components/organs/tsx/website/WebsiteTemplate.tsx) | EXPERIENCE_LAYOUT branching inside component | Receive experience from DirectorContext/envelope; layout constraints (maxWidth, padding) from envelope/profile or structureConfig, not local EXPERIENCE_LAYOUT map. |
| FlowsIndex.tsx, FlowViewer.tsx (wrappers) | None | No change. |

---

## E) Morphability audit

### How one structured content model can be presented (existing config)

- **experience-visibility.json:** website (renderAll), app (dashboard, collapse), learning (step, useStepIndex), focus (step), presentation (step), kids (maxDepth 2). Same tree can be rendered with different visibility strategy per experience.
- **presentation-profiles.json:** website, app, learning, journal — each with visualPreset, defaults (container, maxWidth, navigation, readingFlow), sections (layout types/params). One tree + experience → one experience profile.
- **template-profiles:** Section layouts, layoutVariants, experience. getTemplateProfile(id) + getExperienceProfile(experience) → effectiveProfile for JSON path.
- **mode-profiles.json:** Envelope overrides (layout, nav, palette, appClass, chrome) by profileName (google, child, adult, business).
- **Shells:** SiteSkin.tsx: website → WebsiteShell, learning → LearningShell, app → AppShell. Same content can be wrapped in different shell by experience.

So: one structured content model (node tree with id, type, content, behavior) can be presented as website, learning flow, dashboard, presenter, planner, journal by: (1) experience + template driving effectiveProfile and visibility, (2) shells and envelope applying layout/chrome, (3) no change to blueprint/content contract.

### Where TSX screens block morphability

- **getDefaultTsxEnvelopeProfile:** Experience is only used for Container_Creations/* (and path patterns). Other TSX paths get envelope by path only. So same TSX “screen” cannot switch website vs learning vs app by changing experience without code/config change.
- **WebsiteTemplate:** EXPERIENCE_LAYOUT hardcodes website/app/learning styles inside the component. Experience is passed as prop but layout decision is in TSX, not in envelope/profile.
- **No shared “content model” for TSX:** ContainerCreationsWebsite uses TsxWebsiteContract (nodes + nodeOrder from API), not the blueprint/content node shape. To morph the same content as website/learning/dashboard, TSX would need to receive the same node tree (blueprint/content-compliant) and rely on envelope + Director for experience/layout.
- **Hardcoded screen paths and feature names:** flows-index and FlowViewer fix navigation targets in code; changing presentation mode or route config requires code change.

### Morphability gaps (summary)

| Gap | Location | Effect |
|-----|----------|--------|
| Envelope uses experience only for Container_Creations | getDefaultTsxEnvelopeProfile.ts | Other TSX screens do not get experience-driven envelope. |
| Layout decisions inside TSX | WebsiteTemplate EXPERIENCE_LAYOUT | Experience → layout should come from envelope/profile. |
| TSX contract not aligned to blueprint/content node shape | TsxWebsiteContract (nodes, nodeOrder) vs. id/type/content/behavior | Same content cannot be fed to JSON path and TSX path identically. |
| Navigation targets in code | flows-index, FlowViewer | Return/viewer paths should come from config. |

---

## F) Refactor requirements (plan only) — per TSX screen

### ContainerCreationsWebsite

- **Externalize:** Default screen path (use envelope/props). API path for contract (config or structureConfig). Palette name (envelope or API response handled outside screen).
- **Remove:** dispatchState call. Direct getState for experience (use DirectorContext or envelope). Literal "tsx:(live) Business/Container_Creations/ContainerCreationsWebsite".
- **Consume:** Blueprint/content: contract or node tree should conform to node shape (id, type, content per molecule contract). Receive via props or from API whose shape is defined by existing contracts. Director: experience, directorProps from context; palette via CSS vars only.

### Shopify_Intelligence

- **Externalize:** Title "Shopify Intelligence", API path, section labels, fallback shop. Move to structureConfig or config.
- **Remove:** Hardcoded strings for UI and API.
- **Consume:** structureConfig (or props) for title, apiPath, labels. Director primitives for density/variant; CSS vars for theme.

### flows-index

- **Externalize:** "Flow Tester" title, ENGINE_VIEWER_SCREEN_PATH, "Container_Creations" filter key. From config/URL/structureConfig.
- **Remove:** router.push. Feature literal "Container_Creations".
- **Consume:** Behavior bridge for navigate (CustomEvent "navigate" or action). Screen path and project filter from config/params.

### FlowViewer (onboarding)

- **Externalize:** Return path "tsx:(live) Business/onboarding/flows-index". UI strings optional from config.
- **Remove:** router.push for return and for flow/engine query updates; use behavior bridge.
- **Consume:** Behavior bridge for navigation. Director primitives where applicable. Keep engine bridge (setEngineFlow, subscribeEngineState) as single engine.

### WebsiteTemplate

- **Externalize:** EXPERIENCE_LAYOUT (maxWidth, padding per experience). Should come from envelope or profile.
- **Remove:** Local EXPERIENCE_LAYOUT map; experience-based layout decision in component.
- **Consume:** experience from DirectorContext/envelope; layout style from envelope or structureConfig.

### Director primitives (all screens)

- **Respect:** visibility, variant, layoutDensity, buttonMode, collectionMode, cardMode, stepSequenceMode, etc. (25 primitives). Read from DirectorContext; no overrides via dispatchState. Use for density, variant, and interaction policy only.

---

## G) .cursor rule audit and patch plan

### Existing rule files read

- [.cursor/rules/TSX_BUILD_SYSTEM.md](.cursor/rules/TSX_BUILD_SYSTEM.md) — Core principle (JSON = control plane, TSX = renderer); envelope mandatory; structure via useAutoStructure; must NOT hardcode layout, own chrome, touch engine. Does not say "TSX is template only", "no hardcoded content", "no direct router/state", or "website is presentation mode only" explicitly.
- [.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md](.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md) — Engine overview; consume structure; no "compiled structure is truth" or "no router/state" or "website = presentation."
- [.cursor/rules/TSX_CREATION_CHECKLIST.md](.cursor/rules/TSX_CREATION_CHECKLIST.md) — Checklist; no explicit "no hardcoded content", "no router.push/dispatchState", or "website = presentation."

### Missing enforcement

- "TSX is template only" — Not stated as a single law; "renderer only" is present but "template" and "consume blueprint/content contracts" are not.
- "No hardcoded content" — Not in rules (titles, labels, API paths, screen paths).
- "No direct router/state" — Not in rules (router.push, dispatchState).
- "Website is presentation mode only" — Not in rules.

### Proposed insertions (exact file names + text blocks)

**G.1) New file: `.cursor/rules/CONTENT_AND_PRESENTATION.md`**

Insert full content:

```markdown
# Content and Presentation — Permanent Law

- **Website is a presentation, not a separate product.** A "website" is one possible presentation of structured content. The same content (blueprint + content contract) must be morphable into website, learning flow, dashboard, presenter, planner, journal. Do not create a website subsystem. Use existing contracts and config only.
- **Blueprint and content contracts are truth.** Structure and content keys are defined in BLUEPRINT_UNIVERSE_CONTRACT.md and CONTENT_DERIVATION_CONTRACT.md. Node shape: id, type, content, behavior, children. TSX templates consume data that conforms to these contracts; they do not define new schema or content format.
- **TSX is template only.** TSX screens are dumb templates: they consume existing blueprint/content contracts, schema definitions, behavior verbs, layout/molecule system, and Director primitives. They render; they do not own routing, global state, or layout/chrome. No direct router or state in screens; use the behavior bridge (navigate action or CustomEvent "navigate").
- **No hardcoded content in TSX.** Titles, labels, API paths, and screen paths must come from config, structureConfig, or resolver. Do not hardcode feature names or route literals.
- **One state engine, one behavior bridge, one layout engine.** Do not use router.push or dispatchState inside TSX screens. Use the existing behavior listener and navigate contract.
```

**G.2) [.cursor/rules/TSX_BUILD_SYSTEM.md](.cursor/rules/TSX_BUILD_SYSTEM.md)**

- After the table in "1. CORE PRINCIPLE" (after line 15), insert:

```markdown
- **Website = presentation:** Website is one presentation mode of structured content, not a separate build. Same content/structure can be presented as website, learning, app, etc. Do not hardcode experience or create a separate website pipeline.
- **No direct router/state in TSX:** TSX must not call router.push, dispatchState, or Next.js navigate. Use the behavior bridge: CustomEvent "navigate" with detail.to, or action "navigate". See installBehaviorListener in src/03_Runtime/engine/core/behavior-listener.ts.
```

- In "2. HOW ALL FUTURE TSX FILES MUST BE BUILT", under "TSX must NOT:", add one bullet:

```markdown
- Call router.push, dispatchState, or any mutating state/navigate API; use the behavior bridge for navigation and read-only state/envelope for palette.
```

- Add under "TSX must:" (or as new bullet):

```markdown
- **No hardcoded content:** Titles, labels, API paths, and screen paths must come from structureConfig, config, or props — not literals in code.
```

**G.3) [.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md](.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md)**

- After "What the engine is" bullet list (~line 16), insert:

```markdown
- **Compiled structure / blueprint-content is truth:** TSX consumes ResolvedAppStructure and (when wired) Director context. It does not define structure or feature names; those come from config and resolver. Data fed to TSX should conform to existing blueprint/content contracts (node shape: id, type, content, behavior).
```

- In "How new screens plug in", after "Mount as usual", add:

```markdown
- **Navigation:** Do not use router.push. Use the behavior bridge (CustomEvent "navigate" or action "navigate"). **Content:** Do not hardcode titles, labels, or screen paths; use config/structure.
```

**G.4) [.cursor/rules/TSX_CREATION_CHECKLIST.md](.cursor/rules/TSX_CREATION_CHECKLIST.md)**

- In "5. Avoid layout hardcoding", after the existing checkboxes, add:

```markdown
- [ ] **No** router.push or dispatchState; use behavior bridge for navigation. No hardcoded screen paths, feature names, or content (titles, labels, API paths); use config/structure.
```

- In "Quick reference (Phase 2 standard)" table, add row:

| Topic | Rule |
|-------|------|
| Navigation / state | Behavior bridge only; no router.push or dispatchState in TSX |
| Content | No hardcoded titles, labels, API paths, or screen paths; use config/structure |

**G.5) Reference new rule**

- In TSX_BUILD_SYSTEM.md and TSX_CREATION_CHECKLIST.md, add a line at the end (or in "Reference" section): "See also .cursor/rules/CONTENT_AND_PRESENTATION.md for content/presentation and template-only laws."

---

## Summary

- **A)** Truth model: Blueprint/content contracts (BLUEPRINT_UNIVERSE, CONTENT_DERIVATION, BLUEPRINT_RUNTIME_INTERFACE); schema, verbs, molecules, atoms, layout, state (existing paths); runtime TSX path (loadScreen, envelope, Director); morphability config (experience-visibility, presentation-profiles, template-profiles, mode-profiles).
- **B)** Blueprint and content contracts remain intact; formats and authoritative fields unchanged. TSX must consume data conforming to these contracts.
- **C)** Violations: ContainerCreationsWebsite (state/palette/path/API); Shopify_Intelligence (hardcoded content); flows-index (router, literals); FlowViewer (router, return path); WebsiteTemplate (experience layout in component). Minimal fixes: behavior bridge, config-driven content/paths, palette/experience from envelope/Director.
- **D)** Morphability: Existing config supports one tree → many presentations. Gaps: envelope experience only for Container_Creations; layout in TSX (WebsiteTemplate); TsxWebsiteContract not aligned to blueprint/content node shape; hardcoded navigation targets.
- **E)** .cursor patch plan: New CONTENT_AND_PRESENTATION.md; insertions in TSX_BUILD_SYSTEM.md (3 blocks), TSX_STRUCTURE_ENGINE_OVERVIEW.md (2 blocks), TSX_CREATION_CHECKLIST.md (2 blocks); reference new rule in existing TSX rules.

No files were modified. No implementation performed. No new architecture introduced.
