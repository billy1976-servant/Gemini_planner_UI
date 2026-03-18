# Phase A — Live Room Recording + Moderator Controls — Report

## What already existed

- **LiveKit room**: `room/usePrayerRoomWebRTC.ts` — connection via LiveKit; host receives `mixedStream` (local + remote speakers); listeners receive `remoteStream`. No recording UI or publish path was wired.
- **Room APIs**: `room/prayer-room-api.ts` — create, join, end, getRoom, getActiveRooms, getLiveKitToken, setParticipantMute. Routes under `src/app/api/prayer-room/` (create, join, end, active, room, token, mute).
- **Recorder**: `room/PrayerRoomRecorder.ts` — client-side MediaRecorder on a MediaStream; `start(stream)`, `stop()`, `getBlob()`, `isRecording()`. Not used by any UI.
- **Prayer publish**: `api/prayer-api.ts` `uploadPrayer(formData, groupId)`; `src/app/api/prayer/route.ts` POST accepts multipart (title, description, prayerText, audio file, duration, userId, userName, groupId). Prayers stored via `data/store.ts` `addPrayer`; audio in `Prayer/uploads/`.
- **Room UI**: `PrayerRoom.tsx` and `PrayerRoomControls.tsx` — host already had mute participants and end room inline; no moderator panel, no recording.

---

## What Phase A added

- **Moderator panel**: New `room/ModeratorPanel.tsx` — slide-out panel (drawer) for host with: Start/Stop recording, recording timer, Publish as prayer (title input + submit), Mute/unmute participants list, End room. Backdrop closes panel.
- **Recording flow**: New `room/useRoomRecording.ts` — hook that wraps `PrayerRoomRecorder`; takes `mixedStream`, exposes `recordingStatus`, `recordedBlob`, `recordDurationSec`, `start`, `stop`, `clear`.
- **PrayerRoom.tsx**: Host uses `useRoomRecording(webrtc.mixedStream)`; state for moderator panel open, publish error, isPublishing; `handlePublishRecording` builds FormData and calls `uploadPrayer`, then clears recording on success. Renders `ModeratorPanel` when host and panel open.
- **PrayerRoomControls.tsx**: New prop `onOpenModeratorPanel`. When host and `onOpenModeratorPanel` is set: show "Host controls" button; mute participants and End room are only in the panel (not duplicated inline). When host and `onOpenModeratorPanel` is not set: keep previous inline host controls for backwards compatibility.

---

## Files created

| File | Purpose |
|------|--------|
| `src/01_App/(live) Gospel/Prayer/BUILD_PLAN_LIVE_COLLAB.md` | Full 5-phase build plan (A: recording + moderator, B: screen share, C: annotations, D: saved boards, E: replay timeline). |
| `src/01_App/(live) Gospel/Prayer/room/ModeratorPanel.tsx` | Host-only drawer: recording, publish, mute list, end room. |
| `src/01_App/(live) Gospel/Prayer/room/useRoomRecording.ts` | Hook around PrayerRoomRecorder for mixedStream; status, blob, duration, start/stop/clear. |

---

## Files modified

| File | Changes |
|------|--------|
| `src/01_App/(live) Gospel/Prayer/PrayerRoom.tsx` | Imports: useRoomRecording, ModeratorPanel, uploadPrayer. Added isHost (before early returns), recording hook, moderator panel state, handlePublishRecording. Renders ModeratorPanel for host; passes onOpenModeratorPanel to PrayerRoomControls. |
| `src/01_App/(live) Gospel/Prayer/PrayerRoomControls.tsx` | New prop `onOpenModeratorPanel`. When host and it is set: show "Host controls" button; inline mute list and end room only when `showHostControlsInline` (i.e. when onOpenModeratorPanel is not provided). |

---

## What remains for Phases B–E

- **Phase B**: Screen sharing — one active shared screen per room via LiveKit; share button; shared screen viewer; moderator can start/stop screen share. See `BUILD_PLAN_LIVE_COLLAB.md`.
- **Phase C**: Annotation overlay on shared screen — draw/underline/highlight; clear; moderator toggle. See `BUILD_PLAN_LIVE_COLLAB.md`.
- **Phase D**: Saved study pages / captured boards — capture shared screen + overlay; save with label; optional audio note; multiple pages per session. See `BUILD_PLAN_LIVE_COLLAB.md`.
- **Phase E**: Replay timeline — replay session recording; jump between saved boards; view annotations; follow-up study material. See `BUILD_PLAN_LIVE_COLLAB.md`.

---

## Test checklist (Phase A)

- [ ] Host can open and close the moderator panel (Host controls button, Close, backdrop click).
- [ ] Host can start recording; timer or status shows "recording"; host can stop; recorded blob is available.
- [ ] Host can enter a title and publish; new prayer appears in the list; audio plays in the existing player.
- [ ] Host can mute/unmute participants from the panel; participant is muted in LiveKit.
- [ ] Host can end the room from the panel; room status becomes ended; participants see end state.
- [ ] Listener joins and hears audio; listener does not see moderator panel or Host controls; listener experience unchanged.
- [ ] PrayerPlayer, PrayerWaveform, and prayer tabs/routes are unchanged.
