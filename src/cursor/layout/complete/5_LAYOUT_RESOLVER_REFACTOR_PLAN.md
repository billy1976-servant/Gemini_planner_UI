# 5 — Layout Resolver Refactor Plan

**Execution order:** 5 of 10  
**Classification:** FOUNDATIONAL — resolveLayout and applyProfileToNode contract; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Layout (Resolver, Renderer)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the contract for the unified layout resolver (resolveLayout) and the profile application path (applyProfileToNode): inputs, outputs, page + component merge, context, and the rule that there are no silent fallbacks.

---

## Current Runtime (Verified)

| Function / layer | Path | Role |
|------------------|------|------|
| getPageLayoutId | `src/layout/page/page-layout-resolver.ts` | Resolves layout ref (string or { template, slot }) to layout ID; uses templates.json when ref is template+slot. |
| getPageLayoutById | Same | Layout ID → PageLayoutDefinition (containerWidth, split, backgroundVariant). |
| resolveComponentLayout | `src/layout/component/component-layout-resolver.ts` | Layout ID → ComponentLayoutDefinition (type, preset, params). |
| resolveLayout | `src/layout/resolver/layout-resolver.ts` | Merges page def + component def; returns { ...pageDef, moleculeLayout: componentDef ?? undefined }. Returns null if !layoutId or !pageDef. |
| applyProfileToNode | `src/engine/core/json-renderer.tsx` | For sections: sets next.layout from overrideId \|\| existingLayoutId \|\| templateDefaultLayoutId \|\| undefined; strips layout keys from section params; calls evaluateCompatibility for dev log. |

---

## Resolver Contract

- **Input:** layout: string | { template: string; slot: string } | null | undefined; optional context: { templateId?, sectionRole? }.
- **Output:** LayoutDefinition (containerWidth, split, backgroundVariant, moleculeLayout) or null. Null when layout ref cannot be resolved to an ID or when page definition is missing.
- **Merge rule:** Page definition from getPageLayoutById(layoutId); component definition from resolveComponentLayout(layoutId). Unified definition = page def + moleculeLayout from component def. Organ sections: Section compound may override moleculeLayout with organ variant (organ-layout-resolver + loadOrganVariant); that is outside resolveLayout.
- **Context:** When layout is missing, context.templateId + context.sectionRole can be used to look up layout ID from templates (e.g. templates[templateId][sectionRole]). getDefaultSectionLayoutId(templateId) uses templates[templateId]["defaultLayout"] or profile.defaultSectionLayoutId; canonical source for "template default" should be clarified (currently profile first in applyProfileToNode).

---

## applyProfileToNode Contract (Section Layout)

- **Section key:** node.id ?? node.role ?? "".
- **Precedence:** override (sectionLayoutPresetOverrides[sectionKey]) → explicit (node.layout string) → template default (profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId)) → undefined.
- **Output on node:** next.layout = resolved layout ID or undefined; (next as any)._effectiveLayoutPreset = same. Section params are stripped of moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split so JSON cannot supply layout.
- **No silent fallback:** When no override, no explicit, and no template default, next.layout is undefined. Section then receives layout undefined → resolveLayout(undefined) → null → Section renders div wrapper (no LayoutMoleculeRenderer). No code path may substitute a hardcoded layout ID.

---

## What the Resolver Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Resolve layout ref to full definition (page + component). Return null when ref or page def missing. | Invent a layout ID or definition when ref is missing or unknown. |
| Apply precedence (override → explicit → suggestion → default) in one place (applyProfileToNode for section). | Apply layout from node.params or from role-derived logic; section layout comes only from layout engine path. |

---

## How It Connects to Compatibility, Logic, and Renderer

- **Compatibility:** Resolver does not use evaluateCompatibility to choose the layout ID; compatibility filters options and can be used for logging. Resolved ID may be invalid (e.g. user override); resolver does not block or auto-correct.
- **Logic (Planned):** When suggestion step exists, resolver calls Logic once for suggested ID and uses it only when override and explicit are absent; suggestion must be from compatible set.
- **Renderer:** Section compound receives layout prop (resolved ID); it calls resolveLayout(layout) to get LayoutDefinition and passes to LayoutMoleculeRenderer. Organ sections merge organ variant moleculeLayout in Section compound, not in resolveLayout.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*

---

## Verification Report (Step 5)

**Plan:** [5_LAYOUT_RESOLVER_REFACTOR_PLAN.md](5_LAYOUT_RESOLVER_REFACTOR_PLAN.md)  
**Scope:** Verify resolveLayout and applyProfileToNode contract; page + component merge; no silent fallbacks.  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| getPageLayoutId / getPageLayoutById / resolveComponentLayout at stated paths | ✅ PASS |
| resolveLayout: input, output, merge rule, null when !layoutId or !pageDef | ✅ PASS |
| applyProfileToNode: section key, precedence, output, strip params | ✅ PASS |
| No silent fallback: undefined when no default; Section renders div when layout null | ✅ PASS |
| No hardcoded layout ID when ref missing or unknown | ✅ PASS |

**Overall: PASS** — Resolver and applyProfileToNode match the plan; no silent fallbacks.

---

### 1. Function / layer verification

| Function / layer | Path | Role | Verified |
|------------------|------|------|----------|
| getPageLayoutId | `src/layout/page/page-layout-resolver.ts` | Resolves layout ref (string or { template, slot }) to layout ID; uses templates.json when ref is template+slot. | ✅ Returns string \| null; no fallback. |
| getPageLayoutById | Same | Layout ID → PageLayoutDefinition (containerWidth, split, backgroundVariant). | ✅ Returns def or null. |
| resolveComponentLayout | `src/layout/component/component-layout-resolver.ts` | Layout ID → ComponentLayoutDefinition (type, preset, params). | ✅ Returns def or null. |
| resolveLayout | `src/layout/resolver/layout-resolver.ts` | Merges page def + component def; returns null if !layoutId or !pageDef. | ✅ |
| applyProfileToNode | `src/engine/core/json-renderer.tsx` | Section: override \|\| explicit \|\| templateDefault \|\| undefined; strips layout keys; compatibility for dev log. | ✅ |

---

### 2. Resolver contract

| Contract | Implementation | Verified |
|----------|----------------|----------|
| **Input** | layout: string \| { template, slot } \| null \| undefined; context?: { templateId?, sectionRole? } | ✅ resolveLayout(layout, context?) |
| **Output** | LayoutDefinition (containerWidth, split, backgroundVariant, moleculeLayout) or null | ✅ Return type; null when getPageLayoutId returns null or getPageLayoutById returns null |
| **Null when** | Layout ref cannot be resolved to ID, or page definition missing | ✅ if (!layoutId) return null; if (!pageDef) return null |
| **Merge rule** | pageDef from getPageLayoutById(layoutId); moleculeLayout from resolveComponentLayout(layoutId) | ✅ return { ...pageDef, moleculeLayout: componentDef ?? undefined } |
| **Context** | When layout missing, context used for templates lookup (getPageLayoutId) | ✅ getPageLayoutId(layout, context) uses context.templateId + context.sectionRole |
| **Organ** | Section compound overrides moleculeLayout with organ variant; outside resolveLayout | ✅ SectionCompound uses resolveInternalLayoutId + loadOrganVariant for organ; resolveLayout unchanged |

---

### 3. applyProfileToNode contract (section layout)

| Contract | Implementation | Verified |
|----------|----------------|----------|
| **Section key** | node.id ?? node.role ?? "" | ✅ const sectionKey = (node.id ?? node.role) ?? "" |
| **Precedence** | override → explicit (node.layout) → template default → undefined | ✅ layoutId = overrideId \|\| existingLayoutId \|\| templateDefaultLayoutId \|\| undefined |
| **Template default** | profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId) | ✅ templateDefaultLayoutId = profile?.defaultSectionLayoutId?.trim() \|\| getDefaultSectionLayoutId(templateId) |
| **Output on node** | next.layout = resolved ID or undefined; _effectiveLayoutPreset = same | ✅ next.layout = layoutId; (next as any)._effectiveLayoutPreset = layoutId |
| **Strip params** | moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split removed from section params | ✅ delete p.moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split |
| **No silent fallback** | When no override, explicit, or template default → next.layout is undefined | ✅ No else branch inventing an ID; template default from profile/templates only |

---

### 4. No silent fallback / Section when layout undefined

| Rule | Verified |
|------|----------|
| When layout is undefined, resolveLayout(undefined) returns null (getPageLayoutId(undefined) → null) | ✅ |
| SectionCompound receives layout undefined → layoutDef = resolveLayout(layout) = null → effectiveDef = null | ✅ |
| Section then renders div wrapper: `return <div data-section-id={id}>{children}</div>` | ✅ (section.compound.tsx lines 113–116) |
| No code path substitutes a hardcoded layout ID when ref is missing or unknown | ✅ Grep found no such assignment |

---

### 5. Resolver can / cannot

| Can | Verified |
|-----|----------|
| Resolve layout ref to full definition (page + component); return null when ref or page def missing | ✅ |
| Apply precedence in one place (applyProfileToNode for section) | ✅ |

| Cannot | Verified |
|--------|----------|
| Invent a layout ID or definition when ref is missing or unknown | ✅ All paths return null or undefined |
| Apply layout from node.params or role-derived logic; section layout from layout engine path only | ✅ Params stripped; layout from override/explicit/template default only; comment "Layout is never derived from role" |

---

### 6. Compatibility, Logic, Renderer

| Connection | Verified |
|------------|----------|
| Resolver does not use evaluateCompatibility to choose layout ID | ✅ applyProfileToNode uses compatibility for dev logging only |
| Organ moleculeLayout override in Section compound, not in resolveLayout | ✅ SectionCompound merges organ variant moleculeLayout when isOrgan |

---

### 7. Note (from plan)

- **Template default source:** applyProfileToNode uses profile.defaultSectionLayoutId first, then getDefaultSectionLayoutId(templateId). Plan notes "canonical source for template default should be clarified (currently profile first in applyProfileToNode)." No change required for this step; clarification can be done in a later plan if desired.

---

### Conclusion

Step 5 (Layout Resolver Refactor) is **verified**. resolveLayout and applyProfileToNode match the contract: correct inputs/outputs, page + component merge, precedence, param stripping, and no silent fallbacks. Section renders a div when layout is undefined.

**Next:** Proceed to Step 6 — [6_FALLBACK_REMOVAL_AND_JSON_DEFAULTING_PLAN.md](6_FALLBACK_REMOVAL_AND_JSON_DEFAULTING_PLAN.md) when ready.
