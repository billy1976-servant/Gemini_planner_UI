# Phase 02 Alignment Report — Resolver Unification

**Gate:** Alignment check before Round 2 Phase 02 (no runtime code changes).  
**Sources:** MASTER_ROUND2_PLAN.md, execution_plans/02_resolver_unification.md, system-architecture/02_RUNTIME_PIPELINE.md, src-refactor/00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md.

---

## 1. Contract Restatement

**Spine order and responsibility (authoritative):**

- **JSON Screen → Engines → State → Layout → Renderer → Final Screen.** Data flows in that order; nothing bypasses the trunk.

**Rules (in own words):**

1. **JsonRenderer boundary:** JsonRenderer must not implement or host layout *decision* logic. It may only call the Layout API (e.g. resolveLayout, applyProfileToNode, getDefaultSectionLayoutId). Layout *selection* and *resolution* live in Layout, not in the renderer.
2. **Layout as single authority:** Layout is the one place that chooses and resolves layout (section layout id, molecule layout, presets). No other module may duplicate that responsibility.
3. **Engines do not render:** Engines read JSON and/or state and write state/outputs only. They do not render UI or own persistence.
4. **State is current truth:** State is the runtime truth layer. Persistence (event stream, storage) is a separate concern; state is minimal, derivable, and replaceable.
5. **One trunk pipeline:** There is exactly one main runtime pipeline. Any other paths (e.g. flow-loader, GeneratedSiteViewer, SiteSkin) must be explicitly labeled “secondary” and must not duplicate trunk logic.
6. **Contract changes additive only:** Changes to contracts/schemas are additive unless explicitly approved; no silent breaking changes.

---

## 2. Phase 02 Intent Summary

- **Content resolution:** Ensure no runtime import of `content/content-resolver.ts`; all content resolution goes through `@/logic/content/content-resolver` (resolveContent).
- **Landing and education:** Confirm `landing-page-resolver` and `education-resolver` use only `@/logic/content/content-resolver`.
- **Legacy content-resolver:** Remove `content/content-resolver.ts` or keep it as a stub with @deprecated and no used exports; document content/*.content.json usage if kept.
- **Calc-resolver:** Remove `logic/runtime/calc-resolver.ts` from the main path or document it as “optional; no main-path callers”; if kept, add a comment and avoid dead imports.
- **Reachability/tests:** Leave reachability and tests unchanged or update them to match the above; no new trunk pipeline or duplicate authority.

---

## 3. Alignment Matrix

| Contract Rule | Phase 02 action(s) that satisfy it (file/function level) | Risk / Drift | Required adjustment |
|---------------|-----------------------------------------------------------|--------------|----------------------|
| 1. JsonRenderer no layout decision logic | Phase 02 does not touch JsonRenderer, layout, or engine/core. No layout code is added to the renderer. | None. | None. |
| 2. Layout single authority | Phase 02 does not add or change layout resolvers. Content and calc resolution are unrelated to layout. | None. | None. |
| 3. Engines do not render UI | Phase 02 unifies content entrypoint to logic/content and removes/documents calc-resolver. Both are data/resolution only; no UI rendering. | None. | None. |
| 4. State = current truth; persistence separate | No state or persistence changes. Content and calc resolution feed data/state; they do not redefine state or persistence. | None. | None. |
| 5. No second trunk pipeline | Phase 02 reduces entrypoints (one content resolver, calc-resolver removed or marked optional). No new pipeline or duplicate trunk. | None. | None. |
| 6. Contract changes additive only | No schema or contract API changes. Only removal/stub of legacy files and import path verification. Stub/deprecation is additive (old file points to new one). | None. | None. |

---

## 4. No-Drift Checklist

| Item | Result |
|------|--------|
| Any layout decision code moving *into* JsonRenderer? | **NO** |
| Any new resolver that duplicates an existing authority? | **NO** |
| Any changes that create a second trunk pipeline? | **NO** |
| Any non-additive schema/contract changes? | **NO** |

---

## 5. Go/No-Go Decision

**Decision: GO.**

No drift identified. Phase 02 aligns with the spine and all six contract rules. No minimal plan edits required.

**Exact files Phase 02 will touch (planning only; no code changes in this gate):**

| File / scope | Planned action |
|--------------|----------------|
| `src/content/content-resolver.ts` | Remove or stub (already stubbed with @deprecated; confirm no used exports and optionally remove file). |
| `src/logic/runtime/landing-page-resolver.ts` | Verify: uses only `@/logic/content/content-resolver` (already does per grep). |
| `src/logic/content/education-resolver.ts` | Verify: uses only `./content-resolver` (logic/content). |
| `src/logic/runtime/calc-resolver.ts` | Remove or add top-level doc comment: "Optional; not on main JSON screen path." |
| Any test or script that imported `content/content-resolver` or `calc-resolver` | Update imports or expectations; grep before removal. |

**Note:** HIClarify – Master Architecture Document (Level 10 Execution Edition) was found at `src-refactor/00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md` and was used for spine and engine/state/layout/renderer boundaries. No conflict with Phase 02.

---

*Report produced for alignment gate only. Execution of Phase 02 (code changes) is not part of this deliverable.*
