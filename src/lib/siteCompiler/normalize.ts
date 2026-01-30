/**
 * Site Data Normalizer
 * 
 * Merges raw export data into a unified CompiledSiteModel.
 * Uses heuristics to transform various data sources into page sections.
 */

import {
  CompiledSiteModel,
  PageModel,
  NavItem,
  ProductModel,
  ValueProp,
  BrandModel,
  HeroSection,
  ValueSection,
  ProductGridSection,
  ContentSection,
  CTASection,
  PageSection,
  ImageData,
  CTAButton,
} from "./types";
import {
  SiteSnapshot,
  ProductGraph,
  ResearchBundle,
  ValueModel,
  FinalReport,
} from "./loaders";

/**
 * Normalize all raw data into CompiledSiteModel
 */
export function normalizeSiteData(
  domain: string,
  snapshot: SiteSnapshot | null,
  products: ProductGraph | null,
  research: ResearchBundle | null,
  valueModel: ValueModel | null,
  report: FinalReport | null
): CompiledSiteModel {
  // Extract brand information
  const brand = extractBrand(domain, snapshot, report);

  // Extract navigation
  const navigation = extractNavigation(snapshot);

  // Extract products
  const productModels = extractProducts(products);

  // Extract value propositions
  const valueProps = extractValueProps(valueModel);

  // Build pages
  const pages = buildPages(domain, snapshot, productModels, valueProps, research);

  return {
    domain,
    pages,
    navigation,
    products: productModels,
    valueProps,
    brand,
    metadata: {
      compiledAt: new Date().toISOString(),
      sourceFiles: [
        "site.snapshot.json",
        "product.graph.json",
        "research.bundle.json",
        "value.model.json",
        "report.final.json",
      ],
    },
  };
}

/**
 * Extract brand information
 */
function extractBrand(
  domain: string,
  snapshot: SiteSnapshot | null,
  report: FinalReport | null
): BrandModel {
  const brandName = snapshot?.title || report?.domain || domain.split("-")[0];
  const cleanDomain = domain.replace(/-/g, ".");

  return {
    name: brandName,
    domain: cleanDomain,
    tagline: snapshot?.metadata?.description || report?.summary,
    description: report?.summary,
  };
}

/**
 * Extract navigation structure
 */
function extractNavigation(snapshot: SiteSnapshot | null): NavItem[] {
  if (!snapshot?.navigation && !snapshot?.links) {
    return [];
  }

  const navItems: NavItem[] = [];

  // Try to use structured navigation first
  if (Array.isArray(snapshot.navigation)) {
    return snapshot.navigation.map((item: any) => ({
      label: item.label || item.text || item.name || "Link",
      path: item.path || item.url || item.href || "#",
      external: item.external || (item.url && item.url.startsWith("http")),
      children: item.children
        ? item.children.map((child: any) => ({
            label: child.label || child.text || child.name || "Link",
            path: child.path || child.url || child.href || "#",
            external: child.external || (child.url && child.url.startsWith("http")),
          }))
        : undefined,
    }));
  }

  // Fallback to links
  if (Array.isArray(snapshot.links)) {
    const uniqueLinks = new Map<string, NavItem>();
    snapshot.links.forEach((link: any) => {
      const url = link.url || link.href || link.path || "#";
      const label = link.text || link.label || link.name || url;
      if (!uniqueLinks.has(url)) {
        uniqueLinks.set(url, {
          label,
          path: url,
          external: url.startsWith("http"),
        });
      }
    });
    return Array.from(uniqueLinks.values());
  }

  return navItems;
}

/**
 * Extract product models
 */
function extractProducts(products: ProductGraph | null): ProductModel[] {
  const graphProducts = products?.products;
  console.log("[TRACE extractProducts] incoming:", graphProducts?.length || 0);
  if (!graphProducts || !Array.isArray(graphProducts)) {
    console.log("[TRACE extractProducts] normalized: 0");
    return [];
  }

  const normalized = graphProducts.map((product: any) => ({
    id: product.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
    name: product.name || product.title || "Product",
    description: product.description || product.summary,
    category: product.category || product.type,
    brand: product.brand,
    price: product.price
      ? {
          amount: product.price.amount || 0,
          currency: product.price.currency || "USD",
          source: product.price.source,
        }
      : undefined,
    images: Array.isArray(product.images)
      ? product.images.map((img: any) => {
          // Fix URL encoding (replace &amp; with &)
          const imageUrl = (img.url || img.src || img).replace(/&amp;/g, "&");
          return {
            url: imageUrl,
            alt: img.alt || product.name || "Product image",
            sourceUrl: img.sourceUrl || product.url,
            width: img.width,
            height: img.height,
          };
        })
      : [],
      url: product.url || product.href,
      features: product.features || product.specifications ? Object.keys(product.specifications || {}) : undefined,
      specifications: product.specifications,
  }));
  console.log("[TRACE extractProducts] normalized:", normalized.length);
  return normalized;
}

/**
 * Extract value propositions
 */
function extractValueProps(valueModel: ValueModel | null): ValueProp[] {
  if (!valueModel?.rankedValueConclusions || !Array.isArray(valueModel.rankedValueConclusions)) {
    return [];
  }

  return valueModel.rankedValueConclusions.map((conclusion: any) => ({
    id: `value_${conclusion.dimensionId}_${conclusion.rank}`,
    dimensionId: conclusion.dimensionId || "unknown",
    rank: conclusion.rank || 0,
    statement: conclusion.valueImpactBlock?.statement || conclusion.statement || "",
    type: conclusion.valueImpactBlock?.type || "benefit",
    proof: conclusion.valueImpactBlock?.proof,
    magnitude: conclusion.valueImpactBlock?.magnitude,
    source: conclusion.valueImpactBlock?.source,
    supportingFacts: conclusion.supportingFacts,
  }));
}

/**
 * Build page structure
 */
function buildPages(
  domain: string,
  snapshot: SiteSnapshot | null,
  products: ProductModel[],
  valueProps: ValueProp[],
  research: ResearchBundle | null
): PageModel[] {
  const pages: PageModel[] = [];

  // Homepage
  const homepage: PageModel = {
    id: "home",
    path: "/",
    title: snapshot?.title || `${domain} Home`,
    sections: buildHomepageSections(snapshot, products, valueProps, research),
  };
  pages.push(homepage);

  // Product pages (if products exist)
  if (products.length > 0) {
    // Products listing page
    pages.push({
      id: "products",
      path: "/products",
      title: "Products",
      sections: [
        {
          type: "product-grid",
          title: "Our Products",
          products,
          columns: 3,
        } as ProductGridSection,
      ],
    });

    // Individual product pages
    products.forEach((product) => {
      pages.push({
        id: `product-${product.id}`,
        path: `/products/${product.id}`,
        title: product.name,
        sections: buildProductPageSections(product, valueProps),
      });
    });
  }

  return pages;
}

/**
 * Build homepage sections
 */
function buildHomepageSections(
  snapshot: SiteSnapshot | null,
  products: ProductModel[],
  valueProps: ValueProp[],
  research: ResearchBundle | null
): PageSection[] {
  const sections: PageSection[] = [];

  // Hero section - use actual site title and first hero image
  const heroImage = extractHeroImage(snapshot);
  const siteTitle = snapshot?.title || "Gibson";
  const siteDescription = snapshot?.metadata?.description || 
    "Since 1894, Gibson has been a leading innovator in musical instruments, crafting legendary guitars that have shaped the sound of music for generations.";
  
  sections.push({
    type: "hero",
    headline: siteTitle,
    subheadline: siteDescription,
    image: heroImage,
    cta: {
      label: "Shop Guitars",
      url: "https://www.gibson.com",
      variant: "primary",
      external: true,
    },
    backgroundImage: heroImage?.url,
  } as HeroSection);

  // Value propositions section
  if (valueProps.length > 0) {
    sections.push({
      type: "value",
      title: "Why Choose Us",
      valueProps: valueProps.slice(0, 6), // Top 6 value props
      layout: "grid",
    } as ValueSection);
  }

  // Featured products section - only show if we have real products (not just brand entity)
  console.log("[TRACE buildHomepageSections] products received:", products.length);
  const realProducts = products.filter(p => p.category !== "website" && p.name !== "Gibson");
  // If filtered array is empty, fall back to using the full products array
  const productsToShow = realProducts.length > 0 ? realProducts : products;
  console.log("[TRACE buildHomepageSections] after filter/fallback:", productsToShow.length);
  console.log("[TRACE buildHomepageSections] pushing product grid:", productsToShow.length > 0);
  if (productsToShow.length > 0) {
    sections.push({
      type: "product-grid",
      title: "Featured Products",
      products: productsToShow.slice(0, 6), // Top 6 products
      columns: 3,
    } as ProductGridSection);
  } else {
    console.log("[TRACE buildHomepageSections] NOT pushing product-grid section (productsToShow.length is 0)");
    if (snapshot?.images && snapshot.images.length > 0) {
    // If no products, create an image gallery section
    // Use the first 6-12 images in a grid
    const galleryImages = snapshot.images.slice(0, 12);
    sections.push({
      type: "product-grid",
      title: "Explore Gibson",
      products: galleryImages.map((img: any, idx: number) => {
        const imgUrl = (img.url || img.src || img).replace(/&amp;/g, "&");
        return {
          id: `img_${idx}`,
          name: img.alt || `Gibson Image ${idx + 1}`,
          description: "",
          images: [{
            url: imgUrl,
            alt: img.alt || "Gibson",
            sourceUrl: snapshot?.url,
          }],
          url: snapshot?.url,
        } as ProductModel;
      }),
      columns: 3,
    } as ProductGridSection);
    }
  }

  // Content section with value propositions or brand info
  if (valueProps.length > 0) {
    sections.push({
      type: "content",
      title: "Why Gibson",
      content: valueProps.slice(0, 3).map((vp) => ({
        type: "text" as const,
        content: vp.statement || "",
      })),
      layout: "single",
    } as ContentSection);
  } else if (siteDescription) {
    sections.push({
      type: "content",
      title: "About Gibson",
      content: [
        {
          type: "text" as const,
          content: siteDescription,
        },
      ],
      layout: "single",
    } as ContentSection);
  }

  // CTA section
  sections.push({
    type: "cta",
    headline: "Visit Gibson.com",
    description: "Explore our full collection of guitars, amplifiers, and accessories",
    primaryCTA: {
      label: "Shop Now",
      url: "https://www.gibson.com",
      variant: "primary",
      external: true,
    },
  } as CTASection);

  return sections;
}

/**
 * Build product page sections
 */
function buildProductPageSections(
  product: ProductModel,
  valueProps: ValueProp[]
): PageSection[] {
  const sections: PageSection[] = [];

  // Hero with product image
  if (product.images.length > 0) {
    sections.push({
      type: "hero",
      headline: product.name,
      subheadline: product.description,
      image: product.images[0],
      cta: product.url
        ? {
            label: "Learn More",
            url: product.url,
            variant: "primary",
            external: true,
          }
        : undefined,
    } as HeroSection);
  }

  // Product details content
  if (product.description || product.features) {
    const content: any[] = [];
    if (product.description) {
      content.push({
        type: "text",
        content: product.description,
      });
    }
    if (product.features && product.features.length > 0) {
      content.push({
        type: "list",
        content: product.features.join("\n"),
      });
    }
    sections.push({
      type: "content",
      content,
      layout: "single",
    } as ContentSection);
  }

  // Related value props
  if (valueProps.length > 0) {
    sections.push({
      type: "value",
      title: "Benefits",
      valueProps: valueProps.slice(0, 3),
      layout: "list",
    } as ValueSection);
  }

  return sections;
}

/**
 * Extract hero image from snapshot
 */
function extractHeroImage(snapshot: SiteSnapshot | null): ImageData | undefined {
  if (!snapshot?.images || !Array.isArray(snapshot.images)) {
    return undefined;
  }

  // Find the first large image (likely a hero)
  const heroImage = snapshot.images.find(
    (img: any) => img.width && img.width > 800
  ) || snapshot.images[0];

  if (!heroImage) {
    return undefined;
  }

  // Fix URL encoding (replace &amp; with &)
  const imageUrl = (heroImage.url || heroImage.src || heroImage).replace(/&amp;/g, "&");
  
  return {
    url: imageUrl,
    alt: heroImage.alt || snapshot.title || "Hero image",
    sourceUrl: heroImage.sourceUrl || snapshot.url,
    width: heroImage.width,
    height: heroImage.height,
  };
}
