# Domain Architecture Refactor Report

## Detected domains

Domains are folders under `src/01_App` that satisfy:

- Direct child of `src/01_App`
- Name does **not** contain parentheses
- Name does **not** start with `_`
- Name does **not** start with `dead`

**List:** Business, Christian, Plan, Protect, Research, Learn

Subdomain → folder mapping (see `src/lib/domain-config.ts`):

| Subdomain  | Folder    |
|-----------|-----------|
| christian | Christian |
| business  | Business  |
| plan      | Plan      |
| protect   | Protect   |
| research  | Research  |
| learn     | Learn     |

---

## Renames

- `(live) Business` → **Business**
- `(live) Gospel` → **Christian**

---

## Generated placeholder modules

| File                         | Renders                      |
|-----------------------------|------------------------------|
| `Plan/PlanApp.tsx`          | "Plan module coming soon"    |
| `Protect/ProtectApp.tsx`     | "Protect module coming soon" |
| `Research/ResearchApp.tsx`   | "Research module coming soon"|
| `Learn/LearnApp.tsx`         | "Learn module coming soon"   |

---

## Domain root entry points

- **Christian:** `Christian/ChristianApp.tsx` — landing with links to Prayer and Discipleship.
- **Business:** `Business/BusinessApp.tsx` — landing with links to Container Creations and Prayer Stream.

---

## Routing logic added

1. **Middleware** (`src/middleware.ts`)
   - Reads `host` from request.
   - Parses subdomain for `*.hiclarify.com` or `*.localhost` (e.g. `christian.localhost`).
   - If subdomain is a known domain key, rewrites to `/_domain/<subdomain>` or `/_domain/<subdomain>/<pathname>`.
   - Does not rewrite for `/api`, `/_next`, `/icons`.

2. **Dynamic route** (`src/app/_domain/[domain]/[[...path]]/page.tsx`)
   - Receives `domain` (e.g. `christian`) and optional `path` (e.g. `['prayer']`).
   - Maps domain to folder via `getFolderForSubdomain()`.
   - Resolves component via `DOMAIN_MODULE_LOADERS` (e.g. `Christian`, `Christian/prayer`, `Christian/discipleship`, `Business`, `Plan`, `Protect`, `Research`, `Learn`).
   - Renders the resolved component or "Module not found" / "Unknown domain".

3. **Domain layout** (`src/app/_domain/layout.tsx`)
   - Wraps domain pages with `SessionProvider` and `ThemeProvider` so subdomain routes (e.g. Prayer) have the same context as path-based `/prayer`.

---

## Path-based routes (unchanged)

Existing routes still work and import from the new paths:

- `/prayer` → `@/01_App/Christian/Prayer/PrayerApp`
- `/gospel` → `@/01_App/Christian/Discipleship/GospelDiscipleship`
- `/prayer-stream` → `@/01_App/Business/Prayer_Stream/PrayerStreamOnboarding`
- `/flow`, `/container-creations` → Business modules

---

## Example subdomain URLs

- `christian.hiclarify.com` → Christian landing
- `christian.hiclarify.com/prayer` → Prayer app
- `christian.hiclarify.com/discipleship` → Gospel Discipleship
- `business.hiclarify.com` → Business landing
- `plan.hiclarify.com` → "Plan module coming soon"
- Local dev: `christian.localhost`, `christian.localhost/prayer`, etc.
