# FINAL STATIC-CORE LOCK PASS — EXECUTION REPORT

**Mode:** Controlled structural refactor. Behavior preserved 100%. No renames, no logic changes, no contract changes.

---

## PHASE 1 — LAYOUT IMPORT PURITY

**Objective:** Route all `resolveMoleculeLayout` usage through the `@/layout` facade.

**Actions:**
- Found all files importing `@/lib/layout/molecule-layout-resolver`.
- Replaced with `import { resolveMoleculeLayout } from "@/layout";`.

**Files updated (13):**
1. `compounds/ui/12-molecules/stepper.compound.tsx`
2. `compounds/ui/12-molecules/footer.compound.tsx`
3. `compounds/ui/12-molecules/avatar.compound.tsx`
4. `compounds/ui/12-molecules/toolbar.compound.tsx`
5. `compounds/ui/12-molecules/field.compound.tsx`
6. `compounds/ui/12-molecules/toast.compound.tsx`
7. `compounds/ui/12-molecules/button.compound.tsx`
8. `compounds/ui/12-molecules/list.compound.tsx`
9. `compounds/ui/12-molecules/card.compound.tsx`
10. `compounds/ui/12-molecules/modal.compound.tsx`
11. `compounds/ui/12-molecules/chip.compound.tsx`
12. `lib/site-renderer/renderFromSchema.tsx`
13. `layout/renderer/LayoutMoleculeRenderer.tsx`

**Imports corrected:** 13 — all now use `@/layout` for `resolveMoleculeLayout`.

**Verification:**
- `engine/core/json-renderer.tsx` — unchanged; already imports from `@/layout`.
- `layout/index.ts` — unchanged; still re-exports `resolveMoleculeLayout` from `../lib/layout/molecule-layout-resolver`.
- Layout authority and public API unchanged.

---

## PHASE 2 — TEMPLATE SYSTEM → JSON

**Objective:** Move the hardcoded `TEMPLATES` array into JSON; keep the same API.

**Actions:**
1. Extracted the `TEMPLATES` array from `lib/layout/template-profiles.ts` into `lib/layout/template-profiles.json` (exact structure preserved; 23 template profiles).
2. Updated `lib/layout/template-profiles.ts` to:
   - `import templatesData from "./template-profiles.json";`
   - `const TEMPLATES: TemplateProfile[] = templatesData as TemplateProfile[];`
   - Left all types, `getTemplateProfile`, `getTemplateList`, and `validateTemplateCompatibility` unchanged.

**Files updated:**
- **Created:** `lib/layout/template-profiles.json` (array of 23 template profile objects).
- **Modified:** `lib/layout/template-profiles.ts` (inline array removed; load from JSON; same exports and return shapes).

**Templates moved to JSON:** 23 template profiles. No consumer code or return shapes changed.

---

## PHASE 3 — REMOVE PURE RE-EXPORT GLUE

**Objective:** Remove onboarding-engines re-export files; use `logic/engines/*` as single source.

**Verification:** `logic/engine-system/engine-registry.ts` already imports directly from `../engines/` (e.g. `learning.engine`, `calculator/calculator.engine`, `abc.engine`, `summary/summary.engine`). No references to `logic/onboarding-engines/*` were found in runtime or engine-registry code.

**Actions:**
- Deleted the four pure re-export files:
  1. `logic/onboarding-engines/abc.engine.ts`
  2. `logic/onboarding-engines/calculator.engine.ts`
  3. `logic/onboarding-engines/learning.engine.ts`
  4. `logic/onboarding-engines/summary.engine.ts`

**Glue files removed:** 4. No updates to `engine-registry.ts` were required (it already used `logic/engines/*`).

---

## RULES COMPLIANCE

- No renderer logic changes (import path only in Phase 1).
- No behavior-listener changes.
- No layout/state merging.
- No action name changes.
- No schema or contract changes.
- Only import path edits and JSON extraction.

---

## CONFIRMATION: RUNTIME BEHAVIOR UNCHANGED

- **Phase 1:** Call sites still resolve molecule layout via the same `resolveMoleculeLayout` from the same implementation; only the import path now goes through the `@/layout` facade. Behavior is identical.
- **Phase 2:** Template data is loaded from JSON at module load; `getTemplateProfile`, `getTemplateList`, and `validateTemplateCompatibility` still operate on the same `TEMPLATES` array with the same structure and types. No consumer changes; return shapes unchanged.
- **Phase 3:** No runtime code imported from `onboarding-engines`; `engine-registry` already used `logic/engines/*`. Removal is dead-code elimination only.

**Summary:** All changes are structural (imports, data location, file removal). Runtime behavior is unchanged.
