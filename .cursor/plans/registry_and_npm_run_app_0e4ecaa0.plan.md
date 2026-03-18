---
name: Registry and npm run app
overview: "Add a governance-only layer: self-registering registries for engines, templates, and structure types under `src/system/registry/`, append registration calls to existing engine and template files without changing their logic, and implement `npm run app` (scripts/app.ts) that prompts for an app description, snapshots registries, calls a Cursor/LLM placeholder, and displays a plan requiring explicit approval with no code generation."
todos: []
isProject: false
---

# Self-Registering Registry + npm run app — Implementation Plan

## Scope and constraints (unchanged)

- **Add only:** registry + orchestrator layer. Do not rewrite engines, scheduling, blueprint/content contracts, `structure.actions`, or logic behavior.
- **No** auto-generation of engines, no refactor of structure domain, no direct router in templates, no hardcoded state in templates. Unregistered engines/templates must cause `app` to fail.

---

## Phase 1 — Create self-registering registries

**Location:** [src/system/registry/](src/system/registry/) (new directory).

Create three modules:


| File                                                                                 | Exports                                                    | Behavior                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [src/system/registry/engineRegistry.ts](src/system/registry/engineRegistry.ts)       | `registerEngine(definition)`, `getEngines()`               | In-memory store; definition shape: `{ name: string, integratesWith?: string[], description: string }`. Duplicate `name` → throw in dev (`process.env.NODE_ENV !== 'production'`). `getEngines()` returns array sorted by `name` (deterministic). |
| [src/system/registry/templateRegistry.ts](src/system/registry/templateRegistry.ts)   | `registerTemplate(definition)`, `getTemplates()`           | Definition: `{ name: string, structureType: string, requiredStateKeys?: string[], supportedEngines?: string[] }`. Same duplicate check and sorted return.                                                                                        |
| [src/system/registry/structureRegistry.ts](src/system/registry/structureRegistry.ts) | `registerStructureType(definition)`, `getStructureTypes()` | Definition: `{ name: string }` (and optional `description?: string`). Same duplicate check and sorted return.                                                                                                                                    |


**Implementation details:**

- Store in a private `Map` or array keyed by `name`; on `register`*, if name already present, throw in development.
- No I/O, no imports from app/runtime logic (registries are dependency-free except `process.env` for dev check).
- Optional: single barrel [src/system/registry/index.ts](src/system/registry/index.ts) re-exporting all six functions.

---

## Phase 2 — Engine self-registration

**Scope:** All engine files under [src/05_Logic/logic/engines/](src/05_Logic/logic/engines/) that are actual “engine” entry points (exclude index files, pure types, and shared utilities that are not engines).

**Files to append registration to (append only; do not change logic):**

- Root: [25x.engine.ts](src/05_Logic/logic/engines/25x.engine.ts), [abc.engine.ts](src/05_Logic/logic/engines/abc.engine.ts), [flow-router.ts](src/05_Logic/logic/engines/flow-router.ts), [learning.engine.ts](src/05_Logic/logic/engines/learning.engine.ts), [json-skin.engine.tsx](src/05_Logic/logic/engines/json-skin.engine.tsx), [Onboarding-flow-router.tsx](src/05_Logic/logic/engines/Onboarding-flow-router.tsx), [next-step-reason.ts](src/05_Logic/logic/engines/next-step-reason.ts)
- structure/: [recurrence.engine.ts](src/05_Logic/logic/engines/structure/recurrence.engine.ts), [prioritization.engine.ts](src/05_Logic/logic/engines/structure/prioritization.engine.ts), [parser-v4.engine.ts](src/05_Logic/logic/engines/structure/parser-v4.engine.ts), [structure-mapper.engine.ts](src/05_Logic/logic/engines/structure/structure-mapper.engine.ts), [scheduling.engine.ts](src/05_Logic/logic/engines/structure/scheduling.engine.ts), [aggregation.engine.ts](src/05_Logic/logic/engines/structure/aggregation.engine.ts), [progression.engine.ts](src/05_Logic/logic/engines/structure/progression.engine.ts), [rule-evaluator.engine.ts](src/05_Logic/logic/engines/structure/rule-evaluator.engine.ts)
- calculator/: [calculator.engine.ts](src/05_Logic/logic/engines/calculator/calculator.engine.ts)
- comparison/: [value-comparison.engine.ts](src/05_Logic/logic/engines/comparison/value-comparison.engine.ts), [value-translation.engine.ts](src/05_Logic/logic/engines/comparison/value-translation.engine.ts)
- summary/: [summary.engine.ts](src/05_Logic/logic/engines/summary/summary.engine.ts)
- decision/: [decision.engine.ts](src/05_Logic/logic/engines/decision/decision.engine.ts)
- post-processing/: [hi-engine-runner.ts](src/05_Logic/logic/engines/post-processing/hi-engine-runner.ts)

**Do not add registration to:** [structure/index.ts](src/05_Logic/logic/engines/structure/index.ts), [structure.types.ts](src/05_Logic/logic/engines/structure/structure.types.ts), [date-utils.ts](src/05_Logic/logic/engines/structure/date-utils.ts), [extreme-mode-parser.ts](src/05_Logic/logic/engines/structure/extreme-mode-parser.ts), [decision-engine.ts](src/05_Logic/logic/engines/decision-engine.ts) (re-export only), [engine-selector.ts](src/05_Logic/logic/engines/shared/engine-selector.ts), [export-resolver.ts](src/05_Logic/logic/engines/summary/export-resolver.ts), calcs/*, value-dimensions.ts, calc-registry.ts.

**Pattern at bottom of each engine file:**

```ts
import { registerEngine } from "@/system/registry/engineRegistry";
registerEngine({
  name: "engineName",
  integratesWith: ["stateKey"],
  description: "short description",
});
```

Use a stable, unique `name` per file (e.g. `scheduling`, `recurrence`, `parser-v4`, `flow-router`, `learning`, `calculator`, `abc`, `25x`, `json-skin`, `onboarding-flow-router`, `next-step-reason`, `decision`, `summary`, `value-comparison`, `value-translation`, `hi-engine-runner`, etc.). `integratesWith` and `description` should reflect actual behavior (can be minimal one-liners).

---

## Phase 3 — Template self-registration

**Scope:** TSX templates used as app templates — the eight structure engines in [src/lib/tsx-structure/engines/](src/lib/tsx-structure/engines/) that map structure types to config normalizers/hooks.

**Files to append registration to:**

- [list.ts](src/lib/tsx-structure/engines/list.ts), [board.ts](src/lib/tsx-structure/engines/board.ts), [dashboard.ts](src/lib/tsx-structure/engines/dashboard.ts), [editor.ts](src/lib/tsx-structure/engines/editor.ts), [timeline.ts](src/lib/tsx-structure/engines/timeline.ts), [detail.ts](src/lib/tsx-structure/engines/detail.ts), [wizard.ts](src/lib/tsx-structure/engines/wizard.ts), [gallery.ts](src/lib/tsx-structure/engines/gallery.ts)

**Pattern at bottom of each (no change to rendering logic):**

```ts
import { registerTemplate } from "@/system/registry/templateRegistry";
registerTemplate({
  name: "List",
  structureType: "list",
  requiredStateKeys: ["structure"],
  supportedEngines: [],
});
```

Align `structureType` with [types.ts](src/lib/tsx-structure/types.ts) (`StructureType`: list, board, dashboard, editor, timeline, detail, wizard, gallery). `requiredStateKeys` and `supportedEngines` can be filled from existing behavior (e.g. timeline may reference `scheduler` if applicable).

---

## Phase 4 — Structure type registration

Structure types are the eight values of `StructureType` in [src/lib/tsx-structure/types.ts](src/lib/tsx-structure/types.ts). Two options:

- **Option A (recommended):** One bootstrap file [src/system/registry/structureTypes.ts](src/system/registry/structureTypes.ts) that imports `structureRegistry` and registers all eight types (`list`, `board`, `dashboard`, `editor`, `timeline`, `detail`, `wizard`, `gallery`) with optional short descriptions. No changes to [contracts/*.ts](src/lib/tsx-structure/contracts/).
- **Option B:** Add `registerStructureType({ name: "list" })` at the bottom of each of the eight contract files in [src/lib/tsx-structure/contracts/](src/lib/tsx-structure/contracts/) (list, board, dashboard, editor, timeline, detail, wizard, gallery).

Use **Option A** to avoid touching contract boundaries and keep a single source of truth for “which structure types exist” for the app script.

---

## Phase 5 — Implement npm run app

**Create:** [scripts/app.ts](scripts/app.ts)

**Add to [package.json](package.json):**

- Script: `"app": "tsx scripts/app.ts"` (add `tsx` to devDependencies if not present).
- Alternative without new dependency: `"app": "ts-node -r tsconfig-paths/register scripts/app.ts"` to match existing scripts.

**Behavior of app.ts:**

1. **Prompt** for natural-language app description (e.g. Node readline or simple `createInterface` stdin).
2. **Import** engineRegistry, templateRegistry, structureRegistry. Ensure structure type registrations run (e.g. import `@/system/registry/structureTypes` or equivalent so the eight types are registered). Optionally import a single module that side-effect imports all engine and template files so that by the time snapshot runs, all self-registrations have executed.
3. **Snapshot:** `engines = getEngines()`, `templates = getTemplates()`, `structureTypes = getStructureTypes()`.
4. **Send** `{ description, engines, templates, structureTypes }` to a placeholder function, e.g. `sendToCursor(description, { engines, templates, structureTypes })` that returns a **plan object**: `{ proposedStructureType, proposedTemplate, enginesReused, enginesProposed, integrationExplanation, checklistValidation }`. Implement placeholder to return a stub plan (e.g. fixed structureType `list`, template `default`, empty arrays, short explanation, and a minimal checklist).
5. **Validate:** If any `enginesProposed` or referenced engine is not in `engines` → fail with clear error. If proposed template is not in `templates` or template registration is missing → fail.
6. **Display** the plan clearly (console.log or formatted output).
7. **Require explicit approval** (e.g. “Proceed? (y/n)”); if not approved, exit without generating anything.
8. **Do not generate code** and **do not auto-create engines**; exit after approval with a message that no code was generated (governance-only).

**Safety (Phase 5):** Enforce: no direct router in templates, no hardcoded state usage, no unregistered engines. If engine proposed but not in `getEngines()` → fail. If template missing registration → fail.

---

## Phase 6 — Analysis report

After implementation, produce a **one-time summary report** (can be a script or the final run of a small script that imports all registries and side-effect imports so everything is registered):

- Total engines registered.
- Total templates registered.
- Total structure types registered.
- List any missing registrations (e.g. engines under `engines/`** that were not given registration and are not in the exclusion list).
- Duplicate names (none expected if dev throw is in place).
- Files that could not be auto-registered (e.g. if an engine file has no clear `name` or is excluded by design).

This can be implemented as a small script, e.g. `scripts/registry-report.ts`, run with `ts-node -r tsconfig-paths/register scripts/registry-report.ts`, or as part of `npm run app` when run with a flag like `--report-only`.

---

## Dependency and paths

- Registries under `src/system/registry/` should be resolvable via existing path aliases (e.g. `@/system/registry/...`). Verify [tsconfig.json](tsconfig.json) has `"@/*": ["src/*"]` or equivalent.
- For `scripts/app.ts` to import `@/system/registry/`*, use `ts-node -r tsconfig-paths/register` or ensure `tsx` respects tsconfig paths.
- Ensure `scripts/app.ts` triggers registration: either import a “bootstrap” that imports all engine and template modules, or document that running the app script in a context where those modules are loaded (e.g. via a single entry that imports engines and templates) is required. Prefer a single bootstrap entry that imports engines and templates for registration, then takes the snapshot.

---

## Execution order

1. Implement Phase 1 (all three registries + optional index).
2. Implement Phase 4 (structure type bootstrap).
3. Implement Phase 2 (append engine registration to each listed engine file).
4. Implement Phase 3 (append template registration to each of the eight tsx-structure engines).
5. Implement Phase 5 (scripts/app.ts, package.json script, placeholder, validation, display, approval gate).
6. Implement Phase 6 (registry report script or --report-only mode).
7. Run report and fix any missing/duplicate registrations.

---

## Out of scope (no changes)

- [src/05_Logic/logic/engine-system/engine-registry.ts](src/05_Logic/logic/engine-system/engine-registry.ts) and [engine-contract.ts](src/05_Logic/logic/engine-system/engine-contract.ts) — runtime engine wiring stays as-is.
- [action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts), structure.actions, blueprint/content contracts, scheduling logic, and all engine/template internal behavior.

