# Layout Compatibility & Requirements Engine Plan

**Classification:** HISTORICAL — Plan implemented in src/layout/compatibility; primary architecture reference: docs/SYSTEM_MASTER/

**Document:** src/layout/cursor/3_LAYOUT_COMPATIBILITY_ENGINE_PLAN.md  
**Purpose:** Design an engine that determines whether the selected Section Layout, Card Layout, and Organ Internal Layout are structurally compatible with a section's content. Prevents empty or broken layouts when required slots are missing. Validation and guidance only; no writes to stores or business logic.

---

## 1. System purpose

- **Input:** Selected layout IDs (section layout, card layout, organ internal layout) and the **section node** (and its screen context) for a given section.
- **Output:** A **compatibility result** object, e.g. `{ sectionValid, cardValid, organValid, missing: string[] }`.
- **Behavior:** Engine is **read-only**: it reads layout state and section data, evaluates compatibility, and returns a result. It does **not** change layout state, assign fallbacks, or modify any stores.

---

## 2. Core idea: layout requirements in JSON

Each layout preset declares the **content slots** it requires. Requirements live in **JSON**, not TypeScript.

**Examples:**

| Layout ID                         | Required slots                                        |
| --------------------------------- | ----------------------------------------------------- |
| `hero-split-image-left`           | `["heading", "body", "image"]`                        |
| `hero-split-image-right`         | `["heading", "body", "image"]`                        |
| `features-grid-3`                 | `["card_list"]` (or `["items"]` per organ convention) |
| `image-right` (card)              | `["image"]`                                           |
| `image-left-text-right` (section) | `["image", "body"]`                                   |

Existing layout sources in codebase:

- **Section layouts:** src/layout/page/page-layouts.json — IDs like `hero-centered`, `hero-split-image-left`, `features-grid-3`, etc.
- **Card layouts:** src/lib/layout/card-layout-presets.ts — IDs like `image-top`, `image-left`, `image-right`.
- **Organ internal layouts:** src/layout-organ/organ-layout-profiles.json — per-organ `internalLayoutIds` and optional `capabilities.slots`.

The engine will consume **new JSON registries** that add a `requires` array to these (or extend existing JSON where appropriate).

---

## 3. Engine layers (architecture)

### 3.1 Layout requirement registry (JSON)

- **Location (proposed):** e.g. `src/layout/requirements/section-layout-requirements.json`, `card-layout-requirements.json`, and optionally extend or reference `organ-layout-profiles.json` for organ internal layout requirements.
- **Shape:** Map layout ID → `{ "requires": ["slot1", "slot2", ...] }`. Empty or missing `requires` means "no required slots" (always valid).
- **Ownership:** JSON only. No TypeScript presets duplicated here; these files are the single source for **requirement** data.
- **Organ internal:** Can be a separate JSON (e.g. `organ-internal-layout-requirements.json`) mapping `organId` + `internalLayoutId` → `requires`, or an optional `requires` field per internal layout in a structure keyed by organ (to avoid coupling to organ profile structure).

### 3.2 Content capability extractor

- **Responsibility:** Given a **section node** (and optionally screen/key context), produce the set of **available content slots** that this section actually has.
- **Input:** Section node: `id`, `role`, `children[]`, `content`, `params`. Children are nodes with `type` (e.g. `heading`, `body`, `image`, `card`) and possibly `role` or slot-like keys.
- **Logic (proposed):** From children (distinct `child.type`, normalized); from content keys; when section has organ role, map to organ capability slot names.
- **Output:** Array or set of slot names. Normalization must be defined in one place so registry and extractor agree.

### 3.3 Compatibility evaluator

- **Responsibility:** For each of section layout, card layout, and organ internal layout, determine **VALID** (all required slots present) or **INCOMPLETE** (at least one required slot missing).
- **Input:** Required slots per layout (from registry), available slots (from Content Capability Extractor).
- **Output:** A single compatibility result object: `{ sectionValid, cardValid, organValid?, missing: string[] }`.
- **No side effects:** Pure function; state can be read by the **caller** and passed as input.

### 3.4 UI guidance layer (future)

- **Purpose:** Define how the editor uses the compatibility result. **Not** implemented in this plan; only specified for future integration.
- **Rule:** **Never auto-change user selections.**

---

## 4. Integration points (future)

| Consumer               | Use of compatibility result                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **OrganPanel**         | Filter or gray out layout options per section; show warning if current selection is incomplete.                     |
| **JsonRenderer**       | Optional guard: if section/card/organ layout is incomplete, render fallback UI or warning instead of broken layout. |
| **Editor / dev tools** | Display missing slots or "incomplete" badge next to section layout dropdown.                                        |

All integrations must **read** layout state and section node from the tree, then call the engine and use the result. No engine API shall accept or perform store writes.

---

## 5. What this engine does not do

- Does **not** change layout state (section, card, or organ overrides).
- Does **not** auto-assign fallbacks when the current layout is invalid.
- Does **not** modify layout stores or any other state.
- Does **not** affect business logic beyond providing a compatibility result for callers to use.

Validation + guidance only.

---

## 6. Safety rules

- Engine **reads** state only (layout IDs and section node passed in; no direct store writes).
- Engine **outputs** compatibility only (result object).
- No silent overrides of user selection.
- No fallback writes to stores or to the section node.

---

## 7. Implementation (completed)

- **JSON:**  
  - `src/layout/requirements/section-layout-requirements.json`  
  - `src/layout/requirements/card-layout-requirements.json`  
  - `src/layout/requirements/organ-internal-layout-requirements.json`  
  - `src/layout/requirements/SLOT_NAMES.md`
- **Extractor:** `src/layout/compatibility/content-capability-extractor.ts` — `getAvailableSlots(sectionNode, options?) => string[]`.
- **Registry:** `src/layout/compatibility/requirement-registry.ts` — `getRequiredSlots(layoutType, layoutId, organId?)`, `getRequiredSlotsForOrgan(organId, internalLayoutId)`.
- **Evaluator:** `src/layout/compatibility/compatibility-evaluator.ts` — `evaluateCompatibility(args) => CompatibilityResult`.
- **Public API:** `evaluateCompatibility`, `getAvailableSlots`, `getRequiredSlots`, `getRequiredSlotsForOrgan` and types exported from `src/layout/compatibility/index.ts` and re-exported from `@/layout`.
