# Plan 1 — Blueprint / Compiler Contract and Gaps

**Purpose:** Define contract and gaps for Blueprint and site compiler; align API vs app wiring and schema/outputs.

**Scope:** `src/lib/site-compiler/`, `src/lib/site-skin/` (compile path), `src/app/api/sites/[domain]/*`, `src/scripts/websites/`, schema and JSON outputs.

**Non-negotiables:**
- Layout ≠ Compiler: compiler produces schema/screen JSON; layout consumes it at runtime.
- No silent fallbacks in compiler output; missing data must be explicit or documented.
- API routes are URL-invoked; no requirement to be in static import graph from app seed.

**Current runtime summary:**
- Compiler: compileSiteToSchema, normalizeSiteData, compileSiteToScreenModel; used by API handlers and scripts. API: GET/POST per route (sites, schema, screen, pages, skins, onboarding, normalized, debug, brand). Status: Wired by URL; unreachable from seed by design.

**Required outputs:**
- Contract doc: inputs, outputs, schema for compiler and each API route.
- Gaps: missing validation, error handling, or docs.
- Optional: single "compiler entry" re-export for static reachability if desired.

**Verification checklist:**
- [ ] Contract doc exists and lists all public compiler APIs and API routes.
- [ ] Gaps list has no runtime code change requirement in this plan (docs only).
- [ ] Separation of concerns: compiler does not mutate Layout/State.

---

## Verification Report (Step 1)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
