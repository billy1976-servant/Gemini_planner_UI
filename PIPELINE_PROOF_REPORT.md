# PIPELINE_PROOF_REPORT

Generated: 2026-02-11T13:06:44.340Z

Diagnostic app: `src/apps-json/apps/diagnostics/app.json`
Linked screen: `src/apps-json/apps/diagnostics/linked.json`

## Checks

- ❌ **JSON loads (app.json + linked.json)**
  - ENOENT: no such file or directory, open 'C:\Users\New User\Documents\HiSense\src\apps-json\apps\diagnostics\app.json'
  - Inspect: `src/apps-json/apps/diagnostics/app.json`, `src/apps-json/apps/diagnostics/linked.json`
- ✅ **Registry keys found for all 12 molecules**
- ✅ **input-change observed (typing path)**
- ✅ **state update observed (state.values updated)**
  - state.values.diag.email = "test@example.com"
- ✅ **journal write observed (state.journal.track.entry updated)**
  - state.journal.pipeline.entry = "test@example.com"
- ✅ **navigation event observed (|view and screen path)**
  - navigations=["|alt","apps/diagnostics/linked.json"]
- ✅ **no duplicate listeners firing**
  - navigations=["|alt","apps/diagnostics/linked.json"]
- ✅ **persistence observed (journal event persisted)**
  - __app_state_log__ length=241
- ✅ **refresh proof (rehydrate still has journal value)**
  - rehydrated state.journal.pipeline.entry="test@example.com"
- ✅ **no console error during proof run**

## Notes

- This proof intentionally reuses the **existing runtime wiring** (CustomEvent → behavior-listener → state-store).
- Contract validator is warn-only; violations are reported but do not fail the proof unless they break pipeline checks.
