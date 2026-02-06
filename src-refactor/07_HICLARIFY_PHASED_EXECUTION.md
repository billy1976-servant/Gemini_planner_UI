# HIClarify Phased Execution (Section 23 → Concrete Steps)

**Source:** [00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md](00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md) Section 23.  
**Use:** Run phases in order. Each phase links to existing refactor anchor files.

---

## Phase 1 — Spine lock

**Goal:** Lock the permanent runtime contract so nothing bypasses it.

| Step | Action | Anchor / validation |
|------|--------|---------------------|
| 1.1 | Document spine as **JSON Screen → Engines → State → Layout → Renderer → Final Screen** (HIClarify) = **JSON Screen → Engines → State → Layout → Renderer → DOM** (HiSense). | [00_MASTER_ARCHITECTURE_LOCK.md](00_MASTER_ARCHITECTURE_LOCK.md), [01_REFACTOR_EXECUTION_PLAN.md](01_REFACTOR_EXECUTION_PLAN.md) §1 |
| 1.2 | Confirm primary path key files per stage (screen-loader, page.tsx, state-store, layout-resolver, json-renderer, Registry). | [02_SYSTEM_MAPPING_CHECKLIST.md](02_SYSTEM_MAPPING_CHECKLIST.md) §1 |
| 1.3 | Add validation: no code path may bypass spine (no direct DB/render without going through spine stages). | [06_REFACTOR_BOUNDARIES.md](06_REFACTOR_BOUNDARIES.md) §1 |

**Phase 1 complete when:** Spine is single documented contract; checklist §1 all YES.

---

## Phase 2 — Engine separation

**Goal:** Small runner engines; one responsibility each; composable.

| Step | Action | Anchor |
|------|--------|--------|
| 2.1 | List ACTIVE engines on main path; document SECONDARY/DEAD. | [01_REFACTOR_EXECUTION_PLAN.md](01_REFACTOR_EXECUTION_PLAN.md) §2, [03_ENGINE_MODEL_SPEC.md](03_ENGINE_MODEL_SPEC.md) |
| 2.2 | Single runtime-verb-interpreter (logic/runtime); single content-resolver. | [02_SYSTEM_MAPPING_CHECKLIST.md](02_SYSTEM_MAPPING_CHECKLIST.md) §2 |
| 2.3 | Engine I/O: standard inputs (JSON, state snapshot, context); standard outputs (state updates, derived values, layout instructions). | [03_ENGINE_MODEL_SPEC.md](03_ENGINE_MODEL_SPEC.md) |

**Phase 2 complete when:** Engines small, single-responsibility, composable; no duplicate interpreters/resolvers on main path.

---

## Phase 3 — Responsibility cleanup

**Goal:** Organize by role (Runtime / Build / Ingest); remove wiring chaos.

| Step | Action | Anchor |
|------|--------|--------|
| 3.1 | Runtime: Engines, State, Layout, Renderer only. Build: Compiler, transformers. Ingest: Rippers, imports. | [01_REFACTOR_EXECUTION_PLAN.md](01_REFACTOR_EXECUTION_PLAN.md) §8 |
| 3.2 | Boundaries: Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry. | [06_REFACTOR_BOUNDARIES.md](06_REFACTOR_BOUNDARIES.md) |
| 3.3 | What moves outside spine: website ripper, import tools, compilers, data analyzers — prepare data only. | [00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md](00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md) §14 |

**Phase 3 complete when:** Responsibility structure documented; no cross-boundary writes; utilities external.

---

## Phase 4 — Compiler split

**Goal:** Compiler as micro-pipeline: Ingest → Normalize → Map → Validate → Emit.

| Step | Action | Anchor |
|------|--------|--------|
| 4.1 | Blueprint (build-time only); no blueprint script in runtime. | [01_REFACTOR_EXECUTION_PLAN.md](01_REFACTOR_EXECUTION_PLAN.md) §5 |
| 4.2 | Each compiler stage can be reusable engine; document stages. | [00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md](00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md) §15, §29 |

**Phase 4 complete when:** Compiler stages defined; runtime/build separation clear.

---

## Phase 5 — Layout normalization

**Goal:** Layout fully JSON-driven; molecules choose layouts; layout engines small.

| Step | Action | Anchor |
|------|--------|--------|
| 5.1 | Precedence: override → explicit node.layout → template default → undefined. | [01_REFACTOR_EXECUTION_PLAN.md](01_REFACTOR_EXECUTION_PLAN.md) §6 |
| 5.2 | Layout allowedTypes from registry/JSON; no hardcoded layout sets. | [02_SYSTEM_MAPPING_CHECKLIST.md](02_SYSTEM_MAPPING_CHECKLIST.md) §5 |

**Phase 5 complete when:** Layout JSON-driven and engine-informed; checklist §5 satisfied.

---

## Phase 6 — Stability pass

**Goal:** Validate spine end-to-end; enable near-self-healing diagnostics.

| Step | Action | Anchor |
|------|--------|--------|
| 6.1 | Validate JSON → Engine → State → Layout → Renderer; report inputs, outputs, handoffs, fail points. | [02_SYSTEM_MAPPING_CHECKLIST.md](02_SYSTEM_MAPPING_CHECKLIST.md) |
| 6.2 | State contract: minimal, deterministic, replaceable; event stream = persistence. | [04_STATE_AND_EVENT_MODEL.md](04_STATE_AND_EVENT_MODEL.md) |
| 6.3 | 2.5D above spine; reads event stream, state summaries, engine outputs; does not control runtime. | [05_2_5D_POSITIONING.md](05_2_5D_POSITIONING.md) |

**Phase 6 complete when:** Full checklist pass; state and 2.5D aligned to HIClarify contract.

---

## Run status

| Phase | Status | Notes |
|-------|--------|--------|
| 1 — Spine lock | Complete | Spine documented as permanent contract; 01 §1 locked; HIClarify §3 aligned. |
| 2 — Engine separation | Pending | |
| 3 — Responsibility cleanup | Pending | |
| 4 — Compiler split | Pending | |
| 5 — Layout normalization | Pending | |
| 6 — Stability pass | Pending | |

Update this table as each phase completes.
