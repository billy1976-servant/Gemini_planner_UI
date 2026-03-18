# OSB V5 — Planner Engine Integration Plan

**Document type:** Read-only architecture. Analysis + integration planning only. No implementation. No refactors. No contract changes. No new engines.

**Objective:** Design Version 5 of the planner as the full backbone of the system, tightly integrated with: OSB capture surface, journey expansion (V3), priority + forecasting planner engine (V4), and the structure slice as the single source of truth. Unify: tree hierarchy foundation, journey packs, planner injection, relative-time templates, habit ramps, priority escalation, forecast emergence, Gantt-style dependency awareness, and a human-readable journey builder that converts to JSON.

---

## 1. Base Tree as Permanent Schema

### 1.1 Foundation layer

The planner tree is defined once as a **permanent schema**—not created by journeys. Journeys **attach** to it.

**Canonical base tree (V5):**

- **Life** (root)
  - Home
  - Business
  - Health
  - Relationships
  - Finance
  - Projects
  - Travel
  - Maintenance
  - Growth

This tree is the **anchor layer**. It is loaded from a single source (e.g. planner template or bootstrap) and remains stable. User-created “projects” or journey-injected domains attach as **children** of these nodes or as **categoryIds** that reference them.

### 1.2 How journey packs map into existing tree anchors

- **categoryId:** Every StructureItem has categoryId. Journey items use categoryIds that **match** base tree node ids (e.g. `"travel"`, `"health"`, `"projects"`). So a “Vacation” journey does not create a new root “Vacation”; it creates items with categoryId `"travel"` (and optionally a child node under Travel, e.g. “Vacation 2025,” if the tree merge adds it).
- **Tree merge rule:** When a journey pack includes optional `tree` fragments, merge logic **attaches** them under an existing base node. Example: travel.json adds a node `{ id: "vacation-2025", name: "Vacation 2025", ... }` as a **child** of the existing Travel node. Merge by id: if a node with id "travel" exists, append the new node to its children; do not create a second root.
- **Stable anchors:** All journey-generated items point to categoryIds that resolve to this base tree (or to a child of it). No free-floating “Vacation” root that is unrelated to Life → Travel.

### 1.3 How this prevents structure fragmentation

- **Single hierarchy:** There is one root (Life) and a fixed set of first-level domains. Users and journeys cannot create alternate roots or parallel “planner” trees. Everything nests under the base tree.
- **Predictable navigation:** Planner UI can always show Life → [domain] → [project/journey]. No proliferation of top-level folders that look like separate planners.
- **Merge semantics:** When two journeys (e.g. “Vacation” and “Business trip”) both attach to Travel, they add **siblings** under Travel (or items with categoryId "travel"). No duplicate “Travel” roots; one Travel node, many items or child nodes under it.

### 1.4 Long-term stability

- **Schema evolution:** If a new domain is needed (e.g. “Ministry”), it is added to the **base tree** once (e.g. under Life). All future journeys that need it use that id. Journey packs do not define the top-level schema; they consume it.
- **Upgrade path:** When the base tree is extended, existing journey JSON that uses existing categoryIds continues to work. New categoryIds (e.g. "ministry") become valid anchors for new packs. No migration of journey files required for old packs; only new packs can opt into new domains.

---

## 2. Journey Packs as Expansion Layer

Builds on V3. Journeys generate **optional** StructureTreeNode fragments and **StructureItem[]** (tasks, ramps, recurring). Injection via **structureAddItems** and **tree merge** into `state.values.structure`.

### 2.1 What journeys generate

- **StructureTreeNodes (optional):** Fragments to merge under base tree nodes (e.g. “Vacation 2025” under Travel). Not a new root; always a subtree attached to a base anchor.
- **StructureItems:** Tasks (single, with dueDate), recurring (RecurrenceBlock), habits with ramps (HabitBlock). Same contract as today. Items reference categoryId from the base tree or from journey-injected tree nodes.

### 2.2 Injection path

- **structureAddItems:** Accepts `items: Partial<StructureItem>[]`. Journey loader normalizes (ids, timestamps, categoryId, priority, dueDate, recurrence, habit, metadata) and calls structureAddItems. Single write path.
- **Tree merge:** If the journey payload includes `tree`, the merge logic updates slice.tree: attach new nodes under the correct base node by id, then writeSlice. Same slice; no second store.

### 2.3 Root journeys and sub-journeys

- **Root journey:** Top-level pack (e.g. travel, remodel, recovery). Loaded when OSB detects intent (e.g. “vacation,” “remodel kitchen”) or user selects “Start Vacation plan.”
- **Sub-journey:** Referenced by the root (or another pack) via `subJourneys: { "dog": "dog_travel", "kids": "kids_travel" }`. When the user taps “Dog” or “Kids,” the system loads the sub-pack and merges its tree + items. Result: one combined plan (e.g. Vacation + Dog + Kids) in the same structure slice.
- **Expansion chips:** Root (and sub) packs define `suggestedDomains` or chip keys that map to subJourneys or to additional item sets. UI shows chips; on tap, load and merge. No new state; just “load more packs and merge.”

### 2.4 Lazy expansion

- **On-demand load:** Sub-journeys are loaded only when the user taps a chip (e.g. “Dog”). This keeps initial payload small and avoids injecting dozens of packs upfront.
- **Preview (optional):** Before “Build plan,” the system can show a summary (e.g. “Vacation + Dog + Kids: 23 items”) without writing to structure. On confirm, merge all selected packs once. Still one structureAddItems + tree merge call.

### 2.5 Examples (conceptual)

| Journey       | Anchors (base tree) | Typical content                                              |
|---------------|----------------------|---------------------------------------------------------------|
| Vacation      | Travel               | Packing, budget, docs, transport; subJourneys: dog, kids      |
| Remodel       | Home                 | Budget, design, materials, timeline, permits, contractor      |
| Recovery      | Health               | Daily habits, support contacts, trigger avoidance, ramp     |
| Business launch | Business           | Plan, legal, marketing, finance; phases with dueDate offsets  |
| Marriage restoration | Relationships | Habits, check-ins, counseling, milestones                   |
| Health improvement | Health            | Habits (exercise, diet), appointments, ramp items              |

All output: tree fragments (optional) + items. All inject into the same structure slice via existing actions.

---

## 3. Relative-Time Template Engine

### 3.1 Concept

Journey templates describe **when** items appear using **offsets** from a reference date, not fixed calendar dates. Examples:

- **−30 days** — “1 month before”
- **−7 days** — “1 week before”
- **−3 days** — “3 days before”
- **Day 0** — “on the day”
- **+7 days** — “1 week after”

The **planner** (or journey loader) converts these offsets into **dueDates** (ISO strings) using:

- **targetDate** — e.g. trip date, launch date, wedding date
- **startDate** — e.g. “start of recovery,” “start of program”
- **milestoneDate** — optional; for multi-phase plans

No new engine. Conversion is a **pure function**: `(offset, refDate) → dueDate`. Result is stored in StructureItem.dueDate; existing scheduling and aggregation use it as today.

### 3.2 How conversion works

- **Input:** Journey JSON item has e.g. `dueOffset: -7` (or `relativeTo: "targetDate", offsetDays: -7`). User (or OSB) has provided `targetDate: "2025-06-15"` for the trip.
- **Conversion:** Loader computes `dueDate = addDays(targetDate, -7)` → `"2025-06-08"`. Item is stored with `dueDate: "2025-06-08"`. No new field required on StructureItem; offset is a **template concern**, resolved at load time.
- **Multiple refs:** Template can support both “targetDate” and “startDate.” E.g. “Day 0” = targetDate; “+30” from startDate = 30 days after program start. Loader needs refDate per type; output is still dueDate on each item.

### 3.3 How this powers forecasting automatically

- Items already have dueDate. Existing **aggregation** (aggregateByDateRange) and **scheduling** (scheduledForDate, isDueOn) surface items by date. So: “1 month before” item gets dueDate = targetDate − 30; when the user’s “today” enters the 30-day window, any view that shows “next 30 days” will show that item. **Time-based emergence** = same as V4: dueDate + existing engines; no new forecast engine.
- **Natural emergence:** As time advances, items with dueDate in the past or near future rise in relevance; priority escalation (existing) and date-range filters (existing) make them appear at the right time. Relative-time templates only **author** the right dueDates at load time.

---

## 4. Gantt-Style Dependency Layer (Non-Visual Core)

### 4.1 Goal

Enable **task sequencing**, **phase awareness**, and **timeline generation** (and later, if desired, a visual Gantt) **without** building a Gantt UI first and **without** a new engine. Use **optional metadata** on StructureItem only.

### 4.2 Optional metadata fields (convention in metadata)

All live under `StructureItem.metadata` (existing contract: `Record<string, unknown>`). No type change.

- **dependsOn:** `string | string[]` — Item id(s) that must be “done” (or exist) before this item is considered next. Enables “B starts after A.”
- **phase:** `string | number` — E.g. "1", "2", "Planning", "Execution". Groups items into phases for ordering and future Gantt swimlanes.
- **sequenceOrder:** `number` — Order within a phase or within a journey. Lower = earlier. Planner (or UI) can sort by phase then sequenceOrder to get a canonical order.

### 4.3 What this enables

- **Task sequencing:** A viewer (or future engine) can sort items by metadata.phase and metadata.sequenceOrder, and optionally respect metadata.dependsOn to show “blocked” vs “ready.” No new engine; just reading metadata.
- **Phase awareness:** Rollups or filters can group by metadata.phase (e.g. “Show Phase 1 only”). Journey templates set phase when generating items.
- **Timeline generation:** Same data: dueDate + phase + sequenceOrder + dependsOn. A future Gantt UI would read items and draw bars; the **core** is just metadata. No dependency engine required for V5; only a convention and authoring in journey packs.
- **Visual Gantt later:** If built, it would consume the same structure slice and metadata. No second store; no new engine.

### 4.4 Important

- **No new engine.** Prioritization, recurrence, scheduling, aggregation, progression remain unchanged. They do not read dependsOn/phase/sequenceOrder. These are for **ordering and display** (and optional future dependency resolution). Sorting and “what’s due when” still come from dueDate and existing engines.

---

## 5. Habit Ramp Injection

### 5.1 Existing mechanism

- **HabitBlock:** startValue, targetValue, durationDays (optional timeSlots, activeDays). On StructureItem.habit.
- **progression.engine:** rampValueForDate(habit, refDate) — linear ramp from startValue to targetValue over durationDays. Pure function; no state.
- **habitDefaults** in rules: default ramp shape (e.g. 0 → 1 over 21 days). Journey can override per item.

### 5.2 How journeys create ramp items

- **Pushup ramp:** Item with habit: { startValue: 5, targetValue: 50, durationDays: 30 }. Journey pack defines this; loader sets item.habit; structureAddItems merges. Planner (and any habit UI) calls rampValueForDate to show “target for today.”
- **Prayer ramp:** habit: { startValue: 2, targetValue: 10, durationDays: 21 } (e.g. minutes). Same.
- **Savings ramp:** habit: { startValue: 20, targetValue: 100, durationDays: 90 } (e.g. dollars per week). Same.
- **Recovery ramp:** habit: { startValue: 0, targetValue: 1, durationDays: 21 } (e.g. “one day at a time” check). Same.

All are **StructureItem** with habit set. No new task type; no new engine.

### 5.3 Planner behavior

- **Progression is automatic:** progression.engine already computes rampValueForDate. No “ramp engine” in the journey layer; journey only **injects** items with habit. Planner (and habit views) use existing engine for display and validation.

---

## 6. Shared Responsibility Model

### 6.1 Standardized metadata keys

Again, all under `StructureItem.metadata`; no contract change.

- **assignee:** string — Person id or label who is responsible for this item.
- **participants:** string[] — Who else is involved (e.g. family members on a vacation task).
- **owner:** string — Primary owner (alternative to assignee if semantic difference matters).
- **role:** string — E.g. "driver", "navigator", "budget" for a trip.

### 6.2 How group journeys use it

- **Vacation:** Items like “Book flight” → metadata.assignee = "me"; “Pack kids’ bags” → metadata.assignee = "partner". Loader sets these from journey template or from human builder answers (“Who’s responsible for packing?”).
- **Remodel:** “Get permits” → metadata.assignee = "contractor"; “Choose fixtures” → metadata.assignee = "me". Same.
- **Sharing:** No new state system. “Sharing” = same structure slice; items carry metadata so that when the plan is viewed or exported, assignee/participants/owner/role are visible. Multi-user **assignment** is in metadata; multi-user **sync** (if ever) would be a separate layer (e.g. sync of state.values.structure), not part of V5 scope.

---

## 7. Human Builder Layer (Critical New Piece)

### 7.1 Goal

Users create and share journeys **without touching JSON**. They answer simple questions; the system converts answers into journey JSON internally, then injects via the same structure path.

### 7.2 Concept

- **Forms, not JSON:** A “journey builder” UI presents a small set of questions (or steps) per journey type. Examples:
  - **Trip:** “Trip name?” “Trip date?” “Dog?” “Kids?” “Budget?” “Length (days)?”
  - **Remodel:** “Room?” “Start date?” “Contractor?” “Budget?”
  - **Recovery:** “Start date?” “Support person?” “Daily check-in time?”
- **Conversion layer:** Answers are stored as a structured payload (e.g. `{ tripName, tripDate, hasDog, hasKids, budget, lengthDays }`). A **builder service** (pure function or thin module) maps this payload to:
  - Which root journey pack to load (e.g. travel).
  - Which subJourneys to include (e.g. dog_travel if hasDog, kids_travel if hasKids).
  - targetDate (from trip date).
  - Relative-time conversion: all template offsets → dueDates using targetDate.
  - Optional: override item titles or metadata (e.g. assignee from “Who’s packing?”).
- **Output:** The same journey JSON shape (tree + items with dueDate, priority, habit, metadata) that would have been loaded from a static pack—but **generated** from form answers. Then: same inject path (structureAddItems + tree merge). No second inject path; the only difference is **how** the JSON was produced (form → conversion vs static file).

### 7.3 Human-readable journey builder

- **UI:** Wizard or form per journey type. No code or JSON visible. User clicks “Create plan” → answers → “Build plan” → conversion runs → inject.
- **Templates for builder:** Each journey type has a “builder schema”: which questions to ask, which keys map to pack selection, targetDate, subJourneys, and optional overrides. Stored as config (e.g. JSON or TS), not user-facing.

### 7.4 Conversion layer → JSON packs

- **Input:** Form payload (key-value).
- **Output:** In-memory journey payload: tree (optional) + items (full StructureItem-like objects with dueDate, categoryId, priority, recurrence, habit, metadata). Relative-time offsets in the template are resolved to dueDates using payload.targetDate (or startDate).
- **No new pack format:** Generated payload conforms to the same shape as a static journey pack. So “export” of a user-created plan can emit the same JSON that another user could “import”—including form answers as optional metadata for re-editing in builder later, if desired.

### 7.5 Export / import model

- **Export:** User’s planner subtree (e.g. “Vacation 2025” under Travel) can be serialized to journey JSON: tree fragment + items (with dueDate, priority, habit, metadata). Optionally include “builder answers” so someone else can open in builder and tweak (e.g. change date).
- **Import:** Another user receives the JSON; “Install” = same structureAddItems + tree merge. They get the same structure under their base tree. No new “journey store”; installed = merged into structure.
- **Share:** Export → file or link → other user imports. Ecosystem: users share “camping plan,” “remodel template,” “church outreach plan” without ever seeing JSON. Builder is the only UI for creation and, optionally, for editing a previously imported plan (re-run builder with imported answers).

---

## 8. Plan Export + Import

### 8.1 Export

- **Scope:** User selects a subtree (e.g. one node under Travel, or “all items with categoryId X”) or “current planner view.” System collects those StructureTreeNode(s) and StructureItem(s).
- **Serialize:** Output = journey pack JSON: id (e.g. "my-vacation-2025"), name, tree (fragment), items (with dueDate, priority, recurrence, habit, metadata). Optionally strip or anonymize user-specific ids if sharing; generate new ids on import.
- **Format:** Same as journey pack schema (V3). So an exported plan **is** a journey pack that can be loaded by the same loader.

### 8.2 Import

- **Input:** Journey pack JSON (from file, URL, or share).
- **Process:** Same as “load journey”: resolve relative-time if any (or keep dueDates as-is for export); normalize items (ids, timestamps); merge tree under base; structureAddItems(items). One write path.
- **Result:** Importer’s structure slice gains the tree nodes and items. Their base tree is unchanged; the imported plan attaches under the same anchors (e.g. Travel). No duplicate “planner”; one structure.

### 8.3 Ecosystem

- **Templates:** Curated packs (camping, remodel, recovery, business launch) can be offered as “installable” plans. Same import path.
- **User-shared plans:** User A exports “Our camping plan”; User B imports and gets a copy under their Travel. User B can then edit (move dates, add items) in the planner. Export/import is the **major ecosystem piece**: plans become portable, shareable, and reusable without a separate “plan store.”

---

## 9. OSB as Master Entry Point

### 9.1 Principle

OSB does **not** replace the planner. OSB **feeds** the planner.

### 9.2 Flow

1. **User types** in OSB (e.g. “Vacation in June,” “Remodel kitchen,” “Start recovery”).
2. **OSB detects** intent (parser + keyword + suggestion layer); suggests route chips: Journal, Task, Note, **or** “Start [Journey] plan” (e.g. “Start Vacation plan”).
3. **User chooses** “Start Vacation plan” (or similar). OSB loads journey pack (travel) and shows expansion chips (Dog, Kids, Budget, Packing, …).
4. **User taps** chips; sub-journeys merge (lazy). Optional: open human builder to set trip date, dog?, kids? → conversion fills targetDate and subJourneys.
5. **User taps “Build plan.”** System runs conversion (if builder was used) or uses static pack; resolves relative-time → dueDates; then **structureAddItems** + tree merge. Planner slice updated.
6. **Planner handles the rest.** Priority, escalation, recurrence, scheduling, aggregation, habit ramp—all existing engines. User sees the plan in planner/calendar when they open it. No second system; OSB is the **entry**; planner is the **backbone**.

### 9.3 Summary

- **Single entry:** OSB is the main capture and “start a plan” surface.
- **Single store:** state.values.structure.
- **Single engine set:** prioritization, recurrence, scheduling, aggregation, progression. OSB and journeys only **populate** the slice; they do not replace or duplicate planner logic.

---

## 10. Simplicity Audit

### 10.1 Is V5 simpler than earlier OSB models?

- **Conceptually:** V5 is **more integrated** but **more concepts** (base tree, journey packs, relative-time, metadata conventions, human builder, export/import). So “simpler” in the sense of “one backbone, one slice, no duplication”; “more” in the sense of surface area (tree schema, builder, metadata keys).
- **Mechanically:** Simpler because there is **one** planner, **one** inject path, **one** set of engines. V1–V4 already moved toward that; V5 makes the base tree and the human builder explicit, which adds design surface but avoids “many ways to create a plan.”

### 10.2 Is it more stable long-term?

- **Yes**, if the base tree and metadata conventions are **fixed** and documented. Then:
  - Journey packs and builder outputs stay compatible.
  - New journeys only add data (packs, builder schemas), not new state shapes or engines.
  - Export/import format is stable (same as pack schema).

### 10.3 Where is complexity hiding?

- **Builder:** Form → JSON conversion and builder schemas per journey type require design and maintenance. Keep conversion logic in one place and builder schemas as data.
- **Tree merge:** Attaching journey nodes under the base tree must have clear rules (by id, append children). One merge function; document behavior.
- **Metadata:** dependsOn, phase, sequenceOrder, assignee, participants, owner, role are **conventions**. If multiple features use metadata, keep a single “metadata key” doc so they don’t collide (e.g. don’t use "phase" for two different meanings).

### 10.4 What could be removed?

- **Gantt metadata:** If no one needs sequencing or phases soon, phase/sequenceOrder/dependsOn could be deferred; items still work with only dueDate and priority. Add when a use case (e.g. “show phases,” “blocked/ready”) appears.
- **Lazy expansion:** Could always load full pack + all subJourneys at once. Simpler code path; slightly larger initial payload. Trade-off: simplicity vs. payload size.

### 10.5 What could be standardized further?

- **Relative-time:** One standard key in journey JSON (e.g. `dueOffset`, `relativeTo`) and one conversion function. All loaders use it.
- **Responsibility:** Pick one of assignee vs owner as canonical; alias the other in builder if needed. Reduces key proliferation.
- **Base tree:** Ship it as a single JSON/constant; all apps and journey loaders reference it. No drift.

### 10.6 What would break at scale?

- **Very large trees:** If thousands of nodes under one domain, tree merge and UI might slow. Mitigation: keep journey-injected nodes bounded (e.g. one node per “plan instance”); archive old plans to a flat list or separate “archive” slice if needed later.
- **Very many items:** structureAddItems with hundreds of items at once is one write; derivation is one pass. Should be fine; if not, batch items or lazy-expand by phase.
- **Builder schema drift:** If every journey type has a different builder schema and they’re not versioned, sharing “builder answers” across app versions could break. Version the builder schema or the pack format.

### 10.7 What is missing?

- **Multi-device / multi-user sync:** Not in scope. Structure slice is local. Sync would be an additional layer (e.g. sync state.values.structure with a backend or peer). Metadata assignee/participants support **assignment**; they don’t by themselves implement sync.
- **Dependency execution engine:** dependsOn is metadata only. “Blocked until A is done” would require something that reads “done” (e.g. completed flag or separate log). V5 does not define completion or dependency resolution; only metadata for ordering and future use.
- **Visual Gantt:** Designed for (metadata + dueDate); not built in V5.

---

## 11. Version Evaluation

Rate V5 against V1, V2, V3, V4 on: Simplicity, Power, Stability, Maintainability, Scalability, Cognitive load. (Rough ordinal: same / better / worse.)

| Criterion        | V1 (OSB entry) | V2 (smart routing) | V3 (journey expansion) | V4 (planner integration) | V5 (tree + builder + Gantt-aware) |
|-----------------|----------------|--------------------|-------------------------|---------------------------|------------------------------------|
| **Simplicity**  | High           | Medium             | Medium                   | High (one engine)        | Medium (more concepts, one slice)  |
| **Power**       | Low            | Medium             | High                    | High                     | Highest (builder, export, phases)  |
| **Stability**   | High           | High               | Medium (merge rules)    | High                     | High (fixed tree, conventions)    |
| **Maintainability** | High       | Medium             | Medium                   | High                     | Medium (builder + metadata docs)   |
| **Scalability** | High           | High               | Medium (pack size)       | High                     | Medium (tree/items growth)         |
| **Cognitive load** | Low         | Medium             | Medium                   | Low (user doesn’t see engine) | Medium (builder is simple; concepts are many for authors) |

### Summary

- **V5** is the **most powerful** (human builder, export/import, Gantt-ready metadata, base tree, relative-time) and **stable** (single slice, single engine set, clear conventions). It is **slightly less simple** than V1/V4 because of the number of integrated pieces (tree, packs, builder, metadata), but it avoids duplication and keeps one planner backbone. **Maintainability** and **scalability** depend on keeping builder logic and metadata conventions in one place and documenting them. **Cognitive load** for **end users** can stay low (forms, chips, “Build plan”); for **template and builder authors** it is higher (tree anchors, offsets, metadata keys).

---

## Final Directive Summary

- **No implementation.** This document is system-level synthesis and integration planning only.
- **Unification:** Base tree (permanent schema) + journey packs (expansion) + relative-time (templates) + Gantt-style metadata (optional) + habit ramps (existing) + shared responsibility (metadata) + human builder (forms → JSON) + export/import (same pack format). All feed the **same** structure slice and **same** planner engines.
- **No duplication:** One store, one inject path, one set of engines. No new planner; no second task model.
- **Contracts preserved:** StructureItem and StructureTreeNode unchanged; metadata and builder output conform to existing types. No engine refactors; only conventions and new data (packs, builder schemas).
- **Cleanest integrated plan:** OSB as entry → journey or builder → JSON (static or generated) → structureAddItems + tree merge → planner handles priority, forecasting, recurrence, habit ramp. V5 ties together tree foundation, journey expansion, planner integration, and human creation path into one coherent backbone.
