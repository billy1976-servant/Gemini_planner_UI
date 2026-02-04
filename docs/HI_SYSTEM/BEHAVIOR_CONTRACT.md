Primary Architecture Reference: docs/SYSTEM_MASTER/

# Behavior Contract (Phase 3)

**Classification:** FOUNDATIONAL — Behavior kinds and tokens; primary architecture reference: docs/SYSTEM_MASTER/

Canonical behavior representation for the runtime. Legacy payloads are normalized into this shape via `src/contracts/behavior-normalize.ts`.

## Kinds

| Kind | Role |
|------|------|
| **Interaction** | User gestures: tap, double, long, drag, scroll, swipe. |
| **Navigation** | Go, back, open, close, route (screen/modal/flow/panel/sheet). |
| **Action** | Domain actions: crop, filter, frame, layout, motion, overlay (image/video/audio/…). |
| **Mutation** | State changes: append, update, remove, clear, replace, merge, reorder, toggle, increment, decrement, undo, redo. |

## Contract tokens (minimum set)

- **Interaction:** `tap`, `double`, `long`, `drag`, `scroll`, `swipe`
- **Navigation:** `go`, `back`, `open`, `close`, `route`
- **Action:** `crop`, `filter`, `frame`, `layout`, `motion`, `overlay`
- **Mutation:** `append`, `update`, `remove`, `clear`, `replace`, `merge`, `reorder`, `toggle`, `increment`, `decrement`, `undo`, `redo`

Legacy `state:*` action names (e.g. `state:update`, `state:journal.add`) are mapped to **Mutation** intents by the normalization layer. Optional `allowLegacy` controls whether legacy payloads are accepted and how warnings are emitted.

## Types and normalization

- **Source of truth:** `src/contracts/behavior-intent.ts` (types and verb sets).
- **Normalization:** `src/contracts/behavior-normalize.ts` — `normalizeBehaviorPayload(payload, options?)` and `normalizeNavigateDetail(detail)`.
- **Runtime:** `src/engine/core/behavior-listener.ts` uses the normalizer for action/navigate events; contract verbs are routed through the behavior runner; legacy `state:*` is mapped to state-store dispatch.
