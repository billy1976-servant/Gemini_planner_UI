# Plan 7 — Behavior Verb Surface and Routing

**Purpose:** Define behavior verb surface (contract verbs, action routing); align state:*/navigate/visual-proof and interpretRuntimeVerb path.

**Scope:** `src/engine/core/behavior-listener.ts`, `src/behavior/behavior-runner.ts`, `src/logic/runtime/runtime-verb-interpreter.ts`, `src/logic/runtime/action-runner.ts`, `src/logic/runtime/action-registry.ts`.

**Non-negotiables:**
- Order of handling in behavior-listener: state:* → navigate → contract verbs → visual-proof → other (interpretRuntimeVerb) → warn.
- Contract verb set is documented; new verbs require doc update.
- Action registry is single map for action name → handler on logic path.

**Current runtime summary:**
- installBehaviorListener in layout.tsx; listens navigate, input-change, action. For action: state:* → dispatchState; navigate → navigate(to); contract verbs → runBehavior; else → interpretRuntimeVerb → action-runner → action-registry. Status: Wired. See RUNTIME_CALL_GRAPH.generated.md.

**Required outputs:**
- Contract verb list (tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay).
- Action routing diagram (listener → interpreter → runner → registry).
- No hardcoded allow-lists for verbs without doc (or move to JSON).

**Verification checklist:**
- [ ] Verb order matches RUNTIME_AUTHORITY_LADDER.
- [ ] Action registry and handlers documented.
- [ ] No silent drop of unknown verbs (warn path exists).

---

## Verification Report (Step 7)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
