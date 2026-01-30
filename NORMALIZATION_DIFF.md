# Normalization Layer Diff

## Changes to `src/components/siteRenderer/SiteRenderer.tsx`

```diff
"use client";

import { CompiledSiteModel, PageSection, ProductGridSection, ProductModel, ImageData } from "@/lib/siteCompiler/types";
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

+/**
+ * Slugify a product name for URL generation
+ */
+function slugify(text: string): string {
+  return text
+    .toLowerCase()
+    .trim()
+    .replace(/[^\w\s-]/g, '') // Remove special characters
+    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
+    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
+}
+
+/**
+ * Extract filename from image URL
+ */
+function extractFilename(url: string): string {
+  try {
+    const urlObj = new URL(url);
+    const pathname = urlObj.pathname;
+    const filename = pathname.split('/').pop() || 'image.jpg';
+    // Remove query parameters from filename
+    return filename.split('?')[0];
+  } catch {
+    // If URL parsing fails, try to extract filename from string
+    const match = url.match(/\/([^\/\?]+)(?:\?|$)/);
+    return match ? match[1] : 'image.jpg';
+  }
+}
+
+/**
+ * Normalize product image URLs: rewrite https:// URLs to local asset paths
+ */
+function normalizeImageUrl(url: string): string {
+  if (url.startsWith('https://')) {
+    const filename = extractFilename(url);
+    return `/generated-websites/gibson/assets/${filename}`;
+  }
+  return url;
+}
+
+/**
+ * Normalize a single product: rewrite image URLs and product URL
+ */
+function normalizeProduct(product: ProductModel): ProductModel {
+  return {
+    ...product,
+    images: product.images.map((img: ImageData) => ({
+      ...img,
+      url: normalizeImageUrl(img.url),
+    })),
+    url: product.url && product.url.startsWith('https://')
+      ? `/product/${slugify(product.name)}`
+      : product.url,
+  };
+}
+
+/**
+ * Normalize sections: map products into product-grid sections and normalize product data
+ */
+function normalizeSections(
+  sections: PageSection[],
+  allProducts: ProductModel[]
+): PageSection[] {
+  return sections.map((section) => {
+    if (section.type === 'product-grid') {
+      const productGridSection = section as ProductGridSection;
+      // If section doesn't have products, copy from model.products
+      const products = productGridSection.products && productGridSection.products.length > 0
+        ? productGridSection.products
+        : allProducts;
+      
+      return {
+        ...productGridSection,
+        products: products.map(normalizeProduct),
+      };
+    }
+    return section;
+  });
+}
+
+/**
+ * Normalize the entire site model before rendering
+ */
+function normalizeSiteModel(model: CompiledSiteModel): CompiledSiteModel {
+  return {
+    ...model,
+    pages: model.pages.map((page) => ({
+      ...page,
+      sections: normalizeSections(page.sections, model.products),
+    })),
+    // Also normalize products at the top level
+    products: model.products.map(normalizeProduct),
+  };
+}

export default function SiteRenderer({ model, pagePath = "/" }: SiteRendererProps) {
+  // Normalize model before rendering
+  const normalizedModel = normalizeSiteModel(model);
+
  console.log("[SiteRenderer] Rendering site:", {
-    domain: model.domain,
+    domain: normalizedModel.domain,
    pagePath,
-    totalPages: model.pages?.length || 0,
-    availablePaths: model.pages?.map(p => p.path) || [],
+    totalPages: normalizedModel.pages?.length || 0,
+    availablePaths: normalizedModel.pages?.map(p => p.path) || [],
  });

-  const page = model.pages.find((p) => p.path === pagePath) || model.pages[0];
+  const page = normalizedModel.pages.find((p) => p.path === pagePath) || normalizedModel.pages[0];

  if (!page) {
-    console.warn("[SiteRenderer] Page not found:", pagePath, "Available pages:", model.pages);
+    console.warn("[SiteRenderer] Page not found:", pagePath, "Available pages:", normalizedModel.pages);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600">The requested page could not be found.</p>
          <p className="text-sm text-gray-500 mt-2">
-            Available pages: {model.pages?.map(p => p.path).join(", ") || "none"}
+            Available pages: {normalizedModel.pages?.map(p => p.path).join(", ") || "none"}
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
-      <SiteLayout model={model} currentPath={pagePath}>
+      <SiteLayout model={normalizedModel} currentPath={pagePath}>
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
-    <SiteLayout model={model} currentPath={pagePath}>
+    <SiteLayout model={normalizedModel} currentPath={pagePath}>
      <div className="min-h-screen">
        {page.sections.map((section, index) => {
          console.log(`[SiteRenderer] Rendering section ${index}:`, section.type);
          return <SectionRenderer key={index} section={section} />;
        })}
      </div>
    </SiteLayout>
  );
}

function SectionRenderer({ section }: { section: PageSection }) {
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
```

## Summary

This normalization layer:

1. **Maps products into product-grid sections**: If a `product-grid` section doesn't have products, it copies `model.products` into that section.

2. **Rewrites image URLs**: 
   - Converts `https://www.gibson.com/cdn/shop/files/image.jpg` → `/generated-websites/gibson/assets/image.jpg`
   - Extracts filename from URL and maps to local asset path

3. **Rewrites product URLs**:
   - Converts `https://gibson.com/products/...` → `/product/gibson-custom-western-floral-explorer`
   - Uses slugified product name for clean URLs

4. **Preserves engine logic**: All normalization happens before rendering, so no changes to component logic or schema structure.
