# Structure Tree + JSON Source Trace (Read-Only)

**Date:** 2026-02-16

---

## SECTION A — Tree Location

**File where the planner tree is defined:**

- [src/05_Logic/logic/planner/base-planner-tree.ts](C:\Users\New User\Documents\HiSense\src\05_Logic\logic\planner\base-planner-tree.ts)

**Actual tree definition (exported constant):**

```ts
export const BASE_PLANNER_TREE: StructureTreeNode[] = [
  {
    id: "life",
    name: "Life",
    order: 0,
    children: [
      { id: "home", name: "Home", order: 0 },
      { id: "business", name: "Business", order: 1 },
      { id: "health", name: "Health", order: 2 },
      { id: "relationships", name: "Relationships", order: 3 },
      { id: "finance", name: "Finance", order: 4 },
      { id: "projects", name: "Projects", order: 5 },
      { id: "travel", name: "Travel", order: 6 },
      { id: "maintenance", name: "Maintenance", order: 7 },
      { id: "growth", name: "Growth", order: 8 },
    ],
  },
];
```

**Domains:** One root node: `Life`.  
**Categories (children of Life):** Home, Business, Health, Relationships, Finance, Projects, Travel, Maintenance, Growth.  
**Subcategories:** None; nodes have `id`, `name`, `order`, and optional `children` (all current children are leaves, no nested children).  
**Tasks:** Not stored on the tree. Tasks are in `state.values.structure.items` (flat list); each item has `categoryId` (string).  

**Confirmation:** A tree exists. It is a constant in TypeScript, not loaded from JSON at runtime.

---

## SECTION B — Tree Load Path

**Where structure.tree is created:**

- In [src/05_Logic/logic/actions/structure.actions.ts](C:\Users\New User\Documents\HiSense\src\05_Logic\logic\actions\structure.actions.ts), inside `getSlice()`:
  - If `values.structure` exists and has `items` but `slice.tree` is missing or empty: `tree` is set to a copy of `BASE_PLANNER_TREE` and written back via `writeSlice(withBase)` (lines 49–52).
  - If `values.structure` is missing or invalid: initial slice is created with `tree: [...BASE_PLANNER_TREE]` and written via `writeSlice(initial)` (lines 55–57).

**Where it is written into state.values.structure:**

- Same file: `writeSlice(next)` calls `dispatchState("state.update", { key: STRUCTURE_KEY, value: next })` with `STRUCTURE_KEY = "structure"`. So the whole slice (including `tree`) is written to `state.values.structure`.

**Source of the tree:**

- **Constant.** The tree comes from the in-code constant `BASE_PLANNER_TREE` in [base-planner-tree.ts](C:\Users\New User\Documents\HiSense\src\05_Logic\logic\planner\base-planner-tree.ts). It is not loaded from a JSON file, not from a migration, and not from the network. It is initialized when `getSlice()` first runs and finds no or empty `structure.tree`.

---

## SECTION C — Tree Usage

**References to the tree in the parser/addFromText path:**

- [src/05_Logic/logic/engines/structure/structure-mapper.engine.ts](C:\Users\New User\Documents\HiSense\src\05_Logic\logic\engines\structure\structure-mapper.engine.ts): **No** reference to `tree`, `structure.tree`, or any planner tree. Imports and parameters are: ParseResult, ResolvedRuleset, MapperContext (refDate, activeCategoryId, rules). No tree parameter.
- `inferCategory(title, rules)`: Uses only `rules.categoryInference?.keywords` (phrase → categoryId). Does **not** read the tree.
- [structure.actions.ts](C:\Users\New User\Documents\HiSense\src\05_Logic\logic\actions\structure.actions.ts) `structureAddFromText`: Calls `streamToCandidates(segments, slice.rules ?? {}, refDate)`. Passes **only** `slice.rules` and `refDate`. Does **not** pass `slice.tree` or any tree.
- Parser pipeline (extreme-mode-parser → interpretToCandidates → mapToCandidates): No tree is passed or read.

**Other use of the tree (not in parsing):**

- [src/05_Logic/logic/actions/diagnostics.actions.ts](C:\Users\New User\Documents\HiSense\src\05_Logic\logic\actions\diagnostics.actions.ts): `getTreePathForCategoryId(categoryId, BASE_PLANNER_TREE)` is used in the diagnostics trace (e.g. planner full parse trace) to report a hierarchy path for a **already-computed** categoryId. This is trace/reporting only; it does not run during addFromText or mapToCandidates.

**Answers:**

- **Does parsing look at the tree?** **No.**
- **Does it attach tasks to tree nodes?** **No.** Tasks are appended to `structure.items` with a `categoryId`. Nothing in the parser assigns a tree node or parent reference; the tree is never read during parsing.

---

## SECTION D — Rule + Tree Relationship

**Where rules are loaded from:**

- Rule **definitions** live in [src/01_App/apps-json/rulesets/base.json](C:\Users\New User\Documents\HiSense\src\01_App\apps-json\rulesets\base.json). Content includes: `priorityScale`, `escalation`, `categoryInference: { keywords: {}, defaultCategoryId: "default" }`, `priorityInference: { asap:9, urgent:9, high:7, ... }`, `rules: []`.
- [src/01_App/apps-json/apps/planner-templates/personal.json](C:\Users\New User\Documents\HiSense\src\01_App\apps-json\apps\planner-templates\personal.json) references `"rulesetId": "base"`.
- **No in-repo code path was found** that loads base.json (or any ruleset) and writes it into `state.values.structure.rules`. The structure slice initializes with `rules: {}` in EMPTY_SLICE. So at runtime, `structure.rules` may remain `{}` unless some other mechanism (not found in this search) hydrates it.

**Do rules reference the tree?**

- **No.** base.json contains no field that references the planner tree, node ids, or hierarchy. It has `categoryInference.keywords` (flat phrase → categoryId map) and `priorityInference` (phrase → number).

**Does categoryInference map to tree nodes?**

- **Only by value.** categoryInference maps **keywords** → **categoryId** (string). If you configure e.g. `"garden": "maintenance"`, then when the parser infers categoryId `"maintenance"`, that **value** matches the tree node id `maintenance` in BASE_PLANNER_TREE. The parser never reads the tree to do this; it only uses the keyword table. So categoryInference does not “reference” the tree; it can only produce a categoryId that happens to match a tree node id.

---

## SECTION E — Missing Piece Check

**Does the system currently contain the following in the live tree or state?**

| Term | Present? | Location |
|------|----------|----------|
| **business** | Yes | [base-planner-tree.ts](C:\Users\New User\Documents\HiSense\src\05_Logic\logic\planner\base-planner-tree.ts): node `{ id: "business", name: "Business", order: 1 }`. |
| **home** | Yes | Same file: node `{ id: "home", name: "Home", order: 0 }`. |
| **maintenance** | Yes | Same file: node `{ id: "maintenance", name: "Maintenance", order: 7 }`. |
| **garden** | No | Not in BASE_PLANNER_TREE. Appears only in docs (e.g. OSB_V3, OSB_V4, parser-test placeholder) and in archived [\_super_clean/archive/docs/PLANNER_V2_MASTER_PLAN.md](C:\Users\New User\Documents\HiSense\_super_clean\archive\docs\PLANNER_V2_MASTER_PLAN.md) as `{ "id": "cat-garden", "name": "Garden", "children": [] }` (archive only). **Garden is not in the live tree.** |
| **subtasks** | No as tree nodes | The tree type is `StructureTreeNode` (id, name, children?, order?). There are no nodes named "subtasks". Tasks live in `structure.items` (flat); hierarchy is described in docs as categoryId or metadata (e.g. parentId), not as tree node children. So **subtasks are not a node in the tree**; they are a conceptual grouping (e.g. by categoryId or metadata). |

**Summary:** business, home, and maintenance exist in the live planner tree (base-planner-tree.ts). Garden is not in that tree. Subtasks are not tree nodes; they are a doc/convention for items, not part of the tree definition.

**TREE NOT FOUND IN STATE:** The tree is **not** stored in state as a separate key. It is part of the object at **state.values.structure**: the `structure` object has a `tree` property that is set from BASE_PLANNER_TREE when getSlice() initializes or repairs the slice. So the tree **does** exist in state at `state.values.structure.tree` after the first getSlice() run; the “missing piece” check above refers to the **content** of that tree (which nodes exist), not whether the key exists.
