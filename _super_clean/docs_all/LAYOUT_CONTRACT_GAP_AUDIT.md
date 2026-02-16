# Layout Contract Gap Audit Report

**Date:** 2026-02-11  
**Type:** Read-Only Inspection  
**Goal:** Identify why container properties are missing and where SAFE DEFAULT logs originate

---

## Executive Summary

**Root Cause:** Layout definitions (`layout-definitions.json`) define semantic tokens (`containerWidth: "contained"`) but **never define** the CSS container properties (`container.width`, `container.marginLeft`, etc.) that the renderer expects.

**Impact:** All layouts trigger SAFE DEFAULT warnings because `container.*` properties are missing from every layout definition.

**Pipeline Status:** ✅ **INTACT** - Data flows correctly through resolver → renderer, but source definitions are incomplete.

---

## A) Missing Properties Analysis

### Properties Most Commonly Missing

All layouts are missing these container properties:
- `container.width` ❌
- `container.marginLeft` ❌
- `container.marginRight` ❌
- `container.boxSizing` ❌
- `container.overflow` / `container.overflowX` ❌

**Frequency:** 100% of layouts (11/11 layouts in `layout-definitions.json`)

---

## B) Expected Source vs Actual Source

### Property: `container.width`

**Expected Source:** `layout-definitions.json` → `pageLayouts[layoutId].container.width`  
**Actual Source:** ❌ **NOT DEFINED ANYWHERE**  
**Point of Loss:** Definition gap - property never existed in JSON

**Current Workaround:** Renderer uses `getLayoutValueWithSafeDefault()` with fallback `"100%"`  
**Log Triggered:** `[LAYOUT SAFE DEFAULT]` for every layout

---

### Property: `container.marginLeft`

**Expected Source:** `layout-definitions.json` → `pageLayouts[layoutId].container.marginLeft`  
**Actual Source:** ❌ **NOT DEFINED ANYWHERE**  
**Point of Loss:** Definition gap - property never existed in JSON

**Current Workaround:** Renderer uses `getLayoutValueWithSafeDefault()` with fallback `"auto"`  
**Log Triggered:** `[LAYOUT SAFE DEFAULT]` for every layout

---

### Property: `container.marginRight`

**Expected Source:** `layout-definitions.json` → `pageLayouts[layoutId].container.marginRight`  
**Actual Source:** ❌ **NOT DEFINED ANYWHERE**  
**Point of Loss:** Definition gap - property never existed in JSON

**Current Workaround:** Renderer uses `getLayoutValueWithSafeDefault()` with fallback `"auto"`  
**Log Triggered:** `[LAYOUT SAFE DEFAULT]` for every layout

---

### Property: `container.boxSizing`

**Expected Source:** `layout-definitions.json` → `pageLayouts[layoutId].container.boxSizing`  
**Actual Source:** ❌ **NOT DEFINED ANYWHERE**  
**Point of Loss:** Definition gap - property never existed in JSON

**Current Workaround:** Renderer uses `getLayoutValueWithSafeDefault()` with fallback `"border-box"`  
**Log Triggered:** `[LAYOUT SAFE DEFAULT]` for every layout

---

### Property: `container.overflowX`

**Expected Source:** `layout-definitions.json` → `pageLayouts[layoutId].container.overflowX`  
**Actual Source:** ❌ **NOT DEFINED ANYWHERE**  
**Point of Loss:** Definition gap - property never existed in JSON

**Current Workaround:** Renderer uses `getLayoutValueWithSafeDefault()` with fallback `"hidden"`  
**Log Triggered:** `[LAYOUT SAFE DEFAULT]` for every layout

---

## C) Per-Layout Analysis

### Layout: `content-stack`

**Layout ID:** `content-stack`  
**Properties Present:**
- `containerWidth: "contained"` ✅ (semantic token only)

**Properties Missing:**
- `container.width` ❌
- `container.marginLeft` ❌
- `container.marginRight` ❌
- `container.boxSizing` ❌
- `container.overflowX` ❌

**Expected Source:** `layout-definitions.json` → `pageLayouts["content-stack"].container.*`  
**Actual Source:** ❌ **Property path does not exist**  
**First Point of Loss:** Definition gap - `container` object never defined in JSON

**Pipeline Flow:**
1. ✅ `getPageLayoutById("content-stack")` → Returns `{ containerWidth: "contained" }`
2. ✅ `resolveLayout()` → Merges pageDef + componentDef → `{ containerWidth: "contained", moleculeLayout: {...} }`
3. ✅ `LayoutMoleculeRenderer` receives layout object
4. ❌ `layout.container` → `undefined` (property path missing)
5. ⚠️ `getLayoutValueWithSafeDefault("container.width", undefined, ...)` → Logs SAFE DEFAULT

---

### Layout: `hero-centered`

**Layout ID:** `hero-centered`  
**Properties Present:**
- `containerWidth: "wide"` ✅ (semantic token only)

**Properties Missing:**
- `container.width` ❌
- `container.marginLeft` ❌
- `container.marginRight` ❌
- `container.boxSizing` ❌
- `container.overflowX` ❌

**Expected Source:** `layout-definitions.json` → `pageLayouts["hero-centered"].container.*`  
**Actual Source:** ❌ **Property path does not exist**  
**First Point of Loss:** Definition gap - `container` object never defined in JSON

---

### Layout: `hero-split`

**Layout ID:** `hero-split`  
**Properties Present:**
- `containerWidth: "full"` ✅
- `split: { type: "split", mediaSlot: "right" }` ✅

**Properties Missing:**
- `container.width` ❌
- `container.marginLeft` ❌
- `container.marginRight` ❌
- `container.boxSizing` ❌
- `container.overflowX` ❌

**Expected Source:** `layout-definitions.json` → `pageLayouts["hero-split"].container.*`  
**Actual Source:** ❌ **Property path does not exist**  
**First Point of Loss:** Definition gap - `container` object never defined in JSON

---

### Layout: `content-narrow`

**Layout ID:** `content-narrow`  
**Properties Present:**
- `containerWidth: "narrow"` ✅

**Properties Missing:**
- `container.width` ❌
- `container.marginLeft` ❌
- `container.marginRight` ❌
- `container.boxSizing` ❌
- `container.overflowX` ❌

**Expected Source:** `layout-definitions.json` → `pageLayouts["content-narrow"].container.*`  
**Actual Source:** ❌ **Property path does not exist**  
**First Point of Loss:** Definition gap - `container` object never defined in JSON

---

### Layout: `features-grid-3`

**Layout ID:** `features-grid-3`  
**Properties Present:**
- `containerWidth: "contained"` ✅

**Properties Missing:**
- `container.width` ❌
- `container.marginLeft` ❌
- `container.marginRight` ❌
- `container.boxSizing` ❌
- `container.overflowX` ❌

**Expected Source:** `layout-definitions.json` → `pageLayouts["features-grid-3"].container.*`  
**Actual Source:** ❌ **Property path does not exist**  
**First Point of Loss:** Definition gap - `container` object never defined in JSON

---

## D) Pipeline Flow Verification

### Data Flow Chain (Verified ✅)

```
1. layout-definitions.json
   └─ pageLayouts["content-stack"] = { containerWidth: "contained" }
   
2. getPageLayoutById("content-stack")
   └─ Returns: { containerWidth: "contained" }
   ✅ NO DATA LOSS
   
3. resolveLayout("content-stack")
   └─ pageDef = { containerWidth: "contained" }
   └─ componentDef = { type: "column", params: {...} }
   └─ Returns: { containerWidth: "contained", moleculeLayout: {...} }
   ✅ NO DATA LOSS
   
4. SectionCompound → LayoutMoleculeRenderer
   └─ layout prop = { containerWidth: "contained", moleculeLayout: {...} }
   ✅ NO DATA LOSS
   
5. LayoutMoleculeRenderer.tsx:350
   └─ containerLayout = layout.container ?? {}
   └─ Result: {} (empty object - property doesn't exist)
   ⚠️ EXPECTED: Property path `container` never existed
   
6. LayoutMoleculeRenderer.tsx:378-383
   └─ containerWidth = getLayoutValueWithSafeDefault("container.width", undefined, ...)
   └─ Logs: [LAYOUT SAFE DEFAULT] { layoutId: "content-stack", missing: "container.width" }
   ⚠️ SAFE DEFAULT TRIGGERED (as designed)
```

**Conclusion:** ✅ Pipeline is intact. Data flows correctly. Properties are missing at the source definition level.

---

## E) Gap Classification

### Gap Type: **DEFINITION GAP** 🔴

**Evidence:**
- Layout definitions (`layout-definitions.json`) define semantic tokens (`containerWidth: "contained"`)
- Layout definitions **never define** CSS container properties (`container.width`, `container.marginLeft`, etc.)
- Renderer expects `layout.container.*` properties that don't exist in any layout definition
- Resolver correctly passes through what exists - no merge gap, no pass-through gap

**Not a Merge Gap:**
- ✅ `resolveLayout()` correctly merges `pageDef` + `componentDef`
- ✅ No properties are stripped during merge
- ✅ Merge logic: `{ ...pageDef, moleculeLayout: componentDef ?? undefined }`

**Not a Pass-Through Gap:**
- ✅ `resolveLayout()` return value matches renderer input
- ✅ `SectionCompound` correctly passes `layout` prop to `LayoutMoleculeRenderer`
- ✅ No data transformation between resolver and renderer

**Not a Role-Mapping Gap:**
- ✅ Template role → layout mapping works correctly
- ✅ `getPageLayoutId()` correctly resolves layout IDs
- ✅ Issue is not with mapping, but with definition completeness

---

## F) Top 5 Layouts Missing Fields

### 1. `content-stack` (Most Common)
- **Missing:** `container.width`, `container.marginLeft`, `container.marginRight`, `container.boxSizing`, `container.overflowX`
- **Has:** `containerWidth: "contained"` (semantic token only)
- **Gap Type:** Definition gap

### 2. `hero-centered`
- **Missing:** `container.width`, `container.marginLeft`, `container.marginRight`, `container.boxSizing`, `container.overflowX`
- **Has:** `containerWidth: "wide"` (semantic token only)
- **Gap Type:** Definition gap

### 3. `hero-split`
- **Missing:** `container.width`, `container.marginLeft`, `container.marginRight`, `container.boxSizing`, `container.overflowX`
- **Has:** `containerWidth: "full"`, `split: {...}` (semantic tokens only)
- **Gap Type:** Definition gap

### 4. `content-narrow`
- **Missing:** `container.width`, `container.marginLeft`, `container.marginRight`, `container.boxSizing`, `container.overflowX`
- **Has:** `containerWidth: "narrow"` (semantic token only)
- **Gap Type:** Definition gap

### 5. `features-grid-3`
- **Missing:** `container.width`, `container.marginLeft`, `container.marginRight`, `container.boxSizing`, `container.overflowX`
- **Has:** `containerWidth: "contained"` (semantic token only)
- **Gap Type:** Definition gap

**Note:** All 11 layouts in `layout-definitions.json` have identical gaps.

---

## G) Where Contract is Incomplete

### Contract Incompleteness Points

1. **`layout-definitions.json` Structure**
   - **Current:** `pageLayouts[layoutId] = { containerWidth: string, split?: {...}, backgroundVariant?: string }`
   - **Missing:** `container: { width?: string, marginLeft?: string, marginRight?: string, boxSizing?: string, overflowX?: string }`
   - **Impact:** Renderer expects `container.*` properties that don't exist

2. **`PageLayoutDefinition` Type**
   - **Location:** `src/04_Presentation/layout/page/page-layout-resolver.ts:9-13`
   - **Current:** `{ containerWidth?, split?, backgroundVariant? }`
   - **Missing:** `container?: { width?, marginLeft?, marginRight?, boxSizing?, overflowX? }`
   - **Impact:** TypeScript types don't reflect renderer expectations

3. **`LayoutDefinition` Type**
   - **Location:** `src/04_Presentation/layout/resolver/layout-resolver.ts:23-32`
   - **Current:** `{ containerWidth?, split?, backgroundVariant?, moleculeLayout? }`
   - **Missing:** `container?: { width?, marginLeft?, marginRight?, boxSizing?, overflowX? }`
   - **Impact:** Type mismatch between resolver output and renderer input

---

## H) Semantic Token vs CSS Property Mismatch

### Current System

**Layout Definitions Use Semantic Tokens:**
```json
{
  "content-stack": {
    "containerWidth": "contained"  // Semantic token
  }
}
```

**Renderer Expects CSS Properties:**
```typescript
const containerLayout = layout.container ?? {};
const containerWidth = containerLayout.width;  // CSS property
```

**Translation Layer:**
- **Location:** `LayoutMoleculeRenderer.tsx:354-375`
- **Logic:** Maps `containerWidth: "contained"` → CSS variable `var(--container-content)`
- **Gap:** Translation happens, but renderer ALSO expects `container.width` to exist

**Problem:** Renderer expects BOTH:
1. Semantic token (`containerWidth`) → Used for `maxWidth` calculation
2. CSS properties (`container.width`, `container.marginLeft`, etc.) → Used for direct style application

**Current Behavior:**
- Semantic token exists ✅
- CSS properties missing ❌
- Renderer falls back to safe defaults ⚠️

---

## I) SAFE DEFAULT Log Analysis

### Log Location

**File:** `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`  
**Function:** `getLayoutValueWithSafeDefault()` (lines 19-38)  
**Trigger:** Lines 378-383

### Log Pattern

```typescript
console.warn("[LAYOUT SAFE DEFAULT]", {
  layoutId: "content-stack",
  missing: "container.width",
  defaultValue: "100%"
});
```

### Frequency

**Every layout renders:** 5 SAFE DEFAULT warnings per layout
- `container.width` → `"100%"`
- `container.marginLeft` → `"auto"`
- `container.marginRight` → `"auto"`
- `container.boxSizing` → `"border-box"`
- `container.overflowX` → `"hidden"`

**Total:** 11 layouts × 5 properties = **55 SAFE DEFAULT warnings per page load** (if all layouts are used)

---

## J) Expected vs Actual Contract

### Expected Contract (What Renderer Expects)

```typescript
type LayoutDefinition = {
  containerWidth?: string;  // Semantic token
  container?: {              // CSS properties
    width?: string;
    marginLeft?: string;
    marginRight?: string;
    boxSizing?: string;
    overflowX?: string;
  };
  split?: {...};
  backgroundVariant?: string;
  moleculeLayout?: {...};
};
```

### Actual Contract (What Definitions Provide)

```typescript
type PageLayoutDefinition = {
  containerWidth?: string;  // ✅ Semantic token exists
  split?: {...};            // ✅ Exists
  backgroundVariant?: string; // ✅ Exists
  // ❌ container object missing
};
```

---

## K) Resolution Recommendations (Analysis Only)

### Option 1: Add Container Properties to Layout Definitions

**Change:** Add `container` object to each layout in `layout-definitions.json`

**Example:**
```json
{
  "content-stack": {
    "containerWidth": "contained",
    "container": {
      "width": "100%",
      "marginLeft": "auto",
      "marginRight": "auto",
      "boxSizing": "border-box",
      "overflowX": "hidden"
    }
  }
}
```

**Pros:**
- ✅ Eliminates SAFE DEFAULT warnings
- ✅ Explicit contract matches renderer expectations
- ✅ Full control over container styles per layout

**Cons:**
- ⚠️ Requires updating all 11 layouts
- ⚠️ Duplicates semantic token → CSS property mapping

---

### Option 2: Derive Container Properties from Semantic Tokens

**Change:** Renderer derives `container.*` properties from `containerWidth` token

**Example:**
```typescript
// In LayoutMoleculeRenderer.tsx
const containerProps = deriveContainerProps(rawWidth);
// Returns: { width: "100%", marginLeft: "auto", ... }
```

**Pros:**
- ✅ Single source of truth (semantic token)
- ✅ No duplication
- ✅ Centralized mapping logic

**Cons:**
- ⚠️ Less flexible (can't override per layout)
- ⚠️ Requires refactoring renderer logic

---

### Option 3: Remove Container Property Expectations

**Change:** Renderer only uses semantic tokens, removes `container.*` property checks

**Pros:**
- ✅ Simplifies contract
- ✅ Aligns with current definition structure

**Cons:**
- ⚠️ Loses granular control over container styles
- ⚠️ Requires removing safe default logic

---

## L) Summary

### Gap Type: **DEFINITION GAP** 🔴

**Root Cause:** Layout definitions use semantic tokens (`containerWidth`) but renderer expects CSS properties (`container.width`, `container.marginLeft`, etc.) that don't exist in any layout definition.

**Pipeline Status:** ✅ **INTACT** - No data loss, no merge issues, no pass-through problems.

**Impact:** All layouts trigger 5 SAFE DEFAULT warnings each because `container.*` properties are missing.

**Fix Required:** Either:
1. Add `container` object to layout definitions, OR
2. Derive container properties from semantic tokens in renderer, OR
3. Remove container property expectations from renderer

**No Code Changes Made:** This is a read-only audit report.

---

**END OF AUDIT REPORT**
