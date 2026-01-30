/**
 * Page Normalization Layer
 * 
 * Derives logical pages from sections using rules-based grouping.
 * This ensures consistent page structure even with imperfect scraped data.
 */

export interface DerivedPage {
  id: string;
  title: string;
  sectionIds: string[];
}

export interface Section {
  id?: string;
  type: string;
  title?: string;
  heading?: string;
  content?: any;
}

/**
 * Blocklist of tokens that should never become page titles
 */
const BAD_PAGE_TOKENS = [
  "visa",
  "mastercard",
  "american express",
  "paypal",
  "discover",
  "shop pay",
  "payment",
  "checkout",
  "cart",
];

/**
 * Check if a string contains any blocked tokens
 */
function containsBlockedToken(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BAD_PAGE_TOKENS.some(token => lowerText.includes(token));
}

/**
 * Extract page type from section title/id/content
 */
function detectPageType(section: Section): string | null {
  // Check section type first - productGrid always goes to products
  if (section.type === "productGrid") {
    return "products";
  }
  
  // Extract text from various sources
  const text = (
    section.title || 
    section.heading || 
    (typeof section.content === "string" ? section.content : "") ||
    section.id || 
    ""
  ).toLowerCase();
  
  if (containsBlockedToken(text)) {
    return null; // Block payment-related sections
  }
  
  // Product/shop pages - check for product-related keywords
  if (text.includes("product") || text.includes("shop") || text.includes("catalog") || 
      text.includes("store") || text.includes("buy") || text.includes("purchase")) {
    return "products";
  }
  
  // About pages
  if (text.includes("about") || text.includes("story") || text.includes("mission") || 
      text.includes("team") || text.includes("company")) {
    return "about";
  }
  
  // Contact pages
  if (text.includes("contact") || text.includes("quote") || text.includes("form") || 
      text.includes("reach") || text.includes("email") || text.includes("phone")) {
    return "contact";
  }
  
  return null;
}

/**
 * Derive pages from sections using rules-based grouping
 * 
 * Rules:
 * 1. Always create a "home" page as the first page
 * 2. First hero section → belongs to "home"
 * 3. Group sections by detected page type (products, about, contact)
 * 4. Otherwise → stays on "home"
 * 5. Only include a page if it has sections
 * 6. Never use blocked tokens as page titles
 */
export function derivePagesFromSections(sections: Section[]): DerivedPage[] {
  if (!sections || sections.length === 0) {
    // Always return at least a home page
    return [{ id: "home", title: "Home", sectionIds: [] }];
  }
  
  // Assign IDs to sections that don't have them
  const sectionsWithIds = sections.map((section, index) => ({
    ...section,
    id: section.id || `section-${index}`,
  }));
  
  // Find first hero section (belongs to home)
  const firstHeroIndex = sectionsWithIds.findIndex(s => s.type === "hero");
  
  // Group sections by page type
  const pageGroups: Record<string, string[]> = {
    home: [],
    products: [],
    about: [],
    contact: [],
  };
  
  // First, identify productGrid sections (they should go to products page)
  // Check if any sections will become productGrid (detected by content or if site has products)
  const productSectionIndices = new Set<number>();
  
  sectionsWithIds.forEach((section, index) => {
    // Check if this section looks like it will become a productGrid
    // Look for sections with product-related content or if type suggests products
    const contentText = typeof section.content === "string" 
      ? section.content.toLowerCase() 
      : "";
    
    // If section type is productGrid or content mentions products heavily
    if (section.type === "productGrid" || 
        (contentText.includes("product") && contentText.length < 200)) {
      productSectionIndices.add(index);
    }
  });
  
  sectionsWithIds.forEach((section, index) => {
    // First hero always goes to home
    if (index === firstHeroIndex) {
      pageGroups.home.push(section.id!);
      return;
    }
    
    // Product sections go to products page
    if (productSectionIndices.has(index)) {
      pageGroups.products.push(section.id!);
      return;
    }
    
    // Detect page type from section
    const pageType = detectPageType(section);
    
    if (pageType && pageType !== "home") {
      pageGroups[pageType].push(section.id!);
    } else {
      // Default to home
      pageGroups.home.push(section.id!);
    }
  });
  
  // Build pages array (only include pages with sections)
  const pages: DerivedPage[] = [];
  
  // Always add home page first
  if (pageGroups.home.length > 0) {
    pages.push({
      id: "home",
      title: "Home",
      sectionIds: pageGroups.home,
    });
  }
  
  // Add other pages if they have sections
  if (pageGroups.products.length > 0) {
    pages.push({
      id: "products",
      title: "Products",
      sectionIds: pageGroups.products,
    });
  }
  
  if (pageGroups.about.length > 0) {
    pages.push({
      id: "about",
      title: "About",
      sectionIds: pageGroups.about,
    });
  }
  
  if (pageGroups.contact.length > 0) {
    pages.push({
      id: "contact",
      title: "Contact",
      sectionIds: pageGroups.contact,
    });
  }
  
  // If no pages were created (shouldn't happen), create empty home
  if (pages.length === 0) {
    pages.push({
      id: "home",
      title: "Home",
      sectionIds: [],
    });
  }
  
  return pages;
}
