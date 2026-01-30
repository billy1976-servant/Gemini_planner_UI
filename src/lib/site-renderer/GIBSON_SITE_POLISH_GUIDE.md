# Getting to Gibson.com Look - Action Plan

## Current Issues

Based on the rendering, you're seeing:
1. **Navigation showing "Amazon" repeatedly** - Wrong data extraction
2. **Only text headings** (e.g., "Guitars", "Amps & Effects") - Missing rich content
3. **No product images** - Products not being extracted/displayed
4. **Minimal styling** - Basic layout, no marketing polish

## Root Causes

### 1. **Old Data Structure (Not V2)**
The current data in `src/content/sites/raw/gibson-com/` is from the **old ripper** that only extracted:
- 1 product with 100+ images attached
- Basic navigation from supportLinks (which may be pulling wrong data)
- No structured pages/sections

### 2. **Navigation Extraction Bug**
The `normalizeNavigation` function is likely pulling from `supportLinks` which contains Amazon affiliate links instead of actual site navigation.

### 3. **Missing Product Grid**
Products aren't being displayed because:
- Only 1 product exists in old data
- Product grid block may not be in schema
- Images aren't being properly attached

## Solution Steps

### Step 1: Re-run Ripper with V2 Structure

**Run the V2 ripper to get proper data:**

```bash
npm run compile
# Enter: gibson.com
```

This will:
- Crawl multiple pages (homepage + nav + PDPs)
- Extract one product per PDP (not one mega-product)
- Build proper pages[] with sections[]
- Extract correct navigation

**Expected output:**
- `src/content/sites/raw/gibson-com/site.snapshot.json` with `rawData.v2.pages[]`
- `src/content/sites/raw/gibson-com/product.graph.json` with multiple products

### Step 2: Fix Navigation Extraction

**Problem:** `normalizeNavigation` is pulling from `supportLinks` (Amazon links) instead of actual nav.

**Fix needed in `normalizeSiteData.ts`:**

```typescript
function normalizeNavigation(snapshot: RawSiteSnapshot | null): NavItem[] {
  if (!snapshot) return [];
  
  // V2 structure: Extract from pages
  if (snapshot.rawData?.v2?.pages) {
    const nav: NavItem[] = [];
    snapshot.rawData.v2.pages.forEach((page: any) => {
      if (page.navLabel) {
        nav.push({ label: page.navLabel, path: page.id });
      } else if (page.id !== "/" && page.title) {
        // Use page title as nav label
        nav.push({ label: page.title, path: page.id });
      }
    });
    return nav;
  }
  
  // Legacy: Try structured navigation
  if (Array.isArray(snapshot.navigation)) {
    return snapshot.navigation
      .filter((item: any) => item.label && !item.label.toLowerCase().includes("amazon"))
      .map((item: any) => ({
        label: item.label || item.text || item.name,
        path: item.path || item.href || item.url || "#",
      }));
  }
  
  // DON'T use supportLinks - they're affiliate links, not navigation
  return [];
}
```

### Step 3: Ensure Product Grid is in Schema

**Check `compileSiteToSchema.ts`** - The homepage should have a `productGrid` block if products exist.

**Verify:**
- `buildHomepageLayout()` includes `{ type: "productGrid", source: "products" }`
- `enrichHomepageLayout()` adds product grid if missing

### Step 4: Improve Section Extraction

**Problem:** Only basic text sections are being extracted, missing:
- Hero images
- Product images
- Rich content blocks

**Fix in `compileSiteToSchema.ts`:**

```typescript
function convertSectionToLayoutBlock(section: Section, site: NormalizedSite): SiteLayout | null {
  switch (section.type) {
    case "heading":
      // If it's a large heading at the start, make it a hero
      if (section.content.length < 60) {
        return {
          type: "hero",
          heading: section.content,
          subheading: undefined,
          image: site.media[0]?.url, // Use first media asset
        };
      }
      return null; // Skip standalone headings
    
    case "text":
      return {
        type: "text",
        body: section.content,
      };
    
    case "image":
      return {
        type: "image",
        src: section.content,
        caption: section.metadata?.alt,
      };
    
    // ... rest
  }
}
```

### Step 5: Add Rich Homepage Layout

**Ensure homepage has:**
1. Hero section (with image)
2. Category grid (from navigation)
3. Feature grid (from text sections)
4. Product grid (from products)
5. CTA strip

**Check `buildHomepageLayout()` in `compileSiteToSchema.ts`** - it should create all these blocks.

### Step 6: Verify Product Images

**Problem:** Products may have images but they're not being displayed.

**Check:**
1. `normalizeProducts()` extracts `images: string[]` correctly
2. `ProductGridSection` component displays images
3. Image URLs are valid and accessible

**Fix if needed:**
- Ensure product images are extracted from `product.images[]`
- Verify image URLs are absolute (not relative)
- Check CORS/accessibility of image URLs

## Testing Checklist

After fixes, verify:

1. **Navigation:**
   - `/api/sites/gibson-com/normalized` shows `navigation` with correct labels (not "Amazon")
   - NavBar displays proper links

2. **Products:**
   - `/api/sites/gibson-com/normalized` shows `products.length > 1`
   - Product grid displays multiple products with images

3. **Pages:**
   - `/api/sites/gibson-com/schema` shows `pages.length > 1`
   - Homepage has hero, categoryGrid, productGrid blocks

4. **Rendering:**
   - Viewer shows hero image
   - Product grid shows multiple products with images
   - Navigation shows correct links
   - Styling looks professional

## Quick Fixes (If V2 Ripper Not Run Yet)

If you can't re-run the ripper immediately:

1. **Fix Navigation:** Update `normalizeNavigation()` to filter out "Amazon" links
2. **Add Product Grid:** Manually ensure homepage schema includes productGrid
3. **Extract More Sections:** Improve section extraction to get images and rich content

But **recommended:** Re-run V2 ripper for proper data structure.
