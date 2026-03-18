# _super_clean — Consolidation Index

**Goal:** Collapse non-runtime clutter into one container. Nothing deleted; only moved/archived.  
**Timestamp:** 2026-02-16

---

## Moves (original path → new path)

| Original path | New path |
|--------------|----------|
| `e2e/` | `_super_clean/tests/e2e/` |
| `tests/` | `_super_clean/tests/tests/` |
| `test-results/` | `_super_clean/tests/results/` |
| `playwright-report/` | `_super_clean/reports/playwright/` |
| `.next/` | `_super_clean/archive/.next/` |
| `artifacts/` | `_super_clean/archive/artifacts/` |
| `cap-build/` | `_super_clean/archive/cap-build/` |
| `docs/` | `_super_clean/archive/docs/` |
| `architecture/` | `_super_clean/archive/architecture/` |
| `system-architecture/` | `_super_clean/archive/system-architecture/` |
| `src-refactor/` | `_super_clean/experimental/src-refactor/` |
| `config/` | `_super_clean/configs/config/` |

---

## Layout

- **archive/** — Build artifacts (`.next`, `artifacts`, `cap-build`), doc systems (`docs`, `architecture`, `system-architecture`)
- **tests/** — Test/QA: `e2e/`, `tests/`, `results/` (from test-results)
- **reports/** — `playwright/` (from playwright-report)
- **configs/** — `config/` (from root config)
- **experimental/** — `src-refactor/`

## Left in root (unchanged)

- `src/`, `public/`, `api/` (if exists)
- `package.json`, `package-lock.json`, `vite.config.js`, `index.html`
- `.env*`, `.gitignore`, `node_modules/`, `vercel.json`, `sw.js`

No imports, code, or runtime folders were modified.
