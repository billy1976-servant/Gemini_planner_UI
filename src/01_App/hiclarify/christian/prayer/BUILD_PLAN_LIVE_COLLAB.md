# Prayer/Bible Study Live Collaboration ΓÇö Build Plan

Expand the LiveKit-based live room into a full collaboration layer: live prayer rooms, live Bible studies, screen sharing, moderator controls, annotations, saved study pages, and replay timeline. Lightweight Zoom + study workspace inside the existing Prayer system.

---

## Architecture Overview

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

## Phase A ΓÇö Live room recording + moderator controls

| Section | Content |
|--------|--------|
| **Purpose** | Finalize live room recording (host records mixed audio), add moderator panel, host can start/stop recording, publish recording as prayer replay, mute/unmute participants, end room. Room UI and participant flow unchanged. |
| **Files to create** | `room/ModeratorPanel.tsx` ΓÇö collapsible sidebar/drawer; optional: `room/useRoomRecording.ts` hook that wraps PrayerRoomRecorder + mixedStream + publish. |
| **Files to modify** | `PrayerRoom.tsx` (use recorder + moderator panel, pass host callbacks); `PrayerRoomControls.tsx` (add "Moderator" / panel toggle for host only, or move host-only actions into panel); `room/prayer-room-api.ts` (optional: add `publishRoomRecording(roomId, formData)` that POSTs to existing prayer upload API with room context). |
| **APIs** | Reuse `POST /api/prayer` (multipart) for publishing; no new route required. Optional: extend room metadata (e.g. `recordingStartedAt`) via PATCH if needed later. |
| **Data model** | No new store entities for Phase A. Prayer record unchanged (id, title, audioUrl, duration, etc.). Optional: add `source: "live_room"`, `roomId` on prayer for traceability. |
| **UI** | Host sees a "Moderator" or gear button that opens the panel. Panel: Start recording, Stop recording, Publish recording (title input + submit), Mute/unmute participants list, End room. Recording state (idle/recording/stopped) and optional timer. |
| **Test checklist** | Host can open/close panel; start/stop recording; after stop, publish creates a prayer and it appears in feed; mute/unmute and end room still work; listeners unaffected. |
| **Risks** | Long recordings = large blob in memory; consider chunking or server recording in a later phase. |
| **Unchanged** | PrayerRoomParticipants, listener join flow, LiveKit connection, PrayerPlayer, PrayerWaveform, prayer tabs/routes. |

---

## Phase B ΓÇö Screen sharing (plan only)

| Section | Content |
|--------|--------|
| **Purpose** | One active shared screen per room via LiveKit screen capture; share button; shared screen viewer in room; moderator can start/stop screen share. |
| **Files** | New: screen-share UI component, hook or integration in room for `createLocalScreenTracks()` / publish; modify PrayerRoom layout to show shared screen region. API: LiveKit already supports video tracks; token may need permission. |
| **APIs** | LiveKit client SDK screen capture; possibly new room metadata `screenShareParticipantId` for "who is sharing". |
| **Data model** | Room or session may store `activeScreenShareIdentity` (optional). |
| **UI** | "Share screen" button (host/speaker); main area shows shared screen when active; moderator can "Stop screen share" if host. |
| **Test / Risks / Unchanged** | One sharer at a time; no annotations yet; room audio and moderator panel unchanged. |

---

## Phase C ΓÇö Annotation overlay (plan only)

| Section | Content |
|--------|--------|
| **Purpose** | Canvas overlay on shared screen: draw, underline, highlight; clear annotations; moderator can enable/disable annotation mode. |
| **Files** | New: annotation canvas component, sync of stroke data (e.g. DataChannel or room metadata); modifier keys or toolbar for tools. |
| **APIs** | Optional: POST/GET annotations per session or send over LiveKit data channel. |
| **Data model** | Annotation strokes (points, tool, color) per session or per "page"; structure for Phase D. |
| **UI** | Overlay with draw/underline/highlight; clear button; moderator toggle "Annotations on/off". |
| **Test / Risks / Unchanged** | Only when screen share active; performance with many strokes; recording remains audio-only in Phase A/B. |

---

## Phase D ΓÇö Saved study pages / captured boards (plan only)

| Section | Content |
|--------|--------|
| **Purpose** | Capture current shared screen (+ overlay) as a "page"; save with label/title; optional audio note; multiple pages per session; organized by session. |
| **Files** | New: capture logic (canvas/screenshot), save API, list of pages in session. |
| **APIs** | New: e.g. `POST /api/prayer-room/session/:id/pages` (image + label + optional audio), `GET` pages for session. |
| **Data model** | Session or room has many "pages" (image URL or base64, label, order, optional audioRef). |
| **UI** | "Capture page" / "Save board" in moderator panel; label input; list of saved pages in session. |
| **Test / Risks / Unchanged** | Storage size; replay not yet implemented. |

---

## Phase E ΓÇö Replay timeline (plan only)

| Section | Content |
|--------|--------|
| **Purpose** | Replay session recording; jump between saved boards/pages; view annotations; use as follow-up study material. |
| **Files** | New: replay view component, timeline with recording + page markers, link from prayer feed (e.g. "Live replay" for prayers that have session data). |
| **APIs** | GET session replay (recording + pages + annotations). |
| **Data model** | Session replay record: recordingId (prayer id), pageIds, annotation blobs, timestamps. |
| **UI** | Replay player with seek; page list; optional annotation overlay at seek time. |
| **Test / Risks / Unchanged** | Sync of audio and pages; existing prayer playback unchanged. |

---

## Implementation order

1. **Phase A** ΓÇö Recording + moderator panel (implement first).
2. **Phase B** ΓÇö Screen sharing (after A).
3. **Phase C** ΓÇö Annotations (after B).
4. **Phase D** ΓÇö Saved boards (after C).
5. **Phase E** ΓÇö Replay timeline (after D).
