# 11 — Logic Pipeline Orchestration Plan

**Execution order:** 11 of 12  
**Classification:** FOUNDATIONAL — Order of engines and single entry point; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Logic (Layout Intelligence)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the order of execution of Logic engines (Contextual Layout Logic → Layout Decision Engine, with optional Preference weights) and the **single entry point** that the Layout resolver calls. Ensures no duplicate or out-of-order invocation and a clear, deterministic pipeline.

---

## Pipeline Order

1. **Contextual Layout Logic (Plan 4)** — From section node (and optional slots/metrics), evaluate rules and produce suggested traits or contextual trait weights. Output: trait set or trait weights; no layout IDs.
2. **Layout Decision Engine (Plan 5)** — Receives compatible layout IDs (from Layout), optional contextual suggestion from step 1, optional user context (viewport, density), optional preference weights (Plan 6). Scores compatible layouts by traits; returns one recommended layout ID and optional explanation.

The pipeline runs **synchronously** in this order. Same inputs ⇒ same output.

---

## Single Entry Point

- **Caller:** Only the Layout resolver (e.g. at the suggestion injection point, Plan 8) invokes the Logic pipeline when it needs a suggestion (override and explicit node.layout absent).
- **No direct calls** from UI, dropdown, or other layers to Contextual Logic or Decision Engine in isolation for the purpose of layout suggestion. All suggestion requests go through this pipeline so that behavior and order are consistent.
- **Optional:** Plan 6 (User Preference) is not part of the pipeline invocation; preference weights are **read** by the Decision Engine but are updated only when the user triggers "more like this" / "less like this" (separate path).

---

## Inputs

Supplied by the resolver at the injection point:

| Input | Description |
|-------|-------------|
| Section node | Section tree (structure, content, role). |
| Compatible layout IDs | Set of layout IDs valid for this section (from Layout). |
| User context | Viewport band, density, optional content type. |
| Optional preference weights | Trait id → number (from Plan 6). |

---

## Outputs

| Output | Description |
|--------|-------------|
| Recommended layout ID | One ID from the compatible set, or null when no recommendation. |
| Optional explanation object | e.g. source, matchedTraits, score (per Plan 10). |

No side effects on layout store, override store, or node.layout. Preference memory is not written in this path.

---

## What It Can and Cannot Modify

| Can | Cannot |
|-----|--------|
| Return recommendation and explanation. | Modify layout store, override store, or node.layout. |
| Pipeline is read-only for layout and override state. | Write preference memory from the pipeline (Plan 6 writes only on user signal). |

---

## How It Connects to Layout

- **Resolver is the only caller** of the pipeline. Pipeline runs once per section when suggestion is needed.
- **Compatible set** is provided by Layout; pipeline does not compute compatibility. Layout remains owner of final layout ID via precedence.

---

## How It Connects to State

- Pipeline **reads** state per Plan 9 (State Influence Rules). It does not write except through Plan 6’s defined signal API, which is separate from the resolution path.
- Preference weights are an input to the pipeline; they are not updated by the pipeline.

---

## Determinism Rules

- **Fixed order:** Contextual → Decision Engine. Same inputs ⇒ same output.
- **Synchronous.** No async or out-of-order execution that could cause non-determinism.
- **No hidden state.** Pipeline output depends only on the supplied inputs and the static config (trait registry, contextual rules, context weights).

---

## Non-Negotiable Constraints

1. **Single entry point.** All layout suggestion requests from the resolver go through this pipeline.
2. **Defined engine order.** Contextual runs first; Decision Engine runs second and consumes Contextual output.
3. **No direct calls** to Contextual or Decision Engine from UI or other layers for layout suggestion; only through this pipeline or via the resolver.
4. **Pipeline is synchronous and deterministic.** No races or ordering ambiguities.

---

## Change Log

- [2025-02-04] Plan created.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*
