# Workflow

**Primary Architecture Reference:** docs/SYSTEM_MASTER/

---

## Authoritative docs

- **Architecture:** `docs/SYSTEM_MASTER/` — SYSTEM_ARCHITECTURE, LAYOUT_SYSTEM, LOGIC_ENGINE_SYSTEM, BLUEPRINT_COMPILER_SYSTEM, CONTRACTS, WORKFLOW. These reflect the current system; code is the source of truth.
- **Operational:** `docs/HI_SYSTEM/` — START_HERE, MAP, ROADMAP, PLAN_ACTIVE, WORKFLOW_RULES, PLANS_INDEX, CHANGELOG. Phase tracking, task lists, and where to read first.

---

## How to work

1. **Before coding** — Read relevant SYSTEM_MASTER docs and HI_SYSTEM core docs. Do not introduce systems that duplicate existing ones.
2. **Starting a phase** — Update PLAN_ACTIVE (and ROADMAP if phase changes). Summarize systems and propose plan; confirm before implementation.
3. **After work** — Append summary to CHANGELOG. Reflect major structural changes in MAP (or SYSTEM_ARCHITECTURE if that is the maintained map).
4. **Uncertainty** — Stop and clarify; do not guess on layout, behavior, or contract boundaries.

---

## Where plans live

- **Current phase:** ROADMAP.md, PLAN_ACTIVE.md (Phases A–D or per-project phases).
- **Detailed plans:** PLANS_INDEX.md links to active plan docs (e.g. .cursor/plans, MASTER_ENGINE_COMPLETION_ROADMAP in src/cursor/layout/planned).
- **Completed / reference:** src/cursor/layout/complete, src/cursor/logic/planned; docs under HI_SYSTEM and STYLING CURSOR PLAN as reference. Classifications (FOUNDATIONAL, REFERENCE, HISTORICAL, REDUNDANT) are in doc headers where applied.

---

## Phase progression

- Advance ROADMAP and PLAN_ACTIVE when starting or finishing a phase. Use WORKFLOW_RULES in HI_SYSTEM for mandatory steps (read docs, update PLAN_ACTIVE/CHANGELOG/MAP). SYSTEM_MASTER docs are updated only when architecture changes (e.g. after a refresh like this one).
