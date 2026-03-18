# CURSOR CREATE PLANS PROTOCOL

This document defines how to create architecture plans and how Cursor must execute and verify them. **Part 2** is the mandatory execution and verification protocol.

---

## Part 1 — Creating Plans

- Plans live under `src/cursor/**/planned/` (e.g. `layout/planned/`, `logic/planned/`).
- Each plan file must include: **Scope**, **Can / Cannot**, **Non-Negotiable** rules.
- Use existing plan files and index files (e.g. `LAYOUT_PLANS_INDEX.md`, `LOGIC_PLANS_INDEX.md`) as templates.

---

## Part 2 — Plan Execution + Verification Protocol

**Purpose:** Ensure every architecture plan automatically produces a verification report, appends it to the plan, and moves the plan to the completed system once validated.

---

### 🔒 Core Rule

When Cursor executes any plan file located in:

```
src/cursor/**/planned/
```

it must perform **ALL** of the following steps before marking the plan complete.

---

### 🧩 STEP 1 — Execute the Plan Scope

Cursor must:

- Read the plan file
- Apply **ONLY** the changes allowed under the plan’s **Scope** section
- Follow all **Can / Cannot** and **Non-Negotiable** rules
- Not modify unrelated systems

---

### 🔍 STEP 2 — Generate Verification Report

After execution, Cursor must create a **Verification Report** that includes:

### Required Sections

- **Plan Name:**
- **Scope:**
- **Date:**

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | ✅ PASS / ❌ FAIL |
| No forbidden changes made | ✅ PASS / ❌ FAIL |
| No unexpected side effects | ✅ PASS / ❌ FAIL |
| All files referenced exist | ✅ PASS / ❌ FAIL |

### Detailed Findings

Cursor must list:

- What was verified
- What files were checked
- Any gaps or follow-up items

---

### 📝 STEP 3 — Append Report to Plan File

Cursor must:

1. Open the original plan file
2. Scroll to the bottom
3. Append the full Verification Report under:

   ```markdown
   ## Verification Report (Step X)
   ```

   Where **X** = the plan execution order number.  
   The report becomes part of the permanent plan record.

- Cursor **MUST** append — not replace — the Verification Report at the very end of the plan file, below all existing content, preserving the original plan text unchanged.

---

### 📦 STEP 4 — Move Plan to Complete

Once verification is appended:

- Cursor must **move** the plan file from:
  - `src/cursor/**/planned/`
- to:
  - `src/cursor/**/complete/`
- **without renaming it.**

---

### 🧾 STEP 5 — Update Plan Index

If an index file exists (example: `LOGIC_PLANS_INDEX.md` or `LAYOUT_PLANS_INDEX.md`):

- Cursor must update:
  - **Status: ✅ Complete**
- for that plan entry.

---

### 🚫 Cursor MUST NOT

- Skip verification
- Move a plan without appending a report
- Overwrite plan history
- Edit completed plans unless a new revision plan exists

---

### 🧠 Result

Every completed plan becomes:

**Plan + Execution Record + Verification Audit**

This creates a self-documenting architecture history and removes the need to re-analyze the same system decisions later.

---

*End of Protocol*
