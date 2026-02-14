# AUTH DEBUG REPORT — Why GoogleLoginButton is not visible on localhost:3000

## 1) Is .env.local being loaded?

**Check:** `console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)` was added inside `GoogleLoginButton` (as `[GoogleLoginButton] NEXT_PUBLIC_FIREBASE_API_KEY defined?`).

**Finding:** You will only see this log when the component is mounted. On **localhost:3000** the component is **never mounted** (see below), so the log will not appear there. To verify env loading, open **localhost:3000/dev** and check the browser console for `[GoogleLoginButton] NEXT_PUBLIC_FIREBASE_API_KEY defined? true/false`.

- **Answer:** Unknown on `/` (component not mounted). To confirm: use `/dev` and check console; if `true`, env is loading.

---

## 2) Is GoogleLoginButton actually mounted?

**Where it is imported:**  
`src/app/dev/page.tsx` (line 59):  
`import GoogleLoginButton from "@/app/components/GoogleLoginButton";`

**Where it is rendered:**  
`src/app/dev/page.tsx` (lines 836–838), inside the branch that returns `WebsiteShell` with `content={<> <GoogleLoginButton /> ... </>}`.

**Root route `src/app/page.tsx`:**  
Does **not** import `GoogleLoginButton` or `WebsiteShell`. It has no reference to either.

**Conclusion:**  
- **On localhost:3000 (route `/`):** The page is `src/app/page.tsx`. **GoogleLoginButton is NOT mounted.**  
- **On localhost:3000/dev (route `/dev`):** The page is `src/app/dev/page.tsx`. **GoogleLoginButton IS mounted** (inside WebsiteShell content).

**Where it SHOULD be mounted for “homepage”:**  
If “homepage” means the root URL, the login UI would need to be rendered from `src/app/page.tsx`. Currently that file renders only the journal screen (`apps/journal_track/journal_replicate-2`) inside a plain `div` + `ExperienceRenderer` — no shell, no login component.

---

## 3) Does firebaseClient initialize?

**When it runs:** `getFirebaseAuth()` is called only inside `GoogleLoginButton`’s `useEffect`. So it runs only when that component is mounted.

**On localhost:3000:** The component is never mounted → `getFirebaseAuth()` is never called → Firebase is never initialized on `/`.

**On localhost:3000/dev:** The component mounts → `getFirebaseAuth()` runs. A debug log was added: `[GoogleLoginButton] getFirebaseAuth() result: initialized | null`. If you see `null`, Firebase did not initialize (e.g. missing or invalid env). If you see `initialized`, Firebase is initializing.

**firebaseClient.ts behavior:**  
- Returns `null` when `typeof window === "undefined"` (SSR).  
- Returns `null` when `!firebaseConfig.apiKey || !firebaseConfig.projectId`.  
- Otherwise initializes the app and returns Auth. No throw — failures would be silent unless you log.

**Answer:**  
- On `/`: Firebase does **not** run (component not mounted).  
- On `/dev`: Check console for the new log; that tells you if Firebase is initializing there.

---

## 4) Page routing — which route has WebsiteShell? What does localhost:3000 show?

**Which route contains WebsiteShell:**  
**`/dev`** — implemented in `src/app/dev/page.tsx`. That page has the full shell/navigator flow and renders `WebsiteShell` with `GoogleLoginButton` in its content.

**What localhost:3000 (/) actually serves:**  
**`src/app/page.tsx`.** That page:

- Does **not** use `WebsiteShell`, `PreviewStage`, or any shell.
- Does **not** use `resolveLandingPage()` or URL `?screen=`.
- Hardcodes: `USER_APP_SCREEN_PATH = "apps/journal_track/journal_replicate-2"`.
- Loads that JSON screen and renders it with `ExperienceRenderer` inside a single `div`.

So **localhost:3000 is the journal test page** and **bypasses the shell entirely**. The login button was added to the shell flow in **/dev**, so it never appears on **/**.

---

## 5) Summary — findings only

| Question | Answer |
|----------|--------|
| **Is env loading?** | Unknown on `/` (no component there). Check on **/dev** in console: `[GoogleLoginButton] NEXT_PUBLIC_FIREBASE_API_KEY defined?` → if `true`, env is loading. |
| **Is component mounted?** | **No** on localhost:3000. **Yes** on localhost:3000/dev. |
| **Is Firebase initializing?** | **No** on `/` (component never mounts). On **/dev**, check console: `[GoogleLoginButton] getFirebaseAuth() result:` → `initialized` or `null`. |
| **Which page actually contains the login?** | **localhost:3000/dev** (`src/app/dev/page.tsx`). **localhost:3000** (`src/app/page.tsx`) is the journal-only page and does not contain the login UI. |

**Root cause:**  
The login UI is not visible on localhost:3000 because the root route (/) uses a different page (`app/page.tsx`) that renders only the journal screen and never mounts `GoogleLoginButton` or `WebsiteShell`. The login button exists and is mounted only on the **/dev** route.
