# Path Resolution Contract

**Canonical roots:** All app/screen path resolution is locked to two directories:

- **src/apps-tsx** — TSX screens
- **src/apps-json** — JSON apps (API and loaders use **src/apps-json/apps** for screen JSON)

No aliases or loaders may point to `src/screens` or `src/apps-offline`; those names are retired.

---

## Single source of truth

- **TSConfig** defines path aliases: `@/apps-tsx`, `@/apps-tsx/*`, `@/apps-json`, `@/apps-json/*` → `src/apps-tsx` and `src/apps-json`.
- **Next.js** must not override `@/apps-tsx` (or `@/apps-json`) in `next.config.js` webpack aliases; resolution follows TSConfig / standard resolution.
- **require.context** in `src/app/page.tsx` uses the **physical relative path** `../apps-tsx` (from `src/app/`). The JSON loader in `src/apps-tsx/utils/safe-json-loader.ts` uses `../../apps-json/apps`.

---

## Strict rename/change procedure

Before renaming or moving `apps-tsx` or `apps-json` (or any path that affects screen loading):

1. **Move the folder** to the new location.
2. **Update tsconfig.json** `paths` so `@/apps-tsx` and `@/apps-json` (and their `/*` variants) point to the new paths.
3. **Update all loaders**: `require.context` in `src/app/page.tsx`, and in `src/apps-tsx/utils/safe-json-loader.ts`, to the correct relative path from each file to the new folder. Update any dynamic `import(\`@/apps-tsx/...\`)` if the alias base changes.
4. **Run the validator:** `npm run validate:paths`. Fix any failures.
5. **Build:** `npm run build`. Fix any remaining resolution errors.

Do not skip the validator; it prevents alias drift and missing folders from reaching the build.

---

## Validator

- **Script:** `scripts/validate-paths.js`
- **Command:** `npm run validate:paths`
- **Pre-build:** `prebuild` runs `validate:paths` before `npm run build`.

The script checks: tsconfig path entries and target directories, require.context roots and their targets, and that next.config does not alias `@/apps-tsx` to a non-existent path (e.g. `src/screens`).
