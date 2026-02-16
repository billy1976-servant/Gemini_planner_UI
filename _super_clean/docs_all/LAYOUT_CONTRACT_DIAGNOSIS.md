# Layout Contract Diagnosis Report

**Date:** 2026-02-11  
**Goal:** Identify why all sections render identical card structure and what must be restored.

---

## 1. WHERE LAYOUT CONTRACTS USED TO BE INJECTED

### Primary Injection Point: `json-renderer.tsx` → `applyProfileToNode()`

**Location:** `src/03_Runtime/engine/core/json-renderer.tsx:340-612`

**Flow:**
1. `applyProfileToNode()` calls `getSectionLayoutId()` (line 374-383)
2. Resolved `layoutId` assigned to `next.layout` (line 427)
3. `next.layout` flows through `renderNode()` → `props.layout` (line 1008)
4. SectionCompound receives `layout` prop

**Key Code:**
```typescript
// Line 374-383: Layout resolution
const { layoutId, ruleApplied } = getSectionLayoutId({
  sectionKey,
  node,
  templateId,
  sectionLayoutPresetOverrides,
  defaultSectionLayoutIdFromProfile: profile?.defaultSectionLayoutId,
}, { includeRule: true });

// Line 427: Assignment to node
next.layout = finalLayoutId;  // ⚠️ KILL SWITCH ACTIVE (line 419-421)
```

**Status:** ✅ Injection point exists and is active

---

## 2. WHERE SECTION → LAYOUTID MAPPING IS BREAKING

### Break Point #1: KILL SWITCH Active

**Location:** `src/03_Runtime/engine/core/json-renderer.tsx:45, 419-421`

```typescript
const DISABLE_ENGINE_LAYOUT = true; // Line 45

// Line 419-421: Kill switch bypasses override resolution
const finalLayoutId = DISABLE_ENGINE_LAYOUT
  ? (existingLayoutId || templateDefaultLayoutId || undefined)
  : layoutId;
```

**Impact:** 
- Engine overrides (`sectionLayoutPresetOverrides`) are bypassed
- Only `node.layout` (from JSON) or template default is used
- Template role-based resolution is skipped

**Status:** 🔴 **ACTIVE KILL SWITCH BLOCKING OVERRIDES**

---

### Break Point #2: Missing Context in `resolveLayout()` Call

**Location:** `src/04_Presentation/components/molecules/section.compound.tsx:115`

```typescript
// Line 115: Called WITHOUT context
const layoutDef = resolveLayout(layout);
```

**Expected:** Should pass context for template role-based resolution:
```typescript
const layoutDef = resolveLayout(layout, {
  templateId: profile?.id,
  sectionRole: role
});
```

**Impact:**
- When `layout` is `undefined`, `getPageLayoutId(undefined, undefined)` returns `null`
- Template role-based fallback cannot work without context
- All sections with undefined layout fallback to div wrapper

**Status:** 🔴 **MISSING CONTEXT PARAMETER**

---

### Break Point #3: `resolveLayout()` Cannot Access Template Context

**Location:** `src/04_Presentation/layout/resolver/layout-resolver.ts:37-40`

**Current Signature:**
```typescript
export function resolveLayout(
  layout: string | { template: string; slot: string } | null | undefined,
  context?: { templateId?: string; sectionRole?: string }
): LayoutDefinition | null
```

**Problem:** SectionCompound doesn't have access to `profile` or `templateId` to pass as context.

**Status:** 🔴 **PROFILE CONTEXT NOT AVAILABLE IN SECTIONCOMPOUND**

---

## 3. IDENTIFYING MISSING PROPS CAUSING FALLBACK

### Missing Props Chain:

1. **`layout` prop is undefined** when:
   - No override (kill switch disabled overrides)
   - No `node.layout` in JSON
   - Template default not found
   - Template role resolution fails (no context)

2. **`context` parameter missing** in `resolveLayout()` call:
   - `templateId` not passed
   - `sectionRole` not passed
   - Cannot fallback to template role-based layout

3. **`profile` not available** in SectionCompound:
   - SectionCompound receives only: `id`, `role`, `layout`, `params`, `content`, `children`
   - No access to `profile` or `templateId`
   - Cannot construct context for `resolveLayout()`

---

## 4. WHAT IS CURRENTLY RETURNING THE SAME STRUCTURE

### Fallback Path: Div Wrapper Only

**Location:** `src/04_Presentation/components/molecules/section.compound.tsx:179-183`

```typescript
if (effectiveDef) {
  return <LayoutMoleculeRenderer ... />;
}
// Line 179-183: Fallback when layoutDef is null
return (
  <div data-section-id={id}>
    {children}
  </div>
);
```

**When This Happens:**
- `resolveLayout(layout)` returns `null` (no layoutId resolved)
- `effectiveDef` is `null`
- All sections render identical `<div>` wrapper
- No layout structure applied (containerWidth, split, backgroundVariant, moleculeLayout)

**Status:** 🔴 **ALL SECTIONS WITHOUT RESOLVED LAYOUT RENDER IDENTICAL DIV**

---

## 5. WHICH CONTRACT FIELDS ARE NOW UNDEFINED

### Contract Field Audit:

| Field | Expected Source | Current Value | Status |
|-------|----------------|---------------|--------|
| `layout` prop | `applyProfileToNode()` → `next.layout` | `undefined` when no override/node.layout/template default | 🔴 Undefined |
| `templateId` | `profile.id` | Not available in SectionCompound | 🔴 Missing |
| `sectionRole` | `node.role` | Available but not passed to `resolveLayout()` | ⚠️ Available but unused |
| `context.templateId` | Should be `profile.id` | `undefined` (not passed) | 🔴 Missing |
| `context.sectionRole` | Should be `role` | `undefined` (not passed) | 🔴 Missing |
| `layoutDef` | `resolveLayout(layout, context)` | `null` when layout undefined + no context | 🔴 Null |
| `effectiveDef` | `layoutDef` (or organ variant) | `null` when `layoutDef` is null | 🔴 Null |

---

## 6. WHERE LAYOUT SELECTION SHOULD OCCUR

### Expected Flow:

```
page.tsx
  ↓ (passes profileOverride, sectionLayoutPresetOverrides)
ExperienceRenderer
  ↓ (passes props through)
JsonRenderer
  ↓ (calls applyProfileToNode)
applyProfileToNode()
  ↓ (calls getSectionLayoutId with overrides + templateId)
getSectionLayoutId()
  ↓ (returns layoutId: override → node.layout → template role → template default)
next.layout = layoutId
  ↓ (flows through renderNode)
props.layout = resolvedNode.layout
  ↓ (passed to SectionCompound)
SectionCompound
  ↓ (should call resolveLayout with context)
resolveLayout(layout, { templateId, sectionRole })
  ↓ (should resolve via template role if layout undefined)
getPageLayoutId(layout, context)
  ↓ (returns layoutId from template map)
LayoutMoleculeRenderer
  ↓ (applies layout structure)
DOM with layout-specific structure
```

### Current Broken Flow:

```
applyProfileToNode()
  ↓ (KILL SWITCH bypasses overrides)
finalLayoutId = existingLayoutId || templateDefaultLayoutId || undefined
  ↓ (no template role resolution)
next.layout = finalLayoutId (often undefined)
  ↓
SectionCompound receives layout = undefined
  ↓ (calls resolveLayout WITHOUT context)
resolveLayout(undefined)
  ↓ (cannot resolve via template role)
getPageLayoutId(undefined, undefined) → null
  ↓
layoutDef = null
  ↓
<div data-section-id={id}>{children}</div>
  ↓
IDENTICAL STRUCTURE FOR ALL SECTIONS
```

---

## 7. ROOT CAUSE SUMMARY

### Primary Issues:

1. **KILL SWITCH ACTIVE** (`DISABLE_ENGINE_LAYOUT = true`)
   - Bypasses override resolution
   - Prevents engine-driven layout selection

2. **MISSING CONTEXT IN RESOLVE CALL**
   - `resolveLayout()` called without `{ templateId, sectionRole }`
   - Cannot fallback to template role-based layout
   - Template role resolution requires context

3. **PROFILE NOT AVAILABLE IN SECTIONCOMPOUND**
   - SectionCompound doesn't receive `profile` prop
   - Cannot construct context for `resolveLayout()`
   - Template role resolution impossible

4. **NO FALLBACK WHEN LAYOUT UNDEFINED**
   - When `layout` is `undefined`, `resolveLayout()` returns `null`
   - SectionCompound renders div wrapper only
   - All sections look identical

---

## 8. WHAT MUST BE RESTORED (SELECTION LOGIC, NOT FALLBACKS)

### Required Fixes:

1. **Remove or disable kill switch** (or make it conditional)
   - Allow override resolution to work
   - Restore engine-driven layout selection

2. **Pass context to `resolveLayout()`**
   - SectionCompound needs access to `templateId` (from profile)
   - Pass `{ templateId, sectionRole }` to `resolveLayout()`
   - Enable template role-based fallback

3. **Make profile available to SectionCompound**
   - Either pass `profile` prop to SectionCompound
   - Or pass `templateId` directly
   - Or resolve templateId from layout store/context

4. **Ensure template role resolution works**
   - `getPageLayoutId(null, { templateId, sectionRole })` should resolve
   - Template map should contain role → layoutId mappings
   - Fallback chain: override → node.layout → template role → template default

---

## 9. VERIFICATION CHECKLIST

- [ ] Check if `DISABLE_ENGINE_LAYOUT` should be `false` or conditional
- [ ] Verify `sectionLayoutPresetOverrides` are being populated correctly
- [ ] Confirm template role mappings exist in `layout-definitions.json`
- [ ] Test `getPageLayoutId(null, { templateId, sectionRole })` returns layoutId
- [ ] Ensure `profile` or `templateId` can be passed to SectionCompound
- [ ] Verify `resolveLayout(layout, context)` works with context
- [ ] Test that sections with different roles get different layouts

---

## 10. NEXT STEPS (NO CODE CHANGES YET)

1. **Verify kill switch intent** - Is `DISABLE_ENGINE_LAYOUT` intentional for debugging?
2. **Check template role mappings** - Do templates have role → layoutId mappings?
3. **Audit profile flow** - How can SectionCompound access templateId?
4. **Test resolution chain** - Does template role resolution work when context provided?

---

---

## 11. EXECUTIVE SUMMARY

### Problem Statement
All sections are rendering identical card structure because layout contracts are not being properly resolved and applied.

### Root Causes (Priority Order)

1. **KILL SWITCH ACTIVE** 🔴 **CRITICAL**
   - `DISABLE_ENGINE_LAYOUT = true` in `json-renderer.tsx:45`
   - Bypasses override resolution entirely
   - Only uses `node.layout` from JSON or template default
   - Comment indicates "Temporary investigation flag"

2. **MISSING CONTEXT IN RESOLVE CALL** 🔴 **CRITICAL**
   - `resolveLayout(layout)` called without context in `section.compound.tsx:115`
   - Cannot fallback to template role-based layout resolution
   - Template role resolution requires `{ templateId, sectionRole }` context

3. **PROFILE NOT AVAILABLE** 🔴 **CRITICAL**
   - SectionCompound doesn't receive `profile` or `templateId` prop
   - Props interface only includes: `id`, `role`, `layout`, `params`, `content`, `children`
   - Cannot construct context for `resolveLayout()` call

4. **FALLBACK TO DIV WRAPPER** ⚠️ **SYMPTOM**
   - When `layoutDef` is `null`, SectionCompound renders `<div>` wrapper only
   - All sections without resolved layout get identical structure
   - No layout-specific styling or structure applied

### Expected vs Actual Behavior

**Expected:**
- Override → node.layout → template role → template default → undefined
- Each resolution step should work
- Different sections should get different layouts based on role/override

**Actual:**
- Override bypassed (kill switch)
- Template role resolution fails (no context)
- Template default may not exist
- All sections fallback to identical div wrapper

### Fix Priority

1. **HIGH:** Remove or conditionally disable kill switch
2. **HIGH:** Pass context to `resolveLayout()` call
3. **MEDIUM:** Make `templateId` available to SectionCompound
4. **LOW:** Verify template role mappings exist

---

**END OF DIAGNOSTIC REPORT**
