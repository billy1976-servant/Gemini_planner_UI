---
name: Structural Scan Compliance Report
overview: "Non-invasive structural analysis: component inventory, contract compliance vs doctrine, registry and hardcoding audit, missing/incomplete areas, and summary counts. No changes proposed."
todos: []
isProject: false
---

# Structural Component Inventory and Compliance Report

**Scope:** Full repository scan. Observation only; no redesign, no fixes, no doctrine rewrite.

---

## A) Component Inventory

Grouped by actual folder structure.

### Palette system


| Path                                                                                                       | Used? | Auto-discovered or manual?                                                                                          | No hardcoding?                                      | Partial/stub/dead? |
| ---------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------ |
| [src/04_Presentation/palettes/](src/04_Presentation/palettes/) (JSON files)                                | Yes   | **Auto** — [palettes/index.ts](src/04_Presentation/palettes/index.ts) uses `require.context(".", false, /\.json$/)` | Yes (palette names from JSON)                       | No                 |
| [src/04_Presentation/palettes/index.ts](src/04_Presentation/palettes/index.ts)                             | Yes   | —                                                                                                                   | Yes                                                 | No                 |
| [src/03_Runtime/engine/core/palette-store.ts](src/03_Runtime/engine/core/palette-store.ts)                 | Yes   | Reads `@/palettes`                                                                                                  | Yes                                                 | No                 |
| [src/03_Runtime/engine/core/palette-resolver.ts](src/03_Runtime/engine/core/palette-resolver.ts)           | Yes   | —                                                                                                                   | Yes                                                 | No                 |
| [src/03_Runtime/engine/core/palette-resolve-token.ts](src/03_Runtime/engine/core/palette-resolve-token.ts) | Yes   | —                                                                                                                   | Yes                                                 | No                 |
| [src/04_Presentation/registry/palettes.json](src/04_Presentation/registry/palettes.json)                   | Yes   | Ref to ui-atom-tokens                                                                                               | Yes                                                 | No                 |
| [src/app/layout.tsx](src/app/layout.tsx) — `PALETTES` array (lines 81–91)                                  | Yes   | **Manual** — hardcoded list for UI pills                                                                            | **No** — subset of palette names duplicated in code | No                 |


### Layout system


| Path                                                                                                                                   | Used? | Auto or manual?                                              | No hardcoding? | Partial/stub/dead? |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------ | -------------- | ------------------ |
| [src/04_Presentation/layout/resolver/layout-resolver.ts](src/04_Presentation/layout/resolver/layout-resolver.ts)                       | Yes   | Reads fixed JSON                                             | Yes            | No                 |
| [src/04_Presentation/layout/page/page-layout-resolver.ts](src/04_Presentation/layout/page/page-layout-resolver.ts)                     | Yes   | Reads layout-definitions.json                                | Yes            | No                 |
| [src/04_Presentation/layout/component/component-layout-resolver.ts](src/04_Presentation/layout/component/component-layout-resolver.ts) | Yes   | Reads layout-definitions.json                                | Yes            | No                 |
| [src/04_Presentation/layout/data/layout-definitions.json](src/04_Presentation/layout/data/layout-definitions.json)                     | Yes   | —                                                            | Yes            | No                 |
| [src/04_Presentation/layout/requirements/layout-requirements.json](src/04_Presentation/layout/requirements/layout-requirements.json)   | Yes   | —                                                            | Yes            | No                 |
| [src/04_Presentation/layout/compatibility/requirement-registry.ts](src/04_Presentation/layout/compatibility/requirement-registry.ts)   | Yes   | Reads layout-requirements.json                               | Yes            | No                 |
| [src/04_Presentation/lib-layout/card-layout-presets.ts](src/04_Presentation/lib-layout/card-layout-presets.ts)                         | Yes   | **Manual** — `CARD_LAYOUT_PRESETS` object in code            | **No**         | No                 |
| [src/04_Presentation/lib-layout/molecule-layout-resolver.ts](src/04_Presentation/lib-layout/molecule-layout-resolver.ts)               | Yes   | Reads molecule-layouts.json; LAYOUT_DEFINITIONS cast in code | Partial        | No                 |
| [src/04_Presentation/layout-organ/organ-layout-resolver.ts](src/04_Presentation/layout-organ/organ-layout-resolver.ts)                 | Yes   | Reads organ-layout-profiles.json                             | Yes            | No                 |
| [src/04_Presentation/layout-organ/organ-layout-profiles.json](src/04_Presentation/layout-organ/organ-layout-profiles.json)             | Yes   | —                                                            | Yes            | No                 |
| [src/app/ui/layoutThumbnailRegistry.ts](src/app/ui/layoutThumbnailRegistry.ts)                                                         | Yes   | **Manual** — SECTION/CARD/ORGAN_LAYOUT_THUMBNAILS objects    | **No**         | No                 |


### Molecules / compounds


| Path                                                                                                                     | Used?   | Auto or manual?                    | No hardcoding?               | Partial/stub/dead?                        |
| ------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------- | ---------------------------- | ----------------------------------------- |
| [src/04_Presentation/components/molecules/*.compound.tsx](src/04_Presentation/components/molecules/)                     | Yes     | —                                  | Yes (render from props/JSON) | No                                        |
| [src/04_Presentation/components/molecules/index.ts](src/04_Presentation/components/molecules/index.ts) — `COMPONENT_MAP` | Yes     | **Manual** — 12 entries            | **No**                       | No                                        |
| [src/04_Presentation/components/molecules/molecules.json](src/04_Presentation/components/molecules/molecules.json)       | Yes     | Variant/size tokens; not discovery | Yes                          | No                                        |
| [src/04_Presentation/registry/molecules.json](src/04_Presentation/registry/molecules.json)                               | Partial | —                                  | —                            | Legacy/catalog; runtime uses registry.tsx |


### Behaviors


| Path                                                                                                             | Used? | Auto or manual?              | No hardcoding?               | Partial/stub/dead?           |
| ---------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------- | ---------------------------- | ---------------------------- |
| [src/03_Runtime/engine/core/behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts)               | Yes   | —                            | Yes                          | No                           |
| [src/05_Logic/logic/runtime/action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts)                   | Yes   | **Manual** — extend-only map | **No** (handler map in code) | No                           |
| [src/05_Logic/logic/runtime/runtime-verb-interpreter.ts](src/05_Logic/logic/runtime/runtime-verb-interpreter.ts) | Yes   | —                            | Yes                          | No                           |
| [src/03_Runtime/behavior/behavior-runner.ts](src/03_Runtime/behavior/behavior-runner.ts)                         | Yes   | Uses behavior.json           | Yes                          | No                           |
| [src/03_Runtime/behavior/behavior.json](src/03_Runtime/behavior/behavior.json)                                   | Yes   | —                            | Yes                          | No                           |
| [src/03_Runtime/behavior/behavior-actions-6x7.json](src/03_Runtime/behavior/behavior-actions-6x7.json)           | Yes   | —                            | Yes                          | No                           |
| [src/03_Runtime/behavior/behavior-listerner.ts](src/03_Runtime/behavior/behavior-listerner.ts) (typo)            | No    | —                            | —                            | **Stub/unused** — no imports |


### Engines


| Path                                                                                                                         | Used? | Auto or manual?                                       | No hardcoding?     | Partial/stub/dead?             |
| ---------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------- | ------------------ | ------------------------------ |
| [src/system/registry/engineRegistry.ts](src/system/registry/engineRegistry.ts)                                               | Yes   | **Manual** — registerEngine() calls from engine files | Yes (catalog only) | No                             |
| [src/05_Logic/logic/engine-system/engine-registry.ts](src/05_Logic/logic/engine-system/engine-registry.ts)                   | Yes   | **Manual** — execution/aftermath/presentation maps    | Yes                | No (flow/TSX path only)        |
| [src/05_Logic/logic/engines/calculator/calcs/calc-registry.ts](src/05_Logic/logic/engines/calculator/calcs/calc-registry.ts) | Yes   | Reads calculator-types.json + manual CALC_REGISTRY    | Partial            | No                             |
| [src/03_Runtime/engine/loaders/theme-loader.ts](src/03_Runtime/engine/loaders/theme-loader.ts)                               | No    | —                                                     | —                  | **Dead** — empty file, no refs |


### Blueprint files


| Path                                                                                                                       | Used? | Auto or manual?           | No hardcoding?                                                              | Partial/stub/dead? |
| -------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------- | --------------------------------------------------------------------------- | ------------------ |
| [src/07_Dev_Tools/scripts/blueprint.ts](src/07_Dev_Tools/scripts/blueprint.ts)                                             | Yes   | Manual script             | **No** — ALLOWED_CONTENT_KEYS hardcoded (button, avatar, chip, field, etc.) | No                 |
| [src/07_Dev_Tools/scripts/logic-compiler/blueprint.schema.ts](src/07_Dev_Tools/scripts/logic-compiler/blueprint.schema.ts) | Yes   | —                         | Yes                                                                         | No                 |
| Blueprint JSON in src                                                                                                      | —     | No blueprint*.json in src | —                                                                           | —                  |


### Content contracts


| Path                                                                                                                                                                      | Used?      | Auto or manual?                                  | No hardcoding?                              | Partial/stub/dead? |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------ | ------------------------------------------- | ------------------ |
| [src/02_Contracts_Reports/contracts/](src/02_Contracts_Reports/contracts/) (index, SystemContract, contract-verbs, layout-node-types, expected-params, renderer-contract) | Yes        | —                                                | Yes (NON_ACTIONABLE_TYPES from config.json) | No                 |
| [src/04_Presentation/components/organs/tsx/website/validateContract.ts](src/04_Presentation/components/organs/tsx/website/validateContract.ts)                            | Yes        | —                                                | Yes                                         | No                 |
| [src/lib/tsx-structure/contracts/](src/lib/tsx-structure/contracts/) (list, board, dashboard, etc.)                                                                       | Yes        | —                                                | Yes                                         | No                 |
| [src/02_Contracts_Reports/contracts/JSON_SCREEN_CONTRACT.json](src/02_Contracts_Reports/contracts/JSON_SCREEN_CONTRACT.json)                                              | Doc/design | Not imported for runtime validation in main path | —                                           | Partial            |


### TSX wrappers (Registry / dumb components)


| Path                                                                                                 | Used? | Auto or manual?                                             | No hardcoding?                            | Partial/stub/dead? |
| ---------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------- | ----------------------------------------- | ------------------ |
| [src/03_Runtime/engine/core/registry.tsx](src/03_Runtime/engine/core/registry.tsx)                   | Yes   | **Manual** — type → component map; add new type = code edit | **No**                                    | No                 |
| [src/03_Runtime/engine/core/json-renderer.tsx](src/03_Runtime/engine/core/json-renderer.tsx)         | Yes   | Resolves via Registry + definitions                         | Partial (definitions from molecules.json) | No                 |
| [src/04_Presentation/components/molecules/*.compound.tsx](src/04_Presentation/components/molecules/) | Yes   | Dumb wrappers; render from params/content                   | Yes                                       | No                 |
| [src/04_Presentation/components/atoms/](src/04_Presentation/components/atoms/)                       | Yes   | —                                                           | Yes                                       | No                 |


### Organs


| Path                                                                                                               | Used?       | Auto or manual?                                        | No hardcoding?                            | Partial/stub/dead? |
| ------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------ | ----------------------------------------- | ------------------ |
| [src/04_Presentation/components/organs/organ-registry.ts](src/04_Presentation/components/organs/organ-registry.ts) | Yes         | **Manual** — static imports + VARIANTS + getOrganLabel | **No** — manual registry updates required | No                 |
| [src/04_Presentation/components/organs/**/variants/*.json](src/04_Presentation/components/organs/)                 | Yes         | Discovered only via organ-registry imports             | Yes                                       | No                 |
| [src/04_Presentation/components/organs/**/manifest.json](src/04_Presentation/components/organs/)                   | Doc/tooling | Not read by organ-registry at runtime                  | —                                         | Partial            |


### Generated files


| Path / pattern                                                                         | Role                                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [src/02_Contracts_Reports/docs/**/*.generated.md](src/02_Contracts_Reports/docs/)      | Autogen reports (reachability, violations, registry map, etc.) |
| [.next/](.next/)                                                                       | Next build output                                              |
| [src/07_Dev_Tools/scripts/organ-index.json](src/07_Dev_Tools/scripts/organ-index.json) | Written/read by blueprint script; not runtime registry         |


### npm scripts related to system build

- `validate:paths`, `verify:atoms`, `verify:compounds`, `verify:organ-compile`, `blocks:status`, `prebuild`
- `blueprint`, `contract:validate`, `contract:report`, `pipeline:proof`
- `compile`, `website`, `extract-2`, `logic:compile`, `onboarding`
- `system-report`, `docs:reachability`, `app`, `app:report`, `product-screen`
- Organ layer tests: `test:organs:layer1` … `test:organs:layer7`

### Manual registries (summary)

- **organ-registry.ts** — VARIANTS + getOrganLabel; new organ/variant = new import + entry
- **registry.tsx** — Registry object; new JSON type = new entry
- **molecules/index.ts** — COMPONENT_MAP; new compound = new import + entry
- **action-registry.ts** — handler map; new action = new entry
- **engineRegistry.ts** — registerEngine() from each engine file
- **engine-registry.ts** (logic) — EXECUTION_ENGINE_REGISTRY, etc.
- **layoutThumbnailRegistry.ts** — SECTION/CARD/ORGAN_LAYOUT_THUMBNAILS
- **card-layout-presets.ts** — CARD_LAYOUT_PRESETS
- **module-registry.ts** — registry object for module IDs
- **calc-registry.ts** — CALCULATOR_REGISTRY (from JSON) + CALC_REGISTRY (registerCalc)
- **safe-json-loader.ts** — appsRegistry (empty; no JSON apps from filesystem)
- **GlobalAppSkin.tsx** / **BottomNavBar_IconLegacy.tsx** — iconRegistry objects

### Hardcoded configuration (summary)

- [src/app/layout.tsx](src/app/layout.tsx): `PALETTES` array (lines 81–91); `STAGE_MAX_WIDTH`_* constants
- [src/04_Presentation/lib-layout/card-layout-presets.ts](src/04_Presentation/lib-layout/card-layout-presets.ts): `CARD_LAYOUT_PRESETS`
- [src/app/ui/layoutThumbnailRegistry.ts](src/app/ui/layoutThumbnailRegistry.ts): section/card/organ thumbnail map
- [src/07_Dev_Tools/scripts/blueprint.ts](src/07_Dev_Tools/scripts/blueprint.ts): `ALLOWED_CONTENT_KEYS`
- [src/02_Contracts_Reports/contracts/layout-node-types.ts](src/02_Contracts_Reports/contracts/layout-node-types.ts): `LAYOUT_NODE_TYPES_LIST` (data in code; used for collapse)
- [src/04_Presentation/lib-layout/layout-allowed-types.json](src/04_Presentation/lib-layout/layout-allowed-types.json) and [template-roles.json](src/04_Presentation/lib-layout/template-roles.json) — JSON (compliant)
- [src/07_Dev_Tools/config/config.json](src/07_Dev_Tools/config/config.json) — rendererContract.nonActionableTypes, stateDefaults (compliant)

---

## B) Contract Compliance Report

Doctrine reference: [docs/POWERPLAY_SYSTEM_DOCTRINE.md](docs/POWERPLAY_SYSTEM_DOCTRINE.md) plus stated rules: no hardcoding, TSX dumb wrappers, JSON-driven structure, blueprint node switching, layout compliance, palette modularity, engines minimal and pure, no rogue systems, no manual registry updates required.


| Doctrine / rule                     | Status                   | Notes / file paths                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No hardcoding (styling, structure)  | ⚠ Violates doctrine      | [src/app/layout.tsx](src/app/layout.tsx) PALETTES; [src/04_Presentation/lib-layout/card-layout-presets.ts](src/04_Presentation/lib-layout/card-layout-presets.ts); [src/app/ui/layoutThumbnailRegistry.ts](src/app/ui/layoutThumbnailRegistry.ts); [src/07_Dev_Tools/scripts/blueprint.ts](src/07_Dev_Tools/scripts/blueprint.ts) ALLOWED_CONTENT_KEYS; slot names by type (see JSON_DRIVEN_VIOLATIONS)                                                                       |
| TSX as dumb wrappers                | ✅ Present and compliant  | Compounds under [src/04_Presentation/components/molecules/](src/04_Presentation/components/molecules/) render from params/content; Registry resolves type → component                                                                                                                                                                                                                                                                                                         |
| JSON-driven structure               | ⚠ Present but incomplete | Layout IDs, requirements, templates, allowedTypes, template-roles, NON_ACTIONABLE_TYPES from config — from JSON. Palette list for UI, card presets, thumbnails, organ/molecule/action registries still in code                                                                                                                                                                                                                                                                |
| Blueprint node switching            | ✅ Present and compliant  | Blueprint script + schema; layout from template/override; no hardcoded layout ID in resolver when ref missing                                                                                                                                                                                                                                                                                                                                                                 |
| Layout compliance                   | ✅ Present and compliant  | [src/04_Presentation/layout/](src/04_Presentation/layout/); requirement-registry from layout-requirements.json; getLayout2Ids for dropdowns; no silent fallback to invented layout ID                                                                                                                                                                                                                                                                                         |
| Palette modularity                  | ⚠ Present but incomplete | Palettes auto-discovered from [src/04_Presentation/palettes/](src/04_Presentation/palettes/); [src/app/layout.tsx](src/app/layout.tsx) uses hardcoded PALETTES for UI                                                                                                                                                                                                                                                                                                         |
| Engines minimal and pure            | ⚠ Present but incomplete | Business/flow engines use registerEngine; execution engines (learning, calculator, abc) are flow/state transformers; doctrine says “all engines remain pure” — catalog and execution separation present; some engines have side-effect registration                                                                                                                                                                                                                           |
| No independent rogue systems        | ✅ Present and compliant  | Single Registry, single layout resolver path, single requirement-registry; no duplicate type→component maps                                                                                                                                                                                                                                                                                                                                                                   |
| No manual registry updates required | ❌ Missing                | New organ/variant, new molecule, new JSON node type, new action, new layout thumbnail require code/registry edits in [organ-registry.ts](src/04_Presentation/components/organs/organ-registry.ts), [molecules/index.ts](src/04_Presentation/components/molecules/index.ts), [registry.tsx](src/03_Runtime/engine/core/registry.tsx), [action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts), [layoutThumbnailRegistry.ts](src/app/ui/layoutThumbnailRegistry.ts) |


---

## C) Registry & Hardcoding Audit

**Manual registry files (require edits to add items):**

- [src/04_Presentation/components/organs/organ-registry.ts](src/04_Presentation/components/organs/organ-registry.ts) — VARIANTS, getOrganLabel
- [src/03_Runtime/engine/core/registry.tsx](src/03_Runtime/engine/core/registry.tsx) — Registry
- [src/04_Presentation/components/molecules/index.ts](src/04_Presentation/components/molecules/index.ts) — COMPONENT_MAP
- [src/05_Logic/logic/runtime/action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts) — registry map
- [src/app/ui/layoutThumbnailRegistry.ts](src/app/ui/layoutThumbnailRegistry.ts) — SECTION_LAYOUT_THUMBNAILS, CARD_LAYOUT_THUMBNAILS, ORGAN_LAYOUT_THUMBNAILS
- [src/module-system/module-registry.ts](src/module-system/module-registry.ts) — registry object
- [src/04_Presentation/shells/GlobalAppSkin.tsx](src/04_Presentation/shells/GlobalAppSkin.tsx), [BottomNavBar_IconLegacy.tsx](src/04_Presentation/shells/BottomNavBar_IconLegacy.tsx) — iconRegistry

**Barrel exports requiring edits:** Adding a new compound requires editing [src/04_Presentation/components/molecules/index.ts](src/04_Presentation/components/molecules/index.ts) and [src/03_Runtime/engine/core/registry.tsx](src/03_Runtime/engine/core/registry.tsx). Adding a new organ variant requires editing [src/04_Presentation/components/organs/organ-registry.ts](src/04_Presentation/components/organs/organ-registry.ts).

**Hardcoded arrays of components:** COMPONENT_MAP in [src/04_Presentation/components/molecules/index.ts](src/04_Presentation/components/molecules/index.ts); Registry in [src/03_Runtime/engine/core/registry.tsx](src/03_Runtime/engine/core/registry.tsx); VARIANTS in [src/04_Presentation/components/organs/organ-registry.ts](src/04_Presentation/components/organs/organ-registry.ts).

**Hardcoded style/layout decisions:** [src/04_Presentation/lib-layout/card-layout-presets.ts](src/04_Presentation/lib-layout/card-layout-presets.ts) (preset defs); [src/app/layout.tsx](src/app/layout.tsx) STAGE_MAX_WIDTH_* and PALETTES; thumbnail path map in [src/app/ui/layoutThumbnailRegistry.ts](src/app/ui/layoutThumbnailRegistry.ts).

**Hardcoded behavior toggles:** action-registry handler map; contract verbs in [src/02_Contracts_Reports/contracts/contract-verbs.ts](src/02_Contracts_Reports/contracts/contract-verbs.ts) (from config per refactor); NON_ACTIONABLE_TYPES from [src/07_Dev_Tools/config/config.json](src/07_Dev_Tools/config/config.json) (compliant).

**Direct imports that bypass intended discovery:** Organ variants loaded via static imports in organ-registry (no require.context or scan). Compounds and Registry components imported directly; no manifest-driven discovery.

---

## D) Missing or Incomplete Areas

**Designed but not implemented (observable):**

- **Trait registry / Layout Decision Engine:** Documented in [src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/TRAIT_REGISTRY_SYSTEM.md](src/02_Contracts_Reports/docs/ARCHITECTURE_AUTOGEN/TRAIT_REGISTRY_SYSTEM.md) and LAYOUT_DECISION_ENGINE; no trait-registry.json or layout-traits.json in codebase; no layout ID → traits lookup in runtime.
- **applyProfileToNode suggestion slot:** Docs reference suggestion from logic/Decision Engine; no suggestion slot wired in resolver.

**Partially wired:**

- **Engine registry (flow):** [src/05_Logic/logic/engine-system/engine-registry.ts](src/05_Logic/logic/engine-system/engine-registry.ts) used for flow/TSX path (engine-viewer, flow-loader, OnboardingFlowRenderer); not on main JSON screen path (page.tsx → loadScreen → JsonRenderer).
- **JSON screen loader:** [src/03_Runtime/runtime/loaders/safe-json-loader.ts](src/03_Runtime/runtime/loaders/safe-json-loader.ts) — appsRegistry empty; returns null for all paths; JSON screens not loaded from filesystem.

**Scripts that do nothing or are no-ops:**

- [src/03_Runtime/engine/loaders/theme-loader.ts](src/03_Runtime/engine/loaders/theme-loader.ts) — empty file; no references.

**Contracts defined but unused in main path:**

- [src/02_Contracts_Reports/contracts/JSON_SCREEN_CONTRACT.json](src/02_Contracts_Reports/contracts/JSON_SCREEN_CONTRACT.json) — design-time schema; not imported for runtime validation in main render path.

**Layout/palette systems not fully integrated:**

- Palette list in [src/app/layout.tsx](src/app/layout.tsx) not derived from [src/04_Presentation/palettes/index.ts](src/04_Presentation/palettes/index.ts); new palette JSON requires code edit for UI dropdown.

**Behaviors defined but not consumed:**

- [src/03_Runtime/behavior/behavior-listerner.ts](src/03_Runtime/behavior/behavior-listerner.ts) — typo’d duplicate; not imported; dead.

---

## E) Summary


| Metric                               | Count                                                                                                                                                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Total component count discovered** | ~80+ (atoms, 12 molecules, layout molecules, flow cards, organs with many variants, engines, behaviors, resolvers, registries)                                                                                                                            |
| **Total registries found**           | 12+ (Registry, organ VARIANTS, COMPONENT_MAP, action-registry, engineRegistry, engine-registry logic, layoutThumbnailRegistry, requirement-registry, card-layout-presets, calc-registry, module-registry, iconRegistry x2, safe-json-loader appsRegistry) |
| **Total hardcoding violations**      | 8+ (PALETTES in layout.tsx; card-layout-presets; layoutThumbnailRegistry; blueprint ALLOWED_CONTENT_KEYS; LAYOUT_NODE_TYPES_LIST in code; slot names by type in blueprint; action-registry map; organ/molecule/Registry manual maps)                      |


**Top 5 structural risks:**

1. **Manual organ registry** — Every new organ/variant requires editing [organ-registry.ts](src/04_Presentation/components/organs/organ-registry.ts) (imports + VARIANTS + getOrganLabel); no file-scan or manifest-driven discovery.
2. **Manual component Registry** — New JSON node type requires editing [registry.tsx](src/03_Runtime/engine/core/registry.tsx) and possibly [molecules/index.ts](src/04_Presentation/components/molecules/index.ts); drift risk if JSON references a type not in Registry.
3. **Palette UI list duplication** — [layout.tsx](src/app/layout.tsx) PALETTES array can diverge from [palettes/](src/04_Presentation/palettes/) JSON; new palette requires code change for UI.
4. **Layout thumbnail registry** — [layoutThumbnailRegistry.ts](src/app/ui/layoutThumbnailRegistry.ts) must be updated for every new section/card/organ layout ID to avoid missing thumbnails.
5. **Trait registry missing** — Layout Decision Engine and contextual layout logic are documented but depend on trait-registry.json/layout-traits.json and context→weights JSON; none exist; scoring by traits not implemented.

**Top 5 missing integrations:**

1. **Trait registry** — No trait-registry.json or layout-traits.json; no layout ID → traits lookup; Decision Engine and contextual layout not wired.
2. **Organ discovery** — Organ manifest.json files not used for runtime discovery; organ-registry is fully manual.
3. **Molecule/compound discovery** — No manifest or scan driving Registry/COMPONENT_MAP; verify-compounds-manifest is report-only.
4. **Palette list for UI** — Palette dropdown not driven by palettes/index.ts or palettes JSON.
5. **Flow engine path vs main JSON path** — Engine registry (getExecutionEngine, applyEngine) not on main page.tsx → JsonRenderer path; flow/TSX screens use it separately.

---

*Report complete. No fixes or redesigns proposed.*