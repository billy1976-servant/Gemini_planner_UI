# Mobile Capability Status

**Project:** HiSense (Android wrapper for HI Clarify)  
**Last updated:** Patch completion — mobile capability layer only.

---

## Phase A — Gap Scan (Pre-Patch)

| Path / area | Status | Notes |
|-------------|--------|-------|
| `src/mobile/nativeCapabilities.*` | PARTIAL | Existed; missing `isNativePlatform()`, `requestCameraPermission()`, `requestContactsPermission()`. |
| `src/mobile/camera.*` | PARTIAL | Existed (`takePhoto`); missing `takePicture()`, `pickFromGallery()`, return shape `{ webPath, base64String }`. |
| `src/mobile/filesystem.*` | PARTIAL | Existed (`readFile(path)`, `writeFile(path)`); missing `saveFile(name, data)` and Documents-based `readFile(name)`. |
| `src/mobile/install/*` | EXISTS | `InstallPromptUI.tsx`, `useInstallPrompt.ts`. |
| `src/mobile/contacts/*` | PARTIAL | `useDeviceContacts`, `capacitorContacts` existed; **savePickedContacts** (transformation layer) was MISSING. |
| `src/mobile/auth/*` | EXISTS | Not touched (Firebase auth wiring). |

---

## Status Summary

| Capability | Status | Notes |
|------------|--------|------|
| **Camera** | READY | `takePicture()`, `pickFromGallery()`, `takePhoto()`; return `{ webPath, base64String }`; guarded by `isNativePlatform()`. |
| **Filesystem** | READY | `saveFile(name, data)`, `readFile(name)` (Documents), `writeFile(path, data)`; native only. |
| **Contacts Picker** | READY | `useDeviceContacts`, `capacitorContacts`, `savePickedContacts` (transformation only). |
| **Permissions Layer** | READY | `requestCameraPermission()`, `requestContactsPermission()` in `nativeCapabilities.ts`. |
| **Auth** | READY | Existing Firebase auth wiring — not modified. |
| **Android Wrapper** | READY | Capacitor base setup — not modified. |

---

## Implemented in This Patch

- **nativeCapabilities.ts:** `isNativePlatform()`, `requestCameraPermission()`, `requestContactsPermission()` (Capacitor only; no UI).
- **camera.ts:** `takePicture()`, `pickFromGallery()`; result shape `{ webPath, base64String }`; uses `isNativePlatform()`.
- **filesystem.ts:** `saveFile(name, data)` writing to app Documents; `readFile(name)` reading from Documents.
- **contacts/savePickedContacts.ts:** Pure normalization of picked contacts to `{ name, phone, email }[]`; no Firestore.

---

## Not Touched (Per Instructions)

- Firebase config
- AuthModal / auth flow
- Manifest / PWA / Service worker
- Capacitor config
- Layout engine / JSON runtime
- Relationship system / Firestore
- Existing contacts hook (`useDeviceContacts`, `capacitorContacts`)
