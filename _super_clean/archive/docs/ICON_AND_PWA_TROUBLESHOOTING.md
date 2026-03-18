# Icon and PWA troubleshooting

## Web / PWA icon not updating on phone

After deploying icon or manifest changes:

- **Clear site data**: On the phone, open browser settings for the site and clear site data (or uninstall the PWA and re-add to home screen) so the new manifest and icon URLs are fetched.
- The app serves the manifest at `/manifest` with absolute icon URLs and `Cache-Control: public, max-age=0, must-revalidate` to reduce caching issues.

## Android launcher icon not updating

If the **home-screen app icon** (native launcher) looks wrong or unchanged:

- Do a **clean Android build**: From the `android` directory run `./gradlew clean`, then build/sync and reinstall the app so the system picks up the new `ic_launcher_foreground` drawable.
