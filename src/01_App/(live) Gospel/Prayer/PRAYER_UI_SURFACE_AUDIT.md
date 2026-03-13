# Prayer Platform — Surface Audit and Wiring

## Summary

The prayer platform was audited for existing functionality. **Group chat** is not implemented in the codebase. All other features (live rooms, recordings, guided prayers, moments, community, group administration, login/auth) were already implemented and mostly reachable. This document describes what was **under-surfaced** (reachable but easy to miss) and the **wiring changes** made so every feature is clearly visible and usable from the UI.

---

## 1. Audit Results

### Implemented and Where They Live

| Feature | Implementation | Route / Component | Was reachable? |
|--------|----------------|-------------------|----------------|
| **Live prayer rooms** | `LiveSection`, `PrayerRoom`, `LivePrayerCta`, `prayer-room-api`, LiveKit | `/prayer/live`, `/prayer/room/[roomId]` | Yes (bottom nav **Live**; Join Live in header). **Start room** was only in Context Tools (**More**) on main tab. |
| **Group recordings** | Prayers with `groupId`; RecorderModule, ModeratorPanel (room), PrayerUpload (admin) | Main tab record flow; room moderator panel; `/prayer/admin` | Yes. |
| **Prayer recording / publishing** | RecorderModule, PrayerUpload, ModeratorPanel, `uploadPrayer` | Main **Start Prayer**; admin upload; room **Publish** | Yes. |
| **Group administration** | `GroupAdmin`, join/leave/create, `prayer-api` | `/prayer/admin/groups` | Yes, but only via footer **Groups** link (easy to miss). |
| **Admin panel** | PrayerUpload, GuidedPrayerCreate | `/prayer/admin` | Yes, but only via footer **Admin** link (easy to miss). |
| **Guided prayers** | `GuidedSection`, `GuidedPrayerCreate`, guided API | Bottom nav **Guided**; admin create | Yes. |
| **Moments** | `MomentsSection` | Bottom nav **Moments** | Yes. |
| **Community** | `CommunitySection` (chains, group prayer) | Bottom nav **Community** | Yes. |
| **Login / auth** | NextAuth, `PrayerAuthControls` | Footer sign in/out | Yes, but identity was only in footer. |
| **Group chat** | — | — | **Not implemented** in codebase. |

### Under-surfaced or Harder to Find

- **Start Prayer Room** on the **Live** tab: Users on `/prayer/live` only saw “Start one from the main Prayer tab.” Start room was only in **More** on the main tab.
- **Admin** and **Groups**: Only in the footer; not visible when expanding **More** (Context Tools).
- **Timer → Record**: After “Time’s up,” the only option was a link to `/prayer/admin`; no way to switch to record mode on the main tab.
- **User identity**: Only in footer; no compact “Signed in as …” in the header.

---

## 2. Wiring Implemented

### 2.1 Start Prayer Room on Live Tab

- **Feature:** Start a live room from the Live section.
- **Change:** Rendered **LivePrayerCta** on the Live section so “Start Prayer Room” (for admins) and “Join Room” appear on `/prayer/live` even when there are no rooms.
- **Location:** Live section (Context tools unchanged; main tab still has LivePrayerCta in More).
- **Files modified:**
  - `src/01_App/(live) Gospel/Prayer/live/LiveSection.tsx`  
    - Added `isAdmin` to props; imported and rendered `LivePrayerCta` when there are no rooms and again below the room list.
  - `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`  
    - Passed `isAdmin={isAdmin}` to `LiveSection`.

### 2.2 Admin and Groups in Context Tools (More)

- **Feature:** Admin panel and Groups management.
- **Change:** Added **Admin** and **Groups** links to the Context Tools content (same row as Moments, Guided, Community) so they appear when users open **More**.
- **Location:** Context Tools (More).
- **Files modified:**
  - `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`  
    - In `prayer-context-links`, added `<Link href="/prayer/admin">Admin</Link>` and `<Link href="/prayer/admin/groups">Groups</Link>`.

### 2.3 Timer “Time’s up” → Start Prayer on Main Tab

- **Feature:** After the prayer timer ends, start recording without leaving the main tab.
- **Change:** Added optional **onStartPrayer** callback to **PrayerTimerSelector**. When provided, “Time’s up” shows a **Start Prayer** button that invokes it (and resets the timer state). PrayerApp passes `onStartPrayer={() => setMode("record")}` so the main view switches to the RecorderModule.
- **Location:** Context Tools (More) → Prayer Timer.
- **Files modified:**
  - `src/01_App/(live) Gospel/Prayer/PrayerTimerSelector.tsx`  
    - Added `PrayerTimerSelectorProps` with optional `onStartPrayer`; in the ended state, when `onStartPrayer` is set, show **Start Prayer** button instead of the “Record Prayer” link to admin.
  - `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`  
    - `<PrayerTimerSelector onStartPrayer={() => setMode("record")} />`.

### 2.4 Compact User Identity in Header

- **Feature:** Make login state visible in the main header.
- **Change:** In the main (non-section) header, added a short line under the primary actions: “Signed in as {name}” or “Sign in” (link to `/api/auth/signin`). Footer **PrayerAuthControls** unchanged.
- **Location:** Header (main tab only).
- **Files modified:**
  - `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`  
    - `useSession()` from `next-auth/react`; new `<p className="prayer-header-identity">` with session display or Sign in link.

---

## 3. What Was Not Changed

- **Group chat:** Not present in the codebase; no wiring added.
- **APIs and data models:** Unchanged; all existing APIs and data models preserved.
- **Privacy:** Public live surfaces remain anonymous (e.g. participant counts only); no exposure of names of people praying in public UI.
- **New systems:** No new features or subsystems; only UI wiring and visibility.

---

## 4. Files Modified (Summary)

| File | Changes |
|------|--------|
| `src/01_App/(live) Gospel/Prayer/live/LiveSection.tsx` | `isAdmin` prop; render `LivePrayerCta` when no rooms and below room list. |
| `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx` | `useSession`; pass `isAdmin` to `LiveSection`; Admin + Groups in context links; `PrayerTimerSelector` `onStartPrayer`; header identity line. |
| `src/01_App/(live) Gospel/Prayer/PrayerTimerSelector.tsx` | Optional `onStartPrayer` prop; “Time’s up” shows **Start Prayer** button when `onStartPrayer` is provided. |

---

## 5. Feature → UI Surface (After Wiring)

- **Group chat** — N/A (not implemented).
- **Group recordings** — Main tab (record flow + group selector), room moderator panel, admin upload; unchanged.
- **Live rooms** — **Live** tab: list + **Join** + **Start Prayer Room** (LivePrayerCta); main tab: **Join Live** (header), **More** → LivePrayerCta.
- **Prayer recording/publishing** — **Start Prayer** (header); **More** → timer → **Start Prayer**; room **Publish**; admin upload.
- **Group administration** — **More** → **Groups**; footer **Groups**; `/prayer/admin/groups` (GroupAdmin).
- **Guided prayers** — Bottom nav **Guided**; admin create; **More** → Guided link.
- **Moments** — Bottom nav **Moments**; **More** → Moments link.
- **Community** — Bottom nav **Community**; **More** → Community link.
- **Login-dependent features** — Header “Signed in as …” / “Sign in”; footer PrayerAuthControls; Start Prayer Room and admin flows remain gated by auth where applicable.
