# Prayer UI Modules

These components are the **canonical prayer player and recorder** for the platform. They are self-contained and can be reused outside the main Prayer app (e.g. embedded in other screens or apps).

## PlayerModule

- **Path:** `PlayerModule.tsx`
- **Purpose:** Playback only — play/pause, waveform, remaining time, seek (-15s / +15s, click-to-seek), speed. Optional replay timeline for live-room recordings.
- **Usage:** Pass `src`, callbacks (`onPlayingChange`, `onDurationChange`, `seekToSeconds`, `onSeekDone`), and optionally `replayPrayer` + `durationSec` + `onReplaySeek` for timeline markers.
- **Dependencies:** `PrayerPlayer`, `ReplayTimeline`, and types from the Prayer app; no router or global prayer state.

## RecorderModule

- **Path:** `RecorderModule.tsx`
- **Purpose:** Recording only — record indicator, timer, stop, cancel. After stop, minimal title/description form and publish via existing `uploadPrayer` API.
- **Usage:** Pass `groupId?`, `onPublished?(prayer)`, `onCancel`. Uses `useSession` and `uploadPrayer` internally.
- **Dependencies:** Prayer API and types; publish is via callback so the parent can refresh lists or navigate.

Both modules are rendered exclusively in the Prayer app’s **Core Module** area based on `mode` (`player` | `record`).
