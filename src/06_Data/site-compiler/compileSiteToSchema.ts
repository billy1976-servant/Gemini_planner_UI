/**
 * Site Schema Compiler
 * 
 * Converts NormalizedSite into pure SiteSchema JSON.
 * NO JSX. NO UI. ONLY JSON.
 * 
 * Input: NormalizedSite (from normalizeSiteData)
 * Output: SiteSchema (layout JSON)
 */

import { normalizeSiteData, NormalizedSite, NormalizedPage, Section, NormalizedProduct, NavItem, MediaAsset } from "./normalizeSiteData";
import { SiteLayout, SchemaMeta, FeatureItem, CategoryItem, TrustItem } from "@/lib/site-schema/siteLayout.types";
import { SiteSchema, SitePage, LayoutBlock } from "@/types/siteSchema";

/**
 * Slugify a product name for URL generation
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Normalize product image URLs: keep original external URLs
 */
function normalizeImageUrl(url: string): string {
  return url; // keep original Gibson CDN URL
}

/**
 * Convert NormalizedProduct to schema product format
 * Normalizes image URLs and product URLs
 */
function convertProductToSchemaFormat(product: NormalizedProduct): any {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand || undefined,
    images: product.images.map(normalizeImageUrl),
    url: product.url && product.url.startsWith('https://')
      ? `/product/${slugify(product.name)}`
      : product.url,
  };
}

/**
 * Build product grid block with populated products array
 */
function buildProductGridBlock(site: NormalizedSite): SiteLayout {
  const products = site.products
    .filter(p => p.category !== "website" && p.name !== "Gibson") // Filter out brand entity
    .map(convertProductToSchemaFormat);
  
  return {
    type: "productGrid",
    source: "products",
    role: "features",
    products, // ✅ Populated products array
  } as SiteLayout;
}

/**
 * Compile normalized site data into SiteSchema JSON
 */
export async function compileSiteToSchema(domain: string): Promise<SiteSchema> {
  // Load normalized site
  const site = normalizeSiteData(domain);
  
  // Compile pages
  const pages = compilePagesToSchema(site.pages, site);
  
  // Note: derivedPages are already set in normalizeSiteData using nav-driven derivation
  // No need to re-derive here - the pages are already correctly structured
  
  // Ensure homepage exists with rich layout
  const homepage = pages.find(p => p.path === "/");
  if (!homepage) {
    // Create homepage if missing
    pages.unshift(createHomepageSchema(site));
  } else {
    // Enrich existing homepage - convert sections back to layout, enrich, then convert back
    const layoutBlocks = homepage.sections.map(s => {
      // Convert LayoutBlock back to SiteLayout for enrichment (temporary)
      const block: any = { type: s.type, ...s };
      if (s.content) {
        if (s.type === "hero") {
          block.heading = s.content.heading;
          block.subheading = s.content.subheading;
          block.image = s.content.image;
        } else if (s.type === "text") {
          block.body = s.content.body;
        } else if (s.type === "image") {
          block.src = s.content.src;
          block.caption = s.content.caption;
        } else if (s.type === "list") {
          block.items = s.content.items;
        } else if (s.type === "categoryGrid") {
          block.title = s.content.title;
          block.categories = s.content.categories;
        } else if (s.type === "featureGrid") {
          block.title = s.content.title;
          block.items = s.content.items;
        } else if (s.type === "productGrid") {
          block.products = s.content.products || (s as any).products;
        }
      }
      return block as SiteLayout;
    });
    const enrichedLayout = enrichHomepageLayout(layoutBlocks, site);
    // Convert back to LayoutBlock[]
    // Preserve existing IDs or generate consistent format: block-{pageId}-{index}
    homepage.sections = enrichedLayout.map((block, index) => ({
      id: homepage.sections[index]?.id || `block-home-${index}`,
      type: block.type,
      content: extractBlockContent(block),
      layout: 'layout' in block ? block.layout : undefined,
      actions: extractBlockActions(block),
      ...block,
    }));
  }
  
  // Build schema with pages (pages are already normalized in normalizeSiteData)
  // The derivedPages are stored in site.derivedPages and used by the viewer
  return {
    domain: site.domain,
    pages,
    meta: createSchemaMeta(site, pages),
  };
}

/**
 * Compile pages into schema format (canonical SitePage format)
 */
function compilePagesToSchema(
  normalizedPages: NormalizedPage[],
  site: NormalizedSite
): SitePage[] {
  // ✅ STEP D: Use derivedPages if available, otherwise compile from normalizedPages
  const derivedPages = site.derivedPages;
  
  if (derivedPages && derivedPages.length > 0) {
    // Compile pages based on derived pages structure
    return derivedPages.map(derivedPage => {
      // Find corresponding normalized page or create from derived page
      const normalizedPage = normalizedPages.find(p => {
        const pageSlugSafe = p.slug === "/" ? "home" : p.slug.replace(/^\//, "").replace(/\//g, "-");
        return pageSlugSafe === derivedPage.id || p.slug === derivedPage.slug;
      });
      
      // Get sections for this page
      let layoutBlocks: SiteLayout[] = [];
      if (normalizedPage) {
        layoutBlocks = compilePageLayout(normalizedPage, site);
      } else if (derivedPage.id === "products" && site.products.length > 0) {
        // Create productGrid for Products page if missing
        layoutBlocks = [buildProductGridBlock(site)];
      }
      
      // Convert SiteLayout[] to LayoutBlock[] with IDs from derivedPages.sectionIds (no regeneration)
      const pageSlugSafe = derivedPage.slug === "/"
        ? "home"
        : derivedPage.slug.replace(/^\//, "").replace(/\//g, "-");
      const sectionIds = derivedPage.sectionIds ?? [];

      const sections: LayoutBlock[] = layoutBlocks.map((block, index) => ({
        id: sectionIds[index] ?? `block-${pageSlugSafe}-${index}`,
        type: block.type,
        content: extractBlockContent(block),
        layout: 'layout' in block ? block.layout : undefined,
        actions: extractBlockActions(block),
        ...block,
      }));
      
      return {
        id: derivedPage.id,
        path: derivedPage.slug,
        title: derivedPage.title, // Use derived title (not normalized title which may have "American Express")
        sections,
      };
    });
  }
  
  // Fallback: compile from normalizedPages (old behavior)
  return normalizedPages.map((page) => {
    const layoutBlocks = compilePageLayout(page, site);
    const pageId = page.slug === "/" ? "home" : page.slug.replace(/^\//, "").replace(/\//g, "-");
    const pageSlugSafe = page.slug === "/" 
      ? "home" 
      : page.slug.replace(/^\//, "").replace(/\//g, "-");
    
    const sections: LayoutBlock[] = layoutBlocks.map((block, index) => ({
      id: `block-${pageSlugSafe}-${index}`,
      type: block.type,
      content: extractBlockContent(block),
      layout: 'layout' in block ? block.layout : undefined,
      actions: extractBlockActions(block),
      ...block,
    }));
    
    return {
      id: pageId,
      path: page.slug,
      title: page.title,
      sections,
    };
  });
}

/**
 * Extract content from a SiteLayout block for LayoutBlock.content
 */
function extractBlockContent(block: SiteLayout): any {
  // Extract relevant content properties based on block type
  if (block.type === "hero") {
    return { heading: (block as any).heading, subheading: (block as any).subheading, image: (block as any).image };
  }
  if (block.type === "text") {
    return { body: (block as any).body };
  }
  if (block.type === "image") {
    return { src: (block as any).src, caption: (block as any).caption };
  }
  if (block.type === "list") {
    return { items: (block as any).items };
  }
  if (block.type === "categoryGrid") {
    return { title: (block as any).title, categories: (block as any).categories };
  }
  if (block.type === "featureGrid") {
    return { title: (block as any).title, items: (block as any).items };
  }
  if (block.type === "productGrid") {
    return { products: (block as any).products || [] };
  }
  // Return the block itself as content for other types
  return block;
}

/**
 * Extract actions from a SiteLayout block (if any)
 */
function extractBlockActions(block: SiteLayout): any[] | undefined {
  // For now, blocks don't have actions yet, but this is where we'd extract them
  // This will be populated when schema includes action definitions
  return undefined;
}

/**
 * Compile page sections into layout blocks
 */
function compilePageLayout(
  page: NormalizedPage,
  site: NormalizedSite
): SiteLayout[] {
  const layout: SiteLayout[] = [];
  
  // Add navigation at the start
  if (page.slug === "/") {
    layout.push({ type: "nav" });
  }
  
  // Track if we've seen a hero heading (only first prominent heading becomes hero)
  let hasHeroHeading = false;
  
  // Convert sections to layout blocks
  page.sections.forEach((section, index) => {
    const block = convertSectionToLayoutBlock(section, site, {
      isFirstHeading: !hasHeroHeading && section.type === "heading",
      sectionIndex: index,
    });
    if (block) {
      layout.push(block);
      // Mark that we've created a hero if this was a heading
      if (block.type === "hero") {
        hasHeroHeading = true;
      }
    }
  });
  
  // Add footer at the end
  layout.push({ type: "footer", role: "footer" });
  
  return layout;
}

/**
 * Create homepage schema if missing
 */
function createHomepageSchema(site: NormalizedSite): SitePage {
  const layoutBlocks = buildHomepageLayout(site);
  const sections: LayoutBlock[] = layoutBlocks.map((block, index) => ({
    id: `block-home-${index}`,
    type: block.type,
    content: extractBlockContent(block),
    layout: 'layout' in block ? block.layout : undefined,
    actions: extractBlockActions(block),
    ...block,
  }));
  
  return {
    id: "home",
    path: "/",
    title: site.domain.replace(/-/g, ".").replace(/\.com$/, ""),
    sections,
  };
}

/**
 * Enrich existing homepage layout
 * Note: This function still works with SiteLayout[] for internal use,
 * but the result will be converted to LayoutBlock[] in compilePagesToSchema
 */
function enrichHomepageLayout(
  existingLayout: SiteLayout[],
  site: NormalizedSite
): SiteLayout[] {
  // If homepage is too sparse, replace with rich layout
  const hasHero = existingLayout.some(b => b.type === "hero");
  const hasProductGrid = existingLayout.some(b => b.type === "productGrid");
  const hasCategoryGrid = existingLayout.some(b => b.type === "categoryGrid");
  
  if (!hasHero && !hasProductGrid && !hasCategoryGrid && existingLayout.length <= 3) {
    // Replace with rich layout
    return buildHomepageLayout(site);
  }
  
  // Otherwise, inject missing blocks intelligently
  const enriched: SiteLayout[] = [...existingLayout];
  
  // Ensure hero exists (insert after nav)
  if (!hasHero) {
    const navIndex = enriched.findIndex(b => b.type === "nav");
    const hero = selectHeroBlock(site);
    if (hero) {
      enriched.splice(navIndex + 1, 0, hero);
    }
  }
  
  // Ensure product grid exists if we have products
  if (!hasProductGrid && site.products.length > 0) {
    const footerIndex = enriched.findIndex(b => b.type === "footer");
    enriched.splice(footerIndex, 0, buildProductGridBlock(site));
  }
  
  return enriched;
}

/**
 * Build rich homepage layout
 */
function buildHomepageLayout(site: NormalizedSite): SiteLayout[] {
  const layout: SiteLayout[] = [];
  
  // 1. Navigation
  layout.push({ type: "nav" });
  
  // 2. Hero
  const hero = selectHeroBlock(site);
  if (hero) {
    layout.push({ ...hero, role: "hero" } as SiteLayout);
  }
  
  // 3. Trust bar
  const trustBar = buildTrustBar(site);
  if (trustBar) {
    layout.push(trustBar);
  }
  
  // 4. Category grid
  const categoryGrid = buildCategoryGrid(site);
  if (categoryGrid) {
    layout.push(categoryGrid);
  }
  
  // 5. Feature grid
  const featureGrid = buildFeatureGrid(site);
  if (featureGrid) {
    layout.push(featureGrid);
  }
  
  // 6. Product grid
  if (site.products.length > 0) {
    layout.push(buildProductGridBlock(site));
  }
  
  // 7. CTA strip
  const ctaStrip = buildCTAStrip(site);
  if (ctaStrip) {
    layout.push(ctaStrip);
  }
  
  // 8. Footer
  layout.push({ type: "footer", role: "footer" });
  
  return layout;
}

/**
 * Select hero block with heuristics
 */
function selectHeroBlock(site: NormalizedSite): SiteLayout | null {
  // Find first strong page image or top media asset
  let heroImage: string | undefined;
  
  // Check homepage sections for images
  const homepage = site.pages.find(p => p.slug === "/");
  if (homepage) {
    const imageSection = homepage.sections.find(s => s.type === "image");
    if (imageSection && typeof imageSection.content === "string") {
      heroImage = imageSection.content;
    }
  }
  
  // Fallback to top media asset (prefer large images)
  if (!heroImage && site.media.length > 0) {
    const largeImage = site.media.find(m => 
      (m.width && m.width > 800) || (m.height && m.height > 600)
    );
    heroImage = largeImage?.url || site.media[0]?.url;
  }
  
  // Get heading from homepage title or first heading section
  let heading = site.domain.replace(/-/g, ".").replace(/\.com$/, "");
  let subheading: string | undefined;
  
  if (homepage) {
    const headingSection = homepage.sections.find(s => s.type === "heading");
    if (headingSection) {
      heading = headingSection.content;
    }
    
    // Get subheading from first text section
    const textSection = homepage.sections.find(s => s.type === "text");
    if (textSection && textSection.content.length < 200) {
      subheading = textSection.content;
    }
  }
  
  return {
    type: "hero",
    heading,
    subheading,
    image: heroImage,
  };
}

/**
 * Build trust bar from site data
 */
function buildTrustBar(site: NormalizedSite): SiteLayout | null {
  const items: TrustItem[] = [];
  
  // Extract trust indicators from navigation or products
  if (site.products.length > 0) {
    items.push({ label: `${site.products.length} Products` });
  }
  
  if (site.media.length > 10) {
    items.push({ label: "Premium Quality" });
  }
  
  // Extract from navigation labels that suggest trust
  site.navigation.forEach(nav => {
    const label = nav.label.toLowerCase();
    if (label.includes("about") || label.includes("story") || label.includes("heritage")) {
      items.push({ label: nav.label, sublabel: "Learn More" });
    }
  });
  
  if (items.length === 0) {
    return null;
  }
  
  return {
    type: "trustBar",
    items: items.slice(0, 6), // Max 6 items
    role: "content",
  };
}

/**
 * Build category grid from navigation + product tags
 */
function buildCategoryGrid(site: NormalizedSite): SiteLayout | null {
  const categoryMap = new Map<string, { label: string; image?: string; href: string }>();
  
  // Extract from navigation
  site.navigation.forEach(nav => {
    if (!nav.external && nav.path !== "/" && nav.path !== "#") {
      categoryMap.set(nav.label.toLowerCase(), {
        label: nav.label,
        href: nav.path,
      });
    }
  });
  
  // Extract from product categories
  site.products.forEach(product => {
    if (product.category && product.category !== "website") {
      const key = product.category.toLowerCase();
      if (!categoryMap.has(key)) {
        // Find image from first product in this category
        const categoryProduct = site.products.find(p => 
          p.category?.toLowerCase() === key && p.images.length > 0
        );
        categoryMap.set(key, {
          label: product.category,
          image: categoryProduct?.images[0],
          href: `/products?category=${encodeURIComponent(product.category)}`,
        });
      }
    }
  });
  
  // Extract from product brands
  site.products.forEach(product => {
    if (product.brand) {
      const key = `brand-${product.brand.toLowerCase()}`;
      if (!categoryMap.has(key) && categoryMap.size < 12) {
        const brandProduct = site.products.find(p => 
          p.brand?.toLowerCase() === product.brand.toLowerCase() && p.images.length > 0
        );
        categoryMap.set(key, {
          label: product.brand,
          image: brandProduct?.images[0],
          href: `/products?brand=${encodeURIComponent(product.brand)}`,
        });
      }
    }
  });
  
  const categories = Array.from(categoryMap.values()).slice(0, 12);
  
  if (categories.length === 0) {
    return null;
  }
  
  return {
    type: "categoryGrid",
    title: categories.length > 0 ? "Explore" : undefined,
    categories,
    role: "features",
  };
}

/**
 * Build feature grid from text sections
 */
function buildFeatureGrid(site: NormalizedSite): SiteLayout | null {
  const features: FeatureItem[] = [];
  
  // Extract from homepage sections
  const homepage = site.pages.find(p => p.slug === "/");
  if (homepage) {
    // Find short headings (likely features)
    const headings = homepage.sections.filter(s => 
      s.type === "heading" && s.content.length < 60
    );
    
    // Find lists (likely feature lists)
    const lists = homepage.sections.filter(s => s.type === "list");
    
    // Combine headings with following text/list
    headings.forEach((heading, index) => {
      const nextSection = homepage.sections[homepage.sections.indexOf(heading) + 1];
      features.push({
        title: heading.content,
        body: nextSection && nextSection.type === "text" 
          ? nextSection.content.substring(0, 120)
          : undefined,
      });
    });
    
    // Extract from list items
    lists.forEach(list => {
      const items: string[] = Array.isArray(list.content) 
        ? list.content.filter((item): item is string => typeof item === "string")
        : (typeof list.content === "string" ? list.content.split("\n").filter(Boolean) : []);
      items.slice(0, 6).forEach(item => {
        if (typeof item === "string" && item.length < 100) {
          features.push({ title: item });
        }
      });
    });
  }
  
  if (features.length === 0) {
    return null;
  }
  
  return {
    type: "featureGrid",
    title: features.length > 0 ? "Features" : undefined,
    items: features.slice(0, 6), // Max 6 features
    role: "features",
  };
}

/**
 * Build CTA strip from navigation
 */
function buildCTAStrip(site: NormalizedSite): SiteLayout | null {
  // Find obvious CTA links from navigation
  const ctaKeywords = ["shop", "buy", "find dealer", "learn more", "get started", "contact", "visit"];
  
  let primaryLink: { label: string; href: string } | undefined;
  let secondaryLink: { label: string; href: string } | undefined;
  
  for (const nav of site.navigation) {
    const labelLower = nav.label.toLowerCase();
    const isCTA = ctaKeywords.some(keyword => labelLower.includes(keyword));
    
    if (isCTA && !primaryLink) {
      primaryLink = { label: nav.label, href: nav.path };
    } else if (isCTA && !secondaryLink) {
      secondaryLink = { label: nav.label, href: nav.path };
      break;
    }
  }
  
  // Fallback: use first external link or first product URL
  if (!primaryLink) {
    const externalNav = site.navigation.find(n => n.external);
    if (externalNav) {
      primaryLink = { label: externalNav.label, href: externalNav.path };
    } else if (site.products.length > 0 && site.products[0].url) {
      primaryLink = { label: "Shop Now", href: site.products[0].url };
    }
  }
  
  if (!primaryLink) {
    return null;
  }
  
  return {
    type: "ctaStrip",
    headline: "Ready to Get Started?",
    subhead: "Explore our collection and find what you're looking for.",
    primaryLink,
    secondaryLink,
    role: "content",
  };
}

/**
 * Create schema metadata
 */
function createSchemaMeta(site: NormalizedSite, pages: SitePage[]): SchemaMeta {
  // Extract unique categories
  const categories = new Set<string>();
  site.products.forEach(p => {
    if (p.category) categories.add(p.category);
    if (p.brand) categories.add(p.brand);
  });
  site.navigation.forEach(n => {
    if (n.label && !n.external) categories.add(n.label);
  });
  
  return {
    generatedAt: new Date().toISOString(),
    domain: site.domain,
    rulesVersion: "1.0.0",
    stats: {
      pages: pages.length,
      products: site.products.length,
      images: site.media.length,
      categories: categories.size,
    },
  };
}

/**
 * Convert a section to a layout block
 */
function convertSectionToLayoutBlock(
  section: Section,
  site: NormalizedSite,
  context?: { isFirstHeading?: boolean; sectionIndex?: number }
): SiteLayout | null {
  // Check if this should be a product grid
  if (shouldBeProductGrid(section, site)) {
    return buildProductGridBlock(site);
  }
  
  switch (section.type) {
    case "heading":
      const headingText = section.content.trim();
      
      // Filter out short nav-style headings (Guitars, Amps, Parts, etc.)
      const isNavHeading = headingText.length < 30 && 
        (context?.sectionIndex || 0) < 10 && // Early in page
        /^(Guitars|Amps|Effects|Parts|Pickups|Accessories|Lifestyle|Discover|Your cart|Subtotal|Company|Resources|Support)$/i.test(headingText);
      
      if (isNavHeading) {
        // Skip nav headings - they're handled by NavBar component
        return null;
      }
      
      // First long heading → HERO
      if (context?.isFirstHeading && headingText.length > 20) {
        return {
          type: "hero",
          heading: headingText,
          role: "hero",
        };
      }
      
      // Remaining headings → H2/H3 blocks (rendered as text sections with heading styling)
      return {
        type: "text",
        body: headingText,
        role: "content",
      };
    
    case "text":
    case "html":
      return {
        type: "text",
        body: section.content,
        role: "content",
      };
    
    case "image":
      const imageUrl = section.content;
      if (typeof imageUrl === "string" && imageUrl) {
        return {
          type: "image",
          src: imageUrl,
          caption: section.metadata?.alt || section.metadata?.caption,
          role: "content",
        };
      }
      return null;
    
    case "list":
      const listItems = Array.isArray(section.content)
        ? section.content
        : (typeof section.content === "string"
          ? section.content.split("\n").filter(Boolean)
          : []);
      
      return {
        type: "list",
        items: listItems.map(item => 
          typeof item === "string" ? item : JSON.stringify(item)
        ),
        role: "content",
      };
    
    case "quote":
      // Quotes become text blocks
      return {
        type: "text",
        body: `"${section.content}"`,
        role: "content",
      };
    
    default:
      // Fallback to text
      return {
        type: "text",
        body: typeof section.content === "string" 
          ? section.content 
          : JSON.stringify(section.content),
        role: "content",
      };
  }
}

/**
 * Detect if a section should be a product grid
 * This checks if the content references products
 */
function shouldBeProductGrid(section: Section, site: NormalizedSite): boolean {
  if (!site.products || site.products.length === 0) {
    return false;
  }
  
  const content = typeof section.content === "string" 
    ? section.content.toLowerCase() 
    : JSON.stringify(section.content).toLowerCase();
  
  // Check if content mentions products or product-related terms
  const productKeywords = ["product", "shop", "buy", "item", "catalog", "featured", "collection"];
  const hasProductKeyword = productKeywords.some(keyword => content.includes(keyword));
  
  // Also check if content contains product IDs or names
  const hasProductReference = site.products.some(product => 
    content.includes(product.id.toLowerCase()) || 
    content.includes(product.name.toLowerCase())
  );
  
  return hasProductKeyword || hasProductReference;
}
