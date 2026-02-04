# Blueprint Compiler System

**Primary Architecture Reference:** docs/SYSTEM_MASTER/

---

## Pipeline

```
blueprint.txt + content.txt  (per app folder)
        ↓
npm run blueprint  →  src/scripts/blueprint.ts
        ↓
app.json  (+ optional content.manifest.json)
        ↓
Served via /api/screens/*  →  loadScreen  →  JsonRenderer
```

---

## Inputs

- **Per-app folder:** `src/apps-offline/apps/<category>/<folder>/`
  - `blueprint.txt` — Structure: APP name, section hierarchy, roles, molecule types, content slot names.
  - `content.txt` — Content key-value per node (label, title, body, media, etc.).

---

## Compiler behavior

- **Script:** `src/scripts/blueprint.ts` (run via `npm run blueprint` or equivalent).
- **Output:** `app.json` in the same app folder. Root is a screen tree: sections, roles, children, content, params. No layout ids are written by the compiler; layout is resolved at runtime from template + overrides.
- **Content manifest:** Optional `content.manifest.json` generation; contract-derived allowed content keys per molecule type. Validation: warn on invented or missing keys (no hard fail).
- **Contract:** Compiler uses ALLOWED_CONTENT_KEYS derived from molecule contract. It does **not** yet parse contract behavior tokens (e.g. `(tap|go)`) or slot lists from blueprint; behavior in app.json may still use legacy forms normalized at runtime.

---

## Runtime path after compile

- app.json is served by `/api/screens/<path>` when path matches the app folder.
- `loadScreen(path)` fetches JSON, applies default state if state empty, returns node tree.
- `page.tsx` builds effective profile (experience + template), loads overrides from section-layout-preset-store and organ-internal-layout-store, passes tree + profile + overrides to JsonRenderer. Layout ids are applied at render time only.

---

## Websites vs apps

Same pipeline. Difference is **experience** (website | app | learning), **template** (which defaultSectionLayoutId and section layouts), and **shell** (WebsiteShell, AppShell, LearningShell). Same app.json can be rendered as website or app by changing layout store experience and template.
