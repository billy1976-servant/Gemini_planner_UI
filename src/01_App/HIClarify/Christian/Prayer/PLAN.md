# Prayer Audio Platform — Architecture Plan (Phase 1)

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
  - `Prayer/data/prayers.json` — array of prayer metadata.
  - `Prayer/uploads/` — uploaded audio files (or `public/`-mapped path that resolves under Prayer).

- **URLs**:
  - `/prayer` or `/prayer/today` → latest published prayer.
  - `/prayer/[id]` → specific prayer by id.

---

## 3. File Structure (Inside Gospel/Prayer/)

```
Prayer/
├── PLAN.md                 (this file)
├── PrayerTypes.ts          (shared types)
├── PrayerApp.tsx            (root: layout, routing, player + library + share)
├── PrayerPlayer.tsx        (play/pause, progress, time, skip)
├── PrayerWaveform.tsx      (canvas waveform, animates when playing)
├── PrayerShare.tsx         (copy link, share URL)
├── PrayerUpload.tsx        (admin: upload audio, title, description, prayer text, publish)
├── PrayerLibrary.tsx       (list/browse prayers, “latest” + older)
├── prayer-theme.css        (scoped styles: dark gradient, glass card, typography)
├── data/
│   └── prayers.json        (generated; list of prayers)
└── api/                    (optional: server actions or fetch wrappers)
    └── prayer-api.ts       (client-side API helpers: getPrayers, getPrayer(id), upload, etc.)
```

API route handlers live in `src/app/api/prayer/` and only read/write `Prayer/data/` and `Prayer/uploads/` (or configured paths under Prayer).

---

## 4. Core User Experience

- Open `/prayer` or `/prayer/today` → see latest prayer; **press play** immediately.
- **Waveform** visible and animating with playback.
- **Title** and **description** shown; optional **prayer text** below or in expandable section.
- **Share**: copy link, optional “Send to family/group” (share sheet or copy).
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
| **Audio player** | Play/Pause, progress bar, skip forward/back (e.g. ±15s), time display (current / duration), smooth transitions |
| **Waveform** | Canvas-based; bars or line; animate (e.g. gain/height) from AnalyserNode or precomputed peaks; no new heavy deps |
| **Upload** | Form in PrayerUpload; multipart to API; API writes file under Prayer/uploads, appends to prayers.json |
| **Prayer library** | PrayerLibrary lists from prayers.json; “Latest” + “Older”; click → load that prayer in player |
| **Share** | PrayerShare: Copy link (current URL), optional Web Share API for “Send to family/group” |
| **Admin** | PrayerUpload + list in PrayerLibrary; publish sets `published` and id/slug |

---

## 8. Technical Stack (Within Prayer/)

- **React + TSX** for all UI.
- **Styling**: `prayer-theme.css` + inline styles; no Tailwind.
- **Waveform**: HTML5 Audio + Canvas (and optionally Web Audio API AnalyserNode for live levels); no Wavesurfer dependency to keep bundle small and self-contained.
- **Data**: JSON file under `Prayer/data/`; API routes read/write from there and serve uploads from a path under Prayer or `public`.

---

## 9. API Routes (Under src/app/api/prayer/)

- `GET /api/prayer` — list prayers (from Prayer/data/prayers.json).
- `GET /api/prayer?id=[id]` or `GET /api/prayer/[id]` — one prayer by id.
- `POST /api/prayer` — create prayer (multipart: audio file + JSON fields); writes file under Prayer/uploads, updates prayers.json.
- Static or route to serve audio: e.g. files in `public/prayer-audio/` written by API, or route that streams from Prayer/uploads.

All paths used by these routes resolve to `src/01_App/(live) Gospel/Prayer/` for data and uploads.

---

## 10. Phase 2 Implementation Order

1. **PrayerTypes.ts** — types for Prayer, API payloads.
2. **data/prayers.json** — initial empty array or one seed entry.
3. **prayer-theme.css** — variables and base layout styles.
4. **PrayerWaveform.tsx** — canvas waveform; props: `audioRef`, `isPlaying`, `progress`.
5. **PrayerPlayer.tsx** — audio element ref, play/pause, progress, skip, time; embed PrayerWaveform.
6. **PrayerShare.tsx** — copy link, optional share.
7. **PrayerLibrary.tsx** — fetch list, show latest + older, onSelect → set current prayer.
8. **PrayerUpload.tsx** — form + upload to API.
9. **PrayerApp.tsx** — layout (background, card), route by slug (`/prayer`, `/prayer/today`, `/prayer/[id]`), integrate player, library, share; optional admin section.
10. **API routes** — list, get by id, POST upload; serve or reference audio URLs.
11. **Page** — `src/app/prayer/[[...slug]]/page.tsx` → render `<PrayerApp />` with slug from params.

---

## 11. Phase 3 Deliverables

- List of files created.
- Short architecture summary.
- Features implemented (table).
- How to run (dev + build).
- How to upload prayers (admin flow + API).
