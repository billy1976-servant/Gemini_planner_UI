# Corporate Prayer Player — Implementation Plan

## Scope
Improve the **player experience only**. No architecture change, no dashboard/CRUD redesign. Keep current Prayer module structure and APIs.

## Design intent
Corporate prayer = continuous broadcast. Many people listen to the same prayer; when it ends it repeats. Player must feel like a live stream: load latest, play immediately, loop with no delay, show time remaining.

---

## 1. Waveform fix (full-length progress)

**Current:** Bar-style waveform with random heights; progress indicated by which bars are highlighted. Does not clearly represent total length.

**Target:**
- Waveform spans **full width** of the player.
- **Played portion** (from 0 to progress): highlighted (accent color).
- **Remaining portion** (progress to 1): visible but muted.
- Progress updates continuously from `currentTime / duration`.
- Visually communicates total prayer length at a glance.

**Implementation:**
- Redraw waveform as a **single full-width strip** of bars (or one continuous shape). Each bar segment maps to a slice of the timeline.
- Draw "remaining" bars first (full width, muted). Then draw "played" bars from 0 to `progress * width` with accent color.
- Remove random/animated bar heights that obscure progress; use fixed or gentle variation so the **progress cutoff** is the only moving element (or keep very subtle animation on the played portion only).
- PrayerWaveform: accept `progress` (0–1) and `duration`; bars span 100% width; fill from left up to `progress`.

---

## 2. Countdown timer

**Target:** Show time **remaining** in the prayer (e.g. "12:41 remaining", "5:03 remaining"). Counts down to 0. When prayer ends and loops, timer resets to full duration.

**Implementation:**
- `remainingSeconds = Math.max(0, duration - currentTime)`.
- Display: `formatTime(remainingSeconds) + " remaining"`.
- Place near current time/duration (e.g. below progress or in the time row). When loop happens, `currentTime` resets so remaining becomes duration again.

---

## 3. Looping behavior

**Target:** When audio ends → restart from beginning immediately. No delay. Continuous.

**Implementation:**
- In PrayerPlayer, on `<audio>` `ended` event: do **not** call `onEnded` to stop; instead set `audioRef.current.currentTime = 0` and call `audioRef.current.play()` so playback restarts immediately.
- Remove or repurpose any `onEnded` that stopped playback. State stays "playing"; no UI flicker.

---

## 4. Skip controls

**Target:** Keep −15s and +15s. Ensure waveform and countdown update correctly after skip.

**Implementation:**
- Already present. Skip handlers update `currentTime` via the audio element; `timeupdate` will fire so state (and thus waveform progress + countdown) already updates. No change unless we need to force a sync after seek.

---

## 5. Playback speed

**Target:** Options 1x, 1.25x, 1.5x. Updates audio playback rate.

**Implementation:**
- State: `playbackRate: 1 | 1.25 | 1.5` (or number).
- When audio element is ready and whenever `playbackRate` changes: `audioRef.current.playbackRate = rate`.
- UI: small control row (e.g. "1x" | "1.25x" | "1.5x" buttons) near skip controls. Styled subtly to match.

---

## 6. Live prayer auto-load

**Target:** /prayer and /prayer/today load latest prayer automatically; player ready to play immediately. No "choose a prayer" screen.

**Implementation:**
- Already implemented in PrayerApp: latest = `allPrayers[0]`, set when no slug or slug is "today". Confirm no regressions; no code change unless something breaks.

---

## 7. Past prayers

**Target:** Subtle "Past prayers" section below main player. Click loads that prayer into same player. Does not dominate; main experience = current prayer.

**Implementation:**
- PrayerLibrary already has secondary mode with expandable list. Change copy: "More prayers" → "Past prayers", "Hide other prayers" → "Hide past prayers". Same behavior.

---

## 8. Ambient background

**Target:** Subtle visual atmosphere: slow animated gradient, soft glow behind player, gentle motion. Calm and prayerful, not flashy.

**Implementation:**
- **CSS:** Add keyframes for a slow-shifting gradient (e.g. hue or position shift over 15–20s). Apply to `.prayer-platform` background.
- **Glow:** Add a soft box-shadow or pseudo-element glow behind `.prayer-hero-card` (e.g. radial gradient or blurred accent).
- **Motion (optional):** Very subtle scale or opacity pulse when playing (e.g. `.prayer-platform.is-playing` class toggled from player). Keep minimal.

---

## Files to modify

| File | Changes |
|------|--------|
| **PrayerPlayer.tsx** | Loop on ended (restart immediately). Countdown timer (remaining). Playback speed state + UI + apply to audio. Pass `duration` to waveform if needed. |
| **PrayerWaveform.tsx** | Full-width progress waveform: bars span 100%; played portion (0 to progress) highlighted; remaining muted; progress updates continuously. |
| **PrayerLibrary.tsx** | Copy: "More prayers" → "Past prayers", "Hide other prayers" → "Hide past prayers". |
| **prayer-theme.css** | Ambient: animated gradient keyframes, soft glow on hero card, optional subtle playing state. Speed button styles if needed. |

---

## Out of scope (do not add)

- Reset button
- Countdown to replay delay
- Tap anywhere to play
- Wizard/onboarding
- Admin on main screen (stays at /prayer/admin)
