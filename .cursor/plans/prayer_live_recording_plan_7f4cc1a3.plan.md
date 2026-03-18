---
name: Prayer Live Recording Plan
overview: Complete system analysis and implementation plan for the prayer platform's live recording, storage, playback, and moderator controls. The plan identifies what is already implemented (LiveKit room, mixedStream, PrayerRoomRecorder class, prayer upload/feed), what is partial or unused, and a step-by-step path to ship "record group prayer → publish → feed" without rewriting working code.
todos: []
isProject: false
---

# Prayer Platform — Live Recording + Moderation — Full System Analysis & Implementation Plan

## PHASE 1 — SYSTEM SCAN (Findings)

### Directories scanned

- **[src/01_App/(live) Gospel/Prayer/](src/01_App/(live)%20Gospel/Prayer/)** — UI, room hook, recorder, types, API client, data
- **[src/app/api/prayer/](src/app/api/prayer/)** — prayer CRUD, audio serve, groups, listeners, presence, guided, chains
- **[src/app/api/prayer-room/](src/app/api/prayer-room/)** — token, mute, create, end, join, room, active, signaling
- **[src/app/api/auth/](src/app/api/auth/)** — NextAuth [...nextauth], callback, install (auth only; no recording)
- **[src/01_App/(live) Gospel/Prayer/data/](src/01_App/(live)%20Gospel/Prayer/data/)** — store.ts, prayers.json, rooms.json, groups.json, etc.

### 1. LiveKit integration status


| Component                  | Status   | Notes                                                                                                                                                                                             |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **livekit-client**         | Complete | Used in [usePrayerRoomWebRTC.ts](src/01_App/(live)%20Gospel/Prayer/room/usePrayerRoomWebRTC.ts): `Room`, `RoomEvent`, `Track`, `createLocalAudioTrack`; connect, publish, subscribe, mute events. |
| **livekit-server-sdk**     | Complete | [token/route.ts](src/app/api/prayer-room/token/route.ts): `AccessToken`; [mute/route.ts](src/app/api/prayer-room/mute/route.ts): `RoomServiceClient`, `mutePublishedTrack`.                       |
| **/api/prayer-room/token** | Complete | Validates room/participant, returns JWT + LiveKit URL.                                                                                                                                            |
| **usePrayerRoomWebRTC.ts** | Complete | Connects to LiveKit; host gets `mixedStream` (local + remote speakers via AudioContext mix); listener gets `remoteStream`.                                                                        |
| **PrayerRoom.tsx**         | Complete | Joins room, gets token, uses `usePrayerRoomWebRTC`, renders `ListenerAudio`(remoteStream), participants, controls. Does **not** use recorder or `mixedStream` for recording.                      |
| **PrayerRoomControls.tsx** | Complete | Mute self, mute participants (host), End room (host). No recording/publish UI.                                                                                                                    |
| **Mute route integration** | Complete | Host calls `setParticipantMute` → POST /api/prayer-room/mute → RoomServiceClient.mutePublishedTrack.                                                                                              |


**Conclusion:** LiveKit room connection is **fully implemented**. The host already has `mixedStream` (final room audio for recording); it is **not** yet wired to any recorder or UI.

---

## PHASE 2 — RECORDING SYSTEM ANALYSIS

### PrayerRoomRecorder.ts

- **MediaRecorder:** Implemented. `start(stream, mimeType)`, `stop()`, `getBlob()`, `isRecording()`; uses `audio/webm;codecs=opus` with fallback.
- **Connection to audio:** None. The class is **never instantiated or used** anywhere in the app (grep: only self-reference and usePrayerRoomWebRTC’s `mixedStream`).
- **mixedStream from room:** Exposed from `usePrayerRoomWebRTC` for host only; not passed to any recorder.
- **Recording UI:** None in PrayerRoom or PrayerRoomControls.
- **Storage:** Recorder only produces in-memory Blob; no upload or file path.

### What is missing for “RECORD GROUP PRAYER” (3–10 speakers, mixed audio, host-controlled start/stop)

1. **Wire recorder to stream:** In PrayerRoom (host path), instantiate `PrayerRoomRecorder`, pass `webrtc.mixedStream` into `recorder.start()` when host clicks Start Recording.
2. **Host-only recording UI:** Start Recording / Stop Recording (and optionally Publish / Discard) in PrayerRoomControls, visible only when `isHost`.
3. **State and lifecycle:** Recording state (idle | recording | stopped) in PrayerRoom; on Stop, get blob and hold for Publish or Discard.
4. **Upload and storage:** On Publish, send blob + metadata to existing `/api/prayer` POST (same as PrayerUpload); optionally add `roomId` / `participants` to payload for metadata.

---

## PHASE 3 — AUDIO STREAM SOURCE

**Correct source for recording:** Host’s **mixedStream** from `usePrayerRoomWebRTC`.

- **Listeners** get `remoteStream` (all speakers mixed).
- **Host** gets `mixedStream`: in [usePrayerRoomWebRTC.ts](src/01_App/(live)%20Gospel/Prayer/room/usePrayerRoomWebRTC.ts) the host creates an AudioContext, connects their local mic to a `MediaStreamDestination`, then `TrackSubscribed` adds each remote speaker’s track to the same destination. So `mixedStream` = host mic + all remote speakers = what a “listener” would hear if the host were relaying. Using this for recording matches “record the final audio that listeners hear” (from host’s perspective).

**No LiveKit composite or server-side mix** is in use; the client-side mix is the single source of truth for recording.

---

## PHASE 4 — STORAGE

- **Current system:** [store.ts](src/01_App/(live)%20Gospel/Prayer/data/store.ts) uses JSON files under `Prayer/data/`; [api/prayer/route.ts](src/app/api/prayer/route.ts) writes audio under `Prayer/uploads/` (same repo path; `UPLOADS_DIR` = `.../Prayer/uploads`).
- **Where audio files are saved:** `src/01_App/(live) Gospel/Prayer/uploads/`. Filenames today: `{id}{ext}` (e.g. `slug-title.mp3`). No separate `uploads/live-recordings/` yet; not required — same uploads dir is sufficient with a consistent naming convention (e.g. `live-{roomId}-{ts}.webm` or reusing slug pattern).
- **API:** POST `/api/prayer` expects `multipart/form-data`: `title`, `audio` (File), optional `description`, `prayerText`, `published`, `groupId`, `userId`, `userName`, `duration`. Writes file to `UPLOADS_DIR`, then `addPrayer()` appends to prayers.json.
- **prayers.json structure:** Array of objects: `id`, `title`, `description`, `prayerText`, `audioUrl` (filename), `createdAt`, `published`, `contentType`, `totalListeners`, optional `groupId`, `userId`, `userName`, `duration`.

**Design for recorded live prayers:** Use the **same** POST `/api/prayer` and same `Prayer`/store shape. Add optional fields for live provenance (e.g. `roomId`, `participants[]`) in the payload and persist them in the same JSON so Moments/playback can show “Live from Room X” or participant names without a new feed type.

---

## PHASE 5 — PLAYBACK SYSTEM

- **PrayerPlayer.tsx:** Takes `src` (URL), play/pause, seek, skip ±15s, speed. Uses `PrayerWaveform` (deterministic bars). No change needed for live recordings; they will use the same `src` from feed.
- **PrayerWaveform.tsx:** Visual only; no change.
- **MomentsSection.tsx:** Fetches prayers via `getPrayers()`, filters `p.published`, renders list with `getAudioUrl(p.audioUrl)` and native `<audio controls>`. Live recordings that are added via `addPrayer` with `published: true` will appear automatically.
- **getAudioUrl:** Normalizes path to `/api/prayer/audio?path=...`; [api/prayer/audio/route.ts](src/app/api/prayer/audio/route.ts) serves from `uploads/` by basename. **Gap:** MIME map does not include `.webm`; add `.webm` → `audio/webm` so WebM recordings play.

**Inserting live recordings into the feed:** Publish flow posts to POST `/api/prayer` with `published: true` and optional `roomId`/`participants`; existing feed and playback pipeline then show them as normal prayer posts.

---

## PHASE 6 — MODERATOR / HOST CONTROLS

- **Current:** [PrayerRoomControls.tsx](src/01_App/(live)%20Gospel/Prayer/PrayerRoomControls.tsx): Mute self (host/speaker), Mute participants (host), End room (host). All host checks use `isHost` and `onEndRoom`.
- **Add (host-only):**
  - **Start Recording** — only when not recording and `mixedStream` is available; calls recorder.start(mixedStream).
  - **Stop Recording** — stops recorder, stores blob and duration; show Publish / Discard.
  - **Publish Prayer** — title (modal or inline), then FormData to POST `/api/prayer` (published: true, optional roomId/participants); on success clear blob and close.
  - **Discard Recording** — clear blob and reset state.

Rules: host-only; no need for participant consent flow in v1 (document that recording is host-controlled). Participants can be listed in metadata from current `webrtc.participants` at stop time.

---

## PHASE 7 — DATA MODEL

- **Prayer (PrayerTypes.ts):** Already has `id`, `title`, `description`, `prayerText`, `audioUrl`, `createdAt`, `published`, `groupId`, `userId`, `userName`, `duration`, etc. Sufficient for playback and feed.
- **Optional extension for live provenance:** Add `roomId?: string` and `participants?: string[]` (or `participantIds`) to the type and to POST payload; store in prayers.json. Not required for MVP; can add when implementing Publish.

**PrayerRecord (store):** `Record<string, unknown>`; extra fields are already allowed. No schema change strictly required; only optional fields for room/participants.

---

## PHASE 8 — EDGE CASES


| Scenario                                | Handling                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speaker joins mid-recording             | Already in mix; no change. mixedStream gets new track via TrackSubscribed.                                                                                                                              |
| Speaker leaves                          | mixedStream loses track (track ended); recorder keeps recording remaining audio.                                                                                                                        |
| Recording interrupted (e.g. tab closed) | MediaRecorder stops; no upload. No server-side recording to clean. Optional: beforeunload prompt “Recording in progress.”                                                                               |
| Host disconnects                        | Room ends for others; host’s cleanup in usePrayerRoomWebRTC tears down context/stream. Stop recorder in the same cleanup path (effect return or disconnect handler) so we don’t leave recorder running. |
| Host ends room while recording          | On “End room,” stop recorder first, then end room; offer “Save recording?” if blob exists.                                                                                                              |


**Implementation:** In PrayerRoom, when host disconnects or ends room, call `recorder.stop()` and, if desired, prompt to publish any blob. Ensure recorder ref is cleared on unmount.

---

## PHASE 9 — IMPLEMENTATION PLAN (Step-by-step)

1. **Recording hook / state in PrayerRoom**
  - Add state: `recordingState: 'idle' | 'recording' | 'stopped'`, `recordedBlob: Blob | null`, `recordDuration: number`.
  - Add ref for `PrayerRoomRecorder` instance.
  - When `isHost && webrtc.mixedStream`, enable “Start Recording”; on click, create recorder (if needed), `recorder.start(webrtc.mixedStream)`.
  - On “Stop Recording,” `recorder.stop()`, `setRecordedBlob(recorder.getBlob())`, compute duration (e.g. from start time or from blob size heuristic if needed), set `recordingState: 'stopped'`.
2. **MediaRecorder integration**
  - Use existing [PrayerRoomRecorder.ts](src/01_App/(live)%20Gospel/Prayer/room/PrayerRoomRecorder.ts). No code changes to the class unless you need to expose duration (e.g. elapsed seconds); otherwise compute on stop.
3. **UI buttons (PrayerRoomControls)**
  - Extend props: `recordingState`, `recordedBlob`, `onStartRecording`, `onStopRecording`, `onPublishRecording`, `onDiscardRecording`.
  - Host-only: “Start Recording” (when idle and mixedStream present), “Stop Recording” (when recording). When stopped and blob exists: “Publish prayer” and “Discard.”
4. **Publish flow (storage logic)**
  - In PrayerRoom (or small helper): build FormData like [PrayerUpload](src/01_App/(live)%20Gospel/Prayer/PrayerUpload.tsx): `audio` = blob with filename `recording.webm`, `title` (from prompt or input), `published: "true"`, `duration`, `userId`/`userName` from session; optionally `roomId`, `participants` (JSON or comma-separated).
  - Call existing `uploadPrayer(formData, groupId)` from [prayer-api.ts](src/01_App/(live)%20Gospel/Prayer/api/prayer-api.ts). No new API route.
5. **Prayer feed insertion**
  - Handled by existing `addPrayer` in store and GET `/api/prayer`. Ensure published prayer includes `groupId` if room was group-scoped so Moments filter works.
6. **Playback compatibility**
  - Add `.webm` to MIME map in [api/prayer/audio/route.ts](src/app/api/prayer/audio/route.ts) so WebM files are served with `Content-Type: audio/webm`.
7. **Moderation controls**
  - Centralize host recording and publish in PrayerRoom; PrayerRoomControls only receives callbacks and recording state for the new buttons. On “End room,” if recording, stop recorder and optionally offer to publish.

**Files to modify**

- [PrayerRoom.tsx](src/01_App/(live)%20Gospel/Prayer/PrayerRoom.tsx) — recorder ref, state, start/stop/publish/discard, pass props to controls.
- [PrayerRoomControls.tsx](src/01_App/(live)%20Gospel/Prayer/PrayerRoomControls.tsx) — host-only recording buttons and publish/discard.
- [src/app/api/prayer/audio/route.ts](src/app/api/prayer/audio/route.ts) — add `.webm` → `audio/webm`.

**Files to create**

- None required; optional: small helper to build FormData for live recording publish (or inline in PrayerRoom).

**Complexity**

- Recording + UI + publish: **medium** (single component state and wiring).
- Edge cases (disconnect/end room): **low** (stop recorder in cleanup and optional “Save?” prompt).

---

## PHASE 10 — REPORT

### SYSTEM STATUS


| Area                     | Status           | Notes                                                                              |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| LiveKit room             | Complete         | Token, connect, publish/subscribe, mute; host has mixedStream.                     |
| PrayerRoomRecorder class | Complete, unused | MediaRecorder + blob; not connected to UI or stream.                               |
| mixedStream              | Complete         | Host-only; correct source for recording.                                           |
| Prayer upload & store    | Complete         | POST /api/prayer, uploads/, prayers.json, addPrayer.                               |
| Playback & Moments feed  | Complete         | PrayerPlayer, getAudioUrl, MomentsSection; need .webm MIME.                        |
| Moderator controls       | Partial          | Mute and End room done; Start/Stop Recording and Publish/Discard missing.          |
| usePrayerRoomSignaling   | Unused           | LiveKit path does not use it; can remain for non-LiveKit fallback or remove later. |


### RECORDING IMPLEMENTATION PLAN (summary)

1. In PrayerRoom: add recording state and ref; instantiate PrayerRoomRecorder; on host “Start” call `recorder.start(webrtc.mixedStream)`; on “Stop” call `recorder.stop()`, store blob and duration.
2. In PrayerRoomControls: add host-only Start/Stop Recording and (when stopped with blob) Publish/Discard; callbacks from PrayerRoom.
3. On Publish: build FormData (blob as `recording.webm`, title, published, duration, optional roomId/participants), call `uploadPrayer(formData, groupId)`.
4. In api/prayer/audio: add `.webm` → `audio/webm`.
5. On disconnect or End room: stop recorder; optionally prompt to publish if blob exists.

### FILES INVOLVED

- **Modify:** PrayerRoom.tsx, PrayerRoomControls.tsx, src/app/api/prayer/audio/route.ts.
- **Use as-is:** PrayerRoomRecorder.ts, usePrayerRoomWebRTC.ts, prayer-api.ts (uploadPrayer), api/prayer/route.ts (POST), store (addPrayer), PrayerTypes, MomentsSection, PrayerPlayer.

### RISKS

- **Browser support:** MediaRecorder and WebM/Opus vary; already used in PrayerUpload — acceptable.
- **Large blobs:** Long recordings may hit body size limits; consider chunking or server-side recording later if needed.
- **Host tab close:** Recording is lost unless beforeunload prompts; document behavior.

### FINAL RESULT (goal state)

- Users join a live prayer room (existing).
- They pray together (existing).
- Host starts/stops recording using mixedStream (new).
- Host publishes the recording as a prayer (new); optional title and room/participant metadata.
- Prayer appears in the feed and is playable like any other (existing + .webm MIME).
- Others can listen later (existing).

No new API routes or duplicate upload pipelines; extend existing architecture only.