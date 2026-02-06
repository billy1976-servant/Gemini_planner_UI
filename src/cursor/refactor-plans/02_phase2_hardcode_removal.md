# Phase 2 — Hardcoded Surface Removal

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 2 (stages 2.1–2.9); Part I B (Gaps 1–7, 8–9 related to defaults), E (Do First #2–5).

---

## Goal

Remove or source all hardcoded option lists and invented defaults from JSON/registry.

---

## Files Expected to Change

- `src/engine/core/behavior-listener.ts`, `config/` or `src/behavior/*.ts`
- `src/state/layout-store.ts` (or layout-store), page-layouts.json or layout-types.json
- `src/engine/core/json-renderer.tsx`, contract or config
- `src/engine/core/collapse-layout-nodes.ts` (or layout), component-layouts.json or defs
- `src/engine/core/json-renderer.tsx`, compounds/ui or contract (EXPECTED_PARAMS)
- `src/engine/core/template-profiles.ts` (or layout/template-profiles), template or profile JSON
- `src/state/state-store.ts`, config or landing resolver
- `src/organs/organ-registry.ts`, organ variant JSON
- palette-store, palette-resolver, `src/palettes`, docs

---

## Exact Refactor Actions

1. **2.1** — Move contract verb list to JSON or one constant; behavior-listener reads from it (no inline array).
2. **2.2** — setLayout allowedTypes from data; no hardcoded Set in layout-store.
3. **2.3** — NON_ACTIONABLE_TYPES from contract/JSON (no hardcoded Set in json-renderer).
4. **2.4** — LAYOUT_NODE_TYPES from layout/registry (collapse list single source).
5. **2.5** — EXPECTED_PARAMS from definitions/contract (no hardcoded map in json-renderer).
6. **2.6** — Template criticalRoles/optionalRoles from data (no inline arrays in template-profiles).
7. **2.7** — ensureInitialView default from config/JSON or omit; no invented "|home".
8. **2.8** — Organ registry: list and variant map from manifest/JSON or document extend-only.
9. **2.9** — Palette list and resolution from JSON or document.

---

## What Must NOT Change

- Branch order; runBehavior; interpretRuntimeVerb fallback; layout store subscribe/notify
- shouldStripBehavior; Registry lookup; hasLayoutNodeType/collapseLayoutNodes; logParamsDiagnostic; renderNode
- template merge logic; dispatchState; deriveState; persist; loadOrganVariant; resolve-organs; usePaletteCSS; resolveParams

---

## Acceptance Criteria

- No inline array of contract verbs.
- allowedTypes derived from data.
- No hardcoded NON_ACTIONABLE_TYPES, LAYOUT_NODE_TYPES, or EXPECTED_PARAMS.
- No inline template role arrays.
- No hardcoded "|home".
- Single source or documented for organs and palettes.

---

## Risk Level

**MED** (2.1, 2.2, 2.6, 2.7, 2.8); **LOW** (2.3, 2.4, 2.5, 2.9)

---

## Dependencies

None (Phase 1 doc fixes recommended first)

---

## Verification Report (Step 1)

**Plan Name:** Phase 2 — Hardcoded Surface Removal

**Scope:** Remove or source all hardcoded option lists and invented defaults from JSON/registry. Changes: behavior-listener, layout-store, json-renderer, collapse-layout-nodes, template-profiles, state-store, organ-registry (docs), palette-store (docs); new modules and config/contract JSON only. Branch order, runBehavior, interpretRuntimeVerb fallback, shouldStripBehavior, Registry lookup, hasLayoutNodeType/collapseLayoutNodes, template merge logic, dispatchState, deriveState, persist, loadOrganVariant, resolve-organs, usePaletteCSS, resolveParams unchanged.

**Date:** 2026-02-04

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | ✅ PASS |
| No forbidden changes made | ✅ PASS |
| No unexpected side effects | ✅ PASS |
| All files referenced exist | ✅ PASS |

### Detailed Findings

**What was verified**

- **2.1** — Contract verb list moved to `src/behavior/contract-verbs.ts` (CONTRACT_VERBS, inferContractVerbDomain). behavior-listener imports it; no inline array.
- **2.2** — `src/lib/layout/layout-allowed-types.json` added; layout-store imports it and uses LAYOUT_ALLOWED_TYPES; no hardcoded Set.
- **2.3** — `src/config/renderer-contract.json` added with nonActionableTypes; json-renderer imports it for NON_ACTIONABLE_TYPES.
- **2.4** — `src/layout/layout-node-types.ts` added (LAYOUT_NODE_TYPES); collapse-layout-nodes imports and re-exports; single source.
- **2.5** — `src/contracts/expected-params.ts` added (EXPECTED_PARAMS); json-renderer and param-key-mapping.test import it; no hardcoded map in json-renderer.
- **2.6** — `src/lib/layout/template-roles.json` added (criticalRoles, optionalRoles); template-profiles imports TEMPLATE_CRITICAL_ROLES and TEMPLATE_OPTIONAL_ROLES; no inline arrays.
- **2.7** — `src/config/state-defaults.json` added (defaultInitialView: "|home"); state-store imports and uses it in ensureInitialView; fallback "|home" only if key missing.
- **2.8** — organ-registry.ts and organs/README.md updated: single source and extend-only documented.
- **2.9** — palette-store.ts updated: palette list and resolution documented as single source @/palettes.

**Files changed / added**

- **New:** `src/behavior/contract-verbs.ts`, `src/lib/layout/layout-allowed-types.json`, `src/config/renderer-contract.json`, `src/layout/layout-node-types.ts`, `src/contracts/expected-params.ts`, `src/lib/layout/template-roles.json`, `src/config/state-defaults.json`.
- **Modified:** `src/engine/core/behavior-listener.ts`, `src/engine/core/layout-store.ts`, `src/engine/core/json-renderer.tsx`, `src/engine/core/collapse-layout-nodes.ts`, `src/contracts/param-key-mapping.test.ts`, `src/lib/layout/template-profiles.ts`, `src/state/state-store.ts`, `src/organs/organ-registry.ts`, `src/organs/README.md`, `src/engine/core/palette-store.ts`.

**Gaps / follow-up**

- Build fails in an unrelated file (`src/app/api/google-ads/client.ts` type error); Phase 2 code compiles and lints clean. Blueprint script still uses literal `DEFAULT_VIEW = "|home"`; could later align with state-defaults.json if script can load config.
