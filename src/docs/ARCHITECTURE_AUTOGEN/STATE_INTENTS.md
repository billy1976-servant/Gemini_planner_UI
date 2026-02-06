# State Intents — Single Reference

**Purpose:** Single list of all state intents used with `dispatchState(intent, payload)`. Call sites must use only intents listed here. New intents require contract update (deriveState in state-resolver and this doc).

---

## Intents handled by deriveState (state-resolver)

| Intent | Effect on derived state | Payload shape |
|--------|--------------------------|---------------|
| `state:currentView` | derived.currentView = payload.value | { value: string } |
| `state.update` | derived.values[payload.key] = payload.value | { key: string, value: any } |
| `journal.set` | derived.journal[track][key] = value | { track?, key, value } |
| `journal.add` | derived.journal[track][key] = value | { track?, key, value } |
| `scan.result` | derived.scans.push(payload) | scan payload |
| `scan.interpreted` | derived.scans.push(payload) | interpreted payload |
| `interaction.record` | derived.interactions.push(payload) | interaction payload |

---

## Intents logged but not derived

| Intent | Used by | Note |
|--------|---------|------|
| `scan.record` | state-store recordScan() | Logged; scan.result/scan.interpreted drive derived.scans |
| `scan.batch` | state-store recordScanBatch() | Logged; batch may be expanded elsewhere |

---

## Legacy / external bridge

| Intent | Source | Note |
|--------|--------|------|
| Any (detail.name) | installStateMutateBridge — CustomEvent "state-mutate" | **Legacy.** External or older consumers can push intents this way. Do not rely for new code; use dispatchState directly or action events. Only intents handled by deriveState affect derived state. |

---

## Rule

- **Call sites:** Use only intents from the "handled by deriveState" list (or scan.record/scan.batch where documented). Do not invent new intent strings without adding a branch in state-resolver and an entry here.
- **New intents:** Add to state-resolver deriveState, to this table, and to STATE_MUTATION_SURFACE_MAP for the call site.
