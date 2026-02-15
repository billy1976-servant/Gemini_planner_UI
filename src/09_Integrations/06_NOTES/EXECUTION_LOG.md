# Unified Input Engine v4 — Execution Log

| Step | Build | Manual test | Date/Time |
|------|-------|-------------|-----------|
| 0 | pass | N/A (no code change) | 2025-02-15 |
| 1 | pass | N/A | 2025-02-15 |
| 2 | pass | N/A | 2025-02-15 |
| 3 | pass | N/A | 2025-02-15 |
| 4 | pass | Pipeline wired; verify Orientation/Motion in IntegrationLab | 2025-02-15 |
| 5 | pass | Device card added; async path already in place | 2025-02-15 |
| 6 | pass | Log snapshot action + UI added; verify after sensor buttons | 2025-02-15 |
| 7 | pass | Gates: no append when disallowed; read failure: no append, return error | 2025-02-15 |
| 8 | pass | FINAL_REPORT filled; build passing | 2025-02-15 |

**Error-handling rule (Step 7):** When sensor is disallowed, capture returns `{ allowed: false, message: "DISALLOWED" }` and does NOT append to the log. On read failure, capture does NOT append; it returns `{ allowed: true, value: null, error: "<message>" }`.
