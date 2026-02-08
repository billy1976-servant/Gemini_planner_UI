"use client";

import { CompiledSiteModel, PageSection, ProductGridSection, ProductModel, ImageData, NavItem } from "@/lib/siteCompiler/types";
import HeroSection from "./HeroSection";
import ValueSection from "./ValueSection";
import ProductGrid from "./ProductGrid";
import ContentSection from "./ContentSection";
import CTASection from "./CTASection";
import SiteLayout from "./SiteLayout";

interface SiteRendererProps {
  model: CompiledSiteModel;
  pagePath?: string;
}

/**
 * Slugify a string for URL generation
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
 * Normalize a single product: rewrite image URLs and product URL
 */
function normalizeProduct(product: ProductModel): ProductModel {
  return {
    ...product,
    images: product.images.map((img: ImageData) => ({
      ...img,
      url: normalizeImageUrl(img.url),
    })),
    url: product.url && product.url.startsWith('https://')
      ? `/product/${slugify(product.name)}`
      : product.url,
  };
}

/**
 * Normalize sections: map products into product-grid sections and normalize product data
 */
function normalizeSections(
  sections: PageSection[],
  allProducts: ProductModel[]
): PageSection[] {
  return sections.map((section) => {
    if (section.type === 'product-grid') {
      const productGridSection = section as ProductGridSection;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SiteRenderer.tsx:59',message:'normalizeSections processing product-grid',data:{sectionHasProducts:!!productGridSection.products,sectionProductsLength:productGridSection.products?.length||0,allProductsLength:allProducts.length,willUseSectionProducts:!!(productGridSection.products&&productGridSection.products.length>0),willUseAllProducts:!(productGridSection.products&&productGridSection.products.length>0)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // If section doesn't have products or products array is empty, inject model.products
      const products = productGridSection.products && productGridSection.products.length > 0
        ? productGridSection.products
        : allProducts;
      
      const normalized = {
        ...productGridSection,
        products: products.map(normalizeProduct),
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SiteRenderer.tsx:68',message:'normalizeSections after normalization',data:{normalizedProductsLength:normalized.products.length,firstProduct:normalized.products[0]?{id:normalized.products[0].id,name:normalized.products[0].name,imagesLength:normalized.products[0].images?.length||0}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return normalized;
    }
    return section;
  });
}

/**
 * Build navigation from categories if navigation is empty
 */
function normalizeNavigation(
  navigation: NavItem[],
  products: ProductModel[]
): NavItem[] {
  // If navigation already exists, return it
  if (navigation && navigation.length > 0) {
    return navigation;
  }

  // Build navigation from unique product categories
  const categoryMap = new Map<string, string>();
  products.forEach((product) => {
    if (product.category && product.category !== 'website') {
      if (!categoryMap.has(product.category)) {
        categoryMap.set(product.category, product.category);
      }
    }
  });

  // Convert categories to navigation items
  const navItems: NavItem[] = Array.from(categoryMap.entries()).map(([category]) => ({
    label: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
    path: `/category/${slugify(category)}`,
    external: false,
  }));

  return navItems;
}

/**
 * Normalize the entire compiled site model before rendering
 * This runs AFTER JSON loads but BEFORE SiteRenderer renders
 */
function normalizeCompiledSite(model: CompiledSiteModel): CompiledSiteModel {
  // Normalize products (rewrite URLs)
  const normalizedProducts = model.products.map(normalizeProduct);

  // Normalize navigation (build from categories if empty)
  const normalizedNavigation = normalizeNavigation(model.navigation, normalizedProducts);

  // Normalize pages (inject products into product-grid sections)
  const normalizedPages = model.pages.map((page) => {
    let sections = normalizeSections(page.sections, normalizedProducts);
    
    // If homepage has no product-grid section but products exist, inject one
    if (page.path === "/" && normalizedProducts.length > 0) {
      const hasProductGrid = sections.some(s => s.type === 'product-grid');
      if (!hasProductGrid) {
        sections.push({
          type: "product-grid",
          title: "Featured Products",
          products: normalizedProducts.slice(0, 6),
          columns: 3,
        } as ProductGridSection);
      }
    }
    
    return {
      ...page,
      sections,
    };
  });

  return {
    ...model,
    products: normalizedProducts,
    navigation: normalizedNavigation,
    pages: normalizedPages,
  };
}

export default function SiteRenderer({ model, pagePath = "/" }: SiteRendererProps) {
  // Normalize model BEFORE rendering
  const normalizedModel = normalizeCompiledSite(model);
  console.log("[SiteRenderer] Rendering site:", {
    domain: normalizedModel.domain,
    pagePath,
    totalPages: normalizedModel.pages?.length || 0,
    availablePaths: normalizedModel.pages?.map(p => p.path) || [],
  });

  const page = normalizedModel.pages.find((p) => p.path === pagePath) || normalizedModel.pages[0];

  if (!page) {
    console.warn("[SiteRenderer] Page not found:", pagePath, "Available pages:", normalizedModel.pages);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600">The requested page could not be found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Available pages: {normalizedModel.pages?.map(p => p.path).join(", ") || "none"}
          </p>
        </div>
      </div>
    );
  }

  console.log("[SiteRenderer] Rendering page:", {
    id: page.id,
    path: page.path,
    title: page.title,
    sections: page.sections?.length || 0,
  });

  if (!page.sections || page.sections.length === 0) {
    console.warn("[SiteRenderer] Page has no sections:", page);
    return (
      <SiteLayout model={normalizedModel} currentPath={pagePath}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{page.title}</h1>
            <p className="text-gray-600">This page has no content sections.</p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout model={normalizedModel} currentPath={pagePath}>
      <div className="min-h-screen">
        {page.sections.map((section, index) => {
          console.log(`[SiteRenderer] Rendering section ${index}:`, section.type);
          // #region agent log
          if (section.type && section.type.includes("product")) {
            fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SiteRenderer.tsx:186',message:'Full section object for product type',data:{sectionType:section.type,section:JSON.parse(JSON.stringify(section)),productsCount:(section as any).products?.length||0,productsShape:(section as any).products?.[0]?{hasId:!!(section as any).products[0].id,hasName:!!(section as any).products[0].name,hasImages:!!(section as any).products[0].images,imagesType:Array.isArray((section as any).products[0].images)?'array':'other',firstImageShape:(section as any).products[0].images?.[0]?{hasUrl:!!(section as any).products[0].images[0].url,hasAlt:!!(section as any).products[0].images[0].alt}:null}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          }
          // #endregion
          return <SectionRenderer key={index} section={section} />;
        })}
      </div>
    </SiteLayout>
  );
}

function SectionRenderer({ section }: { section: PageSection }) {
  // #region agent log
  if (section.type && section.type.includes("product")) {
    fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SiteRenderer.tsx:192',message:'SectionRenderer received product section',data:{sectionType:section.type,sectionTypeExact:section.type,hasProducts:(section as any).products!==undefined,productsIsArray:Array.isArray((section as any).products),productsLength:(section as any).products?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "value":
      return <ValueSection section={section} />;
    case "product-grid":
      return <ProductGrid section={section} />;
    case "content":
      return <ContentSection section={section} />;
    case "cta":
      return <CTASection section={section} />;
    default:
      return null;
  }
}
