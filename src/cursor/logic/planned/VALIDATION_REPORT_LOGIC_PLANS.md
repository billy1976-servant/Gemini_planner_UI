# Validation Report: Logic Plans (planned/)

**Protocol:** `src/docs/RUNTIME/VALIDATE_PLANS_PROTOCOL.md`  
**Contracts used:** `src/docs/ARCHITECTURE_AUTOGEN/*`, `src/docs/SYSTEM_MAP_AUTOGEN/*`  
**Plans validated:** All 6 files in `src/cursor/logic/planned/`  
**Date:** 2025-02-04  

**Update:** Plans have been renumbered 1–6 by execution flow and validation edits applied. Current files: 1_LOGIC_LAYOUT_CONTRACT, 2_STATE_AND_OVERRIDE, 3_BLUEPRINT_TO_RUNTIME, 4_CONTEXTUAL_LAYOUT_LOGIC, 5_LAYOUT_DECISION_ENGINE, 6_USER_PREFERENCE_ADAPTATION.

---

## Summary (pre-edit; issues addressed in plan files)

| Plan (execution order) | File | Invalid assumptions | Conflicts | Missing dependencies | Status |
|------------------------|------|---------------------|-----------|----------------------|--------|
| 1 | 1_LOGIC_LAYOUT_CONTRACT_PLAN.md | Fixed | 0 | 0 | Edits applied |
| 2 | 2_STATE_AND_OVERRIDE_ORCHESTRATION_PLAN.md | Fixed | 0 | Fixed | Edits applied |
| 3 | 3_BLUEPRINT_TO_RUNTIME_WIRING_PLAN.md | Fixed | 0 | Fixed | Edits applied |
| 4 | 4_CONTEXTUAL_LAYOUT_LOGIC_PLAN.md | Fixed | 0 | Fixed | Edits applied |
| 5 | 5_LAYOUT_DECISION_ENGINE_PLAN.md | Fixed | 0 | Fixed | Edits applied |
| 6 | 6_USER_PREFERENCE_ADAPTATION_PLAN.md | Fixed | 0 | Fixed | Edits applied |

**Cross-cutting:** All plans reference **"primary architecture reference: docs/SYSTEM_MASTER/"**. That path does not exist (repo has no root `docs/`; git history shows `docs/SYSTEM_MASTER/` as removed). The authoritative contracts are **`src/docs/ARCHITECTURE_AUTOGEN`** and **`src/docs/SYSTEM_MAP_AUTOGEN`**.

---

## 1. 4_LAYOUT_DECISION_ENGINE_PLAN.md

### 1.1 Invalid assumption — Architecture reference

- **Where:** Classification / header: "primary architecture reference: docs/SYSTEM_MASTER/"
- **Issue:** `docs/SYSTEM_MASTER/` is not present. Contracts live under `src/docs/ARCHITECTURE_AUTOGEN` and `src/docs/SYSTEM_MAP_AUTOGEN`.
- **Suggested correction:** Replace with: "primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN".

### 1.2 Missing dependency — "Suggestion" not in resolution pipeline

- **Where:** Integration Points (Dropdown and resolver); Precedence described as "override > explicit > suggestion > default".
- **Issue:** Current layout resolution in `src/engine/core/json-renderer.tsx` (applyProfileToNode) is **override → node.layout → template default → undefined**. There is no "suggestion" step; the Decision Engine and its recommendation are not wired.
- **Suggested correction:** Add an explicit dependency note: "Implementation requires inserting a suggestion step in applyProfileToNode (after explicit node.layout, before template default) and wiring the resolver to call the Decision Engine when override and explicit are absent. Until then, precedence remains override → explicit → default."

### 1.3 Missing dependency — Trait registry and context config

- **Where:** Data Sources (trait registry, context → weights JSON); Inputs (compatible layout IDs from getLayout2Ids + evaluateCompatibility).
- **Issue:** `layout-traits.json` / `trait-registry.json` and `context-trait-weights.json` do not exist. `getLayout2Ids()` and `evaluateCompatibility()` exist and match the plan.
- **Suggested correction:** No change to plan logic. Before implementation: (1) Add trait registry JSON under layout or config and (2) Add context → trait-weights config. Treat as implementation prerequisites, not contract conflicts.

### Contract alignment (no changes needed)

- **getLayout2Ids():** Present in `src/layout/resolver/layout-resolver.ts`, exported from `@/layout`. ✓
- **evaluateCompatibility(…).sectionValid:** Present in `src/layout/compatibility/compatibility-evaluator.ts`. ✓
- **getDefaultSectionLayoutId(templateId):** From `src/layout/page/page-layout-resolver.ts`, exported via `@/layout`. ✓
- **Override / explicit / template default:** Matches LAYOUT_RESOLUTION_CONTRACT; "suggestion" is the planned insertion. ✓

---

## 2. 4_LOGIC_LAYOUT_CONTRACT_PLAN.md

### 2.1 Invalid assumption — Architecture reference

- **Where:** Classification: "primary architecture reference: docs/SYSTEM_MASTER/"
- **Issue:** Same as 1.1.
- **Suggested correction:** "primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN".

### Contract alignment

- **getAvailableSlots(sectionNode):** `src/layout/compatibility/content-capability-extractor.ts`; exported from `@/layout`. ✓
- **evaluateCompatibility(…):** Returns sectionValid, cardValid, organValid, missing. ✓
- **Logic suggests / Layout resolves:** Aligns with current contracts; no store writes from Logic. ✓
- **No layout IDs from Logic:** Aligns with LAYOUT_RESOLUTION_CONTRACT and BLUEPRINT_RUNTIME_INTERFACE. ✓

---

## 3. 5_BLUEPRINT_TO_RUNTIME_WIRING_PLAN.md

### 3.1 Invalid assumption — Architecture reference

- **Where:** Classification: "primary architecture reference: docs/SYSTEM_MASTER/"
- **Issue:** Same as 1.1.
- **Suggested correction:** "primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN".

### 3.2 Missing dependency — Compiler vs runtime boundary

- **Where:** Flow Overview ("Blueprint JSON → Compiler → Screen JSON"); Static vs Dynamic; Template defaults from templates.json.
- **Issue:** BLUEPRINT_RUNTIME_INTERFACE confirms compiler writes app.json; runtime loads via loadScreen and does not resolve layout at compile time. Templates and defaultLayout live in `src/layout/page/templates.json`; `getDefaultSectionLayoutId(templateId)` reads them. Plan is consistent; the only gap is that "screen JSON" in the plan maps to what the codebase calls app.json / loaded JSON (root from json?.root ?? json?.screen ?? json?.node).
- **Suggested correction:** Add one sentence: "Screen JSON in this doc is the loaded document (e.g. app.json) whose root is json?.root ?? json?.screen ?? json?.node (see BLUEPRINT_RUNTIME_INTERFACE.generated.md)."

### Contract alignment

- **Template defaults only in template JSON:** Matches LAYOUT_RESOLUTION_CONTRACT and page-layout-resolver. ✓
- **No hardcoded layout fallbacks in code:** Matches RUNTIME_FALLBACKS and json-renderer (undefined when none set). ✓
- **Runtime resolution order:** Override → explicit → default; no suggestion step yet. ✓

---

## 4. 5_USER_PREFERENCE_ADAPTATION_PLAN.md

### 4.1 Invalid assumption — Architecture reference

- **Where:** Classification: "primary architecture reference: docs/SYSTEM_MASTER/"
- **Issue:** Same as 1.1.
- **Suggested correction:** "primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN".

### 4.2 Missing dependency — Trait registry and preference memory

- **Where:** Data Sources (trait registry same as Decision Engine; preference weights persisted); Integration (Layout Decision Engine, layout store read-only).
- **Issue:** Trait registry does not exist yet (same as Decision Engine plan). Preference memory (trait id → number) and its persistence are out of scope but are a prerequisite for this plan’s output to be consumed by the Decision Engine.
- **Suggested correction:** Add: "Prerequisites: (1) Trait registry (layout ID → traits) as in Layout Decision Engine plan; (2) Preference memory (trait id → number) and persistence strategy before Decision Engine consumes preference weights."

### Contract alignment

- **Read-only for layout store/node:** Aligns with STATE_SHAPE_CONTRACT and layout stores; no new state intents required for "more/less like this" until a persistence path is chosen. ✓
- **Resolution order unchanged:** override > explicit > suggestion > default. ✓

---

## 5. 6_CONTEXTUAL_LAYOUT_LOGIC_PLAN.md

### 5.1 Invalid assumption — Architecture reference

- **Where:** Classification: "primary architecture reference: docs/SYSTEM_MASTER/"
- **Issue:** Same as 1.1.
- **Suggested correction:** "primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN".

### 5.2 Missing dependency — Rules JSON and slot/metrics source

- **Where:** Data Sources: "getAvailableSlots(sectionNode) from src/layout/compatibility/content-capability-extractor.ts"; Rule set "contextual-layout-rules.json".
- **Issue:** File path for getAvailableSlots is correct. `contextual-layout-rules.json` does not exist; optional content metrics (e.g. body word count) are not implemented.
- **Suggested correction:** Add: "Implementation prerequisites: (1) Add contextual-layout-rules.json (condition → traits/weights). (2) Optional content metrics (e.g. body word count, card count) require a small extractor if rules use them."

### Contract alignment

- **getAvailableSlots(sectionNode):** content-capability-extractor.ts, exported from `@/layout`. ✓
- **Compatibility engine:** Same section node; compatibility filters layout IDs; contextual logic only outputs traits/weights. ✓
- **No layout IDs in rules:** Aligns with LAYOUT_COMPATIBILITY_ENGINE and requirement/slot naming. ✓

---

## 6. 6_STATE_AND_OVERRIDE_ORCHESTRATION_PLAN.md

### 6.1 Invalid assumption — Architecture reference

- **Where:** Classification: "primary architecture reference: docs/SYSTEM_MASTER/"
- **Issue:** Same as 1.1.
- **Suggested correction:** "primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN".

### 6.2 Missing dependency — "Suggestion" in precedence and storage

- **Where:** Precedence Order (1. User override … 3. Logic suggestion … 4. Template default); Where Each Is Stored ("Logic recommendation: Not persisted. Computed at resolution time …").
- **Issue:** Current precedence in code is override → explicit → template default (no suggestion). Logic recommendation is not computed or stored anywhere yet.
- **Suggested correction:** Add: "Current runtime implements override → explicit → default only. Adding 'Logic suggestion' requires: (1) Decision Engine (or equivalent) to compute recommendation at resolution time, (2) applyProfileToNode to request and use it when override and explicit are absent, (3) no new persistence for suggestion (computed each time)."

### Contract alignment

- **Override storage:** sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides from section-layout-preset-store and organ-internal-layout-store, passed into render. ✓
- **Template default:** getDefaultSectionLayoutId(templateId) from templates.json. ✓
- **No cross-engine store writes:** Matches STATE_SHAPE_CONTRACT and layout/state contracts. ✓

---

## Recommendations before execution

1. **Update architecture reference in all six plans**  
   Replace "docs/SYSTEM_MASTER/" with "src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN" (or a single START_HERE in those dirs) so implementers and validators use the correct contracts.

2. **Implement "suggestion" in the resolution pipeline before Decision Engine is useful**  
   Plans 4 (Decision Engine), 5 (User Preference), and 6 (State/Override) assume a suggestion step. Currently applyProfileToNode has no suggestion slot. Either: (a) add a placeholder (e.g. undefined) and wire the Decision Engine later, or (b) implement the Decision Engine and trait registry first, then add the suggestion step in applyProfileToNode.

3. **Create shared data artifacts**  
   - Trait registry (layout ID → trait ids) for Decision Engine and User Preference.  
   - Context → trait-weights config for Decision Engine.  
   - contextual-layout-rules.json for Contextual Layout Logic.  
   These are referenced by the plans but do not exist yet.

4. **Keep plan files unchanged until you approve**  
   No automatic edits were made to any plan file. Apply the suggested corrections above only after explicit approval.

---

*Report produced per VALIDATE_PLANS_PROTOCOL. No plan files were modified.*
