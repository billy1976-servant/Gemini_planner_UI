# Prayer Audio Platform ΓÇö Architecture Plan (Phase 1)

## Scope & Constraints

- **No changes** to: global structure engine, TSXScreenWithEnvelope, resolver logic, or any existing modules.
- **All new code** lives under: `src/01_App/(live) Gospel/Prayer/`.
- System is self-contained and functional.

---

## 1. Entry Points (Minimal Surface Outside Prayer/)

To make the app reachable without modifying existing files:

- **Page**: One new Next.js page `src/app/prayer/[[...slug]]/page.tsx` that only imports and renders the root component from `@/01_App/(live) Gospel/Prayer/PrayerApp` (or similar). No logic in the page.
- **API**: New API routes under `src/app/api/prayer/` that only read/write data under the Prayer folder (e.g. `Prayer/data/prayers.json`, `Prayer/uploads/`). Handlers are thin wrappers; all business logic and types stay in Gospel/Prayer.

---

## 2. Data Model & Storage

- **Prayer record** (in-memory + JSON):
  - `id`: string (slug or UUID)
  - `title`: string
  - `description`: string
  - `prayerText`: string (optional)
  - `audioUrl`: string (path or URL to audio file)
  - `createdAt`: ISO string
  - `published`: boolean

- **Storage** (all under `Prayer/`):
  - `Prayer/data/prayers.json` ΓÇö array of prayer metadata.
  - `Prayer/uploads/` ΓÇö uploaded audio files (or `public/`-mapped path that resolves under Prayer).

- **URLs**:
  - `/prayer` or `/prayer/today` ΓåÆ latest published prayer.
  - `/prayer/[id]` ΓåÆ specific prayer by id.

---

## 3. File Structure (Inside Gospel/Prayer/)

```
Prayer/
Γö£ΓöÇΓöÇ PLAN.md                 (this file)
Γö£ΓöÇΓöÇ PrayerTypes.ts          (shared types)
Γö£ΓöÇΓöÇ PrayerApp.tsx            (root: layout, routing, player + library + share)
Γö£ΓöÇΓöÇ PrayerPlayer.tsx        (play/pause, progress, time, skip)
Γö£ΓöÇΓöÇ PrayerWaveform.tsx      (canvas waveform, animates when playing)
Γö£ΓöÇΓöÇ PrayerShare.tsx         (copy link, share URL)
Γö£ΓöÇΓöÇ PrayerUpload.tsx        (admin: upload audio, title, description, prayer text, publish)
Γö£ΓöÇΓöÇ PrayerLibrary.tsx       (list/browse prayers, ΓÇ£latestΓÇ¥ + older)
Γö£ΓöÇΓöÇ prayer-theme.css        (scoped styles: dark gradient, glass card, typography)
Γö£ΓöÇΓöÇ data/
Γöé   ΓööΓöÇΓöÇ prayers.json        (generated; list of prayers)
ΓööΓöÇΓöÇ api/                    (optional: server actions or fetch wrappers)
    ΓööΓöÇΓöÇ prayer-api.ts       (client-side API helpers: getPrayers, getPrayer(id), upload, etc.)
```

API route handlers live in `src/app/api/prayer/` and only read/write `Prayer/data/` and `Prayer/uploads/` (or configured paths under Prayer).

---

## 4. Core User Experience

- Open `/prayer` or `/prayer/today` ΓåÆ see latest prayer; **press play** immediately.
- **Waveform** visible and animating with playback.
- **Title** and **description** shown; optional **prayer text** below or in expandable section.
- **Share**: copy link, optional ΓÇ£Send to family/groupΓÇ¥ (share sheet or copy).
- **URL** is shareable and works for direct access (`/prayer/123`).

---

## 5. Admin Experience

- **Upload**: audio file, title, description, optional prayer text.
- **Publish**: set `published: true`, generate slug/id.
- **Shareable URL** derived from base URL + `/prayer/[id]`.

Admin UI can live at `/prayer/admin` (same page with `?admin=1` or a segment), rendered only when enabled (e.g. env or simple flag), and use `PrayerUpload` + `PrayerLibrary` for management.

---

## 6. Design (Spotify / 2026 Quality)

- **Background**: Dark gradient (e.g. deep navy/charcoal to black).
- **Player card**: Glass-style (backdrop-blur, subtle border, rounded).
- **Play button**: Large circular primary control; smooth hover/active states.
- **Typography**: Clear hierarchy (title, episode/prayer name, time); elegant, readable font.
- **Motion**: Smooth play/pause, progress bar fill, waveform animation; no jarring jumps.
- **Emotional tone**: Calm, minimal, elegant, emotionally supportive.

Styling: **prayer-theme.css** in Prayer folder + inline styles where needed. Project does not use Tailwind; no global Tailwind added.

---

## 7. Features Checklist

| Feature | Implementation |
|--------|----------------|
| **Audio player** | Play/Pause, progress bar, skip forward/back (e.g. ┬▒15s), time display (current / duration), smooth transitions |
| **Waveform** | Canvas-based; bars or line; animate (e.g. gain/height) from AnalyserNode or precomputed peaks; no new heavy deps |
| **Upload** | Form in PrayerUpload; multipart to API; API writes file under Prayer/uploads, appends to prayers.json |
| **Prayer library** | PrayerLibrary lists from prayers.json; ΓÇ£LatestΓÇ¥ + ΓÇ£OlderΓÇ¥; click ΓåÆ load that prayer in player |
| **Share** | PrayerShare: Copy link (current URL), optional Web Share API for ΓÇ£Send to family/groupΓÇ¥ |
| **Admin** | PrayerUpload + list in PrayerLibrary; publish sets `published` and id/slug |

---

## 8. Technical Stack (Within Prayer/)

- **React + TSX** for all UI.
- **Styling**: `prayer-theme.css` + inline styles; no Tailwind.
- **Waveform**: HTML5 Audio + Canvas (and optionally Web Audio API AnalyserNode for live levels); no Wavesurfer dependency to keep bundle small and self-contained.
- **Data**: JSON file under `Prayer/data/`; API routes read/write from there and serve uploads from a path under Prayer or `public`.

---

## 9. API Routes (Under src/app/api/prayer/)

- `GET /api/prayer` ΓÇö list prayers (from Prayer/data/prayers.json).
- `GET /api/prayer?id=[id]` or `GET /api/prayer/[id]` ΓÇö one prayer by id.
- `POST /api/prayer` ΓÇö create prayer (multipart: audio file + JSON fields); writes file under Prayer/uploads, updates prayers.json.
- Static or route to serve audio: e.g. files in `public/prayer-audio/` written by API, or route that streams from Prayer/uploads.

All paths used by these routes resolve to `src/01_App/(live) Gospel/Prayer/` for data and uploads.

---

## 10. Phase 2 Implementation Order

1. **PrayerTypes.ts** ΓÇö types for Prayer, API payloads.
2. **data/prayers.json** ΓÇö initial empty array or one seed entry.
3. **prayer-theme.css** ΓÇö variables and base layout styles.
4. **PrayerWaveform.tsx** ΓÇö canvas waveform; props: `audioRef`, `isPlaying`, `progress`.
5. **PrayerPlayer.tsx** ΓÇö audio element ref, play/pause, progress, skip, time; embed PrayerWaveform.
6. **PrayerShare.tsx** ΓÇö copy link, optional share.
7. **PrayerLibrary.tsx** ΓÇö fetch list, show latest + older, onSelect ΓåÆ set current prayer.
8. **PrayerUpload.tsx** ΓÇö form + upload to API.
9. **PrayerApp.tsx** ΓÇö layout (background, card), route by slug (`/prayer`, `/prayer/today`, `/prayer/[id]`), integrate player, library, share; optional admin section.
10. **API routes** ΓÇö list, get by id, POST upload; serve or reference audio URLs.
11. **Page** ΓÇö `src/app/prayer/[[...slug]]/page.tsx` ΓåÆ render `<PrayerApp />` with slug from params.

---

## 11. Phase 3 Deliverables

- List of files created.
- Short architecture summary.
- Features implemented (table).
- How to run (dev + build).
- How to upload prayers (admin flow + API).
