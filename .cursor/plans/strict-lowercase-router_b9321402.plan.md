---
name: strict-lowercase-router
overview: Introduce a brand-new strict router that maps host + URL segments directly to a lowercase filesystem path, then switch the current domain page to use this new resolver endpoint. Keep all legacy resolver/domain-config/fallback code untouched, and add a lowercase content mirror under src/01_App to satisfy the contract.
todos:
  - id: add-strict-router-util
    content: Create strict host+path parser and exact filesystem resolver utility (lowercase-only, no fallback)
    status: completed
  - id: add-strict-resolve-endpoint
    content: Implement new /api/screens/resolve-strict/[...path] route using the strict utility
    status: completed
  - id: switch-domain-page-fetch
    content: Point domain page resolve fetch to new strict endpoint while keeping legacy files untouched
    status: completed
  - id: create-lowercase-content-mirror
    content: Add required lowercase domain/subdomain/route/file content paths under src/01_App
    status: completed
  - id: verify-contract
    content: Validate JSON and TSX examples plus uppercase/missing-file hard error behavior
    status: completed
isProject: false
---

# Strict Lowercase Router Plan

## Objective

Implement a new, isolated routing path where URL == filesystem path (lowercase, exact match, no transforms/fallbacks), then route the current domain page through it.

## New Router Contract

- Host format: `{subdomain}.{domain}.com` (e.g. `learn.containercreations.com`, `christian.hiclarify.com`).
- URL path format: `/{route}/{file}` (exactly two segments after host).
- Filesystem base: `src/01_App/{domain}/{subdomain}/{route}/{file}`.
- File type resolution (strict order):
  1. If `{file}.json` exists => resolve as JSON.
  2. Else if `{file}.tsx` exists => resolve as TSX.
  3. Else throw hard error (no fallback).
- Required logs on each request: `host`, `domain`, `subdomain`, `route`, `file`, `fullPath`.

## Implementation Steps

- Add a new resolver utility module for strict parsing and path construction only (no shared legacy imports):
  - Parse and validate host into `domain` and `subdomain`.
  - Validate all extracted segments are lowercase; throw on any uppercase.
  - Build exact full path candidates for `.json` and `.tsx` under lowercase base.
  - Return typed payload `{ type: "json" | "tsx", path, resolvedFilePath }`.
- Add a new API route endpoint that uses the new utility and returns resolver payload for the page client:
  - New file under `src/app/api/screens/resolve-strict/[...path]/route.ts`.
  - No fallback behavior, no registry/domain-config calls, no case conversion.
- Switch current domain page fetch from `/api/screens/resolve/...` to `/api/screens/resolve-strict/...` so runtime uses the new router immediately:
  - Update only request target and expected payload handling in [src/app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx).
  - Leave all old resolver/domain-config files in place but unused by this flow.

## Lowercase Content Migration

- Create a lowercase mirror for the paths required by strict routing under `src/01_App`:
  - `src/01_App/containercreations/learn/landing/landing-v5.json`
  - `src/01_App/hiclarify/christian/prayer/prayer-app.tsx` (or matching exported TSX entrypoint for prayer route)
- Ensure filenames and folders are all lowercase in this strict tree.
- Do not alter existing mixed-case legacy trees; keep them as legacy artifacts.

## Validation

- API-level checks:
  - `learn.containercreations.com/landing/landing-v5` resolves to JSON path.
  - `christian.hiclarify.com/prayer/prayer-app` resolves to TSX path.
  - Any uppercase in host/path throws explicit error.
  - Missing file throws explicit error.
- Runtime check in domain page:
  - JSON route still renders through `ExperienceRenderer`.
  - TSX route still loads via module loader contract.

## Key Files

- New strict resolver API route: [src/app/api/screens/resolve-strict/[...path]/route.ts](src/app/api/screens/resolve-strict/[...path]/route.ts)
- New strict resolver utility: [src/lib/routing/strict-lowercase-router.ts](src/lib/routing/strict-lowercase-router.ts)
- Domain page integration point: [src/app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx)
- Lowercase content tree base: [src/01_App](src/01_App)

