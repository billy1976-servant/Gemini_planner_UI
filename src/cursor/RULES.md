# Cursor Planning System — Rules

This folder (`src/cursor/`) is for **planning infrastructure only**: architecture plans and progress tracking. No runtime code lives here. Cursor must follow these rules when working with plans.

---

## Plan Creation Rules

- Every new plan must be created as a **markdown file**.
- **Filename format:** `PLAN_[DOMAIN]_[SHORT_NAME].md`  
  Example: `PLAN_LAYOUT_OrganCapabilityProfiles.md`
- New plans **always start** in the correct domain **inbox/** (e.g. `layout/inbox/`, `logic/inbox/`, `molecules/inbox/`, `organs/inbox/`).

---

## Plan Promotion Rules

- When the user says **"approve plan"** → move the plan file from **inbox** → **planned** (within the same domain).
- When the user says **"mark complete"** → move the plan file → **complete** (within the same domain).
- A plan lives in exactly one of: `inbox`, `planned`, or `complete`. There is no "building" column.

---

## History Tracking Rule

- Every plan file **must** contain a section at the bottom:

  ```markdown
  ## Change Log
  - [date] Plan created
  - [date] Section X updated
  - [date] Moved to planned
  - [date] Marked complete
  ```

- Cursor **must append** to this log whenever the plan is **modified** or **moved** (e.g. promoted to planned/complete).

---

## No Silent Edits Rule

- Cursor **must NOT** add content to a plan file unless the user **explicitly** asks to update that plan.
- Do not silently expand, rewrite, or add sections to existing plans.

---

## Domains

| Domain    | Path              | Use for                          |
|----------|-------------------|-----------------------------------|
| Layout   | `layout/`         | Layout system, section/organ layout |
| Logic    | `logic/`          | Engines, input/output, determinism  |
| Molecules| `molecules/`      | Component-level plans              |
| Organs   | `organs/`         | Organ-level plans                  |
