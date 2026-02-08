# Plan 10 — Runtime Traceability and Decision Trace

**Purpose:** Define runtime traceability and decision trace (explainability); trace object (source, layoutId, suggestionDetail) when suggestion/trait path exists.

**Scope:** Documented explainability contracts; `src/engine/devtools/runtime-decision-trace.ts`; future: resolver producing trace per decision.

**Non-negotiables:**
- No runtime code change in this plan (docs/plan only). When suggestion path is implemented, every suggested layout ID must have trace.
- Trace shape: source (override | explicit | template | suggestion), layoutId, suggestionDetail (optional).
- Layout resolver must not invent IDs; trace must reflect actual source.

**Current runtime summary:**
- Layout Decision Engine, Suggestion Injection, Trait Registry: not implemented. runtime-decision-trace exists (devtools). No structured trace produced by resolver today. Status: Docs only for suggestion/trait; devtools trace exists. See DISCONNECTED_SYSTEMS_REPORT (Layout intelligence).

**Required outputs:**
- Trace schema doc (source, layoutId, suggestionDetail).
- Plan for where trace is produced (resolver vs separate layer) when suggestion is wired.
- Verification that current resolver does not invent IDs (already verified in AUTHORITY_PRECEDENCE_AUDIT).

**Verification checklist:**
- [ ] Trace schema documented.
- [ ] No invented layout IDs in resolver (PASS from authority audit).
- [ ] Plan for trace injection point when suggestion exists.

---

## Verification Report (Step 10)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
