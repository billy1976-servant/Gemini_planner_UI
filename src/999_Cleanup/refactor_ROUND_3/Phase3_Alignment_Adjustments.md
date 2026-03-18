# Phase 3 — Alignment Adjustments

**Purpose:** Align all Phase 3 (Round 3) plans with the hardened architecture rules (TRUNK_ARCHITECTURE_TARGET Section 0). No code changed in this step; plan documents only.

---

## 1. Verification summary

Scanned: `src/refactor_ROUND 3/` (MASTER_PLAN.md, MASTER_ROUND3_PLAN.md, execution_plans 01–05, TRUNK_ARCHITECTURE_TARGET.md).

- **Renderer boundary:** No phase step adds logic or new imports into JsonRenderer. Phase 03 and 05 were updated so they explicitly require no layout/preset/config resolution in the renderer and include renderer-boundary verification in the integrity pass.
- **Layout authority:** Phase 03 previously allowed "layout/data or lib/layout" without stating that layout/ is the only public API. Adjusted so that layout/ remains the sole public API and lib/layout is internal only; no new direct imports to lib/layout from renderer or app.
- **Second pipeline:** No step introduces a second pipeline. Phase 01 documents single pipeline only.
- **Logic in JsonRenderer:** No step adds resolution logic into JsonRenderer. Phase 03 acceptance criteria now explicitly state that no step may add layout/preset/config resolution into JsonRenderer.

---

## 2. Document patches applied

### 2.1 execution_plans/03_json_surface_compression.md

- **Objective 1:** Added authority rule: "layout/ is the ONLY public API; lib/layout is internal implementation. No new direct imports to lib/layout from renderer or app. Loaders that read layout JSON are part of layout/ surface only."
- **Acceptance criteria:** Added: "No step adds layout/preset/config resolution into JsonRenderer; all such resolution remains via @/layout only (hard rule)."

### 2.2 execution_plans/05_final_integrity_pass.md

- **Objective 2:** Added verification of renderer boundary and layout authority: "Renderer boundary: JsonRenderer imports only @/layout, @/state, registry, behavior contract; no @/lib/layout, no preset/molecule resolvers, no config readers. Layout authority: all layout resolution via @/layout only."
- **Acceptance criteria:** Added: "Renderer boundary verified (no forbidden imports in JsonRenderer). Layout authority verified (no app/renderer direct imports to lib/layout)."

### 2.3 No changes required

- **01_pipeline_unification.md** — Already enforces single pipeline; no conflict with new rules.
- **02_authority_single_source.md** — Updated in Step 1 with explicit audit list and reference to TRUNK_ARCHITECTURE_TARGET Section 0.
- **04_runtime_contract_freeze.md** — No screen contract or layout API changes; no conflict.

---

## 3. Conflicts resolved

| Rule | Phase / doc | Resolution |
|------|-------------|------------|
| Layout authority: only @/layout public | Phase 03 (JSON surface) | Phase 03 now states that layout/ is the only public API and lib/layout is internal; no new direct lib/layout imports from renderer or app. |
| JsonRenderer must not resolve layout/presets/config | Phase 03, 05 | Phase 03 acceptance criteria and Phase 05 checklist now explicitly require no resolution logic in JsonRenderer and verification of renderer boundary. |

---

## 4. Execution note

When executing Round 3 (Step 3), enforce these rules:

- Any JSON compression or layout file moves must keep layout/ as the single public API; callers (including future refactors of JsonRenderer) must use only @/layout.
- No new imports in JsonRenderer to @/lib/layout, preset resolvers, molecule resolvers, or config readers.
- Phase 05 sign-off must include renderer boundary and layout authority verification.

---

*End of Phase3_Alignment_Adjustments.md*
