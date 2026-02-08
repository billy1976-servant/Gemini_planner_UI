# VALIDATE_PLANS_PROTOCOL

**Purpose:** Validate all planning files before execution.

---

## When to Run

- Before executing any plan from the plans directory.
- When a plan references layout, runtime, behavior, or state.
- After architecture or contract changes that might invalidate existing plans.

---

## Steps (execute in order)

### 1. Locate and scan ALL plan files

- Identify every plans directory in the repo (e.g. `src/cursor/`, `.cursor/plans/`, or any directory named or used as “plans”).
- Scan **all** files inside those directories; do not filter by filename or extension.
- Read each file fully; do not rely on filenames to infer purpose or scope.

### 2. Load current architecture contracts

- Read the authoritative contracts from:
  - `src/docs/ARCHITECTURE_AUTOGEN`
  - `src/docs/SYSTEM_MAP_AUTOGEN`
- Use these as the source of truth for: runtime pipeline, layout resolution, behavior wiring, state shape, and registry usage.

### 3. Compare each plan step to contracts

For each plan file, for each step or actionable item:

- Check whether the step assumes existing modules, APIs, or contracts that still exist and match the current contracts.
- Check for conflicts with:
  - **Runtime:** Request/resolution/render path, fallbacks.
  - **Layout:** Page/section/component/organ resolution, compatibility, requirements.
  - **Behavior:** Event wiring, behavior–state mapping.
  - **State:** State shape, intent origin, stores.
- Identify **missing dependencies:** steps that depend on code or contracts that do not exist or are not documented.

### 4. Flag issues

Produce a validation report that flags, per plan and per step where relevant:

- **Invalid assumptions:** Steps that assume behavior, APIs, or file paths that no longer match the code or contracts.
- **Conflicts:** Steps that conflict with runtime, layout, behavior, or state contracts (cite the contract and the conflict).
- **Missing dependencies:** Steps that require modules, types, or contracts that are absent or unspecified.

### 5. Suggest corrected steps

- For each flagged step, suggest a corrected version (or a concrete change) that aligns with current contracts.
- Present suggestions in the report; do not edit the plan files.

### 6. No automatic changes to plans

- **NEVER modify plan files automatically.**
- Only output: validation report + suggested corrections.
- Apply changes to plans only when the user explicitly asks and approves.

---

## Output

- A validation report listing: plan file, step (or section), issue type (invalid assumption / conflict / missing dependency), and suggested correction.
- No edits to any plan file unless the user explicitly requests and confirms.

