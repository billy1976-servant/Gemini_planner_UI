# Prayer Platform Stability Fix Report

## Files modified

| File | Changes |
|------|--------|
| `src/01_App/Christian/Prayer/utils/safeFetch.ts` | **Created.** Safe fetch helper: never throws, returns `null` on failure. |
| `src/01_App/Christian/Prayer/api/prayer-api.ts` | All GETs use `safeFetch`; all exported functions never throw; return safe defaults (`[]`, `null`, `{ totalListeners: 0 }`, etc.). Mutations (join, leave, upload, create, update) return `null` on failure instead of throwing. |
| `src/01_App/Christian/Prayer/room/prayer-room-api.ts` | `getActiveRooms`, `getRoom` use `safeFetch`; `createRoom`, `joinRoom`, `endRoom`, `setParticipantMute`, `getLiveKitToken` no longer throw; return `null` or safe defaults. |
| `src/app/lib/auth.ts` | Strict validation at top: warn only (no crash). Clear console messages for missing `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`. |
| `src/01_App/Christian/Prayer/PrayerAuthControls.tsx` | `callbackUrl` fixed to `"/prayer"` (no dynamic pathname). Removed `usePathname` import. |
| `src/01_App/Christian/Prayer/PrayerApp.tsx` | Sign-in link uses `callbackUrl=%2Fprayer`. Initial load: `getGroups().then(...).catch(() => setGroups([]))`; `getGroupBySlug(...).catch(() => setGroup(null)).finally(...)`; `Array.isArray(groups)` guard when setting default group. |
| `src/01_App/Christian/Prayer/live/LiveSection.tsx` | `createRoom` result checked for `null` before `router.push` / clipboard; defensive `(rooms ?? []).map`, `!Array.isArray(rooms) \|\| rooms.length === 0`. |
| `src/01_App/Christian/Prayer/LivePrayerCta.tsx` | `createRoom` result checked for `null` before `router.push`. |
| `src/01_App/Christian/Prayer/PrayerRoom.tsx` | `getLiveKitToken` result handled when `null`; `joinRoom` result checked before `setRoom`/`setStored`; `uploadPrayer` return value checked before `recording.clear()`. |
| `src/01_App/Christian/Prayer/PrayerUpload.tsx` | `uploadPrayer` return checked; only call `onUploaded(prayer)` when `prayer` is non-null; otherwise `setError("Upload failed")`. |
| `src/01_App/Christian/Prayer/GroupAdmin.tsx` | `createGroup` and `uploadGroupLogo` return values checked; set error state on `null`. |
| `src/01_App/Christian/Prayer/guided/GuidedPrayerCreate.tsx` | `createGuidedPrayer` return value checked; set success only when non-null, else `setError("Create failed")`. |
| `src/01_App/Christian/Prayer/community/CommunitySection.tsx` | Defensive `(chains ?? []).map` and `!Array.isArray(chains) \|\| chains.length === 0`. |
| `src/01_App/Christian/Prayer/moments/MomentsSection.tsx` | Defensive `(prayers ?? []).map` and `!Array.isArray(prayers) \|\| prayers.length === 0`. |
| `src/01_App/Christian/Prayer/guided/GuidedSection.tsx` | Defensive `(guides ?? []).map` and `!Array.isArray(guides) \|\| guides.length === 0`. |

---

## Crash sources fixed

- **API failures:** All read paths in `prayer-api.ts` and `prayer-room-api.ts` use `safeFetch` or try/catch and return safe defaults; no unhandled rejections or throws from network/parse errors.
- **Page init:** `PrayerApp` no longer relies on fragile network for initial render: `getGroups` and `getGroupBySlug` failures set empty array / null and run `.catch` / `.finally` so loading state is cleared.
- **Login redirect loop:** `callbackUrl` is fixed to `"/prayer"` in `PrayerAuthControls` and in the sign-in link in `PrayerApp`; no dynamic pathname used.
- **Auth config:** Missing Google or NEXTAUTH env vars only log warnings; app does not throw at startup.
- **Section components:** LiveSection, CommunitySection, MomentsSection, GuidedSection handle `undefined`/`null` and non-array state with `(list ?? []).map` and `!Array.isArray(list) || list.length === 0` so they never crash on empty or bad data.
- **Room/create flows:** All call sites of `createRoom`, `joinRoom`, `getLiveKitToken`, `uploadPrayer`, `createGroup`, `createGuidedPrayer`, `uploadGroupLogo` check for `null` and set error state or skip navigation instead of throwing.

---

## Fetch calls replaced

- **prayer-api.ts:** All `fetch` for GET-style and many POST calls replaced with `safeFetch` (or wrapped in try/catch with safe return). Exceptions: `uploadPrayer` and `uploadGroupLogo` use `fetch` for FormData and handle errors with try/catch and `null` return.
- **prayer-room-api.ts:** `getActiveRooms`, `getRoom`, and all POSTs that return JSON now use `safeFetch` or try/catch with `null`/safe default return.

---

## Auth validation status

- **Location:** `src/app/lib/auth.ts` (top of file).
- **Behavior:** Logs warnings only; does not throw or crash.
  - Missing `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`: `"[auth] Google OAuth not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local"`.
  - Missing or empty `NEXTAUTH_SECRET`: `"[auth] NEXTAUTH_SECRET missing; sessions and OAuth may fail. Set it in .env.local"`.

---

## Polling intervals verified

| Location | Constant | Value | Status |
|----------|----------|--------|--------|
| `PrayerRoom.tsx` | `ROOM_POLL_MS` | 5000 ms | OK (ΓëÑ 5000) |
| `room/usePrayerRoomSignaling.ts` | `SIGNALING_POLL_MS` | 5000 ms | OK (ΓëÑ 5000) |
| `room/ActiveRoomsContext.tsx` | `ACTIVE_POLL_MS` | 10000 ms | OK (ΓëÑ 5000) |
| `PrayerApp.tsx` | `LIVE_POLL_INTERVAL_MS` | 20000 ms | OK (ΓëÑ 5000) |

No polling under 3000 ms remains. Room and signaling polling are both ΓëÑ 5000 ms.
