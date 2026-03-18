---
name: Full Structural Domain Implementation
overview: Formalize a single StructuralDomain contract that unifies data slice, presentation (structureType + template), state binding, engine registration, behavior bridge, and TSX envelope enforcement—without replacing existing systems—and wire it through the TSX wrapper, resolver, and context.
todos: []
isProject: false
---

# Full Structural Domain Implementation

## Current state (findings)

- **StructureSlice** is defined locally in two places: [structure.actions.ts](src/05_Logic/logic/actions/structure.actions.ts) (lines 30–56, canonical planner shape) and [usePlannerViewModels.ts](src/01_App/(dead) Tsx/HiClarify/usePlannerViewModels.ts) (dead). No single exported type.
- **TSX flow**: [TSXScreenWithEnvelope](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx) takes `screenPath` and `Component`; [resolveAppStructure](src/lib/tsx-structure/resolver/index.ts) uses path + metadata only (no domain object). [ResolvedAppStructure](src/lib/tsx-structure/types.ts) has `structureType`, `template`, `schemaVersion`, `featureFlags` — no `stateKey`, `layoutProfile`, or `engines`.
- **Layout profile**: [getDefaultTsxEnvelopeProfile](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts) derives layout from path/experience; no input from a domain contract.
- **State**: [state-store](src/03_Runtime/state/state-store.ts) exposes `getState` / `subscribeState`; structure.actions uses hardcoded `STRUCTURE_KEY = "structure"`.
- **Behavior**: [behavior-listener](src/03_Runtime/engine/core/behavior-listener.ts) routes actions; [contract-verbs](src/02_Contracts_Reports/contracts/contract-verbs.ts) is the verb set. No named “behavior bindings” registry today.
- **Engines**: TSX engines (list, timeline, etc.) live under [src/lib/tsx-structure/engines/](src/lib/tsx-structure/engines/); no central registration or validation.

---

## Phase 1 — Create Structural Domain contract

**Create** [src/structure/StructureDomain.ts](src/structure/StructureDomain.ts):

- Define and export `StructureDomainDefinition` with:
  - `appName`, `appType` (`"app" | "web" | "learning" | "dashboard" | "system"`)
  - Data: `stateKey`, `sliceType` (typed as `unknown`; doc that it must reference canonical StructureSlice)
  - Presentation: `structureType` (union matching [types.ts](src/lib/tsx-structure/types.ts) `StructureType`), `template` (string), optional `layoutProfile`
  - Engine: optional `engines?: string[]`, `behaviorBindings?: string[]`
  - Content: optional `contentContract?: string`
  - Compliance: optional `enforceMoleculeCompliance?: boolean`, `enforceVerbCompliance?: boolean`

No runtime behavior here; types only.

---

## Phase 2 — Canonical StructureSlice export

**Create** [src/structure/StructureSlice.ts](src/structure/StructureSlice.ts):

- Move (or re-export) the **planner** `StructureSlice` type from [structure.actions.ts](src/05_Logic/logic/actions/structure.actions.ts) (lines 30–56) into this file so it is the single exported definition. It depends on types from `@/logic/engines/structure/structure.types` and `@/logic/planner/journey-types` — keep those imports and define the slice shape in StructureSlice.ts.
- **Update** [structure.actions.ts](src/05_Logic/logic/actions/structure.actions.ts): import `StructureSlice` from `@/structure/StructureSlice` and remove the local type definition.
- **Update** [usePlannerViewModels.ts](src/01_App/(dead) Tsx/HiClarify/usePlannerViewModels.ts) if it stays in use: import `StructureSlice` from `@/structure/StructureSlice` and remove local type.
- Ensure no other files define a local `StructureSlice`; all consumers import from [src/structure/StructureSlice.ts](src/structure/StructureSlice.ts).

---

## Phase 3 — Bind Structure Domain to TSX wrapper

**Domain source:** Envelope must read `structureDomain` when a screen exports it. Use a small **registry** so screens can register at module load without the parent having to pass the object:

- **Add** in `src/structure/` (e.g. in StructureDomain.ts or a tiny `structureDomainRegistry.ts`):
  - `registerStructureDomain(screenPath: string, domain: StructureDomainDefinition): void`
  - `getStructureDomain(screenPath: string): StructureDomainDefinition | undefined`
- Screens that export `structureDomain` call `registerStructureDomain(screenPath, structureDomain)` at top level (or document that callers may pass it as prop).

**TSXScreenWithEnvelope** ([TSXScreenWithEnvelope.tsx](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx)):

- Add optional prop: `structureDomain?: StructureDomainDefinition`.
- Resolve domain: `domain = structureDomain ?? getStructureDomain(screenPath)`.
- When `domain` is present:
  - Pass `domain.stateKey`, `domain.structureType`, `domain.layoutProfile`, `domain.engines` into the resolved structure and into context (see below).
  - Use `domain.structureType` and `domain.template` for resolution when provided (override convention).
- When **domain is missing** and the screen is considered “domain-required” (e.g. any TSX screen in dev that matches a path pattern, or a simple heuristic): in **development only**, log a **console error** and optionally render a small dev-only error state (e.g. “structureDomain required for this screen”). No silent fallback.

**resolveAppStructure** ([resolver/index.ts](src/lib/tsx-structure/resolver/index.ts)):

- Extend signature to accept optional `structureDomain?: StructureDomainDefinition`.
- When `structureDomain` is provided: use `structureDomain.structureType`, `structureDomain.template` (as template id for [loadTemplate](src/lib/tsx-structure/resolver/templateLoader.ts)), and merge any overrides from metadata. Do not override with convention when domain is present.

**ResolvedAppStructure** ([types.ts](src/lib/tsx-structure/types.ts)):

- Add optional fields: `stateKey?: string`, `layoutProfile?: string`, `engines?: string[]`.
- Envelope sets these from `structureDomain` when available.

**StructureConfigProvider / useStructureConfig**:

- Provider value already is `ResolvedAppStructure`; once it includes `stateKey`, `layoutProfile`, `engines`, envelope just assigns them from the resolved object (which was built from `structureDomain` when present).

**Call sites:**

- [page.tsx](src/app/page.tsx): For the single TSX screen (HiClarifyOnboarding), either pass `structureDomain` from the same dynamic-imported module (e.g. `import("@/apps-tsx/...").then(m => ({ default: m.default, structureDomain: m.structureDomain }))` and pass `structureDomain` into the envelope) or rely on the screen registering via `registerStructureDomain` so the envelope can look it up by `screenPath`.
- [dev/page.tsx](src/app/dev/page.tsx): When resolving a TSX component from `AUTO_TSX_MAP` / `EXPLICIT_TSX_MAP`, the loaded module can expose `structureDomain`; either pass it through to `TSXScreenWithEnvelope` or ensure the screen registers with the path the dev page uses (e.g. `tsxMeta.path`).

---

## Phase 4 — useStructureSlice(stateKey?) hook

**Create** a hook (e.g. in [src/structure/useStructureSlice.ts](src/structure/useStructureSlice.ts) or under `src/lib/tsx-structure/`):

- `useStructureSlice(stateKey?: string)`:
  - Uses `getState` and `subscribeState` from [state-store](src/03_Runtime/state/state-store.ts).
  - Resolves key: `stateKey ?? useStructureConfig()?.stateKey ?? "structure"`.
  - Returns `state.values[key]` (and optionally a stable setter reference if needed; at minimum read-only is enough for “binding”).
- Document that planner/timeline screens should use this hook instead of reading `state.values.structure` directly.

Do **not** change structure.actions or scheduling engine; they keep using their current key. The hook is the recommended way for TSX screens to bind to the slice.

---

## Phase 5 — Engine registration safety

**Create** [src/structure/engineRegistry.ts](src/structure/engineRegistry.ts):

- `registerEngine(name: string, engine: unknown): void` — store in a `Map<string, unknown>`.
- `isEngineRegistered(name: string): boolean`.
- `getRegisteredEngineNames(): string[]` (for dev validation).
- When building the resolved structure from `StructureDomainDefinition`, if `domain.engines` is declared, **in development** loop over names and call `isEngineRegistered(name)`; if any is false, log a **console error** (and optionally a dev-only warning in the UI). Do **not** create or generate engines; only enforce registration.

Wire registration at app bootstrap: register existing TSX-structure engines (list, board, dashboard, editor, timeline, detail, wizard, gallery) by name so that domains declaring e.g. `engines: ["timeline"]` pass validation.

---

## Phase 6 — Behavior bridge validation

- **Add** a small registry (e.g. in `src/structure/` or alongside contract-verbs): `registerBehaviorBinding(name: string): void`, `isBehaviorBindingRegistered(name: string): boolean`.
- When `StructureDomainDefinition.behaviorBindings` is present, **in development** validate each name against this registry; if any is missing, log a **console error**.
- Document that templates must not use direct router or `dispatchState`; interactions must go through the behavior bridge (contract verbs / registered bindings). No change to behavior-listener or contract-verbs logic; only validation of declared bindings.

Optionally seed the registry with known contract verbs or behavior names so that domains can list them in `behaviorBindings`.

---

## Phase 7 — createApp entry contract

**Create** [src/structure/createApp.ts](src/structure/createApp.ts):

- `createApp(definition: StructureDomainDefinition): StructureDomainDefinition`
  - Validate: `structureType` is one of the allowed union values.
  - Validate: `stateKey` is non-empty string.
  - Validate: `template` is non-empty string.
  - If `engines` is present, validate each name is registered (call `isEngineRegistered`); in dev throw or log and throw.
  - If `behaviorBindings` is present, validate each name (e.g. against behavior registry); in dev throw or log and throw.
  - Return `Object.freeze(definition)` (shallow freeze is enough).
- No file generation, no magic; purely deterministic validation and freeze.

---

## Phase 8 — TSX template compliance (documentation + optional dev checks)

- **Document** in a short rule or comment in the TSX/structure layer:
  - Templates must read layout from the envelope (via `useStructureConfig()` / structureProps), not define `EXPERIENCE_LAYOUT` inside the template.
  - No hardcoded state keys in templates (use `useStructureSlice()` or context).
  - No hardcoded router or direct `dispatchState` in templates; use behavior bridge / verbs.
  - No hardcoded copy in templates; use content files/contracts where applicable.
- **Optional**: In development, if a screen has `structureDomain` but the tree under the envelope never calls `useStructureConfig()` (or useStructureSlice), log a **console warning** (e.g. “template does not consume structure config”). This can be a simple dev-only check in the envelope or a small hook that marks “config consumed”.

---

## Phase 9 — Dev-mode strictness

Centralize dev-only errors in one place (e.g. a small `validateStructureDomain` or inline in envelope/createApp):

- If `structureType` is set but `stateKey` is missing → **console error**.
- If an engine is declared in `engines` but not registered → **console error** (already covered in Phase 5 and 7).
- If `structureDomain` is required for the screen but missing → **console error** (Phase 3).
- If template exists but does not consume structure config (optional, Phase 8) → **console warning**.

No silent fallbacks in dev.

---

## Constraints (unchanged)

- Do **not** rewrite engines, scheduling engine, blueprint/content contracts, or remove the current tsx-structure engine.
- Only add the formal contract, registry, validation, and wiring.

---

## Resulting developer contract

After implementation, a new app can be defined like this:

```ts
import { createApp } from "@/structure/createApp";
import { registerStructureDomain } from "@/structure/StructureDomain"; // or registry module

export const structureDomain = createApp({
  appName: "planner",
  appType: "app",
  stateKey: "structure",
  structureType: "timeline",
  template: "PlannerTemplate",
  engines: ["scheduler"],
});

registerStructureDomain("HiClarify/Planner", structureDomain);
```

The system then guarantees: correct state binding (via `stateKey` and `useStructureSlice`), correct layout binding (via envelope + `layoutProfile`), engine registration checks, TSX enforcement (envelope injects domain into context; missing domain fails in dev), and no drift via a single frozen definition.

---

## File summary


| Action   | File                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create   | `src/structure/StructureDomain.ts` (interface + optional registry)                                                                                           |
| Create   | `src/structure/StructureSlice.ts` (canonical export)                                                                                                         |
| Create   | `src/structure/engineRegistry.ts`                                                                                                                            |
| Create   | `src/structure/createApp.ts`                                                                                                                                 |
| Create   | `src/structure/useStructureSlice.ts` (or under tsx-structure)                                                                                                |
| Modify   | `src/05_Logic/logic/actions/structure.actions.ts` (import StructureSlice)                                                                                    |
| Modify   | `src/lib/tsx-structure/types.ts` (extend ResolvedAppStructure)                                                                                               |
| Modify   | `src/lib/tsx-structure/resolver/index.ts` (accept optional structureDomain)                                                                                  |
| Modify   | `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx` (domain prop + registry lookup, inject stateKey/layoutProfile/engines, dev fail when required and missing) |
| Modify   | `src/lib/tsx-structure/StructureConfigContext.tsx` (no API change; value type gains optional fields)                                                         |
| Optional | Behavior binding registry in `src/structure/` and validation in createApp/envelope                                                                           |
| Optional | Bootstrap: register TSX engines in engineRegistry                                                                                                            |


