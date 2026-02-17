# OSB V3 — JSON Journey Expansion Model

**Document type:** Read-only architecture and planning. No code changes. No refactors. No new engines. No contract rewrites.

**Purpose:** Upgrade OSB from suggestion router to a **JSON journey expansion system** that integrates with the existing planner/structure hierarchy. OSB becomes capture surface + expansion engine + planner injector + journey launcher, built entirely on the existing structure slice, existing engines, and JSON packs.

---

## 1. Context: What Already Exists (Do Not Rebuild)

The system already has:

- **Hierarchical planner/structure model** — `state.values.structure` (StructureSlice): `tree: StructureTreeNode[]`, `items: StructureItem[]`, `blocksByDate`, `rules`, calendar view, stats. StructureTreeNode: id, name, children, order. StructureItem: id, title, categoryId, priority, dueDate, recurrence, habit, metadata.
- **Unified task model** — Recurring (RecurrenceBlock), habit (HabitBlock), single tasks, and project-like grouping (categoryId, tree nodes) all live in the same slice. One store; one derivation path via state.update(structure, value).
- **structure:addFromText** — Reads text, runs parser (streamToCandidates), produces StructureItem[] candidates, merges into slice.items via structureAddItems / writeSlice. Single entry for "text → structure."
- **structureAddItem / structureAddItems** — Already accept item(s) and merge into slice.items; writeSlice updates state.values.structure only. No other task store.
- **Parser** — extreme-mode-parser (splitSentences, detectIntent, interpretStream); structure-mapper (mapToCandidates) produces StructureItem[] with categoryId, dueDate, recurrence from rules (categoryInference.keywords, priorityInference).
- **Planner templates** — e.g. `apps/planner-templates/personal.json`: tree (Life → Home, Work, Health, Finance), defaultTasks, defaultBlocks, rulesetId. Proves the pattern: JSON defines hierarchy and defaults; structure holds runtime data.
- **journal.add, state.update** — Existing intents; no change for V3. Journeys do not create a second journal or a second key-value store.

**No duplication rules (locked):** Recurring tasks, habits, single tasks, projects, planner, and structure slice are already unified. Journeys must generate structure items and optionally tree nodes; they must not create a second task model or new state shapes.

---

## 2. Core V3 Idea: Journey Expansion Engine

OSB is no longer only:

- capture  
- suggestion  
- routing  

OSB becomes:

- **Journey expansion engine** — User types once (e.g. "Vacation," "Plant a garden," "Remodel kitchen," "Start a business," "Date night"); system expands that into loadable JSON journey packs, hierarchical planning trees, and templates that inject directly into the existing planner/structure.

Analogy: like downloading a Bible version, a course, or a planner template—but for life experiences. User taps "Build plan" → journey loads → structure fills. No new system; same hierarchy, same slice.

**Critical design rule:** This is not a new system. It uses the same hierarchy already used by planner, structure, tasks, subtasks, categories. OSB V3 loads journeys and injects them into structure; it never creates a second task system.

---

## 3. What a "Journey" Is

A **Journey** = a JSON template pack that contains:

- **Domains / subdomains** — Maps to StructureTreeNode hierarchy (id, name, children, order) or to categoryIds used by StructureItems.
- **Tasks / subtasks** — Maps to StructureItem[] (id, title, categoryId, priority, dueDate, recurrence, habit, metadata). Subtasks are items with a categoryId or metadata that groups them under a parent (existing pattern: categoryId for domain, metadata for linkage if needed).
- **Planning structure** — Optional: suggested blocks, ruleset reference, default priorities. All consistent with ResolvedRuleset and existing structure slice.
- **Decision paths** — Optional: branches in the JSON (e.g. "if Kids then add kids_travel pack"); expansion logic chooses which sub-packs to load. Still outputs only structure items and tree nodes.

**Examples (conceptual):**

- **Vacation Journey** — Travel, Budget, Packing, Kids, Dog, Documents, Safety, Schedule → each becomes a domain (tree node) or category, with suggested items (tasks) under each. Load = merge tree nodes + items into slice.
- **Gardening Journey** — Soil prep, Tools, Seeds, Watering, Pest control, Harvest → same: tree/categories + items.
- **Home Remodel Journey** — Budget, Design, Materials, Timeline, Contractor, Permits → same.
- **Date night / Business start** — Same pattern: domains + items, all targeting state.values.structure.

All map into the **same** structure slice. No parallel store.

---

## 4. How It Plugs Into the Structure Hierarchy

- **Single store:** `state.values.structure` remains the only planner/task store. StructureSlice has `tree` (StructureTreeNode[]) and `items` (StructureItem[]).
- **Journey load = structure merge:** Loading a journey means: (1) parse the journey JSON into a list of StructureTreeNode (for hierarchy) and StructureItem (for tasks/subtasks), (2) merge into the current slice: tree merge (by id or append), items merge (structureAddItems). Existing actions structureAddItem, structureAddItems already support this; optionally a dedicated structure:addJourney action can accept a journey payload and call the same merge logic, still writing only to state.values.structure.
- **Hierarchy:** Journey packs can define tree nodes (e.g. "Vacation" with children "Travel," "Budget," "Packing"). These become StructureTreeNode entries; slice.tree is updated to include them (or merged with existing tree). Items reference categoryIds that align with tree node names or with a shared category scheme (e.g. categoryInference in rules). So: same tree, same items, same slice—no new hierarchy type.
- **Recurring / habit / single / project:** All journey-generated items use the same StructureItem shape: recurrence, habit, dueDate, categoryId. No new task types. The existing unified task model absorbs journey items.

---

## 5. JSON-Driven Expansion Model

### 5.1 Journey packs as JSON

V3 explicitly documents journey packs as JSON files (conceptual), e.g.:

- `travel.json` (vacation)
- `business_start.json`
- `gardening.json`
- `date_night.json`
- `remodel.json`

Each pack contains (conceptual schema):

- **id** — Journey pack id (e.g. "travel", "gardening").
- **name** — Display name (e.g. "Vacation", "Plant a garden").
- **tree** (optional) — Fragment of StructureTreeNode[] to merge (domains/subdomains).
- **items** (optional) — StructureItem[] (or partials: title, categoryId, priority, dueDate, recurrence, habit). IDs can be generated at load time (normalizeItem).
- **subJourneys** (optional) — References to other packs (e.g. "dog", "kids_travel") for expansion when user selects "Dog" or "Kids."
- **suggestedDomains** (optional) — Suggested chips for first-level expansion (e.g. Dog, Kids, Budget, Packing) that either add more items or load a subJourney.

All fields are optional; a minimal journey might be only items. The important point: the output of any journey or sub-journey is always **tree nodes + items** that merge into the existing structure slice.

### 5.2 How expansion works

- User types in OSB: e.g. "Going on vacation."
- **Domain detection** — OSB (or suggestion layer) detects domain: vacation / travel. This can be keyword-based (e.g. "vacation", "travel", "trip") and map to a journey pack id (e.g. travel.json).
- **Load root pack** — System loads travel.json. Pack defines suggested expansion chips: Dog, Kids, Budget, Packing, Food, Travel.
- **Show chips** — OSB shows these as expansion chips (not routing chips). User taps "Dog" and "Kids."
- **Expand deeper** — System loads sub-packs (e.g. dog.json, kids_travel.json) and merges their tree + items into the slice. No new UI contract; same "add to structure" semantics.
- **Build plan** — User taps "Build plan." System has already merged (or merges on confirm) all selected journey fragments into structure. Planner UI (existing) shows the same structure slice; user sees the new tree nodes and items. No new planner logic.

So: **OSB loads packs → produces tree + items → injects via structureAddItems (and tree merge) into state.values.structure.** Expansion is just "load more packs and merge"; the only store is structure.

---

## 6. Engine Compatibility Check

- **Journeys can be injected via:**
  - **structure:addItems** — Journey payload is converted to StructureItem[] (and optionally tree); action calls structureAddItems with those items. Already exists; no new action required for items-only injection.
  - **structure:addFromText** — Not used for journey injection (that is for free text → candidates). Kept for single-sentence task capture.
  - **Future structure:addJourney (optional)** — A single new action that: accepts a journey id or journey payload, resolves pack(s) (from static JSON or a registry), converts to tree + items, merges tree into slice.tree and items into slice.items, writes via writeSlice (same state.update(structure, next)). Still writes only to state.values.structure. No new store; no new engine.

- **Do not:**
  - Create new engines.
  - Create new stores (no journey store separate from structure).
  - Create parallel planner logic. Planner continues to read state.values.structure; journeys only populate it.

- **Parser:** Still used for OSB suggestion (detect intent, suggest route or journey). Journey expansion does not replace the parser; it adds a path "user input → match journey pack → load and inject." Parser can help match input to journey id (e.g. "vacation" → travel.json).

- **Structure engine:** Unchanged. structureAddItem, structureAddItems, writeSlice, getSlice remain the only writers to the structure slice. Journey load is a caller of these (or of one thin structure:addJourney that uses them).

- **Journal / state:** No change. journal.add and state.update unchanged. Journeys do not write to journal; they only add to structure.

---

## 7. Sharing Model

Journeys are:

- **Exportable** — A user's current structure (or a subset) can be serialized to a journey-like JSON (tree + items) for export. Format matches the journey pack schema so others can load it.
- **Shareable** — Journey packs (JSON files) can be shared via URL, file, or in-app share. No marketing; user-driven sharing (e.g. "share my vacation plan", "share this remodeling template").
- **Installable** — Like downloading a planner template: user receives a journey JSON and "installs" it by loading it into their structure (merge). Same structure:addJourney or structureAddItems path. No separate "journey store"; installed = merged into structure.

This is not marketing; it is user-driven sharing of plans and templates that expand into the same planner hierarchy.

---

## 8. OSB V3 Flow (Summary)

1. User types in OSB: e.g. "Going on vacation."
2. System detects domain (keyword or suggestion layer) → selects journey pack: e.g. travel.json.
3. OSB shows expansion chips from pack: Dog, Kids, Budget, Packing, Food, Travel.
4. User taps Dog, Kids → system loads dog.json, kids_travel.json and merges their content (tree + items) into structure.
5. User taps "Build plan" (or equivalent) → any remaining merge is committed; UI closes or navigates to planner. Planner shows the same structure slice with the new nodes and items.
6. No new task system; no new state shapes. All injection goes through structure slice only.

---

## 9. Relationship to OSB V2

- **V2:** Suggestions, routing, journal, tasks, tracks, notes. OSB suggests "Journal / Task / Track / Note / Plan / People…" and routes to journal.add, structure:addFromText, state.update.
- **V3 adds:** Hierarchical expansion, journey packs, planner injection, deep planning experiences. When the user input matches a journey (e.g. "vacation", "remodel kitchen"), OSB can offer both:
  - **Route suggestions** (V2): e.g. "Save as task", "Journal", "Note."
  - **Expansion suggestion** (V3): e.g. "Start Vacation plan" → load travel.json and show expansion chips. After expansion, "Build plan" injects into structure.

V2 and V3 coexist: same capture surface, same state and engines. V3 adds a parallel path "input → journey match → load packs → merge into structure" without breaking V2 routing (journal, task, track, note, etc.).

---

## 10. Example Journey JSON Schema (Conceptual Only)

```json
{
  "id": "travel",
  "name": "Vacation",
  "version": "1.0",
  "tree": [
    { "id": "travel-root", "name": "Vacation", "order": 0, "children": [
      { "id": "travel-budget", "name": "Budget", "order": 0 },
      { "id": "travel-packing", "name": "Packing", "order": 1 },
      { "id": "travel-docs", "name": "Documents", "order": 2 }
    ]}
  ],
  "items": [
    { "title": "Book transport", "categoryId": "travel", "priority": 5 },
    { "title": "Set budget", "categoryId": "travel-budget", "priority": 7 }
  ],
  "subJourneys": {
    "dog": "dog_travel",
    "kids": "kids_travel"
  },
  "suggestedDomains": ["Dog", "Kids", "Budget", "Packing", "Food", "Travel"]
}
```

- **tree** — Merged into slice.tree (or used to create categories/domains). StructureTreeNode shape.
- **items** — Merged via structureAddItems; ids and timestamps assigned at load. StructureItem shape.
- **subJourneys** — Map chip key to another pack id; when user taps "Dog", load pack "dog_travel" and merge.
- **suggestedDomains** — UI chips for first-level expansion. No new contract; just a list of labels.

This schema is conceptual only; implementation would align with StructureTreeNode and StructureItem and existing structureAddItems/tree merge logic.

---

## 11. No Duplication Rules (Explicit Validation)

- **Recurring tasks** — Already in StructureItem.recurrence. Journeys that define recurring items set recurrence on those items; same shape.
- **Habits** — Already in StructureItem.habit. Journey items can include habit; same shape.
- **Single tasks** — StructureItem without recurrence/habit. Journey items are the same.
- **Projects** — Represented by categoryId and/or tree nodes. Journeys add tree nodes and items with categoryIds; no separate project store.
- **Planner** — Reads state.values.structure (tree, items, blocksByDate, etc.). Journeys only write into that slice; planner sees journey-injected data as normal structure data.
- **Structure slice** — Single source of truth. Journeys generate structure items and tree nodes; they do not create a second task model or new state shapes. All writes go through writeSlice (state.update(structure, next)).

---

## 12. Risks

- **Tree merge semantics** — If multiple journeys (or user data) define nodes with the same id, merge must be well-defined (e.g. by id, or append with generated ids). Document and keep merge logic in one place (e.g. inside structure:addJourney or a single journey-loader module).
- **Pack size and complexity** — Large packs could create many items at once. Consider lazy expansion (load subJourneys only when user taps) and optional "preview" before full inject. No new engine; just design of when to call structureAddItems.
- **Versioning** — Shared journey JSON may evolve. Schema version field and backward compatibility for load logic; no state contract change.
- **Conflict with manual edits** — User may already have "Vacation" tree or items. Merge strategy (e.g. append vs replace by id) must be clear and consistent with existing structure behavior.

---

## 13. Migration Path from V2 to V3

- **V2 remains** — Capture, suggestion, routing to journal/task/track/note/plan. No removal.
- **Add journey detection** — In the suggestion layer, add path: if input matches a known journey id (keyword or map), offer "Start [Journey name] plan" as a chip alongside "Task", "Journal", etc.
- **Add expansion UI** — When user selects a journey, show expansion chips from pack (suggestedDomains / subJourneys). On tap, load sub-packs and merge; optionally show "Build plan" to confirm and close.
- **Add load/inject path** — Either (1) call structureAddItems (and tree merge) directly from OSB component when "Build plan" is tapped, or (2) register structure:addJourney that accepts journey id or payload and performs merge, still writing only to state.values.structure.
- **No contract rewrites** — State-resolver, behavior-listener, action-registry extensions only (one optional action). JSON journey packs are data (new file format); structure slice shape unchanged.

---

## 14. Final Directive Summary

OSB V3 is a **system-level upgrade** of the OSB concept, not a one-off feature:

- **OSB becomes:** Capture surface + suggestion router (V2) + **expansion engine** + **planner injector** + **journey launcher.**
- **Built entirely on:** Existing hierarchy (tree + items), existing engines (structure actions, parser, state), JSON packs (journey format), and the single structure slice.
- **No duplication:** No new task system, no new stores, no parallel planner logic. Journeys generate structure items and tree nodes and inject via existing (or one extended) structure action.
- **No new architecture layers:** Only extension of OSB (journey match + load + merge) and optional structure:addJourney that still writes only to state.values.structure.

This document is read-only architecture and planning. No code changes, no refactors, no new engines, no contract rewrites.
