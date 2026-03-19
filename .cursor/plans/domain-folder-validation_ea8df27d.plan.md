---
name: domain-folder-validation
overview: Validate the folder-system domain/subdomain/route/filename mapping for containercreations landing-5 and hiclarify prayerapp, report current mismatches, then apply targeted fixes so resolver-driven rendering always uses the folder system (no guessing, no pre-gates).
todos: []
isProject: false
---

## Validation report (current repo state)

### Step-system you described (01_App folder system)

- Domain folder under `src/01_App/` is the root domain.
- Next folder is the subdomain.
- Next folder is the route folder (the URL path prefix after the host).
- Next is the screen filename stem (case-insensitive match).
- JSON vs TSX is determined by which file extension exists in that folder.

### What works / mostly works

1. `learn.containercreations.com/ContainerCreationsLanding-5` (landing-5, single segment)
  - Middleware rewrites the host correctly into the `(domain)/[domain]/[[...path]]` route.
  - Resolver `resolve/[...path]` has host-aware logic for `segments.length === 1` and (for containercreations root) forces `routeFolder = "landing"`.
  - It scans `src/01_App/ContainerCreations/Learn/landing` with `readdirSync` and matches the slug stem case-insensitively.
  - This means the folder-system location for landing-5 can be produced correctly.

### Critical mismatches (why “nothing is working properly”)

A) Domain page passes the wrong resolver input when the URL has a route folder

- Current domain page logic passes only the first path segment to the resolver:
  - For `learn.containercreations.com/landing/ContainerCreationsLanding-5`, it passes `"landing"` as the resolver input instead of `"landing/ContainerCreationsLanding-5"`.
  - For `christian.hiclarify.com/prayer/PrayerApp` (or `.../prayer/prayerapp`), it passes only `"prayer"`.
- Result: resolver cannot apply the folder-system contract “route folder then filename” because the route folder and filename stem are split across segments.

B) Resolver’s folderPath derivation does not follow your folder-system contract for hiclarify/route+filename inputs

- `resolve/[...path]` currently assumes (for `segments.length > 1`) that the incoming segments represent domainFolder/subdomainFolder/routeFolder, not routeFolder/filename.
- Your URL path only contains route-folder + filename, while domain/subdomain must come from the host.
- So for hiclarify routes, folderPath can become incorrect.

C) TSX resolution is looking in the wrong root

- Resolver TSX resolution currently checks `TSX_ROOT = src/01_App/(dead) Tsx`.
- But your prayerapp TSX (and likely other canonical TSX) lives in the live folder-system (e.g. `src/01_App/HIClarify/Christian/Prayer/PrayerApp.tsx`).
- This prevents the resolver from correctly returning `{ type: "tsx" }` for prayerapp.

D) Resolver `resolved.path` format is not aligned to your “no .json in the domain path” requirement

- JSON resolver currently returns a `path` that includes the `.json` filename.
- Your intended pipeline expects resolver `path` to be in the `/api/screens/{path}` format without a `.json` suffix.

## Targeted fixes

1. Fix the domain page resolver request input

- File: `[src/app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx)`
- Change resolver call from resolving only `pathSegments[0]` to resolving the full URL path segments:
  - `/api/screens/resolve/${pathSegments.join("/")}`
- This makes the resolver always receive the “route folder + filename stem” input.

1. Rework resolver folderPath derivation to match your folder-system contract for BOTH JSON and TSX

- File: `[src/app/api/screens/resolve/[...path]/route.ts](src/app/api/screens/resolve/[...path]/route.ts)`
- Implement a single contract:
  - Domain/subdomain derive from host (root + subdomain)
  - Route folder derives from URL segments (default routeFolder when only filename stem is given)
  - Filename stem matches by scanning the resolved folder.
- Ensure `segments.length === 1` does NOT allow folderPath to ever become `src/01_App` root.

1. Implement TSX detection from the live folder-system (not `(dead) Tsx`)

- In resolver, when scanning the live folder:
  - If a matching `.tsx` exists, return `{ type: "tsx", path: loaderKey }`
  - If a matching `.json` exists, return `{ type: "json", path: jsonRequestPathWithoutExtension }`

1. Ensure resolver output `path` matches the API request contract

- For `type === "json"`:
  - Return `resolved.path = "<DomainFolder>/<SubdomainFolder>/<routeFolder>/<fileStem>"` (no `.json`)
- For `type === "tsx"`:
  - Return `resolved.path` equal to the `APP_MODULE_LOADERS` key (e.g. `"HIClarify/Christian/prayer"`).

1. Extend resolver runtime assertion tests to validate BOTH folder systems

- Update the existing runtime assertion logic to include:
  - landing-5 folderPath
  - prayerapp folderPath under `src/01_App/HIClarify/Christian/Prayer`
- The tests must assert the computed `folderPath` is the correct folder-system target and throw if root is used.

## Mermaid: expected end-to-end contract

```mermaid
flowchart LR
UserURL[User URL] -->|
```



