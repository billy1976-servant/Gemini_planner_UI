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

---

## Verification Report (Step 4)

**Plan:** [4_SUGGESTION_INTAKE_AND_PRECEDENCE_PLAN.md](4_SUGGESTION_INTAKE_AND_PRECEDENCE_PLAN.md)  
**Scope:** Verify precedence order (override → explicit → default) and confirm no suggestion step in runtime.  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Precedence order documented: Override → Explicit → Suggestion → Default | ✅ PASS (plan) |
| Runtime implements override → explicit → default only (no suggestion) | ✅ PASS |
| Section layout: override → explicit (node.layout) → default (template) in applyProfileToNode | ✅ PASS |
| Organ internal: override → explicit (node.variant) → default in expandOrgans + resolveInternalLayoutId | ✅ PASS |
| Card layout: override applied; explicit/default card ID not in applyProfileToNode path | ✅ PASS (override only) |
| No call from Layout to Logic for suggestion | ✅ PASS |
| Layout does not write to logic stores | ✅ PASS |

**Overall: PASS** — Current runtime matches plan: override → explicit → default; suggestion is planned future only.

---

### 1. Precedence order (canonical)

Plan defines:

1. **Override** — User-chosen from override store (sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides).
2. **Explicit** — node.layout (section) or explicit node/config for card/organ.
3. **Suggestion** — From Logic (Planned Future; Logic Plan 8).
4. **Default** — Template default or organ profile default.

Runtime implements **1, 2, 4** only. No suggestion step.

---

### 2. Section layout resolution (applyProfileToNode)

**Location:** `src/engine/core/json-renderer.tsx` (applyProfileToNode, ~327–346)

```ts
const overrideId = sectionLayoutPresetOverrides?.[sectionKey]?.trim() ?? null;
const existingLayoutId = (node.layout as string)?.trim() ?? null;
const templateDefaultLayoutId =
  profile?.defaultSectionLayoutId?.trim() || getDefaultSectionLayoutId(templateId ?? undefined);
const layoutId = overrideId || existingLayoutId || templateDefaultLayoutId || undefined;
next.layout = layoutId;
```

| Precedence | Source | Verified |
|------------|--------|----------|
| Override | sectionLayoutPresetOverrides[sectionKey] | ✅ |
| Explicit | node.layout | ✅ |
| Default | profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId) | ✅ |
| Suggestion | (none) | ✅ Not present |

---

### 3. Organ internal layout resolution

**Override + explicit + default:**

- **expandOrgans** (`src/organs/resolve-organs.ts`): `variantId = overrides[instanceKey] ?? overrides[organId] ?? n.variant ?? "default"`. Then `merged.params.internalLayoutId = variantId`. So: **Override** (overrides by instance key or organId) → **Explicit** (n.variant) → **Default** ("default"). ✅  
- **SectionCompound** (`src/compounds/ui/12-molecules/section.compound.tsx`): `resolveInternalLayoutId(role, params.internalLayoutId)` uses that id if valid, else `profile.defaultInternalLayoutId`. So organ default from registry is applied when the resolved variantId is invalid or not set. ✅  

No suggestion; Logic is not called. ✅  

---

### 4. Card layout (preset application)

**Location:** `src/engine/core/json-renderer.tsx` (applyProfileToNode and card render path)

- **Override:** cardLayoutPresetOverrides[parentSectionKey] is used to apply card preset (mediaPosition, contentAlign) to card children. ✅  
- **Explicit / default:** No use of node-level card layout ID or getDefaultCardPresetForSectionPreset in applyProfileToNode or render path. Card resolution is override-only in this path. ✅  

(Plan 4's precedence applies to "section (and card/organ)"; section and organ have full precedence; card has override only in the verified path.)

---

### 5. Suggestion intake (planned future)

| Contract | Verified |
|----------|----------|
| No suggestion step in applyProfileToNode today | ✅ |
| Injection point: after override and explicit, before default | N/A (not implemented) |
| Logic would be called from Layout at a single call site (Logic Plan 8) | N/A |
| Layout never writes to logic stores | ✅ No layout code writes to logic stores |
| Logic would suggest only; Layout resolves | N/A |

---

### 6. Determinism

- Section: same override, explicit, template ⇒ same layoutId (pure derivation). ✅  
- Organ: same overrides, node.variant, profile default ⇒ same variantId and internalLayoutId. ✅  
- No non-deterministic or store-dependent suggestion in resolution. ✅  

---

### Conclusion

Step 4 (Suggestion Intake and Precedence) is **verified**. The runtime implements **override → explicit → default** for section and organ internal layout; card uses override in the profile application path. There is no suggestion step and no Layout→Logic call for layout resolution. Behavior matches the plan; suggestion remains a planned future (Logic Plan 5/8).

**Next:** Proceed to Step 5 — [5_LAYOUT_RESOLVER_REFACTOR_PLAN.md](5_LAYOUT_RESOLVER_REFACTOR_PLAN.md) when ready.
