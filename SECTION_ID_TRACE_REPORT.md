# Section ID Trace Report

## Problem Diagnosis
**Your dropdowns fail because page → section ID mapping is broken in the compiler, and onboarding is unrelated because it runs on a separate flow engine that never mounts into the compiled site viewer.**

---

## 1. Section ID Creation Flow

### Step 1: normalizeSiteData.ts (Line 160)
**Location:** `src/lib/site-compiler/normalizeSiteData.ts:160`

**Section ID Format:**
```typescript
const sectionId = `block-${pageSlugSafe}-${index}`;
// Example: "block-home-0", "block-products-1"
```

**Context:**
- Sections are created from `normalizedPages` (original page structure)
- `pageSlugSafe` = page slug with "/" removed, "/" becomes "home", "/" replaced with "-"
- IDs assigned: `block-home-0`, `block-home-1`, `block-products-0`, etc.

**Code:**
```typescript
const allSections = normalizedPages.flatMap(page => 
  page.sections.map((section, index) => {
    const pageSlugSafe = page.slug === "/" 
      ? "home" 
      : page.slug.replace(/^\//, "").replace(/\//g, "-");
    const sectionId = `block-${pageSlugSafe}-${index}`;
    
    return {
      id: sectionId,  // ← FIRST ID ASSIGNMENT
      type: section.type,
      // ...
    };
  })
);
```

---

### Step 2: derivePagesFromNav.ts (Line 292)
**Location:** `src/lib/site-normalizer/derivePagesFromNav.ts:292`

**Action:**
- Populates `page.sectionIds` array with section IDs from Step 1
- Uses content matching to assign sections to pages

**Code:**
```typescript
page.sectionIds.push(sectionId);  // ← sectionId from normalizeSiteData
```

**Result:**
- `derivedPages[].sectionIds` = `["block-home-0", "block-home-1", "block-products-0"]`
- These IDs reference sections created in Step 1

---

### Step 3: compileSiteToSchema.ts (Line 196)
**Location:** `src/lib/site-compiler/compileSiteToSchema.ts:196`

**Section ID Format (REGENERATED):**
```typescript
id: `block-${pageSlugSafe}-${index}`
// Example: "block-home-0", "block-products-1"
```

**Problem:**
- Sections are **REGENERATED** with NEW IDs
- `pageSlugSafe` is recalculated from **derived pages** (not original normalized pages)
- Index is recalculated based on **layout blocks** (not original sections)

**Code:**
```typescript
const sections: LayoutBlock[] = layoutBlocks.map((block, index) => ({
  id: `block-${pageSlugSafe}-${index}`,  // ← NEW ID (DIFFERENT FROM STEP 1!)
  type: block.type,
  // ...
}));
```

**ID Divergence:**
- Original sections: `block-home-0`, `block-home-1` (from normalizedPages)
- Derived page.sectionIds: `["block-home-0", "block-home-1"]` (references original)
- Regenerated sections: `block-home-0`, `block-home-1` (from derived pages, but layout may differ)
- **If layout blocks are filtered/transformed, indices change → IDs diverge**

---

### Step 4: GeneratedSiteViewer.tsx (Line 288)
**Location:** `src/engine/site-runtime/GeneratedSiteViewer.tsx:288`

**Action:**
- Filters sections using `page.sectionIds` from Step 2
- But sections have IDs from Step 3 (regenerated)

**Code:**
```typescript
if (currentPage && visibleSectionIds.length > 0) {
  activePageSections = allPageSections.filter((section: any) => {
    const sectionId = section.id;  // ← ID from Step 3 (regenerated)
    return sectionId && visibleSectionIds.includes(sectionId);  // ← IDs from Step 2 (original)
  });
}
```

**Result:**
- `visibleSectionIds` = `["block-home-0", "block-home-1"]` (from derivedPages)
- `section.id` = `"block-home-0"` (from compiled schema, may have different index)
- **If indices don't match → no sections match → fallback to all sections**

---

## 2. Where IDs Diverge

### Divergence Point 1: Layout Block Transformation
**Location:** `compilePageLayout()` in `compileSiteToSchema.ts:255`

**Issue:**
- Original sections → Layout blocks (may filter/transform)
- `convertSectionToLayoutBlock()` may skip sections
- Index changes when sections are filtered

**Example:**
```
Original sections: [heading, text, image, text]
Layout blocks: [hero (from heading), text, image, text]  // heading → hero, index same
But if image is filtered: [hero, text, text]  // index changes!
```

---

### Divergence Point 2: Derived Page Slug Mismatch
**Location:** `compilePagesToSchema()` in `compileSiteToSchema.ts:165`

**Issue:**
- `pageSlugSafe` calculated from `derivedPage.slug` (may differ from original)
- Original: `page.slug = "/products"`
- Derived: `derivedPage.slug = "/shop"` (if nav changed)
- IDs: `block-products-0` vs `block-shop-0` → **MISMATCH**

---

### Divergence Point 3: Section Filtering
**Location:** `normalizeSiteData.ts:184` (payment icon filtering)

**Issue:**
- Sections filtered AFTER ID assignment
- `derivePagesFromNav` uses filtered sections
- But `compileSiteToSchema` may use unfiltered sections
- Index mismatch → ID mismatch

---

## 3. Onboarding Connection Check

### Search Results:
- ❌ **No onboarding imports in `compileSiteToSchema.ts`**
- ❌ **No onboarding imports in `GeneratedSiteViewer.tsx`**
- ❌ **No `onboarding.flow.json` references in site compiler**

### Conclusion:
**Onboarding is a separate system:**
- Lives in `/api/sites/[domain]/onboarding` route
- Rendered by `SiteOnboardingScreen.tsx` (separate from `GeneratedSiteViewer`)
- Uses `OnboardingFlowRenderer.tsx` (separate engine)
- **Never mounts into compiled site viewer**

### Bridge Required:
To mount onboarding in compiled site:
1. Add onboarding section type to `SiteLayout` types
2. Add onboarding block in `compileSiteToSchema` (reads `onboarding.flow.json`)
3. Add onboarding renderer in `GeneratedSiteViewer` (renders `OnboardingFlowRenderer`)

---

## 4. Fix Recommendations

### Fix 1: Preserve Original Section IDs
**Location:** `compileSiteToSchema.ts:169`

**Change:**
```typescript
// BEFORE (regenerates IDs):
const sections: LayoutBlock[] = layoutBlocks.map((block, index) => ({
  id: `block-${pageSlugSafe}-${index}`,  // ← NEW ID
  // ...
}));

// AFTER (preserve original IDs):
const sections: LayoutBlock[] = layoutBlocks.map((block, index) => {
  // Find original section ID from normalized page
  const originalSection = normalizedPage?.sections[index];
  const originalId = originalSection?.id || `block-${pageSlugSafe}-${index}`;
  
  return {
    id: originalId,  // ← PRESERVE ORIGINAL ID
    // ...
  };
});
```

### Fix 2: Map Layout Blocks to Original Sections
**Location:** `compilePageLayout()` in `compileSiteToSchema.ts:270`

**Change:**
```typescript
// Track original section IDs when converting
const sectionIdMap = new Map<SiteLayout, string>();

page.sections.forEach((section, index) => {
  const block = convertSectionToLayoutBlock(section, site, {...});
  if (block) {
    layout.push(block);
    sectionIdMap.set(block, section.id || `block-${pageSlugSafe}-${index}`);
  }
});

// Use mapped IDs when creating LayoutBlocks
const sections: LayoutBlock[] = layoutBlocks.map((block, index) => ({
  id: sectionIdMap.get(block) || `block-${pageSlugSafe}-${index}`,
  // ...
}));
```

### Fix 3: Use Derived Page SectionIds Directly
**Location:** `compilePagesToSchema()` in `compileSiteToSchema.ts:169`

**Change:**
```typescript
// Instead of regenerating, use sectionIds from derivedPages
const sections: LayoutBlock[] = derivedPage.sectionIds.map((sectionId, index) => {
  // Find section by ID in normalized site
  const originalSection = site.pages
    .flatMap(p => p.sections)
    .find(s => s.id === sectionId);
  
  if (!originalSection) return null;
  
  const block = convertSectionToLayoutBlock(originalSection, site, {...});
  return {
    id: sectionId,  // ← USE ORIGINAL ID FROM derivedPage.sectionIds
    type: block.type,
    // ...
  };
}).filter(Boolean);
```

---

## 5. Summary

### Root Cause:
**Section IDs are assigned in `normalizeSiteData`, stored in `derivedPages.sectionIds`, but then REGENERATED in `compileSiteToSchema` with potentially different indices/slugs, causing `GeneratedSiteViewer` to fail matching sections.**

### Onboarding Status:
**Onboarding is completely separate and never mounts into the compiled site viewer. A bridge component would be needed to integrate them.**

### One-Sentence Diagnosis:
**Your dropdowns fail because page → section ID mapping is broken in the compiler (IDs regenerated with different indices), and onboarding is unrelated because it runs on a separate flow engine that never mounts into the compiled site viewer.**
