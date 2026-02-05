# Plan 4 — Layout System Refactor Master Plan

**Purpose:** Master plan for layout system: resolver, profiles, compatibility, requirements; future: suggestion/trait, decision engine, explainability.

**Scope:** `src/layout/`, `src/lib/layout/`, `src/engine/core/json-renderer.tsx` (applyProfileToNode), override stores (section, card, organ internal).

**Non-negotiables:**
- Precedence: override → explicit node.layout → template default → undefined (no invented IDs).
- Layout ≠ Logic ≠ State: resolver does not call state-store; override stores are UI-driven.
- All layout IDs from template/registry or override; no hardcoded layout ID arrays in resolver.

**Current runtime summary:**
- Resolver, compatibility, getDefaultSectionLayoutId, evaluateCompatibility wired from json-renderer. Layout Decision Engine, Trait Registry, Suggestion Injection, Contextual Layout Logic, User Preference Adaptation: docs only, not implemented. Status: Wired for current path; Missing for intelligence layer.

**Required outputs:**
- Refactor steps for resolver/profile/compatibility (if any; docs-only in scan).
- Plan for suggestion/trait integration (where to call Logic, where to load trait registry).
- Verification that precedence matches AUTHORITY_PRECEDENCE_AUDIT.

**Verification checklist:**
- [ ] Precedence matches documented ladder.
- [ ] No hardcoded layout ID arrays in resolver path.
- [ ] Plan for trait/suggestion does not require Layout→State direct mutation.

---

## Verification Report (Step 4)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
