# Organ Contract Update Plan

**Status:** Plan only. No contract rewrites or file edits until approved.

**Objective:** Minimal, additive contract updates to formally support organ nodes (type, shape, blueprint grammar, content keys). No runtime/engine changes.

---

## 1. JSON_SCREEN_CONTRACT.json

**Location:** src/02_Contracts_Reports/contracts/JSON_SCREEN_CONTRACT.json

**Current state:** The contract has `atoms`, `molecules`, and `organs` (catalog of slots/emittedMolecules). It does not define the **screen JSON node shape** for a node with `type: "organ"`.

**Planned change (additive):**

- Add a top-level key `organNode` (after `organs`, before `layoutPrimitives`).
- Define:
  - **Required keys:** `type`, `organId`, `variant`, `content`, `children`.
  - **Optional keys:** `id`.
  - **Forbidden keys:** `layout`, `params`, `role`, `style`, `palette`.
  - Short note: structural placeholder only; expansion at runtime; no layout/styling in screen JSON.
  - Content keys rule: keys must be slotKeys from the organ definition (e.g. `organs[organId].slots`).

**Exact insertion:** After the closing `}` of the `"organs"` object, add a comma and the new `organNode` object. No edits to `atoms`, `molecules`, `behaviorVerbs`, `stateModel`, or `rendererExpectations` beyond optional mention of organ in typeResolution if desired (optional).

---

## 2. BLUEPRINT_UNIVERSE_CONTRACT.md

**Location:** src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md

**Current state:** Section **ORGAN OUTLINE ANNOTATION (ADDITIVE)** (lines 594–606) already defines:
- Primary line: `rawId | Name | organ:organId [slotKey1, slotKey2, ...]`
- Continuation line: `variant: variantId`

**Planned change (additive):**

- In section **HUMAN OUTLINE — HIERARCHICAL (STRUCTURE + FLOW)** (around line 497), after the Rule sentence, add one sentence:
  - "Type may be a molecule or section name (e.g. Section, Button, Field) or an organ declaration `organ:organId` (see ORGAN OUTLINE ANNOTATION)."

**No change** to ORGAN OUTLINE ANNOTATION or any other section.

---

## 3. CONTENT_DERIVATION_CONTRACT.md

**Location:** src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md

**Current state:** **2️⃣+ ORGAN CONTENT BINDINGS** already uses dotted slotKeys (hero.title, header.logo, etc.). The **1️⃣ GENERAL BINDING RULE** does not explicitly allow dotted keys or state that organ content keys must match organ slotKeys.

**Planned change (additive):**

- After **1️⃣ GENERAL BINDING RULE (GLOBAL)** and before **2️⃣ MOLECULE-SPECIFIC CONTENT BINDINGS**, add a short subsection **1️⃣+ ORGAN CONTENT KEYS (DOTTED SLOTKEYS)**:
  - For organ nodes, content keys use dotted slotKeys (e.g. `hero.title`, `hero.cta`).
  - Keys MUST match the slotKeys defined for that organ in the contract (e.g. ORGAN CONTENT BINDINGS or JSON_SCREEN_CONTRACT organs catalog).
  - No other keys are allowed for that organ instance.

**No change** to PRECEDENCE RULE, molecule bindings, or existing ORGAN CONTENT BINDINGS section.

---

## 4. Confirmation

- **Runtime/engine contracts:** Not touched.
- **Additive only:** New key in JSON; one sentence in BLUEPRINT_UNIVERSE; one short subsection in CONTENT_DERIVATION.
- **No schema redesign, no logic changes, no breaking changes.**
