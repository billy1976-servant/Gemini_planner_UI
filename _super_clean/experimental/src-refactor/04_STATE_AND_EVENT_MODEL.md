# 04 — State and Event Model

**Purpose:** Extract and structure state definition, responsibilities, limits, event stream philosophy, persistence format, and timeline reconstruction from the master architecture.

---

## 1. State definition

- **State** = derived snapshot from the event log. Not a separate mutable object; it is **deriveState(log)**.
- **DerivedState shape:** journal (Record<track, Record<key, value>>), rawCount, currentView, values (Record<key, any>), layoutByScreen, scans (array), interactions (array).
- **Source of truth:** The **log** (StateEvent[]). Each entry: { intent, payload }.

---

## 2. State responsibilities

- **Hold:** Append-only log of intents and payloads.
- **Derive:** currentView, journal, values, layoutByScreen, scans, interactions via pure deriveState(log).
- **Notify:** After each dispatchState: log.push → deriveState(log) → persist (if not state.update) → listeners.forEach(l => l()) so subscribers (e.g. JsonRenderer) re-run.
- **Provide read API:** getState(), subscribeState for consumers (JsonRenderer, behavior-listener, action handlers, flow-resolver, landing-page-resolver, etc.).
- **Bootstrap:** ensureInitialView when !state?.currentView (default from config or omit; no invented "|home" without contract).

---

## 3. State limits

- **No layout in state:** Layout resolution and override stores are separate (layout-store, section-layout-preset-store, organ-internal-layout-store). State-store does not hold layout IDs or override maps.
- **No behavior in state:** Behavior branch order and contract verbs are not stored in state; they are code/config.
- **Bounded intents:** Only intents handled in deriveState produce derived keys. Unknown intents append to log but do not create new derived keys unless state-resolver and contract are updated.
- **Bounded write surfaces:** Every dispatchState call site must be documented (STATE_MUTATION_SURFACE_MAP); no new surfaces without contract.

---

## 4. Event stream philosophy

- **All app state changes are events:** Every mutation goes through dispatchState(intent, payload) → log.push.
- **Replay = truth:** Full state at any point is deriveState(log.slice(0, n)); no out-of-band mutable state.
- **Last event wins per key:** For currentView, values[key], journal[track][key], the last intent in the log that sets that key wins. scans and interactions are append-only arrays.
- **No separate “planning” or “relationships” store:** Journal and interactions are the durable, replayed layers that drive JournalHistory UI and flow-resolver steps.

---

## 5. Single entry persistence format

- **Storage:** localStorage. Key defined in state-store (e.g. __app_state_log__).
- **Stored shape:** JSON.stringify(log) — array of { intent, payload }.
- **When written:** On every dispatchState except when intent === "state.update" (high-frequency skip).
- **Single entry:** No second key or format for app state; layout/override stores use their own keys and are separate.

---

## 6. Timeline reconstruction concept

- **Timeline:** The ordered list of intents and payloads (the log).
- **Reconstruction:** state_at_t = deriveState(log.slice(0, t)); same log prefix ⇒ same state. Pure function; no side effects.
- **Rehydration:** On bootstrap (typeof window !== "undefined"), rehydrate() reads from localStorage, parses log, sets state = deriveState(log). No merge with server; client-only.
- **History:** The log is the history; no separate “undo stack” or “history store” in the current architecture.
