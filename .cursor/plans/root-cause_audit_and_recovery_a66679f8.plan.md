---
name: Root-cause audit and recovery
overview: "Audit identifies five root causes for blank screens, broken links, and HTML-vs-JSON errors: missing path-based /prayer route on non-subdomain deployments, auth redirects to /prayer, layout/base-url and manifest behavior, API/screen path resolution, and duplicate domain routes. The recovery plan stages fixes in router/middleware first, then app-level, without modifying files until the report is approved."
todos: []
isProject: false
---

# HiSense App — Root-Cause Audit and Staged Recovery Plan

## 1. Executive summary: top 5 root causes


| #   | Root cause                                                        | Symptom(s)                                                                                                                                         | Confidence   |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | **No path-based `/prayer` (and other app) route**                 | Blank screen, links not working, routes work on subdomain but not on deployed root domain                                                          | **Definite** |
| 2   | **Auth and links assume `/prayer` exists**                        | Post-login 404, invite/org links to `/prayer/...` 404 on hi-sense.vercel.app                                                                       | **Definite** |
| 3   | **Base URL and manifest only correct when env is set**            | localhost/127.0.0.1 in production if env wrong; manifest/icon URLs wrong; “manifest syntax error” if manifest returns HTML                         | **Probable** |
| 4   | **Two domain page implementations + `require.context` in client** | Unstable resolution; navigation to `/christian/prayer` when path-based `/prayer` was intended; fallback to APP_MODULE_LOADERS when context is null | **Probable** |
| 5   | **Fetch of API or page URL that returns HTML parsed as JSON**     | “Unexpected token '<'” when response is HTML (404 page or error document)                                                                          | **Definite** |


---

## 2. Exact files involved

### Routing and middleware

- [src/middleware.ts](src/middleware.ts) — subdomain → rewrite to `/${subdomain}${pathname}`; skips `/_next`, `/api`, `/icons`. Does **not** create a path-based `/prayer` route.
- [src/lib/domain-config.ts](src/lib/domain-config.ts) — `getSubdomainFromHost`: returns `null` for bare `localhost` / `127.0.0.1`; subdomain only for `*.hiclarify.com` or `*.localhost`.

### Domain and path-based pages

- [src/app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx) — **only** matches `/:domain/[[...path]]` (e.g. `/christian`, `/christian/prayer`). Used when middleware rewrites (subdomain flow).
- [src/app/_domain/[domain]/[[...path]]/page.tsx](src/app/_domain/[domain]/[[...path]]/page.tsx) — **not** a route (App Router ignores `_`* segments). Dead code.
- **Missing:** There is **no** `src/app/prayer/` (or `app/prayer/[[...path]]/page.tsx`). So `/prayer` has no matching route on hi-sense.vercel.app → 404.

### Layout and user chrome

- [src/app/layout.tsx](src/app/layout.tsx) — Root layout. Line 571: treats `pathname?.startsWith("/prayer")` and `pathname?.match(/^\/(christian|business|...)(\/|$)/)` as “user mode” and renders `children` or `UserLayoutChrome`. This only affects **which chrome** wraps content; it does **not** define a route. So when pathname is `/prayer`, there is still no page component (no `app/prayer/page.tsx`) → 404.

### App loader and loaders map

- [src/lib/app-loaders.ts](src/lib/app-loaders.ts) — `APP_MODULE_LOADERS` and `PATH_SEGMENT_TO_LOADER_KEY`; keys like `"Christian/prayer"`. Used by (domain) page when `require.context` is null (e.g. in client bundle).
- (domain) page uses `require.context("@/01_App", true, /.*\/[^/]+App\.tsx$/)` at module scope. In the client bundle this may be null or have different keys → fallback to `APP_MODULE_LOADERS`.

### Auth and redirects

- [src/app/lib/auth.ts](src/app/lib/auth.ts) — `pages.signIn` and `pages.error` are `"/prayer"`. NextAuth redirects to `origin + "/prayer"`. On hi-sense.vercel.app that is a non-existent route → 404 (HTML).
- [src/01_App/Christian/Prayer/PrayerApp.tsx](src/01_App/Christian/Prayer/PrayerApp.tsx) — `signInCallbackUrl = pathname ?? prayerBase`; `prayerBase = "/prayer"`. Links to `/api/auth/signin?callbackUrl=...` can send users back to `/prayer`.
- [src/app/org/join/page.tsx](src/app/org/join/page.tsx), [src/app/org/[slug]/page.tsx](src/app/org/[slug]/page.tsx), [src/app/org/[slug]/admin/page.tsx](src/app/org/[slug]/admin/page.tsx) — use `prayerBase = "/prayer"` in `Link`/`href`. Same 404 when no `/prayer` route.
- [src/app/api/prayer-room/create/route.ts](src/app/api/prayer-room/create/route.ts) — `inviteLink = \`${base}/prayer/room/${roomId}`. On root domain,` /prayer/room/...` has no route.

### Base URL and manifest

- [src/lib/app-base-url.ts](src/lib/app-base-url.ts) — `getBaseUrl()` uses `NEXT_PUBLIC_VERCEL_URL ?? VERCEL_URL`; fallback `"https://hi-sense.vercel.app"`. If neither is set (e.g. wrong env), client can get wrong origin; if NEXTAUTH_URL or other env is set to localhost in production, that can explain “localhost in production”.
- [src/app/manifest/route.ts](src/app/manifest/route.ts) — GET returns JSON manifest with `getBaseUrl()` for icon URLs; `start_url: "/"`, `scope: "/"`. If this route 404s or errors, client could receive HTML → “manifest syntax error” when parsed as JSON.
- [src/app/layout.tsx](src/app/layout.tsx) (lines 559–561) — `<link rel="manifest" href="/manifest" />` and favicon/apple-touch use `getBaseUrl()`. Server has `VERCEL_URL`; client needs `NEXT_PUBLIC_VERCEL_URL` for correct base in hydration.

### API routes that must return JSON (HTML → “Unexpected token '<'”)

- [src/app/api/screens/route.ts](src/app/api/screens/route.ts) — GET; uses `getO1AppBase()` (cwd + `findRepoRoot`). On Vercel, `process.cwd()` can differ; if `O1_APP_BASE` is wrong, still returns **JSON** (fallback list). So 404 from this route only if the route itself is not registered (e.g. build issue).
- [src/app/api/screens/[...path]/route.ts](src/app/api/screens/[...path]/route.ts) — GET; returns `NextResponse.json(...)` for 404/500. So **this handler always returns JSON**. “Unexpected token '<'” here means the **request URL** is wrong (e.g. fetch to a page path like `/prayer` or `/christian/prayer` instead of `/api/screens/...`) or an intermediate (e.g. middleware, proxy) returns HTML.
- [src/03_Runtime/engine/core/safe-json-import.ts](src/03_Runtime/engine/core/safe-json-import.ts) — Fetches `\`/api/screens/${normalized}`; then` JSON.parse(text)`. If that URL hits a **page** (e.g. 404 page) or redirect to HTML,` JSON.parse` throws “Unexpected token '<'”.
- [src/app/layout.tsx](src/app/layout.tsx) (lines 286–288) — `fetch("/api/screens", { cache: "no-store" }).then(res => res.ok ? res.json() : Promise.resolve([]))`. If `/api/screens` is 200 with HTML (e.g. wrong server or proxy), `res.json()` throws same error.

### Screen loader (path normalization)

- [src/03_Runtime/engine/core/screen-loader.ts](src/03_Runtime/engine/core/screen-loader.ts) — `loadScreen()`; JSON branch uses `safeImportJson(resolvedPath)`. Path is normalized (strip leading `/`, `src/`, `apps-json/apps/`, etc.). No localhost/hardcoded host in this file.
- [src/01_App/DOMAIN_REFACTOR_REPORT.md](src/01_App/DOMAIN_REFACTOR_REPORT.md) — Documents “path-based routes (unchanged): /prayer → PrayerApp” but **no** corresponding `app/prayer` route exists in the repo.

---

## 3. What is definitely broken vs probably broken


| Item                                                                    | Status                             | Evidence                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/prayer` (and path-based app routes) on root domain                    | **Definitely broken**              | No `app/prayer/page.tsx` or catch-all; only `(domain)/[domain]/[[...path]]` exists, which matches `/christian/...`, not `/prayer`.                                                                                                                                                                           |
| Auth redirect to `/prayer` on production (no subdomain)                 | **Definitely broken**              | auth.ts sets `signIn`/`error` to `"/prayer"`; that URL has no route on hi-sense.vercel.app.                                                                                                                                                                                                                  |
| Links and invite URLs to `/prayer` or `/prayer/room/...` on root domain | **Definitely broken**              | Same missing route.                                                                                                                                                                                                                                                                                          |
| “Unexpected token '<'” when expecting JSON                              | **Definite cause**                 | Some code path requests a URL that returns HTML (e.g. 404 page or wrong path); caller does `response.json()` or `JSON.parse(text)`.                                                                                                                                                                          |
| Navigation going to `/christian/prayer` instead of “domain-based” path  | **Expected given design**          | Middleware rewrites to `/${subdomain}${pathname}`; visible URL can stay as `/prayer` on subdomain, but internal route is `/christian/prayer`. If a link is built with domain in path (e.g. from pathname), you get `/christian/prayer`. So “sometimes /christian/prayer” is consistent with current routing. |
| Base URL / manifest / icons wrong in production                         | **Probably broken** if env missing | getBaseUrl() fallback is hardcoded; client needs NEXT_PUBLIC_VERCEL_URL; NEXTAUTH_URL set to localhost would explain “localhost in production”.                                                                                                                                                              |
| Manifest “syntax error”                                                 | **Probably**                       | Manifest route returns JSON; if request hits 404 or error page (HTML), parsing as JSON fails.                                                                                                                                                                                                                |
| require.context null in client / unstable hot reload                    | **Probable**                       | Client bundle may not expose require.context the same way; (domain) page falls back to APP_MODULE_LOADERS; HMR can re-run and change resolution.                                                                                                                                                             |
| _domain page duplicate                                                  | **Dead code**                      | `_domain` is private in App Router; only `(domain)/[domain]/[[...path]]` is active.                                                                                                                                                                                                                          |


---

## 4. Why previous fixes may have made things worse

- **Domain refactor without path-based fallback:** Introducing `(domain)/[domain]/[[...path]]` and middleware gave correct behavior for subdomains (e.g. christian.hiclarify.com/prayer → /christian/prayer) but left path-based `/prayer` undocumented and **never implemented**. So any link or redirect to `/prayer` on the root domain (e.g. Vercel preview or hi-sense.vercel.app) 404s. “Fixing” by changing links to `/christian/prayer` would work only when that route is served (same app); on root domain `/christian/prayer` exists but `/prayer` does not, so normalizing everything to domain segment helps consistency but does not fix the missing `/prayer` route.
- **Auth pages pointing to `/prayer`:** If production was assumed to always be subdomain, signIn/error set to `/prayer` would work after middleware rewrite. On root domain there is no rewrite and no route → 404. Changing NEXTAUTH_URL or callbackUrl without adding a `/prayer` route (or a redirect) keeps the bug.
- **Heavy layout and single root layout:** Root layout branches on pathname to choose chrome. Adding more pathname checks (e.g. `/prayer`) does not create a route; it only changes chrome. So “fixes” that only touch layout or pathname checks do not resolve 404 for `/prayer`.
- **API/screens and O1_APP_BASE:** If earlier fixes changed cwd or directory layout (e.g. monorepo, Vercel output), `getO1AppBase()` might resolve incorrectly and return fallback list. That would still be JSON; the main risk for “Unexpected token '<'” is fetching a non-API URL.

---

## 5. Universal recovery plan (safest order)

- **Principle:** One universal behavior: “path-based URLs like `/prayer` always work.” On subdomain, middleware can keep rewriting so the same app is served from `/:domain/...` internally; on root domain, `/prayer` must be served by a real route (page or redirect). Prefer one place that decides “use domain segment or path segment” (middleware + one set of pages) rather than app-by-app fixes.

### Phase 1 — Router / loader (no app logic)

1. **Add path-based route(s) so `/prayer` (and optionally other app segments) resolve.**
  - **Option A (recommended):** Add `src/app/prayer/[[...path]]/page.tsx` that:
    - On server/client, resolves domain for “prayer” app (e.g. `domain = "christian"`) and either:
      - Renders the same component as `(domain)/[domain]/[[...path]]` with `domain=christian` and `path=[...path]`, or
      - Redirects to `/${domain}/prayer/...` so a single implementation (the (domain) page) handles it.
  - **Option B:** In middleware, when host has **no** subdomain and pathname is `/prayer` or `/prayer/...`, rewrite to `/christian/prayer` (or configurable default domain). Then existing `(domain)/[domain]/[[...path]]` serves it. No new page file; one place (middleware) for “path → domain path” mapping.
  - Keep path-based URLs stable: `/prayer`, `/prayer/admin`, `/prayer/room/:id`, etc.
2. **Optional: redirect root `/` on production to a default app.**
  - E.g. when no subdomain and no `?screen=`, redirect `/` to `/prayer` or to a landing route. Prevents “blank” root when users expect an app.
3. **Do not remove or break (domain) route.**
  - Subdomain flow stays: host has subdomain → middleware rewrites to `/:domain/...` → (domain) page. Path-based route only ensures that when there is no subdomain, `/prayer` still works.

### Phase 2 — Auth and env

1. **Keep auth redirect to `/prayer`.**
  - Once `/prayer` is a valid route (Phase 1), signIn/error to `"/prayer"` will work on both subdomain and root domain.
2. **Ensure production env:**
  - Do **not** set `NEXTAUTH_URL` to localhost in production. Leave unset so NextAuth uses request host.  
  - Set `NEXT_PUBLIC_VERCEL_URL` (or equivalent) so `getBaseUrl()` is correct on client for manifest and icons.

### Phase 3 — Base URL and manifest

1. **Harden getBaseUrl():**
  - Prefer request host when available (e.g. in route handlers or middleware) so manifest and favicon work for custom domains.  
  - Use `VERCEL_URL` / `NEXT_PUBLIC_VERCEL_URL` only as fallback.
2. **Manifest:**
  - Ensure GET `/manifest` always returns JSON (no HTML). If manifest is behind auth or fails, return 200 + minimal JSON or a safe error JSON, not an HTML error page.

### Phase 4 — Cleanup and stability

1. **Remove or repurpose `_domain` duplicate.**
  - Delete or redirect so only `(domain)/[domain]/[[...path]]` is the domain implementation. Stops confusion and duplicate logic.
2. **Stabilize domain page loader.**
  - Prefer `APP_MODULE_LOADERS` as the single source of truth for (domain) page when resolving `domain + path` → component; treat `require.context` as optional enhancement for dev or avoid relying on it in client. Reduces “app appears then disappears” and HMR quirks.
3. **Guard JSON parsing everywhere API is consumed.**
  - In `safeImportJson`, layout fetch, and any `fetch(...).then(r => r.json())`: check `Content-Type` or catch parse errors and treat as “not JSON” (e.g. show error or fallback) instead of throwing “Unexpected token '<'”. Improves diagnostics and avoids blank screen from a single bad response.

---

## 6. Router/loader vs app-level


| Fix                                                       | Layer                                      | Rationale                                                       |
| --------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| Path-based `/prayer` route or middleware rewrite          | **Router/loader**                          | Defines what URL exists; no app component should invent routes. |
| Default domain for path-based (e.g. “prayer” → christian) | **Router/loader** (middleware or route)    | Single mapping; apps stay domain-agnostic.                      |
| Auth signIn/error URLs                                    | **App-level** (auth config)                | Already `/prayer`; just need the route to exist.                |
| Links in org, PrayerApp, invite                           | **App-level**                              | Keep using `/prayer`; router ensures it resolves.               |
| getBaseUrl() / manifest                                   | **Router/loader** (route handler + layout) | Correct base URL is a global concern.                           |
| Require.context vs APP_MODULE_LOADERS                     | **Router/loader** (domain page)            | Resolution is part of the “loader” that picks the app.          |
| JSON parse guards                                         | **App-level** (consumers of API)           | Call sites that expect JSON should handle non-JSON.             |


---

## 7. Minimal patch sequence to restore a stable baseline

1. **Implement path-based `/prayer` (Phase 1).**
  - **Option B (fastest):** In [src/middleware.ts](src/middleware.ts), if `getSubdomainFromHost(host) === null` and `pathname === "/prayer"` or `pathname.startsWith("/prayer/")`, rewrite to `/christian` + pathname (e.g. `/prayer` → `/christian/prayer`). No new page; (domain) page already handles `domain=christian`, `path=['prayer', ...]`.
  - **Option A:** Add [src/app/prayer/[[...path]]/page.tsx](src/app/prayer/[[...path]]/page.tsx) that reads `params.path`, then renders the same loader used by (domain) with `domain = "christian"` and `path = params.path` (or redirects to `/christian/prayer/...`). More explicit and easier to extend to other path segments (e.g. `/gospel`) later.
2. **Verify auth:** Leave auth as is; after step 1, redirect to `/prayer` will hit the new behavior.
3. **Env:** Document and set `NEXT_PUBLIC_VERCEL_URL` (and no NEXTAUTH_URL in production). Optionally harden `getBaseUrl()` in [src/lib/app-base-url.ts](src/lib/app-base-url.ts) (e.g. from request when in route handler).
4. **Guards:** In [src/03_Runtime/engine/core/safe-json-import.ts](src/03_Runtime/engine/core/safe-json-import.ts) and layout fetch, on `JSON.parse` failure or non-JSON Content-Type, return a structured error or fallback instead of throwing, so one bad response does not blank the screen.
5. **Cleanup:** Remove or clearly mark dead [src/app/_domain/](src/app/_domain/) so only (domain) is used.

---

## 8. No file changes until report is complete

No edits have been made. Implement the minimal patch sequence above only after this report is approved. If you want to proceed with Option A or B first, say which option and we can outline the exact code changes next.