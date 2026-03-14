---
name: Prayer App Stability Audit
overview: "Full stability and visibility audit of the Prayer app: routing, navigation, auth, network requests, live room visibility, and UI state. Report identifies root causes and exact file/line locations for fixes without making code changes."
todos: []
isProject: false
---

# Prayer App Stability and Visibility Audit Report

## 1. ROUTING AUDIT

### How routing works

- **Middleware** ([src/middleware.ts](src/middleware.ts)): Path-based `/prayer` (no subdomain) is rewritten to `/christian/prayer`; subdomain requests get rewritten to `/{subdomain}{pathname}`. Path segments are not stripped.
- **Domain page**: The route that actually matches is **(domain)/[domain]/[[...path]]** (route group `(domain)` does not appear in the URL). So `/christian/prayer`, `/christian/prayer/live`, `/christian/prayer/room/xyz` are handled by [src/app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx).
- **(domain) page** (lines 103–106, 177–179): When the first path segment is `"prayer"`, it sets `domain = "christian"` and `rawPath = ["prayer", ...]`. At render it passes **appSlug** = `pathSegments[0] === "prayer" ? pathSegments.slice(1) : pathSegments`. So PrayerApp receives slug **without** the leading `"prayer"` (e.g. `["live"]`, `["room", "xyz"]`).
- **_domain page** ([src/app/_domain/[domain]/[[...path]]/page.tsx](src/app/_domain/[domain]/[[...path]]/page.tsx) line 171): Passes `slug={pathSegments}` with **no** stripping. If this route were ever used (e.g. `/_domain/christian/prayer`), PrayerApp would get `["prayer", "live"]` or `["prayer", "room", "xyz"]`, and room detection would fail (see below).

### Valid routes (when (domain) page is used)


| Route                | path param → pathSegments                | appSlug passed to PrayerApp | Result                  |
| -------------------- | ---------------------------------------- | --------------------------- | ----------------------- |
| /prayer              | (rewrite) /christian/prayer → ["prayer"] | []                          | Main player             |
| /prayer/live         | ["prayer","live"]                        | ["live"]                    | LiveSection             |
| /prayer/{group}/live | ["prayer", group, "live"]                | [group, "live"]             | LiveSection with group  |
| /prayer/guides       | ["prayer","guides"]                      | ["guides"]                  | GuidedSection           |
| /prayer/community    | ["prayer","community"]                   | ["community"]               | CommunitySection        |
| /prayer/moments      | ["prayer","moments"]                     | ["moments"]                 | MomentsSection          |
| /prayer/admin        | ["prayer","admin"]                       | ["admin"]                   | Admin (upload)          |
| /prayer/admin/groups | ["prayer","admin","groups"]              | ["admin","groups"]          | GroupAdmin              |
| /prayer/room/:id     | ["prayer","room",id]                     | ["room", id]                | PrayerRoom (see caveat) |


### PrayerApp slug parsing ([src/01_App/Christian/Prayer/PrayerApp.tsx](src/01_App/Christian/Prayer/PrayerApp.tsx))

- **platformSection** (116–117): Uses `slug?.find(s => sectionNames.includes(s))` — works for both `["live"]` and `[groupSlug, "live"]`. Correct.
- **groupSlug** (122–124): First segment not in `RESERVED`. Correct for section and admin routes.
- **isRoom** (129): `slug?.[0] === "room" && slug?.[1]`. This **only** works when the **parent passes slug with "room" at index 0** (i.e. (domain) page’s appSlug). If slug were `["prayer", "room", "xyz"]` (e.g. from _domain or a future change), `isRoom` would be false and the room ID would be misinterpreted as **groupSlug** ("xyz").
- **Room ID** (341): `if (isRoom) return <PrayerRoom roomId={slug![1]} ... />`. When appSlug is `["room", "xyz"]`, this is correct. If appSlug ever included a leading "prayer", `slug[1]` would be `"room"`, not the ID — wrong.

**Root cause (routing):** PrayerApp assumes slug has no leading `"prayer"`. That holds for the (domain) page but not for _domain. Room detection is fragile: it should derive `isRoom` and `roomId` from “segment === 'room' and next segment exists” so it works regardless of a leading "prayer".

### Domain routing path handling

- (domain) page does not strip or mis-handle path segments; it normalizes only by optionally stripping a duplicate domain segment (lines 109–112) and by building appSlug (strip leading "prayer"). No evidence of segment stripping bugs for the Prayer app when (domain) is used.

---

## 2. NAVIGATION & BUTTONS

### PrayerApp.tsx

- **Top nav** (425–438, 442–455, etc.): All `Link` hrefs use `prayerBase` (`/prayer`) and `sectionPath(section)` — correct.
- **Admin dropdown** (549–600): Links to `prayerBase/admin/groups`, `prayerBase/admin`, `prayerBase/live` — all valid.
- **Main header** (665–676): "Join Live" / "Start meeting" → `group ? ${prayerBase}/${group.slug}/live : ${prayerBase}/live` — correct.
- **Sign-in** (692): `Link` to `/api/auth/signin?callbackUrl=${encodeURIComponent("/prayer")}` — correct (hardcoded `/prayer`; user lands on home after sign-in).
- **Context tools** (764–770): Section links use `sectionPath("live")`, etc.; Admin/Groups use `prayerBase/admin` and `prayerBase/admin/groups` — correct.
- **Bottom nav** (826–838): Same `basePath` / `sectionPath` — correct.
- **Footer** (765–766, 848–849): Admin and Groups links — correct.

### LiveSection.tsx ([src/01_App/Christian/Prayer/live/LiveSection.tsx](src/01_App/Christian/Prayer/live/LiveSection.tsx))

- **router.push** (49, 64): `${prayerBase}/room/${roomId}` — valid route; room page works when (domain) passes appSlug `["room", id]`.
- **"Share Message / Testimony"** (71–72): `router.push(\`${prayerBase}/admin)` — correct.
- **Enter Room** (240): `Link` to `${prayerBase}/room/${r.roomId}` — correct.
- **Back** (268): `Link href={base}` where `base = groupSlug ? \`${prayerBase}/${groupSlug} : prayerBase` — correct.

### GuidedSection.tsx ([src/01_App/Christian/Prayer/guided/GuidedSection.tsx](src/01_App/Christian/Prayer/guided/GuidedSection.tsx))

- **"Record response prayer"** (134–138): `Link` to `${prayerBase}/admin` — correct.
- **Back** (152–154): `Link href={base}` — correct.

### CommunitySection.tsx & MomentsSection.tsx

- **Back to Prayer**: `Link href={base}` with same `base` pattern — correct.

### Potential “works then breaks” behavior

- **Admin dropdown** (403–404): `onClick` toggles `setAdminDropdownOpen` and a backdrop closes it; no navigation in state that would break routes.
- **handleGroupChange** (300–311): Uses `router.push(path)` with `prayerBase`, `platformSection`, and group value — paths are consistent. No evidence of wrong path after rerender.
- **LivePrayerCta** “Start Prayer Room”: Pushes `${prayerBase}/room/${res.roomId}`; if session or `res` were stale on a rerender, the push might still be correct because it uses the result of the current `createRoom` call. No clear loop identified.

**Conclusion:** All Link and router.push targets match existing routes. No incorrect paths found. Room links work as long as the domain page passes appSlug with "room" at index 0 (current (domain) behavior).

---

## 3. AUTHENTICATION CHECK

### auth.ts ([src/app/lib/auth.ts](src/app/lib/auth.ts))

- **NEXTAUTH_SECRET** (5–7): Warning logged when undefined; sessions and OAuth may fail. No runtime guard that blocks startup — recommend documenting and/or failing fast in production.
- **Google provider**: Uses `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (16–19). Empty string fallback can cause silent OAuth failures.
- **pages.signIn / error** (24–27): Set to `"/prayer"` — correct for Prayer app.
- **callbacks**: JWT and session callbacks wire `getOrCreateUserByEmail` and session.user.id — standard and correct.
- **secret** (60): `process.env.NEXTAUTH_SECRET` — required for secure cookies; already warned when missing.

### NextAuth route ([src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/[...nextauth]/route.ts))

- Exports GET/POST handler from `NextAuth(authOptions)`. Correct. Note: [src/app/api/auth/callback/route.ts](src/app/api/auth/callback/route.ts) is **Shopify** OAuth callback, not NextAuth; Google callback is handled by the catch-all.

### signIn("google") and callbackUrl

- **PrayerAuthControls** ([src/01_App/Christian/Prayer/PrayerAuthControls.tsx](src/01_App/Christian/Prayer/PrayerAuthControls.tsx) line 52): `signIn("google", { callbackUrl: "/prayer" })` — hardcoded. User always returns to `/prayer`, not current path (e.g. `/prayer/lewisburg-guys/live`). Minor UX issue; auth flow is valid.
- **PrayerApp header** (692): Sign-in link uses `callbackUrl=/prayer` — same behavior.

### Session and re-renders

- **SessionProvider**: (domain) layout uses `<SessionProvider refetchInterval={0}>` ([src/app/(domain)/layout.tsx](src/app/(domain)/layout.tsx) line 9) — no refetch loop.
- **useSession()**: Used in PrayerApp (78), PrayerAuthControls (12), LivePrayerCta (27), PrayerRoom (79). Status "loading" is handled in PrayerAuthControls; no logic that would cause a re-render loop from session updates.

**Conclusion:** Auth is correctly wired. Improve by: (1) ensuring NEXTAUTH_SECRET (and optionally Google env vars) are validated or documented for production, (2) optionally using current path for callbackUrl so users return to the page they were on.

---

## 4. NETWORK REQUEST STABILITY

### PrayerApp.tsx

- **getGroups()** (109–110): Once on mount; no loop.
- **loadPrayers** (158–174): Runs when `loadPrayers`, `isGroupAdmin`, `groupSlug`, `group` change. **Retry** (166–168): if `published.length === 0 && !isRetry`, `setTimeout(loadPrayers(true), 800)` — one extra request, not a loop.
- **getLiveCountByGroup / getLiveCount** (221–232): Interval **20s**, cleanup in effect return. OK.
- **getPresence** (234–239): Interval **20s**, cleanup. OK.
- **heartbeatSession** (263–269): Interval **20s** when playing, cleanup. OK.

### LiveSection.tsx

- **getActiveRooms** (27–35): Interval **10s** (ACTIVE_POLL_MS), cleanup. OK.

### LivePrayerCta.tsx

- **getActiveRooms** (32–40): Same 10s poll, cleanup. When both **LiveSection** and **LivePrayerCta** are mounted (e.g. on Live tab), **two** independent 10s pollers run for the same data. Not a loop but duplicate work; could be consolidated or lifted.

### PrayerRoom.tsx ([src/01_App/Christian/Prayer/PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx) lines 25, 112–117)

- **ROOM_POLL_MS = 3000**. getRoom is polled every **3s** with cleanup. Below the 5s guideline; could contribute to load under many concurrent rooms.

### usePrayerRoomSignaling.ts ([src/01_App/Christian/Prayer/room/usePrayerRoomSignaling.ts](src/01_App/Christian/Prayer/room/usePrayerRoomSignaling.ts) lines 6, 98)

- **SIGNALING_POLL_MS = 1500**. Poll every **1.5s** with cleanup. Below 5s; high frequency when in a room.

### Other components

- **MomentsSection**: getPrayers in useEffect([filter, groupId]) — single fetch per dependency change. No loop.
- **GuidedSection**: getGuidedPrayers in useEffect([category]). No loop.
- **CommunitySection**: getChains once on mount. No loop.

**Conclusion:** No infinite request loops found. Potential causes of ERR_INSUFFICIENT_RESOURCES: (1) **PrayerRoom** 3s polling, (2) **usePrayerRoomSignaling** 1.5s polling, (3) duplicate **getActiveRooms** polling when LiveSection + LivePrayerCta both mount. Recommend increasing room and signaling intervals to ≥5s and deduplicating active-rooms polling.

---

## 5. LIVE ROOM FEATURE VISIBILITY

- **LiveSection** is rendered when `platformSection === "live"` (PrayerApp line 643). platformSection is set from slug by `slug?.find(s => sectionNames.includes(s))`, so both `/prayer/live` and `/prayer/{group}/live` yield `platformSection === "live"`. Correct.
- **"Start or Share Prayer"** panel (Start Live Room, Start 1-on-1, Share Message, Create Private Link) is always rendered inside LiveSection (LiveSection.tsx 108–206) for all group contexts; no conditional that would hide it. Correct.

---

## 6. UI STATE CONSISTENCY

- **Login state**: After sign-in, NextAuth updates session; components using `useSession()` re-render. PrayerAuthControls and the header identity (687–694) show user or sign-in link. No evidence of navigation or route state being reset incorrectly on session update.
- **Session in LivePrayerCta**: "Start Prayer Room" is disabled when `!(session?.user as { id?: string })?.id` (110); session dependency is stable. No loop.

**Conclusion:** Login state and session-driven UI are consistent; no identified rerender-induced breakage of navigation.

---

## 7. ADDITIONAL FINDINGS

### Debug UI

- **PrayerApp.tsx line 607**: `<div style={{ color: "red", fontSize: "40px" }}>PRAYER APP TEST</div>` — leftover debug markup; should be removed for production.

### Duplicate domain page implementations

- **[src/app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx)** and **[src/app/_domain/[domain]/[[...path]]/page.tsx](src/app/_domain/[domain]/[[...path]]/page.tsx)** both implement domain routing. (domain) strips leading "prayer" into appSlug; _domain passes full pathSegments. Only (domain) is used for `/christian/prayer`*. Unifying or documenting which is canonical would reduce confusion and prevent room route breakage if _domain were ever used.

---

## SUMMARY: ROUTES, FAILURES, FIX LOCATIONS

### Routes that work (with current (domain) page)

- `/prayer`, `/prayer/live`, `/prayer/{group}/live`, `/prayer/guides`, `/prayer/community`, `/prayer/moments`, `/prayer/admin`, `/prayer/admin/groups`, `/prayer/room/:id` (when slug passed as `["room", id]`).

### Routes that can fail

- **/prayer/room/:id** if the app ever receives slug with leading "prayer" (e.g. from _domain or a different parent): PrayerApp would not set `isRoom` and would treat the room ID as groupSlug, showing "Group not found" or wrong content.

### Buttons/links with wrong paths

- None. All inspected links and router.push targets match the route table.

### Auth misconfiguration

- **NEXTAUTH_SECRET** and Google env vars: only console warning when NEXTAUTH_SECRET is missing; no hard requirement. Recommend env validation or clear docs.
- **callbackUrl**: Always `/prayer`; consider current path for better UX.

### Excessive or duplicate network requests

- **PrayerRoom.tsx** line 25: `ROOM_POLL_MS = 3000` — increase to ≥5s.
- **usePrayerRoomSignaling.ts** line 6: `SIGNALING_POLL_MS = 1500` — increase to ≥5s.
- **LiveSection + LivePrayerCta**: Two separate getActiveRooms pollers when both mount — consider single source (e.g. shared hook or context).

### Exact file + line numbers for fixes (no refactor yet)


| Issue                                                                | File                                                                                            | Line(s)                  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------ |
| Room detection fragile (assumes slug[0]==="room")                    | [PrayerApp.tsx](src/01_App/Christian/Prayer/PrayerApp.tsx)                                      | 129, 341                 |
| roomId from slug when "room" not at 0                                | PrayerApp.tsx                                                                                   | 341                      |
| Remove debug div                                                     | PrayerApp.tsx                                                                                   | 607                      |
| Room poll interval < 5s                                              | [PrayerRoom.tsx](src/01_App/Christian/Prayer/PrayerRoom.tsx)                                    | 25                       |
| Signaling poll < 5s                                                  | [usePrayerRoomSignaling.ts](src/01_App/Christian/Prayer/room/usePrayerRoomSignaling.ts)         | 6                        |
| NEXTAUTH_SECRET / env validation                                     | [auth.ts](src/app/lib/auth.ts)                                                                  | 5–7 (extend or document) |
| callbackUrl could use current path                                   | [PrayerAuthControls.tsx](src/01_App/Christian/Prayer/PrayerAuthControls.tsx)                    | 52; PrayerApp.tsx 692    |
| Duplicate getActiveRooms when LiveSection + LivePrayerCta both mount | LiveSection.tsx 27–35, [LivePrayerCta.tsx](src/01_App/Christian/Prayer/LivePrayerCta.tsx) 32–40 | Consider shared polling  |


---

## RECOMMENDED FIXES (for later implementation)

1. **PrayerApp.tsx**: Derive `isRoom` and `roomId` by finding index where `slug[i] === "room"` and using `slug[i+1]` as roomId, so room works with or without leading "prayer" in slug.
2. **PrayerApp.tsx**: Remove the "PRAYER APP TEST" div (line 607).
3. **PrayerRoom.tsx**: Set ROOM_POLL_MS to at least 5000.
4. **usePrayerRoomSignaling.ts**: Set SIGNALING_POLL_MS to at least 5000.
5. **Auth**: Add production check or docs for NEXTAUTH_SECRET (and optionally Google env vars).
6. **PrayerAuthControls / PrayerApp**: Optionally set callbackUrl to current pathname for post-login return.
7. **Active rooms**: Share one getActiveRooms poll between LiveSection and LivePrayerCta (e.g. hook or context) to avoid duplicate requests.
8. **Domain pages**: Unify or clearly document (domain) vs _domain and ensure only one is used for Prayer so slug shape is consistent.

