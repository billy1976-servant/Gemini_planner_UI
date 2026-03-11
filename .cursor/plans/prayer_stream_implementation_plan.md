# Prayer Stream App — System Analysis & Implementation Plan

## 1. System Analysis (Rules + Existing TSX Onboarding)

### 1.1 Rules Summary

| Rule | Relevance to Prayer Stream |
|------|----------------------------|
| **CONTENT_AND_PRESENTATION** | Content from config/contracts; TSX is template only; no hardcoded content; use behavior bridge for navigation. |
| **CONTENT_BLOCKS_UNIVERSAL_RENDERER** | All content via single `renderContentBlocks(content, options)`; layouts never filter by block type; add new block types (e.g. `audio`) only in that renderer. |
| **TSX_BUILD_SYSTEM** | New TSX = structure-driven; use `useAutoStructure()` or envelope props; CSS vars for theme; no router.push; wizard structure type exists for step flows. |
| **TSX_CREATION_CHECKLIST** | Pick structure type (wizard for onboarding); consume structure; no layout constants in TSX. |
| **TSX_STRUCTURE_ENGINE_OVERVIEW** | Envelope wraps screen; resolver returns structure by path/metadata; content from config. |

### 1.2 Existing TSX Onboarding Implementation

**Primary reference: Container Creations Landing-2**

- **Screen structure**: Config is a JSON with `screens[]`. Each screen has:
  - `id`, `stepLabel`, `layout`, `title`, `subtitle`
  - `content[]` — array of content blocks (paragraph, heading, badge, checklist)
  - `media[]` — video, image, beforeAfter (rendered in layout-specific code)
  - `buttons[]` — `goto`, `next`, `back`, `link` with `target` / `nextScreenId`
  - `nextScreenId` for linear flow
- **Config source**: API `GET /api/container-creations-landing-config` reads from a static JSON file next to the TSX (`ContainerCreationsLanding-2.json`).
- **Rendering**:
  - **Content**: Single `renderContentBlocks(screen.content, options)` — no filtering by type in layouts.
  - **Media**: Rendered per layout (hero video, stamped video, twoCol image, etc.). Video via `<video>` with `src` from `media[].src`.
  - **Navigation**: `currentScreenId` in React state; `goToScreen(id)`, `goNext()`, `goBack()`; buttons dispatch these.
- **Step flow**: Ordered list of screens; step tracker aside shows labels and allows jumping; one screen shown at a time in preview.
- **Dev integration**: TSX discovered via `require.context` on `(live) Business`; path `(live) Business/Container_Creations/ContainerCreationsLanding-2`. Short path `Container_Creations/ContainerCreationsLanding` is rewritten to `tsx:(live) Business/...` in dev page. No central registry.

**Alternative: FlowViewer** uses a different system (education flows, engines, EducationCard, loadFlow from logic/flows). Not the pattern to reuse for a simple 4-step prayer onboarding.

### 1.3 Media Handling Today

- **Video**: In Container Creations, `media[]` includes `{ type: "video", src, caption? }`. Rendered with `<video>` in layout (hero, stamped, twoCol). No shared “media block” in content; media is layout-placed.
- **Audio**: Not present. Adding **audio** is MVP-scope: either as a new `media` type (e.g. `{ type: "audio", src }`) rendered in layout, or as a content block type in `renderContentBlocks`. Rule: new block/media types go in the single renderer (or in this app’s local renderer), not scattered in layouts.

---

## 2. Prayer Stream — Design

### 2.1 Purpose

Allow people to listen to a shared daily prayer and feel unified with others (play audio, optional counter, “I prayed” action).

### 2.2 MVP Features

- Play audio prayer
- Simple onboarding introduction (multi-step)
- Optional prayer counter (e.g. “X people prayed today” or “You prayed N times”)
- “I prayed” button
- Minimal storage (client-only for MVP)
- **Must** use existing onboarding TSX screen system (config-driven screens + content blocks + step navigation).

### 2.3 Onboarding Flow (4 screens)

| Step | Screen id | Purpose | Content / Actions |
|------|-----------|---------|-------------------|
| 1 | `welcome` | Intro | Title + short explanation (content blocks) |
| 2 | `join-prayer` | Play | Play button for daily audio; optional short copy (content) |
| 3 | `reflection` | Encouragement | Short text (content blocks) |
| 4 | `complete` | Mark done | “I prayed today” button; optional counter display |

Flow: linear (next/back). Same pattern as Container Creations: `screens[]`, `currentScreenId`, `goToScreen` / `goNext` / `goBack`, step tracker optional.

---

## 3. Audio Method for MVP

| Option | Description | Verdict |
|--------|-------------|--------|
| **A. Static hosted MP3** | One file in `public/audio/`, e.g. `daily-prayer.mp3`; config references URL. | **Recommended.** Simplest; no backend; works with existing static hosting. |
| **B. Upload daily audio** | Backend/store new file per day. | More complex; requires backend and storage; out of scope for “fastest MVP.” |
| **C. Loop small library** | Multiple tracks, rotate or random. | Can be added later; for MVP one static file is enough. |

**Recommendation: Option A — static hosted MP3.**

- Add e.g. `public/audio/daily-prayer.mp3` (or placeholder).
- Config: `media: [{ type: "audio", src: "/audio/daily-prayer.mp3", label?: "Play" }]` or a single `audioSrc` at app/screen level.
- TSX: one “play” layout (or a content block type `audio`) that renders `<audio controls src={...} />`. No backend.

---

## 4. Compliance With Project Rules

- **Content through universal renderer**: Prayer Stream screen will have its own `renderContentBlocks` (same pattern as Container Creations). All step content (paragraph, heading, badge) goes through it; no layout filtering by block type. **Audio** added as media type or content block type in that same component (single place).
- **Layout vs content**: Layouts only decide placement (e.g. “play area on top, content below”); which block types exist is determined by config and the single renderer.
- **No layout-specific content logic**: No “if block.type === 'paragraph' then show in left column only”; renderer handles all types.
- **Reusable onboarding screens**: Screens are defined in JSON (id, layout, content, media, buttons); TSX is one component that renders any such config. Adding steps = edit JSON only.

---

## 5. Implementation Plan

### 5.1 Folder Structure

```
src/
├── 01_App/(live) Business/
│   └── Prayer_Stream/
│       ├── PrayerStreamOnboarding.tsx    # Main TSX (config-driven, renderContentBlocks + media)
│       └── PrayerStreamOnboarding.json   # Config: stepTracker, screens[4]
├── app/
│   ├── api/
│   │   └── prayer-stream-config/
│   │       └── route.ts                  # GET → read PrayerStreamOnboarding.json, return JSON
│   └── prayer-stream/
│       └── page.tsx                     # Optional: standalone route (like /container-creations)
public/
└── audio/
    └── daily-prayer.mp3                 # Static audio (placeholder or real)
```

Optional later:

- `src/palettes/prayer-stream.json` if a distinct theme is needed.
- `src/app/landing/prayer-stream-theme.css` if reusing landing-style CSS (e.g. step tracker).

### 5.2 New TSX File: `PrayerStreamOnboarding.tsx`

- **Pattern**: Mirror Container Creations Landing-2.
- **State**: `config`, `currentScreenId`, `failedMedia` (optional, for audio load error).
- **Config**: Fetch from `GET /api/prayer-stream-config` (or same API pattern as container-creations-landing-config).
- **Config shape** (minimal):
  - `stepTracker?: { title, description }`
  - `screens: Array<{ id, stepLabel, layout, title?, subtitle?, content[], media[], buttons[], nextScreenId? }>`
  - Layouts: e.g. `welcome` (hero-like), `play` (audio + content), `reflection` (text), `complete` (primary CTA + optional counter).
- **Content blocks**: Same as Container Creations: `paragraph`, `heading`, `badge`. **Add `audio`** in this component’s `renderContentBlocks` (or in `renderMedia` as `type: "audio"`): render `<audio controls src={...} />`. Do not filter by type in layout; layout only chooses where the “media area” is; the renderer decides how each media type is rendered.
- **Navigation**: `goToScreen(id)`, `goNext()`, `goBack()`; buttons from config (`goto`, `next`, `back`).
- **“I prayed”**: Button on screen `complete` that (a) advances flow or stays on thank-you state, (b) increments optional counter (e.g. `localStorage` key `prayer-stream-count` or `prayer-stream-last-date`). No backend for MVP.
- **Prayer counter**: Optional. If “X people prayed today”: would need backend; for MVP use “You prayed N times” from localStorage, or omit counter.
- **Client component**: `"use client"`.
- **Theme**: Use CSS variables (e.g. `var(--color-bg-primary)`) so envelope palette applies; or a minimal prayer-stream palette.
- **No router.push**: Use `setCurrentScreenId` for in-flow navigation; any external links via config (e.g. `link` button).

### 5.3 JSON / Content Structure

**PrayerStreamOnboarding.json** (co-located with TSX):

```json
{
  "stepTracker": {
    "title": "Daily Prayer",
    "description": "Listen, reflect, and mark complete."
  },
  "screens": [
    {
      "id": "welcome",
      "stepLabel": "Welcome",
      "layout": "welcome",
      "title": "Welcome to Daily Prayer",
      "content": [
        { "type": "paragraph", "text": "A short moment to listen to a shared prayer and feel connected with others." }
      ],
      "buttons": [{ "type": "goto", "label": "Continue", "target": "join-prayer" }],
      "nextScreenId": "join-prayer"
    },
    {
      "id": "join-prayer",
      "stepLabel": "Today's Prayer",
      "layout": "play",
      "title": "Join Today's Prayer",
      "content": [{ "type": "paragraph", "text": "Press play to listen." }],
      "media": [{ "type": "audio", "src": "/audio/daily-prayer.mp3", "label": "Play" }],
      "buttons": [
        { "type": "back", "label": "Back" },
        { "type": "next", "label": "Continue", "nodeId": "next-reflection" }
      ],
      "nextScreenId": "reflection"
    },
    {
      "id": "reflection",
      "stepLabel": "Reflection",
      "layout": "reflection",
      "title": "Prayer Reflection",
      "content": [
        { "type": "paragraph", "text": "Take a moment of stillness. You are not alone." }
      ],
      "buttons": [
        { "type": "back", "label": "Back" },
        { "type": "next", "label": "Continue" }
      ],
      "nextScreenId": "complete"
    },
    {
      "id": "complete",
      "stepLabel": "Complete",
      "layout": "complete",
      "title": "Mark Complete",
      "content": [{ "type": "paragraph", "text": "When you're ready, mark that you prayed today." }],
      "buttons": [
        { "type": "back", "label": "Back" },
        { "type": "goto", "label": "I prayed today", "target": "complete", "nodeId": "i-prayed" }
      ]
    }
  ]
}
```

- **complete** screen: “I prayed” can stay on same screen and show a thank-you state (e.g. swap content to “Thank you” and hide button), or open a modal. Simplest: button triggers increment in localStorage and shows short confirmation (same screen, state-driven).

### 5.4 Minimal Backend / Storage

- **Config**: No DB. API route reads `PrayerStreamOnboarding.json` from disk (same pattern as container-creations-landing-config).
- **Storage**: MVP = client only. `localStorage` for “I prayed” count and/or last prayed date. Key e.g. `prayer-stream-count` (number) or `prayer-stream-last` (ISO date). No server persistence for MVP.

### 5.5 Plugging Into Existing System

- **Dev**: Add TSX under `src/01_App/(live) Business/Prayer_Stream/PrayerStreamOnboarding.tsx`. Auto-discovered as `(live) Business/Prayer_Stream/PrayerStreamOnboarding`. No change to EXPLICIT_TSX_MAP unless we want a short path (e.g. `Prayer_Stream/PrayerStreamOnboarding`).
- **Optional short path** in `app/dev/page.tsx`: if `screen === "Prayer_Stream/PrayerStreamOnboarding"` (or `prayer-stream`), set `pathToLoad = "tsx:(live) Business/Prayer_Stream/PrayerStreamOnboarding"`.
- **Envelope**: Rely on default envelope for new path, or add in `getDefaultTsxEnvelopeProfile.ts`: e.g. `Prayer_Stream/*` → same as onboarding (full-viewport, nav: none, minimal chrome). Optional.
- **Standalone route**: `app/prayer-stream/page.tsx` can mirror `app/container-creations/page.tsx`: fetch config from `/api/prayer-stream-config`, render a wrapper + the same Prayer Stream TSX (or a thin wrapper that only renders the onboarding component with that config). Alternatively, use only `/dev?screen=tsx:(live) Business/Prayer_Stream/PrayerStreamOnboarding` for MVP and add a dedicated route later.

### 5.6 Block and Media Types in This App

- **Content blocks** (in `renderContentBlocks`): `paragraph`, `heading`, `badge` (same as Container Creations). **Optional**: `audio` as content block `{ type: "audio", src, label? }` so it can be placed in content order; then one layout just renders “content” and the universal renderer outputs the audio element.
- **Media** (in `renderMedia` or equivalent): Add `type: "audio"` → `<audio controls src={...} />` with optional label. Layout `play` uses this for the primary play experience.
- Rule compliance: One place handles “audio” (either in content renderer or in media renderer); layouts do not branch on “only show audio here”; they define regions (e.g. “media area” + “content area”), and the single renderer fills them.

### 5.7 Estimated Build Complexity

| Item | Effort |
|------|--------|
| API route (read JSON from file) | Low |
| PrayerStreamOnboarding.json (4 screens) | Low |
| PrayerStreamOnboarding.tsx (clone + simplify Landing-2 pattern, add audio) | Medium |
| Step tracker + next/back + “I prayed” + localStorage | Low–Medium |
| Envelope profile (optional) | Low |
| Dedicated `/prayer-stream` page (optional) | Low |
| Placeholder MP3 | Trivial |

**Overall: Medium.** One TSX screen, one API route, one JSON config, one new media/block type (audio). Reuses existing onboarding pattern and rules.

---

## 6. Summary

- **Screens**: 4-step flow defined in JSON; TSX is one component that renders any config with `screens[]`, `content[]`, `media[]`, `buttons[]`.
- **Content**: Rendered only via a single `renderContentBlocks`; add `audio` there or in a single media renderer; layouts do not filter by type.
- **Audio**: Static MP3 in `public/audio/`; config points to it; no backend.
- **Storage**: localStorage for “I prayed” count / last date; no server for MVP.
- **Integration**: New folder under `(live) Business/Prayer_Stream`; config API under `app/api/prayer-stream-config`; optional standalone page and envelope profile. Dev discovers the TSX by path automatically.

This keeps the solution within the existing TSX onboarding and rule architecture and delivers the fastest working MVP.
