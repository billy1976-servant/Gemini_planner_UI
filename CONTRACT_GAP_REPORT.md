## Contract gap report: HIcurv Blueprint Universe v1.0 (LOCKED) vs current repo

This report treats the contract you pasted as **absolute** and compares it to the current implementation in this workspace.

### Source-of-truth contract excerpts (what we enforced)
- **Molecule universe**: fixed set of molecules with allowed variants/sizes/content slots; and a hard list of which molecules may carry behavior.
- **Behavior universes**: Interaction (tap/double/long/drag/scroll/swipe), Navigation (go/back/open/close/route), Action (domain verbs like crop/filter/layout/…).
- **Hard rule**: *Only actionable molecules may execute behavior verbs.*
- **Hard rule**: *TEXT content is string-only.* MEDIA is reference-only. DATA has mandatory structure.
- **Stateful extension lock**: *State is never declared directly in the tree; state exists only as the target of a behavior verb.*
- **Content derivation system lock**: missing/malformed content leads to blank UI; compiler must generate `content.manifest.txt` and merge it.

---

## A) Incorrect mappings (runtime behavior + molecule contracts)

### A1) Non-actionable molecules currently execute behaviors (contract violation)

**Contract**
- Non-interactive/structural: `Section`, `Card`, `Field` must have **no behaviors**
- `Modal` behavior is **close only**

**Current implementation**
- Multiple molecules dispatch `navigate`, `action`, `interaction` regardless of whether they should be actionable.
  - Evidence: `src/compounds/ui/12-molecules/card.compound.tsx` dispatches CustomEvents just like actionable molecules (grep showed `navigate/action/interaction` present).

**Impact**
- Your runtime currently allows behavior to appear and execute on molecules that the contract forbids, so the system is not contract-deterministic.

**Minimal repair direction**
- Add a **behavior validator** at render-time (or compile-time) that blocks behavior on non-actionable molecules and blocks non-`close` behavior on `Modal`.

---

### A2) “Action” behavior exists on molecules that (per contract) only allow Navigation/Interaction

**Contract**
- Actionable molecules allow **Interaction** or **Navigation** verbs (explicit list by molecule).
- “Action behavior universe” exists, but the contract’s molecule section does *not* allow `Action` on `Button/Chip/List/Stepper/Toolbar/Footer/Avatar/Toast` (it lists Interaction+Navigation verbs, not `Action`).

**Current implementation**
- The UI layer supports **`behavior.type === "Action"`** broadly:
  - `src/compounds/ui/12-molecules/button.compound.tsx` dispatches `CustomEvent("action", { detail: behavior })`
  - Same in `Stepper`, `Chip`, `List`, `Footer`, `Toolbar`, `Toast`, `Avatar`

**Impact**
- This is a direct drift: the runtime has an `Action` channel that bypasses the contract’s verb tokens (`tap/go/back/...`) and introduces namespaced verbs (`state:*`).

**Minimal repair direction**
- Add a **normalization layer**: accept the contract’s one-word tokens in blueprint (e.g. `(tap)`, `(go)`, `(back)`) and compile them into a single canonical runtime behavior representation.
- Restrict `behavior.type: "Action"` to the contract-defined domain actions (crop/filter/frame/layout/motion/overlay) and only when supported by the molecule + content type rules.

---

### A3) Card is executing behavior, but contract says “Card → Behavior: none”

**Current**
- `src/compounds/ui/12-molecules/card.compound.tsx` emits behavior events (navigate/action/interaction) like actionable molecules.

**Contract**
- Card is explicitly non-interactive.

**Impact**
- Invalid behaviors won’t be caught; generators can output forbidden behavior and it will still “work,” creating drift.

**Minimal repair direction**
- Hard-disable behavior dispatch in `Card` (or make renderer strip `node.behavior` when `type === "Card"`).

---

## B) Drift between contract outline syntax and compiler/runtime syntax

### B1) Blueprint compiler is not parsing contract outline (no behavior tokens, no slot lists)

**Contract outline**
- Line form: `1.0 | Home | Section [none]` and optional behavior token `(tap|go|...)`
- Content slots are declared in `[...]` and must map 1:1 into `content` keys.

**Current compiler**
- `src/scripts/blueprint.ts` parses only:
  - `rawId | name | type` (it ignores `[slot,...]`)
  - navigation via `->`
  - state binding via `state.bind: ...`
  - logic via `(logic.action: ...)` (non-contract syntax)

**Impact**
- The compiler cannot enforce:
  - “content keys = intersection(outline slots, molecule content contract)”
  - “behavior tokens must exist in interaction/navigation/action universes”
  - “invalid behavior on non-actionable molecules must fail”

**Minimal repair direction**
- Extend the blueprint parser to read:
  - slot tokens list inside `[...]`
  - optional behavior token inside `(...)` (must be one-word token from contract)
  - (keep current parsing additive; don’t rewrite)

---

### B2) Non-contract “state:*” and “logic.action” system is currently the primary behavior mechanism

**Contract**
- State is never declared directly in the tree; state is a target of behavior verbs.
- Mutation verbs are a specific set (`append/update/remove/...`) distinct from interaction/navigation.

**Current implementation**
- Compiler emits:
  - `behavior.type: "Action"` with `params.name: "state:journal.add"` (see `src/scripts/blueprint.ts`)
- Runtime executes:
  - `src/engine/core/behavior-listener.ts` treats any action whose name starts with `"state:"` as a state mutation and dispatches `CustomEvent("state-mutate")`.

**Impact**
- The system has drifted to a “namespaced actionName string protocol” rather than contract tokens + mutation verbs.

**Minimal repair direction**
- Add a **translation layer**:
  - Contract tokens → canonical internal behavior intent
  - Semantic verbs (`save/submit/reset/...`) → mutation verbs (append/update/clear/...)
  - Preserve `"state:*"` temporarily as legacy, but mark it as non-contract and gate it behind an “allowLegacy” flag for migration.

---

## C) Missing implementations (contract-required features absent)

### C1) Missing `content.manifest.txt` generation step

**Contract requirement**
- Step 1: Generate `content.manifest.txt` from blueprint + molecule contracts.
- Step 2: Human fills values only.
- Step 3: Compiler merges content map into `app.json`.
- Hard failure/blank UI on missing keys.

**Current implementation**
- There is no script that generates `content.manifest.txt`.
- `src/scripts/blueprint.ts` reads only `content.txt` (optional) and merges whatever keys exist; no key enforcement.

**Impact**
- You cannot guarantee “no missing keys, no extra keys” deterministically.

**Minimal repair direction**
- Add `npm run manifest` (or extend `npm run blueprint` with a mode) to generate `content.manifest.txt` blocks for every node using:
  - parsed blueprint slots list `[...]`
  - molecule contract content keys
  - output empty strings for unfilled but required keys

---

### C2) Missing hard validation rules (contract says generation MUST fail/render blank)

**Contract requirement**
- Fail (or render blank) if:
  - invented content keys
  - required keys omitted
  - behavior token not in universes
  - behavior token not allowed for that molecule

**Current**
- No validator exists at compile-time or runtime to enforce these.

**Minimal repair direction**
- Implement a single validator module used in both places:
  - compile-time: block writing `app.json` (or mark invalid nodes)
  - runtime: strip invalid nodes or render an explicit error placeholder in dev

---

## D) Drift in molecule universe vs definitions

### D1) Button variant set is missing `icon` (contract requires it)

**Contract**
- Button variants: `filled | tonal | outlined | text | icon`

**Current definition**
- `src/compounds/ui/definitions/button.json` contains `filled | tonal | outlined | text` and **no `icon`**.

**Impact**
- Contract universe not fully implemented; generator can legally emit `variant:"icon"` but runtime has no preset.

**Minimal repair direction**
- Add `icon` variant to `button.json` (pure data change).

---

## E) Known runtime/contract inconsistencies in the current offline example (`journal_track`)

### E1) Contract says non-actionable molecules can’t execute verbs, but current `journal_track` uses a Button “Action” to mutate state

**Current `app.json` behavior**
- Buttons carry `behavior.type:"Action"` with `params.name:"state:journal.add"` and `valueFrom:"input"`.

**Contract**
- Mutation verbs are explicit (`append/update/...`), semantic verbs map to mutations, and state is only targeted via behavior verbs.

**Impact**
- Working demo, but non-contract protocol.

---

## F) Contract syntax exists in the repo but is not implemented by the compiler/runtime

### F1) `state-logic-test/blueprint.txt` uses contract-like DSL that `src/scripts/blueprint.ts` ignores

`src/apps-offline/apps/state-logic-test/blueprint.txt` contains:
- slot lists like `[label]` and behavior token `(tap)` (contract-aligned)
- state mutation blocks like:
  - `state.write: { target, source }`
- conditional logic blocks:
  - `logic.when`, `logic.if`, `logic.else`

But `src/scripts/blueprint.ts` only recognizes:
- `rawId | name | type`
- `-> target`
- `state.bind: ...`
- `(logic.action: ...)`

**Impact**
- You already have contract-style blueprints in the repo that will silently compile incorrectly (or partially) because the compiler doesn’t parse those directives.

**Minimal repair direction**
- Extend the parser additively to recognize `state.write`, `logic.when/if/else` and compile them into:
  - `when` gating on nodes (for view/state gating)
  - a mutation behavior object that matches the contract mutation verb surface
  - navigation targets from `->`

## Repair plan (minimal, step-by-step; no rewrites)

### Step 1 — Add a contract validator (read-only enforcement first)
- Implement `src/contracts/blueprint-universe.validator.ts` (or similar) that checks:
  - node.type is in molecule universe
  - node.variant/node.size in allowed sets
  - node.content keys exactly match allowed keys from outline `[...]` ∩ molecule contract
  - behavior token/type allowed for that molecule
  - forbid behavior on Card/Section/Field; Modal only close
  - forbid TEXT keys being non-string; MEDIA being non-string; DATA shapes validated
- Wire it:
  - In `src/scripts/blueprint.ts`: validate before writing `app.json` (warn-only first, then fail)
  - In `src/engine/core/json-renderer.tsx`: validate each node in dev and render a visible “contract violation” wrapper (optional) without breaking production

### Step 2 — Teach the blueprint compiler the contract’s outline syntax (additive)
- Extend `parseBlueprint()` to capture:
  - `slots` from `[...]`
  - `behaviorToken` from `(...)` as one of the allowed tokens list
- Stop emitting `(logic.action: ...)` in new blueprints (keep backward compatibility):
  - If legacy `(logic.action: ...)` exists, mark as `legacyActionName` and translate it via Step 4.

### Step 3 — Implement `content.manifest.txt` generation (contract-required)
- Add a script (new npm command) that:
  - reads blueprint
  - for each node emits a content block with exactly the keys required by slots+contract
  - writes empty string values (`""`) for unfilled fields
- Update `npm run blueprint` to:
  - if `content.manifest.txt` missing → generate it and exit (or generate + continue, depending on preference)

### Step 4 — Normalize behaviors to contract tokens (bridge legacy → contract)
- Define canonical internal behavior shape:
  - Interaction: `{ kind:"interaction", verb:"tap", variant?:... }`
  - Navigation: `{ kind:"navigation", verb:"go", variant:"screen", args:{screenId} }`
  - Action: `{ kind:"action", domain:"image", verb:"crop", args:{...} }`
  - Mutation: `{ kind:"mutation", verb:"append|update|...", target:{...}, valueFrom?:... }`
- Modify `behavior-listener.ts` to accept:
  - contract token payloads (tap/go/back/...) from molecules
  - map semantic verbs (save/submit/...) → mutation verbs
  - keep `state:*` legacy as a compatibility path but emit validator warnings

### Step 5 — Enforce actionable-molecule behavior constraints
- Easiest place: in renderer (strip invalid behavior before it reaches components) + in compiler (fail/warn).
- Optionally tighten components (e.g. Card should never dispatch behavior even if it receives it).

### Step 6 — Fill remaining universe gaps (definitions/data-only)
- Example already found:
  - add Button `icon` variant preset into `src/compounds/ui/definitions/button.json`
- Repeat for any other molecule variants/sizes that are in contract but missing from `definitions/*.json`.

---

## Quick “top offenders” summary (highest-impact drift)
- **Behavior drift**: Runtime supports `behavior.type:"Action"` across many molecules, including **Card**, which contract forbids.
- **Outline drift**: Compiler ignores `[slots]` and contract verb tokens and uses non-contract `(logic.action: state:...)`.
- **State drift**: Current system uses `state.bind` and direct `node.state` (contract forbids state declaration in the tree).
- **Content manifest missing**: No `content.manifest.txt` generation and no hard key validation.
- **Universe mismatch**: Button missing `icon` variant in its definition JSON.

