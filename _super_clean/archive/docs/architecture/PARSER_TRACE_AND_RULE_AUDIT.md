# Full Parser Trace + Rule Source Audit (Read-Only)

**Date:** 2026-02-16  
**Scope:** Execution path of `structure:addFromText` and proof of what is interpreted vs stored.

---

## STEP 1 — Trace the execution path

When **structure:addFromText** runs, the call chain is:

| Order | File | Function / role |
|-------|------|------------------|
| 1 | `src/03_Runtime/engine/core/behavior-listener.ts` | Listens for "action" event; resolves `textFromState` → `params.text`; calls interpretRuntimeVerb |
| 2 | `src/05_Logic/logic/runtime/runtime-verb-interpreter.ts` | `interpretRuntimeVerb(verb, state)` → forwards to runAction |
| 3 | `src/05_Logic/logic/runtime/action-runner.ts` | `runAction(action, state)` → capability check → getActionHandler → handler(action, state) |
| 4 | `src/05_Logic/logic/engine-system/engine-contract.ts` (or action-registry) | `getActionHandler("structure:addFromText")` → structureAddFromText |
| 5 | `src/05_Logic/logic/actions/structure.actions.ts` | `structureAddFromText`: getSlice(), build segments, call streamToCandidates(segments, slice.rules, refDate), normalizeItem per candidate, writeSlice |
| 6 | `src/05_Logic/logic/engines/structure/extreme-mode-parser.ts` | `streamToCandidates`: interpretStream(segments) → interpretToCandidates(parseResult, rules, context) |
| 7 | `src/05_Logic/logic/engines/structure/extreme-mode-parser.ts` | `interpretStream`: splitSentences(full), detectIntent(full) → ParseResult (segments, sentences, intent) |
| 8 | `src/05_Logic/logic/engines/structure/extreme-mode-parser.ts` | `interpretToCandidates`: mapToCandidates(parseResult, rules, context) |
| 9 | `src/05_Logic/logic/engines/structure/structure-mapper.engine.ts` | `mapToCandidates`: per sentence → inferCategory, inferPriority, extractDatePhrase, extractRecurrence → push candidate |
| 10 | `src/05_Logic/logic/engines/structure/date-utils.ts` | `extractDatePhrase(text, refDate)` → parseRelativeDate for weekdays / today / tomorrow / next Monday |
| 11 | `src/05_Logic/logic/actions/structure.actions.ts` | `normalizeItem(c)` → assign id, enforce types; writeSlice({ ...slice, items }) |

**Summary:** behavior-listener → runtime-verb-interpreter → action-runner → structure.actions (structureAddFromText) → extreme-mode-parser (streamToCandidates → interpretStream → interpretToCandidates) → structure-mapper.engine (mapToCandidates) → date-utils (extractDatePhrase). No tree lookup, no category tree, no separate “mapper/parser utilities” beyond these.

---

## STEP 2 — Parser location and functions that interpret text

**Files and functions that read raw input and derive structure:**

| File | Function | What it does |
|------|----------|--------------|
| `extreme-mode-parser.ts` | `splitSentences(text)` | Splits on `.!?` and on " and ", " also ", " then "; normalizes with trim. |
| `extreme-mode-parser.ts` | `detectIntent(text)` | Lowercases, regex for question/note/command/task. **Result (intent) is not passed to mapToCandidates; not stored on item.** |
| `extreme-mode-parser.ts` | `interpretStream(segments)` | Joins segment texts, splitSentences, detectIntent → ParseResult (sentences + intent). |
| `extreme-mode-parser.ts` | `interpretToCandidates` | Calls mapToCandidates(parseResult, rules, context). |
| `extreme-mode-parser.ts` | `streamToCandidates` | interpretStream → interpretToCandidates. |
| `structure-mapper.engine.ts` | `mapToCandidates` | For each sentence: uses **full sentence as title**; calls inferCategory, inferPriority, extractDatePhrase, extractRecurrence. |
| `structure-mapper.engine.ts` | `inferCategory(title, rules)` | Lowercases title; if rules.categoryInference.keywords exists, returns first categoryId whose phrase is contained in title; else undefined. |
| `structure-mapper.engine.ts` | `inferPriority(title, rules)` | Lowercases title; if rules.priorityInference exists, returns first number whose phrase is contained in title; else undefined. |
| `structure-mapper.engine.ts` | `extractRecurrence(text)` | Lowercase; regex for daily/weekly/monthly and "every &lt;weekday&gt;". |
| `date-utils.ts` | `extractDatePhrase(text, refDate)` | Looks for "today", "tomorrow", "yesterday", weekday names, "next &lt;weekday&gt;"; returns ISO date string (YYYY-MM-DD) or null. |
| `date-utils.ts` | `parseRelativeDate(phrase, refDate)` | Implements relative date resolution for the phrases above. |

**What is not present:**

- No function strips date/time/recurrence/priority from the title: **title is the full sentence**.
- No time-of-day extraction: **"at 4pm" is not parsed**; date-utils returns only a date.
- No person/assignee extraction: **"for John" is not detected**.
- No verb detection that changes storage (intent is computed but not written to the candidate).
- No normalization of case for storage beyond what inferCategory/inferPriority use internally (lowercase for matching only).

**Conclusion:** An interpretation layer exists (sentence split, intent, date, recurrence, priority, category from rules). The same full text is also stored as the item title; fields are extracted in parallel, not by stripping the title.

---

## STEP 3 — Tree usage

**References to structure.tree or structure.categories in the addFromText path:**

- `structure.actions.ts`: `getSlice()` returns the slice (which includes `tree`). **structureAddFromText does not read slice.tree and does not pass it to streamToCandidates.** Only `slice.rules` (and refDate) are passed.
- `extreme-mode-parser.ts`: No reference to tree or categories.
- `structure-mapper.engine.ts`: No reference to tree or categories. It only uses `rules.categoryInference` (keyword → categoryId map) and `rules.priorityInference` (phrase → number).
- `date-utils.ts`, `structure.types.ts`: No tree/categories.

**Conclusion:** **Tree is not used during text interpretation.** Category comes only from `rules.categoryInference.keywords` (flat phrase → categoryId). No hierarchy, no tree node selection, no routing into parts of the tree.

---

## STEP 4 — Rule sources

**Where rules and inference tables are defined / used:**

| File | Content |
|------|--------|
| `src/01_App/apps-json/rulesets/base.json` | **Rule definition:** priorityScale (min/max/default), escalation, cancelDayReset, recurrenceDefinitions, schedulingDefaults, **categoryInference: { keywords: {}, defaultCategoryId: "default" }**, **priorityInference: { asap:9, urgent:9, high:7, medium:5, low:3, "when you can":3 }**, habitDefaults, rules: []. |
| `src/01_App/apps-json/apps/planner-templates/personal.json` | References `rulesetId: "base"` (no in-repo resolver found that loads this into state.values.structure.rules). |
| `src/05_Logic/logic/engines/structure/structure.types.ts` | Type `ResolvedRuleset`: priorityScale, escalation, cancelDayReset, categoryInference (keywords, defaultCategoryId), priorityInference (Record&lt;string, number&gt;), etc. |
| `src/05_Logic/logic/engines/structure/structure-mapper.engine.ts` | **Uses rules:** defaultCategoryId, priorityScale.default, inferCategory(keywords), inferPriority(priorityInference). |
| `src/05_Logic/logic/engines/structure/prioritization.engine.ts` | Uses rules for effectivePriority, sortByPriority, applyCancelDay (priorityScale, escalation, cancelDayReset). Not in the parse path; used for display/sorting/cancel-day. |
| `src/05_Logic/logic/engines/structure/rule-evaluator.engine.ts` | Evaluates `ruleSet.rules` (when/then clauses). Not called from structureAddFromText or mapToCandidates. |
| `src/05_Logic/logic/actions/structure.actions.ts` | Reads `slice.rules` from state; passes to streamToCandidates. Initial slice has `rules: {}`; no in-repo code found that loads base.json into structure.rules. |

**Logic rules used during parsing:**

- **Category:** `rules.categoryInference.keywords` (phrase → categoryId). In base.json, keywords is `{}`, so category always falls back to `defaultCategoryId` ("default").
- **Priority:** `rules.priorityInference` (phrase → number). base.json defines high:7, low:3, etc. **Used only if slice.rules is populated** (e.g. by some loader not found in this audit).
- **Date:** Hardcoded in `date-utils.ts`: relative phrases and weekday names (no rule table).
- **Recurrence:** Hardcoded in `structure-mapper.engine.ts`: regexes for daily/weekly/monthly and "every &lt;weekday&gt;".

---

## STEP 5 — Instrument output (human-readable) for one test input

**Test input:**  
`"Fertilize garden Thursday at 4pm every week high priority for John"`

Assumptions: one sentence; refDate = today; `slice.rules` either empty `{}` or base.json (priorityInference with "high":7; categoryInference.keywords empty).

| Field | Value |
|-------|--------|
| **TEXT RECEIVED** | Fertilize garden Thursday at 4pm every week high priority for John |
| **TITLE** | Fertilize garden Thursday at 4pm every week high priority for John |
| **DATE** | Next Thursday’s ISO date (YYYY-MM-DD) from date-utils |
| **TIME** | NOT DETECTED (no time extraction; date-utils returns date only) |
| **RECURRENCE** | `{ recurringType: "weekly", recurringDetails: "mon,tue,wed,thu,fri,sat,sun" }` (from "every week") |
| **PRIORITY** | 7 if rules.priorityInference is loaded (e.g. base.json "high":7); else 5 (default) |
| **PERSON** | NOT DETECTED (no person/assignee extraction) |
| **CATEGORY MATCH** | "default" (base.json categoryInference.keywords is {}; no keyword match) |
| **TREE NODE SELECTED** | N/A — tree is not used during parsing |
| **RULES USED** | categoryInference.defaultCategoryId; priorityInference (if rules loaded); priorityScale.default; date/recurrence logic is hardcoded |

**Intent:** `detectIntent()` would return "task". This value is **not** written to the stored item (ParseResult has intent; mapToCandidates does not add it to the candidate).

---

## STEP 6 — Reality check

| Question | Answer |
|----------|--------|
| **Is there a real parser?** | Yes. Text is split into sentences, and date, recurrence, priority, and category are derived from the text via regex/keyword logic. The same full text is stored as the title (title is not stripped). |
| **Is it using rules?** | Partially. Category and priority use `rules.categoryInference` and `rules.priorityInference` when present. Default ruleset is base.json; in-repo code does not show structure.rules being hydrated from that file; if rules are empty, category = "default", priority = 5. Date and recurrence are hardcoded in code, not from a rule table. |
| **Is it using the tree?** | No. structure.tree is never read in the addFromText path. No hierarchy, no tree node selected for the item. |
| **Is priority inferred or defaulted?** | Inferred when `rules.priorityInference` exists and a phrase (e.g. "high") appears in the title; otherwise defaulted to 5 (or rules.priorityScale.default if set). |
| **Is this just storing text?** | No. It stores the full text as title **and** extracts and stores dueDate, recurrence, priority, and categoryId. So it is both storing the raw sentence and persisting interpreted fields. Time and person are not extracted. |

**Summary:** The pipeline is a real but limited parser: sentence splitting, weekday/relative date, recurrence phrases, and optional rule-based priority/category. No tree, no time-of-day, no person; title is the full input string.
