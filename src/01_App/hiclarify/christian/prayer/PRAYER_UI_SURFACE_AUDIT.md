# Prayer Platform ΓÇö Surface Audit and Wiring

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
| **Group chat** | ΓÇö | ΓÇö | **Not implemented** in codebase. |

### Under-surfaced or Harder to Find

- **Start Prayer Room** on the **Live** tab: Users on `/prayer/live` only saw ΓÇ£Start one from the main Prayer tab.ΓÇ¥ Start room was only in **More** on the main tab.
- **Admin** and **Groups**: Only in the footer; not visible when expanding **More** (Context Tools).
- **Timer ΓåÆ Record**: After ΓÇ£TimeΓÇÖs up,ΓÇ¥ the only option was a link to `/prayer/admin`; no way to switch to record mode on the main tab.
- **User identity**: Only in footer; no compact ΓÇ£Signed in as ΓÇªΓÇ¥ in the header.

---

## 2. Wiring Implemented

### 2.1 Start Prayer Room on Live Tab

- **Feature:** Start a live room from the Live section.
- **Change:** Rendered **LivePrayerCta** on the Live section so ΓÇ£Start Prayer RoomΓÇ¥ (for admins) and ΓÇ£Join RoomΓÇ¥ appear on `/prayer/live` even when there are no rooms.
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

### 2.3 Timer ΓÇ£TimeΓÇÖs upΓÇ¥ ΓåÆ Start Prayer on Main Tab

- **Feature:** After the prayer timer ends, start recording without leaving the main tab.
- **Change:** Added optional **onStartPrayer** callback to **PrayerTimerSelector**. When provided, ΓÇ£TimeΓÇÖs upΓÇ¥ shows a **Start Prayer** button that invokes it (and resets the timer state). PrayerApp passes `onStartPrayer={() => setMode("record")}` so the main view switches to the RecorderModule.
- **Location:** Context Tools (More) ΓåÆ Prayer Timer.
- **Files modified:**
  - `src/01_App/(live) Gospel/Prayer/PrayerTimerSelector.tsx`  
    - Added `PrayerTimerSelectorProps` with optional `onStartPrayer`; in the ended state, when `onStartPrayer` is set, show **Start Prayer** button instead of the ΓÇ£Record PrayerΓÇ¥ link to admin.
  - `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`  
    - `<PrayerTimerSelector onStartPrayer={() => setMode("record")} />`.

### 2.4 Compact User Identity in Header

- **Feature:** Make login state visible in the main header.
- **Change:** In the main (non-section) header, added a short line under the primary actions: ΓÇ£Signed in as {name}ΓÇ¥ or ΓÇ£Sign inΓÇ¥ (link to `/api/auth/signin`). Footer **PrayerAuthControls** unchanged.
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
| `src/01_App/(live) Gospel/Prayer/PrayerTimerSelector.tsx` | Optional `onStartPrayer` prop; ΓÇ£TimeΓÇÖs upΓÇ¥ shows **Start Prayer** button when `onStartPrayer` is provided. |

---

## 5. Feature ΓåÆ UI Surface (After Wiring)

- **Group chat** ΓÇö N/A (not implemented).
- **Group recordings** ΓÇö Main tab (record flow + group selector), room moderator panel, admin upload; unchanged.
- **Live rooms** ΓÇö **Live** tab: list + **Join** + **Start Prayer Room** (LivePrayerCta); main tab: **Join Live** (header), **More** ΓåÆ LivePrayerCta.
- **Prayer recording/publishing** ΓÇö **Start Prayer** (header); **More** ΓåÆ timer ΓåÆ **Start Prayer**; room **Publish**; admin upload.
- **Group administration** ΓÇö **More** ΓåÆ **Groups**; footer **Groups**; `/prayer/admin/groups` (GroupAdmin).
- **Guided prayers** ΓÇö Bottom nav **Guided**; admin create; **More** ΓåÆ Guided link.
- **Moments** ΓÇö Bottom nav **Moments**; **More** ΓåÆ Moments link.
- **Community** ΓÇö Bottom nav **Community**; **More** ΓåÆ Community link.
- **Login-dependent features** ΓÇö Header ΓÇ£Signed in as ΓÇªΓÇ¥ / ΓÇ£Sign inΓÇ¥; footer PrayerAuthControls; Start Prayer Room and admin flows remain gated by auth where applicable.
