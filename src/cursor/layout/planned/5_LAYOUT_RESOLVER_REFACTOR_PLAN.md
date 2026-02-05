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
