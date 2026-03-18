# Prayer Live Room WebRTC Audit Report

## Summary

The Prayer Live Room was audited and upgraded so that host controls expose video, audio, screen share, recording preview, participant tiles, and annotation/study tools. Video was not appearing because **camera video was never implemented**—only audio and screen-share video existed. This report documents what was fixed and added.

---

## 1. Video Tracks

**Root cause:** Participant camera video was never created or published. `usePrayerRoomWebRTC.ts` only used `createLocalAudioTrack()` and subscribed to `Track.Source.ScreenShare` for video.

**Changes:**

- **Local camera:** After connecting, host/speaker optionally requests camera via `navigator.mediaDevices.getUserMedia({ video: true })` in a try/catch. On success, the track is stored and can be published when the user turns video on. On failure, `cameraAvailable` is set to `false` and the room does not crash.
- **Publish/unpublish:** `setVideoEnabled(true)` publishes the local video track with `Track.Source.Camera`. `setVideoEnabled(false)` unpublishes via `getTrackPublication(Track.Source.Camera)` and `unpublishTrack(...)`.
- **Remote camera:** `TrackSubscribed` and `TrackUnsubscribed` now handle `Track.Source.Camera` and update a `participantVideoTracks` map (identity → `MediaStream`).

**Result:** Local and remote camera tracks are created and published/subscribed correctly when the user enables video and when remote participants publish camera.

---

## 2. Video Attachment

**Where tracks are attached:**

- **Screen share:** `ScreenShareView.tsx` — `videoRef.current.srcObject = stream` (unchanged; was already correct).
- **Participant camera:** `VideoTile.tsx` — each tile’s `<video>` element receives a `MediaStream` via `useEffect` that sets `el.srcObject = stream` when the participant has a video track. Local track is passed as `new MediaStream([localVideoTrack])` when `videoEnabled` is true.

**Fix:** Previously there were no video elements for participant cameras. The new `VideoTile` component attaches the appropriate stream (local or from `participantVideoTracks`) to each tile’s video element.

---

## 3. Missing UI Bindings

| Control | Where connected |
|--------|------------------|
| **Camera toggle** | `ModeratorPanel` MEDIA section: `setVideoEnabled`, `videoEnabled`, `cameraAvailable` from `usePrayerRoomWebRTC`. |
| **Mic toggle** | `ModeratorPanel` MEDIA section: `myMuted`, `onMuteSelf` (from `webrtc.setMyMuted`). |
| **Copy invite link** | `ModeratorPanel` ROOM section: `onCopyInviteLink` builds `origin + prayerBase + '/room/' + roomId` and copies to clipboard. |
| **Mute all participants** | `ModeratorPanel` ROOM section: `onMuteAll` loops `webrtc.participants` and calls `handleMuteParticipant(pid, true)` for non-host. |
| **Annotation visibility** | `ModeratorPanel` Annotation section: `annotationVisible`, `onAnnotationVisibleChange`; `PrayerRoom` only renders `AnnotationOverlay` when `annotationVisible` is true. |
| **Clear annotations** | `ModeratorPanel` and `AnnotationOverlay` toolbar: `onClearAnnotations` / `onClear` call `setAnnotationStrokes([])`. |
| **Draw / highlight / erase** | `AnnotationOverlay`: `mode` and optional toolbar with Draw, Highlight, Erase, Clear; strokes store optional `mode`. |

---

## 4. Files Modified

| File | Changes |
|------|--------|
| `room/usePrayerRoomWebRTC.ts` | Audio acquisition wrapped in try/catch; optional camera via `getUserMedia`; `participantVideoTracks` state and Camera track subscribe/unsubscribe; `localVideoTrack`, `videoEnabled`, `setVideoEnabled`, `cameraAvailable`, `audioAvailable`; cleanup of local video track and map. |
| `PrayerRoom.tsx` | Import and render `ParticipantVideoGrid`; recording indicator pill when `recordingStatus === 'recording'`; `annotationVisible` state; conditional `AnnotationOverlay`; pass new props to `ModeratorPanel` (video, copy invite, mute all, annotation, myMuted, onMuteSelf); `AnnotationOverlay` with `showToolbar`, `onClear`. |
| `room/ModeratorPanel.tsx` | New props: `videoEnabled`, `setVideoEnabled`, `cameraAvailable`, `onCopyInviteLink`, `onMuteAll`, `annotationVisible`, `onAnnotationVisibleChange`, `onClearAnnotations`, `myMuted`, `onMuteSelf`. New sections: MEDIA (camera, mic), ROOM (copy invite, mute all), Annotation (toggle visibility, clear). |
| `room/AnnotationOverlay.tsx` | `AnnotationMode` type and optional `mode` on strokes; props `mode`, `onModeChange`, `showToolbar`, `onClear`; drawStrokes respects stroke mode (draw / highlight / erase); toolbar with Draw, Highlight, Erase, Clear when `showToolbar` and editable. |

---

## 5. New Components

| Component | Purpose |
|-----------|--------|
| **VideoTile** | Single participant tile: `<video>` when stream has video track, otherwise avatar (initials); label with display name; badges for Host / You; mute and “Video off” indicators. |
| **ParticipantVideoGrid** | Responsive grid of `VideoTile`s; participants ordered with host first, then current user; uses `localVideoTrack`, `videoEnabled`, and `participantVideoTracks` from `usePrayerRoomWebRTC`. |

**HostSidebar:** The existing `ModeratorPanel` was extended with the new sections and props above; no separate `HostSidebar` component was added. The panel remains open-on-demand via “Host controls”; layout and grouping (MEDIA, ROOM, Annotation) match the requested sidebar behavior.

---

## 6. Safeguards and Device Support

- **No camera:** `getUserMedia({ video: true })` is in try/catch; on failure `cameraAvailable` is false, UI shows avatar in the tile and camera toggle is disabled. Room does not crash.
- **No mic:** `createLocalAudioTrack()` is in try/catch; on failure `audioAvailable` is false, `localStream` stays null, host mix is still created (remote-only) so recording can continue. User can join without publishing audio.
- **Token/URL:** `usePrayerRoomWebRTC` effect returns immediately if `!token || !liveKitUrl`; no `room.connect` call and no crash.
- **API calls:** `getRoom`, `getLiveKitToken`, `joinRoom`, etc. already use `safeFetch` or try/catch in `PrayerRoom` and `LiveSection`; no additional changes required for this audit.

---

## 7. Outcome

- **Participant video tiles:** Visible in `ParticipantVideoGrid` with video or avatar fallback, mute/video indicators, host first.
- **Screen share:** Unchanged; still shown in main area with `ScreenShareView`.
- **Recording indicator:** Red “Recording” pill with timer in the main area when recording is active.
- **Host control sidebar:** `ModeratorPanel` provides MEDIA (camera, mic), Recording, Screen share, ROOM (copy invite, mute all), Study pages, Annotation (show/hide, clear), Mute participants, End room.
- **Annotation/study tools:** Draw, highlight, erase modes and Clear in overlay toolbar; annotation visibility and clear from panel; existing study pages/snapshot tools unchanged.
- **Stability:** Room remains stable when camera or mic is missing or when API calls fail, thanks to try/catch and safe defaults.
