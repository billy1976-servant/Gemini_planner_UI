---
name: Live collab build plan + Phase A
overview: "Create BUILD_PLAN_LIVE_COLLAB.md defining all five phases (A: recording + moderator, B: screen share, C: annotations, D: saved boards, E: replay timeline), then implement Phase A only: live room recording, moderator panel UI, and publishing recordings into the Prayer feed."
todos: []
isProject: false
---

# Prayer/Bible Study Live Collaboration — Full Plan + Phase A

## Current state (reused as foundation)

- **LiveKit room**: [usePrayerRoomWebRTC.ts](src/01_App/(live) Gospel/Prayer/room/usePrayerRoomWebRTC.ts) connects via LiveKit; host gets `mixedStream` (local + remote speakers); listeners get `remoteStream`. No recording UI or publish path yet.
- **Room APIs**: [prayer-room-api.ts](src/01_App/(live) Gospel/Prayer/room/prayer-room-api.ts) — create, join, end, getRoom, getActiveRooms, getLiveKitToken, setParticipantMute. Routes under `src/app/api/prayer-room/` (create, join, end, active, room, token, mute).
- **Recorder**: [PrayerRoomRecorder.ts](src/01_App/(live) Gospel/Prayer/room/PrayerRoomRecorder.ts) — client-side MediaRecorder on a MediaStream; `start(stream)`, `stop()`, `getBlob()`, `isRecording()`. Not used anywhere yet.
- **Prayer publish**: [api/prayer-api.ts](src/01_App/(live) Gospel/Prayer/api/prayer-api.ts) `uploadPrayer(formData, groupId)`; [api/prayer/route.ts](src/app/api/prayer/route.ts) POST accepts multipart (title, description, prayerText, audio file, duration, userId, userName, groupId). Prayers stored via [data/store.ts](src/01_App/(live) Gospel/Prayer/data/store.ts) `addPrayer`; audio in `Prayer/uploads/`.
- **Room UI**: [PrayerRoom.tsx](src/01_App/(live) Gospel/Prayer/PrayerRoom.tsx) + [PrayerRoomControls.tsx](src/01_App/(live) Gospel/Prayer/PrayerRoomControls.tsx) — host already has mute participants and end room inline; no moderator panel, no recording.

---

## Deliverable 1: BUILD_PLAN_LIVE_COLLAB.md

Create a single markdown file at `**src/01_App/(live) Gospel/Prayer/BUILD_PLAN_LIVE_COLLAB.md`** (or project root if you prefer — plan says "create BUILD_PLAN_LIVE_COLLAB.md"; keeping it inside the Prayer module is consistent with "keep everything inside the existing Prayer module"). Recommended path: `**src/01_App/(live) Gospel/Prayer/BUILD_PLAN_LIVE_COLLAB.md`**.

Structure (each phase with the same sections):

### Phase A — Live room recording + moderator controls


| Section             | Content                                                                                                                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**         | Finalize live room recording (host records mixed audio), add moderator panel, host can start/stop recording, publish recording as prayer replay, mute/unmute participants, end room. Room UI and participant flow unchanged.                                                                                                          |
| **Files to create** | `ModeratorPanel.tsx` (or `PrayerRoomModeratorPanel.tsx`) — collapsible sidebar/drawer; optional: `useRoomRecording.ts` hook that wraps PrayerRoomRecorder + mixedStream + publish.                                                                                                                                                    |
| **Files to modify** | `PrayerRoom.tsx` (use recorder + moderator panel, pass host callbacks); `PrayerRoomControls.tsx` (add "Moderator" / panel toggle for host only, or move host-only actions into panel); `room/prayer-room-api.ts` (optional: add `publishRoomRecording(roomId, formData)` that POSTs to existing prayer upload API with room context). |
| **APIs**            | Reuse `POST /api/prayer` (multipart) for publishing; no new route required. Optional: extend room metadata (e.g. `recordingStartedAt`) via PATCH if needed later.                                                                                                                                                                     |
| **Data model**      | No new store entities for Phase A. Prayer record unchanged (id, title, audioUrl, duration, etc.). Optional: add `source: "live_room"`, `roomId` on prayer for traceability.                                                                                                                                                           |
| **UI**              | Host sees a "Moderator" or gear button that opens the panel. Panel: Start recording, Stop recording, Publish recording (title input + submit), Mute/unmute participants list, End room. Recording state (idle/recording/stopped) and optional timer.                                                                                  |
| **Test checklist**  | Host can open/close panel; start/stop recording; after stop, publish creates a prayer and it appears in feed; mute/unmute and end room still work; listeners unaffected.                                                                                                                                                              |
| **Risks**           | Long recordings = large blob in memory; consider chunking or server recording in a later phase.                                                                                                                                                                                                                                       |
| **Unchanged**       | PrayerRoomParticipants, listener join flow, LiveKit connection, PrayerPlayer, PrayerWaveform, prayer tabs/routes.                                                                                                                                                                                                                     |


### Phase B — Screen sharing (plan only)


| Section                      | Content                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**                  | One active shared screen per room via LiveKit screen capture; share button; shared screen viewer in room; moderator can start/stop screen share.                                                                                     |
| **Files**                    | New: screen-share UI component, hook or integration in room for `createLocalScreenTracks()` / publish; modify PrayerRoom layout to show shared screen region. API: LiveKit already supports video tracks; token may need permission. |
| **APIs**                     | LiveKit client SDK screen capture; possibly new room metadata `screenShareParticipantId` for "who is sharing".                                                                                                                       |
| **Data model**               | Room or session may store `activeScreenShareIdentity` (optional).                                                                                                                                                                    |
| **UI**                       | "Share screen" button (host/speaker); main area shows shared screen when active; moderator can "Stop screen share" if host.                                                                                                          |
| **Test / Risks / Unchanged** | Brief bullets: one sharer at a time; no annotations yet; room audio and moderator panel unchanged.                                                                                                                                   |


### Phase C — Annotation overlay (plan only)


| Section                      | Content                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**                  | Canvas overlay on shared screen: draw, underline, highlight; clear annotations; moderator can enable/disable annotation mode.  |
| **Files**                    | New: annotation canvas component, sync of stroke data (e.g. DataChannel or room metadata); modifier keys or toolbar for tools. |
| **APIs**                     | Optional: POST/GET annotations per session or send over LiveKit data channel.                                                  |
| **Data model**               | Annotation strokes (points, tool, color) per session or per "page"; structure for Phase D.                                     |
| **UI**                       | Overlay with draw/underline/highlight; clear button; moderator toggle "Annotations on/off".                                    |
| **Test / Risks / Unchanged** | Only when screen share active; performance with many strokes; recording remains audio-only in Phase A/B.                       |


### Phase D — Saved study pages / captured boards (plan only)


| Section                      | Content                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                  | Capture current shared screen (+ overlay) as a "page"; save with label/title; optional audio note; multiple pages per session; organized by session. |
| **Files**                    | New: capture logic (canvas/screenshot), save API, list of pages in session.                                                                          |
| **APIs**                     | New: e.g. `POST /api/prayer-room/session/:id/pages` (image + label + optional audio), `GET` pages for session.                                       |
| **Data model**               | Session or room has many "pages" (image URL or base64, label, order, optional audioRef).                                                             |
| **UI**                       | "Capture page" / "Save board" in moderator panel; label input; list of saved pages in session.                                                       |
| **Test / Risks / Unchanged** | Storage size; replay not yet implemented.                                                                                                            |


### Phase E — Replay timeline (plan only)


| Section                      | Content                                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                  | Replay session recording; jump between saved boards/pages; view annotations; use as follow-up study material.                                      |
| **Files**                    | New: replay view component, timeline with recording + page markers, link from prayer feed (e.g. "Live replay" for prayers that have session data). |
| **APIs**                     | GET session replay (recording + pages + annotations).                                                                                              |
| **Data model**               | Session replay record: recordingId (prayer id), pageIds, annotation blobs, timestamps.                                                             |
| **UI**                       | Replay player with seek; page list; optional annotation overlay at seek time.                                                                      |
| **Test / Risks / Unchanged** | Sync of audio and pages; existing prayer playback unchanged.                                                                                       |


---

## Deliverable 2: Phase A implementation (execute after plan approval)

Implement only the following; do not add screen share, annotations, boards, or replay.

### 1. Recording + publish flow

- In **PrayerRoom.tsx** (host path only):
  - Import and use [PrayerRoomRecorder](src/01_App/(live) Gospel/Prayer/room/PrayerRoomRecorder.ts).
  - When host and `webrtc.mixedStream` is available: keep a ref to a single `PrayerRoomRecorder` instance.
  - Add state: `recordingStatus: "idle" | "recording" | "stopped"`, `recordedBlob: Blob | null`, `recordDurationSec: number` (optional timer).
  - "Start recording": `recorder.start(webrtc.mixedStream)`; set status `"recording"`; start a simple interval to update `recordDurationSec`.
  - "Stop recording": `recorder.stop()`; `recordedBlob = recorder.getBlob()`; set status `"stopped"`.
  - "Publish recording": build `FormData` with `audio` = recordedBlob (file `recording.webm`), `title` (from room title or prompt), `description`/`prayerText` optional, `published: "true"`, `userId`/`userName` from session, `duration` = `recordDurationSec`; call `uploadPrayer(formData, room?.groupId ?? undefined)`. On success, clear `recordedBlob` and reset recording state; optionally show success message or redirect to prayer.
- Use existing [uploadPrayer](src/01_App/(live) Gospel/Prayer/api/prayer-api.ts) and [POST /api/prayer](src/app/api/prayer/route.ts). No new API route for Phase A.

### 2. Moderator panel UI

- **New file**: `src/01_App/(live) Gospel/Prayer/room/ModeratorPanel.tsx` (or `PrayerRoomModeratorPanel.tsx` next to PrayerRoom).
  - Props: `isOpen`, `onClose`, `isHost`, `recordingStatus`, `recordedBlob`, `recordDurationSec`, `participants`, `onStartRecording`, `onStopRecording`, `onPublishRecording(title: string)`, `onMuteParticipant`, `onEndRoom`, optional `roomTitle` / `groupId`.
  - Layout: sidebar or drawer (e.g. slide from right); not intrusive; host-only.
  - Sections: Recording (Start / Stop, timer when recording, Publish with title input); Participants (mute/unmute list); End room button.
- **PrayerRoom.tsx**: Add state `moderatorPanelOpen: boolean`. Render a host-only "Moderator" or "Host controls" button that toggles `moderatorPanelOpen`. Render `ModeratorPanel` when `isHost && moderatorPanelOpen`, passing all callbacks and data. Recording logic (recorder ref, start/stop/publish) can live in PrayerRoom or in a small hook `useRoomRecording(mixedStream)` that returns `{ recordingStatus, recordedBlob, recordDurationSec, start, stop, getBlob, clear }`.

### 3. Keep existing behavior

- **PrayerRoomControls**: Keep existing mute/unmute and "End room" inline for host, OR move those into the moderator panel only and hide the inline host block when panel is used (to avoid duplication). Prefer: keep one place — moderator panel for host (so host controls live in panel); PrayerRoomControls can show only "Open moderator panel" for host and mute self for speaker.
- **Listeners**: No changes to listener flow; no moderator panel for non-hosts.
- **PrayerPlayer, PrayerWaveform, tabs, routes**: No changes.

### 4. Optional small helpers

- **useRoomRecording** (optional): Hook that takes `mixedStream: MediaStream | null`, returns `{ recordingStatus, recordedBlob, recordDurationSec, start, stop, clear }` using PrayerRoomRecorder internally. Keeps PrayerRoom.tsx simpler.
- **Room record**: No need to persist "recording in progress" to rooms.json for Phase A; client state is enough. Optionally add `source: "live_room"` and `roomId` to the prayer object when publishing from room (extend FormData and API route if desired).

### 5. Files to touch (summary)

- **Create**: [BUILD_PLAN_LIVE_COLLAB.md](src/01_App/(live) Gospel/Prayer/BUILD_PLAN_LIVE_COLLAB.md) (full 5-phase doc above), [ModeratorPanel.tsx](src/01_App/(live) Gospel/Prayer/room/ModeratorPanel.tsx) (or `PrayerRoomModeratorPanel.tsx`).
- **Modify**: [PrayerRoom.tsx](src/01_App/(live) Gospel/Prayer/PrayerRoom.tsx) (recorder usage, moderator panel state and callbacks, publish flow); [PrayerRoomControls.tsx](src/01_App/(live) Gospel/Prayer/PrayerRoomControls.tsx) (host: show "Moderator" toggle instead of or in addition to inline host controls — consolidate in panel).
- **Optional**: New hook `useRoomRecording.ts` in `room/`; [prayer-api.ts](src/01_App/(live) Gospel/Prayer/api/prayer-api.ts) / [route.ts](src/app/api/prayer/route.ts) accept optional `source`, `roomId` for published room recordings.

### 6. Test checklist (Phase A)

- Host opens moderator panel and closes it.
- Host starts recording; timer or status shows "recording"; host stops; `recordedBlob` is set.
- Host enters title and publishes; new prayer appears in list; audio plays in existing player.
- Host mutes/unmutes a participant; participant is muted in LiveKit.
- Host ends room; room status becomes ended; participants see end state.
- Listener joins and hears audio; no moderator panel; listener experience unchanged.

---

## Deliverable 3: Phase A report (after implementation)

Generate a short report (e.g. `PHASE_A_LIVE_COLLAB_REPORT.md` in the Prayer folder or in `.cursor/plans/`) containing:

- **What already existed**: LiveKit room, mixedStream, PrayerRoomRecorder, uploadPrayer, room APIs, host mute/end in PrayerRoomControls.
- **What Phase A added**: Moderator panel component, recording start/stop/publish in PrayerRoom, panel toggle, optional useRoomRecording hook.
- **Files created**: BUILD_PLAN_LIVE_COLLAB.md, ModeratorPanel.tsx, (optional) useRoomRecording.ts.
- **Files modified**: PrayerRoom.tsx, PrayerRoomControls.tsx, (optional) prayer-api/route for roomId/source).
- **What remains for B–E**: Phase B (screen share), C (annotations), D (saved pages), E (replay timeline) as described in BUILD_PLAN_LIVE_COLLAB.md.

---

## Architecture diagram (for BUILD_PLAN doc)

```mermaid
flowchart TB
  subgraph PhaseA [Phase A]
    PR[PrayerRoom]
    MP[ModeratorPanel]
    Rec[PrayerRoomRecorder]
    webrtc[usePrayerRoomWebRTC]
    PR --> MP
    PR --> Rec
    PR --> webrtc
    webrtc -->|mixedStream| Rec
    Rec -->|blob| MP
    MP -->|uploadPrayer| API[/api/prayer POST]
  end
  subgraph Future [Phases B-E]
    B[Screen share]
    C[Annotations]
    D[Saved boards]
    E[Replay timeline]
  end
  PhaseA --> B
  B --> C
  C --> D
  D --> E
```



---

## Implementation order

1. **Now (plan mode)**: Create BUILD_PLAN_LIVE_COLLAB.md with full phase specs as above; no code changes.
2. **After approval**: Implement Phase A only (ModeratorPanel, recording + publish in PrayerRoom, optional hook, PrayerRoomControls adjustment).
3. **After Phase A**: Write Phase A report; stop and wait for instruction before B–E.

