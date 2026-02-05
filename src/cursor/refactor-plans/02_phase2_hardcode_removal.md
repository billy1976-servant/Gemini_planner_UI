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
