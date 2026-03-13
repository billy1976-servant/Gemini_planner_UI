# Prayer Player UI Refinement — Plan

## Goal
Clean, podcast-style layout that feels professional, minimal, calm, and meditation-like. Visually unique to this prayer app (no copy of Spotify/Buzzsprout).

## Layout Structure

1. **Header**
   - Small label: PRAYER
   - Prayer title
   - Optional short subtitle

2. **Main player row (horizontal)**
   - `[ PLAY BUTTON ]` — prominent, with subtle glow
   - `[ FULL-WIDTH WAVEFORM ]` — spans most of card width; click-to-seek
   - `[ TIME REMAINING ]` — e.g. "12:14 remaining"

3. **Control row (below waveform)**
   - −15s | +15s | Speed (single button cycles 1x → 1.25x → 1.5x)
   - Subtle, minimal

4. **Prayer Text (expandable)**
   - Label: "Prayer Text"
   - Collapsed by default; expand to show full text when available

5. **Past Prayers (secondary)**
   - Section label: "Past Prayers"
   - Simple list; selecting loads into same player
   - Does not compete visually with main player

6. **Share** — remains subtle below

7. **Admin** — only at /prayer/admin; main screen: very small link or none

## Waveform
- Full-width bars (no dots); played portion highlighted, remaining faded
- Smooth progress updates; click-to-seek on waveform area
- Bars or smooth segments across entire width

## Visual Atmosphere
- Soft animated gradient background (existing, keep)
- Subtle glow behind play button
- Calm palette; no flashy animation

## Files to Update
- PrayerPlayer.tsx — horizontal row, waveform wrap for seek, control row, speed cycle
- PrayerWaveform.tsx — ensure full-width bars, optional onSeek (or parent handles seek)
- PrayerApp.tsx — expandable Prayer Text, Past Prayers section label
- PrayerLibrary.tsx — add "Past Prayers" section heading in secondary mode
- prayer-theme.css — player row, waveform wrap, controls, expandable, section styles

## Unchanged
- API, routing, upload, share, looping, autoload, past prayer loading
