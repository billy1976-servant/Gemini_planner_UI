# 4 — Suggestion Intake and Precedence Plan

**Execution order:** 4 of 10  
**Classification:** FOUNDATIONAL — Precedence order and suggestion intake; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN, src/cursor/logic/planned

**Domain:** Layout (Resolver, Logic interface)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the precedence order for section (and card/organ) layout resolution and where the Logic suggestion is ingested. Layout resolver is the single writer of the resolved layout; suggestion is advisory and only used when override and explicit are absent.

---

## Precedence Order (Canonical)

1. **Override** — User-chosen layout from override store (e.g. sectionLayoutPresetOverrides[sectionKey], cardLayoutPresetOverrides, organInternalLayoutOverrides).
2. **Explicit** — node.layout (section) or explicit node/config for card/organ when present.
3. **Suggestion** — Recommended layout ID from Logic (Planned Future System; see Logic Plan 8 — Suggestion Injection Point). Must be an element of the compatible set supplied by Layout.
4. **Default** — Template default (getDefaultSectionLayoutId(templateId) or profile.defaultSectionLayoutId); organ default internal layout from organ-layout-profiles.

Layout resolver applies this order exactly. Logic never overwrites 1 or 2; Layout never writes to logic stores.

---

## Current Runtime (Verified)

Runtime implements **override → explicit → default** only. There is no suggestion step in `applyProfileToNode` today. The injection point (resolver calling Logic for one recommended layout ID when override and explicit are absent) is **Planned Future System** and depends on Logic Plan 5 (Layout Decision Engine) and Logic Plan 8 (Suggestion Injection Point).

---

## Suggestion Intake (Planned Future)

- **Who calls:** Layout resolver (or applyProfileToNode) at exactly one point: after checking override and explicit node.layout, before falling back to template default.
- **Inputs to Logic:** Section node, template ID, compatible layout ID set (from Layout), optional user context (viewport, density, etc.).
- **Output from Logic:** One recommended layout ID from the compatible set, or null/undefined; optional explanation object (see Plan 8). Logic does not write to layout store or node.layout.
- **Resolver behavior:** If override present → use it; else if explicit node.layout present → use it; else if suggestion present and in compatible set → use it; else → template default (or organ default for organ internal).

---

## What Suggestion Intake Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Accept a suggested layout ID from Logic when override and explicit are absent. | Let Logic write to override store or node.layout. |
| Use only IDs from the compatible set supplied by Layout. | Use a layout ID that was not in the compatible set. |
| Remain a single call site from Layout to Logic (per Logic Plan 8). | Branch resolution logic in multiple places for suggestion. |

---

## How It Connects to Logic and State

- **Logic Plan 1 (Logic–Layout Contract):** Logic suggests; Layout resolves. No cross-store writes.
- **Logic Plan 2 (State and Override Orchestration):** Precedence and storage of overrides; suggestion not persisted.
- **Logic Plan 8 (Suggestion Injection Point):** Defines the single call site, inputs, and output shape for the suggestion request from Layout to Logic.

---

## Determinism Rules

- Same inputs (override, explicit, suggestion, default, compatible set) ⇒ same resolved layout. Suggestion, when used, is computed from section node and context; no non-deterministic store reads for resolution.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*
