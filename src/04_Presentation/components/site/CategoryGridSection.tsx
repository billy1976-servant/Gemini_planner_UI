/**
 * CategoryGridSection
 * 
 * Renders ONLY category tiles - no wrappers, no layout styles.
 * Layout is controlled by the outer wrapper in renderFromSchema.tsx
 */

"use client";

import React from "react";
import Link from "next/link";
import { CategoryItem } from "@/lib/site-schema/siteLayout.types";
import { NormalizedSite } from "@/lib/site-compiler/normalizeSiteData";
import { RuntimeHelpers, Action } from "@/types/siteSchema";
import { handleAction } from "@/lib/site-renderer/renderFromSchema";

interface CategoryGridSectionProps {
  title?: string;
  categories: CategoryItem[];
  siteData: NormalizedSite;
  className?: string;
  helpers?: RuntimeHelpers;
}

/**
 * Get the first product image for a category
 */
function getCategoryImage(category: CategoryItem, siteData: NormalizedSite): string | undefined {
  if (category.image) {
    return category.image;
  }
  
  const categoryPath = category.href.replace(/^\//, "");
  const productsInCategory = siteData.products.filter(product => {
    if (!product.category) return false;
    return product.category === categoryPath || 
           product.category.startsWith(categoryPath + "/") ||
           product.category.endsWith("/" + categoryPath);
  });
  
  if (productsInCategory.length > 0 && productsInCategory[0].images && productsInCategory[0].images.length > 0) {
    return productsInCategory[0].images[0];
  }
  
  return undefined;
}

export default function CategoryGridSection({
  title,
  categories,
  siteData,
  className = "",
  helpers,
}: CategoryGridSectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <>
      {title && (
        <h2 style={{
          fontSize: "var(--font-size-3xl)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-12)",
          textAlign: "center",
          color: "var(--color-text-primary)",
        }}>
          {title}
        </h2>
      )}
      {categories.map((category, index) => {
        const categoryImage = getCategoryImage(category, siteData);
        const isExternal = category.href.startsWith("http");
        const tileContent = (
          <>
            <div
              className="category-tile-image"
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                backgroundColor: "var(--color-surface-variant)",
                backgroundImage: categoryImage ? `url(${categoryImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {!categoryImage && (
                <div style={{
                  fontSize: "var(--font-size-4xl)",
                  color: "var(--color-text-muted)",
                  opacity: 0.3,
                }}>
                  {category.label.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div
              className="category-tile-label"
              style={{
                padding: "var(--spacing-6)",
                textAlign: "center",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h3 style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text-primary)",
                margin: 0,
              }}>
                {category.label}
              </h3>
            </div>
          </>
        );
        
        return (
          <div
            key={category.href || index}
            className="category-tile"
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-sm)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            {(() => {
              // Check if category has actions from schema
              const actions = (category as any).actions as Action[] | undefined;
              
              // Convert href to action for backward compatibility if no actions exist
              const action: Action = actions && actions.length > 0
                ? actions[0] // Use first action if available
                : isExternal
                ? { type: "OPEN_URL", url: category.href }
                : { type: "NAVIGATE_PAGE", path: category.href };
              
              // Handle external URLs
              if (action.type === "OPEN_URL") {
                return (
                  <a
                    href={action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      textDecoration: "none",
                      color: "inherit",
                      width: "100%",
                    }}
                  >
                    {tileContent}
                  </a>
                );
              }
              
              // Handle internal navigation using action handler
              if (helpers && action.type === "NAVIGATE_PAGE") {
                return (
                  <div
                    onClick={() => handleAction(action, helpers)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      textDecoration: "none",
                      color: "inherit",
                      width: "100%",
                    }}
                  >
                    {tileContent}
                  </div>
                );
              }
              
              // Fallback to Next.js Link if no helpers available
              return (
                <Link
                  href={category.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textDecoration: "none",
                    color: "inherit",
                    width: "100%",
                  }}
                >
                  {tileContent}
                </Link>
              );
            })()}
          </div>
        );
      })}
    </>
  );
}
