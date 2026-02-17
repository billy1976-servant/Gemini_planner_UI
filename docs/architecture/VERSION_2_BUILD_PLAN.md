# HIClarify Architecture — Version 2 Build Plan

**Document type:** Planning + analysis only. No runtime changes, no refactors, no new compiler code. Study and propose only.

**Scope:** JSON-driven blueprint/content compiler system. Three layered upgrades without breaking existing runtime behavior.

---

## 1) Executive Summary

Version 2 adds three layers on top of the current blueprint → content → app.json pipeline:

1. **Alias Layer** — Stable internal `nodeId` so display names can change without breaking arrows, state bindings, or content mapping.
2. **Validation Pass** — Pre-compile safety checks (duplicate IDs, missing targets, orphans, content drift, invalid references) with warnings/errors and optional report output.
3. **Content Auto-Sync** — Auto-generate missing content stubs and detect drift between blueprint and content.txt, with suggest-only and optional auto-create modes.

All three preserve: blueprint as source of truth, ID-based arrows, deterministic compiler, no required runtime behavior change. Blueprint authors can ignore aliases and keep writing `rawId | Name | Type` as today.

---

## 2) Current System Strengths (Level-9 Architecture)

- **Single source of truth:** Blueprint defines structure; content.txt supplies key-value content keyed by `rawId` (e.g. `1.0`, `1.2.1`).
- **Deterministic compile:** [`src/07_Dev_Tools/scripts/blueprint.ts`](src/07_Dev_Tools/scripts/blueprint.ts) — parse blueprint (indent + `rawId | Name | Type`), parse content by numeric id, build tree via indent stack, emit app.json. No inference, no file collapsing.
- **ID-based routing:** Runtime identity is `id: slugify(name)` (e.g. `|ThinkSection`). Arrows use `-> target` resolved to `screenId: idMap[raw]` via rawId or name; behaviors and state bindings reference nodes by emitted `id` or state keys.
- **Content keying by rawId:** Content is keyed by blueprint numeric id (`1.0`, `1.2`), so renaming a node (changing `Name`) does not break content lookup — but it does change emitted `id`, which breaks any arrow or behavior that targets that node by the old name-derived id.
- **Contract-aware:** content.manifest.json generation and validation; organ index for slots/variants. Clear molecule/slot contracts.

---

## 3) Why Version 2 Exists

- **Name brittleness:** Emitted `id = slugify(name)`. Renaming a node (e.g. ThinkSection → ThinkPanel) changes all incoming arrows and any logic that infers from name (e.g. `track = node.name.replace(/Save$/i, "")`). Refactors are risky.
- **Silent failures:** Duplicate names (two nodes with same `Name`, different rawIds) overwrite `idMap` (last wins) → duplicate IDs in tree. Missing arrow targets resolve to `idMap[raw]` which may be undefined. No pre-compile check.
- **Content drift:** content.txt is manually kept in sync. New blueprint sections get no content block; renamed or removed nodes leave orphan content. No stub generation or drift report.

Version 2 addresses these without changing the shape of the pipeline or requiring runtime changes.

---

## 4) Detailed Plan

### 4.1) Alias Layer (ID Stability System)

**Goal:** Stable internal node identity so names can change without breaking arrows, state bindings, behavior targets, or content mapping.

#### Analysis

- **Where IDs are derived:** In `buildTree`, first loop: `idMap[n.rawId] = slugify(n.name)`. So runtime `id` is purely name-derived. Second loop: `entry.id = idMap[node.rawId]`. So every emitted node has `id = slugify(name)`.
- **How screenId is resolved:** Arrow: `node.target` (rawId-like or name). Resolved as `raw = node.target.match(/^([\d.]+)/)?.[1] ?? rawByName[node.target] ?? node.target`, then `screenId: idMap[raw]`. So target is resolved to a rawId, then rawId → id. If arrow used a name, `rawByName[name]` gives rawId; then idMap[rawId] gives id. So today: name change → id change → any reference to that id breaks.
- **How arrows map to targets:** Arrows attach to the *source* node (`last.target`). The *target* is a string (rawId or name) resolved to `rawId`, then to `id` via idMap. All references to the destination node ultimately go through idMap, i.e. the emitted id.
- **Name-based coupling:** (1) `id = slugify(name)` — all consumers of node identity see the name-derived id. (2) `rawByName[n.name] = n.rawId` — arrow targets can be specified by name; name must be unique. (3) Logic that infers from name, e.g. `track = node.name.replace(/Save$/i, "")` for journal.add — depends on naming convention.

Content mapping is **not** name-coupled: content is keyed by `rawId`. So content stays valid under renames; only id and name-derived logic break.

#### Proposal

- **Internal immutable nodeId:** Introduce an optional stable identifier per node. If present, it is the canonical runtime `id`. Format: e.g. `@id NodeIdHere` on the line following the node, or inline token, e.g. `1.2 | ThinkSection | Section @id(thinkSection)`. Parser adds `nodeId?: string` to RawNode. Rule: `nodeId` must be unique across the blueprint and immutable (author assigns once; compiler never changes it).
- **Optional displayName:** If nodeId is present, the second column (current "Name") is treated as displayName for UI/labels only; it does not feed `id`. So: `id = nodeId when present, else slugify(name)`.
- **Optional aliasNames[]:** Optional list of legacy or alternate names for resolution. e.g. `@aliases(ThinkPanel, ReflectSection)`. When resolving arrow targets (or rawByName), match target string against: rawId, nodeId, displayName, aliasNames. Enables rename migration: add nodeId, add old name to aliasNames, rename display name.
- **Backward compatibility:** If no nodeId/aliases appear in blueprint, behavior is unchanged: `id = slugify(name)`, rawByName from name only. No new syntax required for existing apps.
- **Migration safety:** Existing blueprints compile as today. To migrate: add `@id(stableId)` (and optionally `@aliases(oldName)`) to nodes that are targets of arrows or behavior; then rename freely. content.txt stays keyed by rawId; no content change needed for alias-only adoption.

#### Blueprint creator guidance

- **Ignore aliases:** Authors can keep writing `rawId | Name | Type` only. They never need to add nodeId or aliasNames unless they want stable identity for refactors or reuse.
- **Compiler rule:** When emitting `id`: if node has `nodeId`, use it; else use `slugify(name)`. When building idMap for tree/arrows: idMap[rawId] = nodeId ?? slugify(name). When resolving arrow target string: resolve to rawId via rawId match, then nodeId match, then rawByName (name), then aliasNames; then id = idMap[rawId]. So compiler prefers nodeId when present and uses it for all references.

#### Preventing breakage of existing content.txt

- Content stays keyed by **rawId** only. Parser and content map are unchanged. No content key is ever nodeId or name. So adding nodeId/displayName/aliasNames does not change how content is looked up (contentMap[node.rawId]). Existing content.txt files remain valid.

#### Impact ratings (1–10)

| Criterion        | Score | Note |
|------------------|-------|------|
| Stability        | 9     | Refactors and renames no longer break arrows or behaviors. |
| Refactor safety  | 9     | Rename display name without touching references. |
| Maintainability  | 8     | One stable id per node; clear ownership of identity. |

---

### 4.2) Validation Pass (Pre-Compile Safety Engine)

**Goal:** Before building app.json, detect structural problems so developers get fast, readable feedback.

#### Proposed checks

- **Duplicate IDs:** After building idMap (with or without nodeId), detect if two rawIds map to the same `id`. Error.
- **Missing arrow targets:** For each node with `target`, resolve target to rawId then to id; if idMap[raw] is undefined (e.g. typo, removed node), error.
- **Orphan nodes:** (Optional) Nodes that are never referenced by any arrow or behavior — warning only; may be intentional.
- **Parent/child depth errors:** Indent stack implies parent; if max depth exceeds a safe limit (e.g. 10), warning. Invalid indent (e.g. child less indented than previous sibling) — error.
- **Content.txt drift vs blueprint:** Content blocks keyed by rawId that do not appear in blueprint (extra content) — warning. Blueprint rawIds with no content block (missing content) — warning. Keys under a content block that are not in content.manifest for that node type — warning (already partially present).
- **Invalid step references:** If Stepper steps reference screen/view ids, validate each step target exists in idMap — warning/error.
- **Invalid behavior targets:** For Navigation behaviors, screenId/to must be present in idMap. For other behaviors, validate action names or targets per contract — error when unresolved.

#### Design

- **Where validation runs:** After `parseBlueprint` and `parseContent` (and after building idMap if alias layer is present), before or alongside `buildTree`. Ideal: a dedicated `validate(rawNodes, contentMap, idMap, options)` step that returns a result object; `compileApp` calls it and then either continues (non-blocking) or fails on errors (configurable).
- **Output format:**
  - **warnings:** List of { code, message, rawId?, line?, suggestion? }. Do not fail compile by default.
  - **errors:** List of same shape. If "fail on error" is true, throw or exit before writing app.json.
  - **safeToContinue:** Boolean — true if no errors, or if errors present and policy is non-blocking.
- **Non-blocking by default:** Default behavior: run validation, print warnings and errors to console, still emit app.json. Option (flag or config): `--strict` or `validateFailOnError: true` to prevent emit when errors exist.
- **Developer-readable:** Console: one line per issue with code and rawId/location. Optional report file: e.g. `validation-report.json` or `validation-report.md` in app folder with same structure (warnings[], errors[], summary).

#### Impact ratings (1–10)

| Criterion    | Score | Note |
|-------------|-------|------|
| Safety      | 9     | Catches duplicate IDs, broken arrows, drift before runtime. |
| Debug speed | 9     | Immediate feedback at compile time with location. |
| Confidence  | 8     | Clear contract: what is checked and what is not. |

---

### 4.3) Content Auto-Sync Layer

**Goal:** Reduce manual maintenance between blueprint and content.txt: generate stubs for missing sections and detect unused content.

#### Analysis

- **How content keys map today:** Content parser reads lines; header `^([\d.]+)\s*(.*)$` sets `current`; subsequent `key : value` lines fill `content[current]`. So content is `Record<rawId, Record<key, value>>`. Blueprint nodes have rawId; contentMap[node.rawId] is used in buildTree. content.manifest.json defines allowed keys per node (by type or organ slots).
- **Where drift occurs:** (1) New section in blueprint (new rawId) — no content block in content.txt → contentMap[node.rawId] is empty; node still compiles with empty content. (2) Renamed/removed node — rawId removed from blueprint but content block remains in content.txt → unused content. (3) Node type change — allowed keys change; content may have wrong keys (already validated to some extent by validateContentKeys).

#### Proposal

- **Auto-generate missing content stubs:** After parsing blueprint and content, for each rawId in blueprint with no contentMap[rawId] or empty contentMap[rawId], generate a stub block: either in-memory only (for "suggest only" mode) or append to content.txt (for "auto-create" mode). Stub = block with rawId header and all keys from content.manifest for that node, with empty or placeholder values. Do not overwrite existing keys.
- **Detect unused content blocks:** Content keys that are rawIds not present in blueprint → list as "unused content" in validation report or sync report.
- **Suggest-only mode:** Default. Validation/sync run produces a report: "Missing content for rawIds: 1.3, 1.4. Suggested stubs: …" and optionally "Unused content blocks: 1.9, 2.0". No file writes to content.txt.
- **Auto-create mode:** Optional flag. For each missing rawId, append stub to content.txt (or merge into existing file with predictable formatting). Avoid overwriting: only add missing blocks; never replace existing key-value lines. Human-written content is preserved; only missing blocks are created.

#### Design

- **Where it runs in compile flow:** After parseBlueprint and parseContent (and content.manifest generation). Can be part of validation step or a separate "content sync" step. If auto-create: after generating stubs, re-read content or merge in memory and continue with merged contentMap for buildTree.
- **Avoiding overwriting:** Stub generation uses manifest keys and empty values. Write logic: only append new blocks (new rawId headers + key lines); never modify lines that already exist for a given rawId. Optionally: write to a separate file (e.g. content.suggested.txt) for author to merge manually.

#### Impact ratings (1–10)

| Criterion         | Score | Note |
|-------------------|-------|------|
| Editing speed     | 8     | No manual stub creation for new sections. |
| Error reduction   | 7     | Fewer missing-content bugs; unused content visible. |
| Authoring simplicity | 8  | One place (blueprint) to add structure; content stubs follow. |

---

## 5) Compatibility Guarantees

- **Blueprint remains source of truth:** All three layers are additive. No removal of existing blueprint syntax. Optional syntax (nodeId, aliasNames) only when author opts in.
- **Arrows remain ID-based:** Alias layer only changes *how* id is produced (nodeId vs slugify(name)); resolution still yields a single id per target. Runtime still receives screenId/to and id; no change to runtime contract.
- **Compiler remains deterministic:** Same blueprint + content → same app.json. Validation and sync do not change tree shape unless auto-create adds content that is then used in the same run; even then, output is deterministic for given inputs.
- **No runtime behavioral change required:** Runtime continues to consume app.json with `id`, `behavior.params.screenId`, `state.key`, etc. No new required fields.
- **Blueprint creator unaffected:** Authors can ignore nodeId, validation (beyond fixing errors if they opt into strict mode), and use suggest-only for content sync. Default behavior: compile as today; validation and sync are optional enhancements.

---

## 6) Risk Assessment

| Risk | Mitigation |
|------|------------|
| Alias syntax adds complexity | Keep it optional; document "ignore unless you need stable id". |
| Validation false positives | Use warnings for ambiguous cases; errors only for definite bugs (e.g. duplicate id, missing target). |
| Auto-create overwrites content | Design: append-only new blocks; never replace existing lines. Use content.manifest to define keys only. |
| Order of operations | Validation and sync run on parsed data before buildTree; alias resolution is part of idMap build. No circular dependency. |

---

## 7) Implementation Phases

- **Phase 1 — Validation pass:** Implement validation only (duplicate IDs, missing arrow targets, content drift, depth). Integrate into compile pipeline as non-blocking step; optional report file. No new blueprint syntax; no content writes. Delivers immediate safety and debug speed.
- **Phase 2 — Alias layer:** Add optional nodeId (and optional displayName/aliasNames) to blueprint parser and idMap/buildTree. Backward compatible; no change for existing apps. Enables stable id and safe renames.
- **Phase 3 — Content auto-sync:** Add suggest-only report (missing stubs, unused content). Then optional auto-create mode (append stubs only). Integrate after content parse; no overwrite of existing content.

Dependencies: Phase 1 none. Phase 2 none. Phase 3 can use Phase 1 validation for "missing content" and "unused content" categories. Phases 1 and 2 can be parallel; Phase 3 after or with Phase 1.

---

## 8) Impact Ratings (1–10 Aggregate)

| Dimension    | Score | Rationale |
|-------------|-------|-----------|
| Stability   | 9     | Alias layer prevents rename breakage; validation catches errors early. |
| Power       | 7     | No new runtime features; authoring and refactor safety improve. |
| UX          | 7     | Clearer errors and suggestions; less manual content maintenance. |
| Safety      | 9     | Validation and optional strict mode; deterministic compile preserved. |

---

## Recommended Rollout Order and Implementation Complexity

**Recommended order:** (1) **Validation pass** first — no syntax change, immediate value, establishes report format and pipeline hook. (2) **Alias layer** second — enables refactor-safe renames and sets up for long-term ID stability. (3) **Content auto-sync** third — suggest-only first, then optional auto-create.

**Expected total implementation complexity:** Medium. Validation is localized (one new step, ~200–400 LOC). Alias layer is parser + idMap/resolution changes (~100–150 LOC). Content sync is content parsing + stub generation + optional file append (~150–250 LOC). Total on the order of 500–800 LOC in the blueprint compiler and no runtime changes. Testing: run existing blueprint/content through pipeline; add unit tests for validation rules and alias resolution; one or two pilot apps for alias and content sync.

**End of plan.**
