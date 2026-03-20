# Live Listener Tracking ΓÇö Plan

## Overview
- **Total listeners:** Persisted per prayer in `data/prayers.json` as `totalListeners`. Increment when a user starts playback.
- **Live listeners:** Ephemeral sessions in `data/live-sessions.json`. Join on play, leave on stop/unload, heartbeat ~20s to stay counted.

## Data

### prayers.json (existing + new fields)
- `totalListeners` (number, optional): total number of play events for this prayer. Default 0; increment on each play.
- `contentType` (string, optional): `"prayer"` for prayers; allows future cross-linking with teaching, scripture, discussion.

### live-sessions.json (new)
- Path: `Prayer/data/live-sessions.json`
- Shape: `{ "sessions": [ { "prayerId": string, "sessionId": string, "lastHeartbeat": number } ] }`
- Sessions with `lastHeartbeat` older than 40 seconds are considered stale and excluded from "Listening now".

## API (minimal layer under app/api/prayer)

### POST /api/prayer/listeners
Body: `{ action: "played" | "join" | "heartbeat" | "leave", prayerId?: string, sessionId?: string }`

- **played:** Increment `totalListeners` for the prayer in prayers.json. Return `{ totalListeners }`.
- **join:** Create a new session (generate sessionId), append to live-sessions, set lastHeartbeat = now. Return `{ sessionId }`.
- **heartbeat:** Find session by sessionId, set lastHeartbeat = now. Return `{ ok: true }`.
- **leave:** Remove session by sessionId from live-sessions. Return `{ ok: true }`.

### GET /api/prayer/listeners?prayerId=X
- Count sessions where prayerId matches and lastHeartbeat >= now - 40000 ms.
- Return `{ live: number }`.

## Client flow

1. User presses play ΓåÆ POST played (increment total), POST join (get sessionId). Store sessionId in state.
2. While playing, every 20s ΓåÆ POST heartbeat with prayerId + sessionId.
3. User stops or leaves page ΓåÆ POST leave with sessionId (use beforeunload or visibilitychange + sendBeacon if needed).
4. Metrics: totalListeners from current prayer (after refetch or from played response). Live count from GET listeners?prayerId= (poll every 15ΓÇô20s when prayer is loaded). Prayer length from audio duration (reported by player to parent).

## Files

- API: `src/app/api/prayer/listeners/route.ts` (reads/writes only under Prayer/data).
- Client: `Prayer/api/prayer-api.ts` (add recordPlayed, joinSession, heartbeatSession, leaveSession, getLiveCount).
- PrayerApp: metrics row, tabs, play/leave/heartbeat wiring.
- PrayerPlayer: add `onDurationChange?(seconds: number)` callback.
