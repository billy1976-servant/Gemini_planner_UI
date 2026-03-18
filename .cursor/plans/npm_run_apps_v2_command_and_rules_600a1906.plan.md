---
name: npm run apps v2 command and rules
overview: "Assess and update npm run apps so its export is a Cursor command file: building blocks only (12 molecules, organs, structures), explicit how-to for blueprint/content, and full compliance rules inlined for review; add instruction that Cursor suggest changes when anything is missing."
todos: []
isProject: false
---

# npm run apps v2 — Command File + Visible Compliance Rules

## Goal

- **Export = Cursor command:** Only the **actual code-required choices** (12 molecules, organs with variants/slots, structure types) and **explicit rules/contracts** to follow. Palettes, layout IDs, actions, engines are system-determined — not per-app choices; they are not the primary surface Cursor chooses from.
- **Compliance rules visible for review:** The exported file must **include the full text** of the compliance rules (from `.cursor/rules` and contract docs) so reviewers can see them in one place. No “see .cursor/rules” without content.
- **No questions:** The command file must instruct Cursor: if anything is missing or ambiguous, **suggest changes**; do not ask questions.

---

## Current state (what to change)

- [run-apps.ts](src/07_Dev_Tools/scripts/run-apps.ts) discovers palettes, layout IDs, templates, molecules, organs, actions, engines, registry types, etc., and dumps them all into BUILD_PLAN.md and BUILD_AUTHORITY_SURFACE.json.
- BUILD_PLAN.md lists “Available System Surface” with palettes, layout IDs, templates, actions, engines — implying the app/site “chooses” them. Per your intent, the **app does not choose** palette/layout; the system provides those. Cursor only needs to choose **building blocks** (molecules, organs, structures) and **how to write** blueprint.txt and content.txt.
- Compliance rules are **not** in the export; only references. Reviewers cannot see the rules in the generated file.

**Rule/contract sources to inline (for review):**

- [.cursor/rules/TSX_BUILD_SYSTEM.md](.cursor/rules/TSX_BUILD_SYSTEM.md) — TSX build permanent law
- [.cursor/rules/CONTENT_AND_PRESENTATION.md](.cursor/rules/CONTENT_AND_PRESENTATION.md) — Content and presentation law
- [.cursor/rules/TSX_CREATION_CHECKLIST.md](.cursor/rules/TSX_CREATION_CHECKLIST.md) — Step-by-step checklist
- [src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md](src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md) — Blueprint allowed universe (or a concise excerpt)
- [src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md](src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md) — Content derivation rules (or a concise excerpt)

Optional: [.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md](.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md) if needed for structure types.

---

## 1. Refocus run-apps output (Cursor command only)

**1.1 Building blocks only in the command file**

- **Molecules:** The 12 molecules with their **content keys only** (per ALLOWED_CONTENT_KEYS). No palette, no layout ID list. Cursor chooses molecule types and fills content per contract.
- **Organs:** Organ id + variants + slots (for blueprint nodes and content blocks). Cursor chooses organ + variant per app.
- **Structure types:** List from TSX_BUILD_SYSTEM / TSX_CREATION_CHECKLIST (list, board, dashboard, timeline, editor, detail, wizard, gallery) so Cursor knows which structure type the app/site uses.
- **Blueprint grammar / content format:** Short, explicit “how to write blueprint.txt” and “how to write content.txt” (node types, section structure, content block per node, keys from molecule contract). Derive from blueprint compiler and CONTENT_DERIVATION_CONTRACT.

**1.2 Remove or relocate system-only surface**

- **Palettes, layout IDs, templates:** Do not present as choices in the Cursor command. Either omit from BUILD_PLAN.md or move to a short “System reference (not chosen per app)” section so Cursor knows they exist but does not “pick” them for the app.
- **Actions / engines:** Same — system surface; not the primary building blocks. Optional “Reference” section only.
- **BUILD_AUTHORITY_SURFACE.json:** Keep a minimal “building blocks” section (molecules + content keys, organs + variants/slots, structure types, blueprint/content rules). Optionally keep a separate `systemReference` object for tooling; do not emphasize it in the Cursor-facing narrative.

---

## 2. Inline compliance rules for review

**2.1 Add rule-file reading in run-apps.ts**

- Define a fixed list of rule file paths (relative to repo root), e.g.:
  - `.cursor/rules/TSX_BUILD_SYSTEM.md`
  - `.cursor/rules/CONTENT_AND_PRESENTATION.md`
  - `.cursor/rules/TSX_CREATION_CHECKLIST.md`
  - `src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md`
  - `src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md`
- Add a function `readRuleFiles(root: string): { path: string; content: string }[]` that reads each file (if it exists) and returns path + full content. No parsing; raw text only.

**2.2 Emit “Compliance rules (for review)” in the exported file**

- In the main exported Markdown (BUILD_PLAN.md or a single CURSOR_APP_BUILD_COMMAND.md), add a section **Compliance rules (for review)**.
- For each rule file, emit a subheading (e.g. `## Rule: TSX_BUILD_SYSTEM`) and then the **full file content** (fenced or indented so it is visible). That way reviewers see every rule in one place.
- If a file is missing, either skip or add “(file not found: …)” so it is explicit.

**2.3 Optional: Separate BUILD_RULES.md**

- Alternatively, run-apps can write **BUILD_RULES.md** that only contains the inlined rule files (no building blocks). Then the main command file references “See BUILD_RULES.md for full compliance rules (for review).” Prefer **one file** with rules inlined so “compliance rules for the exported file are visible now for review” in a single artifact.

---

## 3. Cursor instruction: suggest changes, no questions

- In the exported command file, add an **explicit instruction** block, e.g.:
  - “**Cursor:** Use only the building blocks and rules above. Write blueprint.txt and content.txt accordingly. If anything is missing or ambiguous, **suggest changes** (e.g. to this file or to the codebase); **do not ask the user questions.**”
- Place it near the top or immediately after “Requested System Description” so it governs the whole flow.

---

## 4. File-level changes (exhaustive)


| File                                                                         | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [src/07_Dev_Tools/scripts/run-apps.ts](src/07_Dev_Tools/scripts/run-apps.ts) | (1) Add constant `RULE_FILE_PATHS: string[]`. (2) Add `readRuleFiles(root)` that returns `{ path, content }[]`. (3) Restructure `buildBuildPlanMd(surface, ruleContents)` to: **Requested System Description** → **Cursor instruction (suggest changes; no questions)** → **Building blocks only** (molecules + content keys, organs + variants/slots, structure types) → **How to write blueprint.txt and content.txt** (concise steps + contract references) → **Compliance rules (for review)** (full inlined rule file contents) → **Cursor fill-out template** (TSX wrapper, registry impact, contract compliance, proposed blueprint/content, verification checklist). (4) Remove or demote “Available System Surface” palettes/layouts/templates/actions/engines to “System reference (not chosen per app)” or drop. (5) Call `readRuleFiles(ROOT)` before building the MD; pass `ruleContents` into `buildBuildPlanMd`. (6) Keep writing BUILD_AUTHORITY_SURFACE.json; optionally slim it to building blocks + optional systemReference. |
| Generated **BUILD_PLAN.md** (or **CURSOR_APP_BUILD_COMMAND.md**)             | Becomes the single command file: building blocks only, how-to for blueprint/content, full compliance rules inlined, Cursor instruction, fill-out template.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **BUILD_AUTHORITY_SURFACE.json**                                             | Optional: add top-level key `"complianceRulePaths"` listing the rule files that were inlined (for traceability). Optionally reduce `allowed` to molecules, organs, structure types, contentKeysByMolecule, and a short blueprint/content grammar summary; move palettes/layoutIds/actions/engines into `systemReference` or omit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |


No changes to blueprint.ts, compileApp(), or runtime behavior. Discovery can remain as-is for BUILD_AUTHORITY_SURFACE.json; only the **content and structure** of the exported Markdown and the optional JSON shape change.

---

## 5. Order of implementation

1. Add `RULE_FILE_PATHS` and `readRuleFiles()` in run-apps.ts; wire reading at start of run.
2. Restructure `buildBuildPlanMd` to accept `ruleContents`, emit **Cursor instruction**, then **Building blocks only**, then **How to write blueprint/content**, then **Compliance rules (for review)** with inlined content, then existing fill-out template.
3. Remove or demote palettes/layouts/templates/actions/engines from the main “choices” narrative in the MD.
4. Optionally slim BUILD_AUTHORITY_SURFACE.json and add `complianceRulePaths`.
5. Run `npm run apps`, open the generated MD, and confirm: (a) only building blocks are the primary choices, (b) full compliance rules are visible in the file for review, (c) Cursor is instructed to suggest changes when anything is missing.

---

## 6. Acceptance

- Exported file is a **command** for Cursor: choose from these building blocks, follow these rules, write blueprint/content thus; if something is missing, suggest changes.
- **Compliance rules** are **visible in the exported file** (full text of each rule file) for review.
- No questions needed; the command file tells Cursor to suggest changes when needed.

