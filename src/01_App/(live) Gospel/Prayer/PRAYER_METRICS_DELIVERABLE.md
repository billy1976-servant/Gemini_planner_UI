# Prayer Module — Metrics & Navigation Deliverable

## Files created or modified

### Created
- **`src/01_App/(live) Gospel/Prayer/LISTENER_TRACKING_PLAN.md`** — Plan for live listener tracking (data model, API, client flow).
- **`src/app/api/prayer/listeners/route.ts`** — API: GET returns live count for a prayer; POST handles `played` / `join` / `heartbeat` / `leave`.
- **`src/01_App/(live) Gospel/Prayer/PRAYER_METRICS_DELIVERABLE.md`** — This report.

### Modified
- **`src/01_App/(live) Gospel/Prayer/PrayerTypes.ts`** — Added `totalListeners?: number` and `contentType?: "prayer" | "teaching" | "scripture" | "discussion"` to `Prayer`.
- **`src/01_App/(live) Gospel/Prayer/api/prayer-api.ts`** — Added `recordPlayed`, `joinSession`, `heartbeatSession`, `leaveSession`, `getLiveCount`.
- **`src/app/api/prayer/route.ts`** — New prayers from POST upload now include `contentType: "prayer"` and `totalListeners: 0`.
- **`src/01_App/(live) Gospel/Prayer/PrayerPlayer.tsx`** — Added optional `onDurationChange?(seconds: number)`; called when audio duration is known.
- **`src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`** — Metrics row (Total listeners, Listening now, Prayer length), tab navigation, play/leave/heartbeat wiring, sync of `totalListeners` from current prayer and from `recordPlayed` response.
- **`src/01_App/(live) Gospel/Prayer/prayer-theme.css`** — Styles for `.prayer-metrics-row`, `.prayer-metrics-item`, `.prayer-tabs`, `.prayer-tab`.
- **`src/01_App/(live) Gospel/Prayer/data/prayers.json`** — Added `contentType: "prayer"` and `totalListeners: 0` to existing entries for consistency.

---

## How listener tracking works

- **Total listeners:** Incremented once per play. When the user presses play, the client sends `POST /api/prayer/listeners` with `action: "played"` and `prayerId`. The server increments that prayer’s `totalListeners` in `data/prayers.json` and returns the new value; the UI updates from that response and from the current prayer when switching items.
- **Live listeners:** Ephemeral sessions in `data/live-sessions.json`. On play, client sends `action: "join"` and receives a `sessionId`, stored in a ref. While playing, every 20 seconds the client sends `action: "heartbeat"` with `prayerId` and `sessionId`. On pause, page unload, or tab hidden, the client sends `action: "leave"` with `sessionId`. Sessions with `lastHeartbeat` older than 40 seconds are treated as stale and excluded from the live count.

---

## How total listeners are stored

- In **`Prayer/data/prayers.json`**: each prayer object can have `totalListeners` (number). New uploads get `totalListeners: 0`; the listeners API increments this field on each `played` action and persists it back to the same file. Counts persist across sessions and server restarts.

---

## How live listeners are calculated

- **Storage:** `Prayer/data/live-sessions.json` holds `{ "sessions": [ { "prayerId", "sessionId", "lastHeartbeat" } ] }`.
- **Count:** `GET /api/prayer/listeners?prayerId=X` counts sessions where `prayerId === X` and `lastHeartbeat >= now - 40000` ms. Stale entries are excluded at read time (no separate cleanup job). The client polls this GET every 20 seconds when a prayer is loaded to show “Listening now”.

---

## How tabs connect to other modules

- **Tab bar** (below the metrics row): Prayer | Discipleship | Scripture | Community.
- **Prayer** — Links to `/prayer` (current page); tab is marked active.
- **Discipleship** — Links to `/gospel` (existing Gospel/Discipleship route).
- **Scripture** and **Community** — Link to `/gospel` as placeholders until dedicated routes exist, so links do not 404. No new pages were added outside the Prayer module.

---

## Shared content universe

- Each prayer now includes **`contentType: "prayer"`** (and new uploads get it automatically). The `Prayer` type allows `contentType?: "prayer" | "teaching" | "scripture" | "discussion"` for future cross-linking with other HIClarify modules (e.g. teaching, scripture, discussion) without changing the Prayer UI.

---

## Player behavior

- The existing player UI, waveform, and playback logic were not changed. Only the optional `onDurationChange` callback was added for the “Prayer length” metric. Play/pause/ended behavior and loop are unchanged.
