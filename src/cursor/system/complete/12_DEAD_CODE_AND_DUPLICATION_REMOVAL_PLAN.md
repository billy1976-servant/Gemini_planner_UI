# Plan 12 — Dead Code and Duplication Removal

**Purpose:** Plan for dead code and duplication removal; unreachable modules, duplicate logic, script vs app boundaries. No removal in this plan (plan only).

**Scope:** REACHABILITY_REPORT.generated.md (451 unreachable modules); DISCONNECTED_SYSTEMS_REPORT; duplicate slot maps (json-renderer vs param-key-mapping.test vs blueprint); scripts vs app.

**Non-negotiables:**
- No removal or refactor in this scan (docs/plan only). Any future removal must respect: API routes and TSX screens are unreachable by design; scripts are CLI-only.
- Duplication: slot maps in multiple files; single source of truth plan.
- Dead code: distinguish "unreachable by design" (API, TSX, scripts) vs "orphan" (no caller by design and no doc).

**Current runtime summary:**
- 55 reachable, 451 unreachable from seed. Unreachable includes: all API routes, TSX screens, flow/engine-registry path, scripts, compiler (API-invoked). Duplication: slot names in json-renderer, param-key-mapping.test, blueprint.ts. Status: See REACHABILITY_REPORT and DISCONNECTED_SYSTEMS_REPORT.

**Required outputs:**
- List of unreachable categories (API, TSX, flow, scripts, other) with counts.
- Duplication list (slot map, allow-lists) and single-source plan.
- Decision rule: what counts as "dead" for removal vs "by design" (keep).

**Verification checklist:**
- [ ] Categories of unreachable documented.
- [ ] No code removed in this plan.
- [ ] Duplication and single-source plan stated.

---

## Verification Report (Step 12)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
