# JSON-Driven Violations (Generated)

Flags: **Hardcoded layout ID arrays**, **hardcoded registry lists**, **hardcoded capability allow-lists**, **silent fallbacks or invented IDs**.

**Rules:** No runtime code changes; report only. Every finding includes file path, function name, line range when possible.

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Hardcoded layout ID arrays | 0 (dropdown uses getLayout2Ids) | — |
| Hardcoded registry / slot lists | 4 | FLAG |
| Hardcoded capability allow-lists | 3 | FLAG |
| Silent fallbacks / invented IDs | 2 | FLAG |

**Overall:** PASS_WITH_GAPS (violations flagged; no layout ID arrays in resolver).

---

## 1. Hardcoded layout ID arrays

| Location | Finding | File | Line |
|----------|---------|------|------|
| Section layout dropdown | Uses `getLayout2Ids()` from layout (page-layouts/template data); not hardcoded | `src/dev/section-layout-dropdown.tsx` | L41 |
| Resolver | getDefaultSectionLayoutId from template; no inline array of layout IDs | `src/layout/resolver/layout-resolver.ts`, `src/layout/page/page-layout-resolver.ts` | — |

**Verdict:** PASS. No hardcoded layout ID arrays in production path. Dropdown is capability-driven via getLayout2Ids().

---

## 2. Hardcoded registry / slot lists

| Location | Finding | File | Line |
|----------|---------|------|------|
| Slot names by type | Inline object: button, section, card, toolbar, list, footer with fixed slot arrays | `src/engine/core/json-renderer.tsx` | L151–156 |
| Param-key-mapping test | Same slot map duplicated for tests | `src/contracts/param-key-mapping.test.ts` | L20–29 |
| Blueprint script | avatar, chip, field, modal, footer, card slot arrays | `src/scripts/blueprint.ts` | L31–41 |
| handlers.json | text, audio, video, image, data, file, system — domain slot lists | `src/engine/core/handlers.json` | L21–27 |

**Verdict:** FLAG. Slot names (surface, label, trigger, etc.) are hardcoded in json-renderer and blueprint. Should be driven by a JSON registry or schema so new types/slots don’t require code edits.

---

## 3. Hardcoded capability allow-lists

| Location | Finding | File | Line |
|----------|---------|------|------|
| NON_ACTIONABLE_TYPES | `new Set(["section", "field", "avatar"])` — types that don’t get action behavior | `src/engine/core/json-renderer.tsx` | L190 |
| layout-store allowedTypes | `new Set(["column", "row", "grid", "stack", "page"])` — allowed layout types | `src/engine/core/layout-store.ts` | L99 |
| LAYOUT_NODE_TYPES | `new Set(["Grid", "Row", "Column", "Stack"])` — layout node types for collapse | `src/engine/core/collapse-layout-nodes.ts` | L8 |
| template-profiles criticalRoles / optionalRoles | `["header", "footer"]`, `["hero", "features", "pricing", ...]` | `src/lib/layout/template-profiles.ts` | L558, L566 |
| page-layout-resolver capabilities | hero-split-image-right/image-left capability arrays | `src/layout/page/capabilities.ts` | L23–24 |
| param-key-mapping test validTypes | `new Set(["Section", "Button", "Card", ...])` | `src/contracts/param-key-mapping.test.ts` | L143 |

**Verdict:** FLAG. Allow-lists should be capability-driven (e.g. from layout requirements JSON or registry) so new layout types or node types don’t require code changes.

---

## 4. Silent fallbacks or invented IDs

| Location | Finding | File | Line |
|----------|---------|------|------|
| screen-loader | Comment: "This prevents silent fallback into old systems." — no silent fallback in code; comment only | `src/engine/core/screen-loader.ts` | L33 |
| json-renderer defaultState | "fallback to defaultState for initial render" — reactive state vs defaultState; documented, not invented ID | `src/engine/core/json-renderer.tsx` | L231 |
| getDefaultSectionLayoutId | When no template or no defaultLayout returns undefined; Section compound then renders div wrapper. Not "invented" ID; explicit undefined. | `src/layout/page/page-layout-resolver.ts` | L72 |
| ensureInitialView | When !state?.currentView, dispatchState("state:currentView", { value: defaultView }) — defaultView is passed in; not invented. | `src/state/state-store.ts` | — |
| json-skin.engine | "Find sections without conditions (default/fallback sections)" — content logic, not layout ID invention | `src/logic/engines/json-skin.engine.tsx` | L73 |

**Verdict:** PASS_WITH_GAPS. No silent invented layout IDs in resolver. Fallbacks are explicit (undefined, or defaultView from caller). Comment in screen-loader is preventative; no active silent fallback found.

---

## Verification

| Check | Result |
|-------|--------|
| All findings have file path | PASS |
| Function name or line range where possible | PASS |
| PASS / FAIL / PASS_WITH_GAPS | PASS (overall PASS_WITH_GAPS) |
| No runtime code changes | PASS (report only) |

---

*Generated. Deterministic. Regenerate when code or registries change.*
