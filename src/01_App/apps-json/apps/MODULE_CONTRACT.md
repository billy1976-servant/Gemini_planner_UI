# Canonical Module Contract — Blueprint + Content Only

**Single true exporter:** `apps/<category>/<module>/` with `blueprint.txt` + `content.txt` → `compileApp()` → `app.json` + `content.manifest.json`.

No alternate pipelines. No alternate filenames. No inferred structures.

---

## Valid module shape (ONLY)

Inside `src/01_App/apps-json/apps/**` each compilable module folder must have:

| File          | Purpose                          |
|---------------|----------------------------------|
| `blueprint.txt` | Structure contract (required)   |
| `content.txt`   | Content keyed by rawId (required)|

**Outputs** (written by compiler only):

- `app.json`
- `content.manifest.json`

---

## Rejected patterns (do not use in apps/)

- `content.manifest.txt` — use `content.txt` only; manifest is generated
- `master-business.blueprint.txt` or any `*.blueprint.txt` other than `blueprint.txt`
- Non-standard blueprint filenames — only `blueprint.txt` is read

---

## Exporter scope (compileApp)

- **Reads only:** `blueprint.txt`, `content.txt`
- **Writes only:** `app.json`, `content.manifest.json`
- **Does not:** support alternate filenames, master blueprint loading, module trees, or inference. Exporter remains dumb and deterministic.

---

## New app workflow

1. Copy a template folder (e.g. `templates/doctor`) under `apps/<category>/<name>/`
2. Ensure `blueprint.txt` and `content.txt` are present
3. Edit content as needed
4. Run: `npm run blueprint <category>/<name>` or POST to `/api/compile-app` with `{ "action": "compile", "appPath": "<category>/<name>" }`

Nothing else involved.
