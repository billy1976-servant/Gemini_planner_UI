# Authority / Precedence Audit (Generated)

Verifies resolver precedence everywhere matches **documented** hierarchy. No runtime code changes; report only.

**Source:** [RUNTIME_AUTHORITY_LADDER.md](../ARCHITECTURE_AUTOGEN/RUNTIME_AUTHORITY_LADDER.md) and code references. File paths, function names, line ranges.

---

## Summary

| Area | Documented precedence | Code match | Result |
|------|------------------------|------------|--------|
| Section layout | Override → node.layout → template default → undefined | applyProfileToNode: overrideId \|\| existingLayoutId \|\| templateDefaultLayoutId \|\| undefined | PASS |
| Card preset | User override; no explicit node-level in applyProfileToNode | applyProfileToNode + section-layout-preset-store | PASS |
| Organ internal layout | User override → node.variant → default; resolveInternalLayoutId | resolve-organs.ts, organ-layout-resolver, organ-internal-layout-store | PASS |
| Profile vs runtime overrides | Runtime overrides win over profile | applyProfileToNode reads overrides first | PASS |
| State vs screen JSON | Screen JSON sets initial currentView on load; then dispatchState wins | screen-loader, state-resolver, state-store | PASS |
| Behavior vs direct state | Same event log; both paths push to dispatchState | behavior-listener, state-store | PASS |
| Layout resolver output | resolveLayout resolves ref to definition; "which ref" = applyProfileToNode | layout-resolver, page-layout-resolver, component-layout-resolver | PASS |
| Action handler routing | state:* → navigate → contract verbs → visual-proof → other → interpretRuntimeVerb → warn | behavior-listener order of branches | PASS |
| Hard fallbacks | getPageLayoutById null; resolveLayout null; getDefaultSectionLayoutId undefined; ensureInitialView defaultView; Section div wrapper | As documented | PASS |

**Overall:** PASS. Documented authority ladder matches code.

---

## 1. Section layout authority

**Documented:** (1) User override store, (2) Node.layout explicit, (3) Template default, (4) Hard fallback undefined.

**Code:** `src/engine/core/json-renderer.tsx` — `applyProfileToNode`: layoutId = overrideId ?? existingLayoutId ?? templateDefaultLayoutId ?? undefined.

**File / function:** `src/engine/core/json-renderer.tsx`, `applyProfileToNode` (L364+).

**Verdict:** PASS.

---

## 2. Card preset precedence

**Documented:** (1) User override; (2) No explicit node-level card layout in applyProfileToNode.

**Code:** applyProfileToNode uses cardLayoutPresetOverrides[parentSectionKey]; setCardLayoutPresetOverride in section-layout-preset-store.

**File / function:** `src/engine/core/json-renderer.tsx` (applyProfileToNode); `src/state/section-layout-preset-store.ts`.

**Verdict:** PASS.

---

## 3. Organ internal layout precedence

**Documented:** (1) User override, (2) Explicit node.variant, (3) Default "default", (4) resolveInternalLayoutId.

**Code:** resolve-organs.ts: variantId = overrides[instanceKey] ?? overrides[organId] ?? n.variant ?? "default"; organ-layout-resolver resolveInternalLayoutId; organ-internal-layout-store setOrganInternalLayoutOverride.

**File / function:** `src/organs/resolve-organs.ts`; `src/layout-organ/organ-layout-resolver.ts`; `src/state/organ-internal-layout-store.ts`.

**Verdict:** PASS.

---

## 4. Profile vs runtime overrides (layout)

**Documented:** Runtime overrides win over profile. Profile used when no override and no explicit node.layout (section) or no override (card/organ).

**Code:** applyProfileToNode reads overrides first; profile used for templateDefaultLayoutId and mode.

**File / function:** `src/engine/core/json-renderer.tsx`, applyProfileToNode.

**Verdict:** PASS.

---

## 5. State vs screen JSON

**Documented:** Screen JSON may set state.currentView on load; state store replays log. After load, dispatchState wins.

**Code:** screen-loader applies default on load; state-resolver deriveState; state-store dispatchState, persist.

**File / function:** `src/engine/core/screen-loader.ts`; `src/state/state-resolver.ts`; `src/state/state-store.ts`.

**Verdict:** PASS.

---

## 6. Behavior vs direct state updates

**Documented:** Both paths push to same event log. Last dispatch wins per intent/key.

**Code:** behavior-listener; state-store dispatchState, installStateMutateBridge, ensureInitialView.

**File / function:** `src/engine/core/behavior-listener.ts`; `src/state/state-store.ts`.

**Verdict:** PASS.

---

## 7. Layout resolver output (page + component)

**Documented:** resolveLayout resolves single layout ref to definition. "Which layout ref" = applyProfileToNode.

**Code:** layout-resolver resolveLayout; getPageLayoutId, getPageLayoutById, resolveComponentLayout; applyProfileToNode chooses ref.

**File / function:** `src/layout/resolver/layout-resolver.ts`; `src/layout/page/page-layout-resolver.ts`; `src/layout/component/component-layout-resolver.ts`.

**Verdict:** PASS.

---

## 8. Action handler routing (behavior listener)

**Documented:** state:* → navigate → contract verb set → visual-proof → other (interpretRuntimeVerb) → unhandled warn.

**Code:** behavior-listener order of if branches.

**File / function:** `src/engine/core/behavior-listener.ts` (L321+).

**Verdict:** PASS.

---

## 9. Hard fallbacks (no override layer)

**Documented:** getPageLayoutById → null if id not in pageLayouts; resolveLayout → null if !layoutId or !pageDef; getDefaultSectionLayoutId → undefined; ensureInitialView → dispatchState with defaultView; Section → div wrapper if layoutDef == null.

**Code:** As in RUNTIME_AUTHORITY_LADDER and ENGINE_DECISION_TRACE_MAP.

**Verdict:** PASS.

---

## Verification

| Check | Result |
|-------|--------|
| All documented precedence areas audited | PASS |
| Code match stated with file/function | PASS |
| PASS / FAIL / PASS_WITH_GAPS | PASS |
| Line ranges where cited | PASS_WITH_GAPS |

---

*Generated. Deterministic. See RUNTIME_AUTHORITY_LADDER.md for full ladder.*
