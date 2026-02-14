# Android Launch Status — HI Sense

**Generated:** Fast path to live + Android (no refactors, no PWA rebuild).

---

## Build status: **PASS**

- Production build completes: `npm run build` ✓
- Prebuild (validate:paths) passes ✓
- TypeScript and lint pass ✓
- Static/SSG pages generate ✓

---

## Vercel readiness: **PASS**

- **No localhost hardcoding** in app code; API paths are relative.
- **No dev-only URLs** required for core app.
- **Optional env:** Google Ads API keys only needed for `/api/google-ads/*` routes.

### Checklist

| Item | Status |
|------|--------|
| Ready for Vercel | **YES** |
| Missing env vars | None required for core app. Optional: `GOOGLE_ADS_*` (see `.env.example`) |
| Blocking issues | None |

### `.env.example`

- Created at project root.
- Documents optional `GOOGLE_ADS_*` vars; no other env required for deploy.

---

## Capacitor installed: **YES**

- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`

---

## Android platform created: **YES**

- `npx cap add android` ✓
- `android/` project present ✓
- `npx cap sync android` ✓

---

## Web build path used

- **Next.js:** build output is `.next` (server build).
- **Capacitor:** `webDir` is `cap-build` (minimal stub with `index.html`).
- **Loading the app in the WebView:** use **server URL** in Capacitor config (see below).

To have the Android app load your real app:

1. **After deploying to Vercel:** in `capacitor.config.ts`, set:
   ```ts
   server: { url: 'https://YOUR_VERCEL_URL.vercel.app', cleartext: true },
   ```
2. Run `npx cap sync android` again.
3. Open Android Studio and run the app; the WebView will load your live site.

For **local testing** (with `npm run build && npm run start`):

- Emulator: `server: { url: 'http://10.0.2.2:3000', cleartext: true }`
- Physical device: use your machine’s LAN IP, e.g. `http://192.168.1.x:3000`

---

## Commands to run next

### 1. Build web

```bash
npm run build
```

### 2. Sync Capacitor (after changing `server.url` if needed)

```bash
npx cap sync android
```

### 3. Open Android Studio

```bash
npx cap open android
```

If Android Studio is not at the default path, set `CAPACITOR_ANDROID_STUDIO_PATH` or open the `android/` folder manually in Android Studio (File → Open → select `android`).

### 4. Build installable APK

- In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
- Debug APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Install on a device: copy the APK to the phone and open it, or use **Run** (green play) with a connected device or emulator.

### 5. Run on device/emulator

- In Android Studio: Run (green play) to emulator or connected device.
- Ensure `capacitor.config.ts` has `server.url` set to your deployed URL or local URL (see above).

---

## Summary

- **Build:** PASS  
- **Vercel:** PASS (no blocking env; optional Google Ads only)  
- **Capacitor:** Installed and Android platform added  
- **Web for Android:** Use `server.url` in `capacitor.config.ts` pointing to your Vercel URL (or local URL for testing).  
- No refactors, PWA rebuild, or template/layout/engine changes were made.
