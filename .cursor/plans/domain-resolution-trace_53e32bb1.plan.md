---
name: domain-resolution-trace
overview: Trace strict resolver inputs and filesystem candidates for learn.containercreations.com/landing/landing-v5, then report exact mismatch cause without changing code.
todos:
  - id: trace-host-domain-subdomain
    content: Document host parsing and domain/subdomain folder derivation from strict resolver.
    status: completed
  - id: trace-segment-flow
    content: Document segment flow from page route to resolve-strict API to strict resolver.
    status: completed
  - id: enumerate-candidate-paths
    content: List exact filesystem candidate paths checked for landing/landing-v5.
    status: completed
  - id: state-root-cause
    content: State whether base path is wrong and identify concrete failing condition.
    status: completed
isProject: false
---

# Domain Resolution Trace Report

## Scope

- Analyze only these files:
  - [src/lib/routing/strict-lowercase-router.ts](src/lib/routing/strict-lowercase-router.ts)
  - [src/app/api/screens/resolve-strict/[...path]/route.ts](src/app/api/screens/resolve-strict/[...path]/route.ts)
  - [src/app/(domain)/[domain]/[[...path]]/page.tsx](src/app/(domain)/[domain]/[[...path]]/page.tsx)
- Verify actual route files present on disk under `src/01_App`.
- No edits, no fallback changes, no segment rule changes.

## Findings To Deliver

- Exact host extraction behavior and derived `domainFolder` / `subdomainFolder`.
- Exact segments passed to strict resolver and full candidate paths checked.
- Exact files that exist for `containercreations/learn/landing/landing-v5`.
- Whether resolver incorrectly checks `src/01_App/learn/...`.
- Exact line where base path is wrong, only if wrong.
- Root cause statement in required output format.

## Evidence Anchors

- `parseStrictHost()` derives `domain` and `subdomain`, enforces known root domain mapping.
- `resolveStrictLowercaseRoute()` builds base path as `src/01_App/{domainFolder}/{subdomain}`.
- API route uses `x-forwarded-host` then `host`, and forwards `params.path` segments as-is.
- Page route constructs API path from `params.path` only, which can drop the first URL segment depending on router shape/rewrite.

## Verification Inputs

- Existing files found:
  - `src/01_App/containercreations/learn/landing/landing-v5.json`
- No matching file found under:
  - `src/01_App/learn/landing/landing-v5.*`

