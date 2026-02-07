# Path Resolution Audit

**Date:** 2025-02-07  
**Scope:** Apps/screens path aliases, require.context, dynamic imports, physical folders. No code changes in this phase.

---

## 1. TSConfig path aliases (apps-tsx / apps-json)

| Alias | Current value | Notes |
|-------|----------------|--------|
| `@/apps-tsx` | `["src/apps-tsx"]` | Present |
| `@/apps-tsx/*` | `["src/apps-tsx/*"]` | Present |
| `@/apps-json` | *(missing)* | Only `@/apps-json/*` exists |
| `@/apps-json/*` | `["src/apps-json/*"]` | Present |

**baseUrl:** `"."` (project root).

---

## 2. Next.config.js webpack alias overrides

| Alias | Current override | Resolves to |
|-------|------------------|-------------|
| `@/apps-tsx` | `path.resolve(__dirname, "src/screens")` | **src/screens** |

**Problem:** Webpack overrides TSConfig. At build/runtime, `@/apps-tsx` resolves to **src/screens**, which **does not exist**. This is the primary cause of path resolution failure.

---

## 3. require.context(...) occurrences

| File | Line | Root argument | Resolved from file | Folder exists? |
|------|------|---------------|--------------------|----------------|
| `src/app/page.tsx` | 64–67 | `"../../apps-tsx"` | From `src/app/`: `../../` = project root → **root/apps-tsx** | **No** (apps-tsx is under src). Should be `../apps-tsx` → `src/apps-tsx`. |
| `src/apps-tsx/utils/safe-json-loader.ts` | 7–11 | `"../../apps-json/apps"` | From `src/apps-tsx/utils/`: `../../apps-json/apps` = **src/apps-json/apps** | **Yes** |

---

## 4. Dynamic import(`@/apps-tsx/...`) occurrences

| File | Line | Expression | Resolves via | Current effective path |
|------|------|------------|--------------|------------------------|
| `src/app/page.tsx` | 81 | `` import(`@/apps-tsx/${normalized}`) `` | Webpack alias | **src/screens** (missing) |
| `src/apps-tsx/core/ScreenRenderer.tsx` | 57 | `` import(`@/apps-tsx/config/${screenId}.screen.json`) `` | Webpack alias | **src/screens** (missing) |

All other dynamic imports in the repo use `@/engine/*`, `@/state/*`, etc., not apps-tsx/apps-json.

---

## 5. Physical folder existence

| Path | Exists |
|------|--------|
| **src/apps-tsx** | **Yes** |
| **src/apps-json** | **Yes** |
| **src/screens** | **No** |
| **src/apps-offline** | **No** |

---

## 6. Root cause

- **Next.js webpack** overrides `@/apps-tsx` to **src/screens**. That folder does not exist (legacy name; canonical location is **src/apps-tsx**). So any `import("@/apps-tsx/...")` or dynamic `` import(`@/apps-tsx/...`) `` at build/runtime resolves to a missing directory.
- **TSConfig** correctly points `@/apps-tsx` to `src/apps-tsx`, but webpack takes precedence during the build, so alias drift between TSConfig and Next causes silent breakage.
- **require.context** in `src/app/page.tsx` uses `"../../apps-tsx"`, which from `src/app/` resolves to project-root-level `apps-tsx`, which does not exist. The correct relative path to `src/apps-tsx` from `src/app/page.tsx` is `"../apps-tsx"`.

**Summary:** Removing the webpack override for `@/apps-tsx` and fixing the require.context root to `"../apps-tsx"` aligns resolution with the physical layout and makes TSConfig the single source of truth.
