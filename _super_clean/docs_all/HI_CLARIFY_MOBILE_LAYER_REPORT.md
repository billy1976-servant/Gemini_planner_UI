# HI Clarify → HI Sense: Mobile Layer Reuse Assessment

**Scope:** Phone install (PWA / add to home screen), app skin/fullscreen, contact picker, download/install behavior, cross-device continuity.  
**Constraint:** Read-only analysis; no files modified.

---

## 1. What Was the Old HI Clarify App?

| Aspect | Answer |
|--------|--------|
| **PWA?** | **Yes.** It has a Web App Manifest, service worker(s), and install prompt logic. |
| **Hybrid app?** | **Optional.** Capacitor is present (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor-community/contacts`) for native builds; the app runs as **browser/PWA-first** and uses Capacitor only when `Capacitor.isNativePlatform()` is true (e.g. for contacts). |
| **Native wrapper?** | **Optional.** Same as above; no `capacitor.config.*` found in repo—Capacitor is used as an optional enhancement (contacts, future native builds). |
| **Browser-only?** | **Primary.** The main experience is a Vite-built React SPA served in the browser, installable as a PWA. |

**Verdict:** **PWA-first, with optional Capacitor for native builds and device contacts.** No Cordova.

---

## 2. Install System

### What created the “download to phone” experience?

| Mechanism | Role |
|-----------|------|
| **manifest** | **Primary.** `public/manifest.json` and Vite PWA plugin duplicate manifest (name, short_name, display: standalone, start_url, scope, icons 192/512, theme_color, orientation: portrait, shortcuts, screenshots). |
| **service worker** | **Required for install.** Registration in `src/utils/serviceWorkerRegistration.js` (registers `/sw.js` in production). Two SW files exist: root `sw.js` (Firebase messaging only) and `public/sw.js` (full: cache, push, background sync). Vite copies `public/` to build output, so deployed `/sw.js` is typically `public/sw.js`. |
| **install prompt** | **Yes.** `src/App.jsx` listens for `beforeinstallprompt`, stores the event, shows an “Install App” button when `canInstall`, and calls `installPrompt.prompt()` on click. Also handles `appinstalled`. |
| **External wrapper** | **No.** No separate native wrapper required for “add to home screen”; it’s standard PWA install. |

### Key files – install

- `public/manifest.json` – PWA manifest (standalone, icons, shortcuts).
- `vite.config.js` – VitePWA plugin with manifest + Workbox (autoUpdate, cleanupOutdatedCaches, navigateFallbackDenylist for `/api/`).
- `index.html` – `<link rel="manifest" href="/manifest.json" />`, theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-title, viewport.
- `src/utils/serviceWorkerRegistration.js` – Registers `/sw.js` (production only), passes `VITE_FIREBASE_MESSAGING_SENDER_ID` in query.
- `src/App.jsx` (lines ~902–1012, ~2424–2458) – `beforeinstallprompt` / `appinstalled`, `showIosInstallHint` / `showAndroidInstallHint`, “Install App” button and iOS/Android A2HS hints (“Share → Add to Home Screen” / “menu ⋮ → Add to Home screen”).
- `public/sw.js` – App shell caching, fetch (cache-first for same-origin, network-first for `/api/`), push, notificationclick, background sync (sync-habits, sync-relationships), IndexedDB helpers for habits/auth.
- `sw.js` (project root) – Firebase Cloud Messaging in SW (background messages). Config from `self.__FIREBASE_CONFIG__` (injected in `index.html`).

**Note:** Vite PWA can generate its own Workbox SW; the app explicitly registers `/sw.js`, and `public/sw.js` is what gets served from that path. So the “install” behavior is driven by **manifest + one of the two SW files** (likely `public/sw.js` when deployed).

---

## 3. Skin / App-Shell Layer

### What created the “skin” feeling?

| Mechanism | Role |
|-----------|------|
| **Fullscreen mode** | **Manifest:** `display: "standalone"` (no browser chrome). **In-app:** ScriptureTagger has a fullscreen editor mode (`.rte-container.fullscreen`, fixed overlay); JourneyLanding uses `allowFullScreen` for iframe. |
| **Viewport config** | `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`. ScriptureGenerator and test-notifications also set viewport in their context. |
| **Custom shell layout** | **Yes.** Single full-screen shell in `App.jsx`: main content area + fixed top-right (auth + PWA install hints + “Install App” button) + **BottomNavBar** fixed at bottom (Habit, People, Journey, Calendar, Overview). History sync so Android back button moves between views. |
| **OS-style navigation** | **Bottom nav only.** No OS navigation bar control beyond what `standalone` gives; bottom nav is custom (Tailwind, icons, feature flags). |

### Key files – skin / shell

- `public/manifest.json` – `display: "standalone"`, `orientation: "portrait"`.
- `vite.config.js` – PWA manifest `display: 'standalone'`.
- `index.html` – viewport, theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-mobile-web-app-title.
- `src/App.jsx` – Root layout: main content + fixed top-right controls + `BottomNavBar` (lines ~618–689), history sync for back button (~858–895), standalone detection for install hints (~981, ~993).
- `src/components/relationship2.jsx` – Inner `.bottom-nav` and bottom-nav-item styles (relationship sub-views).
- `src/components/JourneyLanding.jsx` – Overrides for `.bottom-nav` sizing on small screens.
- `src/components/ScriptureTagger.jsx` – Fullscreen editor (VisualViewport, mobile keyboard), viewport-aware toolbar.

---

## 4. Contact Integration

### Where is it implemented?

- **API layer:** `src/lib/capacitorContacts.js` – single source for device contacts.
- **Hook:** `src/hooks/useDeviceContacts.js` – `supported`, `granted`, `requestPermission`, `fetchContacts(limit)`, `loading`, `contacts`, `error`.
- **UI:** `src/components/relationship2.jsx` – uses `useDeviceContacts()`, `handleConnectContacts` (e.g. around line 1256), to pick contacts for campaigns.

### Is it Web Contacts API? Custom UI only? Native bridge?

| Environment | Implementation |
|-------------|----------------|
| **Native (Capacitor)** | `@capacitor-community/contacts`: `ContactsPlugin.getContacts()` with projection (name, phones, emails); permission via `ContactsPlugin.requestPermissions()`. Used when `Capacitor.isNativePlatform()` and plugin is present. |
| **Web fallback** | **Contact Picker API:** `navigator.contacts.select(props, opts)` (Chromium/Android). Comment notes iOS Safari usually not supported. |
| **Custom UI only** | **No.** Picker is either native plugin or Web Contact Picker API; no manual contact list UI in this layer. |

**Verdict:** **Capacitor native contacts when available; otherwise Web Contact Picker API (Chromium/Android).** Not “custom UI only.”

---

## 5. Persistence Layer

### How did it keep state between sessions?

| Mechanism | Where used |
|-----------|------------|
| **localStorage** | Habits fallback (`habits:master` in App.jsx); questionnaire answers (questionnaite.jsx); relationship2 (save/load, `app_initialized_v2`, compose state in sessionStorage); dayview2 (DAY_STORAGE_KEY); JourneyLanding (journal keys, journeyProgressV2); weeklyView (calendarDataByWeek, dayTypes, linkedEvents); NewJourneyBuilder/Drafts (`njb:pendingDraft`). |
| **sessionStorage** | relationship2.jsx – compose state (composeKey) for draft messages. |
| **IndexedDB** | **Service worker only.** `public/sw.js`: `hiclarifyDB` with object stores `habits` and `auth`; used for background sync (pending habits) and auth token in SW. |
| **Firebase** | **Primary server persistence:** Firestore (tasks, journey_drafts, journey_templates, template_steps, user prefs, campaigns, slides, etc.), Firebase Auth, Firebase Storage (slide images). See `src/lib/firebaseClient.js`, `firebaseSlides.js`, and many components. |

**Verdict:** **Firebase for cloud/user data; localStorage/sessionStorage for local UI and offline fallbacks; IndexedDB only inside the SW for sync and auth token.**

---

## 6. Reusable Components

| Component / layer | Reusability | Notes |
|------------------|-------------|--------|
| **manifest.json** | **Copy and adapt** | Change name/short_name to HI Sense, point icons/start_url to HI Sense. Structure (standalone, icons, shortcuts) is standard. |
| **Install prompt logic (App.jsx)** | **Extract and refactor** | Self-contained: beforeinstallprompt, appinstalled, iOS/Android hints, Install button. No HI Clarify business logic; only `notify()`. Move to a small hook or component and reuse. |
| **serviceWorkerRegistration.js** | **Copy and refactor** | Thin wrapper; only env (e.g. FCM sender id) is app-specific. Can stay or be replaced by Vite PWA’s registration if HI Sense uses it. |
| **public/sw.js** | **Refactor** | Contains app-specific cache list, Firebase config injection, habit sync API (`/api/habits/sync`), IndexedDB schema (`hiclarifyDB`, habits/auth). For HI Sense: strip Firebase/FCM or replace with HI Sense backend; generalize cache list and sync tags or drop custom sync. |
| **Root sw.js** (Firebase FCM) | **Replace** | Tied to Firebase; HI Sense would use its own push/SW or none. |
| **capacitorContacts.js + useDeviceContacts** | **Copy with minimal change** | Pure adapter: Capacitor + Web Contact Picker. No HI Clarify domain logic. Works in any React app. |
| **index.html meta tags** | **Copy** | Viewport, theme-color, apple-mobile-web-app-*, manifest link—generic. |
| **BottomNavBar / shell layout** | **Reference only** | Concept (fixed bottom nav, history sync) is reusable; implementation is embedded in App.jsx and HI Clarify views. Rebuild in HI Sense’s layout system rather than copy-paste. |
| **Standalone detection** | **Reuse pattern** | `(display-mode: standalone)` + `navigator.standalone` (iOS)—small snippet, reuse as-is. |

---

## 7. Non-Portable Pieces

| Piece | Reason |
|------|--------|
| **Firebase (auth, Firestore, FCM, Storage)** | HI Sense has different backend and auth; no direct reuse of firebaseClient, firebaseSlides, or FCM in SW. |
| **public/sw.js** | Hardcoded cache list (e.g. `/src/App.jsx`), HI Clarify API paths, IndexedDB schema and sync-habits/sync-relationships logic. |
| **Root sw.js** | Firebase-only; not portable. |
| **App.jsx** | Monolithic: routing, views, habits, campaigns, install UI, auth, nav. Only the install and standalone-detection bits are worth extracting. |
| **Vite PWA plugin config** | Tied to Vite; HI Sense may use Next or other stack—manifest and SW strategy need to be reimplemented in that stack. |
| **IndexedDB in SW** | Schema and usage are HI Clarify-specific; any offline/sync in HI Sense should define its own schema. |

---

## 8. Risk Areas

- **Dual SW files:** Root `sw.js` (FCM) vs `public/sw.js` (cache + push + sync). Registration is `/sw.js`; build/deploy determines which file is served. Unify or clearly choose one for HI Sense to avoid confusion.
- **Vite vs manual SW:** Vite PWA can generate a Workbox SW; the app also has a manual `public/sw.js`. Possible overlap or overwrite at build time; clarify which SW is authoritative in production.
- **Firebase in index.html:** `self.__FIREBASE_CONFIG__` is injected for the root `sw.js`; if that SW is not used or FCM is removed, this can be removed.
- **Contact Picker support:** Web Contact Picker is limited (Chromium/Android); iOS Safari generally not supported. Capacitor native is needed for reliable iOS contacts.
- **Persistence spread:** Many components touch localStorage with ad-hoc keys; no single abstraction. Reusing “patterns” is fine; copying keys/schemas would couple HI Sense to HI Clarify data shapes.

---

## 9. Estimated Hours to Port into HI Sense

| Task | Range (hours) | Notes |
|------|-----------------------|------|
| Manifest + meta tags + icons | 1–2 | Copy, rename, point to HI Sense. |
| Install prompt + A2HS hints | 2–3 | Extract from App.jsx into hook/component; integrate in HI Sense shell. |
| Service worker (cache-only or cache + push) | 3–6 | New SW for HI Sense (or use framework’s PWA plugin); no Firebase/FCM; optional push with HI Sense backend. |
| Contact picker (Capacitor + Web fallback) | 2–4 | Copy capacitorContacts + useDeviceContacts; add to HI Sense; optional Capacitor project if building native. |
| App shell / bottom nav / standalone UX | 4–8 | Reimplement in HI Sense layout (different structure); history/back sync. |
| Persistence | 0 (reuse pattern) | HI Sense already has persistence; no port of Firebase or HI Clarify keys. |
| **Total (focused port)** | **~12–23** | Assumes HI Sense stack known; no full app migration. |

---

## 10. Final Verdict

### Can we safely copy these parts?

- **Yes, with minimal edits:** `public/manifest.json` (then rename and fix assets), `index.html` PWA meta tags, `src/lib/capacitorContacts.js`, `src/hooks/useDeviceContacts.js`.
- **Yes, after refactor:** Install prompt + A2HS logic (extract from App.jsx into a small module), `serviceWorkerRegistration.js` (or replace with framework’s registration).

### Should we refactor them?

- **Yes:** Service worker—drop Firebase/FCM and HI Clarify-specific cache/sync; keep only generic cache + optional push for HI Sense.
- **Yes:** Install UI—keep behavior, move to a dedicated component/hook so it’s not buried in the main app.

### Should we rebuild them clean?

- **Shell / nav:** Yes. Bottom nav and history sync are good patterns but tightly bound to App.jsx and HI Clarify views. Rebuild in HI Sense’s layout and routing.
- **Push/background sync:** Rebuild for HI Sense backend if needed; don’t reuse FCM or habit-sync logic.

### Which files are the core mobile layer?

1. `public/manifest.json`
2. `index.html` (viewport + PWA meta + manifest link)
3. `src/utils/serviceWorkerRegistration.js`
4. `public/sw.js` (concept and structure; implementation must be HI Sense–specific)
5. `src/App.jsx` (install state + handlers + BottomNavBar + history sync + standalone checks—only these slices)
6. `src/lib/capacitorContacts.js`
7. `src/hooks/useDeviceContacts.js`
8. `vite.config.js` (VitePWA block—or equivalent in HI Sense’s build)

---

## Top 10 Files Most Responsible For…

### Phone install

1. `public/manifest.json`
2. `src/utils/serviceWorkerRegistration.js`
3. `public/sw.js` (or Vite-generated SW)
4. `src/App.jsx` (install prompt, canInstall, showIosInstallHint, showAndroidInstallHint, handleInstallClick, Install / A2HS UI)
5. `index.html` (manifest link, theme-color, apple-mobile-web-app-*)
6. `vite.config.js` (VitePWA manifest + Workbox)

### Skin

1. `public/manifest.json` (display: standalone)
2. `src/App.jsx` (root layout, BottomNavBar, fixed top-right controls)
3. `index.html` (viewport, theme-color, apple-mobile-web-app-capable, status-bar-style)
4. `src/components/relationship2.jsx` (inner bottom-nav styles)
5. `src/components/JourneyLanding.jsx` (bottom-nav overrides for small screens)

### Continuity

1. `src/App.jsx` (history pushState/popstate sync with activeView for Android back)
2. `public/sw.js` (background sync: sync-habits, sync-relationships; IndexedDB habits/auth)
3. `src/lib/firebaseClient.js` (auth + Firestore—cross-session state)
4. `src/utils/notificationService.js` (FCM token registration, server-side push)
5. `src/hooks/usePushNotifications.js` (subscribe/unsubscribe to notifications)

### Mobile experience

1. `src/App.jsx` (standalone detection, install hints, bottom nav, history sync)
2. `public/manifest.json` (standalone, orientation, icons)
3. `index.html` (viewport, theme-color, apple-* meta)
4. `src/components/relationship2.jsx` (bottom-nav, useDeviceContacts, touch-friendly UI)
5. `src/lib/capacitorContacts.js` (native + Web Contact Picker)
6. `src/hooks/useDeviceContacts.js` (contacts in UI)
7. `src/components/ScriptureTagger.jsx` (fullscreen editor, VisualViewport, mobile keyboard)
8. `src/components/JourneyLanding.jsx` (responsive bottom-nav, share)
9. `public/sw.js` (offline cache, app shell)
10. `src/utils/serviceWorkerRegistration.js` (SW registration in production)

---

*End of report. No files were modified.*
