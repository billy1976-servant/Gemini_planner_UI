# Plan 11 — JSON Registry Coverage and Validation

**Purpose:** Achieve JSON registry coverage for slot names, allow-lists, capability lists; remove or flag hardcoded options; add validation where needed.

**Scope:** All findings in JSON_DRIVEN_VIOLATIONS.generated.md; json-renderer slot map, NON_ACTIONABLE_TYPES, layout-store allowedTypes, collapse-layout-nodes LAYOUT_NODE_TYPES, template-profiles roles, capabilities, param-key-mapping.

**Non-negotiables:**
- No hardcoded layout ID arrays in resolver/dropdown (already PASS).
- Slot names and allow-lists should be loaded from JSON or registry where feasible; plan only in this pass (no code change required in scan).
- Validation: registries loaded at startup or first use; invalid entries logged, not silent.

**Current runtime summary:**
- Slot names hardcoded in json-renderer (L151–156). NON_ACTIONABLE_TYPES, allowedTypes, LAYOUT_NODE_TYPES, template criticalRoles/optionalRoles, capabilities: hardcoded. Dropdown uses getLayout2Ids() (capability-driven). Status: PASS_WITH_GAPS per JSON_DRIVEN_VIOLATIONS.

**Required outputs:**
- List of all hardcoded lists and target registry/schema for each.
- Validation rules: what to do when registry missing or invalid (no silent fallback).
- Priority order for moving to JSON (slots first, then allow-lists).

**Verification checklist:**
- [ ] All violations from JSON_DRIVEN_VIOLATIONS listed in plan.
- [ ] No new hardcoded options added; plan to reduce existing.
- [ ] Validation approach documented (no silent fallback).

---

## Verification Report (Step 11)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
