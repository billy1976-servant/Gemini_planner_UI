# Plan 3 — Registry and Component Resolution

**Purpose:** Align JsonRenderer registry (type → component), compound resolution, and slot/type registries; move toward JSON-driven where possible.

**Scope:** `src/engine/core/registry.tsx`, `src/engine/core/json-renderer.tsx` (definitions, Registry), `src/compounds/ui/`, slot names and NON_ACTIONABLE_TYPES.

**Non-negotiables:**
- Registry maps JSON type to React component; no hardcoded component list in renderer (registry is the single map).
- Slot names and allow-lists should be driven by JSON or schema (see JSON_DRIVEN_VIOLATIONS).

**Current runtime summary:**
- JsonRenderer uses definitions[type] from compounds and Registry[type] from registry.tsx. Slot names hardcoded in json-renderer (button, section, card, etc.); NON_ACTIONABLE_TYPES = new Set(["section", "field", "avatar"]). Status: Wired; FLAG for hardcoded slots/allow-lists.

**Required outputs:**
- List of all types and slot names; plan to move to JSON registry.
- Verification that Registry is single source of type→component.

**Verification checklist:**
- [ ] Registry single source of truth for type→component.
- [ ] Plan for JSON-driven slot names and allow-lists (no code change in this plan; plan only).

---

## Verification Report (Step 3)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
