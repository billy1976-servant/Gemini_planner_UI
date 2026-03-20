# Google Login Root-Cause Audit and Fix

## A. Root cause

1. **Auth stack:** This app uses **NextAuth (Auth.js)** with the **Google provider** only. No Firebase/Clerk/Supabase for the Prayer app login; Firebase exists only for mobile and is separate.

2. **OAuth flow:** Click "Sign in with Google" ΓåÆ `signIn("google", { callbackUrl: "/prayer" })` ΓåÆ NextAuth redirects to Google ΓåÆ Google redirects to **NEXTAUTH_URL + `/api/auth/callback/google`**. If `NEXTAUTH_URL` is wrong or that URL is not in Google ConsoleΓÇÖs Authorized redirect URIs, the callback fails or the app crashes.

3. **"TypeError: Failed to fetch" in getGroups():**
   - **Cause:** The failure is **not** caused by auth itself. It happens when the **Prayer app** loads and calls `getGroups()` to load the groups list. If that request fails (network down, wrong origin, CORS, or **stale bundle** still using raw `fetch`), the promise can throw and the app crashes.
   - **Fix applied:** All group-loading paths use `safeFetch` and try/catch; `getGroups()` and `getGroupBySlug()` never throw. The app shows an empty list and stays stable. Clearing `.next` and restarting the dev server ensures the fixed code runs.

4. **Why it looked like ΓÇ£loginΓÇ¥:** The Prayer page runs `getGroups()` on mount. If you click ΓÇ£Login with GoogleΓÇ¥ and then the redirect lands back on `/prayer`, the page remounts and runs `getGroups()` again. If that fetch threw (e.g. old bundle), the error overlay appeared and felt like ΓÇ£login failed.ΓÇ¥

5. **Middleware:** Does **not** rewrite `/api/*`. So `/api/auth/[...nextauth]` and `/api/auth/callback/google` are served as-is. No fix needed there.

---

## B. Files changed

| File | Change |
|------|--------|
| `src/app/lib/auth.ts` | Startup logging: which env vars are missing; exact Google callback URL to add in Cloud Console. No crash on missing vars. |
| `src/01_App/Christian/Prayer/utils/safeFetch.ts` | Validate URL; log non-OK and request failures with `[safeFetch]` prefix. Still never throws. |
| `.env.local.example` | **Created.** Exact variable names and instructions; required Google redirect URI(s). |
| `src/01_App/Christian/Prayer/GOOGLE_OAUTH_AUDIT.md` | **This file.** Root cause, env vars, callback URL, commands. |

**Already in place (no change):**
- `getGroups()` and `getGroupBySlug()` in `prayer-api.ts` use `safeFetch` + try/catch and return `[]` / `null`.
- PrayerApp initial load wraps `getGroups()` in try/catch and uses a cancelled flag.
- `PrayerAuthControls` uses `callbackUrl: "/prayer"`; sign-in link uses `?callbackUrl=%2Fprayer`.

---

## C. Exact env variables required (Google login)

Set these in **`.env.local`** (Next.js loads it in dev):

| Variable | Required | Example / note |
|----------|----------|----------------|
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud Console ΓåÆ Credentials ΓåÆ OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Same OAuth client |
| `NEXTAUTH_SECRET` | Yes | e.g. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes for local dev | `http://localhost:3000` or `http://christian.localhost:3000` |

**Not used for Prayer Google login:** `AUTH_SECRET` (Auth.js v5); Firebase vars; Clerk; Supabase.

---

## D. Exact localhost callback URL for Google Cloud

In **Google Cloud Console** ΓåÆ **APIs & Services** ΓåÆ **Credentials** ΓåÆ your **OAuth 2.0 Client ID** ΓåÆ **Authorized redirect URIs**, add **exactly** one of these (must match the origin you use in the browser and `NEXTAUTH_URL`):

- **If you use `http://localhost:3000`:**
  ```
  http://localhost:3000/api/auth/callback/google
  ```
- **If you use `http://christian.localhost:3000`:**
  ```
  http://christian.localhost:3000/api/auth/callback/google
  ```

Use the same origin in `NEXTAUTH_URL` and in the browser. Do not mix `localhost` and `127.0.0.1`.

---

## E. Commands to run

1. **Generate a secret (if you donΓÇÖt have one):**
   ```bash
   openssl rand -base64 32
   ```
   Put the result in `.env.local` as `NEXTAUTH_SECRET=...`.

2. **Copy env template and fill:**
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local`: set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (e.g. `http://localhost:3000` or `http://christian.localhost:3000`).

3. **Clear Next.js cache and restart (so the safe getGroups code runs):**
   ```bash
   rm -rf .next
   npm run dev
   ```
   On Windows PowerShell:
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run dev
   ```

4. **In Google Cloud Console:** Add the redirect URI from section D that matches your `NEXTAUTH_URL`.

5. **Test:** Open the app at the same URL as `NEXTAUTH_URL`, click ΓÇ£Sign in with GoogleΓÇ¥. After redirect, the app should load without a ΓÇ£Failed to fetchΓÇ¥ crash; if the groups API is down, you get an empty list and a console `[safeFetch]` warning.
