# Runtime Component Registry Rebuild Log

**Date:** 2026-02-16  
**Scope:** Full registry rebuild — restore visibility for JSON-referenced components so prod build can resolve them.

## Summary

- **Registry file:** `src/03_Runtime/engine/core/registry.tsx`
- **Renderer:** `src/03_Runtime/engine/core/json-renderer.tsx` (resolves `node.type` via `Registry[node.type]` only).
- **Action:** Re-added missing type → component entries for: **question**, **calculator**, **summary**, **cta** (and **education** as alias for question-style cards).

## Components That Were Missing (Now Reconnected)

| JSON `type`   | Component source (file)                          | Reconnected in Registry as |
|---------------|---------------------------------------------------|----------------------------|
| **question**  | `@/ui/molecules/cards` → EducationCard            | `question`, `Question`    |
| **education** | `@/ui/molecules/cards` → EducationCard            | `education`, `Education`  |
| **calculator**| `@/ui/molecules/cards` → CalculatorCard          | `calculator`, `Calculator` |
| **summary**   | `@/ui/molecules/cards` → SummaryCard             | `summary`, `Summary`      |
| **cta**       | `@/components/molecules` → getCompoundComponent("button") | `cta`, `Cta`, `CTA` |

## Implementation Details

1. **Card components (question, education, calculator, summary)**  
   - **Location:** `src/04_Presentation/ui/molecules/cards/` (CalculatorCard, EducationCard, SummaryCard).  
   - **Adapter:** JsonRenderer passes spread props; these cards expect `onAdvance`, `onComplete`, `restoreState`. A small `wrapCard()` helper was added in `registry.tsx` to supply no-op callbacks and forward other props so the cards render without changing engine/layout logic.

2. **cta**  
   - **Location:** No dedicated CTA molecule; JSON “cta” often used as call-to-action (button).  
   - **Reconnected as:** Alias to the existing **button** compound component via `getCompoundComponent("button")`. No new component file; layout/engines unchanged.

## What Was Not Changed

- No JSON screen files modified.
- No engines or layout logic modified.
- No new dynamic registry or path changes; all entries are static in `registry.tsx`.
- Production build: same entry point; `registry.tsx` is already imported by `json-renderer.tsx`, so no build config changes.

## Verification

- **Lint:** `registry.tsx` passes with no new errors.
- **Imports:** All reconnected components use existing paths (`@/ui/molecules/cards`, `@/components/molecules`); no new path aliases.
- **Prod visibility:** Any screen or flow JSON that references `type: "question"`, `type: "calculator"`, `type: "summary"`, or `type: "cta"` (and `type: "education"`) now resolves to a component from the main registry instead of “Missing registry entry”.
