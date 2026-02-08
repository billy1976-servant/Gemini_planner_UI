/**
 * Navigation-Driven Page Derivation
 * 
 * Derives logical pages from site navigation, ensuring real page structure
 * instead of random scraped text like "American Express".
 */

import fs from "fs";
import path from "path";

const DEBUG_LOG_PATH = path.join(process.cwd(), ".cursor", "debug.log");

export interface NavItem {
  label: string;
  href?: string;
  path?: string; // Support both href and path (normalizeSiteData uses path)
}

export interface Section {
  id?: string;
  type: string;
  title?: string;
  heading?: string;
  content?: any;
}

export interface DerivedPage {
  id: string;
  title: string;
  slug: string;
  sectionIds: string[];
  source?: "navigation" | "products" | "category";
}

export interface DerivePagesOptions {
  products?: Array<{ id: string; name: string; category?: string }>;
  productCategories?: string[];
  contentGroups?: Array<{ id: string; title: string; slug?: string }>;
}

/**
 * Payment tokens that should never become page names or be used for navigation
 */
const PAYMENT_TOKENS = [
  "amex",
  "american express",
  "visa",
  "mastercard",
  "discover",
  "shop pay",
  "apple pay",
  "google pay",
  "gpay",
  "paypal",
  "klarna",
  "affirm",
  "payment",
  "checkout",
  "cart",
];

/**
 * Check if text contains payment tokens
 */
function containsPaymentToken(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PAYMENT_TOKENS.some(token => lowerText.includes(token));
}

/**
 * Canonicalize href into slug
 * - "/" stays "/"
 * - Strip domain
 * - Strip query/hash
 * - Ensure leading slash
 */
function canonicalizeSlug(href: string): string {
  if (!href) return "/";
  
  // Remove domain if present
  let slug = href.replace(/^https?:\/\/[^\/]+/, "");
  
  // Remove query and hash
  slug = slug.split("?")[0].split("#")[0];
  
  // Ensure leading slash
  if (!slug.startsWith("/")) {
    slug = "/" + slug;
  }
  
  // Normalize to single slash for home
  if (slug === "/") {
    return "/";
  }
  
  // Remove trailing slash (except for root)
  slug = slug.replace(/\/$/, "");
  
  return slug;
}

/**
 * Convert slug to page ID
 */
function slugToPageId(slug: string): string {
  if (slug === "/") return "home";
  return slug.replace(/^\//, "").replace(/\//g, "-");
}

/**
 * Detect page type from slug or label
 * ✅ FIX: Prioritize slug detection since labels may be wrong (payment icons)
 */
function detectPageType(slug: string, label: string): string | null {
  const slugLower = slug.toLowerCase();
  const labelLower = label.toLowerCase();
  
  // ✅ FIX: Only check label if it's NOT a payment token
  // If label is payment token, rely entirely on slug
  const labelIsPaymentToken = containsPaymentToken(label);
  const useLabel = !labelIsPaymentToken;
  
  // Products/Shop - check slug first
  if (slugLower.includes("/product") || slugLower.includes("/shop") || 
      slugLower.includes("/store") || slugLower.includes("/catalog") ||
      slugLower.includes("/collections/")) {
    return "products";
  }
  if (useLabel && (labelLower.includes("product") || labelLower.includes("shop") ||
      labelLower.includes("store"))) {
    return "products";
  }
  
  // FAQ - check slug first (e.g., /pages/faq)
  if (slugLower.includes("/faq") || slugLower.includes("/frequently") ||
      slugLower.includes("/pages/faq")) {
    return "faq";
  }
  if (useLabel && (labelLower.includes("faq") || labelLower.includes("question"))) {
    return "faq";
  }
  
  // Installation - check slug first (e.g., /pages/roof-vent-skylight-installation)
  if (slugLower.includes("/install") || slugLower.includes("/guide") ||
      slugLower.includes("installation")) {
    return "installation";
  }
  if (useLabel && (labelLower.includes("install") || labelLower.includes("guide") ||
      labelLower.includes("how to"))) {
    return "installation";
  }
  
  // Blog - check slug first (e.g., /blogs/news)
  if (slugLower.includes("/blog") || slugLower.includes("/news") ||
      slugLower.startsWith("/blogs/")) {
    return "blog";
  }
  if (useLabel && (labelLower.includes("blog") || labelLower.includes("news"))) {
    return "blog";
  }
  
  // Contact - check slug first (e.g., /pages/contact-us)
  if (slugLower.includes("/contact") || slugLower.includes("/reach") ||
      slugLower.includes("contact-us")) {
    return "contact";
  }
  if (useLabel && (labelLower.includes("contact") || labelLower.includes("reach"))) {
    return "contact";
  }
  
  // About - check slug first
  if (slugLower.includes("/about") || slugLower.includes("/story")) {
    return "about";
  }
  if (useLabel && (labelLower.includes("about") || labelLower.includes("story") ||
      labelLower.includes("mission"))) {
    return "about";
  }
  
  return null;
}

/**
 * Derive pages from navigation, products, categories, and content groups
 * 
 * Rules:
 * - Home must always exist and be first
 * - Ignore nav items with payment tokens
 * - Create pages for Products, FAQ, Installation, Blog, Contact, About if in nav
 * - Create pages from distinct product categories
 * - Create pages from product collections
 * - Create pages from top-level content groups
 * - Fall back to heuristic if nav is missing/sparse
 */
export function derivePagesFromNav(
  navigation: NavItem[],
  sections: Section[],
  options?: DerivePagesOptions
): DerivedPage[] {
  // #region agent log
  try { fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({location:'derivePagesFromNav.ts:170',message:'derivePagesFromNav entry',data:{navigationCount:navigation?.length||0,navigationItems:navigation?.map(n=>({label:n.label,href:(n as any).href,path:(n as any).path}))||[],sectionsCount:sections?.length||0,hasProducts:!!options?.products,productsCount:options?.products?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'}) + '\n'); } catch {}
  // #endregion
  
  const pages: DerivedPage[] = [];
  const pageMap = new Map<string, DerivedPage>();

  // STEP 2 — Navigation is the source of truth for pages when present
  if (navigation && navigation.length > 0) {
    const navPages: DerivedPage[] = navigation
      .filter((nav) => {
        const path = (nav as any).path || (nav as any).href || "";
        const slug = path ? canonicalizeSlug(path) : "/";
        const label = (nav as any).title || nav.label || "";
        const labelIsPaymentToken = containsPaymentToken(label);
        const slugIsPaymentToken = containsPaymentToken(slug);
        if (labelIsPaymentToken && !slugIsPaymentToken && (slug.includes("/pages/") || slug.includes("/blogs/") || slug.includes("contact") || slug.includes("faq") || slug.includes("install"))) return true;
        if (labelIsPaymentToken || slugIsPaymentToken) return false;
        return true;
      })
      .map((nav) => {
        const path = (nav as any).path || (nav as any).href || "";
        const slug = path ? canonicalizeSlug(path) : "/";
        const id = slug === "/" ? "home" : slug.replace(/^\//, "").replace(/\//g, "-");
        const label = (nav as any).title || nav.label || "";
        let title = label.trim();
        if (containsPaymentToken(title) || title === "American Express" || !title) {
          const pageType = detectPageType(slug, label);
          title = id === "home" ? "Home" : (pageType ? pageType.charAt(0).toUpperCase() + pageType.slice(1) : id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
        }
        return {
          id,
          title,
          slug: slug || "/",
          sectionIds: [],
          source: "navigation" as const,
        };
      });
    navPages.forEach((p) => {
      if (!pageMap.has(p.slug)) {
        pages.push(p);
        pageMap.set(p.slug, p);
      }
    });
    // Always ensure home exists when we have nav
    if (!pageMap.has("/")) {
      const home: DerivedPage = { id: "home", title: "Home", slug: "/", sectionIds: [], source: "navigation" };
      pages.unshift(home);
      pageMap.set("/", home);
    }
  } else {
    // No nav: home only, then legacy forEach below is skipped
    const homePage: DerivedPage = {
      id: "home",
      title: "Home",
      slug: "/",
      sectionIds: [],
    };
    pages.push(homePage);
    pageMap.set("/", homePage);
  }

  // Process navigation items (only when we did NOT use nav-first above — i.e. when nav was empty we already did home)
  const usedNavFirst = navigation && navigation.length > 0;
  if (!usedNavFirst && navigation && navigation.length > 0) {
    // ✅ STEP 1: Log navigation items for debugging
    console.log("[Compiler] Navigation Pages - Processing navigation items:", navigation.map(n => ({
      label: n.label,
      href: n.href,
      path: (n as any).path
    })));
    
    navigation.forEach(navItem => {
      // Support both href and path properties
      const navPath = (navItem as any).path || navItem.href || "";
      const slug = canonicalizeSlug(navPath);
      const pageId = slugToPageId(slug);
      
      // ✅ FIX: Skip payment-related items by checking BOTH label AND slug
      // If label is payment token but slug is a real page path, use slug-based detection
      const labelIsPaymentToken = containsPaymentToken(navItem.label);
      const slugIsPaymentToken = containsPaymentToken(slug);
      
      // If label is payment token but slug looks like a real page, ignore label and use slug
      if (labelIsPaymentToken && !slugIsPaymentToken && (slug.includes("/pages/") || slug.includes("/blogs/") || slug.includes("/contact") || slug.includes("/faq") || slug.includes("/install"))) {
        // Label is wrong (payment icon), but slug is valid - process it using slug only
        // #region agent log
        try { fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({location:'derivePagesFromNav.ts:237',message:'derivePagesFromNav: ignoring payment token label, using slug',data:{label:navItem.label,slug,pageId,willProcess:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'}) + '\n'); } catch {}
        // #endregion
      } else if (labelIsPaymentToken || slugIsPaymentToken) {
        // Both are payment-related, skip
        // #region agent log
        try { fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({location:'derivePagesFromNav.ts:243',message:'derivePagesFromNav: skipping payment token item',data:{label:navItem.label,slug,labelIsPaymentToken,slugIsPaymentToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'}) + '\n'); } catch {}
        // #endregion
        return;
      }
      
      // Skip if already processed (duplicate)
      if (pageMap.has(slug)) {
        return;
      }
      
      // Skip home (already added)
      if (slug === "/") {
        return;
      }
      
      // ✅ FIX: Detect page type from SLUG primarily (label may be wrong)
      // Use slug for detection, fallback to label only if slug doesn't match
      const pageType = detectPageType(slug, navItem.label);
      
      // #region agent log
      try { fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({location:'derivePagesFromNav.ts:259',message:'derivePagesFromNav: detected page type',data:{slug,label:navItem.label,pageType,pageId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'}) + '\n'); } catch {}
      // #endregion
      
      // ✅ FIX: Determine title - prefer pageType or slug-based title over potentially wrong label
      let title = navItem.label.trim();
      
      // If label is a payment token or generic, ignore it and generate from slug/pageType
      if (containsPaymentToken(title) || title === "American Express" || !title || title.length === 0) {
        // Generate title from pageType first, then slug
        if (pageType) {
          title = pageType.charAt(0).toUpperCase() + pageType.slice(1);
        } else {
          // Generate title from slug
          title = pageId
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }
      
      // Use page type for title if detected (override any label)
      if (pageType) {
        title = pageType.charAt(0).toUpperCase() + pageType.slice(1);
      }
      
      // Create page
      const page: DerivedPage = {
        id: pageId,
        title: title,
        slug: slug,
        sectionIds: [],
      };
      
      pages.push(page);
      pageMap.set(slug, page);
      
      // ✅ STEP 1: Log each navigation page created
      console.log("[Compiler] Navigation Pages - Created page from nav:", {
        id: pageId,
        title: title,
        slug: slug,
        source: "navigation",
        detectedType: pageType || "content"
      });
      
      // #region agent log
      try { fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({location:'derivePagesFromNav.ts:298',message:'derivePagesFromNav: created page from nav',data:{pageId,title,slug,pageType:pageType||'content',navLabel:navItem.label,navPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'}) + '\n'); } catch {}
      // #endregion
    });
  }
  
  // ✅ STEP 1: Log all navigation-derived pages
  console.log("[Compiler] Navigation Pages:", pages.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    source: "navigation"
  })));
  
  // ✅ ENHANCEMENT: Create pages from distinct product categories
  if (options?.products && options.products.length > 0) {
    const categoryMap = new Map<string, number>();
    options.products.forEach(product => {
      if (product.category && product.category !== "website") {
        const count = categoryMap.get(product.category) || 0;
        categoryMap.set(product.category, count + 1);
      }
    });
    
    // Create pages for categories with multiple products
    categoryMap.forEach((count, category) => {
      if (count >= 2) { // Only create page if category has at least 2 products
        const categorySlug = `/category/${category.toLowerCase().replace(/\s+/g, "-")}`;
        if (!pageMap.has(categorySlug)) {
          const pageId = slugToPageId(categorySlug);
          const page: DerivedPage = {
            id: pageId,
            title: category,
            slug: categorySlug,
            sectionIds: [],
            source: "category",
          };
          pages.push(page);
          pageMap.set(categorySlug, page);
        }
      }
    });
  }
  
  // ✅ ENHANCEMENT: Create pages from explicit product categories list (STEP 4 — tag source)
  if (options?.productCategories && options.productCategories.length > 0) {
    options.productCategories.forEach(category => {
      if (category && !containsPaymentToken(category)) {
        const categorySlug = `/category/${category.toLowerCase().replace(/\s+/g, "-")}`;
        if (!pageMap.has(categorySlug)) {
          const pageId = slugToPageId(categorySlug);
          const page: DerivedPage = {
            id: pageId,
            title: category,
            slug: categorySlug,
            sectionIds: [],
            source: "category",
          };
          pages.push(page);
          pageMap.set(categorySlug, page);
        }
      }
    });
  }
  
  // ✅ ENHANCEMENT: Create pages from content groups
  if (options?.contentGroups && options.contentGroups.length > 0) {
    options.contentGroups.forEach(group => {
      if (group.title && !containsPaymentToken(group.title)) {
        const slug = group.slug || `/${group.id.toLowerCase().replace(/\s+/g, "-")}`;
        const canonicalSlug = canonicalizeSlug(slug);
        if (!pageMap.has(canonicalSlug)) {
          const pageId = slugToPageId(canonicalSlug);
          pages.push({
            id: pageId,
            title: group.title,
            slug: canonicalSlug,
            sectionIds: [],
          });
          pageMap.set(canonicalSlug, pages[pages.length - 1]);
        }
      }
    });
  }
  
  // ✅ ENHANCEMENT: If nav is sparse or missing, use heuristic fallback
  // Also ensure Products page exists if we have products
  if (options?.products && options.products.length > 0 && !pageMap.has("/products")) {
    const productsPage: DerivedPage = {
      id: "products",
      title: "Products",
      slug: "/products",
      sectionIds: [],
      source: "products",
    };
    pages.push(productsPage);
    pageMap.set("/products", productsPage);
    
    // ✅ STEP 1: Log product page creation
    console.log("[Compiler] Product Pages - Created Products page:", {
      id: "products",
      title: "Products",
      slug: "/products",
      source: "products",
      productCount: options.products.length
    });
  }
  
  // ✅ STEP 1: Log all product-derived pages
  const productPages = pages.filter(p => p.id === "products" || p.slug.startsWith("/category/"));
  console.log("[Compiler] Product Pages:", productPages.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    source: "products"
  })));
  
  // Additional heuristic fallback if still only one page
  if (pages.length <= 1 && sections.length > 0) {
    // Check for product-related sections
    const hasProductSections = sections.some(s => 
      s.type === "productGrid" ||
      (typeof s.content === "string" && s.content.toLowerCase().includes("product"))
    );
    
    if (hasProductSections && !pageMap.has("/products")) {
      const productsPage: DerivedPage = {
        id: "products",
        title: "Products",
        slug: "/products",
        sectionIds: [],
        source: "products",
      };
      pages.push(productsPage);
      pageMap.set("/products", productsPage);
    }
  }
  
  // STEP 2 — Strict section assignment: section may only appear on page.slug === section.sourceSlug
  // No guessing, no type detection, no fallback matching
  sections.forEach((section, index) => {
    const sectionId = section.id || `section-${index}`;
    const sourceSlug = (section as any).sourceSlug;
    
    // Only assign if sourceSlug matches a page's slug
    if (sourceSlug) {
      const targetPage = pageMap.get(sourceSlug) ?? pages.find(p => p.slug === sourceSlug);
      if (targetPage) {
        targetPage.sectionIds.push(sectionId);
      }
    }
    // If section has no sourceSlug, it's orphaned and not assigned to any page
  });
  
  // ✅ ENHANCEMENT: Ensure we have multiple pages when nav or products exist
  // Only filter out pages with no sections if we have enough pages
  // If we have nav or products, keep pages even if they don't have sections yet (sections will be assigned later)
  const hasNavOrProducts = (navigation && navigation.length > 0) || 
                           (options?.products && options.products.length > 0);
  
  // ✅ STEP 1: Log final pages before filtering
  console.log("[Compiler] Final Pages (before filtering):", pages.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    sectionCount: p.sectionIds.length
  })));
  
  let finalPages: DerivedPage[];
  if (hasNavOrProducts && pages.length > 1) {
    // Keep all pages when we have nav/products (sections will be assigned in normalization layer)
    finalPages = pages;
  } else {
    // Otherwise, filter out pages with no sections (except home)
    finalPages = pages.filter(p => p.id === "home" || p.sectionIds.length > 0);
  }
  
  // ✅ STEP 1: Log final pages after filtering
  console.log("[Compiler] Final Pages:", finalPages.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    source: p.id === "products" || p.slug.startsWith("/category/") ? "products" : "navigation"
  })));
  
  // #region agent log
  try { fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({location:'derivePagesFromNav.ts:407',message:'derivePagesFromNav: returning final pages',data:{finalPagesCount:finalPages.length,finalPages:finalPages.map(p=>({id:p.id,title:p.title,slug:p.slug}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'}) + '\n'); } catch {}
  // #endregion
  
  return finalPages;
}
